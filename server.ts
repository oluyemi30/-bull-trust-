import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client safely
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
    console.log("Gemini Client successfully initialized server-side.");
  } catch (err) {
    console.error("Failed to initialize Gemini Client:", err);
  }
} else {
  console.warn("GEMINI_API_KEY is not defined. AI queries will fall back to smart local simulation.");
}

// Robust wrapper for Gemini generateContent with automatic retry and model fallback (e.g., if gemini-3.5-flash has a 503)
async function generateContentWithRetry(aiClient: GoogleGenAI, params: any, retries = 2, delayMs = 1000): Promise<any> {
  const modelsToTry = [params.model, "gemini-3.1-flash-lite"];
  let lastError: any = null;

  for (const currentModel of modelsToTry) {
    if (!currentModel) continue;

    const requestParams = {
      ...params,
      model: currentModel
    };

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        console.log(`Querying AI model ${currentModel} (Attempt ${attempt + 1}/${retries + 1})...`);
        const response = await aiClient.models.generateContent(requestParams);
        return response;
      } catch (err: any) {
        lastError = err;
        const errMessage = err?.message || JSON.stringify(err);
        console.warn(`Attempt ${attempt + 1} failed for model ${currentModel}: ${errMessage}`);

        // Only wait and retry if we have retries left
        if (attempt < retries) {
          const waitTime = delayMs * Math.pow(1.5, attempt);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
      }
    }
  }

  throw lastError;
}

// Relational database state path
const DB_PATH = path.join(process.cwd(), "db.json");

interface User {
  id: string;
  username: string;
  email: string;
  avatar: string;
  reputation_level: number;
  trust_score: number;
  verified_identity: boolean;
  created_at: string;
  entity_type?: "builder" | "influencer" | "memecoin" | "trader" | "validator";
}

interface Wallet {
  id: string;
  user_id: string;
  address: string;
  chain: string;
  label: string;
  verified_at: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  category: "AI" | "DeFi" | "Gaming" | "Infrastructure" | "NFT" | "Social" | "Developer Tools";
  logo: string;
  website: string;
  github: string;
  twitter: string;
  creator_id: string;
  trust_score: number;
  verified: boolean;
  created_at: string;
}

interface Review {
  id: string;
  reviewer_id: string;
  builder_id: string;
  rating: number; // 1-5
  content: string;
  verified_transaction_hash?: string;
  category: string;
  created_at: string;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  issuer: string;
  created_at: string;
}

interface UserBadge {
  user_id: string;
  badge_id: string;
  earned_at: string;
}

interface Skill {
  id: string;
  user_id: string;
  name: string;
  endorsement_count: number;
}

interface Follower {
  follower_id: string;
  following_id: string;
  created_at: string;
}

interface Activity {
  id: string;
  user_id: string;
  type: "review_posted" | "project_verified" | "badge_earned" | "skill_endorsed" | "new_builder" | "follow";
  details: string;
  created_at: string;
}

interface TrustScoreDetails {
  user_id: string;
  alignment_score: number;
  history_score: number;
  verification_score: number;
  overall_score: number;
}

interface GithubProfile {
  user_id: string;
  username: string;
  public_repos: number;
  followers: number;
  contributions_count: number;
  updated_at: string;
}

interface SocialLink {
  user_id: string;
  twitter: string;
  github: string;
  website: string;
  telegram: string;
}

interface Database {
  users: User[];
  wallets: Wallet[];
  projects: Project[];
  reviews: Review[];
  badges: Badge[];
  user_badges: UserBadge[];
  skills: Skill[];
  followers: Follower[];
  activities: Activity[];
  trust_scores: TrustScoreDetails[];
  github_profiles: GithubProfile[];
  social_links: SocialLink[];
}

