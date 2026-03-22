import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Lightbulb, Sparkles, ArrowRight, Loader2, TrendingUp, MessageSquare, List, Laugh, BookOpen, Eye, Zap, Lock } from "lucide-react";
import { FeedbackRow } from "@/components/FeedbackRow";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { PAGE_SEO } from "@/constants/seo";
import { LinkedInOptimizer } from "@/components/LinkedInOptimizer";
import { PremiumWaitlistModal } from "@/components/PremiumWaitlistModal";
import { useSubscription } from "@/hooks/useSubscription";
import { UpgradePopup } from "@/components/UpgradePopup";
import { TestimonialPopup } from "@/components/TestimonialPopup";
import { PremiumUpgradeNotification } from "@/components/PremiumUpgradeNotification";
import apiClient from "@/services/api";

// Content angles with icons
const CONTENT_ANGLES = [
  { value: "all", label: "Mixed Angles (Recommended)", icon: Zap, description: "Variety of approaches for maximum engagement" },
  { value: "storytelling", label: "Storytelling", icon: BookOpen, description: "Narrative-driven with clear story arcs" },
  { value: "question", label: "Question", icon: MessageSquare, description: "Thought-provoking questions that spark debate" },
  { value: "listicle", label: "Listicle", icon: List, description: "Actionable list-based content" },
  { value: "how-to", label: "How-To", icon: TrendingUp, description: "Educational step-by-step frameworks" },
  { value: "observation", label: "Observation", icon: Eye, description: "Insights from patterns others miss" },
  { value: "humor", label: "Humor", icon: Laugh, description: "Relatable, professional humor with value" },
  { value: "custom", label: "Custom Angle", icon: Sparkles, description: "Define your own unique content approach" },
];

const TONES = [
  { value: "professional", label: "Professional", emoji: "👔" },
  { value: "casual", label: "Casual & Friendly", emoji: "😊" },
  { value: "witty", label: "Witty & Clever", emoji: "🎭" },
  { value: "inspirational", label: "Inspirational", emoji: "✨" },
  { value: "authoritative", label: "Authoritative & Expert", emoji: "🎓" },
  { value: "conversational", label: "Conversational", emoji: "💬" },
  { value: "bold", label: "Bold & Direct", emoji: "🔥" },
  { value: "empathetic", label: "Empathetic & Caring", emoji: "❤️" },
  { value: "humorous", label: "Humorous & Fun", emoji: "😄" },
  { value: "thought_provoking", label: "Thought-Provoking", emoji: "🤔" },
];

const AUDIENCES = [
  { value: "general", label: "General Audience", icon: "👥" },
  { value: "founders", label: "Founders & Entrepreneurs", icon: "🚀" },
  { value: "hr", label: "HR Professionals", icon: "👔" },
  { value: "developers", label: "Developers & Engineers", icon: "💻" },
  { value: "marketers", label: "Marketers & Growth", icon: "📈" },
  { value: "job_seekers", label: "Job Seekers", icon: "🎯" },
  { value: "sales", label: "Sales Professionals", icon: "💼" },
  { value: "executives", label: "C-Suite & Executives", icon: "👑" },
  { value: "consultants", label: "Consultants & Advisors", icon: "🎓" },
  { value: "freelancers", label: "Freelancers & Creators", icon: "✍️" },
  { value: "students", label: "Students & Graduates", icon: "🎓" },
  { value: "investors", label: "Investors & VCs", icon: "💰" },
];

interface PostIdea {
  id: string;
  title: string;
  hook: string;
  angle: string;
  framework: string[];
  whyItWorks: string;
  developmentNotes: string;
  engagementPotential: "Low" | "Medium" | "High" | "Very High";
  bestFor: string;
}

