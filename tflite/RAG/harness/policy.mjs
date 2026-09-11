/** SENTINEL policy and mandatory verified-report completion, using public hooks. */
export const name = 'sentinel-policy'
export const inject = ['tools', 'approval']
const PREFIX = 'mcp__sentinel__'
export const names = ['search_documents', 'read_document', 'read_vault_note', 'get_vault_backlinks',
  'traverse_graph', 'analyze_equipment_drawing', 'calculate_metric', 'query_sensor_history',
  'verify_evidence', 'write_vault_note'].map(name => PREFIX + name)
const allowed = new Set(names)

export function stable(value) {
  if (Array.isArray(value)) return JSON.stringify(value.map(item => JSON.parse(stable(item))))
  if (value && typeof value === 'object') return JSON.stringify(Object.fromEntries(Object.keys(value).sort().map(key => [key, JSON.parse(stable(value[key]))])))
  return JSON.stringify(value)
}

export function apply(ctx) {
  const verified = new WeakMap()
  ctx.tools.guard(exec => allowed.has(exec.name) ? undefined : 'SENTINEL BLOCKED: only the approved industrial MCP tools may execute.')
  ctx.on('tools/pre-execute', async (exec, next) => {
    const decision = await next()
    if (decision.kind === 'deny' || decision.kind === 'ask') return decision
    if (exec.name === PREFIX + 'write_vault_note') {
      return { kind: 'ask', reason: 'Approve this exact vault note content and expected version:\n' + JSON.stringify(exec.arguments) }
    }
    return decision
  })
  ctx.on('agent/pre-step', async ({ agent, step }, next) => {
    if (step === 1) verified.delete(agent)
    return next()
  })
  ctx.on('tools/result', (exec, result) => {
    if (!exec.agent) return
    if (exec.name === PREFIX + 'verify_evidence') {
      verified.delete(exec.agent)
      const payload = result.isError ? undefined : result.value?.structuredContent
      if (payload?.status === 'VERIFIED' && payload.report?.verification?.status === 'VERIFIED') {
        verified.set(exec.agent, stable(payload.report))
      }
    } else if (exec.name === PREFIX + 'write_vault_note' && !result.isError) {
      verified.delete(exec.agent)
    }
  })
  ctx.on('agent/turn-stopping', ({ agent }) => {
    if (process.env.SENTINEL_MODE === 'chat') return
    const events = agent.session.snapshotEvents()
    const last = events.findLast(event => event.type === 'assistant/message')
    const text = last?.data?.message?.content?.filter(block => block.type === 'text').map(block => block.text).join('')
    let report
    try { report = JSON.parse(text) } catch { /* An unstructured answer cannot be independently checked. */ }
    if (!report || stable(report) !== verified.get(agent)) {
      throw new Error('SENTINEL verification gate: final output must be the exact JSON report returned by a successful verify_evidence call in this turn.')
    }
  })
}
