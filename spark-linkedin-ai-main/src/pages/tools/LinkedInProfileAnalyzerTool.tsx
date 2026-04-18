import { useState, useEffect } from "react";
import { SEO } from "@/components/SEO";
import { SITE_URL, generateFAQSchema, generateBreadcrumbSchema } from "@/constants/seo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  UserCircle, 
  CheckCircle2, 
  TrendingUp, 
  FileText,
  Sparkles,
  ArrowRight,
  Loader2,
  AlertCircle
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import apiClient from "@/services/api";
import { useToast } from "@/hooks/use-toast";

const faqData = [
  {
    question: "Is the LinkedIn Profile Analyzer really free?",
    answer: "Yes! You get 1 completely free LinkedIn profile analysis without any signup required. Simply enter your LinkedIn profile URL and get instant results. If you want more analyses, you can create a free account to get additional free analyses, or upgrade to a paid plan for unlimited analyses."
  },
  {
    question: "What does the profile analyzer check?",
    answer: "Our AI-powered analyzer evaluates your LinkedIn profile across multiple dimensions: headline optimization, about section quality, experience section completeness, skills relevance, keyword optimization, profile completeness, and overall professional presence. You'll receive a score out of 100 with detailed, actionable recommendations."
  },
  {
    question: "How accurate is the profile score?",
    answer: "Our analyzer is trained on thousands of successful LinkedIn profiles and uses advanced AI to provide accurate assessments. The score reflects how well your profile is optimized for LinkedIn's algorithm, recruiter searches, and professional networking. While the score is a helpful indicator, the detailed recommendations are where the real value lies."
  },
  {
    question: "Do I need to make my LinkedIn profile public?",
    answer: "Yes, for the analyzer to work, your LinkedIn profile needs to be publicly visible. If your profile is private, the analyzer won't be able to access your information. You can make your profile public temporarily for the analysis, then adjust privacy settings afterward if needed."
  },
  {
    question: "Can I export my analysis results?",
    answer: "Yes! After your analysis is complete, you can download a comprehensive PDF report that includes your score, all recommendations, optimized sections, and action items. This makes it easy to reference the suggestions while updating your profile."
  },
  {
    question: "How often should I analyze my LinkedIn profile?",
    answer: "We recommend analyzing your profile whenever you make significant updates, such as changing your headline, updating your about section, adding new experiences, or modifying your skills. Regular analysis (every 3-6 months) helps ensure your profile stays optimized as LinkedIn's algorithm evolves."
  }
];

