import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Check, Globe, IndianRupee, Zap, Rocket, Settings, Star, Crown } from "lucide-react";
import { premiumCTAClasses, premiumCTAHighlight, premiumCTAIcon } from "@/styles/premiumButtons";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import api from "@/services/api";
import { useCreditPayment } from "@/hooks/useRazorpay";
import geoLocationService from "@/services/geoLocationService";
import { useAuth } from "@/contexts/AuthContext";

type Currency = 'INR' | 'USD';
type PresetType = 'starter' | 'pro' | '80' | '100' | 'custom';

interface CreditSelection {
  posts: number;
  comments: number;
  ideas: number;
}

interface PricingConfig {
  currency: Currency;
  postPrice: number;
  commentPrice: number;
  ideaPrice: number;
  starterPrice: number;
  proPrice: number;
}

const pricingConfigs: Record<Currency, PricingConfig> = {
  INR: {
    currency: 'INR',
    postPrice: 8,
    commentPrice: 4,
    ideaPrice: 4,
    starterPrice: 249,
    proPrice: 649
  },
  USD: {
    currency: 'USD',
    postPrice: 0.35,
    commentPrice: 0.18,
    ideaPrice: 0.18,
    starterPrice: 10,
    proPrice: 19
  }
};

const presets: Record<PresetType, CreditSelection> = {
  starter: { posts: 15, comments: 30, ideas: 30 },
  pro: { posts: 60, comments: 80, ideas: 80 },
  '80': { posts: 80, comments: 80, ideas: 80 },
  '100': { posts: 100, comments: 100, ideas: 100 },
  custom: { posts: 10, comments: 10, ideas: 10 }
};

