export default function FeaturesGrid() {
  const features = [
    {
      icon: "account_tree",
      title: "LangGraph Workflow",
      description: "A multi-node StateGraph orchestrates every triage step — from duplicate detection to label prediction — in a clean, auditable pipeline.",
      badge: "LangGraph",
    },
    {
      icon: "content_copy",
      title: "Duplicate Detection",
      description: "Embeds each incoming issue using Gemini or OpenAI embeddings and runs cosine similarity against all open issues to catch duplicates instantly.",
      badge: "Semantic AI",
    },
    {
      icon: "label",
      title: "Auto Label Prediction",
      description: "The LabelAgent calls an LLM with the issue analysis and predicts the exact GitHub labels to apply — bug, priority, enhancement and more.",
      badge: "AI Native",
    },
    {
      icon: "shield_with_heart",
      title: "Burnout Risk Shield",
      description: "The TriageAgent scores the tone of each issue. If it detects demanding or toxic language, a supportive comment is automatically posted.",
      badge: "Wellbeing",
    },
    {
      icon: "monitoring",
      title: "Triage Report Dashboard",
      description: "Every triage run is saved to the report-service with full stats — duplicates, burnout flags, category and priority breakdowns — queryable via API.",
      badge: "Real-time",
    },
    {
      icon: "hub",
      title: "Microservices Architecture",
      description: "Four independent services — AI, GitHub, Report, and a Client — each with their own Express server, MongoDB, JWT auth and typed TypeScript codebase.",
      badge: "Scalable",
    },
  ];

  return (
    <section id="features" className="py-24 px-4 sm:px-6 lg:px-margin-desktop max-w-max-width mx-auto">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <span className="font-label-md text-label-md text-tertiary uppercase tracking-widest block mb-2 font-bold">
          Feature Suite
        </span>
        <h2 className="font-headline-lg text-2xl sm:text-headline-lg text-on-surface mb-4">
          Built on a Real Agentic Architecture
        </h2>
        <p className="font-body-md text-on-surface-variant">
          Every feature is backed by a dedicated agent, a clean LangGraph graph, and proper TypeScript types — no shortcuts.
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
