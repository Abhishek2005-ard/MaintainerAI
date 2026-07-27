export default function WorkflowSection() {
  const steps = [
    {
      icon: "input",
      title: "1. Receive Issue",
      bgColor: "bg-secondary-container",
      textColor: "text-on-secondary-container",
      glow: "glow-teal",
      description: "A GitHub webhook fires when a new issue opens. The AI service receives the payload and starts a LangGraph thread for that issue.",
    },
    {
      icon: "content_copy",
      title: "2. Detect Duplicates",
      bgColor: "bg-primary-container",
      textColor: "text-on-primary-container",
      glow: "",
      description: "The DuplicateAgent embeds the issue title + body and runs cosine similarity against every open issue. Matches above 0.88 are flagged.",
    },
    {
      icon: "psychology",
      title: "3. Triage with LLM",
      bgColor: "bg-error-container",
      textColor: "text-on-error-container",
      glow: "",
      description: "The TriageAgent sends the issue to Gemini (or OpenAI) and gets back category, priority, burnout risk, and reasoning as structured JSON.",
    },
    {
      icon: "task_alt",
      title: "4. Apply & Report",
      bgColor: "bg-tertiary-container",
      textColor: "text-on-tertiary-container",
      glow: "",
      description: "Labels are applied via the GitHub service, a burnout comment is posted if needed, and the full report is saved to the report-service.",
    },
  ];

  return (
    <section id="workflow" className="py-24 bg-surface-container-low px-4 sm:px-6 lg:px-margin-desktop border-y border-outline-variant/30">
      <div className="max-w-max-width mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="font-label-md text-label-md text-secondary uppercase tracking-widest block mb-2 font-bold">
            Automated LangGraph Pipeline
          </span>
          <h2 className="font-headline-lg text-2xl sm:text-headline-lg text-on-surface mb-4">
            How the Triage Workflow Runs
          </h2>
          <p className="font-body-md text-on-surface-variant">
            Each GitHub issue triggers a 10-node StateGraph. Nodes delegate to focused agents — no business logic lives in the graph itself.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {/* Subtle Connecting Line for Desktop */}
          <div className="hidden lg:block absolute top-12 left-12 right-12 h-[2px] bg-gradient-to-r from-secondary via-primary to-tertiary opacity-20 z-0"></div>

          {steps.map((step, index) => (
            <div key={index} className="relative z-10 flex flex-col items-center text-center group">
              <div
                className={`w-20 h-20 rounded-2xl ${step.bgColor} ${step.glow} flex items-center justify-center mb-6 transform group-hover:scale-110 transition-all duration-300 shadow-md`}
              >
                <span className={`material-symbols-outlined text-4xl ${step.textColor}`}>
                  {step.icon}
                </span>
              </div>
              <h3 className="font-headline-md text-headline-md text-on-surface mb-3 font-semibold">
                {step.title}
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