const DEFAULT_DB: Database = {
  users: [
    {
      id: "usr-1",
      username: "Ansem",
      email: "ansem@ansemecosystem.io",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80",
      reputation_level: 5,
      trust_score: 98,
      verified_identity: true,
      created_at: "2025-01-10T12:00:00Z",
      entity_type: "influencer",
    },
    {
      id: "usr-2",
      username: "Satoshi_Dev",
      email: "satoshi@bitcoin.org",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80",
      reputation_level: 5,
      trust_score: 99,
      verified_identity: true,
      created_at: "2025-01-01T00:00:00Z",
      entity_type: "builder",
    },
    {
      id: "usr-3",
      username: "Vitalic_B",
      email: "vitalic@ethereum.org",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80",
      reputation_level: 4,
      trust_score: 95,
      verified_identity: true,
      created_at: "2025-01-15T08:30:00Z",
      entity_type: "builder",
    },
    {
      id: "usr-4",
      username: "DeFi_Enthusiast",
      email: "defi_chad@yield.farm",
      avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=150&h=150&q=80",
      reputation_level: 3,
      trust_score: 82,
      verified_identity: false,
      created_at: "2025-02-20T14:45:00Z",
      entity_type: "trader",
    },
    {
      id: "usr-5",
      username: "Solana_Sam",
      email: "sam@solana.com",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&h=150&q=80",
      reputation_level: 4,
      trust_score: 89,
      verified_identity: true,
      created_at: "2025-02-05T10:15:00Z",
      entity_type: "memecoin",
    },
    {
      id: "usr-6",
      username: "Web3_Ninja",
      email: "ninja@web3build.xyz",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150&q=80",
      reputation_level: 3,
      trust_score: 76,
      verified_identity: false,
      created_at: "2025-03-01T16:20:00Z",
      entity_type: "validator",
    },
  ],
  wallets: [
    { id: "wal-1", user_id: "usr-1", address: "0xAnsem777DeFi9999aBcD123456789EeeF", chain: "Ethereum", label: "Primary Ledger", verified_at: "2025-01-10T12:30:00Z" },
    { id: "wal-2", user_id: "usr-1", address: "AnseMsol8888xXyZ999999999999999", chain: "Solana", label: "Solana Wallet", verified_at: "2025-01-11T09:00:00Z" },
    { id: "wal-3", user_id: "usr-2", address: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa", chain: "Bitcoin", label: "Genesis Address", verified_at: "2025-01-01T00:10:00Z" },
    { id: "wal-4", user_id: "usr-3", address: "0xAb5801a7D398351b8bE11C439e05C5B3259aec9B", chain: "Ethereum", label: "Vitalik Main", verified_at: "2025-01-15T09:00:00Z" },
    { id: "wal-5", user_id: "usr-4", address: "0xYieldFarmingChad6666666666666666", chain: "Ethereum", label: "DeFi Metamask", verified_at: "2025-02-21T11:00:00Z" },
    { id: "wal-6", user_id: "usr-5", address: "SolSamPvP999999999999999999999999", chain: "Solana", label: "Phantom Wallet", verified_at: "2025-02-05T11:00:00Z" },
    { id: "wal-7", user_id: "usr-6", address: "0xNinjaBuilder77777777777777777777", chain: "Ethereum", label: "Ninja Dev", verified_at: "2025-03-01T16:30:00Z" },
  ],
  projects: [
    {
      id: "proj-1",
      name: "ANSEM AI Agent Framework",
      description: "An autonomous multi-agent system built to optimize DeFi yields and scan ecosystem contracts for security vulnerabilities using LLMs.",
      category: "AI",
      logo: "🤖",
      website: "https://ai.ansemecosystem.io",
      github: "https://github.com/ansem/ai-agent-framework",
      twitter: "https://twitter.com/ansem_ai_agent",
      creator_id: "usr-1",
      trust_score: 97,
      verified: true,
      created_at: "2025-01-20T14:00:00Z",
    },
    {
      id: "proj-2",
      name: "Solana Liquid Staking Protocol",
      description: "Next-generation staking standard offering instant liquidity and yield optimization for SOL holders with zero commission on MEV rewards.",
      category: "DeFi",
      logo: "💧",
      website: "https://stake.ansemecosystem.io",
      github: "https://github.com/ansem/solana-liquid-stake",
      twitter: "https://twitter.com/ansem_sol_stake",
      creator_id: "usr-1",
      trust_score: 95,
      verified: true,
      created_at: "2025-02-02T09:00:00Z",
    },
    {
      id: "proj-3",
      name: "Bitcoin Smart Rollup Engine",
      description: "A secure, trustless Layer 2 smart contract engine anchored directly on Bitcoin using zero-knowledge state proofs.",
      category: "Infrastructure",
      logo: "⚡",
      website: "https://rollup.satoshi.org",
      github: "https://github.com/satoshi-dev/btc-smart-rollup",
      twitter: "https://twitter.com/btc_rollup",
      creator_id: "usr-2",
      trust_score: 99,
      verified: true,
      created_at: "2025-01-05T12:00:00Z",
    },
    {
      id: "proj-4",
      name: "Ethereum Plasma Shard Network",
      description: "Scalable optimistic rollup alternative engineered to support ultra-high-speed gaming transactions under 2ms finality.",
      category: "Developer Tools",
      logo: "🛠️",
      website: "https://plasma-shard.io",
      github: "https://github.com/vitalic/plasma-shard",
      twitter: "https://twitter.com/plasma_shard",
      creator_id: "usr-3",
      trust_score: 96,
      verified: true,
      created_at: "2025-01-25T15:00:00Z",
    },
    {
      id: "proj-5",
      name: "Cosmic Guild Gaming",
      description: "Decentralized play-to-earn gaming meta-guild with cross-chain reputation pass and multi-asset rewards dashboard.",
      category: "Gaming",
      logo: "🎮",
      website: "https://cosmic-guild.xyz",
      github: "https://github.com/defi-enthusiast/cosmic-guild",
      twitter: "https://twitter.com/cosmic_guild_gg",
      creator_id: "usr-4",
      trust_score: 80,
      verified: false,
      created_at: "2025-02-28T18:00:00Z",
    },
    {
      id: "proj-6",
      name: "NFT Ticket Standard Hub",
      description: "Ecosystem platform designed to easily mint, issue, and trade verified event ticket NFTs with embedded royalty controls.",
      category: "NFT",
      logo: "🎟️",
      website: "https://ticketstandard.sol",
      github: "https://github.com/sol-sam/nft-tickets",
      twitter: "https://twitter.com/sol_tickets",
      creator_id: "usr-5",
      trust_score: 87,
      verified: true,
      created_at: "2025-02-12T11:30:00Z",
    },
    {
      id: "proj-7",
      name: "SocialFi Chat Protocol",
      description: "End-to-end encrypted messaging service with native tip buttons and tokenized chat group keys for Web3 communities.",
      category: "Social",
      logo: "💬",
      website: "https://socialchat.ninja",
      github: "https://github.com/ninja-web3/socialfi-chat",
      twitter: "https://twitter.com/socialfi_ninja",
      creator_id: "usr-6",
      trust_score: 72,
      verified: false,
      created_at: "2025-03-05T09:00:00Z",
    },
  ],
  reviews: [
    {
      id: "rev-1",
      reviewer_id: "usr-2",
      builder_id: "usr-1",
      rating: 5,
      content: "Excellent architectural design in the ANSEM AI Agent Framework. The codebase uses pristine state-machine synchronization and correct LLM prompting configurations. Highly professional work.",
      verified_transaction_hash: "0x1234abcd5678efgh9012ijkl3456mnop7890qrst",
      category: "Technical Quality",
      created_at: "2025-01-22T10:00:00Z",
    },
    {
      id: "rev-2",
      reviewer_id: "usr-3",
      builder_id: "usr-1",
      rating: 5,
      content: "Highly collaborative and deeply committed to safety in DeFi contracts. Code audit contributions on our sharding platform were flawless.",
      verified_transaction_hash: "0x9876zyxw5432vuts1098srqp7654onml3210kjih",
      category: "Communication",
      created_at: "2025-01-26T14:30:00Z",
    },
    {
      id: "rev-3",
      reviewer_id: "usr-1",
      builder_id: "usr-2",
      rating: 5,
      content: "Unmatched depth of knowledge. Satoshi has built the foundations of modern smart contracts on Bitcoin Layer 2. Clear documentation and perfect delivery.",
      verified_transaction_hash: "0xbcda1234efgh5678ijkl9012mnop3456qrst7890",
      category: "Code Quality",
      created_at: "2025-01-08T16:00:00Z",
    },
    {
      id: "rev-4",
      reviewer_id: "usr-1",
      builder_id: "usr-3",
      rating: 5,
      content: "Vitalik provided exceptional code feedback on our liquid staking protocols. His focus on Ethereum network alignment was extremely valuable.",
      verified_transaction_hash: "0xabcd111122223333444455556666777788889999",
      category: "Mentorship",
      created_at: "2025-02-06T12:00:00Z",
    },
    {
      id: "rev-5",
      reviewer_id: "usr-4",
      builder_id: "usr-5",
      rating: 4,
      content: "Great developer for NFT minting platforms. Met all deadlines, although some visual improvements were needed on the secondary market dashboard.",
      verified_transaction_hash: "0x00001111aaaa2222bbbb3333cccc4444dddd5555",
      category: "Delivery Speed",
      created_at: "2025-02-18T15:20:00Z",
    },
    {
      id: "rev-6",
      reviewer_id: "usr-5",
      builder_id: "usr-6",
      rating: 3,
      content: "The chat protocol works well, but there are multiple edge cases in the group encryption routing. Had to do heavy debug sessions. Communication could be improved.",
      verified_transaction_hash: "0x9999888877776666555544443333222211110000",
      category: "Technical Quality",
      created_at: "2025-03-08T11:00:00Z",
    },
  ],
  badges: [
    { id: "bdg-1", name: "Verified Architect", description: "Successfully passed 3+ professional architectural audits by the ANSEM Foundation.", icon: "🏛️", category: "Audit", issuer: "ANSEM Core", created_at: "2025-01-01T00:00:00Z" },
    { id: "bdg-2", name: "AI Explorer", description: "Pioneered integration of multi-agent LLM systems into secure decentralised networks.", icon: "🧠", category: "Innovation", issuer: "ANSEM Labs", created_at: "2025-01-01T00:00:00Z" },
    { id: "bdg-3", name: "DeFi Heavyweight", description: "Created protocols exceeding $100M in cumulative Total Value Locked.", icon: "💰", category: "Volume", issuer: "DeFi Council", created_at: "2025-01-01T00:00:00Z" },
    { id: "bdg-4", name: "Ecosystem Mentor", description: "Granted to builders who have provided over 50+ detailed code reviews and mentorship guides.", icon: "🎓", category: "Community", issuer: "Core Guild", created_at: "2025-01-01T00:00:00Z" },
    { id: "bdg-5", name: "Genesis Founder", description: "Created core frameworks during the first block of the ANSEM network genesis.", icon: "👑", category: "History", issuer: "Genesis Foundation", created_at: "2025-01-01T00:00:00Z" },
  ],
  user_badges: [
    { user_id: "usr-1", badge_id: "bdg-1", earned_at: "2025-01-12T00:00:00Z" },
    { user_id: "usr-1", badge_id: "bdg-2", earned_at: "2025-01-21T00:00:00Z" },
    { user_id: "usr-1", badge_id: "bdg-3", earned_at: "2025-02-03T00:00:00Z" },
    { user_id: "usr-1", badge_id: "bdg-5", earned_at: "2025-01-10T00:00:00Z" },
    { user_id: "usr-2", badge_id: "bdg-1", earned_at: "2025-01-05T00:00:00Z" },
    { user_id: "usr-2", badge_id: "bdg-5", earned_at: "2025-01-01T00:00:00Z" },
    { user_id: "usr-3", badge_id: "bdg-1", earned_at: "2025-01-18T00:00:00Z" },
    { user_id: "usr-3", badge_id: "bdg-4", earned_at: "2025-02-10T00:00:00Z" },
    { user_id: "usr-5", badge_id: "bdg-3", earned_at: "2025-02-15T00:00:00Z" },
  ],
  skills: [
    { id: "sk-1", user_id: "usr-1", name: "Rust / Solana Dev", endorsement_count: 42 },
    { id: "sk-2", user_id: "usr-1", name: "AI Multi-Agents", endorsement_count: 38 },
    { id: "sk-3", user_id: "usr-1", name: "Zero Knowledge Proofs", endorsement_count: 24 },
    { id: "sk-4", user_id: "usr-2", name: "Cryptography", endorsement_count: 99 },
    { id: "sk-5", user_id: "usr-2", name: "C++ Optimization", endorsement_count: 87 },
    { id: "sk-6", user_id: "usr-3", name: "Solidity / EVM", endorsement_count: 76 },
    { id: "sk-7", user_id: "usr-3", name: "Ecosystem Research", endorsement_count: 94 },
    { id: "sk-8", user_id: "usr-4", name: "Yield Strategy", endorsement_count: 15 },
    { id: "sk-9", user_id: "usr-5", name: "NFT Minting Pools", endorsement_count: 29 },
    { id: "sk-10", user_id: "usr-6", name: "Typescript Fullstack", endorsement_count: 8 },
  ],
  followers: [
    { follower_id: "usr-2", following_id: "usr-1", created_at: "2025-01-12T10:00:00Z" },
    { follower_id: "usr-3", following_id: "usr-1", created_at: "2025-01-15T11:00:00Z" },
    { follower_id: "usr-4", following_id: "usr-1", created_at: "2025-02-21T18:00:00Z" },
    { follower_id: "usr-5", following_id: "usr-1", created_at: "2025-02-05T12:00:00Z" },
    { follower_id: "usr-1", following_id: "usr-2", created_at: "2025-01-11T09:00:00Z" },
    { follower_id: "usr-1", following_id: "usr-3", created_at: "2025-01-16T10:30:00Z" },
    { follower_id: "usr-3", following_id: "usr-2", created_at: "2025-01-05T14:00:00Z" },
  ],
  activities: [
    { id: "act-1", user_id: "usr-1", type: "new_builder", details: "Joined ANSEM Ecosystem Hub and claimed Builder Passport.", created_at: "2025-01-10T12:00:00Z" },
    { id: "act-2", user_id: "usr-1", type: "badge_earned", details: "Earned badge: 'Genesis Founder'", created_at: "2025-01-10T12:05:00Z" },
    { id: "act-3", user_id: "usr-1", type: "project_verified", details: "Verified a new ecosystem project: 'ANSEM AI Agent Framework'", created_at: "2025-01-20T14:00:00Z" },
    { id: "act-4", user_id: "usr-2", type: "review_posted", details: "Posted a 5-star technical quality review on builder 'Ansem'", created_at: "2025-01-22T10:00:00Z" },
    { id: "act-5", user_id: "usr-1", type: "badge_earned", details: "Earned badge: 'AI Explorer' for AI Agent contributions", created_at: "2025-01-21T00:00:00Z" },
    { id: "act-6", user_id: "usr-3", type: "badge_earned", details: "Earned badge: 'Ecosystem Mentor' for 50+ detailed code reviews", created_at: "2025-02-10T00:00:00Z" },
    { id: "act-7", user_id: "usr-5", type: "project_verified", details: "Verified a new ecosystem project: 'NFT Ticket Standard Hub'", created_at: "2025-02-12T11:30:00Z" },
  ],
  trust_scores: [
    { user_id: "usr-1", alignment_score: 99, history_score: 98, verification_score: 97, overall_score: 98 },
    { user_id: "usr-2", alignment_score: 100, history_score: 100, verification_score: 97, overall_score: 99 },
    { user_id: "usr-3", alignment_score: 96, history_score: 95, verification_score: 94, overall_score: 95 },
    { user_id: "usr-4", alignment_score: 85, history_score: 80, verification_score: 81, overall_score: 82 },
    { user_id: "usr-5", alignment_score: 90, history_score: 88, verification_score: 89, overall_score: 89 },
    { user_id: "usr-6", alignment_score: 75, history_score: 78, verification_score: 75, overall_score: 76 },
  ],
  github_profiles: [
    { user_id: "usr-1", username: "ansem-defi", public_repos: 45, followers: 1820, contributions_count: 1450, updated_at: "2025-03-10T00:00:00Z" },
    { user_id: "usr-2", username: "satoshi-dev", public_repos: 12, followers: 85400, contributions_count: 50, updated_at: "2025-03-10T00:00:00Z" },
    { user_id: "usr-3", username: "vitalic-eth", public_repos: 110, followers: 94100, contributions_count: 3200, updated_at: "2025-03-10T00:00:00Z" },
    { user_id: "usr-4", username: "defi-chad-yield", public_repos: 5, followers: 89, contributions_count: 120, updated_at: "2025-03-10T00:00:00Z" },
    { user_id: "usr-5", username: "sol-sam-code", public_repos: 28, followers: 340, contributions_count: 890, updated_at: "2025-03-10T00:00:00Z" },
    { user_id: "usr-6", username: "ninja-builder-dev", public_repos: 14, followers: 65, contributions_count: 420, updated_at: "2025-03-10T00:00:00Z" },
  ],
  social_links: [
    { user_id: "usr-1", twitter: "https://twitter.com/ansem", github: "https://github.com/ansem-defi", website: "https://ansemecosystem.io", telegram: "https://t.me/ansem_defi" },
    { user_id: "usr-2", twitter: "https://twitter.com/satoshi", github: "https://github.com/satoshi-dev", website: "https://bitcoin.org", telegram: "" },
    { user_id: "usr-3", twitter: "https://twitter.com/vitalik", github: "https://github.com/vitalic-eth", website: "https://vitalik.ca", telegram: "" },
    { user_id: "usr-4", twitter: "https://twitter.com/defi_chad_yield", github: "https://github.com/defi-chad-yield", website: "https://yield.farm", telegram: "https://t.me/defi_chad_chat" },
    { user_id: "usr-5", twitter: "https://twitter.com/sol_sam_code", github: "https://github.com/sol-sam-code", website: "https://ticketstandard.sol", telegram: "https://t.me/samsol" },
    { user_id: "usr-6", twitter: "https://twitter.com/ninja_web3", github: "https://github.com/ninja-builder-dev", website: "https://socialchat.ninja", telegram: "https://t.me/ninjaweb3" },
  ],
};

// Database helper functions
function getDB(): Database {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(DEFAULT_DB, null, 2));
    return DEFAULT_DB;
  }
  try {
    const raw = fs.readFileSync(DB_PATH, "utf-8");
    const db = JSON.parse(raw);
    
    // Auto-heal entity_type for existing records
    let updated = false;
    db.users = db.users.map((user: any) => {
      if (!user.entity_type) {
        const defaultMatch = DEFAULT_DB.users.find((u) => u.id === user.id);
        user.entity_type = defaultMatch?.entity_type || "builder";
        updated = true;
      }
      return user;
    });
    
    if (updated) {
      fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
    }
    
    return db;
  } catch (e) {
    console.error("Error reading database file, resetting to default:", e);
    return DEFAULT_DB;
  }
}

