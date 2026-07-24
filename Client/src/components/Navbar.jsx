import { useState, useEffect } from 'react';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-surface/90 backdrop-blur-md border-b border-outline-variant/30 shadow-xl'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-max-width mx-auto px-4 sm:px-6 lg:px-margin-desktop flex items-center justify-between h-20">
        {/* Brand Logo */}
        <a href="#" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-white group-hover:scale-105 transition-transform duration-200">
            <span className="material-symbols-outlined text-2xl">shield_with_heart</span>
          </div>
          <span className="font-headline-md text-headline-md font-bold text-white tracking-tight">
            Maintainer<span className="text-neutral-400">AI</span>
          </span>
        </a>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-8">
          <a
            href="#problem"
            className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors duration-200"
          >
            Overview
          </a>
          <a
            href="#workflow"
            className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors duration-200"
          >
            How it works
          </a>
          <a
            href="#features"
            className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors duration-200"
          >
            Features
          </a>
          <a
            href="#dashboard"
            className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors duration-200"
          >
            Dashboard
          </a>
        </div>

        {/* Action Button */}
        <div className="hidden md:flex items-center gap-4">
          <button className="bg-primary-container text-primary font-label-md text-label-md px-6 py-2.5 rounded-xl hover:bg-primary-container/80 hover:scale-95 transition-all duration-150 flex items-center gap-2 border border-primary/20">
            <span className="material-symbols-outlined text-lg">download</span>
            Install on GitHub
          </button>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-on-surface hover:text-primary focus:outline-none"
          aria-label="Toggle Navigation Menu"
        >
          <span className="material-symbols-outlined text-3xl">
            {mobileMenuOpen ? 'close' : 'menu'}
          </span>
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-surface-container-high/95 backdrop-blur-lg border-b border-outline-variant px-6 py-6 space-y-4 animate-in slide-in-from-top duration-200">
          <a
            href="#problem"
            onClick={() => setMobileMenuOpen(false)}
            className="block font-label-md text-body-md text-on-surface hover:text-primary py-2"
          >
            Overview
          </a>
          <a
            href="#workflow"
            onClick={() => setMobileMenuOpen(false)}
            className="block font-label-md text-body-md text-on-surface hover:text-primary py-2"
          >
            How it works
          </a>
          <a
            href="#features"
            onClick={() => setMobileMenuOpen(false)}
            className="block font-label-md text-body-md text-on-surface hover:text-primary py-2"
          >
            Features
          </a>
          <a
            href="#dashboard"
            onClick={() => setMobileMenuOpen(false)}
            className="block font-label-md text-body-md text-on-surface hover:text-primary py-2"
          >
            Dashboard
          </a>
          <div className="pt-4 border-t border-outline-variant/40">
            <button className="w-full bg-primary text-on-primary font-label-md py-3 rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-lg">download</span>
              Install on GitHub
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
