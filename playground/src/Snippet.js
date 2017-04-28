import React, { Component } from 'react';

export default class Snippet extends Component {
  constructor (props) {
    super(props)
    this.vm = this.props.vm
    this.isRunnable = !!props.program.program 
    this.state = { running: false }
  }
  onPlay = (e) => {
    e.preventDefault()
    const program = this.props.program
    this.vm.run(program.program)
    if (program.code.indexOf("@loop") !== -1) {
      this.setState({ running: true })
    }
  }
  onStop = (e) => {
    e.preventDefault()
    this.vm.run(["@stop-all"], false)
    this.setState({ running: false })
  }
  render () {
    const { program, vm } = this.props
    const play = this.isRunnable && !this.state.running
      ? <a href="#" onClick={this.onPlay}>play</a> : ''
    const stop = this.state.running === true 
      ? <a href="#" onClick={this.onStop}>stop</a> : ''

    return (
      <div className="Program">
        <div dangerouslySetInnerHTML={{ __html: program.html }} />
        <div>{play}&nbsp;{stop}</div>
      </div>
    )
  }
}
