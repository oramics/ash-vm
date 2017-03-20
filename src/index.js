/* global Gibberish MIDI */
console.log('ScheddVM init', Gibberish, MIDI)

const uid = (function () {
  let id = 0
  return function () {
    id++
    return 'uid' + id
  }
})();

// ////////////////////////////////////////////////////////////////////////////////////////
// Gibberish:
// http://charlie-roberts.com/gibberish/
// ////////////////////////////////////////////////////////////////////////////////////////
MIDI.init()
Gibberish.init()
Gibberish.Time.export()
Gibberish.Binops.export()

let bpm = 100 // Somehow need to make this globally modifiable
const sr = Gibberish.context.sampleRate
const bpm2bpa = 1 / (60 * sr) // Multiplier to convert bpm to beats per audio sample

const external = {
  linked: false,
  t: 0
}

const kick = new Gibberish.Kick({decay: 0.2}).connect()
const snare = new Gibberish.Snare({snappy: 1.5}).connect()
const hat = new Gibberish.Hat({amp: 1.5}).connect()
const conga = new Gibberish.Conga({amp: 0.25, freq: 400}).connect()
const tom = new Gibberish.Tom({amp: 0.25, freq: 400}).connect()
const strings = new Gibberish.PolyKarplusStrong({maxVoices: 32}).connect()
const bass = new Gibberish.MonoSynth({
  attack: 44,
  decay: Gibberish.Time.beats(0.25),
  filterMult: 0.25,
  octave2: 0,
  octave3: 0
}).connect()

// ////////////////////////////////////////////////////////////////////////////////////////
/*
  Pattern sequencer

  interprets a list of events, like a byte code but with pauses

  Important to distinguish between operations and simple lists.
  [a, b, c] can means perform a, b, c in sequence
  or it can be perform a(b,c), e.g. note(60, 100)
  we could make the former explicit by ["seq", a, b, c] but it would be nice not to have to
  we might be able to infer seq or expr by context? E.g. the root of a score must always be seq.
  or just make instructions have special names, e.g. "@pluck"

  any argument can be another bytecode to interpret
  [note, a, [b, c], d]; in this case [b, c] must be an expression, right?
  Important to distinguish [note a b c] from [note [a b] c]... can't just flatten arrays

  -- simple numeric arguments, for note N N N, loop N, rotate N, etc.
  (loop (rnd 1 4) pattern)
  (loop (rnd 1 (rnd 1 4)) pattern)
  (loop (add 3 (rnd 1 4)) pattern)
  (note (pick 60 40 30))
  (note (alt 60 50 40))
  (note (chance 0.5 60)) makes sense only if there is a contextual freq-state to default to
  + filters

  shuffle, reverse, rotate return lists, don't make sense here. unless we give it semantics.
  loop, fork, rate, wait don't make sense because no return, and temporal semantics don't make sense in an expression. They only make sense in an event sequence.
  every N?

  list/pattern arguments, for loop P, rotate/reverse/shuffle/alt P, pick P, rate P, fork P...
  add: could apply to all elements in the P, but that might not make sense

  fun example:

  ((alt (pick seq)) (A B C)) The trick is that the operator itself is dynamically chosen. Could lead to patterns like ABCAABCBABCAABCCABCCABCBACBAABCBABCB ETC.

  Challenge: some things need to be calculated before applying the operation,
  while some things need to wait for the operation to know whether/how to calculate

  E.g. (add a b) needs a & b to be evaluated first, but (chance 0.5 a) has to determine the chance first before evaluating a. This is essentially the $vau special form argument; or put another way, the difference between function calls and other control flow types.

  Each operator already knows whether an argument should be evaluated first.
  E.g. encountering (@add a b) on the queue, one could requeue as (a b @add-values) to ensure a & b are evaluated first. Then the question is how to map the values of a & b to @add-values, e.g. via a simple value stack. That makes it a stack-based machine, also like a concat language...
    4 wait
    dur amp freq note, ... path osc, etc.
    1 2 add, etc.

  Whereas encountering (@pick a b) we can do the pick immediately, as this only modifies the queue, pushing either a or b onto it. This is more like a macro language.
    alt A B
    pick list,
    loop A, fork A,
    reverse A, shuffle A, rotate A => A (but also modifies A in-place)

  That's how 'wait pick (2, 3)' becomes 'wait 2' or 'wait 3': the pick(2, 3) is pushed on the stack first, then evaluated to get 2 or 3, then this needs to move to a stack, then be used (popped) by the @wait.

  Some instructions may generate both forms:

    N chance A
    N rate A  (eval the rate argument and apply only around the pattern A) => set-rate A unset-rate
    N loop A (iterations arg will be evaluated once then counted down) => A N-1 loop A
    N rotate A => A rotate A'

    N after A (add A only after N visits)
      has to modify the (N after A) whole to decrement N. Only when N == 0 will A be added.
    N every A like above, but needs to re-add N every A when A is run.
      not sure if this is even possible... though maybe (alt (nop, nop, nop, A)) works.

  Can stuff like this work? I.e. reverse A 50% of the time:

  ((0.1 chance reverse) A)
  -> 0.1 | chance reverse A
  -> | reverse A        or       | A

  -- definitely need parens:
  loop ((0.1 chance (pick (reverse shuffle))) A)
  can produce any of:
  -> | reverse A
  -> | shuffle A
  -> | A

  -- but without parens, it's pretty ambiguous:
  loop 0.1 chance pick reverse shuffle A

  In a way, maybe what we need is a conditional transform; a bit like a filter.
  Things like reverse/shuffle/rotate are not often likely to be desired on every loop.
  Conditions could be e.g. periodic, stochastic, or more complex
  In any case, the notion of a conditional transform implies that the 'else' is the untransformed pattern
  i.e. pattern plays unchanged.
  So, we may have a sequence of "(transform-if (0.5 prob) rotate (transform reverse patt))"

  Really, when would you use rotate etc. without some condition?
  So, why not call them rotate-if?

  cond reverse-if patt => patt or patt'
  can't chain though:
  cond reverse-if cond shuffle-if patt Fails, because we can't pull patt for the reverse-if.

  This could all be a ton easier if we allowed users to name patterns...
  Maybe that's something we can support if there's a uid() function available to the parser actions...

  ----------------------

  Each active sequencer is a PQ
  Each PQ can contain several Q's of instructions (this allows polyrhythm)
  PQ's are stored in named slots for easy replacement/removal

  CONSIDER USING A BIGNUM LIBRARY TO MEASURE TIME
*/
// ////////////////////////////////////////////////////////////////////////////////////////