export const CreditSliderPricing = () => {
  const [currency, setCurrency] = useState<Currency>('USD');
  const [selectedPreset, setSelectedPreset] = useState<PresetType>('custom');
  const [credits, setCredits] = useState<CreditSelection>(presets.custom);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { processCreditPayment, isProcessing, isLoaded } = useCreditPayment();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // Auto-detect user's region
  useEffect(() => {
    const detectRegion = async () => {
      try {
        const geoData = await geoLocationService.detectUserLocation();
        setCurrency(geoData.currency);
      } catch (error) {
        console.log('Could not detect region, defaulting to USD');
        setCurrency('USD');
      }
    };

    detectRegion();
  }, []);

  const config = pricingConfigs[currency];
  const currencySymbol = currency === 'INR' ? '₹' : '$';

  // Calculate total price
  const calculatePrice = (selection: CreditSelection): number => {
    const totalPrice = 
      (selection.posts * config.postPrice) +
      (selection.comments * config.commentPrice) +
      (selection.ideas * config.ideaPrice);
    
    return Math.round(totalPrice * 100) / 100; // Round to 2 decimal places
  };

  // Check if current selection matches preset plans
  const isStarterPlan = credits.posts === presets.starter.posts && 
                       credits.comments === presets.starter.comments && 
                       credits.ideas === presets.starter.ideas;

  const isProPlan = credits.posts === presets.pro.posts && 
                   credits.comments === presets.pro.comments && 
                   credits.ideas === presets.pro.ideas;

  const getDisplayPrice = (): number => {
    if (isStarterPlan) return config.starterPrice;
    if (isProPlan) return config.proPrice;
    return calculatePrice(credits);
  };

  const getPlanName = (): string => {
    if (isStarterPlan) return 'Starter Plan';
    if (isProPlan) return 'Pro Plan';
    return 'Custom Plan';
  };

  const handlePresetClick = (preset: PresetType) => {
    setSelectedPreset(preset);
    setCredits(presets[preset]);
  };

  const handleSliderChange = (type: keyof CreditSelection, value: number[]) => {
    const newCredits = { ...credits, [type]: value[0] };
    setCredits(newCredits);
    
    // Check if this matches any preset
    const matchingPreset = Object.entries(presets).find(([_, preset]) => 
      preset.posts === newCredits.posts && 
      preset.comments === newCredits.comments && 
      preset.ideas === newCredits.ideas
    );
    
    if (matchingPreset) {
      setSelectedPreset(matchingPreset[0] as PresetType);
    } else {
      setSelectedPreset('custom');
    }
  };

  const handleSubscribe = async () => {
    // Check authentication first
    if (!isAuthenticated) {
      toast.error('Please log in to start your free trial');
      navigate('/auth/login', { state: { returnTo: '/pricing' } });
      return;
    }

    if (!isLoaded) {
      toast.error('Payment system not ready. Please try again.');
      return;
    }

    try {
      // Check profile completion first
      const profileStatus = await api.getProfileStatus();
      if (!profileStatus.success || !profileStatus.data.isComplete) {
        toast.error('Please complete your profile setup first');
        navigate('/profile-setup');
        return;
      }

      // Validate credits first
      const validation = await api.validateCredits(credits);
      if (!validation.success || !validation.data.isValid) {
        toast.error('Invalid credit selection. Please check your inputs.');
        return;
      }

      // Process payment with Razorpay
      await processCreditPayment(credits, currency, 'monthly');
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error('Failed to process subscription. Please try again.');
    }
  };

  const formatPrice = (price: number): string => {
    return geoLocationService.formatPrice(price, currency);
  };

  return (
    <section id="pricing" className="py-12 sm:py-16 md:py-24 gradient-hero">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8 sm:mb-12 space-y-3 sm:space-y-4">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold px-4">
            Customize Your{" "}
            <span className="text-gradient-premium-world-class">
              Perfect Plan
            </span>
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto px-4">
            Select posts, comments, and ideas-pay only for what you use. 
            Plans and pricing auto-adjust for your region and currency.
          </p>
          
          {/* Pricing Tiers Explanation */}
          <div className="max-w-4xl mx-auto mt-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg">
                <h4 className="font-semibold text-blue-700 dark:text-blue-300 mb-2">Starter Plan</h4>
                <p className="text-blue-600 dark:text-blue-400">Perfect for beginners. 15 posts, 30 comments, 30 ideas monthly.</p>
              </div>
              <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg">
                <h4 className="font-semibold text-purple-700 dark:text-purple-300 mb-2">Pro Plan</h4>
                <p className="text-purple-600 dark:text-purple-400">Best for professionals. 60 posts, 80 comments, 80 ideas monthly.</p>
              </div>
              <div className="p-4 bg-gradient-to-r from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20 rounded-lg">
                <h4 className="font-semibold text-pink-700 dark:text-pink-300 mb-2">Custom Plans</h4>
                <p className="text-pink-600 dark:text-pink-400">Flexible options. Choose your own mix of posts, comments, and ideas.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Currency Toggle */}
        <div className="flex justify-center gap-2 mb-8">
          <Button
            variant={currency === 'INR' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCurrency('INR')}
            className="gap-2"
          >
            <IndianRupee className="h-4 w-4" />
            India (INR)
          </Button>
          <Button
            variant={currency === 'USD' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCurrency('USD')}
            className="gap-2"
          >
            <Globe className="h-4 w-4" />
            International (USD)
          </Button>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Preset Buttons */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <Button
              variant={selectedPreset === 'starter' ? 'default' : 'outline'}
              onClick={() => handlePresetClick('starter')}
              className="gap-2 min-w-[120px]"
            >
              <Zap className="h-4 w-4" />
              Starter
              <Badge variant="secondary" className="ml-1 text-xs">
                {currency === 'INR' ? '₹249' : '$10'}
              </Badge>
            </Button>
            <Button
              variant={selectedPreset === 'pro' ? 'default' : 'outline'}
              onClick={() => handlePresetClick('pro')}
              className="gap-2 min-w-[120px]"
            >
              <Rocket className="h-4 w-4" />
              Pro
              <Badge variant="secondary" className="ml-1 text-xs">
                {currency === 'INR' ? '₹649' : '$19'}
              </Badge>
            </Button>
            <Button
              variant={selectedPreset === '80' ? 'default' : 'outline'}
              onClick={() => handlePresetClick('80')}
              className="gap-2 min-w-[120px]"
            >
              <Star className="h-4 w-4" />
              80 Pack
            </Button>
            <Button
              variant={selectedPreset === '100' ? 'default' : 'outline'}
              onClick={() => handlePresetClick('100')}
              className="gap-2 min-w-[120px]"
            >
              <Crown className="h-4 w-4" />
              100 Pack
            </Button>
            <Button
              variant={selectedPreset === 'custom' ? 'default' : 'outline'}
              onClick={() => handlePresetClick('custom')}
              className="gap-2 min-w-[120px]"
            >
              <Settings className="h-4 w-4" />
              Custom
            </Button>
          </div>

          {/* Credit Sliders */}
          <Card className="p-8 mb-8 gradient-card">
            <div className="space-y-8">
              {/* Posts Slider */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">LinkedIn Posts</h3>
                  <Badge variant="secondary" className="text-sm">
                    {credits.posts} posts/month
                  </Badge>
                </div>
                <div className="relative">
                  <Slider
                    value={[credits.posts]}
                    onValueChange={(value) => handleSliderChange('posts', value)}
                    min={10}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-2">
                    <span className="text-xs">Min: 10</span>
                    <span className="text-xs font-medium">Current: {credits.posts}</span>
                    <span className="text-xs">Max: 100</span>
                  </div>
                </div>
              </div>

              {/* Comments Slider */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">LinkedIn Comments</h3>
                  <Badge variant="secondary" className="text-sm">
                    {credits.comments} comments/month
                  </Badge>
                </div>
                <div className="relative">
                  <Slider
                    value={[credits.comments]}
                    onValueChange={(value) => handleSliderChange('comments', value)}
                    min={10}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-2">
                    <span className="text-xs">Min: 10</span>
                    <span className="text-xs font-medium">Current: {credits.comments}</span>
                    <span className="text-xs">Max: 100</span>
                  </div>
                </div>
              </div>

              {/* Ideas Slider */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Content Ideas</h3>
                  <Badge variant="secondary" className="text-sm">
                    {credits.ideas} ideas/month
                  </Badge>
                </div>
                <div className="relative">
                  <Slider
                    value={[credits.ideas]}
                    onValueChange={(value) => handleSliderChange('ideas', value)}
                    min={10}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-2">
                    <span className="text-xs">Min: 10</span>
                    <span className="text-xs font-medium">Current: {credits.ideas}</span>
                    <span className="text-xs">Max: 100</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Price Display */}
          <Card className="p-8 mb-8 gradient-card border-primary">
            <div className="text-center space-y-4">
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">{getPlanName()}</h3>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-5xl font-bold text-primary">
                    {formatPrice(getDisplayPrice())}
                  </span>
                  <span className="text-xl text-muted-foreground">/month</span>
                </div>
              </div>

              <div className="space-y-2 text-sm text-muted-foreground">
                <p>You selected: {credits.posts} posts, {credits.comments} comments, {credits.ideas} ideas</p>
                <p className="flex items-center justify-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  Only pay for what you use. Scale up or down any time.
                </p>
                {isStarterPlan && (
                  <p className="text-center text-primary font-medium">
                    ✨ Perfect for beginners - Great value with essential features
                  </p>
                )}
                {isProPlan && (
                  <p className="text-center text-primary font-medium">
                    🚀 Best for professionals - Maximum productivity and features
                  </p>
                )}
                {selectedPreset === '80' && (
                  <p className="text-center text-primary font-medium">
                    ⭐ Balanced package - Great for regular content creators
                  </p>
                )}
                {selectedPreset === '100' && (
                  <p className="text-center text-primary font-medium">
                    👑 Premium package - For power users and agencies
                  </p>
                )}
              </div>

              {/* Breakdown */}
              {!isStarterPlan && !isProPlan && (
                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-2">Price Breakdown:</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>{credits.posts} posts × {formatPrice(config.postPrice)}</span>
                      <span>{formatPrice(credits.posts * config.postPrice)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{credits.comments} comments × {formatPrice(config.commentPrice)}</span>
                      <span>{formatPrice(credits.comments * config.commentPrice)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{credits.ideas} ideas × {formatPrice(config.ideaPrice)}</span>
                      <span>{formatPrice(credits.ideas * config.ideaPrice)}</span>
                    </div>
                    <div className="flex justify-between font-semibold border-t pt-1">
                      <span>Total</span>
                      <span>{formatPrice(calculatePrice(credits))}</span>
                    </div>
                  </div>
                </div>
              )}

              <Button 
                onClick={handleSubscribe}
                disabled={isProcessing || !isLoaded}
                className={`${premiumCTAClasses} mt-6 w-full ${(isProcessing || !isLoaded) ? 'pointer-events-none opacity-60' : ''}`}
              >
                <span className={premiumCTAHighlight} />
                <span className="relative">
                  {isProcessing ? 'Processing Payment...' : !isLoaded ? 'Loading Payment System...' : 'Start Free Trial'}
                </span>
                <ArrowRight className={premiumCTAIcon} />
              </Button>

              <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Check className="w-3 h-3 text-primary" />
                  7-day free trial
                </span>
                <span className="flex items-center gap-1">
                  <Check className="w-3 h-3 text-primary" />
                  No credit card required
                </span>
                <span className="flex items-center gap-1">
                  <Check className="w-3 h-3 text-primary" />
                  Cancel anytime
                </span>
              </div>
            </div>
          </Card>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6 gradient-card">
              <h3 className="text-lg font-semibold mb-4">What's Included</h3>
              <div className="space-y-3">
                {[
                  "LinkedIn-trained AI models (not generic ChatGPT)",
                  "Human-like posts that beat AI detectors",
                  "15 curated AI personas + your onboarding persona",
                  "Viral hook suggestions with every post",
                  "Smart emoji placement & auto-formatting",
                  "Copy & share directly to LinkedIn (1-click)",
                  "Zero-edit content ready to post instantly",
                  "Export & download posts with formatting",
                  "Unlimited profile analyses",
                  "Responsive support by email",
                  "Advanced comment generation",
                  "Content idea brainstorming",
                  "Multi-language support",
                  "Mobile-optimized interface"
                ].map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6 gradient-card">
              <h3 className="text-lg font-semibold mb-4">Plan Benefits</h3>
              <div className="space-y-3">
                {[
                  "Flexible credit system - use what you need",
                  "Auto-renewal with usage tracking",
                  "Scale up or down anytime",
                  "Region-appropriate pricing",
                  "Secure payment processing",
                  "Monthly credit reset",
                  "Usage analytics dashboard",
                  "Priority support available",
                  "Early access to new features",
                  "Money-back guarantee",
                  "No long-term contracts",
                  "Cancel anytime",
                  "7-day free trial",
                  "No credit card required for trial"
                ].map((benefit, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                    <span className="text-sm">{benefit}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};