const IdeaGenerator = () => {
  const [topic, setTopic] = useState("");
  const [selectedAngle, setSelectedAngle] = useState("all");
  const [customAngle, setCustomAngle] = useState("");
  const [tone, setTone] = useState("professional");
  const [targetAudience, setTargetAudience] = useState("general");
  const [isGenerating, setIsGenerating] = useState(false);
  const [ideas, setIdeas] = useState<PostIdea[]>([]);
  const [selectedIdea, setSelectedIdea] = useState<PostIdea | null>(null);
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [showUpgradePopup, setShowUpgradePopup] = useState(false);
  const [showTestimonialPopup, setShowTestimonialPopup] = useState(false);
  const testimonialTimeoutRef = useRef<any>(null);
  const [showPremiumUpgrade, setShowPremiumUpgrade] = useState(false);
  const [premiumFeatureName, setPremiumFeatureName] = useState("");

  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { subscription, canPerformAction, fetchSubscription } = useSubscription();
  const navigate = useNavigate();

  const handleUpgradeClick = (featureName: string) => {
    setPremiumFeatureName(featureName);
    setShowPremiumUpgrade(true);
  };

  // Cleanup testimonial timeout on unmount
  useEffect(() => {
    return () => {
      if (testimonialTimeoutRef.current) {
        clearTimeout(testimonialTimeoutRef.current);
      }
    };
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth/login');
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleGenerateIdeas = async () => {
    if (!topic.trim()) {
      toast({
        title: "Topic required",
        description: "Please enter what you want to post about.",
        variant: "destructive",
      });
      return;
    }

    if (topic.trim().length < 10) {
      toast({
        title: "Topic too short",
        description: "Please provide at least 10 characters for your topic.",
        variant: "destructive",
      });
      return;
    }

    // Validate custom angle if selected
    if (selectedAngle === "custom" && !customAngle.trim()) {
      toast({
        title: "Custom angle required",
        description: "Please describe your custom content angle.",
        variant: "destructive",
      });
      return;
    }

    if (selectedAngle === "custom" && customAngle.trim().length < 5) {
      toast({
        title: "Custom angle too short",
        description: "Please provide at least 5 characters for your custom angle.",
        variant: "destructive",
      });
      return;
    }

    // Check quota before generating
    const quotaCheck = await canPerformAction("generate_idea");
    if (!quotaCheck.allowed) {
      setShowUpgradePopup(true);
      toast({
        title: "Limit Reached",
        description: quotaCheck.reason || "You've reached your idea limit. Upgrade to continue!",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setIdeas([]);
    setSelectedIdea(null);

    try {
      const result = await apiClient.generateIdeas({
        topic: topic.trim(),
        angle: selectedAngle === "custom" ? customAngle.trim() : selectedAngle,
        customAngle: selectedAngle === "custom" ? customAngle.trim() : undefined,
        tone,
        targetAudience,
      });

      if (result.success && result.data.ideas) {
        setIdeas(result.data.ideas);
        toast({
          title: "Ideas generated! 💡",
          description: `${result.data.ideas.length} post ideas ready for you`,
        });

        // Refresh subscription to get updated usage
        await fetchSubscription();

        // Check if this is the first idea generation
        const isFirstIdea = !localStorage.getItem('first_idea_generated');
        if (isFirstIdea) {
          localStorage.setItem('first_idea_generated', 'true');
          
          // Show testimonial popup after 5 seconds
          testimonialTimeoutRef.current = setTimeout(() => {
            if (!localStorage.getItem('testimonial_submitted_idea')) {
              setShowTestimonialPopup(true);
            }
          }, 5000);
        }
      } else {
        throw new Error(result.message || 'Failed to generate ideas');
      }
    } catch (error) {
      console.error('Idea generation error:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to generate ideas. Please try again.";
      toast({
        title: "Generation failed",
        description: errorMessage,
        variant: "destructive",
      });

      // Check if error is due to quota exceeded
      if (errorMessage.includes('limit') || errorMessage.includes('quota') || errorMessage.includes('exceeded')) {
        setShowUpgradePopup(true);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectIdea = (idea: PostIdea) => {
    setSelectedIdea(idea);
    // Navigate to Post Generator with pre-filled topic and hook
    navigate('/post-generator', {
      state: {
        prefilledTopic: `${idea.hook}\n\n${idea.framework.join('\n')}`,
        ideaContext: idea
      }
    });
  };

  const getEngagementColor = (level: string) => {
    switch (level) {
      case "Very High": return "bg-green-500";
      case "High": return "bg-blue-500";
      case "Medium": return "bg-yellow-500";
      default: return "bg-gray-500";
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="w-full bg-gray-50 dark:bg-slate-950 min-h-screen">
      <SEO {...PAGE_SEO.ideaGenerator} />
      
      {/* Page Header */}
      <header className="sticky top-0 z-20 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 hidden lg:block">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-50">
            Post{" "}
            <span className="text-gradient-premium-world-class">
              Idea Generator
            </span>
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Discover compelling content angles and concepts ready to develop into full posts
          </p>
        </div>
      </header>

      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Input Section */}
          <div className="space-y-6">
            {/* Topic Input */}
            <Card className="shadow-lg">
              <div className="p-6">
                <label className="block text-sm font-semibold mb-2">
                  What do you want to post about? *
                </label>
                <Textarea
                  placeholder="E.g., AI in recruitment, remote work challenges, personal branding for developers, startup lessons..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="min-h-[120px] resize-none"
                  maxLength={1000}
                />
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-muted-foreground">
                    💡 Be specific for better ideas. Instead of "productivity", try "productivity hacks for remote workers"
                  </p>
                  <span className={`text-xs ${topic.length > 950 ? 'text-orange-500' : topic.length > 900 ? 'text-yellow-600' : 'text-muted-foreground'}`}>
                    {topic.length}/1000
                  </span>
                </div>
              </div>
            </Card>

            {/* Content Angle Selection */}
            <Card className="shadow-lg">
              <div className="p-6">
                <label className="block text-sm font-semibold mb-3">
                  Content Angle *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {CONTENT_ANGLES.map((angle) => {
                    const Icon = angle.icon;
                    return (
                      <button
                        key={angle.value}
                        onClick={() => {
                          if (angle.value === "custom" && subscription?.plan === "trial") {
                            handleUpgradeClick("Custom Angles");
                            return;
                          }
                          setSelectedAngle(angle.value);
                          if (angle.value !== "custom") {
                            setCustomAngle(""); // Clear custom angle when switching
                          }
                        }}
                        className={`p-4 rounded-lg border-2 text-left transition-all ${
                          selectedAngle === angle.value
                            ? "border-primary bg-primary/10 shadow-md"
                            : "border-border hover:border-primary/50 bg-card"
                        }`}
                      >
                        <Icon className="h-5 w-5 mb-2 text-primary" />
                        <div className="text-sm font-medium mb-1 flex items-center gap-2">
                          {angle.label}
                          {angle.value === "custom" && subscription?.plan === "trial" && (
                            <Lock className="h-3 w-3 text-muted-foreground" />
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">{angle.description}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </Card>

            {/* Custom Angle Input (shown when Custom is selected) */}
            {selectedAngle === "custom" && (
              <Card className="shadow-lg border-2 border-primary">
                <div className="p-6">
                  <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Describe Your Custom Content Angle *
                  </label>
                  <Textarea
                    placeholder="e.g., Behind-the-scenes of my daily routine, Controversial takes on industry trends, Data-driven insights with statistics, Personal failures and lessons learned..."
                    value={customAngle}
                    onChange={(e) => setCustomAngle(e.target.value)}
                    rows={4}
                    maxLength={500}
                    className="resize-none border-2"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    {customAngle.length}/500 characters • Be specific about the approach, tone, and format you want
                  </p>
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-900">
                      <span className="font-semibold">💡 Examples:</span> "Myth-busting common misconceptions", "Day in the life series", "Before/after transformations", "Interview-style Q&A format", "Case study breakdowns"
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Tone & Audience */}
            <Card className="shadow-lg">
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Tone */}
                  <div>
                    <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                      <span>Tone</span>
                      <span className="text-xs text-muted-foreground font-normal">(Pick your vibe)</span>
                    </label>
                    <Select value={tone} onValueChange={setTone}>
                      <SelectTrigger className="border-2">
                        <SelectValue>
                          <span className="flex items-center gap-2">
                            <span>{TONES.find(t => t.value === tone)?.emoji}</span>
                            <span>{TONES.find(t => t.value === tone)?.label}</span>
                          </span>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {TONES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            <span className="flex items-center gap-2">
                              <span>{t.emoji}</span>
                              <span>{t.label}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Target Audience */}
                  <div>
                    <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                      <span>Target Audience</span>
                      <span className="text-xs text-muted-foreground font-normal">(Who are you speaking to?)</span>
                    </label>
                    <Select value={targetAudience} onValueChange={setTargetAudience}>
                      <SelectTrigger className="border-2">
                        <SelectValue>
                          <span className="flex items-center gap-2">
                            <span>{AUDIENCES.find(a => a.value === targetAudience)?.icon}</span>
                            <span>{AUDIENCES.find(a => a.value === targetAudience)?.label}</span>
                          </span>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {AUDIENCES.map((a) => (
                          <SelectItem key={a.value} value={a.value}>
                            <span className="flex items-center gap-2">
                              <span>{a.icon}</span>
                              <span>{a.label}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </Card>

            {/* Generate Button */}
            <Button 
              size="lg" 
              className="w-full shadow-lg"
              onClick={handleGenerateIdeas}
              disabled={isGenerating || !topic.trim()}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating Ideas...
                </>
              ) : (
                <>
                  <Lightbulb className="mr-2 h-5 w-5" />
                  Generate Post Ideas
                </>
              )}
            </Button>
          </div>

          {/* Ideas Grid - Full Width Below */}
          {ideas.length > 0 && (
            <div className="mt-8">
              {/* Regenerate Button */}
              <div className="flex justify-center mb-6">
                <Button 
                  variant="outline" 
                  onClick={handleGenerateIdeas}
                  disabled={isGenerating}
                  className="gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Regenerating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Regenerate Ideas
                    </>
                  )}
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {ideas.map((idea, index) => (
                  <Card 
                    key={idea.id} 
                    className="shadow-lg hover:shadow-xl transition-all border-2 hover:border-primary cursor-pointer group"
                    onClick={() => handleSelectIdea(idea)}
                  >
                    <div className="p-6">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl font-bold text-primary">#{index + 1}</span>
                            <Badge variant="outline" className="text-xs">
                              {idea.angle}
                            </Badge>
                          </div>
                          <h4 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                            {idea.title.length > 35 ? `${idea.title.substring(0, 35)}...` : idea.title}
                          </h4>
                        </div>
                      </div>

                      {/* Hook */}
                      <div className="mb-4 p-3 bg-muted rounded-lg">
                        <div className="text-xs font-semibold text-muted-foreground mb-1">OPENING HOOK:</div>
                        <p className="text-sm font-medium italic line-clamp-2">
                          {idea.hook.length > 50 ? `${idea.hook.substring(0, 50)}...` : idea.hook}
                        </p>
                      </div>

                      {/* Framework */}
                      <div className="mb-4">
                        <div className="text-xs font-semibold text-muted-foreground mb-2">CONTENT FRAMEWORK:</div>
                        <ul className="space-y-1">
                          {idea.framework.slice(0, 3).map((point, idx) => (
                            <li key={idx} className="text-xs flex items-start gap-2">
                              <span className="text-primary mt-0.5">•</span>
                              <span className="flex-1 line-clamp-1">
                                {point.length > 25 ? `${point.substring(0, 25)}...` : point}
                              </span>
                            </li>
                          ))}
                          {idea.framework.length > 3 && (
                            <li className="text-xs text-muted-foreground">
                              +{idea.framework.length - 3} more points...
                            </li>
                          )}
                        </ul>
                      </div>

                      {/* Why It Works */}
                      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="text-xs font-semibold text-blue-900 mb-1">💡 WHY THIS WORKS:</div>
                        <p className="text-xs text-blue-700 line-clamp-2">
                          {idea.whyItWorks.length > 40 ? `${idea.whyItWorks.substring(0, 40)}...` : idea.whyItWorks}
                        </p>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-3 border-t">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${getEngagementColor(idea.engagementPotential)}`} />
                          <span className="text-xs font-medium">{idea.engagementPotential} Engagement</span>
                        </div>
                        <Button size="sm" variant="ghost" className="gap-2 group-hover:bg-primary group-hover:text-white transition-all">
                          Select
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* LinkedIn Optimizer */}
                      <div className="mt-3">
                        <LinkedInOptimizer 
                          content={`${idea.title}\n\n${idea.hook}`}
                          topic={topic}
                          audience={targetAudience}
                          compact={true}
                        />
                      </div>

                      {/* Best For */}
                      <div className="text-xs text-muted-foreground">
                        <span className="font-semibold">Best for:</span> {idea.bestFor.length > 20 ? `${idea.bestFor.substring(0, 20)}...` : idea.bestFor}
                      </div>

                      {/* User Feedback */}
                      <div className="mt-3 pt-3 border-t" onClick={(e) => e.stopPropagation()}>
                        <FeedbackRow 
                          targetId={idea.id} 
                          targetType="idea" 
                          source="idea_generator" 
                        />
                      </div>
                    </div>
                  </Card>

                ))}
              </div>

              {/* Helper Text */}
              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  💡 <strong>Ready to develop an idea?</strong> Click on any card to go to Post Generator with your selected idea
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Premium Waitlist Modal */}
      <PremiumWaitlistModal
        isOpen={showWaitlistModal}
        onClose={() => setShowWaitlistModal(false)}
        source="idea-generator"
        planInterest="Pro Plan"
      />

      {/* Upgrade Popup */}
      <UpgradePopup
        open={showUpgradePopup}
        onOpenChange={setShowUpgradePopup}
        limitType="ideas"
      />
      
      {/* Testimonial Popup */}
      <TestimonialPopup
        open={showTestimonialPopup}
        onOpenChange={setShowTestimonialPopup}
        contentType="idea"
      />

      <PremiumUpgradeNotification
        isVisible={showPremiumUpgrade}
        onClose={() => setShowPremiumUpgrade(false)}
        featureName={premiumFeatureName}
      />
    </div>
  );
};

export default IdeaGenerator;

