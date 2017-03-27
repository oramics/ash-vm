/* global describe test expect */
import initVM from './testVM'

describe('VM', () => {
  test('run processes', () => {
    const vm = initVM()
    vm.run([1, '@print', 2, '@print'])
    vm.resume(Infinity)
    expect(vm.printed).toEqual([1, 2])
  })

  test('the context of the vm is the initial context of the procs', () => {
    const vm = initVM()
    vm.context = { amp: 'amp', inst: 'inst' }
    vm.run(['@loop'], false)
    const ctx = vm.procs[0].context
    expect(ctx.get('amp')).toBe('amp')
    expect(ctx.get('inst')).toBe('inst')
  })

  test('addCommands accept a function', () => {
    let received = null
    const vm = initVM()
    const plugin = vm => {
      received = vm
      return { '@plugin': () => true }
    }
    vm.addCommands(plugin)
    expect(received).toBe(vm)
    expect(vm.commands['@plugin']).not.toBe(undefined)
  })

  test('add new commands', () => {
    const vm = initVM()
    vm.addCommands({
      '@hello': proc => vm.printed.push('hello'),
      '@hi': '@hello'
    })
    vm.run(['@hello', '@hi'])
    vm.resume(Infinity)
    expect(vm.printed).toEqual(['hello', 'hello'])
  })

  test('run processes concurrently', () => {
    const vm = initVM()
    vm.fork(null, null, [1, '@print', 0.5, '@wait', 2, '@print'])
    vm.fork(null, null, [3, '@print', 0.25, '@wait', 4, '@print'])
    vm.resume(0.25)
    vm.resume(0.25)
    vm.resume(0.25)
    vm.resume(0.25)
    expect(vm.printed).toEqual([1, 3, 4, 2])
  })
})

describe('VM commands', () => {
  test('@fork', () => {
    const vm = initVM()
    vm.run(['@fork', [1, '@print'], 2, '@print'])
    vm.resume(Infinity)
    expect(vm.printed).toEqual([2, 1])
  })

  test('@loop', () => {
    const vm = initVM()
    vm.run(['@loop', ['@ptime', 0.2, '@wait']])
    vm.resume(1)
    expect(vm.printed).toEqual(['0.00', '0.20', '0.40', '0.60', '0.80'])
  })

  test('@stop-all', () => {
    const vm = initVM()
    vm.run(
      [
        '@loop',
        ['A', '@print', '@ptime', 0.5, '@wait'],
        '@loop',
        ['B', '@print', '@ptime', 0.6, '@wait'],
        1,
        '@wait',
        '@stop-all'
      ],
      false
    )
    vm.resume(1)
    vm.resume(2)
    expect(vm.printed).toEqual([
      'A',
      '0.00',
      'A',
      '0.50',
      'B',
      '0.00',
      'B',
      '0.60'
    ])
  })
})