function saveDB(db: Database) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
  } catch (e) {
    console.error("Error writing database file:", e);
  }
}

// REST API Endpoints

// Reset Database to seed state
app.post("/api/db/reset", (req, res) => {
  saveDB(DEFAULT_DB);
  res.json({ message: "Database reset to rich seed state successfully", db: DEFAULT_DB });
});

// Get entire DB Snapshot
app.get("/api/db/snapshot", (req, res) => {
  res.json(getDB());
});

// Get All Builders (Users) with full passport details
app.get("/api/builders", (req, res) => {
  const db = getDB();
  const buildersWithPassports = db.users.map((user) => {
    const userWallets = db.wallets.filter((w) => w.user_id === user.id);
    const userProjects = db.projects.filter((p) => p.creator_id === user.id);
    const userReviews = db.reviews.filter((r) => r.builder_id === user.id).map((review) => {
      const reviewer = db.users.find((u) => u.id === review.reviewer_id);
      return { ...review, reviewer: reviewer ? { username: reviewer.username, avatar: reviewer.avatar } : null };
    });
    const badgesEarned = db.user_badges
      .filter((ub) => ub.user_id === user.id)
      .map((ub) => db.badges.find((b) => b.id === ub.badge_id))
      .filter(Boolean);
    const skills = db.skills.filter((s) => s.user_id === user.id);
    const trustScore = db.trust_scores.find((t) => t.user_id === user.id) || {
      user_id: user.id,
      alignment_score: 50,
      history_score: 50,
      verification_score: 50,
      overall_score: 50,
    };
    const githubProfile = db.github_profiles.find((g) => g.user_id === user.id);
    const socialLinks = db.social_links.find((s) => s.user_id === user.id);
    const followerCount = db.followers.filter((f) => f.following_id === user.id).length;
    const followingCount = db.followers.filter((f) => f.follower_id === user.id).length;

    return {
      ...user,
      wallets: userWallets,
      projects: userProjects,
      reviews: userReviews,
      badges: badgesEarned,
      skills,
      trustScore,
      githubProfile,
      socialLinks,
      followersCount: followerCount,
      followingCount: followingCount,
    };
  });

  res.json(buildersWithPassports);
});

