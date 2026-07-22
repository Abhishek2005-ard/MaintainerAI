import { useState } from 'react';

export default function DashboardPreview() {
  const [timeframe, setTimeframe] = useState('7D');
  const [optimized, setOptimized] = useState(false);

  const barData = {
    '7D': [40, 55, 45, 85, 95, 30, 20],
    '30D': [25, 35, 60, 75, 40, 80, 50],
    '90D': [50, 40, 30, 90, 65, 45, 35],
  };

  const currentBars = barData[timeframe];

  return (
    <section id="dashboard" className="py-24 px-4 sm:px-6 lg:px-margin-desktop overflow-hidden bg-surface-container-lowest/50 border-t border-outline-variant/30">
      <div className="max-w-max-width mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="font-label-md text-label-md text-secondary uppercase tracking-widest block mb-2 font-bold">
            Interactive Control Center
          </span>
          <h2 className="font-headline-lg text-2xl sm:text-headline-lg text-on-surface mb-4">
            Real-time Repository Health Command
          </h2>
          <p className="font-body-md text-on-surface-variant">
            Monitor workloads, identify bottlenecks, and let automated AI policies adjust repository velocity.
          </p>
        </div>

        {/* Dashboard Frame */}
        <div className="max-w-max-width mx-auto glass-card rounded-2xl overflow-hidden border-outline/20 shadow-2xl shadow-black/80">
          {/* Dashboard Window Header */}
          <div className="p-4 sm:p-6 bg-surface-container flex items-center justify-between border-b border-outline-variant">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-error"></div>
              <div className="w-3 h-3 rounded-full bg-tertiary"></div>
              <div className="w-3 h-3 rounded-full bg-secondary"></div>
            </div>
            <div className="font-label-md text-xs sm:text-label-md text-on-surface-variant flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-secondary">verified</span>
              MaintainerAI Dashboard — <span className="text-on-surface font-mono">main/repository-health</span>
            </div>
            <div className="flex gap-2">
              {['7D', '30D', '90D'].map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-3 py-1 text-xs font-mono rounded-lg transition-colors ${
                    timeframe === tf
                      ? 'bg-primary-container text-primary font-bold'
                      : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          {/* Dashboard Body */}
          <div className="p-6 sm:p-10 flex flex-col lg:flex-row gap-10">
            {/* Chart Area */}
            <div className="flex-1">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-headline-md text-headline-md text-on-surface font-semibold">
                    Maintainer Workload & Load Score
                  </h3>
                  <p className="text-xs text-on-surface-variant font-mono">
                    Aggregated issue velocity vs response latency
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-secondary">
                  <span className="w-2.5 h-2.5 rounded-full bg-secondary inline-block"></span>
                  <span>Normal Load</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-tertiary inline-block ml-3"></span>
                  <span>Peak Spike</span>
                </div>
              </div>

              {/* Bar Chart Visualization */}
              <div className="h-64 relative bg-surface-container-lowest rounded-xl p-6 flex items-end justify-between gap-3 border border-outline-variant/20">
                {currentBars.map((height, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                    <div
                      style={{ height: `${height}%` }}
                      className={`w-full max-w-[42px] ${
                        height > 75 ? 'bg-tertiary shadow-lg shadow-tertiary/20' : 'bg-secondary opacity-80 group-hover:opacity-100'
                      } rounded-t-md transition-all duration-500`}
                    ></div>
                    <span className="text-[10px] font-mono text-on-surface-variant mt-2">
                      Day {i + 1}
                    </span>
                    {/* Tooltip */}
                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 bg-surface-container-highest text-on-surface text-[10px] font-mono py-1 px-2 rounded border border-outline-variant pointer-events-none transition-opacity">
                      {height * 12} pings/hr
                    </div>
                  </div>
                ))}
                <div className="absolute inset-x-0 bottom-8 h-[1px] bg-outline-variant/30"></div>
              </div>
            </div>

            {/* Sidebar Controls & Gauges */}
            <div className="w-full lg:w-80 flex flex-col gap-6 justify-between">
              <div className="p-6 bg-surface-container-high rounded-xl border border-outline-variant/30">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-label-md text-label-md text-on-surface">Current Load Score</span>
                  <span className={`font-bold font-mono text-xs px-2 py-0.5 rounded ${optimized ? 'bg-secondary/20 text-secondary' : 'bg-tertiary/20 text-tertiary'}`}>
                    {optimized ? 'Optimal' : 'Monitoring'}
                  </span>
                </div>
                <div className="w-full h-3 bg-surface-container rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-full transition-all duration-700 ${optimized ? 'w-[42%] bg-secondary' : 'w-[72%] bg-tertiary'}`}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-on-surface-variant font-mono">
                  <span>Capacity: {optimized ? '42%' : '72%'}</span>
                  <span>Threshold: 80%</span>
                </div>
              </div>

              <div className="p-6 bg-surface-container-high rounded-xl border border-outline-variant/30">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-label-md text-label-md text-on-surface">Queue Latency</span>
                  <span className="text-secondary font-bold font-mono text-xs px-2 py-0.5 rounded bg-secondary/20">
                    Healthy (2.4h)
                  </span>
                </div>
                <div className="w-full h-3 bg-surface-container rounded-full overflow-hidden mb-2">
                  <div className="w-[35%] h-full bg-secondary transition-all duration-500"></div>
                </div>
                <div className="flex justify-between text-xs text-on-surface-variant font-mono">
                  <span>PR SLA: 98%</span>
                  <span>Avg Triage: 4m</span>
                </div>
              </div>

              <button
                onClick={() => setOptimized(!optimized)}
                className={`w-full py-3.5 px-4 font-label-md text-label-md rounded-xl transition-all flex items-center justify-center gap-2 font-semibold shadow-md ${
                  optimized
                    ? 'bg-secondary text-on-secondary hover:opacity-90'
                    : 'bg-primary-container text-primary hover:bg-primary-container/80'
                }`}
              >
                <span className="material-symbols-outlined text-lg">
                  {optimized ? 'check_circle' : 'tune'}
                </span>
                {optimized ? 'Triage Rules Active' : 'Optimize Triage Rules'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
