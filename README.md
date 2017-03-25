# Time VM


```js
// ES6
import Gibberish from 'gibberish-dsp'
import { init } from 'time-vm'

const vm = init(Gibberish)
```


```js
// ES5
const Gibberish = require('gibberish-dsp')
const vm = require('time-vm').init(Gibberish)

vm.start(['@loop', ['@kick', 0.5, '@wait', '@snare', 0.5, '@wait']])
```


Sources:
- https://worldmaking.github.io/workshop_nime_2017/vm.html
- https://github.com/worldmaking/workshop_nime_2017/tree/gh-pages
