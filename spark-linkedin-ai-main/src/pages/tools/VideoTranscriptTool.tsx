import { useState, useRef, useCallback, useEffect } from "react";
import { SEO } from "@/components/SEO";
import { SITE_URL, generateFAQSchema, generateBreadcrumbSchema } from "@/constants/seo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  FileVideo,
  Link2,
  Upload,
  Loader2,
  Copy,
  Download,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Zap,
  Globe,
  FileText,
  Clock,
  Shield,
  Info,
} from "lucide-react";
import { Link } from "react-router-dom";

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const LANGUAGES = [
  { value: "auto", label: "Auto-detect" },
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "hi", label: "Hindi" },
  { value: "pt", label: "Portuguese" },
  { value: "it", label: "Italian" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
  { value: "ar", label: "Arabic" },
  { value: "zh", label: "Chinese" },
];

const ACCEPTED_TYPES = "video/mp4,video/quicktime,video/webm,video/x-msvideo,video/x-matroska,video/mpeg,.mp4,.mov,.webm,.avi,.mkv,.mpeg";
const MAX_FILE_SIZE_MB = 100;

// Platforms supported by Supadata's transcript endpoint
const SUPPORTED_PLATFORMS = [
  "YouTube", "Instagram", "TikTok", "X (Twitter)", "Facebook", "Public MP4"
];

const faqData = [
  {
    question: "Which platforms are supported?",
    answer: "Paste links from YouTube, Instagram Reels, TikTok, X (Twitter), Facebook, or any public direct MP4/video URL. You can also upload MP4, MOV, WEBM, AVI, or MKV files directly (max 100MB). The video must be publicly accessible.",
  },
  {
    question: "Does it work with Instagram Reels and TikTok?",
    answer: "Yes! Supadata's transcription engine supports Instagram Reels, TikTok videos, YouTube, X (Twitter), and Facebook videos — just paste the public URL and click Generate. Private or logged-in-only videos won't work.",
  },
  {
    question: "Is this transcript tool really free?",
    answer: "Yes! You can generate up to 5 transcripts per day completely free with no signup required. This is powered by Supadata's transcription API at no cost to you.",
  },
  {
    question: "How accurate are the transcripts?",
    answer: "The transcription accuracy depends on audio quality and speaking clarity. Clear speech with minimal background noise typically yields 95%+ accuracy. Technical jargon or heavy accents may slightly reduce accuracy.",
  },
  {
    question: "How long does transcription take?",
    answer: "For short videos (under 5 minutes), transcription usually takes 10–30 seconds. Longer videos can take up to a minute or two. We show a live loading indicator while processing.",
  },
  {
    question: "Can I use the transcript for LinkedIn posts?",
    answer: "Absolutely! This tool is part of Engagematic's toolkit. Once you have your transcript, you can use our AI LinkedIn Post Generator to turn your video insights into high-performing LinkedIn posts.",
  },
];


