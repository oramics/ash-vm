{
	// get rid of non-objects
    function flatten(a, result) {
        for (var i=0; i<a.length; i++) {
        	var item = a[i];
            if (Array.isArray(item)) {
            	flatten(item, result);
            } else if (item) {
            	result.push(item);
            }
        }
        return result;
    }
}

Start = a:_ b:Action? c:_ d:(Rule _)* {
	return flatten([a,b,c,d], []);
}

Rule = RuleDef _ StringAnnotation? _ "=" _ RuleBody

Argument = a:$([a-zA-Z] [a-zA-Z0-9_]* ":") b:Term {
	return [{ 
    	type: "argument", 
        text: a,
        location: location()
    }, b];
} / RuleName

RuleBody = Term*

Term = Rule 
 / StringLiteral 
 / PredicateAction
 / Argument
 / Operator
 / Range
 / Paren
 / Action
 / __

PredicateOperator = [!&] {
	return {
    	type: "operator",
        text: text(),
        location: location()
    };
}

PredicateAction = PredicateOperator _ Action

Paren = "(" (!")" Term)* ")"

Range = "[" (!"]" ("\\]" / .))* "]" {
	return {
    	type: "range",
        text: text(),
        location: location()
    };
}

Operator = ([.*+/!&$?]) {
	return {
    	type: "operator",
        text: text(),
        location: location()
    };
}

RuleName "rulename"
  = [a-zA-Z_] [a-zA-Z0-9_]* {
      return {
        type: "rulename",
        text: text(),
        location: location()
      };
    }
    
RuleDef "rulename"
  = [a-zA-Z_] [a-zA-Z0-9_]* {
      return {
        type: "ruledef",
        text: text(),
        location: location()
      };
    }

Action = "{" (StringLiteral / Action / (!"}" .))* "}" { 
	return { 
    	type: "js", 
        text: text(),
        location: location()
    }; 
}

_  = (WhiteSpace / LineTerminator / Comment)* 
__ = (WhiteSpace / LineTerminator / Comment)+ 

Comment "comment" 
= (MultiLineComment / SingleLineComment)

/// HELPERS STOLEN FROM JAVASCRIPT GRAMMAR ///

WhiteSpace "whitespace"
  = "\t"
  / "\v"
  / "\f"
  / " "
  / "\u00A0"
  / "\uFEFF"
  / Zs
Zs = [\u0020\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]

LineTerminator = [\n\r\u2028\u2029]
LineTerminatorSequence "end of line"
  = "\n"
  / "\r\n"
  / "\r"
  / "\u2028"
  / "\u2029"

Comment "comment" = MultiLineComment / SingleLineComment
MultiLineComment = ("/*" (!"*/" .)* "*/") {
	return {
    	type: "comment",
        text: text(),
        //location: location()
    }
}
SingleLineComment = ("//" (!LineTerminator .)*) {
	return {
    	type: "comment",
        text: text(),
        //location: location()
    }
}

StringLiteral "string"
  = ('"' chars:DoubleStringCharacter* '"' 
  / "'" chars:SingleStringCharacter* "'") {
      return { type: "string", text: text() };
    }
    
StringAnnotation "string"
  = ('"' chars:DoubleStringCharacter* '"' 
  / "'" chars:SingleStringCharacter* "'") {
      return { type: "comment", text: text() };
    }

DoubleStringCharacter
  = !('"' / "\\" / LineTerminator) . { return text(); }
  / "\\" sequence:EscapeSequence { return sequence; }
  / LineContinuation

SingleStringCharacter
  = !("'" / "\\" / LineTerminator) . { return text(); }
  / "\\" sequence:EscapeSequence { return sequence; }
  / LineContinuation

LineContinuation
  = "\\" LineTerminatorSequence { return ""; }
  
EscapeSequence
  = CharacterEscapeSequence
  / "0" ![0-9] { return "\0"; }
  / HexEscapeSequence
  / UnicodeEscapeSequence

CharacterEscapeSequence
  = SingleEscapeCharacter
  / NonEscapeCharacter

SingleEscapeCharacter
  = "'"
  / '"'
  / "\\"
  / "b"  { return "\b";   }
  / "f"  { return "\f";   }
  / "n"  { return "\n";   }
  / "r"  { return "\r";   }
  / "t"  { return "\t";   }
  / "v"  { return "\x0B"; }   // IE does not recognize "\v".

NonEscapeCharacter
  = !(EscapeCharacter / LineTerminator) . { return text(); }

EscapeCharacter
  = SingleEscapeCharacter
  / [0-9]
  / "x"
  / "u"
  
HexEscapeSequence
  = "x" digits:$(HexDigit HexDigit) {
      return String.fromCharCode(parseInt(digits, 16));
    }

HexDigit
  = [0-9a-f]i
  
UnicodeEscapeSequence
  = "u" digits:$(HexDigit HexDigit HexDigit HexDigit) {
      return String.fromCharCode(parseInt(digits, 16));
    }
    













