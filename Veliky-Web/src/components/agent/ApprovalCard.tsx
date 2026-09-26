import { AlertTriangle, ShieldCheck, FileWarning, CheckCircle2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { useEdithStore } from '../../store/useEdithStore'

export function ApprovalCard(){
  const approve=useEdithStore((s)=>s.approve)
  const reject=useEdithStore((s)=>s.reject)
  const activeFiles=useEdithStore((s)=>s.activeFiles)
  const target=activeFiles[activeFiles.length-1]||'workspace configuration'
  return <motion.section className="approval-card dynamic-approval" initial={{opacity:0,y:12,scale:.985}} animate={{opacity:1,y:0,scale:1}}>
    <div className="approval-title"><span className="approval-icon"><AlertTriangle size={17}/></span><div><b>ACTION REQUIRES YOUR APPROVAL</b><small>Execution is paused at the policy boundary.</small></div></div>
    <div className="approval-grid"><div><small>Target</small><code><FileWarning size={13}/>{target}</code></div><div><small>Risk</small><strong className="amber">MEDIUM</strong></div></div>
    <div className="approval-reason"><span>Reason</span><p>VELIKY has isolated a controlled change that can affect project behavior. Nothing further will execute until you approve it.</p></div>
    <div className="approval-verification"><CheckCircle2 size={14}/><span>After approval, VELIKY will validate the change and verify the requested outcome.</span></div>
    <div className="approval-actions"><button className="reject" onClick={reject}>Reject action</button><button className="approve" onClick={approve}><ShieldCheck size={15}/>Approve & continue</button></div>
  </motion.section>
}
