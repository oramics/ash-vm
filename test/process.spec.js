/* global describe it expect */
const { Process } = require("../src/process")

describe("Process", () => {
  it("executes an instruction", () => {
    let execs = 0
    const program = () => execs++
    const proc = new Process(program)
    proc.step()
    expect(execs).toBe(1)
  })

  it("pushes values into the stack", () => {
    const results = []
    const pop = ({ stack }) => results.push(stack.pop())
    const proc = new Process([1, pop, "two", pop])
    expect(proc.resume()).toBe(false)
    expect(results).toEqual([1, "two"])
  })
})
