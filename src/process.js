// # The processing unit
import { Scope } from './scope'

const isArray = Array.isArray
const isOperation = (obj) => typeof obj === 'string' && obj[0] === '@'

// # Process

// The basic element is the Process
// The processing unit has a stack and a queue of operations
// But it departures from other other stack machines in that
// it has time related information: the time of the
// proceessing unit and the rate at the time flows.
export class Process {
  // Normally the process are created by the scheduler
  constructor (scope, program, time, rate) {
    this.scope = new Scope(scope)
    this.stack = []
    this.operations = []
    this.time = time || 0
    this.rate = rate || 1
    if (program) this.operations.push(program)
  }

  // wait an amount of time
  wait (time) {
    this.time += this.rate * time
  }

  // Run a single operation
  step (operator) {
    const { operations } = this
    // has operations?
    if (operations.length) {
      const op = operations.pop()
      if (op === null || op === undefined) {
        // ignore
      } else if (isArray(op)) {
        // if it's an array, add to the operations in reverse order
        for (let i = op.length - 1; i >= 0; i--) operations.push(op[i])
      } else if (isOperation(op)) {
        // execute the operation
        operator.execute(op, this)
      } else {
        // if it's a value, push it into the stack
        this.stack.push(op)
      }
    }
  }

  // run the proccess until a time or finised its operations
  // (or reach a limit in order to prevent infinite loops)
  resume (operator, time = Infinity, limit = 1000) {
    while (--limit > 0 && this.time < time && this.operations.length) {
      this.step(operator)
    }
    if (limit === 0) throw Error('Run limit reached. Probably an infinite loop.')
    return this.operations.length > 0
  }
}
