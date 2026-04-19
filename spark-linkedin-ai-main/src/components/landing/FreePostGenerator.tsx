import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2, Copy, ArrowRight, Check, Zap, TrendingUp, Rocket, Crown, Lock, Download, Share2, ExternalLink, Wand2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import apiClient from "@/services/api.js";
import { EXPANDED_PERSONAS } from "@/constants/expandedPersonas";
import { formatForLinkedIn } from "@/utils/linkedinFormatting";

// Simplified persona options for landing page
const SIMPLE_PERSONA_OPTIONS = [
  { value: "founder", label: "Founder", icon: "🚀" },
  { value: "marketer", label: "Marketer", icon: "📢" },
  { value: "recruiter", label: "Recruiter", icon: "👔" },
  { value: "consultant", label: "Consultant", icon: "💼" },
  { value: "sales-pro", label: "Sales Pro", icon: "💰" },
  { value: "student", label: "Student", icon: "🎓" },
  { value: "creator", label: "Creator", icon: "✍️" },
];

// Goal options
const GOAL_OPTIONS = [
  { value: "grow-followers", label: "Grow Followers", icon: TrendingUp },
  { value: "boost-engagement", label: "Boost Engagement", icon: Zap },
  { value: "get-leads", label: "Get More Leads", icon: Rocket },
  { value: "build-brand", label: "Build Personal Brand", icon: Crown },
];

interface FreePostGeneratorProps {
  onGenerated?: (postData: any) => void;
}

