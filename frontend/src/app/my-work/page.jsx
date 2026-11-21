'use client';

import React, { useMemo } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import { useAuth } from '../../context/AuthContext';
import { api, formatINR, formatDate, getDaysDiff } from '../../lib/utils';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  RefreshCw,
  FileText,
  Send,
  ShieldCheck,
  Upload,
  Inbox,
  ArrowUpRight,
  Calendar,
  Building2,
  Briefcase,
} from 'lucide-react';

// ─── Urgency helpers ────────────────────────────────────────────────────────

function getUrgency(daysDiff) {
  if (daysDiff <= 0) return 'red';
  if (daysDiff <= 1) return 'orange';
  if (daysDiff <= 7) return 'yellow';
  return 'green';
}

const urgencyBorder = {
  red: 'border-l-red-500',
  orange: 'border-l-orange-400',
  yellow: 'border-l-yellow-400',
  green: 'border-l-emerald-500',
};

const urgencyBg = {
  red: 'bg-red-50 dark:bg-red-950/20',
  orange: 'bg-orange-50 dark:bg-orange-950/20',
  yellow: 'bg-yellow-50 dark:bg-yellow-950/20',
  green: 'bg-emerald-50 dark:bg-emerald-950/20',
};

const urgencyBadge = {
  red: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  green: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
};

function slaBadgeText(daysDiff) {
  if (daysDiff < 0) return `Overdue ${Math.abs(daysDiff)}d`;
  if (daysDiff === 0) return 'Due today';
  if (daysDiff <= 1) return `Due in ${Math.round(daysDiff * 24)}h`;
  return `Due in ${daysDiff}d`;
}

// ─── Action Card ─────────────────────────────────────────────────────────────

function ActionCard({ icon: Icon, title, subtitle, slaBadge, urgency, href, actionLabel = 'View' }) {
  const u = urgency || 'green';
  return (
    <div
      className={`flex items-start gap-4 p-4 rounded-xl border-l-4 ${urgencyBorder[u]} ${urgencyBg[u]} border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all`}
    >
      <div className={`mt-0.5 p-2 rounded-lg ${urgencyBadge[u]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{title}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{subtitle}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${urgencyBadge[u]}`}>{slaBadge}</span>
        {href && (
          <a
            href={href}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#0B1F4B] text-white hover:bg-[#1a3577] transition-colors"
          >
            {actionLabel} <ArrowUpRight className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="animate-pulse flex items-start gap-4 p-4 rounded-xl border-l-4 border-l-slate-200 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
      <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/5" />
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/5" />
      </div>
      <div className="w-16 h-6 bg-slate-200 dark:bg-slate-700 rounded-full" />
    </div>
  );
}

// ─── Section ─────────────────────────────────────────────────────────────────

function Section({ title, icon: Icon, children, loading, count }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-slate-500" />
        <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">{title}</h2>
        {count !== undefined && (
          <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {count}
          </span>
        )}
      </div>
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="space-y-2">{children}</div>
      )}
    </div>
  );
}

// ─── Fetch hooks ─────────────────────────────────────────────────────────────

function useFetch(url, enabled = true) {
  return useQuery({
    queryKey: [url],
    queryFn: () => api.get(url).then(r => r.data),
    staleTime: 30_000,
    enabled,
    retry: 1,
  });
}

// ─── Role-specific card builders ────────────────────────────────────────────

