import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { auth as authApi } from '../services/api';

const processedCodes = new Set();

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const code = searchParams.get('code');

  useEffect(() => {
    if (!code || processedCodes.has(code)) return;
    processedCodes.add(code);

    async function handleAuth() {
      setLoading(true);
      setError(null);
      try {
        const { token, user } = await authApi.handleCallback(code);
        window.history.replaceState({}, document.title, '/login');
        login(user, token);
        navigate('/dashboard', { replace: true });
      } catch (err) {
        window.history.replaceState({}, document.title, '/login');
        setError(err.message || 'Authentication failed. Please click "Continue with GitHub" to try again.');
        setLoading(false);
      }
    }
    handleAuth();
  }, [code, login, navigate]);

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true });
  }, [isAuthenticated, navigate]);

  const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID || 'Iv23licHQX1HeURlZs4L';
  const CALLBACK_URL = `${window.location.origin}/login`;

  const handleLogin = () => {
    const params = new URLSearchParams({
      client_id: GITHUB_CLIENT_ID,
      redirect_uri: CALLBACK_URL,
      scope: 'user:email,repo',
    });
    const oauthUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;
    console.log('Redirecting to GitHub OAuth:', oauthUrl);
    window.location.href = oauthUrl;
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4" style={{ background: '#050505' }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%)' }} />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="rounded-2xl border border-white/10 p-8" style={{ background: 'rgba(18,18,18,0.8)', backdropFilter: 'blur(20px)' }}>
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-2xl">shield_with_heart</span>
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">
              Maintainer<span className="text-neutral-400">AI</span>
            </span>
          </div>

          <h1 className="text-xl font-bold text-white text-center mb-2">Sign in to continue</h1>
          <p className="text-neutral-400 text-sm text-center mb-8">
            Connect your GitHub account to start triaging issues automatically.
          </p>

          {error && (
            <div className="mb-6 p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            id="github-login-btn"
            onClick={handleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-6 rounded-xl bg-white text-black font-semibold text-sm hover:bg-neutral-200 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                {searchParams.get('code') ? 'Signing you in…' : 'Connecting…'}
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23a11.52 11.52 0 0 1 3-.405c1.02.005 2.045.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z" />
                </svg>
                Continue with GitHub
              </>
            )}
          </button>

          <p className="mt-6 text-center text-xs text-neutral-600">
            By signing in, you agree to grant MaintainerAI access to your GitHub repositories.
          </p>
        </div>

        <div className="mt-6 text-center">
          <a href="/" className="text-sm text-neutral-500 hover:text-neutral-300 transition-colors">
            ← Back to homepage
          </a>
        </div>
      </div>
    </div>
  );
}

