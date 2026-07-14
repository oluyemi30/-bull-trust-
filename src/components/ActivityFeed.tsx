import React, { useState, useEffect } from "react";
import { Radio, ShieldAlert, Award, MessageSquare, Layers, UserPlus, Heart, RefreshCw } from "lucide-react";
import { Activity } from "../types";

interface ActivityFeedProps {
  addToast: (message: string, type: "success" | "error" | "info") => void;
}

export default function ActivityFeed({ addToast }: ActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/activities");
      const data = await res.json();
      setActivities(data);
    } catch (err) {
      console.error(err);
      addToast("Failed to sync live activity feed ledger", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
    // Poll for new live events every 15 seconds to simulate a live production feed!
    const interval = setInterval(fetchActivities, 15000);
    return () => clearInterval(interval);
  }, []);

  const getIconForType = (type: Activity["type"]) => {
    switch (type) {
      case "new_builder":
        return <UserPlus className="h-4 w-4 text-emerald-400" />;
      case "badge_earned":
        return <Award className="h-4 w-4 text-pink-500" />;
      case "project_verified":
        return <Layers className="h-4 w-4 text-amber-500" />;
      case "review_posted":
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case "follow":
        return <Heart className="h-4 w-4 text-rose-500 fill-rose-500/10" />;
      default:
        return <ShieldAlert className="h-4 w-4 text-zinc-500" />;
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 text-zinc-100">
      
      {/* TITLE ROW */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2 font-display text-zinc-100">
            <Radio className="h-6 w-6 text-emerald-400 animate-pulse" />
            Live Ecosystem Activity Feed
          </h1>
          <p className="text-xs text-zinc-400 mt-1.5">
            Real-time scrolling block feed of peer reviews, project approvals, skills endorsements, and badge updates.
          </p>
        </div>
        <button
          onClick={fetchActivities}
          className="rounded-xl p-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-100 transition-all cursor-pointer"
          title="Refresh Feed Ledger"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-zinc-800 bg-[#0c0c0e]/80 p-5 space-y-3 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="h-7 w-7 rounded-full bg-zinc-900" />
                <div className="h-4 w-40 bg-zinc-900 rounded-md" />
              </div>
              <div className="h-3 w-full bg-zinc-900 rounded-md" />
            </div>
          ))}
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center rounded-3xl border border-dashed border-zinc-800 p-12 bg-zinc-900/10">
          <Radio className="h-8 w-8 text-zinc-700 mx-auto mb-3 animate-pulse" />
          <h4 className="text-sm font-bold text-zinc-300 font-display">Activity Feed Silent</h4>
          <p className="text-xs text-zinc-500 mt-1">There are currently no active transactions inside the public feed registry.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((act) => (
            <div
              key={act.id}
              className="flex gap-4 rounded-2xl border border-zinc-800 bg-[#0c0c0e] p-5 shadow-xl hover:border-emerald-500/30 relative overflow-hidden group bento-glow transition-all duration-300"
            >
              {/* Type colored accent sidebar bar */}
              <div className="absolute top-0 bottom-0 left-0 w-1 bg-emerald-500/10 group-hover:bg-emerald-500 transition-all" />

              {/* USER AVATAR & TRANSACTION TYPE */}
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-zinc-800 bg-zinc-950 relative">
                {act.user ? (
                  <img src={act.user.avatar} alt={act.user.username} className="h-full w-full rounded-full object-cover" />
                ) : (
                  <UserPlus className="h-4 w-4 text-zinc-500" />
                )}
                <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#0c0c0e] border border-zinc-800 shadow-md">
                  {getIconForType(act.type)}
                </div>
              </div>

              {/* DETAIL CONTENT */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-zinc-200">
                    {act.user ? `@${act.user.username}` : "Anonymous Builder"}
                  </span>
                  <span className="text-[9px] text-zinc-500 font-mono">
                    {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed mt-1">
                  {act.details}
                </p>

                {/* Simulated Ledger Signature / Transaction block hash details */}
                <div className="mt-3 flex items-center justify-between text-[8px] font-mono text-zinc-500 pt-2 border-t border-zinc-900 border-dashed">
                  <span>BLOCK SIG: <strong className="text-zinc-400 font-bold truncate select-all">{act.id.toUpperCase()}-ANSEM-LEDGER</strong></span>
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-emerald-400 border border-emerald-500/20">
                    CONCURRENCE
                  </span>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
