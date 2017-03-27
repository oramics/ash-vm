// # TimeVM utilities

// test if an object is an array
export const isArray = Array.isArray

// test if  is a string
export const isString = x => typeof x === 'string'

// test if  is a function
export const isFn = x => typeof x === 'function'

// test if  is defined
export const isDef = x => typeof x !== 'undefined'

// get last element from an array
export const last = a => a[a.length - 1]
// take the next element of stack without remove it
export const peek = last

// A modulo operation that handles negative n more appropriately
// e.g. wrap(-1, 3) returns 2
// see http://en.wikipedia.org/wiki/Modulo_operation
// see also http://jsperf.com/modulo-for-negative-numbers
export const wrap = (a, b) => (a % b + b) % b
