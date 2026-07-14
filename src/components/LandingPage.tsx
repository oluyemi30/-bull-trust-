import React, { useState, useEffect } from "react";
import { 
  Shield, 
  Compass, 
  User, 
  BarChart3, 
  Radio, 
  Sparkles, 
  ArrowRight, 
  Award, 
  ThumbsUp, 
  CheckCircle2, 
  Search, 
  Activity, 
  Zap,
  Briefcase,
  HelpCircle,
  TrendingUp,
  Cpu
} from "lucide-react";
import { BuilderPassportDetails, AnalyticsData } from "../types";

interface LandingPageProps {
  setCurrentTab: (tab: string) => void;
  builders: BuilderPassportDetails[];
  onSelectBuilder: (id: string) => void;
  addToast: (message: string, type: "success" | "error" | "info") => void;
  connectWallet: (address: string) => void;
  connectedWallet: string | null;
}

export default function LandingPage({
  setCurrentTab,
  builders,
  onSelectBuilder,
  addToast,
  connectWallet,
  connectedWallet,
}: LandingPageProps) {
  const [stats, setStats] = useState<AnalyticsData["metrics"] | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Fetch live network metrics
  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/analytics");
        if (res.ok) {
          const data = await res.json();
          setStats(data.metrics);
        }
      } catch (err) {
        console.error("Failed to load analytics metrics:", err);
      } finally {
        setLoadingStats(false);
      }
    }
    fetchStats();
  }, []);

  // Get top 3 builders sorted by trust score or reputation level for the spotlight section
  const spotlightBuilders = [...builders]
    .sort((a, b) => b.trust_score - a.trust_score)
    .slice(0, 3);

  const handleQuickAccess = () => {
    if (!connectedWallet) {
      const mockAddress = "0x" + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
      connectWallet(mockAddress);
      addToast("A sovereign key has been generated and connected to your session!", "success");
    }
    setCurrentTab("graph");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 text-zinc-100">
      
      {/* HERO SECTION */}
      <div className="relative rounded-[40px] border border-zinc-800 bg-[#0c0c0e] overflow-hidden p-8 sm:p-12 lg:p-16 mb-12 shadow-2xl bento-glow">
        
        {/* Background cosmic light rays */}
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-teal-500/5 blur-3xl pointer-events-none" />
        
        <div className="relative max-w-3xl z-10">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-emerald-400 mb-6 font-mono">
            <Sparkles className="h-3.5 w-3.5 animate-pulse" />
            Autonomous Trust Consensus Hub
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-zinc-100 font-display leading-[1.1] mb-6">
            The Bull Trust <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">ANSEM Ecosystem</span>
          </h1>

          <p className="text-base sm:text-lg text-zinc-400 max-w-xl leading-relaxed mb-8">
            A sovereign multi-chain developer hub aggregating verified Builder Passports, algorithmic Reputation Scores, peer-reviewed audits, and interactive force-directed consensus graphs grounded by server-side Gemini intelligence.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleQuickAccess}
              className="rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold px-8 py-4 text-sm tracking-wide transition-all shadow-lg shadow-emerald-500/15 flex items-center justify-center gap-2 cursor-pointer group"
            >
              Enter Ecosystem Hub 
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => {
                const queryBox = document.querySelector('input[placeholder*="Ask the oracle"]');
                if (queryBox) {
                  queryBox.scrollIntoView({ behavior: "smooth" });
                  (queryBox as HTMLInputElement).focus();
                  addToast("Interacting with Gemini AI oracle", "info");
                } else {
                  setCurrentTab("passports");
                }
              }}
              className="rounded-2xl border border-zinc-800 hover:border-emerald-500/30 hover:bg-zinc-900/40 text-zinc-300 hover:text-zinc-100 font-bold px-8 py-4 text-sm tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Cpu className="h-4 w-4 text-emerald-400" />
              Query Gemini Oracle
            </button>
          </div>
        </div>

        {/* Decorative Grid Line Design */}
        <div className="absolute inset-y-0 right-0 w-1/3 hidden lg:flex items-center justify-center opacity-30 select-none pointer-events-none pr-12">
          <div className="relative w-64 h-64 rounded-full border border-dashed border-zinc-800 flex items-center justify-center">
            <div className="w-48 h-48 rounded-full border border-zinc-700/60 flex items-center justify-center animate-spin" style={{ animationDuration: "12s" }}>
              <div className="w-3 h-3 bg-emerald-400 rounded-full absolute top-0" />
            </div>
            <div className="w-32 h-32 rounded-full border border-dotted border-zinc-600/40 flex items-center justify-center">
              <Shield className="h-10 w-10 text-emerald-400 animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* LIVE DECENTRALIZED METRICS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
        <div className="rounded-2xl border border-zinc-800 bg-[#0c0c0e] p-5 shadow-xl flex flex-col justify-between relative bento-glow">
          <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider font-mono mb-2">Network Nodes</div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-zinc-100 font-mono">
              {loadingStats ? "..." : stats?.totalBuilders || builders.length}
            </span>
            <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider font-mono">Passports</span>
          </div>
          <div className="text-[10px] text-zinc-500 mt-2">Active builders registered.</div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-[#0c0c0e] p-5 shadow-xl flex flex-col justify-between relative bento-glow">
          <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider font-mono mb-2">Ecosystem Codebases</div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-zinc-100 font-mono">
              {loadingStats ? "..." : stats?.totalProjects || 14}
            </span>
            <span className="text-teal-400 text-xs font-bold uppercase tracking-wider font-mono">Projects</span>
          </div>
          <div className="text-[10px] text-zinc-500 mt-2">Fully audited code repositories.</div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-[#0c0c0e] p-5 shadow-xl flex flex-col justify-between relative bento-glow">
          <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider font-mono mb-2">Network Reputation Score</div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-400 font-mono">
              {loadingStats ? "94.2%" : `${stats?.avgTrustScore}%`}
            </span>
            <span className="text-emerald-400 text-[9px] font-bold uppercase tracking-wider font-mono">Avg Score</span>
          </div>
          <div className="text-[10px] text-zinc-500 mt-2">Verified cryptographically.</div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-[#0c0c0e] p-5 shadow-xl flex flex-col justify-between relative bento-glow">
          <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider font-mono mb-2">Consensus Consensus</div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-zinc-100 font-mono">
              {loadingStats ? "..." : stats?.totalReviews || 120}
            </span>
            <span className="text-purple-400 text-xs font-bold uppercase tracking-wider font-mono">Audits</span>
          </div>
          <div className="text-[10px] text-zinc-500 mt-2">Sovereign peer star ratings.</div>
        </div>
      </div>

      {/* CORE SUBSYSTEM PILLARS */}
      <div className="mb-16">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-100 font-display">System Architecture</h2>
          <p className="text-xs text-zinc-500 mt-2">The Bull Trust ANSEM Ecosystem uses a modular protocol to unify developer profiles, codebase auditing, and AI synthesis.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* PILLAR 1: PASSPORTS */}
          <div className="rounded-3xl border border-zinc-800 bg-[#0c0c0e] p-6 hover:border-emerald-500/30 transition-all shadow-xl flex flex-col justify-between group bento-glow">
            <div>
              <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mb-5">
                <User className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-zinc-200 mb-2 font-display">Sovereign Web3 Passports</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Aggregates multi-chain verified wallets, reputation indexes, social links, and custom issued credentials for developers, influencers, memecoin projects, and validators.
              </p>
            </div>
            <button 
              onClick={() => setCurrentTab("passports")}
              className="mt-6 inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-emerald-400 hover:text-emerald-300 transition-colors text-left"
            >
              Explore Passports <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* PILLAR 2: ECOSYSTEM GRAPH */}
          <div className="rounded-3xl border border-zinc-800 bg-[#0c0c0e] p-6 hover:border-emerald-500/30 transition-all shadow-xl flex flex-col justify-between group bento-glow">
            <div>
              <div className="h-10 w-10 rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center mb-5">
                <Compass className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-zinc-200 mb-2 font-display">Interactive Trust Graph</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Visualize multi-directional relationships, skill endorsements, and peer rating paths in an interactive force-directed canvas. Real-time connections indicate real trust.
              </p>
            </div>
            <button 
              onClick={() => setCurrentTab("graph")}
              className="mt-6 inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-teal-400 hover:text-teal-300 transition-colors text-left"
            >
              View Trust Graph <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* PILLAR 3: DISCOVERY & PEER AUDITS */}
          <div className="rounded-3xl border border-zinc-800 bg-[#0c0c0e] p-6 hover:border-emerald-500/30 transition-all shadow-xl flex flex-col justify-between group bento-glow">
            <div>
              <div className="h-10 w-10 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center mb-5">
                <Shield className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-zinc-200 mb-2 font-display">Ecosystem Project Auditing</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Submit and discover vetted ecosystem codebases. Active developers write secure star-based evaluations that register on the public consensus feed with transaction hashes.
              </p>
            </div>
            <button 
              onClick={() => setCurrentTab("discovery")}
              className="mt-6 inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-amber-400 hover:text-amber-300 transition-colors text-left"
            >
              Browse Projects <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* PILLAR 4: ORACLE */}
          <div className="rounded-3xl border border-zinc-800 bg-[#0c0c0e] p-6 hover:border-emerald-500/30 transition-all shadow-xl flex flex-col justify-between group bento-glow">
            <div>
              <div className="h-10 w-10 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center mb-5">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-zinc-200 mb-2 font-display">Grounded Gemini Oracle</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Deploy advanced server-side Gemini intelligence queries directly against the database state to search wallets, summarize developer passports, audit risks, and compile metrics.
              </p>
            </div>
            <button 
              onClick={() => {
                const queryBox = document.querySelector('input[placeholder*="Ask the oracle"]');
                if (queryBox) {
                  queryBox.scrollIntoView({ behavior: "smooth" });
                  (queryBox as HTMLInputElement).focus();
                  addToast("Interacting with Gemini AI oracle", "info");
                }
              }}
              className="mt-6 inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-purple-400 hover:text-purple-300 transition-colors text-left"
            >
              Query the Oracle <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

        </div>
      </div>

      {/* BUILDER SPOTLIGHT CAROUSEL */}
      {spotlightBuilders.length > 0 && (
        <div className="mb-16">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-zinc-100 font-display">Builder Spotlight</h2>
              <p className="text-xs text-zinc-500 mt-1">Ecosystem builders residing in the highest reputation trust tiers.</p>
            </div>
            <button 
              onClick={() => setCurrentTab("passports")}
              className="mt-2 sm:mt-0 text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 hover:text-emerald-300 transition-all font-mono border border-emerald-500/10 hover:border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 rounded-xl px-3 py-1.5 cursor-pointer"
            >
              View Full Directory ({builders.length})
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {spotlightBuilders.map((b) => (
              <div 
                key={b.id} 
                className="rounded-3xl border border-zinc-800 bg-[#0c0c0e] p-6 shadow-xl relative overflow-hidden bento-glow flex flex-col justify-between"
              >
                {/* Score Corner */}
                <div className="absolute top-4 right-4">
                  <span className="rounded-xl bg-emerald-500/10 px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-widest text-emerald-400 border border-emerald-500/20 font-mono">
                    TRUST: {b.trust_score}%
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <img src={b.avatar} alt={b.username} className="h-12 w-12 rounded-full object-cover border border-zinc-800 shadow-md" />
                    <div>
                      <h4 className="text-sm font-bold text-zinc-100 font-display flex items-center gap-1.5 flex-wrap">
                        @{b.username}
                        <span className={`inline-block rounded px-1.5 py-0.5 text-[8px] font-mono font-bold uppercase tracking-wider ${
                          b.entity_type === "influencer" ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" :
                          b.entity_type === "memecoin" ? "bg-pink-500/10 text-pink-400 border border-pink-500/20" :
                          b.entity_type === "trader" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" :
                          b.entity_type === "validator" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                          "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        }`}>
                          {b.entity_type || "builder"}
                        </span>
                      </h4>
                      <p className="text-[9px] font-mono text-zinc-500 uppercase">Tier Level {b.reputation_level}/5</p>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-400 min-h-[40px] leading-relaxed">
                    Registered with {b.wallets.length} verified wallet chains. Submitter of {b.projects.length} core ecosystem projects and recipient of {b.reviews.length} peer audits.
                  </p>

                  {/* Badges Preview */}
                  {b.badges.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {b.badges.slice(0, 3).map((bg) => (
                        <span 
                          key={bg.id} 
                          title={`${bg.name}: ${bg.description}`}
                          className="inline-flex items-center gap-1 rounded-lg bg-zinc-900 border border-zinc-800 px-2 py-1 text-[9px] font-bold text-zinc-300"
                        >
                          <span className="text-xs">{bg.icon}</span>
                          {bg.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    onSelectBuilder(b.id);
                    setCurrentTab("passports");
                    addToast(`Loading passport file for @${b.username}`, "success");
                  }}
                  className="mt-6 w-full rounded-xl bg-zinc-900 hover:bg-zinc-850 hover:text-zinc-100 border border-zinc-800 hover:border-emerald-500/20 py-2.5 text-center text-xs font-bold text-zinc-400 transition-all cursor-pointer"
                >
                  View Sovereign Passport
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* QUICK WORKFLOW STEPS */}
      <div className="rounded-[32px] border border-zinc-800 bg-[#0c0c0e]/40 p-8 sm:p-10 shadow-2xl relative bento-glow overflow-hidden">
        <div className="absolute -top-32 -right-32 h-64 w-64 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />
        
        <div className="max-w-2xl">
          <h2 className="text-xl font-bold text-zinc-100 font-display mb-2">How to Participate</h2>
          <p className="text-xs text-zinc-400 leading-relaxed mb-8">
            Follow these three simple on-chain steps to establish your cryptographic identity and begin building trust inside the ANSEM ecosystem.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div>
            <span className="text-2xl font-black text-emerald-400 font-mono block mb-2">01</span>
            <h4 className="text-xs font-bold text-zinc-200 mb-1 font-display">Connect Active Wallet</h4>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Link your Sol, Eth, or Monad chain address. Connecting authorizes session parameters and lets you earn credentials.
            </p>
          </div>

          <div>
            <span className="text-2xl font-black text-emerald-400 font-mono block mb-2">02</span>
            <h4 className="text-xs font-bold text-zinc-200 mb-1 font-display">Claim Your Passport</h4>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Register your sovereign username, bind social anchors, sync your GitHub commit history, and generate reputation indexes.
            </p>
          </div>

          <div>
            <span className="text-2xl font-black text-emerald-400 font-mono block mb-2">03</span>
            <h4 className="text-xs font-bold text-zinc-200 mb-1 font-display">Build & Endorse</h4>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Submit ecosystem code repositories, write Star consensus peer evaluations, and earn verified founder badges.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
