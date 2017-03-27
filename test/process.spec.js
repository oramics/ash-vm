/* global describe it expect */
const { Process } = require('../src/process')

describe('Process', () => {
  it('executes an instruction', () => {
    const proc = new Process('@debug')
    const commands = {
      '@debug': proc => {
        proc.debug = true
      }
    }
    proc.step(commands, { error: e => console.error(e) })
    expect(proc.debug).toBe(true)
  })

  it('pushes values into the stack', () => {
    const results = []
    const proc = new Process([1, '@test', 'two', '@test'])
    const commands = {
      '@test': ({ stack }, op) => {
        results.push(stack.pop())
      }
    }
    expect(proc.resume(commands)).toBe(false)
    expect(results).toEqual([1, 'two'])
  })
})