function FinanceOfficerSection({ nearMaturity, overdue, verificationQueue }) {
  const nearItems = nearMaturity?.data || [];
  const overdueItems = overdue?.data || [];
  const rejectedDocs = (verificationQueue?.data || []).filter(d => d.status === 'REJECTED');

  return (
    <>
      {overdueItems.length > 0 && (
        <Section title="Overdue FDRs — Act Now" icon={AlertTriangle} count={overdueItems.length}>
          {overdueItems.slice(0, 5).map(fdr => {
            const days = getDaysDiff(fdr.maturityDate);
            return (
              <ActionCard
                key={fdr.id}
                icon={AlertTriangle}
                title={`FDR ${fdr.fdrNumber} matured ${Math.abs(days)} day(s) ago`}
                subtitle={`${fdr.institution?.name} — ${fdr.bank?.name} — ${formatINR(fdr.principal, true)}`}
                slaBadge={slaBadgeText(days)}
                urgency="red"
                href={`/fdrs/${fdr.id}`}
                actionLabel="Renew"
              />
            );
          })}
        </Section>
      )}

      {nearItems.length > 0 && (
        <Section title="Near Maturity — Needs Renewal" icon={Clock} count={nearItems.length}>
          {nearItems.slice(0, 5).map(fdr => {
            const days = getDaysDiff(fdr.maturityDate);
            return (
              <ActionCard
                key={fdr.id}
                icon={RefreshCw}
                title={`FDR ${fdr.fdrNumber} matures in ${days} day(s)`}
                subtitle={`${fdr.institution?.name} — ${fdr.bank?.name} — ${formatINR(fdr.principal, true)}`}
                slaBadge={slaBadgeText(days)}
                urgency={getUrgency(days)}
                href={`/fdrs/${fdr.id}`}
                actionLabel="Renew"
              />
            );
          })}
        </Section>
      )}

      {rejectedDocs.length > 0 && (
        <Section title="Rejected Documents — Re-upload Required" icon={Upload} count={rejectedDocs.length}>
          {rejectedDocs.slice(0, 5).map(doc => (
            <ActionCard
              key={doc.id}
              icon={FileText}
              title={`Document rejected: ${doc.documentType || 'Unknown type'}`}
              subtitle={`FDR ${doc.fdr?.fdrNumber || '—'} — ${doc.rejectionRemark || 'See remarks'}`}
              slaBadge="Action required"
              urgency="red"
              href={`/fdrs/${doc.fdrId}`}
              actionLabel="Re-upload"
            />
          ))}
        </Section>
      )}
    </>
  );
}

function VerifierSection({ verificationQueue, submittedReleases }) {
  const pendingDocs = (verificationQueue?.data || []).filter(d => d.status === 'PENDING');
  const releasesData = submittedReleases?.data || [];

  return (
    <>
      {pendingDocs.length > 0 && (
        <Section title="Documents Pending Verification" icon={FileText} count={pendingDocs.length}>
          {pendingDocs.slice(0, 5).map(doc => (
            <ActionCard
              key={doc.id}
              icon={CheckCircle2}
              title={`Verify: ${doc.documentType || 'Document'}`}
              subtitle={`FDR ${doc.fdr?.fdrNumber || '—'} — Uploaded ${formatDate(doc.createdAt)}`}
              slaBadge="Pending"
              urgency="orange"
              href={`/documents`}
              actionLabel="Verify"
            />
          ))}
        </Section>
      )}

      {releasesData.length > 0 && (
        <Section title="Release Requests Awaiting Verification" icon={Send} count={releasesData.length}>
          {releasesData.slice(0, 5).map(rel => {
            const days = getDaysDiff(rel.createdAt);
            return (
              <ActionCard
                key={rel.id}
                icon={Send}
                title={`Release Request ${rel.referenceNumber || rel.id.slice(0, 8)}`}
                subtitle={`${rel.institution?.name || rel.fdr?.institution?.name || '—'} — ${formatINR(rel.amount, true)}`}
                slaBadge={slaBadgeText(0)}
                urgency="orange"
                href={`/releases/${rel.id}`}
                actionLabel="Verify"
              />
            );
          })}
        </Section>
      )}
    </>
  );
}

function ApprovingAuthoritySection({ verifiedReleases }) {
  const releases = verifiedReleases?.data || [];
  return (
    <Section title="Release Requests Awaiting Approval" icon={ShieldCheck} count={releases.length}>
      {releases.slice(0, 10).map(rel => (
        <ActionCard
          key={rel.id}
          icon={ShieldCheck}
          title={`Approve Release: ${rel.referenceNumber || rel.id.slice(0, 8)}`}
          subtitle={`${rel.institution?.name || rel.fdr?.institution?.name || '—'} — ${formatINR(rel.amount, true)}`}
          slaBadge="Awaiting approval"
          urgency="yellow"
          href={`/releases/${rel.id}`}
          actionLabel="Approve"
        />
      ))}
    </Section>
  );
}

