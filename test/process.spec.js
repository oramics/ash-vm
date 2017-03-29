/* global describe it expect */
const { Process } = require('../lib/process')
const wait = require('wait-promise')

describe('Process', () => {
  it('executes an instruction', () => {
    const proc = new Process('@debug')
    const commands = {
      '@debug': proc => {
        proc.debug = true
      }
    }
    proc.step(commands)
    expect(proc.debug).toBe(true)
  })

  it('accepts a function as operation', () => {
    let fired = false
    const proc = new Process(() => { fired = true })
    proc.step({})
    expect(fired).toBe(false)
    return wait.sleep(10).then(() => {
      expect(fired).toBe(true)
    })
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