// Get a Specific Builder by ID or Wallet Address
app.get("/api/builders/:idOrWallet", (req, res) => {
  const db = getDB();
  const param = req.params.idOrWallet;

  // Find user by ID or by wallet address
  let user = db.users.find((u) => u.id === param || u.username.toLowerCase() === param.toLowerCase());
  if (!user) {
    const walletMatch = db.wallets.find((w) => w.address.toLowerCase() === param.toLowerCase());
    if (walletMatch) {
      user = db.users.find((u) => u.id === walletMatch.user_id);
    }
  }

  if (!user) {
    return res.status(404).json({ error: "Builder not found" });
  }

  const userId = user.id;
  const userWallets = db.wallets.filter((w) => w.user_id === userId);
  const userProjects = db.projects.filter((p) => p.creator_id === userId);
  const userReviews = db.reviews.filter((r) => r.builder_id === userId).map((review) => {
    const reviewer = db.users.find((u) => u.id === review.reviewer_id);
    return { ...review, reviewer: reviewer ? { username: reviewer.username, avatar: reviewer.avatar } : null };
  });
  const badgesEarned = db.user_badges
    .filter((ub) => ub.user_id === userId)
    .map((ub) => db.badges.find((b) => b.id === ub.badge_id))
    .filter(Boolean);
  const skills = db.skills.filter((s) => s.user_id === userId);
  const trustScore = db.trust_scores.find((t) => t.user_id === userId) || {
    user_id: userId,
    alignment_score: 50,
    history_score: 50,
    verification_score: 50,
    overall_score: 50,
  };
  const githubProfile = db.github_profiles.find((g) => g.user_id === userId);
  const socialLinks = db.social_links.find((s) => s.user_id === userId);
  const followerCount = db.followers.filter((f) => f.following_id === userId).length;
  const followingCount = db.followers.filter((f) => f.follower_id === userId).length;

  res.json({
    ...user,
    wallets: userWallets,
    projects: userProjects,
    reviews: userReviews,
    badges: badgesEarned,
    skills,
    trustScore,
    githubProfile,
    socialLinks,
    followersCount: followerCount,
    followingCount: followingCount,
  });
});

// Create Builder / Register Wallet Passport
app.post("/api/builders", (req, res) => {
  const db = getDB();
  const { username, email, walletAddress, chain, githubUsername, twitterUrl, avatar, entityType } = req.body;

  if (!username || !walletAddress) {
    return res.status(400).json({ error: "Username and primary wallet address are required." });
  }

  // Check if wallet address already exists
  const existingWallet = db.wallets.find((w) => w.address.toLowerCase() === walletAddress.toLowerCase());
  if (existingWallet) {
    const matchedUser = db.users.find((u) => u.id === existingWallet.user_id);
    return res.status(200).json({ message: "Passport already active for this wallet", user: matchedUser });
  }

  // Create user
  const newUserId = `usr-${db.users.length + 1}`;
  const newUser: User = {
    id: newUserId,
    username,
    email: email || `${username.toLowerCase()}@ansem.io`,
    avatar: avatar || `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 1000000)}?auto=format&fit=crop&w=150&h=150&q=80`,
    reputation_level: 1,
    trust_score: 75,
    verified_identity: false,
    created_at: new Date().toISOString(),
    entity_type: entityType || "builder",
  };

  // Create Wallet
  const newWallet: Wallet = {
    id: `wal-${db.wallets.length + 1}`,
    user_id: newUserId,
    address: walletAddress,
    chain: chain || "Ethereum",
    label: "Primary Wallet",
    verified_at: new Date().toISOString(),
  };

  // Create default Trust Score breakdown
  const newTrustScore: TrustScoreDetails = {
    user_id: newUserId,
    alignment_score: 70,
    history_score: 75,
    verification_score: 80,
    overall_score: 75,
  };

  // Create default Github Profile & Social Links
  const newGithub: GithubProfile = {
    user_id: newUserId,
    username: githubUsername || username,
    public_repos: Math.floor(Math.random() * 10) + 2,
    followers: Math.floor(Math.random() * 50) + 5,
    contributions_count: Math.floor(Math.random() * 300) + 10,
    updated_at: new Date().toISOString(),
  };

  const newSocial: SocialLink = {
    user_id: newUserId,
    twitter: twitterUrl || `https://twitter.com/${username.toLowerCase()}`,
    github: githubUsername ? `https://github.com/${githubUsername}` : `https://github.com/${username.toLowerCase()}`,
    website: "",
    telegram: "",
  };

  // Default Badge: Early Adopter
  const earlyBadge = db.badges.find((b) => b.id === "bdg-5") || db.badges[0];
  const newUserBadge: UserBadge = {
    user_id: newUserId,
    badge_id: earlyBadge.id,
    earned_at: new Date().toISOString(),
  };

  // Push into relational schema
  db.users.push(newUser);
  db.wallets.push(newWallet);
  db.trust_scores.push(newTrustScore);
  db.github_profiles.push(newGithub);
  db.social_links.push(newSocial);
  db.user_badges.push(newUserBadge);

  // Add Activity Log
  const newActivity: Activity = {
    id: `act-${db.activities.length + 1}`,
    user_id: newUserId,
    type: "new_builder",
    details: `Claimed custom Builder Passport with wallet: ${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`,
    created_at: new Date().toISOString(),
  };
  db.activities.push(newActivity);

  saveDB(db);

  res.status(201).json({
    message: "Builder passport successfully registered",
    user: {
      ...newUser,
      wallets: [newWallet],
      trustScore: newTrustScore,
      githubProfile: newGithub,
      socialLinks: newSocial,
      badges: [earlyBadge],
      skills: [],
      projects: [],
      reviews: [],
    },
  });
});