const ScheddVM = {}
export default ScheddVM

const sequencers = {}
let spawns = {}

// Exported:
ScheddVM.seq = {}

// Dictionary of active sequencers.
ScheddVM.sequencers = {}

// Dictionary of actively spawned loops.
ScheddVM.spawns = {}

// This is where the externally triggered events are buffered to synchronize them to beats
const cq = {
  t: 0,
  beat: -1,
  cmds: [] // These get fired at the next beat
}

cq.tick = function (t) {
  if (!external.linked) {
    this.resume(this.t + bpm * bpm2bpa)
  }
}

cq.resume = function (t) {
  const t0 = Math.floor(t)
  if (t0 > this.beat) {
    this.beat = t0

    // Flush commands:
    while (this.cmds.length) {
      const cmd = this.cmds.shift()
      cmd()
    }
  }
  this.t = t
  return this
}

Gibberish.sequencers.push(cq)

// Clear all sequencers (e.g. STOP button) -- immediate
ScheddVM.seq.clear = function () {
  for (let k in sequencers) {
    sequencers[k].disconnect()
    delete sequencers[k]
  }
  spawns = {}

  if (MIDI) {
    MIDI.send([0x7B, 0], 0)
  }
}

// Triggered by the onclick of an html element
// grabs the innertext and plays it
// e.g. <a href="#" onclick="seq.play_element_text(this)">["@pluck"]</a>
ScheddVM.seq.play_element_value = function (element) {
  // Play element's text:
  ScheddVM.seq.define(uid(), JSON.parse(element.value))
}

// Triggered by the onclick of an html element
// grabs the innertext and plays it
// e.g. <a href="#" onclick="seq.play_element_text(this)">["@pluck"]</a>
ScheddVM.seq.play_element_text = function (element) {
  // Play element's text:
  ScheddVM.seq.define(uid(), JSON.parse(element.innerText))
  // Stop the click from selecting the text:
  if (document.selection && document.selection.empty) {
    document.selection.empty()
  } else if (ScheddVM.getSelection) {
    const sel = ScheddVM.getSelection()
    sel.removeAllRanges()
  }
}

// Define a sequencer.
// if name didn't exist, create a new one.
// if name already exists, replace score. If no score, terminate the sequencer.
ScheddVM.seq.define = function (name, score) {
  // Sync this:
  cq.cmds.push(() => {
    if (!typeof name === 'string') {
      console.log('error: missing sequence name')
      return
    }
    if (!Array.isArray(score)) {
      console.log('error: missing score data')
      return
    }
    // Create it:
    return new PQ(score, name).connect()
  })
}

// Terminate a named sequencer.
ScheddVM.seq.stop = function (name) {
  if (!typeof name == 'string') {
    console.log('error: missing sequence name')
    return
  }
  const _seq = sequencers[name]
  if (_seq !== undefined) {
    _seq.disconnect()
  }
}

