// # Commands
import { isArray } from "./utils"
// test if the given operation is an instruction name
const isCommand = o => typeof o === "string" && o[0] === "@"

// The Commands resolves a `@command` string into a functions
export default class Commands {
  constructor (commands = []) {
    this.operators = []
    this.add(commands)
  }

  // Add commands to this one
  // commands can be functions or maps
  add (commands) {
    if (isArray(commands)) {
      let len = commands.length
      while (len--) this.add(commands[len])
    } else {
      this.operators.push(toOperator(commands))
    }
    return this
  }

  // Given a command, return its operation
  resolve (command) {
    const { operators } = this
    let len = operators.length
    while (len--) {
      const compiled = operators[len](command)
      if (compiled) return compiled
    }
  }
}

// Compile a program: convert all @commands into functions
// This allows to:
// 1. Detect syntax errors in an early stage
// 2. Improve performance
export function compile (program, commands, strict = false) {
  return program.map(instruction => {
    if (isArray(instruction)) {
      return compile(instruction, commands, strict)
    } if (isCommand(instruction)) {
      const fn = commands.resolve(instruction)
      if (fn) return fn
      else if (strict) throw Error("Command not found: " + instruction)
    } else {
      return instruction
    }
  })
}

// #### ~~private~~

// An operator is a function that given a @command, returns a compiled function
function toOperator (obj) {
  if (typeof obj === "function") return obj
  else if (typeof obj === "object") return mapToOperator(obj)
  else throw Error("Invalid operator: " + obj)
}

// Convert a map into a function
function mapToOperator (map) {
  return function (cmd) {
    const op = map[cmd]
    if (typeof op === "string") return map[op]
    else return op
  }
}
