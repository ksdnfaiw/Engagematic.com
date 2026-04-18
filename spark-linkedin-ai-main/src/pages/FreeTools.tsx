import { SEO } from "@/components/SEO";
import { PAGE_SEO, SITE_URL, generateFAQSchema, generateBreadcrumbSchema } from "@/constants/seo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  MessageSquare, 
  Lightbulb,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Zap,
  TrendingUp,
  Users,
  BarChart3,
  Type,
  FileVideo
} from "lucide-react";
import { Link } from "react-router-dom";

const freeTools = [
  {
    id: "post-generator",
    name: "Free LinkedIn Post Generator",
    description: "Create viral-worthy LinkedIn posts in seconds with AI trained on 50,000+ high-performing posts. No signup required for your first post.",
    icon: FileText,
    url: "/tools/linkedin-post-generator",
    features: [
      "AI-powered post generation",
      "15+ curated personas",
      "Viral hook suggestions",
      "Smart formatting",
      "Zero-edit ready content",
      "Multiple post variations",
      "Engagement optimization"
    ],
    keywords: "free linkedin post generator, linkedin post generator ai, linkedin content generator, ai linkedin posts, linkedin post creator",
    monthlySearches: "18,000+",
    color: "from-purple-500 to-pink-500"
  },
  {
    id: "engagement-calculator",
    name: "LinkedIn Engagement Rate Calculator",
    description: "Measure your LinkedIn engagement rate instantly, compare to benchmarks (organic, sponsored, company), and get actionable insights. Post engagement score checker included.",
    icon: BarChart3,
    url: "/tools/linkedin-engagement-rate-calculator",
    features: [
      "Engagement rate from any two values",
      "Benchmark comparison by channel",
      "Above/Average/Below category",
      "Post engagement score (0–100)",
      "Up to 3 actionable suggestions",
      "No login required"
    ],
    keywords: "linkedin engagement rate calculator, linkedin engagement rate, free linkedin analytics, linkedin metrics",
    monthlySearches: "8,000+",
    color: "from-blue-500 to-indigo-500"
  },
  {
    id: "text-formatter",
    name: "LinkedIn Text Formatter",
    description: "Format LinkedIn post text with bold, italic, underlined, strikethrough and more using Unicode. Copy and paste into posts or messages-no native formatting needed.",
    icon: Type,
    url: "/tools/linkedin-text-formatter",
    features: [
      "Bold, italic, sans, script styles",
      "Underline & strikethrough",
      "Numbered, bullet & checklist lists",
      "Real-time post preview",
      "Desktop & mobile preview toggle",
      "No login required"
    ],
    keywords: "linkedin text formatter, linkedin bold text, linkedin italic, format linkedin post, free linkedin formatter",
    monthlySearches: "6,000+",
    color: "from-purple-500 to-pink-500"
  },
  {
    id: "comment-generator",
    name: "Free LinkedIn Comment Generator",
    description: "Generate thoughtful, context-aware comments that start real conversations and build authentic professional relationships.",
    icon: MessageSquare,
    url: "/tools/linkedin-comment-generator",
    features: [
      "Context-aware comments",
      "Relationship-building tone",
      "Engagement-focused responses",
      "Multiple comment variations",
      "Professional networking",
      "Authentic conversation starters"
    ],
    keywords: "free linkedin comment generator, linkedin comment ai, linkedin engagement tool, linkedin networking tool",
    monthlySearches: "8,000+",
    color: "from-green-500 to-emerald-500"
  },
  {
    id: "idea-generator",
    name: "Free LinkedIn Idea Generator",
    description: "Never run out of content ideas. Get AI-powered hooks, angles, and topics tailored to your industry and audience.",
    icon: Lightbulb,
    url: "/tools/linkedin-idea-generator",
    features: [
      "Unlimited content ideas",
      "Industry-specific suggestions",
      "Viral hook generation",
      "Content angle recommendations",
      "Trending topic insights",
      "Audience-tailored ideas"
    ],
    keywords: "free linkedin idea generator, linkedin content ideas, linkedin post ideas, linkedin content inspiration",
    monthlySearches: "6,000+",
    color: "from-orange-500 to-amber-500"
  },
  {
    id: "video-transcript",
    name: "Free Video Transcript Generator",
    description: "Convert any video to text instantly. Paste a YouTube link, public MP4 URL, or upload a file. Get a clean transcript in seconds - powered by AI.",
    icon: FileVideo,
    url: "/tools/video-transcript-generator",
    features: [
      "YouTube & public video URLs",
      "File upload (MP4, MOV, WEBM)",
      "12+ language support",
      "Copy or download as .txt",
      "In-memory caching for speed",
      "No signup required"
    ],
    keywords: "free video transcript generator, video to text, youtube transcript, mp4 to text, video transcription free",
    monthlySearches: "12,000+",
    color: "from-cyan-500 to-blue-500"
  }
];

