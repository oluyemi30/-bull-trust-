import React, { useState, useEffect, useRef } from "react";
import { Search, Wallet, User, Shield, Compass, BarChart3, Radio, Moon, Sun, SearchCheck, ExternalLink, X, Plus, Home } from "lucide-react";
import { BuilderPassportDetails, Project, Wallet as WalletType } from "../types";

interface NavigationProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  connectedWallet: string | null;
  connectWallet: (address: string) => void;
  disconnectWallet: () => void;
  builders: BuilderPassportDetails[];
  onSelectBuilder: (id: string) => void;
  addToast: (message: string, type: "success" | "error" | "info") => void;
}

export default function Navigation({
  currentTab,
  setCurrentTab,
  darkMode,
  setDarkMode,
  connectedWallet,
  connectWallet,
  disconnectWallet,
  builders,
  onSelectBuilder,
  addToast,
}: NavigationProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{
    builders: BuilderPassportDetails[];
    projects: any[];
    wallets: any[];
  }>({ builders: [], projects: [], wallets: [] });
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Registration Form State
  const [regUsername, setRegUsername] = useState("");
  const [regWallet, setRegWallet] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regGithub, setRegGithub] = useState("");
  const [regTwitter, setRegTwitter] = useState("");
  const [regEntityType, setRegEntityType] = useState<"builder" | "influencer" | "memecoin" | "trader" | "validator">("builder");

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle global search input change
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults({ builders: [], projects: [], wallets: [] });
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        setSearchResults(data);
        setShowSearchDropdown(true);
      } catch (err) {
        console.error("Error searching:", err);
      }
    }, 200);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regUsername || !regWallet) {
      addToast("Username and Wallet Address are required", "error");
      return;
    }

    try {
      const res = await fetch("/api/builders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: regUsername,
          walletAddress: regWallet,
          email: regEmail,
          githubUsername: regGithub,
          twitterUrl: regTwitter,
          entityType: regEntityType,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to register passport");
      }

      const data = await res.json();
      connectWallet(regWallet);
      addToast(`Sovereign Passport Successfully Registered as a ${regEntityType}!`, "success");
      setIsRegisterOpen(false);
      
      // Auto select the newly created builder
      if (data.user && data.user.id) {
        onSelectBuilder(data.user.id);
        setCurrentTab("passports");
      }
    } catch (err: any) {
      addToast(err.message, "error");
    }
  };

  const handleQuickConnect = () => {
    // Generate a random high-quality mock wallet address for quick onboarding
    const mockAddress = "0x" + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
    // Find if we have registered user matching
    const existUser = builders.find(b => b.username === "Ansem");
    if (existUser && existUser.wallets.length > 0) {
      connectWallet(existUser.wallets[0].address);
      addToast(`Connected to primary Ledger of ${existUser.username}`, "success");
    } else {
      connectWallet(mockAddress);
      addToast("Temporary wallet address generated & connected!", "info");
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-[#09090b]/90 backdrop-blur-md border-zinc-800">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* LOGO AREA */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentTab("home")}>
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
            <Shield className="h-4 w-4" />
          </div>
          <span className="hidden text-base font-bold tracking-tight text-zinc-100 sm:block font-display">
            Bull Trust <span className="text-emerald-400">ANSEM</span>
          </span>
        </div>

        {/* TABS NAVIGATION */}
        <nav className="hidden md:flex items-center space-x-1.5">
          <button
            onClick={() => setCurrentTab("home")}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold tracking-wide transition-all ${
              currentTab === "home"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100 border border-transparent"
            }`}
          >
            <Home className="h-3.5 w-3.5" />
            Home
          </button>
          <button
            onClick={() => setCurrentTab("graph")}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold tracking-wide transition-all ${
              currentTab === "graph"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100 border border-transparent"
            }`}
          >
            <Compass className="h-3.5 w-3.5" />
            Ecosystem Graph
          </button>
          <button
            onClick={() => setCurrentTab("discovery")}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold tracking-wide transition-all ${
              currentTab === "discovery"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100 border border-transparent"
            }`}
          >
            <Compass className="h-3.5 w-3.5" />
            Project Discovery
          </button>
          <button
            onClick={() => setCurrentTab("passports")}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold tracking-wide transition-all ${
              currentTab === "passports"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100 border border-transparent"
            }`}
          >
            <User className="h-3.5 w-3.5" />
            Builder Passports
          </button>
          <button
            onClick={() => setCurrentTab("analytics")}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold tracking-wide transition-all ${
              currentTab === "analytics"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100 border border-transparent"
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            Analytics
          </button>
          <button
            onClick={() => setCurrentTab("feed")}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold tracking-wide transition-all ${
              currentTab === "feed"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100 border border-transparent"
            }`}
          >
            <Radio className="h-3.5 w-3.5 animate-pulse text-rose-500" />
            Live Feed
          </button>
        </nav>

        {/* SEARCH & ACTIONS */}
        <div className="flex items-center gap-3.5 flex-1 md:flex-initial justify-end max-w-xs sm:max-w-md w-full">
          
          {/* GLOBAL SEARCH INPUT (FEATURE 10) */}
          <div className="relative w-full max-w-[180px] sm:max-w-[220px]" ref={dropdownRef}>
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-3.5 w-3.5 text-zinc-500" />
            </div>
            <input
              type="text"
              placeholder="Search wallets, builders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowSearchDropdown(true)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/30 py-1.5 pl-9 pr-4 text-xs placeholder:text-zinc-500 focus:border-emerald-500/40 focus:bg-zinc-900/80 focus:outline-hidden transition-all text-zinc-100 font-sans"
            />

            {/* SEARCH RESULTS DROPDOWN (FEATURE 10) */}
            {showSearchDropdown && (searchResults.builders.length > 0 || searchResults.projects.length > 0 || searchResults.wallets.length > 0) && (
              <div className="absolute right-0 mt-2 w-[280px] sm:w-[340px] rounded-2xl border border-zinc-800 bg-[#0c0c0e]/95 p-2 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-2 text-[10px] font-bold tracking-wider text-zinc-500 uppercase border-b border-zinc-800/80 mb-1 font-mono">
                  Ecosystem Search Matches
                </div>
                
                {/* BUILDERS */}
                {searchResults.builders.length > 0 && (
                  <div className="mb-2">
                    <span className="px-2 py-1 text-[10px] font-bold text-emerald-400 flex items-center gap-1 font-mono uppercase">👤 Builders</span>
                    {searchResults.builders.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => {
                          onSelectBuilder(b.id);
                          setCurrentTab("passports");
                          setShowSearchDropdown(false);
                          setSearchQuery("");
                        }}
                        className="w-full text-left flex items-center gap-2 rounded-xl p-1.5 hover:bg-zinc-900/80 transition-colors"
                      >
                        <img src={b.avatar} alt={b.username} className="h-6 w-6 rounded-full object-cover border border-zinc-800" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold truncate text-zinc-100">@{b.username}</p>
                          <p className="text-[9px] text-zinc-500">Score: {b.trust_score}% | Tier {b.reputation_level}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* PROJECTS */}
                {searchResults.projects.length > 0 && (
                  <div className="mb-2">
                    <span className="px-2 py-1 text-[10px] font-bold text-amber-500 flex items-center gap-1 font-mono uppercase">📦 Projects</span>
                    {searchResults.projects.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          onSelectBuilder(p.creator_id);
                          setCurrentTab("passports");
                          setShowSearchDropdown(false);
                          setSearchQuery("");
                          addToast(`Redirecting to ${p.name}'s creator Passport`, "info");
                        }}
                        className="w-full text-left flex items-center gap-2 rounded-xl p-1.5 hover:bg-zinc-900/80 transition-colors"
                      >
                        <span className="text-base">{p.logo}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold truncate text-zinc-100">{p.name}</p>
                          <p className="text-[9px] text-zinc-500 truncate">{p.description}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* WALLETS */}
                {searchResults.wallets.length > 0 && (
                  <div>
                    <span className="px-2 py-1 text-[10px] font-bold text-teal-400 flex items-center gap-1 font-mono uppercase">💳 Wallets</span>
                    {searchResults.wallets.map((w) => (
                      <button
                        key={w.id}
                        onClick={() => {
                          onSelectBuilder(w.user_id);
                          setCurrentTab("passports");
                          setShowSearchDropdown(false);
                          setSearchQuery("");
                        }}
                        className="w-full text-left flex items-center gap-2 rounded-xl p-1.5 hover:bg-zinc-900/80 transition-colors"
                      >
                        <Wallet className="h-3 w-3 text-teal-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-semibold truncate font-mono text-zinc-100">{w.address}</p>
                          <p className="text-[9px] text-zinc-500 truncate">Owner: {w.username} ({w.chain})</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* THEME TOGGLE */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="rounded-xl p-2 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-100 transition-colors border border-transparent hover:border-zinc-800"
            title="Toggle Theme"
          >
            {darkMode ? <Sun className="h-3.5 w-3.5 text-amber-500" /> : <Moon className="h-3.5 w-3.5 text-zinc-500" />}
          </button>

          {/* CONNECT / REGISTER WALLET */}
          {connectedWallet ? (
            <div className="flex items-center gap-2">
              <button
                onClick={disconnectWallet}
                className="hidden sm:flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-900 hover:text-zinc-100 transition-all font-mono"
              >
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {connectedWallet.substring(0, 6)}...{connectedWallet.substring(connectedWallet.length - 4)}
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleQuickConnect}
                className="hidden lg:flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-900 transition-all cursor-pointer"
              >
                <Wallet className="h-3.5 w-3.5 text-zinc-500" />
                Quick Connect
              </button>
              <button
                onClick={() => setIsRegisterOpen(true)}
                className="flex items-center gap-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 px-3 py-1.5 text-xs font-bold shadow-lg shadow-emerald-500/10 transition-all cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                Claim Passport
              </button>
            </div>
          )}

        </div>
      </div>

      {/* CLAIM PASSPORT MODAL (WALLET REGISTER) */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-[#0c0c0e]/95 p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-zinc-100">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-emerald-400" />
                <h3 className="text-base font-bold font-display">Claim Sovereign Passport</h3>
              </div>
              <button onClick={() => setIsRegisterOpen(false)} className="rounded-xl p-1.5 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-100 transition-colors border border-transparent hover:border-zinc-800 cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold tracking-wider font-mono text-zinc-500 uppercase mb-1">Ecosystem Role / Identity *</label>
                <select
                  value={regEntityType}
                  onChange={(e) => setRegEntityType(e.target.value as any)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2 text-xs font-semibold focus:border-emerald-500/40 focus:outline-hidden text-zinc-100"
                  required
                >
                  <option value="builder">Developer / Builder (DeFi, AI, Smart Contracts)</option>
                  <option value="influencer">KOL / Influencer (Content, Communities, Advisors)</option>
                  <option value="memecoin">Meme Project / Token (Culture, Deployers, Promoters)</option>
                  <option value="trader">Ecosystem Trader (DeFi Degens, LPs, Arbitrageurs)</option>
                  <option value="validator">Validator / Infra (Node Runners, Stakers, Security)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold tracking-wider font-mono text-zinc-500 uppercase mb-1">Username / Handle *</label>
                <input
                  type="text"
                  placeholder="e.g. DeFi_Architect or MemeKing"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900/30 px-3.5 py-2 text-xs font-semibold focus:border-emerald-500/40 focus:outline-hidden text-zinc-100 placeholder:text-zinc-600"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold tracking-wider font-mono text-zinc-500 uppercase mb-1">Primary Wallet Address *</label>
                <input
                  type="text"
                  placeholder="e.g. 0x71C...B29 or Solana address"
                  value={regWallet}
                  onChange={(e) => setRegWallet(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900/30 px-3.5 py-2 text-xs font-mono focus:border-emerald-500/40 focus:outline-hidden text-zinc-100 placeholder:text-zinc-600"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold tracking-wider font-mono text-zinc-500 uppercase mb-1">Email / Contact (Optional)</label>
                <input
                  type="email"
                  placeholder="e.g. verify@ansemecosystem.io"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900/30 px-3.5 py-2 text-xs font-semibold focus:border-emerald-500/40 focus:outline-hidden text-zinc-100 placeholder:text-zinc-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold tracking-wider font-mono text-zinc-500 uppercase mb-1">Github Username</label>
                  <input
                    type="text"
                    placeholder="e.g. github_dev"
                    value={regGithub}
                    onChange={(e) => setRegGithub(e.target.value)}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900/30 px-3.5 py-2 text-xs font-semibold focus:border-emerald-500/40 focus:outline-hidden text-zinc-100 placeholder:text-zinc-600"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold tracking-wider font-mono text-zinc-500 uppercase mb-1">Twitter / X Handle</label>
                  <input
                    type="text"
                    placeholder="e.g. twitter_dev"
                    value={regTwitter}
                    onChange={(e) => setRegTwitter(e.target.value)}
                    className="w-full rounded-xl border border-zinc-800 bg-[#0c0c0e]/30 px-3.5 py-2 text-xs font-semibold focus:border-emerald-500/40 focus:outline-hidden text-zinc-100 placeholder:text-zinc-600"
                  />
                </div>
              </div>

              <div className="bg-emerald-500/5 rounded-2xl p-3 border border-emerald-500/10 flex gap-2 items-start text-[10px] text-zinc-400 leading-relaxed mt-2">
                <Shield className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <p>
                  Claiming a Sovereign Passport creates an immutable cryptographic identity within the Bull Trust ANSEM Ecosystem ledger. This grants your wallet access to submit ratings, request AI-grounded audits, and connect your Web3 reputational authority.
                </p>
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 py-2.5 text-xs font-bold text-zinc-950 shadow-lg shadow-emerald-500/10 transition-all cursor-pointer animate-pulse"
              >
                Claim Passport & Connect Wallet
              </button>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
