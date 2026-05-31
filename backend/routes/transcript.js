/**
 * Transcript Routes - Supadata-powered video transcript API
 * Endpoints:
 *   POST /api/transcript/url    - transcribe from public video URL
 *   POST /api/transcript/upload - transcribe from uploaded file
 */

import express from "express";
import multer from "multer";
import crypto from "crypto";
import axios from "axios";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { spawn } from "child_process";
import jwt from "jsonwebtoken";
import UserSubscription from "../models/UserSubscription.js";
import User from "../models/User.js";
import { config } from "../config/index.js";
import googleAIService from "../services/googleAI.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────
const SUPADATA_API_KEY = process.env.SUPADATA_API_KEY || "";
const SUPADATA_BASE = "https://api.supadata.ai/v1";
const RATE_LIMIT_PER_DAY = parseInt(process.env.TRANSCRIPT_RATE_LIMIT_PER_DAY || "5", 10);
const MAX_UPLOAD_MB = parseInt(process.env.MAX_UPLOAD_SIZE_MB || "100", 10);
const CACHE_MAX_ENTRIES = 500;

// ─────────────────────────────────────────────
// In-Memory Cache  (url+lang → transcript)
// ─────────────────────────────────────────────
const transcriptCache = new Map();

function getCacheKey(url, lang) {
  return crypto.createHash("sha256").update(`${url}|${lang || "auto"}`).digest("hex");
}

function addToCache(key, value) {
  if (transcriptCache.size >= CACHE_MAX_ENTRIES) {
    // Evict oldest entry
    const firstKey = transcriptCache.keys().next().value;
    transcriptCache.delete(firstKey);
  }
  transcriptCache.set(key, { value, cachedAt: Date.now() });
}

// ─────────────────────────────────────────────
// Per-IP Rate Limiter  (3–5 transcripts/day)
// ─────────────────────────────────────────────
const ipUsageMap = new Map(); // { ip: { date: "YYYY-MM-DD", count: N } }

function getIpUsage(ip) {
  const today = new Date().toISOString().slice(0, 10);
  const entry = ipUsageMap.get(ip);
  if (!entry || entry.date !== today) {
    return { date: today, count: 0 };
  }
  return entry;
}

function checkAndIncrementRateLimit(ip, limit = RATE_LIMIT_PER_DAY) {
  const usage = getIpUsage(ip);
  if (usage.count >= limit) {
    return false;
  }
  usage.count++;
  ipUsageMap.set(ip, usage);
  return true;
}

// Optional Auth Helper
async function getAuthenticatedUser(req) {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) return null;

    const decoded = jwt.verify(token, config.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) return null;

    const subscription = await UserSubscription.findOne({ userId: user._id });
    return { user, subscription };
  } catch (err) {
    return null;
  }
}

// ─────────────────────────────────────────────
// Multer - for file uploads (max 100MB)
// ─────────────────────────────────────────────
const uploadDir = path.join(__dirname, "..", "data", "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => {
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const ext = path.extname(file.originalname) || ".mp4";
    cb(null, `${unique}${ext}`);
  },
});

const ALLOWED_MIMES = [
  "video/mp4", "video/quicktime", "video/webm",
  "video/x-msvideo", "video/x-matroska", "video/mpeg",
  "video/ogg", "video/3gpp", "video/3gpp2",
];

