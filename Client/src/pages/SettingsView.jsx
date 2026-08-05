import { useEffect, useState } from 'react';
import { repos as reposApi, auth as authApi } from '../services/api';

function TriageRulesPanel({ repo, onSaved }) {
  const initial = repo.triageRules || {};
  const [customLabels, setCustomLabels]           = useState((initial.customLabels || []).join(', '));
  const [customPriorities, setCustomPriorities]   = useState((initial.customPriorities || []).join(', '));
  const [customPromptHints, setCustomPromptHints] = useState(initial.customPromptHints || '');
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [err, setErr]         = useState(null);

  const handleSave = async () => {
    setSaving(true);
    setErr(null);
    try {
      const [owner, name] = repo.fullName.split('/');
      await reposApi.updateTriageRules(owner, name, {
        customLabels:      customLabels.split(',').map((s) => s.trim()).filter(Boolean),
        customPriorities:  customPriorities.split(',').map((s) => s.trim()).filter(Boolean),
        customPromptHints: customPromptHints.trim(),
      });
      setSaved(true);
      onSaved();
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full bg-neutral-900 border border-white/10 text-white text-sm rounded-lg px-3 py-2 placeholder-neutral-600 focus:outline-none focus:border-violet-500/60 transition-colors';

  return (
    <div className="mt-3 rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 space-y-3">
      <p className="text-xs font-semibold text-violet-400 uppercase tracking-widest">Custom Triage Rules</p>

      <div>
        <label className="text-xs text-neutral-400 mb-1 block">Extra labels to suggest (comma-separated)</label>
        <input
          id={`triage-labels-${repo.fullName?.replace('/', '-')}`}
          className={inputCls}
          placeholder="e.g. needs-reproduction, stale, good-first-issue"
          value={customLabels}
          onChange={(e) => setCustomLabels(e.target.value)}
        />
      </div>

      <div>
        <label className="text-xs text-neutral-400 mb-1 block">Priority levels (comma-separated)</label>
        <input
          id={`triage-priorities-${repo.fullName?.replace('/', '-')}`}
          className={inputCls}
          placeholder="e.g. P0-critical, P1-high, P2-medium, P3-low"
          value={customPriorities}
          onChange={(e) => setCustomPriorities(e.target.value)}
        />
      </div>

      <div>
        <label className="text-xs text-neutral-400 mb-1 block">Custom AI instructions for this repo</label>
        <textarea
          id={`triage-hints-${repo.fullName?.replace('/', '-')}`}
          rows={3}
          className={`${inputCls} resize-none leading-relaxed`}
          placeholder="e.g. This is a security library — always mark auth-related issues as critical. Ignore cosmetic/UI issues."
          value={customPromptHints}
          onChange={(e) => setCustomPromptHints(e.target.value)}
        />
      </div>

      {err && <p className="text-red-400 text-xs">{err}</p>}

      <button
        id={`save-triage-rules-${repo.fullName?.replace('/', '-')}`}
        onClick={handleSave}
        disabled={saving}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
          saved
            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            : 'bg-violet-600 hover:bg-violet-500 text-white'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <span className="material-symbols-outlined text-sm">{saved ? 'check' : 'save'}</span>
        {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Rules'}
      </button>
    </div>
  );
}

function RepoRow({ repo, onToggle, toggling, onRulesSaved }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-white/10 hover:border-white/20 transition-colors overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)' }}>
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-neutral-400 text-xl">folder</span>
          <div>
            <p className="text-sm font-medium text-white">{repo.fullName}</p>
            <p className="text-xs text-neutral-500 mt-0.5">
              {repo.private ? '🔒 Private' : '🌐 Public'}
              {repo.language ? ` · ${repo.language}` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            id={`triage-rules-btn-${repo.fullName?.replace('/', '-')}`}
            onClick={() => setExpanded((v) => !v)}
            title="Configure AI triage rules"
            className={`p-1.5 rounded-lg transition-colors ${expanded ? 'text-violet-400 bg-violet-500/10' : 'text-neutral-500 hover:text-violet-400 hover:bg-violet-500/10'}`}
          >
            <span className="material-symbols-outlined text-base">tune</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-500">AI Triage</span>
            <button
              id={`triage-toggle-${repo.fullName?.replace('/', '-')}`}
              onClick={() => onToggle(repo.fullName, !repo.triageRulesActive)}
              disabled={toggling === repo.fullName}
              className={`relative w-10 h-5 rounded-full transition-colors duration-300 focus:outline-none ${
                repo.triageRulesActive ? 'bg-emerald-500' : 'bg-neutral-700'
              } ${toggling === repo.fullName ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-300 ${repo.triageRulesActive ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          <a
            href={`https://github.com/${repo.fullName}`}
            target="_blank"
            rel="noreferrer"
            className="text-neutral-500 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-base">open_in_new</span>
          </a>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4">
          <TriageRulesPanel repo={repo} onSaved={onRulesSaved} />
        </div>
      )}
    </div>
  );
}

export default function SettingsView() {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [toggling, setToggling] = useState(null);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const loadRepos = async () => {
    setLoading(true);
    setError(null);
    try {
      const { repositories } = await reposApi.list();
      setRepos(repositories || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRepos();
    const params = new URLSearchParams(window.location.search);
    if (params.get('status') === 'success') {
      setSuccessMsg('GitHub App installed and repositories synced!');
      window.history.replaceState({}, document.title, window.location.pathname);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  }, []);

  const handleSync = async () => {
    const instId = repos.find((r) => r.installationId)?.installationId;
    if (!instId) {
      setError('No installationId found. Try clicking "Add Repository" first.');
      return;
    }
    setSyncing(true);
    setError(null);
    try {
      await reposApi.sync(instId);
      setSuccessMsg('Repositories synced successfully!');
      loadRepos();
    } catch (err) {
      setError(err.message);
    } finally {
      setSyncing(false);
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  const handleToggle = async (fullName, active) => {
    setToggling(fullName);
    setError(null);
    try {
      const { repository } = await reposApi.toggleTriage(fullName, active);
      setRepos((prev) => prev.map((r) => r.fullName === fullName ? { ...r, triageRulesActive: repository.triageRulesActive } : r));
    } catch (err) {
      setError(err.message);
    } finally {
      setToggling(null);
    }
  };

  const handleInstall = async () => {
    try {
      const { url } = await authApi.getInstallUrl();
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      const appSlug = import.meta.env.VITE_GITHUB_APP_SLUG || 'maintainerai-abhishek-dhatrak';
      window.open(`https://github.com/apps/${appSlug}/installations/new`, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <p className="text-neutral-400 mt-1 text-sm">Manage repositories and control AI triage per repo.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            id="sync-repos-btn"
            onClick={handleSync}
            disabled={syncing || repos.length === 0}
            className="flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl border border-white/10 text-neutral-300 hover:border-white/30 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className={`material-symbols-outlined text-base ${syncing ? 'animate-spin' : ''}`}>sync</span>
            {syncing ? 'Syncing…' : 'Sync Repos'}
          </button>
          <button
            id="install-app-btn"
            onClick={handleInstall}
            className="flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl bg-white text-black font-semibold hover:bg-neutral-200 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-base">add</span>
            Add Repository
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm">{error}</div>
      )}
      {successMsg && (
        <div className="mb-4 p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-sm">{successMsg}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-neutral-500">
          <div className="w-5 h-5 border-2 border-neutral-700 border-t-neutral-300 rounded-full animate-spin mr-3" />
          Loading repositories…
        </div>
      ) : repos.length === 0 ? (
        <div className="rounded-xl border border-white/10 p-12 text-center" style={{ background: 'rgba(18,18,18,0.8)' }}>
          <span className="material-symbols-outlined text-4xl text-neutral-600 mb-4 block">folder_open</span>
          <h2 className="text-white font-semibold mb-2">No repositories found</h2>
          <p className="text-neutral-500 text-sm mb-6">Install the MaintainerAI GitHub App on your repositories to get started.</p>
          <button
            onClick={handleInstall}
            className="bg-white text-black font-semibold text-sm px-6 py-3 rounded-xl hover:bg-neutral-200 active:scale-95 transition-all"
          >
            Install GitHub App
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {repos.map((repo) => (
            <RepoRow
              key={repo.fullName || repo._id}
              repo={repo}
              onToggle={handleToggle}
              toggling={toggling}
              onRulesSaved={loadRepos}
            />
          ))}
        </div>
      )}
    </div>
  );
}

