/* global describe it expect */
const { Operator, Scheduler } = require('..')

describe('Scheduler', () => {
  it('run all processes', () => {
    const results = []
    const operator = new Operator({
      '@test': (process) => {
        results.push('next: ' + process.stack.pop())
      }
    })
    const s = new Scheduler(operator)
    s.run([1, '@test', 2, '@test'])
    s.run([10, '@test', 20, '@test'])
    s.resume()
    expect(results).toEqual(['next: 1', 'next: 2', 'next: 10', 'next: 20'])
  })
})
