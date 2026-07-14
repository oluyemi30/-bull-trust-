/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Sparkles, SearchCheck, CheckCircle2, AlertCircle, X, Shield, RefreshCw, Send, HelpCircle, Flame, MessageSquare, ArrowRight, BookOpen } from "lucide-react";
import Navigation from "./components/Navigation";
import LandingPage from "./components/LandingPage";
import EcosystemGraph from "./components/EcosystemGraph";
import ProjectDiscovery from "./components/ProjectDiscovery";
import BuilderPassport from "./components/BuilderPassport";
import AnalyticsDashboard from "./components/AnalyticsDashboard";
import ActivityFeed from "./components/ActivityFeed";
import { BuilderPassportDetails } from "./types";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>("home");
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [connectedWallet, setConnectedWallet] = useState<string | null>(null);
  const [builders, setBuilders] = useState<BuilderPassportDetails[]>([]);
  const [selectedBuilderId, setSelectedBuilderId] = useState<string>("usr-1");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [globalLoading, setGlobalLoading] = useState<boolean>(true);

  // AI Search State (FEATURE 11)
  const [aiSearchQuery, setAiSearchQuery] = useState("");
  const [aiSearchAnswer, setAiSearchAnswer] = useState<string | null>(null);
  const [aiSearchLoading, setAiSearchLoading] = useState(false);

  // Toast helper
  const addToast = (message: string, type: "success" | "error" | "info" = "info") => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Fetch registered builder passports
  const fetchBuildersList = async () => {
    try {
      const res = await fetch("/api/builders");
      if (!res.ok) throw new Error("Failed to load builders registry");
      const data = await res.json();
      setBuilders(data);
      
      // Auto-set the selected builder id to the first active builder if not set
      if (data.length > 0 && !selectedBuilderId) {
        setSelectedBuilderId(data[0].id);
      }
    } catch (err) {
      console.error(err);
      addToast("Failed to initialize ecosystem registry", "error");
    } finally {
      setGlobalLoading(false);
    }
  };

  useEffect(() => {
    fetchBuildersList();
  }, []);

  // Connect Wallet
  const connectWallet = (address: string) => {
    setConnectedWallet(address);
    addToast(`Wallet cryptographically connected: ${address.substring(0, 6)}...${address.substring(address.length - 4)}`, "success");
    fetchBuildersList();
  };

  const disconnectWallet = () => {
    setConnectedWallet(null);
    addToast("Wallet disconnected from passport session", "info");
  };

  // Trigger AI Oracle Search
  const handleAiSearch = async (queryText?: string) => {
    const targetQuery = queryText || aiSearchQuery;
    if (!targetQuery.trim()) {
      addToast("Search query cannot be blank", "error");
      return;
    }

    if (queryText) {
      setAiSearchQuery(queryText);
    }

    setAiSearchLoading(true);
    setAiSearchAnswer(null);

    try {
      const res = await fetch("/api/ai/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: targetQuery }),
      });

      if (!res.ok) throw new Error("AI query timed out");
      const data = await res.json();
      setAiSearchAnswer(data.answer);
    } catch (err) {
      addToast("Gemini oracle failed to compile answer", "error");
    } finally {
      setAiSearchLoading(false);
    }
  };

  // Render Inline Formatted Markdown in AI search result
  const renderAiSearchMarkdown = (text: string) => {
    if (!text) return null;
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      if (line.startsWith("### ")) {
        return <h4 key={idx} className="text-sm font-bold text-foreground mt-4 mb-2">{line.replace("### ", "")}</h4>;
      }
      if (line.startsWith("#### ")) {
        return <h5 key={idx} className="text-xs font-bold text-foreground mt-3 mb-1.5">{line.replace("#### ", "")}</h5>;
      }
      if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
        const cleaned = line.replace(/^[\s]*[-*]\s+/, "");
        return (
          <li key={idx} className="ml-5 list-disc text-xs text-muted-foreground/90 leading-relaxed my-1">
            {parseInlineText(cleaned)}
          </li>
        );
      }
      if (line.trim() === "") return <div key={idx} className="h-1" />;
      return (
        <p key={idx} className="text-xs text-muted-foreground/90 leading-relaxed my-1.5">
          {parseInlineText(line)}
        </p>
      );
    });
  };

  const parseInlineText = (line: string) => {
    const parts: React.ReactNode[] = [];
    let currentText = line;
    let keyIdx = 0;

    while (currentText.length > 0) {
      const boldMatch = currentText.match(/\*\*([^*]+)\*\*/);
      const codeMatch = currentText.match(/`([^`]+)`/);

      if (boldMatch && (!codeMatch || boldMatch.index! < codeMatch.index!)) {
        const start = boldMatch.index!;
        if (start > 0) {
          parts.push(<span key={keyIdx++}>{currentText.substring(0, start)}</span>);
        }
        parts.push(<strong key={keyIdx++} className="font-bold text-foreground">{boldMatch[1]}</strong>);
        currentText = currentText.substring(start + boldMatch[0].length);
      } else if (codeMatch) {
        const start = codeMatch.index!;
        if (start > 0) {
          parts.push(<span key={keyIdx++}>{currentText.substring(0, start)}</span>);
        }
        parts.push(
          <code key={keyIdx++} className="bg-muted px-1 py-0.5 rounded-sm font-mono text-[10px] border border-border text-primary font-semibold">
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

  return (
    <div className={`min-h-screen transition-colors duration-300 bg-[#09090b] text-zinc-100 dark font-sans`}>
      
      {/* GLOBAL TOP BAR NAVIGATION */}
      <Navigation
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        connectedWallet={connectedWallet}
        connectWallet={connectWallet}
        disconnectWallet={disconnectWallet}
        builders={builders}
        onSelectBuilder={setSelectedBuilderId}
        addToast={addToast}
      />

      {globalLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[500px]">
          <RefreshCw className="h-8 w-8 text-emerald-400 animate-spin mb-4" />
          <h2 className="text-sm font-bold tracking-tight font-display">Initializing decentralized ledger nodes...</h2>
          <p className="text-xs text-zinc-500 mt-1">Downloading registered Passports and smart trust scores.</p>
        </div>
      ) : (
        <main className="pb-16">
          
          {/* PROMINENT AI SEARCH COMPONENT (FEATURE 11) */}
          <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
            <div className="rounded-3xl border border-zinc-800 bg-[#0c0c0e] p-6 shadow-xl relative overflow-hidden bento-glow backdrop-blur-md">
              
              {/* Background glowing gradients */}
              <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-teal-500/5 blur-3xl pointer-events-none" />

              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4 text-emerald-400 animate-pulse" />
                  <h2 className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 font-mono">Interactive AI Oracle Search</h2>
                </div>

                <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed mb-4 font-sans">
                  Ask the Gemini AI Oracle to search and analyze the entire database state. Ask questions such as:
                </p>

                {/* SUGGESTION BARS */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <button
                    onClick={() => handleAiSearch("Find trustworthy frontend developers.")}
                    className="rounded-xl bg-zinc-900/40 border border-zinc-800 hover:border-emerald-500/40 hover:bg-zinc-900/80 px-3 py-1.5 text-[10px] font-bold text-zinc-400 hover:text-zinc-100 transition-all cursor-pointer"
                  >
                    "Find trustworthy frontend developers."
                  </button>
                  <button
                    onClick={() => handleAiSearch("Who has built the most projects?")}
                    className="rounded-xl bg-zinc-900/40 border border-zinc-800 hover:border-emerald-500/40 hover:bg-zinc-900/80 px-3 py-1.5 text-[10px] font-bold text-zinc-400 hover:text-zinc-100 transition-all cursor-pointer"
                  >
                    "Who has built the most projects?"
                  </button>
                  <button
                    onClick={() => handleAiSearch("Show active AI builders.")}
                    className="rounded-xl bg-zinc-900/40 border border-zinc-800 hover:border-emerald-500/40 hover:bg-zinc-900/80 px-3 py-1.5 text-[10px] font-bold text-zinc-400 hover:text-zinc-100 transition-all cursor-pointer"
                  >
                    "Show active AI builders."
                  </button>
                </div>

                {/* SEARCH FORM */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAiSearch();
                  }}
                  className="flex gap-2 max-w-3xl"
                >
                  <input
                    type="text"
                    placeholder='Ask the oracle (e.g. "Which builder specializes in Solidity and has a trust score over 90%?")'
                    value={aiSearchQuery}
                    onChange={(e) => setAiSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900/30 px-4 py-2.5 text-xs font-semibold focus:border-emerald-500/40 focus:bg-zinc-900/50 focus:outline-hidden transition-all text-zinc-100 placeholder:text-zinc-600"
                  />
                  <button
                    type="submit"
                    disabled={aiSearchLoading}
                    className="rounded-xl bg-emerald-500 hover:bg-emerald-400 px-5 py-2.5 text-xs font-bold text-zinc-950 shadow-lg shadow-emerald-500/10 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    {aiSearchLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Query
                  </button>
                </form>

                {/* SEARCH RESULTS DISPLAY */}
                {aiSearchLoading ? (
                  <div className="mt-4 p-5 rounded-2xl border border-zinc-800 bg-zinc-900/20 text-center animate-pulse">
                    <Sparkles className="h-4 w-4 text-emerald-400 animate-spin mx-auto mb-2" />
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest animate-pulse block font-mono">Gemini is compiling network findings...</span>
                  </div>
                ) : aiSearchAnswer ? (
                  <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 relative animate-in slide-in-from-top-3 duration-300 bento-glow">
                    <button
                      onClick={() => setAiSearchAnswer(null)}
                      className="absolute top-4 right-4 rounded-xl p-1 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer border border-transparent hover:border-zinc-800"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                    <div className="flex items-center gap-1.5 pb-2 border-b border-zinc-800 mb-3">
                      <SearchCheck className="h-4 w-4 text-emerald-400" />
                      <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest font-mono">Gemini Oracle Answer</h4>
                    </div>
                    <div className="prose prose-sm prose-invert max-w-none text-zinc-300 leading-relaxed font-sans">
                      {renderAiSearchMarkdown(aiSearchAnswer)}
                    </div>
                  </div>
                ) : null}

              </div>
            </div>
          </div>

          {/* DYNAMIC TAB COMPONENT SWITCHER */}
          <div className="animate-in fade-in duration-300">
            {currentTab === "home" && (
              <LandingPage
                setCurrentTab={setCurrentTab}
                builders={builders}
                onSelectBuilder={setSelectedBuilderId}
                addToast={addToast}
                connectWallet={connectWallet}
                connectedWallet={connectedWallet}
              />
            )}
            {currentTab === "graph" && (
              <EcosystemGraph
                builders={builders}
                onSelectBuilder={setSelectedBuilderId}
                setCurrentTab={setCurrentTab}
              />
            )}
            {currentTab === "discovery" && (
              <ProjectDiscovery
                connectedWallet={connectedWallet}
                addToast={addToast}
                builders={builders}
              />
            )}
            {currentTab === "passports" && (
              <BuilderPassport
                connectedWallet={connectedWallet}
                builders={builders}
                selectedBuilderId={selectedBuilderId}
                onSelectBuilder={setSelectedBuilderId}
                addToast={addToast}
                fetchBuildersList={fetchBuildersList}
              />
            )}
            {currentTab === "analytics" && (
              <AnalyticsDashboard addToast={addToast} />
            )}
            {currentTab === "feed" && (
              <ActivityFeed addToast={addToast} />
            )}
          </div>

        </main>
      )}

      {/* TOAST LIST */}
      <div className="fixed bottom-6 right-6 z-50 space-y-3 w-full max-w-xs sm:max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 rounded-2xl border p-4 shadow-2xl animate-in slide-in-from-right duration-200 ${
              toast.type === "success"
                ? "border-emerald-500/20 bg-[#0c0c0e]/95 text-zinc-100 bento-glow"
                : toast.type === "error"
                ? "border-rose-500/20 bg-[#0c0c0e]/95 text-zinc-100"
                : "border-zinc-800 bg-[#0c0c0e]/95 text-zinc-100"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : toast.type === "error" ? (
              <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
            ) : (
              <Sparkles className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            )}
            
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold leading-normal text-zinc-200">{toast.message}</p>
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="rounded-xl p-0.5 hover:bg-zinc-900 text-zinc-500 hover:text-zinc-300 transition-all shrink-0 cursor-pointer border border-transparent hover:border-zinc-800"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

    </div>
  );
}
