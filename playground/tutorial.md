# Audio Scheduler Virtual Machine Tutorial

### A tutorial by Graham Wakefield & Charlie Roberts published originally [here](https://worldmaking.github.io/workshop_nime_2017/).


`AshVM` is a virtual machine that runs a simple language that captures some essential concepts for a musical live coding context, such as playing notes and looping patterns. It is intentionally limited to make it fairly easy to learn, yet also intentionally designed to make it possible to express a wide variety of ideas. It is *not* designed to be succinct -- that's the job of the user-facing language you create! The target language is a bit like the instruction sequences real compilers use, in that it is a list of commands. However ours can also have nested structures as lists of lists. A simple example is a pattern that plays a note every beat:

```javascript
["@loop", ["@pluck", [1, "@wait"]]]
```

## Sounds

The VM comes with a small number of instruments to get things going. Here's a plucked string instrument. There are two ways to trigger it. You can use @pluck-note to set the frequency and amplitude for each note like this:

```javascript
[440, 1, "@pluck-note"]
```

```javascript
[220, 0.25, "@pluck-note"]
```

Or you can set the frequency and amplitude as contextual variables, and just use @pluck to trigger using these values. This can allow a bit more flexibility in how these values are calculated:

```javascript
["@pluck"]
```
```javascript
[[330, "@set-freq"], [0.5, "@set-amp"], "@pluck"]
```

There are also some percussion sounds, which either grab amplitude from the context (set using @set-amp), or specify it using the -note variants:

```javascript
[1, "@hat-note"]
```
```javascript
[1, "@kick-note"]
```
```javascript
[1, "@snare-note"]
```

```javascript
[[1, "@set-amp"], "@hat"]
```
```javascript
[[1, "@set-amp"], "@kick"]
```
```javascript
[[1, "@set-amp"], "@snare"]
```
```javascript
[4, "@repeat", [
	[["@iter", [0.3, 1]], "@set-amp"], 
	8, "@repeat", ["@hat", 0.125, "@wait"]
]]
```

## Repetition and parallelism

A list with several events normally happens at the same time:

```javascript
[
	[220, "@set-freq"], "@pluck", 
	[330, "@set-freq"], "@pluck"
]
```

Unless you add a n,@wait:

```javascript
[
	[220, "@set-freq"], "@pluck", 
	1, "@wait",
	[330, "@set-freq"], "@pluck"
]
```

Here's how to do something a specific number of times:

```javascript
[
	4, "@repeat", [ "@pluck", 0.25, "@wait" ]
]
```

```javascript
[
	4, "@repeat", [ "@pluck", 0.25, "@wait" ],
	[220, "@set-freq"], "@pluck"
]
```
Here's how to do something forever:

```javascript
[
	"@loop", [ "@pluck", 0.25, "@wait" ]
]
```

Note that @loop will run the pattern that follows it *in parallel*, which means that you can keep on triggering more things after it. So it's easy to set up a bunch of parallel processes:

```javascript
[
	"@loop", [ 0.5, "@kick-note", 2, "@wait" ],
	"@loop", [ 0.3, "@hat-note", 0.4, "@wait" ],
	"@loop", [ 550, 0.5, "@pluck-note", 0.6, "@wait" ],
	"@loop", [ 330, 0.4, "@pluck-note", 0.2, "@wait" ],
	"@loop", [ 110, 1, "@pluck-note", 12, "@wait" ]
]
```


And to run something in parallel without looping it, just use @fork []:

```javascript
[
	"@loop", [ 
		"@kick", 
		"@fork", [
			0.25, "@wait", 
			550, 1, "@pluck-note",
			0.33, "@wait", 
			660, 1, "@pluck-note"
		],
		1, "@wait"
	]
]
```


This is also handy for setting up loops with different start times:

```javascript
[
	"@loop", ["@kick", 1, "@wait"],
	"@fork", [0.5, "@wait", 
		"@loop", ["@hat", 1, "@wait"]
	]
]
```


## Expressions

Anywhere that a number would go, you can insert an expression. Here are some fun expressions.

Here's picking a value at random from a list, instead of giving the freq and amp values as numbers:


```javascript
[
	"@loop", [ 
		["@pick", [330, 440, 550, 660]], 
		["@pick", [1, 0.7, 0.4]],
		"@pluck-note",
		0.25, "@wait"
	]
]
```

Here's alternating between a set of values in a list, one at a time:

```javascript
[
	"@loop", [ 
		["@iter", [330, 440, 550, 660]],
		["@iter", [1, 0.7, 0.4]],
		"@pluck-note",
		0.25, "@wait"
	]
]
```

Here's way to set the probability of something happening. Note that two lists have to be given after the "@chance"; either the first is run (if the chance happens), else the other one will be run. 

```javascript
[
	"@loop", [
		"@fork", [ 
			0.1, 
			"@chance",
			["@snare"],
			["@kick"]
		],
		"@hat", 0.25, "@wait"
	]
]
```


If you don't care about the 'else' case, just put an empty list ```[]``` or ```null```. But you must put something, or else the virtual machine will get corrupted, and who knows what might happen.

```javascript
[
	"@loop", [
		"@fork", [ 
			0.1, 
			"@chance",
			["@snare"],
			[]
		],
		"@hat", 0.25, "@wait"
	]
]
```