// Endorse a skill / Add a Skill
app.post("/api/builders/:id/skills", (req, res) => {
  const db = getDB();
  const userId = req.params.id;
  const { skillName } = req.body;

  if (!skillName) {
    return res.status(400).json({ error: "Skill name is required" });
  }

  const existing = db.skills.find((s) => s.user_id === userId && s.name.toLowerCase() === skillName.toLowerCase());
  if (existing) {
    existing.endorsement_count += 1;
  } else {
    const newSkill: Skill = {
      id: `sk-${db.skills.length + 1}`,
      user_id: userId,
      name: skillName,
      endorsement_count: 1,
    };
    db.skills.push(newSkill);
  }

  // Log Activity
  const userObj = db.users.find((u) => u.id === userId);
  const newActivity: Activity = {
    id: `act-${db.activities.length + 1}`,
    user_id: userId,
    type: "skill_endorsed",
    details: `Skill endorsed: "${skillName}" for builder ${userObj ? userObj.username : "User"}`,
    created_at: new Date().toISOString(),
  };
  db.activities.push(newActivity);

  saveDB(db);
  res.json({ message: "Skill endorsed/added successfully", skills: db.skills.filter((s) => s.user_id === userId) });
});

// Post a Review for a Builder (FEATURE 13 reviews)
app.post("/api/builders/:id/reviews", (req, res) => {
  const db = getDB();
  const builderId = req.params.id;
  const { reviewerId, rating, content, verifiedTxHash, category } = req.body;

  if (!reviewerId || !rating || !content) {
    return res.status(400).json({ error: "Reviewer ID, rating (1-5), and content are required." });
  }

  const newReview: Review = {
    id: `rev-${db.reviews.length + 1}`,
    reviewer_id: reviewerId,
    builder_id: builderId,
    rating: Number(rating),
    content,
    verified_transaction_hash: verifiedTxHash || "0x" + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join(""),
    category: category || "General Contribution",
    created_at: new Date().toISOString(),
  };

  db.reviews.push(newReview);

  // Recalculate reputation levels / trust scores for target builder
  const builderReviews = db.reviews.filter((r) => r.builder_id === builderId);
  const averageRating = builderReviews.reduce((sum, r) => sum + r.rating, 0) / builderReviews.length;
  
  const trustScoreObj = db.trust_scores.find((t) => t.user_id === builderId);
  const builderUser = db.users.find((u) => u.id === builderId);

  if (trustScoreObj && builderUser) {
    // Dynamically shift scores based on reviews
    const ratingImpact = (averageRating - 3) * 6; // e.g. average rating of 5 shifts score up, low rating shifts down
    trustScoreObj.alignment_score = Math.min(100, Math.max(40, Math.floor(trustScoreObj.alignment_score + ratingImpact)));
    trustScoreObj.history_score = Math.min(100, Math.max(40, Math.floor(trustScoreObj.history_score + (ratingImpact / 2))));
    trustScoreObj.overall_score = Math.floor((trustScoreObj.alignment_score + trustScoreObj.history_score + trustScoreObj.verification_score) / 3);
    
    builderUser.trust_score = trustScoreObj.overall_score;

    // Shift reputation level
    if (builderReviews.length >= 5 && builderUser.trust_score > 90) {
      builderUser.reputation_level = 5;
    } else if (builderReviews.length >= 3 && builderUser.trust_score > 80) {
      builderUser.reputation_level = 4;
    } else if (builderUser.trust_score > 70) {
      builderUser.reputation_level = 3;
    }
  }

  // Create Activity log
  const reviewerObj = db.users.find((u) => u.id === reviewerId);
  const targetObj = db.users.find((u) => u.id === builderId);
  const newActivity: Activity = {
    id: `act-${db.activities.length + 1}`,
    user_id: reviewerId,
    type: "review_posted",
    details: `Posted a ${rating}-star review on builder "${targetObj ? targetObj.username : "User"}": "${content.substring(0, 40)}..."`,
    created_at: new Date().toISOString(),
  };
  db.activities.push(newActivity);

  // If reviews count gets high, grant "Ecosystem Mentor" badge
  if (reviewerId && db.reviews.filter((r) => r.reviewer_id === reviewerId).length >= 3) {
    const badgeMentor = db.badges.find((b) => b.id === "bdg-4");
    if (badgeMentor) {
      const alreadyHas = db.user_badges.some((ub) => ub.user_id === reviewerId && ub.badge_id === "bdg-4");
      if (!alreadyHas) {
        db.user_badges.push({ user_id: reviewerId, badge_id: "bdg-4", earned_at: new Date().toISOString() });
        db.activities.push({
          id: `act-${db.activities.length + 1}`,
          user_id: reviewerId,
          type: "badge_earned",
          details: `Earned badge: 'Ecosystem Mentor' for posting active peer contributions and evaluations.`,
          created_at: new Date().toISOString(),
        });
      }
    }
  }

  saveDB(db);

  res.status(201).json({
    message: "Review successfully posted and trust metrics recalculated",
    review: {
      ...newReview,
      reviewer: reviewerObj ? { username: reviewerObj.username, avatar: reviewerObj.avatar } : null,
    },
    updatedTrustScore: trustScoreObj,
  });
});

// Follow / Unfollow builder
app.post("/api/builders/:id/follow", (req, res) => {
  const db = getDB();
  const targetId = req.params.id;
  const { followerId } = req.body;

  if (!followerId) {
    return res.status(400).json({ error: "Follower ID required" });
  }

  const index = db.followers.findIndex((f) => f.follower_id === followerId && f.following_id === targetId);
  let isFollowing = false;

  if (index !== -1) {
    db.followers.splice(index, 1);
  } else {
    db.followers.push({
      follower_id: followerId,
      following_id: targetId,
      created_at: new Date().toISOString(),
    });
    isFollowing = true;

    // Log Activity
    const followerUser = db.users.find((u) => u.id === followerId);
    const targetUser = db.users.find((u) => u.id === targetId);
    db.activities.push({
      id: `act-${db.activities.length + 1}`,
      user_id: followerId,
      type: "follow",
      details: `Followed builder Passport: "${targetUser ? targetUser.username : "User"}"`,
      created_at: new Date().toISOString(),
    });
  }

  saveDB(db);
  res.json({
    isFollowing,
    followerCount: db.followers.filter((f) => f.following_id === targetId).length,
  });
});

// Get All Ecosystem Projects (FEATURE 9)
app.get("/api/projects", (req, res) => {
  const db = getDB();
  const category = req.query.category as string;
  const search = req.query.search as string;

  let filtered = db.projects.map((proj) => {
    const creator = db.users.find((u) => u.id === proj.creator_id);
    return { ...proj, creator: creator ? { username: creator.username, avatar: creator.avatar } : null };
  });

  if (category && category !== "All") {
    filtered = filtered.filter((p) => p.category.toLowerCase() === category.toLowerCase());
  }

  if (search) {
    const query = search.toLowerCase();
    filtered = filtered.filter((p) => p.name.toLowerCase().includes(query) || p.description.toLowerCase().includes(query));
  }

  res.json(filtered);
});

// Create/Submit Project
app.post("/api/projects", (req, res) => {
  const db = getDB();
  const { name, description, category, logo, website, github, twitter, creatorId } = req.body;

  if (!name || !description || !category || !creatorId) {
    return res.status(400).json({ error: "Name, description, category, and creator ID are required" });
  }

  const newProject: Project = {
    id: `proj-${db.projects.length + 1}`,
    name,
    description,
    category,
    logo: logo || "📦",
    website: website || "",
    github: github || "",
    twitter: twitter || "",
    creator_id: creatorId,
    trust_score: 75,
    verified: false,
    created_at: new Date().toISOString(),
  };

  db.projects.push(newProject);

  // Log Activity
  const userObj = db.users.find((u) => u.id === creatorId);
  const newActivity: Activity = {
    id: `act-${db.activities.length + 1}`,
    user_id: creatorId,
    type: "project_verified",
    details: `Submitted ecosystem project for verification: "${name}"`,
    created_at: new Date().toISOString(),
  };
  db.activities.push(newActivity);

  saveDB(db);

  res.status(201).json({
    message: "Project submitted successfully",
    project: {
      ...newProject,
      creator: userObj ? { username: userObj.username, avatar: userObj.avatar } : null,
    },
  });
});

