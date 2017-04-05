// ## Context

// A context is a hierarchical structure to store values with scope
export default class Context {
  constructor (parent) {
    if (parent instanceof Context) this.parent = parent
    else if (parent) this.local = Object.assign({}, parent)
  }

  // Create a child
  child (local) {
    const c = new Context(this)
    c.local = Object.assign({}, local)
    return c
  }
  // get a value from a context
  get (id) {
    let target = this
    while (target.value(id) === undefined && target.parent) {
      target = target.parent
    }
    return target.value(id)
  }

  // set a value from a context
  set (id, value) {
    let target = this
    while (target.value(id) === undefined && target.parent) {
      target = target.parent
    }
    target.let(id, value)
  }
  // get a value from the local scope of a context
  value (id) {
    return this.local ? this.local[id] : undefined
  }

  // set a value into the local scope of a context
  let (id, value) {
    if (!this.local) this.local = {}
    this.local[id] = value
  }
}
