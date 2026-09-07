import { ChevronUp, CircleUserRound, FolderPlus, GitBranch, Cpu } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEdithStore } from '../../store/useEdithStore'
import { workspaces } from '../../mock/data'

export function ProjectBar(){
  const ws=useEdithStore((s)=>s.currentWorkspace)
  const open=useEdithStore((s)=>s.projectSwitcherOpen)
  const setOpen=useEdithStore((s)=>s.setProjectSwitcherOpen)
  const setProfile=useEdithStore((s)=>s.setProfileOpen)
  const plan=useEdithStore((s)=>s.plan)
  const state=useEdithStore((s)=>s.agentState)
  const done=plan.filter((p)=>p.status==='done').length
  const executionProgress=state==='idle'?ws?.progress??0:Math.round(done/Math.max(plan.length,1)*100)
  const launch=(id:string)=>{window.open(`${window.location.origin}${window.location.pathname}?workspace=${encodeURIComponent(id)}`,'_blank','noopener,noreferrer')}
  const options=ws?.source==='local'?[ws,...workspaces]:workspaces
  return <>
    <AnimatePresence>{open&&<motion.div className="project-popover" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:8}}>
      <div className="popover-title">SWITCH PROJECT <small>opens a new EDITH window</small></div>
      {options.map((w)=><button key={w.id} className="project-option" onClick={()=>w.source==='local'?window.open(window.location.href,'_blank','noopener,noreferrer'):launch(w.id)}><span className={ws?.id===w.id?'status-dot active':'status-dot'}/><span><b>{w.name}</b><em>{w.tech.slice(0,3).join(' · ')}</em></span><small>{w.progress}%</small></button>)}
      <button className="open-new" onClick={()=>useEdithStore.getState().setStage('picker')}><FolderPlus size={14}/>Open New Project</button>
    </motion.div>}</AnimatePresence>
    <footer className="projectbar upgraded">
      <div className="project-ident" style={{ flexDirection: 'row', gap: '8px' }}>
        <span className="status-dot active" style={{ width: 6, height: 6 }}/>
        <strong style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.2px' }}>{ws?.name??'Workspace'}</strong>
      </div>
      <div className="project-progress">
        <div className="progress-track" style={{ width: '150px', height: '2px' }}><motion.div animate={{width:`${executionProgress}%`}}/></div>
        <span style={{ fontSize: '10px' }}>{state==='idle'?`${executionProgress}% PROJECT`:`${executionProgress}% EXECUTION`}</span>
      </div>
      <div className="project-end" style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingRight: '16px' }}>
        <button className="switch-btn" onClick={()=>setOpen(!open)} style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
          Switch Project <ChevronUp size={13}/>
        </button>
        <button className="bottom-profile" onClick={()=>setProfile(true)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <CircleUserRound size={14}/>
        </button>
      </div>
    </footer>
  </>
}
