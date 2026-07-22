export default function FeaturesGrid() {
  const features = [
    {
      icon: "auto_mode",
      title: "Auto-triage",
      description: "Labels, assigns, and drafts intelligent replies to recurring issue templates instantly using repo history.",
      badge: "AI Native",
    },
    {
      icon: "speed",
      title: "Load Score Dashboard",
      description: "A holistic view of your repository's metabolic health, queue latency, and maintainer capacity balance.",
      badge: "Real-time",
    },
    {
      icon: "shield_with_heart",
      title: "Boundary Enforcement",
      description: "Lock issue comments after working hours to safeguard maintainer focus and enforce quiet weekends.",
      badge: "Work-Life Balance",
    },
    {
      icon: "group_add",
      title: "Contributor Funneling",
      description: "Nudges frequent high-quality contributors toward triage and reviewer roles automatically.",
      badge: "Community Growth",
    },
    {
      icon: "cleaning_services",
      title: "Stale Issue Sweeps",
      description: "Clean up noisy backlogs with automated, polite staleness checks and auto-resolution prompts.",
      badge: "Clean Backlog",
    },
    {
      icon: "warning",
      title: "Bus-Factor Alerts",
      description: "Identify single-point-of-failure code paths and knowledge silos before key maintainers leave.",
      badge: "Risk Shield",
    },
  ];

  return (
    <section id="features" className="py-24 px-4 sm:px-6 lg:px-margin-desktop max-w-max-width mx-auto">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <span className="font-label-md text-label-md text-tertiary uppercase tracking-widest block mb-2 font-bold">
          Feature Suite
        </span>
        <h2 className="font-headline-lg text-2xl sm:text-headline-lg text-on-surface mb-4">
          Built for High-Velocity Engineering Teams
        </h2>
        <p className="font-body-md text-on-surface-variant">
          Everything you need to run a sustainable, scalable open-source project without sacrificing maintainer sanity.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((feature, index) => (
          <div
            key={index}
            className="glass-card p-8 rounded-2xl border hover:border-primary/40 transition-all duration-300 flex flex-col justify-between group"
          >
            <div>
              <div className="flex justify-between items-center mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary-container/80 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-2xl">{feature.icon}</span>
                </div>
                <span className="font-label-md text-xs px-3 py-1 rounded-full bg-surface-container-high text-on-surface-variant border border-outline-variant/30">
                  {feature.badge}
                </span>
              </div>
              <h3 className="font-headline-md text-headline-md text-on-surface mb-3 font-semibold group-hover:text-primary transition-colors">
                {feature.title}
              </h3>
              <p className="font-body-sm text-on-surface-variant leading-relaxed">
                {feature.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
