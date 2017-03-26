/* global describe test expect */
import { core } from '../src/commands'

describe('Core commands', () => {
  test('@dup', () => {
    const proc = { stack: [1] }
    core['@dup'](proc)
    expect(proc.stack).toEqual([1, 1])
  })
})
