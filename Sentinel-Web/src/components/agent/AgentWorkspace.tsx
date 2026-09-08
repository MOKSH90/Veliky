import { RotateCcw, TerminalSquare, Network, Activity, FileCode2, ArrowRight, CheckCircle2, LoaderCircle, ShieldAlert, Bot } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { lazy, Suspense } from 'react'
import { CommandInput } from './CommandInput'
import { PlanView } from './PlanView'
import { ApprovalCard } from './ApprovalCard'
import { VerificationView } from './VerificationView'
import { MarkdownOutputCanvas } from './MarkdownOutputCanvas'
import { useEdithStore } from '../../store/useEdithStore'

const quickGoals = [
  'Write a Python script to sort a list of numbers using quicksort with comments.',
  'Explain async/await syntax in TypeScript with a practical example.',
  'Design a REST API structure for a user authentication microservice.',
]


const MobiusScene=lazy(()=>import('../mobius/MobiusScene').then((mod)=>({default:mod.MobiusScene})))

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
      </motion.div> : <motion.div key="work" className="execution-overlay" initial={{opacity:0,x:-18}} animate={{opacity:1,x:0}}>
        <div className="execution-head">
          <div>
            <span className="eyebrow">ACTIVE GOAL</span>
            <h1>{goal}</h1>
            <div className={`execution-state state-${state}`}><i/>{state.replace('_',' ')}</div>
          </div>
          <button className="quiet-btn" onClick={reset}><RotateCcw size={14}/>Reset</button>
        </div>

        {/* Prominent Agent Stream Log & Response Box */}
        <details open className="execution-stream-details">
          <summary className="execution-summary">
            {state === 'success' || state === 'failed' ? <CheckCircle2 size={14} className="action-success"/> : <LoaderCircle size={14} className="spin action-running"/>}
            <span>{state === 'success' ? 'Execution Completed' : 'Agent Executing...'} ({logs.length} events)</span>
          </summary>
          <div className="execution-log-list space-y-4 pt-3">
            {logs.map((log) => {
              const isUserPrompt = log.label.includes('User Prompt')
              const isAssistantResponse = log.label.includes('SENTINEL') || log.label.includes('Explanation') || log.label.includes('Assistant')

              if (isUserPrompt) {
                return (
                  <motion.div
                    key={log.id}
                    className="bg-blue-950/50 border border-blue-500/40 rounded-xl p-4 text-slate-100 flex items-start space-x-3.5 shadow-lg"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg shrink-0 border border-blue-500/30">
                      <TerminalSquare size={18} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">User Prompt</span>
                        <time className="text-[11px] text-slate-400 font-mono">{log.time}</time>
                      </div>
                      <p className="text-sm font-medium text-slate-100 mt-1.5 whitespace-pre-wrap leading-relaxed">{log.detail}</p>
                    </div>
                  </motion.div>
                )
              }

              if (isAssistantResponse) {
                return (
                  <motion.div key={log.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                    <MarkdownOutputCanvas label={log.label} detail={log.detail} time={log.time} file={log.file} />
                  </motion.div>
                )
              }

              return (
                <motion.div key={log.id} className={`execution-log ${log.status}`} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}>
                  <time>{log.time}</time>
                  <span className="log-node" />
                  <div>
                    <strong className="flex items-center space-x-1.5 text-cyan-400">
                      <Bot size={13} />
                      <span>{log.label}</span>
                    </strong>
                    <p className="text-slate-200 mt-1 leading-relaxed">{log.detail}</p>
                    {log.file && <code><FileCode2 size={11} />{log.file}</code>}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </details>

        {state==='waiting_approval'&&<ApprovalCard/>}
        {(state==='verifying'||state==='success')&&<VerificationView success={state==='success'}/>} 
        {state==='failed'&&<section className="failed-state"><strong>EXECUTION STOPPED</strong><span>No controlled changes were applied after rejection.</span></section>}
        {state==='success'&&<div className="success-actions"><button onClick={()=>setView('activity')}><Activity size={14}/>Open activity</button><button onClick={()=>setView('graph')}><Network size={14}/>Inspect graph</button></div>}
        <section className="follow-up-composer" style={{ marginTop: "24px", borderBottom: "none" }}><div className="section-label">FOLLOW-UP COMMAND</div><CommandInput compact/></section>
      </motion.div>}
    </AnimatePresence>
  </div>
}
