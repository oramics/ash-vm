// # Compatibility plugin

// This plugin adds language compatibility to the previous version

const inst = name => ({ operations }) => {
  operations.push([{ inst: name }, '@play-note'])
}
const instNote = (name, p1, p2) => ({ stack, operations }) => {
  const props = { inst: name }
  if (p2) props[p2] = stack.pop()
  props[p1] = stack.pop()
  operations.push([props, '@play-note'])
}

export default function init () {
  return {
    '@pluck': inst('pluck'),
    '@pluck-note': instNote('pluck', 'freq', 'amp'),
    '@bass': inst('bass'),
    '@bass-note': instNote('bass', 'freq', 'amp'),
    '@hat': inst('hat'),
    '@hat-note': instNote('hat', 'amp'),
    '@kick': inst('kick'),
    '@kick-note': instNote('kick', 'amp'),
    '@snare': inst('snare'),
    '@snare-note': instNote('snare', 'amp'),
    '@conga': inst('conga'),
    '@conga-note': instNote('conga', 'amp'),
    '@clave': inst('clave'),
    '@clave-note': instNote('clave', 'amp'),
    '@tom': inst('tom'),
    '@tom-note': instNote('tom', 'amp')
  }
}
