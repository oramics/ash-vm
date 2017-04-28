import React, { Component } from "react";
import Draft from "draft-js";

class CodeWrapper extends Component {
  constructor(props) {
    super(props);
    this.vm = this.props.blockProps.vm;
  }

  render() {
    const text = this.props.block.text;
    let parsed = null;
    let error = null;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      error = e.toString();
    }
    const handlePlay = e => {
      this.vm.run(parsed);
    };
    return (
      <div className="CodeWrapper">
        <Draft.EditorBlock {...this.props} />
        {parsed
          ? <input type="button" onClick={handlePlay} value="Play" />
          : null}
        {error ? <div className="error" readOnly>{error}</div> : null}
      </div>
    );
  }
}

export default CodeWrapper;
