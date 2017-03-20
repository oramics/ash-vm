function random(n) {
  if (n) {
    return Math.floor(Math.random() * n);
  } else {
    return Math.random();
  }
}

// a modulo operation that handles negative n more appropriately
// e.g. wrap(-1, 3) returns 2
// see http://en.wikipedia.org/wiki/Modulo_operation
// see also http://jsperf.com/modulo-for-negative-numbers 
wrap = function (n, m) {
	return ((n%m)+m)%m;
};

mtof = function(pitch) {
	return 440 * Math.pow(2, (+pitch - 69)/12);
}

uid = (function() {
	var id = 0;
	return function() {
		id++;
		return "uid"+id;
	}
})();

function array_shuffle(a) {
    var j, x, i;
    for (i = a.length; i; i--) {
        j = Math.floor(Math.random() * i);
        x = a[i - 1];
        a[i - 1] = a[j];
        a[j] = x;
    }
}

//////////////////////////////////////////////////////////////////////////////////////////
// Marked 
// https://github.com/chjj/marked
//////////////////////////////////////////////////////////////////////////////////////////

var renderer = new marked.Renderer();
// insert a bit of extra logic to the renderer to pull out heading links:
var toc = [];
renderer.heading = function(text, level, raw) {
    var anchor = this.options.headerPrefix + raw.toLowerCase().replace(/[^\w]+/g, '-');
    if (level > 1) {
		toc.push(
			"\t".repeat(level-2) 
			+ "- [" + text + "](#" + anchor + ")"
		);
	}
    return '<h' + level + ' id="' + anchor + '">'
        + text
        + '</h' + level + '>\n';
};

highlight = function (code, lang) {
	if (lang == "peg") {
		try {
			var a = pegjs_pegjs.parse(code);
			for (var i=0; i<a.length; i++) {
				var v = a[i];
				switch (v.type) {
				case "js": {
					a[i] = hljs.highlight("js", v.text).value;
					break;
				}
				case "comment": {
					a[i] = '<span class="hljs-comment">' + v.text + "</span>";
					break;
				}
				case "argument": {
					a[i] = v.text;
					break;
				}
				case "ruledef": {
					a[i] = '<span class="hljs-type">' + v.text + "</span>";
					break;
				}
				case "rulename": {
					a[i] = '<span class="hljs-variable">' + v.text + "</span>";
					break;
				}
				case "string": {
					a[i] = '<span class="hljs-string">' + v.text + "</span>";
					break;
				}
				case "range":
				case "operator": {
					a[i] = '<span class="hljs-regexp">' + v.text + "</span>";
					break;
				}
				default:
					//console.log(v.type);
				}
			}
			return a.join("");
		
		} catch(e) {
			console.log("ERROR", e.message);
			console.log(code);
		}
	}
	// fallback:
	return hljs.highlight(lang, code).value;
};

marked.setOptions({
	renderer: renderer,
	gfm: true,
	tables: true,
	sanitize: false,
	smartLists: true,
	smartypants: false,
	
	/*
		Sigh. The API for defining a language for hljs is horrific.
		I tried writing a mode definition for PEG.js, but gave up.
		I'm tempted instead to write a peg.js parser for peg.js
		And then defer to hljs to take care of the javascript portions.
		
		I now have a parser that can handle peg.js pretty well
		
		
		
    var s = "";
    for (var i=0; i<a.length; i++) {
    	var item = a[i];
        if (typeof item == "string") {
        	s += item;
        } else {
        	s += "<span class='hljs-" + item.type + "'>" + item.text + "</span>";
        }
    }
		
	*/
	highlight: highlight,
});

//////////////////////////////////////////////////////////////////////////////////////////
// Codemirror:
// http://codemirror.net/3/doc/manual.html
//////////////////////////////////////////////////////////////////////////////////////////

// config options: http://codemirror.net/3/doc/manual.html#config
CodeMirror.defaults.value = "\n\n\n";
CodeMirror.defaults.lineWrapping = true;
CodeMirror.defaults.lineNumbers = true;
//CodeMirror.defaults.autofocus = true;
CodeMirror.defaults.undoDepth = 100;

// content manipulation: http://codemirror.net/3/doc/manual.html#api_content

/*
// TODO: use the grammar to define syntax highlighting (mode)
// use fake language name "local"
CodeMirror.defineMode("local", function() {
  return {
    startState: function() {
      return {}
    },
    token: function(stream, state) {}
  };
});
CodeMirror.defineMIME("text/x-local", "local");
CodeMirror.defaults.mode = "local";
*/

