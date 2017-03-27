/* global describe it expect */
import { Context } from '../src/process'

describe('Context', () => {
  it('creates context', () => {
    const parent = new Context()
    expect(parent.parent).toBe(undefined)
    expect(parent.local).toBe(undefined)

    const child = new Context(parent)
    expect(child.parent).toBe(parent)
    expect(child.local).toBe(undefined)
  })

  it('set uses local if no parent', () => {
    const ctx = new Context()
    ctx.set('a', 1)
    expect(ctx.local).toEqual({ a: 1 })
  })

  it('get - gets the value from parent if not preset', () => {
    const a = new Context()
    a.local = { x: 1, y: 2, z: 3 }
    const b = new Context(a)
    b.local = { y: 20, z: 30 }
    const c = new Context(b)
    c.local = { z: 300 }

    expect(c.get('x')).toBe(1)
    expect(c.get('y')).toBe(20)
    expect(c.get('z')).toBe(300)
    expect(c.get('d')).toBe(undefined)
  })

  it('sets the local data when using let', () => {
    const a = new Context()
    const b = new Context(a)
    b.let('x', 1)
    expect(b.get('x')).toBe(1)
    expect(a.get('x')).toBe(undefined)
  })

  it('sets the top highest with value', () => {
    const a = new Context()
    const b = new Context(a)
    const c = new Context(b)
    c.set('x', 1)
    expect(c.get('x')).toBe(1)
    expect(b.get('x')).toBe(1)
    expect(a.get('x')).toBe(1)
    a.let('y', 2)
    b.let('y', 3)
    c.set('y', 4)
    expect(c.get('y')).toBe(4)
    expect(b.get('y')).toBe(4)
    expect(a.get('y')).toBe(2)
  })
})