Another way of getting some randomness is to use the @rand (which generates a number between 0 and 1), @srand (which generates a number between -1 and 1), and n,@randi (which generates a number between 0 and n-1):

```javascript
[
	"@loop", [ 
		"@rand", "@set-amp",
		"@pluck",
		0.25, "@wait"
	]
]
```
```javascript
[
	"@loop", [ 
		"@pluck",
		[3, "@randi"], "@wait"
	]
]
```

There are several basic math functions that can be used to map numbers into useful ranges. Note that most math functions require the arguments first, e.g. use ```[a,b,@+]``` to add a and b:

```javascript
[
	"@loop", [ 
		[[[4, "@randi"], 1, "@+"], 110, "@*"], "@set-freq",
		"@pluck",
		0.25, "@wait"
	]
]
```
```javascript
[
	"@loop", [ 
		[["@srand", 10, "@*"], 110, "@+"], "@set-freq",
		"@pluck",
		0.25, "@wait"
	]
]
```

## Get, set, and let

The @set-freq etc. are really just examples of creating named values ("variables") that can be re-used again later. Actually you can use @set-*anything* to create whatever variables you like, and use @get-*anything* to retrieve them. Mainly this is useful when you want to re-use something a few times:

```javascript
[
	"@loop", [ 
		[[[4, "@randi"], 2, "@+"], 110, "@*"], "@set-f",
		"@get-f", 0.6, "@pluck-note",
		["@get-f", 1.5, "@mul"], 0.6, "@pluck-note",
		0.25, "@wait"
	]
]
```


By default @set-*anything* will apply globally, so you can modulate a parameter from one loop while using it in another:

```javascript
[
	"@loop", [
		[[[4, "@randi"], 2, "@+"], 110, "@*"], "@set-f",
		1, "@wait"
	],
	"@loop", [ 
		"@get-f", 0.6, "@pluck-note",
		["@get-f", 1.5, "@mul"], 0.6, "@pluck-note",
		0.25, "@wait"
	]
]
```

If globalism isn't what you care for, you can make a name "local" to a particular loop by using @let-*anything*. Once you have @let- a variable in a particular @loop (or @fork) pattern, it will remain local to that pattern. Generally, use @let if you want some value that is only used within a pattern, and @set if you want something global. 

```javascript
[
	"@loop", [
		[[[4, "@randi"], 1, "@+"], 110, "@mul"], "@let-f",
		"@get-f", 0.6, "@pluck-note",
		["@get-f", 1.5, "@mul"], 0.6, "@pluck-note",
		0.25, "@wait"
	],
	"@loop", [
		[[[4, "@randi"], 5, "@+"], 110, "@mul"], "@let-f",
		"@get-f", 1, "@pluck-note",
		["@get-f", 1.5, "@mul"], 0.6, "@pluck-note",
		0.25, "@wait"
	]
]
```

One use for this is to repeatedly modify a value, such as for a counter, or a decay:

```javascript
[
	"@loop", [
		1, "@let-a",
		8, "@repeat", [
			"@get-a", "@snare-note",
			0.25, "@wait",
			["@get-a", 0.6, "@*"], "@set-a"
		]
	]
]
```

The only thing special about @set-freq is that the name "freq" is used by @pluck. That is, @pluck is equivalent to: ```["@get-freq", "@get-amp", "@pluck-note"]```. Similarly for @set-amp etc.

## Independently parallel

Say you want to be able to launch a loop, then let it keep running while you launch another. And say you want to redefine it while it plays, or stop it. To do that you need to name it. We can do that via "@spawn".

```javascript
[
	"foo", "@spawn", [220, 0.5, "@pluck-note", 0.50, "@wait"],
	"bar", "@spawn", [330, 0.5, "@pluck-note", 0.75, "@wait"],
	3, "@wait",
	"foo", "@spawn", [110, 0.5, "@pluck-note", 1, "@wait"]
]
```

```javascript
[
	"foo", "@spawn", [440, 0.5, "@pluck-note", 0.5, "@wait"]
]
```

```javascript
[
	"bar", "@spawn", [110, 0.5, "@pluck-note", 1, "@wait"]
]
```
```javascript
[
	"foo", "@stop"
]
```

```javascript
[
	"bar", "@stop"
]
```


```javascript
[
	"@loop",[
		"@iter",[0.01,0.2,0.01],"@hat-note",
		"@iter",[1,3],8,"@div","@wait"
	],
	"@loop",[
		["@iter",[14,15,16,17,18],44,"@mul"],"@set-freq",
		0.1,"@set-amp",
		"@pluck",
		"@pick",[5,7],32,"@div","@wait"
	],
	"@loop",[
		["@iter",[16,6,15,5,10,4,12],44,"@mul"],"@set-freq",
		1,"@pick",[2,3,5,6,5,6,5],"@div","@set-amp",
		"@pluck",
		"@iter",[5,1,9,1],32,"@div","@wait"
	]
]
```

---

## Sending out over a websocket

There is also a command for sending data out over a websocket. By default the browser will try to connect to "ws://localhost:8080/", and if it can, it will use timing from the external source.

```javascript
[
	"@loop", [
		"pluck", "@iter", [["@iter", [440, 330]], 220, 165], "@ws-2",
		0.25, "@wait"
	],
	"@loop", [
		"@iter", ["kick", "snare"], "@ws-1",
		0.75, "@wait"
	]
]
```

This feature is not yet implemented.
