import { useEffect, useState } from 'react';
import { repos as reposApi, issues as issuesApi, reports as reportsApi } from '../services/api';

const PRIORITY_COLORS = {
  critical: 'bg-rose-600/20 text-rose-400 border-rose-600/30',
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

  // AI Triage Drawer States
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [triageReport, setTriageReport] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);

  const handleOpenDrawer = async (issue) => {
    setSelectedIssue(issue);
    setDrawerOpen(true);
    setLoadingReport(true);
    setTriageReport(null);
    
    try {
      const [owner, repo] = selectedRepo.split('/');
      const res = await reportsApi.getByIssue(owner, repo, issue.number);
      if (res.success && res.reports && res.reports.length > 0) {
        setTriageReport(res.reports[0]);
      } else {
        setTriageReport(null);
      }
    } catch (err) {
      console.error('Failed to load triage report:', err);
    } finally {
      setLoadingReport(false);
    }
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedIssue(null);
    setTriageReport(null);
  };

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
                <tr
                  key={issue.id}
                  onClick={() => handleOpenDrawer(issue)}
                  className="hover:bg-white/5 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4 text-sm text-neutral-500">#{issue.number}</td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-white font-medium flex items-center gap-1.5">
                      {issue.title}
                      {issue.labels?.some(l => l.name === 'duplicate') && (
                        <span className="inline-block w-2 h-2 rounded-full bg-purple-400" title="Duplicate detected" />
                      )}
                      {issue.labels?.some(l => l.name === 'burnout-risk') && (
                        <span className="inline-block w-2 h-2 rounded-full bg-red-400" title="Burnout risk detected" />
                      )}
                    </p>
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
                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDrawer(issue);
                        }}
                        className="text-neutral-400 hover:text-white transition-colors flex items-center"
                        title="View AI Triage Details"
                      >
                        <span className="material-symbols-outlined text-base">psychology</span>
                      </button>
                      <a
                        href={issue.html_url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-neutral-400 hover:text-white transition-colors"
                      >
                        <span className="material-symbols-outlined text-base">open_in_new</span>
                      </a>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Triage Detail Drawer Overlay */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={handleCloseDrawer}
          />
          
          {/* Drawer content */}
          <div className="relative w-full max-w-lg bg-neutral-950 border-l border-white/10 shadow-2xl flex flex-col h-full transform transition-transform duration-300">
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-neutral-400 font-mono">
                  <span>{selectedRepo}</span>
                  <span>·</span>
                  <span>#{selectedIssue?.number}</span>
                </div>
                <h2 className="text-lg font-bold text-white leading-snug">{selectedIssue?.title}</h2>
              </div>
              <button
                onClick={handleCloseDrawer}
                className="w-8 h-8 rounded-lg flex items-center justify-center border border-white/10 text-neutral-400 hover:text-white hover:bg-white/5 transition-all focus:outline-none"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 font-sans">
              {loadingReport ? (
                <div className="flex flex-col items-center justify-center py-20 text-neutral-500 gap-3">
                  <div className="w-8 h-8 border-2 border-neutral-700 border-t-neutral-300 rounded-full animate-spin" />
                  <p className="text-sm">Fetching AI Triage Report...</p>
                </div>
              ) : triageReport ? (
                <>
                  {/* Category & Priority Badge Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border border-white/5 bg-white/5 space-y-1">
                      <span className="text-[10px] text-neutral-500 uppercase tracking-wider block font-semibold">Predicted Category</span>
                      <span className={`inline-flex px-2.5 py-0.5 text-xs font-semibold rounded-full border capitalize ${
                        triageReport.analysis?.category === 'bug' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                        triageReport.analysis?.category === 'feature' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' :
                        triageReport.analysis?.category === 'question' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                        'bg-neutral-500/20 text-neutral-400 border-neutral-500/30'
                      }`}>
                        {triageReport.analysis?.category || 'other'}
                      </span>
                    </div>

                    <div className="p-4 rounded-xl border border-white/5 bg-white/5 space-y-1">
                      <span className="text-[10px] text-neutral-500 uppercase tracking-wider block font-semibold">Priority Level</span>
                      <span className={`inline-flex px-2.5 py-0.5 text-xs font-semibold rounded-full border capitalize ${
                        PRIORITY_COLORS[triageReport.predictedPriority || triageReport.analysis?.priority || 'low']
                      }`}>
                        {triageReport.predictedPriority || triageReport.analysis?.priority || 'low'}
                      </span>
                    </div>
                  </div>

                  {/* Burnout Risk Alert */}
                  {triageReport.analysis?.burnoutRisk && (
                    <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm flex gap-3 items-start animate-pulse">
                      <span className="material-symbols-outlined text-red-400 flex-shrink-0">warning</span>
                      <div>
                        <p className="font-semibold">Developer Burnout Risk Flagged</p>
                        <p className="text-xs text-red-400/80 mt-1">This issue's tone was flagged by the AI as demanding, toxic, or stressful. An automated burnout shield comment was posted on GitHub to request patient communication.</p>
                      </div>
                    </div>
                  )}

                  {/* Duplicate Alert Status */}
                  <div className={`p-4 rounded-xl border text-sm flex gap-3 items-center ${
                    triageReport.isDuplicate
                      ? 'border-purple-500/30 bg-purple-500/10 text-purple-400'
                      : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                  }`}>
                    <span className="material-symbols-outlined flex-shrink-0">
                      {triageReport.isDuplicate ? 'content_copy' : 'check_circle'}
                    </span>
                    <div>
                      <p className="font-semibold">
                        {triageReport.isDuplicate ? 'Duplicate Issue Detected' : 'Unique Issue Verified'}
                      </p>
                      {triageReport.isDuplicate && (
                        <p className="text-xs text-purple-400/80 mt-0.5">
                          Identified as a duplicate of issue{' '}
                          <a
                            href={`https://github.com/${selectedRepo}/issues/${triageReport.duplicateOfNumber}`}
                            target="_blank"
                            rel="noreferrer"
                            className="underline hover:text-white"
                          >
                            #{triageReport.duplicateOfNumber}
                          </a>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* AI Reasoning / Analysis */}
                  <div className="space-y-2">
                    <h3 className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">AI Reasoning</h3>
                    <div className="p-4 rounded-xl border border-white/5 bg-white/5 text-sm text-neutral-300 leading-relaxed font-sans whitespace-pre-line">
                      {triageReport.analysis?.reasoning || 'No analysis explanation available.'}
                    </div>
                  </div>

                  {/* Labels List */}
                  <div className="space-y-2">
                    <h3 className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">Applied Labels</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {triageReport.predictedLabels && triageReport.predictedLabels.length > 0 ? (
                        triageReport.predictedLabels.map((label, idx) => (
                          <span key={label} className="px-2.5 py-1 text-xs rounded-lg bg-neutral-900 border border-white/10 text-neutral-200">
                            {label}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-neutral-500">No predicted labels applied.</span>
                      )}
                    </div>
                  </div>

                  {/* LangGraph Execution Steps */}
                  <div className="space-y-3">
                    <h3 className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">LangGraph Execution Path</h3>
                    <div className="space-y-3.5 pl-3 border-l border-white/10 ml-1.5">
                      {triageReport.executionLogs && triageReport.executionLogs.length > 0 ? (
                        triageReport.executionLogs.map((log, idx) => (
                          <div key={idx} className="relative flex items-start gap-3">
                            <div className="absolute -left-[17px] top-1.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-neutral-950 shadow" />
                            <span className="text-xs font-mono text-neutral-400 leading-none pt-0.5">{log}</span>
                          </div>
                        ))
                      ) : (
                        <div className="relative flex items-start gap-3">
                          <div className="absolute -left-[17px] top-1.5 w-2.5 h-2.5 rounded-full bg-neutral-600 border-2 border-neutral-950 shadow" />
                          <span className="text-xs font-mono text-neutral-500 leading-none pt-0.5">Triage workflow completed (no logs reported)</span>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-neutral-500 text-center gap-3">
                  <span className="material-symbols-outlined text-4xl text-neutral-700">report_off</span>
                  <div>
                    <p className="font-semibold text-neutral-400">No Local Triage Report</p>
                    <p className="text-xs text-neutral-600 max-w-xs mt-1">This issue has not been triaged by the AI service yet. Webhook triage triggers only run for newly created or updated issues.</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="p-6 border-t border-white/10 bg-white/5 flex gap-3">
              <a
                href={selectedIssue?.html_url}
                target="_blank"
                rel="noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white text-black font-semibold text-sm hover:bg-neutral-200 active:scale-95 transition-all text-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23a11.52 11.52 0 0 1 3-.405c1.02.005 2.045.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z" />
                </svg>
                View on GitHub
              </a>
              <button
                onClick={handleCloseDrawer}
                className="py-3 px-6 rounded-xl border border-white/10 text-neutral-300 hover:border-white/20 hover:text-white transition-all text-sm font-semibold focus:outline-none"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
