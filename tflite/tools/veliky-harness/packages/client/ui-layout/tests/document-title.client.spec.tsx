// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { DocumentTitle } from '../src/client/DocumentTitle.tsx'

afterEach(() => {
  cleanup()
  document.title = ''
  vi.unstubAllEnvs()
})

describe('DocumentTitle', () => {
  it('projects a durable title and restores the product title', () => {
    vi.stubEnv('DSH_CLIENT_TITLE', 'Veliky Harness')
    document.title = 'stale title'
    const mounted = render(<DocumentTitle productTitle="Veliky Harness" />)
    expect(document.title).toBe('Veliky Harness')
    mounted.rerender(<DocumentTitle title="First title" productTitle="Veliky Harness" />)
    expect(document.title).toBe('First title — Veliky Harness')
    mounted.rerender(<DocumentTitle title="Revised title" productTitle="Veliky Harness" />)
    expect(document.title).toBe('Revised title — Veliky Harness')
    mounted.rerender(<DocumentTitle productTitle="Veliky Harness" />)
    expect(document.title).toBe('Veliky Harness')
    mounted.unmount()
    expect(document.title).toBe('Veliky Harness')
  })

  it('uses the generic title when the build provides no title', () => {
    vi.stubEnv('DSH_CLIENT_TITLE', '')
    delete process.env.DSH_CLIENT_TITLE
    const mounted = render(<DocumentTitle title="First title" productTitle="DSH Local Build" />)
    expect(document.title).toBe('First title — DSH Local Build')
    mounted.unmount()
    expect(document.title).toBe('DSH Local Build')
  })
})
