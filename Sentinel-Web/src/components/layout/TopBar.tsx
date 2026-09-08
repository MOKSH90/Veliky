import { CircleUserRound, ChevronRight, Activity as ActivityIcon, History, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { useEdithStore } from '../../store/useEdithStore'
import { HuggingFaceModal } from './HuggingFaceModal'

export function TopBar() {
  const [hfModalOpen, setHfModalOpen] = useState(false)
  const workspace=useEdithStore((s)=>s.currentWorkspace)
  const agentState=useEdithStore((s)=>s.agentState)
  const activeView=useEdithStore((s)=>s.activeView)
  const setActiveView=useEdithStore((s)=>s.setActiveView)
  const setProfileOpen=useEdithStore((s)=>s.setProfileOpen)
  const profileOpen=useEdithStore((s)=>s.profileOpen)
  const historyOpen=useEdithStore((s)=>s.historyOpen)
  const setHistoryOpen=useEdithStore((s)=>s.setHistoryOpen)
  const historyCount=useEdithStore((s)=>s.commandHistory.length)
  const user=useEdithStore((s)=>s.authUser)
  const ready=agentState==='idle'||agentState==='success'

  const hasHfToken = typeof window !== 'undefined' && Boolean(localStorage.getItem('hf_token') || localStorage.getItem('HF_TOKEN'))

  return (
    <>
      <header className="topbar upgraded">
        <button type="button" className="edith-logo" onClick={()=>setActiveView('agent')} aria-label="Open SENTINEL agent" aria-current={activeView==='agent'?'page':undefined}><span>SENTINEL</span><i/></button>
        <div className="top-project">
          <span>{workspace?.name||'Workspace'}</span><ChevronRight size={12}/><b>{activeView==='agent'?'Agent':activeView.charAt(0).toUpperCase()+activeView.slice(1)}</b>
        </div>
        <div className="top-actions">
          <motion.span className={`system-state ${ready?'ready':'busy'} state-${agentState}`} layout><ActivityIcon size={12}/><i/>{ready?(agentState==='success'?'VERIFIED':'READY'):agentState.replace('_',' ').toUpperCase()}</motion.span>
          <button
            type="button"
            className={`history-trigger ${hasHfToken ? 'active' : ''}`}
            onClick={() => setHfModalOpen(true)}
            title="Configure HuggingFace Key"
          >
            <Sparkles size={14} className="text-yellow-400" />
            <span>{hasHfToken ? 'HF Token Active' : 'HF Token'}</span>
          </button>
          <button type="button" className={historyOpen?'history-trigger active':'history-trigger'} onClick={()=>setHistoryOpen(!historyOpen)} aria-label="Open context history" aria-expanded={historyOpen}><History size={15}/><span>History</span>{historyCount>0&&<b>{historyCount}</b>}</button>
          <button className="profile-trigger" onClick={()=>setProfileOpen(!profileOpen)} title="Profile">{user?.picture?<img src={user.picture} alt=""/>:<CircleUserRound size={18}/>}<span>{user?.name?.split(' ')[0]||'Profile'}</span></button>
        </div>
      </header>
      <HuggingFaceModal isOpen={hfModalOpen} onClose={() => setHfModalOpen(false)} />
    </>
  )
}
