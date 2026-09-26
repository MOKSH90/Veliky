import React, { useState } from 'react'
import {
  Network,
  Layers,
  ArrowDown,
  CheckCircle2,
  Cpu,
  Database,
  Search,
  ShieldCheck,
  Terminal,
  Activity,
  Workflow,
  Sparkles,
} from 'lucide-react'
import { EDITH_SIX_LAYERS, type ArchitecturalLayer } from '../../mock/edithData'

export const EdithArchitecture: React.FC = () => {
  const [selectedLayer, setSelectedLayer] = useState<ArchitecturalLayer>(EDITH_SIX_LAYERS[0])

  return (
    <div className="edith-architecture-view">
      {/* Header */}
      <div className="edith-arch-header">
        <div className="edith-arch-header-left">
          <h1 className="edith-arch-title">
            Chapter 5: Six Architectural Layers Blueprint
          </h1>
          <p className="edith-arch-sub">
            The Complete Cognitive Architecture of the Goal-Driven Personal AI Operating System (Kurukshetra University, P.I.E.T.)
          </p>
        </div>
        <div className="edith-arch-header-badges">
          <span className="edith-badge-tag mono">Figure 1: Full System Blueprint</span>
          <span className="edith-badge-tag emerald">Strict Layer Decoupling</span>
        </div>
      </div>

      {/* Main 2-Column Blueprint Grid */}
      <div className="edith-arch-grid">
        {/* Left Column: 6-Layer Visual Stack */}
        <div className="edith-arch-stack-column">
          <div className="edith-arch-stack-title-row">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h2 className="edith-arch-stack-title">System Layer Hierarchy (Top to Bottom)</h2>
          </div>

          <div className="edith-layers-stack">
            {EDITH_SIX_LAYERS.map((layer) => {
              const isSelected = selectedLayer.layerNumber === layer.layerNumber
              return (
                <div
                  key={layer.layerNumber}
                  className={`edith-layer-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedLayer(layer)}
                  style={{
                    borderLeftColor: layer.color,
                  }}
                >
                  <div className="edith-layer-card-top">
                    <div className="edith-layer-title-wrap">
                      <span
                        className="edith-layer-number-badge"
                        style={{ backgroundColor: `${layer.color}22`, color: layer.color }}
                      >
                        Layer {layer.layerNumber}
                      </span>
                      <h3 className="edith-layer-name">{layer.name}</h3>
                    </div>
                    <span className="edith-layer-section-tag">
                      Sec. {layer.reportSection}
                    </span>
                  </div>

                  <p className="edith-layer-resp">{layer.responsibility}</p>

                  <div className="edith-layer-chips">
                    {layer.keyComponents.slice(0, 3).map((comp, idx) => (
                      <span key={idx} className="edith-layer-chip">
                        {comp}
                      </span>
                    ))}
                    {layer.keyComponents.length > 3 && (
                      <span className="edith-layer-chip more">
                        +{layer.keyComponents.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right Column: Layer Inspector & Data Flow Pipeline */}
        <div className="edith-arch-detail-column">
          {/* Layer Deep Dive Card */}
          <div className="edith-panel-card">
            <div className="edith-panel-header">
              <div className="edith-panel-title-wrap">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <h3 className="edith-panel-title">
                  Layer {selectedLayer.layerNumber}: {selectedLayer.name}
                </h3>
              </div>
              <span className="font-mono text-xs text-indigo-400">
                Report Section {selectedLayer.reportSection}
              </span>
            </div>

            <div className="edith-layer-detail-body">
              <div className="edith-detail-section">
                <h4 className="detail-heading">Core Architectural Mandate</h4>
                <p className="detail-text">{selectedLayer.responsibility}</p>
              </div>

              <div className="edith-detail-section">
                <h4 className="detail-heading">Registered Subsystems & Components</h4>
                <div className="edith-components-grid">
                  {selectedLayer.keyComponents.map((comp, cIdx) => (
                    <div key={cIdx} className="edith-component-item">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="font-mono text-xs text-slate-200">{comp}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 5.8: The Orchestrator Data Pipeline (Figure 1) */}
          <div className="edith-panel-card">
            <div className="edith-panel-header">
              <div className="edith-panel-title-wrap">
                <Workflow className="w-4 h-4 text-emerald-400" />
                <h3 className="edith-panel-title">
                  Section 5.8: The Orchestrator Data Pipeline
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">End-to-End Cycle</span>
            </div>

            <div className="edith-pipeline-flow-vertical">
              {[
                { step: '1. Intent Understanding', desc: 'Converts unstructured prompt to structured intent JSON', layer: 'Intelligence' },
                { step: '2. Context Hydration', desc: 'Pulls turn buffer, working registers, PostgreSQL facts, and vector chunks', layer: 'Memory & RAG' },
                { step: '3. Kahn DAG Decomposition', desc: 'Formulates task graph with explicit dependencies and critical path', layer: 'Intelligence' },
                { step: '4. Deterministic Policy Gate', desc: 'Validates 3-tier risk matrix before issuing any tool syscall', layer: 'Tools' },
                { step: '5. Sandboxed Tool Dispatch', desc: 'Executes operation with timeout and bounded filesystem isolation', layer: 'Execution' },
                { step: '6. Post-Condition Verification', desc: 'Deterministic assertion checks outcomes. Self-corrects if failed.', layer: 'Verification' },
                { step: '7. Ledger & Memory Commit', desc: 'Writes execution object to PostgreSQL and updates working memory', layer: 'Memory & Audit' },
              ].map((pipe, pIdx) => (
                <div key={pIdx} className="edith-pipe-step-card">
                  <div className="edith-pipe-step-num">{pIdx + 1}</div>
                  <div className="edith-pipe-step-info">
                    <div className="edith-pipe-step-title font-semibold text-slate-200">
                      {pipe.step}
                    </div>
                    <div className="edith-pipe-step-desc text-xs text-slate-400">
                      {pipe.desc}
                    </div>
                  </div>
                  <span className="edith-pipe-step-layer">{pipe.layer}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
