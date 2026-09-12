import { test } from 'node:test'
import assert from 'node:assert/strict'
import { apply, stable } from './policy.mjs'

function setup() {
  const handlers = new Map()
  let guard
  apply({tools: {guard(fn) { guard = fn }}, on(event, fn) { handlers.set(event, fn) }})
  return {handlers, get guard() { return guard }}
}

test('deny non-SENTINEL capabilities including shell and delegation', () => {
  const state = setup()
  for (const name of ['bash','run_code','spawn_agent','web_search','mcp__other__read','mcp__sentinel__delete']) assert.match(state.guard({name}), /BLOCKED/)
  assert.equal(state.guard({name:'mcp__sentinel__read_vault_note'}), undefined)
})

test('writes ask about exact content; downstream denials remain authoritative', async () => {
  const {handlers} = setup()
  const hook = handlers.get('tools/pre-execute')
  const exec = {name:'mcp__sentinel__write_vault_note',arguments:{content:'review this',expected_sha256:'old'}}
  const ask = await hook(exec, async () => ({kind:'allow'}))
  assert.equal(ask.kind,'ask')
  assert.match(ask.reason,/review this/)
  assert.deepEqual(await hook(exec,async () => ({kind:'deny',reason:'policy'})),{kind:'deny',reason:'policy'})
  assert.equal((await hook({name:'mcp__sentinel__read_document'},async () => ({kind:'allow'}))).kind,'allow')
})

test('only exact report verified in this turn may complete; failed verification revokes success', async () => {
  const {handlers} = setup()
  const report = {executive_summary:'source-backed',verification:{status:'VERIFIED'}}
  let text = JSON.stringify(report)
  const agent = {session:{snapshotEvents:() => [{type:'assistant/message',data:{message:{content:[{type:'text',text}]}}}]}}
  const stop = () => handlers.get('agent/turn-stopping')({agent})
  assert.throws(stop,/verification gate/)
  handlers.get('tools/result')({agent,name:'mcp__sentinel__verify_evidence'}, {isError:false,value:{structuredContent:{status:'VERIFIED',report}}})
  assert.doesNotThrow(stop)
  text = JSON.stringify({...report,executive_summary:'invented after verification'})
  assert.throws(stop,/verification gate/)
  text = JSON.stringify(report)
  await handlers.get('agent/pre-step')({agent,step:1},async () => ({kind:'enter'}))
  assert.throws(stop,/verification gate/)
  handlers.get('tools/result')({agent,name:'mcp__sentinel__verify_evidence'}, {isError:false,value:{structuredContent:{status:'VERIFIED',report}}})
  handlers.get('tools/result')({agent,name:'mcp__sentinel__verify_evidence'}, {isError:true})
  assert.throws(stop,/verification gate/)
})

test('canonical object order does not alter report identity', () => {
  assert.equal(stable({b:[{y:2,x:1}],a:0}), stable({a:0,b:[{x:1,y:2}]}))
})

test('capability mode cannot claim completion without real tool evidence', async () => {
  const previous = process.env.SENTINEL_MODE
  process.env.SENTINEL_MODE = 'capability'
  try {
    const {handlers} = setup()
    const agent = {}
    const stop = () => handlers.get('agent/turn-stopping')({agent})
    assert.throws(stop, /capability evidence gate/)
    handlers.get('tools/result')({agent,name:'mcp__sentinel__request_capability'},
      {isError:false,value:{structuredContent:{status:'pending_approval'}}})
    assert.doesNotThrow(stop)
    await handlers.get('agent/pre-step')({agent,step:1},async () => ({}))
    assert.throws(stop, /capability evidence gate/)
    handlers.get('tools/result')({agent,name:'mcp__sentinel__request_capability'}, {isError:true})
    assert.throws(stop, /capability evidence gate/)
  } finally {
    if (previous === undefined) delete process.env.SENTINEL_MODE
    else process.env.SENTINEL_MODE = previous
  }
})