function InstitutionUserSection({ nearMaturity, verificationQueue }) {
  const nearItems = nearMaturity?.data || [];
  const pendingDocs = (verificationQueue?.data || []).filter(d => d.status === 'PENDING');

  return (
    <>
      {nearItems.length > 0 && (
        <Section title="Your FDRs Near Maturity" icon={Calendar} count={nearItems.length}>
          {nearItems.slice(0, 5).map(fdr => {
            const days = getDaysDiff(fdr.maturityDate);
            return (
              <ActionCard
                key={fdr.id}
                icon={Calendar}
                title={`FDR ${fdr.fdrNumber} matures in ${days} day(s)`}
                subtitle={`${fdr.bank?.name} — ${formatINR(fdr.principal, true)}`}
                slaBadge={slaBadgeText(days)}
                urgency={getUrgency(days)}
                href={`/fdrs/${fdr.id}`}
              />
            );
          })}
        </Section>
      )}

      {pendingDocs.length > 0 && (
        <Section title="Your Pending Documents" icon={FileText} count={pendingDocs.length}>
          {pendingDocs.slice(0, 5).map(doc => (
            <ActionCard
              key={doc.id}
              icon={FileText}
              title={`Document under review: ${doc.documentType || 'Document'}`}
              subtitle={`FDR ${doc.fdr?.fdrNumber || '—'} — Submitted ${formatDate(doc.createdAt)}`}
              slaBadge="Under review"
              urgency="yellow"
              href={`/fdrs/${doc.fdrId}`}
            />
          ))}
        </Section>
      )}
    </>
  );
}