ScheddVM.seq.external_resume = function () {
  const t1 = external.t + bpm * bpm2bpa
  cq.resume(t1)
  for (let k in sequencers) {
    sequencers[k].resume(t1)
  }
}

// We could also call this an agent, or player, or scheduler, etc.
// it can contain multiple command queues (type Q), and executes them in an interleaved way
// to ensure proper timing -- a bit like coroutines.
function PQ (score, name) {
  this.t = external.t
  this.heap = [] // The list of active command queues (next to resume is at the top)
  this.name = name || 'default'
  this.context = {
    freq: 440,
    amp: 1
  }

  if (score) {
    this.fork(score, this.t, this)
  }

  // Replace?
  const s = sequencers[this.name]
  if (s !== undefined) {
    // Remove sequencer:
    s.disconnect()
  }
  sequencers[this.name] = this // Auto-connect()?

  // console.log('creating sequencer', this.name);
}

PQ.prototype.connect = function () {
  if (Gibberish.sequencers.indexOf(this) === -1) {
    Gibberish.sequencers.push(this)
  }
  Gibberish.dirty(this)
  return this
}

PQ.prototype.disconnect = function () {
  const idx = Gibberish.sequencers.indexOf(this)
  if (idx >= 0) {
    Gibberish.sequencers.splice(idx, 1)
  }
  delete sequencers[this.name]

  // Console.log('stopping sequencer', this.name);

  return this
}

// How to play the pq in a sample callback:
PQ.prototype.tick = function () {
  if (!external.linked) {
    this.resume(this.t + bpm * bpm2bpa)
  }
}

PQ.prototype.fork = function (score, t, parentQ) {
  const q = new Q(score, t, this.name, parentQ)
  this.push(q)
}

// PQ is always sorted on insertion
PQ.prototype.push = function (q) {
  // Q.pq = this; // add a back reference (needed?)
  if (this.empty()) {
    this.heap.push(q)
  } else {
    // Top item:
    let i = this.heap.length
    let p = this.heap[i - 1]
    // Keep shifting it back to find the right location
    while (p && p.t <= q.t) {
      i--
      p = this.heap[i - 1]
    }
    // Insert:
    this.heap.splice(i, 0, q)

    // For (var i=0; i<this.heap.length; i++) console.log("pq", i, this.heap[i]);
  }
  return this
}

// True if no Q's scheduled
PQ.prototype.empty = function () {
  return this.heap.length === 0
}

// Get the time of the next item:
PQ.prototype.at = function () {
  if (!this.empty()) {
    return this.heap[this.heap.length - 1].t
  }
}

let runaway_limit = 10000

// How to play the pq in a sample callback:
PQ.prototype.resume = function (t) {
  runaway_limit = 10000 // Prevent infinite loops
  while (!this.empty() && t >= this.at() && --runaway_limit > 0) {
    // Resume a queue:
    // console.log("PQ.tick", this.t, this.at());
    const q = this.heap.pop()
    // Console.log("PQ.tick", q, this.t, q.at);
    if (q.resume(t)) {
      this.push(q) // Re-schedule it
    }
  }
  if (runaway_limit <= 0) {
    console.error('PQ resume unbounded loop detected')
    this.disconnect()
  }
  this.t = t
  return this
}

function Q (score, t, pq, parentQ) {
  this.t = t || 0
  this.pq = pq
  this.rate = 1
  this.todo = []
  this.stack = []
  this.parentQ = parentQ
  if (parentQ) {
    this.context = {}
  } else {
    this.context = {
      freq: 440,
      amp: 1
    }
  }
  this.debug = false
  if (score) {
    this.push(score)
  }
}

Q.prototype.get = function (name) {
  let q = this
  let val = q.context[name]
  while (val == undefined && q.parentQ) {
    q = q.parentQ
    val = q.context[name]
  }
  return val
}

Q.prototype.push = function (v) {
  this.todo.push(v)
}

