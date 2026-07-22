export default function Testimonials() {
  const reviews = [
    {
      quote:
        "MaintainerAI completely changed how we manage our core repo. It's like having a dedicated triage specialist who never sleeps and always respects our weekend quiet hours.",
      author: "Alex R.",
      role: "Lead Maintainer of @open-graph-core",
      borderColor: "border-secondary",
      stars: 5,
    },
    {
      quote:
        "The load score alerts saved me from crashing. Now I know exactly when to step back and let autonomous triage handle incoming PR queues for a few days.",
      author: "Sarah J.",
      role: "Founder of UI-Kit-System",
      borderColor: "border-primary",
      stars: 5,
    },
  ];

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-margin-desktop max-w-max-width mx-auto">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h2 className="font-headline-lg text-2xl sm:text-headline-lg text-on-surface mb-4">
          Trusted by Open Source Maintainers
        </h2>
        <p className="font-body-md text-on-surface-variant">
          See how maintainers around the world protect their time and keep their communities thriving.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {reviews.map((review, idx) => (
          <div
            key={idx}
            className={`glass-card p-8 sm:p-10 rounded-2xl border-l-4 ${review.borderColor} relative flex flex-col justify-between`}
          >
            <div className="mb-6">
              <div className="flex gap-1 text-tertiary mb-4">
                {[...Array(review.stars)].map((_, i) => (
                  <span key={i} className="material-symbols-outlined text-lg">star</span>
                ))}
              </div>
              <blockquote className="font-body-lg text-body-lg text-on-surface italic leading-relaxed">
                "{review.quote}"
              </blockquote>
            </div>

            <div className="pt-4 border-t border-outline-variant/30 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center font-bold font-mono text-primary border border-outline-variant">
                {review.author[0]}
              </div>
              <div>
                <cite className="not-italic font-headline-md text-body-md font-semibold text-on-surface block">
                  {review.author}
                </cite>
                <span className="font-label-md text-xs text-on-surface-variant font-mono">
                  {review.role}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
