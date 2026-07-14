export interface User {
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

export interface Wallet {
  id: string;
  user_id: string;
  address: string;
  chain: string;
  label: string;
  verified_at: string;
}

export interface Project {
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
  creator?: { username: string; avatar: string } | null;
}

export interface Review {
  id: string;
  reviewer_id: string;
  builder_id: string;
  rating: number;
  content: string;
  verified_transaction_hash?: string;
  category: string;
  created_at: string;
  reviewer?: { username: string; avatar: string } | null;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  issuer: string;
  created_at: string;
}

export interface Skill {
  id: string;
  user_id: string;
  name: string;
  endorsement_count: number;
}

export interface Activity {
  id: string;
  user_id: string;
  type: "review_posted" | "project_verified" | "badge_earned" | "skill_endorsed" | "new_builder" | "follow";
  details: string;
  created_at: string;
  user?: { username: string; avatar: string } | null;
}

export interface TrustScoreDetails {
  user_id: string;
  alignment_score: number;
  history_score: number;
  verification_score: number;
  overall_score: number;
}

export interface GithubProfile {
  user_id: string;
  username: string;
  public_repos: number;
  followers: number;
  contributions_count: number;
  updated_at: string;
}

export interface SocialLink {
  user_id: string;
  twitter: string;
  github: string;
  website: string;
  telegram: string;
}

export interface BuilderPassportDetails extends User {
  wallets: Wallet[];
  projects: Project[];
  reviews: Review[];
  badges: Badge[];
  skills: Skill[];
  trustScore: TrustScoreDetails;
  githubProfile?: GithubProfile;
  socialLinks?: SocialLink;
  followersCount: number;
  followingCount: number;
}

export interface AnalyticsData {
  metrics: {
    totalBuilders: number;
    totalProjects: number;
    totalReviews: number;
    avgTrustScore: number;
  };
  builderGrowth: { month: string; builders: number; projects: number }[];
  trustScoreDistribution: { range: string; count: number }[];
  projectActivity: { name: string; count: number }[];
  heatmap: { username: string; contributions: number }[];
}