export const FreePostGenerator = ({ onGenerated }: FreePostGeneratorProps) => {
  const [persona, setPersona] = useState("");
  const [audience, setAudience] = useState("");
  const [goal, setGoal] = useState("");
  const [topic, setTopic] = useState("");
  const [hooks, setHooks] = useState<any[]>([]);
  const [selectedHook, setSelectedHook] = useState<any>(null);
  const [isGeneratingHooks, setIsGeneratingHooks] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPost, setGeneratedPost] = useState<any>(null);
  const [hasGenerated, setHasGenerated] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Check if user already generated a free post (session-based)
  useEffect(() => {
    const freePostGenerated = sessionStorage.getItem("free_post_generated");
    if (freePostGenerated === "true") {
      const savedPost = sessionStorage.getItem("free_post_content");
      if (savedPost) {
        try {
          setGeneratedPost(JSON.parse(savedPost));
          setHasGenerated(true);
        } catch (e) {
          console.error("Failed to parse saved post", e);
        }
      }
    }
  }, []);

  const handleGenerateCustomHooks = async () => {
    if (!topic.trim()) {
      toast({
        title: "Topic required",
        description: "Please enter a topic first to generate hooks.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingHooks(true);
    try {
      // The generateCustomHooks method uses the POST /api/hooks/generate endpoint
      // which is free for all users and generates contextually relevant hooks.
      const response = await apiClient.generateCustomHooks(topic);
      
      if (response.success && response.data?.hooks) {
        setHooks(response.data.hooks);
        setSelectedHook(response.data.hooks[0]); // Auto-select the first one
        toast({
          title: "Hooks Generated",
          description: "Select your favorite hook to continue.",
        });
      } else {
        throw new Error(response.message || "Failed to generate hooks");
      }
    } catch (error: any) {
      console.error("Hook generation error:", error);
      toast({
        title: "Generation failed",
        description: error.message || "We couldn't generate custom hooks. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingHooks(false);
    }
  };

  const handleGenerate = async () => {
    if (!persona) {
      toast({
        title: "Persona required",
        description: "Please select who you are.",
        variant: "destructive",
      });
      return;
    }

    if (!topic.trim()) {
      toast({
        title: "Topic required",
        description: "Please tell us what you want to post about.",
        variant: "destructive",
      });
      return;
    }

    // Check if already generated (session-based)
    if (sessionStorage.getItem("free_post_generated") === "true") {
      toast({
        title: "Free post already used",
        description: "You've already generated your free post. Sign up to create unlimited posts!",
        variant: "destructive",
      });
      return;
    }

    if (!selectedHook) {
      toast({
        title: "Hook required",
        description: "Please generate and select a hook first.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Map simple persona to full persona data
      const personaMap: Record<string, string> = {
        "founder": "startup-founder",
        "marketer": "digital-marketer",
        "recruiter": "hr-leader",
        "consultant": "consultant",
        "sales-pro": "sales-leader",
        "student": "job-seeker",
        "creator": "content-creator",
      };
      
      const personaId = personaMap[persona] || personaMap["founder"];
      const personaData = EXPANDED_PERSONAS.find(p => p.id === personaId) || EXPANDED_PERSONAS[0];

      let response;
      try {
        response = await apiClient.generatePostFree({
          topic: topic.trim(),
          customHookText: selectedHook?.text,
          persona: personaData,
          audience: audience.trim() || undefined,
          goal: goal || undefined,
        });
      } catch (error) {
        // Fallback: Call the endpoint directly if method doesn't exist
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
        const fetchResponse = await fetch(`${apiUrl}/content/posts/generate-free`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            topic: topic.trim(),
            customHookText: selectedHook?.text,
            persona: personaData,
            audience: audience.trim() || undefined,
            goal: goal || undefined,
          }),
        });
        
        if (!fetchResponse.ok) {
          const errorData = await fetchResponse.json().catch(() => ({}));
          if (fetchResponse.status === 404) {
            throw new Error("Backend endpoint not yet implemented. Please check BACKEND_ENDPOINT_NEEDED.md for setup instructions.");
          }
          throw new Error(errorData.message || `API error: ${fetchResponse.status}`);
        }
        
        response = await fetchResponse.json();
      }

      if (response.success || (response.data && response.data.content)) {
        const postContent = response.data?.content || response.content;
        
        const postData = {
          content: postContent?.content || postContent,
          topic: topic.trim(),
          persona: personaData,
          audience,
          goal,
          engagementScore: postContent?.engagementScore || null,
          _id: postContent?._id || `free_${Date.now()}`,
        };

        setGeneratedPost(postData);
        setHasGenerated(true);
        
        // Save to sessionStorage
        sessionStorage.setItem("free_post_generated", "true");
        sessionStorage.setItem("free_post_content", JSON.stringify(postData));
        sessionStorage.setItem("free_post_persona", JSON.stringify({ persona, audience, goal }));

        toast({
          title: "✨ Post generated!",
          description: "Your free post is ready. Sign up to create more!",
        });

        if (onGenerated) {
          onGenerated(postData);
        }
      } else {
        throw new Error(response.message || "Failed to generate post");
      }
    } catch (error: any) {
      const msg = error?.message || "";
      const isQuota = /429|quota|rate limit/i.test(msg);
      if (!isQuota) console.error("Generation error:", error);
      toast({
        title: isQuota ? "Rate limit reached" : "Generation failed",
        description: isQuota
          ? "The free AI quota is used for now. Please try again in about a minute."
          : (msg.slice(0, 120) + (msg.length > 120 ? "…" : "")),
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (generatedPost?.content) {
      const formattedPost = formatForLinkedIn(generatedPost.content);
      await navigator.clipboard.writeText(formattedPost);
      toast({
        title: "Copied!",
        description: "Post copied to clipboard",
      });
    }
  };

  const handleSignup = () => {
    // Save persona data to pass to registration
    const personaData = {
      persona,
      audience,
      goal,
      topic: generatedPost?.topic || topic,
    };
    sessionStorage.setItem("registration_prefill", JSON.stringify(personaData));
    navigate("/auth/register");
  };

  if (hasGenerated && generatedPost) {
    return (
      <div className="w-full space-y-4 sm:space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Card className="border-2 border-primary/20 shadow-xl bg-gradient-to-br from-white to-primary/5 p-4 sm:p-6 overflow-hidden">
          <div className="space-y-4 sm:space-y-5">
            {/* Success Header */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg mb-2 animate-in zoom-in duration-500">
                <Check className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Your Post is Ready! 🎉
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground">Here's your viral-grade LinkedIn post</p>
            </div>

            {/* Generated Post */}
            <div className="space-y-3">
              <div className="relative">
                <Label className="text-xs sm:text-sm font-semibold mb-1.5 block">Generated Post</Label>
                <div 
                  className="relative p-4 sm:p-5 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-lg border-2 border-slate-200 dark:border-slate-700 min-h-[200px] sm:min-h-[240px] max-h-[60vh] overflow-y-auto"
                  style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'rgba(59, 91, 255, 0.3) transparent'
                  }}
                >
                  <div 
                    className="text-xs sm:text-sm leading-relaxed pr-2 pb-4"
                    style={{
                      wordBreak: 'break-word',
                      overflowWrap: 'anywhere',
                      whiteSpace: 'pre-wrap',
                      fontFamily: 'system-ui, -apple-system, sans-serif',
                      lineHeight: '1.7'
                    }}
                  >
                    {formatForLinkedIn(generatedPost.content)}
                  </div>
                </div>
              </div>

              {generatedPost.engagementScore && (
                <div className="flex items-center justify-center gap-2 p-2 sm:p-2.5 bg-primary/10 rounded-lg">
                  <TrendingUp className="h-4 w-4 sm:h-4 sm:w-4 text-primary" />
                  <span className="text-xs sm:text-sm font-medium">
                    Engagement Score: <Badge variant="default" className="text-xs">{generatedPost.engagementScore}/100</Badge>
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5">
                <Button
                  variant="outline"
                  onClick={handleCopy}
                  className="gap-1.5 h-9 sm:h-10 text-xs sm:text-sm w-full"
                  size="sm"
                >
                  <Copy className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="truncate">Copy</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const formattedText = formatForLinkedIn(generatedPost.content);
                    const blob = new Blob([formattedText], { type: 'text/plain' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `linkedin-post-${Date.now()}.txt`;
                    a.click();
                    window.URL.revokeObjectURL(url);
                    toast({ title: "Downloaded successfully!" });
                  }}
                  className="gap-1.5 h-9 sm:h-10 text-xs sm:text-sm w-full"
                  size="sm"
                >
                  <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="truncate">Download</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={async () => {
                    const formattedPost = formatForLinkedIn(generatedPost.content);
                    await navigator.clipboard.writeText(formattedPost);
                    toast({
                      title: "✅ Post Copied!",
                      description: "Opening LinkedIn... Paste with Ctrl+V (Cmd+V on Mac)",
                    });
                    setTimeout(() => {
                      window.open('https://www.linkedin.com/feed/?shareActive=true', '_blank');
                    }, 1000);
                  }}
                  className="gap-1.5 h-9 sm:h-10 text-xs sm:text-sm bg-[#0077B5] hover:bg-[#006396] text-white w-full"
                  size="sm"
                >
                  <Share2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="truncate">Share</span>
                  <ExternalLink className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                </Button>
              </div>
            </div>

            {/* Signup CTA */}
            <Card className="bg-gradient-to-br from-primary/10 via-purple/10 to-pink/10 border-2 border-primary/30 p-4 sm:p-5">
              <div className="text-center space-y-3">
                <div className="space-y-1.5">
                  <h4 className="text-base sm:text-lg font-bold">
                    Love this post? ✨
                  </h4>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Sign up to create unlimited posts, save your style, unlock analytics, and more!
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <Button
                    size="sm"
                    onClick={handleSignup}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-md group gap-1.5 text-xs sm:text-sm h-9"
                  >
                    Sign Up for Free
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate("/auth/login")}
                    className="gap-1.5 text-xs sm:text-sm h-9"
                  >
                    Sign in
                  </Button>
                </div>
                <div className="flex items-center justify-center gap-3 sm:gap-4 text-[10px] sm:text-xs text-muted-foreground pt-1">
                  <span className="flex items-center gap-1">
                    <Check className="h-2.5 w-2.5 text-green-500" />
                    No credit card
                  </span>
                  <span className="flex items-center gap-1">
                    <Check className="h-2.5 w-2.5 text-green-500" />
                    7-day trial
                  </span>
                  <span className="flex items-center gap-1">
                    <Check className="h-2.5 w-2.5 text-green-500" />
                    Cancel anytime
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <Card className="w-full border border-border/50 shadow-lg bg-white dark:bg-card backdrop-blur-sm p-3 sm:p-4 lg:p-5 animate-fade-in-up">
      <div className="space-y-2.5 sm:space-y-3">
        {/* Compact Header */}
        <div className="space-y-1 text-center sm:text-left">
          <Badge className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200/50">
            <Sparkles className="w-2 h-2" />
            Try Free - No Signup Required
          </Badge>
          <h3 className="text-base sm:text-lg font-bold text-foreground">
            Generate Your First{" "}
            <span className="text-gradient-premium-world-class">
              Viral Post
            </span>
          </h3>
          <p className="text-xs text-muted-foreground">
            Tell us just enough to personalize your magic post. Get results in seconds.
          </p>
        </div>

        {/* Compact Form */}
        <div className="space-y-2.5 sm:space-y-3">
          {/* Persona Selection */}
          <div className="space-y-1">
            <Label htmlFor="persona" className="text-xs font-semibold text-foreground flex items-center gap-1">
              Who are you? <span className="text-red-500">*</span>
            </Label>
            <Select value={persona} onValueChange={setPersona}>
              <SelectTrigger className="h-9 bg-white dark:bg-background border hover:border-primary/50 transition-colors text-xs sm:text-sm">
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                {SIMPLE_PERSONA_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <div className="flex items-center gap-2">
                      <span>{opt.icon}</span>
                      <span>{opt.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Audience (Optional) */}
          <div className="space-y-1">
            <Label htmlFor="audience" className="text-xs font-semibold text-foreground">
              Who is your audience? <span className="text-muted-foreground text-[10px] font-normal">(optional)</span>
            </Label>
            <Input
              id="audience"
              placeholder='E.g., "SaaS buyers", "CXOs"...'
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              className="h-9 bg-white dark:bg-background border text-xs sm:text-sm"
            />
          </div>

          {/* Goal (Optional) */}
          <div className="space-y-1">
            <Label htmlFor="goal" className="text-xs font-semibold text-foreground">
              What is your main goal? <span className="text-muted-foreground text-[10px] font-normal">(optional)</span>
            </Label>
            <Select value={goal} onValueChange={setGoal}>
              <SelectTrigger className="h-9 bg-white dark:bg-background border text-xs sm:text-sm">
                <SelectValue placeholder="Select your goal" />
              </SelectTrigger>
              <SelectContent>
                {GOAL_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span>{opt.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Topic */}
          <div className="space-y-1">
            <Label htmlFor="topic" className="text-xs font-semibold text-foreground flex items-center gap-1">
              What do you want to post about? <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="topic"
              placeholder="E.g., My journey from developer to tech lead..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="min-h-[60px] sm:min-h-[70px] resize-none bg-white dark:bg-background border text-xs sm:text-sm"
            />
          </div>

          {/* Hook Selection Section */}
          <div className="space-y-4 pt-1 pb-2">
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-semibold flex items-center gap-2">
                <Wand2 className="h-4 w-4 text-primary" />
                Choose Your Hook <span className="text-red-500">*</span>
              </label>
              <Badge variant="outline" className="text-xs text-green-600 border-green-500/40 bg-green-500/10">
                Free Feature
              </Badge>
            </div>
            
            {hooks.length === 0 ? (
              <div className="mt-2 text-center p-4 border border-dashed rounded-lg bg-slate-50 dark:bg-slate-900/50">
                <p className="text-xs text-muted-foreground mb-3">
                  Generate 5 AI hooks crafted specifically for your topic above.
                </p>
                <Button
                  onClick={handleGenerateCustomHooks}
                  disabled={isGeneratingHooks || !topic.trim()}
                  variant="secondary"
                  className="w-full h-10 gap-2 bg-white hover:bg-slate-100 border shadow-sm dark:bg-slate-900 dark:hover:bg-slate-800"
                >
                  {isGeneratingHooks ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      Crafting Hooks...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 text-primary" />
                      ✨ Generate Hooks from My Topic
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid gap-2">
                  {hooks.map((hook, index) => (
                    <button
                      key={hook._id || index}
                      onClick={() => setSelectedHook(hook)}
                      className={`text-left p-3 rounded-lg border-2 transition-all ${
                        selectedHook?._id === hook._id 
                          ? "border-primary bg-primary/5 shadow-sm" 
                          : "border-border hover:border-primary/50 hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div className={`mt-0.5 rounded-full p-1 flex-shrink-0 ${
                          selectedHook?._id === hook._id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        }`}>
                          <Check className="h-3 w-3" />
                        </div>
                        <div>
                          <div className="text-sm line-clamp-2">{hook.text || hook.hook}</div>
                          {hook.category && (
                            <div className="text-[10px] text-muted-foreground mt-1 capitalize">
                              {hook.category.replace('-', ' ')} Framework
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                
                <div className="flex justify-end pt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleGenerateCustomHooks}
                    disabled={isGeneratingHooks}
                    className="text-xs h-8 text-muted-foreground hover:text-primary"
                  >
                    {isGeneratingHooks ? (
                      <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Regenerating...</>
                    ) : (
                      <><Zap className="h-3 w-3 mr-1" /> Generate Different Hooks</>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !persona || !topic.trim() || !selectedHook}
            className="w-full h-9 sm:h-10 text-xs sm:text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-md hover:shadow-lg transition-all group"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                Generate My Post
                <ArrowRight className="ml-1.5 h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </Button>

          <p className="text-center text-[10px] text-muted-foreground leading-relaxed">
            ✨ <span className="font-semibold text-foreground">1 free post</span>.{" "}
            <button 
              onClick={handleSignup}
              className="text-primary hover:underline font-semibold"
            >
              Sign up
            </button>
            {" "}for unlimited posts & analytics.
          </p>
        </div>
      </div>
    </Card>
  );
};

