import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle, Clock3, ChevronRight, TerminalSquare, ShieldCheck, LoaderCircle, Circle, Radio, History } from 'lucide-react'
import { motion } from 'framer-motion'
import { useEdithStore } from '../../store/useEdithStore'
import { VelikyAgentPanel } from '../agent/VelikyAgentPanel'

export function ActivityView(){
  const activity=useEdithStore((s)=>s.activity)
  const logs=useEdithStore((s)=>s.executionLog)
  const goal=useEdithStore((s)=>s.currentGoal)
  const selected=useEdithStore((s)=>s.selectedActivityId)
  const setSelected=useEdithStore((s)=>s.setSelectedActivityId)
  const [mode,setMode]=useState<'current'|'history'>(logs.length?'current':'history')
  const currentSelected=selected?.startsWith('log:')?logs.find((l)=>`log:${l.id}`===selected):undefined
  const historic=activity.find((a)=>a.id===selected)

  useEffect(()=>{
    if(selected)return
    if(mode==='current'&&logs[0])setSelected(`log:${logs[0].id}`)
    if(mode==='history'&&activity[0])setSelected(activity[0].id)
  },[activity,logs,mode,selected,setSelected])

  return <div className="standard-view activity-view space-y-6">
    <header className="view-head activity-head">
      <div>
        <span className="eyebrow">SUBAGENT ENGINE & AUDIT LOGS</span>
        <h1>Agent Studio & Activity Logs</h1>
        <p>Managed subagents powered by Veliky Harness (`dsh`) and execution history.</p>
      </div>
      <div className="activity-tabs">
        <button className={mode==='current'?'active':''} onClick={()=>{setMode('current');if(logs[0])setSelected(`log:${logs[0].id}`)}} disabled={!logs.length}>
          <Radio size={13}/>Current session
        </button>
        <button className={mode==='history'?'active':''} onClick={()=>{setMode('history');if(activity[0])setSelected(activity[0].id)}}>
          <History size={13}/>History
        </button>
      </div>
    </header>

    {/* Veliky Harness Subagent Panel */}
    <VelikyAgentPanel />

    <div className="activity-grid upgraded">
      <section className="timeline">
        <div className="timeline-line"/>
        {mode==='current'?logs.map((log,i)=>(
          <motion.button key={log.id} className={selected===`log:${log.id}`?'activity-row selected live':'activity-row live'} onClick={()=>setSelected(`log:${log.id}`)} initial={{opacity:0,x:-5}} animate={{opacity:1,x:0}} transition={{delay:i*.04}}>
            <span className="activity-time">{log.time}</span>
            <span className={`activity-marker ${log.status}`}>{log.status==='done'?<CheckCircle2 size={16}/>:log.status==='error'?<XCircle size={16}/>:log.status==='running'?<LoaderCircle className="spin" size={15}/>:<Circle size={14}/>}</span>
            <div><strong>{log.label}</strong><span>{log.detail}</span></div>
            <ChevronRight size={15}/>
          </motion.button>
        )):activity.map((a)=>(
          <button key={a.id} className={selected===a.id?'activity-row selected':'activity-row'} onClick={()=>setSelected(a.id)}>
            <span className="activity-time">{a.time}</span>
            <span className={`activity-marker ${a.status==='Failed'?'failed':''}`}>{a.status==='Failed'?<XCircle size={16}/>:<CheckCircle2 size={16}/>}</span>
            <div><strong>{a.title}</strong><span>{a.status} · {a.detail}</span></div>
            <ChevronRight size={15}/>
          </button>
        ))}
      </section>

      <section className="activity-detail">
        {mode==='current'&&currentSelected?<><div className="detail-head"><span className="eyebrow">LIVE EXECUTION EVENT</span><h2>{currentSelected.label}</h2></div><dl><div><dt>Goal</dt><dd>{goal||'Workspace task'}</dd></div><div><dt>Status</dt><dd className={currentSelected.status==='error'?'bad':currentSelected.status==='done'?'good':''}>{currentSelected.status.toUpperCase()}</dd></div><div><dt>Context</dt><dd><code>{currentSelected.file||'Workspace context'}</code></dd></div><div><dt>Observed</dt><dd>{currentSelected.detail}</dd></div><div><dt>Time</dt><dd><Clock3 size={14}/>{currentSelected.time}</dd></div></dl></>:mode==='history'&&historic?<><div className="detail-head"><span className="eyebrow">EXECUTION</span><h2>{historic.title}</h2></div><dl><div><dt>Goal</dt><dd>Historical workspace action</dd></div><div><dt>Tool</dt><dd><code>{historic.tool}</code></dd></div><div><dt>Status</dt><dd>{historic.status}</dd></div><div><dt>Verification</dt><dd className={historic.verification==='FAILED'?'bad':historic.verification==='PASSED'?'good':''}><ShieldCheck size={14}/>{historic.verification}</dd></div><div><dt>Started</dt><dd><Clock3 size={14}/>{historic.started}</dd></div><div><dt>Finished</dt><dd><Clock3 size={14}/>{historic.finished}</dd></div></dl></>:<div className="empty-panel"><TerminalSquare size={25}/><strong>Select an event</strong><span>Inspect the action, context, timing, and verification result.</span></div>}
      </section>
    </div>
  </div>
}
