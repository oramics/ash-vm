import React, { Component } from 'react';
import './App.css';
import welcome from "../welcome.md"
import Playground from "./Playground"
import Transport from "./Transport"
import Gibberish from "gibberish-dsp"
import { initGibberish } from "../.."
import compatibility from "../../extensions/compatibility"

const vm = initGibberish(Gibberish, {
  commands: [
    compatibility()
  ],
  events: {
    "*": (type, event) => console.log("EVENT!", type, event)
  }
})
console.log("Instruments", Object.keys(vm.driver.instruments))

const toText = (encoded) => window.atob(encoded.slice(28))

const guides = {
  welcome: toText(welcome)
}

class App extends Component {
  render() {
    return (
      <div className="App">
        <div className="App-header">
          <h2>Arvo Playground</h2>
        </div>
        <Playground text={guides.welcome} vm={vm} />
        <Transport vm={vm} />
      </div>
    );
  }
}

export default App;