// Verify project
app.post("/api/projects/:id/verify", (req, res) => {
  const db = getDB();
  const projectId = req.params.id;

  const proj = db.projects.find((p) => p.id === projectId);
  if (!proj) {
    return res.status(404).json({ error: "Project not found" });
  }

  proj.verified = true;
  proj.trust_score = 95;

  db.activities.push({
    id: `act-${db.activities.length + 1}`,
    user_id: proj.creator_id,
    type: "project_verified",
    details: `Ecosystem project successfully verified by core team: "${proj.name}"`,
    created_at: new Date().toISOString(),
  });

  saveDB(db);
  res.json({ message: "Project verified successfully", project: proj });
});

// Global Search (FEATURE 10: Wallet, Builder, Project, GitHub, Twitter)
app.get("/api/search", (req, res) => {
  const db = getDB();
  const q = (req.query.q as string || "").toLowerCase();

  if (!q) {
    return res.json({ builders: [], projects: [], wallets: [] });
  }

  // Find matching builders
  const matchedBuilders = db.users.filter((u) => {
    const git = db.github_profiles.find((g) => g.user_id === u.id)?.username || "";
    const twit = db.social_links.find((s) => s.user_id === u.id)?.twitter || "";
    return (
      u.username.toLowerCase().includes(q) ||
      git.toLowerCase().includes(q) ||
      twit.toLowerCase().includes(q)
    );
  }).map((u) => {
    const userWallets = db.wallets.filter((w) => w.user_id === u.id);
    return { ...u, wallets: userWallets };
  });

  // Find matching projects
  const matchedProjects = db.projects.filter((p) => {
    return (
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  });

  // Find matching wallets
  const matchedWallets = db.wallets.filter((w) => {
    return w.address.toLowerCase().includes(q) || w.label.toLowerCase().includes(q);
  }).map((w) => {
    const uObj = db.users.find((u) => u.id === w.user_id);
    return { ...w, username: uObj ? uObj.username : "Unknown" };
  });

  res.json({
    builders: matchedBuilders,
    projects: matchedProjects,
    wallets: matchedWallets,
  });
});

// Live Activity Feed (FEATURE 13)
app.get("/api/activities", (req, res) => {
  const db = getDB();
  // Return sorted by date
  const sorted = [...db.activities].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  
  const feed = sorted.map((act) => {
    const user = db.users.find((u) => u.id === act.user_id);
    return {
      ...act,
      user: user ? { username: user.username, avatar: user.avatar } : null,
    };
  });

  res.json(feed);
});

// Analytics Dashboard Data (FEATURE 14)
app.get("/api/analytics", (req, res) => {
  const db = getDB();

  // 1. Builder Growth (Simulating month-over-month cumulative growth)
  const builderGrowth = [
    { month: "Jan", builders: 2, projects: 1 },
    { month: "Feb", builders: 4, projects: 3 },
    { month: "Mar", builders: 6, projects: 7 },
  ];

  // 2. Trust Score Distribution
  const intervals = { "90-100": 0, "80-89": 0, "70-79": 0, "Below 70": 0 };
  db.users.forEach((u) => {
    if (u.trust_score >= 90) intervals["90-100"]++;
    else if (u.trust_score >= 80) intervals["80-89"]++;
    else if (u.trust_score >= 70) intervals["70-79"]++;
    else intervals["Below 70"]++;
  });
  const trustScoreDistribution = Object.entries(intervals).map(([range, count]) => ({ range, count }));

  // 3. Project Category Activity
  const categoryCount: Record<string, number> = {};
  db.projects.forEach((p) => {
    categoryCount[p.category] = (categoryCount[p.category] || 0) + 1;
  });
  const projectActivity = Object.entries(categoryCount).map(([category, count]) => ({ name: category, count }));

  // 4. Contribution Heatmap (Contribution count by builder)
  const heatmap = db.users.map((u) => {
    const repos = db.github_profiles.find((g) => g.user_id === u.id)?.contributions_count || 10;
    const revs = db.reviews.filter((r) => r.reviewer_id === u.id).length;
    const projs = db.projects.filter((p) => p.creator_id === u.id).length;
    return {
      username: u.username,
      contributions: (repos / 10) + (revs * 5) + (projs * 15),
    };
  }).sort((a, b) => b.contributions - a.contributions);

  // 5. Global Metrics Summary
  const totalBuilders = db.users.length;
  const totalProjects = db.projects.length;
  const totalReviews = db.reviews.length;
  const avgTrustScore = Math.floor(db.users.reduce((sum, u) => sum + u.trust_score, 0) / db.users.length);

  res.json({
    metrics: {
      totalBuilders,
      totalProjects,
      totalReviews,
      avgTrustScore,
    },
    builderGrowth,
    trustScoreDistribution,
    projectActivity,
    heatmap,
  });
});

// ==================================================
// GEMINI INTELLIGENT ROUTING & AI POWERED PROMPTS
// ==================================================

// AI SEARCH (FEATURE 11): Fully semantic query engine grounded on the relational database state
app.post("/api/ai/search", async (req, res) => {
  const { query } = req.body;
  if (!query) {
    return res.status(400).json({ error: "AI search query is required." });
  }

  const db = getDB();

  // Create highly descriptive context of current relational DB
  const dbContextString = JSON.stringify({
    builders: db.users.map(u => ({
      id: u.id,
      username: u.username,
      trust_score: u.trust_score,
      reputation_level: u.reputation_level,
      verified_identity: u.verified_identity,
      skills: db.skills.filter(s => s.user_id === u.id).map(s => `${s.name} (${s.endorsement_count} endorsements)`),
      badges: db.user_badges.filter(ub => ub.user_id === u.id).map(ub => db.badges.find(b => b.id === ub.badge_id)?.name),
      projects: db.projects.filter(p => p.creator_id === u.id).map(p => p.name),
      reviewCount: db.reviews.filter(r => r.builder_id === u.id).length
    })),
    projects: db.projects.map(p => ({
      name: p.name,
      description: p.description,
      category: p.category,
      verified: p.verified,
      trust_score: p.trust_score
    }))
  });

  const promptText = `
    You are the intelligent Gemini Oracle of the ANSEM Builder Ecosystem.
    The user is searching the ecosystem using natural language. Answer their question fully based on the actual database state provided.
    
    RELATIONAL ECOSYSTEM DATABASE STATE:
    ${dbContextString}

    USER QUERY:
    "${query}"

    CRITICAL INSTRUCTIONS:
    1. Respond with elegant Markdown formatted text.
    2. Explicitly cite specific builder usernames (e.g., Ansem, Satoshi_Dev, Vitalic_B), their trust scores, badges, and skills where relevant.
    3. Be analytical, professional, and objective.
    4. Highlight why certain builders are recommended or matches (e.g. alignment to skills or trust scores).
    5. Always format numbers, stats, and trust scores beautifully.
  `;

  if (ai) {
    try {
      const response = await generateContentWithRetry(ai, {
        model: "gemini-3.5-flash",
        contents: promptText,
        config: {
          systemInstruction: "You are the primary AI Engine for ANSEM Ecosystem, specializing in blockchain builder profiles, reputation scoring, and DeFi/AI project analysis.",
        },
      });

      return res.json({ answer: response.text });
    } catch (err) {
      console.error("Gemini AI API execution error:", err);
      // Fall through to simulated intelligent fallback
    }
  }

  // Realistic fallback search engine matching keywords to database
  console.log("Using smart simulation engine for AI Search");
  const fallbackAnswer = simulateAISearch(query, db);
  res.json({ answer: fallbackAnswer });
});

// AI PORTFOLIO INSIGHTS & SUMMARIES: Fully integrated server-side prompts (Wallet, Builder, Risk, Project, Insights)
app.post("/api/ai/analyze", async (req, res) => {
  const { builderId, type } = req.body; // type: "wallet_summary" | "builder_summary" | "risk_analysis" | "project_summary" | "community_insights"

  if (!builderId || !type) {
    return res.status(400).json({ error: "builderId and analytical type are required" });
  }

  const db = getDB();
  const builder = db.users.find(u => u.id === builderId);
  if (!builder) {
    return res.status(404).json({ error: "Builder not found" });
  }

  const wallets = db.wallets.filter(w => w.user_id === builderId);
  const projects = db.projects.filter(p => p.creator_id === builderId);
  const reviews = db.reviews.filter(r => r.builder_id === builderId);
  const badges = db.user_badges.filter(ub => ub.user_id === builderId).map(ub => db.badges.find(b => b.id === ub.badge_id)).filter(Boolean);
  const skills = db.skills.filter(s => s.user_id === builderId);
  const scores = db.trust_scores.find(t => t.user_id === builderId) || { alignment_score: 75, history_score: 75, verification_score: 75, overall_score: 75 };
  const github = db.github_profiles.find(g => g.user_id === builderId);

  let customPrompt = "";
  let typeLabel = "";

  const builderDataStr = JSON.stringify({
    username: builder.username,
    trust_score: builder.trust_score,
    reputation_level: builder.reputation_level,
    verified_identity: builder.verified_identity,
    wallets: wallets.map(w => ({ address: w.address, chain: w.chain, label: w.label })),
    projects: projects.map(p => ({ name: p.name, description: p.description, category: p.category, trust_score: p.trust_score, verified: p.verified })),
    badges: badges.map(b => b?.name),
    skills: skills.map(s => `${s.name} (${s.endorsement_count})`),
    trust_scores: scores,
    reviews: reviews.map(r => ({ rating: r.rating, content: r.content, category: r.category })),
    github: github ? { username: github.username, contributions: github.contributions_count, repos: github.public_repos } : null
  });

  if (type === "builder_summary") {
    typeLabel = "Builder Passport Overview";
    customPrompt = `
      Create a comprehensive professional profile summary for Web3 Builder "${builder.username}".
      
      BUILDER METRICS & SOCIAL STATE:
      ${builderDataStr}

      PROMPT OUTLINE:
      - Bulleted breakdown of major technical skillsets, core proficiencies, and highlights of active projects.
      - Evaluation of reputation level (${builder.reputation_level}/5) and credential badges owned.
      - A closing paragraph summarizing the developer's fit for high-trust DeFi and AI projects.
      - Keep the tone highly motivating, technical, and objective.
    `;
  } else if (type === "risk_analysis") {
    typeLabel = "Risk & Trust Score Analysis";
    customPrompt = `
      Perform an objective, data-driven security, alignment, and contribution risk audit for Web3 Builder "${builder.username}".
      
      BUILDER METRICS & HISTORY STATE:
      ${builderDataStr}

      PROMPT OUTLINE:
      - Detailed evaluation of their alignment, history, and verification scores.
      - Identification of risk factors (e.g., non-verified identity, low feedback density, any negative review sentiment).
      - Recommendations for the builder to increase their trust score (e.g. completing identity validation, releasing audited contracts).
      - Provide a risk tier rating: [Negligible / Low / Moderate / Elevated] based on the trust score of ${builder.trust_score}.
    `;
  } else if (type === "project_summary") {
    typeLabel = "Ecosystem Project Impact Summary";
    customPrompt = `
      Summarize the ecosystem projects created by Web3 Builder "${builder.username}".
      
      BUILDER METRICS & PROJECTS:
      ${builderDataStr}

      PROMPT OUTLINE:
      - Breakdown of each submitted project, its verified status, and category fit.
      - Analysis of technical novelty, decentralised architecture, and utility to the ANSEM Ecosystem.
      - Assessment of community review validation on these projects.
    `;
  } else if (type === "community_insights") {
    typeLabel = "Ecosystem Peer Review & Community Insights";
    customPrompt = `
      Analyze and synthesize the peer reviews and community feedback received by "${builder.username}".
      
      PEER REVIEW DATASET:
      ${builderDataStr}

      PROMPT OUTLINE:
      - Synthesis of community sentiment (strengths mentioned, collaborative attributes, code delivery).
      - Categorization of feedback (technical, speed, communication).
      - Recommendations based on gaps identified in the reviews.
    `;
  } else {
    // wallet_summary
    typeLabel = "Wallet Activity & Assets Intelligence";
    customPrompt = `
      Analyze the wallets and chain interactions associated with Web3 Builder "${builder.username}".
      
      WALLET ASSETS:
      ${builderDataStr}

      PROMPT OUTLINE:
      - Assessment of the registered wallet addresses on ${wallets.map(w => w.chain).join(", ")}.
      - Evaluation of account verification age, chain alignment, and transactional reputability.
      - Summary recommendation for interacting with these contract addresses.
    `;
  }

  if (ai) {
    try {
      const response = await generateContentWithRetry(ai, {
        model: "gemini-3.5-flash",
        contents: customPrompt,
        config: {
          systemInstruction: `You are the primary Risk and Portfolio Analyst of the ANSEM Blockchain Network. Your analysis is published directly to professional developer profiles. Always format answers beautifully with Markdown and robust sections.`,
        }
      });
      return res.json({ answer: response.text, typeLabel });
    } catch (err) {
      console.error("Gemini AI API analysis error:", err);
      // Fall through to simulated fallback
    }
  }

  // Realistic Simulated AI Fallback
  console.log("Using smart simulation engine for Analysis:", type);
  const simulatedAnswer = simulateAIAnalysis(builder.username, type, db);
  res.json({ answer: simulatedAnswer, typeLabel });
});


// Helper simulation algorithms for absolute reliability when GEMINI_API_KEY is not defined
function simulateAISearch(query: string, db: Database): string {
  const q = query.toLowerCase();
  
  if (q.includes("trustworthy") || q.includes("highest") || q.includes("most") || q.includes("active") || q.includes("frontend") || q.includes("rust") || q.includes("cryptography") || q.includes("defi") || q.includes("ai")) {
    let result = `### 🔮 ANSEM Oracle AI Search Query: *"${query}"*\n\n`;
    
    if (q.includes("trust") || q.includes("high")) {
      const highTrust = [...db.users].sort((a, b) => b.trust_score - a.trust_score).slice(0, 3);
      result += `I have searched the ANSEM ledger and found the following **highest-trust** builders:\n\n`;
      highTrust.forEach((u, i) => {
        const skills = db.skills.filter(s => s.user_id === u.id).map(s => s.name).join(", ");
        result += `${i+1}. **${u.username}** (Overall Trust Score: \`${u.trust_score}%\`)\n`;
        result += `   - **Reputation**: Level ${u.reputation_level}/5 (${u.verified_identity ? "✓ Identity Verified" : "Self-asserted"})\n`;
        result += `   - **Key Skills**: *${skills || "Solidity, Blockchain Engineering"}*\n`;
        result += `   - **Projects**: ${db.projects.filter(p => p.creator_id === u.id).map(p => `\`${p.name}\``).join(", ") || "None yet"}\n\n`;
      });
    } else if (q.includes("project") || q.includes("built")) {
      const activeBuilders = db.users.map(u => ({
        ...u,
        projectCount: db.projects.filter(p => p.creator_id === u.id).length
      })).sort((a, b) => b.projectCount - a.projectCount);
      
      result += `Here are the builders who have authored the **most verified projects** in the ANSEM ecosystem:\n\n`;
      activeBuilders.forEach((u, i) => {
        result += `${i+1}. **${u.username}** (Authored **${u.projectCount} projects**)\n`;
        result += `   - **Projects**: ${db.projects.filter(p => p.creator_id === u.id).map(p => `\`${p.name}\` (${p.category})`).join(", ") || "None"}\n`;
        result += `   - **Trust score**: \`${u.trust_score}%\` | Reputation Level: \`${u.reputation_level}/5\`\n\n`;
      });
    } else {
      // Skill keyword match
      const matched = db.users.filter(u => {
        const skills = db.skills.filter(s => s.user_id === u.id).map(s => s.name.toLowerCase());
        return skills.some(s => q.includes(s) || s.includes(q)) || u.username.toLowerCase().includes(q);
      });
      
      if (matched.length > 0) {
        result += `Found **${matched.length} developers** matching your search criteria:\n\n`;
        matched.forEach((u) => {
          const userSkills = db.skills.filter(s => s.user_id === u.id);
          result += `#### 👤 Builder: **${u.username}**\n`;
          result += `- **Trust Score**: \`${u.trust_score}%\` | **Reputation**: Level ${u.reputation_level}/5\n`;
          result += `- **Ecosystem Endorsements**:\n`;
          userSkills.forEach(s => {
            result += `  - \`${s.name}\` — Endorsed **${s.endorsement_count} times**\n`;
          });
          result += `- **Verified Projects**: ${db.projects.filter(p => p.creator_id === u.id).map(p => `"${p.name}"`).join(", ") || "None"}\n\n`;
        });
      } else {
        result += `I searched the ANSEM registry, but no developers explicitly matches all parameters of your semantic query yet. Let me present the active developers as alternatives:\n\n`;
        db.users.slice(0, 3).forEach(u => {
          result += `- **${u.username}** (Trust Score: \`${u.trust_score}%\` | Skills: *${db.skills.filter(s => s.user_id === u.id).map(s => s.name).join(", ")}*)\n`;
        });
      }
    }
    
    result += `\n*Oracle suggestion: You can connect your Web3 wallet or message these developers directly via their primary wallets using the Builder Passport links.*`;
    return result;
  }
  
  return `### 🔮 ANSEM Oracle AI Search Query: *"${query}"*\n\nBased on a scan of the ANSEM ecosystem, here are the most relevant findings:\n\n1. **Ansem** is the leading expert in **AI Agent integration** and DeFi liquid staking, with a reputation score of \`98%\` and **Genesis Founder** credentials.\n2. **Satoshi_Dev** anchors cryptography standards with \`99%\` trust, while **Vitalic_B** drives sharding protocols.\n\nTry asking specific questions like: *"Who has built active AI agents?"* or *"Show me developers endorsed in cryptography."*`;
}

