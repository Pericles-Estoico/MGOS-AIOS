export type UserRole = 'admin' | 'head' | 'executor' | 'qa';

export type {
  Marketplace,
  ListingStatus,
  ScoreLevel,
  Product,
  ProductWithStats,
  ProductInsert,
  ProductUpdate,
  ProductListing,
  ProductListingWithAnalyses,
  ProductListingInsert,
  ProductListingUpdate,
  ListingAnalysis,
  ListingAnalysisInsert,
} from '@lib/types/products';

export { getScoreLevel, MARKETPLACE_LABELS } from '@lib/types/products';

// Type for API responses
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}
