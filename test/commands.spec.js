import Commands, { compile } from "../src/commands"

describe("Commands", () => {
  test("It accepts maps as operator", () => {
    const op1 = () => {}
    const op2 = () => {}
    const commands = new Commands({ "@op1": op1, "@op2": op2 })
    expect(commands.resolve("@op1")).toBe(op1)
    expect(commands.resolve("@op2")).toBe(op2)
  })
})

describe("Commands compile", () => {
  test("It compiles nested arrays", () => {
    const operation = () => {}
    const commands = new Commands((cmd) => operation)

    const compiled = compile(["a", "@cmd", ["b", "@cmd"]], commands)
    expect(compiled).toEqual(["a", operation, ["b", operation]])
  })

  test("It throws exception in strict mode", () => {
    const commands = new Commands()
    expect(compile(["@operator"], commands)).toEqual([undefined])
    expect(() => compile(["@operator"], commands, true)).toThrow()
  })

  test("Can override an operator", () => {
    const op1 = () => {}
    const op2 = () => {}
    const commands = new Commands({ "@op": op1 }).add({ "@op": op2 })
    expect(commands.resolve("@op")).toBe(op2)
  })
})
