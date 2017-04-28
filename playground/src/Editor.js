import React, { Component } from "react";
import Immutable from "immutable";
import Draft from "draft-js";
import PrismDraftDecorator from "draft-js-prism";
import CodeWrapper from "./Code"
import CodeUtils from "draft-js-code";
import insertHTML from "./draft-insert-html";
import classNames from "classnames"

import "./Editor.css";
import "prismjs/themes/prism.css";

import marked from "marked";
marked.setOptions({
  gfm: true,
  breaks: true,
  sanitize: true,
  pedantic: true
});

export default class Editor extends Component {
  constructor(props) {
    super(props);
    const vm = props.vm;

    this.myBlockRenderer = contentBlock => {
      const type = contentBlock.getType();
      if (type === "code-block") {
        return {
          component: CodeWrapper,
          props: { vm }
        };
      }
    };

    var decorator = new PrismDraftDecorator({ defaultSyntax: "javascript" });
    const markup = marked(props.value); //.replace(/\n<\/code/g, "</code");
    const blocksFromHTML = Draft.convertFromHTML(markup);
    const state = Draft.ContentState.createFromBlockArray(
      blocksFromHTML.contentBlocks,
      blocksFromHTML.entityMap
    );
    const editorState = Draft.EditorState.createWithContent(state, decorator);
    this.state = { editorState };
    this.onChange = editorState => this.setState({ editorState });
    this.focus = () => this.refs.editor.focus();
  }

  handleKeyCommand = command => {
    var newState;

    var editorState = this.state.editorState;
    if (CodeUtils.hasSelectionInBlock(editorState)) {
      newState = CodeUtils.handleKeyCommand(editorState, command);
    }

    if (!newState) {
      newState = Draft.RichUtils.handleKeyCommand(editorState, command);
    }

    if (newState) {
      this.onChange(newState);
      return true;
    }
    return false;
  };

  keyBindingFn = e => {
    var editorState = this.state.editorState;
    var command;

    if (CodeUtils.hasSelectionInBlock(editorState)) {
      command = CodeUtils.getKeyBinding(e);
    }
    if (command) {
      return command;
    }

    return Draft.getDefaultKeyBinding(e);
  };

  handleReturn = e => {
    var editorState = this.state.editorState;

    if (!CodeUtils.hasSelectionInBlock(editorState)) {
      return;
    }

    this.onChange(CodeUtils.handleReturn(e, editorState));
    return true;
  };

  handleTab = e => {
    var editorState = this.state.editorState;
    if (CodeUtils.hasSelectionInBlock(editorState)) {
      this.onChange(CodeUtils.handleTab(e, editorState));
    }
  };

  onAddCodeClick = e => {
    const editorState = insertHTML(
      this.state.editorState,
      '<pre><code>["@pluck"]</code></pre>'
    );
    this.setState({ editorState });
  };

  onBoldClick = e => {
    Draft.RichUtils.toggleInlineStyle(this.state.editorState, "BOLD");
  };

  render() {
    const active = this.props.active
    return (
      <div className={classNames("Editor", { active, hidden: !active })}>
        <div className="toolbar">
          <button onClick={this.onAddCodeClick}>Add code block</button>
          <button onClick={this.onBoldClick}>B</button>
        </div>
        <Draft.Editor
          ref="editor"
          blockRendererFn={this.myBlockRenderer}
          keyBindingFn={this.keyBindingFn}
          handleKeyCommand={this.handleKeyCommand}
          handleReturn={this.handleReturn}
          editorState={this.state.editorState}
          onChange={this.onChange}
        />
      </div>
    );
  }
}
