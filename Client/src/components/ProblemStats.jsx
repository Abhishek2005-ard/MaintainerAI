export default function ProblemStats() {
  const stats = [
    {
      value: "70%",
      color: "text-secondary",
      borderColor: "hover:border-secondary/50",
      description: "of maintainers feel overwhelmed by the relentless volume of un-triaged issues and pull requests.",
      icon: "sentiment_very_dissatisfied",
    },
    {
      value: "54%",
      color: "text-tertiary",
      borderColor: "hover:border-tertiary/50",
      description: "report that project popularity directly increases stress, leading to silent burnout and fatigue.",
      icon: "trending_up",
    },
    {
      value: "3.2x",
      color: "text-primary",
      borderColor: "hover:border-primary/50",
      description: "Higher risk of sudden project abandonment when a single maintainer holds all key operational knowledge.",
      icon: "warning",
    },
  ];

  return (
    <section id="problem" className="py-20 px-4 sm:px-6 lg:px-margin-desktop max-w-max-width mx-auto">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h2 className="font-headline-lg text-2xl sm:text-headline-lg text-on-surface mb-4">
          The Hidden Cost of Maintaining Alone
        </h2>
        <p className="font-body-md text-on-surface-variant">
          Open-source software powers the modern internet, yet maintainers face unprecedented workloads without continuous automated support.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className={`glass-card p-8 rounded-2xl border ${stat.borderColor} transition-all duration-300 relative overflow-hidden group`}
          >
            <div className="flex justify-between items-start mb-6">
              <span className={`font-headline-xl text-5xl font-bold ${stat.color} group-hover:scale-105 transition-transform duration-200`}>
                {stat.value}
              </span>
              <div className="p-2 rounded-lg bg-surface-container text-on-surface-variant">
                <span className="material-symbols-outlined text-2xl">{stat.icon}</span>
              </div>
            </div>
            <p className="font-body-md text-on-surface-variant leading-relaxed">
              {stat.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
