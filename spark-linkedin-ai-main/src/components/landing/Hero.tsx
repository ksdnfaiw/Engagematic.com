import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ArrowRight, Sparkles, Star } from "lucide-react";
import heroImage from "@/assets/hero-pulse.jpg";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

// Animated words for hero headline
const ROTATING_WORDS = ["Content", "Ideas", "Posts", "Comments", "Engagement", "Growth"];

export const Hero = () => {
  const navigate = useNavigate();
  
  // Animated word rotation
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentWordIndex((prev) => (prev + 1) % ROTATING_WORDS.length);
        setIsAnimating(false);
      }, 500);
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-[85vh] sm:min-h-[90vh] flex items-center overflow-hidden">
      {/* Premium gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/80 to-purple-50/60 dark:from-slate-950 dark:via-blue-950/50 dark:to-purple-950/40" />
      
      {/* Premium radial gradients for depth */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-400/20 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-purple-400/20 via-pink-400/15 to-transparent" />
      
      {/* Premium mesh gradient overlay */}
      <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_30%_20%,_rgba(99,102,241,0.15),transparent_50%)]" />
      <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_70%_80%,_rgba(168,85,247,0.15),transparent_50%)]" />
      
      {/* Subtle integration tile grid background (inspired style) */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.4] hidden md:block">
        <div className="absolute left-1/2 -translate-x-1/2 top-[-120px] rotate-6">
          <div className="grid grid-cols-8 lg:grid-cols-10 gap-2 lg:gap-3">
            {Array.from({ length: 70 }).map((_, i) => (
              <div
                key={i}
                className="h-8 w-8 lg:h-10 lg:w-10 rounded-xl border border-blue-200/30 dark:border-blue-800/30 bg-white/20 dark:bg-white/5 backdrop-blur-[2px] shadow-sm"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Premium animated glow accents - richer colors */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-gradient-to-br from-blue-500/20 via-indigo-500/15 to-purple-500/20 rounded-full blur-3xl animate-pulse-glow" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-br from-purple-500/20 via-pink-500/15 to-blue-500/20 rounded-full blur-3xl animate-pulse-glow animation-delay-1000" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-br from-indigo-400/10 via-purple-400/10 to-pink-400/10 rounded-full blur-3xl animate-pulse-glow animation-delay-500" />
      
      <div className="container mx-auto px-4 py-8 sm:py-12 lg:py-16 relative z-10">
        {/* Centered Hero Content */}
        <div className="max-w-4xl mx-auto text-center space-y-5 sm:space-y-6 lg:space-y-8 animate-fade-in-up">
          <Badge className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-purple-950/30 text-blue-700 dark:text-blue-300 border-2 border-blue-200/50 dark:border-blue-800/50 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="font-semibold bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 dark:from-blue-300 dark:via-indigo-300 dark:to-purple-300 bg-clip-text text-transparent">
              7-Day Free Trial • No Credit Card Required
            </span>
          </Badge>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight tracking-tight px-4">
            Never Run Out of{" "}
            <span 
              className={`inline-block text-gradient-premium-world-class transition-all duration-500 ${
                isAnimating ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
              }`}
              style={{ 
                minWidth: '200px', 
                display: 'inline-block'
              }}
            >
              {ROTATING_WORDS[currentWordIndex]}
            </span>{" "}
            Again.
          </h1>
          
          <p className="text-lg sm:text-xl lg:text-2xl text-muted-foreground max-w-2xl leading-relaxed mx-auto px-4">
            <span className="text-foreground font-semibold">AI that writes in your voice.</span> Show up. Stand out.
          </p>

          {/* CTA Buttons - World-Class SaaS Design */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center px-4">
            <Button 
              onClick={() => {
                const generatorSection = document.getElementById('free-generator');
                generatorSection?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="group relative h-12 sm:h-12 px-8 sm:px-10 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold text-[15px] sm:text-base rounded-lg shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 w-full sm:w-auto"
            >
              <span className="relative z-10 flex items-center">
                Try It Free
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
              {/* Shine effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out rounded-lg" />
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate("/auth/register")}
              className="group h-12 sm:h-12 px-8 sm:px-10 bg-white hover:bg-gray-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-gray-900 dark:text-gray-100 font-semibold text-[15px] sm:text-base border border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 w-full sm:w-auto"
            >
              Sign Up
              <ArrowRight className="ml-2 h-4 w-4 text-gray-600 dark:text-gray-400 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>

          {/* Key Benefits */}
          <div className="flex flex-col gap-2 sm:gap-3 pt-1 sm:pt-2 px-4">
            <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-muted-foreground">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              <span className="font-semibold text-green-600">Free 7-day trial • No credit card required</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-muted-foreground">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              <span>Here, your words sound like you-every time.</span>
            </div>
          </div>

          {/* Feature cards - Compact UI - Single line, short, near hero */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 max-w-4xl mx-auto pt-4 sm:pt-5">
              {/* AI Persona - Compact Single Line */}
              <div className="rounded-xl border-2 border-blue-100/50 dark:border-blue-900/50 bg-gradient-to-br from-white/95 via-blue-50/30 to-indigo-50/20 dark:from-slate-900/95 dark:via-blue-950/30 dark:to-indigo-950/20 backdrop-blur-sm shadow-lg hover:shadow-xl p-3 sm:p-4 hover-lift transition-all duration-300">
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-blue-600 via-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center shadow-md">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[9px] sm:text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">Persona</span>
                    <h4 className="text-xs sm:text-sm font-semibold">Your authentic voice</h4>
                    <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight line-clamp-2">AI learns your unique style and creates content that sounds like YOU.</p>
                    <div className="mt-1 flex flex-wrap gap-1 justify-center">
                      <span className="px-1.5 py-0.5 text-[9px] rounded-full border bg-muted">Authentic</span>
                      <span className="px-1.5 py-0.5 text-[9px] rounded-full border bg-muted">Voice AI</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Smart Comments - Compact Single Line */}
              <div className="rounded-xl border-2 border-indigo-100/50 dark:border-indigo-900/50 bg-gradient-to-br from-white/95 via-indigo-50/30 to-purple-50/20 dark:from-slate-900/95 dark:via-indigo-950/30 dark:to-purple-950/20 backdrop-blur-sm shadow-lg hover:shadow-xl p-3 sm:p-4 hover-lift transition-all duration-300">
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-blue-600 via-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center shadow-md">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[9px] sm:text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">Engagement</span>
                    <h4 className="text-xs sm:text-sm font-semibold">Smart comments</h4>
                    <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight line-clamp-2">Generate genuine comments that build real relationships and conversations.</p>
                    <div className="mt-1 flex flex-wrap gap-1 justify-center">
                      <span className="px-1.5 py-0.5 text-[9px] rounded-full border bg-muted">Genuine</span>
                      <span className="px-1.5 py-0.5 text-[9px] rounded-full border bg-muted">Engage</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content Planner & Idea Generator - Compact Single Line */}
              <div className="rounded-xl border-2 border-purple-100/50 dark:border-purple-900/50 bg-gradient-to-br from-white/95 via-purple-50/30 to-pink-50/20 dark:from-slate-900/95 dark:via-purple-950/30 dark:to-pink-950/20 backdrop-blur-sm shadow-lg hover:shadow-xl p-3 sm:p-4 hover-lift transition-all duration-300">
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-blue-600 via-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center shadow-md">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[9px] sm:text-[10px] font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wide">Plan & create</span>
                    <h4 className="text-xs sm:text-sm font-semibold">Content planner & idea generator</h4>
                    <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight line-clamp-2">Plan posts on a calendar, generate ideas, then turn them into full posts with AI.</p>
                    <div className="mt-1 flex flex-wrap gap-1 justify-center">
                      <span className="px-1.5 py-0.5 text-[9px] rounded-full border bg-muted">Calendar</span>
                      <span className="px-1.5 py-0.5 text-[9px] rounded-full border bg-muted">Ideas</span>
                      <span className="px-1.5 py-0.5 text-[9px] rounded-full border bg-muted">AI</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          {/* Trust Indicators */}
          <div className="pt-4 sm:pt-6 lg:pt-8 border-t border-border/50">
            <div className="text-xs text-muted-foreground mb-4">Trusted by professionals worldwide</div>
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
              <Badge variant="secondary" className="px-3 py-1.5 text-xs font-medium bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200/50 hover:border-blue-300 transition-colors">
                Startup Founders
              </Badge>
              <Badge variant="secondary" className="px-3 py-1.5 text-xs font-medium bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200/50 hover:border-purple-300 transition-colors">
                Marketing Teams
              </Badge>
              <Badge variant="secondary" className="px-3 py-1.5 text-xs font-medium bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/50 hover:border-green-300 transition-colors">
                Sales Leaders
              </Badge>
              <Badge variant="secondary" className="px-3 py-1.5 text-xs font-medium bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200/50 hover:border-orange-300 transition-colors">
                Content Creators
              </Badge>
              <Badge variant="secondary" className="px-3 py-1.5 text-xs font-medium bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200/50 hover:border-cyan-300 transition-colors">
                Coaches & Consultants
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
