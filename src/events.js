
const get = (all, type) => all[type] || (all[type] = [])
const defer = (fn, data) => setTimeout(() => fn(data), 0)

export default class Events {
  constructor () {
    this.all = {}
  }
  register (events) {
    Object.keys(events).forEach(type => this.on(type, events[type]))
  }
  on (type, handler) {
    get(this.all, type).push(handler)
  }
  emit (type, event) {
    defer(() => {
      get(this.all, type).map(handler => handler(event))
      get(this.all, "*").map(handler => handler(type, event))
    })
  }
}
