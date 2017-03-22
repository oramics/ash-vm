/* global describe it expect */
const { Operator } = require('..')

describe('Operator', () => {
  it('execute', () => {
    let flag = false
    const op = new Operator({
      '@cmd': (value) => {
        flag = value
      }
    })
    op.execute('@cmd', 'test')
    expect(flag).toBe('test')
  })
  it('process aliases', () => {
    let flag = false
    const op = new Operator({
      '@op': (value) => { flag = value },
      '@alias': '@op'
    })
    op.execute('@alias', 'test')
    expect(flag).toBe('test')
  })
  it('can derive new operators', () => {
    const op1 = new Operator({ '@one': (value) => 'one: ' + value })
    const op2 = op1.use({ '@two': (value) => 'two: ' + value })
    expect(op2).not.toBe(op1)
    expect(op2.execute('@one', 1)).toBe('one: 1')
    expect(op2.execute('@two', 2)).toBe('two: 2')
    expect(() => op1.execute('@two', 2)).toThrow()
  })
})
