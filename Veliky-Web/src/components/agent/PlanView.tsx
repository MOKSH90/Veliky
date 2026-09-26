import { Check, Circle, LoaderCircle, X } from 'lucide-react'
import { motion } from 'framer-motion'
import { useEdithStore } from '../../store/useEdithStore'

export function PlanView(){
  const plan=useEdithStore((s)=>s.plan)
  const done=plan.filter((p)=>p.status==='done').length
  const progress=Math.round((done/Math.max(plan.length,1))*100)
  return <section className="plan-section dynamic-plan">
    <div className="plan-head"><div className="section-label">EXECUTION PLAN</div><span>{progress}%</span></div>
    <div className="plan-progress"><motion.i animate={{width:`${progress}%`}} transition={{type:'spring',stiffness:120,damping:24}}/></div>
    <div className="plan-list">{plan.map((p,i)=><motion.div className={`plan-step ${p.status}`} key={p.id} initial={{opacity:.35}} animate={{opacity:p.status==='pending'?.42:1,x:p.status==='active'?3:0}}>
      <span className="plan-index">{String(i+1).padStart(2,'0')}</span>
      {p.status==='done'?<Check size={14}/>:p.status==='active'?<LoaderCircle size={14} className="spin"/>:p.status==='failed'?<X size={14}/>:<Circle size={11}/>}<span>{p.label}</span>
    </motion.div>)}</div>
  </section>
}
