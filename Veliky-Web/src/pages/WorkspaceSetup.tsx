import { useEffect, useMemo, useRef, useState } from 'react'
import { FolderOpen, Upload, Check, LoaderCircle, GitBranch, Boxes, FileCode2, Sparkles, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { workspaces } from '../mock/data'
import { useEdithStore } from '../store/useEdithStore'

export function WorkspaceSetupPage() {
  const stage = useEdithStore((s) => s.stage)
  const selectWorkspace = useEdithStore((s) => s.selectWorkspace)
  const loadLocalWorkspace = useEdithStore((s) => s.loadLocalWorkspace)
  const setStage = useEdithStore((s) => s.setStage)
  const current = useEdithStore((s) => s.currentWorkspace)
  const indexing = useEdithStore((s) => s.isIndexingWorkspace)
  const graphNodes = useEdithStore((s) => s.graphNodes)
  const graphEdges = useEdithStore((s) => s.graphEdges)
  const [completed, setCompleted] = useState(0)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const initSteps = useMemo(() => [
    { label:'Directory loaded', detail: current?.fileCount ? `${current.fileCount} files discovered` : 'Workspace mounted' },
    { label:'Project structure analyzed', detail: `${graphNodes.length} context nodes mapped` },
    { label:'Relationships indexed', detail: `${graphEdges.length} workspace connections` },
    { label:'Git repository checked', detail: current?.gitDetected ? 'Repository metadata detected' : 'No Git metadata required' },
    { label:'Technologies detected', detail: current?.tech?.join(' · ') || 'Project profile ready' },
    { label:'Workspace context created', detail: 'Agent context boundary established' },
  ], [current, graphNodes.length, graphEdges.length])

  useEffect(() => {
    if (stage !== 'initializing') return
    setCompleted(0)
    const ids = initSteps.map((_, i) => window.setTimeout(() => setCompleted(i + 1), 150 + 170 * i))
    ids.push(window.setTimeout(() => setStage('workspace'), 1260))
    return () => ids.forEach(clearTimeout)
  }, [stage, setStage, initSteps])

  const openLocal = async (files: FileList | null) => {
    if (!files?.length) return
    await loadLocalWorkspace(files)
  }

  if (stage === 'initializing') return (
    <main className="setup-page init-screen">
      <div className="setup-grid-bg" />
      <motion.section className="init-panel dynamic" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}}>
        <div className="init-orbit" aria-hidden="true"><span/><span/><span/></div>
        <div className="eyebrow">INITIALIZING WORKSPACE</div>
        <h1>{current?.name}</h1>
        <p className="init-path">{current?.path}</p>
        <div className="init-list">
          {initSteps.map((step, i) => <motion.div key={step.label} className={i < completed ? 'init-row done' : i === completed ? 'init-row current' : 'init-row'} animate={{opacity:i <= completed ? 1 : .42}}>
            {i < completed ? <Check size={16}/> : i === completed ? <LoaderCircle className="spin" size={16}/> : <span className="dot-placeholder"/>}
            <span><b>{step.label}</b><small>{step.detail}</small></span>
          </motion.div>)}
        </div>
        <AnimatePresence>{completed === initSteps.length && <motion.div className="ready-line" initial={{opacity:0,y:6}} animate={{opacity:1,y:0}}><Sparkles size={14}/> VELIKY IS READY</motion.div>}</AnimatePresence>
      </motion.section>
    </main>
  )

  return (
    <main className="setup-page" onDragOver={(e)=>{e.preventDefault();setDragging(true)}} onDragLeave={()=>setDragging(false)} onDrop={(e)=>{e.preventDefault();setDragging(false);void openLocal(e.dataTransfer.files)}}>
      <div className="setup-grid-bg" />
      <section className="picker-wrap">
        <motion.div className="brand-word small" initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}}>VELIKY</motion.div>
        <div className="eyebrow centered">CHOOSE YOUR WORKSPACE</div>
        <motion.button className={`folder-drop ${dragging?'dragging':''}`} onClick={() => inputRef.current?.click()} whileHover={{y:-2}} whileTap={{scale:.995}}>
          <div className="folder-visual"><FolderOpen size={32}/><span className="folder-pulse"/></div>
          <strong>{indexing ? 'Reading Project…' : 'Open Project Folder'}</strong>
          <span>VELIKY will map files, project structure, and local relationships.</span>
          <small><Upload size={13}/> Select a folder or drag it here</small>
        </motion.button>
        <input ref={inputRef} className="hidden-input" type="file" multiple {...({ webkitdirectory: '' } as React.InputHTMLAttributes<HTMLInputElement>)} onChange={(e)=>void openLocal(e.target.files)}/>

        <div className="picker-capabilities">
          <span><FileCode2 size={13}/> File context</span>
          <span><GitBranch size={13}/> Git awareness</span>
          <span><Boxes size={13}/> Dependency graph</span>
        </div>

        <div className="recent-block">
          <div className="recent-title-row"><div className="eyebrow">RECENT WORKSPACES</div><small>Open in a separate VELIKY context</small></div>
          {workspaces.slice(0,3).map((w, i) => <motion.button className="recent-row" key={w.id} onClick={()=>selectWorkspace(w)} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{delay:.08*i}}>
            <span className="status-dot"/><span><b>{w.name}</b><em>{w.tech.slice(0,3).join(' · ')}</em></span><small>{w.path}</small><ArrowRight size={14}/>
          </motion.button>)}
        </div>
      </section>
    </main>
  )
}
