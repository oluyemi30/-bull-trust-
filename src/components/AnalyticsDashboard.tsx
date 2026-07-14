import React, { useState, useEffect } from "react";
import { BarChart3, TrendingUp, Users, Layers, Award, Percent, RefreshCw } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { AnalyticsData } from "../types";

interface AnalyticsDashboardProps {
  addToast: (message: string, type: "success" | "error" | "info") => void;
}

const COLORS = ["#10b981", "#06b6d4", "#8b5cf6", "#ec4899", "#f59e0b", "#14b8a6", "#3b82f6"];

export default function AnalyticsDashboard({ addToast }: AnalyticsDashboardProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/analytics");
      const result = await res.json();
      setData(result);
    } catch (err) {
      console.error(err);
      addToast("Failed to compile database metrics", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading || !data) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex flex-col items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 text-emerald-400 animate-spin mb-4" />
        <h3 className="text-sm font-bold tracking-tight font-display text-zinc-200">Aggregating ecosystem analytics metrics...</h3>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 text-zinc-100">
      
      {/* HEADER ROW */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2 font-display text-zinc-100">
            <BarChart3 className="h-6 w-6 text-emerald-400" />
            Ecosystem Analytics Dashboard
          </h1>
          <p className="text-xs text-zinc-400 mt-1.5">
            Visual statistics and network metrics compiling builder growth, project activity indexes, and peer trust alignments.
          </p>
        </div>
        <button
          onClick={fetchAnalytics}
          className="rounded-xl p-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-100 transition-all cursor-pointer"
          title="Refresh Statistics"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* METRIC SUMMARIES */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="rounded-2xl border border-zinc-800 bg-[#0c0c0e] p-5 shadow-xl flex items-center gap-4 bento-glow transition-all hover:border-emerald-500/20">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block font-mono">Total Builders</span>
            <strong className="text-xl font-extrabold text-zinc-100 font-mono">{data.metrics.totalBuilders}</strong>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-[#0c0c0e] p-5 shadow-xl flex items-center gap-4 bento-glow transition-all hover:border-emerald-500/20">
          <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block font-mono">Ecosystem Projects</span>
            <strong className="text-xl font-extrabold text-zinc-100 font-mono">{data.metrics.totalProjects}</strong>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-[#0c0c0e] p-5 shadow-xl flex items-center gap-4 bento-glow transition-all hover:border-emerald-500/20">
          <div className="p-3 bg-teal-500/10 text-teal-400 rounded-xl border border-teal-500/20">
            <Percent className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block font-mono">Average Trust Index</span>
            <strong className="text-xl font-extrabold text-zinc-100 font-mono">{data.metrics.avgTrustScore}%</strong>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-[#0c0c0e] p-5 shadow-xl flex items-center gap-4 bento-glow transition-all hover:border-emerald-500/20">
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block font-mono">Peer Evaluations</span>
            <strong className="text-xl font-extrabold text-zinc-100 font-mono">{data.metrics.totalReviews}</strong>
          </div>
        </div>
      </div>

      {/* BENTO GRID CHARTS (FEATURE 14) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* CHART 1: BUILDER GROWTH (MoM AREA) */}
        <div className="rounded-3xl border border-zinc-800 bg-[#0c0c0e] p-6 shadow-xl flex flex-col justify-between bento-glow hover:border-emerald-500/10 transition-all">
          <div className="mb-4">
            <h3 className="text-sm font-bold tracking-tight font-display text-zinc-200">Builder Registration & Project Growth</h3>
            <p className="text-[11px] text-zinc-500">Cumulative monthly registrations of developer passports and submitted code bases.</p>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.builderGrowth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBuilders" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorProjects" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#18181b" vertical={false} />
                <XAxis dataKey="month" tickLine={false} style={{ fontSize: 9, fontWeight: "bold", fill: "#71717a", fontFamily: "monospace" }} />
                <YAxis tickLine={false} axisLine={false} style={{ fontSize: 9, fontWeight: "bold", fill: "#71717a", fontFamily: "monospace" }} />
                <Tooltip contentStyle={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 12, color: "#f4f4f5", fontSize: 11 }} />
                <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 10, fontWeight: "bold", paddingTop: 10, color: "#a1a1aa" }} />
                <Area type="monotone" name="Builders" dataKey="builders" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorBuilders)" />
                <Area type="monotone" name="Projects" dataKey="projects" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorProjects)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 2: TRUST BRACKETS (BAR CHART) */}
        <div className="rounded-3xl border border-zinc-800 bg-[#0c0c0e] p-6 shadow-xl flex flex-col justify-between bento-glow hover:border-emerald-500/10 transition-all">
          <div className="mb-4">
            <h3 className="text-sm font-bold tracking-tight font-display text-zinc-200">Trust Score Range Distribution</h3>
            <p className="text-[11px] text-zinc-500">Volumetric count of developers residing in specific decentralized trust tiers.</p>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.trustScoreDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#18181b" vertical={false} />
                <XAxis dataKey="range" tickLine={false} style={{ fontSize: 9, fontWeight: "bold", fill: "#71717a", fontFamily: "monospace" }} />
                <YAxis tickLine={false} axisLine={false} allowDecimals={false} style={{ fontSize: 9, fontWeight: "bold", fill: "#71717a", fontFamily: "monospace" }} />
                <Tooltip contentStyle={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 12, color: "#f4f4f5", fontSize: 11 }} />
                <Bar dataKey="count" name="Builders Count" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={45}>
                  {data.trustScoreDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? "#10b981" : index === 1 ? "#8b5cf6" : "#f59e0b"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 3: PROJECT CATEGORY ACTIVITY (DONUT CHART) */}
        <div className="rounded-3xl border border-zinc-800 bg-[#0c0c0e] p-6 shadow-xl flex flex-col justify-between bento-glow hover:border-emerald-500/10 transition-all">
          <div className="mb-4">
            <h3 className="text-sm font-bold tracking-tight font-display text-zinc-200">Project Category Distribution</h3>
            <p className="text-[11px] text-zinc-500">Volumetric breakdown of registered code bases across ecosystem categories.</p>
          </div>
          <div className="h-[250px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.projectActivity}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="count"
                >
                  {data.projectActivity.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 12, color: "#f4f4f5", fontSize: 11 }} />
                <Legend iconSize={8} iconType="circle" layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{ fontSize: 10, fontWeight: "bold", paddingLeft: 10, color: "#a1a1aa" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 4: TOP CONTRIBUTORS (HORIZONTAL BAR CHART) */}
        <div className="rounded-3xl border border-zinc-800 bg-[#0c0c0e] p-6 shadow-xl flex flex-col justify-between bento-glow hover:border-emerald-500/10 transition-all">
          <div className="mb-4">
            <h3 className="text-sm font-bold tracking-tight font-display text-zinc-200">Developer Contribution Power Leaderboard</h3>
            <p className="text-[11px] text-zinc-500">Calculated aggregate index based on public repos, audits submitted, and ratings earned.</p>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.heatmap.slice(0, 5)} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#18181b" horizontal={false} />
                <XAxis type="number" tickLine={false} style={{ fontSize: 9, fontWeight: "bold", fill: "#71717a", fontFamily: "monospace" }} />
                <YAxis dataKey="username" type="category" tickLine={false} style={{ fontSize: 9, fontWeight: "bold", fill: "#71717a", fontFamily: "monospace" }} />
                <Tooltip contentStyle={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 12, color: "#f4f4f5", fontSize: 11 }} />
                <Bar dataKey="contributions" name="Contribution Power Score" fill="#8b5cf6" radius={[0, 4, 4, 0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
}
