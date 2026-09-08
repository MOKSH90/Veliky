import { RotateCcw, TerminalSquare, Network, Activity, FileCode2, ArrowRight, CheckCircle2, LoaderCircle, ShieldAlert } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { lazy, Suspense } from 'react'
import { CommandInput } from './CommandInput'
import { PlanView } from './PlanView'
import { ApprovalCard } from './ApprovalCard'
import { VerificationView } from './VerificationView'
import { useEdithStore } from '../../store/useEdithStore'

const quickGoals=[
  'Analyze Pump P-204 vibration levels and prepare an inspection summary.',
  'Find abnormal pattern in maintenance reports and cross-check against SOP.',
  'Inspect equipment P&ID drawing and calculate vibration percentage change.',
]

const MobiusScene=lazy(()=>import('../mobius/MobiusScene').then((mod)=>({default:mod.MobiusScene})))

import { KnowledgeSourceDrawer } from '../knowledge/KnowledgeSourceDrawer'
import { DeepSeekAgentPanel } from './DeepSeekAgentPanel'

export function AgentWorkspace(){
  const state=useEdithStore((s)=>s.agentState)
  const goal=useEdithStore((s)=>s.currentGoal)
  const action=useEdithStore((s)=>s.currentAction)
  const reset=useEdithStore((s)=>s.resetAgent)
  const logs=useEdithStore((s)=>s.executionLog)
  const activeFiles=useEdithStore((s)=>s.activeFiles)
  const workspace=useEdithStore((s)=>s.currentWorkspace)
  const graphNodes=useEdithStore((s)=>s.graphNodes)
  const graphEdges=useEdithStore((s)=>s.graphEdges)
  const submit=useEdithStore((s)=>s.submitGoal)
  const setView=useEdithStore((s)=>s.setActiveView)
  const idle=state==='idle'

  return <div className={`agent-view ${idle?'idle':'working'} state-${state}`}>
    <div className="agent-grid-bg"/>
    <div className={idle?'mobius-layer':'mobius-layer working'} aria-label={`SENTINEL core visualization: ${state.replace('_',' ')}`}>
      <Suspense fallback={<div className="mobius-fallback" aria-hidden="true"/>}><MobiusScene state={state} dimmed={!idle}/></Suspense>
    </div>

    {idle&&<div className="core-readouts" aria-hidden="true">
      <div className="readout left"><span>CONTEXT</span><b>ONLINE</b><small>{workspace?.fileCount??graphNodes.filter((n)=>n.kind==='file').length} files indexed</small></div>
      <div className="readout right"><span>GRAPH</span><b>CONNECTED</b><small>{graphEdges.length} relationships</small></div>
    </div>}

    <AnimatePresence mode="wait">
      {idle ? <motion.div key="idle" className="idle-content" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0,y:-10}}>
        <div className="idle-copy">
          <h1>What do you want SENTINEL to accomplish?</h1>
        </div>
        <CommandInput/>
        <div className="quick-goals">{quickGoals.map((q,i)=><motion.button key={q} onClick={()=>submit(q)} initial={{opacity:0,y:5}} animate={{opacity:1,y:0}} transition={{delay:.08*i}}><span>{i+1}</span>{q}<ArrowRight size={12}/></motion.button>)}</div>

        {/* Phase 1 & 2 Integration: RAG Vault & DeepSeek Harness Agent Panel */}
        <div className="w-full max-w-5xl mx-auto space-y-6 pt-6 text-left">
          <DeepSeekAgentPanel />
          <KnowledgeSourceDrawer />
        </div>
      </motion.div> : <motion.div key="work" className="execution-overlay" initial={{opacity:0,x:-18}} animate={{opacity:1,x:0}}>
        <div className="execution-head"><div><span className="eyebrow">ACTIVE GOAL</span><h1>{goal}</h1><div className={`execution-state state-${state}`}><i/>{state.replace('_',' ')}</div></div><button className="quiet-btn" onClick={reset}><RotateCcw size={14}/>Reset</button></div>

        <details className="execution-stream-details">
          <summary className="execution-summary">
            {state === 'success' || state === 'failed' ? <CheckCircle2 size={14} className="action-success"/> : <LoaderCircle size={14} className="spin action-running"/>}
            <span>{state === 'success' ? 'Execution completed' : 'Executing actions...'} ({logs.length})</span>
          </summary>
          <div className="execution-log-list">{logs.map((log)=><motion.div key={log.id} className={`execution-log ${log.status}`} initial={{opacity:0,x:-6}} animate={{opacity:1,x:0}}>
          <time>{log.time}</time><span className="log-node"/><div><strong>{log.label}</strong><p>{log.detail}</p>{log.file&&<code><FileCode2 size={11}/>{log.file}</code>}</div>
        </motion.div>)}</div>
        </details>

        <div className="w-full max-w-4xl mx-auto space-y-4 pt-4 text-left">
          <DeepSeekAgentPanel />
        </div>

        {state==='waiting_approval'&&<ApprovalCard/>}
        {(state==='verifying'||state==='success')&&<VerificationView success={state==='success'}/>} 
        {state==='failed'&&<section className="failed-state"><strong>EXECUTION STOPPED</strong><span>No controlled changes were applied after rejection.</span></section>}
        {state==='success'&&<div className="success-actions"><button onClick={()=>setView('activity')}><Activity size={14}/>Open activity</button><button onClick={()=>setView('graph')}><Network size={14}/>Inspect graph</button></div>}
        <section className="follow-up-composer" style={{ marginTop: "24px", borderBottom: "none" }}><div className="section-label">FOLLOW-UP COMMAND</div><CommandInput compact/></section>
      </motion.div>}
    </AnimatePresence>
  </div>
}
