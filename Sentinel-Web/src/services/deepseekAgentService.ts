/**
 * DeepSeek Sovereign Agent Engine Service for SENTINEL Web Workbench
 * Connects directly to local PyTorch / HuggingFace inference server (sentinel_llm_server on port 8000).
 * 100% of all answers are generated directly by the local LLM model itself.
 */

export interface DeepSeekAgentParams {
  prompt: string
  agentPersona: string // 'general' | 'code' | 'investigator' | 'sre' | 'researcher'
  model: string // e.g. 'Qwen/Qwen2.5-0.5B-Instruct'
  thinking: boolean // CoT mode ON/OFF
  files?: Array<{ name: string; path: string; content?: string }>
}

export interface DeepSeekAgentResult {
  success: boolean
  modelName: string
  agentPersona: string
  reasoning?: string // Chain-of-Thought
  text: string // Response content
  createdFiles?: Array<{ path: string; content: string }>
  executedCommands?: Array<{ command: string; output: string }>
  error?: string
}

const AGENT_SYSTEM_PROMPTS: Record<string, string> = {
  general: 'General Sovereign AI Assistant — Capable of multi-domain reasoning, code analysis, and technical explanations.',
  code: 'Code & Software Systems Engineer — Specialized in refactoring, AST parsing, and software architecture.',
  investigator: 'Industrial Reliability Investigator — Specialized in telemetry analysis and SOP verification.',
  sre: 'SRE & Cloud Ops Incident Agent — Specialized in infrastructure logs and runbook response.',
  researcher: 'Deep Research Agent — Specialized in knowledge vault graph navigation and document synthesis.',
}

const LOCAL_LLM_URL = 'http://127.0.0.1:8000/v1/chat/completions'
const DSH_HARNESS_URL = 'http://localhost:3080/api/v1/chat/completions'

export async function processDeepSeekAgentPrompt(params: DeepSeekAgentParams): Promise<DeepSeekAgentResult> {
  const { prompt, agentPersona = 'general', model = 'Qwen/Qwen2.5-0.5B-Instruct', thinking = true, files = [] } = params
  const personaDesc = AGENT_SYSTEM_PROMPTS[agentPersona] || AGENT_SYSTEM_PROMPTS.general

  const systemPrompt = `You are SENTINEL Sovereign AI Agent (${agentPersona.toUpperCase()} Persona: ${personaDesc}).
Answer the user's prompt directly, clearly, and accurately.
${thinking ? 'Provide step-by-step reasoning inside <thinking>...</thinking> tags before giving your final response.' : ''}
When creating files, use the format:
### File: path/to/file.ext
\`\`\`language
file content here
\`\`\``

  let workspaceContext = ''
  if (files && files.length > 0) {
    const filesWithContent = files.filter(f => f.content && f.content.trim())
    if (filesWithContent.length > 0) {
      workspaceContext = filesWithContent
        .slice(0, 10)
        .map(f => `=== File: ${f.path || f.name} ===\n${f.content?.slice(0, 4000)}`)
        .join('\n\n')
    }
  }

  const userMessage = workspaceContext
    ? `${workspaceContext}\n\nUser Request: ${prompt}`
    : prompt

  const bodyData = {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ],
    temperature: 0.3,
    max_tokens: 2048
  }

  // 120 second timeout for PyTorch CPU/GPU local LLM inference
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 120_000)

  try {
    const response = await fetch(LOCAL_LLM_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyData),
      signal: controller.signal
    }).catch(async () => {
      // Fallback attempt on port 3080 if 8000 is unavailable
      return fetch(DSH_HARNESS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData),
        signal: controller.signal
      })
    })

    clearTimeout(timeoutId)

    if (response && response.ok) {
      const data = await response.json()
      if (data && data.choices && data.choices[0]?.message?.content) {
        const rawText = data.choices[0].message.content
        return parseAgentOutput(rawText, model, agentPersona, thinking)
      }
    }
  } catch (err: any) {
    clearTimeout(timeoutId)
    if (err.name === 'AbortError') {
      return {
        success: false,
        modelName: model,
        agentPersona,
        text: '',
        error: 'Local LLM inference timed out (exceeded 120s limit). Please try again or use a smaller model.'
      }
    }
  }

  return {
    success: false,
    modelName: model,
    agentPersona,
    text: '',
    error: 'Could not connect to local SENTINEL LLM server (sentinel_llm_server on port 8000). Ensure sentinel server is running.'
  }
}

function parseAgentOutput(rawText: string, model: string, agentPersona: string, thinking: boolean): DeepSeekAgentResult {
  let reasoning = ''
  let text = rawText

  const thinkingMatch = rawText.match(/<thinking>([\s\S]*?)<\/thinking>/i)
  if (thinkingMatch) {
    reasoning = thinkingMatch[1].trim()
    text = rawText.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '').trim()
  }

  const createdFiles: Array<{ path: string; content: string }> = []
  const mdMatches = Array.from(text.matchAll(/###\s+File:\s*([^\n]+)\s*\n```[a-zA-Z0-9_-]*\s*\n([\s\S]*?)\n```/g))
  for (const m of mdMatches) {
    createdFiles.push({ path: m[1].trim(), content: m[2] })
  }

  const xmlMatches = Array.from(text.matchAll(/<write_file\s+path=["\']([^"\']+)["\']>([\s\S]*?)<\/write_file>/g))
  for (const m of xmlMatches) {
    createdFiles.push({ path: m[1].trim(), content: m[2].trim() })
  }

  return {
    success: true,
    modelName: model,
    agentPersona,
    reasoning,
    text,
    createdFiles
  }
}
