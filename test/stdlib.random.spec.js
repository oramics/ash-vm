/* global describe test expect */
import initVM from "./testVM"

const fakeRnd = (values) => {
  let i = 0
  return () => values[i++]
}

const VM = (...values) => initVM({ random: fakeRnd(values) })

describe("Random commands", () => {
  test("@random", () => {
    const vm = VM(0.1, 0.2, 0.3)
    vm.run([4, "@repeat", ["@random", "@print"]])
    vm.resume(Infinity)
    expect(vm.printed).toEqual([0.1, 0.2, 0.3, undefined])
  })

  test("@pick", () => {
    const vm = VM(0.1, 0.4, 0.8)
    vm.run([3, "@repeat", ["@quote", [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], "@pick", "@print"]])
    vm.resume(Infinity)
    expect(vm.printed).toEqual([1, 4, 8])
  })
})
