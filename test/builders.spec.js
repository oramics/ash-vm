import {
  loop,
  cond,
  iter,
  execute,
  print,
  rotate,
  chance
} from "../extensions/builders"

describe("Builders", () => {
  test("score 1", () => {
    const score = loop([
      // [reverse([print("A"), chance( 1, print(sub(3, 2)) )])],
      // chance(0.5, execute([2, "rotate"])), // will sometimes transform the pattern that follows:
      // every(3, execute("shuffle")),
      cond(iter([0, 0, 1]), execute([1, "pre-rotate"])),
      [print("A"), print("B"), print("C")],
      rotate([print("x"), print("y"), print("z"), print("_")], iter([1, -2])),
      chance(0.5, print("BOOOO")),
      // cond(iter([0,1,0]), print("YES"), print("NO")),
      ["@iter", [0, 1, 0]],
      "@cond",
      ["YES", "@print"],
      ["NO", "@print"],
      "@iter",
      [440, 550, 660],
      "@freq",
      "@pluck",

      print("___________")
    ])
    expect(score)
  })
})
