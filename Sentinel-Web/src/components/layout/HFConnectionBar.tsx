import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Key, Check, AlertCircle, RefreshCw, ExternalLink, ShieldCheck, ChevronDown } from 'lucide-react'
import { LIGHTWEIGHT_HF_MODELS, testHFToken } from '../../services/huggingfaceService'
import { HuggingFaceModal } from './HuggingFaceModal'

export function HFConnectionBar() {
  const [token, setToken] = useState('')
  const [savedToken, setSavedToken] = useState('')
  const [selectedModel, setSelectedModel] = useState('Qwen/Qwen2.5-Coder-1.5B-Instruct')
  const [testing, setTesting] = useState(false)
  const [status, setStatus] = useState<{ success?: boolean; message?: string }>({})
  const [modalOpen, setModalOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  useEffect(() => {
    const activeToken = localStorage.getItem('hf_token') || localStorage.getItem('HF_TOKEN') || ''
    const storedModel = localStorage.getItem('hf_selected_model') || 'Qwen/Qwen2.5-Coder-1.5B-Instruct'
    setSavedToken(activeToken)
    setToken(activeToken)
    setSelectedModel(storedModel)
  }, [])

  const handleQuickSave = async (tokenToSave?: string) => {
    const targetToken = (tokenToSave !== undefined ? tokenToSave : token).trim()
    if (!targetToken) {
      localStorage.removeItem('hf_token')
      localStorage.removeItem('HF_TOKEN')
      setSavedToken('')
      setStatus({ success: false, message: 'Token cleared.' })
      return
    }

    setTesting(true)
    setStatus({ message: 'Verifying with Hugging Face...' })
    
    const result = await testHFToken(targetToken)
    setTesting(false)

    if (result.success) {
      localStorage.setItem('hf_token', targetToken)
      localStorage.removeItem('HF_TOKEN')
      setSavedToken(targetToken)
      setStatus({ success: true, message: `Connected as @${result.username || 'Developer'}` })
    } else {
      setStatus({ success: false, message: result.message })
    }
  }

  const handleSelectModel = (modelId: string) => {
    setSelectedModel(modelId)
    localStorage.setItem('hf_selected_model', modelId)
    setDropdownOpen(false)
  }

  const maskedToken = savedToken ? `${savedToken.slice(0, 5)}...${savedToken.slice(-4)}` : ''
  const currentModelName = LIGHTWEIGHT_HF_MODELS.find(m => m.id === selectedModel)?.name || 'Qwen 2.5 Coder (1.5B)'

  return (
    <>
      <div className="hf-connection-bar border-b border-cyan-500/20 bg-[#070b14]/90 backdrop-blur-md px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-200 z-10 shadow-lg">
        {/* Left: Brand & Model Picker */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-gradient-to-r from-amber-500/10 via-cyan-500/10 to-purple-500/10 border border-cyan-500/30 px-2.5 py-1 rounded-full text-cyan-300 font-semibold shadow-inner">
            <Sparkles size={14} className="text-amber-400 animate-pulse" />
            <span className="tracking-wide">Hugging Face Real LLM</span>
          </div>

          {/* Model Selector Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center space-x-1.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-cyan-500/50 px-2.5 py-1 rounded-lg text-slate-200 transition-all font-mono text-[11px]"
            >
              <span className="text-cyan-400 font-bold">Model:</span>
              <span>{currentModelName}</span>
              <ChevronDown size={13} className={`text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-[#0a0e17] border border-cyan-500/40 rounded-xl shadow-2xl py-1.5 z-50 text-xs">
                <div className="px-3 py-1 text-[10px] uppercase font-mono font-bold text-slate-400 border-b border-slate-800">
                  Select Lightweight HF Model
                </div>
                {LIGHTWEIGHT_HF_MODELS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleSelectModel(m.id)}
                    className={`w-full text-left px-3 py-2 hover:bg-cyan-950/50 flex flex-col space-y-0.5 transition-colors ${selectedModel === m.id ? 'bg-cyan-950/80 border-l-2 border-cyan-400' : ''}`}
                  >
                    <div className="flex items-center justify-between font-semibold text-slate-100">
                      <span>{m.name}</span>
                      {selectedModel === m.id && <Check size={13} className="text-cyan-400" />}
                    </div>
                    <span className="text-[10px] text-cyan-400/80 font-mono">{m.tag}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Center: Token Connection Controls */}
        <div className="flex items-center space-x-2">
          {savedToken ? (
            <div className="flex items-center space-x-2 bg-emerald-950/40 border border-emerald-500/40 px-3 py-1 rounded-xl text-emerald-300">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-semibold text-[11px]">Token Active:</span>
              <span className="font-mono text-[11px] text-emerald-200">{maskedToken}</span>
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="ml-1 text-[10px] underline text-cyan-400 hover:text-cyan-300 font-medium"
              >
                Change
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                  <Key size={13} />
                </div>
                <input
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Paste HF Token (hf_...)"
                  className="pl-8 pr-2 py-1 bg-[#03060c] border border-slate-700 focus:border-cyan-400 rounded-lg text-[11px] font-mono text-slate-100 placeholder-slate-500 outline-none w-48 transition-all"
                />
              </div>

              <button
                type="button"
                onClick={() => handleQuickSave()}
                disabled={testing || !token.trim()}
                className="px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg text-[11px] transition-all flex items-center space-x-1 disabled:opacity-50"
              >
                {testing ? <RefreshCw size={12} className="animate-spin" /> : <span>Connect HF</span>}
              </button>
            </div>
          )}
        </div>

        {/* Right: Quick Token Link & Details Modal trigger */}
        <div className="flex items-center space-x-3 text-[11px]">
          {status.message && (
            <AnimatePresence mode="wait">
              <motion.span
                initial={{ opacity: 0, x: 5 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className={`font-semibold flex items-center space-x-1 ${status.success ? 'text-emerald-400' : 'text-amber-400'}`}
              >
                {status.success ? <Check size={12} /> : <AlertCircle size={12} />}
                <span>{status.message}</span>
              </motion.span>
            </AnimatePresence>
          )}

          <a
            href="https://huggingface.co/settings/tokens"
            target="_blank"
            rel="noreferrer"
            className="text-slate-400 hover:text-cyan-300 underline flex items-center space-x-1 transition-colors"
          >
            <span>Get Free HF Token</span>
            <ExternalLink size={11} />
          </a>

          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Configure HF Modal"
          >
            <ShieldCheck size={15} />
          </button>
        </div>
      </div>

      <HuggingFaceModal isOpen={modalOpen} onClose={() => {
        setModalOpen(false)
        const updated = localStorage.getItem('hf_token') || localStorage.getItem('HF_TOKEN') || ''
        setSavedToken(updated)
        setToken(updated)
      }} />
    </>
  )
}
