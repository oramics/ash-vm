const Gibberish = require('gibberish-dsp')
const AshVM = require('..')
const { h, app } = require('hyperapp')
const hyperx = require('hyperx')
const html = hyperx(h)
const { freq } = require('note-parser')

const patterns = createPatterns()
const total = Object.keys(patterns).length

const vm = AshVM.init(Gibberish, {
  bpm: 180,
  onfork: ({ proc, program }) => console.log('FORK', proc.id, program),
  onended: ({ proc }) => console.log('ENDED', proc.id),
  onstop: ({ proc }) => console.log('STOP', proc)
})
vm.audio.bpm = 160

const INSTS = ['@pluck'] //, '@pluck', '@pluck', '@pluck', '@clave', '@pluck', '@hat', '@pluck', '@pluck', '@kick', '@pluck', '@pluck', '@pluck']
const MAX_PARTS = 10 // INSTS.length

app({
  model: {
    next: 0,
    program: '',
    parts: []
  },
  subscriptions: [
    (model, actions) => {
      vm.run(['@loop', [1320, 0.5, '@pluck-note', 0.5, '@wait']])
    }
  ],
  actions: {
    trigger ({ next, parts }) {
      next++
      const part = 'p-' + next
      parts.push(part)
      const ptn = patterns[next]
      const instrument = INSTS[next % INSTS.length]
      const ops = sequence(ptn, next % 2 + 1, instrument)
      const prog = [ part, '@spawn', ops ]
      vm.run(prog)
      const program = JSON.stringify(prog, null, 2)
      if (parts.length > MAX_PARTS) {
        const toStop = parts[0]
        parts = parts.slice(1)
        vm.stop(toStop)
      }
      return { next, program, parts }
    },
    stopAll () {
      vm.stopAll()
    }
  },
  view: (model, actions) => html`
    <div>
      <h1>Terry Riley In-C</h1>
      <button onclick=${(e) => actions.trigger()}>trigger</button>
      <button onclick=${(e) => actions.stopAll()}>stop</button>
      <span>${model.next}/${total}</span>
      <div>
        <span>vm: ${vm.procs.length} | ${vm.audio.bpm}bpm -- </span>
        <span>${model.parts.length + 1}: </span>
        ${model.parts.map(part => html`
          <span>${part} </span>
        `)}
      </div>
      <pre><code>
        ${model.program}
      </code></pre>
    </div>
  `
})

function sequence (ptn, oct = 1, inst = '@pluck') {
  const pg = $()
  ptn.split(' ').forEach(note => {
    const [ pitch, duration ] = note.split('/')
    const fq = freq(pitch)
    if (fq) pg.playNote(inst, fq * oct, Math.random() * 0.5 + 0.25)
    pg.wait(duration)
  })
  return pg.program()
}

function $ (pg = [], b = {}) {
  const push = (ptn) => { pg.push(ptn); return b }
  b.playNote = (inst, freq, amp) => push([freq, amp, inst + '-note'])
  b.loop = (ptn) => push(['@loop', ptn])
  b.part = (name, ptn) => push([name, '@spawn', ptn])
  b.wait = (time) => push([time, '@wait'])
  b.let = (name, value) => push([value, name, '@let'])
  b.pluck = (freq, amp) => push([freq, amp, '@pluck-note'])
  b.pick = (arr) => push(['@pick', arr])

  b.program = () => pg
  return b
}