//////////////////////////////////////////////////////////////////////////////////////////
// Gibberish:
// http://charlie-roberts.com/gibberish/
//////////////////////////////////////////////////////////////////////////////////////////
MIDI.init()
Gibberish.init();  
Gibberish.Time.export();
Gibberish.Binops.export();

bpm = 100;	// somehow need to make this globally modifiable
sr = Gibberish.context.sampleRate;
bpm2bpa = 1./(60*sr); // multiplier to convert bpm to beats per audio sample

external = {
	linked: false,
	t: 0,
}

kick = new Gibberish.Kick({ decay:.2 }).connect();
snare = new Gibberish.Snare({ snappy: 1.5 }).connect();
hat = new Gibberish.Hat({ amp: 1.5 }).connect();
conga = new Gibberish.Conga({ amp:.25, freq:400 }).connect();
tom = new Gibberish.Tom({ amp:.25, freq:400 }).connect();
strings = new Gibberish.PolyKarplusStrong({maxVoices: 32}).connect();
bass = new Gibberish.MonoSynth({ 
  attack:44, 
  decay:Gibberish.Time.beats( .25 ),
  filterMult:.25,
  octave2:0, 
  octave3:0
}).connect()


//////////////////////////////////////////////////////////////////////////////////////////
// Websocket
//////////////////////////////////////////////////////////////////////////////////////////

var wsocket; 
var connectTask;

var qstr = window.location.search,
    querystring = {},
    a = qstr.substr(1).split('&');
for (var i = 0; i < a.length; i++) {
  var b = a[i].split('=');
  querystring[decodeURIComponent(b[0])] = decodeURIComponent(b[1] || '');
}

var host = querystring.host || 'localhost',
    port = querystring.port || '8080';

function ws_connect() {

  if ('WebSocket' in window) {
    var address = "ws://" + host + ":" + port + "/";
    var ws = new WebSocket(address);
    ws.onopen = function(ev) {     

      wsocket = ws;

      console.log('CONNECTED to ' + address);
      // cancel the auto-reconnect task:
      if (connectTask != undefined) clearInterval(connectTask);
      // apparently this first reply is necessary
      //var message = 'hello from browser';
      //post('SENT: ' + message);
      //wsocket.send(message);

      // send some JSON:
      //wsocket.send(JSON.stringify({ "hello": "world" }));

      // client messages sent with a "*" prefix will have the "*" stripped,
      // but the server will broadcast them all back to all other clients
      // broadcast a hello:
      ws_send("*0 hello");

      external.linked = true;
    };

    ws.onclose = function(ev) {
      console.log('DISCONNECTED from ' + address);
      // set up an auto-reconnect task:
      //connectTask = setInterval(ws_connect, 1000);
      external.linked = false;
    };

    ws.onmessage = function(ev) {
      // was it a dict?
      if (ev.data.charAt(0) == "{") {
        // attempt to json parse it:
        var tree = JSON.parse(ev.data);
        console.log("parsed " + JSON.stringify(tree));
      } else {
        var args = ev.data.split(" ");
		if (args[1] == "seq") {
			external.t++;
			if (external.linked) {
				if( typeof window.seq === 'object' && typeof window.seq.external_resume === 'function' ) {
					window.seq.external_resume();
				}
			}
		} else if (ev.data.substr(0, 4) == "get ") {
          external.t = +ev.data.substr(4);
          if (external.linked) {
            if( typeof window.seq === 'object' && typeof window.seq.external_resume === 'function' ) {
              window.seq.external_resume();
            }
          }
        } else {    		
          console.log("received msg:" + ev.data.length + ": " + ev.data.substr(0, 50));
        }
      }
    };

  } else {
    console.log("WebSockets are not available in this browser!!!");
  }
}

function ws_send(msg) {
	if(wsocket) {
		wsocket.send(msg);
	} else {
		console.log("websocket send:", msg);
	}    	
}

ws_connect();

//////////////////////////////////////////////////////////////////////////////////////////
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
	-> | reverse A				or 			| A
	
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
//////////////////////////////////////////////////////////////////////////////////////////

// exported:
window.seq = {};

// dictionary of active sequencers.
window.sequencers = {};

// dictionary of actively spawned loops.
window.spawns = {};

// this is where the externally triggered events are buffered to synchronize them to beats
var cq = {
	t: 0,
	beat: -1,
	cmds: [], // these get fired at the next beat
};


cq.tick = function(t) {
	if (!external.linked) this.resume(this.t + bpm * bpm2bpa);
}

cq.resume = function(t) {
	var t0 = Math.floor(t);
	if (t0 > this.beat) {
		this.beat = t0;
		
		// flush commands:
		while (this.cmds.length) {
			var cmd = this.cmds.shift();
			cmd();
		}
	}
	this.t = t;
	return this;
}

