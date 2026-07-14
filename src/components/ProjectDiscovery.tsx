import React, { useState, useEffect } from "react";
import { Search, Compass, Shield, Plus, Globe, Github, Twitter, Layers, Flame, ArrowRight, CheckCircle, HelpCircle } from "lucide-react";
import { Project } from "../types";

interface ProjectDiscoveryProps {
  connectedWallet: string | null;
  addToast: (message: string, type: "success" | "error" | "info") => void;
  builders: any[];
}

const CATEGORIES = ["All", "AI", "DeFi", "Gaming", "Infrastructure", "NFT", "Social", "Developer Tools"];

export default function ProjectDiscovery({ connectedWallet, addToast, builders }: ProjectDiscoveryProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Project["category"]>("AI");
  const [logo, setLogo] = useState("🤖");
  const [website, setWebsite] = useState("");
  const [github, setGithub] = useState("");
  const [twitter, setTwitter] = useState("");

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const url = `/api/projects?category=${encodeURIComponent(selectedCategory)}&search=${encodeURIComponent(searchQuery)}`;
      const res = await fetch(url);
      const data = await res.json();
      setProjects(data);
    } catch (err) {
      console.error("Error fetching projects:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [selectedCategory, searchQuery]);

  const handleSubmitProject = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!connectedWallet) {
      addToast("Please connect your Web3 wallet or register a passport first", "error");
      return;
    }

    // Find user ID of the connected wallet
    const activeBuilder = builders.find((b) =>
      b.wallets.some((w: any) => w.address.toLowerCase() === connectedWallet.toLowerCase())
    );

    if (!activeBuilder) {
      addToast("Your connected wallet does not have a registered Passport. Please register first.", "error");
      return;
    }

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          category,
          logo,
          website,
          github,
          twitter,
          creatorId: activeBuilder.id,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to submit project");
      }

      addToast("Project Submitted Successfully for Core Review!", "success");
      setIsSubmitOpen(false);
      
      // Reset form
      setName("");
      setDescription("");
      setLogo("🤖");
      setWebsite("");
      setGithub("");
      setTwitter("");

      fetchProjects();
    } catch (err) {
      addToast("Failed to submit project", "error");
    }
  };

  const handleVerifyProject = async (projectId: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/verify`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Verification failed");
      addToast("Ecosystem project successfully verified and trust indexes updated!", "success");
      fetchProjects();
    } catch (err) {
      addToast("Verification update failed", "error");
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 text-zinc-100">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800 pb-5 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-display text-zinc-100">Ecosystem Project Discovery</h1>
          <p className="text-xs text-zinc-500 mt-1">
            Browse and query decentralized projects, DeFi applications, and autonomous agents in the ANSEM ecosystem.
          </p>
        </div>
        <div>
          <button
            onClick={() => {
              if (!connectedWallet) {
                addToast("Please connect your wallet or claim a Passport first.", "error");
                return;
              }
              setIsSubmitOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2.5 text-xs font-bold text-zinc-950 transition-all w-full sm:w-auto justify-center cursor-pointer shadow-lg shadow-emerald-500/10"
          >
            <Plus className="h-4 w-4" />
            Submit New Project
          </button>
        </div>
      </div>

      {/* FILTER & SEARCH ROW */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
        
        {/* Category Pill Filters (FEATURE 9) */}
        <div className="flex flex-wrap gap-1.5 max-w-full overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-xl px-4 py-1.5 text-xs font-semibold tracking-wide transition-all duration-200 border cursor-pointer ${
                selectedCategory === cat
                  ? "bg-emerald-500 text-zinc-950 border-emerald-500 shadow-md font-bold"
                  : "bg-zinc-900/40 text-zinc-400 border-zinc-800 hover:bg-zinc-900/80 hover:text-zinc-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Local Project Search bar */}
        <div className="relative w-full md:max-w-xs">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-zinc-600" />
          </div>
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900/30 py-2 pl-9 pr-4 text-xs font-semibold focus:border-emerald-500/40 focus:bg-zinc-900/50 focus:outline-hidden transition-all text-zinc-100 placeholder:text-zinc-600"
          />
        </div>

      </div>

      {/* PROJECTS GRID */}
      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-3xl border border-zinc-800 bg-[#0c0c0e] p-6 space-y-4 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl bg-zinc-900" />
                <div className="h-5 w-20 rounded-full bg-zinc-900" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-3/4 rounded-md bg-zinc-900" />
                <div className="h-3 w-full rounded-md bg-zinc-900" />
                <div className="h-3 w-5/6 rounded-md bg-zinc-900" />
              </div>
              <div className="flex items-center justify-between border-t border-zinc-900 pt-4">
                <div className="h-4 w-16 rounded-md bg-zinc-900" />
                <div className="h-6 w-24 rounded-full bg-zinc-900" />
              </div>
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-800 p-12 text-center bg-zinc-900/10">
          <Compass className="h-12 w-12 text-zinc-600 animate-bounce mb-4" />
          <h3 className="text-sm font-bold text-zinc-300 font-display">No Projects Found</h3>
          <p className="text-xs text-zinc-500 max-w-sm mt-1">
            We couldn't find any projects matching the selected category or query. Try refining your parameters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((proj) => (
            <div
              key={proj.id}
              className="group relative flex flex-col justify-between rounded-3xl border border-zinc-800 bg-[#0c0c0e] p-6 shadow-xl hover:-translate-y-1 hover:shadow-emerald-500/5 hover:border-emerald-500/20 transition-all duration-300 bento-glow backdrop-blur-md"
            >
              <div>
                {/* LOGO & CATEGORY BAR */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-xl group-hover:scale-110 transition-transform">
                    {proj.logo}
                  </div>
                  <span className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-[9px] font-bold tracking-wider uppercase text-emerald-400 font-mono">
                    {proj.category}
                  </span>
                </div>

                {/* PROJECT NAME & DESCRIPTION */}
                <h3 className="text-sm font-bold group-hover:text-emerald-400 transition-colors flex items-center gap-1.5 font-display text-zinc-100">
                  {proj.name}
                  {proj.verified && (
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-400 fill-emerald-400/10" title="Core Verified Product" />
                  )}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed mt-2 mb-4 line-clamp-3">
                  {proj.description}
                </p>
              </div>

              <div>
                {/* SOCIAL LINKS AND TRUST SCORE */}
                <div className="flex items-center justify-between border-t border-zinc-900 pt-4 mt-2">
                  <div className="flex items-center gap-2">
                    {proj.website && (
                      <a href={proj.website} target="_blank" rel="noreferrer" className="text-zinc-500 hover:text-zinc-300 transition-colors">
                        <Globe className="h-3.5 w-3.5" />
                      </a>
                    )}
                    {proj.github && (
                      <a href={proj.github} target="_blank" rel="noreferrer" className="text-zinc-500 hover:text-zinc-300 transition-colors">
                        <Github className="h-3.5 w-3.5" />
                      </a>
                    )}
                    {proj.twitter && (
                      <a href={proj.twitter} target="_blank" rel="noreferrer" className="text-zinc-500 hover:text-zinc-300 transition-colors">
                        <Twitter className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 font-mono">
                    <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">TRUST SCORE</span>
                    <span className={`rounded-lg px-2 py-0.5 text-[10px] font-extrabold ${
                      proj.trust_score >= 90
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : proj.trust_score >= 80
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                    }`}>
                      {proj.trust_score}%
                    </span>
                  </div>
                </div>

                {/* OWNER DETAILS & VERIFY ACTION FOR DEMO */}
                {proj.creator && (
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-zinc-900 border-dashed">
                    <div className="flex items-center gap-1.5">
                      <img src={proj.creator.avatar} alt={proj.creator.username} className="h-4 w-4 rounded-full object-cover border border-zinc-800" />
                      <span className="text-[10px] text-zinc-500">Created by <strong className="text-zinc-300 font-semibold">@{proj.creator.username}</strong></span>
                    </div>

                    {!proj.verified && (
                      <button
                        onClick={() => handleVerifyProject(proj.id)}
                        className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500 hover:text-zinc-950 px-2.5 py-1 text-[10px] font-bold text-emerald-400 transition-all cursor-pointer"
                      >
                        Verify Project
                      </button>
                    )}
                  </div>
                )}
              </div>

            </div>
          ))}
        </div>
      )}

      {/* SUBMIT PROJECT MODAL */}
      {isSubmitOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl border border-zinc-800 bg-[#0c0c0e] p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-zinc-100 bento-glow relative">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-emerald-400" />
                <h3 className="text-sm font-bold font-display text-zinc-100">Submit Ecosystem Project</h3>
              </div>
              <button
                onClick={() => setIsSubmitOpen(false)}
                className="rounded-xl p-1.5 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-100 transition-colors border border-transparent hover:border-zinc-800 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <form onSubmit={handleSubmitProject} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase tracking-wider font-mono">Project Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. DeFi Ledger Bot"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900/30 px-3.5 py-2 text-xs font-semibold focus:border-emerald-500/40 focus:outline-hidden text-zinc-100 placeholder:text-zinc-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase tracking-wider font-mono">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Project["category"])}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2 text-xs font-semibold focus:border-emerald-500/40 focus:outline-hidden text-zinc-100"
                    required
                  >
                    {CATEGORIES.slice(1).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase tracking-wider font-mono">Description *</label>
                <textarea
                  placeholder="Describe your ecosystem contribution, tech stack, and decentralised properties..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900/30 px-3.5 py-2 text-xs font-medium focus:border-emerald-500/40 focus:outline-hidden text-zinc-100 placeholder:text-zinc-600 min-h-[80px]"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase tracking-wider font-mono">Logo / Emoji</label>
                  <input
                    type="text"
                    placeholder="e.g. 🤖"
                    value={logo}
                    onChange={(e) => setLogo(e.target.value)}
                    className="w-full text-center rounded-xl border border-zinc-800 bg-zinc-900/30 px-3.5 py-2 text-xs font-semibold focus:border-emerald-500/40 focus:outline-hidden text-zinc-100 placeholder:text-zinc-600"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase tracking-wider font-mono">Website URL</label>
                  <input
                    type="url"
                    placeholder="https://myproject.io"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900/30 px-3.5 py-2 text-xs font-semibold focus:border-emerald-500/40 focus:outline-hidden text-zinc-100 placeholder:text-zinc-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase tracking-wider font-mono">GitHub Repo Link</label>
                  <input
                    type="url"
                    placeholder="https://github.com/org/repo"
                    value={github}
                    onChange={(e) => setGithub(e.target.value)}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900/30 px-3.5 py-2 text-xs font-semibold focus:border-emerald-500/40 focus:outline-hidden text-zinc-100 placeholder:text-zinc-600"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase tracking-wider font-mono">Twitter Link</label>
                  <input
                    type="url"
                    placeholder="https://twitter.com/myproject"
                    value={twitter}
                    onChange={(e) => setTwitter(e.target.value)}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900/30 px-3.5 py-2 text-xs font-semibold focus:border-emerald-500/40 focus:outline-hidden text-zinc-100 placeholder:text-zinc-600"
                  />
                </div>
              </div>

              <div className="bg-emerald-500/5 rounded-2xl p-3.5 border border-emerald-500/10 flex gap-2 items-start text-[10px] text-zinc-400 leading-relaxed font-sans">
                <Shield className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5 animate-pulse" />
                <p>
                  Submitting a project links it irreversibly to your active Builder Passport. The project will appear as <strong className="text-zinc-200">Pending Verification</strong> until a security reviewer checks your repository code alignment and confirms compliance.
                </p>
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 py-2.5 text-xs font-bold text-zinc-950 shadow-lg shadow-emerald-500/10 transition-all cursor-pointer"
              >
                Submit Project
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// Inline Close Icon
function X({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
    </svg>
  );
}
