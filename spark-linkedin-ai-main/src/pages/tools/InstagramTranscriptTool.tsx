import { useState, useRef, useEffect } from "react";
import { SEO } from "@/components/SEO";
import { SITE_URL, generateFAQSchema, generateBreadcrumbSchema } from "@/constants/seo";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Instagram,
  Sparkles,
  Globe,
  Shield,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  Download,
  Loader2,
  Terminal,
  Cpu,
  ArrowRight,
  HelpCircle,
  Play,
} from "lucide-react";
import { Link } from "react-router-dom";
import apiClient from "@/services/api";

const LANGUAGES = [
  { value: "auto", label: "Auto-detect" },
  { value: "en", label: "English" },
  { value: "hi", label: "Hindi" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "pt", label: "Portuguese" },
  { value: "it", label: "Italian" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
  { value: "ar", label: "Arabic" },
  { value: "zh", label: "Chinese" },
  { value: "ta", label: "Tamil" },
  { value: "te", label: "Telugu" },
  { value: "kn", label: "Kannada" },
  { value: "mr", label: "Marathi" },
  { value: "bn", label: "Bengali" },
  { value: "gu", label: "Gujarati" }
];

const WHISPER_MODELS = [
  { id: "tiny", name: "Tiny", size: "39 MB", speed: "Very Fast", accuracy: "★★☆", desc: "Lowest resources, best for fast testing." },
  { id: "base", name: "Base", size: "74 MB", speed: "Fast", accuracy: "★★☆", desc: "Good speed, basic transcription." },
  { id: "small", name: "Small", size: "244 MB", speed: "Balanced", accuracy: "★★★", desc: "Recommended balance of speed & quality." },
  { id: "medium", name: "Medium", size: "769 MB", speed: "Slow", accuracy: "★★★★", desc: "High accuracy, requires more RAM/VRAM." },
  { id: "large", name: "Large", size: "1.5 GB", speed: "Very Slow", accuracy: "★★★★★", desc: "Best quality, highly resource-intensive." },
];

const LOADING_STEPS = [
  "Initializing local subprocess...",
  "Running yt-dlp to download Instagram video audio track...",
  "Extracting audio stream to temporary media file...",
  "Loading local OpenAI Whisper neural network into memory...",
  "Running local speech-to-text inference (transcribing spoken words)...",
  "Finishing up, cleaning temporary media files..."
];

export default function InstagramTranscriptTool() {
  const [url, setUrl] = useState("");
  const [model, setModel] = useState("small");
  const [language, setLanguage] = useState("auto");
  const [mode, setMode] = useState<"cloud" | "local">("cloud");
  
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [transcriptLang, setTranscriptLang] = useState("");
  
  const [copied, setCopied] = useState(false);
  const [errorType, setErrorType] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  
  const resultsRef = useRef<HTMLDivElement>(null);

  // Rotate loading steps message every 8 seconds when loading
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % LOADING_STEPS.length);
      }, 7000);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  // Scroll to results when transcript is loaded or error occurs
  useEffect(() => {
    if ((transcript || errorMsg) && resultsRef.current) {
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
    }
  }, [transcript, errorMsg]);

  const handleGenerate = async () => {
    if (!url.trim()) {
      setErrorMsg("Please enter an Instagram post or reel URL.");
      setErrorType("VALIDATION_ERROR");
      return;
    }

    if (!url.includes("instagram.com")) {
      setErrorMsg("Please enter a valid Instagram URL (e.g. instagram.com/reel/...).");
      setErrorType("VALIDATION_ERROR");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setErrorType(null);
    setTranscript("");

    try {
      const response = await apiClient.transcribeInstagramLocal(url.trim(), model, language, mode);
      if (response.success) {
        setTranscript(response.transcript);
        setTranscriptLang(response.language || language);
      } else {
        setErrorType(response.error || "TRANSCRIPTION_FAILED");
        setErrorMsg(response.message || "Failed to transcribe Instagram video.");
      }
    } catch (err: any) {
      // Parse detailed error if available
      try {
        const errData = JSON.parse(err.message);
        setErrorType(errData.error || "EXECUTION_ERROR");
        setErrorMsg(errData.message || "An unexpected error occurred during execution.");
      } catch {
        setErrorType("EXECUTION_ERROR");
        setErrorMsg(err.message || "Could not connect to the local server. Make sure the backend is running.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([transcript], { type: "text/plain" });
    const fileUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = fileUrl;
    a.download = `instagram-transcript-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(fileUrl);
  };

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Free Tools", url: `${SITE_URL}/tools` },
    { name: "Instagram Transcript Generator", url: `${SITE_URL}/tools/instagram-transcript-generator` },
  ]);

  const faqData = [
    {
      question: "Is this transcript tool really free?",
      answer: "Yes! Because it runs directly on your computer's hardware using open-source tools (yt-dlp and OpenAI Whisper), there are no API keys, cloud token charges, or limits on video length or quantity.",
    },
    {
      question: "Why does it say Python or ffmpeg was not found?",
      answer: "This tool runs the speech-to-text neural network locally on your machine instead of sending data to the cloud. For it to work, you must install Python (version 3.9+) and ffmpeg on your system, and then install the required Python libraries.",
    },
    {
      question: "How long does local transcription take?",
      answer: "This depends on the length of the video and your machine's CPU/GPU. The 'small' Whisper model typically transcribes a 1-minute video in about 20-40 seconds. The first run will also take extra time to automatically download the selected model files from OpenAI.",
    },
  ];
  
  const faqSchema = generateFAQSchema(faqData);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-purple-500/5 to-background">
      <SEO
        title="Free Instagram Transcript Generator – Reels, Post, IGTV | Engagematic"
        description="Paste any Instagram Reel, Post, or IGTV URL and get a full text transcript instantly. 100% free, run locally on your machine with no token limits or API keys."
        keywords="instagram transcript generator, transcribe instagram reel, instagram to text free, local whisper transcription, transcribe reel offline, instagram audio extractor"
        url={`${SITE_URL}/tools/instagram-transcript-generator`}
        structuredData={[breadcrumbSchema, faqSchema]}
      />

      {/* Hero Section */}
      <section className="relative py-14 sm:py-20 lg:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-blue-500/10 blur-3xl pointer-events-none" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 max-w-4xl text-center">
          <Badge className="mb-4 bg-purple-500/10 text-purple-600 border-purple-500/20 inline-flex items-center gap-1.5 py-1 px-3">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            100% Free · Local Execution · No Cloud Token Limits
          </Badge>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-5 text-gradient-premium-world-class tracking-tight leading-tight">
            Instagram Transcript Generator
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
            Paste any Instagram Reel, Post, or IGTV link. Extract the audio track and transcribe speech to text locally on your hardware.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-5 text-sm text-muted-foreground mt-4">
            {[
              { icon: Instagram, label: "Reels, Posts & IGTV supported" },
              { icon: Cpu, label: "Local AI (OpenAI Whisper)" },
              { icon: Shield, label: "100% private, no cloud storage" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <Icon className="w-4.5 h-4.5 text-purple-500" />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Tool Card */}
      <section className="pb-8 sm:pb-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
          <Card className="border-2 border-purple-500/25 shadow-2xl shadow-purple-500/5 bg-card/95 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2.5 text-xl font-bold">
                <Instagram className="w-5.5 h-5.5 text-purple-500" />
                Transcribe Instagram Content
              </CardTitle>
              <CardDescription>
                {mode === "cloud" 
                  ? "Transcribe using Google's Gemini Flash AI. 100% free and runs in the cloud instantly." 
                  : "Transcribe using local Whisper model. Offline execution running on your machine hardware."
                }
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Mode Toggle Selector */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground/95">
                  Transcription Engine
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setMode("cloud")}
                    className={`flex flex-col items-center p-3 rounded-xl border text-center transition-all duration-200 ${
                      mode === "cloud"
                        ? "border-purple-500 bg-purple-500/5 ring-1 ring-purple-500 font-bold"
                        : "border-border hover:border-purple-300 hover:bg-purple-500/[0.01]"
                    }`}
                    disabled={loading}
                  >
                    <span className="text-sm flex items-center gap-1.5 justify-center">
                      <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      Cloud AI (Gemini)
                    </span>
                    <span className="text-[10px] text-muted-foreground mt-1">
                      Fast & Free · Online
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("local")}
                    className={`flex flex-col items-center p-3 rounded-xl border text-center transition-all duration-200 ${
                      mode === "local"
                        ? "border-purple-500 bg-purple-500/5 ring-1 ring-purple-500 font-bold"
                        : "border-border hover:border-purple-300 hover:bg-purple-500/[0.01]"
                    }`}
                    disabled={loading}
                  >
                    <span className="text-sm flex items-center gap-1.5 justify-center">
                      <Cpu className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      Local AI (Whisper)
                    </span>
                    <span className="text-[10px] text-muted-foreground mt-1">
                      Runs on your Machine
                    </span>
                  </button>
                </div>
              </div>

              {/* URL Input */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground/95" htmlFor="instagram-url">
                  Instagram Reel / Post URL
                </label>
                <div className="relative">
                  <Instagram className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground pointer-events-none" />
                  <Input
                    id="instagram-url"
                    type="url"
                    placeholder="https://www.instagram.com/reel/C8aBcdEfGhI/..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !loading && handleGenerate()}
                    className="pl-10 h-12 text-sm transition-all focus-visible:ring-purple-500/20 focus-visible:border-purple-500"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Model Choice (Premium Grid - Only show in Local Mode) */}
              {mode === "local" && (
                <div className="space-y-2 animate-fade-in">
                  <label className="text-sm font-semibold text-foreground/95">
                    Whisper Model Size
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                    {WHISPER_MODELS.map((m) => {
                      const isSelected = model === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => !loading && setModel(m.id)}
                          className={`flex flex-col items-center justify-between p-3 rounded-xl border text-center transition-all duration-200 ${
                            isSelected
                              ? "border-purple-500 bg-purple-500/5 shadow-md shadow-purple-500/5 ring-1 ring-purple-500"
                              : "border-border hover:border-purple-300 hover:bg-purple-500/[0.01]"
                          }`}
                          disabled={loading}
                        >
                          <span className="font-bold text-sm">{m.name}</span>
                          <span className="text-[11px] text-muted-foreground mt-1">{m.size}</span>
                          <div className="flex items-center gap-0.5 mt-2">
                            <span className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">
                              {m.speed}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    * Note: Larger models offer higher transcription accuracy but require significantly more RAM/VRAM and take longer to download and process.
                  </p>
                </div>
              )}

              {/* Language Selection & Submit */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <div className="sm:w-48">
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/20 focus-visible:border-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={loading}
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l.value} value={l.value}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <Button
                  onClick={handleGenerate}
                  disabled={loading}
                  size="lg"
                  className="flex-1 h-11 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold gap-2 shadow-lg hover:shadow-purple-500/10 active:scale-[0.98] transition-all"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {mode === "cloud" ? "Transcribing in cloud..." : "Processing locally..."}
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-white" />
                      Generate Transcript
                    </>
                  )}
                </Button>
              </div>

              {/* Loading progress guide */}
              {loading && (
                <div className="rounded-xl bg-purple-500/5 border border-purple-500/15 p-4 space-y-2.5 animate-pulse">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 text-purple-500 animate-spin flex-shrink-0" />
                    <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                      {mode === "cloud" ? "Cloud Transcription Progress" : "Local Transcription Progress"}
                    </span>
                  </div>
                  <div className="pl-8 space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      {mode === "cloud"
                        ? loadingStep <= 2 
                          ? LOADING_STEPS[loadingStep] 
                          : "Transcribing audio via Gemini 2.0 Flash..."
                        : LOADING_STEPS[loadingStep]
                      }
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {mode === "cloud"
                        ? "Gemini Cloud Transcription is extremely fast and takes about 10-20 seconds on average."
                        : "Whisper model loading/transcribing can take anywhere from 30 seconds to a few minutes depending on media size and model speed."
                      }
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Results / Error Area */}
      <section ref={resultsRef} className="pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
          {/* Error Alert Box */}
          {errorMsg && !loading && (
            <div className="space-y-4">
              <Alert variant="destructive" className="border-destructive/30 bg-destructive/5 animate-fade-in-up">
                <AlertCircle className="h-4.5 w-4.5" />
                <AlertTitle className="font-bold">Execution Error</AlertTitle>
                <AlertDescription className="text-sm mt-1 whitespace-pre-line">
                  {errorMsg}
                </AlertDescription>
              </Alert>

              {/* Setup guide if dependency is missing */}
              {["PYTHON_NOT_FOUND", "YT_DLP_MISSING", "WHISPER_MISSING", "FFMPEG_MISSING"].includes(errorType || "") && (
                <Card className="border border-amber-500/25 bg-amber-500/[0.02] shadow-md">
                  <CardHeader className="pb-3 flex-row items-center gap-2">
                    <Terminal className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    <div>
                      <CardTitle className="text-base font-bold text-amber-800 dark:text-amber-300">
                        Local Dependencies Setup Guide
                      </CardTitle>
                      <CardDescription className="text-xs text-amber-700/70 dark:text-amber-400/70">
                        This tool runs local computations. Follow these steps to install the missing libraries.
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm text-foreground/80">
                    <div className="space-y-2">
                      <p className="font-semibold text-foreground">1. Install Python 3.9+</p>
                      <p className="text-xs text-muted-foreground pl-3">
                        Download and install Python from <a href="https://python.org" target="_blank" rel="noreferrer" className="text-purple-600 hover:underline">python.org</a>. **Make sure to check the box "Add Python to PATH" during installation.**
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="font-semibold text-foreground">2. Install ffmpeg (Audio Transcoding utility)</p>
                      <div className="bg-muted p-2 rounded-md font-mono text-xs pl-3 border flex flex-col gap-1.5">
                        <div>**Windows (CMD/PowerShell)**:</div>
                        <code className="text-purple-600">winget install ffmpeg</code>
                        <div className="mt-1">**macOS (Terminal)**:</div>
                        <code className="text-purple-600">brew install ffmpeg</code>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="font-semibold text-foreground">3. Install Python libraries</p>
                      <div className="bg-muted p-2 rounded-md font-mono text-xs pl-3 border">
                        <code className="text-purple-600">pip install yt-dlp openai-whisper gradio</code>
                      </div>
                    </div>

                    <div className="pt-2 text-xs text-amber-700 dark:text-amber-400/80">
                      ℹ️ Once the installations are complete, restart your terminal/IDE servers and refresh this page.
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Success Transcript Display */}
          {transcript && !loading && (
            <div className="space-y-4 animate-fade-in-up">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    Speech-to-Text Completed Successfully
                  </Badge>
                  
                  {transcriptLang && transcriptLang !== "auto" && (
                    <Badge variant="secondary">
                      <Globe className="w-3 h-3 mr-1" />
                      {LANGUAGES.find((l) => l.value === transcriptLang)?.label || transcriptLang}
                    </Badge>
                  )}
                </div>
                <span className="text-muted-foreground font-mono">
                  {transcript.split(/\s+/).filter(Boolean).length.toLocaleString()} words
                </span>
              </div>

              {/* Text Area Card */}
              <Card className="border border-purple-500/20">
                <CardContent className="p-0">
                  <Textarea
                    id="transcript-box"
                    value={transcript}
                    readOnly
                    className="min-h-[280px] max-h-[500px] resize-y border-0 rounded-xl text-sm font-mono leading-relaxed focus-visible:ring-0 bg-muted/20 p-4"
                  />
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  onClick={handleCopy}
                  className="flex-1 h-11 border-2 hover:bg-purple-500/5 hover:border-purple-500/40 text-sm font-semibold transition-all"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="w-4.5 h-4.5 text-green-500" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4.5 h-4.5" />
                      Copy Transcript
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={handleDownload}
                  className="flex-1 h-11 border-2 hover:bg-purple-500/5 hover:border-purple-500/40 text-sm font-semibold transition-all"
                >
                  <Download className="w-4.5 h-4.5" />
                  Download Plain Text (.txt)
                </Button>
              </div>

              {/* CTA card for Content Generator */}
              <Card className="border border-purple-500/15 bg-gradient-to-r from-purple-500/5 via-pink-500/5 to-transparent">
                <CardContent className="p-4.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <p className="font-bold text-sm text-foreground">
                      Convert this Reel transcript into viral LinkedIn posts! 🚀
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Instantly repurpose Instagram scripts into highly optimized LinkedIn content in our editor.
                    </p>
                  </div>
                  <Link to="/post-generator" className="w-full sm:w-auto">
                    <Button size="sm" className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white gap-1 hover:brightness-105 active:scale-95 transition-all">
                      Go to Post Generator
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </section>

      {/* Guide / How it Works section */}
      <section className="py-14 bg-muted/40 border-y">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">How Local Transcription Works</h2>
            <p className="text-muted-foreground text-sm max-w-xl mx-auto">
              A private, secure pipeline running speech AI entirely offline inside your server setup.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: "1",
                title: "Extract Instagram Audio",
                desc: "The server executes yt-dlp to access the public post URL and extracts the highest-quality audio track to a temporary media file.",
                icon: Download,
              },
              {
                step: "2",
                title: "Run local Whisper AI",
                desc: "Your machine loads OpenAI's neural speech recognition network. It processes the raw audio, executing transcription calculations locally.",
                icon: Cpu,
              },
              {
                step: "3",
                title: "Return Text & Cleanup",
                desc: "Once done, the script outputs the full transcript text, cleanly deletes all temporary media downloads, and updates the dashboard UI.",
                icon: CheckCircle2,
              },
            ].map(({ step, title, desc, icon: Icon }) => (
              <Card key={step} className="p-5 flex flex-col justify-between border-2 border-border/80">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4">
                    <Icon className="w-5.5 h-5.5 text-purple-600" />
                  </div>
                  <h3 className="font-bold text-sm mb-1">{step}. {title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