function SuperAdminSection({ nearMaturity, overdue }) {
  const nearItems = nearMaturity?.data || [];
  const overdueItems = overdue?.data || [];

  return (
    <>
      {overdueItems.length > 0 && (
        <Section title="System: Overdue FDRs" icon={AlertTriangle} count={overdueItems.length}>
          {overdueItems.slice(0, 5).map(fdr => {
            const days = getDaysDiff(fdr.maturityDate);
            return (
              <ActionCard
                key={fdr.id}
                icon={AlertTriangle}
                title={`Overdue: FDR ${fdr.fdrNumber} — ${fdr.institution?.name}`}
                subtitle={`${fdr.bank?.name} — ${formatINR(fdr.principal, true)} — Matured ${formatDate(fdr.maturityDate)}`}
                slaBadge={slaBadgeText(days)}
                urgency="red"
                href={`/fdrs/${fdr.id}`}
              />
            );
          })}
        </Section>
      )}

      {nearItems.length > 0 && (
        <Section title="System: Near Maturity FDRs" icon={Clock} count={nearItems.length}>
          {nearItems.slice(0, 5).map(fdr => {
            const days = getDaysDiff(fdr.maturityDate);
            return (
              <ActionCard
                key={fdr.id}
                icon={Building2}
                title={`${fdr.fdrNumber} — ${fdr.institution?.name}`}
                subtitle={`${fdr.bank?.name} — ${formatINR(fdr.principal, true)}`}
                slaBadge={slaBadgeText(days)}
                urgency={getUrgency(days)}
                href={`/fdrs/${fdr.id}`}
              />
            );
          })}
        </Section>
      )}
    </>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function MyWorkPage() {
  const { user } = useAuth();
  const role = user?.role;

  const needsNearMaturity = ['FINANCE_OFFICER', 'INSTITUTION_USER', 'SUPER_ADMIN'].includes(role);
  const needsOverdue = ['FINANCE_OFFICER', 'SUPER_ADMIN'].includes(role);
  const needsVerifQueue = ['FINANCE_OFFICER', 'VERIFIER', 'INSTITUTION_USER'].includes(role);
  const needsSubmittedReleases = role === 'VERIFIER';
  const needsVerifiedReleases = role === 'APPROVING_AUTHORITY';

  const nearMaturity = useFetch('/fdrs?status=NEAR_MATURITY&pageSize=20', needsNearMaturity);
  const overdue = useFetch('/fdrs?status=MATURED&pageSize=20', needsOverdue);
  const verificationQueue = useFetch('/documents/verification-queue', needsVerifQueue);
  const submittedReleases = useFetch('/releases?status=SUBMITTED&pageSize=20', needsSubmittedReleases);
  const verifiedReleases = useFetch('/releases?status=VERIFIED&pageSize=20', needsVerifiedReleases);

  const isLoading =
    (needsNearMaturity && nearMaturity.isLoading) ||
    (needsOverdue && overdue.isLoading) ||
    (needsVerifQueue && verificationQueue.isLoading) ||
    (needsSubmittedReleases && submittedReleases.isLoading) ||
    (needsVerifiedReleases && verifiedReleases.isLoading);

  const hasError =
    (needsNearMaturity && nearMaturity.isError) ||
    (needsOverdue && overdue.isError) ||
    (needsVerifQueue && verificationQueue.isError) ||
    (needsSubmittedReleases && submittedReleases.isError) ||
    (needsVerifiedReleases && verifiedReleases.isError);

  const totalItems = useMemo(() => {
    let count = 0;
    if (needsNearMaturity) count += (nearMaturity.data?.data || []).length;
    if (needsOverdue) count += (overdue.data?.data || []).length;
    if (needsVerifQueue) {
      const docs = verificationQueue.data?.data || [];
      count += docs.filter(d => d.status === 'PENDING' || d.status === 'REJECTED').length;
    }
    if (needsSubmittedReleases) count += (submittedReleases.data?.data || []).length;
    if (needsVerifiedReleases) count += (verifiedReleases.data?.data || []).length;
    return count;
  }, [nearMaturity.data, overdue.data, verificationQueue.data, submittedReleases.data, verifiedReleases.data, needsNearMaturity, needsOverdue, needsVerifQueue, needsSubmittedReleases, needsVerifiedReleases]);

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-[#FF9933]" />
              My Work
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Prioritized actions for your role — {role?.replace(/_/g, ' ')}
            </p>
          </div>
          {!isLoading && totalItems > 0 && (
            <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-[#0B1F4B] text-white">
              {totalItems} item{totalItems !== 1 ? 's' : ''} need attention
            </span>
          )}
        </div>

        {/* Error state */}
        {hasError && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
            Some data failed to load. Please refresh or check your connection.
          </div>
        )}

        {/* AUDITOR: read-only summary */}
        {role === 'AUDITOR' && (
          <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 text-center space-y-2">
            <ShieldCheck className="w-10 h-10 text-slate-400 mx-auto" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Audit Mode</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              As an Auditor, you have read-only access. No actions are required from you at this time.
              Use the navigation to review FDR records, releases, and audit trails.
            </p>
          </div>
        )}

        {/* Role content */}
        {role === 'FINANCE_OFFICER' && (
          <FinanceOfficerSection
            nearMaturity={nearMaturity.data}
            overdue={overdue.data}
            verificationQueue={verificationQueue.data}
          />
        )}

        {role === 'VERIFIER' && (
          <VerifierSection
            verificationQueue={verificationQueue.data}
            submittedReleases={submittedReleases.data}
          />
        )}

        {role === 'APPROVING_AUTHORITY' && (
          <ApprovingAuthoritySection verifiedReleases={verifiedReleases.data} />
        )}

        {role === 'INSTITUTION_USER' && (
          <InstitutionUserSection
            nearMaturity={nearMaturity.data}
            verificationQueue={verificationQueue.data}
          />
        )}

        {role === 'SUPER_ADMIN' && (
          <SuperAdminSection nearMaturity={nearMaturity.data} overdue={overdue.data} />
        )}

        {/* Empty state */}
        {!isLoading && !hasError && role !== 'AUDITOR' && totalItems === 0 && (
          <div className="p-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-center space-y-3">
            <div className="text-4xl">🎉</div>
            <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">You&apos;re all caught up!</p>
            <p className="text-sm text-emerald-600 dark:text-emerald-400">
              No pending actions at the moment. Check back later.
            </p>
          </div>
        )}

        {/* Loading skeleton full page */}
        {isLoading && (
          <div className="space-y-6">
            {[1, 2].map(s => (
              <div key={s} className="space-y-3">
                <div className="animate-pulse h-4 w-48 bg-slate-200 dark:bg-slate-700 rounded" />
                {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
