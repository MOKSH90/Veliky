import { ShieldCheck, LockKeyhole, Sparkles, LoaderCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { useEdithStore } from '../store/useEdithStore'

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config:{client_id:string;callback:(response:{credential:string})=>void;auto_select?:boolean})=>void
          renderButton: (element:HTMLElement, options:Record<string,unknown>)=>void
          disableAutoSelect: ()=>void
        }
      }
    }
  }
}

function decodeGoogleCredential(token:string){
  try{
    const payload=token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')
    const parsed=JSON.parse(decodeURIComponent(Array.from(atob(payload)).map((c)=>`%${c.charCodeAt(0).toString(16).padStart(2,'0')}`).join('')))
    return {name:parsed.name||'Google User',email:parsed.email||'',picture:parsed.picture,provider:'google' as const}
  }catch{return null}
}

export function AuthPage() {
  const setAuthUser=useEdithStore((s)=>s.setAuthUser)
  const googleRef=useRef<HTMLDivElement>(null)
  const [googleReady,setGoogleReady]=useState(false)
  const [googleError,setGoogleError]=useState(false)
  const clientId=import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined

  useEffect(()=>{
    if(!clientId)return
    const setup=()=>{
      if(!window.google||!googleRef.current)return
      window.google.accounts.id.initialize({client_id:clientId,callback:(response)=>{
        const user=decodeGoogleCredential(response.credential)
        if(user)setAuthUser(user);else setGoogleError(true)
      }})
      googleRef.current.innerHTML=''
      window.google.accounts.id.renderButton(googleRef.current,{theme:'filled_black',size:'large',shape:'rectangular',text:'continue_with',width:320,logo_alignment:'left'})
      setGoogleReady(true)
    }
    const existing=document.querySelector('script[data-edith-google]') as HTMLScriptElement|null
    if(existing){if(window.google)setup();else existing.addEventListener('load',setup,{once:true});return}
    const script=document.createElement('script')
    script.src='https://accounts.google.com/gsi/client'
    script.async=true;script.defer=true;script.dataset.edithGoogle='true'
    script.onload=setup
    script.onerror=()=>setGoogleError(true)
    document.head.appendChild(script)
  },[clientId,setAuthUser])

  const demo=()=>setAuthUser({name:'SENTINEL User',email:'local@sentinel.dev',provider:'demo'})

  return (
    <main className="auth-page upgraded-auth">
      <div className="auth-grid-bg"/>
      <motion.div className="auth-core-mark" animate={{rotate:360}} transition={{duration:38,repeat:Infinity,ease:'linear'}} aria-hidden="true"><span/><span/><span/></motion.div>
      <motion.div className="auth-mark" initial={{ opacity: 0, scale: .97, y:10 }} animate={{ opacity: 1, scale: 1, y:0 }}>
        <div className="brand-word">SENTINEL</div>
        <div className="brand-rule" />
        <span className="eyebrow centered"><Sparkles size={11}/> SOVEREIGN WORKSPACE ENTRY</span>
        <h1>Sovereign Agentic AI Workbench</h1>
        <p>Autonomous, evidence-backed AI workspace for confidential enterprise work.</p>
        {clientId?<div className="google-auth-wrap"><div ref={googleRef} className="google-native-button"/>{!googleReady&&!googleError&&<span className="google-loading"><LoaderCircle className="spin" size={14}/> Loading Google authentication…</span>}{googleError&&<button className="google-button" onClick={demo}>Continue in local demo mode</button>}</div>:<div className="google-auth-wrap"><button className="google-button" onClick={demo} aria-label="Continue in local demo mode"><span className="google-g">G</span>Continue with Google <small>demo</small></button><em>Add VITE_GOOGLE_CLIENT_ID to enable live Google Identity Services.</em></div>}
        <div className="auth-links"><ShieldCheck size={14}/> Sovereignty <span>·</span> <LockKeyhole size={13}/> On-Premise Security</div>
      </motion.div>
      <div className="auth-corner">SENTINEL / SOVEREIGN WORKSPACE ACCESS</div>
    </main>
  )
}
