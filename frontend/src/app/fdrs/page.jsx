'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import DataTable from '../../components/ui/DataTable';
import StatusChip from '../../components/ui/StatusChip';
import Button from '../../components/ui/Button';
import { formatINR, formatDate, api } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import { Plus, Search, Filter, ArrowUpRight, Trash2, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function FdrListPage() {
  const { user } = useAuth();
  const [fdrs, setFdrs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [tab, setTab] = useState('active'); // 'active' | 'deleted'

  const canCreate = user?.role === 'SUPER_ADMIN' || user?.role === 'FINANCE_OFFICER';

  async function loadFdrs() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      if (tab === 'deleted') {
        params.append('showDeleted', 'only');
      }

      const res = await api.get(`/fdrs?${params.toString()}`);
      if (res.data?.success) {
        setFdrs(res.data.data);
        setTotal(res.data.meta?.total || 0);
      }
    } catch (err) {
      console.error('Failed to load FDRs:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFdrs();
  }, [page, pageSize, search, statusFilter, tab]);

  async function handleRestore(fdrId, fdrNumber) {
    if (!window.confirm(`Restore FDR ${fdrNumber} back to active records?`)) return;
    try {
      const res = await api.post(`/fdrs/${fdrId}/restore`);
      if (res.data?.success) {
        toast.success(`FDR ${fdrNumber} restored successfully`);
        loadFdrs();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to restore FDR');
    }
  }

  async function handleDelete(fdrId, fdrNumber) {
    if (
      !window.confirm(
        `Are you sure you want to soft-delete FDR ${fdrNumber}? It will be safely moved to the Deleted / Archived Records tab.`
      )
    )
      return;
    try {
      const res = await api.delete(`/fdrs/${fdrId}`);
      if (res.data?.success) {
        toast.success(`FDR ${fdrNumber} moved to Deleted Records`);
        loadFdrs();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete FDR');
    }
  }

  const columns = [
    {
      header: 'FDR Number',
      render: row => (
        <a
          href={`/fdrs/${row.id}`}
          className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
        >
          {row.fdrNumber} <ArrowUpRight className="w-3 h-3" />
        </a>
      ),
    },
    {
      header: 'Institution',
      render: row => (
        <div className="max-w-[200px] truncate">
          <p className="font-semibold text-xs truncate">{row.institution?.name}</p>
          <p className="text-[10px] text-slate-400 font-mono">{row.institution?.aicteId}</p>
        </div>
      ),
    },
    {
      header: 'Bank & Branch',
      render: row => (
        <div className="text-xs">
          <p className="font-medium text-slate-800 dark:text-slate-200">{row.bank?.name}</p>
          <p className="text-[10px] text-slate-400 truncate max-w-[150px]">{row.branch}</p>
        </div>
      ),
    },
    {
      header: 'Principal',
      render: row => (
        <span className="font-bold text-xs font-mono">{formatINR(row.principal)}</span>
      ),
    },
    {
      header: 'Rate / Tenure',
      render: row => (
        <div className="text-xs">
          <p className="font-semibold">{row.interestRate}% p.a.</p>
          <p className="text-[10px] text-slate-400">{row.tenureMonths} Months</p>
        </div>
      ),
    },
    {
      header: 'Maturity Amount',
      render: row => (
        <span className="font-bold text-xs font-mono text-emerald-700 dark:text-emerald-400">
          {formatINR(row.maturityAmount)}
        </span>
      ),
    },
    {
      header: 'Maturity Date',
      render: row => (
        <div className="text-xs">
          <p className="font-medium">{formatDate(row.maturityDate)}</p>
        </div>
      ),
    },
    {
      header: 'Status',
      render: row => (
        row.deletedAt ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
            <Trash2 className="w-3 h-3" /> Deleted ({formatDate(row.deletedAt)})
          </span>
        ) : (
          <StatusChip
            status={row.status}
            isOverdue={row.isOverdue}
            overdueDays={row.overdueDays}
          />
        )
      ),
    },
    {
      header: 'Actions',
      render: row => (
        <div className="flex items-center gap-2">
          <a
            href={`/fdrs/${row.id}`}
            className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            View
          </a>
          {row.deletedAt ? (
            canCreate && (
              <button
                onClick={() => handleRestore(row.id, row.fdrNumber)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-emerald-300 dark:border-emerald-700 text-xs font-medium text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                title="Restore FDR"
              >
                <RotateCcw className="w-3 h-3" /> Restore
              </button>
            )
          ) : (
            canCreate && row.status === 'ACTIVE' && (
              <button
                onClick={() => handleDelete(row.id, row.fdrNumber)}
                className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-600 hover:border-rose-300 transition-colors"
                title="Soft Delete FDR"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )
          )}
        </div>
      ),
    },
  ];

  const statuses = [
    { label: 'All Statuses', value: '' },
    { label: 'ACTIVE', value: 'ACTIVE' },
    { label: 'NEAR MATURITY', value: 'NEAR_MATURITY' },
    { label: 'MATURED', value: 'MATURED' },
    { label: 'RENEWED', value: 'RENEWED' },
    { label: 'RELEASE REQUESTED', value: 'RELEASE_REQUESTED' },
    { label: 'RELEASED', value: 'RELEASED' },
    { label: 'CLOSED', value: 'CLOSED' },
    { label: 'DELETED / ARCHIVED', value: 'DELETED' },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">
              Fixed Deposit Records (FDRs)
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Institution-wise security deposits, lien records, and maturity monitoring.
            </p>
          </div>

          {canCreate && (
            <a href="/fdrs/new">
              <Button variant="primary" icon={Plus}>
                New FDR Entry
              </Button>
            </a>
          )}
        </div>

        {/* Tab Selection: Active vs Deleted */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          <button
            onClick={() => {
              setTab('active');
              setPage(1);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              tab === 'active'
                ? 'bg-[#0B1F4B] text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <span>Active Deposits</span>
            {tab === 'active' && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20">{total}</span>
            )}
          </button>
          <button
            onClick={() => {
              setTab('deleted');
              setPage(1);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              tab === 'deleted'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Deleted / Archived Records</span>
            {tab === 'deleted' && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20">{total}</span>
            )}
          </button>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by FDR number, institution name, or bank..."
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-[#0B1F4B]"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
            <select
              value={statusFilter}
              onChange={e => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full sm:w-48 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-[#0B1F4B]"
            >
              {statuses.map(s => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <DataTable
          columns={columns}
          data={fdrs}
          loading={loading}
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={setPage}
          emptyMessage={
            tab === 'deleted'
              ? 'No soft-deleted FDR records found.'
              : 'No fixed deposit records match your criteria.'
          }
        />
      </div>
    </AppLayout>
  );
}
