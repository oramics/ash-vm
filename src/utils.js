// # Utilities

// A collection of shared utility functions

// copy values from one or more sources to a target
// see: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
export const assign = Object.assign

// test if an object is an array
export const isArray = Array.isArray

// test if an object is a string
export const isString = x => typeof x === "string"

// test if an object is a function
export const isFn = x => typeof x === "function"

// test if an object is a number
export const isNum = x => typeof x === "number"

// test if an object is defined
export const isDef = x => typeof x !== "undefined"

// get last element from an array
export const last = a => a[a.length - 1]

// get the next element of stack without remove it
export const peek = last
