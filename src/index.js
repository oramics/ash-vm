// # Audio Scheduler Virtual Machine
import VM from "./vm"
import GibDriver from "./audio/gibberish"
// import waa from "./audio/waa"

// ## Architecture overview

// **Glossary**
// - **Command**: a string that starts with `@` mapped to a function
// - **Program**: a list of commands and values

// **Classes**
// - **Process**: execute programs (by inserting values into stack and executing the command function)
// - **Scheduler**: run processes concurrently
// - **Commands**: translate commands to functions
// - **AudioDriver**: controls the scheduler. Create instruments.
// - **VM**: holds all above and provide API functions

// ## API
// Create a VM with Gibberish audio driver
export function initGibberish (Gibberish, options) {
  const driver = new GibDriver(Gibberish, options)
  return new VM(driver, options)
}

// Create a VM with WAA audio driver
export function initWebAudio (context, options) {
}