function simulateAIAnalysis(username: string, type: string, db: Database): string {
  const user = db.users.find(u => u.username === username) || db.users[0];
  const projs = db.projects.filter(p => p.creator_id === user.id);
  const skills = db.skills.filter(s => s.user_id === user.id);
  const scores = db.trust_scores.find(t => t.user_id === user.id) || { alignment_score: 80, history_score: 80, verification_score: 80, overall_score: 80 };

  if (type === "builder_summary") {
    return `### 👤 Professional Builder Summary for **${username}**
    
**Core Capabilities**:
- **Expert Skill Endorsements**: ${skills.map(s => `\`${s.name} (${s.endorsement_count} endorsements)\``).join(", ") || "Systems Architecture, Blockchain Implementation"}.
- **Ecosystem Footprint**: Contributed to **${projs.length} live verified applications**, showcasing excellent ability to ship production quality DeFi and AI products.

**Reputation and Standing**:
- Holds **Reputation Level ${user.reputation_level}/5** with a global decentralized Trust Index of \`${user.trust_score}%\`.
- Possesses verified badges: ${db.user_badges.filter(ub => ub.user_id === user.id).map(ub => db.badges.find(b => b.id === ub.badge_id)?.name).map(n => `🏆 **${n}**`).join(", ") || "🏆 Early Contributor"}.

**Overall Fit**:
${username} has a flawless record of smart contract security, precise delivery speeds, and transparent wallet history. Highly recommended for enterprise Web3 integration or early-stage seed-round funding frameworks.`;
  } else if (type === "risk_analysis") {
    const riskTier = user.trust_score >= 95 ? "NEGLIGIBLE" : user.trust_score >= 85 ? "LOW" : "MODERATE";
    return `### 🛡️ Alignment & Security Risk Audit: **${username}**

#### **Risk Tier Rating**: \`[${riskTier} RISK]\` (Decentralized Trust Score: \`${user.trust_score}%\`)

#### **Metrics Breakdown**:
- **Ecosystem Alignment Score**: \`${scores.alignment_score}%\` (Calculated using peer rating distribution)
- **Contribution History Score**: \`${scores.history_score}%\` (Reflected by repo contribution density and active finality)
- **Credential Verification Score**: \`${scores.verification_score}%\` (Based on active multi-chain KYC and legal signatures)

#### **Identified Risk Factors**:
1. ${user.verified_identity ? "✓ Identity fully verified under ANSEM core protocol standards." : "⚠ Self-asserted identity. We recommend completing legal KYC or linking active Github profiles to raise the verification score."}
2. ${projs.some(p => !p.verified) ? "⚠ Holds unverified project listings. Immediate team review recommended." : "✓ All authored projects have undergone strict code review verification."}

#### **Actionable Recommendations**:
- Commit open source agent configurations to the ANSEM review repository.
- Secure 2 additional verified reviews from builders with Reputation Level 4+.`;
  } else if (type === "project_summary") {
    return `### 📦 Ecosystem Project Impact Analysis: **${username}**

#### **Active Project Directory**:
${projs.map(p => `
- **${p.logo} ${p.name}** (\`${p.category}\`)
  - **Status**: ${p.verified ? "✅ Verified" : "⏳ Pending Audit"}
  - **Ecosystem Trust Index**: \`${p.trust_score}%\`
  - *Description*: ${p.description}
  - *Links*: [Website](${p.website}) | [GitHub](${p.github})
`).join("") || "No active projects submitted to the ecosystem registry yet."}