Gibberish.sequencers.push(cq);
	
// clear all sequencers (e.g. STOP button) -- immediate
window.seq.clear = function() {
	for (k in sequencers) {
		sequencers[k].disconnect();
		delete sequencers[k];
	}
	spawns = {};
	
	if (MIDI) MIDI.send([0x7B, 0], 0);
}

// triggered by the onclick of an html element
// grabs the innertext and plays it
// e.g. <a href="#" onclick="seq.play_element_text(this)">["@pluck"]</a>
window.seq.play_element_value = function(element) {
	// play element's text:
	window.seq.define(uid(), JSON.parse(element.value));
}

// triggered by the onclick of an html element
// grabs the innertext and plays it
// e.g. <a href="#" onclick="seq.play_element_text(this)">["@pluck"]</a>
window.seq.play_element_text = function(element) {
	// play element's text:
	window.seq.define(uid(), JSON.parse(element.innerText));
	// stop the click from selecting the text:
	if(document.selection && document.selection.empty) {
        document.selection.empty();
    } else if(window.getSelection) {
        var sel = window.getSelection();
        sel.removeAllRanges();
    }
}

// define a sequencer. 
// if name didn't exist, create a new one.
// if name already exists, replace score. If no score, terminate the sequencer.
window.seq.define = function(name, score) {
	
	// sync this:
	cq.cmds.push(function() {
		if (!typeof name == "string") {
			console.log("error: missing sequence name"); return;
		}
		if (!Array.isArray(score)) {
			console.log("error: missing score data"); return;
		}
		// create it:
		return new PQ(score, name).connect();
	});
}

// terminate a named sequencer.
window.seq.stop = function(name) {
	if (!typeof name == "string") {
		console.log("error: missing sequence name"); return;
	}
	var _seq = sequencers[name];
	if (_seq !== undefined) {
		_seq.disconnect();
	}
}

window.seq.external_resume = function() {
	var t1 = external.t + bpm * bpm2bpa;
	cq.resume(t1);
	for (k in sequencers) {
		sequencers[k].resume(t1);
	} 
}

// we could also call this an agent, or player, or scheduler, etc.
// it can contain multiple command queues (type Q), and executes them in an interleaved way
// to ensure proper timing -- a bit like coroutines. 
function PQ(score, name) {
	this.t = external.t;
	this.heap = []; // the list of active command queues (next to resume is at the top)
	this.name = name || "default";
	this.context = {
		freq: 440,
		amp: 1,
	};
	
	if (score) { this.fork(score, this.t, this); }
	
	// replace?
	var s = sequencers[this.name];
	if (s !== undefined) {
		// remove sequencer:
		s.disconnect();
	}
	sequencers[this.name] = this; // auto-connect()?
	
	//console.log('creating sequencer', this.name);
}

PQ.prototype.connect = function() {
	if( Gibberish.sequencers.indexOf( this ) === -1 ) {
		Gibberish.sequencers.push( this );
	}
	Gibberish.dirty(this);
	return this;
}

PQ.prototype.disconnect = function() {
	var idx = Gibberish.sequencers.indexOf( this );
	if (idx >= 0) Gibberish.sequencers.splice( idx, 1 );
	delete sequencers[this.name];
	
	//console.log('stopping sequencer', this.name);
	
	return this;
}

// how to play the pq in a sample callback:
PQ.prototype.tick = function() {
	if (!external.linked) this.resume(this.t + bpm * bpm2bpa);
}


PQ.prototype.fork = function(score, t, parentQ) {
	var q = new Q(score, t, this.name, parentQ);
	this.push(q);
}

// PQ is always sorted on insertion
PQ.prototype.push = function(q) {
	//q.pq = this; // add a back reference (needed?)
	if (this.empty()) {
		this.heap.push(q);
	} else {
		// top item:
		var i = this.heap.length;
		var p = this.heap[i-1];
		// keep shifting it back to find the right location
		while (p && p.t <= q.t) {
			i--;
			p = this.heap[i-1];
		}
		// insert:
		this.heap.splice(i, 0, q);
		
		//for (var i=0; i<this.heap.length; i++) console.log("pq", i, this.heap[i]);
	}
	return this;
}

// true if no Q's scheduled
PQ.prototype.empty = function() { return (this.heap.length == 0); }

// get the time of the next item:
PQ.prototype.at = function() {
	if (!this.empty()) {
		return this.heap[this.heap.length-1].t;
	}
}

var runaway_limit = 10000;

