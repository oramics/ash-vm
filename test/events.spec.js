import Events from "../src/events"

describe("Events", () => {
  test("register event handler", () => {
    const events = new Events()
    const handler = jest.fn()
    events.on("test", handler)
    events.emit("test", "the event")
    expect(handler.mock.calls).toEqual([["the event"]])
  })
})
