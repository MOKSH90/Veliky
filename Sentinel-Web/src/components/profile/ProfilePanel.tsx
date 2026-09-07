import { useEffect, useState } from 'react'
import { X, User, SlidersHorizontal, Monitor, Cpu, Plug, ShieldCheck, LockKeyhole, LogOut, ChevronRight, ChevronLeft, Check, Moon, Gauge, KeyRound } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEdithStore } from '../../store/useEdithStore'

const rows=[[User,'Account'],[SlidersHorizontal,'Preferences'],[Monitor,'Appearance'],[Cpu,'Models'],[Plug,'Connected Services'],[ShieldCheck,'Permissions'],[LockKeyhole,'Security']] as const
type Section=typeof rows[number][1]

export function ProfilePanel(){
  const open=useEdithStore((s)=>s.profileOpen)
  const set=useEdithStore((s)=>s.setProfileOpen)
  const user=useEdithStore((s)=>s.authUser)
  const signOut=useEdithStore((s)=>s.signOut)
  const [section,setSection]=useState<Section|null>(null)
  const [reduceMotion,setReduceMotion]=useState(false)
  const [compact,setCompact]=useState(false)
  const [model,setModel]=useState('Automatic')
  useEffect(()=>{document.documentElement.classList.toggle('reduce-motion',reduceMotion);return()=>document.documentElement.classList.remove('reduce-motion')},[reduceMotion])
  useEffect(()=>{document.documentElement.classList.toggle('compact-ui',compact);return()=>document.documentElement.classList.remove('compact-ui')},[compact])

  const detail=section&&<div className="profile-detail">
    <button className="profile-back" onClick={()=>setSection(null)}><ChevronLeft size={14}/>{section}</button>
    {section==='Account'&&<><div className="setting-block"><span>Signed in as</span><b>{user?.name||'SENTINEL User'}</b><small>{user?.email||'Local demo identity'}</small></div><div className="setting-note"><Check size={13}/>Identity is used only for the current frontend session.</div></>}
    {section==='Preferences'&&<><label className="setting-switch"><span><b>Compact execution</b><small>Reduce vertical spacing in live actions.</small></span><input type="checkbox" checked={compact} onChange={(e)=>setCompact(e.target.checked)}/><i/></label><label className="setting-switch"><span><b>Reduce motion</b><small>Minimize non-essential UI animation.</small></span><input type="checkbox" checked={reduceMotion} onChange={(e)=>setReduceMotion(e.target.checked)}/><i/></label></>}
    {section==='Appearance'&&<><div className="setting-block"><span>Theme</span><b><Moon size={13}/>SENTINEL Dark</b><small>Black / charcoal with restrained system accent.</small></div><div className="setting-note"><Gauge size={13}/>Desktop density · {compact?'Compact':'Comfortable'}</div></>}
    {section==='Models'&&<div className="setting-block"><span>Agent model routing</span><select value={model} onChange={(e)=>setModel(e.target.value)}><option>Automatic</option><option>Fast</option><option>Reasoning</option><option>Local adapter</option></select><small>Frontend selection only until a model backend is connected.</small></div>}
    {section==='Connected Services'&&<><div className="service-row"><span className={user?.provider==='google'?'status-dot active':'status-dot'}/><div><b>Google Identity</b><small>{user?.provider==='google'?'Connected':'Demo mode'}</small></div></div><div className="service-row"><span className="status-dot"/><div><b>GitHub</b><small>Not connected</small></div></div></>}
    {section==='Permissions'&&<><div className="setting-block"><span>Workspace policy</span><b>Approval required</b><small>File-changing actions pause before execution in this prototype.</small></div><div className="setting-note"><ShieldCheck size={13}/>Controlled-action boundary enabled.</div></>}
    {section==='Security'&&<><div className="setting-block"><span>Session</span><b><KeyRound size={13}/>Frontend-only session</b><small>Production should validate Google credentials and sessions on the backend.</small></div></>}
  </div>

  return <AnimatePresence>{open&&<motion.aside className="profile-panel" initial={{opacity:0,x:18}} animate={{opacity:1,x:0}} exit={{opacity:0,x:18}}>
    <div className="profile-head"><div>{user?.picture?<img className="avatar image" src={user.picture} alt="Profile"/>:<span className="avatar">{(user?.name||'S').charAt(0).toUpperCase()}</span>}<div><strong>{user?.name||'SENTINEL User'}</strong><small>{user?.provider==='google'?user.email:'Local demo session'}</small></div></div><button className="icon-button" onClick={()=>set(false)}><X size={17}/></button></div>
    {section?detail:<><div className="profile-session"><span className="status-dot active"/><div><b>{user?.provider==='google'?'Google session connected':'Demo session'}</b><small>{user?.provider==='google'?'Identity available to the frontend':'Configure Google client ID for live OAuth'}</small></div></div><div className="profile-rows">{rows.map(([Icon,label])=><button key={label} onClick={()=>setSection(label)}><Icon size={16}/><span>{label}</span><ChevronRight size={13}/></button>)}</div><button className="signout" onClick={signOut}><LogOut size={16}/>Sign out</button></>}
  </motion.aside>}</AnimatePresence>
}
