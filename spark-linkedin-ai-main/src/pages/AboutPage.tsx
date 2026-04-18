import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, Users, Target, Heart, ArrowRight, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { premiumCTAClasses, premiumCTAHighlight, premiumCTAIcon, premiumOutlineCTAClasses } from "@/styles/premiumButtons";
import { SEO } from "@/components/SEO";
import { PAGE_SEO } from "@/constants/seo";

const AboutPage = () => {
  return (
    <div className="min-h-screen gradient-hero overflow-x-hidden">
      <SEO {...PAGE_SEO.about} />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 px-2">
            About{" "}
            <span className="text-gradient-premium-world-class">Engagematic</span>
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto px-4">
            We're on a mission to help professionals build authentic, engaging LinkedIn presences that drive real business results.
          </p>
        </div>

        {/* Mission Section */}
        <div className="mb-12 sm:mb-16">
          <Card className="p-4 sm:p-6 lg:p-8 gradient-card shadow-card overflow-hidden">
            <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 items-center">
              <div>
                <Badge className="mb-3 sm:mb-4 gradient-pulse">Our Mission</Badge>
                <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 break-words">
                  Empowering Professionals to Build Authentic LinkedIn Presence
                </h2>
                <p className="text-sm sm:text-base lg:text-lg text-muted-foreground mb-4 sm:mb-6 break-words">
                  LinkedIn has become the world's largest professional network, but most professionals struggle to create content that resonates and drives engagement. We believe that authentic, AI-assisted content creation is the future of professional networking.
                </p>
                <p className="text-sm sm:text-base lg:text-lg text-muted-foreground mb-4 sm:mb-6 break-words">
                  Engagematic combines the power of artificial intelligence with human authenticity to help you create content that sounds like you, engages your audience, and builds meaningful professional relationships.
                </p>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                  <Link to="/auth/register" className="w-full sm:w-auto">
                    <Button size="lg" className="gap-2 w-full sm:w-auto">
                      Start Your Journey
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link to="/blogs" className="w-full sm:w-auto">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto">
                      Read Our Blog
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="relative order-first lg:order-last">
                <div className="w-full h-48 sm:h-64 lg:h-96 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg flex items-center justify-center">
                  <Activity className="h-20 w-20 sm:h-24 sm:w-24 lg:h-32 lg:w-32 text-primary/50" />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Values Section */}
        <div className="mb-12 sm:mb-16">
          <div className="text-center mb-8 sm:mb-12 px-4">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">Our Core Values</h2>
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto break-words">
              These principles guide everything we do and every decision we make.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <Card className="p-4 sm:p-6 gradient-card shadow-card hover-lift text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl gradient-pulse flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-pulse">
                <Heart className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3">Authenticity</h3>
              <p className="text-sm sm:text-base text-muted-foreground break-words">
                We believe in authentic content that reflects your true voice and values, not generic AI-generated text.
              </p>
            </Card>
            <Card className="p-4 sm:p-6 gradient-card shadow-card hover-lift text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl gradient-pulse flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-pulse">
                <Target className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3">Results-Driven</h3>
              <p className="text-sm sm:text-base text-muted-foreground break-words">
                Every feature we build is designed to help you achieve measurable results in your professional growth.
              </p>
            </Card>
            <Card className="p-4 sm:p-6 gradient-card shadow-card hover-lift text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl gradient-pulse flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-pulse">
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3">Community First</h3>
              <p className="text-sm sm:text-base text-muted-foreground break-words">
                We're building a community of professionals who support and learn from each other's LinkedIn journeys.
              </p>
            </Card>
            <Card className="p-4 sm:p-6 gradient-card shadow-card hover-lift text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl gradient-pulse flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-pulse">
                <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3">Innovation</h3>
              <p className="text-sm sm:text-base text-muted-foreground break-words">
                We continuously innovate to stay ahead of LinkedIn's algorithm and provide cutting-edge content strategies.
              </p>
            </Card>
          </div>
        </div>

        {/* Story Section */}
        <div className="mb-12 sm:mb-16">
          <Card className="p-4 sm:p-6 lg:p-8 gradient-card shadow-card overflow-hidden">
            <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 items-center">
              <div className="relative order-first">
                <div className="w-full h-48 sm:h-64 lg:h-96 bg-gradient-to-br from-secondary/20 to-primary/20 rounded-lg flex items-center justify-center">
                  <Users className="h-20 w-20 sm:h-24 sm:w-24 lg:h-32 lg:w-32 text-secondary/50" />
                </div>
              </div>
              <div>
                <Badge className="mb-3 sm:mb-4 gradient-pulse">Our Story</Badge>
                <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 break-words">
                  Born from Real Professional Challenges
                </h2>
                <p className="text-sm sm:text-base lg:text-lg text-muted-foreground mb-4 sm:mb-6 break-words">
                  Engagematic was founded by a team of marketing professionals who struggled with creating consistent, engaging LinkedIn content. We spent hours crafting posts that barely got any engagement, while watching others effortlessly build massive followings.
                </p>
                <p className="text-sm sm:text-base lg:text-lg text-muted-foreground mb-4 sm:mb-6 break-words">
                  We realized that the problem wasn't lack of expertise-it was lack of time, consistency, and the right tools. That's when we decided to build Engagematic: a platform that combines AI efficiency with human authenticity.
                </p>
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                    <span className="text-sm sm:text-base break-words">Founded by LinkedIn marketing experts</span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                    <span className="text-sm sm:text-base break-words">Used by 10,000+ professionals worldwide</span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                    <span className="text-sm sm:text-base break-words">Featured in Forbes, Entrepreneur, and TechCrunch</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Stats Section */}
        <div className="mb-12 sm:mb-16">
          <Card className="p-4 sm:p-6 lg:p-8 gradient-card shadow-card overflow-hidden">
            <div className="text-center mb-6 sm:mb-8 px-4">
              <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">Our Impact</h2>
              <p className="text-sm sm:text-base lg:text-lg text-muted-foreground break-words">
                Numbers that reflect our commitment to helping professionals succeed on LinkedIn.
              </p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary mb-1 sm:mb-2">10,000+</div>
                <div className="text-xs sm:text-sm lg:text-base text-muted-foreground">Active Users</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary mb-1 sm:mb-2">2.5M+</div>
                <div className="text-xs sm:text-sm lg:text-base text-muted-foreground">Posts Generated</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary mb-1 sm:mb-2">85%</div>
                <div className="text-xs sm:text-sm lg:text-base text-muted-foreground">Engagement Increase</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary mb-1 sm:mb-2">50+</div>
                <div className="text-xs sm:text-sm lg:text-base text-muted-foreground">Countries Served</div>
              </div>
            </div>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="p-4 sm:p-6 lg:p-8 gradient-card shadow-card overflow-hidden">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 px-2 break-words">Ready to Transform Your LinkedIn Presence?</h2>
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground mb-4 sm:mb-6 max-w-2xl mx-auto px-4 break-words">
              Join thousands of professionals who are already using Engagematic to build authentic, engaging LinkedIn content that drives real results.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
              <Link to="/auth/register" className="w-full sm:w-auto">
                <Button className={`${premiumCTAClasses} w-full sm:w-auto`}>
                  <span className={premiumCTAHighlight} />
                  <span className="relative">Start Free Trial</span>
                  <ArrowRight className={premiumCTAIcon} />
                </Button>
              </Link>
              <Link to="/contact" className="w-full sm:w-auto">
                <Button variant="ghost" className={`${premiumOutlineCTAClasses} w-full sm:w-auto`}>
                  <span className={premiumCTAHighlight} />
                  <span className="relative">Contact Us</span>
                  <ArrowRight className={premiumCTAIcon} />
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
