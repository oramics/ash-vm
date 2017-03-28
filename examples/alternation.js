const Gibberish = require('gibberish-dsp')
const AshVM = require('..')

const vm = AshVM.init(Gibberish)

window.onclick = () => {
  vm.stopAll()
}

const iterator = (opts) => {
  const len = opts.length
  let i = 0
  return () => opts[i++ % len]
}

function alternation (rhythm) {
  const steps = (rhythm + rhythm).split('')
  const iter = iterator(['@conga', '@clave'])
  const alternated = steps.map(s => s === '.' ? s : iter())

  return alternated
}

function toPattern (rhythm) {
  return rhythm.reduce((ptn, step) => {
    if (step !== '.') ptn.push(step)
    ptn.push('0.25')
    ptn.push('@wait')
    return ptn
  }, [])
}

vm.run(['@loop', toPattern(alternation('x.xxx.x.'))])