const LinkedInProfileAnalyzerTool = () => {
  // Component disabled temporarily - redirect to home
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect to home page
    navigate("/");
  }, [navigate]);
  
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <h1 className="text-2xl font-bold mb-4">This tool is temporarily unavailable</h1>
      <p className="text-muted-foreground mb-4">The LinkedIn Profile Analyzer is currently being updated.</p>
      <Link to="/">
        <Button>Go to Home</Button>
      </Link>
    </div>
  );

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Free Tools", url: `${SITE_URL}/tools` },
    { name: "LinkedIn Profile Analyzer", url: `${SITE_URL}/tools/linkedin-profile-analyzer` }
  ]);

  const faqSchema = generateFAQSchema(faqData);

  const toolSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Free LinkedIn Profile Analyzer",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "1250",
      "bestRating": "5",
      "worstRating": "1"
    },
    "description": "Get instant AI-powered analysis of your LinkedIn profile. Discover your profile score, receive personalized optimization tips, and boost your visibility. 100% free, no signup required for first analysis.",
    "url": `${SITE_URL}/tools/linkedin-profile-analyzer`,
    "featureList": [
      "Instant profile score (0-100)",
      "Headline optimization suggestions",
      "About section rewrite recommendations",
      "Skills optimization",
      "Experience section feedback",
      "Keywords for better discoverability",
      "Exportable PDF report"
    ]
  };

  const structuredData = [toolSchema, breadcrumbSchema, faqSchema];

  const handleAnalyze = async () => {
    if (!profileUrl.trim()) {
      setError("Please enter a LinkedIn profile URL");
      return;
    }

    if (!profileUrl.includes("linkedin.com/in/")) {
      setError("Please enter a valid LinkedIn profile URL (e.g., https://www.linkedin.com/in/username)");
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await apiClient.analyzeProfileWithCoachTest(profileUrl);
      
      if (response && response.data) {
        // Navigate to profile analyzer page with results
        navigate("/profile-analyzer", { 
          state: { 
            analysisResult: response.data,
            profileUrl: profileUrl 
          } 
        });
      } else {
        throw new Error("Analysis failed. Please try again.");
      }
    } catch (err: any) {
      console.error("Analysis error:", err);
      const errorMessage = err.message || "Failed to analyze profile. Please check the URL and try again.";
      setError(errorMessage);
      toast({
        title: "Analysis Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-background">
      <SEO
        title="Free LinkedIn Profile Analyzer - Get Your Profile Score & Optimization Tips | Engagematic"
        description="Analyze your LinkedIn profile for free. Get instant AI-powered score (0-100), headline optimization, about section rewrite, skills recommendations, and exportable PDF report. No signup required for first analysis."
        keywords="free linkedin profile analyzer, linkedin profile score, linkedin profile checker, linkedin profile optimization, linkedin profile analyzer free, linkedin profile analyzer tool, linkedin profile analysis, linkedin profile review, linkedin profile audit, linkedin profile grader"
        url={`${SITE_URL}/tools/linkedin-profile-analyzer`}
        structuredData={structuredData}
      />

      {/* Hero Section */}
      <section className="relative py-12 sm:py-16 lg:py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-cyan-500/10 to-blue-500/10 blur-3xl" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 max-w-4xl">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
              <Sparkles className="w-3 h-3 mr-1" />
              100% Free - No Signup Required
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Free LinkedIn Profile Analyzer
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Get instant AI-powered analysis of your LinkedIn profile. Discover your profile score, 
              receive personalized optimization tips, and boost your visibility-all completely free.
            </p>
          </div>

          {/* Analysis Tool */}
          <Card className="border-2 shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <UserCircle className="w-6 h-6 text-blue-600" />
                Analyze Your LinkedIn Profile
              </CardTitle>
              <CardDescription>
                Enter your LinkedIn profile URL to get instant analysis and optimization recommendations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="url"
                  placeholder="https://www.linkedin.com/in/your-profile"
                  value={profileUrl}
                  onChange={(e) => setProfileUrl(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAnalyze()}
                  className="text-lg"
                />
                {error && (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="w-4 h-4" />
                    <span>{error}</span>
                  </div>
                )}
              </div>
              <Button 
                onClick={handleAnalyze} 
                disabled={isAnalyzing || !profileUrl.trim()}
                size="lg"
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing Profile...
                  </>
                ) : (
                  <>
                    Analyze Profile Free
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                By analyzing, you agree to our Terms of Service. Your profile data is processed securely.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">
            What You'll Get in Your Analysis
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: TrendingUp,
                title: "Profile Score (0-100)",
                description: "Get an instant score showing how well your profile is optimized for LinkedIn's algorithm and recruiter searches."
              },
              {
                icon: FileText,
                title: "Headline Optimization",
                description: "Receive specific suggestions to rewrite your headline for maximum impact and keyword visibility."
              },
              {
                icon: UserCircle,
                title: "About Section Rewrite",
                description: "Get a complete, copy-paste ready optimized about section tailored to your professional persona."
              },
              {
                icon: CheckCircle2,
                title: "Skills Recommendations",
                description: "Discover which skills to add or prioritize to improve your profile's searchability and credibility."
              },
              {
                icon: Sparkles,
                title: "Experience Feedback",
                description: "Get 2-line content strategy tips for each experience section to maximize visibility and impact."
              },
              {
                icon: FileText,
                title: "PDF Report Export",
                description: "Download a comprehensive PDF report with all recommendations and optimized content for easy reference."
              }
            ].map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 sm:py-16 lg:py-20 bg-muted/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">
            How It Works
          </h2>
          <div className="space-y-8">
            {[
              {
                step: "1",
                title: "Enter Your Profile URL",
                description: "Simply paste your LinkedIn profile URL (e.g., linkedin.com/in/yourname) into the analyzer above."
              },
              {
                step: "2",
                title: "AI Analysis in Seconds",
                description: "Our AI analyzes your profile across multiple dimensions using insights from thousands of successful profiles."
              },
              {
                step: "3",
                title: "Get Actionable Results",
                description: "Receive your profile score, detailed recommendations, and copy-paste ready optimized content sections."
              },
              {
                step: "4",
                title: "Export & Implement",
                description: "Download your PDF report and start implementing the recommendations to boost your LinkedIn presence."
              }
            ].map((step) => (
              <Card key={step.step} className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                    {step.step}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                    <p className="text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {faqData.map((faq, index) => (
              <Card key={index} className="p-6">
                <h3 className="text-lg font-bold mb-3">{faq.question}</h3>
                <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-blue-500/10 via-cyan-500/10 to-blue-500/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to Optimize Your LinkedIn Profile?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Get started with your free analysis now. No signup required. Results in seconds.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/tools">
              <Button size="lg" variant="outline">
                View All Free Tools
              </Button>
            </Link>
            <Link to="/pricing">
              <Button size="lg">
                Upgrade for Unlimited Analyses
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LinkedInProfileAnalyzerTool;
// */ // END DISABLED

