import React, { useState, useEffect } from "react";
import { User, Wallet, Shield, Award, Sparkles, CheckCircle2, ThumbsUp, Github, Twitter, Globe, MessageSquare, Star, ArrowUpRight, Share2, FileDown, Eye, AlertCircle, RefreshCw, Send, Lock, Search } from "lucide-react";
import { BuilderPassportDetails, Review, Skill, Project } from "../types";

interface BuilderPassportProps {
  connectedWallet: string | null;
  builders: BuilderPassportDetails[];
  selectedBuilderId: string;
  onSelectBuilder: (id: string) => void;
  addToast: (message: string, type: "success" | "error" | "info") => void;
  fetchBuildersList: () => void;
}

export default function BuilderPassport({
  connectedWallet,
  builders,
  selectedBuilderId,
  onSelectBuilder,
  addToast,
  fetchBuildersList,
}: BuilderPassportProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "projects" | "reviews" | "ai_oracle">("overview");
  const [builder, setBuilder] = useState<BuilderPassportDetails | null>(null);
  const [loading, setLoading] = useState(true);

  // Directory Search & Filter state
  const [filterType, setFilterType] = useState<"all" | "builder" | "influencer" | "memecoin" | "trader" | "validator">("all");
  const [directorySearch, setDirectorySearch] = useState("");

  // New Review Form State
  const [reviewerSelected, setReviewerSelected] = useState("");
  const [rating, setRating] = useState(5);
  const [category, setCategory] = useState("Technical Quality");
  const [content, setContent] = useState("");
  const [verifiedTx, setVerifiedTx] = useState("");

  // New Skill Endorsement State
  const [newSkillName, setNewSkillName] = useState("");
  
  // AI Oracle State
  const [aiAnalysisType, setAiAnalysisType] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTitle, setAiTitle] = useState("");

  const fetchBuilderDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/builders/${selectedBuilderId}`);
      if (!res.ok) throw new Error("Failed to load builder details");
      const data = await res.json();
      setBuilder(data);
    } catch (err) {
      console.error(err);
      addToast("Failed to fetch profile details", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuilderDetails();
    // Reset AI state when switching builders
    setAiResult(null);
    setAiAnalysisType(null);
  }, [selectedBuilderId]);

  if (loading || !builder) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex flex-col items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 text-emerald-400 animate-spin mb-4" />
        <h3 className="text-sm font-bold tracking-tight font-display text-zinc-200">Synchronizing Builder Passport ledger...</h3>
      </div>
    );
  }

  // Follow/Unfollow Handler
  const handleFollow = async () => {
    if (!connectedWallet) {
      addToast("Connect your wallet or register to follow builders", "error");
      return;
    }

    const activeUser = builders.find((b) =>
      b.wallets.some((w) => w.address.toLowerCase() === connectedWallet.toLowerCase())
    );

    if (!activeUser) {
      addToast("Connected wallet does not have a registered Passport. Please claim one first.", "error");
      return;
    }

    try {
      const res = await fetch(`/api/builders/${builder.id}/follow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followerId: activeUser.id }),
      });

      if (!res.ok) throw new Error("Failed to follow");
      const data = await res.json();
      setBuilder((prev) => prev ? { ...prev, followersCount: data.followerCount } : null);
      addToast(data.isFollowing ? `Successfully followed ${builder.username}!` : `Unfollowed ${builder.username}`, "info");
      fetchBuildersList();
    } catch (err) {
      addToast("Action failed", "error");
    }
  };

  // Add custom skill or endorse skill
  const handleEndorseSkill = async (skillName: string) => {
    try {
      const res = await fetch(`/api/builders/${builder.id}/skills`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillName }),
      });

      if (!res.ok) throw new Error("Failed to endorse skill");
      const data = await res.json();
      setBuilder((prev) => prev ? { ...prev, skills: data.skills } : null);
      addToast(`Endorsed and registered skill: ${skillName}!`, "success");
      fetchBuildersList();
    } catch (err) {
      addToast("Failed to endorse skill", "error");
    }
  };

  // Handle Review submission
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerSelected) {
      addToast("Please select a reviewer passport to sign this review", "error");
      return;
    }
    if (!content.trim()) {
      addToast("Review content cannot be blank", "error");
      return;
    }

    try {
      const res = await fetch(`/api/builders/${builder.id}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewerId: reviewerSelected,
          rating,
          content,
          verifiedTxHash: verifiedTx,
          category,
        }),
      });

      if (!res.ok) throw new Error("Failed to submit review");
      const data = await res.json();
      
      // Update local state
      fetchBuilderDetails();
      addToast("Review successfully posted! Trust metrics updated.", "success");
      
      // Reset form
      setContent("");
      setVerifiedTx("");
      fetchBuildersList();
    } catch (err) {
      addToast("Failed to submit review", "error");
    }
  };

  // Trigger server-side Gemini AI Analysis
  const handleAiAnalysis = async (type: string) => {
    setAiLoading(true);
    setAiAnalysisType(type);
    setAiResult(null);
    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ builderId: builder.id, type }),
      });
      if (!res.ok) throw new Error("AI Analysis request failed");
      const data = await res.json();
      setAiResult(data.answer);
      setAiTitle(data.typeLabel);
    } catch (err) {
      addToast("Gemini Analysis timed out or failed", "error");
    } finally {
      setAiLoading(false);
    }
  };

  // Custom client-side parser to render Markdown beautifully without unneeded dependencies
  const renderMarkdown = (text: string) => {
    if (!text) return null;
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      // Headers
      if (line.startsWith("### ")) {
        return <h4 key={idx} className="text-md font-bold text-foreground mt-4 mb-2 border-b border-border/40 pb-1">{line.replace("### ", "")}</h4>;
      }
      if (line.startsWith("#### ")) {
        return <h5 key={idx} className="text-sm font-bold text-foreground mt-3 mb-1.5">{line.replace("#### ", "")}</h5>;
      }
      if (line.startsWith("## ")) {
        return <h3 key={idx} className="text-lg font-bold text-foreground mt-5 mb-2.5 border-b border-border pb-1.5">{line.replace("## ", "")}</h3>;
      }
      if (line.startsWith("# ")) {
        return <h2 key={idx} className="text-xl font-extrabold text-foreground mt-6 mb-3 border-b border-border pb-2">{line.replace("# ", "")}</h2>;
      }

      // Bullet points
      if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
        const cleaned = line.replace(/^[\s]*[-*]\s+/, "");
        return (
          <li key={idx} className="ml-5 list-disc text-xs text-muted-foreground leading-relaxed my-1">
            {parseInlineMarkdown(cleaned)}
          </li>
        );
      }

      // Plain paragraph
      if (line.trim() === "") return <div key={idx} className="h-2" />;
      return (
        <p key={idx} className="text-xs text-muted-foreground leading-relaxed my-2">
          {parseInlineMarkdown(line)}
        </p>
      );
    });
  };

  // Inline formatting helper for bold / code blocks in markdown
  const parseInlineMarkdown = (line: string) => {
    const parts: React.ReactNode[] = [];
    let currentText = line;
    let keyIdx = 0;

    while (currentText.length > 0) {
      // Bold + Code: `**bold**` or `code`
      const boldMatch = currentText.match(/\*\*([^*]+)\*\*/);
      const codeMatch = currentText.match(/`([^`]+)`/);

      if (boldMatch && (!codeMatch || boldMatch.index! < codeMatch.index!)) {
        const start = boldMatch.index!;
        if (start > 0) {
          parts.push(<span key={keyIdx++}>{currentText.substring(0, start)}</span>);
        }
        parts.push(<strong key={keyIdx++} className="font-extrabold text-foreground">{boldMatch[1]}</strong>);
        currentText = currentText.substring(start + boldMatch[0].length);
      } else if (codeMatch) {
        const start = codeMatch.index!;
        if (start > 0) {
          parts.push(<span key={keyIdx++}>{currentText.substring(0, start)}</span>);
        }
        parts.push(
          <code key={keyIdx++} className="bg-muted px-1.5 py-0.5 rounded-md font-mono text-[10px] border border-border text-primary font-bold">
            {codeMatch[1]}
          </code>
        );
        currentText = currentText.substring(start + codeMatch[0].length);
      } else {
        parts.push(<span key={keyIdx++}>{currentText}</span>);
        break;
      }
    }
    return parts;
  };

  // EXPORT UTILITIES
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(builder, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `ansem_passport_${builder.username.toLowerCase()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    addToast("Builder JSON passport data successfully exported!", "success");
  };

  const handleExportMarkdown = () => {
    const md = `
# ANSEM Ecosystem Builder Passport: ${builder.username}
- **Trust Score**: ${builder.trust_score}%
- **Reputation Level**: Level ${builder.reputation_level}/5
- **Verified Identity**: ${builder.verified_identity ? "Verified" : "Self-asserted"}
- **Registration Time**: ${new Date(builder.created_at).toLocaleDateString()}

## Active Skills & Endorsements
${builder.skills.map((s) => `- ${s.name} (${s.endorsement_count} endorsements)`).join("\n")}

## Registered Public Wallets
${builder.wallets.map((w) => `- ${w.chain} Address: ${w.address} (${w.label})`).join("\n")}

## Submitted Projects
${builder.projects.map((p) => `- [${p.category}] ${p.name}: ${p.description}`).join("\n")}

---
Generated autonomously on ANSEM Ecosystem Hub.
    `;
    const dataStr = "data:text/markdown;charset=utf-8," + encodeURIComponent(md);
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `ansem_passport_${builder.username.toLowerCase()}.md`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    addToast("Builder Markdown profile successfully generated and downloaded!", "success");
  };

  const handleCopyShareLink = () => {
    const shareUrl = `${window.location.origin}/?passport=${builder.id}`;
    navigator.clipboard.writeText(shareUrl);
    addToast("Shareable profile link copied to clipboard!", "success");
  };

  const filteredBuilders = builders.filter((b) => {
    const matchesType = filterType === "all" || b.entity_type === filterType;
    const matchesSearch = b.username.toLowerCase().includes(directorySearch.toLowerCase()) || 
                          b.id.toLowerCase().includes(directorySearch.toLowerCase()) ||
                          b.wallets.some(w => w.address.toLowerCase().includes(directorySearch.toLowerCase()));
    return matchesType && matchesSearch;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 text-zinc-100">
      
      {/* ECOSYSTEM HUB PARTICIPANTS BROWSER */}
      <div className="rounded-3xl border border-zinc-800 bg-[#0c0c0e] p-6 mb-8 shadow-xl bento-glow relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-zinc-800 pb-5">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-zinc-100 font-display">Sovereign Directory Browser</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Filter, search, and load public passports for all verified actors inside the ANSEM ecosystem.</p>
          </div>
          
          {/* SEARCH FIELD */}
          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="Search username, wallet..."
              value={directorySearch}
              onChange={(e) => setDirectorySearch(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/30 pl-9 pr-4 py-2 text-xs font-semibold focus:border-emerald-500/40 focus:outline-hidden text-zinc-100 placeholder:text-zinc-600"
            />
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-600" />
          </div>
        </div>

        {/* ROLE TABS */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(["all", "builder", "influencer", "memecoin", "trader", "validator"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`rounded-xl border px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                filterType === type
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-extrabold"
                  : "border-zinc-850 hover:border-zinc-800 text-zinc-500 hover:text-zinc-300 bg-zinc-900/10"
              }`}
            >
              {type === "all" ? "All participants" : type}
            </button>
          ))}
        </div>

        {/* MINI CARDS GRID */}
        {filteredBuilders.length === 0 ? (
          <div className="text-center py-6 text-zinc-600 text-xs italic">
            No matching Web3 identities found in the ledger database.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-[145px] overflow-y-auto pr-1">
            {filteredBuilders.map((b) => {
              const isSelected = b.id === builder.id;
              return (
                <button
                  key={b.id}
                  onClick={() => {
                    onSelectBuilder(b.id);
                    addToast(`Displaying ${b.username}'s sovereign ledger file`, "info");
                  }}
                  className={`rounded-2xl p-3 text-left transition-all cursor-pointer border flex flex-col justify-between h-[105px] ${
                    isSelected
                      ? "border-emerald-500 bg-emerald-500/5 shadow-md shadow-emerald-500/5 animate-pulse"
                      : "border-zinc-850 bg-zinc-900/20 hover:border-zinc-800 hover:bg-zinc-900/40"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <img src={b.avatar} alt={b.username} className="h-6 w-6 rounded-full object-cover border border-zinc-800 shrink-0" />
                    <div className="truncate min-w-0">
                      <span className="text-[11px] font-bold text-zinc-200 block truncate leading-tight">@{b.username}</span>
                      <span className="text-[7px] font-mono font-bold text-zinc-500 uppercase block">{b.entity_type || "builder"}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between border-t border-zinc-900/60 pt-2 mt-2">
                    <span className="text-[8px] font-bold text-zinc-500 font-mono">TRUST</span>
                    <span className={`text-[9px] font-extrabold font-mono ${
                      b.trust_score >= 90 ? "text-emerald-400" : b.trust_score >= 80 ? "text-amber-500" : "text-rose-500"
                    }`}>{b.trust_score}%</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 2 COLUMN GRID layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* LEFT COLUMN: HERO PASSPORT CARD */}
        <div className="lg:col-span-1 space-y-6">
          <div className="relative rounded-3xl border border-zinc-800 bg-[#0c0c0e] overflow-hidden shadow-xl p-6 text-center bento-glow">
            
            {/* BADGE / STATUS CORNER */}
            <div className="absolute top-4 right-4">
              {builder.verified_identity ? (
                <span className="flex items-center gap-1 rounded-xl bg-emerald-500/10 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="h-2.5 w-2.5" /> Identity Verified
                </span>
              ) : (
                <span className="flex items-center gap-1 rounded-xl bg-amber-500/10 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-amber-400 border border-amber-500/20">
                  <AlertCircle className="h-2.5 w-2.5" /> Unverified ID
                </span>
              )}
            </div>

            {/* AVATAR & METRICS */}
            <div className="relative mx-auto h-20 w-20 rounded-full border border-zinc-800 overflow-hidden shadow-lg mt-4 mb-3">
              <img src={builder.avatar} alt={builder.username} className="h-full w-full object-cover" />
            </div>

            <h2 className="text-lg font-bold tracking-tight font-display text-zinc-100">@{builder.username}</h2>
            <p className="text-[9px] font-mono text-zinc-500 truncate max-w-full">
              ID: {builder.id}
            </p>

            {/* TRUST METER & LEVEL CARD */}
            <div className="my-5 p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-bold text-zinc-500 uppercase tracking-wider text-[8px] font-mono">Ecosystem Trust Score</span>
                <span className="font-extrabold text-emerald-400 font-mono">{builder.trust_score}%</span>
              </div>
              <div className="w-full bg-zinc-950 h-1.5 rounded-full overflow-hidden border border-zinc-900">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    builder.trust_score >= 90 ? "bg-emerald-500" : builder.trust_score >= 80 ? "bg-amber-500" : "bg-rose-500"
                  }`}
                  style={{ width: `${builder.trust_score}%` }}
                />
              </div>

              <div className="flex items-center justify-between border-t border-zinc-900 mt-4 pt-3 text-xs">
                <span className="font-bold text-zinc-500 uppercase tracking-wider text-[8px] font-mono">Reputation Tier</span>
                <span className="font-bold flex items-center gap-1 text-teal-400 text-[11px]">
                  <Star className="h-3 w-3 fill-teal-400/15" /> Level {builder.reputation_level}/5
                </span>
              </div>
            </div>

            {/* FOLLOW / UNFOLLOW AND SOCIALS */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <button
                onClick={handleFollow}
                className="rounded-xl border border-zinc-800 bg-zinc-900/40 py-2 text-xs font-bold hover:bg-zinc-900/80 hover:text-zinc-200 transition-colors flex items-center justify-center gap-1 cursor-pointer text-zinc-400"
              >
                Follow ({builder.followersCount})
              </button>
              <button
                onClick={handleCopyShareLink}
                className="rounded-xl bg-emerald-500 text-zinc-950 py-2 text-xs font-bold hover:bg-emerald-400 transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-md shadow-emerald-500/5"
              >
                <Share2 className="h-3 w-3" /> Share
              </button>
            </div>

            {/* EXPORT OPTIONS */}
            <div className="flex flex-col gap-2 mt-4 border-t border-dashed border-zinc-900 pt-4">
              <span className="text-[8px] font-bold text-zinc-500 uppercase text-left tracking-wider font-mono">Export Passport</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleExportJSON}
                  className="rounded-xl bg-zinc-900/40 text-zinc-300 py-1.5 text-[9px] font-bold hover:bg-zinc-900/80 transition-all border border-zinc-800 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <FileDown className="h-3.5 w-3.5" /> Export JSON
                </button>
                <button
                  onClick={handleExportMarkdown}
                  className="rounded-xl bg-zinc-900/40 text-zinc-300 py-1.5 text-[9px] font-bold hover:bg-zinc-900/80 transition-all border border-zinc-800 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <FileDown className="h-3.5 w-3.5" /> Export MD
                </button>
              </div>
            </div>

          </div>

          {/* ACTIVE WALLETS REGISTER */}
          <div className="rounded-3xl border border-zinc-800 bg-[#0c0c0e] p-6 shadow-xl">
            <h3 className="text-[9px] font-bold tracking-wider uppercase text-zinc-500 border-b border-zinc-800 pb-3 mb-3 flex items-center gap-1.5 font-mono">
              <Wallet className="h-3.5 w-3.5 text-emerald-400" />
              Verified Wallet Chains
            </h3>
            <div className="space-y-3">
              {builder.wallets.map((w) => (
                <div key={w.id} className="rounded-xl bg-zinc-900/30 border border-zinc-850 p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400 font-mono">{w.chain}</span>
                    <span className="text-[8px] font-bold text-zinc-500 uppercase font-mono">{w.label}</span>
                  </div>
                  <p className="font-mono text-[10px] text-zinc-300 truncate select-all">{w.address}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: MAIN INTERACTIVE VIEW AREA */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* NAVIGATION TAB ROW */}
          <div className="flex border-b border-zinc-800">
            <button
              onClick={() => setActiveTab("overview")}
              className={`border-b-2 py-3 px-6 text-sm font-semibold tracking-wide transition-all cursor-pointer ${
                activeTab === "overview"
                  ? "border-emerald-500 text-emerald-400 font-bold"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("projects")}
              className={`border-b-2 py-3 px-6 text-sm font-semibold tracking-wide transition-all cursor-pointer ${
                activeTab === "projects"
                  ? "border-emerald-500 text-emerald-400 font-bold"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Ecosystem Projects ({builder.projects.length})
            </button>
            <button
              onClick={() => setActiveTab("reviews")}
              className={`border-b-2 py-3 px-6 text-sm font-semibold tracking-wide transition-all cursor-pointer ${
                activeTab === "reviews"
                  ? "border-emerald-500 text-emerald-400 font-bold"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Peer Ratings ({builder.reviews.length})
            </button>
            <button
              onClick={() => setActiveTab("ai_oracle")}
              className={`border-b-2 py-3 px-6 text-sm font-semibold tracking-wide transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "ai_oracle"
                  ? "border-emerald-400 text-emerald-400 font-bold"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Sparkles className="h-4 w-4 text-emerald-400 animate-pulse" />
              AI Oracle Insights
            </button>
          </div>

          {/* TAB 1: GENERAL OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* CREDENTIAL BADGES */}
              <div className="rounded-3xl border border-zinc-800 bg-[#0c0c0e] p-6 shadow-xl bento-glow">
                <h3 className="text-sm font-bold tracking-tight mb-4 flex items-center gap-1.5 text-emerald-400 font-display">
                  <Award className="h-4 w-4" /> Credentials & Badges
                </h3>
                {builder.badges.length === 0 ? (
                  <p className="text-xs text-zinc-500">No badges claimed on this passport yet.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {builder.badges.map((bg) => (
                      <div key={bg.id} className="flex gap-3 rounded-2xl border border-zinc-900 p-3.5 bg-zinc-900/20 items-start">
                        <span className="text-xl mt-0.5">{bg.icon}</span>
                        <div>
                          <h4 className="text-xs font-extrabold text-zinc-200">{bg.name}</h4>
                          <p className="text-[10px] text-zinc-400 leading-relaxed mt-1">{bg.description}</p>
                          <span className="text-[9px] text-zinc-500 font-semibold block mt-1 font-mono">Issuer: {bg.issuer}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SKILLS ENDORSEMENT ROW */}
              <div className="rounded-3xl border border-zinc-800 bg-[#0c0c0e] p-6 shadow-xl">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                  <h3 className="text-sm font-bold tracking-tight flex items-center gap-1.5 font-display text-zinc-200">
                    <ThumbsUp className="h-4 w-4 text-emerald-400" /> Technical Skills & Endorsements
                  </h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add skillset..."
                      value={newSkillName}
                      onChange={(e) => setNewSkillName(e.target.value)}
                      className="rounded-lg border border-zinc-800 bg-zinc-900/30 px-2.5 py-1 text-xs focus:outline-hidden text-zinc-100 placeholder:text-zinc-600 font-semibold"
                    />
                    <button
                      onClick={() => {
                        if (!newSkillName.trim()) return;
                        handleEndorseSkill(newSkillName);
                        setNewSkillName("");
                      }}
                      className="rounded-lg bg-emerald-500 text-zinc-950 px-3 py-1 text-xs font-bold hover:bg-emerald-400 transition-all cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {builder.skills.length === 0 ? (
                  <p className="text-xs text-zinc-500">No custom skills claimed on this passport.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {builder.skills.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => handleEndorseSkill(s.name)}
                        className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-3 py-1.5 text-xs font-semibold flex items-center gap-2 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all cursor-pointer group text-zinc-300"
                      >
                        {s.name}
                        <span className="rounded-md bg-zinc-950 border border-zinc-800 px-1.5 py-0.5 text-[9px] font-extrabold text-emerald-400 group-hover:bg-emerald-500 group-hover:text-zinc-950 transition-all font-mono">
                          +{s.endorsement_count}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* CONTRIBUTION TIMELINE (MOCK HISTORIC AUDITS) */}
              <div className="rounded-3xl border border-zinc-800 bg-[#0c0c0e] p-6 shadow-xl">
                <h3 className="text-sm font-bold tracking-tight mb-4 font-display text-zinc-200">Ecosystem Milestone Timeline</h3>
                <div className="relative border-l border-zinc-800 ml-2 space-y-6 py-2">
                  <div className="relative pl-6">
                    <div className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-purple-500" />
                    <span className="text-[9px] font-bold text-zinc-500 block mb-0.5 font-mono">2025-03-10</span>
                    <h4 className="text-xs font-bold text-zinc-200">Open Source Commit & Sync</h4>
                    <p className="text-[11px] text-zinc-400 leading-relaxed mt-1">Synchronized 14 active repositories and ledger metrics, registering over 1,450 total contributions inside the ANSEM developer framework.</p>
                  </div>
                  <div className="relative pl-6">
                    <div className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-[9px] font-bold text-zinc-500 block mb-0.5 font-mono">2025-02-15</span>
                    <h4 className="text-xs font-bold text-zinc-200">Professional Security Audit Complete</h4>
                    <p className="text-[11px] text-zinc-400 leading-relaxed mt-1">Successfully deployed fully audited DeFi staking protocol to Ethereum Devnet, maintaining 0 security risks across verified smart contracts.</p>
                  </div>
                  <div className="relative pl-6">
                    <div className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-pink-500" />
                    <span className="text-[9px] font-bold text-zinc-500 block mb-0.5 font-mono">2025-01-10</span>
                    <h4 className="text-xs font-bold text-zinc-200">Ecosystem Hub Genesis Claim</h4>
                    <p className="text-[11px] text-zinc-400 leading-relaxed mt-1">Registered primary Ledger, initialized Trust Metrics scores, and earned custom Genesis Founder credentials badge.</p>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: PROJECTS REGISTERED */}
          {activeTab === "projects" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {builder.projects.length === 0 ? (
                <div className="text-center rounded-3xl border border-dashed border-zinc-800 p-12 bg-zinc-900/10">
                  <User className="h-10 w-10 text-zinc-600 mx-auto mb-3 animate-pulse" />
                  <h4 className="text-sm font-bold text-zinc-300 font-display">No Projects Registered</h4>
                  <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">This builder hasn't claimed any ecosystem projects yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {builder.projects.map((proj) => (
                    <div key={proj.id} className="rounded-3xl border border-zinc-800 bg-[#0c0c0e] p-6 flex flex-col justify-between shadow-xl hover:border-emerald-500/30 transition-all bento-glow">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xl h-10 w-10 flex items-center justify-center bg-zinc-900 border border-zinc-800 rounded-xl">{proj.logo}</span>
                          <span className={`rounded-xl px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider font-mono ${
                            proj.verified ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}>
                            {proj.verified ? "Verified Core" : "Pending Audit"}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold font-display text-zinc-100">{proj.name}</h4>
                        <p className="text-xs text-zinc-400 leading-relaxed mt-1 mb-4 line-clamp-3">{proj.description}</p>
                      </div>

                      <div className="flex items-center justify-between border-t border-zinc-900 pt-4 text-xs">
                        <div className="flex gap-2">
                          {proj.website && <a href={proj.website} target="_blank" className="text-zinc-500 hover:text-zinc-300"><Globe className="h-4 w-4" /></a>}
                          {proj.github && <a href={proj.github} target="_blank" className="text-zinc-500 hover:text-zinc-300"><Github className="h-4 w-4" /></a>}
                        </div>
                        <span className="text-[9px] font-bold text-emerald-400 bg-zinc-950 px-2 py-0.5 rounded-lg border border-zinc-900 font-mono">TRUST: {proj.trust_score}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: RATINGS AND PEER REVIEWS */}
          {activeTab === "reviews" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-200">
              
              {/* REVIEWS LIST */}
              <div className="md:col-span-2 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">Peer Evaluations</h3>
                {builder.reviews.length === 0 ? (
                  <p className="text-xs text-zinc-500">No peer evaluations registered yet. Be the first to evaluate!</p>
                ) : (
                  builder.reviews.map((rev) => (
                    <div key={rev.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/20 p-5 space-y-3 bento-glow shadow-md">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img src={rev.reviewer?.avatar} alt={rev.reviewer?.username} className="h-5 w-5 rounded-full object-cover border border-zinc-800" />
                          <span className="text-xs font-bold text-zinc-200">@{rev.reviewer?.username}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`h-3 w-3 ${i < rev.rating ? "text-amber-400 fill-amber-400" : "text-zinc-700"}`} />
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[8px] font-bold uppercase tracking-wider text-emerald-400 font-mono">
                        <span>{rev.category}</span>
                        <span className="text-zinc-500 font-normal">{new Date(rev.created_at).toLocaleDateString()}</span>
                      </div>

                      <p className="text-xs text-zinc-400 leading-relaxed italic">"{rev.content}"</p>

                      <div className="rounded-xl bg-zinc-950 p-2.5 border border-zinc-900 flex items-center justify-between font-mono text-[8px] text-zinc-500">
                        <span className="truncate max-w-[200px]">TX: {rev.verified_transaction_hash}</span>
                        <span className="text-emerald-400 font-bold flex items-center gap-0.5"><CheckCircle2 className="h-3 w-3" /> VERIFIED</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* WRITE A REVIEW FORM */}
              <div className="rounded-3xl border border-zinc-800 bg-[#0c0c0e] p-6 space-y-4 h-fit bento-glow shadow-xl">
                <div className="flex items-center gap-1.5 border-b border-zinc-800 pb-3 mb-1">
                  <MessageSquare className="h-3.5 w-3.5 text-emerald-400" />
                  <h3 className="text-[10px] font-bold tracking-wider uppercase text-zinc-500 font-mono">Write peer review</h3>
                </div>

                <form onSubmit={handleSubmitReview} className="space-y-4 text-zinc-100">
                  <div>
                    <label className="block text-[9px] font-bold text-zinc-500 mb-1 uppercase tracking-wider font-mono">Sign as Builder *</label>
                    <select
                      value={reviewerSelected}
                      onChange={(e) => setReviewerSelected(e.target.value)}
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs font-semibold focus:border-emerald-500/40 focus:outline-hidden text-zinc-100"
                      required
                    >
                      <option value="">-- Choose Passport --</option>
                      {builders.filter(b => b.id !== builder.id).map((b) => (
                        <option key={b.id} value={b.id}>
                          @{b.username}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-zinc-500 mb-1 uppercase tracking-wider font-mono">Rating Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs font-semibold focus:border-emerald-500/40 focus:outline-hidden text-zinc-100"
                    >
                      <option value="Technical Quality">Technical Quality</option>
                      <option value="Communication">Communication</option>
                      <option value="Delivery Speed">Delivery Speed</option>
                      <option value="Mentorship">Mentorship</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-zinc-500 mb-1 uppercase tracking-wider font-mono">Star Assessment</label>
                    <div className="flex gap-1.5 items-center">
                      {[1, 2, 3, 4, 5].map((stars) => (
                        <button
                          key={stars}
                          type="button"
                          onClick={() => setRating(stars)}
                          className="p-1 hover:scale-110 transition-transform cursor-pointer"
                        >
                          <Star className={`h-4.5 w-4.5 ${stars <= rating ? "text-amber-400 fill-amber-400" : "text-zinc-700"}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-zinc-500 mb-1 uppercase tracking-wider font-mono">Evaluation Details *</label>
                    <textarea
                      placeholder="Be analytical. Document their open-source contributions, code alignment, and contract safety parameters..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-900/30 px-3.5 py-2 text-xs font-medium focus:border-emerald-500/40 focus:outline-hidden text-zinc-100 placeholder:text-zinc-600 min-h-[90px]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-zinc-500 mb-1 uppercase tracking-wider font-mono">Verification TX Hash (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. 0x76ab..."
                      value={verifiedTx}
                      onChange={(e) => setVerifiedTx(e.target.value)}
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-900/30 px-3.5 py-2 text-xs font-mono focus:border-emerald-500/40 focus:outline-hidden text-zinc-100 placeholder:text-zinc-600"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 py-2.5 text-xs font-bold text-zinc-950 hover:opacity-90 transition-all shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Send className="h-3.5 w-3.5" /> Submit Peer Assessment
                  </button>
                </form>
              </div>

            </div>
          )}

          {/* TAB 4: GEMINI AI ANALYTICAL ORACLE */}
          {activeTab === "ai_oracle" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* CONTEXT WARNING BANNER */}
              <div className="bg-gradient-to-r from-teal-500/5 to-emerald-500/5 rounded-3xl p-5 border border-emerald-500/10 flex gap-3 items-start text-xs leading-relaxed text-zinc-100">
                <Sparkles className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5 animate-pulse" />
                <div>
                  <h4 className="font-bold text-emerald-400 font-display">Grounded Gemini LLM Intelligence</h4>
                  <p className="text-zinc-400 mt-1 text-[11px] font-sans">
                    Deploy autonomous server-side analysis algorithms powered by <strong className="text-zinc-200">Gemini 3.5 Flash</strong>. These prompt queries synthesize all active wallets, contribution heatmaps, peer reviews, and audited projects, producing reports.
                  </p>
                </div>
              </div>

              {/* AI REPORT TYPE SELECTOR (FEATURE 11 / AI PROMPTS) */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <button
                  onClick={() => handleAiAnalysis("builder_summary")}
                  className={`border p-4 text-center cursor-pointer transition-all duration-300 flex flex-col items-center gap-2 ${
                    aiAnalysisType === "builder_summary"
                      ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-400 shadow-md rounded-xl"
                      : "border-zinc-800 hover:border-emerald-500/30 hover:bg-zinc-900/30 text-zinc-400 hover:text-zinc-200 bg-zinc-900/10 rounded-xl"
                  }`}
                >
                  <User className="h-5 w-5 text-emerald-400" />
                  <span className="text-[9px] font-bold uppercase tracking-wider font-mono">Passport Summary</span>
                </button>

                <button
                  onClick={() => handleAiAnalysis("risk_analysis")}
                  className={`border p-4 text-center cursor-pointer transition-all duration-300 flex flex-col items-center gap-2 ${
                    aiAnalysisType === "risk_analysis"
                      ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-400 shadow-md rounded-xl"
                      : "border-zinc-800 hover:border-emerald-500/30 hover:bg-zinc-900/30 text-zinc-400 hover:text-zinc-200 bg-zinc-900/10 rounded-xl"
                  }`}
                >
                  <Shield className="h-5 w-5 text-rose-500" />
                  <span className="text-[9px] font-bold uppercase tracking-wider font-mono">Risk Analysis</span>
                </button>

                <button
                  onClick={() => handleAiAnalysis("project_summary")}
                  className={`border p-4 text-center cursor-pointer transition-all duration-300 flex flex-col items-center gap-2 ${
                    aiAnalysisType === "project_summary"
                      ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-400 shadow-md rounded-xl"
                      : "border-zinc-800 hover:border-emerald-500/30 hover:bg-zinc-900/30 text-zinc-400 hover:text-zinc-200 bg-zinc-900/10 rounded-xl"
                  }`}
                >
                  <Award className="h-5 w-5 text-amber-500" />
                  <span className="text-[9px] font-bold uppercase tracking-wider font-mono">Project Impact</span>
                </button>

                <button
                  onClick={() => handleAiAnalysis("community_insights")}
                  className={`border p-4 text-center cursor-pointer transition-all duration-300 flex flex-col items-center gap-2 ${
                    aiAnalysisType === "community_insights"
                      ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-400 shadow-md rounded-xl"
                      : "border-zinc-800 hover:border-emerald-500/30 hover:bg-zinc-900/30 text-zinc-400 hover:text-zinc-200 bg-zinc-900/10 rounded-xl"
                  }`}
                >
                  <MessageSquare className="h-5 w-5 text-purple-400" />
                  <span className="text-[9px] font-bold uppercase tracking-wider font-mono">Peer Insights</span>
                </button>

                <button
                  onClick={() => handleAiAnalysis("wallet_summary")}
                  className={`border p-4 text-center cursor-pointer transition-all duration-300 flex flex-col items-center gap-2 col-span-2 md:col-span-1 ${
                    aiAnalysisType === "wallet_summary"
                      ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-400 shadow-md rounded-xl"
                      : "border-zinc-800 hover:border-emerald-500/30 hover:bg-zinc-900/30 text-zinc-400 hover:text-zinc-200 bg-zinc-900/10 rounded-xl"
                  }`}
                >
                  <Wallet className="h-5 w-5 text-teal-450" />
                  <span className="text-[9px] font-bold uppercase tracking-wider font-mono">Wallet Audit</span>
                </button>
              </div>

              {/* REPORT DISPLAY AREA */}
              <div className="rounded-3xl border border-zinc-800 bg-[#0c0c0e] overflow-hidden shadow-xl min-h-[250px] relative bento-glow">
                
                {aiLoading ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-[#0c0c0e] text-center text-zinc-100">
                    <Sparkles className="h-6 w-6 text-emerald-400 animate-spin mb-4" />
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-1 animate-pulse font-mono">Running Gemini analytical ledger scans...</h4>
                    <p className="text-[11px] text-zinc-500 italic leading-relaxed max-w-sm font-sans">"Evaluating cryptographic wallet verification age, peer end-user evaluations, and multi-chain network activity index..."</p>
                  </div>
                ) : aiResult ? (
                  <div className="p-6 md:p-8 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-2">
                      <h4 className="text-xs font-bold tracking-wider uppercase text-emerald-400 flex items-center gap-1.5 font-mono">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        {aiTitle}
                      </h4>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(aiResult);
                          addToast("Report text copied successfully!", "success");
                        }}
                        className="rounded-xl bg-zinc-950 border border-zinc-800 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 px-3 py-1 text-[10px] font-bold cursor-pointer transition-all"
                      >
                        Copy Report
                      </button>
                    </div>

                    <div className="prose prose-sm prose-invert max-w-none text-zinc-300 leading-relaxed font-sans">
                      {renderMarkdown(aiResult)}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-12 text-zinc-500">
                    <Lock className="h-8 w-8 text-zinc-700 mb-3" />
                    <p className="text-xs font-semibold">No AI Analysis Report Generated</p>
                    <p className="text-[10px] text-zinc-600 max-w-sm mt-1 leading-relaxed">
                      Choose one of the specialized prompt analysis modes above to compile a secure, grounded developer audit report on builder <strong>@{builder.username}</strong>.
                    </p>
                  </div>
                )}

              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
