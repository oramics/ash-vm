/* global describe it expect */
const { Process, Operator } = require('..')

describe('Process', () => {
  it('executes an instruction', () => {
    const p = new Process(null, '@debug')
    const operator = new Operator({
      '@debug': (process) => {
        process.debug = true
      }
    })
    p.step(operator)
    expect(p.debug).toBe(true)
  })

  it('resumes operation', () => {
    const results = []
    const operator = new Operator({
      '@test': (process) => {
        results.push('test: ' + process.stack.pop())
      }
    })
    const proc = new Process(null, [1, '@test', 2, '@test'])
    expect(proc.resume(operator)).toBe(false)
    expect(results).toEqual(['test: 1', 'test: 2'])
  })
})