// In each instruction handler,
// we can push to the todo queue
// and push to and pop from the stack
Q.prototype.step = function () {
  if (this.debug) {
    console.log('\tstack:', JSON.stringify(this.stack))
    console.log('\tqueue:', JSON.stringify(this.todo))
  }
  if (this.todo.length) {
    const item = this.todo.pop()
    if (item == null || item == undefined) {
      // ignore
    } else if (Array.isArray(item)) {
      for (i = item.length - 1; i >= 0; i--) {
        this.todo.push(item[i])
      }
    } else if (typeof item === 'string' && item.charAt(0) == '@') {
      const op = item
      // Console.log(op);

      // special cases:

      if (op.substring(0, 4) == '@ws-') {
        var n = Number(op.substring(4))
        var args = this.stack.splice(this.stack.length - n, n)
        // Console.log("ws", args);
        var msg = args.join(' ')
        ws_send(this.t + ' ' + msg)
        return
      } else if (op.substring(0, 4) == '@gb-') {
        var n = Number(op.substring(4))
        var args = this.stack.splice(this.stack.length - n, n)
        // Console.log("ws", args);
        var msg = args.join(' ')
        ws_send(msg)
        return
      } else if (op.substring(0, 5) == '@let-') {
        // Let is always local:
        var name = op.substring(5)
        this.context[name] = this.stack.pop()
        return
      } else if (op.substring(0, 5) == '@set-') {
        var name = op.substring(5)
        var value = this.stack.pop()
        // Look up the hierarchy to find the context that has this var
        // if not found, use the uppermost
        // easy route: if we are the uppermost, just set directly
        if (!this.parentQ) {
          this.context[name] = value
          return
        }

        // Else we are child, so the @set might be directed here or upper:
        let q = this
        let ctx
        while (q) {
          ctx = q.context
          if (q.context[name] != undefined) {
          break
        }
          // Keep moving up:
          q = q.parentQ
        }

        ctx[name] = value
        return
      } else if (op.substring(0, 5) == '@get-') {
        var name = op.substring(5)
        this.stack.push(this.get(name))
        return
      }

      switch (op) {
        case '@dup':
          // Duplicate whatever is on the stack
          this.stack.push(this.stack[this.stack.length - 1])
          break

        case '@bpm':
          // Set bpm:
          var t1 = this.stack.pop()
          t1 = t1 == undefined ? 100 : Math.abs(Number(t1))
          t1 = t1 == t1 ? t1 : 100
          bpm = t1
          break

        case '@wait':
          // TODO: verify stack top is a valid number...
          // pop wait time off the stack:
          var t1 = this.stack.pop()
          t1 = t1 == undefined ? 1 : Math.abs(Number(t1))
          t1 = t1 == t1 ? t1 : 0
          this.t += t1 * this.rate
          // Push back to pq:
          // if (this.pq) this.pq.push(this);
          // console.log("\tq.t =", this.t);
          break

        case '@set-rate':
          var a1 = this.stack.pop()
          if (a1 !== undefined && typeof a1 === 'number' && a1 > 0) {
            this.rate = a1
            /*
          TODO: later, push/pop rate around a pattern
          } else if (item.length > 2) {
            // schedule a pop back to the original rate:
            this.push(["@rate", this.rate]);
            // schedule rest:
            this.push(item.slice(2));
            // adjust rate (i.e. like glPushMatrix, glMultMatrix...)
            this.rate /= a1;
          }
          */
          } else {
            console.error('missing or invalid argument to @rate')
          }
          break

        case '@with-rate':
          var a1 = this.stack.pop()
          if (a1 !== undefined && typeof a1 === 'number' && a1 > 0) {
            var patt = this.todo.pop()
            if (!Array.isArray(patt)) {
              console.error('with-rate body must be a pattern (an array)')
              break
            }
            // Schedule a pop back to the original rate:
            this.push(['@set-rate', this.rate])
            // Schedule pattern:
            this.push(patt)
            // Change rate first:
            this.rate /= a1 // Or make absolute?
            /*
          TODO: later, push/pop rate around a pattern
          } else if (item.length > 2) {
            // schedule a pop back to the original rate:
            this.push(["@rate", this.rate]);
            // schedule rest:
            this.push(item.slice(2));
            // adjust rate (i.e. like glPushMatrix, glMultMatrix...)
            this.rate /= a1;
          }
          */
          } else {
            console.error('missing or invalid argument to @rate')
          }
          break

        case '@spawn':
          // Find the name:
          var name = this.stack.pop()
          // Find the score:
          var patt = this.todo.pop()
          if (typeof name !== 'string' && typeof name !== 'number') {
            console.error('spawn name must be a string or number')
            break
          }
          if (!Array.isArray(patt)) {
            console.error('spawn body must be a pattern (an array)')
            break
          }
          // Find parent PQ:
          var s = sequencers[this.pq]
          if (s == undefined) {
            console.error('can\'t spawn, can\'t find sequencer', this.pq)
            break
          }

          // Does it already exist?
          var loop = spawns[name]
          if (loop == undefined) {
            // Console.log("create new", name);
            // create it:
            loop = ['@forever', patt]
            spawns[name] = loop
            // Fork it:
            s.fork(loop, this.t, this)
          } else {
            // Console.log("replace", name, loop);
            // nothing yet
            const dst = loop[1]
            dst.length = 0
            dst.push.apply(dst, patt)
            // Console.log("replace", name, loop);
          }

          // Do it:
          // seq.define(name, ["@loop", patt]);
          break

        case '@stop':
          // Find the name:
          var name = this.stack.pop()
          // Does it already exist?
          var loop = spawns[name]
          if (loop !== undefined) {
            console.log('stop', name)
            // Nothing yet
            loop[1].length = 0
            loop.length = 0
            delete spawns[name]
            // Loop.push.apply(loop);
          }
          break

        case '@fork':
          // Find the score:
          var patt = this.todo.pop()
          // Argument *must* be a pattern
          if (!Array.isArray(patt)) {
            console.error('loop body must be a pattern (an array)')
            break
          }
          // Find parent PQ:
          var s = sequencers[this.pq]
          if (s) {
            s.fork(patt, this.t, this)
          } else {
            console.error(
              'can\'t fork without a scheduler, couldn\'t find scheduler',
              this.pq
            )
          }
          break

        case '@loop':
          // Find the score:
          var patt = this.todo.pop()
          // Argument *must* be a pattern
          if (!Array.isArray(patt)) {
            console.error('loop body must be a pattern (an array)')
            break
          }
          // This.todo.push(["@fork", ["@loop", patt]]);
          // find parent PQ:
          var s = sequencers[this.pq]
          if (s) {
            s.fork(['@forever', patt], this.t, this)
          } else {
            console.error(
              'can\'t fork without a scheduler, couldn\'t find scheduler',
              this.pq
            )
          }

          break

        case '@forever':
          // Infinite loop
          var patt = this.todo[this.todo.length - 1]
          // Argument *must* be a pattern
          if (!Array.isArray(patt)) {
            console.error('loop body must be a pattern (an array)')
            break
          }
          if (patt.length) {
            // Push instruction again (the loop flow)
            this.todo.push(item)
            // Push content of instruction (the loop body)
            this.todo.push(patt)
          }
          break

        case '@repeat':
          var rpts = this.stack.pop()
          // TODO: verify number, integer, >= 0, < 10000 etc.
          var patt = this.todo[this.todo.length - 1]
          // Patt *must* be a pattern
          if (!Array.isArray(patt)) {
            console.error('loop body must be a pattern (an array)')
            break
          }

          for (i = 1; i < rpts; i++) {
            this.todo.push(patt)
          }
          break

        case '@print':
          // TODO: handle item.argc > 1
          console.log('PRINT!', this.stack.pop())
          break

        case '@pick':
          // Pick a random element to enqueue:
          if (Array.isArray(this.todo[this.todo.length - 1])) {
            const list = this.todo.pop()
            var i = random(list.length)
            if (i >= 0) {
              this.todo.push(list[i])
            }
          } else {
            console.error(
              'pick requires a list (array) argument to select from'
            )
          }
          break

        case '@iter':
          var patt = this.todo.pop()
          if (Array.isArray(patt) && patt.length) {
            // Rotates the pattern and plays the first item only each time
            // remove '1st' item, schedule, then push to back:
            const first = patt.splice(0, 1)
            this.todo.push(first)
            patt.push(first)
          } else {
            console.error('rotate instruction requires a pattern (array)')
            break
          }
          break

        case '@chance':
          var prob = this.stack.pop()
          var pt = this.todo.pop()
          if (random() < prob) {
            // Skip item after
            this.todo.pop()
            // Push the pt:
            this.todo.push(pt)
          }
          break

        case '@reverse':
          // Schedule the argument, then reverse it:
          // TODO: is this the right order? or reverse then schedule?
          if (!Array.isArray(this.todo[this.todo.length - 1])) {
            console.error('reverse instruction requires a pattern (array)')
            break
          }

          // Get the pattern:
          var arg = this.todo.pop()
          // Case pre: arg.reverse(); // reverse the pattern in-place
          // schedule a shallow copy:
          this.todo.push(arg.slice())
          // Case post:
          arg.reverse() // Reverse the pattern in-place

          break

        case '@shuffle':
          // Schedule the argument, then reverse it:
          // TODO: is this the right order? or reverse then schedule?
          if (!Array.isArray(this.todo[this.todo.length - 1])) {
            console.error('shuffle instruction requires a pattern (array)')
            break
          }

          // Get the pattern:
          var patt = this.todo.pop()
          // Case pre: array_shuffle(patt); // reverse the pattern in-place
          // schedule a shallow copy:
          this.todo.push(patt.slice())
          // Case post:
          // transform the pattern in-place
          array_shuffle(patt)

          break

        case '@rotate':
          var patt = this.todo.pop()
          var rot = this.stack.pop()
          if (Array.isArray(patt) && patt.length) {
            // Ensure rot is valid between -args.length to +args.length
            rot %= patt.length

            var copy = patt.splice(0)
            // Rotate in-place
            patt.push.apply(patt, copy.slice(rot))
            patt.push.apply(patt, copy.slice(0, rot))
            // Schedule a shallow copy:
            this.todo.push(copy)
          } else {
            console.error('rotate instruction requires a pattern (array)')
            break
          }
          break

        case '@pre-rotate':
          var patt = this.todo.pop()
          var rot = this.stack.pop()
          if (Array.isArray(patt) && patt.length) {
            // Ensure rot is valid between -args.length to +args.length
            rot %= patt.length
            var copy = patt.splice(0)
            // Rotate in-place
            patt.push.apply(patt, copy.slice(rot))
            patt.push.apply(patt, copy.slice(0, rot))

            this.todo.push(patt)
          } else {
            console.error('rotate instruction requires a pattern (array)')
            break
          }
          break

        case '@':
        case '@execute':
          var instr = this.stack.pop()
          if (typeof instr !== 'string') {
            console.error('execute instruction did not evaluate to a string')
            break
          }
          this.todo.push('@' + instr)
          break

        case '@cond':
          var test = this.stack.pop()
          var pt = this.todo.pop()
          if (test) {
            // Skip item after
            this.todo.pop()
            // Push the pt:
            this.todo.push(pt)
          }
          break

        case '@random':
        case '@rand':
          this.stack.push(Math.random())
          break

        case '@srandom':
        case '@srand':
          this.stack.push(Math.random() * 2 - 1)
          break

        case '@randi':
          var n = this.stack.pop()
          this.stack.push(random(n))
          break

        case '@+':
        case '@add':
          var b = this.stack.pop()
          var a = this.stack.pop()
          this.stack.push(a + b)
          break

        case '@-':
        case '@sub':
          var b = this.stack.pop()
          var a = this.stack.pop()
          this.stack.push(a - b)
          break

        case '@*':
        case '@mul':
          var b = this.stack.pop()
          var a = this.stack.pop()
          this.stack.push(a * b)
          break

        case '@/':
        case '@div':
          var b = this.stack.pop()
          var a = this.stack.pop()
          if (b == 0) {
            this.stack.push(0)
          }    else {
            this.stack.push(a / b)
          }
          break

        case '@%':
        case '@wrap':
          var b = this.stack.pop()
          var a = this.stack.pop()
          if (b == 0) {
            this.stack.push(0)
          }    else {
            this.stack.push(wrap(a, b))
          }
          break

        case '@mod':
          var b = this.stack.pop()
          var a = this.stack.pop()
          if (b == 0) {
            this.stack.push(0)
          }    else {
            this.stack.push(a % b)
          }
          break

        case '@neg':
          var a = this.stack.pop()
          this.stack.push(-a)
          break

        // Conditionals
        // should they return 1 and 0 instead of bools?
        case '@>':
          var b = this.stack.pop()
          var a = this.stack.pop()
          this.stack.push(a > b)
          break
        case '@>=':
          var b = this.stack.pop()
          var a = this.stack.pop()
          this.stack.push(a >= b)
          break
        case '@<':
          var b = this.stack.pop()
          var a = this.stack.pop()
          this.stack.push(a < b)
          break
        case '@<=':
          var b = this.stack.pop()
          var a = this.stack.pop()
          this.stack.push(a <= b)
          break
        case '@==':
          var b = this.stack.pop()
          var a = this.stack.pop()
          this.stack.push(a == b)
          break
        case '@!=':
          var b = this.stack.pop()
          var a = this.stack.pop()
          this.stack.push(a != b)
          break
        case '@!':
        case '@not':
          var a = this.stack.pop()
          this.stack.push(!a)
          break
        case '@&&':
        case '@and':
          var b = this.stack.pop()
          var a = this.stack.pop()
          this.stack.push(a && b)
          break
        case '@||':
        case '@or':
          var b = this.stack.pop()
          var a = this.stack.pop()
          this.stack.push(a || b)
          break

        // V ilo ihi olo ohi @map
        case '@map':
          var ohi = this.stack.pop()
          var olo = this.stack.pop()
          var ihi = this.stack.pop()
          var ilo = this.stack.pop()
          var v = this.stack.pop()

          if (ihi == ilo) {
            this.stack.push(olo)
          } else {
            this.stack.push(olo + (ohi - olo) * ((v - ilo) / (ihi - ilo)))
          }
          break

        // MIDI
        /*
      MIDI note            | ```pitch, velocity, channel, duration, @note```
MIDI note on          | ```pitch, velocity, channel, @note-on```
MIDI note off          | ```pitch, velocity, channel, @note-off```
MIDI controller          | ```controller, value, channel, @cc```
Send n arguments over websocket  | ```arg1, arg2..., "@ws-n"```

*/

        // [pitch, velocity, channel, "@note-on"]
        case '@note-on': {
          var chan = Number(this.stack.pop())
          var vel = Number(this.stack.pop())
          var pitch = Number(this.stack.pop())

          // Send noteon pitch vel chan
          if (MIDI) {
            MIDI.send([0x90 + chan, pitch, vel], 0)
          }
        }
          break

        // [pitch, velocity, channel, "@note-off"]
        case '@note-off': {
          var chan = Number(this.stack.pop())
          var vel = Number(this.stack.pop())
          var pitch = Number(this.stack.pop())

          // Send noteoff pitch vel chan
          if (MIDI) {
            MIDI.send([0x80 + chan, pitch, vel], 0)
          }
        }
          break

        // [pitch, velocity, channel, duration, "@note"]
        case '@note': {
          const dur = Number(this.stack.pop())
          var chan = Number(this.stack.pop())
          var vel = Number(this.stack.pop())
          var pitch = Number(this.stack.pop())

          // Send noteon pitch vel chan
          if (MIDI) {
            MIDI.send([0x90 + chan, pitch, vel], 0)

            // Schedule noteoff later:
            var s = sequencers[this.pq]
            if (s == undefined) {
              break
            }
            s.fork(
              [pitch, 0, chan, '@note-off'],
              this.t + dur * this.rate,
              this
            )
          }
        }
          break

        // [controller, value, channel, "@cc"]
        case '@cc': {
          var chan = Number(this.stack.pop())
          var value = Number(this.stack.pop())
          const controller = Number(this.stack.pop())

          // Send cc controller value chan
          if (MIDI) {
            MIDI.send([0xB0 + chan, controller, value], 0)
          }
        }
          break

        // Built-in sounds

        case '@pluck':
          var amp = this.get('amp')
          var freq = this.get('freq')

          if (freq <= 0) {
            break
          }
          // This is not in any way accurate, just a hack to make @set-dur do something semi-meaningful
          strings.damping = 1 - -6 / Math.log(freq / sr)
          // Strings by default seem too quiet:
          strings.note(freq, amp * amp * 2)
          break

        // [amp, freq, "@pluck"]
        case '@pluck-note':
          var amp = this.stack.pop()
          var freq = this.stack.pop()

          if (freq <= 0) {
            break
          }
          // This is not in any way accurate, just a hack to make @set-dur do something semi-meaningful
          strings.damping = 1 - -6 / Math.log(freq / sr)
          // Strings by default seem too quiet:
          strings.note(freq, amp * amp * 2)
          break

        case '@bass':
          var velocity = this.get('amp')
          var freq = this.get('freq')

          if (freq <= 0) {
            break
          }
          bass.note(freq, velocity)

          break
        case '@bass-note':
          var velocity = this.stack.pop()
          var freq = this.stack.pop()

          if (freq <= 0) {
            break
          }
          bass.note(freq, velocity)

          break
        case '@kick-note':
          kick.amp = 0.5 * this.stack.pop() // Pitch, decay, tone, amp
          kick.note()
          break
        case '@snare-note':
          snare.amp = 0.25 * this.stack.pop() // Cutoff:1000, decay:11025, tune:0, snappy:.5, amp:1
          snare.note()
          break
        case '@hat-note':
          hat.amp = this.stack.pop()
          hat.note() // Amp: 1, pitch: 325, bpfFreq:7000, bpfRez:2, hpfFreq:.975, hpfRez:0, decay:3500, decay2:3000
          break
        case '@conga-note':
          conga.amp = 0.25 * this.stack.pop()
          conga.pitch = this.stack.pop()
          conga.note() // Amp: 1, pitch: 325, bpfFreq:7000, bpfRez:2, hpfFreq:.975, hpfRez:0, decay:3500, decay2:3000
          break
        case '@tom-note':
          tom.amp = 0.25 * this.stack.pop()
          tom.pitch = this.stack.pop()
          tom.note() // Amp: 1, pitch: 325, bpfFreq:7000, bpfRez:2, hpfFreq:.975, hpfRez:0, decay:3500, decay2:3000
          break

        case '@kick':
          kick.amp = 0.5 * this.get('amp') // Pitch, decay, tone, amp
          kick.note()
          break
        case '@snare':
          snare.amp = 0.25 * this.get('amp') // Cutoff:1000, decay:11025, tune:0, snappy:.5, amp:1
          snare.note()
          break
        case '@hat':
          hat.amp = this.get('amp')
          hat.note() // Amp: 1, pitch: 325, bpfFreq:7000, bpfRez:2, hpfFreq:.975, hpfRez:0, decay:3500, decay2:3000
          break

        case '@conga':
          conga.amp = this.get('amp') * 0.25
          conga.pitch = this.get('freq')
          conga.note()
          break
        case '@tom':
          tom.amp = this.get('amp') * 0.25
          tom.pitch = this.get('freq')
          tom.note()
          break

        case '@time':
          this.stack.push(this.t)
          break
        case '@rate':
          this.stack.push(this.rate)
          break

        default:
          console.error('unknown instruction operator:', op)

      }
    } else {
      this.stack.push(item)
    }
  } else {
    return true
  }
}

