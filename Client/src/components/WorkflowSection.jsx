export default function WorkflowSection() {
  const steps = [
    {
      icon: "filter_list",
      title: "1. Triage",
      bgColor: "bg-secondary-container",
      textColor: "text-on-secondary-container",
      glow: "glow-teal",
      description: "AI-powered categorization routes incoming issues & PRs to the right domain experts instantly.",
    },
    {
      icon: "monitoring",
      title: "2. Monitor",
      bgColor: "bg-primary-container",
      textColor: "text-on-primary-container",
      glow: "",
      description: "Live tracking of PR response times, queue velocity, and real-time maintainer workload stress levels.",
    },
    {
      icon: "notifications_active",
      title: "3. Alert",
      bgColor: "bg-error-container",
      textColor: "text-on-error-container",
      glow: "",
      description: "Automated alerts fire when load scores cross safety thresholds before maintainer exhaustion happens.",
    },
    {
      icon: "bedtime",
      title: "4. Recover",
      bgColor: "bg-tertiary-container",
      textColor: "text-on-tertiary-container",
      glow: "",
      description: "Automatically locks non-critical pings during quiet hours, encouraging mandatory rest periods.",
    },
  ];

  return (
    <section id="workflow" className="py-24 bg-surface-container-low px-4 sm:px-6 lg:px-margin-desktop border-y border-outline-variant/30">
      <div className="max-w-max-width mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="font-label-md text-label-md text-secondary uppercase tracking-widest block mb-2 font-bold">
            Automated Protection Pipeline
          </span>
          <h2 className="font-headline-lg text-2xl sm:text-headline-lg text-on-surface mb-4">
            A Healthier Workflow for Open Source
          </h2>
          <p className="font-body-md text-on-surface-variant">
            MaintainerAI sits quietly between your repository and notifications, absorbing non-urgent friction so your team can focus on coding.
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
