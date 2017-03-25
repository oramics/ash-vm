/* global describe it expect */
const { Scheduler } = require('../src/scheduler')

describe('Scheduler', () => {
  it('run all processes', () => {
    const s = new Scheduler()
    const results = []
    const commands = {
      '@test': ({ stack }) => results.push(stack.pop())
    }
    s.schedule(null, [1, '@test', 2, '@test'])
    s.schedule(null, [10, '@test', 20, '@test'])
    s.resume(commands, { error: (e) => console.log('joder!' + e) })
    expect(results).toEqual([1, 2, 10, 20])
  })
})
