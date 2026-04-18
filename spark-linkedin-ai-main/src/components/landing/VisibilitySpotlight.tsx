import { Eye, Sparkles, Rocket, PenSquare } from "lucide-react";

const highlights = [
  {
    icon: Eye,
    label: "Visibility",
    text: "Ace your LinkedIn visibility for dream jobs & placements-no faking, just results.",
    delay: "",
  },
  {
    icon: Sparkles,
    label: "Content",
    text: "Stand out with scroll-stopping posts and carousels-crafted in minutes, not hours.",
    delay: "animation-delay-200",
  },
  {
    icon: PenSquare,
    label: "Brand",
    text: "Level-up your profile and personal brand-look impressive instantly.",
    delay: "animation-delay-400",
  },
  {
    icon: Rocket,
    label: "Momentum",
    text: "Tools that work-ditch the generic, get real engagement fast.",
    delay: "animation-delay-600",
  },
];

export const VisibilitySpotlight = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-primary/8 via-background to-background py-16 sm:py-18 lg:py-20">
      {/* Background accents */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-[-6rem] right-[-4rem] h-72 w-72 rounded-full bg-purple-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4 md:gap-6">
          <div className="space-y-3 animate-fade-in-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-primary">
              Be Seen. Be Remembered.
            </span>
            <h2 className="text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl">
              Tools that put your LinkedIn brand in the fast lane
            </h2>
            <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
              Build momentum instantly with experiences tailored to every LinkedIn goal. Each card is a proven lever our users pull to stay top of mind.
            </p>
          </div>

          <div className="hidden sm:block animate-fade-in-up animation-delay-300">
            <button className="group inline-flex items-center gap-2 rounded-full border border-primary/40 bg-white/50 px-4 py-2 text-sm font-semibold text-primary shadow-[0_14px_40px_rgba(59,91,255,0.18)] backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-primary hover:bg-primary hover:text-white">
              Let’s Connect
              <span className="text-lg transition-transform duration-300 group-hover:translate-x-1">→</span>
            </button>
          </div>
        </div>

        <div className="mt-10 grid gap-4 sm:gap-5 md:grid-cols-2">
          {highlights.map(({ icon: Icon, label, text, delay }, index) => (
            <div
              key={label}
              className={`animate-fade-in-up ${delay}`}
              style={{ animationDelay: `${index * 120}ms` }}
            >
              <div className="group relative overflow-hidden rounded-3xl border border-primary/15 bg-white/70 p-5 shadow-[0_16px_45px_rgba(15,23,42,0.08)] backdrop-blur transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(59,91,255,0.20)] dark:bg-slate-900/80 dark:border-slate-700">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="relative flex items-start gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-purple-500 text-white shadow-lg">
                    <Icon className="h-6 w-6" strokeWidth={2.4} />
                  </div>
                  <div className="space-y-2">
                    <div className="text-xs font-semibold uppercase tracking-wide text-primary/70">
                      {label}
                    </div>
                    <p className="text-base font-semibold leading-tight text-foreground sm:text-lg">
                      {text}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-center sm:hidden">
          <button className="group inline-flex items-center gap-2 rounded-full border border-primary/40 bg-white/60 px-4 py-2 text-sm font-semibold text-primary shadow-[0_14px_40px_rgba(59,91,255,0.18)] backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-primary hover:bg-primary hover:text-white">
            Let’s Connect
            <span className="text-lg transition-transform duration-300 group-hover:translate-x-1">→</span>
          </button>
        </div>
      </div>
    </section>
  );
};
