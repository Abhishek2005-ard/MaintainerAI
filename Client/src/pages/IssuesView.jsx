import { useEffect, useState } from 'react';
import { repos as reposApi, issues as issuesApi } from '../services/api';

const PRIORITY_COLORS = {
  high: 'bg-red-500/20 text-red-400 border-red-500/30',
  medium: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  low: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
};

const LABEL_COLORS = [
  'bg-blue-500/20 text-blue-400',
  'bg-purple-500/20 text-purple-400',
  'bg-pink-500/20 text-pink-400',
  'bg-yellow-500/20 text-yellow-400',
  'bg-cyan-500/20 text-cyan-400',
];

function LabelBadge({ label, idx }) {
  return (
    <span className={`px-2 py-0.5 text-xs rounded-full ${LABEL_COLORS[idx % LABEL_COLORS.length]}`}>
      {label}
    </span>
  );
}

export default function IssuesView() {
  const [repositories, setRepositories] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState('');
  const [stateFilter, setStateFilter] = useState('open');
  const [issues, setIssues] = useState([]);
  const [loadingRepos, setLoadingRepos] = useState(true);
  const [loadingIssues, setLoadingIssues] = useState(false);
  const [error, setError] = useState(null);

  // Load repos on mount
  useEffect(() => {
    async function fetchRepos() {
      try {
        const { repositories } = await reposApi.list();
        setRepositories(repositories || []);
        if (repositories?.length > 0) {
          setSelectedRepo(repositories[0].fullName);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingRepos(false);
      }
    }
    fetchRepos();
  }, []);

  // Load issues when repo or state changes
  useEffect(() => {
    if (!selectedRepo) return;
    const [owner, repo] = selectedRepo.split('/');
    if (!owner || !repo) return;

    async function fetchIssues() {
      setLoadingIssues(true);
      setError(null);
      try {
        const { issues } = await issuesApi.list(owner, repo, stateFilter);
        setIssues(issues || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingIssues(false);
      }
    }
    fetchIssues();
  }, [selectedRepo, stateFilter]);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Triage Queue</h1>
          <p className="text-neutral-400 mt-1 text-sm">Real GitHub issues from your monitored repositories.</p>
        </div>
        <span className="text-xs text-neutral-600 border border-white/10 px-3 py-1.5 rounded-lg">
          {issues.length} issue{issues.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        {/* Repo selector */}
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-neutral-500 text-base">folder</span>
          {loadingRepos ? (
            <span className="text-sm text-neutral-500">Loading repos…</span>
          ) : repositories.length === 0 ? (
            <span className="text-sm text-neutral-500">No repos — go to Settings to add one.</span>
          ) : (
            <select
              id="repo-selector"
              value={selectedRepo}
              onChange={(e) => setSelectedRepo(e.target.value)}
              className="bg-neutral-900 border border-white/10 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-white/30"
            >
              {repositories.map((r) => (
                <option key={r.fullName} value={r.fullName}>{r.fullName}</option>
              ))}
            </select>
          )}
        </div>

        {/* State filter */}
        <div className="flex rounded-lg border border-white/10 overflow-hidden">
          {['open', 'closed', 'all'].map((s) => (
            <button
              key={s}
              onClick={() => setStateFilter(s)}
              className={`px-4 py-2 text-sm capitalize transition-colors ${
                stateFilter === s
                  ? 'bg-white text-black font-semibold'
                  : 'bg-transparent text-neutral-400 hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-white/10 overflow-hidden" style={{ background: 'rgba(18,18,18,0.8)' }}>
        <table className="w-full text-left">
          <thead className="border-b border-white/10">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider">#</th>
              <th className="px-6 py-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Issue</th>
              <th className="px-6 py-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Labels</th>
              <th className="px-6 py-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider">State</th>
              <th className="px-6 py-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Opened</th>
              <th className="px-6 py-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Link</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loadingIssues ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-neutral-500">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-neutral-700 border-t-neutral-300 rounded-full animate-spin" />
                    Loading issues…
                  </div>
                </td>
              </tr>
            ) : issues.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-neutral-500">
                  No {stateFilter !== 'all' ? stateFilter : ''} issues found.
                </td>
              </tr>
            ) : (
              issues.map((issue) => (
                <tr key={issue.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 text-sm text-neutral-500">#{issue.number}</td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-white font-medium">{issue.title}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">by {issue.user?.login}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {(issue.labels || []).map((l, i) => (
                        <LabelBadge key={l.id || l.name} label={l.name} idx={i} />
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 text-xs rounded-full border capitalize ${
                      issue.state === 'open'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : 'bg-neutral-500/20 text-neutral-400 border-neutral-500/30'
                    }`}>
                      {issue.state}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-neutral-500">
                    {new Date(issue.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <a
                      href={issue.html_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-neutral-400 hover:text-white transition-colors"
                    >
                      <span className="material-symbols-outlined text-base">open_in_new</span>
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
