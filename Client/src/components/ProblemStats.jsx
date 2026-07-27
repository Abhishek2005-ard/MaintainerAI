export default function ProblemStats() {
  const stats = [
    {
      value: "88%",
      color: "text-secondary",
      borderColor: "hover:border-secondary/50",
      description: "cosine similarity threshold above which MaintainerAI automatically flags an incoming issue as a duplicate — stopping noise before it reaches maintainers.",
      icon: "content_copy",
    },
    {
      value: "5+",
      color: "text-tertiary",
      borderColor: "hover:border-tertiary/50",
      description: "dedicated agents in the system — TriageAgent, LabelAgent, DuplicateAgent, GitHubAgent, and ReportAgent — each with exactly one responsibility.",
      icon: "account_tree",
    },
    {
      value: "4",
      color: "text-primary",
      borderColor: "hover:border-primary/50",
      description: "independent microservices — AI Service, GitHub Service, Report Service, and a React Client — communicating over JWT-authenticated internal APIs.",
      icon: "hub",
    },
  ];

  return (
    <section id="problem" className="py-20 px-4 sm:px-6 lg:px-margin-desktop max-w-max-width mx-auto">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h2 className="font-headline-lg text-2xl sm:text-headline-lg text-on-surface mb-4">
          Built for Real-World GitHub Scale
        </h2>
        <p className="font-body-md text-on-surface-variant">
          MaintainerAI is not a demo — it is a fully typed, multi-service system with real LLM integrations, semantic search, and live GitHub API interactions.
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