function createPatterns () {
  return {
    '1': 'e4/1 e4/1 e4/1',
    '2': 'e4/0.5 f4/0.5 e4/1',
    '3': '_/0.5 e4/0.5 f4/0.5 e4/0.5',
    '4': '_/0.5 e4/0.5 f4/0.5 g4/0.5',
    '5': 'e4/0.5 f4/0.5 g4/0.5 _/0.5',
    '6': 'c4/8',
    '7': '_/1 _/1 _/1 _/0.5 c4/0.25 c4/0.25 c4/0.5 _/0.5 _/1 _/1 _/1 _/1',
    '8': 'g4/6 f4/8',
    '9': 'b4/0.25 g4/0.25 _/0.5 _/1 _/1 _/1',
    '10': 'b4/0.25 g4/0.25',
    '11': 'f4/0.25 g4/0.25 b4/0.25 g4/0.25 b4/0.25 g4/0.25',
    '12': 'f4/0.5 g4/0.5 b4/4 c4/1',
    '13': 'b4/0.25 g4/0.75 g4/0.25 f4/0.25 g4/0.5 _/0.75 g4/3.25',
    '14': 'c4/4 b4/4 g4/4 f#4/4',
    '15': 'g4/0.25 _/0.75 _/1 _/1 _/1',
    '16': 'g4/0.25 b4/0.25 c5/0.25 g4/0.25',
    '17': 'b4/0.25 c5/0.25 b4/0.25 c5/0.25 b4/0.25 _/0.25',
    '18': 'e4/0.25 f#4/0.25 e4/0.25 f#4/0.25 e4/0.75 e4/0.25',
    '19': '_/1.5 g5/1.5',
    '20': 'e4/0.25 f#4/0.25 e4/0.25 f#4/0.25 g3/0.75 e4/0.25 f#4/0.25 e4/0.25 f#4/0.25 e4/0.25',
    '21': 'f#4/3',
    '22': 'e4/1.5 e4/1.5 e4/1.5 e4/1.5 e4/1.5 f#4/1.5 g4/1.5 a4/1.5 b4/0.5',
    '23': 'e4/0.5 f#4/1.5 f#4/1.5 f#4/1.5 f#4/1.5 f#4/1.5 g4/1.5 a4/1.5 b4/1',
    '24': 'e4/0.5 f#4/0.5 g4/1.5 g4/1.5 g4/1.5 g4/1.5 g4/1.5 a4/1.5 b4/0.5',
    '25': 'e4/0.5 f#4/0.5 g4/0.5 a4/1.5 a4/1.5 a4/1.5 a4/1.5 a4/1.5 b4/1.5',
    '26': 'e4/0.5 f#4/0.5 g4/0.5 a4/0.5 b4/1.5 b4/1.5 b4/1.5 b4/1.5 b4/1.5',
    '27': 'e4/0.25 f#4/0.25 e4/0.25 f#4/0.25 g4/0.5 e4/0.25 g4/0.25 f#4/0.25 e4/0.25 f#4/0.25 e4/0.25',
    '28': 'e4/0.25 f#4/0.25 e4/0.25 f#4/0.25 e4/0.75 e4/0.25',
    '29': 'e4/3 g4/3 c5/3',
    '30': 'c5/6',
    '31': 'g4/0.25 f4/0.25 g4/0.25 b4/0.25 g4/0.25 b4/0.25',
    '32': 'f4/0.25 g4/0.25 f4/0.25 g4/0.25 b4/0.25 f4/3.25 g4/1.5',
    '33': 'g4/0.25 f4/0.25 _/0.5',
    '34': 'g4/0.25 f4/0.25',
    '35': 'f4/0.25 g4/0.25 b4/0.25 g4/0.25 g4/0.25 b4/0.25 g4/0.25 b4/0.25 g4/0.25 b4/0.25 _/0.5 _/1 _/1 _/1 bb4/1 g5/3 a5/0.5 g5/1 b5/0.5 a5/1.5 g5/0.5 e5/3 g5/0.5 f#5/3.5 _/1 _/1 _/0.5 e5/2.5 f5/6',
    '36': 'f4/0.25 g4/0.25 b4/0.25 g4/0.25 b4/0.25 g4/0.25',
    '37': 'f4/0.25 g4/0.25',
    '38': 'f4/0.25 g4/0.25 b4/0.25',
    '39': 'b4/0.25 g4/0.25 f4/0.25 g4/0.25 b4/0.25 c5/0.25',
    '40': 'b4/0.25 f4/0.25',
    '41': 'b4/0.25 g4/0.25',
    '42': 'c5/4 b4/4 a4/4 c5/4',
    '43': 'f5/0.25 e5/0.25 f5/0.25 e5/0.25 e5/0.5 e5/0.5 e5/0.5 f5/0.25 e5/0.25',
    '44': 'f5/0.5 e5/1 e5/0.5 c5/1',
    '45': 'd5/1 d5/1 g4/1',
    '46': 'g4/0.25 d5/0.25 e5/0.25 d5/0.25 _/0.5 g4/0.5 _/0.5 g4/0.5 _/0.5 g4/0.5 g4/0.25 d5/0.25 e5/0.25 d5/0.25',
    '47': 'd5/0.25 e5/0.25 d5/0.5',
    '48': 'g4/6 g4/4 f4/5',
    '49': 'f4/0.25 g4/0.25 bb4/0.25 g4/0.25 bb4/0.25 g4/0.25 bb4/0.25',
    '50': 'f4/0.25 g4/0.25',
    '51': 'f4/0.25 g4/0.25 bb4/0.25',
    '52': 'g4/0.25 bb4/0.25',
    '53': 'bb4/0.25 g4/0.25'
  }
}
