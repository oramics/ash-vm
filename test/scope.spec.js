/* global describe it expect */
const { Scope } = require('..')

const initScope = (parent, data) => {
  const scope = new Scope(parent)
  scope.data = data
  return scope
}

describe('Scope', () => {
  it('allows initial data', () => {
    const env = initScope(null, { key: 'value' })
    expect(env.get('key')).toBe('value')
    expect(env.get('none')).toBe(undefined)
  })

  it('gets the value from parent if not preset', () => {
    const a = initScope(null, { x: 1, y: 2, z: 3 })
    const b = initScope(a, { y: 20, z: 30 })
    const c = initScope(b, { z: 300 })
    expect(c.get('x')).toBe(1)
    expect(c.get('y')).toBe(20)
    expect(c.get('z')).toBe(300)
    expect(c.get('d')).toBe(undefined)
  })

  it('sets the local data when using let', () => {
    const a = new Scope()
    const b = new Scope(a)
    b.let('x', 1)
    expect(b.get('x')).toBe(1)
    expect(a.get('x')).toBe(undefined)
  })

  it('sets the top highest with value', () => {
    const a = new Scope()
    const b = new Scope(a)
    const c = new Scope(b)
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
