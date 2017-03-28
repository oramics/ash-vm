// # Compatibility plugin

import { isArray } from '../utils'
import { ERR_EXPECT_PATTERN } from '../commands'

// This plugin adds language compatibility to the previous version

// Given an instrument name, returns a command that play that instrument
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
    // I think reverse is not very useful in this context
    // because: ['@iter', ['@reverse', [1, 2, 3]]] doesn't work, for example
    '@reverse': ({ operations, error }) => {
      const pattern = operations.pop()
      if (!isArray(pattern)) error('@reverse', ERR_EXPECT_PATTERN, pattern)
      else operations.push(pattern.slice().reverse())
    },
    // I think @map is not a good name
    '@map': '@linear',

    // Instrument names
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
