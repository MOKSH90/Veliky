import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUpRight, Clock3, History, X } from 'lucide-react'
import { useEdithStore } from '../../store/useEdithStore'

export function HistoryPanel(){
  const open=useEdithStore((state)=>state.historyOpen)
  const setOpen=useEdithStore((state)=>state.setHistoryOpen)
  const prompts=useEdithStore((state)=>state.commandHistory)
  const currentGoal=useEdithStore((state)=>state.currentGoal)
  const submit=useEdithStore((state)=>state.submitGoal)

  return <AnimatePresence>{open&&<motion.aside className="history-panel" initial={{opacity:0,x:16}} animate={{opacity:1,x:0}} exit={{opacity:0,x:16}} aria-label="Previous context history">
    <header className="history-panel-head"><div><span><History size={14}/></span><div><strong>Context history</strong><small>{prompts.length} previous {prompts.length===1?'prompt':'prompts'}</small></div></div><button type="button" onClick={()=>setOpen(false)} aria-label="Close history"><X size={16}/></button></header>
    {currentGoal&&<section className="history-current"><small>CURRENT CONTEXT</small><p>{currentGoal}</p></section>}
    <div className="history-list">
      {prompts.map((prompt,index)=><article key={`${prompt}-${index}`} className={prompt===currentGoal&&index===0?'current':''}>
        <div><Clock3 size={12}/><span>{index===0?'Most recent':`${index+1} prompts ago`}</span></div>
        <p>{prompt}</p>
        <button type="button" onClick={()=>{submit(prompt);setOpen(false)}}>Run again <ArrowUpRight size={12}/></button>
      </article>)}
      {!prompts.length&&<div className="history-empty"><History size={20}/><strong>No context history yet</strong><span>Your prompts will appear here after the first run.</span></div>}
    </div>
  </motion.aside>}</AnimatePresence>
}
