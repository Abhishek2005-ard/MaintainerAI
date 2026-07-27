import { useState } from 'react';

export default function PricingSection() {
  const [annual, setAnnual] = useState(true);

  const plans = [
    {
      name: "Open Source",
      price: "$0",
      period: "/mo",
      tagline: "FOR PUBLIC REPOSITORIES",
      tagColor: "text-secondary",
      highlight: false,
      cta: "Install on GitHub",
      features: [
        "Unlimited Public Repositories",
        "Full LangGraph Triage Workflow",
        "Duplicate Detection via Embeddings",
        "Basic Label Prediction",
        "Community Support",
      ],
    },
    {
      name: "Pro",
      price: annual ? "$15" : "$19",
      period: "/mo",
      tagline: "FOR INDIVIDUAL MAINTAINERS",
      tagColor: "text-primary",
      highlight: true,
      cta: "Get Pro Access",
      features: [
        "5 Private Repositories",
        "Gemini + OpenAI Model Selection",
        "Advanced Burnout Risk Detection",
        "Triage Report Dashboard API",
        "Weekly Digest Reports",
        "Priority Email Alerts",
      ],
    },
    {
      name: "Team",
      price: annual ? "$39" : "$49",
      period: "/mo",
      tagline: "FOR ORGANIZATIONS",
      tagColor: "text-on-surface-variant",
      highlight: false,
      cta: "Contact Us",
      features: [
        "Unlimited Private Repositories",
        "Custom LangGraph Workflow Nodes",
        "Multi-Repo Report Aggregation",
        "JWT-Secured Internal APIs",
        "Self-Hosted Deployment Support",
        "24/7 Concierge Support",
      ],
    },
  ];

  return (
    <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-margin-desktop bg-surface-container-low/40 border-t border-outline-variant/30">
      <div className="max-w-max-width mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="font-label-md text-label-md text-primary uppercase tracking-widest block mb-2 font-bold">
            Simple Pricing
          </span>
          <h2 className="font-headline-lg text-2xl sm:text-headline-lg text-on-surface mb-4">
            Free for Open Source. Powerful for Teams.
          </h2>
          <p className="font-body-md text-on-surface-variant">
            The full LangGraph triage workflow is free for public repositories. Unlock advanced LLM models and private repo support with Pro.
          </p>

          {/* Billing Cycle Toggle */}
          <div className="mt-8 inline-flex items-center gap-3 p-1.5 rounded-full bg-surface-container-high border border-outline-variant/40 font-label-md text-xs">
            <button
              onClick={() => setAnnual(false)}
              className={`px-4 py-1.5 rounded-full transition-all ${
                !annual ? 'bg-primary text-on-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-4 py-1.5 rounded-full transition-all flex items-center gap-1 ${
                annual ? 'bg-primary text-on-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span>Annual</span>
              <span className="text-[10px] bg-secondary text-on-secondary px-1.5 py-0.5 rounded-full font-bold">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan, idx) => (
            <div
              key={idx}
              className={`p-8 sm:p-10 rounded-2xl flex flex-col justify-between transition-all duration-300 relative ${
                plan.highlight
                  ? 'bg-surface-container-high border-2 border-primary shadow-2xl shadow-primary/10 scale-105 z-10'
                  : 'glass-card'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-on-primary font-label-md text-xs px-4 py-1 rounded-full font-bold uppercase tracking-wider shadow-md">
                  Most Popular
                </div>
              )}

              <div>
                <h3 className="font-headline-md text-headline-md text-on-surface mb-1 font-semibold">
                  {plan.name}
                </h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="font-headline-xl text-4xl sm:text-5xl font-bold text-on-surface">
                    {plan.price}
                  </span>
                  <span className="font-body-sm text-on-surface-variant font-normal">
                    {plan.period}
                  </span>
                </div>
                <p className={`font-label-md text-xs font-bold tracking-wider uppercase mb-8 ${plan.tagColor}`}>
                  {plan.tagline}
                </p>

                <ul className="space-y-4 mb-10">
                  {plan.features.map((feat, fIdx) => (
                    <li key={fIdx} className="flex items-center gap-3 text-body-sm text-on-surface">
                      <span className={`material-symbols-outlined text-lg ${plan.highlight ? 'text-primary' : 'text-secondary'}`}>
                        check_circle
                      </span>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                className={`w-full py-3.5 px-4 rounded-xl font-label-md text-label-md transition-all font-semibold shadow-md ${
                  plan.highlight
                    ? 'bg-primary text-on-primary hover:opacity-90 hover:scale-[1.02]'
                    : 'border border-outline/50 text-on-surface hover:bg-surface-variant hover:border-primary/40'
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
