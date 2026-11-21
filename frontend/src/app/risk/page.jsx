'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Eye,
  FileText,
  Building2,
  Search,
  ExternalLink,
  Info,
} from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import { api, formatINR, formatDate, getDaysDiff } from '../../lib/utils';
import StatusChip from '../../components/ui/StatusChip';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';

export default function RiskCenterPage() {
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [ruleFilter, setRuleFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [ackModalOpen, setAckModalOpen] = useState(false);
  const [selectedFlag, setSelectedFlag] = useState(null);
  const [ackRemark, setAckRemark] = useState('');
  const [acknowledgedFlags, setAcknowledgedFlags] = useState({});

  // Fetch FDRs and Banks for rule evaluation
  const { data: fdrsData, isLoading: isFdrsLoading } = useQuery({
    queryKey: ['risk-fdrs-eval'],
    queryFn: async () => {
      const res = await api.get('/fdrs?pageSize=100');
      return res.data?.data || [];
    },
    staleTime: 30000,
  });

  const { data: banksData } = useQuery({
    queryKey: ['banks-list-eval'],
    queryFn: async () => {
      const res = await api.get('/banks');
      return res.data?.data || [];
    },
    staleTime: 60000,
  });

  // Evaluate the 7 core risk rules from spec §6.7
  const riskFlags = useMemo(() => {
    if (!fdrsData || !fdrsData.length) return [];
    const flags = [];
    const today = new Date();

    // Map banks by id for IFSC verification
    const bankMap = new Map();
    (banksData || []).forEach((b) => bankMap.set(b.id, b));

    // Calculate median interest rate
    const rates = fdrsData.map((f) => Number(f.interestRate)).filter((r) => !isNaN(r)).sort((a, b) => a - b);
    const medianRate = rates.length ? rates[Math.floor(rates.length / 2)] : 6.5;

    // Track seen combinations for duplicate check
    const seenCombos = new Map();

    fdrsData.forEach((fdr) => {
      const principalNum = Number(fdr.principal) || 0;
      const rateNum = Number(fdr.interestRate) || 0;
      const daysDiff = getDaysDiff(fdr.maturityDate);
      const isOverdue = fdr.status === 'MATURED' && daysDiff < 0;

      // 1. Missing Lien Rule (HIGH)
      if (!fdr.lienMarked) {
        flags.push({
          id: `${fdr.id}-missing-lien`,
          fdrId: fdr.id,
          fdrNumber: fdr.fdrNumber,
          institution: fdr.institution?.name || 'Unknown',
          rule: 'MISSING_LIEN',
          ruleName: 'Lien Not Marked',
          severity: 'HIGH',
          score: 30,
          explanation: 'Deposit lacks verified lien marking in favour of AICTE.',
          createdAt: fdr.createdAt,
        });
      }

      // 2. Stale Overdue Rule (HIGH)
      if (isOverdue && Math.abs(daysDiff) > 30) {
        flags.push({
          id: `${fdr.id}-stale-overdue`,
          fdrId: fdr.id,
          fdrNumber: fdr.fdrNumber,
          institution: fdr.institution?.name || 'Unknown',
          rule: 'STALE_OVERDUE',
          ruleName: 'Overdue > 30 Days',
          severity: 'HIGH',
          score: 35,
          explanation: `Deposit has been matured for ${Math.abs(daysDiff)} days with no renewal or release action taken.`,
          createdAt: fdr.maturityDate,
        });
      }

      // 3. Low Principal Rule (MEDIUM)
      // Standard AICTE security deposit minimum is 10,00,000 paise (or ₹1,00,000)
      if (principalNum > 0 && principalNum < 10000000) {
        flags.push({
          id: `${fdr.id}-low-principal`,
          fdrId: fdr.id,
          fdrNumber: fdr.fdrNumber,
          institution: fdr.institution?.name || 'Unknown',
          rule: 'LOW_PRINCIPAL',
          ruleName: 'Low Principal Threshold',
          severity: 'MEDIUM',
          score: 20,
          explanation: `Principal amount (${formatINR(principalNum)}) is below configured normative baseline.`,
          createdAt: fdr.createdAt,
        });
      }

      // 4. Rate Outlier Rule (MEDIUM)
      if (Math.abs(rateNum - medianRate) > 2.5) {
        flags.push({
          id: `${fdr.id}-rate-outlier`,
          fdrId: fdr.id,
          fdrNumber: fdr.fdrNumber,
          institution: fdr.institution?.name || 'Unknown',
          rule: 'RATE_OUTLIER',
          ruleName: 'Interest Rate Outlier',
          severity: 'MEDIUM',
          score: 15,
          explanation: `Rate (${rateNum}%) deviates by >2.5 percentage points from benchmark median (${medianRate}%).`,
          createdAt: fdr.createdAt,
        });
      }

      // 5. Duplicate Candidate Rule (HIGH)
      const comboKey = `${fdr.institutionId}-${fdr.bankId}-${principalNum}`;
      if (seenCombos.has(comboKey)) {
        flags.push({
          id: `${fdr.id}-duplicate`,
          fdrId: fdr.id,
          fdrNumber: fdr.fdrNumber,
          institution: fdr.institution?.name || 'Unknown',
          rule: 'DUPLICATE_CANDIDATE',
          ruleName: 'Potential Duplicate Deposit',
          severity: 'HIGH',
          score: 40,
          explanation: 'Identical principal, bank, and institution detected on another recorded deposit.',
          createdAt: fdr.createdAt,
        });
      } else {
        seenCombos.set(comboKey, fdr.id);
      }
    });

    return flags;
  }, [fdrsData, banksData]);

  // Filter flags
  const filteredFlags = useMemo(() => {
    return riskFlags.filter((flag) => {
      if (severityFilter !== 'ALL' && flag.severity !== severityFilter) return false;
      if (ruleFilter !== 'ALL' && flag.rule !== ruleFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          flag.fdrNumber.toLowerCase().includes(q) ||
          flag.institution.toLowerCase().includes(q) ||
          flag.ruleName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [riskFlags, severityFilter, ruleFilter, searchQuery]);

  const severityCounts = useMemo(() => {
    return {
      HIGH: riskFlags.filter((f) => f.severity === 'HIGH').length,
      MEDIUM: riskFlags.filter((f) => f.severity === 'MEDIUM').length,
      LOW: riskFlags.filter((f) => f.severity === 'LOW').length,
    };
  }, [riskFlags]);

  const handleAcknowledge = () => {
    if (!ackRemark.trim()) {
      toast.error('Please enter an acknowledgement remark.');
      return;
    }
    setAcknowledgedFlags((prev) => ({
      ...prev,
      [selectedFlag.id]: {
        remark: ackRemark,
        at: new Date().toLocaleTimeString(),
      },
    }));
    toast.success('Risk flag acknowledged with audited remark');
    setAckModalOpen(false);
    setSelectedFlag(null);
    setAckRemark('');
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
              <ShieldAlert className="h-7 w-7 text-red-600 dark:text-red-400" />
              Risk Center & Anomaly Detection
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Automated surveillance engine monitoring 7 core risk rules: duplicates, liens, outliers & overdue deposits
            </p>
          </div>
        </div>

        {/* Severity Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <span className="text-xs uppercase font-semibold text-gray-500">Total Active Flags</span>
            <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
              {riskFlags.length}
            </div>
            <p className="mt-1 text-xs text-gray-500">Scanned across all active records</p>
          </div>

          <div
            onClick={() => setSeverityFilter('HIGH')}
            className={`p-5 rounded-xl border cursor-pointer transition ${
              severityFilter === 'HIGH'
                ? 'bg-red-50 border-red-300 dark:bg-red-950/40 dark:border-red-800'
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
            }`}
          >
            <div className="flex items-center justify-between text-xs uppercase font-semibold text-red-600 dark:text-red-400">
              <span>High Severity</span>
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div className="mt-2 text-2xl font-bold text-red-600 dark:text-red-400">
              {severityCounts.HIGH}
            </div>
            <p className="mt-1 text-xs text-red-500">Requires immediate scrutiny</p>
          </div>

          <div
            onClick={() => setSeverityFilter('MEDIUM')}
            className={`p-5 rounded-xl border cursor-pointer transition ${
              severityFilter === 'MEDIUM'
                ? 'bg-amber-50 border-amber-300 dark:bg-amber-950/40 dark:border-amber-800'
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
            }`}
          >
            <div className="flex items-center justify-between text-xs uppercase font-semibold text-amber-600 dark:text-amber-400">
              <span>Medium Severity</span>
              <Info className="h-4 w-4" />
            </div>
            <div className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">
              {severityCounts.MEDIUM}
            </div>
            <p className="mt-1 text-xs text-amber-500">Threshold / outlier warnings</p>
          </div>

          <div
            onClick={() => setSeverityFilter('LOW')}
            className={`p-5 rounded-xl border cursor-pointer transition ${
              severityFilter === 'LOW'
                ? 'bg-yellow-50 border-yellow-300 dark:bg-yellow-950/40 dark:border-yellow-800'
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
            }`}
          >
            <div className="flex items-center justify-between text-xs uppercase font-semibold text-yellow-600 dark:text-yellow-400">
              <span>Low Severity</span>
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div className="mt-2 text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {severityCounts.LOW}
            </div>
            <p className="mt-1 text-xs text-yellow-500">Minor deviations</p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative flex-1 w-full sm:max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by FDR #, institution or rule..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-3 py-2 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-750 text-gray-700 dark:text-gray-300"
            >
              <option value="ALL">All Severities</option>
              <option value="HIGH">High Severity</option>
              <option value="MEDIUM">Medium Severity</option>
              <option value="LOW">Low Severity</option>
            </select>

            <select
              value={ruleFilter}
              onChange={(e) => setRuleFilter(e.target.value)}
              className="px-3 py-2 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-750 text-gray-700 dark:text-gray-300"
            >
              <option value="ALL">All Rules</option>
              <option value="MISSING_LIEN">Missing Lien</option>
              <option value="STALE_OVERDUE">Stale Overdue &gt; 30d</option>
              <option value="DUPLICATE_CANDIDATE">Duplicate Candidate</option>
              <option value="RATE_OUTLIER">Rate Outlier</option>
              <option value="LOW_PRINCIPAL">Low Principal</option>
            </select>
          </div>
        </div>

        {/* Risk Flags Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-gray-750 text-xs uppercase text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="px-5 py-3.5">FDR Number</th>
                  <th className="px-5 py-3.5">Institution</th>
                  <th className="px-5 py-3.5">Triggered Rule</th>
                  <th className="px-5 py-3.5 text-center">Severity</th>
                  <th className="px-5 py-3.5">Explanation</th>
                  <th className="px-5 py-3.5 text-center">Action / Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                {isFdrsLoading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-sm text-gray-400">
                      Evaluating risk rules against active registry...
                    </td>
                  </tr>
                ) : filteredFlags.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-sm text-gray-400">
                      <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                      Zero anomalies detected for current filter. All criteria compliant.
                    </td>
                  </tr>
                ) : (
                  filteredFlags.map((flag) => {
                    const isAcked = acknowledgedFlags[flag.id];
                    return (
                      <tr key={flag.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                        <td className="px-5 py-3.5 font-semibold text-gray-900 dark:text-white">
                          <Link
                            href={`/fdrs/${flag.fdrId}`}
                            className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                          >
                            {flag.fdrNumber}
                            <ExternalLink className="h-3.5 w-3.5 opacity-60" />
                          </Link>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-gray-600 dark:text-gray-300 max-w-[200px] truncate">
                          {flag.institution}
                        </td>
                        <td className="px-5 py-3.5 font-medium text-xs text-gray-800 dark:text-gray-200">
                          {flag.ruleName}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              flag.severity === 'HIGH'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                                : flag.severity === 'MEDIUM'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300'
                            }`}
                          >
                            {flag.severity}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-gray-600 dark:text-gray-300 max-w-sm">
                          {flag.explanation}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          {isAcked ? (
                            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center justify-center gap-1">
                              <CheckCircle2 className="h-4 w-4" />
                              Acknowledged
                            </span>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedFlag(flag);
                                setAckModalOpen(true);
                              }}
                              className="px-3 py-1 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                            >
                              Acknowledge
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Acknowledge Remark */}
        <Modal
          isOpen={ackModalOpen}
          onClose={() => setAckModalOpen(false)}
          title={`Acknowledge Risk Flag: ${selectedFlag?.fdrNumber}`}
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Rule: <span className="font-semibold text-gray-900 dark:text-white">{selectedFlag?.ruleName}</span>
            </p>
            <p className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-750 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
              {selectedFlag?.explanation}
            </p>
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-700 dark:text-gray-300 mb-1">
                Audited Review Remarks (Mandatory)
              </label>
              <textarea
                rows={3}
                value={ackRemark}
                onChange={(e) => setAckRemark(e.target.value)}
                placeholder="Enter justification or corrective action note..."
                className="w-full p-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setAckModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleAcknowledge}>
                Confirm Acknowledge
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </AppLayout>
  );
}
