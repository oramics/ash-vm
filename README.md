# Time VM

> A stack virtual machine audio scheduler.

Original code by @grrrwaaa extracted from:
https://worldmaking.github.io/workshop_nime_2017/vm.html

Currently it works with [Gibberish](https://github.com/charlieroberts/Gibberish) by @charlieroberts

Kudos for both!

## Usage

```js
// ES6
import Gibberish from "gibberish-dsp"
import { init } from "ashvm"

const run = init(Gibberish)
run(["@loop", [440, "freq", "@set", "@pluck", 0.5, "@wait"]])
```


```js
// ES5
const Gibberish = require("gibberish-dsp")
const init = require("ashvm").init(Gibberish)
const run = init(Gibberish)

run(["@loop", ["@kick", 0.5, "@wait", "@snare", 0.5, "@wait"]])
```

## Demos, docs and source code

- An introduction to TimeVM (by @grrrwaaa and @charlieroberts): https://danigb.github.io/ashvm/
- Annotated source code: https://danigb.github.io/ashvm/literate/

## Develop

You need node and npm installed. [Yarn](https://yarnpkg.com/en/docs/install) recommended.

1. Clone this repo
2. Install dependencies: `npm i` or `yarn`
3. Run tests: `npm test`
4. Contribute