const upload = multer({
  storage,
  limits: { fileSize: MAX_UPLOAD_MB * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    if (ALLOWED_MIMES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}. Accepted formats: MP4, MOV, WEBM, AVI, MKV, MPEG.`));
    }
  },
});

// ─────────────────────────────────────────────
// Supadata API call helper
// ─────────────────────────────────────────────
async function fetchTranscriptFromSupadata(url, lang) {
  if (!SUPADATA_API_KEY) {
    throw new Error("SUPADATA_API_KEY is not configured on the server.");
  }

  const params = new URLSearchParams({ url });
  if (lang && lang !== "auto") params.append("lang", lang);

  const response = await axios.get(`${SUPADATA_BASE}/transcript?${params.toString()}`, {
    headers: {
      "x-api-key": SUPADATA_API_KEY,
      "Accept": "application/json",
    },
    timeout: 120_000, // 2 minutes - video transcription can be slow
    validateStatus: null, // Handle all status codes manually
  });

  const status = response.status;
  const data = response.data;

  if (status === 200) {
    // Extract transcript text from Supadata response
    let transcriptText = "";
    
    if (typeof data === "string") {
      transcriptText = data;
    } else if (data && data.content) {
      // content can be array of segments or a string
      if (Array.isArray(data.content)) {
        transcriptText = data.content.map((seg) => seg.text || seg).join(" ");
      } else {
        transcriptText = String(data.content);
      }
    } else if (data && data.transcript) {
      transcriptText = data.transcript;
    } else if (data && data.text) {
      transcriptText = data.text;
    } else if (data) {
      // fallback - stringify whatever we got
      transcriptText = JSON.stringify(data);
    }

    // Detect language from response if available
    const detectedLang = data?.lang || data?.language || lang || "auto";

    return {
      transcript: transcriptText.trim(),
      language: detectedLang,
      durationSeconds: data?.durationSeconds || data?.duration || null,
      partial: !transcriptText || transcriptText.trim().length < 10,
    };
  }

  if (status === 401 || status === 403) {
    throw Object.assign(new Error("Invalid or missing Supadata API key."), { code: "AUTH_ERROR" });
  }

  if (status === 402 || status === 429) {
    throw Object.assign(new Error("Free transcription quota exceeded. Please try again later."), { code: "QUOTA_EXCEEDED" });
  }

  if (status === 400) {
    const msg = data?.message || data?.error || "Invalid video URL or unsupported format.";
    throw Object.assign(new Error(msg), { code: "INVALID_INPUT" });
  }

  if (status === 422) {
    throw Object.assign(new Error("The video could not be processed. Try a shorter clip or a different URL."), { code: "UNPROCESSABLE" });
  }

  if (status >= 500) {
    throw Object.assign(new Error("Supadata service is temporarily unavailable. Please try again in a moment."), { code: "SERVICE_DOWN" });
  }

  throw Object.assign(new Error(`Transcription failed (status ${status}). Please try again.`), { code: "UNKNOWN" });
}

// ─────────────────────────────────────────────
// Utility helpers
// ─────────────────────────────────────────────
function getClientIp(req) {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.headers["x-real-ip"] ||
    req.connection?.remoteAddress ||
    req.ip ||
    "unknown"
  );
}

function normalizeUrl(raw) {
  try {
    const u = new URL(raw.trim());
    // Normalize YouTube short links → long form
    if (u.hostname === "youtu.be") {
      const id = u.pathname.slice(1);
      return `https://www.youtube.com/watch?v=${id}`;
    }
    return u.href;
  } catch {
    return raw.trim();
  }
}