const faqData = [
  {
    question: "Are these LinkedIn tools really free?",
    answer: "Yes! All our LinkedIn tools offer free access. The Post Generator, Comment Generator, and Idea Generator offer free usage without requiring signup. You can upgrade to premium plans for unlimited access and advanced features."
  },
  {
    question: "Do I need to create an account to use free tools?",
    answer: "No account required for most free tools! You can use the LinkedIn Post Generator, Comment Generator, and Idea Generator without signing up. Create a free account to save your work and unlock more features."
  },
  {
    question: "What makes these LinkedIn tools different from others?",
    answer: "Our tools are powered by AI trained specifically on 50,000+ viral LinkedIn posts. Unlike generic AI tools, we understand LinkedIn's algorithm, B2B marketing dynamics, and what drives engagement. Every tool is designed to help you grow your professional presence authentically."
  },
  {
    question: "Can I use these tools for commercial purposes?",
    answer: "Yes! All our free tools can be used for personal and commercial purposes. Whether you're a freelancer, entrepreneur, marketer, or business owner, you're welcome to use our tools to enhance your LinkedIn presence and grow your business."
  },
  {
    question: "Will my data be stored when using free tools?",
    answer: "We respect your privacy. When using free tools without an account, your data is processed but not permanently stored. If you create an account, you can choose to save your generated content for future reference. We never share your data with third parties."
  }
];

const FreeTools = () => {
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Free Tools", url: `${SITE_URL}/tools` }
  ]);

  const faqSchema = generateFAQSchema(faqData);

  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": "Free LinkedIn Tools - Engagematic",
      "description": "Access free LinkedIn tools including post generator, comment generator, and idea generator. No signup required for most tools.",
      "url": `${SITE_URL}/tools`,
      "mainEntity": {
        "@type": "ItemList",
        "itemListElement": freeTools.map((tool, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "item": {
            "@type": "SoftwareApplication",
            "name": tool.name,
            "url": `${SITE_URL}${tool.url}`,
            "applicationCategory": "BusinessApplication",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            }
          }
        }))
      }
    },
    breadcrumbSchema,
    faqSchema
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-background">
      <SEO {...PAGE_SEO.freeTools} url={`${SITE_URL}/tools`} structuredData={structuredData} />

      {/* Hero Section */}
      <section className="relative py-16 sm:py-20 lg:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 blur-3xl" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 max-w-7xl">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-4 bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
              <Sparkles className="w-3 h-3 mr-1" />
              100% Free Tools
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-gradient-premium-world-class">
              Free LinkedIn Tools
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Boost your LinkedIn presence with our suite of free AI-powered tools. 
              No credit card required. Start optimizing your profile and creating engaging content today.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>No Signup Required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>100% Free Forever</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>Instant Results</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tools Grid */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {freeTools.map((tool) => {
              const Icon = tool.icon;
              return (
              return (
                <Link key={tool.id} to={tool.url} className="block group/link outline-none">
                  <Card className="group relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
                    <div className={`absolute inset-0 bg-gradient-to-br ${tool.color} opacity-0 group-hover/link:opacity-5 transition-opacity duration-300`} />
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center shadow-lg transform group-hover/link:scale-110 transition-transform duration-300`}>
                          <Icon className="w-7 h-7 text-white" />
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {tool.monthlySearches} searches/month
                        </Badge>
                      </div>
                      <CardTitle className="text-2xl mb-2 group-hover/link:text-primary transition-colors">{tool.name}</CardTitle>
                      <CardDescription className="text-base">{tool.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 mb-6">
                        {tool.features.map((feature, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="w-full">
                        <Button className="w-full group-hover/link:bg-primary group-hover/link:text-primary-foreground transition-colors" size="lg" variant="outline">
                          Use Free Tool
                          <ArrowRight className="ml-2 w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-muted/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Why Use Our Free LinkedIn Tools?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to grow your LinkedIn presence, completely free
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {[
              {
                icon: Zap,
                title: "Lightning Fast",
                description: "Get instant results. No waiting, no delays. Our AI-powered tools deliver results in seconds."
              },
              {
                icon: TrendingUp,
                title: "Proven Results",
                description: "Built with insights from 50,000+ viral LinkedIn posts. Our tools are trained on what actually works."
              },
              {
                icon: Users,
                title: "Trusted by Thousands",
                description: "Join 10,000+ professionals using our tools to grow their LinkedIn presence and advance their careers."
              }
            ].map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <Card key={index} className="text-center p-6">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{benefit.title}</h3>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </Card>
              );
            })}
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
      <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to Grow Your LinkedIn Presence?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Start using our free tools today. No credit card required. Upgrade anytime for unlimited access.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/tools/linkedin-post-generator">
              <Button size="lg" className="w-full sm:w-auto">
                Generate Free Posts
              </Button>
            </Link>
            <Link to="/tools/linkedin-text-formatter">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Format Post Text
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FreeTools;

