/* global describe test expect */
import initVM from './testVM'
import random from '../lib/ext/random'

const fakeRnd = (...values) => {
  let i = 0
  return () => values[i++]
}

describe('Random commands', () => {
  test('@random', () => {
    const vm = initVM(random(fakeRnd(0.1, 0.2, 0.3)))
    vm.run([4, '@repeat', ['@random', '@print']])
    vm.resume(Infinity)
    expect(vm.printed).toEqual([0.1, 0.2, 0.3, undefined])
  })

  test('@pick', () => {
    const vm = initVM(random(fakeRnd(0.1, 0.4, 0.8)))
    vm.run([3, '@repeat', ['@pick', [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], '@print']])
    vm.resume(Infinity)
    expect(vm.printed).toEqual([1, 4, 8])
  })

  test('aliases', () => {
    const vm = initVM(random())
    expect(vm.commands['@rand']).toBe(vm.commands['@random'])
  })
})
