/* global describe test expect */
import { all as commands } from "../src/commands";

describe("Random commands", () => {
  test("@random", () => {
    const proc = { stack: [] };
    commands["@random"](proc);
    expect(proc.stack[0]).toBeGreaterThan(0);
  });
  test("@rand alias", () => {
    expect(commands["@rand"]).toBe(commands["@random"]);
  });
});
