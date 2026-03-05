/**
 * Types — Products, Listings, Analyses
 * Story: STORY-5.1
 * Modelo: produto base (1) → listings por canal (N) → análises (N)
 */

export type Marketplace =
  | 'amazon'
  | 'mercadolivre'
  | 'shopee'
  | 'shein'
  | 'tiktokshop'
  | 'kaway';

export type ListingStatus = 'active' | 'analyzing' | 'inactive';

// ============================================================
// Product (produto base)
// ============================================================

export interface Product {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  brand: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ProductWithStats extends Product {
  listings_count: number;
  avg_score: number | null;
  listings?: ProductListing[];
}

export type ProductInsert = Omit<Product, 'id' | 'created_at' | 'updated_at'>;
export type ProductUpdate = Partial<Pick<Product, 'name' | 'description' | 'category' | 'brand'>>;

// ============================================================
// ProductListing (listing por canal)
// ============================================================

export interface ProductListing {
  id: string;
  product_id: string;
  marketplace: Marketplace;
  url: string | null;
  title: string | null;
  price: string | null;
  image_url: string | null;
  listing_score: number | null;
  status: ListingStatus;
  created_at: string;
  updated_at: string;
}

export interface ProductListingWithAnalyses extends ProductListing {
  analyses?: ListingAnalysis[];
  latest_analysis?: ListingAnalysis | null;
}

export type ProductListingInsert = Omit<ProductListing, 'id' | 'created_at' | 'updated_at'>;
export type ProductListingUpdate = Partial<
  Pick<ProductListing, 'url' | 'title' | 'price' | 'image_url' | 'listing_score' | 'status'>
>;

// ============================================================
// ListingAnalysis (histórico de análises AI)
// ============================================================

export interface ListingAnalysis {
  id: string;
  listing_id: string;
  score: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  analysis_data: Record<string, unknown>;
  analyzed_at: string;
}

export type ListingAnalysisInsert = Omit<ListingAnalysis, 'id' | 'analyzed_at'>;

// ============================================================
// Score helpers
// ============================================================

export type ScoreLevel = 'low' | 'medium' | 'high';

export function getScoreLevel(score: number): ScoreLevel {
  if (score < 40) return 'low';
  if (score < 70) return 'medium';
  return 'high';
}

export const MARKETPLACE_LABELS: Record<Marketplace, string> = {
  amazon: 'Amazon',
  mercadolivre: 'Mercado Livre',
  shopee: 'Shopee',
  shein: 'SHEIN',
  tiktokshop: 'TikTok Shop',
  kaway: 'Kaway',
};