function isValidUrl(raw) {
  try {
    const u = new URL(raw.trim());
    return ["http:", "https:"].includes(u.protocol);
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────
// POST /api/transcript/url
// Body: { url: string, lang?: string }
// ─────────────────────────────────────────────
router.post("/url", async (req, res) => {
  const ip = getClientIp(req);
  const { url, lang } = req.body;

  // Validation
  if (!url || typeof url !== "string" || !url.trim()) {
    return res.status(400).json({
      success: false,
      error: "INVALID_INPUT",
      message: "Please provide a video URL.",
    });
  }

  const normalized = normalizeUrl(url);
  if (!isValidUrl(normalized)) {
    return res.status(400).json({
      success: false,
      error: "INVALID_URL",
      message: "The URL doesn't look valid. Please enter a full URL starting with http:// or https://.",
    });
  }

  const normalizedLang = (lang || "auto").toLowerCase().trim();

  // Check cache first - skip rate limit for cached hits
  const cacheKey = getCacheKey(normalized, normalizedLang);
  const cached = transcriptCache.get(cacheKey);
  if (cached) {
    console.log(`✅ Transcript cache HIT for key: ${cacheKey.slice(0, 16)}...`);
    return res.json({
      success: true,
      cached: true,
      ...cached.value,
    });
  }

  // Identify user/subscription
  const authData = await getAuthenticatedUser(req);
  const isAuth = !!authData;
  const { subscription } = authData || {};

  // Rate limiting & Quota Check
  if (isAuth && subscription) {
    const canPerform = subscription.canPerformAction("generate_transcript");
    if (!canPerform.allowed) {
      if (canPerform.reason.includes("Trial transcription limit reached") || canPerform.reason.includes("limit reached")) {
        return res.status(402).json({
          success: false,
          error: "QUOTA_EXCEEDED",
          message: canPerform.reason,
          action: "upgrade"
        });
      }
      return res.status(403).json({
        success: false,
        error: "FORBIDDEN",
        message: canPerform.reason
      });
    }
  } else {
    // 1 without sign up
    const ANONYMOUS_LIMIT = 1; 
    if (!checkAndIncrementRateLimit(ip, ANONYMOUS_LIMIT)) {
      return res.status(429).json({
        success: false,
        error: "RATE_LIMIT",
        message: `You've hit the limit for anonymous users (1 transcription). Please sign in for higher limits.`,
      });
    }
  }

  try {
    console.log(`📡 Calling Supadata for URL: ${normalized.slice(0, 80)}...`);
    const result = await fetchTranscriptFromSupadata(normalized, normalizedLang);

    if (!result.transcript) {
      return res.status(422).json({
        success: false,
        error: "EMPTY_TRANSCRIPT",
        message: "No transcript was returned for this video. The video may not have speech, or the URL may be restricted.",
      });
    }

    // Record usage if authenticated
    if (isAuth && subscription) {
      await subscription.recordUsage("generate_transcript");
    }

    // Store in cache
    addToCache(cacheKey, {
      transcript: result.transcript,
      language: result.language,
      durationSeconds: result.durationSeconds,
      partial: result.partial,
    });

    return res.json({
      success: true,
      cached: false,
      transcript: result.transcript,
      language: result.language,
      durationSeconds: result.durationSeconds,
      partial: result.partial,
    });
  } catch (err) {
    console.error("❌ Transcript URL error:", err.message);

    const code = err.code || "UNKNOWN";
    const status =
      code === "QUOTA_EXCEEDED" ? 503 :
      code === "AUTH_ERROR" ? 503 :
      code === "INVALID_INPUT" || code === "UNPROCESSABLE" ? 422 :
      500;

    return res.status(status).json({
      success: false,
      error: code,
      message: err.message,
    });
  }
});

// ─────────────────────────────────────────────
// POST /api/transcript/upload
// multipart/form-data: file + lang?
// ─────────────────────────────────────────────
router.post("/upload", (req, res, next) => {
  upload.single("file")(req, res, (multerErr) => {
    if (multerErr) {
      if (multerErr.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({
          success: false,
          error: "FILE_TOO_LARGE",
          message: `File is too large. Maximum allowed size is ${MAX_UPLOAD_MB}MB.`,
        });
      }
      return res.status(400).json({
        success: false,
        error: "INVALID_FILE",
        message: multerErr.message || "Invalid file. Please upload a supported video format.",
      });
    }
    next();
  });
}, async (req, res) => {
  const ip = getClientIp(req);
  const { lang } = req.body;

  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: "NO_FILE",
      message: "Please select a video file to upload.",
    });
  }

  const filePath = req.file.path;
  const normalizedLang = (lang || "auto").toLowerCase().trim();

  // Identify user/subscription
  const authData = await getAuthenticatedUser(req);
  const isAuth = !!authData;
  const { subscription } = authData || {};

  // Rate limiting & Quota Check
  if (isAuth && subscription) {
    const canPerform = subscription.canPerformAction("generate_transcript");
    if (!canPerform.allowed) {
      // Clean up uploaded file
      try { fs.unlinkSync(filePath); } catch {}
      return res.status(402).json({
        success: false,
        error: "QUOTA_EXCEEDED",
        message: canPerform.reason,
        action: "upgrade"
      });
    }
  } else {
    // 1 without sign up
    const ANONYMOUS_LIMIT = 1;
    if (!checkAndIncrementRateLimit(ip, ANONYMOUS_LIMIT)) {
      // Clean up uploaded file
      try { fs.unlinkSync(filePath); } catch {}
      return res.status(429).json({
        success: false,
        error: "RATE_LIMIT",
        message: `You've hit the limit for anonymous users (1 transcription). Please sign in for higher limits.`,
      });
    }
  }

  try {
    // Supadata requires a URL, not a binary. 
    // For v1 we pass the file as a multipart stream directly.
    // If SUPADATA supports file uploads we use FormData; otherwise we fallback to local URL if server is accessible.
    if (!SUPADATA_API_KEY) {
      throw Object.assign(new Error("SUPADATA_API_KEY is not configured on the server."), { code: "AUTH_ERROR" });
    }

    console.log(`📤 Uploading file to Supadata: ${req.file.originalname} (${(req.file.size / 1024 / 1024).toFixed(2)}MB)`);

    // Send the file as multipart to Supadata's transcript endpoint
    const FormData = (await import("form-data")).default;
    const form = new FormData();
    form.append("file", fs.createReadStream(filePath), {
      filename: req.file.originalname || "upload.mp4",
      contentType: req.file.mimetype || "video/mp4",
    });
    if (normalizedLang && normalizedLang !== "auto") {
      form.append("lang", normalizedLang);
    }

    const response = await axios.post(`${SUPADATA_BASE}/transcript`, form, {
      headers: {
        ...form.getHeaders(),
        "x-api-key": SUPADATA_API_KEY,
        "Accept": "application/json",
      },
      timeout: 180_000, // 3 minutes for uploads
      maxContentLength: MAX_UPLOAD_MB * 1024 * 1024,
      validateStatus: null,
    });

    const status = response.status;
    const data = response.data;

    if (status !== 200) {
      let code = "UNKNOWN";
      let message = "Transcription failed for the uploaded file.";
      if (status === 402 || status === 429) { code = "QUOTA_EXCEEDED"; message = "Free transcription quota exceeded. Please try again later."; }
      else if (status === 401 || status === 403) { code = "AUTH_ERROR"; message = "Invalid or missing Supadata API key."; }
      else if (status === 400) { code = "INVALID_INPUT"; message = data?.message || "The file format may not be supported."; }
      else if (status === 422) { code = "UNPROCESSABLE"; message = "The video file could not be processed. Try a different file."; }
      throw Object.assign(new Error(message), { code });
    }

    // Extract transcript text
    let transcriptText = "";
    if (typeof data === "string") {
      transcriptText = data;
    } else if (data?.content) {
      if (Array.isArray(data.content)) {
        transcriptText = data.content.map((seg) => seg.text || seg).join(" ");
      } else {
        transcriptText = String(data.content);
      }
    } else if (data?.transcript) {
      transcriptText = data.transcript;
    } else if (data?.text) {
      transcriptText = data.text;
    }

    if (!transcriptText?.trim()) {
      return res.status(422).json({
        success: false,
        error: "EMPTY_TRANSCRIPT",
        message: "No transcript was returned. The video may not contain audible speech.",
      });
    }

    // Record usage if authenticated
    if (isAuth && subscription) {
      await subscription.recordUsage("generate_transcript");
    }

    return res.json({
      success: true,
      cached: false,
      transcript: transcriptText.trim(),
      language: data?.lang || data?.language || normalizedLang,
      durationSeconds: data?.durationSeconds || data?.duration || null,
      partial: false,
    });
  } catch (err) {
    console.error("❌ Transcript upload error:", err.message);
    const code = err.code || "UNKNOWN";
    const httpStatus =
      code === "QUOTA_EXCEEDED" ? 503 :
      code === "AUTH_ERROR" ? 503 :
      code === "INVALID_INPUT" || code === "UNPROCESSABLE" ? 422 :
      500;

    return res.status(httpStatus).json({
      success: false,
      error: code,
      message: err.message,
    });
  } finally {
    // Always clean up the uploaded file
    try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch {}
  }
});

