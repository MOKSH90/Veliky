import { CheckCircle2, LoaderCircle, ShieldCheck } from 'lucide-react'
import { motion } from 'framer-motion'

const checks=['Change boundary intact','Project responds normally','Validation completed','Goal outcome confirmed']
export function VerificationView({success=false}:{success?:boolean}){
  return <motion.section className={success?'verification success dynamic-verify':'verification dynamic-verify'} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}>
    <div className="section-label">VERIFICATION</div>
    <div className="verify-grid">{checks.map((label,i)=><motion.span key={label} initial={{opacity:.35}} animate={{opacity:success?1:.55+i*.1}} transition={{delay:i*.08}}>{success?<CheckCircle2 size={15}/>:<LoaderCircle className="spin slow" size={15}/>} {label}</motion.span>)}</div>
    {success&&<motion.div className="verified-success" initial={{scaleX:.6,opacity:0}} animate={{scaleX:1,opacity:1}}><ShieldCheck size={15}/> VERIFIED SUCCESS</motion.div>}
  </motion.section>
}
