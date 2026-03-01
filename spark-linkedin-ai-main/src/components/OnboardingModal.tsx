import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { 
  Target,
  Sparkles,
  Heart,
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Lightbulb,
  TrendingUp,
  Rocket,
  Crown,
  Building2,
  Briefcase,
  User,
  Users,
  BriefcaseBusiness,
  FileText,
  GraduationCap,
  Megaphone,
  ShoppingCart,
  X,
  Search
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { WRITING_STYLES, TONE_OPTIONS, INDUSTRIES, POPULAR_INDUSTRIES, EXPERIENCE_LEVELS } from "@/constants/personaOptions";
import api from "@/services/api";

const GOALS = [
  { id: 'sales', label: 'Sales & Leads', icon: TrendingUp, color: 'bg-blue-100 text-blue-700' },
  { id: 'marketing', label: 'Marketing', icon: Rocket, color: 'bg-purple-100 text-purple-700' },
  { id: 'personal', label: 'Personal Brand', icon: Crown, color: 'bg-yellow-100 text-yellow-700' },
  { id: 'company', label: 'Company', icon: Building2, color: 'bg-green-100 text-green-700' },
  { id: 'founder', label: 'Founder/CEO', icon: Rocket, color: 'bg-pink-100 text-pink-700' },
  { id: 'startup', label: 'Startup', icon: Sparkles, color: 'bg-indigo-100 text-indigo-700' },
  { id: 'agency', label: 'Agency', icon: Briefcase, color: 'bg-orange-100 text-orange-700' },
];

const USAGE_CONTEXTS = [
  { id: 'personal_profile', label: 'Personal Profile', icon: User, color: 'bg-blue-100 text-blue-700', description: 'For your own LinkedIn profile' },
  { id: 'founder_brand', label: 'Founder Brand', icon: Crown, color: 'bg-purple-100 text-purple-700', description: 'Building your founder brand' },
  { id: 'company_page', label: 'Company Page', icon: Building2, color: 'bg-green-100 text-green-700', description: 'For company LinkedIn page' },
  { id: 'agency_clients', label: 'Agency Clients', icon: BriefcaseBusiness, color: 'bg-orange-100 text-orange-700', description: 'Creating content for clients' },
  { id: 'side_projects', label: 'Side Projects', icon: Sparkles, color: 'bg-indigo-100 text-indigo-700', description: 'For personal projects' },
];

const CONTENT_FOCUS_OPTIONS = [
  { id: 'education', label: 'Education', icon: GraduationCap, color: 'bg-blue-100 text-blue-700', description: 'Teach and share knowledge' },
  { id: 'case_studies', label: 'Case Studies', icon: FileText, color: 'bg-purple-100 text-purple-700', description: 'Share success stories' },
  { id: 'hiring', label: 'Hiring', icon: Users, color: 'bg-green-100 text-green-700', description: 'Attract talent' },
  { id: 'product_updates', label: 'Product Updates', icon: Rocket, color: 'bg-orange-100 text-orange-700', description: 'Announce new features' },
  { id: 'community', label: 'Community', icon: Heart, color: 'bg-pink-100 text-pink-700', description: 'Build community engagement' },
];

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

export const OnboardingModal = ({ isOpen, onComplete }: OnboardingModalProps) => {
  const { updateProfile } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [formData, setFormData] = useState({
    // Step 1: Professional Info & Goals
    primaryGoal: "",
    jobTitle: "",
    company: "",
    industry: "",
    customIndustry: "",
    experience: "",
    usageContext: "",
    workContext: "",
    // Step 2: AI Persona
    personaName: "",
    writingStyle: "",
    tone: "",
    expertise: "",
    targetAudience: "",
    contentFocus: "",
    // Step 3: Preferences
    linkedinUrl: "",
    postFormatting: "plain",
    // Step 4: AI Voice (optional)
    aiVoiceDescription: "",
    aiVoiceTone: "neutral",
    aiVoiceBoldness: "balanced",
    aiVoiceEmoji: "sometimes",
  });
  const [showCustomIndustry, setShowCustomIndustry] = useState(false);
  const [industrySearch, setIndustrySearch] = useState("");

  const steps = [
    { id: 1, title: "Profile", icon: User },
    { id: 2, title: "AI Persona", icon: Sparkles },
    { id: 3, title: "Preferences", icon: Heart },
    { id: 4, title: "Content style", icon: FileText },
  ];

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev: any) => ({ ...prev, [field]: null }));
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: any = {};

    switch (step) {
      case 1:
        if (!formData.primaryGoal) newErrors.primaryGoal = "Please select your primary goal";
        break;
      case 2:
        if (!formData.writingStyle) newErrors.writingStyle = "Writing style is required";
        if (!formData.tone) newErrors.tone = "Tone is required";
        break;
      case 3:
        // Step 3 is optional
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 1:
        return !!formData.primaryGoal && !!formData.usageContext;
      case 2:
        return !!formData.writingStyle && !!formData.tone;
      case 3:
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep === 4) {
        // Step 4 uses its own buttons (Save & Continue / Skip)
        return;
      }
      if (currentStep === 3) {
        setCurrentStep(4);
      } else {
        setCurrentStep(prev => Math.min(prev + 1, 4));
      }
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (includeAiVoice = false) => {
    setIsLoading(true);
    try {
      const profilePayload: Record<string, unknown> = {
        onboardingCompleted: true,
        jobTitle: formData.jobTitle || null,
        company: formData.company || null,
        industry: formData.customIndustry || formData.industry || null,
        experience: formData.experience || null,
        linkedinUrl: formData.linkedinUrl || null,
        postFormatting: formData.postFormatting || "plain",
        usageContext: formData.usageContext || null,
        workContext: formData.workContext || null,
      };
      if (includeAiVoice) {
        profilePayload.aiVoice = {
          description: (formData.aiVoiceDescription || "").trim().slice(0, 500),
          tone: formData.aiVoiceTone || "neutral",
          boldness: formData.aiVoiceBoldness || "balanced",
          emojiPreference: formData.aiVoiceEmoji || "sometimes",
        };
      }
      const response = await api.updateProfile({
        profile: profilePayload,
        persona: {
          name: formData.personaName || `${formData.jobTitle || 'Professional'} Persona`,
          writingStyle: formData.writingStyle || null,
          tone: formData.tone || null,
          expertise: formData.expertise || null,
          targetAudience: formData.targetAudience || null,
          goals: formData.primaryGoal || null,
          contentFocus: formData.contentFocus || null,
          contentTypes: [],
        },
        interests: [],
      });

      if (!response.success) {
        throw new Error(response.message || "Failed to save");
      }

      if (updateProfile) {
        await updateProfile({
          profile: {
            onboardingCompleted: true,
          }
        });
      }

      toast({
        title: "🎉 Welcome to Engagematic!",
        description: "Your personalized experience is ready.",
      });

      onComplete();
    } catch (error: any) {
      console.error("Onboarding save error:", error);
      toast({
        title: "Failed to save",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const progress = (currentStep / 4) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="max-w-2xl max-h-[90vh] sm:max-h-[85vh] w-[95vw] sm:w-full p-0 !grid-cols-1 flex flex-col [&>button]:hidden animate-in fade-in zoom-in duration-300"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* Compact Header */}
        <div className="flex-shrink-0 bg-background/95 backdrop-blur-sm border-b px-4 sm:px-6 py-3">
          <div className="text-center">
            <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Welcome! 🎉
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Quick setup to personalize your experience
            </p>
          </div>
        </div>
        
        {/* Compact Progress Steps */}
        <div className="flex-shrink-0 px-4 sm:px-6 py-3 border-b bg-muted/30">
          <div className="flex justify-between items-center mb-2">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = currentStep > step.id;
              const isCurrent = currentStep === step.id;
              
              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div className={`relative w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300 ${
                      isCompleted
                        ? 'bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white shadow-md scale-105' 
                        : isCurrent
                        ? 'bg-gradient-to-br from-blue-500 to-purple-500 text-white shadow-md scale-105'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {isCompleted ? (
                        <Check className="h-4 w-4 sm:h-5 sm:w-5" />
                      ) : (
                        <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                      )}
                    </div>
                    <span className={`text-[10px] sm:text-xs mt-1.5 font-medium transition-colors ${
                      isCurrent ? 'text-primary' : isCompleted ? 'text-primary/70' : 'text-muted-foreground'
                    }`}>
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-1 sm:mx-2 rounded-full transition-all duration-300 ${
                      isCompleted 
                        ? 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600' 
                        : 'bg-muted'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>

        {/* Scrollable Content - Fixed */}
        <div 
          className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-6 py-4 sm:py-5 min-h-0"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(59, 91, 255, 0.3) transparent'
          }}
        >
          {/* Step 1: Professional Info & Goals */}
          {currentStep === 1 && (
            <div className="space-y-4 pb-6 animate-in fade-in slide-in-from-right-4 duration-200">
              <div className="text-center mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-2 shadow-md">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold mb-1">What's your goal?</h2>
                <p className="text-xs text-muted-foreground">We'll personalize your experience</p>
              </div>

              {/* Compact Goal Selection */}
              <div>
                <Label className="text-xs font-medium mb-2 block">Primary Goal</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {GOALS.map((goal) => {
                    const Icon = goal.icon;
                    return (
                      <button
                        key={goal.id}
                        type="button"
                        onClick={() => handleChange('primaryGoal', goal.id)}
                        className={`p-2.5 rounded-lg border-2 text-left transition-all duration-200 ${
                          formData.primaryGoal === goal.id
                            ? 'border-primary bg-primary/10 shadow-sm scale-105'
                            : 'border-border hover:border-primary/50'
                        }`}
                        disabled={isLoading}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`p-1 rounded ${goal.color}`}>
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          <span className="text-xs font-medium">{goal.label}</span>
                          {formData.primaryGoal === goal.id && (
                            <Check className="h-3 w-3 text-primary ml-auto" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
                {errors.primaryGoal && <p className="text-xs text-red-500 mt-1">{errors.primaryGoal}</p>}
              </div>

              {/* Usage Context Selection */}
              <div>
                <Label className="text-xs font-medium mb-2 block">How will you use this? *</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {USAGE_CONTEXTS.map((context) => {
                    const Icon = context.icon;
                    return (
                      <button
                        key={context.id}
                        type="button"
                        onClick={() => handleChange('usageContext', context.id)}
                        className={`p-2.5 rounded-lg border-2 text-left transition-all duration-200 ${
                          formData.usageContext === context.id
                            ? 'border-primary bg-primary/10 shadow-sm scale-105'
                            : 'border-border hover:border-primary/50'
                        }`}
                        disabled={isLoading}
                      >
                        <div className="flex items-start gap-2">
                          <div className={`p-1 rounded ${context.color} flex-shrink-0`}>
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-medium block">{context.label}</span>
                            <span className="text-[10px] text-muted-foreground mt-0.5 block">{context.description}</span>
                          </div>
                          {formData.usageContext === context.id && (
                            <Check className="h-3 w-3 text-primary flex-shrink-0" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
                {errors.usageContext && <p className="text-xs text-red-500 mt-1">{errors.usageContext}</p>}
              </div>

              {/* Compact Professional Info */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="jobTitle" className="text-xs font-medium">Job Title</Label>
                    <Input
                      id="jobTitle"
                      type="text"
                      placeholder="e.g., Marketing Manager"
                      value={formData.jobTitle}
                      onChange={(e) => handleChange('jobTitle', e.target.value)}
                      className="h-9 text-sm"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="company" className="text-xs font-medium">Company</Label>
                    <Input
                      id="company"
                      type="text"
                      placeholder="e.g., Acme Inc."
                      value={formData.company}
                      onChange={(e) => handleChange('company', e.target.value)}
                      className="h-9 text-sm"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Industry Selection - Enhanced */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium block">Industry</Label>
                  
                  {/* Popular Industries - Chip Selection */}
                  <div className="flex flex-wrap gap-2 mb-2">
                    {POPULAR_INDUSTRIES.map((industry) => (
                      <button
                        key={industry}
                        type="button"
                        onClick={() => {
                          handleChange('industry', industry);
                          setShowCustomIndustry(false);
                          setIndustrySearch("");
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                          formData.industry === industry && !showCustomIndustry
                            ? 'bg-primary text-primary-foreground shadow-sm scale-105'
                            : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                        }`}
                        disabled={isLoading}
                      >
                        {industry}
                        {formData.industry === industry && !showCustomIndustry && (
                          <Check className="h-3 w-3 inline-block ml-1.5" />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Search/Filter Industries */}
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Search industries..."
                      value={industrySearch}
                      onChange={(e) => {
                        setIndustrySearch(e.target.value);
                        if (e.target.value) {
                          setShowCustomIndustry(false);
                        }
                      }}
                      className="h-9 text-sm pr-8"
                      disabled={isLoading}
                    />
                    {industrySearch && (
                      <button
                        type="button"
                        onClick={() => setIndustrySearch("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* Filtered Industry List */}
                  {industrySearch && (
                    <div className="max-h-32 overflow-y-auto border rounded-md p-2 space-y-1 bg-background">
                      {INDUSTRIES.filter(industry => 
                        industry.toLowerCase().includes(industrySearch.toLowerCase()) &&
                        !POPULAR_INDUSTRIES.includes(industry as any)
                      ).map((industry) => (
                        <button
                          key={industry}
                          type="button"
                          onClick={() => {
                            handleChange('industry', industry);
                            setIndustrySearch("");
                            setShowCustomIndustry(false);
                          }}
                          className={`w-full text-left px-2 py-1.5 rounded text-xs hover:bg-muted transition-colors ${
                            formData.industry === industry ? 'bg-primary/10 text-primary font-medium' : ''
                          }`}
                          disabled={isLoading}
                        >
                          {industry}
                        </button>
                      ))}
                      {INDUSTRIES.filter(industry => 
                        industry.toLowerCase().includes(industrySearch.toLowerCase()) &&
                        !POPULAR_INDUSTRIES.includes(industry as any)
                      ).length === 0 && (
                        <p className="text-xs text-muted-foreground px-2 py-1">No industries found</p>
                      )}
                    </div>
                  )}

                  {/* Custom Industry Option */}
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCustomIndustry(!showCustomIndustry);
                        if (!showCustomIndustry) {
                          handleChange('industry', '');
                          setIndustrySearch("");
                        } else {
                          handleChange('customIndustry', '');
                        }
                      }}
                      className={`w-full px-3 py-2 rounded-lg border-2 text-left transition-all duration-200 ${
                        showCustomIndustry || formData.customIndustry
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                      disabled={isLoading}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium">
                          {showCustomIndustry || formData.customIndustry ? '✓ Custom Industry' : '+ Enter Custom Industry'}
                        </span>
                      </div>
                    </button>

                    {/* Custom Industry Input */}
                    {(showCustomIndustry || formData.customIndustry) && (
                      <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                        <Input
                          type="text"
                          placeholder="e.g., Blockchain, SaaS, EdTech..."
                          value={formData.customIndustry}
                          onChange={(e) => {
                            handleChange('customIndustry', e.target.value);
                            if (e.target.value) {
                              handleChange('industry', 'custom');
                            }
                          }}
                          className="h-9 text-sm"
                          disabled={isLoading}
                          autoFocus
                        />
                        <p className="text-[10px] text-muted-foreground mt-1">
                          💡 Enter your specific industry for better personalization
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="experience" className="text-xs font-medium">Experience</Label>
                    <select
                      id="experience"
                      value={formData.experience}
                      onChange={(e) => handleChange('experience', e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs"
                      disabled={isLoading}
                    >
                      <option value="">Select</option>
                      {EXPERIENCE_LEVELS.map((level) => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: AI Persona - Compact */}
          {currentStep === 2 && (
            <div className="space-y-4 pb-6 animate-in fade-in slide-in-from-right-4 duration-200">
              <div className="text-center mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center mx-auto mb-2 shadow-md">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold mb-1">Build your AI persona</h2>
                <p className="text-xs text-muted-foreground">Create content that sounds like you</p>
              </div>

              <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="flex items-start gap-2">
                  <Lightbulb className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-purple-700 dark:text-purple-300">
                    AI will learn your style to create authentic content
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="personaName" className="text-xs font-medium">Persona Name (Optional)</Label>
                  <Input
                    id="personaName"
                    type="text"
                    placeholder="e.g., Professional Sarah"
                    value={formData.personaName}
                    onChange={(e) => handleChange('personaName', e.target.value)}
                    className="h-9 text-sm"
                    disabled={isLoading}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="writingStyle" className="text-xs font-medium">Writing Style *</Label>
                    <select
                      id="writingStyle"
                      value={formData.writingStyle}
                      onChange={(e) => handleChange('writingStyle', e.target.value)}
                      className={`flex h-9 w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs ${
                        errors.writingStyle ? 'border-red-500' : ''
                      }`}
                      disabled={isLoading}
                    >
                      <option value="">Select</option>
                      {WRITING_STYLES.map((style) => (
                        <option key={style.value} value={style.value}>{style.label}</option>
                      ))}
                    </select>
                    {errors.writingStyle && <p className="text-xs text-red-500">{errors.writingStyle}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="tone" className="text-xs font-medium">Tone *</Label>
                    <select
                      id="tone"
                      value={formData.tone}
                      onChange={(e) => handleChange('tone', e.target.value)}
                      className={`flex h-9 w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs ${
                        errors.tone ? 'border-red-500' : ''
                      }`}
                      disabled={isLoading}
                    >
                      <option value="">Select</option>
                      {TONE_OPTIONS.map((tone) => (
                        <option key={tone.value} value={tone.value}>{tone.label}</option>
                      ))}
                    </select>
                    {errors.tone && <p className="text-xs text-red-500">{errors.tone}</p>}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="expertise" className="text-xs font-medium">Expertise (Optional)</Label>
                  <Textarea
                    id="expertise"
                    placeholder="e.g., Digital marketing, Leadership..."
                    value={formData.expertise}
                    onChange={(e) => handleChange('expertise', e.target.value)}
                    className="text-sm min-h-[60px]"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="targetAudience" className="text-xs font-medium">Target Audience (Optional)</Label>
                  <Textarea
                    id="targetAudience"
                    placeholder="e.g., Marketing professionals, Startup founders..."
                    value={formData.targetAudience}
                    onChange={(e) => handleChange('targetAudience', e.target.value)}
                    className="text-sm min-h-[60px]"
                    disabled={isLoading}
                  />
                </div>

                {/* Content Focus Selection */}
                <div>
                  <Label className="text-xs font-medium mb-2 block">Content Focus (Optional)</Label>
                  <p className="text-[10px] text-muted-foreground mb-2">What type of content do you want to prioritize?</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {CONTENT_FOCUS_OPTIONS.map((focus) => {
                      const Icon = focus.icon;
                      return (
                        <button
                          key={focus.id}
                          type="button"
                          onClick={() => handleChange('contentFocus', focus.id)}
                          className={`p-2.5 rounded-lg border-2 text-left transition-all duration-200 ${
                            formData.contentFocus === focus.id
                              ? 'border-primary bg-primary/10 shadow-sm scale-105'
                              : 'border-border hover:border-primary/50'
                          }`}
                          disabled={isLoading}
                        >
                          <div className="flex items-start gap-2">
                            <div className={`p-1 rounded ${focus.color} flex-shrink-0`}>
                              <Icon className="h-3.5 w-3.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-xs font-medium block">{focus.label}</span>
                              <span className="text-[10px] text-muted-foreground mt-0.5 block">{focus.description}</span>
                            </div>
                            {formData.contentFocus === focus.id && (
                              <Check className="h-3 w-3 text-primary flex-shrink-0" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Preferences - Compact */}
          {currentStep === 3 && (
            <div className="space-y-4 pb-6 animate-in fade-in slide-in-from-right-4 duration-200">
              <div className="text-center mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center mx-auto mb-2 shadow-md">
                  <Heart className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold mb-1">Final touches</h2>
                <p className="text-xs text-muted-foreground">Almost done!</p>
              </div>

              {/* Post Formatting Preference */}
              <div>
                <Label className="text-xs font-medium mb-2 block">Post Formatting Style</Label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "plain", label: "Plain Text", recommended: true },
                    { value: "bold", label: "Bold", description: "Key points bold" },
                    { value: "italic", label: "Italic", description: "Emphasis italic" },
                    { value: "emoji", label: "Emoji", description: "With emojis" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleChange('postFormatting', option.value)}
                      className={`p-2.5 rounded-lg border-2 text-left transition-all duration-200 ${
                        formData.postFormatting === option.value
                          ? 'border-primary bg-primary/10 shadow-sm'
                          : 'border-border hover:border-primary/50'
                      }`}
                      disabled={isLoading}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-medium">{option.label}</span>
                            {option.recommended && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">Rec</span>
                            )}
                          </div>
                          {option.description && (
                            <p className="text-[10px] text-muted-foreground mt-0.5">{option.description}</p>
                          )}
                        </div>
                        {formData.postFormatting === option.value && (
                          <Check className="h-3.5 w-3.5 text-primary" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="linkedinUrl" className="text-xs font-medium">LinkedIn URL (Optional)</Label>
                <Input
                  id="linkedinUrl"
                  type="url"
                  placeholder="https://linkedin.com/in/yourprofile"
                  value={formData.linkedinUrl}
                  onChange={(e) => handleChange('linkedinUrl', e.target.value)}
                  className="h-9 text-sm"
                  disabled={isLoading}
                />
                <p className="text-[10px] text-muted-foreground">
                  💡 Optional: Help us enhance your persona
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Set your content style (optional) */}
          {currentStep === 4 && (
            <div className="space-y-4 pb-6 animate-in fade-in slide-in-from-right-4 duration-200">
              <div className="text-center mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mx-auto mb-2 shadow-md">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold mb-1">Set your content style (optional)</h2>
                <p className="text-xs text-muted-foreground">Tell Engagematic how you want your content to read. You can change this anytime in Settings.</p>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="aiVoiceDescription" className="text-xs font-medium">Describe your style</Label>
                  <Textarea
                    id="aiVoiceDescription"
                    placeholder="Example: Direct, no fluff, slightly humorous, no emojis. I write for B2B SaaS founders and prefer practical, step-by-step posts."
                    value={formData.aiVoiceDescription}
                    onChange={(e) => handleChange('aiVoiceDescription', e.target.value)}
                    className="text-sm min-h-[80px] resize-none"
                    maxLength={500}
                    disabled={isLoading}
                  />
                  <p className="text-[10px] text-muted-foreground">{formData.aiVoiceDescription.length}/500</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Tone</Label>
                    <select
                      value={formData.aiVoiceTone}
                      onChange={(e) => handleChange('aiVoiceTone', e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs"
                      disabled={isLoading}
                    >
                      <option value="formal">Formal</option>
                      <option value="neutral">Neutral</option>
                      <option value="casual">Casual</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Boldness</Label>
                    <select
                      value={formData.aiVoiceBoldness}
                      onChange={(e) => handleChange('aiVoiceBoldness', e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs"
                      disabled={isLoading}
                    >
                      <option value="safe">Safe</option>
                      <option value="balanced">Balanced</option>
                      <option value="bold">Bold</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Emojis</Label>
                    <select
                      value={formData.aiVoiceEmoji}
                      onChange={(e) => handleChange('aiVoiceEmoji', e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs"
                      disabled={isLoading}
                    >
                      <option value="never">Never</option>
                      <option value="sometimes">Sometimes</option>
                      <option value="often">Often</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Compact Navigation Buttons */}
        <div className="flex-shrink-0 bg-background/95 backdrop-blur-sm border-t px-4 sm:px-6 py-3">
          <div className="flex justify-between items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1 || isLoading}
              className="gap-1.5 h-9 text-xs"
              size="sm"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </Button>

            {currentStep === 4 ? (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => handleSubmit(false)}
                  disabled={isLoading}
                  className="gap-1.5 h-9 text-xs"
                  size="sm"
                >
                  Skip for now
                </Button>
                <Button
                  type="button"
                  onClick={() => handleSubmit(true)}
                  disabled={isLoading}
                  className="gap-1.5 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 h-9 text-xs sm:px-6"
                  size="sm"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      Save & Continue
                    </>
                  )}
                </Button>
              </>
            ) : (
              <Button
                type="button"
                onClick={handleNext}
                disabled={isLoading || !canProceed()}
                className="gap-1.5 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 h-9 text-xs flex-1 sm:flex-initial sm:px-6"
                size="sm"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};