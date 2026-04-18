import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff, Check, User, Sparkles, Lightbulb, Shield } from "lucide-react";
import { LogoWithText } from "@/components/LogoWithText";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { PERSONA_PRESETS, isPersonaSlug, type PersonaSlug } from "@/constants/personaPresets";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";

const Register = () => {
  const [formData, setFormData] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [personaSlug, setPersonaSlug] = useState<PersonaSlug | null>(null);

  const { register } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const handleChange = (field: string, value: string) => {
    setFormData((p) => ({ ...p, [field]: value }));
    if (errors[field]) setErrors((p: any) => ({ ...p, [field]: undefined }));
  };

  const validateForm = (): boolean => {
    const e: any = {};
    if (!formData.name.trim()) e.name = "Name is required";
    if (!formData.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) e.email = "Invalid email";
    if (!formData.password) e.password = "Password is required";
    else if (formData.password.length < 6) e.password = "At least 6 characters";
    if (formData.password !== formData.confirmPassword) e.confirmPassword = "Passwords don't match";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === "Enter" && !isLoading && validateForm()) handleSubmit(); };

  useEffect(() => {
    const p = new URLSearchParams(location.search).get("persona");
    setPersonaSlug(isPersonaSlug(p) ? p : null);
  }, [location.search]);

  const selectedPersona = personaSlug ? PERSONA_PRESETS[personaSlug] : null;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      const r = await register({
        name: formData.name, email: formData.email, password: formData.password,
        ...(selectedPersona?.profile ? { profile: selectedPersona.profile } : {}),
        ...(selectedPersona?.persona ? { persona: selectedPersona.persona } : {}),
      });
      if (r.success) {
        toast({ title: "Welcome to Engagematic!", description: "Account created. Let's set up your profile." });
        await new Promise((r) => setTimeout(r, 100));
        navigate(location.state?.returnTo || "/dashboard");
      } else {
        toast({ title: "Registration failed", description: r.error || "Failed to create account", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Registration failed", description: err.message || "Unexpected error", variant: "destructive" });
    } finally { setIsLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-background via-primary/5 to-background">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-6 sm:mb-8">
          <LogoWithText textSize="lg" className="mb-4 justify-center" />
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">Create your AI-powered LinkedIn presence</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Get started in seconds - complete your profile setup after signup</p>
        </div>

        {selectedPersona && (
          <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-left shadow-sm dark:border-blue-900/60 dark:bg-blue-950/40 animate-in fade-in slide-in-from-top-2">
            <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-blue-700 dark:text-blue-200">{selectedPersona.label}</div>
            <div className="mt-2 text-sm font-semibold text-blue-900 dark:text-blue-100">{selectedPersona.stat}</div>
            {selectedPersona.lines.map((line, i) => <p key={i} className="mt-1 text-sm text-blue-900/80 dark:text-blue-100/80">{line}</p>)}
            <p className="mt-3 text-xs font-medium uppercase tracking-[0.26em] text-blue-600/80 dark:text-blue-300/80">We'll preload this playbook into your workspace.</p>
          </div>
        )}

        <Card className="p-5 sm:p-6 md:p-8 shadow-2xl border-2 border-blue-100/50 dark:border-blue-900/50 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="text-center mb-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mx-auto mb-4 shadow-lg animate-in zoom-in duration-300">
              <User className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2">Let's get started</h2>
            <p className="text-sm sm:text-base text-muted-foreground">Create your account in seconds</p>
          </div>

          <GoogleSignInButton variant="signup" disabled={isLoading} />

          {/* Trust signals */}
          <div className="flex items-center justify-center gap-4 mt-3 mb-1">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/60"><Shield className="h-3 w-3" /><span>Secure</span></div>
            <div className="w-1 h-1 rounded-full bg-muted-foreground/20" />
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/60"><Sparkles className="h-3 w-3" /><span>7-day free trial</span></div>
            <div className="w-1 h-1 rounded-full bg-muted-foreground/20" />
            <div className="text-[11px] text-muted-foreground/60">No credit card</div>
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-slate-700" /></div>
            <div className="relative flex justify-center"><span className="bg-card px-4 text-xs font-medium uppercase tracking-wider text-muted-foreground/60">or sign up with email</span></div>
          </div>

          <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="space-y-5">
            <div className="grid md:grid-cols-2 gap-4 sm:gap-5">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
                <Input id="name" placeholder="John Doe" value={formData.name} onChange={(e) => handleChange("name", e.target.value)}
                  className={`h-11 ${errors.name ? "border-red-500" : ""}`} disabled={isLoading} autoComplete="name" />
                {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                <Input id="email" type="email" placeholder="john@example.com" value={formData.email} onChange={(e) => handleChange("email", e.target.value)}
                  className={`h-11 ${errors.email ? "border-red-500" : ""}`} disabled={isLoading} autoComplete="email" />
                {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? "text" : "password"} placeholder="Create a secure password"
                    value={formData.password} onChange={(e) => handleChange("password", e.target.value)}
                    className={`h-11 ${errors.password ? "border-red-500" : ""}`} disabled={isLoading} autoComplete="new-password" />
                  <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)} disabled={isLoading}>
                    {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                  </Button>
                </div>
                {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</Label>
                <div className="relative">
                  <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="Confirm your password"
                    value={formData.confirmPassword} onChange={(e) => handleChange("confirmPassword", e.target.value)}
                    className={`h-11 ${errors.confirmPassword ? "border-red-500" : ""}`} disabled={isLoading} autoComplete="new-password" />
                  <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)} disabled={isLoading}>
                    {showConfirmPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                  </Button>
                </div>
                {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword}</p>}
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 sm:p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <Check className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs sm:text-sm text-blue-900 dark:text-blue-100">Your password is encrypted and secure. We'll never store it in plain text.</p>
            </div>
            <div className="flex items-start gap-3 p-3 sm:p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <Lightbulb className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs sm:text-sm text-purple-900 dark:text-purple-100">After signup, you'll complete your profile setup to personalize your AI experience.</p>
            </div>

            <Button type="submit" disabled={isLoading} size="lg"
              className="w-full gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 text-base sm:text-lg font-semibold py-6 sm:py-7">
              {isLoading ? (<><Loader2 className="h-5 w-5 animate-spin" />Creating account...</>) : (<><Sparkles className="h-5 w-5" />Create Account</>)}
            </Button>
          </form>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">Already have an account?{" "}<Link to="/auth/login" className="text-primary hover:underline font-medium">Sign in</Link></p>
          <p className="text-xs text-muted-foreground mt-2">By signing up, you agree to our Terms of Service and Privacy Policy</p>
        </div>
      </div>
    </div>
  );
};

export default Register;