// how to play the pq in a sample callback:
PQ.prototype.resume = function(t) {
	runaway_limit = 10000; // prevent infinite loops
	while (!this.empty() && t >= this.at() && --runaway_limit > 0) {
		// resume a queue:
		//console.log("PQ.tick", this.t, this.at());
		var q = this.heap.pop();
		//console.log("PQ.tick", q, this.t, q.at);
		if (q.resume(t)) {
			this.push(q);	// re-schedule it
		}
	}
	if (runaway_limit <= 0) {
		console.error("PQ resume unbounded loop detected");
		this.disconnect();
	}
	this.t = t;
	return this;
}

function Q(score, t, pq, parentQ) {
	this.t = t || 0;
	this.pq = pq;
	this.rate = 1;
	this.todo = []; 
	this.stack = [];
	this.parentQ = parentQ;
	if (parentQ) {
		this.context = {};
	} else {
		this.context = {
			freq: 440,
			amp: 1,
		};
	}
	this.debug = false;
	if (score) this.push(score);
}

Q.prototype.get = function(name) {
	var q = this;
	var val = q.context[name];
	while (val == undefined && q.parentQ) {
		q = q.parentQ;
		val = q.context[name];
	}
	return val;
}

Q.prototype.push = function(v) {
	this.todo.push(v);
}