Q.prototype.resume = function (t) {
  while (--runaway_limit > 0 && this.todo.length && this.t < t) {
    this.step()
  }
  return this.todo.length > 0 // Returns false if Q has no more events
}

Q.prototype.flush = function () {
  while (--runaway_limit > 0 && this.todo.length) {
    this.step()
  }
  if (runaway_limit == 0) {
    console.error('Q flush unbounded loop detected')
  }
}

Gibberish.getSeq = function () {
  return ScheddVM.seq
}
// ////////////////////////////////////////////////////////////////////////////////////////
// BUILDERS
// ////////////////////////////////////////////////////////////////////////////////////////

function define (name, patt) {
  // Create a new sequence:
  // will call seq_define(name, score)
  return [name, '@spawn', patt]
}

function wait (n) {
  if (n != undefined) {
    n = 1
  }
  return [n, '@wait']
}
function loop (p, n) {
  if (n != undefined) {
    return [n, '@repeat', p]
  }
  return ['@loop', p]
}
function print (msg) {
  return [msg, '@print']
}
function reverse (p) {
  return ['@reverse', p]
}
function shuffle (p) {
  return ['@shuffle', p]
} // Shuffle
function rotate (p, n) {
  return [n != undefined ? n : 1, '@rotate', p]
}
function chance (f, pt, pf) {
  return [f, '@chance', pt, pf]
}
function cond (f, pt, pf) {
  return [f, '@cond', pt, pf]
}
function sub (a, b) {
  return [a, b, '@sub']
}
function pick (l) {
  return ['@pick', l]
}
function alt (l) {
  return ['@iter', l]
}
function execute (l, args) {
  if (args != undefined) {
    return [l, '@execute', args]
  }
  return [l, '@execute']
}

