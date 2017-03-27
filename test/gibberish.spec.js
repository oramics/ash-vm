/* global describe test expect */
import initVM from './testVM'
import gibberish from '../lib/audio/gibberish'

describe('Gibberish plugin', () => {
  test('@play-note', () => {
    const vm = initVM(gibberish(Gibber()))
    expect(vm.commands['@play-note']).not.toBeNull()
    vm.run([{ inst: 'pluck', amp: 0.5, blend: 0.2, blah: 2 }, '@play-note'])
    vm.resume(Infinity)
    const inst = vm.audio.instruments['pluck'].instance
    expect(inst).not.toBeUndefined()
    // the pluck amp is attenuated
    expect(inst.amp).toEqual(0.125)
    expect(inst.blend).toEqual(0.2)
    expect(inst.blah).toBe(undefined)
    expect(inst.triggered).toEqual(1)
  })

  test('@play', () => {
    const vm = initVM(gibberish(Gibber()))
    expect(vm.commands['@play']).not.toBeNull()
    vm.context = { amp: 0.6, blend: 0.3, blah: 6, inst: 'pluck' }
    vm.run(['@play'])
    vm.resume(Infinity)
    const inst = vm.audio.instruments['pluck'].instance
    expect(inst).not.toBeUndefined()
    expect(inst.amp).toEqual(0.18)
    expect(inst.blend).toEqual(0.3)
    expect(inst.blah).toBe(undefined)
    expect(inst.triggered).toEqual(1)
  })
})

class InstStub {
  constructor (name) {
    this.name = name
    this.connected = false
    this.triggered = 0
  }
  connect () {
    this.connected = true
    return this
  }
  note () {
    this.triggered++
  }
}

function Gibber (sr = 100) {
  const insts = ['PolyKarplusStrong']
  const g = {
    sequencers: [],
    context: {
      sampleRate: sr
    }
  }
  insts.forEach(name => {
    g[name] = () => new InstStub(name)
  })
  return g
}