// in each instruction handler,
// we can push to the todo queue
// and push to and pop from the stack
Q.prototype.step = function() {
	if (this.debug) {
		console.log("\tstack:", JSON.stringify(this.stack));
		console.log("\tqueue:", JSON.stringify(this.todo));
	}
	if (this.todo.length) {
		var item = this.todo.pop();
		if (item == null || item == undefined) {
			// ignore
		} else if (Array.isArray(item)) {
			for (i=item.length-1; i>=0; i--) {
				this.todo.push(item[i]);
			}
		
		} else if (typeof item == "string" && item.charAt(0) == "@") {
			var op = item;
			//console.log(op);
			
			// special cases:
			
			if (op.substring(0, 4) == "@ws-") {
				var n = +op.substring(4);
				var args = this.stack.splice(this.stack.length-n, n);
				//console.log("ws", args);
				var msg = args.join(" ");
				ws_send(this.t + " " + msg);
				return;
			
			} else if (op.substring(0, 4) == "@gb-") {
				var n = +op.substring(4);
				var args = this.stack.splice(this.stack.length-n, n);
				//console.log("ws", args);
				var msg = args.join(" ");
				ws_send(msg);
				return;
			
			} else if (op.substring(0, 5) == "@let-") {
				// let is always local:
				var name = op.substring(5);
				this.context[name] = this.stack.pop();
				return;
				
			} else if (op.substring(0, 5) == "@set-") {
				var name = op.substring(5);
				var value = this.stack.pop();
				// look up the hierarchy to find the context that has this var
				// if not found, use the uppermost
				// easy route: if we are the uppermost, just set directly
				if (!this.parentQ) {
					this.context[name] = value;
					return;
				}
				
				// else we are child, so the @set might be directed here or upper:
				var q = this;
				var ctx;
				while (q) {
					ctx = q.context;
					if (q.context[name] != undefined) {
					 	break;
					}
					// keep moving up:
					q = q.parentQ
				}
				
				ctx[name] = value;
				return;
				
			} else if (op.substring(0, 5) == "@get-") {
				var name = op.substring(5);
				this.stack.push( this.get(name) );
				return;
			}
			
		
			switch (op) {
			
			case "@dup":
				// duplicate whatever is on the stack
				this.stack.push(
					this.stack[this.stack.length-1]
				);
				break;
				
			case "@bpm":
				// set bpm:
				var t1 = this.stack.pop();
				t1 = (t1 == undefined) ? 100 : Math.abs(+t1);
				t1 = (t1 == t1) ? t1 : 100;
				bpm = t1;
				break;
				
			case "@wait": 
				// TODO: verify stack top is a valid number...
				// pop wait time off the stack:
				var t1 = this.stack.pop();
				t1 = (t1 == undefined) ? 1 : Math.abs(+t1);
				t1 = (t1 == t1) ? t1 : 0;
				this.t += t1 * this.rate;
				// push back to pq:
				//if (this.pq) this.pq.push(this);
				//console.log("\tq.t =", this.t);
				break;
			
			case "@set-rate": 
				var a1 = this.stack.pop();
				if (a1 !== undefined && typeof a1 == "number" && a1 > 0.) {
					
					this.rate = a1;
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
					console.error("missing or invalid argument to @rate");
				}	
				break;
				
			case "@with-rate": 
				var a1 = this.stack.pop();
				if (a1 !== undefined && typeof a1 == "number" && a1 > 0.) {
					var patt = this.todo.pop();
					if (!Array.isArray(patt)) {
						console.error("with-rate body must be a pattern (an array)");
						break;
					}
					// schedule a pop back to the original rate:
					this.push(["@set-rate", this.rate]);
					// schedule pattern:
					this.push(patt);
					// change rate first:
					this.rate /= a1; // or make absolute?
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
					console.error("missing or invalid argument to @rate");
				}	
				break;
				
			case "@spawn":
				// find the name:
				var name = this.stack.pop();
				// find the score:
				var patt = this.todo.pop();
				if (typeof name != "string" && typeof name != "number") {
					console.error("spawn name must be a string or number");
					break;
				}
				if (!Array.isArray(patt)) {
					console.error("spawn body must be a pattern (an array)");
					break;
				}
				// find parent PQ:
				var s = sequencers[this.pq];
				if (s == undefined) {
					console.error("can't spawn, can't find sequencer", this.pq);
					break;
				}	
				
				// does it already exist?
				var loop = spawns[name];
				if (loop == undefined) {
					//console.log("create new", name);
					// create it:
					loop = ["@forever", patt];
					spawns[name] = loop;
					// fork it:
					s.fork(loop, this.t, this);
				} else {
				
					//console.log("replace", name, loop);
					// nothing yet
					var dst = loop[1];
					dst.length = 0;
					dst.push.apply(dst, patt);
					//console.log("replace", name, loop);
				}
				
				// do it:
				//seq.define(name, ["@loop", patt]);
				break;
			
			case "@stop":
				// find the name:
				var name = this.stack.pop();
				// does it already exist?
				var loop = spawns[name];
				if (loop !== undefined) {
				
					console.log("stop", name);
					// nothing yet
					loop[1].length = 0;
					loop.length = 0;
					delete spawns[name];
					//loop.push.apply(loop);
				}
				break;
				
			case "@fork":
				// find the score:
				var patt = this.todo.pop();
				// argument *must* be a pattern
				if (!Array.isArray(patt)) {
					console.error("loop body must be a pattern (an array)");
					break;
				}
				// find parent PQ:
				var s = sequencers[this.pq];
				if (s) {
					s.fork(patt, this.t, this);
				} else {
					console.error("can't fork without a scheduler, couldn't find scheduler", this.pq);
				}
				break;
				
			case "@loop": 
				// find the score:
				var patt = this.todo.pop();
				// argument *must* be a pattern
				if (!Array.isArray(patt)) {
					console.error("loop body must be a pattern (an array)");
					break;
				}
				//this.todo.push(["@fork", ["@loop", patt]]);
				// find parent PQ:
				var s = sequencers[this.pq];
				if (s) {
					s.fork(["@forever", patt], this.t, this);
				} else {
					console.error("can't fork without a scheduler, couldn't find scheduler", this.pq);
				}
			
				break;
		
			case "@forever":
				// infinite loop
				var patt = this.todo[this.todo.length-1];
				// argument *must* be a pattern
				if (!Array.isArray(patt)) {
					console.error("loop body must be a pattern (an array)");
					break;
				}
				if (patt.length) {
			
					// push instruction again (the loop flow)
					this.todo.push(item);
					// push content of instruction (the loop body)
					this.todo.push(patt);
				}		
				break;
			
			case "@repeat":
				var rpts = this.stack.pop();
				// TODO: verify number, integer, >= 0, < 10000 etc.
				var patt = this.todo[this.todo.length-1];
				// patt *must* be a pattern
				if (!Array.isArray(patt)) {
					console.error("loop body must be a pattern (an array)");
					break;
				}
			
				for (i=1; i<rpts; i++) {
					this.todo.push(patt);
				}
				break;
		
			case "@print":
				// TODO: handle item.argc > 1
				console.log("PRINT!", this.stack.pop());
				break;
		
			case "@pick": 
				// pick a random element to enqueue:
				if (Array.isArray(this.todo[this.todo.length-1])) {
					var list = this.todo.pop(); 
					var i = random(list.length);
					if (i >= 0) {
						this.todo.push(list[i]);
					}
				} else {
					console.error("pick requires a list (array) argument to select from");
				}
				break;
			
			case "@iter":
		
				var patt = this.todo.pop();
				if (Array.isArray(patt) && patt.length) {
			
					// rotates the pattern and plays the first item only each time
					// remove '1st' item, schedule, then push to back:
					var first = patt.splice(0, 1);
					this.todo.push(first);
					patt.push(first);
				
				} else {
					console.error("rotate instruction requires a pattern (array)");
					break;
				}
				break;
		
			case "@chance":
				var prob = this.stack.pop();
				var pt = this.todo.pop();
				if ((random() < prob)) {
					// skip item after
					this.todo.pop();
					// push the pt:
					this.todo.push(pt);
				}
				break;
		
			case "@reverse":
				// schedule the argument, then reverse it:
				// TODO: is this the right order? or reverse then schedule?
				if (!Array.isArray(this.todo[this.todo.length-1])) {
					console.error("reverse instruction requires a pattern (array)");
					break;
				}
			
				// get the pattern:
				var arg = this.todo.pop();
				// case pre: arg.reverse(); // reverse the pattern in-place
				// schedule a shallow copy:
				this.todo.push(arg.slice());
				// case post:
				arg.reverse(); // reverse the pattern in-place
		
				break;
			
			case "@shuffle":
				// schedule the argument, then reverse it:
				// TODO: is this the right order? or reverse then schedule?
				if (!Array.isArray(this.todo[this.todo.length-1])) {
					console.error("shuffle instruction requires a pattern (array)");
					break;
				}
			
				// get the pattern:
				var patt = this.todo.pop();
				// case pre: array_shuffle(patt); // reverse the pattern in-place
				// schedule a shallow copy:
				this.todo.push(patt.slice());
				// case post:
				// transform the pattern in-place
				array_shuffle(patt);
			
				break;
		
			case "@rotate": 
		
				var patt = this.todo.pop();
				var rot = this.stack.pop(); 
				if (Array.isArray(patt) && patt.length) {
				
					// ensure rot is valid between -args.length to +args.length
					rot = rot % patt.length;
				
					var copy = patt.splice(0);
					// rotate in-place
					patt.push.apply(patt, copy.slice(rot));
					patt.push.apply(patt, copy.slice(0, rot));
					// schedule a shallow copy:
					this.todo.push(copy);
			
				} else {
					console.error("rotate instruction requires a pattern (array)");
					break;
				}
				break;
			
			case "@pre-rotate": 
		
				var patt = this.todo.pop();
				var rot = this.stack.pop(); 
				if (Array.isArray(patt) && patt.length) {
				
					// ensure rot is valid between -args.length to +args.length
					rot = rot % patt.length;
					var copy = patt.splice(0);
					// rotate in-place
					patt.push.apply(patt, copy.slice(rot));
					patt.push.apply(patt, copy.slice(0, rot));
				
					this.todo.push(patt);
			
				} else {
					console.error("rotate instruction requires a pattern (array)");
					break;
				}
				break;
		
			case "@":
			case "@execute":
				var instr = this.stack.pop();
				if (typeof instr != "string") {
					console.error("execute instruction did not evaluate to a string");
					break;
				}
				this.todo.push("@"+instr);
				break;
			
			case "@cond":
				var test = this.stack.pop();
				var pt = this.todo.pop();
				if (test) {
					// skip item after
					this.todo.pop();
					// push the pt:
					this.todo.push(pt);
				}
				break;
		
			case "@random":
			case "@rand":
				this.stack.push(Math.random());
				break;
				
			case "@srandom":
			case "@srand":
				this.stack.push(Math.random()*2-1);
				break;
			
			case "@randi":
				var n = this.stack.pop();
				this.stack.push(random(n));
				break;
		
			case "@+":
			case "@add":
				var b = this.stack.pop();
				var a = this.stack.pop();
				this.stack.push(a+b);
				break;
			
			case "@-":
			case "@sub":
				var b = this.stack.pop();
				var a = this.stack.pop();
				this.stack.push(a-b);
				break;
			
			case "@*":
			case "@mul":
				var b = this.stack.pop();
				var a = this.stack.pop();
				this.stack.push(a*b);
				break;
			
			case "@/":
			case "@div":
				var b = this.stack.pop();
				var a = this.stack.pop();
				if (b == 0) this.stack.push(0);
				else  		this.stack.push(a/b);
				break;
			
			case "@%":
			case "@wrap":
				var b = this.stack.pop();
				var a = this.stack.pop();
				if (b == 0) this.stack.push(0);
				else  		this.stack.push(wrap(a, b));
				break;
			
			case "@mod":
				var b = this.stack.pop();
				var a = this.stack.pop();
				if (b == 0) this.stack.push(0);
				else  		this.stack.push(a%b);
				break;
			
			case "@neg":
				var a = this.stack.pop();
				this.stack.push(-a);
				break;
			
			// conditionals
			// should they return 1 and 0 instead of bools?
			case "@>":
				var b = this.stack.pop();
				var a = this.stack.pop();
				this.stack.push(a>b);
				break;
			case "@>=":
				var b = this.stack.pop();
				var a = this.stack.pop();
				this.stack.push(a>=b);
				break;
			case "@<":
				var b = this.stack.pop();
				var a = this.stack.pop();
				this.stack.push(a<b);
				break;
			case "@<=":
				var b = this.stack.pop();
				var a = this.stack.pop();
				this.stack.push(a<=b);
				break;
			case "@==":
				var b = this.stack.pop();
				var a = this.stack.pop();
				this.stack.push(a==b);
				break;
			case "@!=":
				var b = this.stack.pop();
				var a = this.stack.pop();
				this.stack.push(a!=b);
				break;
			case "@!":
			case "@not":
				var a = this.stack.pop();
				this.stack.push(!a);
				break;
			case "@&&":
			case "@and":
				var b = this.stack.pop();
				var a = this.stack.pop();
				this.stack.push(a && b);
				break;
			case "@||":
			case "@or":
				var b = this.stack.pop();
				var a = this.stack.pop();
				this.stack.push(a || b);
				break;
			
			
			
			// v ilo ihi olo ohi @map
			case "@map":
				var ohi = this.stack.pop();
				var olo = this.stack.pop();
				var ihi = this.stack.pop();
				var ilo = this.stack.pop();
				var v = this.stack.pop();
				
				if (ihi == ilo) {
					this.stack.push(olo);
				} else {
					this.stack.push(olo + (ohi-olo) * ((v-ilo) / (ihi-ilo)));				
				}
				break;
			
			// MIDI
			/*
			MIDI note						| ```pitch, velocity, channel, duration, @note```
MIDI note on					| ```pitch, velocity, channel, @note-on```
MIDI note off					| ```pitch, velocity, channel, @note-off```
MIDI controller					| ```controller, value, channel, @cc```
Send n arguments over websocket	| ```arg1, arg2..., "@ws-n"```

*/
			
			
			// [pitch, velocity, channel, "@note-on"]
			case "@note-on": {
				var chan = +this.stack.pop();
				var vel = +this.stack.pop();
				var pitch = +this.stack.pop();
				
				// send noteon pitch vel chan
				if (MIDI) {
					MIDI.send( [0x90+chan,pitch,vel], 0 );
				}
			}	
			break;
				
			// [pitch, velocity, channel, "@note-off"]
			case "@note-off": {
				var chan = +this.stack.pop();
				var vel = +this.stack.pop();
				var pitch = +this.stack.pop();
				
				// send noteoff pitch vel chan
				if (MIDI) {
					MIDI.send( [0x80+chan,pitch,vel], 0 );
				}
			}
			break;
			
			// [pitch, velocity, channel, duration, "@note"]
			case "@note": {
				var dur = +this.stack.pop();
				var chan = +this.stack.pop();
				var vel = +this.stack.pop();
				var pitch = +this.stack.pop();
				
				// send noteon pitch vel chan
				if (MIDI) {
					MIDI.send( [0x90+chan,pitch,vel], 0 );
				
					// schedule noteoff later:
					var s = sequencers[this.pq];
					if (s == undefined) {
						break;
					}	
					s.fork([pitch, 0, chan, "@note-off"], this.t + dur * this.rate, this);
				}				
			}
			break;
					
			// [controller, value, channel, "@cc"]
			case "@cc": {
				var chan = +this.stack.pop();
				var value = +this.stack.pop();
				var controller = +this.stack.pop();
				
				// send cc controller value chan
				if (MIDI) {
					MIDI.send( [0xB0+chan,controller,value], 0 );
				}
				
				
				
			}
			break;
			
			// Built-in sounds
			
			case "@pluck":
				var amp = this.get("amp");
				var freq = this.get("freq");
				
				if (freq <= 0) break;
				// this is not in any way accurate, just a hack to make @set-dur do something semi-meaningful
				strings.damping = 1 - (-6 / Math.log(freq / sr));
				// strings by default seem too quiet:
				strings.note(freq, amp * amp * 2);
				break;
			
			
			// [amp, freq, "@pluck"]
			case "@pluck-note":
				var amp = this.stack.pop();
				var freq = this.stack.pop();
				
				if (freq <= 0) break;
				// this is not in any way accurate, just a hack to make @set-dur do something semi-meaningful
				strings.damping = 1 - (-6 / Math.log(freq / sr));
				// strings by default seem too quiet:
				strings.note(freq, amp * amp * 2);
				break;
			
      case "@bass":
				var velocity = this.get("amp");
				var freq = this.get("freq");
				
				if (freq <= 0) break;
				bass.note(freq, velocity);

				break;
     case "@bass-note":
				var velocity = this.stack.pop();
				var freq = this.stack.pop();
				
				
				if (freq <= 0) break;
				bass.note(freq, velocity);

				break;
      case "@kick-note": 
				kick.amp = 0.5 * this.stack.pop(); // pitch, decay, tone, amp
				kick.note(); 
				break;
			case "@snare-note": 
				snare.amp = 0.25 * this.stack.pop(); // cutoff:1000, decay:11025, tune:0, snappy:.5, amp:1
				snare.note();
				break;
			case "@hat-note": 
				hat.amp = this.stack.pop(); 
				hat.note(); // amp: 1, pitch: 325, bpfFreq:7000, bpfRez:2, hpfFreq:.975, hpfRez:0, decay:3500, decay2:3000
				break;
			case "@conga-note": 
				conga.amp = 0.25 * this.stack.pop();
				conga.pitch = this.stack.pop();
				conga.note(); // amp: 1, pitch: 325, bpfFreq:7000, bpfRez:2, hpfFreq:.975, hpfRez:0, decay:3500, decay2:3000
				break;
			case "@tom-note": 
				tom.amp = 0.25 * this.stack.pop();
				tom.pitch = this.stack.pop();
				tom.note(); // amp: 1, pitch: 325, bpfFreq:7000, bpfRez:2, hpfFreq:.975, hpfRez:0, decay:3500, decay2:3000
				break;
				
			case "@kick": 
				kick.amp = 0.5 * this.get("amp"); // pitch, decay, tone, amp
				kick.note(); 
				break;
			case "@snare": 
				snare.amp = 0.25 * this.get("amp"); // cutoff:1000, decay:11025, tune:0, snappy:.5, amp:1
				snare.note();
				break;
			case "@hat": 
				hat.amp = this.get("amp"); 
				hat.note(); // amp: 1, pitch: 325, bpfFreq:7000, bpfRez:2, hpfFreq:.975, hpfRez:0, decay:3500, decay2:3000
				break;
				
			case "@conga": 
				conga.amp = this.get("amp") * 0.25; 
				conga.pitch = this.get("freq");
				conga.note(); 
				break;
			case "@tom": 
				tom.amp = this.get("amp") * 0.25; 
				tom.pitch = this.get("freq");
				tom.note(); 
				break;
			
			case "@time": this.stack.push(this.t); break;
			case "@rate": this.stack.push(this.rate); break;
				
				
			default:
				console.error("unknown instruction operator:", op);
				return;
			}
		} else {
			this.stack.push(item);
		}
	} else {
		return true;
	}
}