// Find python executable on Windows
function getPythonCommand() {
  if (process.platform === "win32") {
    const userProfile = process.env.USERPROFILE || "";
    const baseDir = path.join(userProfile, "AppData", "Local", "Programs", "Python");
    try {
      if (fs.existsSync(baseDir)) {
        const dirs = fs.readdirSync(baseDir);
        for (const dir of dirs) {
          if (dir.toLowerCase().startsWith("python")) {
            const pyPath = path.join(baseDir, dir, "python.exe");
            if (fs.existsSync(pyPath)) {
              return pyPath;
            }
          }
        }
      }
    } catch (e) {
      console.error("Error searching python installation paths:", e);
    }
  }
  return "python";
}

// ─────────────────────────────────────────────
// POST /api/transcript/local
// Body: { url: string, model?: string, lang?: string, mode?: "local" | "cloud" }
// ─────────────────────────────────────────────
router.post("/local", async (req, res) => {
  const { url, model = "small", lang = "auto", mode = "cloud" } = req.body;

  if (!url || typeof url !== "string" || !url.trim()) {
    return res.status(400).json({
      success: false,
      error: "INVALID_INPUT",
      message: "Please provide an Instagram video URL.",
    });
  }

  const pyCmd = getPythonCommand();

  // Mode: Cloud (Gemini-powered)
  if (mode === "cloud") {
    console.log(`[Cloud Transcript] Downloading audio track for Instagram URL: ${url}`);
    const downloadScript = path.join(__dirname, "..", "scripts", "instagram_download.py");
    
    let stdoutData = "";
    let stderrData = "";
    let processError = null;

    const child = spawn(pyCmd, [downloadScript, url]);

    child.stdout.on("data", (data) => {
      stdoutData += data.toString();
    });

    child.stderr.on("data", (data) => {
      stderrData += data.toString();
    });

    child.on("error", (err) => {
      processError = err;
    });

    child.on("close", async (code) => {
      if (processError) {
        console.error("[Cloud Transcript] Child process error:", processError);
        if (processError.code === "ENOENT") {
          return res.status(500).json({
            success: false,
            error: "PYTHON_NOT_FOUND",
            message: "Python was not found on your system. Please install Python 3.9+ to enable download utility.",
          });
        }
        return res.status(500).json({
          success: false,
          error: "EXECUTION_ERROR",
          message: `Failed to spawn download script: ${processError.message}`,
        });
      }

      if (code !== 0) {
        console.error(`[Cloud Transcript] Download failed with code ${code}. Stderr: ${stderrData}`);
        return res.status(500).json({
          success: false,
          error: "DOWNLOAD_FAILED",
          message: `Audio download failed. Check if yt-dlp is installed and the post is public.`,
          details: stderrData || stdoutData,
        });
      }

      try {
        const result = JSON.parse(stdoutData.trim());
        if (!result.success) {
          return res.status(400).json({
            success: false,
            error: result.error_code || "DOWNLOAD_FAILED",
            message: result.error || "Failed to download audio track.",
          });
        }

        const audioPath = result.audio_path;
        console.log(`[Cloud Transcript] Audio downloaded successfully to ${audioPath}. Transcribing via Gemini...`);

        // Send to Gemini service
        const mimeType = "audio/mp3";
        const aiResponse = await googleAIService.transcribeAudio(audioPath, mimeType);

        // Delete temporary audio track
        try {
          fs.unlinkSync(audioPath);
        } catch (err) {
          console.error("Failed to delete temp audio path:", err);
        }

        return res.json({
          success: true,
          transcript: aiResponse.transcript,
          language: lang,
          durationSeconds: result.duration,
          title: result.title,
        });

      } catch (err) {
        console.error("Gemini Cloud Transcription Error:", err);
        return res.status(500).json({
          success: false,
          error: "CLOUD_TRANSCRIPTION_FAILED",
          message: `Cloud transcription failed: ${err.message}`,
        });
      }
    });
    return;
  }

  // Mode: Local (Whisper local execution)
  const scriptPath = path.join(__dirname, "..", "scripts", "instagram_transcribe.py");
  console.log(`Spawning local transcription process: ${pyCmd} ${scriptPath} "${url}" --model ${model} --language ${lang}`);

  let stdoutData = "";
  let stderrData = "";
  let processError = null;

  const whisperLanguage = lang === "auto" ? "auto" : lang;
  const args = [scriptPath, url, "--model", model];
  if (whisperLanguage && whisperLanguage !== "auto") {
    args.push("--language", whisperLanguage);
  }

  const child = spawn(pyCmd, args);

  child.stdout.on("data", (data) => {
    stdoutData += data.toString();
    console.log(`[Python Stdout] ${data.toString().trim()}`);
  });

  child.stderr.on("data", (data) => {
    stderrData += data.toString();
    console.warn(`[Python Stderr] ${data.toString().trim()}`);
  });

  child.on("error", (err) => {
    processError = err;
  });

  child.on("close", (code) => {
    if (processError) {
      console.error("Local transcript child process error:", processError);
      if (processError.code === "ENOENT") {
        return res.status(500).json({
          success: false,
          error: "PYTHON_NOT_FOUND",
          message: "Python was not found on your system. Please install Python 3.9+ and add it to your PATH.",
        });
      }
      return res.status(500).json({
        success: false,
        error: "EXECUTION_ERROR",
        message: `Failed to spawn transcription script: ${processError.message}`,
      });
    }

    if (code !== 0) {
      console.error(`Local transcript process exited with code ${code}. Stderr: ${stderrData}`);
      return res.status(500).json({
        success: false,
        error: "TRANSCRIPTION_FAILED",
        message: `Local transcription process exited with code ${code}. Check if ffmpeg, yt-dlp, and whisper are installed.`,
        details: stderrData || stdoutData,
      });
    }

    // Process output
    const lines = stdoutData.split("\n");
    let resultJson = null;

    for (const line of lines) {
      if (line.startsWith("[RESULT]")) {
        try {
          const jsonStr = line.slice(8).trim();
          resultJson = JSON.parse(jsonStr);
        } catch (e) {
          console.error("Error parsing JSON result from python script:", e);
        }
      }
    }

    if (!resultJson) {
      return res.status(500).json({
        success: false,
        error: "NO_RESULT",
        message: "Transcription script finished but returned no valid result.",
        details: stdoutData,
      });
    }

    if (!resultJson.success) {
      const errCode = resultJson.error_code || "TRANSCRIPTION_ERROR";
      let status = 500;
      if (["YT_DLP_MISSING", "WHISPER_MISSING", "FFMPEG_MISSING"].includes(errCode)) {
        status = 400; // Client/system setup configuration error
      }
      return res.status(status).json({
        success: false,
        error: errCode,
        message: resultJson.error || "Local transcription execution error.",
      });
    }

    return res.json({
      success: true,
      transcript: resultJson.transcript,
      language: resultJson.language,
      durationSeconds: resultJson.duration,
      title: resultJson.title,
    });
  });
});

export default router;
