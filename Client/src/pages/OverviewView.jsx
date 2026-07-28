import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { reports as reportsApi } from '../services/api';

function StatCard({ icon, label, value, sub, color = 'white' }) {
  return (
    <div className="rounded-xl border border-white/10 p-6" style={{ background: 'rgba(18,18,18,0.8)' }}>
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <span className="material-symbols-outlined text-xl" style={{ color }}>{icon}</span>
        </div>
      </div>
      <p className="text-3xl font-bold text-white mb-1">{value}</p>
      <p className="text-sm text-neutral-400">{label}</p>
      {sub && <p className="text-xs text-neutral-600 mt-1">{sub}</p>}
    </div>
  );
}

function BreakdownBar({ data, colors }) {
  const total = Object.values(data).reduce((s, v) => s + v, 0);
  if (!total) return <p className="text-neutral-600 text-sm">No data yet.</p>;
  return (
    <div className="space-y-2">
      {Object.entries(data).map(([key, count], i) => (
        <div key={key} className="flex items-center gap-3">
          <span className="text-xs text-neutral-400 w-20 capitalize truncate">{key}</span>
          <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${(count / total) * 100}%`, background: colors[i % colors.length] }}
            />
          </div>
          <span className="text-xs text-neutral-500 w-6 text-right">{count}</span>
        </div>
      ))}
    </div>
  );
}

export default function OverviewView() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    reportsApi.getDashboardStats()
      .then(({ stats }) => { setStats(stats); setLoading(false); })
      .catch((err) => { setError(err.message); setLoading(false); });
  }, []);

  const duplicateRate = stats
    ? stats.totalIssues > 0 ? ((stats.duplicates / stats.totalIssues) * 100).toFixed(1) : '0'
    : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Overview</h1>
          <p className="text-neutral-400 mt-1 text-sm">Live stats from your MongoDB reports database.</p>
        </div>
        <Link to="/dashboard/issues" className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors">
          View Issues <span className="material-symbols-outlined text-base">arrow_forward</span>
        </Link>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm">
          <span className="font-semibold">Could not load stats:</span> {error}
          <br /><span className="text-xs text-red-500">Make sure the backend Gateway is running on port 8000.</span>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon="task_alt" label="Total Issues Triaged" value={loading ? '—' : (stats?.totalIssues ?? 0)} />
        <StatCard icon="content_copy" label="Duplicates Caught" value={loading ? '—' : (stats?.duplicates ?? 0)} sub={duplicateRate ? `${duplicateRate}% of total` : null} color="#a78bfa" />
        <StatCard icon="sentiment_very_dissatisfied" label="Burnout Risk Detected" value={loading ? '—' : (stats?.burnoutRisk ?? 0)} color="#f87171" />
        <StatCard icon="analytics" label="Categories Found" value={loading ? '—' : Object.keys(stats?.categoryBreakdown ?? {}).length} color="#34d399" />
      </div>

      {/* Breakdowns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-white/10 p-6" style={{ background: 'rgba(18,18,18,0.8)' }}>
          <h2 className="text-sm font-semibold text-white mb-4">Priority Breakdown</h2>
          {loading ? <p className="text-neutral-500 text-sm">Loading…</p> : (
            <BreakdownBar data={stats?.priorityBreakdown ?? {}} colors={['#f87171', '#fb923c', '#facc15', '#34d399']} />
          )}
        </div>
        <div className="rounded-xl border border-white/10 p-6" style={{ background: 'rgba(18,18,18,0.8)' }}>
          <h2 className="text-sm font-semibold text-white mb-4">Category Breakdown</h2>
          {loading ? <p className="text-neutral-500 text-sm">Loading…</p> : (
            <BreakdownBar data={stats?.categoryBreakdown ?? {}} colors={['#60a5fa', '#a78bfa', '#f472b6', '#34d399', '#fb923c']} />
          )}
        </div>
      </div>
    </div>
  );
}
