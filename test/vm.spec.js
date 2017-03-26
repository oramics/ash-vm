/* global describe it expect */
import initVM from "./testVM";

describe("VM", () => {
  it("run processes", () => {
    const vm = initVM();
    vm.run([1, "@print", 2, "@print"]);
    vm.resume(Infinity);
    expect(vm.printed).toEqual([1, 2]);
  });

  it("add new commands", () => {
    const vm = initVM();
    vm.addCommands({
      "@hello": proc => vm.printed.push("hello"),
      "@hi": "@hello"
    });
    vm.run(["@hello", "@hi"]);
    expect(vm.printed).toEqual(["hello", "hello"]);
  });

  it("run processes concurrently", () => {
    const vm = initVM();
    vm.fork(null, null, [1, "@print", 0.5, "@wait", 2, "@print"]);
    vm.fork(null, null, [3, "@print", 0.25, "@wait", 4, "@print"]);
    vm.resume(0.25);
    vm.resume(0.25);
    vm.resume(0.25);
    vm.resume(0.25);
    expect(vm.printed).toEqual([1, 3, 4, 2]);
  });
});
