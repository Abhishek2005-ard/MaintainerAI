export default function Footer() {
  return (
    <footer className="w-full py-16 px-4 sm:px-6 lg:px-margin-desktop border-t border-outline-variant/30 bg-surface-container-lowest">
      <div className="max-w-max-width mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
        {/* Brand & Copyright */}
        <div className="flex flex-col gap-2 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <div className="w-6 h-6 rounded-lg bg-primary-container flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-sm">shield_with_heart</span>
            </div>
            <span className="font-headline-md text-xl font-bold text-on-surface">
              Maintainer<span className="text-secondary">AI</span>
            </span>
          </div>
          <p className="font-body-sm text-xs text-on-surface-variant">
            © 2026 MaintainerAI Inc. Built for the global open-source community with care.
          </p>
        </div>

        {/* Footer Links */}
        <div className="flex flex-wrap justify-center gap-8">
          <a
            href="#problem"
            className="font-label-md text-xs text-on-surface-variant hover:text-secondary transition-colors"
          >
            Overview
          </a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="font-label-md text-xs text-on-surface-variant hover:text-secondary transition-colors flex items-center gap-1"
          >
            <span>GitHub</span>
            <span className="material-symbols-outlined text-xs">open_in_new</span>
          </a>
          <a
            href="#features"
            className="font-label-md text-xs text-on-surface-variant hover:text-secondary transition-colors"
          >
            Documentation
          </a>
          <a
            href="#"
            className="font-label-md text-xs text-tertiary hover:underline transition-colors font-bold"
          >
            Sponsor Open Source
          </a>
        </div>
      </div>
    </footer>
  );
}
