'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';
import { ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

interface TradesTableProps {
  trades: any[];
}

export default function TradesTable({ trades }: TradesTableProps) {
  if (!trades || trades.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Trade History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-8">
            No trades executed
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trade History ({trades.length} trades)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left text-sm font-medium text-gray-400 pb-3">#</th>
                <th className="text-left text-sm font-medium text-gray-400 pb-3">Type</th>
                <th className="text-left text-sm font-medium text-gray-400 pb-3">Date</th>
                <th className="text-right text-sm font-medium text-gray-400 pb-3">Price</th>
                <th className="text-right text-sm font-medium text-gray-400 pb-3">Amount</th>
                <th className="text-right text-sm font-medium text-gray-400 pb-3">Total</th>
                <th className="text-right text-sm font-medium text-gray-400 pb-3">Fee</th>
                <th className="text-right text-sm font-medium text-gray-400 pb-3">Balance</th>
                <th className="text-left text-sm font-medium text-gray-400 pb-3">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {trades.map((trade, index) => (
                <tr key={trade.id || index} className="hover:bg-gray-800/50">
                  <td className="py-3 text-sm text-gray-300">{index + 1}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      {trade.type === 'BUY' ? (
                        <>
                          <ArrowUpCircle className="w-4 h-4 text-green-400" />
                          <span className="text-sm font-medium text-green-400">BUY</span>
                        </>
                      ) : (
                        <>
                          <ArrowDownCircle className="w-4 h-4 text-red-400" />
                          <span className="text-sm font-medium text-red-400">SELL</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="py-3 text-sm text-gray-300">
                    {new Date(trade.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3 text-sm text-gray-300 text-right">
                    {formatCurrency(trade.price)}
                  </td>
                  <td className="py-3 text-sm text-gray-300 text-right">
                    {trade.amount.toFixed(6)}
                  </td>
                  <td className="py-3 text-sm text-gray-300 text-right font-medium">
                    {formatCurrency(trade.total)}
                  </td>
                  <td className="py-3 text-sm text-red-400 text-right">
                    -{formatCurrency(trade.fee)}
                  </td>
                  <td className="py-3 text-sm text-gray-100 text-right font-semibold">
                    {formatCurrency(trade.balance)}
                  </td>
                  <td className="py-3 text-sm text-gray-400 max-w-xs truncate">
                    {trade.reason}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
