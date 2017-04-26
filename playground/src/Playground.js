import marked from "marked";
import React from 'react';

const split = (text) => text.replace(/\n```\n/g, '```\n\n').split(/\n\s*\n/)

const markdown = (text) => split(text).map(p => {
  p = p.trim()
  const html = marked(p)
  return p[0] === "`" ? toProgram(p, html) : html
})

const toProgram = (text, html) => {
  const begin = text.indexOf('[')
  const end = text.lastIndexOf("]")
  const code = text.slice(begin, end + 1)
  let program = null
  try {
    program = JSON.parse(code)
  } catch(e) {
    console.log("Bad example", "'" + code + "'")
  }
  return { program, html }
}

const Editor = ({ text }) => (
  <div className="Editor">
    <textarea value={text} />
  </div>
)

const Markdown = ({ value }) => 
  <div dangerouslySetInnerHTML={{__html: value}} />

const Program = ({ program, vm }) => (
  <div className="Program">
    <div dangerouslySetInnerHTML={{__html: program.html}} />
    <div>
      {program.program ? 
        <a href="#!" onClick={(e) => vm.run(program.program)}>play</a>
         : null }
    </div>
  </div>
)

const Viewer = ({ paragraphs, vm }) => (
  <div className="Viewer">
    {paragraphs.map((p, i) => typeof p === "string" 
      ? <Markdown key={i} value={p} /> 
      : <Program key={i} program={p} vm={vm} />
    )}
  </div>
)


const Playground = ({ text, vm }) => (
  <div className="playground">
    <Editor text={text} />
    <Viewer paragraphs={markdown(text)} vm={vm} />
  </div>
)

export default Playground