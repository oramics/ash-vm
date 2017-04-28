import React, { Component } from "react";
import "./App.css";

import Editor from "./Editor";
import Tabs from "./Tabs";
import Transport from "./Transport";

import Gibberish from "gibberish-dsp";
import { initGibberish } from "../..";
import compatibility from "../../extensions/compatibility";

import reducer from "./reducer";

const vm = initGibberish(Gibberish, {
  commands: [],
  events: {}
});

const reduce = reducer(vm)

class App extends Component {
  state = reduce(undefined, {});

  dispatch(action) {
    this.setState(prevState => reduce(prevState, action));
  }
  setTempo = value => {
    this.dispatch({ type: "SET_TEMPO", value });
  };
  setTab = value => {
    this.dispatch({ type: "SET_TAB", value });
  };
  newTab = () => {
    this.dispatch({ type: "NEW_TAB" });
  };

  render() {
    const state = this.state;
    const tab = state.tabs[state.currentTab];
    return (
      <div className="App">
        <div className="header">
          <h1>AshVM Playground</h1>
        </div>
        <Transport bpm={this.state.bpm} vm={vm} setTempo={this.setTempo} />
        <Tabs
          tabs={state.tabs}
          current={state.currentTab}
          onTab={this.setTab}
          onNewTab={this.newTab}
        />
        <div className="Editors">
          {state.tabs.map((tab, i) => (
            <Editor
              key={i}
              value={tab.text}
              vm={vm}
              active={i === state.currentTab}
            />
          ))}
        </div>
      </div>
    );
  }
}

export default App;
