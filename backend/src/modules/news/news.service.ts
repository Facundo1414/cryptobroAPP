import { Injectable, Logger } from "@nestjs/common";
import axios from "axios";
import { NewsArticle, NewsFilters } from "./news.types";

@Injectable()
export class NewsService {
  private readonly logger = new Logger(NewsService.name);
  private readonly newsCache: Map<
    string,
    { data: NewsArticle[]; timestamp: number }
  > = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  async getNews(filters: NewsFilters = {}): Promise<NewsArticle[]> {
    const cacheKey = JSON.stringify(filters);
    const cached = this.newsCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      this.logger.debug("Returning cached news");
      return cached.data;
    }

    try {
      const news = await this.fetchNewsFromAPI(filters);
      const enrichedNews = await this.enrichWithSentiment(news);

      this.newsCache.set(cacheKey, {
        data: enrichedNews,
        timestamp: Date.now(),
      });

      return enrichedNews;
    } catch (error) {
      this.logger.error("Error fetching news:", error);
      // Return mock data as fallback
      return this.getMockNews(filters);
    }
  }

  private async fetchNewsFromAPI(filters: NewsFilters): Promise<NewsArticle[]> {
    // Using CryptoPanic API (free tier) or mock data
    // You can replace this with actual API call
    const query = filters.crypto || "cryptocurrency";

    try {
      // Example: CryptoPanic API
      // const response = await axios.get('https://cryptopanic.com/api/v1/posts/', {
      //   params: {
      //     auth_token: process.env.CRYPTOPANIC_API_KEY,
      //     currencies: filters.crypto,
      //     filter: 'rising',
      //   },
      // });

      // For now, return mock data
      return this.getMockNews(filters);
    } catch (error) {
      this.logger.error("API fetch error:", error);
      return this.getMockNews(filters);
    }
  }

  private async enrichWithSentiment(
    articles: NewsArticle[],
  ): Promise<NewsArticle[]> {
    // Simple sentiment analysis based on keywords
    return articles.map((article) => {
      const sentiment = this.analyzeSentiment(
        article.title + " " + article.description,
      );
      return {
        ...article,
        sentiment: sentiment.label,
        sentimentScore: sentiment.score,
      };
    });
  }

  private analyzeSentiment(text: string): {
    label: "positive" | "negative" | "neutral";
    score: number;
  } {
    const lowerText = text.toLowerCase();

    const positiveWords = [
      "bull",
      "surge",
      "rally",
      "gain",
      "up",
      "rise",
      "breakthrough",
      "adoption",
      "partnership",
      "success",
      "profit",
      "high",
      "growth",
    ];

    const negativeWords = [
      "bear",
      "crash",
      "fall",
      "drop",
      "down",
      "decline",
      "hack",
      "scam",
      "fraud",
      "loss",
      "concern",
      "warning",
      "risk",
    ];

    let score = 0;
    positiveWords.forEach((word) => {
      if (lowerText.includes(word)) score += 1;
    });
    negativeWords.forEach((word) => {
      if (lowerText.includes(word)) score -= 1;
    });

    if (score > 0) return { label: "positive", score: Math.min(score / 5, 1) };
    if (score < 0) return { label: "negative", score: Math.max(score / 5, -1) };
    return { label: "neutral", score: 0 };
  }

  private getMockNews(filters: NewsFilters): NewsArticle[] {
    const mockNews: NewsArticle[] = [
      {
        id: "1",
        title: "Bitcoin Surges Past $50,000 Mark",
        description:
          "Bitcoin reaches new milestone as institutional adoption continues to grow.",
        url: "https://example.com/news/1",
        imageUrl: "https://via.placeholder.com/400x200?text=Bitcoin+News",
        source: "CryptoNews",
        publishedAt: new Date(Date.now() - 1000 * 60 * 30),
        relatedCryptos: ["BTCUSDT"],
      },
      {
        id: "2",
        title: "Ethereum 2.0 Staking Reaches Record High",
        description:
          "More than 10 million ETH now staked on the Ethereum 2.0 network.",
        url: "https://example.com/news/2",
        imageUrl: "https://via.placeholder.com/400x200?text=Ethereum+News",
        source: "CoinDesk",
        publishedAt: new Date(Date.now() - 1000 * 60 * 60),
        relatedCryptos: ["ETHUSDT"],
      },
      {
        id: "3",
        title: "SEC Approves First Bitcoin ETF",
        description:
          "Major regulatory milestone as SEC gives green light to Bitcoin ETF.",
        url: "https://example.com/news/3",
        imageUrl: "https://via.placeholder.com/400x200?text=SEC+News",
        source: "Bloomberg",
        publishedAt: new Date(Date.now() - 1000 * 60 * 90),
        relatedCryptos: ["BTCUSDT"],
      },
      {
        id: "4",
        title: "Solana Network Upgrade Boosts Performance",
        description: "Latest upgrade increases transaction throughput by 40%.",
        url: "https://example.com/news/4",
        imageUrl: "https://via.placeholder.com/400x200?text=Solana+News",
        source: "CryptoSlate",
        publishedAt: new Date(Date.now() - 1000 * 60 * 120),
        relatedCryptos: ["SOLUSDT"],
      },
      {
        id: "5",
        title: "DeFi TVL Hits All-Time High",
        description:
          "Total value locked in DeFi protocols surpasses $200 billion.",
        url: "https://example.com/news/5",
        imageUrl: "https://via.placeholder.com/400x200?text=DeFi+News",
        source: "The Block",
        publishedAt: new Date(Date.now() - 1000 * 60 * 150),
        relatedCryptos: ["ETHUSDT"],
      },
      {
        id: "6",
        title: "Major Exchange Launches Staking Platform",
        description:
          "Leading cryptocurrency exchange introduces new staking services.",
        url: "https://example.com/news/6",
        imageUrl: "https://via.placeholder.com/400x200?text=Exchange+News",
        source: "CoinTelegraph",
        publishedAt: new Date(Date.now() - 1000 * 60 * 180),
        relatedCryptos: ["BTCUSDT", "ETHUSDT"],
      },
    ];

    let filtered = [...mockNews];

    if (filters.crypto) {
      filtered = filtered.filter((news) =>
        news.relatedCryptos?.includes(filters.crypto!),
      );
    }

    if (filters.limit) {
      filtered = filtered.slice(0, filters.limit);
    }

    return filtered;
  }

  async getNewsByCrypto(crypto: string): Promise<NewsArticle[]> {
    return this.getNews({ crypto, limit: 10 });
  }

  async getTrendingNews(): Promise<NewsArticle[]> {
    return this.getNews({ limit: 5 });
  }
}
