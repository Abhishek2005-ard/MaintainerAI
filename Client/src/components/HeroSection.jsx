export default function HeroSection() {
  return (
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden px-4 sm:px-6 lg:px-margin-desktop hero-radial-glow pt-24">
      {/* Subtle Grid Background Overlay */}
      <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:36px_36px] pointer-events-none"></div>

      <div className="relative z-10 text-center max-w-4xl mx-auto my-auto py-12 animate-fade-in-up">
        {/* Status Pill Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface-container-high border border-outline-variant/50 text-white font-label-md text-label-md mb-8 shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
          </span>
          <span>MaintainerAI — Autonomous GitHub Triage</span>
          <span className="text-on-surface-variant font-normal">| LangGraph + Gemini</span>
        </div>

        {/* Hero Title */}
        <h1 className="font-headline-xl text-3xl sm:text-5xl lg:text-headline-xl text-on-surface mb-6 font-bold tracking-tight leading-tight">
          AI-Powered Triage for{' '}
          <span className="bg-gradient-to-r from-white via-neutral-300 to-neutral-500 bg-clip-text text-transparent">
            GitHub Issues
          </span>
        </h1>

        {/* Hero Description */}
        <p className="font-body-lg text-body-md sm:text-body-lg text-on-surface-variant mb-10 max-w-2xl mx-auto leading-relaxed">
          MaintainerAI connects to your GitHub repositories and runs a multi-agent LangGraph workflow — automatically classifying issues, detecting duplicates, predicting labels, and protecting maintainer wellbeing.
        </p>

        {/* Call to Actions */}
        <div className="flex items-center justify-center">
          <a
            href="https://github.com/Abhishek2005-ard/MaintainerAI"
            target="_blank"
            rel="noreferrer"
            className="bg-white text-black font-label-md text-body-md px-8 py-3.5 rounded-xl hover:bg-neutral-200 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-white/10 flex items-center justify-center gap-2 font-semibold"
          >
            {/* GitHub SVG icon */}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23a11.52 11.52 0 0 1 3-.405c1.02.005 2.045.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
            View on GitHub
          </a>
        </div>

        {/* Micro Badges */}
        <div className="mt-12 pt-8 border-t border-outline-variant/20 flex flex-wrap items-center justify-center gap-8 text-on-surface-variant text-xs font-mono">
          <div className="flex items-center gap-2 hover:text-white transition-colors duration-300">
            <span className="material-symbols-outlined text-white text-base">account_tree</span>
            <span>LangGraph Agents</span>
          </div>
          <div className="flex items-center gap-2 hover:text-white transition-colors duration-300">
            <span className="material-symbols-outlined text-white text-base">hub</span>
            <span>Gemini + OpenAI</span>
          </div>
          <div className="flex items-center gap-2 hover:text-white transition-colors duration-300">
            <span className="material-symbols-outlined text-white text-base">bolt</span>
            <span>Microservices Architecture</span>
          </div>
        </div>
      </div>
    </section>
  );
}
