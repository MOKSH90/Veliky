import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Key,
  Sparkles,
  X,
  Check,
  ExternalLink,
  ShieldCheck,
  Eye,
  EyeOff,
  RefreshCw,
  AlertCircle,
  CheckCircle2
} from 'lucide-react'

interface HuggingFaceModalProps {
  isOpen: boolean
  onClose: () => void
}

export function HuggingFaceModal({ isOpen, onClose }: HuggingFaceModalProps) {
  const [token, setToken] = useState('')
  const [showToken, setShowToken] = useState(false)
  const [saved, setSaved] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{
    success: boolean
    message: string
    username?: string
  } | null>(null)

  useEffect(() => {
    if (isOpen) {
      const existing = localStorage.getItem('hf_token') || localStorage.getItem('HF_TOKEN') || ''
      setToken(existing)
      setSaved(false)
      setTestResult(null)
      setShowToken(false)
    }
  }, [isOpen])

  const handleTestToken = async () => {
    const cleanToken = token.trim()
    if (!cleanToken) {
      setTestResult({
        success: false,
        message: 'Please enter a Hugging Face token to test.'
      })
      return
    }

    setTesting(true)
    setTestResult(null)

    try {
      const res = await fetch('https://huggingface.co/api/whoami-v2', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${cleanToken}`
        }
      })

      if (res.ok) {
        const data = await res.json()
        setTestResult({
          success: true,
          message: `Token valid & active! Connected to Hugging Face`,
          username: data.name || data.fullname || 'HF User'
        })
      } else {
        const errData = await res.json().catch(() => ({}))
        const errMsg = errData.error || errData.message || 'Invalid username or password'
        setTestResult({
          success: false,
          message: `Authentication failed: ${errMsg}. Please ensure token type is "Read".`
        })
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `Network error reaching Hugging Face: ${err.message || err}`
      })
    } finally {
      setTesting(false)
    }
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    const cleanToken = token.trim()
    if (cleanToken) {
      localStorage.setItem('hf_token', cleanToken)
      localStorage.removeItem('HF_TOKEN')
      setSaved(true)
      setTimeout(() => {
        setSaved(false)
        onClose()
      }, 1200)
    } else {
      handleRemove()
    }
  }

  const handleRemove = () => {
    localStorage.removeItem('hf_token')
    localStorage.removeItem('HF_TOKEN')
    setToken('')
    setSaved(false)
    setTestResult(null)
    onClose()
  }

  const maskedToken = token.trim()
    ? `${token.trim().slice(0, 4)}...${token.trim().slice(-4)}`
    : ''

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 15 }}
            className="w-full max-w-lg bg-[#0a0e17] border border-cyan-500/40 rounded-2xl p-6 shadow-2xl space-y-5 text-slate-100 relative overflow-hidden"
          >
            {/* Ambient Background Glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800/80 transition-colors"
            >
              <X size={18} />
            </button>

            {/* Header */}
            <div className="flex items-center space-x-3.5 border-b border-slate-800/80 pb-4">
              <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/30 shadow-inner">
                <Sparkles size={24} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100 tracking-wide flex items-center space-x-2">
                  <span>Hugging Face Access Token</span>
                </h3>
                <p className="text-xs text-slate-400">Stream Qwen2.5-Coder & open-source LLMs live</p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="space-y-4 pt-1">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    User Access Token
                  </label>
                  {maskedToken && (
                    <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded-md">
                      Active: {maskedToken}
                    </span>
                  )}
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Key size={16} />
                  </div>
                  <input
                    type={showToken ? 'text' : 'password'}
                    value={token}
                    onChange={(e) => {
                      setToken(e.target.value)
                      setTestResult(null)
                    }}
                    placeholder="hf_xxxxxxxxxxxxxxxxxxxxxxxx"
                    className="w-full pl-10 pr-10 py-3 bg-[#05080f] border border-slate-700/80 focus:border-cyan-400 rounded-xl text-sm text-slate-100 placeholder-slate-500 outline-none transition-all font-mono shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
                    title={showToken ? 'Hide token' : 'Show token'}
                  >
                    {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Validation Warnings */}
                {token.trim() && !token.trim().startsWith('hf_') && (
                  <div className="mt-2 text-[11px] text-amber-400 bg-amber-950/40 border border-amber-500/30 p-2.5 rounded-xl flex items-start space-x-2 font-medium">
                    <AlertCircle size={15} className="mt-0.5 shrink-0 text-amber-400" />
                    <span>
                      Tokens should start with <code className="bg-amber-900/60 px-1.5 py-0.5 rounded text-amber-200">hf_</code>. Do not enter your HF account login password.
                    </span>
                  </div>
                )}
              </div>

              {/* Test Connection Banner */}
              {testResult && (
                <div
                  className={`text-xs p-3 rounded-xl border flex items-start space-x-2 font-medium ${
                    testResult.success
                      ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300'
                      : 'bg-rose-950/50 border-rose-500/40 text-rose-300'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-400" />
                  ) : (
                    <AlertCircle size={16} className="mt-0.5 shrink-0 text-rose-400" />
                  )}
                  <div>
                    <p className="font-semibold">{testResult.message}</p>
                    {testResult.username && (
                      <p className="text-[11px] opacity-80 mt-0.5">
                        Connected as: <span className="font-bold">@{testResult.username}</span>
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Security Banner & Quick Link */}
              <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
                <div className="flex items-center space-x-2">
                  <ShieldCheck size={16} className="text-cyan-400 shrink-0" />
                  <span>Free read-access token</span>
                </div>
                <a
                  href="https://huggingface.co/settings/tokens"
                  target="_blank"
                  rel="noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center space-x-1 underline"
                >
                  <span>Get Free Token</span>
                  <ExternalLink size={13} />
                </a>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                <div>
                  {token.trim() && (
                    <button
                      type="button"
                      onClick={handleRemove}
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-950/50 border border-rose-500/30 transition-all"
                    >
                      Clear Token
                    </button>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleTestToken}
                    disabled={testing || !token.trim()}
                    className="px-3.5 py-2.5 rounded-xl text-xs font-semibold text-cyan-300 hover:text-cyan-200 bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/40 transition-all flex items-center space-x-1.5 disabled:opacity-50"
                  >
                    {testing ? (
                      <>
                        <RefreshCw size={14} className="animate-spin text-cyan-400" />
                        <span>Testing...</span>
                      </>
                    ) : (
                      <span>Test Connection</span>
                    )}
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all flex items-center space-x-1.5 shadow-lg shadow-cyan-500/25 active:scale-95"
                  >
                    {saved ? (
                      <>
                        <Check size={15} />
                        <span>Token Saved!</span>
                      </>
                    ) : (
                      <span>Save Token</span>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