// Just a convenience
// every(3, p) actually creates cond(alt([0,0,1]),p)
// neat eh?
function every (n, p) {
  // TODO assert n must be integer
  const l = []
  for (let i = 0; i < n - 1; i++)    {
    l.push(0)
  }
  l.push(1)
  return cond(alt(l), p)
}

// ////////////////////////////////////////////////////////////////////////////////////////
// // TEST:
// ////////////////////////////////////////////////////////////////////////////////////////

/*
score = loop([
  //[reverse([print("A"), chance( 1, print(sub(3, 2)) )])],

    //chance(0.5, execute([2, "rotate"])), // will sometimes transform the pattern that follows:
    //every(3, execute("shuffle")),
    cond(alt([0, 0, 1]), execute([1, "pre-rotate"])),
    [print("A"), print("B"), print("C")],
    rotate([print("x"), print("y"), print("z"), print("_")], alt([1, -2])),
    chance(0.5, print("BOOOO")),
    //cond(alt([0,1,0]), print("YES"), print("NO")),
    ["@iter",[0,1,0]],"@cond",["YES","@print"],["NO","@print"],
    "@iter", [440, 550, 660], "@freq",
    "@pluck",

  print("___________")
];
*/

/*
score = ["@loop", 4, [
  //["@chance", 0.5, ["@print", ["@binexpr", "sub", ["@pick", 3, 4], 2]]],
  ["@reverse", [
    ["@print", "A"],
    ["@print", "B"],
  ]],
  ["@print", "---------"],
]]
*/

/*

var score = loop([
  //loop([print(1), print(2)])
  //["@loop",[[1,"@print"],[2,"@print"]]]
  //loop([print(1), print(2)], 3)
  //[3,"@repeat",[[1,"@print"],[2,"@print"]]]
  chance(0.4, print("X")), wait(), print("Y")
],10);

var q = new Q(score);
//q.debug = true;

var pq = new PQ(score);
//pq.push(q);

pq.resume(5);
pq.connect();

console.log(JSON.stringify(pq));
*/

/*
  Question -- what happens when we trigger stuff?

  Case 0: any bit of code should be able to spawn a *named* player, so that this can later be stopped/replaced. [name "@spawn" patt] => seq_define(name, patt)

  Case 1: just grabbed a random bit of text and triggered it. It should run independently.

  Case 2: run any bit of code, it should replace everything? Like replacing the 'default' player. Maybe, or maybe just have a key combo for 'stop everything first, then run this'?

  Case 3: have named patterns, which don't play by default (but can be used by other processes). Then have named players, that can use them.
*/
