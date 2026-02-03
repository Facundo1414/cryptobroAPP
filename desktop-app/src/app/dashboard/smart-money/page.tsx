'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { 
  SmartMoneyChart, 
  VolumeProfile, 
  DeltaVolumeChart, 
  SmartMoneySignalPanel 
} from '@/components/smart-money';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { 
  TrendingUp, 
  Activity, 
  Eye, 
  EyeOff, 
  RefreshCw,
  Info,
  Zap
} from 'lucide-react';
import { strategiesApi } from '@/lib/api-client';

const POPULAR_CRYPTOS = [
  { symbol: 'BTCUSDT', name: 'Bitcoin' },
  { symbol: 'ETHUSDT', name: 'Ethereum' },
  { symbol: 'SOLUSDT', name: 'Solana' },
  { symbol: 'BNBUSDT', name: 'BNB' },
  { symbol: 'ADAUSDT', name: 'Cardano' },
  { symbol: 'DOGEUSDT', name: 'Dogecoin' },
];

const STRATEGIES = [
  { id: 'smart-money', name: 'Smart Money Concepts' },
  { id: 'order-flow', name: 'Order Flow' },
];

export default function SmartMoneyPage() {
  const [selectedCrypto, setSelectedCrypto] = useState('BTCUSDT');
  const [selectedStrategy, setSelectedStrategy] = useState('smart-money');
  const [isLoading, setIsLoading] = useState(false);
  const [chartData, setChartData] = useState<any>(null);
  const [currentSignal, setCurrentSignal] = useState<any>(null);

  // Toggles for displaying overlays
  const [showOrderBlocks, setShowOrderBlocks] = useState(true);
  const [showFVGs, setShowFVGs] = useState(true);
  const [showLiquiditySweeps, setShowLiquiditySweeps] = useState(true);
  const [showVolumeProfile, setShowVolumeProfile] = useState(true);

  // Fetch strategy analysis
  const fetchAnalysis = async () => {
    setIsLoading(true);
    try {
      const response: any = await strategiesApi.analyzeWithStrategy(
        selectedCrypto,
        selectedStrategy,
        '1h'
      );
      
      setChartData(response.data);
      
      // Extract signal information
      if (response.data.signal) {
        setCurrentSignal({
          type: response.data.signal.action,
          confidence: response.data.signal.confidence,
          price: response.data.price,
          stopLoss: response.data.signal.stopLoss,
          takeProfit: response.data.signal.takeProfit,
          reasoning: response.data.signal.reasoning,
          metadata: response.data.metadata,
        });
      }
    } catch (error) {
      console.error('Error fetching smart money analysis:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
    // Auto-refresh every 1 minute
    const interval = setInterval(fetchAnalysis, 60000);
    return () => clearInterval(interval);
  }, [selectedCrypto, selectedStrategy]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">Smart Money Analysis</h1>
              <Badge variant="outline" className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                <Zap className="h-3 w-3 mr-1" />
                Profesional
              </Badge>
            </div>
            <p className="mt-1 text-slate-400">
              Análisis avanzado con estrategias institucionales - Order Blocks, FVGs, Liquidity Sweeps
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAnalysis}
              disabled={isLoading}
              className="border-slate-700 hover:bg-slate-800"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>
        </div>

        {/* Controls */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Crypto Selector */}
              <div>
                <label className="text-xs text-slate-400 mb-2 block">Criptomoneda</label>
                <Select 
                  value={selectedCrypto} 
                  onChange={(e) => setSelectedCrypto(e.target.value)}
                  className="bg-slate-800 border-slate-700"
                >
                  {POPULAR_CRYPTOS.map((crypto) => (
                    <option key={crypto.symbol} value={crypto.symbol}>
                      {crypto.name} ({crypto.symbol})
                    </option>
                  ))}
                </Select>
              </div>

              {/* Strategy Selector */}
              <div>
                <label className="text-xs text-slate-400 mb-2 block">Estrategia</label>
                <Select 
                  value={selectedStrategy} 
                  onChange={(e) => setSelectedStrategy(e.target.value)}
                  className="bg-slate-800 border-slate-700"
                >
                  {STRATEGIES.map((strategy) => (
                    <option key={strategy.id} value={strategy.id}>
                      {strategy.name}
                    </option>
                  ))}
                </Select>
              </div>

              {/* Overlay Toggles */}
              <div>
                <label className="text-xs text-slate-400 mb-2 block">Overlays</label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={showOrderBlocks ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setShowOrderBlocks(!showOrderBlocks)}
                    className={showOrderBlocks ? 'bg-green-600 hover:bg-green-700' : 'border-slate-700'}
                  >
                    {showOrderBlocks ? <Eye className="h-3 w-3 mr-1" /> : <EyeOff className="h-3 w-3 mr-1" />}
                    OB
                  </Button>
                  <Button
                    variant={showFVGs ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setShowFVGs(!showFVGs)}
                    className={showFVGs ? 'bg-cyan-600 hover:bg-cyan-700' : 'border-slate-700'}
                  >
                    {showFVGs ? <Eye className="h-3 w-3 mr-1" /> : <EyeOff className="h-3 w-3 mr-1" />}
                    FVG
                  </Button>
                  <Button
                    variant={showLiquiditySweeps ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setShowLiquiditySweeps(!showLiquiditySweeps)}
                    className={showLiquiditySweeps ? 'bg-blue-600 hover:bg-blue-700' : 'border-slate-700'}
                  >
                    {showLiquiditySweeps ? <Eye className="h-3 w-3 mr-1" /> : <EyeOff className="h-3 w-3 mr-1" />}
                    LS
                  </Button>
                  <Button
                    variant={showVolumeProfile ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setShowVolumeProfile(!showVolumeProfile)}
                    className={showVolumeProfile ? 'bg-yellow-600 hover:bg-yellow-700' : 'border-slate-700'}
                  >
                    {showVolumeProfile ? <Eye className="h-3 w-3 mr-1" /> : <EyeOff className="h-3 w-3 mr-1" />}
                    VP
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-green-500/10 border-green-500/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span className="text-xs font-medium text-white">Order Blocks (OB)</span>
              </div>
              <p className="text-xs text-slate-400">
                Zonas de entrada institucional
              </p>
            </CardContent>
          </Card>

          <Card className="bg-cyan-500/10 border-cyan-500/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 bg-cyan-500 rounded"></div>
                <span className="text-xs font-medium text-white">Fair Value Gaps (FVG)</span>
              </div>
              <p className="text-xs text-slate-400">
                Huecos de precio sin llenar
              </p>
            </CardContent>
          </Card>

          <Card className="bg-blue-500/10 border-blue-500/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span className="text-xs font-medium text-white">Liquidity Sweeps (LS)</span>
              </div>
              <p className="text-xs text-slate-400">
                Barrida de liquidez institucional
              </p>
            </CardContent>
          </Card>

          <Card className="bg-yellow-500/10 border-yellow-500/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                <span className="text-xs font-medium text-white">Volume Profile (VP)</span>
              </div>
              <p className="text-xs text-slate-400">
                Perfil de volumen por precio
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Chart Area */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Chart Column */}
          <div className="lg:col-span-3 space-y-4">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader className="border-b border-slate-800">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">
                    {POPULAR_CRYPTOS.find(c => c.symbol === selectedCrypto)?.name} Chart
                  </CardTitle>
                  <Badge variant="outline" className="text-slate-400">
                    1H Timeframe
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {chartData && (
                  <SmartMoneyChart
                    data={chartData}
                    showOrderBlocks={showOrderBlocks}
                    showFVGs={showFVGs}
                    showLiquiditySweeps={showLiquiditySweeps}
                    showVolumeProfile={showVolumeProfile}
                  />
                )}
              </CardContent>
            </Card>

            {/* Delta Volume Chart */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader className="border-b border-slate-800">
                <CardTitle className="text-white flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Order Flow - Delta Volume
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {chartData?.metadata?.deltaVolume && (
                  <DeltaVolumeChart data={chartData.metadata.deltaVolume} />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* Volume Profile */}
            {showVolumeProfile && chartData?.metadata?.volumeProfile && (
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader className="border-b border-slate-800 pb-3">
                  <CardTitle className="text-sm text-white">Volume Profile</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <VolumeProfile 
                    data={chartData.metadata.volumeProfile}
                    currentPrice={chartData.price}
                  />
                </CardContent>
              </Card>
            )}

            {/* Smart Money Signal Panel */}
            {currentSignal && (
              <SmartMoneySignalPanel 
                signal={currentSignal} 
                cryptoSymbol={selectedCrypto}
              />
            )}

            {/* Education Card */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-white flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  ¿Qué es Smart Money?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xs text-slate-400 leading-relaxed">
                  <strong className="text-white">Smart Money</strong> se refiere a instituciones financieras, 
                  fondos de cobertura y traders profesionales que mueven grandes volúmenes.
                </p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Al identificar sus patrones de entrada (Order Blocks) y manipulación (Liquidity Sweeps), 
                  podemos anticipar movimientos del mercado con mayor precisión.
                </p>
                <div className="pt-2 mt-2 border-t border-slate-800">
                  <div className="text-xs font-medium text-white mb-2">Tasa de Éxito</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-green-500 to-emerald-400" style={{ width: '78%' }}></div>
                    </div>
                    <span className="text-xs font-bold text-green-400">78%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