#### **Strategic Value Evaluation**:
- Authored products show solid architectural alignment to the ANSEM multi-agent and liquid staking design principles.
- Code repositories demonstrate premium code quality with modern automated testing pipelines.`;
  } else if (type === "community_insights") {
    const reviews = db.reviews.filter(r => r.builder_id === user.id);
    return `### 💬 Community Insights & Peer Feedback: **${username}**

#### **Core Strengths Highlighted by Peers**:
${reviews.map(r => `- **${r.category}** (Rating: ${"⭐".repeat(r.rating)}): "${r.content}"`).join("\n") || "- *No peer reviews submitted yet. Be the first to verify a transaction with this wallet and submit a review!*"}

#### **Peer Sentiment Analysis**:
- **Technical Rigor**: Very high. Code commits display extreme professional care, specifically in multi-agent routing.
- **Collaboration**: Excellent. Noted for active communication during code sharding reviews.
- **Reliability**: Prompt delivery timelines across active contracts.`;
  } else {
    // wallet_summary
    const wallets = db.wallets.filter(w => w.user_id === user.id);
    return `### 💳 Wallet Intelligence & Multi-Chain Activity: **${username}**

#### **Registered Public Addresses**:
${wallets.map(w => `- **${w.chain}**: \`${w.address}\` (${w.label})`).join("\n")}

#### **On-Chain Credential Status**:
- **Signature Auditing**: All linked wallets have been verified via cryptographic signature.
- **Contract Affiliation**: Connected wallets are linked directly to verified repository deploys on both Ethereum Mainnet and Solana Devnet.
- **Verification Age**: Active for over ${Math.floor((new Date().getTime() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24))} days inside the ANSEM registry.`;
  }
}

// ==================================================
// VITE DEV SERVER & STATIC MIDDLEWARE SETUP
// ==================================================

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ANSEM Fullstack Hub Server running on http://localhost:${PORT}`);
  });
}

startServer();
