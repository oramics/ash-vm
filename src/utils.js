// # AudioVM utilities

// ## Array utilities

export const isArray = Array.isArray;

// get last element from an array
export function last(array) {
  return array[array.length - 1];
}

// ## Stack utilities

// push a value into a stack
export function push(stack, value) {
  stack.push(value);
}

// pop a value from the stack
export function pop(stack) {
  return stack.pop();
}

// get the next value of the stack without remove it
export function peek(stack) {
  return stack[stack.length - 1];
}
