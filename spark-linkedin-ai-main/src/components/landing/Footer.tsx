import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { X, Gift, Users, Star, FileText, MessageSquare, Lightbulb, BarChart3, Type, FileVideo } from "lucide-react";
import { LogoWithText } from "../LogoWithText";

export const Footer = () => {
  const navigate = useNavigate();
  const [isBannerVisible, setIsBannerVisible] = useState(true);

  const handleCloseBanner = () => {
    setIsBannerVisible(false);
  };

  // Auto-dismiss banner after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsBannerVisible(false);
    }, 3000); // 3 seconds

    return () => clearTimeout(timer); // Cleanup on unmount
  }, []);

  return (
    <>
      {/* Referral Offer Banner */}
      {isBannerVisible && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-4 shadow-2xl border-t border-white/10 backdrop-blur-sm">
          <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-white text-center sm:text-left flex-1">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                  <Star className="h-4 w-4 text-white" />
                </div>
                <span className="font-bold text-base sm:text-lg">Referral Program</span>
              </div>
              <div className="text-sm sm:text-base opacity-95">
                Refer friends and get <span className="font-bold text-yellow-300">1 month FREE</span> for every friend who becomes a paying customer
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                size="sm" 
                onClick={() => navigate('/referral')}
                className="bg-white text-blue-600 hover:bg-gray-50 shadow-lg hover:shadow-xl font-semibold px-6 py-2 rounded-lg transition-all duration-200 hover:scale-105"
              >
                <Users className="h-4 w-4 mr-2" />
                Invite Friends
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCloseBanner}
                className="text-white hover:bg-white/20 p-2 h-8 w-8 rounded-full transition-all"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Main Footer */}
      <footer className={`bg-secondary/30 border-t ${isBannerVisible ? 'pb-20 sm:pb-24' : 'pb-8 sm:pb-12'}`}>
        <div className="container mx-auto px-4 py-8 sm:py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6 sm:gap-8">
            <div className="space-y-4">
              <LogoWithText 
                textSize="md"
                showLink={true}
                to="/"
              />
              <p className="text-sm text-muted-foreground">
                Amplify your LinkedIn presence with AI-powered content that feels authentically you.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">LinkedIn Free Tools</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/tools" className="hover:text-foreground transition-smooth flex items-center gap-2"><FileText className="h-3 w-3 shrink-0" /> All LinkedIn Free Tools</Link></li>
                <li><Link to="/tools/video-transcript-generator" className="hover:text-foreground transition-smooth flex items-center gap-2"><FileVideo className="h-3 w-3 shrink-0" /> Video Transcript Generator</Link></li>
                <li><Link to="/tools/linkedin-post-generator" className="hover:text-foreground transition-smooth flex items-center gap-2"><FileText className="h-3 w-3 shrink-0" /> LinkedIn Post Generator</Link></li>
                <li><Link to="/tools/linkedin-engagement-rate-calculator" className="hover:text-foreground transition-smooth flex items-center gap-2"><BarChart3 className="h-3 w-3 shrink-0" /> LinkedIn Engagement Calculator</Link></li>
                <li><Link to="/tools/linkedin-text-formatter" className="hover:text-foreground transition-smooth flex items-center gap-2"><Type className="h-3 w-3 shrink-0" /> LinkedIn Text Formatter</Link></li>
                <li><Link to="/#free-generator" className="hover:text-foreground transition-smooth flex items-center gap-2"><MessageSquare className="h-3 w-3 shrink-0" /> LinkedIn Comment Generator</Link></li>
                <li><Link to="/#free-generator" className="hover:text-foreground transition-smooth flex items-center gap-2"><Lightbulb className="h-3 w-3 shrink-0" /> LinkedIn Idea Generator</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-smooth">Features</a></li>
                <li><a href="#pricing" className="hover:text-foreground transition-smooth">Pricing</a></li>
                <li><Link to="/blogs" className="hover:text-foreground transition-smooth">Blog</Link></li>
                <li><Link to="/resources" className="hover:text-foreground transition-smooth">Resources</Link></li>
                <li><Link to="/templates" className="hover:text-foreground transition-smooth">Templates</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/about" className="hover:text-foreground transition-smooth">About</Link></li>
                <li><Link to="/contact" className="hover:text-foreground transition-smooth">Contact</Link></li>
                <li><Link to="/affiliate" className="hover:text-foreground transition-smooth">Affiliate Program</Link></li>
                <li><Link to="/privacy" className="hover:text-foreground transition-smooth">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-foreground transition-smooth">Terms of Service</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Why Us</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/blogs/linkedinpulse-vs-chatgpt" className="hover:text-foreground transition-smooth">vs ChatGPT</Link></li>
                <li><Link to="/blogs/linkedinpulse-vs-taplio" className="hover:text-foreground transition-smooth">vs Taplio</Link></li>
                <li><Link to="/blogs/linkedinpulse-vs-hootsuite" className="hover:text-foreground transition-smooth">vs Hootsuite</Link></li>
                <li><Link to="/blogs/linkedinpulse-vs-authoredup" className="hover:text-foreground transition-smooth">vs AuthoredUp</Link></li>
                <li><Link to="/blogs/linkedinpulse-vs-kleo" className="hover:text-foreground transition-smooth">vs Kleo</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Built For</h3>
              <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                <li><Link to="/blogs/linkedin-creators-guide" className="hover:text-foreground transition-smooth">LinkedIn Creators</Link></li>
                <li><Link to="/blogs/founders-ceos-guide" className="hover:text-foreground transition-smooth">Founders & CEOs</Link></li>
                <li><Link to="/blogs/freelancers-guide" className="hover:text-foreground transition-smooth">Freelancers</Link></li>
                <li><Link to="/blogs/recruiters-guide" className="hover:text-foreground transition-smooth">Recruiters</Link></li>
                <li><Link to="/blogs/sales-reps-guide" className="hover:text-foreground transition-smooth">Sales Reps</Link></li>
              </ul>
              {/* Product Hunt Badge */}
              <a 
                href="https://www.producthunt.com/products/linkedinpulse?embed=true&utm_source=badge-featured&utm_medium=badge&utm_source=badge-linkedinpulse" 
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block hover:opacity-80 transition-opacity"
              >
                <img 
                  src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1030934&theme=light&t=1761584253218" 
                  alt="Engagematic - AI Content &#0043; Analytics for LinkedIn Creators&#0044; Free | Product Hunt" 
                  style={{ width: '250px', height: '54px' }} 
                  width="250" 
                  height="54" 
                />
              </a>
            </div>
          </div>
          
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>© 2025 Engagematic. All rights reserved. Built with 💙 for LinkedIn creators.</p>
            <p className="text-xs text-muted-foreground/80 mt-2">
              Engagematic© is not affiliated, associated, authorized, endorsed by, or in any way officially connected with LinkedIn Corporation.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
};
