// # MIDI

// This module gives MIDI support to the VM
// not working yet

export function midi () {
  const sendMidi = () => {}
  return {
    // [pitch, velocity, channel, "@note-on"]
    '@note-on': ({ stack }) => {
      const chan = Number(stack.pop())
      const vel = Number(stack.pop())
      const pitch = Number(stack.pop())
      sendMidi([0x90 + chan, pitch, vel], 0)
    },
    // [pitch, velocity, channel, "@note-off"]
    '@note-off': ({ stack }) => {
      const chan = Number(stack.pop())
      const vel = Number(stack.pop())
      const pitch = Number(stack.pop())
      sendMidi([0x80 + chan, pitch, vel], 0)
    },
    // [pitch, velocity, channel, duration, "@note"]
    '@note': proc => {
      const { stack, operations } = proc
      const dur = Number(stack.pop())
      let chan = Number(stack.pop())
      let vel = Number(stack.pop())
      let pitch = Number(stack.pop())

      sendMidi([0x90 + chan, pitch, vel], 0)
      operations.push(['@fork', [dur, '@wait', pitch, 0, chan, 'note-off']])
    },
    // [controller, value, channel, "@cc"]
    '@cc': ({ stack }) => {
      let chan = Number(stack.pop())
      let value = Number(stack.pop())
      const controller = Number(stack.pop())

      // Send cc controller value chan
      sendMidi([0xb0 + chan, controller, value], 0)
    }
  }
}
