export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  url: string;
  imageUrl?: string;
  source: string;
  publishedAt: Date;
  sentiment?: "positive" | "negative" | "neutral";
  sentimentScore?: number;
  relatedCryptos?: string[];
}

export interface NewsFilters {
  crypto?: string;
  sentiment?: "positive" | "negative" | "neutral";
  source?: string;
  limit?: number;
}