// ─────────────────────────────────────────────
// Small sub-components
// ─────────────────────────────────────────────
function StepBadge({ n, label }: { n: string; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
        {n}
      </div>
      <span className="font-medium text-foreground">{label}</span>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────
const VideoTranscriptTool = () => {
  const [activeTab, setActiveTab] = useState<"url" | "upload">("url");

  // URL tab state
  const [videoUrl, setVideoUrl] = useState("");
  const [urlError, setUrlError] = useState("");

  // Upload tab state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [fileError, setFileError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Shared state
  const [language, setLanguage] = useState("auto");
  const [loading, setLoading] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [transcriptLang, setTranscriptLang] = useState("");
  const [error, setError] = useState("");
  const [isPartial, setIsPartial] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isCached, setIsCached] = useState(false);

  // Scroll ref for results
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (transcript && resultsRef.current) {
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [transcript, error]);

  // ── URL validation ──
  const validateUrl = (val: string): boolean => {
    if (!val.trim()) { setUrlError("Please enter a video URL."); return false; }
    try {
      const u = new URL(val.trim());
      if (!["http:", "https:"].includes(u.protocol)) { setUrlError("URL must start with http:// or https://"); return false; }
    } catch {
      setUrlError("Please enter a valid URL (e.g. https://youtube.com/watch?v=...)");
      return false;
    }
    setUrlError("");
    return true;
  };

  // ── File validation ──
  const validateFile = (file: File): boolean => {
    const allowedMimes = [
      "video/mp4", "video/quicktime", "video/webm",
      "video/x-msvideo", "video/x-matroska", "video/mpeg",
    ];
    const allowedExts = [".mp4", ".mov", ".webm", ".avi", ".mkv", ".mpeg"];
    const ext = "." + file.name.split(".").pop()?.toLowerCase();

    if (!allowedMimes.includes(file.type) && !allowedExts.includes(ext)) {
      setFileError(`"${file.name}" is not a supported video format. Please upload MP4, MOV, WEBM, AVI, or MKV.`);
      return false;
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setFileError(`File is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is ${MAX_FILE_SIZE_MB}MB.`);
      return false;
    }
    setFileError("");
    return true;
  };

  // ── Drag-and-drop handlers ──
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && validateFile(file)) setSelectedFile(file);
  }, []);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && validateFile(file)) setSelectedFile(file);
  };

  // ── API call — URL mode ──
  const transcribeUrl = async () => {
    if (!validateUrl(videoUrl)) return;
    setLoading(true);
    setError("");
    setTranscript("");
    setIsPartial(false);
    setIsCached(false);

    try {
      const res = await fetch("/api/transcript/url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: videoUrl.trim(), lang: language }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || "Something went wrong. Please try again.");
        return;
      }
      setTranscript(data.transcript);
      setTranscriptLang(data.language || language);
      setIsPartial(data.partial || false);
      setIsCached(data.cached || false);
    } catch {
      setError("Network error — please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── API call — Upload mode ──
  const transcribeUpload = async () => {
    if (!selectedFile) { setFileError("Please select a video file first."); return; }
    if (!validateFile(selectedFile)) return;
    setLoading(true);
    setError("");
    setTranscript("");
    setIsPartial(false);
    setIsCached(false);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("lang", language);

      const res = await fetch("/api/transcript/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || "Transcription failed for this file. Please try another format.");
        return;
      }
      setTranscript(data.transcript);
      setTranscriptLang(data.language || language);
      setIsPartial(data.partial || false);
      setIsCached(false);
    } catch {
      setError("Network error — please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = () => {
    if (activeTab === "url") transcribeUrl();
    else transcribeUpload();
  };

  // ── Copy ──
  const handleCopy = async () => {
    await navigator.clipboard.writeText(transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Download ──
  const handleDownload = () => {
    const blob = new Blob([transcript], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transcript-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Structured data ──
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Free Tools", url: `${SITE_URL}/tools` },
    { name: "Video Transcript Generator", url: `${SITE_URL}/tools/video-transcript-generator` },
  ]);

  const faqSchema = generateFAQSchema(faqData);

  const toolSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Free Video Transcript Generator",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD", availability: "https://schema.org/InStock" },
    description: "Paste a video link or upload a file. Get a clean transcript in seconds. Free, no signup required.",
    url: `${SITE_URL}/tools/video-transcript-generator`,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-background">
      <SEO
        title="Free Video Transcript Generator – YouTube, MP4 & More | Engagematic"
        description="Convert any video to text instantly. Paste a YouTube link, public MP4 URL, or upload a file. Get a clean transcript in seconds. Free, no signup required."
        keywords="free video transcript generator, video to text free, youtube transcript generator, mp4 to text, video transcription online free, transcribe video free, video to text converter"
        url={`${SITE_URL}/tools/video-transcript-generator`}
        structuredData={[toolSchema, breadcrumbSchema, faqSchema]}
      />

      {/* ── HERO ── */}
      <section className="relative py-14 sm:py-20 lg:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 blur-3xl pointer-events-none" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 max-w-4xl">
          <div className="text-center">
            <Badge className="mb-4 bg-blue-500/10 text-blue-600 border-blue-500/20 inline-flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Free · No Sign-up Required
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-5 text-gradient-premium-world-class leading-tight">
              Free Video Transcript Generator
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
              Paste a link or upload a file. Get a clean, readable transcript in seconds — powered by AI.
            </p>
            {/* Platform badges */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-5">
              {SUPPORTED_PLATFORMS.map((p) => (
                <Badge key={p} variant="secondary" className="text-xs px-2.5 py-1 bg-primary/8 text-primary border border-primary/20 font-medium">
                  {p}
                </Badge>
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-5 text-sm text-muted-foreground">
              {[
                { icon: Globe, label: "YouTube, TikTok, Instagram & more" },
                { icon: Upload, label: "File uploads up to 100MB" },
                { icon: Clock, label: "Results in seconds" },
                { icon: Shield, label: "No data stored" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <Icon className="w-4 h-4 text-primary" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TOOL CARD ── */}
      <section className="pb-8 sm:pb-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
          <Card className="border-2 border-primary/20 shadow-2xl shadow-primary/10 bg-card/95 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <FileVideo className="w-5 h-5 text-primary" />
                Generate Transcript
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Tabs */}
              <Tabs
                value={activeTab}
                onValueChange={(v) => {
                  setActiveTab(v as "url" | "upload");
                  setError("");
                  setTranscript("");
                }}
              >
                <TabsList className="w-full grid grid-cols-2 h-11 mb-5">
                  <TabsTrigger value="url" className="flex items-center gap-2 text-sm font-medium">
                    <Link2 className="w-4 h-4" />
                    Paste Video Link
                  </TabsTrigger>
                  <TabsTrigger value="upload" className="flex items-center gap-2 text-sm font-medium">
                    <Upload className="w-4 h-4" />
                    Upload File
                  </TabsTrigger>
                </TabsList>

                {/* URL Tab */}
                <TabsContent value="url" className="mt-0">
                  <div className="space-y-2">
                    <div className="relative">
                      <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      <Input
                        id="video-url-input"
                        type="url"
                        placeholder="YouTube, Instagram, TikTok, X, Facebook URL or direct .mp4 link"
                        value={videoUrl}
                        onChange={(e) => { setVideoUrl(e.target.value); if (urlError) setUrlError(""); }}
                        onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                        className={`pl-9 h-12 text-sm transition-all duration-200 ${urlError ? "border-destructive focus-visible:ring-destructive/30" : "border-input focus-visible:ring-primary/30"}`}
                      />
                    </div>
                    {urlError && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {urlError}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground pl-1">
                      Supports YouTube, Instagram Reels, TikTok, X (Twitter), Facebook, and any public video URL or direct MP4 link.
                    </p>
                  </div>
                </TabsContent>

                {/* Upload Tab */}
                <TabsContent value="upload" className="mt-0">
                  <div className="space-y-2">
                    <div
                      id="video-dropzone"
                      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
                        dragOver
                          ? "border-primary bg-primary/5 scale-[1.01]"
                          : selectedFile
                          ? "border-green-400 bg-green-50 dark:bg-green-950/20"
                          : "border-muted-foreground/30 hover:border-primary/50 hover:bg-primary/5"
                      }`}
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept={ACCEPTED_TYPES}
                        className="hidden"
                        onChange={handleFileChange}
                        id="video-file-input"
                      />
                      {selectedFile ? (
                        <div className="flex flex-col items-center gap-2">
                          <CheckCircle2 className="w-10 h-10 text-green-500" />
                          <p className="font-semibold text-green-700 dark:text-green-400">{selectedFile.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB · Click to change
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                            <Upload className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold text-foreground mb-1">
                              {dragOver ? "Drop it here!" : "Drag & drop your video"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              or{" "}
                              <span className="text-primary font-medium underline underline-offset-2">
                                browse files
                              </span>
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            MP4, MOV, WEBM, AVI, MKV · Max {MAX_FILE_SIZE_MB}MB
                          </p>
                        </div>
                      )}
                    </div>
                    {fileError && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {fileError}
                      </p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              {/* Language + Generate */}
              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                <div className="sm:w-48">
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger id="language-select" className="h-11">
                      <Globe className="w-4 h-4 mr-2 text-muted-foreground" />
                      <SelectValue placeholder="Language" />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((l) => (
                        <SelectItem key={l.value} value={l.value}>
                          {l.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  id="generate-transcript-btn"
                  size="lg"
                  className="flex-1 h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold gap-2 transition-all duration-200 disabled:opacity-60"
                  onClick={handleGenerate}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Transcribing…
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate Transcript
                    </>
                  )}
                </Button>
              </div>

              {/* Loading message */}
              {loading && (
                <div className="rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-4 flex items-start gap-3 animate-fade-in">
                  <Loader2 className="w-5 h-5 text-blue-500 animate-spin flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">Transcribing your video…</p>
                    <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-0.5">
                      This can take up to a minute for longer files. Please wait.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── RESULTS ── */}
      <section ref={resultsRef} className="pb-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
          {/* Error state */}
          {error && !loading && (
            <Alert variant="destructive" className="animate-fade-in-up border-destructive/50 bg-destructive/5">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {error}
                <span className="block mt-1 text-xs opacity-70">
                  Try a different URL, a shorter clip, or upload the video file directly.
                </span>
              </AlertDescription>
            </Alert>
          )}

          {/* Success state */}
          {transcript && !loading && (
            <div className="space-y-4 animate-fade-in-up">
              {/* Meta bar */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20 gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Transcript Ready
                  </Badge>
                  {isCached && (
                    <Badge variant="secondary" className="text-xs gap-1">
                      <Zap className="w-3 h-3" /> Cached result
                    </Badge>
                  )}
                  {isPartial && (
                    <Badge variant="outline" className="text-xs gap-1 border-amber-400 text-amber-600">
                      <Info className="w-3 h-3" /> Partial transcript
                    </Badge>
                  )}
                  {transcriptLang && transcriptLang !== "auto" && (
                    <Badge variant="secondary" className="text-xs gap-1">
                      <Globe className="w-3 h-3" />
                      {LANGUAGES.find((l) => l.value === transcriptLang)?.label || transcriptLang}
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {transcript.split(/\s+/).filter(Boolean).length.toLocaleString()} words
                </span>
              </div>

              {/* Transcript textarea */}
              <Card className="border-2 border-primary/15">
                <CardContent className="p-0">
                  <Textarea
                    id="transcript-output"
                    value={transcript}
                    readOnly
                    className="min-h-[280px] max-h-[500px] resize-y border-0 rounded-xl text-sm font-mono leading-relaxed focus-visible:ring-0 bg-muted/30 p-4"
                  />
                </CardContent>
              </Card>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  id="copy-transcript-btn"
                  variant="outline"
                  size="lg"
                  className="flex-1 gap-2 border-2 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Transcript
                    </>
                  )}
                </Button>
                <Button
                  id="download-transcript-btn"
                  variant="outline"
                  size="lg"
                  className="flex-1 gap-2 border-2 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200"
                  onClick={handleDownload}
                >
                  <Download className="w-4 h-4" />
                  Download .txt
                </Button>
              </div>

              {/* Soft CTA */}
              <Card className="border border-primary/20 bg-gradient-to-r from-blue-50/80 to-purple-50/80 dark:from-blue-950/20 dark:to-purple-950/20">
                <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-foreground mb-0.5">
                      Turn this transcript into LinkedIn posts 🚀
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Use Engagematic's AI to generate high-performing LinkedIn content from your video transcript.
                    </p>
                  </div>
                  <Link to="/post-generator">
                    <Button size="sm" className="gap-1.5 whitespace-nowrap bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                      Try Post Generator
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-14 sm:py-20 bg-muted/40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">Why Use Our Transcript Tool?</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Built for creators, marketers, and professionals who need fast, accurate transcripts.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Globe,
                gradient: "from-blue-500 to-indigo-500",
                title: "6 Platforms Supported",
                desc: "Paste links from YouTube, Instagram Reels, TikTok, X (Twitter), Facebook, or any public MP4/video URL — powered by Supadata AI.",
              },
              {
                icon: Upload,
                gradient: "from-purple-500 to-pink-500",
                title: "File Upload Support",
                desc: "Upload MP4, MOV, WEBM, AVI, or MKV files directly — up to 100MB. Perfect for unlisted or private recordings.",
              },
              {
                icon: Zap,
                gradient: "from-amber-500 to-orange-500",
                title: "Fast & Accurate",
                desc: "Powered by Supadata's AI — transcripts are ready in seconds for short clips, under 2 minutes for longer videos.",
              },
              {
                icon: FileText,
                gradient: "from-green-500 to-emerald-500",
                title: "Clean, Readable Output",
                desc: "Get plain text you can immediately copy, download, or pipe into other Engagematic tools for content creation.",
              },
              {
                icon: Globe,
                gradient: "from-cyan-500 to-blue-500",
                title: "12+ Languages",
                desc: "Transcribe videos in English, Spanish, French, Hindi, German, Portuguese, Arabic, Japanese, and more.",
              },
              {
                icon: Shield,
                gradient: "from-violet-500 to-purple-500",
                title: "Private & Secure",
                desc: "Uploaded files are processed and immediately deleted. No transcript data is permanently stored on our servers.",
              },
            ].map(({ icon: Icon, gradient, title, desc }) => (
              <Card key={title} className="group p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 hover:border-primary/20">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-2">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-14 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">How It Works</h2>
          <div className="space-y-5">
            {[
              {
                step: "1",
                title: "Paste a link or upload a file",
                detail:
                  "Switch between tabs depending on your source. YouTube, MP4 links, and most public video URLs are supported via the link tab. Upload the file directly for private recordings.",
              },
              {
                step: "2",
                title: "Choose your language (optional)",
                detail:
                  'Select the spoken language from the dropdown for best accuracy, or leave it on "Auto-detect" and let the AI figure it out.',
              },
              {
                step: "3",
                title: "Click Generate Transcript",
                detail:
                  "Our backend sends the video to Supadata's transcription engine. For short clips this takes ~15 seconds, longer videos up to 2 minutes.",
              },
              {
                step: "4",
                title: "Copy or download the result",
                detail:
                  "The clean transcript appears on-screen. Copy it to your clipboard or download it as a .txt file. You can also pipe it into Engagematic's LinkedIn Post Generator.",
              },
            ].map(({ step, title, detail }) => (
              <Card key={step} className="p-5 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {step}
                  </div>
                  <div>
                    <h3 className="font-bold text-base mb-1">{title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{detail}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-14 sm:py-20 bg-muted/40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqData.map(({ question, answer }) => (
              <Card key={question} className="p-5 hover:shadow-md transition-shadow duration-200">
                <h3 className="font-bold mb-2 text-foreground">{question}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{answer}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── SEO CONTENT ── */}
      <section className="py-14 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
          <h2 className="text-3xl font-bold mb-5">What Is a Video Transcript Generator?</h2>
          <p className="text-muted-foreground mb-4 leading-relaxed">
            A video transcript generator converts spoken audio from a video into written text automatically using AI-powered speech recognition. Our free tool uses Supadata's transcription engine to process public video URLs and uploaded video files, returning clean, readable text within seconds.
          </p>
          <p className="text-muted-foreground mb-6 leading-relaxed">
            This is especially useful for content repurposing — turning a YouTube video, podcast recording, or webinar into blog posts, LinkedIn articles, or social media content without manual typing.
          </p>
          <h3 className="text-2xl font-bold mb-4">Who Should Use This Tool?</h3>
          <ul className="list-disc pl-5 space-y-2 text-muted-foreground text-sm mb-6">
            <li><strong className="text-foreground">Content creators</strong> turning video content into written articles or social posts</li>
            <li><strong className="text-foreground">Marketers</strong> repurposing webinars and interviews into multiple content formats</li>
            <li><strong className="text-foreground">Students & researchers</strong> transcribing lectures or video interviews</li>
            <li><strong className="text-foreground">LinkedIn professionals</strong> converting video insights into high-performing posts</li>
            <li><strong className="text-foreground">Accessibility teams</strong> creating captions or text alternatives for video content</li>
          </ul>
          <p className="text-muted-foreground text-sm">
            Combined with Engagematic's LinkedIn Post Generator, this tool becomes a powerful content pipeline: record a video, transcribe it here, and generate optimized LinkedIn posts in minutes.
          </p>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-14 sm:py-20 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">Explore All Free Tools</h2>
          <p className="text-muted-foreground text-lg mb-8">
            Transcription is just the start. Engagematic has a full suite of free LinkedIn tools to grow your presence.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/tools">
              <Button size="lg" className="w-full sm:w-auto gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                View All Free Tools
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/post-generator">
              <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2 border-2">
                <FileText className="w-4 h-4" />
                LinkedIn Post Generator
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default VideoTranscriptTool;
