/* global describe it expect */
const { Scheduler } = require('../src/scheduler')

describe('Scheduler', () => {
  it('run all processes', () => {
    const s = new Scheduler()
    const results = []
    const commands = {
      '@test': ({ stack }) => results.push(stack.pop())
    }
    s.fork(null, null, [1, '@test', 2, '@test'])
    s.fork(null, null, [10, '@test', 20, '@test'])
    s.resume(commands, { error: (e) => console.log('joder!' + e) })
    expect(results).toEqual([1, 2, 10, 20])
  })

  it('can fork a process', () => {
    const s = new Scheduler()
    const proc = s.fork(null, null, '@parent')
    expect(s.procs).toEqual([proc])
    const f1 = s.fork(null, proc, '@child1')
    expect(s.procs).toEqual([f1, proc])
    const f2 = s.fork(null, proc, '@child2')
    expect(s.procs).toEqual([f2, f1, proc])
  })
  it('have named forks', () => {
    const s = new Scheduler()
    const proc = s.fork(null, null, '@parent')
    const a1 = s.fork('A', proc, '@child1')
    const a2 = s.fork('A', proc, '@child2')
    const b1 = s.fork('B', proc, '@child3')
    expect(s.procs).toEqual([b1, a2, a1, proc])
    expect(s.procsByName).toEqual({ A: a2, B: b1 })
  })
})
