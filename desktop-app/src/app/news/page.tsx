'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { newsApi } from '@/lib/api-client';
import { formatRelativeTime } from '@/lib/utils';
import { 
  Search, 
  ExternalLink, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Newspaper, 
  RefreshCw,
  Filter
} from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, EmptyState, Badge } from '@/components/ui';

interface NewsArticle {
  id: string;
  title: string;
  description: string;
  url: string;
  imageUrl?: string;
  source: string;
  publishedAt: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  sentimentScore?: number;
  relatedCryptos?: string[];
}

export default function NewsPage() {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [filteredNews, setFilteredNews] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSentiment, setSelectedSentiment] = useState<string>('all');
  const [selectedCrypto, setSelectedCrypto] = useState<string>('all');

  useEffect(() => {
    loadNews();
  }, []);

  useEffect(() => {
    filterNews();
  }, [news, searchQuery, selectedSentiment, selectedCrypto]);

  const loadNews = async () => {
    try {
      const response = await newsApi.getAll({ limit: 50 }) as any;
      const articles = response.data || response || [];
      setNews(articles);
      
      // If no news from API, show informational message
      if (articles.length === 0) {
        toast.info('No hay noticias disponibles en este momento. Intenta más tarde.');
      }
    } catch (error: any) {
      console.error('Error loading news:', error);
      toast.error('Error al cargar las noticias');
      // Set empty array to show empty state instead of loading
      setNews([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filterNews = () => {
    let filtered = [...news];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (article) =>
          article.title.toLowerCase().includes(query) ||
          article.description.toLowerCase().includes(query) ||
          article.source.toLowerCase().includes(query)
      );
    }

    if (selectedSentiment !== 'all') {
      filtered = filtered.filter((article) => article.sentiment === selectedSentiment);
    }

    if (selectedCrypto !== 'all') {
      filtered = filtered.filter((article) =>
        article.relatedCryptos?.includes(selectedCrypto)
      );
    }

    setFilteredNews(filtered);
  };

  const getSentimentIcon = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'negative':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'negative':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const cryptoOptions = ['all', 'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT'];

  // Skeleton for loading
  const NewsCardSkeleton = () => (
    <div className="bg-gray-800 rounded-xl border border-gray-700/50 p-5 animate-pulse">
      <div className="flex gap-4">
        <div className="hidden md:block w-40 h-24 bg-gray-700 rounded-lg" />
        <div className="flex-1 space-y-3">
          <div className="h-5 bg-gray-700 rounded w-3/4" />
          <div className="h-4 bg-gray-700 rounded w-full" />
          <div className="h-4 bg-gray-700 rounded w-1/2" />
          <div className="flex gap-2">
            <div className="h-6 w-16 bg-gray-700 rounded" />
            <div className="h-6 w-20 bg-gray-700 rounded" />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                <Newspaper className="w-6 h-6 text-indigo-400" />
              </div>
              Noticias Crypto
            </h1>
            <p className="text-gray-400 mt-2">
              Mantente actualizado con las últimas noticias y sentimiento del mercado
            </p>
          </div>
          <button
            onClick={loadNews}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 
                       rounded-lg text-white font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-gray-800 border border-gray-700/50">
            <p className="text-sm text-gray-400 mb-1">Total Artículos</p>
            <p className="text-2xl font-bold text-white">{news.length}</p>
          </div>
          <div className="p-4 rounded-xl bg-gray-800 border border-green-500/30">
            <p className="text-sm text-gray-400 mb-1">Positivo</p>
            <p className="text-2xl font-bold text-green-400">
              {news.filter(n => n.sentiment === 'positive').length}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-gray-800 border border-gray-500/30">
            <p className="text-sm text-gray-400 mb-1">Neutral</p>
            <p className="text-2xl font-bold text-gray-400">
              {news.filter(n => n.sentiment === 'neutral').length}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-gray-800 border border-red-500/30">
            <p className="text-sm text-gray-400 mb-1">Negativo</p>
            <p className="text-2xl font-bold text-red-400">
              {news.filter(n => n.sentiment === 'negative').length}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs
          tabs={[
            { id: 'all', label: 'Todas las Noticias', count: filteredNews.length },
            { id: 'positive', label: 'Alcista', count: news.filter(n => n.sentiment === 'positive').length },
            { id: 'negative', label: 'Bajista', count: news.filter(n => n.sentiment === 'negative').length },
          ]}
          activeTab={selectedSentiment}
          onChange={setSelectedSentiment}
        />

        {/* Filters */}
        <div className="bg-gray-800 rounded-xl border border-gray-700/50 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Buscar noticias..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg pl-10 pr-4 py-2
                           text-white placeholder-gray-500 text-sm
                           focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Crypto Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <select
                value={selectedCrypto}
                onChange={(e) => setSelectedCrypto(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg
                           text-white focus:outline-none focus:ring-2 focus:ring-indigo-500
                           appearance-none cursor-pointer min-w-[180px]"
              >
                <option value="all">Todas las Criptos</option>
                {cryptoOptions.slice(1).map((crypto) => (
                  <option key={crypto} value={crypto}>
                    {crypto.replace('USDT', '')}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* News List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <NewsCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredNews.length === 0 ? (
          <div className="bg-gray-800 rounded-xl border border-gray-700/50 p-12">
            <EmptyState
              icon={<Newspaper className="w-8 h-8" />}
              title="No se encontraron noticias"
              description={searchQuery ? 'Intenta ajustar tu búsqueda o filtros' : 'Vuelve más tarde para actualizaciones'}
              action={
                searchQuery ? (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedSentiment('all');
                      setSelectedCrypto('all');
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white 
                               rounded-lg text-sm font-medium transition-colors"
                  >
                    Limpiar Filtros
                  </button>
                ) : undefined
              }
            />
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNews.map((article) => (
              <div 
                key={article.id} 
                className="bg-gray-800 rounded-xl border border-gray-700/50 p-5
                           hover:border-gray-600 transition-all group"
              >
                <div className="flex gap-4">
                  {/* Image */}
                  {article.imageUrl && (
                    <div className="hidden md:block flex-shrink-0">
                      <img
                        src={article.imageUrl}
                        alt={article.title}
                        className="w-40 h-24 object-cover rounded-lg"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2 
                                   group-hover:text-indigo-400 transition-colors">
                      {article.title}
                    </h3>
                    <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                      {article.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      {/* Source */}
                      <span className="text-gray-500 font-medium">{article.source}</span>

                      {/* Time */}
                      <span className="text-gray-600">•</span>
                      <span className="text-gray-500">
                        {formatRelativeTime(new Date(article.publishedAt))}
                      </span>

                      {/* Sentiment */}
                      {article.sentiment && (
                        <Badge 
                          variant={
                            article.sentiment === 'positive' ? 'success' : 
                            article.sentiment === 'negative' ? 'danger' : 'default'
                          }
                        >
                          {getSentimentIcon(article.sentiment)}
                          <span className="capitalize">{article.sentiment}</span>
                        </Badge>
                      )}

                      {/* Related Cryptos */}
                      {article.relatedCryptos && article.relatedCryptos.length > 0 && (
                        <div className="flex gap-1">
                          {article.relatedCryptos.map((crypto) => (
                            <span
                              key={crypto}
                              className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 text-xs rounded-md"
                            >
                              {crypto.replace('USDT', '')}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Read More */}
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto flex items-center gap-1 px-3 py-1 rounded-lg
                                   bg-gray-700/50 text-gray-300 hover:bg-gray-700 
                                   hover:text-white transition-colors text-xs"
                      >
                        Read More
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Results Count */}
        {!isLoading && filteredNews.length > 0 && (
          <div className="text-center text-sm text-gray-500">
            Showing {filteredNews.length} of {news.length} articles
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
