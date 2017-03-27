/* global describe test expect */
import initVM from './testVM'

describe('Execute and repetition', () => {
  test('@dup', () => {
    const vm = initVM()
    vm.run([1, '@dup', '@print', '@print'])
    vm.resume(Infinity)
    expect(vm.printed).toEqual([1, 1])
  })
  test('@repeat', () => {
    const vm = initVM()
    vm.run([4, '@repeat', ['r', '@print']])
    vm.resume(Infinity)
    expect(vm.printed).toEqual(['r', 'r', 'r', 'r'])
  })
})

describe('Arithmetic commands', () => {
  test('@+', () => {
    const vm = initVM()
    vm.run([1, 2, '@+', 5, '@add', '@print'])
    vm.resume(Infinity)
    expect(vm.printed).toEqual([8])
  })
})
