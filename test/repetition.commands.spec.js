/* global describe test expect */
import { repetition } from "../src/commands";

describe("Repetition commands", () => {
  test("@repeat", () => {
    const proc = { stack: [], instructions: [] };
    proc.stack.push(2); // number of repetitions
    proc.instructions.push(["@pluck", 0.25, "@wait"]); // predicate
    repetition["@repeat"](proc);
    expect(proc.instructions).toEqual([
      ["@pluck", 0.25, "@wait"],
      ["@pluck", 0.25, "@wait"]
    ]);
  });

  test("@loop", () => {
    let forked = null;
    const proc = { stack: [], instructions: [] };
    const actions = {
      fork: (name, proc, program) => {
        forked = { name, proc, program };
      }
    };

    proc.instructions.push(["@pluck", 0.25, "@wait"]);
    repetition["@loop"](proc, actions);
    expect(forked.name).toBe(null)
    expect(forked.proc).toBe(proc);
    expect(forked.program).toEqual(["@forever", ["@pluck", 0.25, "@wait"]]);
  });
});
