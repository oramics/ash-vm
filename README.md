# Audio Scheduler VM
[![Travis CI](https://img.shields.io/travis/oramics/ash-vm/master.svg)](https://travis-ci.org/oramics/ash-vm)
[![Codecov](https://img.shields.io/codecov/c/github/oramics/ash-vm/master.svg)](https://codecov.io/gh/oramics/ash-vm)
[![CDNJS](https://img.shields.io/cdnjs/v/ash-vm.svg?colorB=ff69b4)](https://cdnjs.com/libraries/ash-vm)
[![npm](https://img.shields.io/npm/v/ash-vm.svg?colorB=ff69b4)](https://www.npmjs.org/package/ash-vm)


> `asm-vm` is a light-weight virtual machine that executes a very simple language, that captures some essential concepts for a musical live coding context, such as playing notes and looping patterns. It is intentionally limited to make it fairly easy to learn, yet also intentionally designed to make it possible to express a wide variety of ideas.

[Continue reading](https://oramics.github.io/ash-vm/)

Idea and code by @grrrwaaa, extracted from:
https://worldmaking.github.io/workshop_nime_2017/vm.html

Currently it works with the aswesome [Gibberish](https://github.com/charlieroberts/Gibberish) by @charlieroberts

## Install

The current distribution is 13Kb minified and 4.5Kb minified and gzipped.

**Browser**

```html
<script src="https://oramics.github.io/ash-vm/js/gibberish.min.js"></script>
<script src="https://oramics.github.io/ash-vm/dist/ash-vm.js"></script>
<script>
const vm = AshVM.init(Gibberish)
vm.run(["@loop", [440, "freq", "@set", "@pluck", 0.5, "@wait"]])
</script>
```

**Node**

Via npm: `npm i -S ash-vm` or with yarn: `yarn add ash-vm`

ES6:

```js
import Gibberish from "gibberish-dsp"
import { init } from "ash-vm"

const vm = init(Gibberish)
vm.run(["@loop", [440, "freq", "@set", "@pluck", 0.5, "@wait"]])
```

ES5:

```js
const Gibberish = require("gibberish-dsp")
const init = require("ash-vm").init

const vm = init(Gibberish)
vm.run(["@loop", ["@kick", 0.5, "@wait", "@snare", 0.5, "@wait"]])
```

## API

#### `init(Gibberish)` → vm

The init function receives an audio driver (currently only Gibberish) and returns a virtual machine:

```js
const Gibberish = require("gibberish-dsp")
const init = require("ash-vm").init
const vm = init(Gibberish)
```

#### `vm.run(program, sync = true)` → proc

Run a program. If `sync` is true, the program will start in the next beat.

```js
const notes = [60, 62, 64, 78, 98, 100]
vm.run(["@loop", ["@pick", notes, "@mtof", "freq", "@set", "@pluck"]])
```

#### `vm.addCommands(commands)`

You can extend the instruction set by adding commands. You can, for example, add more instruments:

```js
const bang = new Gibberish.FMSynth({ cmRatio:5, index:3 }).connect()
vm.addCommands({
  "@bang!": ({ context }) => bang.note(context.get("freq"))
})

vm.run(["@loop", ["@bang!", 1, "@wait"]])
```

## Examples, docs and source code

- An introduction to the language with lot of examples (by @grrrwaaa and @charlieroberts): https://oramics.github.io/ash-vm/
- Annotated source code: https://oramics.github.io/ash-vm/literate/

## Language reference

#### Arithmetic
| Name | Description | Example |
|------|-------------|---------|
| **@+**, **@add** | Add two values | `[1, 2, "@+"]` |
| **@-**, **@sub** | Subtract two values | `[2, 1, "@-"]` |
| **@\***, **@mul** | Multiply two values | `[2, 4, "@*"]` |
| **@/**, **@div** | Divide two values | `[4, 2, "@*"]` |
| **@%**, **@wrap** | Modulo for positive and negative numbers | `[4, -2, "@%"]` |
| **@mod** | Standard modulo operation | `[4, 2, "@mod"]` |
| **@neg** | The negative of a value | `[4, "@neg"]` |

#### Logic
| Name | Description | Example |
|------|-------------|---------|
| **@cond** | Conditional execution | `condition, "@cond", executed-if-true, executed-if-false` |
| **@>** | a > b | ```a, b, "@>"```
| **@>=** | a >= b | ```a, b, "@>="```
| **@<** | a < b | ```a, b, "@<"```
| **@<=** | a <= b | ```a, b, "@<="```
| **@==** | a == b | ```a, b, "@=="```
| **@!=** | a != b | ```a, b, "@!="```
| **@!**, **@!not** | not a | ```a, "@not"```
| **@&**, **@and** | a and b | ```a, b, "@and"```
| **@or** | a or b | ```a, b, "@or"```

#### Start and stop processes

| Name | Description | Example |
|------|-------------|---------|
| **@fork** | Fork | `@fork, [0.5, "@wait", "@kick"]` |
| **@spawn** | Spawn | `"melody", "@spawn", [0.5, "@wait", "@kick"]` |
| **@stop** | Stop current process | `@stop` |
| **@stop-all** | Stop all processes | `@stop-all` |

#### Variables

Every process has a context, a time and rate.

| Name | Description | Example |
|------|-------------|---------|
| **@let** | Assign a value to the local context | `10,'repetitions',@let` |
| **@set** | Assign a value to the global context | `10,'parts',@set` |
| **@get** | Push the value of a variable into the stack | `'repetitions',@get` |

#### Time and tempo

| Name | Description | Example |
|------|-------------|---------|
| **@wait** | Wait an amount of time (in beats) | `1,@wait` |
| **@sync** | Wait until next beat | `@sync` |
| **@scale-rate** | Scale the time rate by a factor | `1.5, '@scale-rate'` |
| **@set-bpm** | Set the global tempo in beats per minute | `120, "@set-bpm"` |
| **@scale-tempo** | Scale the global tempo by a factor | `0.75`, "@scale-tempo"

#### Execution and repetition

| Name | Description | Example |
|------|-------------|---------|
| **@execute** | Execute an instruction | `10,'dup','@execute'` |
| **@dup** | Duplicate item (so you can use it twice) | `10,@dup` |
| **@repeat** | Repeat | `4, "@repeat", ["@kick", 0.5, "@wait"]` |
| **@forever** | Repeat forever | `"@forever", ["@kick", 0.5, "@wait"]` |

#### Iteration and lists

| Name | Description | Example |
|------|-------------|---------|
| **@iter** | Iterate a pattern | `[["@iter", [0.3, 1]], "amp", "@set"]` |
| **@rotate** | Rotate a pattern | `3, '@rotate', [1, 2, 3, 4]` |

#### Randomness

| Name | Description | Example |
|------|-------------|---------|
| **@random**, **@rand** | Generate a random number between 0 and 1 | `["@random", "amp", "@set"]` |
| **@srandom**, **@srand** | Generate a random number between -1 and 1 | `["@srandom", "phase", "@set"]` |
| **@randi** | Generate a random integer between 0 and n | `[60, "@randi", "midi", "@set"]` |
| **@pick** | Pick a random element from a list | `["@pick", [1, 2, 3, 4]]` |
| **@chance** | Probabilistic execution | `probability, "@chance", executed-if-true, executed-if-false` |
| **@shuffle** | Shuffle a list | `'@shuffle', [1, 2, 3]` |

#### Playing sounds

| Name | Description | Example |
|------|-------------|---------|
| **@play-note** | Trigger a note with params | `{ inst: "pluck", amp: 0.5}, "@note-params"` |
| **@play** | Trigger a note | `"@note"` |


#### Debug

| Name | Description | Example |
|------|-------------|---------|
| **@print** | Print the last value of the stack | `10,"@print"` |
| **@log** | Log the name with the last value of the stack | `"@random", "amp", "@log"` |

## Develop

You need node and npm installed. [Yarn](https://yarnpkg.com/en/docs/install) recommended.

1. Clone this repo
2. Install dependencies: `npm i` or `yarn`
3. Run tests: `npm test`
4. Contribute
