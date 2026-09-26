import { useRef, useState } from 'react'
import { ArrowUp, Paperclip, FolderKanban, X, Command, History } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEdithStore } from '../../store/useEdithStore'

export function CommandInput({compact=false}:{compact?:boolean}){
  const [value,setValue]=useState('')
  const [attachments,setAttachments]=useState<File[]>([])
  const [historyIndex,setHistoryIndex]=useState(-1)
  const submit=useEdithStore((s)=>s.submitGoal)
  const history=useEdithStore((s)=>s.commandHistory)
  const fileRef=useRef<HTMLInputElement>(null)
  const send = async () => {
    const v = value.trim()
    if (!v && !attachments.length) return

    let fullPrompt = v
    if (attachments.length > 0) {
      const fileContents = await Promise.all(
        attachments.map(async (file) => {
          try {
            const text = await file.text()
            return `\n=== Attached File: ${file.name} ===\n${text}\n`
          } catch {
            return `\n=== Attached File: ${file.name} ===\n[Error reading file]\n`
          }
        })
      )
      fullPrompt = `${v ? v + '\n\n' : ''}${fileContents.join('\n')}`
    }

    submit(fullPrompt)
    setValue('')
    setAttachments([])
    setHistoryIndex(-1)
    setTimeout(() => document.querySelectorAll('textarea').forEach((t) => (t.style.height = 'auto')), 10)
  }
  const add=(list:FileList|null)=>{if(list?.length)setAttachments((prev)=>[...prev,...Array.from(list)].slice(0,8))}
  const navigateHistory=(direction:1|-1)=>{
    if(!history.length)return
    const next=Math.max(-1,Math.min(history.length-1,historyIndex+direction))
    setHistoryIndex(next)
    if(next>=0)setValue(history[next]);else setValue('')
  }
  return <motion.div className={`command-box dynamic-command ${compact?'compact-command':''}`} layout onDragOver={(e)=>e.preventDefault()} onDrop={(e)=>{e.preventDefault();add(e.dataTransfer.files)}}>
    <div className="command-focus-line"/>
    <textarea value={value} onChange={(e)=>{setValue(e.target.value);e.target.style.height='auto';e.target.style.height=e.target.scrollHeight+'px';}} onKeyDown={(e)=>{
      if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}
      if(e.key==='ArrowUp'&&e.altKey){e.preventDefault();navigateHistory(1)}
      if(e.key==='ArrowDown'&&e.altKey){e.preventDefault();navigateHistory(-1)}
    }} placeholder={compact?'Ask a follow-up, test a query, or give VELIKY the next goal…':'Ask anything, test dummy queries, or dispatch goals (e.g. "hello", "system status", "analyze P-204")…'} rows={1}/>
    <AnimatePresence>{attachments.length>0&&<motion.div className="attachment-chips" initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}}>{attachments.map((file,i)=><span key={`${file.name}-${i}`}><Paperclip size={11}/>{file.name}<button onClick={()=>setAttachments((x)=>x.filter((_,j)=>j!==i))}><X size={11}/></button></span>)}</motion.div>}</AnimatePresence>
    <div className="command-tools"><div><button type="button" onClick={()=>fileRef.current?.click()}><Paperclip size={15}/> Attach</button><span className="context-chip"><FolderKanban size={13}/> Workspace Context</span>{history.length>0&&<button type="button" className="history-hint" onClick={()=>navigateHistory(1)}><History size={13}/> History</button>}</div><button type="button" className="execute-button" disabled={!value.trim() && !attachments.length} onClick={send}>{compact?'Send':'Execute'} <ArrowUp size={15}/></button></div>
    <div className="command-shortcut"><Command size={11}/> Enter to execute · Shift+Enter newline · Alt+↑ history</div>
    <input ref={fileRef} type="file" hidden multiple onChange={(e)=>add(e.target.files)}/>
  </motion.div>
}
