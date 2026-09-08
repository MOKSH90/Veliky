export interface LLMResponse {
  text: string
  modelName: string
  success: boolean
  error?: string
}

export const LIGHTWEIGHT_HF_MODELS = [
  { id: 'Qwen/Qwen2.5-Coder-1.5B-Instruct', name: 'Qwen 2.5 Coder (1.5B)', tag: 'Recommended • Fast Code' },
  { id: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B', name: 'DeepSeek R1 Distill (1.5B)', tag: 'Reasoning & Logic' },
  { id: 'meta-llama/Llama-3.2-1B-Instruct', name: 'Llama 3.2 (1B)', tag: 'Ultra-Lightweight' },
  { id: 'google/gemma-2-2b-it', name: 'Gemma 2 (2B)', tag: 'Google Lightweight' },
] as const

export async function queryHuggingFaceLLM(
  prompt: string,
  token: string,
  modelId: string = 'Qwen/Qwen2.5-Coder-1.5B-Instruct'
): Promise<LLMResponse> {
  const cleanToken = token ? token.trim() : ''

  if (!cleanToken) {
    return {
      success: false,
      modelName: 'No HF Token',
      text: '',
      error: 'Hugging Face User Access Token is required to query live models.'
    }
  }

  // Strategy 1: Hugging Face Router Chat Completions API (OpenAI compatible)
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 35000)

    const response = await fetch('https://router.huggingface.co/hf-inference/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cleanToken}`
      },
      body: JSON.stringify({
        model: modelId,
        messages: [
          {
            role: 'system',
            content: 'You are SENTINEL, a sovereign AI developer assistant. Provide direct, highly accurate responses with markdown formatting and complete code blocks.'
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 2048,
        temperature: 0.7
      }),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (response.ok) {
      const data = await response.json()
      const content = data.choices?.[0]?.message?.content
      if (content) {
        return {
          success: true,
          modelName: `${modelId.split('/')[1] || modelId} (HF Router)`,
          text: content
        }
      }
    } else {
      const errData = await response.json().catch(() => ({}))
      const errMsg = errData.error?.message || errData.error || `HTTP ${response.status}`
      
      if (response.status === 404 || response.status === 400 || (typeof errMsg === 'string' && errMsg.includes('loading'))) {
        console.warn('Strategy 1 failed, attempting Strategy 2:', errMsg)
      } else {
        return {
          success: false,
          modelName: modelId,
          text: '',
          error: `Hugging Face Error (${response.status}): ${errMsg}`
        }
      }
    }
  } catch (err: any) {
    console.warn('Strategy 1 request failed:', err)
  }

  // Strategy 2: Classic Hugging Face Model Inference API
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 35000)

    const formattedPrompt = `<|im_start|>system\nYou are SENTINEL, a sovereign AI developer assistant. Answer with markdown and code.<|im_end|>\n<|im_start|>user\n${prompt}<|im_end|>\n<|im_start|>assistant\n`

    const response = await fetch(`https://api-inference.huggingface.co/models/${modelId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cleanToken}`
      },
      body: JSON.stringify({
        inputs: formattedPrompt,
        parameters: {
          max_new_tokens: 1536,
          temperature: 0.7,
          return_full_text: false
        }
      }),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (response.ok) {
      const data = await response.json()
      let generatedText = ''
      if (Array.isArray(data) && data[0]?.generated_text) {
        generatedText = data[0].generated_text
      } else if (data.generated_text) {
        generatedText = data.generated_text
      }

      if (generatedText) {
        const cleanText = generatedText.replace(/^<\|im_start\|>assistant\n?/, '').trim()
        return {
          success: true,
          modelName: `${modelId.split('/')[1] || modelId} (HF Direct)`,
          text: cleanText
        }
      }
    } else {
      const errData = await response.json().catch(() => ({}))
      const errMsg = errData.error || errData.message || `HTTP ${response.status}`
      return {
        success: false,
        modelName: modelId,
        text: '',
        error: `Hugging Face Model Error (${response.status}): ${errMsg}`
      }
    }
  } catch (err: any) {
    return {
      success: false,
      modelName: modelId,
      text: '',
      error: `Network Error connecting to Hugging Face: ${err.message || err}`
    }
  }

  return {
    success: false,
    modelName: modelId,
    text: '',
    error: 'Failed to obtain response from Hugging Face model endpoints.'
  }
}

export async function testHFToken(token: string): Promise<{ success: boolean; message: string; username?: string }> {
  const cleanToken = token.trim()
  if (!cleanToken) {
    return { success: false, message: 'Please enter a token.' }
  }

  try {
    const res = await fetch('https://huggingface.co/api/whoami-v2', {
      headers: { Authorization: `Bearer ${cleanToken}` }
    })

    if (res.ok) {
      const data = await res.json()
      return {
        success: true,
        message: 'Token verified & active!',
        username: data.name || data.fullname || 'HF Developer'
      }
    } else {
      const errData = await res.json().catch(() => ({}))
      return {
        success: false,
        message: errData.error || errData.message || 'Invalid Hugging Face token.'
      }
    }
  } catch (err: any) {
    return {
      success: false,
      message: `Network error: ${err.message || err}`
    }
  }
}
