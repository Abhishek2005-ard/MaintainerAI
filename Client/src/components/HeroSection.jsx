export default function HeroSection() {
  return (
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden px-4 sm:px-6 lg:px-margin-desktop hero-radial-glow pt-24">
      {/* Subtle Grid Background Overlay */}
      <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:36px_36px] pointer-events-none"></div>

      <div className="relative z-10 text-center max-w-4xl mx-auto my-auto py-12">
        {/* Status Pill Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface-container-high border border-outline-variant/50 text-secondary font-label-md text-label-md mb-8 shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
          </span>
          <span>MaintainerAI v2.4 Release</span>
          <span className="text-on-surface-variant font-normal">| Autonomous Triage & Burnout Shield</span>
        </div>
        
        {/* Hero Title */}
        <h1 className="font-headline-xl text-3xl sm:text-5xl lg:text- headline-xl text-on-surface mb-6 font-bold tracking-tight leading-tight">
          Protect Your Open-Source Maintainers{' '}
          <span className="bg-gradient-to-r from-primary via-secondary to-tertiary bg-clip-text text-transparent">
            From Burnout
          </span>
        </h1>

        {/* Hero Description */}
        <p className="font-body-lg text-body-md sm:text-body-lg text-on-surface-variant mb-10 max-w-2xl mx-auto leading-relaxed">
          Automate triage, track workload risk in real time, and enforce healthy boundaries on your GitHub repositories with autonomous AI workflows.
        </p>

        {/* Call to Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
          <button className="w-full sm:w-auto bg-primary text-on-primary font-label-md text-body-md px-8 py-3.5 rounded-xl hover:opacity-90 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 font-semibold">
            <span className="material-symbols-outlined text-xl">download</span>
            Install on GitHub
          </button>
          <a
            href="#dashboard"
            className="w-full sm:w-auto border border-outline/50 text-on-surface font-label-md text-body-md px-8 py-3.5 rounded-xl hover:bg-surface-variant hover:border-primary/40 transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-xl text-secondary">play_circle</span>
            See how it works
          </a>
        </div>

        {/* Micro Badges */}
        <div className="mt-12 pt-8 border-t border-outline-variant/20 flex flex-wrap items-center justify-center gap-8 text-on-surface-variant text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-base">verified_user</span>
            <span>SOC2 Type II Compliant</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-base">code</span>
            <span>Zero Data Storage</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-tertiary text-base">bolt</span>
            <span>5-Min Setup</span>
          </div>
        </div>
      </div>
    </section>
  );
}
