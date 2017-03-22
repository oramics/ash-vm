// ## The scope

export class Scope {
  // Create a scope
  constructor (parent) {
    this.parent = parent
    this.data = undefined
  }
  // set a key in the local scope
  let (key, value) {
    if (!this.data) this.data = {}
    this.data[key] = value
  }
  // test if a key is in the local scope
  ownsKey (key) {
    return this.data && this.data[key] !== undefined
  }
  // get a key from all the scope hierarchy
  get (key) {
    let target = this
    while (target && !target.ownsKey(key)) target = target.parent
    return target && target.data ? target.data[key] : undefined
  }
  // set a key in al the scope hierarchy
  // it sets the first key found or the root scope
  set (key, value) {
    let target = this
    while (!target.ownsKey(key) && target.parent) target = target.parent
    target.let(key, value)
  }
}
