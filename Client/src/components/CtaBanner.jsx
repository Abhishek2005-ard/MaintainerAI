import { useState } from 'react';
import { auth as authApi } from '../services/api';

export default function CtaBanner() {
  const [loading, setLoading] = useState(false);

  const handleInstall = async () => {
    setLoading(true);
    try {
      const { url } = await authApi.getInstallUrl();
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      // Fallback — direct GitHub App URL
      window.open('https://github.com/apps/maintainerai-abhishek-dhatrak/installations/new', '_blank', 'noopener,noreferrer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-margin-desktop text-center max-w-max-width mx-auto">
      <div className="relative overflow-hidden py-16 px-6 sm:px-12 bg-gradient-to-b from-surface-container to-surface-container-high rounded-3xl border border-outline-variant/30 shadow-2xl">
        {/* Glow orb */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-2xl mx-auto">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-container text-primary mb-6 shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined text-3xl">account_tree</span>
          </div>

          <h2 className="font-headline-lg text-3xl sm:text-headline-lg text-on-surface mb-4 font-bold">
            Add MaintainerAI to your repository
          </h2>

          <p className="font-body-md text-on-surface-variant mb-10 leading-relaxed">
            Install in minutes. MaintainerAI will start triaging issues immediately — classifying, deduplicating, labelling, and protecting your team from burnout automatically.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              id="install-github-btn"
              onClick={handleInstall}
              disabled={loading}
              className="w-full sm:w-auto bg-primary text-on-primary font-label-md text-body-md px-10 py-4 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2 font-semibold disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span className="material-symbols-outlined text-xl">download</span>
              )}
              Install on GitHub
            </button>
            <a
              href="#features"
              className="w-full sm:w-auto text-on-surface-variant hover:text-on-surface font-label-md text-body-md px-6 py-4 rounded-xl transition-colors"
            >
              Explore the architecture →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
