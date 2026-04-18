import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Activity, Loader2, Sparkles, ArrowRight, Check, 
  Zap, Target, User2, Briefcase, Wand2, ChevronRight
} from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";

// Quick selection data
const QUICK_ROLES = [
  { value: "marketer", label: "Marketer", icon: "📈", industry: "Marketing", experience: "mid" },
  { value: "developer", label: "Developer", icon: "💻", industry: "Technology", experience: "mid" },
  { value: "founder", label: "Founder", icon: "🚀", industry: "Technology", experience: "executive" },
  { value: "consultant", label: "Consultant", icon: "💼", industry: "Consulting", experience: "senior" },
  { value: "sales", label: "Sales", icon: "🎯", industry: "Sales", experience: "mid" },
  { value: "hr", label: "HR", icon: "👥", industry: "Technology", experience: "mid" },
  { value: "designer", label: "Designer", icon: "🎨", industry: "Technology", experience: "mid" },
  { value: "executive", label: "Executive", icon: "👔", industry: "Technology", experience: "executive" },
  { value: "other", label: "Other", icon: "✨", industry: "Other", experience: "mid" }
];

const WRITING_STYLES = [
  { value: "professional", label: "Professional", desc: "Formal and authoritative", icon: "👔" },
  { value: "casual", label: "Casual", desc: "Friendly and conversational", icon: "😊" },
  { value: "storyteller", label: "Storyteller", desc: "Narrative and engaging", icon: "📖" },
  { value: "datadriven", label: "Data-Driven", desc: "Facts and insights", icon: "📊" }
];

const GOALS = [
  { value: "thought_leadership", label: "Thought Leadership", icon: "🎓" },
  { value: "networking", label: "Networking", icon: "🤝" },
  { value: "lead_generation", label: "Lead Generation", icon: "📈" },
  { value: "personal_brand", label: "Personal Brand", icon: "⭐" },
  { value: "share_knowledge", label: "Share Knowledge", icon: "💡" }
];

