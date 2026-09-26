import React from 'react'
import {
  AlertTriangle,
  FileCode2,
  Check,
  X,
  ShieldCheck,
  Lock,
  Layers,
  Clock,
  Info,
} from 'lucide-react'
import { useEdithAppStore } from '../../store/useEdithAppStore'

export const EdithApprovalModal: React.FC = () => {
  const {
    showApprovalModal,
    selectedApproval,
    closeApprovalModal,
    approveAction,
    rejectAction,
  } = useEdithAppStore()

  if (!showApprovalModal || !selectedApproval) return null

  return (
    <div className="edith-modal-overlay">
      <div className="edith-modal-box approval-modal">
        {/* Header */}
        <div className="edith-modal-header">
          <div className="edith-modal-title-wrap">
            <AlertTriangle className="w-5 h-5 text-amber-400 animate-pulse" />
            <div>
              <h3 className="edith-modal-title text-amber-300">
                Human-in-the-Loop Policy Gate Confirmation
              </h3>
              <span className="text-xs text-slate-400">
                Chapter 5.11 Risk Interception · Deterministic Policy Engine
              </span>
            </div>
          </div>
          <button className="edith-modal-close" onClick={closeApprovalModal}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="edith-approval-modal-body">
          {/* Top metadata grid */}
          <div className="edith-modal-meta-grid">
            <div className="edith-meta-block">
              <span className="meta-label">Tool Called:</span>
              <span className="meta-val font-mono text-cyan-300">
                <FileCode2 className="w-3.5 h-3.5 inline mr-1" />
                {selectedApproval.tool}()
              </span>
            </div>
            <div className="edith-meta-block">
              <span className="meta-label">Risk Tier:</span>
              <span className="meta-val font-bold text-amber-400">
                {selectedApproval.riskTier} RISK
              </span>
            </div>
            <div className="edith-meta-block">
              <span className="meta-label">Timestamp:</span>
              <span className="meta-val font-mono text-slate-300">
                {selectedApproval.timestamp}
              </span>
            </div>
            <div className="edith-meta-block">
              <span className="meta-label">Requester:</span>
              <span className="meta-val text-indigo-300">
                {selectedApproval.requester}
              </span>
            </div>
          </div>

          {/* Target Resource & Action */}
          <div className="edith-approval-detail-section">
            <div className="font-bold text-xs uppercase text-slate-400 mb-1">
              Target Resource:
            </div>
            <div className="font-mono text-cyan-400 bg-slate-900/80 p-2 rounded border border-slate-800 text-sm">
              {selectedApproval.targetResource}
            </div>
          </div>

          <div className="edith-approval-detail-section">
            <div className="font-bold text-xs uppercase text-slate-400 mb-1">
              Proposed Operation:
            </div>
            <p className="text-sm text-slate-200 leading-relaxed">
              {selectedApproval.proposedAction}
            </p>
          </div>

          <div className="edith-approval-detail-section">
            <div className="font-bold text-xs uppercase text-slate-400 mb-1">
              System Rationale:
            </div>
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/50 p-2.5 rounded border border-slate-800">
              {selectedApproval.rationale}
            </p>
          </div>

          {/* Decision Factors Checklist */}
          {selectedApproval.decisionFactors && (
            <div className="edith-approval-detail-section">
              <div className="font-bold text-xs uppercase text-slate-400 mb-2">
                Policy Interception Factors:
              </div>
              <div className="edith-decision-factors-list">
                {selectedApproval.decisionFactors.map((factor, fIdx) => (
                  <div key={fIdx} className="edith-factor-item">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                    <span className="text-xs text-slate-300">{factor}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Diff Preview */}
          {selectedApproval.diffPreview && (
            <div className="edith-approval-detail-section">
              <div className="font-bold text-xs uppercase text-slate-400 mb-1">
                Unified Diff Inspection:
              </div>
              <pre className="edith-modal-diff-pre font-mono text-xs">
                {selectedApproval.diffPreview}
              </pre>
            </div>
          )}
        </div>

        {/* Modal Actions Footer */}
        <div className="edith-modal-actions">
          <button
            type="button"
            className="edith-btn-reject"
            onClick={() => rejectAction(selectedApproval.id)}
          >
            <X className="w-4 h-4" />
            <span>Reject Call (Block)</span>
          </button>
          <button
            type="button"
            className="edith-btn-approve"
            onClick={() => approveAction(selectedApproval.id)}
          >
            <Check className="w-4 h-4" />
            <span>Approve & Dispatch Tool Call</span>
          </button>
        </div>
      </div>
    </div>
  )
}
