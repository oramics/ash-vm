# Audio Scheduler VM

> A stack virtual machine audio scheduler.

Original code by @grrrwaaa extracted from:
https://worldmaking.github.io/workshop_nime_2017/vm.html

Currently it works with [Gibberish](https://github.com/charlieroberts/Gibberish) by @charlieroberts

Kudos for both!

## Usage

```js
// ES6
import Gibberish from "gibberish-dsp"
import { init } from "ash-vm"

const run = init(Gibberish)
run(["@loop", [440, "freq", "@set", "@pluck", 0.5, "@wait"]])
```


```js
// ES5
const Gibberish = require("gibberish-dsp")
const init = require("ash-vm").init(Gibberish)
const run = init(Gibberish)

run(["@loop", ["@kick", 0.5, "@wait", "@snare", 0.5, "@wait"]])
```

## Install

Via npm: `npm i -S ash-vm` or with yarn: `yarn add ash-vm`

Not yet published.

## Demos, docs and source code

- An introduction to AshVM (by @grrrwaaa and @charlieroberts): https://danigb.github.io/ash-vm/
- Annotated source code: https://danigb.github.io/ash-vm/literate/

## Develop

You need node and npm installed. [Yarn](https://yarnpkg.com/en/docs/install) recommended.

1. Clone this repo
2. Install dependencies: `npm i` or `yarn`
3. Run tests: `npm test`
4. Contribute