const OnboardingFlow = () => {
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Step 0: Welcome
    name: "",
    email: "",
    password: "",
    // Step 1: Quick Role Selection
    quickRole: "",
    customJobTitle: "",
    company: "",
    // Step 2: Writing Style
    writingStyle: "",
    // Step 3: Goals
    goals: [] as string[]
  });

  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const { register, googleLogin } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const handleGoogleSuccess = async (accessToken: string) => {
    setIsGoogleLoading(true);
    try {
      const result = await googleLogin(accessToken);
      if (result.success) {
        toast({
          title: result.isNewUser ? "Welcome to Engagematic!" : "Welcome back!",
          description: result.isNewUser
            ? "Account created - let's personalize your experience."
            : "Signed in with Google successfully.",
        });
        navigate(location.state?.returnTo || "/dashboard");
      } else {
        toast({ title: "Google sign-in failed", description: result.error || "Something went wrong", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Google sign-in failed", description: err.message || "An unexpected error occurred", variant: "destructive" });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const progress = ((step + 1) / 4) * 100;

  const handleQuickRoleSelect = (role: typeof QUICK_ROLES[0]) => {
    setFormData(prev => ({
      ...prev,
      quickRole: role.value,
      customJobTitle: role.label
    }));
  };

  const toggleGoal = (goal: string) => {
    setFormData(prev => ({
      ...prev,
      goals: prev.goals.includes(goal)
        ? prev.goals.filter(g => g !== goal)
        : [...prev.goals, goal]
    }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);

    const selectedRole = QUICK_ROLES.find(r => r.value === formData.quickRole);
    
    const result = await register({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      profile: {
        jobTitle: formData.customJobTitle,
        company: formData.company,
        industry: selectedRole?.industry || "Other",
        experience: selectedRole?.experience || "mid"
      },
      persona: {
        name: `${formData.name.split(' ')[0]}'s Professional Voice`,
        writingStyle: formData.writingStyle,
        tone: formData.writingStyle === "professional" ? "confident" : "friendly",
        expertise: formData.customJobTitle,
        targetAudience: "LinkedIn professionals",
        goals: formData.goals.join(", ")
      }
    });
    
    if (result.success) {
      toast({
        title: "🎉 Welcome to Engagematic!",
        description: "Your AI-powered content assistant is ready",
      });
      
      // Redirect to return URL or dashboard
      const returnTo = location.state?.returnTo || '/dashboard';
      navigate(returnTo);
    } else {
      toast({
        title: "Registration failed",
        description: result.error || "Please try again",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 0:
        return formData.name && formData.email && formData.password.length >= 6;
      case 1:
        return formData.quickRole && formData.company;
      case 2:
        return formData.writingStyle;
      case 3:
        return formData.goals.length > 0;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in-up">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
              <Activity className="h-7 w-7 text-white" />
            </div>
            <span className="text-2xl font-bold">Engagematic</span>
          </Link>
          <p className="text-muted-foreground">Create your AI-powered LinkedIn presence in 60 seconds</p>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>Step {step + 1} of 4</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
        </div>

        {/* Content Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="p-8 bg-card/50 backdrop-blur-xl shadow-2xl border-2">
              
              {/* Step 0: Account Creation */}
              {step === 0 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <User2 className="h-8 w-8 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold mb-2">Welcome! 👋</h2>
                    <p className="text-muted-foreground">Let's get you started quickly</p>
                  </div>

                  {/* Google Sign-Up */}
                  <GoogleSignInButton
                    onSuccess={handleGoogleSuccess}
                    onError={() => toast({ title: "Google sign-in failed", description: "Could not connect to Google.", variant: "destructive" })}
                    variant="signup"
                    disabled={isLoading || isGoogleLoading}
                  />
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200 dark:border-slate-700" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-card px-4 text-xs font-medium uppercase tracking-wider text-muted-foreground/70">or</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Input
                        placeholder="Your full name"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="h-12 text-lg"
                      />
                    </div>
                    <div>
                      <Input
                        type="email"
                        placeholder="Email address"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="h-12 text-lg"
                      />
                    </div>
                    <div>
                      <Input
                        type="password"
                        placeholder="Create a password (min 6 characters)"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        className="h-12 text-lg"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 1: Quick Role Selection */}
              {step === 1 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <Briefcase className="h-8 w-8 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold mb-2">What do you do? 💼</h2>
                    <p className="text-muted-foreground">Pick the closest match - we'll personalize from here</p>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {QUICK_ROLES.map((role) => (
                      <button
                        key={role.value}
                        onClick={() => handleQuickRoleSelect(role)}
                        className={`p-4 rounded-xl border-2 transition-all text-center hover:scale-105 ${
                          formData.quickRole === role.value
                            ? "border-primary bg-primary/10 shadow-lg"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="text-3xl mb-2">{role.icon}</div>
                        <div className="text-sm font-medium">{role.label}</div>
                      </button>
                    ))}
                  </div>

                  {formData.quickRole && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-3"
                    >
                      <Input
                        placeholder="Your company name"
                        value={formData.company}
                        onChange={(e) => setFormData({...formData, company: e.target.value})}
                        className="h-12"
                      />
                      <Input
                        placeholder="Refine your job title (optional)"
                        value={formData.customJobTitle}
                        onChange={(e) => setFormData({...formData, customJobTitle: e.target.value})}
                        className="h-12"
                      />
                    </motion.div>
                  )}
                </div>
              )}

              {/* Step 2: Writing Style */}
              {step === 2 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <Wand2 className="h-8 w-8 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold mb-2">Your Writing Style ✍️</h2>
                    <p className="text-muted-foreground">How should your AI write?</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {WRITING_STYLES.map((style) => (
                      <button
                        key={style.value}
                        onClick={() => setFormData({...formData, writingStyle: style.value})}
                        className={`p-6 rounded-xl border-2 transition-all text-left hover:scale-105 ${
                          formData.writingStyle === style.value
                            ? "border-primary bg-primary/10 shadow-lg"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="text-3xl mb-2">{style.icon}</div>
                        <div className="font-semibold text-lg mb-1">{style.label}</div>
                        <div className="text-sm text-muted-foreground">{style.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: Goals */}
              {step === 3 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <Target className="h-8 w-8 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold mb-2">What's Your Goal? 🎯</h2>
                    <p className="text-muted-foreground">Select all that apply</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {GOALS.map((goal) => (
                      <button
                        key={goal.value}
                        onClick={() => toggleGoal(goal.value)}
                        className={`p-4 rounded-xl border-2 transition-all hover:scale-105 ${
                          formData.goals.includes(goal.value)
                            ? "border-primary bg-primary/10 shadow-lg"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-2xl">{goal.icon}</span>
                          {formData.goals.includes(goal.value) && (
                            <Check className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        <div className="text-sm font-medium text-left">{goal.label}</div>
                      </button>
                    ))}
                  </div>

                  <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <p className="text-sm text-center">
                      <Sparkles className="inline h-4 w-4 mr-1" />
                      We'll use AI to personalize your content based on these goals
                    </p>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between mt-8">
                <Button
                  variant="outline"
                  onClick={() => setStep(s => Math.max(0, s - 1))}
                  disabled={step === 0 || isLoading}
                >
                  Back
                </Button>

                {step < 3 ? (
                  <Button
                    onClick={() => setStep(s => s + 1)}
                    disabled={!canProceed() || isLoading}
                    className="gap-2"
                  >
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={!canProceed() || isLoading}
                    className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Create My Account
                      </>
                    )}
                  </Button>
                )}
              </div>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>
            Already have an account?{" "}
            <Link to="/auth/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default OnboardingFlow;

