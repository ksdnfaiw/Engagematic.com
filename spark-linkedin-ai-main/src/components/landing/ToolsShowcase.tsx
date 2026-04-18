import { Card } from "@/components/ui/card";
import { Brain, MessageSquare, Sparkles, Calendar, FileVideo } from "lucide-react";

const tools = [
  {
    icon: Brain,
    title: "AI Persona Engine",
    description: "Create your unique voice that learns from your writing style. Generate content that sounds authentically YOU.",
    color: "from-blue-500 via-indigo-500 to-purple-500",
    shadowColor: "shadow-blue-500/25"
  },
  {
    icon: MessageSquare,
    title: "Smart Comment AI",
    description: "Generate thoughtful comments that start real conversations. Build relationships, not just followers.",
    color: "from-purple-500 via-pink-500 to-rose-500",
    shadowColor: "shadow-purple-500/25"
  },
  {
    icon: Sparkles,
    title: "Viral Hooks & Ideas",
    description: "Generate AI-powered hooks and content ideas that grab attention and boost engagement. Never run out of inspiration.",
    color: "from-orange-500 via-amber-500 to-yellow-500",
    shadowColor: "shadow-orange-500/25"
  },
  {
    icon: Calendar,
    title: "Hook-to-Outcome Content Planner",
    description: "Turn your monthly goal into a clear 30-post board with hooks, CTAs, and comment prompts that drive DMs and leads—not vanity likes.",
    color: "from-green-500 via-emerald-500 to-teal-500",
    shadowColor: "shadow-green-500/25"
  },
  {
    icon: FileVideo,
    title: "Free Video Transcript Generator",
    description: "Instantly convert YouTube, Instagram Reels, TikTok, X, Facebook videos, or local files into clean, ready-to-use text you can turn into LinkedIn posts.",
    color: "from-cyan-500 via-blue-500 to-indigo-500",
    shadowColor: "shadow-cyan-500/25"
  }
];

export const ToolsShowcase = () => {
  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="space-y-2">
        <h3 className="text-xl sm:text-2xl font-bold text-foreground">
          This is Just the{" "}
          <span className="text-gradient-premium-world-class">
            Beginning
          </span>
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-5">
        {tools.map((tool, index) => {
          const Icon = tool.icon;
          return (
            <Card
              key={index}
              className="group relative p-4 sm:p-5 border border-border/50 hover:border-primary/30 bg-gradient-to-br from-white via-white to-slate-50/50 dark:from-slate-900/95 dark:via-slate-900/90 dark:to-slate-800/80 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:via-primary/3 group-hover:to-primary/5 transition-all duration-300 pointer-events-none" />

              <div className="relative flex items-start gap-4">
                <div className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br ${tool.color} flex items-center justify-center flex-shrink-0 shadow-lg ${tool.shadowColor} group-hover:shadow-xl group-hover:scale-110 transition-all duration-300`}>
                  <div className="absolute inset-0 rounded-2xl bg-white/20 blur-sm group-hover:bg-white/30 transition-all duration-300" />
                  <Icon className="relative w-7 h-7 sm:w-8 sm:h-8 text-white drop-shadow-sm z-10" strokeWidth={2.5} />
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out" />
                </div>

                <div className="flex-1 min-w-0 pt-0.5">
                  <h4 className="text-base sm:text-lg font-bold text-foreground mb-1.5 group-hover:text-primary transition-colors">
                    {tool.title}
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {tool.description}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

