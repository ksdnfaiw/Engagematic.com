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

const LOADING_STEPS = [
  "Connecting to Instagram servers...",
  "Retrieving public post metadata...",
  "Extracting high-quality audio track...",
  "Analyzing speech frequencies...",
  "Transcribing words via Google Gemini AI...",
  "Polishing and formatting the final transcript..."
];

export default function InstagramTranscriptTool() {
  const [url, setUrl] = useState("");
  const [language, setLanguage] = useState("auto");
  
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [transcriptLang, setTranscriptLang] = useState("");
  
  const [copied, setCopied] = useState(false);
  const [errorType, setErrorType] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  
  const resultsRef = useRef<HTMLDivElement>(null);

  // Rotate loading steps message every 6 seconds when loading
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % LOADING_STEPS.length);
      }, 6000);
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
      // Force "cloud" mode and "small" model (small is fallback/default for local Whisper, ignored in cloud mode)
      const response = await apiClient.transcribeInstagramLocal(url.trim(), "small", language, "cloud");
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
        setErrorMsg(err.message || "Could not connect to the transcription server. Please try again.");
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
      answer: "Yes! The tool is 100% free to use. There are no registration forms, no hidden subscriptions, and no daily limits on the number of transcripts you can generate.",
    },
    {
      question: "How long does the transcription process take?",
      answer: "Since it is powered by high-speed Cloud AI (Gemini Flash), the entire process—from audio extraction to text generation—typically takes between 10 to 20 seconds depending on the length of the video.",
    },
    {
      question: "Are private Instagram accounts supported?",
      answer: "No, the tool requires access to public Instagram URLs so that our server can securely retrieve the audio track. Reels and posts from private accounts cannot be accessed.",
    },
    {
      question: "Is my data stored or kept private?",
      answer: "We prioritize your privacy. The audio track is fetched temporarily to process the transcription, and it is instantly and permanently deleted from our server immediately after the text is generated.",
    },
  ];
  
  const faqSchema = generateFAQSchema(faqData);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-purple-500/5 to-background">
      <SEO
        title="Free Instagram Transcript Generator – Reels, Post, IGTV | Engagematic"
        description="Paste any Instagram Reel, Post, or IGTV URL and get a full high-accuracy text transcript instantly. 100% free, fast Cloud AI transcription with no signup required."
        keywords="instagram transcript generator, transcribe instagram reel, instagram to text free, gemini audio transcription, transcribe reel online, instagram audio extractor"
        url={`${SITE_URL}/tools/instagram-transcript-generator`}
        structuredData={[breadcrumbSchema, faqSchema]}
      />

      {/* Hero Section */}
      <section className="relative py-14 sm:py-20 lg:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-blue-500/10 blur-3xl pointer-events-none" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 max-w-4xl text-center">
          <Badge className="mb-4 bg-purple-500/10 text-purple-600 border-purple-500/20 inline-flex items-center gap-1.5 py-1 px-3">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            100% Free · Cloud Fast · No Account Required
          </Badge>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-5 text-gradient-premium-world-class tracking-tight leading-tight">
            Instagram Transcript Generator
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
            Paste any Instagram Reel, Post, or IGTV link. Get a high-accuracy text transcript generated in seconds by advanced speech AI.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-5 text-sm text-muted-foreground mt-4">
            {[
              { icon: Instagram, label: "Reels, Posts & IGTV supported" },
              { icon: Sparkles, label: "Advanced Cloud Speech AI" },
              { icon: Shield, label: "100% private, instant temp cleanup" },
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
                Transcribe any public Instagram video instantly. Best for repurposing video content into social posts.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
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
                    placeholder="https://www.instagram.com/reel/DYNAXWGMYPc/..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !loading && handleGenerate()}
                    className="pl-10 h-12 text-sm transition-all focus-visible:ring-purple-500/20 focus-visible:border-purple-500"
                    disabled={loading}
                  />
                </div>
              </div>

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
                      Generating Transcript...
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
                      Transcription Progress
                    </span>
                  </div>
                  <div className="pl-8 space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      {LOADING_STEPS[loadingStep]}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Our Cloud speech AI is transcribing the video. This usually takes 10-20 seconds.
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
            <div className="space-y-4 animate-fade-in-up">
              <Alert variant="destructive" className="border-destructive/30 bg-destructive/5">
                <AlertCircle className="h-4.5 w-4.5" />
                <AlertTitle className="font-bold">Transcription Failed</AlertTitle>
                <AlertDescription className="text-sm mt-1 whitespace-pre-line">
                  {errorMsg}
                </AlertDescription>
              </Alert>
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
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">How it Works</h2>
            <p className="text-muted-foreground text-sm max-w-xl mx-auto">
              A private, secure pipeline running high-performance Speech AI entirely in the cloud.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: "1",
                title: "Paste URL Link",
                desc: "Enter the link of any public Instagram Reel, Post, or IGTV video that contains spoken voice.",
                icon: Instagram,
              },
              {
                step: "2",
                title: "Cloud AI Processing",
                desc: "Our server securely extracts the audio track and transcribes the speech into text in real-time.",
                icon: Sparkles,
              },
              {
                step: "3",
                title: "Format & Repurpose",
                desc: "Download the text instantly or send it directly to our LinkedIn AI generator to create viral content.",
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
