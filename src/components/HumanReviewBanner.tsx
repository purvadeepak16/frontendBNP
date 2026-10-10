import React from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

interface HumanReviewBannerProps {
  reviewerStatus?: string;
  reviewerNotes?: string;
}

export const HumanReviewBanner: React.FC<HumanReviewBannerProps> = ({
  reviewerStatus,
  reviewerNotes
}) => {
  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 px-4 py-3 text-amber-200">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-amber-300">
              AI-Generated Advisory — Requires Qualified Human Legal Review
            </span>
            <span className="text-xs text-amber-400/80">
              BNP Paribas Compliance Standard SOP-409
            </span>
          </div>
          <p className="text-xs text-amber-200/90 leading-relaxed">
            This assessment is a decision-support synthesis based on retrieved regulatory technical standards. It does not constitute formal legal counsel or binding regulatory authorization. Absence of a detected conflict is not proof of full compliance. All findings must be verified against current official regulatory rulebooks before production deployment.
          </p>
          {reviewerStatus && reviewerStatus !== 'pending_review' && (
            <div className="mt-2 flex items-center gap-2 pt-2 border-t border-amber-500/20 text-xs">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span className="text-slate-300">Compliance Review Status:</span>
              <span className="font-medium text-white capitalize">{reviewerStatus.replace(/_/g, ' ')}</span>
              {reviewerNotes && <span className="text-slate-400">· Notes: {reviewerNotes}</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
