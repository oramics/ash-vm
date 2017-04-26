// # Audio
import { ERR_INST_MISSING } from "./errors"

// Audio related commands

export default driver => ({
  // **@play**: Trigger a note. It uses the context to select the appropiate
  // voice and parameters
  // `"@play"`
  "@play": ({ context, error }) => {
    const instName = context.get("voice")
    const instrument = driver.instruments[instName]
    if (instrument) {
      instrument(context)
    } else {
      error("@play", ERR_INST_MISSING, instName)
    }
  },
  // **@set-bpm**: Change the global tempo
  // `120, "@set-bpm"`
  "@set-bpm": ({ stack }) => {
    const bpm = parseFloat(stack.pop(), 10)
    if (bpm > 0) driver.bpm = bpm
  },
  "@scale-tempo": ({ stack }) => {
    const factor = parseFloat(stack.pop(), 10)
    if (factor) driver.bpm = driver.bpm * factor
  }
})
