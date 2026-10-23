import { describe, it, expect } from 'vitest'
import { GH_PR_EVENT_TYPES, isHeartbeatGHEvent } from '#shared/utils/heartbeat'

describe('isHeartbeatGHEvent', () => {
  it.each(['PushEvent', 'CreateEvent', 'DeleteEvent'])('drops %s', (type) => {
    expect(isHeartbeatGHEvent({ type, payload: {} })).toBe(false)
  })

  it('drops labeled issue events but keeps other issue actions', () => {
    expect(isHeartbeatGHEvent({ type: 'IssuesEvent', payload: { action: 'labeled' } })).toBe(false)
    expect(isHeartbeatGHEvent({ type: 'IssuesEvent', payload: { action: 'opened' } })).toBe(true)
  })

  it('drops events with no type and keeps everything else', () => {
    expect(isHeartbeatGHEvent({})).toBe(false)
    expect(isHeartbeatGHEvent({ type: 'WatchEvent' })).toBe(true)
  })

  it('never drops a pull request event type', () => {
    for (const type of GH_PR_EVENT_TYPES) expect(isHeartbeatGHEvent({ type, payload: { action: 'labeled' } })).toBe(true)
  })
})
