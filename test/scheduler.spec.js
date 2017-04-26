import Scheduler from "../src/scheduler"

describe("Scheduler", () => {
  test("run processes concurrently", () => {
    const output = []
    const print = ({ stack }) => output.push(stack.pop())
    const wait = (proc) => proc.wait(proc.stack.pop())
    const scheduler = new Scheduler()
    scheduler.fork(null, null, [1, print, 0.5, wait, 2, print])
    scheduler.fork(null, null, [3, print, 0.25, wait, 4, print])
    scheduler.resume(0.25)
    scheduler.resume(0.25)
    scheduler.resume(0.25)
    scheduler.resume(0.25)
    expect(output).toEqual([1, 3, 4, 2])
  })
})
