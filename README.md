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
import { init } from "time-vm"

const run = init(Gibberish)
run(["@loop", [440, "freq", "@set", "@pluck", 0.5, "@wait"]])
```


```js
// ES5
const Gibberish = require("gibberish-dsp")
const init = require("time-vm").init(Gibberish)
const run = init(Gibberish)

run(["@loop", ["@kick", 0.5, "@wait", "@snare", 0.5, "@wait"]])
```
