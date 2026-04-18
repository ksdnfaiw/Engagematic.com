import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { PERSONA_PRESETS } from "@/constants/personaPresets";

const audiences = Object.entries(PERSONA_PRESETS).map(([slug, config]) => ({
  slug,
  label: config.label,
  icon: config.icon,
  stat: config.stat,
  lines: config.lines,
  cta: `/auth/register?persona=${slug}`,
}));

export const UseCases = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-14 text-white sm:py-16">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-15%] top-[-40%] h-64 w-64 rounded-full bg-primary/30 blur-[120px]" />
        <div className="absolute right-[-10%] bottom-[-45%] h-72 w-72 rounded-full bg-purple-500/35 blur-[140px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08)_0,_transparent_55%)]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.32em]">
              Who It’s For
            </span>
            <h2 className="text-2xl font-semibold leading-tight sm:text-3xl">
              Precision playbooks for every LinkedIn growth role.
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-relaxed text-white/70 sm:text-base">
            Spark adapts your narrative, tone, and cadence so each team shows up polished without extra headcount. Pick your lane-your workflow is already dialed in.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {audiences.map(({ icon: Icon, label, stat, lines, cta }) => (
            <article
              key={label}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 px-6 py-7 shadow-[0_18px_40px_rgba(15,23,42,0.35)] transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/10"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-purple-400/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="relative flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white">
                    <Icon className="h-5 w-5" strokeWidth={2.4} />
                  </span>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
                      {label}
                    </div>
                    <div className="text-sm font-semibold text-white">{stat}</div>
                  </div>
                </div>
                {lines.map((line, index) => (
                  <p key={index} className="text-sm leading-relaxed text-white/75">
                    {line}
                  </p>
                ))}
                <Link
                  to={cta}
                  className="inline-flex w-fit items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/60"
                >
                  Explore how
                  <ArrowUpRight className="h-4 w-4" strokeWidth={2.4} />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};


