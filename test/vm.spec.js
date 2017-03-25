/* global describe it expect */
const { VM } = require('../src/vm')

describe('VM', () => {
  it('run programs', () => {
    const vm = new VM()
    vm.tick(Infinity)
  })
})
