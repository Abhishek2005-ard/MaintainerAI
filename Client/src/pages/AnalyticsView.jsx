import { useEffect, useState } from 'react';
import { reports as reportsApi } from '../services/api';

const PRIORITY_COLORS = ['#f87171', '#fb923c', '#facc15', '#34d399', '#60a5fa'];
const CATEGORY_COLORS = ['#60a5fa', '#a78bfa', '#f472b6', '#34d399', '#fb923c', '#facc15'];

function DonutRing({ data, colors, size = 140, thickness = 22 }) {
  const total = Object.values(data).reduce((s, v) => s + v, 0);
  if (!total) return <p className="text-neutral-600 text-sm text-center py-8">No data yet.</p>;

  const r = (size - thickness) / 2;
  const circ = 2 * Math.PI * r;
  let offset = 0;

  const segments = Object.entries(data).map(([key, count], i) => {
    const frac = count / total;
    const dash = frac * circ;
    const seg = { key, count, frac, dash, offset, color: colors[i % colors.length] };
    offset += dash;
    return seg;
  });

  return (
    <div className="flex items-center gap-6">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="flex-shrink-0">
        {segments.map((seg) => (
          <circle
            key={seg.key}
            cx={size / 2} cy={size / 2} r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth={thickness}
            strokeDasharray={`${seg.dash} ${circ - seg.dash}`}
            strokeDashoffset={-seg.offset + circ / 4}
            style={{ transition: 'stroke-dasharray 0.8s ease' }}
          />
        ))}
        <text x={size / 2} y={size / 2 + 6} textAnchor="middle" className="fill-white text-sm font-bold" style={{ fontSize: 22, fill: 'white', fontWeight: 700 }}>
          {total}
        </text>
      </svg>
      <div className="space-y-1.5 flex-1">
        {segments.map((seg) => (
          <div key={seg.key} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: seg.color }} />
            <span className="text-xs text-neutral-400 capitalize flex-1 truncate">{seg.key}</span>
            <span className="text-xs text-neutral-500">{seg.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DigestStat({ label, value, icon, color = 'text-white' }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
      <span className={`material-symbols-outlined text-xl ${color}`}>{icon}</span>
      <div>
        <p className="text-lg font-bold text-white">{value}</p>
        <p className="text-xs text-neutral-500">{label}</p>
      </div>
    </div>
  );
}

export default function AnalyticsView() {
  const [stats, setStats] = useState(null);
  const [digest, setDigest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([reportsApi.getDashboardStats(), reportsApi.getWeeklyDigest()])
      .then(([statsRes, digestRes]) => {
        setStats(statsRes.stats);
        setDigest(digestRes.digest);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Analytics</h1>
        <p className="text-neutral-400 mt-1 text-sm">Aggregated triage performance from all stored reports.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm">{error}</div>
      )}

      {/* Weekly Digest */}
      <div className="rounded-xl border border-white/10 p-6 mb-6" style={{ background: 'rgba(18,18,18,0.8)' }}>
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-neutral-400 text-xl">calendar_today</span>
          <h2 className="text-base font-semibold text-white">Last 7 Days</h2>
          <span className="ml-auto text-xs text-neutral-600">{digest?.generatedAt ? new Date(digest.generatedAt).toLocaleString() : ''}</span>
        </div>
        {loading ? (
          <p className="text-neutral-500 text-sm">Loading…</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <DigestStat label="Issues Triaged" value={digest?.totalTriaged ?? 0} icon="task_alt" color="text-emerald-400" />
            <DigestStat label="Duplicates" value={digest?.duplicates ?? 0} icon="content_copy" color="text-purple-400" />
            <DigestStat label="Burnout Alerts" value={digest?.burnoutRisk ?? 0} icon="sentiment_very_dissatisfied" color="text-red-400" />
            <DigestStat label="Categories" value={Object.keys(digest?.categoryBreakdown ?? {}).length} icon="category" color="text-blue-400" />
          </div>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-white/10 p-6" style={{ background: 'rgba(18,18,18,0.8)' }}>
          <h2 className="text-sm font-semibold text-white mb-5">Priority Distribution (All Time)</h2>
          {loading ? <p className="text-neutral-500 text-sm">Loading…</p> : (
            <DonutRing data={stats?.priorityBreakdown ?? {}} colors={PRIORITY_COLORS} />
          )}
        </div>
        <div className="rounded-xl border border-white/10 p-6" style={{ background: 'rgba(18,18,18,0.8)' }}>
          <h2 className="text-sm font-semibold text-white mb-5">Category Distribution (All Time)</h2>
          {loading ? <p className="text-neutral-500 text-sm">Loading…</p> : (
            <DonutRing data={stats?.categoryBreakdown ?? {}} colors={CATEGORY_COLORS} />
          )}
        </div>
      </div>
    </div>
  );
}
