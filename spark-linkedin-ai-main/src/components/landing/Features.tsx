import { Card } from "@/components/ui/card";
import { UserCircle, TrendingUp, BarChart3, Crown } from "lucide-react";
import { useEffect, useState } from "react";

const features = [
  {
    icon: UserCircle,
    title: "Write Like Yourself, Not Like AI",
    description: "Every post sounds authentically you. No robotic templates-just your natural voice, amplified.",
    gradient: "from-blue-500 via-purple-500 to-pink-500",
    shadowColor: "shadow-blue-500/20"
  },
  {
    icon: TrendingUp,
    title: "From Invisible to In-Demand",
    description: "Turn your unique experience into stories that grab attention and connect with the right people.",
    gradient: "from-purple-500 via-pink-500 to-orange-500",
    shadowColor: "shadow-purple-500/20"
  },
  {
    icon: BarChart3,
    title: "Insights You'll Actually Care About",
    description: "Simple, actionable feedback on what's working-not overwhelming dashboards you'll never check.",
    gradient: "from-indigo-500 via-blue-500 to-cyan-500",
    shadowColor: "shadow-indigo-500/20"
  },
  {
    icon: Crown,
    title: "Your Voice, Sharpened",
    description: "Teach Pulse your writing style. Your best posts, your instincts, your vibe-now on autopilot.",
    gradient: "from-pink-500 via-rose-500 to-orange-500",
    shadowColor: "shadow-pink-500/20"
  }
];

export const Features = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section id="features" className="py-16 sm:py-20 md:py-24 lg:py-28 relative overflow-hidden bg-gray-50 dark:bg-slate-950">
      {/* Subtle dotted background pattern */}
      <div className="absolute inset-0 opacity-40 dark:opacity-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgba(0,0,0,0.08)_1px,_transparent_0)] dark:bg-[radial-gradient(circle_at_1px_1px,_rgba(255,255,255,0.08)_1px,_transparent_0)] [background-size:24px_24px]" />
      </div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header Section */}
        <div className="text-center mb-12 sm:mb-16 lg:mb-20 space-y-3 animate-fade-in-up">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            <span className="text-gradient-premium-world-class">What You Get</span>
          </h2>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Everything you need to sound like you-not like everyone else.
          </p>
        </div>

        {/* Features Grid - Perfect Square Cards - 2x2 Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index}
                className={`group relative flex h-full flex-col justify-between gap-4 rounded-3xl border border-white/60 bg-white/95 p-5 shadow-[0_12px_40px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_20px_60px_rgba(59,91,255,0.16)] dark:border-slate-800/80 dark:bg-slate-900/80 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
                style={{
                  transitionDelay: `${index * 50}ms`
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-primary/5 to-purple-500/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:from-slate-900/0 dark:via-primary/10 dark:to-purple-500/15" />

                {/* Icon Container - Clean and Simple */}
                <div className="relative z-10 flex items-center justify-center">
                  <div className={`relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.gradient} shadow-lg ${feature.shadowColor} transition-transform duration-300 group-hover:scale-110 sm:h-14 sm:w-14`}>
                    <div className="absolute inset-0 rounded-2xl bg-white/20 blur-sm transition-all duration-300 group-hover:bg-white/30" />
                    <Icon className="relative h-6 w-6 text-white sm:h-7 sm:w-7" strokeWidth={2.5} />
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] transition-transform duration-700 ease-in-out group-hover:translate-x-[100%]" />
                  </div>
                </div>
                
                {/* Content - Fits completely */}
                <div className="relative z-10 flex flex-col gap-3 text-center sm:text-left">
                  <h3 className="text-lg font-semibold text-gray-900 transition-colors duration-300 group-hover:text-primary sm:text-xl dark:text-gray-50">
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-400">
                    {feature.description}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
