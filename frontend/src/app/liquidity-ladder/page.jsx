'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  AlertCircle,
  Calendar,
  CheckCircle,
  ArrowRight,
  RefreshCw,
  Clock,
} from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import { api, formatINR, formatDate, formatINRCompact } from '../../lib/utils';
import StatusChip from '../../components/ui/StatusChip';

export default function LiquidityLadderPage() {
  const { data: forecastData, isLoading: isForecastLoading } = useQuery({
    queryKey: ['liquidity-forecast'],
    queryFn: async () => {
      const res = await api.get('/dashboard/maturity-forecast');
      return res.data?.data || [];
    },
    staleTime: 30000,
  });

  const { data: renewalData, isLoading: isRenewalLoading } = useQuery({
    queryKey: ['renewal-due-list'],
    queryFn: async () => {
      const res = await api.get('/fdrs/renewal-due');
      return res.data?.data || [];
    },
    staleTime: 30000,
  });

  const { data: kpiData } = useQuery({
    queryKey: ['dashboard-kpis-mini'],
    queryFn: async () => {
      const res = await api.get('/dashboard/kpis');
      return res.data?.data || {};
    },
    staleTime: 30000,
  });

  // Process forecast chart data
  const chartData = useMemo(() => {
    if (!forecastData || !forecastData.length) return [];
    return forecastData.map((item, index) => {
      const amount = Number(item.totalAmount) || 0;
      let color = '#10B981'; // emerald
      if (index === 0) color = '#EF4444'; // immediate/current: red
      else if (index <= 2) color = '#F97316'; // 1-2 months: orange
      else if (index <= 5) color = '#F59E0B'; // 3-5 months: amber

      return {
        month: item.month,
        amount: amount,
        formattedAmount: formatINR(amount),
        count: item.count || 0,
        color,
      };
    });
  }, [forecastData]);

  const total12MonthInflow = useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.amount, 0);
  }, [chartData]);

  const totalFdrsMaturing = useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.count, 0);
  }, [chartData]);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
              Liquidity Ladder & Maturity Inflow
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              12-Month Liquidity Forecast, Cash Inflow Schedule & Re-investment / Renewal Actions
            </p>
          </div>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider">
              <span>12-Month Forecast Inflow</span>
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
              {formatINR(total12MonthInflow)}
            </div>
            <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              ≈ {formatINRCompact(total12MonthInflow)} maturing liquidity
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider">
              <span>Maturing Deposits</span>
              <Calendar className="h-4 w-4 text-blue-500" />
            </div>
            <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
              {totalFdrsMaturing}
            </div>
            <p className="mt-1 text-xs text-gray-500">Scheduled across 12 calendar buckets</p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider">
              <span>Renewal Due Action</span>
              <RefreshCw className="h-4 w-4 text-amber-500" />
            </div>
            <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
              {renewalData?.length || 0}
            </div>
            <p className="mt-1 text-xs text-amber-600 dark:text-amber-400 font-medium">
              Requires renewal or release review
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider">
              <span>Overdue Deposits</span>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </div>
            <div className="mt-2 text-2xl font-bold text-red-600 dark:text-red-400">
              {kpiData?.overdueFdrCount ?? 0}
            </div>
            <p className="mt-1 text-xs text-red-500">Matured without disposal action</p>
          </div>
        </div>

        {/* 12-Month Inflow Bar Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                12-Month Liquidity Maturity Ladder
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Categorized by urgency: Red (≤30d), Orange (31–60d), Amber (61–90d), Green (&gt;90d)
              </p>
            </div>
          </div>

          {isForecastLoading ? (
            <div className="h-72 flex items-center justify-center text-gray-400">Loading forecast...</div>
          ) : chartData.length === 0 ? (
            <div className="h-72 flex items-center justify-center text-gray-400">No maturing deposits found.</div>
          ) : (
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis
                    tickFormatter={(val) => formatINRCompact(val)}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    formatter={(val) => [formatINR(val), 'Maturing Inflow']}
                    labelFormatter={(label) => `Month: ${label}`}
                  />
                  <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Grid: Renew-First List & Monthly Table */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Renew-First Priority List */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Clock className="h-5 w-5 text-amber-500" />
                  Renew-First Priority Queue
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  FDRs reaching or past maturity with no child renewal
                </p>
              </div>
              <Link
                href="/renewals"
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium"
              >
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-gray-700/60 overflow-y-auto max-h-96 flex-1">
              {isRenewalLoading ? (
                <div className="p-8 text-center text-sm text-gray-400">Loading renewal queue...</div>
              ) : !renewalData || renewalData.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-400">
                  <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                  No immediate renewals pending.
                </div>
              ) : (
                renewalData.slice(0, 8).map((fdr) => (
                  <div key={fdr.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-gray-900 dark:text-white">
                          {fdr.fdrNumber}
                        </span>
                        <StatusChip status={fdr.status} size="sm" />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {fdr.institution?.name} • Maturing: {formatDate(fdr.maturityDate)}
                      </p>
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mt-1">
                        Principal: {formatINR(fdr.principal)}
                      </p>
                    </div>
                    <Link
                      href={`/fdrs/${fdr.id}`}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/40 dark:text-indigo-300 transition"
                    >
                      Renew / Release
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Monthly Breakdown Table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Monthly Ladder Inflow Table
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Detailed breakdown corresponding to the 12-month ladder
              </p>
            </div>

            <div className="overflow-x-auto flex-1 max-h-96">
              <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
                <thead className="bg-gray-50 dark:bg-gray-750 text-xs uppercase text-gray-500 dark:text-gray-400 sticky top-0">
                  <tr>
                    <th className="px-4 py-3">Month</th>
                    <th className="px-4 py-3 text-center">FDR Count</th>
                    <th className="px-4 py-3 text-right">Inflow Amount</th>
                    <th className="px-4 py-3 text-center">Urgency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                  {chartData.map((row, idx) => (
                    <tr key={row.month} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                        {row.month}
                      </td>
                      <td className="px-4 py-3 text-center font-semibold">
                        {row.count}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {row.formattedAmount}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className="inline-block w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: row.color }}
                          title={`Urgency: ${idx <= 0 ? 'High' : idx <= 2 ? 'Medium' : 'Low'}`}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