Q.prototype.resume = function(t) {
	while (--runaway_limit > 0 && this.todo.length && this.t < t) {
		this.step();	
	}
	return this.todo.length > 0; // returns false if Q has no more events
}

Q.prototype.flush = function() {
	while (--runaway_limit > 0 && this.todo.length) {
		this.step();	
	}
	if (runaway_limit == 0) {
		console.error("Q flush unbounded loop detected");
	}
}

Gibberish.getSeq = function() {
  return window.seq
}
//////////////////////////////////////////////////////////////////////////////////////////
// BUILDERS
//////////////////////////////////////////////////////////////////////////////////////////

function define(name, patt) {
	// create a new sequence:
	// will call seq_define(name, score)
	return [name, "@spawn", patt];
}

function wait(n) {
	if (n != undefined) n = 1;
	return [n, "@wait"];
}
function loop(p, n) { 
	if (n != undefined) {
		return [n, "@repeat", p];
	} else {
		return ["@loop", p];
	}
}
function print(msg) { return [msg, "@print"]; }
function reverse(p) { return ["@reverse", p]; }
function shuffle(p) { return ["@shuffle", p]; }	 // shuffle
function rotate(p, n) { return [(n != undefined) ? n  : 1, "@rotate", p]; }
function chance(f, pt, pf) { return [f, "@chance", pt, pf]; }
function cond(f, pt, pf) { return [f, "@cond", pt, pf]; }
function sub(a, b) { return [a, b, "@sub"]; }
function pick(l) { return [ "@pick", l ]; }
function alt(l) { return [ "@iter", l ]; }
function execute(l, args) { 
	if (args != undefined) return [l, "@execute", args]; 
	else return [l, "@execute"];
} 

// just a convenience
// every(3, p) actually creates cond(alt([0,0,1]),p)
// neat eh?
function every(n, p) {
	// TODO assert n must be integer
	var l = []; 
	for (var i=0; i<n-1; i++) l.push(0);
	l.push(1);
	return cond(alt(l), p);
	
}

//////////////////////////////////////////////////////////////////////////////////////////
//// TEST:
//////////////////////////////////////////////////////////////////////////////////////////



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
