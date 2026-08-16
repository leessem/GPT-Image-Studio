import { app, session, ipcMain, shell, webContents, BrowserWindow, dialog } from "electron";
import { fileURLToPath } from "node:url";
import path$9 from "node:path";
import fs$a from "node:fs";
import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import require$$0 from "fs";
import require$$2$1 from "events";
import require$$1 from "path";
import require$$0$1 from "constants";
import require$$0$2 from "stream";
import require$$0$3 from "util";
import require$$5 from "assert";
import require$$0$4 from "buffer";
import require$$0$5 from "zlib";
import require$$4 from "string_decoder";
var commonjsGlobal = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
function getDefaultExportFromCjs(x) {
  return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
}
function getAugmentedNamespace(n) {
  if (n.__esModule) return n;
  var f = n.default;
  if (typeof f == "function") {
    var a = function a2() {
      if (this instanceof a2) {
        return Reflect.construct(f, arguments, this.constructor);
      }
      return f.apply(this, arguments);
    };
    a.prototype = f.prototype;
  } else a = {};
  Object.defineProperty(a, "__esModule", { value: true });
  Object.keys(n).forEach(function(k) {
    var d = Object.getOwnPropertyDescriptor(n, k);
    Object.defineProperty(a, k, d.get ? d : {
      enumerable: true,
      get: function() {
        return n[k];
      }
    });
  });
  return a;
}
const isWindows$1 = typeof process === "object" && process && process.platform === "win32";
var path$8 = isWindows$1 ? { sep: "\\" } : { sep: "/" };
var balancedMatch = balanced$2;
function balanced$2(a, b, str) {
  if (a instanceof RegExp) a = maybeMatch(a, str);
  if (b instanceof RegExp) b = maybeMatch(b, str);
  var r = range$1(a, b, str);
  return r && {
    start: r[0],
    end: r[1],
    pre: str.slice(0, r[0]),
    body: str.slice(r[0] + a.length, r[1]),
    post: str.slice(r[1] + b.length)
  };
}
function maybeMatch(reg, str) {
  var m = str.match(reg);
  return m ? m[0] : null;
}
balanced$2.range = range$1;
function range$1(a, b, str) {
  var begs, beg, left, right, result;
  var ai = str.indexOf(a);
  var bi = str.indexOf(b, ai + 1);
  var i = ai;
  if (ai >= 0 && bi > 0) {
    if (a === b) {
      return [ai, bi];
    }
    begs = [];
    left = str.length;
    while (i >= 0 && !result) {
      if (i == ai) {
        begs.push(i);
        ai = str.indexOf(a, i + 1);
      } else if (begs.length == 1) {
        result = [begs.pop(), bi];
      } else {
        beg = begs.pop();
        if (beg < left) {
          left = beg;
          right = bi;
        }
        bi = str.indexOf(b, i + 1);
      }
      i = ai < bi && ai >= 0 ? ai : bi;
    }
    if (begs.length) {
      result = [left, right];
    }
  }
  return result;
}
var balanced$1 = balancedMatch;
var braceExpansion$1 = expandTop$1;
var escSlash$1 = "\0SLASH" + Math.random() + "\0";
var escOpen$1 = "\0OPEN" + Math.random() + "\0";
var escClose$1 = "\0CLOSE" + Math.random() + "\0";
var escComma$1 = "\0COMMA" + Math.random() + "\0";
var escPeriod$1 = "\0PERIOD" + Math.random() + "\0";
function numeric$1(str) {
  return parseInt(str, 10) == str ? parseInt(str, 10) : str.charCodeAt(0);
}
function escapeBraces$1(str) {
  return str.split("\\\\").join(escSlash$1).split("\\{").join(escOpen$1).split("\\}").join(escClose$1).split("\\,").join(escComma$1).split("\\.").join(escPeriod$1);
}
function unescapeBraces$1(str) {
  return str.split(escSlash$1).join("\\").split(escOpen$1).join("{").split(escClose$1).join("}").split(escComma$1).join(",").split(escPeriod$1).join(".");
}
function parseCommaParts$1(str) {
  if (!str)
    return [""];
  var parts = [];
  var m = balanced$1("{", "}", str);
  if (!m)
    return str.split(",");
  var pre = m.pre;
  var body = m.body;
  var post = m.post;
  var p = pre.split(",");
  p[p.length - 1] += "{" + body + "}";
  var postParts = parseCommaParts$1(post);
  if (post.length) {
    p[p.length - 1] += postParts.shift();
    p.push.apply(p, postParts);
  }
  parts.push.apply(parts, p);
  return parts;
}
function expandTop$1(str, options) {
  if (!str)
    return [];
  options = options || {};
  var max = options.max == null ? Infinity : options.max;
  if (str.substr(0, 2) === "{}") {
    str = "\\{\\}" + str.substr(2);
  }
  return expand$3(escapeBraces$1(str), max, true).map(unescapeBraces$1);
}
function embrace$1(str) {
  return "{" + str + "}";
}
function isPadded$1(el) {
  return /^-?0\d/.test(el);
}
function lte$1(i, y) {
  return i <= y;
}
function gte$1(i, y) {
  return i >= y;
}
function expand$3(str, max, isTop) {
  var expansions = [];
  for (; ; ) {
    const m = balanced$1("{", "}", str);
    if (!m) return [str];
    const pre = m.pre;
    if (/\$$/.test(m.pre)) {
      const post2 = m.post.length ? expand$3(m.post, max, false) : [""];
      for (let k2 = 0; k2 < post2.length && k2 < max; k2++) {
        const expansion2 = pre + "{" + m.body + "}" + post2[k2];
        expansions.push(expansion2);
      }
      return expansions;
    }
    var isNumericSequence = /^-?\d+\.\.-?\d+(?:\.\.-?\d+)?$/.test(m.body);
    var isAlphaSequence = /^[a-zA-Z]\.\.[a-zA-Z](?:\.\.-?\d+)?$/.test(m.body);
    var isSequence = isNumericSequence || isAlphaSequence;
    var isOptions = m.body.indexOf(",") >= 0;
    if (!isSequence && !isOptions) {
      if (m.post.match(/,(?!,).*\}/)) {
        str = m.pre + "{" + m.body + escClose$1 + m.post;
        isTop = true;
        continue;
      }
      return [str];
    }
    const post = m.post.length ? expand$3(m.post, max, false) : [""];
    var n;
    if (isSequence) {
      n = m.body.split(/\.\./);
    } else {
      n = parseCommaParts$1(m.body);
      if (n.length === 1) {
        n = expand$3(n[0], max, false).map(embrace$1);
        if (n.length === 1) {
          return post.map(function(p) {
            return m.pre + n[0] + p;
          });
        }
      }
    }
    var N;
    if (isSequence) {
      var x = numeric$1(n[0]);
      var y = numeric$1(n[1]);
      var width = Math.max(n[0].length, n[1].length);
      var incr = n.length == 3 ? Math.max(Math.abs(numeric$1(n[2])), 1) : 1;
      var test = lte$1;
      var reverse = y < x;
      if (reverse) {
        incr *= -1;
        test = gte$1;
      }
      var pad = n.some(isPadded$1);
      N = [];
      for (var i = x; test(i, y) && N.length < max; i += incr) {
        var c;
        if (isAlphaSequence) {
          c = String.fromCharCode(i);
          if (c === "\\")
            c = "";
        } else {
          c = String(i);
          if (pad) {
            var need = width - c.length;
            if (need > 0) {
              var z = new Array(need + 1).join("0");
              if (i < 0)
                c = "-" + z + c.slice(1);
              else
                c = z + c;
            }
          }
        }
        N.push(c);
      }
    } else {
      N = [];
      for (var j = 0; j < n.length; j++) {
        N.push.apply(N, expand$3(n[j], max, false));
      }
    }
    for (var j = 0; j < N.length; j++) {
      for (var k = 0; k < post.length && expansions.length < max; k++) {
        var expansion = pre + N[j] + post[k];
        if (!isTop || isSequence || expansion)
          expansions.push(expansion);
      }
    }
    return expansions;
  }
}
const minimatch$2 = minimatch_1$1 = (p, pattern, options = {}) => {
  assertValidPattern$1(pattern);
  if (!options.nocomment && pattern.charAt(0) === "#") {
    return false;
  }
  return new Minimatch$3(pattern, options).match(p);
};
var minimatch_1$1 = minimatch$2;
const path$7 = path$8;
minimatch$2.sep = path$7.sep;
const GLOBSTAR$1 = Symbol("globstar **");
minimatch$2.GLOBSTAR = GLOBSTAR$1;
const expand$2 = braceExpansion$1;
const plTypes$1 = {
  "!": { open: "(?:(?!(?:", close: "))[^/]*?)" },
  "?": { open: "(?:", close: ")?" },
  "+": { open: "(?:", close: ")+" },
  "*": { open: "(?:", close: ")*" },
  "@": { open: "(?:", close: ")" }
};
const qmark$1 = "[^/]";
const star$1 = qmark$1 + "*?";
const twoStarDot$1 = "(?:(?!(?:\\/|^)(?:\\.{1,2})($|\\/)).)*?";
const twoStarNoDot$1 = "(?:(?!(?:\\/|^)\\.).)*?";
const charSet$1 = (s) => s.split("").reduce((set, c) => {
  set[c] = true;
  return set;
}, {});
const reSpecials$1 = charSet$1("().*{}+?[]^$\\!");
const addPatternStartSet = charSet$1("[.(");
const slashSplit$1 = /\/+/;
minimatch$2.filter = (pattern, options = {}) => (p, i, list) => minimatch$2(p, pattern, options);
const ext$1 = (a, b = {}) => {
  const t = {};
  Object.keys(a).forEach((k) => t[k] = a[k]);
  Object.keys(b).forEach((k) => t[k] = b[k]);
  return t;
};
minimatch$2.defaults = (def) => {
  if (!def || typeof def !== "object" || !Object.keys(def).length) {
    return minimatch$2;
  }
  const orig = minimatch$2;
  const m = (p, pattern, options) => orig(p, pattern, ext$1(def, options));
  m.Minimatch = class Minimatch extends orig.Minimatch {
    constructor(pattern, options) {
      super(pattern, ext$1(def, options));
    }
  };
  m.Minimatch.defaults = (options) => orig.defaults(ext$1(def, options)).Minimatch;
  m.filter = (pattern, options) => orig.filter(pattern, ext$1(def, options));
  m.defaults = (options) => orig.defaults(ext$1(def, options));
  m.makeRe = (pattern, options) => orig.makeRe(pattern, ext$1(def, options));
  m.braceExpand = (pattern, options) => orig.braceExpand(pattern, ext$1(def, options));
  m.match = (list, pattern, options) => orig.match(list, pattern, ext$1(def, options));
  return m;
};
minimatch$2.braceExpand = (pattern, options) => braceExpand$1(pattern, options);
const braceExpand$1 = (pattern, options = {}) => {
  assertValidPattern$1(pattern);
  if (options.nobrace || !/\{(?:(?!\{).)*\}/.test(pattern)) {
    return [pattern];
  }
  return expand$2(pattern);
};
const MAX_PATTERN_LENGTH$1 = 1024 * 64;
const assertValidPattern$1 = (pattern) => {
  if (typeof pattern !== "string") {
    throw new TypeError("invalid pattern");
  }
  if (pattern.length > MAX_PATTERN_LENGTH$1) {
    throw new TypeError("pattern is too long");
  }
};
const SUBPARSE$1 = Symbol("subparse");
minimatch$2.makeRe = (pattern, options) => new Minimatch$3(pattern, options || {}).makeRe();
minimatch$2.match = (list, pattern, options = {}) => {
  const mm = new Minimatch$3(pattern, options);
  list = list.filter((f) => mm.match(f));
  if (mm.options.nonull && !list.length) {
    list.push(pattern);
  }
  return list;
};
const globUnescape$1 = (s) => s.replace(/\\(.)/g, "$1");
const charUnescape = (s) => s.replace(/\\([^-\]])/g, "$1");
const regExpEscape$1 = (s) => s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
const braExpEscape = (s) => s.replace(/[[\]\\]/g, "\\$&");
let Minimatch$3 = class Minimatch {
  constructor(pattern, options) {
    assertValidPattern$1(pattern);
    if (!options) options = {};
    this.options = options;
    this.maxGlobstarRecursion = options.maxGlobstarRecursion !== void 0 ? options.maxGlobstarRecursion : 200;
    this.set = [];
    this.pattern = pattern;
    this.windowsPathsNoEscape = !!options.windowsPathsNoEscape || options.allowWindowsEscape === false;
    if (this.windowsPathsNoEscape) {
      this.pattern = this.pattern.replace(/\\/g, "/");
    }
    this.regexp = null;
    this.negate = false;
    this.comment = false;
    this.empty = false;
    this.partial = !!options.partial;
    this.make();
  }
  debug() {
  }
  make() {
    const pattern = this.pattern;
    const options = this.options;
    if (!options.nocomment && pattern.charAt(0) === "#") {
      this.comment = true;
      return;
    }
    if (!pattern) {
      this.empty = true;
      return;
    }
    this.parseNegate();
    let set = this.globSet = this.braceExpand();
    if (options.debug) this.debug = (...args) => console.error(...args);
    this.debug(this.pattern, set);
    set = this.globParts = set.map((s) => s.split(slashSplit$1));
    this.debug(this.pattern, set);
    set = set.map((s, si, set2) => s.map(this.parse, this));
    this.debug(this.pattern, set);
    set = set.filter((s) => s.indexOf(false) === -1);
    this.debug(this.pattern, set);
    this.set = set;
  }
  parseNegate() {
    if (this.options.nonegate) return;
    const pattern = this.pattern;
    let negate = false;
    let negateOffset = 0;
    for (let i = 0; i < pattern.length && pattern.charAt(i) === "!"; i++) {
      negate = !negate;
      negateOffset++;
    }
    if (negateOffset) this.pattern = pattern.slice(negateOffset);
    this.negate = negate;
  }
  // set partial to true to test if, for example,
  // "/a/b" matches the start of "/*/b/*/d"
  // Partial means, if you run out of file before you run
  // out of pattern, then that's fine, as long as all
  // the parts match.
  matchOne(file2, pattern, partial) {
    if (pattern.indexOf(GLOBSTAR$1) !== -1) {
      return this._matchGlobstar(file2, pattern, partial, 0, 0);
    }
    return this._matchOne(file2, pattern, partial, 0, 0);
  }
  _matchGlobstar(file2, pattern, partial, fileIndex, patternIndex) {
    let firstgs = -1;
    for (let i = patternIndex; i < pattern.length; i++) {
      if (pattern[i] === GLOBSTAR$1) {
        firstgs = i;
        break;
      }
    }
    let lastgs = -1;
    for (let i = pattern.length - 1; i >= 0; i--) {
      if (pattern[i] === GLOBSTAR$1) {
        lastgs = i;
        break;
      }
    }
    const head = pattern.slice(patternIndex, firstgs);
    const body = partial ? pattern.slice(firstgs + 1) : pattern.slice(firstgs + 1, lastgs);
    const tail = partial ? [] : pattern.slice(lastgs + 1);
    if (head.length) {
      const fileHead = file2.slice(fileIndex, fileIndex + head.length);
      if (!this._matchOne(fileHead, head, partial, 0, 0)) {
        return false;
      }
      fileIndex += head.length;
    }
    let fileTailMatch = 0;
    if (tail.length) {
      if (tail.length + fileIndex > file2.length) return false;
      const tailStart = file2.length - tail.length;
      if (this._matchOne(file2, tail, partial, tailStart, 0)) {
        fileTailMatch = tail.length;
      } else {
        if (file2[file2.length - 1] !== "" || fileIndex + tail.length === file2.length) {
          return false;
        }
        if (!this._matchOne(file2, tail, partial, tailStart - 1, 0)) {
          return false;
        }
        fileTailMatch = tail.length + 1;
      }
    }
    if (!body.length) {
      let sawSome = !!fileTailMatch;
      for (let i = fileIndex; i < file2.length - fileTailMatch; i++) {
        const f = String(file2[i]);
        sawSome = true;
        if (f === "." || f === ".." || !this.options.dot && f.charAt(0) === ".") {
          return false;
        }
      }
      return partial || sawSome;
    }
    const bodySegments = [[[], 0]];
    let currentBody = bodySegments[0];
    let nonGsParts = 0;
    const nonGsPartsSums = [0];
    for (const b of body) {
      if (b === GLOBSTAR$1) {
        nonGsPartsSums.push(nonGsParts);
        currentBody = [[], 0];
        bodySegments.push(currentBody);
      } else {
        currentBody[0].push(b);
        nonGsParts++;
      }
    }
    let idx = bodySegments.length - 1;
    const fileLength = file2.length - fileTailMatch;
    for (const b of bodySegments) {
      b[1] = fileLength - (nonGsPartsSums[idx--] + b[0].length);
    }
    return !!this._matchGlobStarBodySections(
      file2,
      bodySegments,
      fileIndex,
      0,
      partial,
      0,
      !!fileTailMatch
    );
  }
  // return false for "nope, not matching"
  // return null for "not matching, cannot keep trying"
  _matchGlobStarBodySections(file2, bodySegments, fileIndex, bodyIndex, partial, globStarDepth, sawTail) {
    const bs = bodySegments[bodyIndex];
    if (!bs) {
      for (let i = fileIndex; i < file2.length; i++) {
        sawTail = true;
        const f = file2[i];
        if (f === "." || f === ".." || !this.options.dot && f.charAt(0) === ".") {
          return false;
        }
      }
      return sawTail;
    }
    const [body, after] = bs;
    while (fileIndex <= after) {
      const m = this._matchOne(
        file2.slice(0, fileIndex + body.length),
        body,
        partial,
        fileIndex,
        0
      );
      if (m && globStarDepth < this.maxGlobstarRecursion) {
        const sub = this._matchGlobStarBodySections(
          file2,
          bodySegments,
          fileIndex + body.length,
          bodyIndex + 1,
          partial,
          globStarDepth + 1,
          sawTail
        );
        if (sub !== false) {
          return sub;
        }
      }
      const f = file2[fileIndex];
      if (f === "." || f === ".." || !this.options.dot && f.charAt(0) === ".") {
        return false;
      }
      fileIndex++;
    }
    return partial || null;
  }
  _matchOne(file2, pattern, partial, fileIndex, patternIndex) {
    let fi, pi, fl, pl;
    for (fi = fileIndex, pi = patternIndex, fl = file2.length, pl = pattern.length; fi < fl && pi < pl; fi++, pi++) {
      this.debug("matchOne loop");
      const p = pattern[pi];
      const f = file2[fi];
      this.debug(pattern, p, f);
      if (p === false || p === GLOBSTAR$1) return false;
      let hit;
      if (typeof p === "string") {
        hit = f === p;
        this.debug("string match", p, f, hit);
      } else {
        hit = f.match(p);
        this.debug("pattern match", p, f, hit);
      }
      if (!hit) return false;
    }
    if (fi === fl && pi === pl) {
      return true;
    } else if (fi === fl) {
      return partial;
    } else if (pi === pl) {
      return fi === fl - 1 && file2[fi] === "";
    }
    throw new Error("wtf?");
  }
  braceExpand() {
    return braceExpand$1(this.pattern, this.options);
  }
  parse(pattern, isSub) {
    assertValidPattern$1(pattern);
    const options = this.options;
    if (pattern === "**") {
      if (!options.noglobstar)
        return GLOBSTAR$1;
      else
        pattern = "*";
    }
    if (pattern === "") return "";
    let re = "";
    let hasMagic = false;
    let escaping = false;
    const patternListStack = [];
    const negativeLists = [];
    let stateChar;
    let inClass = false;
    let reClassStart = -1;
    let classStart = -1;
    let cs;
    let pl;
    let sp;
    let dotTravAllowed = pattern.charAt(0) === ".";
    let dotFileAllowed = options.dot || dotTravAllowed;
    const patternStart = () => dotTravAllowed ? "" : dotFileAllowed ? "(?!(?:^|\\/)\\.{1,2}(?:$|\\/))" : "(?!\\.)";
    const subPatternStart = (p) => p.charAt(0) === "." ? "" : options.dot ? "(?!(?:^|\\/)\\.{1,2}(?:$|\\/))" : "(?!\\.)";
    const clearStateChar = () => {
      if (stateChar) {
        switch (stateChar) {
          case "*":
            re += star$1;
            hasMagic = true;
            break;
          case "?":
            re += qmark$1;
            hasMagic = true;
            break;
          default:
            re += "\\" + stateChar;
            break;
        }
        this.debug("clearStateChar %j %j", stateChar, re);
        stateChar = false;
      }
    };
    for (let i = 0, c; i < pattern.length && (c = pattern.charAt(i)); i++) {
      this.debug("%s	%s %s %j", pattern, i, re, c);
      if (escaping) {
        if (c === "/") {
          return false;
        }
        if (reSpecials$1[c]) {
          re += "\\";
        }
        re += c;
        escaping = false;
        continue;
      }
      switch (c) {
        case "/": {
          return false;
        }
        case "\\":
          if (inClass && pattern.charAt(i + 1) === "-") {
            re += c;
            continue;
          }
          clearStateChar();
          escaping = true;
          continue;
        case "?":
        case "*":
        case "+":
        case "@":
        case "!":
          this.debug("%s	%s %s %j <-- stateChar", pattern, i, re, c);
          if (inClass) {
            this.debug("  in class");
            if (c === "!" && i === classStart + 1) c = "^";
            re += c;
            continue;
          }
          if (c === "*" && stateChar === "*") continue;
          this.debug("call clearStateChar %j", stateChar);
          clearStateChar();
          stateChar = c;
          if (options.noext) clearStateChar();
          continue;
        case "(": {
          if (inClass) {
            re += "(";
            continue;
          }
          if (!stateChar) {
            re += "\\(";
            continue;
          }
          const plEntry = {
            type: stateChar,
            start: i - 1,
            reStart: re.length,
            open: plTypes$1[stateChar].open,
            close: plTypes$1[stateChar].close
          };
          this.debug(this.pattern, "	", plEntry);
          patternListStack.push(plEntry);
          re += plEntry.open;
          if (plEntry.start === 0 && plEntry.type !== "!") {
            dotTravAllowed = true;
            re += subPatternStart(pattern.slice(i + 1));
          }
          this.debug("plType %j %j", stateChar, re);
          stateChar = false;
          continue;
        }
        case ")": {
          const plEntry = patternListStack[patternListStack.length - 1];
          if (inClass || !plEntry) {
            re += "\\)";
            continue;
          }
          patternListStack.pop();
          clearStateChar();
          hasMagic = true;
          pl = plEntry;
          re += pl.close;
          if (pl.type === "!") {
            negativeLists.push(Object.assign(pl, { reEnd: re.length }));
          }
          continue;
        }
        case "|": {
          const plEntry = patternListStack[patternListStack.length - 1];
          if (inClass || !plEntry) {
            re += "\\|";
            continue;
          }
          clearStateChar();
          re += "|";
          if (plEntry.start === 0 && plEntry.type !== "!") {
            dotTravAllowed = true;
            re += subPatternStart(pattern.slice(i + 1));
          }
          continue;
        }
        case "[":
          clearStateChar();
          if (inClass) {
            re += "\\" + c;
            continue;
          }
          inClass = true;
          classStart = i;
          reClassStart = re.length;
          re += c;
          continue;
        case "]":
          if (i === classStart + 1 || !inClass) {
            re += "\\" + c;
            continue;
          }
          cs = pattern.substring(classStart + 1, i);
          try {
            RegExp("[" + braExpEscape(charUnescape(cs)) + "]");
            re += c;
          } catch (er) {
            re = re.substring(0, reClassStart) + "(?:$.)";
          }
          hasMagic = true;
          inClass = false;
          continue;
        default:
          clearStateChar();
          if (reSpecials$1[c] && !(c === "^" && inClass)) {
            re += "\\";
          }
          re += c;
          break;
      }
    }
    if (inClass) {
      cs = pattern.slice(classStart + 1);
      sp = this.parse(cs, SUBPARSE$1);
      re = re.substring(0, reClassStart) + "\\[" + sp[0];
      hasMagic = hasMagic || sp[1];
    }
    for (pl = patternListStack.pop(); pl; pl = patternListStack.pop()) {
      let tail;
      tail = re.slice(pl.reStart + pl.open.length);
      this.debug("setting tail", re, pl);
      tail = tail.replace(/((?:\\{2}){0,64})(\\?)\|/g, (_2, $1, $2) => {
        if (!$2) {
          $2 = "\\";
        }
        return $1 + $1 + $2 + "|";
      });
      this.debug("tail=%j\n   %s", tail, tail, pl, re);
      const t = pl.type === "*" ? star$1 : pl.type === "?" ? qmark$1 : "\\" + pl.type;
      hasMagic = true;
      re = re.slice(0, pl.reStart) + t + "\\(" + tail;
    }
    clearStateChar();
    if (escaping) {
      re += "\\\\";
    }
    const addPatternStart = addPatternStartSet[re.charAt(0)];
    for (let n = negativeLists.length - 1; n > -1; n--) {
      const nl = negativeLists[n];
      const nlBefore = re.slice(0, nl.reStart);
      const nlFirst = re.slice(nl.reStart, nl.reEnd - 8);
      let nlAfter = re.slice(nl.reEnd);
      const nlLast = re.slice(nl.reEnd - 8, nl.reEnd) + nlAfter;
      const closeParensBefore = nlBefore.split(")").length;
      const openParensBefore = nlBefore.split("(").length - closeParensBefore;
      let cleanAfter = nlAfter;
      for (let i = 0; i < openParensBefore; i++) {
        cleanAfter = cleanAfter.replace(/\)[+*?]?/, "");
      }
      nlAfter = cleanAfter;
      const dollar = nlAfter === "" && isSub !== SUBPARSE$1 ? "(?:$|\\/)" : "";
      re = nlBefore + nlFirst + nlAfter + dollar + nlLast;
    }
    if (re !== "" && hasMagic) {
      re = "(?=.)" + re;
    }
    if (addPatternStart) {
      re = patternStart() + re;
    }
    if (isSub === SUBPARSE$1) {
      return [re, hasMagic];
    }
    if (options.nocase && !hasMagic) {
      hasMagic = pattern.toUpperCase() !== pattern.toLowerCase();
    }
    if (!hasMagic) {
      return globUnescape$1(pattern);
    }
    const flags = options.nocase ? "i" : "";
    try {
      return Object.assign(new RegExp("^" + re + "$", flags), {
        _glob: pattern,
        _src: re
      });
    } catch (er) {
      return new RegExp("$.");
    }
  }
  makeRe() {
    if (this.regexp || this.regexp === false) return this.regexp;
    const set = this.set;
    if (!set.length) {
      this.regexp = false;
      return this.regexp;
    }
    const options = this.options;
    const twoStar = options.noglobstar ? star$1 : options.dot ? twoStarDot$1 : twoStarNoDot$1;
    const flags = options.nocase ? "i" : "";
    let re = set.map((pattern) => {
      pattern = pattern.map(
        (p) => typeof p === "string" ? regExpEscape$1(p) : p === GLOBSTAR$1 ? GLOBSTAR$1 : p._src
      ).reduce((set2, p) => {
        if (!(set2[set2.length - 1] === GLOBSTAR$1 && p === GLOBSTAR$1)) {
          set2.push(p);
        }
        return set2;
      }, []);
      pattern.forEach((p, i) => {
        if (p !== GLOBSTAR$1 || pattern[i - 1] === GLOBSTAR$1) {
          return;
        }
        if (i === 0) {
          if (pattern.length > 1) {
            pattern[i + 1] = "(?:\\/|" + twoStar + "\\/)?" + pattern[i + 1];
          } else {
            pattern[i] = twoStar;
          }
        } else if (i === pattern.length - 1) {
          pattern[i - 1] += "(?:\\/|" + twoStar + ")?";
        } else {
          pattern[i - 1] += "(?:\\/|\\/" + twoStar + "\\/)" + pattern[i + 1];
          pattern[i + 1] = GLOBSTAR$1;
        }
      });
      return pattern.filter((p) => p !== GLOBSTAR$1).join("/");
    }).join("|");
    re = "^(?:" + re + ")$";
    if (this.negate) re = "^(?!" + re + ").*$";
    try {
      this.regexp = new RegExp(re, flags);
    } catch (ex) {
      this.regexp = false;
    }
    return this.regexp;
  }
  match(f, partial = this.partial) {
    this.debug("match", f, this.pattern);
    if (this.comment) return false;
    if (this.empty) return f === "";
    if (f === "/" && partial) return true;
    const options = this.options;
    if (path$7.sep !== "/") {
      f = f.split(path$7.sep).join("/");
    }
    f = f.split(slashSplit$1);
    this.debug(this.pattern, "split", f);
    const set = this.set;
    this.debug(this.pattern, "set", set);
    let filename;
    for (let i = f.length - 1; i >= 0; i--) {
      filename = f[i];
      if (filename) break;
    }
    for (let i = 0; i < set.length; i++) {
      const pattern = set[i];
      let file2 = f;
      if (options.matchBase && pattern.length === 1) {
        file2 = [filename];
      }
      const hit = this.matchOne(file2, pattern, partial);
      if (hit) {
        if (options.flipNegate) return true;
        return !this.negate;
      }
    }
    if (options.flipNegate) return false;
    return this.negate;
  }
  static defaults(def) {
    return minimatch$2.defaults(def).Minimatch;
  }
};
minimatch$2.Minimatch = Minimatch$3;
var readdirGlob_1 = readdirGlob;
const fs$9 = require$$0;
const { EventEmitter } = require$$2$1;
const { Minimatch: Minimatch$2 } = minimatch_1$1;
const { resolve } = require$$1;
function readdir(dir2, strict) {
  return new Promise((resolve2, reject2) => {
    fs$9.readdir(dir2, { withFileTypes: true }, (err, files) => {
      if (err) {
        switch (err.code) {
          case "ENOTDIR":
            if (strict) {
              reject2(err);
            } else {
              resolve2([]);
            }
            break;
          case "ENOTSUP":
          case "ENOENT":
          case "ENAMETOOLONG":
          case "UNKNOWN":
            resolve2([]);
            break;
          case "ELOOP":
          default:
            reject2(err);
            break;
        }
      } else {
        resolve2(files);
      }
    });
  });
}
function stat(file2, followSymlinks) {
  return new Promise((resolve2, reject2) => {
    const statFunc = followSymlinks ? fs$9.stat : fs$9.lstat;
    statFunc(file2, (err, stats) => {
      if (err) {
        switch (err.code) {
          case "ENOENT":
            if (followSymlinks) {
              resolve2(stat(file2, false));
            } else {
              resolve2(null);
            }
            break;
          default:
            resolve2(null);
            break;
        }
      } else {
        resolve2(stats);
      }
    });
  });
}
async function* exploreWalkAsync(dir2, path2, followSymlinks, useStat, shouldSkip, strict) {
  let files = await readdir(path2 + dir2, strict);
  for (const file2 of files) {
    let name = file2.name;
    if (name === void 0) {
      name = file2;
      useStat = true;
    }
    const filename = dir2 + "/" + name;
    const relative = filename.slice(1);
    const absolute = path2 + "/" + relative;
    let stats = null;
    if (useStat || followSymlinks) {
      stats = await stat(absolute, followSymlinks);
    }
    if (!stats && file2.name !== void 0) {
      stats = file2;
    }
    if (stats === null) {
      stats = { isDirectory: () => false };
    }
    if (stats.isDirectory()) {
      if (!shouldSkip(relative)) {
        yield { relative, absolute, stats };
        yield* exploreWalkAsync(filename, path2, followSymlinks, useStat, shouldSkip, false);
      }
    } else {
      yield { relative, absolute, stats };
    }
  }
}
async function* explore(path2, followSymlinks, useStat, shouldSkip) {
  yield* exploreWalkAsync("", path2, followSymlinks, useStat, shouldSkip, true);
}
function readOptions(options) {
  return {
    pattern: options.pattern,
    dot: !!options.dot,
    noglobstar: !!options.noglobstar,
    matchBase: !!options.matchBase,
    nocase: !!options.nocase,
    ignore: options.ignore,
    skip: options.skip,
    follow: !!options.follow,
    stat: !!options.stat,
    nodir: !!options.nodir,
    mark: !!options.mark,
    silent: !!options.silent,
    absolute: !!options.absolute
  };
}
class ReaddirGlob extends EventEmitter {
  constructor(cwd2, options, cb) {
    super();
    if (typeof options === "function") {
      cb = options;
      options = null;
    }
    this.options = readOptions(options || {});
    this.matchers = [];
    if (this.options.pattern) {
      const matchers = Array.isArray(this.options.pattern) ? this.options.pattern : [this.options.pattern];
      this.matchers = matchers.map(
        (m) => new Minimatch$2(m, {
          dot: this.options.dot,
          noglobstar: this.options.noglobstar,
          matchBase: this.options.matchBase,
          nocase: this.options.nocase
        })
      );
    }
    this.ignoreMatchers = [];
    if (this.options.ignore) {
      const ignorePatterns = Array.isArray(this.options.ignore) ? this.options.ignore : [this.options.ignore];
      this.ignoreMatchers = ignorePatterns.map(
        (ignore) => new Minimatch$2(ignore, { dot: true })
      );
    }
    this.skipMatchers = [];
    if (this.options.skip) {
      const skipPatterns = Array.isArray(this.options.skip) ? this.options.skip : [this.options.skip];
      this.skipMatchers = skipPatterns.map(
        (skip) => new Minimatch$2(skip, { dot: true })
      );
    }
    this.iterator = explore(resolve(cwd2 || "."), this.options.follow, this.options.stat, this._shouldSkipDirectory.bind(this));
    this.paused = false;
    this.inactive = false;
    this.aborted = false;
    if (cb) {
      this._matches = [];
      this.on("match", (match2) => this._matches.push(this.options.absolute ? match2.absolute : match2.relative));
      this.on("error", (err) => cb(err));
      this.on("end", () => cb(null, this._matches));
    }
    setTimeout(() => this._next(), 0);
  }
  _shouldSkipDirectory(relative) {
    return this.skipMatchers.some((m) => m.match(relative));
  }
  _fileMatches(relative, isDirectory) {
    const file2 = relative + (isDirectory ? "/" : "");
    return (this.matchers.length === 0 || this.matchers.some((m) => m.match(file2))) && !this.ignoreMatchers.some((m) => m.match(file2)) && (!this.options.nodir || !isDirectory);
  }
  _next() {
    if (!this.paused && !this.aborted) {
      this.iterator.next().then((obj) => {
        if (!obj.done) {
          const isDirectory = obj.value.stats.isDirectory();
          if (this._fileMatches(obj.value.relative, isDirectory)) {
            let relative = obj.value.relative;
            let absolute = obj.value.absolute;
            if (this.options.mark && isDirectory) {
              relative += "/";
              absolute += "/";
            }
            if (this.options.stat) {
              this.emit("match", { relative, absolute, stat: obj.value.stats });
            } else {
              this.emit("match", { relative, absolute });
            }
          }
          this._next(this.iterator);
        } else {
          this.emit("end");
        }
      }).catch((err) => {
        this.abort();
        this.emit("error", err);
        if (!err.code && !this.options.silent) {
          console.error(err);
        }
      });
    } else {
      this.inactive = true;
    }
  }
  abort() {
    this.aborted = true;
  }
  pause() {
    this.paused = true;
  }
  resume() {
    this.paused = false;
    if (this.inactive) {
      this.inactive = false;
      this._next();
    }
  }
}
function readdirGlob(pattern, options, cb) {
  return new ReaddirGlob(pattern, options, cb);
}
readdirGlob.ReaddirGlob = ReaddirGlob;
function apply$3(fn, ...args) {
  return (...callArgs) => fn(...args, ...callArgs);
}
function initialParams(fn) {
  return function(...args) {
    var callback = args.pop();
    return fn.call(this, args, callback);
  };
}
var hasQueueMicrotask = typeof queueMicrotask === "function" && queueMicrotask;
var hasSetImmediate = typeof setImmediate === "function" && setImmediate;
var hasNextTick = typeof process === "object" && typeof process.nextTick === "function";
function fallback(fn) {
  setTimeout(fn, 0);
}
function wrap(defer) {
  return (fn, ...args) => defer(() => fn(...args));
}
var _defer$1;
if (hasQueueMicrotask) {
  _defer$1 = queueMicrotask;
} else if (hasSetImmediate) {
  _defer$1 = setImmediate;
} else if (hasNextTick) {
  _defer$1 = process.nextTick;
} else {
  _defer$1 = fallback;
}
var setImmediate$1 = wrap(_defer$1);
function asyncify(func) {
  if (isAsync(func)) {
    return function(...args) {
      const callback = args.pop();
      const promise = func.apply(this, args);
      return handlePromise(promise, callback);
    };
  }
  return initialParams(function(args, callback) {
    var result;
    try {
      result = func.apply(this, args);
    } catch (e) {
      return callback(e);
    }
    if (result && typeof result.then === "function") {
      return handlePromise(result, callback);
    } else {
      callback(null, result);
    }
  });
}
function handlePromise(promise, callback) {
  return promise.then((value) => {
    invokeCallback(callback, null, value);
  }, (err) => {
    invokeCallback(callback, err && (err instanceof Error || err.message) ? err : new Error(err));
  });
}
function invokeCallback(callback, error2, value) {
  try {
    callback(error2, value);
  } catch (err) {
    setImmediate$1((e) => {
      throw e;
    }, err);
  }
}
function isAsync(fn) {
  return fn[Symbol.toStringTag] === "AsyncFunction";
}
function isAsyncGenerator(fn) {
  return fn[Symbol.toStringTag] === "AsyncGenerator";
}
function isAsyncIterable(obj) {
  return typeof obj[Symbol.asyncIterator] === "function";
}
function wrapAsync(asyncFn) {
  if (typeof asyncFn !== "function") throw new Error("expected a function");
  return isAsync(asyncFn) ? asyncify(asyncFn) : asyncFn;
}
function awaitify(asyncFn, arity) {
  if (!arity) arity = asyncFn.length;
  if (!arity) throw new Error("arity is undefined");
  function awaitable(...args) {
    if (typeof args[arity - 1] === "function") {
      return asyncFn.apply(this, args);
    }
    return new Promise((resolve2, reject2) => {
      args[arity - 1] = (err, ...cbArgs) => {
        if (err) return reject2(err);
        resolve2(cbArgs.length > 1 ? cbArgs : cbArgs[0]);
      };
      asyncFn.apply(this, args);
    });
  }
  return awaitable;
}
function applyEach$1(eachfn) {
  return function applyEach2(fns, ...callArgs) {
    const go = awaitify(function(callback) {
      var that = this;
      return eachfn(fns, (fn, cb) => {
        wrapAsync(fn).apply(that, callArgs.concat(cb));
      }, callback);
    });
    return go;
  };
}
function _asyncMap(eachfn, arr, iteratee, callback) {
  arr = arr || [];
  var results = [];
  var counter = 0;
  var _iteratee = wrapAsync(iteratee);
  return eachfn(arr, (value, _2, iterCb) => {
    var index2 = counter++;
    _iteratee(value, (err, v) => {
      results[index2] = v;
      iterCb(err);
    });
  }, (err) => {
    callback(err, results);
  });
}
function isArrayLike$4(value) {
  return value && typeof value.length === "number" && value.length >= 0 && value.length % 1 === 0;
}
const breakLoop = {};
function once$4(fn) {
  function wrapper(...args) {
    if (fn === null) return;
    var callFn = fn;
    fn = null;
    callFn.apply(this, args);
  }
  Object.assign(wrapper, fn);
  return wrapper;
}
function getIterator(coll) {
  return coll[Symbol.iterator] && coll[Symbol.iterator]();
}
function createArrayIterator(coll) {
  var i = -1;
  var len = coll.length;
  return function next() {
    return ++i < len ? { value: coll[i], key: i } : null;
  };
}
function createES2015Iterator(iterator) {
  var i = -1;
  return function next() {
    var item = iterator.next();
    if (item.done)
      return null;
    i++;
    return { value: item.value, key: i };
  };
}
function createObjectIterator(obj) {
  var okeys = obj ? Object.keys(obj) : [];
  var i = -1;
  var len = okeys.length;
  return function next() {
    var key = okeys[++i];
    if (key === "__proto__") {
      return next();
    }
    return i < len ? { value: obj[key], key } : null;
  };
}
function createIterator(coll) {
  if (isArrayLike$4(coll)) {
    return createArrayIterator(coll);
  }
  var iterator = getIterator(coll);
  return iterator ? createES2015Iterator(iterator) : createObjectIterator(coll);
}
function onlyOnce(fn) {
  return function(...args) {
    if (fn === null) throw new Error("Callback was already called.");
    var callFn = fn;
    fn = null;
    callFn.apply(this, args);
  };
}
function asyncEachOfLimit(generator, limit, iteratee, callback) {
  let done = false;
  let canceled = false;
  let awaiting = false;
  let running = 0;
  let idx = 0;
  function replenish() {
    if (running >= limit || awaiting || done) return;
    awaiting = true;
    generator.next().then(({ value, done: iterDone }) => {
      if (canceled || done) return;
      awaiting = false;
      if (iterDone) {
        done = true;
        if (running <= 0) {
          callback(null);
        }
        return;
      }
      running++;
      iteratee(value, idx, iterateeCallback);
      idx++;
      replenish();
    }).catch(handleError);
  }
  function iterateeCallback(err, result) {
    running -= 1;
    if (canceled) return;
    if (err) return handleError(err);
    if (err === false) {
      done = true;
      canceled = true;
      return;
    }
    if (result === breakLoop || done && running <= 0) {
      done = true;
      return callback(null);
    }
    replenish();
  }
  function handleError(err) {
    if (canceled) return;
    awaiting = false;
    done = true;
    callback(err);
  }
  replenish();
}
var eachOfLimit$2 = (limit) => {
  return (obj, iteratee, callback) => {
    callback = once$4(callback);
    if (limit <= 0) {
      throw new RangeError("concurrency limit cannot be less than 1");
    }
    if (!obj) {
      return callback(null);
    }
    if (isAsyncGenerator(obj)) {
      return asyncEachOfLimit(obj, limit, iteratee, callback);
    }
    if (isAsyncIterable(obj)) {
      return asyncEachOfLimit(obj[Symbol.asyncIterator](), limit, iteratee, callback);
    }
    var nextElem = createIterator(obj);
    var done = false;
    var canceled = false;
    var running = 0;
    var looping = false;
    function iterateeCallback(err, value) {
      if (canceled) return;
      running -= 1;
      if (err) {
        done = true;
        callback(err);
      } else if (err === false) {
        done = true;
        canceled = true;
      } else if (value === breakLoop || done && running <= 0) {
        done = true;
        return callback(null);
      } else if (!looping) {
        replenish();
      }
    }
    function replenish() {
      looping = true;
      while (running < limit && !done) {
        var elem = nextElem();
        if (elem === null) {
          done = true;
          if (running <= 0) {
            callback(null);
          }
          return;
        }
        running += 1;
        iteratee(elem.value, elem.key, onlyOnce(iterateeCallback));
      }
      looping = false;
    }
    replenish();
  };
};
function eachOfLimit(coll, limit, iteratee, callback) {
  return eachOfLimit$2(limit)(coll, wrapAsync(iteratee), callback);
}
var eachOfLimit$1 = awaitify(eachOfLimit, 4);
function eachOfArrayLike(coll, iteratee, callback) {
  callback = once$4(callback);
  var index2 = 0, completed = 0, { length } = coll, canceled = false;
  if (length === 0) {
    callback(null);
  }
  function iteratorCallback(err, value) {
    if (err === false) {
      canceled = true;
    }
    if (canceled === true) return;
    if (err) {
      callback(err);
    } else if (++completed === length || value === breakLoop) {
      callback(null);
    }
  }
  for (; index2 < length; index2++) {
    iteratee(coll[index2], index2, onlyOnce(iteratorCallback));
  }
}
function eachOfGeneric(coll, iteratee, callback) {
  return eachOfLimit$1(coll, Infinity, iteratee, callback);
}
function eachOf(coll, iteratee, callback) {
  var eachOfImplementation = isArrayLike$4(coll) ? eachOfArrayLike : eachOfGeneric;
  return eachOfImplementation(coll, wrapAsync(iteratee), callback);
}
var eachOf$1 = awaitify(eachOf, 3);
function map(coll, iteratee, callback) {
  return _asyncMap(eachOf$1, coll, iteratee, callback);
}
var map$1 = awaitify(map, 3);
var applyEach = applyEach$1(map$1);
function eachOfSeries(coll, iteratee, callback) {
  return eachOfLimit$1(coll, 1, iteratee, callback);
}
var eachOfSeries$1 = awaitify(eachOfSeries, 3);
function mapSeries(coll, iteratee, callback) {
  return _asyncMap(eachOfSeries$1, coll, iteratee, callback);
}
var mapSeries$1 = awaitify(mapSeries, 3);
var applyEachSeries = applyEach$1(mapSeries$1);
const PROMISE_SYMBOL = Symbol("promiseCallback");
function promiseCallback() {
  let resolve2, reject2;
  function callback(err, ...args) {
    if (err) return reject2(err);
    resolve2(args.length > 1 ? args : args[0]);
  }
  callback[PROMISE_SYMBOL] = new Promise((res, rej) => {
    resolve2 = res, reject2 = rej;
  });
  return callback;
}
function auto(tasks, concurrency, callback) {
  if (typeof concurrency !== "number") {
    callback = concurrency;
    concurrency = null;
  }
  callback = once$4(callback || promiseCallback());
  var numTasks = Object.keys(tasks).length;
  if (!numTasks) {
    return callback(null);
  }
  if (!concurrency) {
    concurrency = numTasks;
  }
  var results = {};
  var runningTasks = 0;
  var canceled = false;
  var hasError = false;
  var listeners = /* @__PURE__ */ Object.create(null);
  var readyTasks = [];
  var readyToCheck = [];
  var uncheckedDependencies = {};
  Object.keys(tasks).forEach((key) => {
    var task = tasks[key];
    if (!Array.isArray(task)) {
      enqueueTask(key, [task]);
      readyToCheck.push(key);
      return;
    }
    var dependencies = task.slice(0, task.length - 1);
    var remainingDependencies = dependencies.length;
    if (remainingDependencies === 0) {
      enqueueTask(key, task);
      readyToCheck.push(key);
      return;
    }
    uncheckedDependencies[key] = remainingDependencies;
    dependencies.forEach((dependencyName) => {
      if (!tasks[dependencyName]) {
        throw new Error("async.auto task `" + key + "` has a non-existent dependency `" + dependencyName + "` in " + dependencies.join(", "));
      }
      addListener(dependencyName, () => {
        remainingDependencies--;
        if (remainingDependencies === 0) {
          enqueueTask(key, task);
        }
      });
    });
  });
  checkForDeadlocks();
  processQueue();
  function enqueueTask(key, task) {
    readyTasks.push(() => runTask(key, task));
  }
  function processQueue() {
    if (canceled) return;
    if (readyTasks.length === 0 && runningTasks === 0) {
      return callback(null, results);
    }
    while (readyTasks.length && runningTasks < concurrency) {
      var run = readyTasks.shift();
      run();
    }
  }
  function addListener(taskName, fn) {
    var taskListeners = listeners[taskName];
    if (!taskListeners) {
      taskListeners = listeners[taskName] = [];
    }
    taskListeners.push(fn);
  }
  function taskComplete(taskName) {
    var taskListeners = listeners[taskName] || [];
    taskListeners.forEach((fn) => fn());
    processQueue();
  }
  function runTask(key, task) {
    if (hasError) return;
    var taskCallback = onlyOnce((err, ...result) => {
      runningTasks--;
      if (err === false) {
        canceled = true;
        return;
      }
      if (result.length < 2) {
        [result] = result;
      }
      if (err) {
        var safeResults = {};
        Object.keys(results).forEach((rkey) => {
          safeResults[rkey] = results[rkey];
        });
        safeResults[key] = result;
        hasError = true;
        listeners = /* @__PURE__ */ Object.create(null);
        if (canceled) return;
        callback(err, safeResults);
      } else {
        results[key] = result;
        taskComplete(key);
      }
    });
    runningTasks++;
    var taskFn = wrapAsync(task[task.length - 1]);
    if (task.length > 1) {
      taskFn(results, taskCallback);
    } else {
      taskFn(taskCallback);
    }
  }
  function checkForDeadlocks() {
    var currentTask;
    var counter = 0;
    while (readyToCheck.length) {
      currentTask = readyToCheck.pop();
      counter++;
      getDependents(currentTask).forEach((dependent) => {
        if (--uncheckedDependencies[dependent] === 0) {
          readyToCheck.push(dependent);
        }
      });
    }
    if (counter !== numTasks) {
      throw new Error(
        "async.auto cannot execute tasks due to a recursive dependency"
      );
    }
  }
  function getDependents(taskName) {
    var result = [];
    Object.keys(tasks).forEach((key) => {
      const task = tasks[key];
      if (Array.isArray(task) && task.indexOf(taskName) >= 0) {
        result.push(key);
      }
    });
    return result;
  }
  return callback[PROMISE_SYMBOL];
}
var FN_ARGS = /^(?:async\s)?(?:function)?\s*(?:\w+\s*)?\(([^)]+)\)(?:\s*{)/;
var ARROW_FN_ARGS = /^(?:async\s)?\s*(?:\(\s*)?((?:[^)=\s]\s*)*)(?:\)\s*)?=>/;
var FN_ARG_SPLIT = /,/;
var FN_ARG = /(=.+)?(\s*)$/;
function stripComments(string) {
  let stripped = "";
  let index2 = 0;
  let endBlockComment = string.indexOf("*/");
  while (index2 < string.length) {
    if (string[index2] === "/" && string[index2 + 1] === "/") {
      let endIndex = string.indexOf("\n", index2);
      index2 = endIndex === -1 ? string.length : endIndex;
    } else if (endBlockComment !== -1 && string[index2] === "/" && string[index2 + 1] === "*") {
      let endIndex = string.indexOf("*/", index2);
      if (endIndex !== -1) {
        index2 = endIndex + 2;
        endBlockComment = string.indexOf("*/", index2);
      } else {
        stripped += string[index2];
        index2++;
      }
    } else {
      stripped += string[index2];
      index2++;
    }
  }
  return stripped;
}
function parseParams(func) {
  const src = stripComments(func.toString());
  let match2 = src.match(FN_ARGS);
  if (!match2) {
    match2 = src.match(ARROW_FN_ARGS);
  }
  if (!match2) throw new Error("could not parse args in autoInject\nSource:\n" + src);
  let [, args] = match2;
  return args.replace(/\s/g, "").split(FN_ARG_SPLIT).map((arg) => arg.replace(FN_ARG, "").trim());
}
function autoInject(tasks, callback) {
  var newTasks = {};
  Object.keys(tasks).forEach((key) => {
    var taskFn = tasks[key];
    var params;
    var fnIsAsync = isAsync(taskFn);
    var hasNoDeps = !fnIsAsync && taskFn.length === 1 || fnIsAsync && taskFn.length === 0;
    if (Array.isArray(taskFn)) {
      params = [...taskFn];
      taskFn = params.pop();
      newTasks[key] = params.concat(params.length > 0 ? newTask : taskFn);
    } else if (hasNoDeps) {
      newTasks[key] = taskFn;
    } else {
      params = parseParams(taskFn);
      if (taskFn.length === 0 && !fnIsAsync && params.length === 0) {
        throw new Error("autoInject task functions require explicit parameters.");
      }
      if (!fnIsAsync) params.pop();
      newTasks[key] = params.concat(newTask);
    }
    function newTask(results, taskCb) {
      var newArgs = params.map((name) => results[name]);
      newArgs.push(taskCb);
      wrapAsync(taskFn)(...newArgs);
    }
  });
  return auto(newTasks, callback);
}
class DLL {
  constructor() {
    this.head = this.tail = null;
    this.length = 0;
  }
  removeLink(node2) {
    if (node2.prev) node2.prev.next = node2.next;
    else this.head = node2.next;
    if (node2.next) node2.next.prev = node2.prev;
    else this.tail = node2.prev;
    node2.prev = node2.next = null;
    this.length -= 1;
    return node2;
  }
  empty() {
    while (this.head) this.shift();
    return this;
  }
  insertAfter(node2, newNode) {
    newNode.prev = node2;
    newNode.next = node2.next;
    if (node2.next) node2.next.prev = newNode;
    else this.tail = newNode;
    node2.next = newNode;
    this.length += 1;
  }
  insertBefore(node2, newNode) {
    newNode.prev = node2.prev;
    newNode.next = node2;
    if (node2.prev) node2.prev.next = newNode;
    else this.head = newNode;
    node2.prev = newNode;
    this.length += 1;
  }
  unshift(node2) {
    if (this.head) this.insertBefore(this.head, node2);
    else setInitial(this, node2);
  }
  push(node2) {
    if (this.tail) this.insertAfter(this.tail, node2);
    else setInitial(this, node2);
  }
  shift() {
    return this.head && this.removeLink(this.head);
  }
  pop() {
    return this.tail && this.removeLink(this.tail);
  }
  toArray() {
    return [...this];
  }
  *[Symbol.iterator]() {
    var cur = this.head;
    while (cur) {
      yield cur.data;
      cur = cur.next;
    }
  }
  remove(testFn) {
    var curr = this.head;
    while (curr) {
      var { next } = curr;
      if (testFn(curr)) {
        this.removeLink(curr);
      }
      curr = next;
    }
    return this;
  }
}
function setInitial(dll, node2) {
  dll.length = 1;
  dll.head = dll.tail = node2;
}
function queue$1(worker, concurrency, payload) {
  if (concurrency == null) {
    concurrency = 1;
  } else if (concurrency === 0) {
    throw new RangeError("Concurrency must not be zero");
  }
  var _worker = wrapAsync(worker);
  var numRunning = 0;
  var workersList = [];
  const events = {
    error: [],
    drain: [],
    saturated: [],
    unsaturated: [],
    empty: []
  };
  function on(event, handler) {
    events[event].push(handler);
  }
  function once2(event, handler) {
    const handleAndRemove = (...args) => {
      off(event, handleAndRemove);
      handler(...args);
    };
    events[event].push(handleAndRemove);
  }
  function off(event, handler) {
    if (!event) return Object.keys(events).forEach((ev) => events[ev] = []);
    if (!handler) return events[event] = [];
    events[event] = events[event].filter((ev) => ev !== handler);
  }
  function trigger(event, ...args) {
    events[event].forEach((handler) => handler(...args));
  }
  var processingScheduled = false;
  function _insert(data, insertAtFront, rejectOnError, callback) {
    if (callback != null && typeof callback !== "function") {
      throw new Error("task callback must be a function");
    }
    q.started = true;
    var res, rej;
    function promiseCallback2(err, ...args) {
      if (err) return rejectOnError ? rej(err) : res();
      if (args.length <= 1) return res(args[0]);
      res(args);
    }
    var item = q._createTaskItem(
      data,
      rejectOnError ? promiseCallback2 : callback || promiseCallback2
    );
    if (insertAtFront) {
      q._tasks.unshift(item);
    } else {
      q._tasks.push(item);
    }
    if (!processingScheduled) {
      processingScheduled = true;
      setImmediate$1(() => {
        processingScheduled = false;
        q.process();
      });
    }
    if (rejectOnError || !callback) {
      return new Promise((resolve2, reject2) => {
        res = resolve2;
        rej = reject2;
      });
    }
  }
  function _createCB(tasks) {
    return function(err, ...args) {
      numRunning -= 1;
      for (var i = 0, l = tasks.length; i < l; i++) {
        var task = tasks[i];
        var index2 = workersList.indexOf(task);
        if (index2 === 0) {
          workersList.shift();
        } else if (index2 > 0) {
          workersList.splice(index2, 1);
        }
        task.callback(err, ...args);
        if (err != null) {
          trigger("error", err, task.data);
        }
      }
      if (numRunning <= q.concurrency - q.buffer) {
        trigger("unsaturated");
      }
      if (q.idle()) {
        trigger("drain");
      }
      q.process();
    };
  }
  function _maybeDrain(data) {
    if (data.length === 0 && q.idle()) {
      setImmediate$1(() => trigger("drain"));
      return true;
    }
    return false;
  }
  const eventMethod = (name) => (handler) => {
    if (!handler) {
      return new Promise((resolve2, reject2) => {
        once2(name, (err, data) => {
          if (err) return reject2(err);
          resolve2(data);
        });
      });
    }
    off(name);
    on(name, handler);
  };
  var isProcessing = false;
  var q = {
    _tasks: new DLL(),
    _createTaskItem(data, callback) {
      return {
        data,
        callback
      };
    },
    *[Symbol.iterator]() {
      yield* q._tasks[Symbol.iterator]();
    },
    concurrency,
    payload,
    buffer: concurrency / 4,
    started: false,
    paused: false,
    push(data, callback) {
      if (Array.isArray(data)) {
        if (_maybeDrain(data)) return;
        return data.map((datum) => _insert(datum, false, false, callback));
      }
      return _insert(data, false, false, callback);
    },
    pushAsync(data, callback) {
      if (Array.isArray(data)) {
        if (_maybeDrain(data)) return;
        return data.map((datum) => _insert(datum, false, true, callback));
      }
      return _insert(data, false, true, callback);
    },
    kill() {
      off();
      q._tasks.empty();
    },
    unshift(data, callback) {
      if (Array.isArray(data)) {
        if (_maybeDrain(data)) return;
        return data.map((datum) => _insert(datum, true, false, callback));
      }
      return _insert(data, true, false, callback);
    },
    unshiftAsync(data, callback) {
      if (Array.isArray(data)) {
        if (_maybeDrain(data)) return;
        return data.map((datum) => _insert(datum, true, true, callback));
      }
      return _insert(data, true, true, callback);
    },
    remove(testFn) {
      q._tasks.remove(testFn);
    },
    process() {
      if (isProcessing) {
        return;
      }
      isProcessing = true;
      while (!q.paused && numRunning < q.concurrency && q._tasks.length) {
        var tasks = [], data = [];
        var l = q._tasks.length;
        if (q.payload) l = Math.min(l, q.payload);
        for (var i = 0; i < l; i++) {
          var node2 = q._tasks.shift();
          tasks.push(node2);
          workersList.push(node2);
          data.push(node2.data);
        }
        numRunning += 1;
        if (q._tasks.length === 0) {
          trigger("empty");
        }
        if (numRunning === q.concurrency) {
          trigger("saturated");
        }
        var cb = onlyOnce(_createCB(tasks));
        _worker(data, cb);
      }
      isProcessing = false;
    },
    length() {
      return q._tasks.length;
    },
    running() {
      return numRunning;
    },
    workersList() {
      return workersList;
    },
    idle() {
      return q._tasks.length + numRunning === 0;
    },
    pause() {
      q.paused = true;
    },
    resume() {
      if (q.paused === false) {
        return;
      }
      q.paused = false;
      setImmediate$1(q.process);
    }
  };
  Object.defineProperties(q, {
    saturated: {
      writable: false,
      value: eventMethod("saturated")
    },
    unsaturated: {
      writable: false,
      value: eventMethod("unsaturated")
    },
    empty: {
      writable: false,
      value: eventMethod("empty")
    },
    drain: {
      writable: false,
      value: eventMethod("drain")
    },
    error: {
      writable: false,
      value: eventMethod("error")
    }
  });
  return q;
}
function cargo$1(worker, payload) {
  return queue$1(worker, 1, payload);
}
function cargo(worker, concurrency, payload) {
  return queue$1(worker, concurrency, payload);
}
function reduce(coll, memo, iteratee, callback) {
  callback = once$4(callback);
  var _iteratee = wrapAsync(iteratee);
  return eachOfSeries$1(coll, (x, i, iterCb) => {
    _iteratee(memo, x, (err, v) => {
      memo = v;
      iterCb(err);
    });
  }, (err) => callback(err, memo));
}
var reduce$1 = awaitify(reduce, 4);
function seq(...functions) {
  var _functions = functions.map(wrapAsync);
  return function(...args) {
    var that = this;
    var cb = args[args.length - 1];
    if (typeof cb == "function") {
      args.pop();
    } else {
      cb = promiseCallback();
    }
    reduce$1(
      _functions,
      args,
      (newargs, fn, iterCb) => {
        fn.apply(that, newargs.concat((err, ...nextargs) => {
          iterCb(err, nextargs);
        }));
      },
      (err, results) => cb(err, ...results)
    );
    return cb[PROMISE_SYMBOL];
  };
}
function compose(...args) {
  return seq(...args.reverse());
}
function mapLimit(coll, limit, iteratee, callback) {
  return _asyncMap(eachOfLimit$2(limit), coll, iteratee, callback);
}
var mapLimit$1 = awaitify(mapLimit, 4);
function concatLimit(coll, limit, iteratee, callback) {
  var _iteratee = wrapAsync(iteratee);
  return mapLimit$1(coll, limit, (val, iterCb) => {
    _iteratee(val, (err, ...args) => {
      if (err) return iterCb(err);
      return iterCb(err, args);
    });
  }, (err, mapResults) => {
    var result = [];
    for (var i = 0; i < mapResults.length; i++) {
      if (mapResults[i]) {
        result = result.concat(...mapResults[i]);
      }
    }
    return callback(err, result);
  });
}
var concatLimit$1 = awaitify(concatLimit, 4);
function concat(coll, iteratee, callback) {
  return concatLimit$1(coll, Infinity, iteratee, callback);
}
var concat$1 = awaitify(concat, 3);
function concatSeries(coll, iteratee, callback) {
  return concatLimit$1(coll, 1, iteratee, callback);
}
var concatSeries$1 = awaitify(concatSeries, 3);
function constant$1(...args) {
  return function(...ignoredArgs) {
    var callback = ignoredArgs.pop();
    return callback(null, ...args);
  };
}
function _createTester(check, getResult) {
  return (eachfn, arr, _iteratee, cb) => {
    var testPassed = false;
    var testResult;
    const iteratee = wrapAsync(_iteratee);
    eachfn(arr, (value, _2, callback) => {
      iteratee(value, (err, result) => {
        if (err || err === false) return callback(err);
        if (check(result) && !testResult) {
          testPassed = true;
          testResult = getResult(true, value);
          return callback(null, breakLoop);
        }
        callback();
      });
    }, (err) => {
      if (err) return cb(err);
      cb(null, testPassed ? testResult : getResult(false));
    });
  };
}
function detect(coll, iteratee, callback) {
  return _createTester((bool) => bool, (res, item) => item)(eachOf$1, coll, iteratee, callback);
}
var detect$1 = awaitify(detect, 3);
function detectLimit(coll, limit, iteratee, callback) {
  return _createTester((bool) => bool, (res, item) => item)(eachOfLimit$2(limit), coll, iteratee, callback);
}
var detectLimit$1 = awaitify(detectLimit, 4);
function detectSeries(coll, iteratee, callback) {
  return _createTester((bool) => bool, (res, item) => item)(eachOfLimit$2(1), coll, iteratee, callback);
}
var detectSeries$1 = awaitify(detectSeries, 3);
function consoleFunc(name) {
  return (fn, ...args) => wrapAsync(fn)(...args, (err, ...resultArgs) => {
    if (typeof console === "object") {
      if (err) {
        if (console.error) {
          console.error(err);
        }
      } else if (console[name]) {
        resultArgs.forEach((x) => console[name](x));
      }
    }
  });
}
var dir = consoleFunc("dir");
function doWhilst(iteratee, test, callback) {
  callback = onlyOnce(callback);
  var _fn = wrapAsync(iteratee);
  var _test = wrapAsync(test);
  var results;
  function next(err, ...args) {
    if (err) return callback(err);
    if (err === false) return;
    results = args;
    _test(...args, check);
  }
  function check(err, truth) {
    if (err) return callback(err);
    if (err === false) return;
    if (!truth) return callback(null, ...results);
    _fn(next);
  }
  return check(null, true);
}
var doWhilst$1 = awaitify(doWhilst, 3);
function doUntil(iteratee, test, callback) {
  const _test = wrapAsync(test);
  return doWhilst$1(iteratee, (...args) => {
    const cb = args.pop();
    _test(...args, (err, truth) => cb(err, !truth));
  }, callback);
}
function _withoutIndex(iteratee) {
  return (value, index2, callback) => iteratee(value, callback);
}
function eachLimit$2(coll, iteratee, callback) {
  return eachOf$1(coll, _withoutIndex(wrapAsync(iteratee)), callback);
}
var each = awaitify(eachLimit$2, 3);
function eachLimit(coll, limit, iteratee, callback) {
  return eachOfLimit$2(limit)(coll, _withoutIndex(wrapAsync(iteratee)), callback);
}
var eachLimit$1 = awaitify(eachLimit, 4);
function eachSeries(coll, iteratee, callback) {
  return eachLimit$1(coll, 1, iteratee, callback);
}
var eachSeries$1 = awaitify(eachSeries, 3);
function ensureAsync(fn) {
  if (isAsync(fn)) return fn;
  return function(...args) {
    var callback = args.pop();
    var sync2 = true;
    args.push((...innerArgs) => {
      if (sync2) {
        setImmediate$1(() => callback(...innerArgs));
      } else {
        callback(...innerArgs);
      }
    });
    fn.apply(this, args);
    sync2 = false;
  };
}
function every(coll, iteratee, callback) {
  return _createTester((bool) => !bool, (res) => !res)(eachOf$1, coll, iteratee, callback);
}
var every$1 = awaitify(every, 3);
function everyLimit(coll, limit, iteratee, callback) {
  return _createTester((bool) => !bool, (res) => !res)(eachOfLimit$2(limit), coll, iteratee, callback);
}
var everyLimit$1 = awaitify(everyLimit, 4);
function everySeries(coll, iteratee, callback) {
  return _createTester((bool) => !bool, (res) => !res)(eachOfSeries$1, coll, iteratee, callback);
}
var everySeries$1 = awaitify(everySeries, 3);
function filterArray(eachfn, arr, iteratee, callback) {
  var truthValues = new Array(arr.length);
  eachfn(arr, (x, index2, iterCb) => {
    iteratee(x, (err, v) => {
      truthValues[index2] = !!v;
      iterCb(err);
    });
  }, (err) => {
    if (err) return callback(err);
    var results = [];
    for (var i = 0; i < arr.length; i++) {
      if (truthValues[i]) results.push(arr[i]);
    }
    callback(null, results);
  });
}
function filterGeneric(eachfn, coll, iteratee, callback) {
  var results = [];
  eachfn(coll, (x, index2, iterCb) => {
    iteratee(x, (err, v) => {
      if (err) return iterCb(err);
      if (v) {
        results.push({ index: index2, value: x });
      }
      iterCb(err);
    });
  }, (err) => {
    if (err) return callback(err);
    callback(null, results.sort((a, b) => a.index - b.index).map((v) => v.value));
  });
}
function _filter(eachfn, coll, iteratee, callback) {
  var filter2 = isArrayLike$4(coll) ? filterArray : filterGeneric;
  return filter2(eachfn, coll, wrapAsync(iteratee), callback);
}
function filter$1(coll, iteratee, callback) {
  return _filter(eachOf$1, coll, iteratee, callback);
}
var filter$1$1 = awaitify(filter$1, 3);
function filterLimit(coll, limit, iteratee, callback) {
  return _filter(eachOfLimit$2(limit), coll, iteratee, callback);
}
var filterLimit$1 = awaitify(filterLimit, 4);
function filterSeries(coll, iteratee, callback) {
  return _filter(eachOfSeries$1, coll, iteratee, callback);
}
var filterSeries$1 = awaitify(filterSeries, 3);
function forever(fn, errback) {
  var done = onlyOnce(errback);
  var task = wrapAsync(ensureAsync(fn));
  function next(err) {
    if (err) return done(err);
    if (err === false) return;
    task(next);
  }
  return next();
}
var forever$1 = awaitify(forever, 2);
function groupByLimit(coll, limit, iteratee, callback) {
  var _iteratee = wrapAsync(iteratee);
  return mapLimit$1(coll, limit, (val, iterCb) => {
    _iteratee(val, (err, key) => {
      if (err) return iterCb(err);
      return iterCb(err, { key, val });
    });
  }, (err, mapResults) => {
    var result = {};
    var { hasOwnProperty: hasOwnProperty2 } = Object.prototype;
    for (var i = 0; i < mapResults.length; i++) {
      if (mapResults[i]) {
        var { key } = mapResults[i];
        var { val } = mapResults[i];
        if (hasOwnProperty2.call(result, key)) {
          result[key].push(val);
        } else {
          result[key] = [val];
        }
      }
    }
    return callback(err, result);
  });
}
var groupByLimit$1 = awaitify(groupByLimit, 4);
function groupBy(coll, iteratee, callback) {
  return groupByLimit$1(coll, Infinity, iteratee, callback);
}
function groupBySeries(coll, iteratee, callback) {
  return groupByLimit$1(coll, 1, iteratee, callback);
}
var log = consoleFunc("log");
function mapValuesLimit(obj, limit, iteratee, callback) {
  callback = once$4(callback);
  var newObj = {};
  var _iteratee = wrapAsync(iteratee);
  return eachOfLimit$2(limit)(obj, (val, key, next) => {
    _iteratee(val, key, (err, result) => {
      if (err) return next(err);
      newObj[key] = result;
      next(err);
    });
  }, (err) => callback(err, newObj));
}
var mapValuesLimit$1 = awaitify(mapValuesLimit, 4);
function mapValues(obj, iteratee, callback) {
  return mapValuesLimit$1(obj, Infinity, iteratee, callback);
}
function mapValuesSeries(obj, iteratee, callback) {
  return mapValuesLimit$1(obj, 1, iteratee, callback);
}
function memoize(fn, hasher = (v) => v) {
  var memo = /* @__PURE__ */ Object.create(null);
  var queues = /* @__PURE__ */ Object.create(null);
  var _fn = wrapAsync(fn);
  var memoized = initialParams((args, callback) => {
    var key = hasher(...args);
    if (key in memo) {
      setImmediate$1(() => callback(null, ...memo[key]));
    } else if (key in queues) {
      queues[key].push(callback);
    } else {
      queues[key] = [callback];
      _fn(...args, (err, ...resultArgs) => {
        if (!err) {
          memo[key] = resultArgs;
        }
        var q = queues[key];
        delete queues[key];
        for (var i = 0, l = q.length; i < l; i++) {
          q[i](err, ...resultArgs);
        }
      });
    }
  });
  memoized.memo = memo;
  memoized.unmemoized = fn;
  return memoized;
}
var _defer;
if (hasNextTick) {
  _defer = process.nextTick;
} else if (hasSetImmediate) {
  _defer = setImmediate;
} else {
  _defer = fallback;
}
var nextTick = wrap(_defer);
var _parallel = awaitify((eachfn, tasks, callback) => {
  var results = isArrayLike$4(tasks) ? [] : {};
  eachfn(tasks, (task, key, taskCb) => {
    wrapAsync(task)((err, ...result) => {
      if (result.length < 2) {
        [result] = result;
      }
      results[key] = result;
      taskCb(err);
    });
  }, (err) => callback(err, results));
}, 3);
function parallel(tasks, callback) {
  return _parallel(eachOf$1, tasks, callback);
}
function parallelLimit(tasks, limit, callback) {
  return _parallel(eachOfLimit$2(limit), tasks, callback);
}
function queue$2(worker, concurrency) {
  var _worker = wrapAsync(worker);
  return queue$1((items, cb) => {
    _worker(items[0], cb);
  }, concurrency, 1);
}
class Heap {
  constructor() {
    this.heap = [];
    this.pushCount = Number.MIN_SAFE_INTEGER;
  }
  get length() {
    return this.heap.length;
  }
  empty() {
    this.heap = [];
    return this;
  }
  percUp(index2) {
    let p;
    while (index2 > 0 && smaller(this.heap[index2], this.heap[p = parent(index2)])) {
      let t = this.heap[index2];
      this.heap[index2] = this.heap[p];
      this.heap[p] = t;
      index2 = p;
    }
  }
  percDown(index2) {
    let l;
    while ((l = leftChi(index2)) < this.heap.length) {
      if (l + 1 < this.heap.length && smaller(this.heap[l + 1], this.heap[l])) {
        l = l + 1;
      }
      if (smaller(this.heap[index2], this.heap[l])) {
        break;
      }
      let t = this.heap[index2];
      this.heap[index2] = this.heap[l];
      this.heap[l] = t;
      index2 = l;
    }
  }
  push(node2) {
    node2.pushCount = ++this.pushCount;
    this.heap.push(node2);
    this.percUp(this.heap.length - 1);
  }
  unshift(node2) {
    return this.heap.push(node2);
  }
  shift() {
    let [top] = this.heap;
    this.heap[0] = this.heap[this.heap.length - 1];
    this.heap.pop();
    this.percDown(0);
    return top;
  }
  toArray() {
    return [...this];
  }
  *[Symbol.iterator]() {
    for (let i = 0; i < this.heap.length; i++) {
      yield this.heap[i].data;
    }
  }
  remove(testFn) {
    let j = 0;
    for (let i = 0; i < this.heap.length; i++) {
      if (!testFn(this.heap[i])) {
        this.heap[j] = this.heap[i];
        j++;
      }
    }
    this.heap.splice(j);
    for (let i = parent(this.heap.length - 1); i >= 0; i--) {
      this.percDown(i);
    }
    return this;
  }
}
function leftChi(i) {
  return (i << 1) + 1;
}
function parent(i) {
  return (i + 1 >> 1) - 1;
}
function smaller(x, y) {
  if (x.priority !== y.priority) {
    return x.priority < y.priority;
  } else {
    return x.pushCount < y.pushCount;
  }
}
function priorityQueue(worker, concurrency) {
  var q = queue$2(worker, concurrency);
  var {
    push,
    pushAsync
  } = q;
  q._tasks = new Heap();
  q._createTaskItem = ({ data, priority }, callback) => {
    return {
      data,
      priority,
      callback
    };
  };
  function createDataItems(tasks, priority) {
    if (!Array.isArray(tasks)) {
      return { data: tasks, priority };
    }
    return tasks.map((data) => {
      return { data, priority };
    });
  }
  q.push = function(data, priority = 0, callback) {
    return push(createDataItems(data, priority), callback);
  };
  q.pushAsync = function(data, priority = 0, callback) {
    return pushAsync(createDataItems(data, priority), callback);
  };
  delete q.unshift;
  delete q.unshiftAsync;
  return q;
}
function race(tasks, callback) {
  callback = once$4(callback);
  if (!Array.isArray(tasks)) return callback(new TypeError("First argument to race must be an array of functions"));
  if (!tasks.length) return callback();
  for (var i = 0, l = tasks.length; i < l; i++) {
    wrapAsync(tasks[i])(callback);
  }
}
var race$1 = awaitify(race, 2);
function reduceRight(array, memo, iteratee, callback) {
  var reversed = [...array].reverse();
  return reduce$1(reversed, memo, iteratee, callback);
}
function reflect(fn) {
  var _fn = wrapAsync(fn);
  return initialParams(function reflectOn(args, reflectCallback) {
    args.push((error2, ...cbArgs) => {
      let retVal = {};
      if (error2) {
        retVal.error = error2;
      }
      if (cbArgs.length > 0) {
        var value = cbArgs;
        if (cbArgs.length <= 1) {
          [value] = cbArgs;
        }
        retVal.value = value;
      }
      reflectCallback(null, retVal);
    });
    return _fn.apply(this, args);
  });
}
function reflectAll(tasks) {
  var results;
  if (Array.isArray(tasks)) {
    results = tasks.map(reflect);
  } else {
    results = {};
    Object.keys(tasks).forEach((key) => {
      results[key] = reflect.call(this, tasks[key]);
    });
  }
  return results;
}
function reject$2(eachfn, arr, _iteratee, callback) {
  const iteratee = wrapAsync(_iteratee);
  return _filter(eachfn, arr, (value, cb) => {
    iteratee(value, (err, v) => {
      cb(err, !v);
    });
  }, callback);
}
function reject(coll, iteratee, callback) {
  return reject$2(eachOf$1, coll, iteratee, callback);
}
var reject$1 = awaitify(reject, 3);
function rejectLimit(coll, limit, iteratee, callback) {
  return reject$2(eachOfLimit$2(limit), coll, iteratee, callback);
}
var rejectLimit$1 = awaitify(rejectLimit, 4);
function rejectSeries(coll, iteratee, callback) {
  return reject$2(eachOfSeries$1, coll, iteratee, callback);
}
var rejectSeries$1 = awaitify(rejectSeries, 3);
function constant(value) {
  return function() {
    return value;
  };
}
const DEFAULT_TIMES = 5;
const DEFAULT_INTERVAL = 0;
function retry$1(opts, task, callback) {
  var options = {
    times: DEFAULT_TIMES,
    intervalFunc: constant(DEFAULT_INTERVAL)
  };
  if (arguments.length < 3 && typeof opts === "function") {
    callback = task || promiseCallback();
    task = opts;
  } else {
    parseTimes(options, opts);
    callback = callback || promiseCallback();
  }
  if (typeof task !== "function") {
    throw new Error("Invalid arguments for async.retry");
  }
  var _task = wrapAsync(task);
  var attempt = 1;
  function retryAttempt() {
    _task((err, ...args) => {
      if (err === false) return;
      if (err && attempt++ < options.times && (typeof options.errorFilter != "function" || options.errorFilter(err))) {
        setTimeout(retryAttempt, options.intervalFunc(attempt - 1));
      } else {
        callback(err, ...args);
      }
    });
  }
  retryAttempt();
  return callback[PROMISE_SYMBOL];
}
function parseTimes(acc, t) {
  if (typeof t === "object") {
    acc.times = +t.times || DEFAULT_TIMES;
    acc.intervalFunc = typeof t.interval === "function" ? t.interval : constant(+t.interval || DEFAULT_INTERVAL);
    acc.errorFilter = t.errorFilter;
  } else if (typeof t === "number" || typeof t === "string") {
    acc.times = +t || DEFAULT_TIMES;
  } else {
    throw new Error("Invalid arguments for async.retry");
  }
}
function retryable(opts, task) {
  if (!task) {
    task = opts;
    opts = null;
  }
  let arity = opts && opts.arity || task.length;
  if (isAsync(task)) {
    arity += 1;
  }
  var _task = wrapAsync(task);
  return initialParams((args, callback) => {
    if (args.length < arity - 1 || callback == null) {
      args.push(callback);
      callback = promiseCallback();
    }
    function taskFn(cb) {
      _task(...args, cb);
    }
    if (opts) retry$1(opts, taskFn, callback);
    else retry$1(taskFn, callback);
    return callback[PROMISE_SYMBOL];
  });
}
function series(tasks, callback) {
  return _parallel(eachOfSeries$1, tasks, callback);
}
function some(coll, iteratee, callback) {
  return _createTester(Boolean, (res) => res)(eachOf$1, coll, iteratee, callback);
}
var some$1 = awaitify(some, 3);
function someLimit(coll, limit, iteratee, callback) {
  return _createTester(Boolean, (res) => res)(eachOfLimit$2(limit), coll, iteratee, callback);
}
var someLimit$1 = awaitify(someLimit, 4);
function someSeries(coll, iteratee, callback) {
  return _createTester(Boolean, (res) => res)(eachOfSeries$1, coll, iteratee, callback);
}
var someSeries$1 = awaitify(someSeries, 3);
function sortBy(coll, iteratee, callback) {
  var _iteratee = wrapAsync(iteratee);
  return map$1(coll, (x, iterCb) => {
    _iteratee(x, (err, criteria) => {
      if (err) return iterCb(err);
      iterCb(err, { value: x, criteria });
    });
  }, (err, results) => {
    if (err) return callback(err);
    callback(null, results.sort(comparator).map((v) => v.value));
  });
  function comparator(left, right) {
    var a = left.criteria, b = right.criteria;
    return a < b ? -1 : a > b ? 1 : 0;
  }
}
var sortBy$1 = awaitify(sortBy, 3);
function timeout(asyncFn, milliseconds, info) {
  var fn = wrapAsync(asyncFn);
  return initialParams((args, callback) => {
    var timedOut = false;
    var timer;
    function timeoutCallback() {
      var name = asyncFn.name || "anonymous";
      var error2 = new Error('Callback function "' + name + '" timed out.');
      error2.code = "ETIMEDOUT";
      if (info) {
        error2.info = info;
      }
      timedOut = true;
      callback(error2);
    }
    args.push((...cbArgs) => {
      if (!timedOut) {
        callback(...cbArgs);
        clearTimeout(timer);
      }
    });
    timer = setTimeout(timeoutCallback, milliseconds);
    fn(...args);
  });
}
function range(size) {
  var result = Array(size);
  while (size--) {
    result[size] = size;
  }
  return result;
}
function timesLimit(count, limit, iteratee, callback) {
  var _iteratee = wrapAsync(iteratee);
  return mapLimit$1(range(count), limit, _iteratee, callback);
}
function times(n, iteratee, callback) {
  return timesLimit(n, Infinity, iteratee, callback);
}
function timesSeries(n, iteratee, callback) {
  return timesLimit(n, 1, iteratee, callback);
}
function transform(coll, accumulator, iteratee, callback) {
  if (arguments.length <= 3 && typeof accumulator === "function") {
    callback = iteratee;
    iteratee = accumulator;
    accumulator = Array.isArray(coll) ? [] : {};
  }
  callback = once$4(callback || promiseCallback());
  var _iteratee = wrapAsync(iteratee);
  eachOf$1(coll, (v, k, cb) => {
    _iteratee(accumulator, v, k, cb);
  }, (err) => callback(err, accumulator));
  return callback[PROMISE_SYMBOL];
}
function tryEach(tasks, callback) {
  var error2 = null;
  var result;
  return eachSeries$1(tasks, (task, taskCb) => {
    wrapAsync(task)((err, ...args) => {
      if (err === false) return taskCb(err);
      if (args.length < 2) {
        [result] = args;
      } else {
        result = args;
      }
      error2 = err;
      taskCb(err ? null : {});
    });
  }, () => callback(error2, result));
}
var tryEach$1 = awaitify(tryEach);
function unmemoize(fn) {
  return (...args) => {
    return (fn.unmemoized || fn)(...args);
  };
}
function whilst(test, iteratee, callback) {
  callback = onlyOnce(callback);
  var _fn = wrapAsync(iteratee);
  var _test = wrapAsync(test);
  var results = [];
  function next(err, ...rest) {
    if (err) return callback(err);
    results = rest;
    if (err === false) return;
    _test(check);
  }
  function check(err, truth) {
    if (err) return callback(err);
    if (err === false) return;
    if (!truth) return callback(null, ...results);
    _fn(next);
  }
  return _test(check);
}
var whilst$1 = awaitify(whilst, 3);
function until(test, iteratee, callback) {
  const _test = wrapAsync(test);
  return whilst$1((cb) => _test((err, truth) => cb(err, !truth)), iteratee, callback);
}
function waterfall(tasks, callback) {
  callback = once$4(callback);
  if (!Array.isArray(tasks)) return callback(new Error("First argument to waterfall must be an array of functions"));
  if (!tasks.length) return callback();
  var taskIndex = 0;
  function nextTask(args) {
    var task = wrapAsync(tasks[taskIndex++]);
    task(...args, onlyOnce(next));
  }
  function next(err, ...args) {
    if (err === false) return;
    if (err || taskIndex === tasks.length) {
      return callback(err, ...args);
    }
    nextTask(args);
  }
  nextTask([]);
}
var waterfall$1 = awaitify(waterfall);
var index$1 = {
  apply: apply$3,
  applyEach,
  applyEachSeries,
  asyncify,
  auto,
  autoInject,
  cargo: cargo$1,
  cargoQueue: cargo,
  compose,
  concat: concat$1,
  concatLimit: concatLimit$1,
  concatSeries: concatSeries$1,
  constant: constant$1,
  detect: detect$1,
  detectLimit: detectLimit$1,
  detectSeries: detectSeries$1,
  dir,
  doUntil,
  doWhilst: doWhilst$1,
  each,
  eachLimit: eachLimit$1,
  eachOf: eachOf$1,
  eachOfLimit: eachOfLimit$1,
  eachOfSeries: eachOfSeries$1,
  eachSeries: eachSeries$1,
  ensureAsync,
  every: every$1,
  everyLimit: everyLimit$1,
  everySeries: everySeries$1,
  filter: filter$1$1,
  filterLimit: filterLimit$1,
  filterSeries: filterSeries$1,
  forever: forever$1,
  groupBy,
  groupByLimit: groupByLimit$1,
  groupBySeries,
  log,
  map: map$1,
  mapLimit: mapLimit$1,
  mapSeries: mapSeries$1,
  mapValues,
  mapValuesLimit: mapValuesLimit$1,
  mapValuesSeries,
  memoize,
  nextTick,
  parallel,
  parallelLimit,
  priorityQueue,
  queue: queue$2,
  race: race$1,
  reduce: reduce$1,
  reduceRight,
  reflect,
  reflectAll,
  reject: reject$1,
  rejectLimit: rejectLimit$1,
  rejectSeries: rejectSeries$1,
  retry: retry$1,
  retryable,
  seq,
  series,
  setImmediate: setImmediate$1,
  some: some$1,
  someLimit: someLimit$1,
  someSeries: someSeries$1,
  sortBy: sortBy$1,
  timeout,
  times,
  timesLimit,
  timesSeries,
  transform,
  tryEach: tryEach$1,
  unmemoize,
  until,
  waterfall: waterfall$1,
  whilst: whilst$1,
  // aliases
  all: every$1,
  allLimit: everyLimit$1,
  allSeries: everySeries$1,
  any: some$1,
  anyLimit: someLimit$1,
  anySeries: someSeries$1,
  find: detect$1,
  findLimit: detectLimit$1,
  findSeries: detectSeries$1,
  flatMap: concat$1,
  flatMapLimit: concatLimit$1,
  flatMapSeries: concatSeries$1,
  forEach: each,
  forEachSeries: eachSeries$1,
  forEachLimit: eachLimit$1,
  forEachOf: eachOf$1,
  forEachOfSeries: eachOfSeries$1,
  forEachOfLimit: eachOfLimit$1,
  inject: reduce$1,
  foldl: reduce$1,
  foldr: reduceRight,
  select: filter$1$1,
  selectLimit: filterLimit$1,
  selectSeries: filterSeries$1,
  wrapSync: asyncify,
  during: whilst$1,
  doDuring: doWhilst$1
};
const async$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  all: every$1,
  allLimit: everyLimit$1,
  allSeries: everySeries$1,
  any: some$1,
  anyLimit: someLimit$1,
  anySeries: someSeries$1,
  apply: apply$3,
  applyEach,
  applyEachSeries,
  asyncify,
  auto,
  autoInject,
  cargo: cargo$1,
  cargoQueue: cargo,
  compose,
  concat: concat$1,
  concatLimit: concatLimit$1,
  concatSeries: concatSeries$1,
  constant: constant$1,
  default: index$1,
  detect: detect$1,
  detectLimit: detectLimit$1,
  detectSeries: detectSeries$1,
  dir,
  doDuring: doWhilst$1,
  doUntil,
  doWhilst: doWhilst$1,
  during: whilst$1,
  each,
  eachLimit: eachLimit$1,
  eachOf: eachOf$1,
  eachOfLimit: eachOfLimit$1,
  eachOfSeries: eachOfSeries$1,
  eachSeries: eachSeries$1,
  ensureAsync,
  every: every$1,
  everyLimit: everyLimit$1,
  everySeries: everySeries$1,
  filter: filter$1$1,
  filterLimit: filterLimit$1,
  filterSeries: filterSeries$1,
  find: detect$1,
  findLimit: detectLimit$1,
  findSeries: detectSeries$1,
  flatMap: concat$1,
  flatMapLimit: concatLimit$1,
  flatMapSeries: concatSeries$1,
  foldl: reduce$1,
  foldr: reduceRight,
  forEach: each,
  forEachLimit: eachLimit$1,
  forEachOf: eachOf$1,
  forEachOfLimit: eachOfLimit$1,
  forEachOfSeries: eachOfSeries$1,
  forEachSeries: eachSeries$1,
  forever: forever$1,
  groupBy,
  groupByLimit: groupByLimit$1,
  groupBySeries,
  inject: reduce$1,
  log,
  map: map$1,
  mapLimit: mapLimit$1,
  mapSeries: mapSeries$1,
  mapValues,
  mapValuesLimit: mapValuesLimit$1,
  mapValuesSeries,
  memoize,
  nextTick,
  parallel,
  parallelLimit,
  priorityQueue,
  queue: queue$2,
  race: race$1,
  reduce: reduce$1,
  reduceRight,
  reflect,
  reflectAll,
  reject: reject$1,
  rejectLimit: rejectLimit$1,
  rejectSeries: rejectSeries$1,
  retry: retry$1,
  retryable,
  select: filter$1$1,
  selectLimit: filterLimit$1,
  selectSeries: filterSeries$1,
  seq,
  series,
  setImmediate: setImmediate$1,
  some: some$1,
  someLimit: someLimit$1,
  someSeries: someSeries$1,
  sortBy: sortBy$1,
  timeout,
  times,
  timesLimit,
  timesSeries,
  transform,
  tryEach: tryEach$1,
  unmemoize,
  until,
  waterfall: waterfall$1,
  whilst: whilst$1,
  wrapSync: asyncify
}, Symbol.toStringTag, { value: "Module" }));
const require$$2 = /* @__PURE__ */ getAugmentedNamespace(async$1);
var archiverUtils$1 = { exports: {} };
var constants$4 = require$$0$1;
var origCwd = process.cwd;
var cwd = null;
var platform = process.env.GRACEFUL_FS_PLATFORM || process.platform;
process.cwd = function() {
  if (!cwd)
    cwd = origCwd.call(process);
  return cwd;
};
try {
  process.cwd();
} catch (er) {
}
if (typeof process.chdir === "function") {
  var chdir = process.chdir;
  process.chdir = function(d) {
    cwd = null;
    chdir.call(process, d);
  };
  if (Object.setPrototypeOf) Object.setPrototypeOf(process.chdir, chdir);
}
var polyfills$1 = patch$1;
function patch$1(fs2) {
  if (constants$4.hasOwnProperty("O_SYMLINK") && process.version.match(/^v0\.6\.[0-2]|^v0\.5\./)) {
    patchLchmod(fs2);
  }
  if (!fs2.lutimes) {
    patchLutimes(fs2);
  }
  fs2.chown = chownFix(fs2.chown);
  fs2.fchown = chownFix(fs2.fchown);
  fs2.lchown = chownFix(fs2.lchown);
  fs2.chmod = chmodFix(fs2.chmod);
  fs2.fchmod = chmodFix(fs2.fchmod);
  fs2.lchmod = chmodFix(fs2.lchmod);
  fs2.chownSync = chownFixSync(fs2.chownSync);
  fs2.fchownSync = chownFixSync(fs2.fchownSync);
  fs2.lchownSync = chownFixSync(fs2.lchownSync);
  fs2.chmodSync = chmodFixSync(fs2.chmodSync);
  fs2.fchmodSync = chmodFixSync(fs2.fchmodSync);
  fs2.lchmodSync = chmodFixSync(fs2.lchmodSync);
  fs2.stat = statFix(fs2.stat);
  fs2.fstat = statFix(fs2.fstat);
  fs2.lstat = statFix(fs2.lstat);
  fs2.statSync = statFixSync(fs2.statSync);
  fs2.fstatSync = statFixSync(fs2.fstatSync);
  fs2.lstatSync = statFixSync(fs2.lstatSync);
  if (fs2.chmod && !fs2.lchmod) {
    fs2.lchmod = function(path2, mode, cb) {
      if (cb) process.nextTick(cb);
    };
    fs2.lchmodSync = function() {
    };
  }
  if (fs2.chown && !fs2.lchown) {
    fs2.lchown = function(path2, uid, gid, cb) {
      if (cb) process.nextTick(cb);
    };
    fs2.lchownSync = function() {
    };
  }
  if (platform === "win32") {
    fs2.rename = typeof fs2.rename !== "function" ? fs2.rename : function(fs$rename) {
      function rename(from, to, cb) {
        var start = Date.now();
        var backoff = 0;
        fs$rename(from, to, function CB(er) {
          if (er && (er.code === "EACCES" || er.code === "EPERM" || er.code === "EBUSY") && Date.now() - start < 6e4) {
            setTimeout(function() {
              fs2.stat(to, function(stater, st) {
                if (stater && stater.code === "ENOENT")
                  fs$rename(from, to, CB);
                else
                  cb(er);
              });
            }, backoff);
            if (backoff < 100)
              backoff += 10;
            return;
          }
          if (cb) cb(er);
        });
      }
      if (Object.setPrototypeOf) Object.setPrototypeOf(rename, fs$rename);
      return rename;
    }(fs2.rename);
  }
  fs2.read = typeof fs2.read !== "function" ? fs2.read : function(fs$read) {
    function read(fd, buffer, offset, length, position, callback_) {
      var callback;
      if (callback_ && typeof callback_ === "function") {
        var eagCounter = 0;
        callback = function(er, _2, __) {
          if (er && er.code === "EAGAIN" && eagCounter < 10) {
            eagCounter++;
            return fs$read.call(fs2, fd, buffer, offset, length, position, callback);
          }
          callback_.apply(this, arguments);
        };
      }
      return fs$read.call(fs2, fd, buffer, offset, length, position, callback);
    }
    if (Object.setPrototypeOf) Object.setPrototypeOf(read, fs$read);
    return read;
  }(fs2.read);
  fs2.readSync = typeof fs2.readSync !== "function" ? fs2.readSync : /* @__PURE__ */ function(fs$readSync) {
    return function(fd, buffer, offset, length, position) {
      var eagCounter = 0;
      while (true) {
        try {
          return fs$readSync.call(fs2, fd, buffer, offset, length, position);
        } catch (er) {
          if (er.code === "EAGAIN" && eagCounter < 10) {
            eagCounter++;
            continue;
          }
          throw er;
        }
      }
    };
  }(fs2.readSync);
  function patchLchmod(fs22) {
    fs22.lchmod = function(path2, mode, callback) {
      fs22.open(
        path2,
        constants$4.O_WRONLY | constants$4.O_SYMLINK,
        mode,
        function(err, fd) {
          if (err) {
            if (callback) callback(err);
            return;
          }
          fs22.fchmod(fd, mode, function(err2) {
            fs22.close(fd, function(err22) {
              if (callback) callback(err2 || err22);
            });
          });
        }
      );
    };
    fs22.lchmodSync = function(path2, mode) {
      var fd = fs22.openSync(path2, constants$4.O_WRONLY | constants$4.O_SYMLINK, mode);
      var threw = true;
      var ret;
      try {
        ret = fs22.fchmodSync(fd, mode);
        threw = false;
      } finally {
        if (threw) {
          try {
            fs22.closeSync(fd);
          } catch (er) {
          }
        } else {
          fs22.closeSync(fd);
        }
      }
      return ret;
    };
  }
  function patchLutimes(fs22) {
    if (constants$4.hasOwnProperty("O_SYMLINK") && fs22.futimes) {
      fs22.lutimes = function(path2, at, mt, cb) {
        fs22.open(path2, constants$4.O_SYMLINK, function(er, fd) {
          if (er) {
            if (cb) cb(er);
            return;
          }
          fs22.futimes(fd, at, mt, function(er2) {
            fs22.close(fd, function(er22) {
              if (cb) cb(er2 || er22);
            });
          });
        });
      };
      fs22.lutimesSync = function(path2, at, mt) {
        var fd = fs22.openSync(path2, constants$4.O_SYMLINK);
        var ret;
        var threw = true;
        try {
          ret = fs22.futimesSync(fd, at, mt);
          threw = false;
        } finally {
          if (threw) {
            try {
              fs22.closeSync(fd);
            } catch (er) {
            }
          } else {
            fs22.closeSync(fd);
          }
        }
        return ret;
      };
    } else if (fs22.futimes) {
      fs22.lutimes = function(_a, _b, _c, cb) {
        if (cb) process.nextTick(cb);
      };
      fs22.lutimesSync = function() {
      };
    }
  }
  function chmodFix(orig) {
    if (!orig) return orig;
    return function(target, mode, cb) {
      return orig.call(fs2, target, mode, function(er) {
        if (chownErOk(er)) er = null;
        if (cb) cb.apply(this, arguments);
      });
    };
  }
  function chmodFixSync(orig) {
    if (!orig) return orig;
    return function(target, mode) {
      try {
        return orig.call(fs2, target, mode);
      } catch (er) {
        if (!chownErOk(er)) throw er;
      }
    };
  }
  function chownFix(orig) {
    if (!orig) return orig;
    return function(target, uid, gid, cb) {
      return orig.call(fs2, target, uid, gid, function(er) {
        if (chownErOk(er)) er = null;
        if (cb) cb.apply(this, arguments);
      });
    };
  }
  function chownFixSync(orig) {
    if (!orig) return orig;
    return function(target, uid, gid) {
      try {
        return orig.call(fs2, target, uid, gid);
      } catch (er) {
        if (!chownErOk(er)) throw er;
      }
    };
  }
  function statFix(orig) {
    if (!orig) return orig;
    return function(target, options, cb) {
      if (typeof options === "function") {
        cb = options;
        options = null;
      }
      function callback(er, stats) {
        if (stats) {
          if (stats.uid < 0) stats.uid += 4294967296;
          if (stats.gid < 0) stats.gid += 4294967296;
        }
        if (cb) cb.apply(this, arguments);
      }
      return options ? orig.call(fs2, target, options, callback) : orig.call(fs2, target, callback);
    };
  }
  function statFixSync(orig) {
    if (!orig) return orig;
    return function(target, options) {
      var stats = options ? orig.call(fs2, target, options) : orig.call(fs2, target);
      if (stats) {
        if (stats.uid < 0) stats.uid += 4294967296;
        if (stats.gid < 0) stats.gid += 4294967296;
      }
      return stats;
    };
  }
  function chownErOk(er) {
    if (!er)
      return true;
    if (er.code === "ENOSYS")
      return true;
    var nonroot = !process.getuid || process.getuid() !== 0;
    if (nonroot) {
      if (er.code === "EINVAL" || er.code === "EPERM")
        return true;
    }
    return false;
  }
}
var Stream$3 = require$$0$2.Stream;
var legacyStreams = legacy$1;
function legacy$1(fs2) {
  return {
    ReadStream,
    WriteStream
  };
  function ReadStream(path2, options) {
    if (!(this instanceof ReadStream)) return new ReadStream(path2, options);
    Stream$3.call(this);
    var self2 = this;
    this.path = path2;
    this.fd = null;
    this.readable = true;
    this.paused = false;
    this.flags = "r";
    this.mode = 438;
    this.bufferSize = 64 * 1024;
    options = options || {};
    var keys = Object.keys(options);
    for (var index2 = 0, length = keys.length; index2 < length; index2++) {
      var key = keys[index2];
      this[key] = options[key];
    }
    if (this.encoding) this.setEncoding(this.encoding);
    if (this.start !== void 0) {
      if ("number" !== typeof this.start) {
        throw TypeError("start must be a Number");
      }
      if (this.end === void 0) {
        this.end = Infinity;
      } else if ("number" !== typeof this.end) {
        throw TypeError("end must be a Number");
      }
      if (this.start > this.end) {
        throw new Error("start must be <= end");
      }
      this.pos = this.start;
    }
    if (this.fd !== null) {
      process.nextTick(function() {
        self2._read();
      });
      return;
    }
    fs2.open(this.path, this.flags, this.mode, function(err, fd) {
      if (err) {
        self2.emit("error", err);
        self2.readable = false;
        return;
      }
      self2.fd = fd;
      self2.emit("open", fd);
      self2._read();
    });
  }
  function WriteStream(path2, options) {
    if (!(this instanceof WriteStream)) return new WriteStream(path2, options);
    Stream$3.call(this);
    this.path = path2;
    this.fd = null;
    this.writable = true;
    this.flags = "w";
    this.encoding = "binary";
    this.mode = 438;
    this.bytesWritten = 0;
    options = options || {};
    var keys = Object.keys(options);
    for (var index2 = 0, length = keys.length; index2 < length; index2++) {
      var key = keys[index2];
      this[key] = options[key];
    }
    if (this.start !== void 0) {
      if ("number" !== typeof this.start) {
        throw TypeError("start must be a Number");
      }
      if (this.start < 0) {
        throw new Error("start must be >= zero");
      }
      this.pos = this.start;
    }
    this.busy = false;
    this._queue = [];
    if (this.fd === null) {
      this._open = fs2.open;
      this._queue.push([this._open, this.path, this.flags, this.mode, void 0]);
      this.flush();
    }
  }
}
var clone_1 = clone$1;
var getPrototypeOf = Object.getPrototypeOf || function(obj) {
  return obj.__proto__;
};
function clone$1(obj) {
  if (obj === null || typeof obj !== "object")
    return obj;
  if (obj instanceof Object)
    var copy2 = { __proto__: getPrototypeOf(obj) };
  else
    var copy2 = /* @__PURE__ */ Object.create(null);
  Object.getOwnPropertyNames(obj).forEach(function(key) {
    Object.defineProperty(copy2, key, Object.getOwnPropertyDescriptor(obj, key));
  });
  return copy2;
}
var fs$8 = require$$0;
var polyfills = polyfills$1;
var legacy = legacyStreams;
var clone = clone_1;
var util$e = require$$0$3;
var gracefulQueue;
var previousSymbol;
if (typeof Symbol === "function" && typeof Symbol.for === "function") {
  gracefulQueue = Symbol.for("graceful-fs.queue");
  previousSymbol = Symbol.for("graceful-fs.previous");
} else {
  gracefulQueue = "___graceful-fs.queue";
  previousSymbol = "___graceful-fs.previous";
}
function noop$4() {
}
function publishQueue(context, queue2) {
  Object.defineProperty(context, gracefulQueue, {
    get: function() {
      return queue2;
    }
  });
}
var debug = noop$4;
if (util$e.debuglog)
  debug = util$e.debuglog("gfs4");
else if (/\bgfs4\b/i.test(process.env.NODE_DEBUG || ""))
  debug = function() {
    var m = util$e.format.apply(util$e, arguments);
    m = "GFS4: " + m.split(/\n/).join("\nGFS4: ");
    console.error(m);
  };
if (!fs$8[gracefulQueue]) {
  var queue = commonjsGlobal[gracefulQueue] || [];
  publishQueue(fs$8, queue);
  fs$8.close = function(fs$close) {
    function close(fd, cb) {
      return fs$close.call(fs$8, fd, function(err) {
        if (!err) {
          resetQueue();
        }
        if (typeof cb === "function")
          cb.apply(this, arguments);
      });
    }
    Object.defineProperty(close, previousSymbol, {
      value: fs$close
    });
    return close;
  }(fs$8.close);
  fs$8.closeSync = function(fs$closeSync) {
    function closeSync(fd) {
      fs$closeSync.apply(fs$8, arguments);
      resetQueue();
    }
    Object.defineProperty(closeSync, previousSymbol, {
      value: fs$closeSync
    });
    return closeSync;
  }(fs$8.closeSync);
  if (/\bgfs4\b/i.test(process.env.NODE_DEBUG || "")) {
    process.on("exit", function() {
      debug(fs$8[gracefulQueue]);
      require$$5.equal(fs$8[gracefulQueue].length, 0);
    });
  }
}
if (!commonjsGlobal[gracefulQueue]) {
  publishQueue(commonjsGlobal, fs$8[gracefulQueue]);
}
var gracefulFs = patch(clone(fs$8));
if (process.env.TEST_GRACEFUL_FS_GLOBAL_PATCH && !fs$8.__patched) {
  gracefulFs = patch(fs$8);
  fs$8.__patched = true;
}
function patch(fs2) {
  polyfills(fs2);
  fs2.gracefulify = patch;
  fs2.createReadStream = createReadStream;
  fs2.createWriteStream = createWriteStream;
  var fs$readFile = fs2.readFile;
  fs2.readFile = readFile;
  function readFile(path2, options, cb) {
    if (typeof options === "function")
      cb = options, options = null;
    return go$readFile(path2, options, cb);
    function go$readFile(path22, options2, cb2, startTime) {
      return fs$readFile(path22, options2, function(err) {
        if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
          enqueue([go$readFile, [path22, options2, cb2], err, startTime || Date.now(), Date.now()]);
        else {
          if (typeof cb2 === "function")
            cb2.apply(this, arguments);
        }
      });
    }
  }
  var fs$writeFile = fs2.writeFile;
  fs2.writeFile = writeFile;
  function writeFile(path2, data, options, cb) {
    if (typeof options === "function")
      cb = options, options = null;
    return go$writeFile(path2, data, options, cb);
    function go$writeFile(path22, data2, options2, cb2, startTime) {
      return fs$writeFile(path22, data2, options2, function(err) {
        if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
          enqueue([go$writeFile, [path22, data2, options2, cb2], err, startTime || Date.now(), Date.now()]);
        else {
          if (typeof cb2 === "function")
            cb2.apply(this, arguments);
        }
      });
    }
  }
  var fs$appendFile = fs2.appendFile;
  if (fs$appendFile)
    fs2.appendFile = appendFile;
  function appendFile(path2, data, options, cb) {
    if (typeof options === "function")
      cb = options, options = null;
    return go$appendFile(path2, data, options, cb);
    function go$appendFile(path22, data2, options2, cb2, startTime) {
      return fs$appendFile(path22, data2, options2, function(err) {
        if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
          enqueue([go$appendFile, [path22, data2, options2, cb2], err, startTime || Date.now(), Date.now()]);
        else {
          if (typeof cb2 === "function")
            cb2.apply(this, arguments);
        }
      });
    }
  }
  var fs$copyFile = fs2.copyFile;
  if (fs$copyFile)
    fs2.copyFile = copyFile;
  function copyFile(src, dest, flags, cb) {
    if (typeof flags === "function") {
      cb = flags;
      flags = 0;
    }
    return go$copyFile(src, dest, flags, cb);
    function go$copyFile(src2, dest2, flags2, cb2, startTime) {
      return fs$copyFile(src2, dest2, flags2, function(err) {
        if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
          enqueue([go$copyFile, [src2, dest2, flags2, cb2], err, startTime || Date.now(), Date.now()]);
        else {
          if (typeof cb2 === "function")
            cb2.apply(this, arguments);
        }
      });
    }
  }
  var fs$readdir = fs2.readdir;
  fs2.readdir = readdir2;
  var noReaddirOptionVersions = /^v[0-5]\./;
  function readdir2(path2, options, cb) {
    if (typeof options === "function")
      cb = options, options = null;
    var go$readdir = noReaddirOptionVersions.test(process.version) ? function go$readdir2(path22, options2, cb2, startTime) {
      return fs$readdir(path22, fs$readdirCallback(
        path22,
        options2,
        cb2,
        startTime
      ));
    } : function go$readdir2(path22, options2, cb2, startTime) {
      return fs$readdir(path22, options2, fs$readdirCallback(
        path22,
        options2,
        cb2,
        startTime
      ));
    };
    return go$readdir(path2, options, cb);
    function fs$readdirCallback(path22, options2, cb2, startTime) {
      return function(err, files) {
        if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
          enqueue([
            go$readdir,
            [path22, options2, cb2],
            err,
            startTime || Date.now(),
            Date.now()
          ]);
        else {
          if (files && files.sort)
            files.sort();
          if (typeof cb2 === "function")
            cb2.call(this, err, files);
        }
      };
    }
  }
  if (process.version.substr(0, 4) === "v0.8") {
    var legStreams = legacy(fs2);
    ReadStream = legStreams.ReadStream;
    WriteStream = legStreams.WriteStream;
  }
  var fs$ReadStream = fs2.ReadStream;
  if (fs$ReadStream) {
    ReadStream.prototype = Object.create(fs$ReadStream.prototype);
    ReadStream.prototype.open = ReadStream$open;
  }
  var fs$WriteStream = fs2.WriteStream;
  if (fs$WriteStream) {
    WriteStream.prototype = Object.create(fs$WriteStream.prototype);
    WriteStream.prototype.open = WriteStream$open;
  }
  Object.defineProperty(fs2, "ReadStream", {
    get: function() {
      return ReadStream;
    },
    set: function(val) {
      ReadStream = val;
    },
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(fs2, "WriteStream", {
    get: function() {
      return WriteStream;
    },
    set: function(val) {
      WriteStream = val;
    },
    enumerable: true,
    configurable: true
  });
  var FileReadStream = ReadStream;
  Object.defineProperty(fs2, "FileReadStream", {
    get: function() {
      return FileReadStream;
    },
    set: function(val) {
      FileReadStream = val;
    },
    enumerable: true,
    configurable: true
  });
  var FileWriteStream = WriteStream;
  Object.defineProperty(fs2, "FileWriteStream", {
    get: function() {
      return FileWriteStream;
    },
    set: function(val) {
      FileWriteStream = val;
    },
    enumerable: true,
    configurable: true
  });
  function ReadStream(path2, options) {
    if (this instanceof ReadStream)
      return fs$ReadStream.apply(this, arguments), this;
    else
      return ReadStream.apply(Object.create(ReadStream.prototype), arguments);
  }
  function ReadStream$open() {
    var that = this;
    open(that.path, that.flags, that.mode, function(err, fd) {
      if (err) {
        if (that.autoClose)
          that.destroy();
        that.emit("error", err);
      } else {
        that.fd = fd;
        that.emit("open", fd);
        that.read();
      }
    });
  }
  function WriteStream(path2, options) {
    if (this instanceof WriteStream)
      return fs$WriteStream.apply(this, arguments), this;
    else
      return WriteStream.apply(Object.create(WriteStream.prototype), arguments);
  }
  function WriteStream$open() {
    var that = this;
    open(that.path, that.flags, that.mode, function(err, fd) {
      if (err) {
        that.destroy();
        that.emit("error", err);
      } else {
        that.fd = fd;
        that.emit("open", fd);
      }
    });
  }
  function createReadStream(path2, options) {
    return new fs2.ReadStream(path2, options);
  }
  function createWriteStream(path2, options) {
    return new fs2.WriteStream(path2, options);
  }
  var fs$open = fs2.open;
  fs2.open = open;
  function open(path2, flags, mode, cb) {
    if (typeof mode === "function")
      cb = mode, mode = null;
    return go$open(path2, flags, mode, cb);
    function go$open(path22, flags2, mode2, cb2, startTime) {
      return fs$open(path22, flags2, mode2, function(err, fd) {
        if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
          enqueue([go$open, [path22, flags2, mode2, cb2], err, startTime || Date.now(), Date.now()]);
        else {
          if (typeof cb2 === "function")
            cb2.apply(this, arguments);
        }
      });
    }
  }
  return fs2;
}
function enqueue(elem) {
  debug("ENQUEUE", elem[0].name, elem[1]);
  fs$8[gracefulQueue].push(elem);
  retry();
}
var retryTimer;
function resetQueue() {
  var now = Date.now();
  for (var i = 0; i < fs$8[gracefulQueue].length; ++i) {
    if (fs$8[gracefulQueue][i].length > 2) {
      fs$8[gracefulQueue][i][3] = now;
      fs$8[gracefulQueue][i][4] = now;
    }
  }
  retry();
}
function retry() {
  clearTimeout(retryTimer);
  retryTimer = void 0;
  if (fs$8[gracefulQueue].length === 0)
    return;
  var elem = fs$8[gracefulQueue].shift();
  var fn = elem[0];
  var args = elem[1];
  var err = elem[2];
  var startTime = elem[3];
  var lastTime = elem[4];
  if (startTime === void 0) {
    debug("RETRY", fn.name, args);
    fn.apply(null, args);
  } else if (Date.now() - startTime >= 6e4) {
    debug("TIMEOUT", fn.name, args);
    var cb = args.pop();
    if (typeof cb === "function")
      cb.call(null, err);
  } else {
    var sinceAttempt = Date.now() - lastTime;
    var sinceStart = Math.max(lastTime - startTime, 1);
    var desiredDelay = Math.min(sinceStart * 1.2, 100);
    if (sinceAttempt >= desiredDelay) {
      debug("RETRY", fn.name, args);
      fn.apply(null, args.concat([startTime]));
    } else {
      fs$8[gracefulQueue].push(elem);
    }
  }
  if (retryTimer === void 0) {
    retryTimer = setTimeout(retry, 0);
  }
}
var readable$2 = { exports: {} };
var processNextickArgs = { exports: {} };
var hasRequiredProcessNextickArgs;
function requireProcessNextickArgs() {
  if (hasRequiredProcessNextickArgs) return processNextickArgs.exports;
  hasRequiredProcessNextickArgs = 1;
  if (typeof process === "undefined" || !process.version || process.version.indexOf("v0.") === 0 || process.version.indexOf("v1.") === 0 && process.version.indexOf("v1.8.") !== 0) {
    processNextickArgs.exports = { nextTick: nextTick2 };
  } else {
    processNextickArgs.exports = process;
  }
  function nextTick2(fn, arg1, arg2, arg3) {
    if (typeof fn !== "function") {
      throw new TypeError('"callback" argument must be a function');
    }
    var len = arguments.length;
    var args, i;
    switch (len) {
      case 0:
      case 1:
        return process.nextTick(fn);
      case 2:
        return process.nextTick(function afterTickOne() {
          fn.call(null, arg1);
        });
      case 3:
        return process.nextTick(function afterTickTwo() {
          fn.call(null, arg1, arg2);
        });
      case 4:
        return process.nextTick(function afterTickThree() {
          fn.call(null, arg1, arg2, arg3);
        });
      default:
        args = new Array(len - 1);
        i = 0;
        while (i < args.length) {
          args[i++] = arguments[i];
        }
        return process.nextTick(function afterTick() {
          fn.apply(null, args);
        });
    }
  }
  return processNextickArgs.exports;
}
var isarray;
var hasRequiredIsarray;
function requireIsarray() {
  if (hasRequiredIsarray) return isarray;
  hasRequiredIsarray = 1;
  var toString2 = {}.toString;
  isarray = Array.isArray || function(arr) {
    return toString2.call(arr) == "[object Array]";
  };
  return isarray;
}
var stream$2;
var hasRequiredStream$2;
function requireStream$2() {
  if (hasRequiredStream$2) return stream$2;
  hasRequiredStream$2 = 1;
  stream$2 = require$$0$2;
  return stream$2;
}
var safeBuffer$2 = { exports: {} };
var hasRequiredSafeBuffer$2;
function requireSafeBuffer$2() {
  if (hasRequiredSafeBuffer$2) return safeBuffer$2.exports;
  hasRequiredSafeBuffer$2 = 1;
  (function(module, exports) {
    var buffer = require$$0$4;
    var Buffer2 = buffer.Buffer;
    function copyProps(src, dst) {
      for (var key in src) {
        dst[key] = src[key];
      }
    }
    if (Buffer2.from && Buffer2.alloc && Buffer2.allocUnsafe && Buffer2.allocUnsafeSlow) {
      module.exports = buffer;
    } else {
      copyProps(buffer, exports);
      exports.Buffer = SafeBuffer;
    }
    function SafeBuffer(arg, encodingOrOffset, length) {
      return Buffer2(arg, encodingOrOffset, length);
    }
    copyProps(Buffer2, SafeBuffer);
    SafeBuffer.from = function(arg, encodingOrOffset, length) {
      if (typeof arg === "number") {
        throw new TypeError("Argument must not be a number");
      }
      return Buffer2(arg, encodingOrOffset, length);
    };
    SafeBuffer.alloc = function(size, fill, encoding) {
      if (typeof size !== "number") {
        throw new TypeError("Argument must be a number");
      }
      var buf = Buffer2(size);
      if (fill !== void 0) {
        if (typeof encoding === "string") {
          buf.fill(fill, encoding);
        } else {
          buf.fill(fill);
        }
      } else {
        buf.fill(0);
      }
      return buf;
    };
    SafeBuffer.allocUnsafe = function(size) {
      if (typeof size !== "number") {
        throw new TypeError("Argument must be a number");
      }
      return Buffer2(size);
    };
    SafeBuffer.allocUnsafeSlow = function(size) {
      if (typeof size !== "number") {
        throw new TypeError("Argument must be a number");
      }
      return buffer.SlowBuffer(size);
    };
  })(safeBuffer$2, safeBuffer$2.exports);
  return safeBuffer$2.exports;
}
var util$d = {};
var hasRequiredUtil;
function requireUtil() {
  if (hasRequiredUtil) return util$d;
  hasRequiredUtil = 1;
  function isArray2(arg) {
    if (Array.isArray) {
      return Array.isArray(arg);
    }
    return objectToString2(arg) === "[object Array]";
  }
  util$d.isArray = isArray2;
  function isBoolean(arg) {
    return typeof arg === "boolean";
  }
  util$d.isBoolean = isBoolean;
  function isNull(arg) {
    return arg === null;
  }
  util$d.isNull = isNull;
  function isNullOrUndefined(arg) {
    return arg == null;
  }
  util$d.isNullOrUndefined = isNullOrUndefined;
  function isNumber(arg) {
    return typeof arg === "number";
  }
  util$d.isNumber = isNumber;
  function isString(arg) {
    return typeof arg === "string";
  }
  util$d.isString = isString;
  function isSymbol(arg) {
    return typeof arg === "symbol";
  }
  util$d.isSymbol = isSymbol;
  function isUndefined(arg) {
    return arg === void 0;
  }
  util$d.isUndefined = isUndefined;
  function isRegExp(re) {
    return objectToString2(re) === "[object RegExp]";
  }
  util$d.isRegExp = isRegExp;
  function isObject2(arg) {
    return typeof arg === "object" && arg !== null;
  }
  util$d.isObject = isObject2;
  function isDate(d) {
    return objectToString2(d) === "[object Date]";
  }
  util$d.isDate = isDate;
  function isError(e) {
    return objectToString2(e) === "[object Error]" || e instanceof Error;
  }
  util$d.isError = isError;
  function isFunction2(arg) {
    return typeof arg === "function";
  }
  util$d.isFunction = isFunction2;
  function isPrimitive(arg) {
    return arg === null || typeof arg === "boolean" || typeof arg === "number" || typeof arg === "string" || typeof arg === "symbol" || // ES6 symbol
    typeof arg === "undefined";
  }
  util$d.isPrimitive = isPrimitive;
  util$d.isBuffer = Buffer.isBuffer;
  function objectToString2(o) {
    return Object.prototype.toString.call(o);
  }
  return util$d;
}
var inherits$8 = { exports: {} };
var inherits_browser = { exports: {} };
var hasRequiredInherits_browser;
function requireInherits_browser() {
  if (hasRequiredInherits_browser) return inherits_browser.exports;
  hasRequiredInherits_browser = 1;
  if (typeof Object.create === "function") {
    inherits_browser.exports = function inherits2(ctor, superCtor) {
      if (superCtor) {
        ctor.super_ = superCtor;
        ctor.prototype = Object.create(superCtor.prototype, {
          constructor: {
            value: ctor,
            enumerable: false,
            writable: true,
            configurable: true
          }
        });
      }
    };
  } else {
    inherits_browser.exports = function inherits2(ctor, superCtor) {
      if (superCtor) {
        ctor.super_ = superCtor;
        var TempCtor = function() {
        };
        TempCtor.prototype = superCtor.prototype;
        ctor.prototype = new TempCtor();
        ctor.prototype.constructor = ctor;
      }
    };
  }
  return inherits_browser.exports;
}
try {
  var util$c = require("util");
  if (typeof util$c.inherits !== "function") throw "";
  inherits$8.exports = util$c.inherits;
} catch (e) {
  inherits$8.exports = requireInherits_browser();
}
var inheritsExports = inherits$8.exports;
var BufferList$3 = { exports: {} };
var hasRequiredBufferList$1;
function requireBufferList$1() {
  if (hasRequiredBufferList$1) return BufferList$3.exports;
  hasRequiredBufferList$1 = 1;
  (function(module) {
    function _classCallCheck(instance, Constructor) {
      if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
      }
    }
    var Buffer2 = requireSafeBuffer$2().Buffer;
    var util2 = require$$0$3;
    function copyBuffer(src, target, offset) {
      src.copy(target, offset);
    }
    module.exports = function() {
      function BufferList2() {
        _classCallCheck(this, BufferList2);
        this.head = null;
        this.tail = null;
        this.length = 0;
      }
      BufferList2.prototype.push = function push(v) {
        var entry = { data: v, next: null };
        if (this.length > 0) this.tail.next = entry;
        else this.head = entry;
        this.tail = entry;
        ++this.length;
      };
      BufferList2.prototype.unshift = function unshift(v) {
        var entry = { data: v, next: this.head };
        if (this.length === 0) this.tail = entry;
        this.head = entry;
        ++this.length;
      };
      BufferList2.prototype.shift = function shift() {
        if (this.length === 0) return;
        var ret = this.head.data;
        if (this.length === 1) this.head = this.tail = null;
        else this.head = this.head.next;
        --this.length;
        return ret;
      };
      BufferList2.prototype.clear = function clear() {
        this.head = this.tail = null;
        this.length = 0;
      };
      BufferList2.prototype.join = function join(s) {
        if (this.length === 0) return "";
        var p = this.head;
        var ret = "" + p.data;
        while (p = p.next) {
          ret += s + p.data;
        }
        return ret;
      };
      BufferList2.prototype.concat = function concat2(n) {
        if (this.length === 0) return Buffer2.alloc(0);
        var ret = Buffer2.allocUnsafe(n >>> 0);
        var p = this.head;
        var i = 0;
        while (p) {
          copyBuffer(p.data, ret, i);
          i += p.data.length;
          p = p.next;
        }
        return ret;
      };
      return BufferList2;
    }();
    if (util2 && util2.inspect && util2.inspect.custom) {
      module.exports.prototype[util2.inspect.custom] = function() {
        var obj = util2.inspect({ length: this.length });
        return this.constructor.name + " " + obj;
      };
    }
  })(BufferList$3);
  return BufferList$3.exports;
}
var destroy_1$2;
var hasRequiredDestroy$2;
function requireDestroy$2() {
  if (hasRequiredDestroy$2) return destroy_1$2;
  hasRequiredDestroy$2 = 1;
  var pna = requireProcessNextickArgs();
  function destroy(err, cb) {
    var _this = this;
    var readableDestroyed = this._readableState && this._readableState.destroyed;
    var writableDestroyed = this._writableState && this._writableState.destroyed;
    if (readableDestroyed || writableDestroyed) {
      if (cb) {
        cb(err);
      } else if (err) {
        if (!this._writableState) {
          pna.nextTick(emitErrorNT, this, err);
        } else if (!this._writableState.errorEmitted) {
          this._writableState.errorEmitted = true;
          pna.nextTick(emitErrorNT, this, err);
        }
      }
      return this;
    }
    if (this._readableState) {
      this._readableState.destroyed = true;
    }
    if (this._writableState) {
      this._writableState.destroyed = true;
    }
    this._destroy(err || null, function(err2) {
      if (!cb && err2) {
        if (!_this._writableState) {
          pna.nextTick(emitErrorNT, _this, err2);
        } else if (!_this._writableState.errorEmitted) {
          _this._writableState.errorEmitted = true;
          pna.nextTick(emitErrorNT, _this, err2);
        }
      } else if (cb) {
        cb(err2);
      }
    });
    return this;
  }
  function undestroy() {
    if (this._readableState) {
      this._readableState.destroyed = false;
      this._readableState.reading = false;
      this._readableState.ended = false;
      this._readableState.endEmitted = false;
    }
    if (this._writableState) {
      this._writableState.destroyed = false;
      this._writableState.ended = false;
      this._writableState.ending = false;
      this._writableState.finalCalled = false;
      this._writableState.prefinished = false;
      this._writableState.finished = false;
      this._writableState.errorEmitted = false;
    }
  }
  function emitErrorNT(self2, err) {
    self2.emit("error", err);
  }
  destroy_1$2 = {
    destroy,
    undestroy
  };
  return destroy_1$2;
}
var node;
var hasRequiredNode;
function requireNode() {
  if (hasRequiredNode) return node;
  hasRequiredNode = 1;
  node = require$$0$3.deprecate;
  return node;
}
var _stream_writable$2;
var hasRequired_stream_writable$2;
function require_stream_writable$2() {
  if (hasRequired_stream_writable$2) return _stream_writable$2;
  hasRequired_stream_writable$2 = 1;
  var pna = requireProcessNextickArgs();
  _stream_writable$2 = Writable2;
  function CorkedRequest(state2) {
    var _this = this;
    this.next = null;
    this.entry = null;
    this.finish = function() {
      onCorkedFinish(_this, state2);
    };
  }
  var asyncWrite = !process.browser && ["v0.10", "v0.9."].indexOf(process.version.slice(0, 5)) > -1 ? setImmediate : pna.nextTick;
  var Duplex;
  Writable2.WritableState = WritableState;
  var util2 = Object.create(requireUtil());
  util2.inherits = inheritsExports;
  var internalUtil = {
    deprecate: requireNode()
  };
  var Stream2 = requireStream$2();
  var Buffer2 = requireSafeBuffer$2().Buffer;
  var OurUint8Array = (typeof commonjsGlobal !== "undefined" ? commonjsGlobal : typeof window !== "undefined" ? window : typeof self !== "undefined" ? self : {}).Uint8Array || function() {
  };
  function _uint8ArrayToBuffer(chunk) {
    return Buffer2.from(chunk);
  }
  function _isUint8Array(obj) {
    return Buffer2.isBuffer(obj) || obj instanceof OurUint8Array;
  }
  var destroyImpl = requireDestroy$2();
  util2.inherits(Writable2, Stream2);
  function nop() {
  }
  function WritableState(options, stream2) {
    Duplex = Duplex || require_stream_duplex$2();
    options = options || {};
    var isDuplex = stream2 instanceof Duplex;
    this.objectMode = !!options.objectMode;
    if (isDuplex) this.objectMode = this.objectMode || !!options.writableObjectMode;
    var hwm = options.highWaterMark;
    var writableHwm = options.writableHighWaterMark;
    var defaultHwm = this.objectMode ? 16 : 16 * 1024;
    if (hwm || hwm === 0) this.highWaterMark = hwm;
    else if (isDuplex && (writableHwm || writableHwm === 0)) this.highWaterMark = writableHwm;
    else this.highWaterMark = defaultHwm;
    this.highWaterMark = Math.floor(this.highWaterMark);
    this.finalCalled = false;
    this.needDrain = false;
    this.ending = false;
    this.ended = false;
    this.finished = false;
    this.destroyed = false;
    var noDecode = options.decodeStrings === false;
    this.decodeStrings = !noDecode;
    this.defaultEncoding = options.defaultEncoding || "utf8";
    this.length = 0;
    this.writing = false;
    this.corked = 0;
    this.sync = true;
    this.bufferProcessing = false;
    this.onwrite = function(er) {
      onwrite(stream2, er);
    };
    this.writecb = null;
    this.writelen = 0;
    this.bufferedRequest = null;
    this.lastBufferedRequest = null;
    this.pendingcb = 0;
    this.prefinished = false;
    this.errorEmitted = false;
    this.bufferedRequestCount = 0;
    this.corkedRequestsFree = new CorkedRequest(this);
  }
  WritableState.prototype.getBuffer = function getBuffer() {
    var current = this.bufferedRequest;
    var out = [];
    while (current) {
      out.push(current);
      current = current.next;
    }
    return out;
  };
  (function() {
    try {
      Object.defineProperty(WritableState.prototype, "buffer", {
        get: internalUtil.deprecate(function() {
          return this.getBuffer();
        }, "_writableState.buffer is deprecated. Use _writableState.getBuffer instead.", "DEP0003")
      });
    } catch (_2) {
    }
  })();
  var realHasInstance;
  if (typeof Symbol === "function" && Symbol.hasInstance && typeof Function.prototype[Symbol.hasInstance] === "function") {
    realHasInstance = Function.prototype[Symbol.hasInstance];
    Object.defineProperty(Writable2, Symbol.hasInstance, {
      value: function(object) {
        if (realHasInstance.call(this, object)) return true;
        if (this !== Writable2) return false;
        return object && object._writableState instanceof WritableState;
      }
    });
  } else {
    realHasInstance = function(object) {
      return object instanceof this;
    };
  }
  function Writable2(options) {
    Duplex = Duplex || require_stream_duplex$2();
    if (!realHasInstance.call(Writable2, this) && !(this instanceof Duplex)) {
      return new Writable2(options);
    }
    this._writableState = new WritableState(options, this);
    this.writable = true;
    if (options) {
      if (typeof options.write === "function") this._write = options.write;
      if (typeof options.writev === "function") this._writev = options.writev;
      if (typeof options.destroy === "function") this._destroy = options.destroy;
      if (typeof options.final === "function") this._final = options.final;
    }
    Stream2.call(this);
  }
  Writable2.prototype.pipe = function() {
    this.emit("error", new Error("Cannot pipe, not readable"));
  };
  function writeAfterEnd(stream2, cb) {
    var er = new Error("write after end");
    stream2.emit("error", er);
    pna.nextTick(cb, er);
  }
  function validChunk(stream2, state2, chunk, cb) {
    var valid = true;
    var er = false;
    if (chunk === null) {
      er = new TypeError("May not write null values to stream");
    } else if (typeof chunk !== "string" && chunk !== void 0 && !state2.objectMode) {
      er = new TypeError("Invalid non-string/buffer chunk");
    }
    if (er) {
      stream2.emit("error", er);
      pna.nextTick(cb, er);
      valid = false;
    }
    return valid;
  }
  Writable2.prototype.write = function(chunk, encoding, cb) {
    var state2 = this._writableState;
    var ret = false;
    var isBuf = !state2.objectMode && _isUint8Array(chunk);
    if (isBuf && !Buffer2.isBuffer(chunk)) {
      chunk = _uint8ArrayToBuffer(chunk);
    }
    if (typeof encoding === "function") {
      cb = encoding;
      encoding = null;
    }
    if (isBuf) encoding = "buffer";
    else if (!encoding) encoding = state2.defaultEncoding;
    if (typeof cb !== "function") cb = nop;
    if (state2.ended) writeAfterEnd(this, cb);
    else if (isBuf || validChunk(this, state2, chunk, cb)) {
      state2.pendingcb++;
      ret = writeOrBuffer(this, state2, isBuf, chunk, encoding, cb);
    }
    return ret;
  };
  Writable2.prototype.cork = function() {
    var state2 = this._writableState;
    state2.corked++;
  };
  Writable2.prototype.uncork = function() {
    var state2 = this._writableState;
    if (state2.corked) {
      state2.corked--;
      if (!state2.writing && !state2.corked && !state2.bufferProcessing && state2.bufferedRequest) clearBuffer(this, state2);
    }
  };
  Writable2.prototype.setDefaultEncoding = function setDefaultEncoding(encoding) {
    if (typeof encoding === "string") encoding = encoding.toLowerCase();
    if (!(["hex", "utf8", "utf-8", "ascii", "binary", "base64", "ucs2", "ucs-2", "utf16le", "utf-16le", "raw"].indexOf((encoding + "").toLowerCase()) > -1)) throw new TypeError("Unknown encoding: " + encoding);
    this._writableState.defaultEncoding = encoding;
    return this;
  };
  function decodeChunk(state2, chunk, encoding) {
    if (!state2.objectMode && state2.decodeStrings !== false && typeof chunk === "string") {
      chunk = Buffer2.from(chunk, encoding);
    }
    return chunk;
  }
  Object.defineProperty(Writable2.prototype, "writableHighWaterMark", {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: false,
    get: function() {
      return this._writableState.highWaterMark;
    }
  });
  function writeOrBuffer(stream2, state2, isBuf, chunk, encoding, cb) {
    if (!isBuf) {
      var newChunk = decodeChunk(state2, chunk, encoding);
      if (chunk !== newChunk) {
        isBuf = true;
        encoding = "buffer";
        chunk = newChunk;
      }
    }
    var len = state2.objectMode ? 1 : chunk.length;
    state2.length += len;
    var ret = state2.length < state2.highWaterMark;
    if (!ret) state2.needDrain = true;
    if (state2.writing || state2.corked) {
      var last = state2.lastBufferedRequest;
      state2.lastBufferedRequest = {
        chunk,
        encoding,
        isBuf,
        callback: cb,
        next: null
      };
      if (last) {
        last.next = state2.lastBufferedRequest;
      } else {
        state2.bufferedRequest = state2.lastBufferedRequest;
      }
      state2.bufferedRequestCount += 1;
    } else {
      doWrite(stream2, state2, false, len, chunk, encoding, cb);
    }
    return ret;
  }
  function doWrite(stream2, state2, writev, len, chunk, encoding, cb) {
    state2.writelen = len;
    state2.writecb = cb;
    state2.writing = true;
    state2.sync = true;
    if (writev) stream2._writev(chunk, state2.onwrite);
    else stream2._write(chunk, encoding, state2.onwrite);
    state2.sync = false;
  }
  function onwriteError(stream2, state2, sync2, er, cb) {
    --state2.pendingcb;
    if (sync2) {
      pna.nextTick(cb, er);
      pna.nextTick(finishMaybe, stream2, state2);
      stream2._writableState.errorEmitted = true;
      stream2.emit("error", er);
    } else {
      cb(er);
      stream2._writableState.errorEmitted = true;
      stream2.emit("error", er);
      finishMaybe(stream2, state2);
    }
  }
  function onwriteStateUpdate(state2) {
    state2.writing = false;
    state2.writecb = null;
    state2.length -= state2.writelen;
    state2.writelen = 0;
  }
  function onwrite(stream2, er) {
    var state2 = stream2._writableState;
    var sync2 = state2.sync;
    var cb = state2.writecb;
    onwriteStateUpdate(state2);
    if (er) onwriteError(stream2, state2, sync2, er, cb);
    else {
      var finished = needFinish(state2);
      if (!finished && !state2.corked && !state2.bufferProcessing && state2.bufferedRequest) {
        clearBuffer(stream2, state2);
      }
      if (sync2) {
        asyncWrite(afterWrite, stream2, state2, finished, cb);
      } else {
        afterWrite(stream2, state2, finished, cb);
      }
    }
  }
  function afterWrite(stream2, state2, finished, cb) {
    if (!finished) onwriteDrain(stream2, state2);
    state2.pendingcb--;
    cb();
    finishMaybe(stream2, state2);
  }
  function onwriteDrain(stream2, state2) {
    if (state2.length === 0 && state2.needDrain) {
      state2.needDrain = false;
      stream2.emit("drain");
    }
  }
  function clearBuffer(stream2, state2) {
    state2.bufferProcessing = true;
    var entry = state2.bufferedRequest;
    if (stream2._writev && entry && entry.next) {
      var l = state2.bufferedRequestCount;
      var buffer = new Array(l);
      var holder = state2.corkedRequestsFree;
      holder.entry = entry;
      var count = 0;
      var allBuffers = true;
      while (entry) {
        buffer[count] = entry;
        if (!entry.isBuf) allBuffers = false;
        entry = entry.next;
        count += 1;
      }
      buffer.allBuffers = allBuffers;
      doWrite(stream2, state2, true, state2.length, buffer, "", holder.finish);
      state2.pendingcb++;
      state2.lastBufferedRequest = null;
      if (holder.next) {
        state2.corkedRequestsFree = holder.next;
        holder.next = null;
      } else {
        state2.corkedRequestsFree = new CorkedRequest(state2);
      }
      state2.bufferedRequestCount = 0;
    } else {
      while (entry) {
        var chunk = entry.chunk;
        var encoding = entry.encoding;
        var cb = entry.callback;
        var len = state2.objectMode ? 1 : chunk.length;
        doWrite(stream2, state2, false, len, chunk, encoding, cb);
        entry = entry.next;
        state2.bufferedRequestCount--;
        if (state2.writing) {
          break;
        }
      }
      if (entry === null) state2.lastBufferedRequest = null;
    }
    state2.bufferedRequest = entry;
    state2.bufferProcessing = false;
  }
  Writable2.prototype._write = function(chunk, encoding, cb) {
    cb(new Error("_write() is not implemented"));
  };
  Writable2.prototype._writev = null;
  Writable2.prototype.end = function(chunk, encoding, cb) {
    var state2 = this._writableState;
    if (typeof chunk === "function") {
      cb = chunk;
      chunk = null;
      encoding = null;
    } else if (typeof encoding === "function") {
      cb = encoding;
      encoding = null;
    }
    if (chunk !== null && chunk !== void 0) this.write(chunk, encoding);
    if (state2.corked) {
      state2.corked = 1;
      this.uncork();
    }
    if (!state2.ending) endWritable(this, state2, cb);
  };
  function needFinish(state2) {
    return state2.ending && state2.length === 0 && state2.bufferedRequest === null && !state2.finished && !state2.writing;
  }
  function callFinal(stream2, state2) {
    stream2._final(function(err) {
      state2.pendingcb--;
      if (err) {
        stream2.emit("error", err);
      }
      state2.prefinished = true;
      stream2.emit("prefinish");
      finishMaybe(stream2, state2);
    });
  }
  function prefinish(stream2, state2) {
    if (!state2.prefinished && !state2.finalCalled) {
      if (typeof stream2._final === "function") {
        state2.pendingcb++;
        state2.finalCalled = true;
        pna.nextTick(callFinal, stream2, state2);
      } else {
        state2.prefinished = true;
        stream2.emit("prefinish");
      }
    }
  }
  function finishMaybe(stream2, state2) {
    var need = needFinish(state2);
    if (need) {
      prefinish(stream2, state2);
      if (state2.pendingcb === 0) {
        state2.finished = true;
        stream2.emit("finish");
      }
    }
    return need;
  }
  function endWritable(stream2, state2, cb) {
    state2.ending = true;
    finishMaybe(stream2, state2);
    if (cb) {
      if (state2.finished) pna.nextTick(cb);
      else stream2.once("finish", cb);
    }
    state2.ended = true;
    stream2.writable = false;
  }
  function onCorkedFinish(corkReq, state2, err) {
    var entry = corkReq.entry;
    corkReq.entry = null;
    while (entry) {
      var cb = entry.callback;
      state2.pendingcb--;
      cb(err);
      entry = entry.next;
    }
    state2.corkedRequestsFree.next = corkReq;
  }
  Object.defineProperty(Writable2.prototype, "destroyed", {
    get: function() {
      if (this._writableState === void 0) {
        return false;
      }
      return this._writableState.destroyed;
    },
    set: function(value) {
      if (!this._writableState) {
        return;
      }
      this._writableState.destroyed = value;
    }
  });
  Writable2.prototype.destroy = destroyImpl.destroy;
  Writable2.prototype._undestroy = destroyImpl.undestroy;
  Writable2.prototype._destroy = function(err, cb) {
    this.end();
    cb(err);
  };
  return _stream_writable$2;
}
var _stream_duplex$2;
var hasRequired_stream_duplex$2;
function require_stream_duplex$2() {
  if (hasRequired_stream_duplex$2) return _stream_duplex$2;
  hasRequired_stream_duplex$2 = 1;
  var pna = requireProcessNextickArgs();
  var objectKeys = Object.keys || function(obj) {
    var keys2 = [];
    for (var key in obj) {
      keys2.push(key);
    }
    return keys2;
  };
  _stream_duplex$2 = Duplex;
  var util2 = Object.create(requireUtil());
  util2.inherits = inheritsExports;
  var Readable2 = require_stream_readable$2();
  var Writable2 = require_stream_writable$2();
  util2.inherits(Duplex, Readable2);
  {
    var keys = objectKeys(Writable2.prototype);
    for (var v = 0; v < keys.length; v++) {
      var method = keys[v];
      if (!Duplex.prototype[method]) Duplex.prototype[method] = Writable2.prototype[method];
    }
  }
  function Duplex(options) {
    if (!(this instanceof Duplex)) return new Duplex(options);
    Readable2.call(this, options);
    Writable2.call(this, options);
    if (options && options.readable === false) this.readable = false;
    if (options && options.writable === false) this.writable = false;
    this.allowHalfOpen = true;
    if (options && options.allowHalfOpen === false) this.allowHalfOpen = false;
    this.once("end", onend);
  }
  Object.defineProperty(Duplex.prototype, "writableHighWaterMark", {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: false,
    get: function() {
      return this._writableState.highWaterMark;
    }
  });
  function onend() {
    if (this.allowHalfOpen || this._writableState.ended) return;
    pna.nextTick(onEndNT, this);
  }
  function onEndNT(self2) {
    self2.end();
  }
  Object.defineProperty(Duplex.prototype, "destroyed", {
    get: function() {
      if (this._readableState === void 0 || this._writableState === void 0) {
        return false;
      }
      return this._readableState.destroyed && this._writableState.destroyed;
    },
    set: function(value) {
      if (this._readableState === void 0 || this._writableState === void 0) {
        return;
      }
      this._readableState.destroyed = value;
      this._writableState.destroyed = value;
    }
  });
  Duplex.prototype._destroy = function(err, cb) {
    this.push(null);
    this.end();
    pna.nextTick(cb, err);
  };
  return _stream_duplex$2;
}
var string_decoder$2 = {};
var hasRequiredString_decoder$2;
function requireString_decoder$2() {
  if (hasRequiredString_decoder$2) return string_decoder$2;
  hasRequiredString_decoder$2 = 1;
  var Buffer2 = requireSafeBuffer$2().Buffer;
  var isEncoding = Buffer2.isEncoding || function(encoding) {
    encoding = "" + encoding;
    switch (encoding && encoding.toLowerCase()) {
      case "hex":
      case "utf8":
      case "utf-8":
      case "ascii":
      case "binary":
      case "base64":
      case "ucs2":
      case "ucs-2":
      case "utf16le":
      case "utf-16le":
      case "raw":
        return true;
      default:
        return false;
    }
  };
  function _normalizeEncoding(enc) {
    if (!enc) return "utf8";
    var retried;
    while (true) {
      switch (enc) {
        case "utf8":
        case "utf-8":
          return "utf8";
        case "ucs2":
        case "ucs-2":
        case "utf16le":
        case "utf-16le":
          return "utf16le";
        case "latin1":
        case "binary":
          return "latin1";
        case "base64":
        case "ascii":
        case "hex":
          return enc;
        default:
          if (retried) return;
          enc = ("" + enc).toLowerCase();
          retried = true;
      }
    }
  }
  function normalizeEncoding(enc) {
    var nenc = _normalizeEncoding(enc);
    if (typeof nenc !== "string" && (Buffer2.isEncoding === isEncoding || !isEncoding(enc))) throw new Error("Unknown encoding: " + enc);
    return nenc || enc;
  }
  string_decoder$2.StringDecoder = StringDecoder2;
  function StringDecoder2(encoding) {
    this.encoding = normalizeEncoding(encoding);
    var nb;
    switch (this.encoding) {
      case "utf16le":
        this.text = utf16Text;
        this.end = utf16End;
        nb = 4;
        break;
      case "utf8":
        this.fillLast = utf8FillLast;
        nb = 4;
        break;
      case "base64":
        this.text = base64Text;
        this.end = base64End;
        nb = 3;
        break;
      default:
        this.write = simpleWrite;
        this.end = simpleEnd;
        return;
    }
    this.lastNeed = 0;
    this.lastTotal = 0;
    this.lastChar = Buffer2.allocUnsafe(nb);
  }
  StringDecoder2.prototype.write = function(buf) {
    if (buf.length === 0) return "";
    var r;
    var i;
    if (this.lastNeed) {
      r = this.fillLast(buf);
      if (r === void 0) return "";
      i = this.lastNeed;
      this.lastNeed = 0;
    } else {
      i = 0;
    }
    if (i < buf.length) return r ? r + this.text(buf, i) : this.text(buf, i);
    return r || "";
  };
  StringDecoder2.prototype.end = utf8End;
  StringDecoder2.prototype.text = utf8Text;
  StringDecoder2.prototype.fillLast = function(buf) {
    if (this.lastNeed <= buf.length) {
      buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, this.lastNeed);
      return this.lastChar.toString(this.encoding, 0, this.lastTotal);
    }
    buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, buf.length);
    this.lastNeed -= buf.length;
  };
  function utf8CheckByte(byte) {
    if (byte <= 127) return 0;
    else if (byte >> 5 === 6) return 2;
    else if (byte >> 4 === 14) return 3;
    else if (byte >> 3 === 30) return 4;
    return byte >> 6 === 2 ? -1 : -2;
  }
  function utf8CheckIncomplete(self2, buf, i) {
    var j = buf.length - 1;
    if (j < i) return 0;
    var nb = utf8CheckByte(buf[j]);
    if (nb >= 0) {
      if (nb > 0) self2.lastNeed = nb - 1;
      return nb;
    }
    if (--j < i || nb === -2) return 0;
    nb = utf8CheckByte(buf[j]);
    if (nb >= 0) {
      if (nb > 0) self2.lastNeed = nb - 2;
      return nb;
    }
    if (--j < i || nb === -2) return 0;
    nb = utf8CheckByte(buf[j]);
    if (nb >= 0) {
      if (nb > 0) {
        if (nb === 2) nb = 0;
        else self2.lastNeed = nb - 3;
      }
      return nb;
    }
    return 0;
  }
  function utf8CheckExtraBytes(self2, buf, p) {
    if ((buf[0] & 192) !== 128) {
      self2.lastNeed = 0;
      return "�";
    }
    if (self2.lastNeed > 1 && buf.length > 1) {
      if ((buf[1] & 192) !== 128) {
        self2.lastNeed = 1;
        return "�";
      }
      if (self2.lastNeed > 2 && buf.length > 2) {
        if ((buf[2] & 192) !== 128) {
          self2.lastNeed = 2;
          return "�";
        }
      }
    }
  }
  function utf8FillLast(buf) {
    var p = this.lastTotal - this.lastNeed;
    var r = utf8CheckExtraBytes(this, buf);
    if (r !== void 0) return r;
    if (this.lastNeed <= buf.length) {
      buf.copy(this.lastChar, p, 0, this.lastNeed);
      return this.lastChar.toString(this.encoding, 0, this.lastTotal);
    }
    buf.copy(this.lastChar, p, 0, buf.length);
    this.lastNeed -= buf.length;
  }
  function utf8Text(buf, i) {
    var total = utf8CheckIncomplete(this, buf, i);
    if (!this.lastNeed) return buf.toString("utf8", i);
    this.lastTotal = total;
    var end2 = buf.length - (total - this.lastNeed);
    buf.copy(this.lastChar, 0, end2);
    return buf.toString("utf8", i, end2);
  }
  function utf8End(buf) {
    var r = buf && buf.length ? this.write(buf) : "";
    if (this.lastNeed) return r + "�";
    return r;
  }
  function utf16Text(buf, i) {
    if ((buf.length - i) % 2 === 0) {
      var r = buf.toString("utf16le", i);
      if (r) {
        var c = r.charCodeAt(r.length - 1);
        if (c >= 55296 && c <= 56319) {
          this.lastNeed = 2;
          this.lastTotal = 4;
          this.lastChar[0] = buf[buf.length - 2];
          this.lastChar[1] = buf[buf.length - 1];
          return r.slice(0, -1);
        }
      }
      return r;
    }
    this.lastNeed = 1;
    this.lastTotal = 2;
    this.lastChar[0] = buf[buf.length - 1];
    return buf.toString("utf16le", i, buf.length - 1);
  }
  function utf16End(buf) {
    var r = buf && buf.length ? this.write(buf) : "";
    if (this.lastNeed) {
      var end2 = this.lastTotal - this.lastNeed;
      return r + this.lastChar.toString("utf16le", 0, end2);
    }
    return r;
  }
  function base64Text(buf, i) {
    var n = (buf.length - i) % 3;
    if (n === 0) return buf.toString("base64", i);
    this.lastNeed = 3 - n;
    this.lastTotal = 3;
    if (n === 1) {
      this.lastChar[0] = buf[buf.length - 1];
    } else {
      this.lastChar[0] = buf[buf.length - 2];
      this.lastChar[1] = buf[buf.length - 1];
    }
    return buf.toString("base64", i, buf.length - n);
  }
  function base64End(buf) {
    var r = buf && buf.length ? this.write(buf) : "";
    if (this.lastNeed) return r + this.lastChar.toString("base64", 0, 3 - this.lastNeed);
    return r;
  }
  function simpleWrite(buf) {
    return buf.toString(this.encoding);
  }
  function simpleEnd(buf) {
    return buf && buf.length ? this.write(buf) : "";
  }
  return string_decoder$2;
}
var _stream_readable$2;
var hasRequired_stream_readable$2;
function require_stream_readable$2() {
  if (hasRequired_stream_readable$2) return _stream_readable$2;
  hasRequired_stream_readable$2 = 1;
  var pna = requireProcessNextickArgs();
  _stream_readable$2 = Readable2;
  var isArray2 = requireIsarray();
  var Duplex;
  Readable2.ReadableState = ReadableState;
  require$$2$1.EventEmitter;
  var EElistenerCount = function(emitter, type) {
    return emitter.listeners(type).length;
  };
  var Stream2 = requireStream$2();
  var Buffer2 = requireSafeBuffer$2().Buffer;
  var OurUint8Array = (typeof commonjsGlobal !== "undefined" ? commonjsGlobal : typeof window !== "undefined" ? window : typeof self !== "undefined" ? self : {}).Uint8Array || function() {
  };
  function _uint8ArrayToBuffer(chunk) {
    return Buffer2.from(chunk);
  }
  function _isUint8Array(obj) {
    return Buffer2.isBuffer(obj) || obj instanceof OurUint8Array;
  }
  var util2 = Object.create(requireUtil());
  util2.inherits = inheritsExports;
  var debugUtil = require$$0$3;
  var debug2 = void 0;
  if (debugUtil && debugUtil.debuglog) {
    debug2 = debugUtil.debuglog("stream");
  } else {
    debug2 = function() {
    };
  }
  var BufferList2 = requireBufferList$1();
  var destroyImpl = requireDestroy$2();
  var StringDecoder2;
  util2.inherits(Readable2, Stream2);
  var kProxyEvents = ["error", "close", "destroy", "pause", "resume"];
  function prependListener(emitter, event, fn) {
    if (typeof emitter.prependListener === "function") return emitter.prependListener(event, fn);
    if (!emitter._events || !emitter._events[event]) emitter.on(event, fn);
    else if (isArray2(emitter._events[event])) emitter._events[event].unshift(fn);
    else emitter._events[event] = [fn, emitter._events[event]];
  }
  function ReadableState(options, stream2) {
    Duplex = Duplex || require_stream_duplex$2();
    options = options || {};
    var isDuplex = stream2 instanceof Duplex;
    this.objectMode = !!options.objectMode;
    if (isDuplex) this.objectMode = this.objectMode || !!options.readableObjectMode;
    var hwm = options.highWaterMark;
    var readableHwm = options.readableHighWaterMark;
    var defaultHwm = this.objectMode ? 16 : 16 * 1024;
    if (hwm || hwm === 0) this.highWaterMark = hwm;
    else if (isDuplex && (readableHwm || readableHwm === 0)) this.highWaterMark = readableHwm;
    else this.highWaterMark = defaultHwm;
    this.highWaterMark = Math.floor(this.highWaterMark);
    this.buffer = new BufferList2();
    this.length = 0;
    this.pipes = null;
    this.pipesCount = 0;
    this.flowing = null;
    this.ended = false;
    this.endEmitted = false;
    this.reading = false;
    this.sync = true;
    this.needReadable = false;
    this.emittedReadable = false;
    this.readableListening = false;
    this.resumeScheduled = false;
    this.destroyed = false;
    this.defaultEncoding = options.defaultEncoding || "utf8";
    this.awaitDrain = 0;
    this.readingMore = false;
    this.decoder = null;
    this.encoding = null;
    if (options.encoding) {
      if (!StringDecoder2) StringDecoder2 = requireString_decoder$2().StringDecoder;
      this.decoder = new StringDecoder2(options.encoding);
      this.encoding = options.encoding;
    }
  }
  function Readable2(options) {
    Duplex = Duplex || require_stream_duplex$2();
    if (!(this instanceof Readable2)) return new Readable2(options);
    this._readableState = new ReadableState(options, this);
    this.readable = true;
    if (options) {
      if (typeof options.read === "function") this._read = options.read;
      if (typeof options.destroy === "function") this._destroy = options.destroy;
    }
    Stream2.call(this);
  }
  Object.defineProperty(Readable2.prototype, "destroyed", {
    get: function() {
      if (this._readableState === void 0) {
        return false;
      }
      return this._readableState.destroyed;
    },
    set: function(value) {
      if (!this._readableState) {
        return;
      }
      this._readableState.destroyed = value;
    }
  });
  Readable2.prototype.destroy = destroyImpl.destroy;
  Readable2.prototype._undestroy = destroyImpl.undestroy;
  Readable2.prototype._destroy = function(err, cb) {
    this.push(null);
    cb(err);
  };
  Readable2.prototype.push = function(chunk, encoding) {
    var state2 = this._readableState;
    var skipChunkCheck;
    if (!state2.objectMode) {
      if (typeof chunk === "string") {
        encoding = encoding || state2.defaultEncoding;
        if (encoding !== state2.encoding) {
          chunk = Buffer2.from(chunk, encoding);
          encoding = "";
        }
        skipChunkCheck = true;
      }
    } else {
      skipChunkCheck = true;
    }
    return readableAddChunk(this, chunk, encoding, false, skipChunkCheck);
  };
  Readable2.prototype.unshift = function(chunk) {
    return readableAddChunk(this, chunk, null, true, false);
  };
  function readableAddChunk(stream2, chunk, encoding, addToFront, skipChunkCheck) {
    var state2 = stream2._readableState;
    if (chunk === null) {
      state2.reading = false;
      onEofChunk(stream2, state2);
    } else {
      var er;
      if (!skipChunkCheck) er = chunkInvalid(state2, chunk);
      if (er) {
        stream2.emit("error", er);
      } else if (state2.objectMode || chunk && chunk.length > 0) {
        if (typeof chunk !== "string" && !state2.objectMode && Object.getPrototypeOf(chunk) !== Buffer2.prototype) {
          chunk = _uint8ArrayToBuffer(chunk);
        }
        if (addToFront) {
          if (state2.endEmitted) stream2.emit("error", new Error("stream.unshift() after end event"));
          else addChunk(stream2, state2, chunk, true);
        } else if (state2.ended) {
          stream2.emit("error", new Error("stream.push() after EOF"));
        } else {
          state2.reading = false;
          if (state2.decoder && !encoding) {
            chunk = state2.decoder.write(chunk);
            if (state2.objectMode || chunk.length !== 0) addChunk(stream2, state2, chunk, false);
            else maybeReadMore(stream2, state2);
          } else {
            addChunk(stream2, state2, chunk, false);
          }
        }
      } else if (!addToFront) {
        state2.reading = false;
      }
    }
    return needMoreData(state2);
  }
  function addChunk(stream2, state2, chunk, addToFront) {
    if (state2.flowing && state2.length === 0 && !state2.sync) {
      stream2.emit("data", chunk);
      stream2.read(0);
    } else {
      state2.length += state2.objectMode ? 1 : chunk.length;
      if (addToFront) state2.buffer.unshift(chunk);
      else state2.buffer.push(chunk);
      if (state2.needReadable) emitReadable(stream2);
    }
    maybeReadMore(stream2, state2);
  }
  function chunkInvalid(state2, chunk) {
    var er;
    if (!_isUint8Array(chunk) && typeof chunk !== "string" && chunk !== void 0 && !state2.objectMode) {
      er = new TypeError("Invalid non-string/buffer chunk");
    }
    return er;
  }
  function needMoreData(state2) {
    return !state2.ended && (state2.needReadable || state2.length < state2.highWaterMark || state2.length === 0);
  }
  Readable2.prototype.isPaused = function() {
    return this._readableState.flowing === false;
  };
  Readable2.prototype.setEncoding = function(enc) {
    if (!StringDecoder2) StringDecoder2 = requireString_decoder$2().StringDecoder;
    this._readableState.decoder = new StringDecoder2(enc);
    this._readableState.encoding = enc;
    return this;
  };
  var MAX_HWM = 8388608;
  function computeNewHighWaterMark(n) {
    if (n >= MAX_HWM) {
      n = MAX_HWM;
    } else {
      n--;
      n |= n >>> 1;
      n |= n >>> 2;
      n |= n >>> 4;
      n |= n >>> 8;
      n |= n >>> 16;
      n++;
    }
    return n;
  }
  function howMuchToRead(n, state2) {
    if (n <= 0 || state2.length === 0 && state2.ended) return 0;
    if (state2.objectMode) return 1;
    if (n !== n) {
      if (state2.flowing && state2.length) return state2.buffer.head.data.length;
      else return state2.length;
    }
    if (n > state2.highWaterMark) state2.highWaterMark = computeNewHighWaterMark(n);
    if (n <= state2.length) return n;
    if (!state2.ended) {
      state2.needReadable = true;
      return 0;
    }
    return state2.length;
  }
  Readable2.prototype.read = function(n) {
    debug2("read", n);
    n = parseInt(n, 10);
    var state2 = this._readableState;
    var nOrig = n;
    if (n !== 0) state2.emittedReadable = false;
    if (n === 0 && state2.needReadable && (state2.length >= state2.highWaterMark || state2.ended)) {
      debug2("read: emitReadable", state2.length, state2.ended);
      if (state2.length === 0 && state2.ended) endReadable(this);
      else emitReadable(this);
      return null;
    }
    n = howMuchToRead(n, state2);
    if (n === 0 && state2.ended) {
      if (state2.length === 0) endReadable(this);
      return null;
    }
    var doRead = state2.needReadable;
    debug2("need readable", doRead);
    if (state2.length === 0 || state2.length - n < state2.highWaterMark) {
      doRead = true;
      debug2("length less than watermark", doRead);
    }
    if (state2.ended || state2.reading) {
      doRead = false;
      debug2("reading or ended", doRead);
    } else if (doRead) {
      debug2("do read");
      state2.reading = true;
      state2.sync = true;
      if (state2.length === 0) state2.needReadable = true;
      this._read(state2.highWaterMark);
      state2.sync = false;
      if (!state2.reading) n = howMuchToRead(nOrig, state2);
    }
    var ret;
    if (n > 0) ret = fromList(n, state2);
    else ret = null;
    if (ret === null) {
      state2.needReadable = true;
      n = 0;
    } else {
      state2.length -= n;
    }
    if (state2.length === 0) {
      if (!state2.ended) state2.needReadable = true;
      if (nOrig !== n && state2.ended) endReadable(this);
    }
    if (ret !== null) this.emit("data", ret);
    return ret;
  };
  function onEofChunk(stream2, state2) {
    if (state2.ended) return;
    if (state2.decoder) {
      var chunk = state2.decoder.end();
      if (chunk && chunk.length) {
        state2.buffer.push(chunk);
        state2.length += state2.objectMode ? 1 : chunk.length;
      }
    }
    state2.ended = true;
    emitReadable(stream2);
  }
  function emitReadable(stream2) {
    var state2 = stream2._readableState;
    state2.needReadable = false;
    if (!state2.emittedReadable) {
      debug2("emitReadable", state2.flowing);
      state2.emittedReadable = true;
      if (state2.sync) pna.nextTick(emitReadable_, stream2);
      else emitReadable_(stream2);
    }
  }
  function emitReadable_(stream2) {
    debug2("emit readable");
    stream2.emit("readable");
    flow(stream2);
  }
  function maybeReadMore(stream2, state2) {
    if (!state2.readingMore) {
      state2.readingMore = true;
      pna.nextTick(maybeReadMore_, stream2, state2);
    }
  }
  function maybeReadMore_(stream2, state2) {
    var len = state2.length;
    while (!state2.reading && !state2.flowing && !state2.ended && state2.length < state2.highWaterMark) {
      debug2("maybeReadMore read 0");
      stream2.read(0);
      if (len === state2.length)
        break;
      else len = state2.length;
    }
    state2.readingMore = false;
  }
  Readable2.prototype._read = function(n) {
    this.emit("error", new Error("_read() is not implemented"));
  };
  Readable2.prototype.pipe = function(dest, pipeOpts) {
    var src = this;
    var state2 = this._readableState;
    switch (state2.pipesCount) {
      case 0:
        state2.pipes = dest;
        break;
      case 1:
        state2.pipes = [state2.pipes, dest];
        break;
      default:
        state2.pipes.push(dest);
        break;
    }
    state2.pipesCount += 1;
    debug2("pipe count=%d opts=%j", state2.pipesCount, pipeOpts);
    var doEnd = (!pipeOpts || pipeOpts.end !== false) && dest !== process.stdout && dest !== process.stderr;
    var endFn = doEnd ? onend : unpipe;
    if (state2.endEmitted) pna.nextTick(endFn);
    else src.once("end", endFn);
    dest.on("unpipe", onunpipe);
    function onunpipe(readable2, unpipeInfo) {
      debug2("onunpipe");
      if (readable2 === src) {
        if (unpipeInfo && unpipeInfo.hasUnpiped === false) {
          unpipeInfo.hasUnpiped = true;
          cleanup();
        }
      }
    }
    function onend() {
      debug2("onend");
      dest.end();
    }
    var ondrain = pipeOnDrain(src);
    dest.on("drain", ondrain);
    var cleanedUp = false;
    function cleanup() {
      debug2("cleanup");
      dest.removeListener("close", onclose);
      dest.removeListener("finish", onfinish);
      dest.removeListener("drain", ondrain);
      dest.removeListener("error", onerror);
      dest.removeListener("unpipe", onunpipe);
      src.removeListener("end", onend);
      src.removeListener("end", unpipe);
      src.removeListener("data", ondata);
      cleanedUp = true;
      if (state2.awaitDrain && (!dest._writableState || dest._writableState.needDrain)) ondrain();
    }
    var increasedAwaitDrain = false;
    src.on("data", ondata);
    function ondata(chunk) {
      debug2("ondata");
      increasedAwaitDrain = false;
      var ret = dest.write(chunk);
      if (false === ret && !increasedAwaitDrain) {
        if ((state2.pipesCount === 1 && state2.pipes === dest || state2.pipesCount > 1 && indexOf2(state2.pipes, dest) !== -1) && !cleanedUp) {
          debug2("false write response, pause", state2.awaitDrain);
          state2.awaitDrain++;
          increasedAwaitDrain = true;
        }
        src.pause();
      }
    }
    function onerror(er) {
      debug2("onerror", er);
      unpipe();
      dest.removeListener("error", onerror);
      if (EElistenerCount(dest, "error") === 0) dest.emit("error", er);
    }
    prependListener(dest, "error", onerror);
    function onclose() {
      dest.removeListener("finish", onfinish);
      unpipe();
    }
    dest.once("close", onclose);
    function onfinish() {
      debug2("onfinish");
      dest.removeListener("close", onclose);
      unpipe();
    }
    dest.once("finish", onfinish);
    function unpipe() {
      debug2("unpipe");
      src.unpipe(dest);
    }
    dest.emit("pipe", src);
    if (!state2.flowing) {
      debug2("pipe resume");
      src.resume();
    }
    return dest;
  };
  function pipeOnDrain(src) {
    return function() {
      var state2 = src._readableState;
      debug2("pipeOnDrain", state2.awaitDrain);
      if (state2.awaitDrain) state2.awaitDrain--;
      if (state2.awaitDrain === 0 && EElistenerCount(src, "data")) {
        state2.flowing = true;
        flow(src);
      }
    };
  }
  Readable2.prototype.unpipe = function(dest) {
    var state2 = this._readableState;
    var unpipeInfo = { hasUnpiped: false };
    if (state2.pipesCount === 0) return this;
    if (state2.pipesCount === 1) {
      if (dest && dest !== state2.pipes) return this;
      if (!dest) dest = state2.pipes;
      state2.pipes = null;
      state2.pipesCount = 0;
      state2.flowing = false;
      if (dest) dest.emit("unpipe", this, unpipeInfo);
      return this;
    }
    if (!dest) {
      var dests = state2.pipes;
      var len = state2.pipesCount;
      state2.pipes = null;
      state2.pipesCount = 0;
      state2.flowing = false;
      for (var i = 0; i < len; i++) {
        dests[i].emit("unpipe", this, { hasUnpiped: false });
      }
      return this;
    }
    var index2 = indexOf2(state2.pipes, dest);
    if (index2 === -1) return this;
    state2.pipes.splice(index2, 1);
    state2.pipesCount -= 1;
    if (state2.pipesCount === 1) state2.pipes = state2.pipes[0];
    dest.emit("unpipe", this, unpipeInfo);
    return this;
  };
  Readable2.prototype.on = function(ev, fn) {
    var res = Stream2.prototype.on.call(this, ev, fn);
    if (ev === "data") {
      if (this._readableState.flowing !== false) this.resume();
    } else if (ev === "readable") {
      var state2 = this._readableState;
      if (!state2.endEmitted && !state2.readableListening) {
        state2.readableListening = state2.needReadable = true;
        state2.emittedReadable = false;
        if (!state2.reading) {
          pna.nextTick(nReadingNextTick, this);
        } else if (state2.length) {
          emitReadable(this);
        }
      }
    }
    return res;
  };
  Readable2.prototype.addListener = Readable2.prototype.on;
  function nReadingNextTick(self2) {
    debug2("readable nexttick read 0");
    self2.read(0);
  }
  Readable2.prototype.resume = function() {
    var state2 = this._readableState;
    if (!state2.flowing) {
      debug2("resume");
      state2.flowing = true;
      resume(this, state2);
    }
    return this;
  };
  function resume(stream2, state2) {
    if (!state2.resumeScheduled) {
      state2.resumeScheduled = true;
      pna.nextTick(resume_, stream2, state2);
    }
  }
  function resume_(stream2, state2) {
    if (!state2.reading) {
      debug2("resume read 0");
      stream2.read(0);
    }
    state2.resumeScheduled = false;
    state2.awaitDrain = 0;
    stream2.emit("resume");
    flow(stream2);
    if (state2.flowing && !state2.reading) stream2.read(0);
  }
  Readable2.prototype.pause = function() {
    debug2("call pause flowing=%j", this._readableState.flowing);
    if (false !== this._readableState.flowing) {
      debug2("pause");
      this._readableState.flowing = false;
      this.emit("pause");
    }
    return this;
  };
  function flow(stream2) {
    var state2 = stream2._readableState;
    debug2("flow", state2.flowing);
    while (state2.flowing && stream2.read() !== null) {
    }
  }
  Readable2.prototype.wrap = function(stream2) {
    var _this = this;
    var state2 = this._readableState;
    var paused = false;
    stream2.on("end", function() {
      debug2("wrapped end");
      if (state2.decoder && !state2.ended) {
        var chunk = state2.decoder.end();
        if (chunk && chunk.length) _this.push(chunk);
      }
      _this.push(null);
    });
    stream2.on("data", function(chunk) {
      debug2("wrapped data");
      if (state2.decoder) chunk = state2.decoder.write(chunk);
      if (state2.objectMode && (chunk === null || chunk === void 0)) return;
      else if (!state2.objectMode && (!chunk || !chunk.length)) return;
      var ret = _this.push(chunk);
      if (!ret) {
        paused = true;
        stream2.pause();
      }
    });
    for (var i in stream2) {
      if (this[i] === void 0 && typeof stream2[i] === "function") {
        this[i] = /* @__PURE__ */ function(method) {
          return function() {
            return stream2[method].apply(stream2, arguments);
          };
        }(i);
      }
    }
    for (var n = 0; n < kProxyEvents.length; n++) {
      stream2.on(kProxyEvents[n], this.emit.bind(this, kProxyEvents[n]));
    }
    this._read = function(n2) {
      debug2("wrapped _read", n2);
      if (paused) {
        paused = false;
        stream2.resume();
      }
    };
    return this;
  };
  Object.defineProperty(Readable2.prototype, "readableHighWaterMark", {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: false,
    get: function() {
      return this._readableState.highWaterMark;
    }
  });
  Readable2._fromList = fromList;
  function fromList(n, state2) {
    if (state2.length === 0) return null;
    var ret;
    if (state2.objectMode) ret = state2.buffer.shift();
    else if (!n || n >= state2.length) {
      if (state2.decoder) ret = state2.buffer.join("");
      else if (state2.buffer.length === 1) ret = state2.buffer.head.data;
      else ret = state2.buffer.concat(state2.length);
      state2.buffer.clear();
    } else {
      ret = fromListPartial(n, state2.buffer, state2.decoder);
    }
    return ret;
  }
  function fromListPartial(n, list, hasStrings) {
    var ret;
    if (n < list.head.data.length) {
      ret = list.head.data.slice(0, n);
      list.head.data = list.head.data.slice(n);
    } else if (n === list.head.data.length) {
      ret = list.shift();
    } else {
      ret = hasStrings ? copyFromBufferString(n, list) : copyFromBuffer(n, list);
    }
    return ret;
  }
  function copyFromBufferString(n, list) {
    var p = list.head;
    var c = 1;
    var ret = p.data;
    n -= ret.length;
    while (p = p.next) {
      var str = p.data;
      var nb = n > str.length ? str.length : n;
      if (nb === str.length) ret += str;
      else ret += str.slice(0, n);
      n -= nb;
      if (n === 0) {
        if (nb === str.length) {
          ++c;
          if (p.next) list.head = p.next;
          else list.head = list.tail = null;
        } else {
          list.head = p;
          p.data = str.slice(nb);
        }
        break;
      }
      ++c;
    }
    list.length -= c;
    return ret;
  }
  function copyFromBuffer(n, list) {
    var ret = Buffer2.allocUnsafe(n);
    var p = list.head;
    var c = 1;
    p.data.copy(ret);
    n -= p.data.length;
    while (p = p.next) {
      var buf = p.data;
      var nb = n > buf.length ? buf.length : n;
      buf.copy(ret, ret.length - n, 0, nb);
      n -= nb;
      if (n === 0) {
        if (nb === buf.length) {
          ++c;
          if (p.next) list.head = p.next;
          else list.head = list.tail = null;
        } else {
          list.head = p;
          p.data = buf.slice(nb);
        }
        break;
      }
      ++c;
    }
    list.length -= c;
    return ret;
  }
  function endReadable(stream2) {
    var state2 = stream2._readableState;
    if (state2.length > 0) throw new Error('"endReadable()" called on non-empty stream');
    if (!state2.endEmitted) {
      state2.ended = true;
      pna.nextTick(endReadableNT, state2, stream2);
    }
  }
  function endReadableNT(state2, stream2) {
    if (!state2.endEmitted && state2.length === 0) {
      state2.endEmitted = true;
      stream2.readable = false;
      stream2.emit("end");
    }
  }
  function indexOf2(xs, x) {
    for (var i = 0, l = xs.length; i < l; i++) {
      if (xs[i] === x) return i;
    }
    return -1;
  }
  return _stream_readable$2;
}
var _stream_transform$2;
var hasRequired_stream_transform$2;
function require_stream_transform$2() {
  if (hasRequired_stream_transform$2) return _stream_transform$2;
  hasRequired_stream_transform$2 = 1;
  _stream_transform$2 = Transform2;
  var Duplex = require_stream_duplex$2();
  var util2 = Object.create(requireUtil());
  util2.inherits = inheritsExports;
  util2.inherits(Transform2, Duplex);
  function afterTransform(er, data) {
    var ts = this._transformState;
    ts.transforming = false;
    var cb = ts.writecb;
    if (!cb) {
      return this.emit("error", new Error("write callback called multiple times"));
    }
    ts.writechunk = null;
    ts.writecb = null;
    if (data != null)
      this.push(data);
    cb(er);
    var rs = this._readableState;
    rs.reading = false;
    if (rs.needReadable || rs.length < rs.highWaterMark) {
      this._read(rs.highWaterMark);
    }
  }
  function Transform2(options) {
    if (!(this instanceof Transform2)) return new Transform2(options);
    Duplex.call(this, options);
    this._transformState = {
      afterTransform: afterTransform.bind(this),
      needTransform: false,
      transforming: false,
      writecb: null,
      writechunk: null,
      writeencoding: null
    };
    this._readableState.needReadable = true;
    this._readableState.sync = false;
    if (options) {
      if (typeof options.transform === "function") this._transform = options.transform;
      if (typeof options.flush === "function") this._flush = options.flush;
    }
    this.on("prefinish", prefinish);
  }
  function prefinish() {
    var _this = this;
    if (typeof this._flush === "function") {
      this._flush(function(er, data) {
        done(_this, er, data);
      });
    } else {
      done(this, null, null);
    }
  }
  Transform2.prototype.push = function(chunk, encoding) {
    this._transformState.needTransform = false;
    return Duplex.prototype.push.call(this, chunk, encoding);
  };
  Transform2.prototype._transform = function(chunk, encoding, cb) {
    throw new Error("_transform() is not implemented");
  };
  Transform2.prototype._write = function(chunk, encoding, cb) {
    var ts = this._transformState;
    ts.writecb = cb;
    ts.writechunk = chunk;
    ts.writeencoding = encoding;
    if (!ts.transforming) {
      var rs = this._readableState;
      if (ts.needTransform || rs.needReadable || rs.length < rs.highWaterMark) this._read(rs.highWaterMark);
    }
  };
  Transform2.prototype._read = function(n) {
    var ts = this._transformState;
    if (ts.writechunk !== null && ts.writecb && !ts.transforming) {
      ts.transforming = true;
      this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform);
    } else {
      ts.needTransform = true;
    }
  };
  Transform2.prototype._destroy = function(err, cb) {
    var _this2 = this;
    Duplex.prototype._destroy.call(this, err, function(err2) {
      cb(err2);
      _this2.emit("close");
    });
  };
  function done(stream2, er, data) {
    if (er) return stream2.emit("error", er);
    if (data != null)
      stream2.push(data);
    if (stream2._writableState.length) throw new Error("Calling transform done when ws.length != 0");
    if (stream2._transformState.transforming) throw new Error("Calling transform done when still transforming");
    return stream2.push(null);
  }
  return _stream_transform$2;
}
var _stream_passthrough$2;
var hasRequired_stream_passthrough$2;
function require_stream_passthrough$2() {
  if (hasRequired_stream_passthrough$2) return _stream_passthrough$2;
  hasRequired_stream_passthrough$2 = 1;
  _stream_passthrough$2 = PassThrough2;
  var Transform2 = require_stream_transform$2();
  var util2 = Object.create(requireUtil());
  util2.inherits = inheritsExports;
  util2.inherits(PassThrough2, Transform2);
  function PassThrough2(options) {
    if (!(this instanceof PassThrough2)) return new PassThrough2(options);
    Transform2.call(this, options);
  }
  PassThrough2.prototype._transform = function(chunk, encoding, cb) {
    cb(null, chunk);
  };
  return _stream_passthrough$2;
}
(function(module, exports) {
  var Stream2 = require$$0$2;
  if (process.env.READABLE_STREAM === "disable" && Stream2) {
    module.exports = Stream2;
    exports = module.exports = Stream2.Readable;
    exports.Readable = Stream2.Readable;
    exports.Writable = Stream2.Writable;
    exports.Duplex = Stream2.Duplex;
    exports.Transform = Stream2.Transform;
    exports.PassThrough = Stream2.PassThrough;
    exports.Stream = Stream2;
  } else {
    exports = module.exports = require_stream_readable$2();
    exports.Stream = Stream2 || exports;
    exports.Readable = exports;
    exports.Writable = require_stream_writable$2();
    exports.Duplex = require_stream_duplex$2();
    exports.Transform = require_stream_transform$2();
    exports.PassThrough = require_stream_passthrough$2();
  }
})(readable$2, readable$2.exports);
var readableExports$2 = readable$2.exports;
var passthrough = readableExports$2.PassThrough;
var util$b = require$$0$3;
var PassThrough$4 = passthrough;
var lazystream$2 = {
  Readable: Readable$1
};
util$b.inherits(Readable$1, PassThrough$4);
util$b.inherits(Writable$2, PassThrough$4);
function beforeFirstCall(instance, method, callback) {
  instance[method] = function() {
    delete instance[method];
    callback.apply(this, arguments);
    return this[method].apply(this, arguments);
  };
}
function Readable$1(fn, options) {
  if (!(this instanceof Readable$1))
    return new Readable$1(fn, options);
  PassThrough$4.call(this, options);
  beforeFirstCall(this, "_read", function() {
    var source = fn.call(this, options);
    var emit = this.emit.bind(this, "error");
    source.on("error", emit);
    source.pipe(this);
  });
  this.emit("readable");
}
function Writable$2(fn, options) {
  if (!(this instanceof Writable$2))
    return new Writable$2(fn, options);
  PassThrough$4.call(this, options);
  beforeFirstCall(this, "_write", function() {
    var destination = fn.call(this, options);
    var emit = this.emit.bind(this, "error");
    destination.on("error", emit);
    this.pipe(destination);
  });
  this.emit("writable");
}
/*!
 * normalize-path <https://github.com/jonschlinkert/normalize-path>
 *
 * Copyright (c) 2014-2018, Jon Schlinkert.
 * Released under the MIT License.
 */
var normalizePath$3 = function(path2, stripTrailing) {
  if (typeof path2 !== "string") {
    throw new TypeError("expected path to be a string");
  }
  if (path2 === "\\" || path2 === "/") return "/";
  var len = path2.length;
  if (len <= 1) return path2;
  var prefix = "";
  if (len > 4 && path2[3] === "\\") {
    var ch = path2[2];
    if ((ch === "?" || ch === ".") && path2.slice(0, 2) === "\\\\") {
      path2 = path2.slice(2);
      prefix = "//";
    }
  }
  var segs = path2.split(/[/\\]+/);
  if (stripTrailing !== false && segs[segs.length - 1] === "") {
    segs.pop();
  }
  return prefix + segs.join("/");
};
var MAX_SAFE_INTEGER$3 = 9007199254740991;
var argsTag$3 = "[object Arguments]", funcTag$3 = "[object Function]", genTag$3 = "[object GeneratorFunction]";
var reIsUint = /^(?:0|[1-9]\d*)$/;
function apply$2(func, thisArg, args) {
  switch (args.length) {
    case 0:
      return func.call(thisArg);
    case 1:
      return func.call(thisArg, args[0]);
    case 2:
      return func.call(thisArg, args[0], args[1]);
    case 3:
      return func.call(thisArg, args[0], args[1], args[2]);
  }
  return func.apply(thisArg, args);
}
function baseTimes(n, iteratee) {
  var index2 = -1, result = Array(n);
  while (++index2 < n) {
    result[index2] = iteratee(index2);
  }
  return result;
}
var objectProto$4 = Object.prototype;
var hasOwnProperty$4 = objectProto$4.hasOwnProperty;
var objectToString$4 = objectProto$4.toString;
var propertyIsEnumerable$3 = objectProto$4.propertyIsEnumerable;
var nativeMax$2 = Math.max;
function arrayLikeKeys(value, inherited) {
  var result = isArray$4(value) || isArguments$3(value) ? baseTimes(value.length, String) : [];
  var length = result.length, skipIndexes = !!length;
  for (var key in value) {
    if (!(skipIndexes && (key == "length" || isIndex(key, length)))) {
      result.push(key);
    }
  }
  return result;
}
function assignInDefaults(objValue, srcValue, key, object) {
  if (objValue === void 0 || eq$2(objValue, objectProto$4[key]) && !hasOwnProperty$4.call(object, key)) {
    return srcValue;
  }
  return objValue;
}
function assignValue(object, key, value) {
  var objValue = object[key];
  if (!(hasOwnProperty$4.call(object, key) && eq$2(objValue, value)) || value === void 0 && !(key in object)) {
    object[key] = value;
  }
}
function baseKeysIn(object) {
  if (!isObject$3(object)) {
    return nativeKeysIn(object);
  }
  var isProto = isPrototype(object), result = [];
  for (var key in object) {
    if (!(key == "constructor" && (isProto || !hasOwnProperty$4.call(object, key)))) {
      result.push(key);
    }
  }
  return result;
}
function baseRest$2(func, start) {
  start = nativeMax$2(start === void 0 ? func.length - 1 : start, 0);
  return function() {
    var args = arguments, index2 = -1, length = nativeMax$2(args.length - start, 0), array = Array(length);
    while (++index2 < length) {
      array[index2] = args[start + index2];
    }
    index2 = -1;
    var otherArgs = Array(start + 1);
    while (++index2 < start) {
      otherArgs[index2] = args[index2];
    }
    otherArgs[start] = array;
    return apply$2(func, this, otherArgs);
  };
}
function copyObject(source, props, object, customizer) {
  object || (object = {});
  var index2 = -1, length = props.length;
  while (++index2 < length) {
    var key = props[index2];
    var newValue = customizer ? customizer(object[key], source[key], key, object, source) : void 0;
    assignValue(object, key, newValue === void 0 ? source[key] : newValue);
  }
  return object;
}
function createAssigner(assigner) {
  return baseRest$2(function(object, sources) {
    var index2 = -1, length = sources.length, customizer = length > 1 ? sources[length - 1] : void 0, guard = length > 2 ? sources[2] : void 0;
    customizer = assigner.length > 3 && typeof customizer == "function" ? (length--, customizer) : void 0;
    if (guard && isIterateeCall(sources[0], sources[1], guard)) {
      customizer = length < 3 ? void 0 : customizer;
      length = 1;
    }
    object = Object(object);
    while (++index2 < length) {
      var source = sources[index2];
      if (source) {
        assigner(object, source, index2, customizer);
      }
    }
    return object;
  });
}
function isIndex(value, length) {
  length = length == null ? MAX_SAFE_INTEGER$3 : length;
  return !!length && (typeof value == "number" || reIsUint.test(value)) && (value > -1 && value % 1 == 0 && value < length);
}
function isIterateeCall(value, index2, object) {
  if (!isObject$3(object)) {
    return false;
  }
  var type = typeof index2;
  if (type == "number" ? isArrayLike$3(object) && isIndex(index2, object.length) : type == "string" && index2 in object) {
    return eq$2(object[index2], value);
  }
  return false;
}
function isPrototype(value) {
  var Ctor = value && value.constructor, proto = typeof Ctor == "function" && Ctor.prototype || objectProto$4;
  return value === proto;
}
function nativeKeysIn(object) {
  var result = [];
  if (object != null) {
    for (var key in Object(object)) {
      result.push(key);
    }
  }
  return result;
}
function eq$2(value, other) {
  return value === other || value !== value && other !== other;
}
function isArguments$3(value) {
  return isArrayLikeObject$3(value) && hasOwnProperty$4.call(value, "callee") && (!propertyIsEnumerable$3.call(value, "callee") || objectToString$4.call(value) == argsTag$3);
}
var isArray$4 = Array.isArray;
function isArrayLike$3(value) {
  return value != null && isLength$3(value.length) && !isFunction$3(value);
}
function isArrayLikeObject$3(value) {
  return isObjectLike$4(value) && isArrayLike$3(value);
}
function isFunction$3(value) {
  var tag = isObject$3(value) ? objectToString$4.call(value) : "";
  return tag == funcTag$3 || tag == genTag$3;
}
function isLength$3(value) {
  return typeof value == "number" && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER$3;
}
function isObject$3(value) {
  var type = typeof value;
  return !!value && (type == "object" || type == "function");
}
function isObjectLike$4(value) {
  return !!value && typeof value == "object";
}
var assignInWith = createAssigner(function(object, source, srcIndex, customizer) {
  copyObject(source, keysIn(source), object, customizer);
});
var defaults$2 = baseRest$2(function(args) {
  args.push(void 0, assignInDefaults);
  return apply$2(assignInWith, void 0, args);
});
function keysIn(object) {
  return isArrayLike$3(object) ? arrayLikeKeys(object) : baseKeysIn(object);
}
var lodash_defaults = defaults$2;
var readable$1 = { exports: {} };
var stream$1;
var hasRequiredStream$1;
function requireStream$1() {
  if (hasRequiredStream$1) return stream$1;
  hasRequiredStream$1 = 1;
  stream$1 = require$$0$2;
  return stream$1;
}
var safeBuffer$1 = { exports: {} };
var hasRequiredSafeBuffer$1;
function requireSafeBuffer$1() {
  if (hasRequiredSafeBuffer$1) return safeBuffer$1.exports;
  hasRequiredSafeBuffer$1 = 1;
  (function(module, exports) {
    var buffer = require$$0$4;
    var Buffer2 = buffer.Buffer;
    function copyProps(src, dst) {
      for (var key in src) {
        dst[key] = src[key];
      }
    }
    if (Buffer2.from && Buffer2.alloc && Buffer2.allocUnsafe && Buffer2.allocUnsafeSlow) {
      module.exports = buffer;
    } else {
      copyProps(buffer, exports);
      exports.Buffer = SafeBuffer;
    }
    function SafeBuffer(arg, encodingOrOffset, length) {
      return Buffer2(arg, encodingOrOffset, length);
    }
    copyProps(Buffer2, SafeBuffer);
    SafeBuffer.from = function(arg, encodingOrOffset, length) {
      if (typeof arg === "number") {
        throw new TypeError("Argument must not be a number");
      }
      return Buffer2(arg, encodingOrOffset, length);
    };
    SafeBuffer.alloc = function(size, fill, encoding) {
      if (typeof size !== "number") {
        throw new TypeError("Argument must be a number");
      }
      var buf = Buffer2(size);
      if (fill !== void 0) {
        if (typeof encoding === "string") {
          buf.fill(fill, encoding);
        } else {
          buf.fill(fill);
        }
      } else {
        buf.fill(0);
      }
      return buf;
    };
    SafeBuffer.allocUnsafe = function(size) {
      if (typeof size !== "number") {
        throw new TypeError("Argument must be a number");
      }
      return Buffer2(size);
    };
    SafeBuffer.allocUnsafeSlow = function(size) {
      if (typeof size !== "number") {
        throw new TypeError("Argument must be a number");
      }
      return buffer.SlowBuffer(size);
    };
  })(safeBuffer$1, safeBuffer$1.exports);
  return safeBuffer$1.exports;
}
var BufferList$2 = { exports: {} };
var hasRequiredBufferList;
function requireBufferList() {
  if (hasRequiredBufferList) return BufferList$2.exports;
  hasRequiredBufferList = 1;
  (function(module) {
    function _classCallCheck(instance, Constructor) {
      if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
      }
    }
    var Buffer2 = requireSafeBuffer$1().Buffer;
    var util2 = require$$0$3;
    function copyBuffer(src, target, offset) {
      src.copy(target, offset);
    }
    module.exports = function() {
      function BufferList2() {
        _classCallCheck(this, BufferList2);
        this.head = null;
        this.tail = null;
        this.length = 0;
      }
      BufferList2.prototype.push = function push(v) {
        var entry = { data: v, next: null };
        if (this.length > 0) this.tail.next = entry;
        else this.head = entry;
        this.tail = entry;
        ++this.length;
      };
      BufferList2.prototype.unshift = function unshift(v) {
        var entry = { data: v, next: this.head };
        if (this.length === 0) this.tail = entry;
        this.head = entry;
        ++this.length;
      };
      BufferList2.prototype.shift = function shift() {
        if (this.length === 0) return;
        var ret = this.head.data;
        if (this.length === 1) this.head = this.tail = null;
        else this.head = this.head.next;
        --this.length;
        return ret;
      };
      BufferList2.prototype.clear = function clear() {
        this.head = this.tail = null;
        this.length = 0;
      };
      BufferList2.prototype.join = function join(s) {
        if (this.length === 0) return "";
        var p = this.head;
        var ret = "" + p.data;
        while (p = p.next) {
          ret += s + p.data;
        }
        return ret;
      };
      BufferList2.prototype.concat = function concat2(n) {
        if (this.length === 0) return Buffer2.alloc(0);
        var ret = Buffer2.allocUnsafe(n >>> 0);
        var p = this.head;
        var i = 0;
        while (p) {
          copyBuffer(p.data, ret, i);
          i += p.data.length;
          p = p.next;
        }
        return ret;
      };
      return BufferList2;
    }();
    if (util2 && util2.inspect && util2.inspect.custom) {
      module.exports.prototype[util2.inspect.custom] = function() {
        var obj = util2.inspect({ length: this.length });
        return this.constructor.name + " " + obj;
      };
    }
  })(BufferList$2);
  return BufferList$2.exports;
}
var destroy_1$1;
var hasRequiredDestroy$1;
function requireDestroy$1() {
  if (hasRequiredDestroy$1) return destroy_1$1;
  hasRequiredDestroy$1 = 1;
  var pna = requireProcessNextickArgs();
  function destroy(err, cb) {
    var _this = this;
    var readableDestroyed = this._readableState && this._readableState.destroyed;
    var writableDestroyed = this._writableState && this._writableState.destroyed;
    if (readableDestroyed || writableDestroyed) {
      if (cb) {
        cb(err);
      } else if (err) {
        if (!this._writableState) {
          pna.nextTick(emitErrorNT, this, err);
        } else if (!this._writableState.errorEmitted) {
          this._writableState.errorEmitted = true;
          pna.nextTick(emitErrorNT, this, err);
        }
      }
      return this;
    }
    if (this._readableState) {
      this._readableState.destroyed = true;
    }
    if (this._writableState) {
      this._writableState.destroyed = true;
    }
    this._destroy(err || null, function(err2) {
      if (!cb && err2) {
        if (!_this._writableState) {
          pna.nextTick(emitErrorNT, _this, err2);
        } else if (!_this._writableState.errorEmitted) {
          _this._writableState.errorEmitted = true;
          pna.nextTick(emitErrorNT, _this, err2);
        }
      } else if (cb) {
        cb(err2);
      }
    });
    return this;
  }
  function undestroy() {
    if (this._readableState) {
      this._readableState.destroyed = false;
      this._readableState.reading = false;
      this._readableState.ended = false;
      this._readableState.endEmitted = false;
    }
    if (this._writableState) {
      this._writableState.destroyed = false;
      this._writableState.ended = false;
      this._writableState.ending = false;
      this._writableState.finalCalled = false;
      this._writableState.prefinished = false;
      this._writableState.finished = false;
      this._writableState.errorEmitted = false;
    }
  }
  function emitErrorNT(self2, err) {
    self2.emit("error", err);
  }
  destroy_1$1 = {
    destroy,
    undestroy
  };
  return destroy_1$1;
}
var _stream_writable$1;
var hasRequired_stream_writable$1;
function require_stream_writable$1() {
  if (hasRequired_stream_writable$1) return _stream_writable$1;
  hasRequired_stream_writable$1 = 1;
  var pna = requireProcessNextickArgs();
  _stream_writable$1 = Writable2;
  function CorkedRequest(state2) {
    var _this = this;
    this.next = null;
    this.entry = null;
    this.finish = function() {
      onCorkedFinish(_this, state2);
    };
  }
  var asyncWrite = !process.browser && ["v0.10", "v0.9."].indexOf(process.version.slice(0, 5)) > -1 ? setImmediate : pna.nextTick;
  var Duplex;
  Writable2.WritableState = WritableState;
  var util2 = Object.create(requireUtil());
  util2.inherits = inheritsExports;
  var internalUtil = {
    deprecate: requireNode()
  };
  var Stream2 = requireStream$1();
  var Buffer2 = requireSafeBuffer$1().Buffer;
  var OurUint8Array = (typeof commonjsGlobal !== "undefined" ? commonjsGlobal : typeof window !== "undefined" ? window : typeof self !== "undefined" ? self : {}).Uint8Array || function() {
  };
  function _uint8ArrayToBuffer(chunk) {
    return Buffer2.from(chunk);
  }
  function _isUint8Array(obj) {
    return Buffer2.isBuffer(obj) || obj instanceof OurUint8Array;
  }
  var destroyImpl = requireDestroy$1();
  util2.inherits(Writable2, Stream2);
  function nop() {
  }
  function WritableState(options, stream2) {
    Duplex = Duplex || require_stream_duplex$1();
    options = options || {};
    var isDuplex = stream2 instanceof Duplex;
    this.objectMode = !!options.objectMode;
    if (isDuplex) this.objectMode = this.objectMode || !!options.writableObjectMode;
    var hwm = options.highWaterMark;
    var writableHwm = options.writableHighWaterMark;
    var defaultHwm = this.objectMode ? 16 : 16 * 1024;
    if (hwm || hwm === 0) this.highWaterMark = hwm;
    else if (isDuplex && (writableHwm || writableHwm === 0)) this.highWaterMark = writableHwm;
    else this.highWaterMark = defaultHwm;
    this.highWaterMark = Math.floor(this.highWaterMark);
    this.finalCalled = false;
    this.needDrain = false;
    this.ending = false;
    this.ended = false;
    this.finished = false;
    this.destroyed = false;
    var noDecode = options.decodeStrings === false;
    this.decodeStrings = !noDecode;
    this.defaultEncoding = options.defaultEncoding || "utf8";
    this.length = 0;
    this.writing = false;
    this.corked = 0;
    this.sync = true;
    this.bufferProcessing = false;
    this.onwrite = function(er) {
      onwrite(stream2, er);
    };
    this.writecb = null;
    this.writelen = 0;
    this.bufferedRequest = null;
    this.lastBufferedRequest = null;
    this.pendingcb = 0;
    this.prefinished = false;
    this.errorEmitted = false;
    this.bufferedRequestCount = 0;
    this.corkedRequestsFree = new CorkedRequest(this);
  }
  WritableState.prototype.getBuffer = function getBuffer() {
    var current = this.bufferedRequest;
    var out = [];
    while (current) {
      out.push(current);
      current = current.next;
    }
    return out;
  };
  (function() {
    try {
      Object.defineProperty(WritableState.prototype, "buffer", {
        get: internalUtil.deprecate(function() {
          return this.getBuffer();
        }, "_writableState.buffer is deprecated. Use _writableState.getBuffer instead.", "DEP0003")
      });
    } catch (_2) {
    }
  })();
  var realHasInstance;
  if (typeof Symbol === "function" && Symbol.hasInstance && typeof Function.prototype[Symbol.hasInstance] === "function") {
    realHasInstance = Function.prototype[Symbol.hasInstance];
    Object.defineProperty(Writable2, Symbol.hasInstance, {
      value: function(object) {
        if (realHasInstance.call(this, object)) return true;
        if (this !== Writable2) return false;
        return object && object._writableState instanceof WritableState;
      }
    });
  } else {
    realHasInstance = function(object) {
      return object instanceof this;
    };
  }
  function Writable2(options) {
    Duplex = Duplex || require_stream_duplex$1();
    if (!realHasInstance.call(Writable2, this) && !(this instanceof Duplex)) {
      return new Writable2(options);
    }
    this._writableState = new WritableState(options, this);
    this.writable = true;
    if (options) {
      if (typeof options.write === "function") this._write = options.write;
      if (typeof options.writev === "function") this._writev = options.writev;
      if (typeof options.destroy === "function") this._destroy = options.destroy;
      if (typeof options.final === "function") this._final = options.final;
    }
    Stream2.call(this);
  }
  Writable2.prototype.pipe = function() {
    this.emit("error", new Error("Cannot pipe, not readable"));
  };
  function writeAfterEnd(stream2, cb) {
    var er = new Error("write after end");
    stream2.emit("error", er);
    pna.nextTick(cb, er);
  }
  function validChunk(stream2, state2, chunk, cb) {
    var valid = true;
    var er = false;
    if (chunk === null) {
      er = new TypeError("May not write null values to stream");
    } else if (typeof chunk !== "string" && chunk !== void 0 && !state2.objectMode) {
      er = new TypeError("Invalid non-string/buffer chunk");
    }
    if (er) {
      stream2.emit("error", er);
      pna.nextTick(cb, er);
      valid = false;
    }
    return valid;
  }
  Writable2.prototype.write = function(chunk, encoding, cb) {
    var state2 = this._writableState;
    var ret = false;
    var isBuf = !state2.objectMode && _isUint8Array(chunk);
    if (isBuf && !Buffer2.isBuffer(chunk)) {
      chunk = _uint8ArrayToBuffer(chunk);
    }
    if (typeof encoding === "function") {
      cb = encoding;
      encoding = null;
    }
    if (isBuf) encoding = "buffer";
    else if (!encoding) encoding = state2.defaultEncoding;
    if (typeof cb !== "function") cb = nop;
    if (state2.ended) writeAfterEnd(this, cb);
    else if (isBuf || validChunk(this, state2, chunk, cb)) {
      state2.pendingcb++;
      ret = writeOrBuffer(this, state2, isBuf, chunk, encoding, cb);
    }
    return ret;
  };
  Writable2.prototype.cork = function() {
    var state2 = this._writableState;
    state2.corked++;
  };
  Writable2.prototype.uncork = function() {
    var state2 = this._writableState;
    if (state2.corked) {
      state2.corked--;
      if (!state2.writing && !state2.corked && !state2.bufferProcessing && state2.bufferedRequest) clearBuffer(this, state2);
    }
  };
  Writable2.prototype.setDefaultEncoding = function setDefaultEncoding(encoding) {
    if (typeof encoding === "string") encoding = encoding.toLowerCase();
    if (!(["hex", "utf8", "utf-8", "ascii", "binary", "base64", "ucs2", "ucs-2", "utf16le", "utf-16le", "raw"].indexOf((encoding + "").toLowerCase()) > -1)) throw new TypeError("Unknown encoding: " + encoding);
    this._writableState.defaultEncoding = encoding;
    return this;
  };
  function decodeChunk(state2, chunk, encoding) {
    if (!state2.objectMode && state2.decodeStrings !== false && typeof chunk === "string") {
      chunk = Buffer2.from(chunk, encoding);
    }
    return chunk;
  }
  Object.defineProperty(Writable2.prototype, "writableHighWaterMark", {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: false,
    get: function() {
      return this._writableState.highWaterMark;
    }
  });
  function writeOrBuffer(stream2, state2, isBuf, chunk, encoding, cb) {
    if (!isBuf) {
      var newChunk = decodeChunk(state2, chunk, encoding);
      if (chunk !== newChunk) {
        isBuf = true;
        encoding = "buffer";
        chunk = newChunk;
      }
    }
    var len = state2.objectMode ? 1 : chunk.length;
    state2.length += len;
    var ret = state2.length < state2.highWaterMark;
    if (!ret) state2.needDrain = true;
    if (state2.writing || state2.corked) {
      var last = state2.lastBufferedRequest;
      state2.lastBufferedRequest = {
        chunk,
        encoding,
        isBuf,
        callback: cb,
        next: null
      };
      if (last) {
        last.next = state2.lastBufferedRequest;
      } else {
        state2.bufferedRequest = state2.lastBufferedRequest;
      }
      state2.bufferedRequestCount += 1;
    } else {
      doWrite(stream2, state2, false, len, chunk, encoding, cb);
    }
    return ret;
  }
  function doWrite(stream2, state2, writev, len, chunk, encoding, cb) {
    state2.writelen = len;
    state2.writecb = cb;
    state2.writing = true;
    state2.sync = true;
    if (writev) stream2._writev(chunk, state2.onwrite);
    else stream2._write(chunk, encoding, state2.onwrite);
    state2.sync = false;
  }
  function onwriteError(stream2, state2, sync2, er, cb) {
    --state2.pendingcb;
    if (sync2) {
      pna.nextTick(cb, er);
      pna.nextTick(finishMaybe, stream2, state2);
      stream2._writableState.errorEmitted = true;
      stream2.emit("error", er);
    } else {
      cb(er);
      stream2._writableState.errorEmitted = true;
      stream2.emit("error", er);
      finishMaybe(stream2, state2);
    }
  }
  function onwriteStateUpdate(state2) {
    state2.writing = false;
    state2.writecb = null;
    state2.length -= state2.writelen;
    state2.writelen = 0;
  }
  function onwrite(stream2, er) {
    var state2 = stream2._writableState;
    var sync2 = state2.sync;
    var cb = state2.writecb;
    onwriteStateUpdate(state2);
    if (er) onwriteError(stream2, state2, sync2, er, cb);
    else {
      var finished = needFinish(state2);
      if (!finished && !state2.corked && !state2.bufferProcessing && state2.bufferedRequest) {
        clearBuffer(stream2, state2);
      }
      if (sync2) {
        asyncWrite(afterWrite, stream2, state2, finished, cb);
      } else {
        afterWrite(stream2, state2, finished, cb);
      }
    }
  }
  function afterWrite(stream2, state2, finished, cb) {
    if (!finished) onwriteDrain(stream2, state2);
    state2.pendingcb--;
    cb();
    finishMaybe(stream2, state2);
  }
  function onwriteDrain(stream2, state2) {
    if (state2.length === 0 && state2.needDrain) {
      state2.needDrain = false;
      stream2.emit("drain");
    }
  }
  function clearBuffer(stream2, state2) {
    state2.bufferProcessing = true;
    var entry = state2.bufferedRequest;
    if (stream2._writev && entry && entry.next) {
      var l = state2.bufferedRequestCount;
      var buffer = new Array(l);
      var holder = state2.corkedRequestsFree;
      holder.entry = entry;
      var count = 0;
      var allBuffers = true;
      while (entry) {
        buffer[count] = entry;
        if (!entry.isBuf) allBuffers = false;
        entry = entry.next;
        count += 1;
      }
      buffer.allBuffers = allBuffers;
      doWrite(stream2, state2, true, state2.length, buffer, "", holder.finish);
      state2.pendingcb++;
      state2.lastBufferedRequest = null;
      if (holder.next) {
        state2.corkedRequestsFree = holder.next;
        holder.next = null;
      } else {
        state2.corkedRequestsFree = new CorkedRequest(state2);
      }
      state2.bufferedRequestCount = 0;
    } else {
      while (entry) {
        var chunk = entry.chunk;
        var encoding = entry.encoding;
        var cb = entry.callback;
        var len = state2.objectMode ? 1 : chunk.length;
        doWrite(stream2, state2, false, len, chunk, encoding, cb);
        entry = entry.next;
        state2.bufferedRequestCount--;
        if (state2.writing) {
          break;
        }
      }
      if (entry === null) state2.lastBufferedRequest = null;
    }
    state2.bufferedRequest = entry;
    state2.bufferProcessing = false;
  }
  Writable2.prototype._write = function(chunk, encoding, cb) {
    cb(new Error("_write() is not implemented"));
  };
  Writable2.prototype._writev = null;
  Writable2.prototype.end = function(chunk, encoding, cb) {
    var state2 = this._writableState;
    if (typeof chunk === "function") {
      cb = chunk;
      chunk = null;
      encoding = null;
    } else if (typeof encoding === "function") {
      cb = encoding;
      encoding = null;
    }
    if (chunk !== null && chunk !== void 0) this.write(chunk, encoding);
    if (state2.corked) {
      state2.corked = 1;
      this.uncork();
    }
    if (!state2.ending) endWritable(this, state2, cb);
  };
  function needFinish(state2) {
    return state2.ending && state2.length === 0 && state2.bufferedRequest === null && !state2.finished && !state2.writing;
  }
  function callFinal(stream2, state2) {
    stream2._final(function(err) {
      state2.pendingcb--;
      if (err) {
        stream2.emit("error", err);
      }
      state2.prefinished = true;
      stream2.emit("prefinish");
      finishMaybe(stream2, state2);
    });
  }
  function prefinish(stream2, state2) {
    if (!state2.prefinished && !state2.finalCalled) {
      if (typeof stream2._final === "function") {
        state2.pendingcb++;
        state2.finalCalled = true;
        pna.nextTick(callFinal, stream2, state2);
      } else {
        state2.prefinished = true;
        stream2.emit("prefinish");
      }
    }
  }
  function finishMaybe(stream2, state2) {
    var need = needFinish(state2);
    if (need) {
      prefinish(stream2, state2);
      if (state2.pendingcb === 0) {
        state2.finished = true;
        stream2.emit("finish");
      }
    }
    return need;
  }
  function endWritable(stream2, state2, cb) {
    state2.ending = true;
    finishMaybe(stream2, state2);
    if (cb) {
      if (state2.finished) pna.nextTick(cb);
      else stream2.once("finish", cb);
    }
    state2.ended = true;
    stream2.writable = false;
  }
  function onCorkedFinish(corkReq, state2, err) {
    var entry = corkReq.entry;
    corkReq.entry = null;
    while (entry) {
      var cb = entry.callback;
      state2.pendingcb--;
      cb(err);
      entry = entry.next;
    }
    state2.corkedRequestsFree.next = corkReq;
  }
  Object.defineProperty(Writable2.prototype, "destroyed", {
    get: function() {
      if (this._writableState === void 0) {
        return false;
      }
      return this._writableState.destroyed;
    },
    set: function(value) {
      if (!this._writableState) {
        return;
      }
      this._writableState.destroyed = value;
    }
  });
  Writable2.prototype.destroy = destroyImpl.destroy;
  Writable2.prototype._undestroy = destroyImpl.undestroy;
  Writable2.prototype._destroy = function(err, cb) {
    this.end();
    cb(err);
  };
  return _stream_writable$1;
}
var _stream_duplex$1;
var hasRequired_stream_duplex$1;
function require_stream_duplex$1() {
  if (hasRequired_stream_duplex$1) return _stream_duplex$1;
  hasRequired_stream_duplex$1 = 1;
  var pna = requireProcessNextickArgs();
  var objectKeys = Object.keys || function(obj) {
    var keys2 = [];
    for (var key in obj) {
      keys2.push(key);
    }
    return keys2;
  };
  _stream_duplex$1 = Duplex;
  var util2 = Object.create(requireUtil());
  util2.inherits = inheritsExports;
  var Readable2 = require_stream_readable$1();
  var Writable2 = require_stream_writable$1();
  util2.inherits(Duplex, Readable2);
  {
    var keys = objectKeys(Writable2.prototype);
    for (var v = 0; v < keys.length; v++) {
      var method = keys[v];
      if (!Duplex.prototype[method]) Duplex.prototype[method] = Writable2.prototype[method];
    }
  }
  function Duplex(options) {
    if (!(this instanceof Duplex)) return new Duplex(options);
    Readable2.call(this, options);
    Writable2.call(this, options);
    if (options && options.readable === false) this.readable = false;
    if (options && options.writable === false) this.writable = false;
    this.allowHalfOpen = true;
    if (options && options.allowHalfOpen === false) this.allowHalfOpen = false;
    this.once("end", onend);
  }
  Object.defineProperty(Duplex.prototype, "writableHighWaterMark", {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: false,
    get: function() {
      return this._writableState.highWaterMark;
    }
  });
  function onend() {
    if (this.allowHalfOpen || this._writableState.ended) return;
    pna.nextTick(onEndNT, this);
  }
  function onEndNT(self2) {
    self2.end();
  }
  Object.defineProperty(Duplex.prototype, "destroyed", {
    get: function() {
      if (this._readableState === void 0 || this._writableState === void 0) {
        return false;
      }
      return this._readableState.destroyed && this._writableState.destroyed;
    },
    set: function(value) {
      if (this._readableState === void 0 || this._writableState === void 0) {
        return;
      }
      this._readableState.destroyed = value;
      this._writableState.destroyed = value;
    }
  });
  Duplex.prototype._destroy = function(err, cb) {
    this.push(null);
    this.end();
    pna.nextTick(cb, err);
  };
  return _stream_duplex$1;
}
var string_decoder$1 = {};
var hasRequiredString_decoder$1;
function requireString_decoder$1() {
  if (hasRequiredString_decoder$1) return string_decoder$1;
  hasRequiredString_decoder$1 = 1;
  var Buffer2 = requireSafeBuffer$1().Buffer;
  var isEncoding = Buffer2.isEncoding || function(encoding) {
    encoding = "" + encoding;
    switch (encoding && encoding.toLowerCase()) {
      case "hex":
      case "utf8":
      case "utf-8":
      case "ascii":
      case "binary":
      case "base64":
      case "ucs2":
      case "ucs-2":
      case "utf16le":
      case "utf-16le":
      case "raw":
        return true;
      default:
        return false;
    }
  };
  function _normalizeEncoding(enc) {
    if (!enc) return "utf8";
    var retried;
    while (true) {
      switch (enc) {
        case "utf8":
        case "utf-8":
          return "utf8";
        case "ucs2":
        case "ucs-2":
        case "utf16le":
        case "utf-16le":
          return "utf16le";
        case "latin1":
        case "binary":
          return "latin1";
        case "base64":
        case "ascii":
        case "hex":
          return enc;
        default:
          if (retried) return;
          enc = ("" + enc).toLowerCase();
          retried = true;
      }
    }
  }
  function normalizeEncoding(enc) {
    var nenc = _normalizeEncoding(enc);
    if (typeof nenc !== "string" && (Buffer2.isEncoding === isEncoding || !isEncoding(enc))) throw new Error("Unknown encoding: " + enc);
    return nenc || enc;
  }
  string_decoder$1.StringDecoder = StringDecoder2;
  function StringDecoder2(encoding) {
    this.encoding = normalizeEncoding(encoding);
    var nb;
    switch (this.encoding) {
      case "utf16le":
        this.text = utf16Text;
        this.end = utf16End;
        nb = 4;
        break;
      case "utf8":
        this.fillLast = utf8FillLast;
        nb = 4;
        break;
      case "base64":
        this.text = base64Text;
        this.end = base64End;
        nb = 3;
        break;
      default:
        this.write = simpleWrite;
        this.end = simpleEnd;
        return;
    }
    this.lastNeed = 0;
    this.lastTotal = 0;
    this.lastChar = Buffer2.allocUnsafe(nb);
  }
  StringDecoder2.prototype.write = function(buf) {
    if (buf.length === 0) return "";
    var r;
    var i;
    if (this.lastNeed) {
      r = this.fillLast(buf);
      if (r === void 0) return "";
      i = this.lastNeed;
      this.lastNeed = 0;
    } else {
      i = 0;
    }
    if (i < buf.length) return r ? r + this.text(buf, i) : this.text(buf, i);
    return r || "";
  };
  StringDecoder2.prototype.end = utf8End;
  StringDecoder2.prototype.text = utf8Text;
  StringDecoder2.prototype.fillLast = function(buf) {
    if (this.lastNeed <= buf.length) {
      buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, this.lastNeed);
      return this.lastChar.toString(this.encoding, 0, this.lastTotal);
    }
    buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, buf.length);
    this.lastNeed -= buf.length;
  };
  function utf8CheckByte(byte) {
    if (byte <= 127) return 0;
    else if (byte >> 5 === 6) return 2;
    else if (byte >> 4 === 14) return 3;
    else if (byte >> 3 === 30) return 4;
    return byte >> 6 === 2 ? -1 : -2;
  }
  function utf8CheckIncomplete(self2, buf, i) {
    var j = buf.length - 1;
    if (j < i) return 0;
    var nb = utf8CheckByte(buf[j]);
    if (nb >= 0) {
      if (nb > 0) self2.lastNeed = nb - 1;
      return nb;
    }
    if (--j < i || nb === -2) return 0;
    nb = utf8CheckByte(buf[j]);
    if (nb >= 0) {
      if (nb > 0) self2.lastNeed = nb - 2;
      return nb;
    }
    if (--j < i || nb === -2) return 0;
    nb = utf8CheckByte(buf[j]);
    if (nb >= 0) {
      if (nb > 0) {
        if (nb === 2) nb = 0;
        else self2.lastNeed = nb - 3;
      }
      return nb;
    }
    return 0;
  }
  function utf8CheckExtraBytes(self2, buf, p) {
    if ((buf[0] & 192) !== 128) {
      self2.lastNeed = 0;
      return "�";
    }
    if (self2.lastNeed > 1 && buf.length > 1) {
      if ((buf[1] & 192) !== 128) {
        self2.lastNeed = 1;
        return "�";
      }
      if (self2.lastNeed > 2 && buf.length > 2) {
        if ((buf[2] & 192) !== 128) {
          self2.lastNeed = 2;
          return "�";
        }
      }
    }
  }
  function utf8FillLast(buf) {
    var p = this.lastTotal - this.lastNeed;
    var r = utf8CheckExtraBytes(this, buf);
    if (r !== void 0) return r;
    if (this.lastNeed <= buf.length) {
      buf.copy(this.lastChar, p, 0, this.lastNeed);
      return this.lastChar.toString(this.encoding, 0, this.lastTotal);
    }
    buf.copy(this.lastChar, p, 0, buf.length);
    this.lastNeed -= buf.length;
  }
  function utf8Text(buf, i) {
    var total = utf8CheckIncomplete(this, buf, i);
    if (!this.lastNeed) return buf.toString("utf8", i);
    this.lastTotal = total;
    var end2 = buf.length - (total - this.lastNeed);
    buf.copy(this.lastChar, 0, end2);
    return buf.toString("utf8", i, end2);
  }
  function utf8End(buf) {
    var r = buf && buf.length ? this.write(buf) : "";
    if (this.lastNeed) return r + "�";
    return r;
  }
  function utf16Text(buf, i) {
    if ((buf.length - i) % 2 === 0) {
      var r = buf.toString("utf16le", i);
      if (r) {
        var c = r.charCodeAt(r.length - 1);
        if (c >= 55296 && c <= 56319) {
          this.lastNeed = 2;
          this.lastTotal = 4;
          this.lastChar[0] = buf[buf.length - 2];
          this.lastChar[1] = buf[buf.length - 1];
          return r.slice(0, -1);
        }
      }
      return r;
    }
    this.lastNeed = 1;
    this.lastTotal = 2;
    this.lastChar[0] = buf[buf.length - 1];
    return buf.toString("utf16le", i, buf.length - 1);
  }
  function utf16End(buf) {
    var r = buf && buf.length ? this.write(buf) : "";
    if (this.lastNeed) {
      var end2 = this.lastTotal - this.lastNeed;
      return r + this.lastChar.toString("utf16le", 0, end2);
    }
    return r;
  }
  function base64Text(buf, i) {
    var n = (buf.length - i) % 3;
    if (n === 0) return buf.toString("base64", i);
    this.lastNeed = 3 - n;
    this.lastTotal = 3;
    if (n === 1) {
      this.lastChar[0] = buf[buf.length - 1];
    } else {
      this.lastChar[0] = buf[buf.length - 2];
      this.lastChar[1] = buf[buf.length - 1];
    }
    return buf.toString("base64", i, buf.length - n);
  }
  function base64End(buf) {
    var r = buf && buf.length ? this.write(buf) : "";
    if (this.lastNeed) return r + this.lastChar.toString("base64", 0, 3 - this.lastNeed);
    return r;
  }
  function simpleWrite(buf) {
    return buf.toString(this.encoding);
  }
  function simpleEnd(buf) {
    return buf && buf.length ? this.write(buf) : "";
  }
  return string_decoder$1;
}
var _stream_readable$1;
var hasRequired_stream_readable$1;
function require_stream_readable$1() {
  if (hasRequired_stream_readable$1) return _stream_readable$1;
  hasRequired_stream_readable$1 = 1;
  var pna = requireProcessNextickArgs();
  _stream_readable$1 = Readable2;
  var isArray2 = requireIsarray();
  var Duplex;
  Readable2.ReadableState = ReadableState;
  require$$2$1.EventEmitter;
  var EElistenerCount = function(emitter, type) {
    return emitter.listeners(type).length;
  };
  var Stream2 = requireStream$1();
  var Buffer2 = requireSafeBuffer$1().Buffer;
  var OurUint8Array = (typeof commonjsGlobal !== "undefined" ? commonjsGlobal : typeof window !== "undefined" ? window : typeof self !== "undefined" ? self : {}).Uint8Array || function() {
  };
  function _uint8ArrayToBuffer(chunk) {
    return Buffer2.from(chunk);
  }
  function _isUint8Array(obj) {
    return Buffer2.isBuffer(obj) || obj instanceof OurUint8Array;
  }
  var util2 = Object.create(requireUtil());
  util2.inherits = inheritsExports;
  var debugUtil = require$$0$3;
  var debug2 = void 0;
  if (debugUtil && debugUtil.debuglog) {
    debug2 = debugUtil.debuglog("stream");
  } else {
    debug2 = function() {
    };
  }
  var BufferList2 = requireBufferList();
  var destroyImpl = requireDestroy$1();
  var StringDecoder2;
  util2.inherits(Readable2, Stream2);
  var kProxyEvents = ["error", "close", "destroy", "pause", "resume"];
  function prependListener(emitter, event, fn) {
    if (typeof emitter.prependListener === "function") return emitter.prependListener(event, fn);
    if (!emitter._events || !emitter._events[event]) emitter.on(event, fn);
    else if (isArray2(emitter._events[event])) emitter._events[event].unshift(fn);
    else emitter._events[event] = [fn, emitter._events[event]];
  }
  function ReadableState(options, stream2) {
    Duplex = Duplex || require_stream_duplex$1();
    options = options || {};
    var isDuplex = stream2 instanceof Duplex;
    this.objectMode = !!options.objectMode;
    if (isDuplex) this.objectMode = this.objectMode || !!options.readableObjectMode;
    var hwm = options.highWaterMark;
    var readableHwm = options.readableHighWaterMark;
    var defaultHwm = this.objectMode ? 16 : 16 * 1024;
    if (hwm || hwm === 0) this.highWaterMark = hwm;
    else if (isDuplex && (readableHwm || readableHwm === 0)) this.highWaterMark = readableHwm;
    else this.highWaterMark = defaultHwm;
    this.highWaterMark = Math.floor(this.highWaterMark);
    this.buffer = new BufferList2();
    this.length = 0;
    this.pipes = null;
    this.pipesCount = 0;
    this.flowing = null;
    this.ended = false;
    this.endEmitted = false;
    this.reading = false;
    this.sync = true;
    this.needReadable = false;
    this.emittedReadable = false;
    this.readableListening = false;
    this.resumeScheduled = false;
    this.destroyed = false;
    this.defaultEncoding = options.defaultEncoding || "utf8";
    this.awaitDrain = 0;
    this.readingMore = false;
    this.decoder = null;
    this.encoding = null;
    if (options.encoding) {
      if (!StringDecoder2) StringDecoder2 = requireString_decoder$1().StringDecoder;
      this.decoder = new StringDecoder2(options.encoding);
      this.encoding = options.encoding;
    }
  }
  function Readable2(options) {
    Duplex = Duplex || require_stream_duplex$1();
    if (!(this instanceof Readable2)) return new Readable2(options);
    this._readableState = new ReadableState(options, this);
    this.readable = true;
    if (options) {
      if (typeof options.read === "function") this._read = options.read;
      if (typeof options.destroy === "function") this._destroy = options.destroy;
    }
    Stream2.call(this);
  }
  Object.defineProperty(Readable2.prototype, "destroyed", {
    get: function() {
      if (this._readableState === void 0) {
        return false;
      }
      return this._readableState.destroyed;
    },
    set: function(value) {
      if (!this._readableState) {
        return;
      }
      this._readableState.destroyed = value;
    }
  });
  Readable2.prototype.destroy = destroyImpl.destroy;
  Readable2.prototype._undestroy = destroyImpl.undestroy;
  Readable2.prototype._destroy = function(err, cb) {
    this.push(null);
    cb(err);
  };
  Readable2.prototype.push = function(chunk, encoding) {
    var state2 = this._readableState;
    var skipChunkCheck;
    if (!state2.objectMode) {
      if (typeof chunk === "string") {
        encoding = encoding || state2.defaultEncoding;
        if (encoding !== state2.encoding) {
          chunk = Buffer2.from(chunk, encoding);
          encoding = "";
        }
        skipChunkCheck = true;
      }
    } else {
      skipChunkCheck = true;
    }
    return readableAddChunk(this, chunk, encoding, false, skipChunkCheck);
  };
  Readable2.prototype.unshift = function(chunk) {
    return readableAddChunk(this, chunk, null, true, false);
  };
  function readableAddChunk(stream2, chunk, encoding, addToFront, skipChunkCheck) {
    var state2 = stream2._readableState;
    if (chunk === null) {
      state2.reading = false;
      onEofChunk(stream2, state2);
    } else {
      var er;
      if (!skipChunkCheck) er = chunkInvalid(state2, chunk);
      if (er) {
        stream2.emit("error", er);
      } else if (state2.objectMode || chunk && chunk.length > 0) {
        if (typeof chunk !== "string" && !state2.objectMode && Object.getPrototypeOf(chunk) !== Buffer2.prototype) {
          chunk = _uint8ArrayToBuffer(chunk);
        }
        if (addToFront) {
          if (state2.endEmitted) stream2.emit("error", new Error("stream.unshift() after end event"));
          else addChunk(stream2, state2, chunk, true);
        } else if (state2.ended) {
          stream2.emit("error", new Error("stream.push() after EOF"));
        } else {
          state2.reading = false;
          if (state2.decoder && !encoding) {
            chunk = state2.decoder.write(chunk);
            if (state2.objectMode || chunk.length !== 0) addChunk(stream2, state2, chunk, false);
            else maybeReadMore(stream2, state2);
          } else {
            addChunk(stream2, state2, chunk, false);
          }
        }
      } else if (!addToFront) {
        state2.reading = false;
      }
    }
    return needMoreData(state2);
  }
  function addChunk(stream2, state2, chunk, addToFront) {
    if (state2.flowing && state2.length === 0 && !state2.sync) {
      stream2.emit("data", chunk);
      stream2.read(0);
    } else {
      state2.length += state2.objectMode ? 1 : chunk.length;
      if (addToFront) state2.buffer.unshift(chunk);
      else state2.buffer.push(chunk);
      if (state2.needReadable) emitReadable(stream2);
    }
    maybeReadMore(stream2, state2);
  }
  function chunkInvalid(state2, chunk) {
    var er;
    if (!_isUint8Array(chunk) && typeof chunk !== "string" && chunk !== void 0 && !state2.objectMode) {
      er = new TypeError("Invalid non-string/buffer chunk");
    }
    return er;
  }
  function needMoreData(state2) {
    return !state2.ended && (state2.needReadable || state2.length < state2.highWaterMark || state2.length === 0);
  }
  Readable2.prototype.isPaused = function() {
    return this._readableState.flowing === false;
  };
  Readable2.prototype.setEncoding = function(enc) {
    if (!StringDecoder2) StringDecoder2 = requireString_decoder$1().StringDecoder;
    this._readableState.decoder = new StringDecoder2(enc);
    this._readableState.encoding = enc;
    return this;
  };
  var MAX_HWM = 8388608;
  function computeNewHighWaterMark(n) {
    if (n >= MAX_HWM) {
      n = MAX_HWM;
    } else {
      n--;
      n |= n >>> 1;
      n |= n >>> 2;
      n |= n >>> 4;
      n |= n >>> 8;
      n |= n >>> 16;
      n++;
    }
    return n;
  }
  function howMuchToRead(n, state2) {
    if (n <= 0 || state2.length === 0 && state2.ended) return 0;
    if (state2.objectMode) return 1;
    if (n !== n) {
      if (state2.flowing && state2.length) return state2.buffer.head.data.length;
      else return state2.length;
    }
    if (n > state2.highWaterMark) state2.highWaterMark = computeNewHighWaterMark(n);
    if (n <= state2.length) return n;
    if (!state2.ended) {
      state2.needReadable = true;
      return 0;
    }
    return state2.length;
  }
  Readable2.prototype.read = function(n) {
    debug2("read", n);
    n = parseInt(n, 10);
    var state2 = this._readableState;
    var nOrig = n;
    if (n !== 0) state2.emittedReadable = false;
    if (n === 0 && state2.needReadable && (state2.length >= state2.highWaterMark || state2.ended)) {
      debug2("read: emitReadable", state2.length, state2.ended);
      if (state2.length === 0 && state2.ended) endReadable(this);
      else emitReadable(this);
      return null;
    }
    n = howMuchToRead(n, state2);
    if (n === 0 && state2.ended) {
      if (state2.length === 0) endReadable(this);
      return null;
    }
    var doRead = state2.needReadable;
    debug2("need readable", doRead);
    if (state2.length === 0 || state2.length - n < state2.highWaterMark) {
      doRead = true;
      debug2("length less than watermark", doRead);
    }
    if (state2.ended || state2.reading) {
      doRead = false;
      debug2("reading or ended", doRead);
    } else if (doRead) {
      debug2("do read");
      state2.reading = true;
      state2.sync = true;
      if (state2.length === 0) state2.needReadable = true;
      this._read(state2.highWaterMark);
      state2.sync = false;
      if (!state2.reading) n = howMuchToRead(nOrig, state2);
    }
    var ret;
    if (n > 0) ret = fromList(n, state2);
    else ret = null;
    if (ret === null) {
      state2.needReadable = true;
      n = 0;
    } else {
      state2.length -= n;
    }
    if (state2.length === 0) {
      if (!state2.ended) state2.needReadable = true;
      if (nOrig !== n && state2.ended) endReadable(this);
    }
    if (ret !== null) this.emit("data", ret);
    return ret;
  };
  function onEofChunk(stream2, state2) {
    if (state2.ended) return;
    if (state2.decoder) {
      var chunk = state2.decoder.end();
      if (chunk && chunk.length) {
        state2.buffer.push(chunk);
        state2.length += state2.objectMode ? 1 : chunk.length;
      }
    }
    state2.ended = true;
    emitReadable(stream2);
  }
  function emitReadable(stream2) {
    var state2 = stream2._readableState;
    state2.needReadable = false;
    if (!state2.emittedReadable) {
      debug2("emitReadable", state2.flowing);
      state2.emittedReadable = true;
      if (state2.sync) pna.nextTick(emitReadable_, stream2);
      else emitReadable_(stream2);
    }
  }
  function emitReadable_(stream2) {
    debug2("emit readable");
    stream2.emit("readable");
    flow(stream2);
  }
  function maybeReadMore(stream2, state2) {
    if (!state2.readingMore) {
      state2.readingMore = true;
      pna.nextTick(maybeReadMore_, stream2, state2);
    }
  }
  function maybeReadMore_(stream2, state2) {
    var len = state2.length;
    while (!state2.reading && !state2.flowing && !state2.ended && state2.length < state2.highWaterMark) {
      debug2("maybeReadMore read 0");
      stream2.read(0);
      if (len === state2.length)
        break;
      else len = state2.length;
    }
    state2.readingMore = false;
  }
  Readable2.prototype._read = function(n) {
    this.emit("error", new Error("_read() is not implemented"));
  };
  Readable2.prototype.pipe = function(dest, pipeOpts) {
    var src = this;
    var state2 = this._readableState;
    switch (state2.pipesCount) {
      case 0:
        state2.pipes = dest;
        break;
      case 1:
        state2.pipes = [state2.pipes, dest];
        break;
      default:
        state2.pipes.push(dest);
        break;
    }
    state2.pipesCount += 1;
    debug2("pipe count=%d opts=%j", state2.pipesCount, pipeOpts);
    var doEnd = (!pipeOpts || pipeOpts.end !== false) && dest !== process.stdout && dest !== process.stderr;
    var endFn = doEnd ? onend : unpipe;
    if (state2.endEmitted) pna.nextTick(endFn);
    else src.once("end", endFn);
    dest.on("unpipe", onunpipe);
    function onunpipe(readable2, unpipeInfo) {
      debug2("onunpipe");
      if (readable2 === src) {
        if (unpipeInfo && unpipeInfo.hasUnpiped === false) {
          unpipeInfo.hasUnpiped = true;
          cleanup();
        }
      }
    }
    function onend() {
      debug2("onend");
      dest.end();
    }
    var ondrain = pipeOnDrain(src);
    dest.on("drain", ondrain);
    var cleanedUp = false;
    function cleanup() {
      debug2("cleanup");
      dest.removeListener("close", onclose);
      dest.removeListener("finish", onfinish);
      dest.removeListener("drain", ondrain);
      dest.removeListener("error", onerror);
      dest.removeListener("unpipe", onunpipe);
      src.removeListener("end", onend);
      src.removeListener("end", unpipe);
      src.removeListener("data", ondata);
      cleanedUp = true;
      if (state2.awaitDrain && (!dest._writableState || dest._writableState.needDrain)) ondrain();
    }
    var increasedAwaitDrain = false;
    src.on("data", ondata);
    function ondata(chunk) {
      debug2("ondata");
      increasedAwaitDrain = false;
      var ret = dest.write(chunk);
      if (false === ret && !increasedAwaitDrain) {
        if ((state2.pipesCount === 1 && state2.pipes === dest || state2.pipesCount > 1 && indexOf2(state2.pipes, dest) !== -1) && !cleanedUp) {
          debug2("false write response, pause", state2.awaitDrain);
          state2.awaitDrain++;
          increasedAwaitDrain = true;
        }
        src.pause();
      }
    }
    function onerror(er) {
      debug2("onerror", er);
      unpipe();
      dest.removeListener("error", onerror);
      if (EElistenerCount(dest, "error") === 0) dest.emit("error", er);
    }
    prependListener(dest, "error", onerror);
    function onclose() {
      dest.removeListener("finish", onfinish);
      unpipe();
    }
    dest.once("close", onclose);
    function onfinish() {
      debug2("onfinish");
      dest.removeListener("close", onclose);
      unpipe();
    }
    dest.once("finish", onfinish);
    function unpipe() {
      debug2("unpipe");
      src.unpipe(dest);
    }
    dest.emit("pipe", src);
    if (!state2.flowing) {
      debug2("pipe resume");
      src.resume();
    }
    return dest;
  };
  function pipeOnDrain(src) {
    return function() {
      var state2 = src._readableState;
      debug2("pipeOnDrain", state2.awaitDrain);
      if (state2.awaitDrain) state2.awaitDrain--;
      if (state2.awaitDrain === 0 && EElistenerCount(src, "data")) {
        state2.flowing = true;
        flow(src);
      }
    };
  }
  Readable2.prototype.unpipe = function(dest) {
    var state2 = this._readableState;
    var unpipeInfo = { hasUnpiped: false };
    if (state2.pipesCount === 0) return this;
    if (state2.pipesCount === 1) {
      if (dest && dest !== state2.pipes) return this;
      if (!dest) dest = state2.pipes;
      state2.pipes = null;
      state2.pipesCount = 0;
      state2.flowing = false;
      if (dest) dest.emit("unpipe", this, unpipeInfo);
      return this;
    }
    if (!dest) {
      var dests = state2.pipes;
      var len = state2.pipesCount;
      state2.pipes = null;
      state2.pipesCount = 0;
      state2.flowing = false;
      for (var i = 0; i < len; i++) {
        dests[i].emit("unpipe", this, { hasUnpiped: false });
      }
      return this;
    }
    var index2 = indexOf2(state2.pipes, dest);
    if (index2 === -1) return this;
    state2.pipes.splice(index2, 1);
    state2.pipesCount -= 1;
    if (state2.pipesCount === 1) state2.pipes = state2.pipes[0];
    dest.emit("unpipe", this, unpipeInfo);
    return this;
  };
  Readable2.prototype.on = function(ev, fn) {
    var res = Stream2.prototype.on.call(this, ev, fn);
    if (ev === "data") {
      if (this._readableState.flowing !== false) this.resume();
    } else if (ev === "readable") {
      var state2 = this._readableState;
      if (!state2.endEmitted && !state2.readableListening) {
        state2.readableListening = state2.needReadable = true;
        state2.emittedReadable = false;
        if (!state2.reading) {
          pna.nextTick(nReadingNextTick, this);
        } else if (state2.length) {
          emitReadable(this);
        }
      }
    }
    return res;
  };
  Readable2.prototype.addListener = Readable2.prototype.on;
  function nReadingNextTick(self2) {
    debug2("readable nexttick read 0");
    self2.read(0);
  }
  Readable2.prototype.resume = function() {
    var state2 = this._readableState;
    if (!state2.flowing) {
      debug2("resume");
      state2.flowing = true;
      resume(this, state2);
    }
    return this;
  };
  function resume(stream2, state2) {
    if (!state2.resumeScheduled) {
      state2.resumeScheduled = true;
      pna.nextTick(resume_, stream2, state2);
    }
  }
  function resume_(stream2, state2) {
    if (!state2.reading) {
      debug2("resume read 0");
      stream2.read(0);
    }
    state2.resumeScheduled = false;
    state2.awaitDrain = 0;
    stream2.emit("resume");
    flow(stream2);
    if (state2.flowing && !state2.reading) stream2.read(0);
  }
  Readable2.prototype.pause = function() {
    debug2("call pause flowing=%j", this._readableState.flowing);
    if (false !== this._readableState.flowing) {
      debug2("pause");
      this._readableState.flowing = false;
      this.emit("pause");
    }
    return this;
  };
  function flow(stream2) {
    var state2 = stream2._readableState;
    debug2("flow", state2.flowing);
    while (state2.flowing && stream2.read() !== null) {
    }
  }
  Readable2.prototype.wrap = function(stream2) {
    var _this = this;
    var state2 = this._readableState;
    var paused = false;
    stream2.on("end", function() {
      debug2("wrapped end");
      if (state2.decoder && !state2.ended) {
        var chunk = state2.decoder.end();
        if (chunk && chunk.length) _this.push(chunk);
      }
      _this.push(null);
    });
    stream2.on("data", function(chunk) {
      debug2("wrapped data");
      if (state2.decoder) chunk = state2.decoder.write(chunk);
      if (state2.objectMode && (chunk === null || chunk === void 0)) return;
      else if (!state2.objectMode && (!chunk || !chunk.length)) return;
      var ret = _this.push(chunk);
      if (!ret) {
        paused = true;
        stream2.pause();
      }
    });
    for (var i in stream2) {
      if (this[i] === void 0 && typeof stream2[i] === "function") {
        this[i] = /* @__PURE__ */ function(method) {
          return function() {
            return stream2[method].apply(stream2, arguments);
          };
        }(i);
      }
    }
    for (var n = 0; n < kProxyEvents.length; n++) {
      stream2.on(kProxyEvents[n], this.emit.bind(this, kProxyEvents[n]));
    }
    this._read = function(n2) {
      debug2("wrapped _read", n2);
      if (paused) {
        paused = false;
        stream2.resume();
      }
    };
    return this;
  };
  Object.defineProperty(Readable2.prototype, "readableHighWaterMark", {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: false,
    get: function() {
      return this._readableState.highWaterMark;
    }
  });
  Readable2._fromList = fromList;
  function fromList(n, state2) {
    if (state2.length === 0) return null;
    var ret;
    if (state2.objectMode) ret = state2.buffer.shift();
    else if (!n || n >= state2.length) {
      if (state2.decoder) ret = state2.buffer.join("");
      else if (state2.buffer.length === 1) ret = state2.buffer.head.data;
      else ret = state2.buffer.concat(state2.length);
      state2.buffer.clear();
    } else {
      ret = fromListPartial(n, state2.buffer, state2.decoder);
    }
    return ret;
  }
  function fromListPartial(n, list, hasStrings) {
    var ret;
    if (n < list.head.data.length) {
      ret = list.head.data.slice(0, n);
      list.head.data = list.head.data.slice(n);
    } else if (n === list.head.data.length) {
      ret = list.shift();
    } else {
      ret = hasStrings ? copyFromBufferString(n, list) : copyFromBuffer(n, list);
    }
    return ret;
  }
  function copyFromBufferString(n, list) {
    var p = list.head;
    var c = 1;
    var ret = p.data;
    n -= ret.length;
    while (p = p.next) {
      var str = p.data;
      var nb = n > str.length ? str.length : n;
      if (nb === str.length) ret += str;
      else ret += str.slice(0, n);
      n -= nb;
      if (n === 0) {
        if (nb === str.length) {
          ++c;
          if (p.next) list.head = p.next;
          else list.head = list.tail = null;
        } else {
          list.head = p;
          p.data = str.slice(nb);
        }
        break;
      }
      ++c;
    }
    list.length -= c;
    return ret;
  }
  function copyFromBuffer(n, list) {
    var ret = Buffer2.allocUnsafe(n);
    var p = list.head;
    var c = 1;
    p.data.copy(ret);
    n -= p.data.length;
    while (p = p.next) {
      var buf = p.data;
      var nb = n > buf.length ? buf.length : n;
      buf.copy(ret, ret.length - n, 0, nb);
      n -= nb;
      if (n === 0) {
        if (nb === buf.length) {
          ++c;
          if (p.next) list.head = p.next;
          else list.head = list.tail = null;
        } else {
          list.head = p;
          p.data = buf.slice(nb);
        }
        break;
      }
      ++c;
    }
    list.length -= c;
    return ret;
  }
  function endReadable(stream2) {
    var state2 = stream2._readableState;
    if (state2.length > 0) throw new Error('"endReadable()" called on non-empty stream');
    if (!state2.endEmitted) {
      state2.ended = true;
      pna.nextTick(endReadableNT, state2, stream2);
    }
  }
  function endReadableNT(state2, stream2) {
    if (!state2.endEmitted && state2.length === 0) {
      state2.endEmitted = true;
      stream2.readable = false;
      stream2.emit("end");
    }
  }
  function indexOf2(xs, x) {
    for (var i = 0, l = xs.length; i < l; i++) {
      if (xs[i] === x) return i;
    }
    return -1;
  }
  return _stream_readable$1;
}
var _stream_transform$1;
var hasRequired_stream_transform$1;
function require_stream_transform$1() {
  if (hasRequired_stream_transform$1) return _stream_transform$1;
  hasRequired_stream_transform$1 = 1;
  _stream_transform$1 = Transform2;
  var Duplex = require_stream_duplex$1();
  var util2 = Object.create(requireUtil());
  util2.inherits = inheritsExports;
  util2.inherits(Transform2, Duplex);
  function afterTransform(er, data) {
    var ts = this._transformState;
    ts.transforming = false;
    var cb = ts.writecb;
    if (!cb) {
      return this.emit("error", new Error("write callback called multiple times"));
    }
    ts.writechunk = null;
    ts.writecb = null;
    if (data != null)
      this.push(data);
    cb(er);
    var rs = this._readableState;
    rs.reading = false;
    if (rs.needReadable || rs.length < rs.highWaterMark) {
      this._read(rs.highWaterMark);
    }
  }
  function Transform2(options) {
    if (!(this instanceof Transform2)) return new Transform2(options);
    Duplex.call(this, options);
    this._transformState = {
      afterTransform: afterTransform.bind(this),
      needTransform: false,
      transforming: false,
      writecb: null,
      writechunk: null,
      writeencoding: null
    };
    this._readableState.needReadable = true;
    this._readableState.sync = false;
    if (options) {
      if (typeof options.transform === "function") this._transform = options.transform;
      if (typeof options.flush === "function") this._flush = options.flush;
    }
    this.on("prefinish", prefinish);
  }
  function prefinish() {
    var _this = this;
    if (typeof this._flush === "function") {
      this._flush(function(er, data) {
        done(_this, er, data);
      });
    } else {
      done(this, null, null);
    }
  }
  Transform2.prototype.push = function(chunk, encoding) {
    this._transformState.needTransform = false;
    return Duplex.prototype.push.call(this, chunk, encoding);
  };
  Transform2.prototype._transform = function(chunk, encoding, cb) {
    throw new Error("_transform() is not implemented");
  };
  Transform2.prototype._write = function(chunk, encoding, cb) {
    var ts = this._transformState;
    ts.writecb = cb;
    ts.writechunk = chunk;
    ts.writeencoding = encoding;
    if (!ts.transforming) {
      var rs = this._readableState;
      if (ts.needTransform || rs.needReadable || rs.length < rs.highWaterMark) this._read(rs.highWaterMark);
    }
  };
  Transform2.prototype._read = function(n) {
    var ts = this._transformState;
    if (ts.writechunk !== null && ts.writecb && !ts.transforming) {
      ts.transforming = true;
      this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform);
    } else {
      ts.needTransform = true;
    }
  };
  Transform2.prototype._destroy = function(err, cb) {
    var _this2 = this;
    Duplex.prototype._destroy.call(this, err, function(err2) {
      cb(err2);
      _this2.emit("close");
    });
  };
  function done(stream2, er, data) {
    if (er) return stream2.emit("error", er);
    if (data != null)
      stream2.push(data);
    if (stream2._writableState.length) throw new Error("Calling transform done when ws.length != 0");
    if (stream2._transformState.transforming) throw new Error("Calling transform done when still transforming");
    return stream2.push(null);
  }
  return _stream_transform$1;
}
var _stream_passthrough$1;
var hasRequired_stream_passthrough$1;
function require_stream_passthrough$1() {
  if (hasRequired_stream_passthrough$1) return _stream_passthrough$1;
  hasRequired_stream_passthrough$1 = 1;
  _stream_passthrough$1 = PassThrough2;
  var Transform2 = require_stream_transform$1();
  var util2 = Object.create(requireUtil());
  util2.inherits = inheritsExports;
  util2.inherits(PassThrough2, Transform2);
  function PassThrough2(options) {
    if (!(this instanceof PassThrough2)) return new PassThrough2(options);
    Transform2.call(this, options);
  }
  PassThrough2.prototype._transform = function(chunk, encoding, cb) {
    cb(null, chunk);
  };
  return _stream_passthrough$1;
}
(function(module, exports) {
  var Stream2 = require$$0$2;
  if (process.env.READABLE_STREAM === "disable" && Stream2) {
    module.exports = Stream2;
    exports = module.exports = Stream2.Readable;
    exports.Readable = Stream2.Readable;
    exports.Writable = Stream2.Writable;
    exports.Duplex = Stream2.Duplex;
    exports.Transform = Stream2.Transform;
    exports.PassThrough = Stream2.PassThrough;
    exports.Stream = Stream2;
  } else {
    exports = module.exports = require_stream_readable$1();
    exports.Stream = Stream2 || exports;
    exports.Readable = exports;
    exports.Writable = require_stream_writable$1();
    exports.Duplex = require_stream_duplex$1();
    exports.Transform = require_stream_transform$1();
    exports.PassThrough = require_stream_passthrough$1();
  }
})(readable$1, readable$1.exports);
var readableExports$1 = readable$1.exports;
var file$3 = { exports: {} };
var MAX_SAFE_INTEGER$2 = 9007199254740991;
var argsTag$2 = "[object Arguments]", funcTag$2 = "[object Function]", genTag$2 = "[object GeneratorFunction]";
var freeGlobal$2 = typeof commonjsGlobal == "object" && commonjsGlobal && commonjsGlobal.Object === Object && commonjsGlobal;
var freeSelf$2 = typeof self == "object" && self && self.Object === Object && self;
var root$2 = freeGlobal$2 || freeSelf$2 || Function("return this")();
function arrayPush$2(array, values) {
  var index2 = -1, length = values.length, offset = array.length;
  while (++index2 < length) {
    array[offset + index2] = values[index2];
  }
  return array;
}
var objectProto$3 = Object.prototype;
var hasOwnProperty$3 = objectProto$3.hasOwnProperty;
var objectToString$3 = objectProto$3.toString;
var Symbol$3 = root$2.Symbol, propertyIsEnumerable$2 = objectProto$3.propertyIsEnumerable, spreadableSymbol$2 = Symbol$3 ? Symbol$3.isConcatSpreadable : void 0;
function baseFlatten$2(array, depth, predicate, isStrict, result) {
  var index2 = -1, length = array.length;
  predicate || (predicate = isFlattenable$2);
  result || (result = []);
  while (++index2 < length) {
    var value = array[index2];
    if (predicate(value)) {
      {
        arrayPush$2(result, value);
      }
    } else {
      result[result.length] = value;
    }
  }
  return result;
}
function isFlattenable$2(value) {
  return isArray$3(value) || isArguments$2(value) || !!(spreadableSymbol$2 && value && value[spreadableSymbol$2]);
}
function flatten$2(array) {
  var length = array ? array.length : 0;
  return length ? baseFlatten$2(array) : [];
}
function isArguments$2(value) {
  return isArrayLikeObject$2(value) && hasOwnProperty$3.call(value, "callee") && (!propertyIsEnumerable$2.call(value, "callee") || objectToString$3.call(value) == argsTag$2);
}
var isArray$3 = Array.isArray;
function isArrayLike$2(value) {
  return value != null && isLength$2(value.length) && !isFunction$2(value);
}
function isArrayLikeObject$2(value) {
  return isObjectLike$3(value) && isArrayLike$2(value);
}
function isFunction$2(value) {
  var tag = isObject$2(value) ? objectToString$3.call(value) : "";
  return tag == funcTag$2 || tag == genTag$2;
}
function isLength$2(value) {
  return typeof value == "number" && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER$2;
}
function isObject$2(value) {
  var type = typeof value;
  return !!value && (type == "object" || type == "function");
}
function isObjectLike$3(value) {
  return !!value && typeof value == "object";
}
var lodash_flatten = flatten$2;
var LARGE_ARRAY_SIZE$1 = 200;
var HASH_UNDEFINED$1 = "__lodash_hash_undefined__";
var MAX_SAFE_INTEGER$1 = 9007199254740991;
var argsTag$1 = "[object Arguments]", funcTag$1 = "[object Function]", genTag$1 = "[object GeneratorFunction]";
var reRegExpChar$1 = /[\\^$.*+?()[\]{}|]/g;
var reIsHostCtor$1 = /^\[object .+?Constructor\]$/;
var freeGlobal$1 = typeof commonjsGlobal == "object" && commonjsGlobal && commonjsGlobal.Object === Object && commonjsGlobal;
var freeSelf$1 = typeof self == "object" && self && self.Object === Object && self;
var root$1 = freeGlobal$1 || freeSelf$1 || Function("return this")();
function apply$1(func, thisArg, args) {
  switch (args.length) {
    case 0:
      return func.call(thisArg);
    case 1:
      return func.call(thisArg, args[0]);
    case 2:
      return func.call(thisArg, args[0], args[1]);
    case 3:
      return func.call(thisArg, args[0], args[1], args[2]);
  }
  return func.apply(thisArg, args);
}
function arrayIncludes$1(array, value) {
  var length = array ? array.length : 0;
  return !!length && baseIndexOf$1(array, value, 0) > -1;
}
function arrayPush$1(array, values) {
  var index2 = -1, length = values.length, offset = array.length;
  while (++index2 < length) {
    array[offset + index2] = values[index2];
  }
  return array;
}
function baseFindIndex$1(array, predicate, fromIndex, fromRight) {
  var length = array.length, index2 = fromIndex + -1;
  while (++index2 < length) {
    if (predicate(array[index2], index2, array)) {
      return index2;
    }
  }
  return -1;
}
function baseIndexOf$1(array, value, fromIndex) {
  if (value !== value) {
    return baseFindIndex$1(array, baseIsNaN$1, fromIndex);
  }
  var index2 = fromIndex - 1, length = array.length;
  while (++index2 < length) {
    if (array[index2] === value) {
      return index2;
    }
  }
  return -1;
}
function baseIsNaN$1(value) {
  return value !== value;
}
function cacheHas$1(cache, key) {
  return cache.has(key);
}
function getValue$1(object, key) {
  return object == null ? void 0 : object[key];
}
function isHostObject$2(value) {
  var result = false;
  if (value != null && typeof value.toString != "function") {
    try {
      result = !!(value + "");
    } catch (e) {
    }
  }
  return result;
}
var arrayProto$1 = Array.prototype, funcProto$2 = Function.prototype, objectProto$2 = Object.prototype;
var coreJsData$1 = root$1["__core-js_shared__"];
var maskSrcKey$1 = function() {
  var uid = /[^.]+$/.exec(coreJsData$1 && coreJsData$1.keys && coreJsData$1.keys.IE_PROTO || "");
  return uid ? "Symbol(src)_1." + uid : "";
}();
var funcToString$2 = funcProto$2.toString;
var hasOwnProperty$2 = objectProto$2.hasOwnProperty;
var objectToString$2 = objectProto$2.toString;
var reIsNative$1 = RegExp(
  "^" + funcToString$2.call(hasOwnProperty$2).replace(reRegExpChar$1, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$"
);
var Symbol$2 = root$1.Symbol, propertyIsEnumerable$1 = objectProto$2.propertyIsEnumerable, splice$1 = arrayProto$1.splice, spreadableSymbol$1 = Symbol$2 ? Symbol$2.isConcatSpreadable : void 0;
var nativeMax$1 = Math.max;
var Map$2 = getNative$1(root$1, "Map"), nativeCreate$1 = getNative$1(Object, "create");
function Hash$1(entries) {
  var index2 = -1, length = entries ? entries.length : 0;
  this.clear();
  while (++index2 < length) {
    var entry = entries[index2];
    this.set(entry[0], entry[1]);
  }
}
function hashClear$1() {
  this.__data__ = nativeCreate$1 ? nativeCreate$1(null) : {};
}
function hashDelete$1(key) {
  return this.has(key) && delete this.__data__[key];
}
function hashGet$1(key) {
  var data = this.__data__;
  if (nativeCreate$1) {
    var result = data[key];
    return result === HASH_UNDEFINED$1 ? void 0 : result;
  }
  return hasOwnProperty$2.call(data, key) ? data[key] : void 0;
}
function hashHas$1(key) {
  var data = this.__data__;
  return nativeCreate$1 ? data[key] !== void 0 : hasOwnProperty$2.call(data, key);
}
function hashSet$1(key, value) {
  var data = this.__data__;
  data[key] = nativeCreate$1 && value === void 0 ? HASH_UNDEFINED$1 : value;
  return this;
}
Hash$1.prototype.clear = hashClear$1;
Hash$1.prototype["delete"] = hashDelete$1;
Hash$1.prototype.get = hashGet$1;
Hash$1.prototype.has = hashHas$1;
Hash$1.prototype.set = hashSet$1;
function ListCache$1(entries) {
  var index2 = -1, length = entries ? entries.length : 0;
  this.clear();
  while (++index2 < length) {
    var entry = entries[index2];
    this.set(entry[0], entry[1]);
  }
}
function listCacheClear$1() {
  this.__data__ = [];
}
function listCacheDelete$1(key) {
  var data = this.__data__, index2 = assocIndexOf$1(data, key);
  if (index2 < 0) {
    return false;
  }
  var lastIndex = data.length - 1;
  if (index2 == lastIndex) {
    data.pop();
  } else {
    splice$1.call(data, index2, 1);
  }
  return true;
}
function listCacheGet$1(key) {
  var data = this.__data__, index2 = assocIndexOf$1(data, key);
  return index2 < 0 ? void 0 : data[index2][1];
}
function listCacheHas$1(key) {
  return assocIndexOf$1(this.__data__, key) > -1;
}
function listCacheSet$1(key, value) {
  var data = this.__data__, index2 = assocIndexOf$1(data, key);
  if (index2 < 0) {
    data.push([key, value]);
  } else {
    data[index2][1] = value;
  }
  return this;
}
ListCache$1.prototype.clear = listCacheClear$1;
ListCache$1.prototype["delete"] = listCacheDelete$1;
ListCache$1.prototype.get = listCacheGet$1;
ListCache$1.prototype.has = listCacheHas$1;
ListCache$1.prototype.set = listCacheSet$1;
function MapCache$1(entries) {
  var index2 = -1, length = entries ? entries.length : 0;
  this.clear();
  while (++index2 < length) {
    var entry = entries[index2];
    this.set(entry[0], entry[1]);
  }
}
function mapCacheClear$1() {
  this.__data__ = {
    "hash": new Hash$1(),
    "map": new (Map$2 || ListCache$1)(),
    "string": new Hash$1()
  };
}
function mapCacheDelete$1(key) {
  return getMapData$1(this, key)["delete"](key);
}
function mapCacheGet$1(key) {
  return getMapData$1(this, key).get(key);
}
function mapCacheHas$1(key) {
  return getMapData$1(this, key).has(key);
}
function mapCacheSet$1(key, value) {
  getMapData$1(this, key).set(key, value);
  return this;
}
MapCache$1.prototype.clear = mapCacheClear$1;
MapCache$1.prototype["delete"] = mapCacheDelete$1;
MapCache$1.prototype.get = mapCacheGet$1;
MapCache$1.prototype.has = mapCacheHas$1;
MapCache$1.prototype.set = mapCacheSet$1;
function SetCache$1(values) {
  var index2 = -1, length = values ? values.length : 0;
  this.__data__ = new MapCache$1();
  while (++index2 < length) {
    this.add(values[index2]);
  }
}
function setCacheAdd$1(value) {
  this.__data__.set(value, HASH_UNDEFINED$1);
  return this;
}
function setCacheHas$1(value) {
  return this.__data__.has(value);
}
SetCache$1.prototype.add = SetCache$1.prototype.push = setCacheAdd$1;
SetCache$1.prototype.has = setCacheHas$1;
function assocIndexOf$1(array, key) {
  var length = array.length;
  while (length--) {
    if (eq$1(array[length][0], key)) {
      return length;
    }
  }
  return -1;
}
function baseDifference(array, values, iteratee, comparator) {
  var index2 = -1, includes = arrayIncludes$1, isCommon = true, length = array.length, result = [], valuesLength = values.length;
  if (!length) {
    return result;
  }
  if (values.length >= LARGE_ARRAY_SIZE$1) {
    includes = cacheHas$1;
    isCommon = false;
    values = new SetCache$1(values);
  }
  outer:
    while (++index2 < length) {
      var value = array[index2], computed = value;
      value = value !== 0 ? value : 0;
      if (isCommon && computed === computed) {
        var valuesIndex = valuesLength;
        while (valuesIndex--) {
          if (values[valuesIndex] === computed) {
            continue outer;
          }
        }
        result.push(value);
      } else if (!includes(values, computed, comparator)) {
        result.push(value);
      }
    }
  return result;
}
function baseFlatten$1(array, depth, predicate, isStrict, result) {
  var index2 = -1, length = array.length;
  predicate || (predicate = isFlattenable$1);
  result || (result = []);
  while (++index2 < length) {
    var value = array[index2];
    if (predicate(value)) {
      {
        arrayPush$1(result, value);
      }
    }
  }
  return result;
}
function baseIsNative$1(value) {
  if (!isObject$1(value) || isMasked$1(value)) {
    return false;
  }
  var pattern = isFunction$1(value) || isHostObject$2(value) ? reIsNative$1 : reIsHostCtor$1;
  return pattern.test(toSource$1(value));
}
function baseRest$1(func, start) {
  start = nativeMax$1(start === void 0 ? func.length - 1 : start, 0);
  return function() {
    var args = arguments, index2 = -1, length = nativeMax$1(args.length - start, 0), array = Array(length);
    while (++index2 < length) {
      array[index2] = args[start + index2];
    }
    index2 = -1;
    var otherArgs = Array(start + 1);
    while (++index2 < start) {
      otherArgs[index2] = args[index2];
    }
    otherArgs[start] = array;
    return apply$1(func, this, otherArgs);
  };
}
function getMapData$1(map2, key) {
  var data = map2.__data__;
  return isKeyable$1(key) ? data[typeof key == "string" ? "string" : "hash"] : data.map;
}
function getNative$1(object, key) {
  var value = getValue$1(object, key);
  return baseIsNative$1(value) ? value : void 0;
}
function isFlattenable$1(value) {
  return isArray$2(value) || isArguments$1(value) || !!(spreadableSymbol$1 && value && value[spreadableSymbol$1]);
}
function isKeyable$1(value) {
  var type = typeof value;
  return type == "string" || type == "number" || type == "symbol" || type == "boolean" ? value !== "__proto__" : value === null;
}
function isMasked$1(func) {
  return !!maskSrcKey$1 && maskSrcKey$1 in func;
}
function toSource$1(func) {
  if (func != null) {
    try {
      return funcToString$2.call(func);
    } catch (e) {
    }
    try {
      return func + "";
    } catch (e) {
    }
  }
  return "";
}
var difference$2 = baseRest$1(function(array, values) {
  return isArrayLikeObject$1(array) ? baseDifference(array, baseFlatten$1(values, 1, isArrayLikeObject$1)) : [];
});
function eq$1(value, other) {
  return value === other || value !== value && other !== other;
}
function isArguments$1(value) {
  return isArrayLikeObject$1(value) && hasOwnProperty$2.call(value, "callee") && (!propertyIsEnumerable$1.call(value, "callee") || objectToString$2.call(value) == argsTag$1);
}
var isArray$2 = Array.isArray;
function isArrayLike$1(value) {
  return value != null && isLength$1(value.length) && !isFunction$1(value);
}
function isArrayLikeObject$1(value) {
  return isObjectLike$2(value) && isArrayLike$1(value);
}
function isFunction$1(value) {
  var tag = isObject$1(value) ? objectToString$2.call(value) : "";
  return tag == funcTag$1 || tag == genTag$1;
}
function isLength$1(value) {
  return typeof value == "number" && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER$1;
}
function isObject$1(value) {
  var type = typeof value;
  return !!value && (type == "object" || type == "function");
}
function isObjectLike$2(value) {
  return !!value && typeof value == "object";
}
var lodash_difference = difference$2;
var LARGE_ARRAY_SIZE = 200;
var HASH_UNDEFINED = "__lodash_hash_undefined__";
var INFINITY = 1 / 0, MAX_SAFE_INTEGER = 9007199254740991;
var argsTag = "[object Arguments]", funcTag = "[object Function]", genTag = "[object GeneratorFunction]";
var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;
var reIsHostCtor = /^\[object .+?Constructor\]$/;
var freeGlobal = typeof commonjsGlobal == "object" && commonjsGlobal && commonjsGlobal.Object === Object && commonjsGlobal;
var freeSelf = typeof self == "object" && self && self.Object === Object && self;
var root = freeGlobal || freeSelf || Function("return this")();
function apply(func, thisArg, args) {
  switch (args.length) {
    case 0:
      return func.call(thisArg);
    case 1:
      return func.call(thisArg, args[0]);
    case 2:
      return func.call(thisArg, args[0], args[1]);
    case 3:
      return func.call(thisArg, args[0], args[1], args[2]);
  }
  return func.apply(thisArg, args);
}
function arrayIncludes(array, value) {
  var length = array ? array.length : 0;
  return !!length && baseIndexOf(array, value, 0) > -1;
}
function arrayPush(array, values) {
  var index2 = -1, length = values.length, offset = array.length;
  while (++index2 < length) {
    array[offset + index2] = values[index2];
  }
  return array;
}
function baseFindIndex(array, predicate, fromIndex, fromRight) {
  var length = array.length, index2 = fromIndex + -1;
  while (++index2 < length) {
    if (predicate(array[index2], index2, array)) {
      return index2;
    }
  }
  return -1;
}
function baseIndexOf(array, value, fromIndex) {
  if (value !== value) {
    return baseFindIndex(array, baseIsNaN, fromIndex);
  }
  var index2 = fromIndex - 1, length = array.length;
  while (++index2 < length) {
    if (array[index2] === value) {
      return index2;
    }
  }
  return -1;
}
function baseIsNaN(value) {
  return value !== value;
}
function cacheHas(cache, key) {
  return cache.has(key);
}
function getValue(object, key) {
  return object == null ? void 0 : object[key];
}
function isHostObject$1(value) {
  var result = false;
  if (value != null && typeof value.toString != "function") {
    try {
      result = !!(value + "");
    } catch (e) {
    }
  }
  return result;
}
function setToArray(set) {
  var index2 = -1, result = Array(set.size);
  set.forEach(function(value) {
    result[++index2] = value;
  });
  return result;
}
var arrayProto = Array.prototype, funcProto$1 = Function.prototype, objectProto$1 = Object.prototype;
var coreJsData = root["__core-js_shared__"];
var maskSrcKey = function() {
  var uid = /[^.]+$/.exec(coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO || "");
  return uid ? "Symbol(src)_1." + uid : "";
}();
var funcToString$1 = funcProto$1.toString;
var hasOwnProperty$1 = objectProto$1.hasOwnProperty;
var objectToString$1 = objectProto$1.toString;
var reIsNative = RegExp(
  "^" + funcToString$1.call(hasOwnProperty$1).replace(reRegExpChar, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$"
);
var Symbol$1 = root.Symbol, propertyIsEnumerable = objectProto$1.propertyIsEnumerable, splice = arrayProto.splice, spreadableSymbol = Symbol$1 ? Symbol$1.isConcatSpreadable : void 0;
var nativeMax = Math.max;
var Map$1 = getNative(root, "Map"), Set = getNative(root, "Set"), nativeCreate = getNative(Object, "create");
function Hash(entries) {
  var index2 = -1, length = entries ? entries.length : 0;
  this.clear();
  while (++index2 < length) {
    var entry = entries[index2];
    this.set(entry[0], entry[1]);
  }
}
function hashClear() {
  this.__data__ = nativeCreate ? nativeCreate(null) : {};
}
function hashDelete(key) {
  return this.has(key) && delete this.__data__[key];
}
function hashGet(key) {
  var data = this.__data__;
  if (nativeCreate) {
    var result = data[key];
    return result === HASH_UNDEFINED ? void 0 : result;
  }
  return hasOwnProperty$1.call(data, key) ? data[key] : void 0;
}
function hashHas(key) {
  var data = this.__data__;
  return nativeCreate ? data[key] !== void 0 : hasOwnProperty$1.call(data, key);
}
function hashSet(key, value) {
  var data = this.__data__;
  data[key] = nativeCreate && value === void 0 ? HASH_UNDEFINED : value;
  return this;
}
Hash.prototype.clear = hashClear;
Hash.prototype["delete"] = hashDelete;
Hash.prototype.get = hashGet;
Hash.prototype.has = hashHas;
Hash.prototype.set = hashSet;
function ListCache(entries) {
  var index2 = -1, length = entries ? entries.length : 0;
  this.clear();
  while (++index2 < length) {
    var entry = entries[index2];
    this.set(entry[0], entry[1]);
  }
}
function listCacheClear() {
  this.__data__ = [];
}
function listCacheDelete(key) {
  var data = this.__data__, index2 = assocIndexOf(data, key);
  if (index2 < 0) {
    return false;
  }
  var lastIndex = data.length - 1;
  if (index2 == lastIndex) {
    data.pop();
  } else {
    splice.call(data, index2, 1);
  }
  return true;
}
function listCacheGet(key) {
  var data = this.__data__, index2 = assocIndexOf(data, key);
  return index2 < 0 ? void 0 : data[index2][1];
}
function listCacheHas(key) {
  return assocIndexOf(this.__data__, key) > -1;
}
function listCacheSet(key, value) {
  var data = this.__data__, index2 = assocIndexOf(data, key);
  if (index2 < 0) {
    data.push([key, value]);
  } else {
    data[index2][1] = value;
  }
  return this;
}
ListCache.prototype.clear = listCacheClear;
ListCache.prototype["delete"] = listCacheDelete;
ListCache.prototype.get = listCacheGet;
ListCache.prototype.has = listCacheHas;
ListCache.prototype.set = listCacheSet;
function MapCache(entries) {
  var index2 = -1, length = entries ? entries.length : 0;
  this.clear();
  while (++index2 < length) {
    var entry = entries[index2];
    this.set(entry[0], entry[1]);
  }
}
function mapCacheClear() {
  this.__data__ = {
    "hash": new Hash(),
    "map": new (Map$1 || ListCache)(),
    "string": new Hash()
  };
}
function mapCacheDelete(key) {
  return getMapData(this, key)["delete"](key);
}
function mapCacheGet(key) {
  return getMapData(this, key).get(key);
}
function mapCacheHas(key) {
  return getMapData(this, key).has(key);
}
function mapCacheSet(key, value) {
  getMapData(this, key).set(key, value);
  return this;
}
MapCache.prototype.clear = mapCacheClear;
MapCache.prototype["delete"] = mapCacheDelete;
MapCache.prototype.get = mapCacheGet;
MapCache.prototype.has = mapCacheHas;
MapCache.prototype.set = mapCacheSet;
function SetCache(values) {
  var index2 = -1, length = values ? values.length : 0;
  this.__data__ = new MapCache();
  while (++index2 < length) {
    this.add(values[index2]);
  }
}
function setCacheAdd(value) {
  this.__data__.set(value, HASH_UNDEFINED);
  return this;
}
function setCacheHas(value) {
  return this.__data__.has(value);
}
SetCache.prototype.add = SetCache.prototype.push = setCacheAdd;
SetCache.prototype.has = setCacheHas;
function assocIndexOf(array, key) {
  var length = array.length;
  while (length--) {
    if (eq(array[length][0], key)) {
      return length;
    }
  }
  return -1;
}
function baseFlatten(array, depth, predicate, isStrict, result) {
  var index2 = -1, length = array.length;
  predicate || (predicate = isFlattenable);
  result || (result = []);
  while (++index2 < length) {
    var value = array[index2];
    if (predicate(value)) {
      {
        arrayPush(result, value);
      }
    }
  }
  return result;
}
function baseIsNative(value) {
  if (!isObject(value) || isMasked(value)) {
    return false;
  }
  var pattern = isFunction(value) || isHostObject$1(value) ? reIsNative : reIsHostCtor;
  return pattern.test(toSource(value));
}
function baseRest(func, start) {
  start = nativeMax(start === void 0 ? func.length - 1 : start, 0);
  return function() {
    var args = arguments, index2 = -1, length = nativeMax(args.length - start, 0), array = Array(length);
    while (++index2 < length) {
      array[index2] = args[start + index2];
    }
    index2 = -1;
    var otherArgs = Array(start + 1);
    while (++index2 < start) {
      otherArgs[index2] = args[index2];
    }
    otherArgs[start] = array;
    return apply(func, this, otherArgs);
  };
}
function baseUniq(array, iteratee, comparator) {
  var index2 = -1, includes = arrayIncludes, length = array.length, isCommon = true, result = [], seen = result;
  if (length >= LARGE_ARRAY_SIZE) {
    var set = createSet(array);
    if (set) {
      return setToArray(set);
    }
    isCommon = false;
    includes = cacheHas;
    seen = new SetCache();
  } else {
    seen = result;
  }
  outer:
    while (++index2 < length) {
      var value = array[index2], computed = value;
      value = value !== 0 ? value : 0;
      if (isCommon && computed === computed) {
        var seenIndex = seen.length;
        while (seenIndex--) {
          if (seen[seenIndex] === computed) {
            continue outer;
          }
        }
        result.push(value);
      } else if (!includes(seen, computed, comparator)) {
        if (seen !== result) {
          seen.push(computed);
        }
        result.push(value);
      }
    }
  return result;
}
var createSet = !(Set && 1 / setToArray(new Set([, -0]))[1] == INFINITY) ? noop$3 : function(values) {
  return new Set(values);
};
function getMapData(map2, key) {
  var data = map2.__data__;
  return isKeyable(key) ? data[typeof key == "string" ? "string" : "hash"] : data.map;
}
function getNative(object, key) {
  var value = getValue(object, key);
  return baseIsNative(value) ? value : void 0;
}
function isFlattenable(value) {
  return isArray$1(value) || isArguments(value) || !!(spreadableSymbol && value && value[spreadableSymbol]);
}
function isKeyable(value) {
  var type = typeof value;
  return type == "string" || type == "number" || type == "symbol" || type == "boolean" ? value !== "__proto__" : value === null;
}
function isMasked(func) {
  return !!maskSrcKey && maskSrcKey in func;
}
function toSource(func) {
  if (func != null) {
    try {
      return funcToString$1.call(func);
    } catch (e) {
    }
    try {
      return func + "";
    } catch (e) {
    }
  }
  return "";
}
var union$2 = baseRest(function(arrays) {
  return baseUniq(baseFlatten(arrays, 1, isArrayLikeObject));
});
function eq(value, other) {
  return value === other || value !== value && other !== other;
}
function isArguments(value) {
  return isArrayLikeObject(value) && hasOwnProperty$1.call(value, "callee") && (!propertyIsEnumerable.call(value, "callee") || objectToString$1.call(value) == argsTag);
}
var isArray$1 = Array.isArray;
function isArrayLike(value) {
  return value != null && isLength(value.length) && !isFunction(value);
}
function isArrayLikeObject(value) {
  return isObjectLike$1(value) && isArrayLike(value);
}
function isFunction(value) {
  var tag = isObject(value) ? objectToString$1.call(value) : "";
  return tag == funcTag || tag == genTag;
}
function isLength(value) {
  return typeof value == "number" && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
}
function isObject(value) {
  var type = typeof value;
  return !!value && (type == "object" || type == "function");
}
function isObjectLike$1(value) {
  return !!value && typeof value == "object";
}
function noop$3() {
}
var lodash_union = union$2;
var objectTag = "[object Object]";
function isHostObject(value) {
  var result = false;
  if (value != null && typeof value.toString != "function") {
    try {
      result = !!(value + "");
    } catch (e) {
    }
  }
  return result;
}
function overArg(func, transform2) {
  return function(arg) {
    return func(transform2(arg));
  };
}
var funcProto = Function.prototype, objectProto = Object.prototype;
var funcToString = funcProto.toString;
var hasOwnProperty = objectProto.hasOwnProperty;
var objectCtorString = funcToString.call(Object);
var objectToString = objectProto.toString;
var getPrototype = overArg(Object.getPrototypeOf, Object);
function isObjectLike(value) {
  return !!value && typeof value == "object";
}
function isPlainObject$2(value) {
  if (!isObjectLike(value) || objectToString.call(value) != objectTag || isHostObject(value)) {
    return false;
  }
  var proto = getPrototype(value);
  if (proto === null) {
    return true;
  }
  var Ctor = hasOwnProperty.call(proto, "constructor") && proto.constructor;
  return typeof Ctor == "function" && Ctor instanceof Ctor && funcToString.call(Ctor) == objectCtorString;
}
var lodash_isplainobject = isPlainObject$2;
var old$1 = {};
var pathModule = require$$1;
var isWindows = process.platform === "win32";
var fs$7 = require$$0;
var DEBUG = process.env.NODE_DEBUG && /fs/.test(process.env.NODE_DEBUG);
function rethrow() {
  var callback;
  if (DEBUG) {
    var backtrace = new Error();
    callback = debugCallback;
  } else
    callback = missingCallback;
  return callback;
  function debugCallback(err) {
    if (err) {
      backtrace.message = err.message;
      err = backtrace;
      missingCallback(err);
    }
  }
  function missingCallback(err) {
    if (err) {
      if (process.throwDeprecation)
        throw err;
      else if (!process.noDeprecation) {
        var msg = "fs: missing callback " + (err.stack || err.message);
        if (process.traceDeprecation)
          console.trace(msg);
        else
          console.error(msg);
      }
    }
  }
}
function maybeCallback(cb) {
  return typeof cb === "function" ? cb : rethrow();
}
pathModule.normalize;
if (isWindows) {
  var nextPartRe = /(.*?)(?:[\/\\]+|$)/g;
} else {
  var nextPartRe = /(.*?)(?:[\/]+|$)/g;
}
if (isWindows) {
  var splitRootRe = /^(?:[a-zA-Z]:|[\\\/]{2}[^\\\/]+[\\\/][^\\\/]+)?[\\\/]*/;
} else {
  var splitRootRe = /^[\/]*/;
}
old$1.realpathSync = function realpathSync(p, cache) {
  p = pathModule.resolve(p);
  if (cache && Object.prototype.hasOwnProperty.call(cache, p)) {
    return cache[p];
  }
  var original = p, seenLinks = {}, knownHard = {};
  var pos;
  var current;
  var base;
  var previous;
  start();
  function start() {
    var m = splitRootRe.exec(p);
    pos = m[0].length;
    current = m[0];
    base = m[0];
    previous = "";
    if (isWindows && !knownHard[base]) {
      fs$7.lstatSync(base);
      knownHard[base] = true;
    }
  }
  while (pos < p.length) {
    nextPartRe.lastIndex = pos;
    var result = nextPartRe.exec(p);
    previous = current;
    current += result[0];
    base = previous + result[1];
    pos = nextPartRe.lastIndex;
    if (knownHard[base] || cache && cache[base] === base) {
      continue;
    }
    var resolvedLink;
    if (cache && Object.prototype.hasOwnProperty.call(cache, base)) {
      resolvedLink = cache[base];
    } else {
      var stat2 = fs$7.lstatSync(base);
      if (!stat2.isSymbolicLink()) {
        knownHard[base] = true;
        if (cache) cache[base] = base;
        continue;
      }
      var linkTarget = null;
      if (!isWindows) {
        var id = stat2.dev.toString(32) + ":" + stat2.ino.toString(32);
        if (seenLinks.hasOwnProperty(id)) {
          linkTarget = seenLinks[id];
        }
      }
      if (linkTarget === null) {
        fs$7.statSync(base);
        linkTarget = fs$7.readlinkSync(base);
      }
      resolvedLink = pathModule.resolve(previous, linkTarget);
      if (cache) cache[base] = resolvedLink;
      if (!isWindows) seenLinks[id] = linkTarget;
    }
    p = pathModule.resolve(resolvedLink, p.slice(pos));
    start();
  }
  if (cache) cache[original] = p;
  return p;
};
old$1.realpath = function realpath(p, cache, cb) {
  if (typeof cb !== "function") {
    cb = maybeCallback(cache);
    cache = null;
  }
  p = pathModule.resolve(p);
  if (cache && Object.prototype.hasOwnProperty.call(cache, p)) {
    return process.nextTick(cb.bind(null, null, cache[p]));
  }
  var original = p, seenLinks = {}, knownHard = {};
  var pos;
  var current;
  var base;
  var previous;
  start();
  function start() {
    var m = splitRootRe.exec(p);
    pos = m[0].length;
    current = m[0];
    base = m[0];
    previous = "";
    if (isWindows && !knownHard[base]) {
      fs$7.lstat(base, function(err) {
        if (err) return cb(err);
        knownHard[base] = true;
        LOOP();
      });
    } else {
      process.nextTick(LOOP);
    }
  }
  function LOOP() {
    if (pos >= p.length) {
      if (cache) cache[original] = p;
      return cb(null, p);
    }
    nextPartRe.lastIndex = pos;
    var result = nextPartRe.exec(p);
    previous = current;
    current += result[0];
    base = previous + result[1];
    pos = nextPartRe.lastIndex;
    if (knownHard[base] || cache && cache[base] === base) {
      return process.nextTick(LOOP);
    }
    if (cache && Object.prototype.hasOwnProperty.call(cache, base)) {
      return gotResolvedLink(cache[base]);
    }
    return fs$7.lstat(base, gotStat);
  }
  function gotStat(err, stat2) {
    if (err) return cb(err);
    if (!stat2.isSymbolicLink()) {
      knownHard[base] = true;
      if (cache) cache[base] = base;
      return process.nextTick(LOOP);
    }
    if (!isWindows) {
      var id = stat2.dev.toString(32) + ":" + stat2.ino.toString(32);
      if (seenLinks.hasOwnProperty(id)) {
        return gotTarget(null, seenLinks[id], base);
      }
    }
    fs$7.stat(base, function(err2) {
      if (err2) return cb(err2);
      fs$7.readlink(base, function(err3, target) {
        if (!isWindows) seenLinks[id] = target;
        gotTarget(err3, target);
      });
    });
  }
  function gotTarget(err, target, base2) {
    if (err) return cb(err);
    var resolvedLink = pathModule.resolve(previous, target);
    if (cache) cache[base2] = resolvedLink;
    gotResolvedLink(resolvedLink);
  }
  function gotResolvedLink(resolvedLink) {
    p = pathModule.resolve(resolvedLink, p.slice(pos));
    start();
  }
};
var fs_realpath = realpath2;
realpath2.realpath = realpath2;
realpath2.sync = realpathSync2;
realpath2.realpathSync = realpathSync2;
realpath2.monkeypatch = monkeypatch;
realpath2.unmonkeypatch = unmonkeypatch;
var fs$6 = require$$0;
var origRealpath = fs$6.realpath;
var origRealpathSync = fs$6.realpathSync;
var version = process.version;
var ok = /^v[0-5]\./.test(version);
var old = old$1;
function newError(er) {
  return er && er.syscall === "realpath" && (er.code === "ELOOP" || er.code === "ENOMEM" || er.code === "ENAMETOOLONG");
}
function realpath2(p, cache, cb) {
  if (ok) {
    return origRealpath(p, cache, cb);
  }
  if (typeof cache === "function") {
    cb = cache;
    cache = null;
  }
  origRealpath(p, cache, function(er, result) {
    if (newError(er)) {
      old.realpath(p, cache, cb);
    } else {
      cb(er, result);
    }
  });
}
function realpathSync2(p, cache) {
  if (ok) {
    return origRealpathSync(p, cache);
  }
  try {
    return origRealpathSync(p, cache);
  } catch (er) {
    if (newError(er)) {
      return old.realpathSync(p, cache);
    } else {
      throw er;
    }
  }
}
function monkeypatch() {
  fs$6.realpath = realpath2;
  fs$6.realpathSync = realpathSync2;
}
function unmonkeypatch() {
  fs$6.realpath = origRealpath;
  fs$6.realpathSync = origRealpathSync;
}
var concatMap$1 = function(xs, fn) {
  var res = [];
  for (var i = 0; i < xs.length; i++) {
    var x = fn(xs[i], i);
    if (isArray(x)) res.push.apply(res, x);
    else res.push(x);
  }
  return res;
};
var isArray = Array.isArray || function(xs) {
  return Object.prototype.toString.call(xs) === "[object Array]";
};
var concatMap = concatMap$1;
var balanced = balancedMatch;
var braceExpansion = expandTop;
var escSlash = "\0SLASH" + Math.random() + "\0";
var escOpen = "\0OPEN" + Math.random() + "\0";
var escClose = "\0CLOSE" + Math.random() + "\0";
var escComma = "\0COMMA" + Math.random() + "\0";
var escPeriod = "\0PERIOD" + Math.random() + "\0";
function numeric(str) {
  return parseInt(str, 10) == str ? parseInt(str, 10) : str.charCodeAt(0);
}
function escapeBraces(str) {
  return str.split("\\\\").join(escSlash).split("\\{").join(escOpen).split("\\}").join(escClose).split("\\,").join(escComma).split("\\.").join(escPeriod);
}
function unescapeBraces(str) {
  return str.split(escSlash).join("\\").split(escOpen).join("{").split(escClose).join("}").split(escComma).join(",").split(escPeriod).join(".");
}
function parseCommaParts(str) {
  if (!str)
    return [""];
  var parts = [];
  var m = balanced("{", "}", str);
  if (!m)
    return str.split(",");
  var pre = m.pre;
  var body = m.body;
  var post = m.post;
  var p = pre.split(",");
  p[p.length - 1] += "{" + body + "}";
  var postParts = parseCommaParts(post);
  if (post.length) {
    p[p.length - 1] += postParts.shift();
    p.push.apply(p, postParts);
  }
  parts.push.apply(parts, p);
  return parts;
}
function expandTop(str, options) {
  if (!str)
    return [];
  options = options || {};
  var max = options.max == null ? Infinity : options.max;
  if (str.substr(0, 2) === "{}") {
    str = "\\{\\}" + str.substr(2);
  }
  return expand$1(escapeBraces(str), max, true).map(unescapeBraces);
}
function embrace(str) {
  return "{" + str + "}";
}
function isPadded(el) {
  return /^-?0\d/.test(el);
}
function lte(i, y) {
  return i <= y;
}
function gte(i, y) {
  return i >= y;
}
function expand$1(str, max, isTop) {
  var expansions = [];
  for (; ; ) {
    var m = balanced("{", "}", str);
    if (!m || /\$$/.test(m.pre)) return [str];
    var isNumericSequence = /^-?\d+\.\.-?\d+(?:\.\.-?\d+)?$/.test(m.body);
    var isAlphaSequence = /^[a-zA-Z]\.\.[a-zA-Z](?:\.\.-?\d+)?$/.test(m.body);
    var isSequence = isNumericSequence || isAlphaSequence;
    var isOptions = m.body.indexOf(",") >= 0;
    if (!isSequence && !isOptions) {
      if (m.post.match(/,(?!,).*\}/)) {
        str = m.pre + "{" + m.body + escClose + m.post;
        isTop = true;
        continue;
      }
      return [str];
    }
    var n;
    if (isSequence) {
      n = m.body.split(/\.\./);
    } else {
      n = parseCommaParts(m.body);
      if (n.length === 1) {
        n = expand$1(n[0], max, false).map(embrace);
        if (n.length === 1) {
          var post = m.post.length ? expand$1(m.post, max, false) : [""];
          return post.map(function(p) {
            return m.pre + n[0] + p;
          });
        }
      }
    }
    var pre = m.pre;
    var post = m.post.length ? expand$1(m.post, max, false) : [""];
    var N;
    if (isSequence) {
      var x = numeric(n[0]);
      var y = numeric(n[1]);
      var width = Math.max(n[0].length, n[1].length);
      var incr = n.length == 3 ? Math.max(Math.abs(numeric(n[2])), 1) : 1;
      var test = lte;
      var reverse = y < x;
      if (reverse) {
        incr *= -1;
        test = gte;
      }
      var pad = n.some(isPadded);
      N = [];
      for (var i = x; test(i, y) && N.length < max; i += incr) {
        var c;
        if (isAlphaSequence) {
          c = String.fromCharCode(i);
          if (c === "\\")
            c = "";
        } else {
          c = String(i);
          if (pad) {
            var need = width - c.length;
            if (need > 0) {
              var z = new Array(need + 1).join("0");
              if (i < 0)
                c = "-" + z + c.slice(1);
              else
                c = z + c;
            }
          }
        }
        N.push(c);
      }
    } else {
      N = concatMap(n, function(el) {
        return expand$1(el, max, false);
      });
    }
    for (var j = 0; j < N.length; j++) {
      for (var k = 0; k < post.length && expansions.length < max; k++) {
        var expansion = pre + N[j] + post[k];
        if (!isTop || isSequence || expansion)
          expansions.push(expansion);
      }
    }
    return expansions;
  }
}
var minimatch_1 = minimatch$1;
minimatch$1.Minimatch = Minimatch$1;
var path$6 = function() {
  try {
    return require("path");
  } catch (e) {
  }
}() || {
  sep: "/"
};
minimatch$1.sep = path$6.sep;
var GLOBSTAR = minimatch$1.GLOBSTAR = Minimatch$1.GLOBSTAR = {};
var expand = braceExpansion;
var plTypes = {
  "!": { open: "(?:(?!(?:", close: "))[^/]*?)" },
  "?": { open: "(?:", close: ")?" },
  "+": { open: "(?:", close: ")+" },
  "*": { open: "(?:", close: ")*" },
  "@": { open: "(?:", close: ")" }
};
var qmark = "[^/]";
var star = qmark + "*?";
var twoStarDot = "(?:(?!(?:\\/|^)(?:\\.{1,2})($|\\/)).)*?";
var twoStarNoDot = "(?:(?!(?:\\/|^)\\.).)*?";
var reSpecials = charSet("().*{}+?[]^$\\!");
function charSet(s) {
  return s.split("").reduce(function(set, c) {
    set[c] = true;
    return set;
  }, {});
}
var slashSplit = /\/+/;
minimatch$1.filter = filter;
function filter(pattern, options) {
  options = options || {};
  return function(p, i, list) {
    return minimatch$1(p, pattern, options);
  };
}
function ext(a, b) {
  b = b || {};
  var t = {};
  Object.keys(a).forEach(function(k) {
    t[k] = a[k];
  });
  Object.keys(b).forEach(function(k) {
    t[k] = b[k];
  });
  return t;
}
minimatch$1.defaults = function(def) {
  if (!def || typeof def !== "object" || !Object.keys(def).length) {
    return minimatch$1;
  }
  var orig = minimatch$1;
  var m = function minimatch2(p, pattern, options) {
    return orig(p, pattern, ext(def, options));
  };
  m.Minimatch = function Minimatch3(pattern, options) {
    return new orig.Minimatch(pattern, ext(def, options));
  };
  m.Minimatch.defaults = function defaults2(options) {
    return orig.defaults(ext(def, options)).Minimatch;
  };
  m.filter = function filter2(pattern, options) {
    return orig.filter(pattern, ext(def, options));
  };
  m.defaults = function defaults2(options) {
    return orig.defaults(ext(def, options));
  };
  m.makeRe = function makeRe2(pattern, options) {
    return orig.makeRe(pattern, ext(def, options));
  };
  m.braceExpand = function braceExpand2(pattern, options) {
    return orig.braceExpand(pattern, ext(def, options));
  };
  m.match = function(list, pattern, options) {
    return orig.match(list, pattern, ext(def, options));
  };
  return m;
};
Minimatch$1.defaults = function(def) {
  return minimatch$1.defaults(def).Minimatch;
};
function minimatch$1(p, pattern, options) {
  assertValidPattern(pattern);
  if (!options) options = {};
  if (!options.nocomment && pattern.charAt(0) === "#") {
    return false;
  }
  return new Minimatch$1(pattern, options).match(p);
}
function Minimatch$1(pattern, options) {
  if (!(this instanceof Minimatch$1)) {
    return new Minimatch$1(pattern, options);
  }
  assertValidPattern(pattern);
  if (!options) options = {};
  pattern = pattern.trim();
  if (!options.allowWindowsEscape && path$6.sep !== "/") {
    pattern = pattern.split(path$6.sep).join("/");
  }
  this.options = options;
  this.maxGlobstarRecursion = options.maxGlobstarRecursion !== void 0 ? options.maxGlobstarRecursion : 200;
  this.set = [];
  this.pattern = pattern;
  this.regexp = null;
  this.negate = false;
  this.comment = false;
  this.empty = false;
  this.partial = !!options.partial;
  this.make();
}
Minimatch$1.prototype.debug = function() {
};
Minimatch$1.prototype.make = make;
function make() {
  var pattern = this.pattern;
  var options = this.options;
  if (!options.nocomment && pattern.charAt(0) === "#") {
    this.comment = true;
    return;
  }
  if (!pattern) {
    this.empty = true;
    return;
  }
  this.parseNegate();
  var set = this.globSet = this.braceExpand();
  if (options.debug) this.debug = function debug2() {
    console.error.apply(console, arguments);
  };
  this.debug(this.pattern, set);
  set = this.globParts = set.map(function(s) {
    return s.split(slashSplit);
  });
  this.debug(this.pattern, set);
  set = set.map(function(s, si, set2) {
    return s.map(this.parse, this);
  }, this);
  this.debug(this.pattern, set);
  set = set.filter(function(s) {
    return s.indexOf(false) === -1;
  });
  this.debug(this.pattern, set);
  this.set = set;
}
Minimatch$1.prototype.parseNegate = parseNegate;
function parseNegate() {
  var pattern = this.pattern;
  var negate = false;
  var options = this.options;
  var negateOffset = 0;
  if (options.nonegate) return;
  for (var i = 0, l = pattern.length; i < l && pattern.charAt(i) === "!"; i++) {
    negate = !negate;
    negateOffset++;
  }
  if (negateOffset) this.pattern = pattern.substr(negateOffset);
  this.negate = negate;
}
minimatch$1.braceExpand = function(pattern, options) {
  return braceExpand(pattern, options);
};
Minimatch$1.prototype.braceExpand = braceExpand;
function braceExpand(pattern, options) {
  if (!options) {
    if (this instanceof Minimatch$1) {
      options = this.options;
    } else {
      options = {};
    }
  }
  pattern = typeof pattern === "undefined" ? this.pattern : pattern;
  assertValidPattern(pattern);
  if (options.nobrace || !/\{(?:(?!\{).)*\}/.test(pattern)) {
    return [pattern];
  }
  return expand(pattern);
}
var MAX_PATTERN_LENGTH = 1024 * 64;
var assertValidPattern = function(pattern) {
  if (typeof pattern !== "string") {
    throw new TypeError("invalid pattern");
  }
  if (pattern.length > MAX_PATTERN_LENGTH) {
    throw new TypeError("pattern is too long");
  }
};
Minimatch$1.prototype.parse = parse;
var SUBPARSE = {};
function parse(pattern, isSub) {
  assertValidPattern(pattern);
  var options = this.options;
  if (pattern === "**") {
    if (!options.noglobstar)
      return GLOBSTAR;
    else
      pattern = "*";
  }
  if (pattern === "") return "";
  var re = "";
  var hasMagic = !!options.nocase;
  var escaping = false;
  var patternListStack = [];
  var negativeLists = [];
  var stateChar;
  var inClass = false;
  var reClassStart = -1;
  var classStart = -1;
  var patternStart = pattern.charAt(0) === "." ? "" : options.dot ? "(?!(?:^|\\/)\\.{1,2}(?:$|\\/))" : "(?!\\.)";
  var self2 = this;
  function clearStateChar() {
    if (stateChar) {
      switch (stateChar) {
        case "*":
          re += star;
          hasMagic = true;
          break;
        case "?":
          re += qmark;
          hasMagic = true;
          break;
        default:
          re += "\\" + stateChar;
          break;
      }
      self2.debug("clearStateChar %j %j", stateChar, re);
      stateChar = false;
    }
  }
  for (var i = 0, len = pattern.length, c; i < len && (c = pattern.charAt(i)); i++) {
    this.debug("%s	%s %s %j", pattern, i, re, c);
    if (escaping && reSpecials[c]) {
      re += "\\" + c;
      escaping = false;
      continue;
    }
    switch (c) {
      case "/": {
        return false;
      }
      case "\\":
        clearStateChar();
        escaping = true;
        continue;
      case "?":
      case "*":
      case "+":
      case "@":
      case "!":
        this.debug("%s	%s %s %j <-- stateChar", pattern, i, re, c);
        if (inClass) {
          this.debug("  in class");
          if (c === "!" && i === classStart + 1) c = "^";
          re += c;
          continue;
        }
        if (c === "*" && stateChar === "*") continue;
        self2.debug("call clearStateChar %j", stateChar);
        clearStateChar();
        stateChar = c;
        if (options.noext) clearStateChar();
        continue;
      case "(":
        if (inClass) {
          re += "(";
          continue;
        }
        if (!stateChar) {
          re += "\\(";
          continue;
        }
        patternListStack.push({
          type: stateChar,
          start: i - 1,
          reStart: re.length,
          open: plTypes[stateChar].open,
          close: plTypes[stateChar].close
        });
        re += stateChar === "!" ? "(?:(?!(?:" : "(?:";
        this.debug("plType %j %j", stateChar, re);
        stateChar = false;
        continue;
      case ")":
        if (inClass || !patternListStack.length) {
          re += "\\)";
          continue;
        }
        clearStateChar();
        hasMagic = true;
        var pl = patternListStack.pop();
        re += pl.close;
        if (pl.type === "!") {
          negativeLists.push(pl);
        }
        pl.reEnd = re.length;
        continue;
      case "|":
        if (inClass || !patternListStack.length || escaping) {
          re += "\\|";
          escaping = false;
          continue;
        }
        clearStateChar();
        re += "|";
        continue;
      case "[":
        clearStateChar();
        if (inClass) {
          re += "\\" + c;
          continue;
        }
        inClass = true;
        classStart = i;
        reClassStart = re.length;
        re += c;
        continue;
      case "]":
        if (i === classStart + 1 || !inClass) {
          re += "\\" + c;
          escaping = false;
          continue;
        }
        var cs = pattern.substring(classStart + 1, i);
        try {
          RegExp("[" + cs + "]");
        } catch (er) {
          var sp = this.parse(cs, SUBPARSE);
          re = re.substr(0, reClassStart) + "\\[" + sp[0] + "\\]";
          hasMagic = hasMagic || sp[1];
          inClass = false;
          continue;
        }
        hasMagic = true;
        inClass = false;
        re += c;
        continue;
      default:
        clearStateChar();
        if (escaping) {
          escaping = false;
        } else if (reSpecials[c] && !(c === "^" && inClass)) {
          re += "\\";
        }
        re += c;
    }
  }
  if (inClass) {
    cs = pattern.substr(classStart + 1);
    sp = this.parse(cs, SUBPARSE);
    re = re.substr(0, reClassStart) + "\\[" + sp[0];
    hasMagic = hasMagic || sp[1];
  }
  for (pl = patternListStack.pop(); pl; pl = patternListStack.pop()) {
    var tail = re.slice(pl.reStart + pl.open.length);
    this.debug("setting tail", re, pl);
    tail = tail.replace(/((?:\\{2}){0,64})(\\?)\|/g, function(_2, $1, $2) {
      if (!$2) {
        $2 = "\\";
      }
      return $1 + $1 + $2 + "|";
    });
    this.debug("tail=%j\n   %s", tail, tail, pl, re);
    var t = pl.type === "*" ? star : pl.type === "?" ? qmark : "\\" + pl.type;
    hasMagic = true;
    re = re.slice(0, pl.reStart) + t + "\\(" + tail;
  }
  clearStateChar();
  if (escaping) {
    re += "\\\\";
  }
  var addPatternStart = false;
  switch (re.charAt(0)) {
    case "[":
    case ".":
    case "(":
      addPatternStart = true;
  }
  for (var n = negativeLists.length - 1; n > -1; n--) {
    var nl = negativeLists[n];
    var nlBefore = re.slice(0, nl.reStart);
    var nlFirst = re.slice(nl.reStart, nl.reEnd - 8);
    var nlLast = re.slice(nl.reEnd - 8, nl.reEnd);
    var nlAfter = re.slice(nl.reEnd);
    nlLast += nlAfter;
    var openParensBefore = nlBefore.split("(").length - 1;
    var cleanAfter = nlAfter;
    for (i = 0; i < openParensBefore; i++) {
      cleanAfter = cleanAfter.replace(/\)[+*?]?/, "");
    }
    nlAfter = cleanAfter;
    var dollar = "";
    if (nlAfter === "" && isSub !== SUBPARSE) {
      dollar = "$";
    }
    var newRe = nlBefore + nlFirst + nlAfter + dollar + nlLast;
    re = newRe;
  }
  if (re !== "" && hasMagic) {
    re = "(?=.)" + re;
  }
  if (addPatternStart) {
    re = patternStart + re;
  }
  if (isSub === SUBPARSE) {
    return [re, hasMagic];
  }
  if (!hasMagic) {
    return globUnescape(pattern);
  }
  var flags = options.nocase ? "i" : "";
  try {
    var regExp = new RegExp("^" + re + "$", flags);
  } catch (er) {
    return new RegExp("$.");
  }
  regExp._glob = pattern;
  regExp._src = re;
  return regExp;
}
minimatch$1.makeRe = function(pattern, options) {
  return new Minimatch$1(pattern, options || {}).makeRe();
};
Minimatch$1.prototype.makeRe = makeRe;
function makeRe() {
  if (this.regexp || this.regexp === false) return this.regexp;
  var set = this.set;
  if (!set.length) {
    this.regexp = false;
    return this.regexp;
  }
  var options = this.options;
  var twoStar = options.noglobstar ? star : options.dot ? twoStarDot : twoStarNoDot;
  var flags = options.nocase ? "i" : "";
  var re = set.map(function(pattern) {
    return pattern.map(function(p) {
      return p === GLOBSTAR ? twoStar : typeof p === "string" ? regExpEscape(p) : p._src;
    }).join("\\/");
  }).join("|");
  re = "^(?:" + re + ")$";
  if (this.negate) re = "^(?!" + re + ").*$";
  try {
    this.regexp = new RegExp(re, flags);
  } catch (ex) {
    this.regexp = false;
  }
  return this.regexp;
}
minimatch$1.match = function(list, pattern, options) {
  options = options || {};
  var mm = new Minimatch$1(pattern, options);
  list = list.filter(function(f) {
    return mm.match(f);
  });
  if (mm.options.nonull && !list.length) {
    list.push(pattern);
  }
  return list;
};
Minimatch$1.prototype.match = function match(f, partial) {
  if (typeof partial === "undefined") partial = this.partial;
  this.debug("match", f, this.pattern);
  if (this.comment) return false;
  if (this.empty) return f === "";
  if (f === "/" && partial) return true;
  var options = this.options;
  if (path$6.sep !== "/") {
    f = f.split(path$6.sep).join("/");
  }
  f = f.split(slashSplit);
  this.debug(this.pattern, "split", f);
  var set = this.set;
  this.debug(this.pattern, "set", set);
  var filename;
  var i;
  for (i = f.length - 1; i >= 0; i--) {
    filename = f[i];
    if (filename) break;
  }
  for (i = 0; i < set.length; i++) {
    var pattern = set[i];
    var file2 = f;
    if (options.matchBase && pattern.length === 1) {
      file2 = [filename];
    }
    var hit = this.matchOne(file2, pattern, partial);
    if (hit) {
      if (options.flipNegate) return true;
      return !this.negate;
    }
  }
  if (options.flipNegate) return false;
  return this.negate;
};
Minimatch$1.prototype.matchOne = function(file2, pattern, partial) {
  if (pattern.indexOf(GLOBSTAR) !== -1) {
    return this._matchGlobstar(file2, pattern, partial, 0, 0);
  }
  return this._matchOne(file2, pattern, partial, 0, 0);
};
Minimatch$1.prototype._matchGlobstar = function(file2, pattern, partial, fileIndex, patternIndex) {
  var i;
  var firstgs = -1;
  for (i = patternIndex; i < pattern.length; i++) {
    if (pattern[i] === GLOBSTAR) {
      firstgs = i;
      break;
    }
  }
  var lastgs = -1;
  for (i = pattern.length - 1; i >= 0; i--) {
    if (pattern[i] === GLOBSTAR) {
      lastgs = i;
      break;
    }
  }
  var head = pattern.slice(patternIndex, firstgs);
  var body = partial ? pattern.slice(firstgs + 1) : pattern.slice(firstgs + 1, lastgs);
  var tail = partial ? [] : pattern.slice(lastgs + 1);
  if (head.length) {
    var fileHead = file2.slice(fileIndex, fileIndex + head.length);
    if (!this._matchOne(fileHead, head, partial, 0, 0)) {
      return false;
    }
    fileIndex += head.length;
  }
  var fileTailMatch = 0;
  if (tail.length) {
    if (tail.length + fileIndex > file2.length) return false;
    var tailStart = file2.length - tail.length;
    if (this._matchOne(file2, tail, partial, tailStart, 0)) {
      fileTailMatch = tail.length;
    } else {
      if (file2[file2.length - 1] !== "" || fileIndex + tail.length === file2.length) {
        return false;
      }
      tailStart--;
      if (!this._matchOne(file2, tail, partial, tailStart, 0)) {
        return false;
      }
      fileTailMatch = tail.length + 1;
    }
  }
  if (!body.length) {
    var sawSome = !!fileTailMatch;
    for (i = fileIndex; i < file2.length - fileTailMatch; i++) {
      var f = String(file2[i]);
      sawSome = true;
      if (f === "." || f === ".." || !this.options.dot && f.charAt(0) === ".") {
        return false;
      }
    }
    return partial || sawSome;
  }
  var bodySegments = [[[], 0]];
  var currentBody = bodySegments[0];
  var nonGsParts = 0;
  var nonGsPartsSums = [0];
  for (var bi = 0; bi < body.length; bi++) {
    var b = body[bi];
    if (b === GLOBSTAR) {
      nonGsPartsSums.push(nonGsParts);
      currentBody = [[], 0];
      bodySegments.push(currentBody);
    } else {
      currentBody[0].push(b);
      nonGsParts++;
    }
  }
  var idx = bodySegments.length - 1;
  var fileLength = file2.length - fileTailMatch;
  for (var si = 0; si < bodySegments.length; si++) {
    bodySegments[si][1] = fileLength - (nonGsPartsSums[idx--] + bodySegments[si][0].length);
  }
  return !!this._matchGlobStarBodySections(
    file2,
    bodySegments,
    fileIndex,
    0,
    partial,
    0,
    !!fileTailMatch
  );
};
Minimatch$1.prototype._matchGlobStarBodySections = function(file2, bodySegments, fileIndex, bodyIndex, partial, globStarDepth, sawTail) {
  var bs = bodySegments[bodyIndex];
  if (!bs) {
    for (var i = fileIndex; i < file2.length; i++) {
      sawTail = true;
      var f = file2[i];
      if (f === "." || f === ".." || !this.options.dot && f.charAt(0) === ".") {
        return false;
      }
    }
    return sawTail;
  }
  var body = bs[0];
  var after = bs[1];
  while (fileIndex <= after) {
    var m = this._matchOne(
      file2.slice(0, fileIndex + body.length),
      body,
      partial,
      fileIndex,
      0
    );
    if (m && globStarDepth < this.maxGlobstarRecursion) {
      var sub = this._matchGlobStarBodySections(
        file2,
        bodySegments,
        fileIndex + body.length,
        bodyIndex + 1,
        partial,
        globStarDepth + 1,
        sawTail
      );
      if (sub !== false) {
        return sub;
      }
    }
    var f = file2[fileIndex];
    if (f === "." || f === ".." || !this.options.dot && f.charAt(0) === ".") {
      return false;
    }
    fileIndex++;
  }
  return partial || null;
};
Minimatch$1.prototype._matchOne = function(file2, pattern, partial, fileIndex, patternIndex) {
  var fi, pi, fl, pl;
  for (fi = fileIndex, pi = patternIndex, fl = file2.length, pl = pattern.length; fi < fl && pi < pl; fi++, pi++) {
    this.debug("matchOne loop");
    var p = pattern[pi];
    var f = file2[fi];
    this.debug(pattern, p, f);
    if (p === false || p === GLOBSTAR) return false;
    var hit;
    if (typeof p === "string") {
      hit = f === p;
      this.debug("string match", p, f, hit);
    } else {
      hit = f.match(p);
      this.debug("pattern match", p, f, hit);
    }
    if (!hit) return false;
  }
  if (fi === fl && pi === pl) {
    return true;
  } else if (fi === fl) {
    return partial;
  } else if (pi === pl) {
    return fi === fl - 1 && file2[fi] === "";
  }
  throw new Error("wtf?");
};
function globUnescape(s) {
  return s.replace(/\\(.)/g, "$1");
}
function regExpEscape(s) {
  return s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}
var pathIsAbsolute = { exports: {} };
function posix(path2) {
  return path2.charAt(0) === "/";
}
function win32$1(path2) {
  var splitDeviceRe = /^([a-zA-Z]:|[\\\/]{2}[^\\\/]+[\\\/]+[^\\\/]+)?([\\\/])?([\s\S]*?)$/;
  var result = splitDeviceRe.exec(path2);
  var device = result[1] || "";
  var isUnc = Boolean(device && device.charAt(1) !== ":");
  return Boolean(result[2] || isUnc);
}
pathIsAbsolute.exports = process.platform === "win32" ? win32$1 : posix;
pathIsAbsolute.exports.posix = posix;
pathIsAbsolute.exports.win32 = win32$1;
var pathIsAbsoluteExports = pathIsAbsolute.exports;
var common = {};
common.setopts = setopts;
common.ownProp = ownProp;
common.makeAbs = makeAbs;
common.finish = finish;
common.mark = mark;
common.isIgnored = isIgnored;
common.childrenIgnored = childrenIgnored;
function ownProp(obj, field) {
  return Object.prototype.hasOwnProperty.call(obj, field);
}
var fs$5 = require$$0;
var path$5 = require$$1;
var minimatch = minimatch_1;
var isAbsolute = pathIsAbsoluteExports;
var Minimatch2 = minimatch.Minimatch;
function alphasort(a, b) {
  return a.localeCompare(b, "en");
}
function setupIgnores(self2, options) {
  self2.ignore = options.ignore || [];
  if (!Array.isArray(self2.ignore))
    self2.ignore = [self2.ignore];
  if (self2.ignore.length) {
    self2.ignore = self2.ignore.map(ignoreMap);
  }
}
function ignoreMap(pattern) {
  var gmatcher = null;
  if (pattern.slice(-3) === "/**") {
    var gpattern = pattern.replace(/(\/\*\*)+$/, "");
    gmatcher = new Minimatch2(gpattern, { dot: true });
  }
  return {
    matcher: new Minimatch2(pattern, { dot: true }),
    gmatcher
  };
}
function setopts(self2, pattern, options) {
  if (!options)
    options = {};
  if (options.matchBase && -1 === pattern.indexOf("/")) {
    if (options.noglobstar) {
      throw new Error("base matching requires globstar");
    }
    pattern = "**/" + pattern;
  }
  self2.silent = !!options.silent;
  self2.pattern = pattern;
  self2.strict = options.strict !== false;
  self2.realpath = !!options.realpath;
  self2.realpathCache = options.realpathCache || /* @__PURE__ */ Object.create(null);
  self2.follow = !!options.follow;
  self2.dot = !!options.dot;
  self2.mark = !!options.mark;
  self2.nodir = !!options.nodir;
  if (self2.nodir)
    self2.mark = true;
  self2.sync = !!options.sync;
  self2.nounique = !!options.nounique;
  self2.nonull = !!options.nonull;
  self2.nosort = !!options.nosort;
  self2.nocase = !!options.nocase;
  self2.stat = !!options.stat;
  self2.noprocess = !!options.noprocess;
  self2.absolute = !!options.absolute;
  self2.fs = options.fs || fs$5;
  self2.maxLength = options.maxLength || Infinity;
  self2.cache = options.cache || /* @__PURE__ */ Object.create(null);
  self2.statCache = options.statCache || /* @__PURE__ */ Object.create(null);
  self2.symlinks = options.symlinks || /* @__PURE__ */ Object.create(null);
  setupIgnores(self2, options);
  self2.changedCwd = false;
  var cwd2 = process.cwd();
  if (!ownProp(options, "cwd"))
    self2.cwd = cwd2;
  else {
    self2.cwd = path$5.resolve(options.cwd);
    self2.changedCwd = self2.cwd !== cwd2;
  }
  self2.root = options.root || path$5.resolve(self2.cwd, "/");
  self2.root = path$5.resolve(self2.root);
  if (process.platform === "win32")
    self2.root = self2.root.replace(/\\/g, "/");
  self2.cwdAbs = isAbsolute(self2.cwd) ? self2.cwd : makeAbs(self2, self2.cwd);
  if (process.platform === "win32")
    self2.cwdAbs = self2.cwdAbs.replace(/\\/g, "/");
  self2.nomount = !!options.nomount;
  options.nonegate = true;
  options.nocomment = true;
  options.allowWindowsEscape = false;
  self2.minimatch = new Minimatch2(pattern, options);
  self2.options = self2.minimatch.options;
}
function finish(self2) {
  var nou = self2.nounique;
  var all = nou ? [] : /* @__PURE__ */ Object.create(null);
  for (var i = 0, l = self2.matches.length; i < l; i++) {
    var matches = self2.matches[i];
    if (!matches || Object.keys(matches).length === 0) {
      if (self2.nonull) {
        var literal = self2.minimatch.globSet[i];
        if (nou)
          all.push(literal);
        else
          all[literal] = true;
      }
    } else {
      var m = Object.keys(matches);
      if (nou)
        all.push.apply(all, m);
      else
        m.forEach(function(m2) {
          all[m2] = true;
        });
    }
  }
  if (!nou)
    all = Object.keys(all);
  if (!self2.nosort)
    all = all.sort(alphasort);
  if (self2.mark) {
    for (var i = 0; i < all.length; i++) {
      all[i] = self2._mark(all[i]);
    }
    if (self2.nodir) {
      all = all.filter(function(e) {
        var notDir = !/\/$/.test(e);
        var c = self2.cache[e] || self2.cache[makeAbs(self2, e)];
        if (notDir && c)
          notDir = c !== "DIR" && !Array.isArray(c);
        return notDir;
      });
    }
  }
  if (self2.ignore.length)
    all = all.filter(function(m2) {
      return !isIgnored(self2, m2);
    });
  self2.found = all;
}
function mark(self2, p) {
  var abs = makeAbs(self2, p);
  var c = self2.cache[abs];
  var m = p;
  if (c) {
    var isDir = c === "DIR" || Array.isArray(c);
    var slash = p.slice(-1) === "/";
    if (isDir && !slash)
      m += "/";
    else if (!isDir && slash)
      m = m.slice(0, -1);
    if (m !== p) {
      var mabs = makeAbs(self2, m);
      self2.statCache[mabs] = self2.statCache[abs];
      self2.cache[mabs] = self2.cache[abs];
    }
  }
  return m;
}
function makeAbs(self2, f) {
  var abs = f;
  if (f.charAt(0) === "/") {
    abs = path$5.join(self2.root, f);
  } else if (isAbsolute(f) || f === "") {
    abs = f;
  } else if (self2.changedCwd) {
    abs = path$5.resolve(self2.cwd, f);
  } else {
    abs = path$5.resolve(f);
  }
  if (process.platform === "win32")
    abs = abs.replace(/\\/g, "/");
  return abs;
}
function isIgnored(self2, path2) {
  if (!self2.ignore.length)
    return false;
  return self2.ignore.some(function(item) {
    return item.matcher.match(path2) || !!(item.gmatcher && item.gmatcher.match(path2));
  });
}
function childrenIgnored(self2, path2) {
  if (!self2.ignore.length)
    return false;
  return self2.ignore.some(function(item) {
    return !!(item.gmatcher && item.gmatcher.match(path2));
  });
}
var sync;
var hasRequiredSync;
function requireSync() {
  if (hasRequiredSync) return sync;
  hasRequiredSync = 1;
  sync = globSync;
  globSync.GlobSync = GlobSync;
  var rp = fs_realpath;
  var minimatch2 = minimatch_1;
  minimatch2.Minimatch;
  requireGlob().Glob;
  var path2 = require$$1;
  var assert = require$$5;
  var isAbsolute2 = pathIsAbsoluteExports;
  var common$1 = common;
  var setopts2 = common$1.setopts;
  var ownProp2 = common$1.ownProp;
  var childrenIgnored2 = common$1.childrenIgnored;
  var isIgnored2 = common$1.isIgnored;
  function globSync(pattern, options) {
    if (typeof options === "function" || arguments.length === 3)
      throw new TypeError("callback provided to sync glob\nSee: https://github.com/isaacs/node-glob/issues/167");
    return new GlobSync(pattern, options).found;
  }
  function GlobSync(pattern, options) {
    if (!pattern)
      throw new Error("must provide pattern");
    if (typeof options === "function" || arguments.length === 3)
      throw new TypeError("callback provided to sync glob\nSee: https://github.com/isaacs/node-glob/issues/167");
    if (!(this instanceof GlobSync))
      return new GlobSync(pattern, options);
    setopts2(this, pattern, options);
    if (this.noprocess)
      return this;
    var n = this.minimatch.set.length;
    this.matches = new Array(n);
    for (var i = 0; i < n; i++) {
      this._process(this.minimatch.set[i], i, false);
    }
    this._finish();
  }
  GlobSync.prototype._finish = function() {
    assert.ok(this instanceof GlobSync);
    if (this.realpath) {
      var self2 = this;
      this.matches.forEach(function(matchset, index2) {
        var set = self2.matches[index2] = /* @__PURE__ */ Object.create(null);
        for (var p in matchset) {
          try {
            p = self2._makeAbs(p);
            var real = rp.realpathSync(p, self2.realpathCache);
            set[real] = true;
          } catch (er) {
            if (er.syscall === "stat")
              set[self2._makeAbs(p)] = true;
            else
              throw er;
          }
        }
      });
    }
    common$1.finish(this);
  };
  GlobSync.prototype._process = function(pattern, index2, inGlobStar) {
    assert.ok(this instanceof GlobSync);
    var n = 0;
    while (typeof pattern[n] === "string") {
      n++;
    }
    var prefix;
    switch (n) {
      case pattern.length:
        this._processSimple(pattern.join("/"), index2);
        return;
      case 0:
        prefix = null;
        break;
      default:
        prefix = pattern.slice(0, n).join("/");
        break;
    }
    var remain = pattern.slice(n);
    var read;
    if (prefix === null)
      read = ".";
    else if (isAbsolute2(prefix) || isAbsolute2(pattern.map(function(p) {
      return typeof p === "string" ? p : "[*]";
    }).join("/"))) {
      if (!prefix || !isAbsolute2(prefix))
        prefix = "/" + prefix;
      read = prefix;
    } else
      read = prefix;
    var abs = this._makeAbs(read);
    if (childrenIgnored2(this, read))
      return;
    var isGlobStar = remain[0] === minimatch2.GLOBSTAR;
    if (isGlobStar)
      this._processGlobStar(prefix, read, abs, remain, index2, inGlobStar);
    else
      this._processReaddir(prefix, read, abs, remain, index2, inGlobStar);
  };
  GlobSync.prototype._processReaddir = function(prefix, read, abs, remain, index2, inGlobStar) {
    var entries = this._readdir(abs, inGlobStar);
    if (!entries)
      return;
    var pn = remain[0];
    var negate = !!this.minimatch.negate;
    var rawGlob = pn._glob;
    var dotOk = this.dot || rawGlob.charAt(0) === ".";
    var matchedEntries = [];
    for (var i = 0; i < entries.length; i++) {
      var e = entries[i];
      if (e.charAt(0) !== "." || dotOk) {
        var m;
        if (negate && !prefix) {
          m = !e.match(pn);
        } else {
          m = e.match(pn);
        }
        if (m)
          matchedEntries.push(e);
      }
    }
    var len = matchedEntries.length;
    if (len === 0)
      return;
    if (remain.length === 1 && !this.mark && !this.stat) {
      if (!this.matches[index2])
        this.matches[index2] = /* @__PURE__ */ Object.create(null);
      for (var i = 0; i < len; i++) {
        var e = matchedEntries[i];
        if (prefix) {
          if (prefix.slice(-1) !== "/")
            e = prefix + "/" + e;
          else
            e = prefix + e;
        }
        if (e.charAt(0) === "/" && !this.nomount) {
          e = path2.join(this.root, e);
        }
        this._emitMatch(index2, e);
      }
      return;
    }
    remain.shift();
    for (var i = 0; i < len; i++) {
      var e = matchedEntries[i];
      var newPattern;
      if (prefix)
        newPattern = [prefix, e];
      else
        newPattern = [e];
      this._process(newPattern.concat(remain), index2, inGlobStar);
    }
  };
  GlobSync.prototype._emitMatch = function(index2, e) {
    if (isIgnored2(this, e))
      return;
    var abs = this._makeAbs(e);
    if (this.mark)
      e = this._mark(e);
    if (this.absolute) {
      e = abs;
    }
    if (this.matches[index2][e])
      return;
    if (this.nodir) {
      var c = this.cache[abs];
      if (c === "DIR" || Array.isArray(c))
        return;
    }
    this.matches[index2][e] = true;
    if (this.stat)
      this._stat(e);
  };
  GlobSync.prototype._readdirInGlobStar = function(abs) {
    if (this.follow)
      return this._readdir(abs, false);
    var entries;
    var lstat;
    try {
      lstat = this.fs.lstatSync(abs);
    } catch (er) {
      if (er.code === "ENOENT") {
        return null;
      }
    }
    var isSym = lstat && lstat.isSymbolicLink();
    this.symlinks[abs] = isSym;
    if (!isSym && lstat && !lstat.isDirectory())
      this.cache[abs] = "FILE";
    else
      entries = this._readdir(abs, false);
    return entries;
  };
  GlobSync.prototype._readdir = function(abs, inGlobStar) {
    if (inGlobStar && !ownProp2(this.symlinks, abs))
      return this._readdirInGlobStar(abs);
    if (ownProp2(this.cache, abs)) {
      var c = this.cache[abs];
      if (!c || c === "FILE")
        return null;
      if (Array.isArray(c))
        return c;
    }
    try {
      return this._readdirEntries(abs, this.fs.readdirSync(abs));
    } catch (er) {
      this._readdirError(abs, er);
      return null;
    }
  };
  GlobSync.prototype._readdirEntries = function(abs, entries) {
    if (!this.mark && !this.stat) {
      for (var i = 0; i < entries.length; i++) {
        var e = entries[i];
        if (abs === "/")
          e = abs + e;
        else
          e = abs + "/" + e;
        this.cache[e] = true;
      }
    }
    this.cache[abs] = entries;
    return entries;
  };
  GlobSync.prototype._readdirError = function(f, er) {
    switch (er.code) {
      case "ENOTSUP":
      case "ENOTDIR":
        var abs = this._makeAbs(f);
        this.cache[abs] = "FILE";
        if (abs === this.cwdAbs) {
          var error2 = new Error(er.code + " invalid cwd " + this.cwd);
          error2.path = this.cwd;
          error2.code = er.code;
          throw error2;
        }
        break;
      case "ENOENT":
      case "ELOOP":
      case "ENAMETOOLONG":
      case "UNKNOWN":
        this.cache[this._makeAbs(f)] = false;
        break;
      default:
        this.cache[this._makeAbs(f)] = false;
        if (this.strict)
          throw er;
        if (!this.silent)
          console.error("glob error", er);
        break;
    }
  };
  GlobSync.prototype._processGlobStar = function(prefix, read, abs, remain, index2, inGlobStar) {
    var entries = this._readdir(abs, inGlobStar);
    if (!entries)
      return;
    var remainWithoutGlobStar = remain.slice(1);
    var gspref = prefix ? [prefix] : [];
    var noGlobStar = gspref.concat(remainWithoutGlobStar);
    this._process(noGlobStar, index2, false);
    var len = entries.length;
    var isSym = this.symlinks[abs];
    if (isSym && inGlobStar)
      return;
    for (var i = 0; i < len; i++) {
      var e = entries[i];
      if (e.charAt(0) === "." && !this.dot)
        continue;
      var instead = gspref.concat(entries[i], remainWithoutGlobStar);
      this._process(instead, index2, true);
      var below = gspref.concat(entries[i], remain);
      this._process(below, index2, true);
    }
  };
  GlobSync.prototype._processSimple = function(prefix, index2) {
    var exists = this._stat(prefix);
    if (!this.matches[index2])
      this.matches[index2] = /* @__PURE__ */ Object.create(null);
    if (!exists)
      return;
    if (prefix && isAbsolute2(prefix) && !this.nomount) {
      var trail = /[\/\\]$/.test(prefix);
      if (prefix.charAt(0) === "/") {
        prefix = path2.join(this.root, prefix);
      } else {
        prefix = path2.resolve(this.root, prefix);
        if (trail)
          prefix += "/";
      }
    }
    if (process.platform === "win32")
      prefix = prefix.replace(/\\/g, "/");
    this._emitMatch(index2, prefix);
  };
  GlobSync.prototype._stat = function(f) {
    var abs = this._makeAbs(f);
    var needDir = f.slice(-1) === "/";
    if (f.length > this.maxLength)
      return false;
    if (!this.stat && ownProp2(this.cache, abs)) {
      var c = this.cache[abs];
      if (Array.isArray(c))
        c = "DIR";
      if (!needDir || c === "DIR")
        return c;
      if (needDir && c === "FILE")
        return false;
    }
    var stat2 = this.statCache[abs];
    if (!stat2) {
      var lstat;
      try {
        lstat = this.fs.lstatSync(abs);
      } catch (er) {
        if (er && (er.code === "ENOENT" || er.code === "ENOTDIR")) {
          this.statCache[abs] = false;
          return false;
        }
      }
      if (lstat && lstat.isSymbolicLink()) {
        try {
          stat2 = this.fs.statSync(abs);
        } catch (er) {
          stat2 = lstat;
        }
      } else {
        stat2 = lstat;
      }
    }
    this.statCache[abs] = stat2;
    var c = true;
    if (stat2)
      c = stat2.isDirectory() ? "DIR" : "FILE";
    this.cache[abs] = this.cache[abs] || c;
    if (needDir && c === "FILE")
      return false;
    return c;
  };
  GlobSync.prototype._mark = function(p) {
    return common$1.mark(this, p);
  };
  GlobSync.prototype._makeAbs = function(f) {
    return common$1.makeAbs(this, f);
  };
  return sync;
}
var wrappy_1 = wrappy$2;
function wrappy$2(fn, cb) {
  if (fn && cb) return wrappy$2(fn)(cb);
  if (typeof fn !== "function")
    throw new TypeError("need wrapper function");
  Object.keys(fn).forEach(function(k) {
    wrapper[k] = fn[k];
  });
  return wrapper;
  function wrapper() {
    var args = new Array(arguments.length);
    for (var i = 0; i < args.length; i++) {
      args[i] = arguments[i];
    }
    var ret = fn.apply(this, args);
    var cb2 = args[args.length - 1];
    if (typeof ret === "function" && ret !== cb2) {
      Object.keys(cb2).forEach(function(k) {
        ret[k] = cb2[k];
      });
    }
    return ret;
  }
}
var once$3 = { exports: {} };
var wrappy$1 = wrappy_1;
once$3.exports = wrappy$1(once$2);
once$3.exports.strict = wrappy$1(onceStrict);
once$2.proto = once$2(function() {
  Object.defineProperty(Function.prototype, "once", {
    value: function() {
      return once$2(this);
    },
    configurable: true
  });
  Object.defineProperty(Function.prototype, "onceStrict", {
    value: function() {
      return onceStrict(this);
    },
    configurable: true
  });
});
function once$2(fn) {
  var f = function() {
    if (f.called) return f.value;
    f.called = true;
    return f.value = fn.apply(this, arguments);
  };
  f.called = false;
  return f;
}
function onceStrict(fn) {
  var f = function() {
    if (f.called)
      throw new Error(f.onceError);
    f.called = true;
    return f.value = fn.apply(this, arguments);
  };
  var name = fn.name || "Function wrapped with `once`";
  f.onceError = name + " shouldn't be called more than once";
  f.called = false;
  return f;
}
var onceExports = once$3.exports;
var wrappy = wrappy_1;
var reqs = /* @__PURE__ */ Object.create(null);
var once$1 = onceExports;
var inflight_1 = wrappy(inflight);
function inflight(key, cb) {
  if (reqs[key]) {
    reqs[key].push(cb);
    return null;
  } else {
    reqs[key] = [cb];
    return makeres(key);
  }
}
function makeres(key) {
  return once$1(function RES() {
    var cbs = reqs[key];
    var len = cbs.length;
    var args = slice(arguments);
    try {
      for (var i = 0; i < len; i++) {
        cbs[i].apply(null, args);
      }
    } finally {
      if (cbs.length > len) {
        cbs.splice(0, len);
        process.nextTick(function() {
          RES.apply(null, args);
        });
      } else {
        delete reqs[key];
      }
    }
  });
}
function slice(args) {
  var length = args.length;
  var array = [];
  for (var i = 0; i < length; i++) array[i] = args[i];
  return array;
}
var glob_1;
var hasRequiredGlob;
function requireGlob() {
  if (hasRequiredGlob) return glob_1;
  hasRequiredGlob = 1;
  glob_1 = glob2;
  var rp = fs_realpath;
  var minimatch2 = minimatch_1;
  minimatch2.Minimatch;
  var inherits2 = inheritsExports;
  var EE = require$$2$1.EventEmitter;
  var path2 = require$$1;
  var assert = require$$5;
  var isAbsolute2 = pathIsAbsoluteExports;
  var globSync = requireSync();
  var common$1 = common;
  var setopts2 = common$1.setopts;
  var ownProp2 = common$1.ownProp;
  var inflight2 = inflight_1;
  var childrenIgnored2 = common$1.childrenIgnored;
  var isIgnored2 = common$1.isIgnored;
  var once2 = onceExports;
  function glob2(pattern, options, cb) {
    if (typeof options === "function") cb = options, options = {};
    if (!options) options = {};
    if (options.sync) {
      if (cb)
        throw new TypeError("callback provided to sync glob");
      return globSync(pattern, options);
    }
    return new Glob(pattern, options, cb);
  }
  glob2.sync = globSync;
  var GlobSync = glob2.GlobSync = globSync.GlobSync;
  glob2.glob = glob2;
  function extend(origin, add) {
    if (add === null || typeof add !== "object") {
      return origin;
    }
    var keys = Object.keys(add);
    var i = keys.length;
    while (i--) {
      origin[keys[i]] = add[keys[i]];
    }
    return origin;
  }
  glob2.hasMagic = function(pattern, options_) {
    var options = extend({}, options_);
    options.noprocess = true;
    var g = new Glob(pattern, options);
    var set = g.minimatch.set;
    if (!pattern)
      return false;
    if (set.length > 1)
      return true;
    for (var j = 0; j < set[0].length; j++) {
      if (typeof set[0][j] !== "string")
        return true;
    }
    return false;
  };
  glob2.Glob = Glob;
  inherits2(Glob, EE);
  function Glob(pattern, options, cb) {
    if (typeof options === "function") {
      cb = options;
      options = null;
    }
    if (options && options.sync) {
      if (cb)
        throw new TypeError("callback provided to sync glob");
      return new GlobSync(pattern, options);
    }
    if (!(this instanceof Glob))
      return new Glob(pattern, options, cb);
    setopts2(this, pattern, options);
    this._didRealPath = false;
    var n = this.minimatch.set.length;
    this.matches = new Array(n);
    if (typeof cb === "function") {
      cb = once2(cb);
      this.on("error", cb);
      this.on("end", function(matches) {
        cb(null, matches);
      });
    }
    var self2 = this;
    this._processing = 0;
    this._emitQueue = [];
    this._processQueue = [];
    this.paused = false;
    if (this.noprocess)
      return this;
    if (n === 0)
      return done();
    var sync2 = true;
    for (var i = 0; i < n; i++) {
      this._process(this.minimatch.set[i], i, false, done);
    }
    sync2 = false;
    function done() {
      --self2._processing;
      if (self2._processing <= 0) {
        if (sync2) {
          process.nextTick(function() {
            self2._finish();
          });
        } else {
          self2._finish();
        }
      }
    }
  }
  Glob.prototype._finish = function() {
    assert(this instanceof Glob);
    if (this.aborted)
      return;
    if (this.realpath && !this._didRealpath)
      return this._realpath();
    common$1.finish(this);
    this.emit("end", this.found);
  };
  Glob.prototype._realpath = function() {
    if (this._didRealpath)
      return;
    this._didRealpath = true;
    var n = this.matches.length;
    if (n === 0)
      return this._finish();
    var self2 = this;
    for (var i = 0; i < this.matches.length; i++)
      this._realpathSet(i, next);
    function next() {
      if (--n === 0)
        self2._finish();
    }
  };
  Glob.prototype._realpathSet = function(index2, cb) {
    var matchset = this.matches[index2];
    if (!matchset)
      return cb();
    var found = Object.keys(matchset);
    var self2 = this;
    var n = found.length;
    if (n === 0)
      return cb();
    var set = this.matches[index2] = /* @__PURE__ */ Object.create(null);
    found.forEach(function(p, i) {
      p = self2._makeAbs(p);
      rp.realpath(p, self2.realpathCache, function(er, real) {
        if (!er)
          set[real] = true;
        else if (er.syscall === "stat")
          set[p] = true;
        else
          self2.emit("error", er);
        if (--n === 0) {
          self2.matches[index2] = set;
          cb();
        }
      });
    });
  };
  Glob.prototype._mark = function(p) {
    return common$1.mark(this, p);
  };
  Glob.prototype._makeAbs = function(f) {
    return common$1.makeAbs(this, f);
  };
  Glob.prototype.abort = function() {
    this.aborted = true;
    this.emit("abort");
  };
  Glob.prototype.pause = function() {
    if (!this.paused) {
      this.paused = true;
      this.emit("pause");
    }
  };
  Glob.prototype.resume = function() {
    if (this.paused) {
      this.emit("resume");
      this.paused = false;
      if (this._emitQueue.length) {
        var eq2 = this._emitQueue.slice(0);
        this._emitQueue.length = 0;
        for (var i = 0; i < eq2.length; i++) {
          var e = eq2[i];
          this._emitMatch(e[0], e[1]);
        }
      }
      if (this._processQueue.length) {
        var pq = this._processQueue.slice(0);
        this._processQueue.length = 0;
        for (var i = 0; i < pq.length; i++) {
          var p = pq[i];
          this._processing--;
          this._process(p[0], p[1], p[2], p[3]);
        }
      }
    }
  };
  Glob.prototype._process = function(pattern, index2, inGlobStar, cb) {
    assert(this instanceof Glob);
    assert(typeof cb === "function");
    if (this.aborted)
      return;
    this._processing++;
    if (this.paused) {
      this._processQueue.push([pattern, index2, inGlobStar, cb]);
      return;
    }
    var n = 0;
    while (typeof pattern[n] === "string") {
      n++;
    }
    var prefix;
    switch (n) {
      case pattern.length:
        this._processSimple(pattern.join("/"), index2, cb);
        return;
      case 0:
        prefix = null;
        break;
      default:
        prefix = pattern.slice(0, n).join("/");
        break;
    }
    var remain = pattern.slice(n);
    var read;
    if (prefix === null)
      read = ".";
    else if (isAbsolute2(prefix) || isAbsolute2(pattern.map(function(p) {
      return typeof p === "string" ? p : "[*]";
    }).join("/"))) {
      if (!prefix || !isAbsolute2(prefix))
        prefix = "/" + prefix;
      read = prefix;
    } else
      read = prefix;
    var abs = this._makeAbs(read);
    if (childrenIgnored2(this, read))
      return cb();
    var isGlobStar = remain[0] === minimatch2.GLOBSTAR;
    if (isGlobStar)
      this._processGlobStar(prefix, read, abs, remain, index2, inGlobStar, cb);
    else
      this._processReaddir(prefix, read, abs, remain, index2, inGlobStar, cb);
  };
  Glob.prototype._processReaddir = function(prefix, read, abs, remain, index2, inGlobStar, cb) {
    var self2 = this;
    this._readdir(abs, inGlobStar, function(er, entries) {
      return self2._processReaddir2(prefix, read, abs, remain, index2, inGlobStar, entries, cb);
    });
  };
  Glob.prototype._processReaddir2 = function(prefix, read, abs, remain, index2, inGlobStar, entries, cb) {
    if (!entries)
      return cb();
    var pn = remain[0];
    var negate = !!this.minimatch.negate;
    var rawGlob = pn._glob;
    var dotOk = this.dot || rawGlob.charAt(0) === ".";
    var matchedEntries = [];
    for (var i = 0; i < entries.length; i++) {
      var e = entries[i];
      if (e.charAt(0) !== "." || dotOk) {
        var m;
        if (negate && !prefix) {
          m = !e.match(pn);
        } else {
          m = e.match(pn);
        }
        if (m)
          matchedEntries.push(e);
      }
    }
    var len = matchedEntries.length;
    if (len === 0)
      return cb();
    if (remain.length === 1 && !this.mark && !this.stat) {
      if (!this.matches[index2])
        this.matches[index2] = /* @__PURE__ */ Object.create(null);
      for (var i = 0; i < len; i++) {
        var e = matchedEntries[i];
        if (prefix) {
          if (prefix !== "/")
            e = prefix + "/" + e;
          else
            e = prefix + e;
        }
        if (e.charAt(0) === "/" && !this.nomount) {
          e = path2.join(this.root, e);
        }
        this._emitMatch(index2, e);
      }
      return cb();
    }
    remain.shift();
    for (var i = 0; i < len; i++) {
      var e = matchedEntries[i];
      if (prefix) {
        if (prefix !== "/")
          e = prefix + "/" + e;
        else
          e = prefix + e;
      }
      this._process([e].concat(remain), index2, inGlobStar, cb);
    }
    cb();
  };
  Glob.prototype._emitMatch = function(index2, e) {
    if (this.aborted)
      return;
    if (isIgnored2(this, e))
      return;
    if (this.paused) {
      this._emitQueue.push([index2, e]);
      return;
    }
    var abs = isAbsolute2(e) ? e : this._makeAbs(e);
    if (this.mark)
      e = this._mark(e);
    if (this.absolute)
      e = abs;
    if (this.matches[index2][e])
      return;
    if (this.nodir) {
      var c = this.cache[abs];
      if (c === "DIR" || Array.isArray(c))
        return;
    }
    this.matches[index2][e] = true;
    var st = this.statCache[abs];
    if (st)
      this.emit("stat", e, st);
    this.emit("match", e);
  };
  Glob.prototype._readdirInGlobStar = function(abs, cb) {
    if (this.aborted)
      return;
    if (this.follow)
      return this._readdir(abs, false, cb);
    var lstatkey = "lstat\0" + abs;
    var self2 = this;
    var lstatcb = inflight2(lstatkey, lstatcb_);
    if (lstatcb)
      self2.fs.lstat(abs, lstatcb);
    function lstatcb_(er, lstat) {
      if (er && er.code === "ENOENT")
        return cb();
      var isSym = lstat && lstat.isSymbolicLink();
      self2.symlinks[abs] = isSym;
      if (!isSym && lstat && !lstat.isDirectory()) {
        self2.cache[abs] = "FILE";
        cb();
      } else
        self2._readdir(abs, false, cb);
    }
  };
  Glob.prototype._readdir = function(abs, inGlobStar, cb) {
    if (this.aborted)
      return;
    cb = inflight2("readdir\0" + abs + "\0" + inGlobStar, cb);
    if (!cb)
      return;
    if (inGlobStar && !ownProp2(this.symlinks, abs))
      return this._readdirInGlobStar(abs, cb);
    if (ownProp2(this.cache, abs)) {
      var c = this.cache[abs];
      if (!c || c === "FILE")
        return cb();
      if (Array.isArray(c))
        return cb(null, c);
    }
    var self2 = this;
    self2.fs.readdir(abs, readdirCb(this, abs, cb));
  };
  function readdirCb(self2, abs, cb) {
    return function(er, entries) {
      if (er)
        self2._readdirError(abs, er, cb);
      else
        self2._readdirEntries(abs, entries, cb);
    };
  }
  Glob.prototype._readdirEntries = function(abs, entries, cb) {
    if (this.aborted)
      return;
    if (!this.mark && !this.stat) {
      for (var i = 0; i < entries.length; i++) {
        var e = entries[i];
        if (abs === "/")
          e = abs + e;
        else
          e = abs + "/" + e;
        this.cache[e] = true;
      }
    }
    this.cache[abs] = entries;
    return cb(null, entries);
  };
  Glob.prototype._readdirError = function(f, er, cb) {
    if (this.aborted)
      return;
    switch (er.code) {
      case "ENOTSUP":
      case "ENOTDIR":
        var abs = this._makeAbs(f);
        this.cache[abs] = "FILE";
        if (abs === this.cwdAbs) {
          var error2 = new Error(er.code + " invalid cwd " + this.cwd);
          error2.path = this.cwd;
          error2.code = er.code;
          this.emit("error", error2);
          this.abort();
        }
        break;
      case "ENOENT":
      case "ELOOP":
      case "ENAMETOOLONG":
      case "UNKNOWN":
        this.cache[this._makeAbs(f)] = false;
        break;
      default:
        this.cache[this._makeAbs(f)] = false;
        if (this.strict) {
          this.emit("error", er);
          this.abort();
        }
        if (!this.silent)
          console.error("glob error", er);
        break;
    }
    return cb();
  };
  Glob.prototype._processGlobStar = function(prefix, read, abs, remain, index2, inGlobStar, cb) {
    var self2 = this;
    this._readdir(abs, inGlobStar, function(er, entries) {
      self2._processGlobStar2(prefix, read, abs, remain, index2, inGlobStar, entries, cb);
    });
  };
  Glob.prototype._processGlobStar2 = function(prefix, read, abs, remain, index2, inGlobStar, entries, cb) {
    if (!entries)
      return cb();
    var remainWithoutGlobStar = remain.slice(1);
    var gspref = prefix ? [prefix] : [];
    var noGlobStar = gspref.concat(remainWithoutGlobStar);
    this._process(noGlobStar, index2, false, cb);
    var isSym = this.symlinks[abs];
    var len = entries.length;
    if (isSym && inGlobStar)
      return cb();
    for (var i = 0; i < len; i++) {
      var e = entries[i];
      if (e.charAt(0) === "." && !this.dot)
        continue;
      var instead = gspref.concat(entries[i], remainWithoutGlobStar);
      this._process(instead, index2, true, cb);
      var below = gspref.concat(entries[i], remain);
      this._process(below, index2, true, cb);
    }
    cb();
  };
  Glob.prototype._processSimple = function(prefix, index2, cb) {
    var self2 = this;
    this._stat(prefix, function(er, exists) {
      self2._processSimple2(prefix, index2, er, exists, cb);
    });
  };
  Glob.prototype._processSimple2 = function(prefix, index2, er, exists, cb) {
    if (!this.matches[index2])
      this.matches[index2] = /* @__PURE__ */ Object.create(null);
    if (!exists)
      return cb();
    if (prefix && isAbsolute2(prefix) && !this.nomount) {
      var trail = /[\/\\]$/.test(prefix);
      if (prefix.charAt(0) === "/") {
        prefix = path2.join(this.root, prefix);
      } else {
        prefix = path2.resolve(this.root, prefix);
        if (trail)
          prefix += "/";
      }
    }
    if (process.platform === "win32")
      prefix = prefix.replace(/\\/g, "/");
    this._emitMatch(index2, prefix);
    cb();
  };
  Glob.prototype._stat = function(f, cb) {
    var abs = this._makeAbs(f);
    var needDir = f.slice(-1) === "/";
    if (f.length > this.maxLength)
      return cb();
    if (!this.stat && ownProp2(this.cache, abs)) {
      var c = this.cache[abs];
      if (Array.isArray(c))
        c = "DIR";
      if (!needDir || c === "DIR")
        return cb(null, c);
      if (needDir && c === "FILE")
        return cb();
    }
    var stat2 = this.statCache[abs];
    if (stat2 !== void 0) {
      if (stat2 === false)
        return cb(null, stat2);
      else {
        var type = stat2.isDirectory() ? "DIR" : "FILE";
        if (needDir && type === "FILE")
          return cb();
        else
          return cb(null, type, stat2);
      }
    }
    var self2 = this;
    var statcb = inflight2("stat\0" + abs, lstatcb_);
    if (statcb)
      self2.fs.lstat(abs, statcb);
    function lstatcb_(er, lstat) {
      if (lstat && lstat.isSymbolicLink()) {
        return self2.fs.stat(abs, function(er2, stat3) {
          if (er2)
            self2._stat2(f, abs, null, lstat, cb);
          else
            self2._stat2(f, abs, er2, stat3, cb);
        });
      } else {
        self2._stat2(f, abs, er, lstat, cb);
      }
    }
  };
  Glob.prototype._stat2 = function(f, abs, er, stat2, cb) {
    if (er && (er.code === "ENOENT" || er.code === "ENOTDIR")) {
      this.statCache[abs] = false;
      return cb();
    }
    var needDir = f.slice(-1) === "/";
    this.statCache[abs] = stat2;
    if (abs.slice(-1) === "/" && stat2 && !stat2.isDirectory())
      return cb(null, false, stat2);
    var c = true;
    if (stat2)
      c = stat2.isDirectory() ? "DIR" : "FILE";
    this.cache[abs] = this.cache[abs] || c;
    if (needDir && c === "FILE")
      return cb();
    return cb(null, c, stat2);
  };
  return glob_1;
}
var fs$4 = gracefulFs;
var path$4 = require$$1;
var flatten$1 = lodash_flatten;
var difference$1 = lodash_difference;
var union$1 = lodash_union;
var isPlainObject$1 = lodash_isplainobject;
var glob$2 = requireGlob();
var file$2 = file$3.exports = {};
var pathSeparatorRe$1 = /[\/\\]/g;
var processPatterns$1 = function(patterns, fn) {
  var result = [];
  flatten$1(patterns).forEach(function(pattern) {
    var exclusion = pattern.indexOf("!") === 0;
    if (exclusion) {
      pattern = pattern.slice(1);
    }
    var matches = fn(pattern);
    if (exclusion) {
      result = difference$1(result, matches);
    } else {
      result = union$1(result, matches);
    }
  });
  return result;
};
file$2.exists = function() {
  var filepath = path$4.join.apply(path$4, arguments);
  return fs$4.existsSync(filepath);
};
file$2.expand = function(...args) {
  var options = isPlainObject$1(args[0]) ? args.shift() : {};
  var patterns = Array.isArray(args[0]) ? args[0] : args;
  if (patterns.length === 0) {
    return [];
  }
  var matches = processPatterns$1(patterns, function(pattern) {
    return glob$2.sync(pattern, options);
  });
  if (options.filter) {
    matches = matches.filter(function(filepath) {
      filepath = path$4.join(options.cwd || "", filepath);
      try {
        if (typeof options.filter === "function") {
          return options.filter(filepath);
        } else {
          return fs$4.statSync(filepath)[options.filter]();
        }
      } catch (e) {
        return false;
      }
    });
  }
  return matches;
};
file$2.expandMapping = function(patterns, destBase, options) {
  options = Object.assign({
    rename: function(destBase2, destPath) {
      return path$4.join(destBase2 || "", destPath);
    }
  }, options);
  var files = [];
  var fileByDest = {};
  file$2.expand(options, patterns).forEach(function(src) {
    var destPath = src;
    if (options.flatten) {
      destPath = path$4.basename(destPath);
    }
    if (options.ext) {
      destPath = destPath.replace(/(\.[^\/]*)?$/, options.ext);
    }
    var dest = options.rename(destBase, destPath, options);
    if (options.cwd) {
      src = path$4.join(options.cwd, src);
    }
    dest = dest.replace(pathSeparatorRe$1, "/");
    src = src.replace(pathSeparatorRe$1, "/");
    if (fileByDest[dest]) {
      fileByDest[dest].src.push(src);
    } else {
      files.push({
        src: [src],
        dest
      });
      fileByDest[dest] = files[files.length - 1];
    }
  });
  return files;
};
file$2.normalizeFilesArray = function(data) {
  var files = [];
  data.forEach(function(obj) {
    if ("src" in obj || "dest" in obj) {
      files.push(obj);
    }
  });
  if (files.length === 0) {
    return [];
  }
  files = _(files).chain().forEach(function(obj) {
    if (!("src" in obj) || !obj.src) {
      return;
    }
    if (Array.isArray(obj.src)) {
      obj.src = flatten$1(obj.src);
    } else {
      obj.src = [obj.src];
    }
  }).map(function(obj) {
    var expandOptions = Object.assign({}, obj);
    delete expandOptions.src;
    delete expandOptions.dest;
    if (obj.expand) {
      return file$2.expandMapping(obj.src, obj.dest, expandOptions).map(function(mapObj) {
        var result2 = Object.assign({}, obj);
        result2.orig = Object.assign({}, obj);
        result2.src = mapObj.src;
        result2.dest = mapObj.dest;
        ["expand", "cwd", "flatten", "rename", "ext"].forEach(function(prop) {
          delete result2[prop];
        });
        return result2;
      });
    }
    var result = Object.assign({}, obj);
    result.orig = Object.assign({}, obj);
    if ("src" in result) {
      Object.defineProperty(result, "src", {
        enumerable: true,
        get: function fn() {
          var src;
          if (!("result" in fn)) {
            src = obj.src;
            src = Array.isArray(src) ? flatten$1(src) : [src];
            fn.result = file$2.expand(expandOptions, src);
          }
          return fn.result;
        }
      });
    }
    if ("dest" in result) {
      result.dest = obj.dest;
    }
    return result;
  }).flatten().value();
  return files;
};
var fileExports$1 = file$3.exports;
var fs$3 = gracefulFs;
var path$3 = require$$1;
var lazystream$1 = lazystream$2;
var normalizePath$2 = normalizePath$3;
var defaults$1 = lodash_defaults;
var Stream$2 = require$$0$2.Stream;
var PassThrough$3 = readableExports$1.PassThrough;
var utils$1 = archiverUtils$1.exports = {};
utils$1.file = fileExports$1;
utils$1.collectStream = function(source, callback) {
  var collection = [];
  var size = 0;
  source.on("error", callback);
  source.on("data", function(chunk) {
    collection.push(chunk);
    size += chunk.length;
  });
  source.on("end", function() {
    var buf = new Buffer(size);
    var offset = 0;
    collection.forEach(function(data) {
      data.copy(buf, offset);
      offset += data.length;
    });
    callback(null, buf);
  });
};
utils$1.dateify = function(dateish) {
  dateish = dateish || /* @__PURE__ */ new Date();
  if (dateish instanceof Date) {
    dateish = dateish;
  } else if (typeof dateish === "string") {
    dateish = new Date(dateish);
  } else {
    dateish = /* @__PURE__ */ new Date();
  }
  return dateish;
};
utils$1.defaults = function(object, source, guard) {
  var args = arguments;
  args[0] = args[0] || {};
  return defaults$1(...args);
};
utils$1.isStream = function(source) {
  return source instanceof Stream$2;
};
utils$1.lazyReadStream = function(filepath) {
  return new lazystream$1.Readable(function() {
    return fs$3.createReadStream(filepath);
  });
};
utils$1.normalizeInputSource = function(source) {
  if (source === null) {
    return new Buffer(0);
  } else if (typeof source === "string") {
    return new Buffer(source);
  } else if (utils$1.isStream(source) && !source._readableState) {
    var normalized = new PassThrough$3();
    source.pipe(normalized);
    return normalized;
  }
  return source;
};
utils$1.sanitizePath = function(filepath) {
  return normalizePath$2(filepath, false).replace(/^\w+:/, "").replace(/^(\.\.\/|\/)+/, "");
};
utils$1.trailingSlashIt = function(str) {
  return str.slice(-1) !== "/" ? str + "/" : str;
};
utils$1.unixifyPath = function(filepath) {
  return normalizePath$2(filepath, false).replace(/^\w+:/, "");
};
utils$1.walkdir = function(dirpath, base, callback) {
  var results = [];
  if (typeof base === "function") {
    callback = base;
    base = dirpath;
  }
  fs$3.readdir(dirpath, function(err, list) {
    var i = 0;
    var file2;
    var filepath;
    if (err) {
      return callback(err);
    }
    (function next() {
      file2 = list[i++];
      if (!file2) {
        return callback(null, results);
      }
      filepath = path$3.join(dirpath, file2);
      fs$3.stat(filepath, function(err2, stats) {
        results.push({
          path: filepath,
          relative: path$3.relative(base, filepath).replace(/\\/g, "/"),
          stats
        });
        if (stats && stats.isDirectory()) {
          utils$1.walkdir(filepath, base, function(err3, res) {
            res.forEach(function(dirEntry) {
              results.push(dirEntry);
            });
            next();
          });
        } else {
          next();
        }
      });
    })();
  });
};
var archiverUtilsExports$1 = archiverUtils$1.exports;
var error = { exports: {} };
/**
 * Archiver Core
 *
 * @ignore
 * @license [MIT]{@link https://github.com/archiverjs/node-archiver/blob/master/LICENSE}
 * @copyright (c) 2012-2014 Chris Talkington, contributors.
 */
(function(module, exports) {
  var util2 = require$$0$3;
  const ERROR_CODES = {
    "ABORTED": "archive was aborted",
    "DIRECTORYDIRPATHREQUIRED": "diretory dirpath argument must be a non-empty string value",
    "DIRECTORYFUNCTIONINVALIDDATA": "invalid data returned by directory custom data function",
    "ENTRYNAMEREQUIRED": "entry name must be a non-empty string value",
    "FILEFILEPATHREQUIRED": "file filepath argument must be a non-empty string value",
    "FINALIZING": "archive already finalizing",
    "QUEUECLOSED": "queue closed",
    "NOENDMETHOD": "no suitable finalize/end method defined by module",
    "DIRECTORYNOTSUPPORTED": "support for directory entries not defined by module",
    "FORMATSET": "archive format already set",
    "INPUTSTEAMBUFFERREQUIRED": "input source must be valid Stream or Buffer instance",
    "MODULESET": "module already set",
    "SYMLINKNOTSUPPORTED": "support for symlink entries not defined by module",
    "SYMLINKFILEPATHREQUIRED": "symlink filepath argument must be a non-empty string value",
    "SYMLINKTARGETREQUIRED": "symlink target argument must be a non-empty string value",
    "ENTRYNOTSUPPORTED": "entry not supported"
  };
  function ArchiverError2(code, data) {
    Error.captureStackTrace(this, this.constructor);
    this.message = ERROR_CODES[code] || code;
    this.code = code;
    this.data = data;
  }
  util2.inherits(ArchiverError2, Error);
  module.exports = ArchiverError2;
})(error);
var errorExports = error.exports;
var readable = { exports: {} };
var stream;
var hasRequiredStream;
function requireStream() {
  if (hasRequiredStream) return stream;
  hasRequiredStream = 1;
  stream = require$$0$2;
  return stream;
}
var buffer_list;
var hasRequiredBuffer_list;
function requireBuffer_list() {
  if (hasRequiredBuffer_list) return buffer_list;
  hasRequiredBuffer_list = 1;
  function ownKeys(object, enumerableOnly) {
    var keys = Object.keys(object);
    if (Object.getOwnPropertySymbols) {
      var symbols = Object.getOwnPropertySymbols(object);
      enumerableOnly && (symbols = symbols.filter(function(sym) {
        return Object.getOwnPropertyDescriptor(object, sym).enumerable;
      })), keys.push.apply(keys, symbols);
    }
    return keys;
  }
  function _objectSpread(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = null != arguments[i] ? arguments[i] : {};
      i % 2 ? ownKeys(Object(source), true).forEach(function(key) {
        _defineProperty(target, key, source[key]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function(key) {
        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
      });
    }
    return target;
  }
  function _defineProperty(obj, key, value) {
    key = _toPropertyKey(key);
    if (key in obj) {
      Object.defineProperty(obj, key, { value, enumerable: true, configurable: true, writable: true });
    } else {
      obj[key] = value;
    }
    return obj;
  }
  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }
  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor);
    }
  }
  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    Object.defineProperty(Constructor, "prototype", { writable: false });
    return Constructor;
  }
  function _toPropertyKey(arg) {
    var key = _toPrimitive(arg, "string");
    return typeof key === "symbol" ? key : String(key);
  }
  function _toPrimitive(input, hint) {
    if (typeof input !== "object" || input === null) return input;
    var prim = input[Symbol.toPrimitive];
    if (prim !== void 0) {
      var res = prim.call(input, hint);
      if (typeof res !== "object") return res;
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return String(input);
  }
  var _require = require$$0$4, Buffer2 = _require.Buffer;
  var _require2 = require$$0$3, inspect = _require2.inspect;
  var custom = inspect && inspect.custom || "inspect";
  function copyBuffer(src, target, offset) {
    Buffer2.prototype.copy.call(src, target, offset);
  }
  buffer_list = /* @__PURE__ */ function() {
    function BufferList2() {
      _classCallCheck(this, BufferList2);
      this.head = null;
      this.tail = null;
      this.length = 0;
    }
    _createClass(BufferList2, [{
      key: "push",
      value: function push(v) {
        var entry = {
          data: v,
          next: null
        };
        if (this.length > 0) this.tail.next = entry;
        else this.head = entry;
        this.tail = entry;
        ++this.length;
      }
    }, {
      key: "unshift",
      value: function unshift(v) {
        var entry = {
          data: v,
          next: this.head
        };
        if (this.length === 0) this.tail = entry;
        this.head = entry;
        ++this.length;
      }
    }, {
      key: "shift",
      value: function shift() {
        if (this.length === 0) return;
        var ret = this.head.data;
        if (this.length === 1) this.head = this.tail = null;
        else this.head = this.head.next;
        --this.length;
        return ret;
      }
    }, {
      key: "clear",
      value: function clear() {
        this.head = this.tail = null;
        this.length = 0;
      }
    }, {
      key: "join",
      value: function join(s) {
        if (this.length === 0) return "";
        var p = this.head;
        var ret = "" + p.data;
        while (p = p.next) ret += s + p.data;
        return ret;
      }
    }, {
      key: "concat",
      value: function concat2(n) {
        if (this.length === 0) return Buffer2.alloc(0);
        var ret = Buffer2.allocUnsafe(n >>> 0);
        var p = this.head;
        var i = 0;
        while (p) {
          copyBuffer(p.data, ret, i);
          i += p.data.length;
          p = p.next;
        }
        return ret;
      }
      // Consumes a specified amount of bytes or characters from the buffered data.
    }, {
      key: "consume",
      value: function consume2(n, hasStrings) {
        var ret;
        if (n < this.head.data.length) {
          ret = this.head.data.slice(0, n);
          this.head.data = this.head.data.slice(n);
        } else if (n === this.head.data.length) {
          ret = this.shift();
        } else {
          ret = hasStrings ? this._getString(n) : this._getBuffer(n);
        }
        return ret;
      }
    }, {
      key: "first",
      value: function first() {
        return this.head.data;
      }
      // Consumes a specified amount of characters from the buffered data.
    }, {
      key: "_getString",
      value: function _getString(n) {
        var p = this.head;
        var c = 1;
        var ret = p.data;
        n -= ret.length;
        while (p = p.next) {
          var str = p.data;
          var nb = n > str.length ? str.length : n;
          if (nb === str.length) ret += str;
          else ret += str.slice(0, n);
          n -= nb;
          if (n === 0) {
            if (nb === str.length) {
              ++c;
              if (p.next) this.head = p.next;
              else this.head = this.tail = null;
            } else {
              this.head = p;
              p.data = str.slice(nb);
            }
            break;
          }
          ++c;
        }
        this.length -= c;
        return ret;
      }
      // Consumes a specified amount of bytes from the buffered data.
    }, {
      key: "_getBuffer",
      value: function _getBuffer(n) {
        var ret = Buffer2.allocUnsafe(n);
        var p = this.head;
        var c = 1;
        p.data.copy(ret);
        n -= p.data.length;
        while (p = p.next) {
          var buf = p.data;
          var nb = n > buf.length ? buf.length : n;
          buf.copy(ret, ret.length - n, 0, nb);
          n -= nb;
          if (n === 0) {
            if (nb === buf.length) {
              ++c;
              if (p.next) this.head = p.next;
              else this.head = this.tail = null;
            } else {
              this.head = p;
              p.data = buf.slice(nb);
            }
            break;
          }
          ++c;
        }
        this.length -= c;
        return ret;
      }
      // Make sure the linked list only shows the minimal necessary information.
    }, {
      key: custom,
      value: function value(_2, options) {
        return inspect(this, _objectSpread(_objectSpread({}, options), {}, {
          // Only inspect one level.
          depth: 0,
          // It should not recurse.
          customInspect: false
        }));
      }
    }]);
    return BufferList2;
  }();
  return buffer_list;
}
var destroy_1;
var hasRequiredDestroy;
function requireDestroy() {
  if (hasRequiredDestroy) return destroy_1;
  hasRequiredDestroy = 1;
  function destroy(err, cb) {
    var _this = this;
    var readableDestroyed = this._readableState && this._readableState.destroyed;
    var writableDestroyed = this._writableState && this._writableState.destroyed;
    if (readableDestroyed || writableDestroyed) {
      if (cb) {
        cb(err);
      } else if (err) {
        if (!this._writableState) {
          process.nextTick(emitErrorNT, this, err);
        } else if (!this._writableState.errorEmitted) {
          this._writableState.errorEmitted = true;
          process.nextTick(emitErrorNT, this, err);
        }
      }
      return this;
    }
    if (this._readableState) {
      this._readableState.destroyed = true;
    }
    if (this._writableState) {
      this._writableState.destroyed = true;
    }
    this._destroy(err || null, function(err2) {
      if (!cb && err2) {
        if (!_this._writableState) {
          process.nextTick(emitErrorAndCloseNT, _this, err2);
        } else if (!_this._writableState.errorEmitted) {
          _this._writableState.errorEmitted = true;
          process.nextTick(emitErrorAndCloseNT, _this, err2);
        } else {
          process.nextTick(emitCloseNT, _this);
        }
      } else if (cb) {
        process.nextTick(emitCloseNT, _this);
        cb(err2);
      } else {
        process.nextTick(emitCloseNT, _this);
      }
    });
    return this;
  }
  function emitErrorAndCloseNT(self2, err) {
    emitErrorNT(self2, err);
    emitCloseNT(self2);
  }
  function emitCloseNT(self2) {
    if (self2._writableState && !self2._writableState.emitClose) return;
    if (self2._readableState && !self2._readableState.emitClose) return;
    self2.emit("close");
  }
  function undestroy() {
    if (this._readableState) {
      this._readableState.destroyed = false;
      this._readableState.reading = false;
      this._readableState.ended = false;
      this._readableState.endEmitted = false;
    }
    if (this._writableState) {
      this._writableState.destroyed = false;
      this._writableState.ended = false;
      this._writableState.ending = false;
      this._writableState.finalCalled = false;
      this._writableState.prefinished = false;
      this._writableState.finished = false;
      this._writableState.errorEmitted = false;
    }
  }
  function emitErrorNT(self2, err) {
    self2.emit("error", err);
  }
  function errorOrDestroy(stream2, err) {
    var rState = stream2._readableState;
    var wState = stream2._writableState;
    if (rState && rState.autoDestroy || wState && wState.autoDestroy) stream2.destroy(err);
    else stream2.emit("error", err);
  }
  destroy_1 = {
    destroy,
    undestroy,
    errorOrDestroy
  };
  return destroy_1;
}
var errors = {};
var hasRequiredErrors;
function requireErrors() {
  if (hasRequiredErrors) return errors;
  hasRequiredErrors = 1;
  const codes = {};
  function createErrorType(code, message, Base) {
    if (!Base) {
      Base = Error;
    }
    function getMessage(arg1, arg2, arg3) {
      if (typeof message === "string") {
        return message;
      } else {
        return message(arg1, arg2, arg3);
      }
    }
    class NodeError extends Base {
      constructor(arg1, arg2, arg3) {
        super(getMessage(arg1, arg2, arg3));
      }
    }
    NodeError.prototype.name = Base.name;
    NodeError.prototype.code = code;
    codes[code] = NodeError;
  }
  function oneOf(expected, thing) {
    if (Array.isArray(expected)) {
      const len = expected.length;
      expected = expected.map((i) => String(i));
      if (len > 2) {
        return `one of ${thing} ${expected.slice(0, len - 1).join(", ")}, or ` + expected[len - 1];
      } else if (len === 2) {
        return `one of ${thing} ${expected[0]} or ${expected[1]}`;
      } else {
        return `of ${thing} ${expected[0]}`;
      }
    } else {
      return `of ${thing} ${String(expected)}`;
    }
  }
  function startsWith(str, search, pos) {
    return str.substr(0, search.length) === search;
  }
  function endsWith(str, search, this_len) {
    if (this_len === void 0 || this_len > str.length) {
      this_len = str.length;
    }
    return str.substring(this_len - search.length, this_len) === search;
  }
  function includes(str, search, start) {
    if (typeof start !== "number") {
      start = 0;
    }
    if (start + search.length > str.length) {
      return false;
    } else {
      return str.indexOf(search, start) !== -1;
    }
  }
  createErrorType("ERR_INVALID_OPT_VALUE", function(name, value) {
    return 'The value "' + value + '" is invalid for option "' + name + '"';
  }, TypeError);
  createErrorType("ERR_INVALID_ARG_TYPE", function(name, expected, actual) {
    let determiner;
    if (typeof expected === "string" && startsWith(expected, "not ")) {
      determiner = "must not be";
      expected = expected.replace(/^not /, "");
    } else {
      determiner = "must be";
    }
    let msg;
    if (endsWith(name, " argument")) {
      msg = `The ${name} ${determiner} ${oneOf(expected, "type")}`;
    } else {
      const type = includes(name, ".") ? "property" : "argument";
      msg = `The "${name}" ${type} ${determiner} ${oneOf(expected, "type")}`;
    }
    msg += `. Received type ${typeof actual}`;
    return msg;
  }, TypeError);
  createErrorType("ERR_STREAM_PUSH_AFTER_EOF", "stream.push() after EOF");
  createErrorType("ERR_METHOD_NOT_IMPLEMENTED", function(name) {
    return "The " + name + " method is not implemented";
  });
  createErrorType("ERR_STREAM_PREMATURE_CLOSE", "Premature close");
  createErrorType("ERR_STREAM_DESTROYED", function(name) {
    return "Cannot call " + name + " after a stream was destroyed";
  });
  createErrorType("ERR_MULTIPLE_CALLBACK", "Callback called multiple times");
  createErrorType("ERR_STREAM_CANNOT_PIPE", "Cannot pipe, not readable");
  createErrorType("ERR_STREAM_WRITE_AFTER_END", "write after end");
  createErrorType("ERR_STREAM_NULL_VALUES", "May not write null values to stream", TypeError);
  createErrorType("ERR_UNKNOWN_ENCODING", function(arg) {
    return "Unknown encoding: " + arg;
  }, TypeError);
  createErrorType("ERR_STREAM_UNSHIFT_AFTER_END_EVENT", "stream.unshift() after end event");
  errors.codes = codes;
  return errors;
}
var state;
var hasRequiredState;
function requireState() {
  if (hasRequiredState) return state;
  hasRequiredState = 1;
  var ERR_INVALID_OPT_VALUE = requireErrors().codes.ERR_INVALID_OPT_VALUE;
  function highWaterMarkFrom(options, isDuplex, duplexKey) {
    return options.highWaterMark != null ? options.highWaterMark : isDuplex ? options[duplexKey] : null;
  }
  function getHighWaterMark(state2, options, duplexKey, isDuplex) {
    var hwm = highWaterMarkFrom(options, isDuplex, duplexKey);
    if (hwm != null) {
      if (!(isFinite(hwm) && Math.floor(hwm) === hwm) || hwm < 0) {
        var name = isDuplex ? duplexKey : "highWaterMark";
        throw new ERR_INVALID_OPT_VALUE(name, hwm);
      }
      return Math.floor(hwm);
    }
    return state2.objectMode ? 16 : 16 * 1024;
  }
  state = {
    getHighWaterMark
  };
  return state;
}
var _stream_writable;
var hasRequired_stream_writable;
function require_stream_writable() {
  if (hasRequired_stream_writable) return _stream_writable;
  hasRequired_stream_writable = 1;
  _stream_writable = Writable2;
  function CorkedRequest(state2) {
    var _this = this;
    this.next = null;
    this.entry = null;
    this.finish = function() {
      onCorkedFinish(_this, state2);
    };
  }
  var Duplex;
  Writable2.WritableState = WritableState;
  var internalUtil = {
    deprecate: requireNode()
  };
  var Stream2 = requireStream();
  var Buffer2 = require$$0$4.Buffer;
  var OurUint8Array = (typeof commonjsGlobal !== "undefined" ? commonjsGlobal : typeof window !== "undefined" ? window : typeof self !== "undefined" ? self : {}).Uint8Array || function() {
  };
  function _uint8ArrayToBuffer(chunk) {
    return Buffer2.from(chunk);
  }
  function _isUint8Array(obj) {
    return Buffer2.isBuffer(obj) || obj instanceof OurUint8Array;
  }
  var destroyImpl = requireDestroy();
  var _require = requireState(), getHighWaterMark = _require.getHighWaterMark;
  var _require$codes = requireErrors().codes, ERR_INVALID_ARG_TYPE = _require$codes.ERR_INVALID_ARG_TYPE, ERR_METHOD_NOT_IMPLEMENTED = _require$codes.ERR_METHOD_NOT_IMPLEMENTED, ERR_MULTIPLE_CALLBACK = _require$codes.ERR_MULTIPLE_CALLBACK, ERR_STREAM_CANNOT_PIPE = _require$codes.ERR_STREAM_CANNOT_PIPE, ERR_STREAM_DESTROYED = _require$codes.ERR_STREAM_DESTROYED, ERR_STREAM_NULL_VALUES = _require$codes.ERR_STREAM_NULL_VALUES, ERR_STREAM_WRITE_AFTER_END = _require$codes.ERR_STREAM_WRITE_AFTER_END, ERR_UNKNOWN_ENCODING = _require$codes.ERR_UNKNOWN_ENCODING;
  var errorOrDestroy = destroyImpl.errorOrDestroy;
  inheritsExports(Writable2, Stream2);
  function nop() {
  }
  function WritableState(options, stream2, isDuplex) {
    Duplex = Duplex || require_stream_duplex();
    options = options || {};
    if (typeof isDuplex !== "boolean") isDuplex = stream2 instanceof Duplex;
    this.objectMode = !!options.objectMode;
    if (isDuplex) this.objectMode = this.objectMode || !!options.writableObjectMode;
    this.highWaterMark = getHighWaterMark(this, options, "writableHighWaterMark", isDuplex);
    this.finalCalled = false;
    this.needDrain = false;
    this.ending = false;
    this.ended = false;
    this.finished = false;
    this.destroyed = false;
    var noDecode = options.decodeStrings === false;
    this.decodeStrings = !noDecode;
    this.defaultEncoding = options.defaultEncoding || "utf8";
    this.length = 0;
    this.writing = false;
    this.corked = 0;
    this.sync = true;
    this.bufferProcessing = false;
    this.onwrite = function(er) {
      onwrite(stream2, er);
    };
    this.writecb = null;
    this.writelen = 0;
    this.bufferedRequest = null;
    this.lastBufferedRequest = null;
    this.pendingcb = 0;
    this.prefinished = false;
    this.errorEmitted = false;
    this.emitClose = options.emitClose !== false;
    this.autoDestroy = !!options.autoDestroy;
    this.bufferedRequestCount = 0;
    this.corkedRequestsFree = new CorkedRequest(this);
  }
  WritableState.prototype.getBuffer = function getBuffer() {
    var current = this.bufferedRequest;
    var out = [];
    while (current) {
      out.push(current);
      current = current.next;
    }
    return out;
  };
  (function() {
    try {
      Object.defineProperty(WritableState.prototype, "buffer", {
        get: internalUtil.deprecate(function writableStateBufferGetter() {
          return this.getBuffer();
        }, "_writableState.buffer is deprecated. Use _writableState.getBuffer instead.", "DEP0003")
      });
    } catch (_2) {
    }
  })();
  var realHasInstance;
  if (typeof Symbol === "function" && Symbol.hasInstance && typeof Function.prototype[Symbol.hasInstance] === "function") {
    realHasInstance = Function.prototype[Symbol.hasInstance];
    Object.defineProperty(Writable2, Symbol.hasInstance, {
      value: function value(object) {
        if (realHasInstance.call(this, object)) return true;
        if (this !== Writable2) return false;
        return object && object._writableState instanceof WritableState;
      }
    });
  } else {
    realHasInstance = function realHasInstance2(object) {
      return object instanceof this;
    };
  }
  function Writable2(options) {
    Duplex = Duplex || require_stream_duplex();
    var isDuplex = this instanceof Duplex;
    if (!isDuplex && !realHasInstance.call(Writable2, this)) return new Writable2(options);
    this._writableState = new WritableState(options, this, isDuplex);
    this.writable = true;
    if (options) {
      if (typeof options.write === "function") this._write = options.write;
      if (typeof options.writev === "function") this._writev = options.writev;
      if (typeof options.destroy === "function") this._destroy = options.destroy;
      if (typeof options.final === "function") this._final = options.final;
    }
    Stream2.call(this);
  }
  Writable2.prototype.pipe = function() {
    errorOrDestroy(this, new ERR_STREAM_CANNOT_PIPE());
  };
  function writeAfterEnd(stream2, cb) {
    var er = new ERR_STREAM_WRITE_AFTER_END();
    errorOrDestroy(stream2, er);
    process.nextTick(cb, er);
  }
  function validChunk(stream2, state2, chunk, cb) {
    var er;
    if (chunk === null) {
      er = new ERR_STREAM_NULL_VALUES();
    } else if (typeof chunk !== "string" && !state2.objectMode) {
      er = new ERR_INVALID_ARG_TYPE("chunk", ["string", "Buffer"], chunk);
    }
    if (er) {
      errorOrDestroy(stream2, er);
      process.nextTick(cb, er);
      return false;
    }
    return true;
  }
  Writable2.prototype.write = function(chunk, encoding, cb) {
    var state2 = this._writableState;
    var ret = false;
    var isBuf = !state2.objectMode && _isUint8Array(chunk);
    if (isBuf && !Buffer2.isBuffer(chunk)) {
      chunk = _uint8ArrayToBuffer(chunk);
    }
    if (typeof encoding === "function") {
      cb = encoding;
      encoding = null;
    }
    if (isBuf) encoding = "buffer";
    else if (!encoding) encoding = state2.defaultEncoding;
    if (typeof cb !== "function") cb = nop;
    if (state2.ending) writeAfterEnd(this, cb);
    else if (isBuf || validChunk(this, state2, chunk, cb)) {
      state2.pendingcb++;
      ret = writeOrBuffer(this, state2, isBuf, chunk, encoding, cb);
    }
    return ret;
  };
  Writable2.prototype.cork = function() {
    this._writableState.corked++;
  };
  Writable2.prototype.uncork = function() {
    var state2 = this._writableState;
    if (state2.corked) {
      state2.corked--;
      if (!state2.writing && !state2.corked && !state2.bufferProcessing && state2.bufferedRequest) clearBuffer(this, state2);
    }
  };
  Writable2.prototype.setDefaultEncoding = function setDefaultEncoding(encoding) {
    if (typeof encoding === "string") encoding = encoding.toLowerCase();
    if (!(["hex", "utf8", "utf-8", "ascii", "binary", "base64", "ucs2", "ucs-2", "utf16le", "utf-16le", "raw"].indexOf((encoding + "").toLowerCase()) > -1)) throw new ERR_UNKNOWN_ENCODING(encoding);
    this._writableState.defaultEncoding = encoding;
    return this;
  };
  Object.defineProperty(Writable2.prototype, "writableBuffer", {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: false,
    get: function get2() {
      return this._writableState && this._writableState.getBuffer();
    }
  });
  function decodeChunk(state2, chunk, encoding) {
    if (!state2.objectMode && state2.decodeStrings !== false && typeof chunk === "string") {
      chunk = Buffer2.from(chunk, encoding);
    }
    return chunk;
  }
  Object.defineProperty(Writable2.prototype, "writableHighWaterMark", {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: false,
    get: function get2() {
      return this._writableState.highWaterMark;
    }
  });
  function writeOrBuffer(stream2, state2, isBuf, chunk, encoding, cb) {
    if (!isBuf) {
      var newChunk = decodeChunk(state2, chunk, encoding);
      if (chunk !== newChunk) {
        isBuf = true;
        encoding = "buffer";
        chunk = newChunk;
      }
    }
    var len = state2.objectMode ? 1 : chunk.length;
    state2.length += len;
    var ret = state2.length < state2.highWaterMark;
    if (!ret) state2.needDrain = true;
    if (state2.writing || state2.corked) {
      var last = state2.lastBufferedRequest;
      state2.lastBufferedRequest = {
        chunk,
        encoding,
        isBuf,
        callback: cb,
        next: null
      };
      if (last) {
        last.next = state2.lastBufferedRequest;
      } else {
        state2.bufferedRequest = state2.lastBufferedRequest;
      }
      state2.bufferedRequestCount += 1;
    } else {
      doWrite(stream2, state2, false, len, chunk, encoding, cb);
    }
    return ret;
  }
  function doWrite(stream2, state2, writev, len, chunk, encoding, cb) {
    state2.writelen = len;
    state2.writecb = cb;
    state2.writing = true;
    state2.sync = true;
    if (state2.destroyed) state2.onwrite(new ERR_STREAM_DESTROYED("write"));
    else if (writev) stream2._writev(chunk, state2.onwrite);
    else stream2._write(chunk, encoding, state2.onwrite);
    state2.sync = false;
  }
  function onwriteError(stream2, state2, sync2, er, cb) {
    --state2.pendingcb;
    if (sync2) {
      process.nextTick(cb, er);
      process.nextTick(finishMaybe, stream2, state2);
      stream2._writableState.errorEmitted = true;
      errorOrDestroy(stream2, er);
    } else {
      cb(er);
      stream2._writableState.errorEmitted = true;
      errorOrDestroy(stream2, er);
      finishMaybe(stream2, state2);
    }
  }
  function onwriteStateUpdate(state2) {
    state2.writing = false;
    state2.writecb = null;
    state2.length -= state2.writelen;
    state2.writelen = 0;
  }
  function onwrite(stream2, er) {
    var state2 = stream2._writableState;
    var sync2 = state2.sync;
    var cb = state2.writecb;
    if (typeof cb !== "function") throw new ERR_MULTIPLE_CALLBACK();
    onwriteStateUpdate(state2);
    if (er) onwriteError(stream2, state2, sync2, er, cb);
    else {
      var finished = needFinish(state2) || stream2.destroyed;
      if (!finished && !state2.corked && !state2.bufferProcessing && state2.bufferedRequest) {
        clearBuffer(stream2, state2);
      }
      if (sync2) {
        process.nextTick(afterWrite, stream2, state2, finished, cb);
      } else {
        afterWrite(stream2, state2, finished, cb);
      }
    }
  }
  function afterWrite(stream2, state2, finished, cb) {
    if (!finished) onwriteDrain(stream2, state2);
    state2.pendingcb--;
    cb();
    finishMaybe(stream2, state2);
  }
  function onwriteDrain(stream2, state2) {
    if (state2.length === 0 && state2.needDrain) {
      state2.needDrain = false;
      stream2.emit("drain");
    }
  }
  function clearBuffer(stream2, state2) {
    state2.bufferProcessing = true;
    var entry = state2.bufferedRequest;
    if (stream2._writev && entry && entry.next) {
      var l = state2.bufferedRequestCount;
      var buffer = new Array(l);
      var holder = state2.corkedRequestsFree;
      holder.entry = entry;
      var count = 0;
      var allBuffers = true;
      while (entry) {
        buffer[count] = entry;
        if (!entry.isBuf) allBuffers = false;
        entry = entry.next;
        count += 1;
      }
      buffer.allBuffers = allBuffers;
      doWrite(stream2, state2, true, state2.length, buffer, "", holder.finish);
      state2.pendingcb++;
      state2.lastBufferedRequest = null;
      if (holder.next) {
        state2.corkedRequestsFree = holder.next;
        holder.next = null;
      } else {
        state2.corkedRequestsFree = new CorkedRequest(state2);
      }
      state2.bufferedRequestCount = 0;
    } else {
      while (entry) {
        var chunk = entry.chunk;
        var encoding = entry.encoding;
        var cb = entry.callback;
        var len = state2.objectMode ? 1 : chunk.length;
        doWrite(stream2, state2, false, len, chunk, encoding, cb);
        entry = entry.next;
        state2.bufferedRequestCount--;
        if (state2.writing) {
          break;
        }
      }
      if (entry === null) state2.lastBufferedRequest = null;
    }
    state2.bufferedRequest = entry;
    state2.bufferProcessing = false;
  }
  Writable2.prototype._write = function(chunk, encoding, cb) {
    cb(new ERR_METHOD_NOT_IMPLEMENTED("_write()"));
  };
  Writable2.prototype._writev = null;
  Writable2.prototype.end = function(chunk, encoding, cb) {
    var state2 = this._writableState;
    if (typeof chunk === "function") {
      cb = chunk;
      chunk = null;
      encoding = null;
    } else if (typeof encoding === "function") {
      cb = encoding;
      encoding = null;
    }
    if (chunk !== null && chunk !== void 0) this.write(chunk, encoding);
    if (state2.corked) {
      state2.corked = 1;
      this.uncork();
    }
    if (!state2.ending) endWritable(this, state2, cb);
    return this;
  };
  Object.defineProperty(Writable2.prototype, "writableLength", {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: false,
    get: function get2() {
      return this._writableState.length;
    }
  });
  function needFinish(state2) {
    return state2.ending && state2.length === 0 && state2.bufferedRequest === null && !state2.finished && !state2.writing;
  }
  function callFinal(stream2, state2) {
    stream2._final(function(err) {
      state2.pendingcb--;
      if (err) {
        errorOrDestroy(stream2, err);
      }
      state2.prefinished = true;
      stream2.emit("prefinish");
      finishMaybe(stream2, state2);
    });
  }
  function prefinish(stream2, state2) {
    if (!state2.prefinished && !state2.finalCalled) {
      if (typeof stream2._final === "function" && !state2.destroyed) {
        state2.pendingcb++;
        state2.finalCalled = true;
        process.nextTick(callFinal, stream2, state2);
      } else {
        state2.prefinished = true;
        stream2.emit("prefinish");
      }
    }
  }
  function finishMaybe(stream2, state2) {
    var need = needFinish(state2);
    if (need) {
      prefinish(stream2, state2);
      if (state2.pendingcb === 0) {
        state2.finished = true;
        stream2.emit("finish");
        if (state2.autoDestroy) {
          var rState = stream2._readableState;
          if (!rState || rState.autoDestroy && rState.endEmitted) {
            stream2.destroy();
          }
        }
      }
    }
    return need;
  }
  function endWritable(stream2, state2, cb) {
    state2.ending = true;
    finishMaybe(stream2, state2);
    if (cb) {
      if (state2.finished) process.nextTick(cb);
      else stream2.once("finish", cb);
    }
    state2.ended = true;
    stream2.writable = false;
  }
  function onCorkedFinish(corkReq, state2, err) {
    var entry = corkReq.entry;
    corkReq.entry = null;
    while (entry) {
      var cb = entry.callback;
      state2.pendingcb--;
      cb(err);
      entry = entry.next;
    }
    state2.corkedRequestsFree.next = corkReq;
  }
  Object.defineProperty(Writable2.prototype, "destroyed", {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: false,
    get: function get2() {
      if (this._writableState === void 0) {
        return false;
      }
      return this._writableState.destroyed;
    },
    set: function set(value) {
      if (!this._writableState) {
        return;
      }
      this._writableState.destroyed = value;
    }
  });
  Writable2.prototype.destroy = destroyImpl.destroy;
  Writable2.prototype._undestroy = destroyImpl.undestroy;
  Writable2.prototype._destroy = function(err, cb) {
    cb(err);
  };
  return _stream_writable;
}
var _stream_duplex;
var hasRequired_stream_duplex;
function require_stream_duplex() {
  if (hasRequired_stream_duplex) return _stream_duplex;
  hasRequired_stream_duplex = 1;
  var objectKeys = Object.keys || function(obj) {
    var keys2 = [];
    for (var key in obj) keys2.push(key);
    return keys2;
  };
  _stream_duplex = Duplex;
  var Readable2 = require_stream_readable();
  var Writable2 = require_stream_writable();
  inheritsExports(Duplex, Readable2);
  {
    var keys = objectKeys(Writable2.prototype);
    for (var v = 0; v < keys.length; v++) {
      var method = keys[v];
      if (!Duplex.prototype[method]) Duplex.prototype[method] = Writable2.prototype[method];
    }
  }
  function Duplex(options) {
    if (!(this instanceof Duplex)) return new Duplex(options);
    Readable2.call(this, options);
    Writable2.call(this, options);
    this.allowHalfOpen = true;
    if (options) {
      if (options.readable === false) this.readable = false;
      if (options.writable === false) this.writable = false;
      if (options.allowHalfOpen === false) {
        this.allowHalfOpen = false;
        this.once("end", onend);
      }
    }
  }
  Object.defineProperty(Duplex.prototype, "writableHighWaterMark", {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: false,
    get: function get2() {
      return this._writableState.highWaterMark;
    }
  });
  Object.defineProperty(Duplex.prototype, "writableBuffer", {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: false,
    get: function get2() {
      return this._writableState && this._writableState.getBuffer();
    }
  });
  Object.defineProperty(Duplex.prototype, "writableLength", {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: false,
    get: function get2() {
      return this._writableState.length;
    }
  });
  function onend() {
    if (this._writableState.ended) return;
    process.nextTick(onEndNT, this);
  }
  function onEndNT(self2) {
    self2.end();
  }
  Object.defineProperty(Duplex.prototype, "destroyed", {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: false,
    get: function get2() {
      if (this._readableState === void 0 || this._writableState === void 0) {
        return false;
      }
      return this._readableState.destroyed && this._writableState.destroyed;
    },
    set: function set(value) {
      if (this._readableState === void 0 || this._writableState === void 0) {
        return;
      }
      this._readableState.destroyed = value;
      this._writableState.destroyed = value;
    }
  });
  return _stream_duplex;
}
var string_decoder = {};
var safeBuffer = { exports: {} };
/*! safe-buffer. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> */
var hasRequiredSafeBuffer;
function requireSafeBuffer() {
  if (hasRequiredSafeBuffer) return safeBuffer.exports;
  hasRequiredSafeBuffer = 1;
  (function(module, exports) {
    var buffer = require$$0$4;
    var Buffer2 = buffer.Buffer;
    function copyProps(src, dst) {
      for (var key in src) {
        dst[key] = src[key];
      }
    }
    if (Buffer2.from && Buffer2.alloc && Buffer2.allocUnsafe && Buffer2.allocUnsafeSlow) {
      module.exports = buffer;
    } else {
      copyProps(buffer, exports);
      exports.Buffer = SafeBuffer;
    }
    function SafeBuffer(arg, encodingOrOffset, length) {
      return Buffer2(arg, encodingOrOffset, length);
    }
    SafeBuffer.prototype = Object.create(Buffer2.prototype);
    copyProps(Buffer2, SafeBuffer);
    SafeBuffer.from = function(arg, encodingOrOffset, length) {
      if (typeof arg === "number") {
        throw new TypeError("Argument must not be a number");
      }
      return Buffer2(arg, encodingOrOffset, length);
    };
    SafeBuffer.alloc = function(size, fill, encoding) {
      if (typeof size !== "number") {
        throw new TypeError("Argument must be a number");
      }
      var buf = Buffer2(size);
      if (fill !== void 0) {
        if (typeof encoding === "string") {
          buf.fill(fill, encoding);
        } else {
          buf.fill(fill);
        }
      } else {
        buf.fill(0);
      }
      return buf;
    };
    SafeBuffer.allocUnsafe = function(size) {
      if (typeof size !== "number") {
        throw new TypeError("Argument must be a number");
      }
      return Buffer2(size);
    };
    SafeBuffer.allocUnsafeSlow = function(size) {
      if (typeof size !== "number") {
        throw new TypeError("Argument must be a number");
      }
      return buffer.SlowBuffer(size);
    };
  })(safeBuffer, safeBuffer.exports);
  return safeBuffer.exports;
}
var hasRequiredString_decoder;
function requireString_decoder() {
  if (hasRequiredString_decoder) return string_decoder;
  hasRequiredString_decoder = 1;
  var Buffer2 = requireSafeBuffer().Buffer;
  var isEncoding = Buffer2.isEncoding || function(encoding) {
    encoding = "" + encoding;
    switch (encoding && encoding.toLowerCase()) {
      case "hex":
      case "utf8":
      case "utf-8":
      case "ascii":
      case "binary":
      case "base64":
      case "ucs2":
      case "ucs-2":
      case "utf16le":
      case "utf-16le":
      case "raw":
        return true;
      default:
        return false;
    }
  };
  function _normalizeEncoding(enc) {
    if (!enc) return "utf8";
    var retried;
    while (true) {
      switch (enc) {
        case "utf8":
        case "utf-8":
          return "utf8";
        case "ucs2":
        case "ucs-2":
        case "utf16le":
        case "utf-16le":
          return "utf16le";
        case "latin1":
        case "binary":
          return "latin1";
        case "base64":
        case "ascii":
        case "hex":
          return enc;
        default:
          if (retried) return;
          enc = ("" + enc).toLowerCase();
          retried = true;
      }
    }
  }
  function normalizeEncoding(enc) {
    var nenc = _normalizeEncoding(enc);
    if (typeof nenc !== "string" && (Buffer2.isEncoding === isEncoding || !isEncoding(enc))) throw new Error("Unknown encoding: " + enc);
    return nenc || enc;
  }
  string_decoder.StringDecoder = StringDecoder2;
  function StringDecoder2(encoding) {
    this.encoding = normalizeEncoding(encoding);
    var nb;
    switch (this.encoding) {
      case "utf16le":
        this.text = utf16Text;
        this.end = utf16End;
        nb = 4;
        break;
      case "utf8":
        this.fillLast = utf8FillLast;
        nb = 4;
        break;
      case "base64":
        this.text = base64Text;
        this.end = base64End;
        nb = 3;
        break;
      default:
        this.write = simpleWrite;
        this.end = simpleEnd;
        return;
    }
    this.lastNeed = 0;
    this.lastTotal = 0;
    this.lastChar = Buffer2.allocUnsafe(nb);
  }
  StringDecoder2.prototype.write = function(buf) {
    if (buf.length === 0) return "";
    var r;
    var i;
    if (this.lastNeed) {
      r = this.fillLast(buf);
      if (r === void 0) return "";
      i = this.lastNeed;
      this.lastNeed = 0;
    } else {
      i = 0;
    }
    if (i < buf.length) return r ? r + this.text(buf, i) : this.text(buf, i);
    return r || "";
  };
  StringDecoder2.prototype.end = utf8End;
  StringDecoder2.prototype.text = utf8Text;
  StringDecoder2.prototype.fillLast = function(buf) {
    if (this.lastNeed <= buf.length) {
      buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, this.lastNeed);
      return this.lastChar.toString(this.encoding, 0, this.lastTotal);
    }
    buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, buf.length);
    this.lastNeed -= buf.length;
  };
  function utf8CheckByte(byte) {
    if (byte <= 127) return 0;
    else if (byte >> 5 === 6) return 2;
    else if (byte >> 4 === 14) return 3;
    else if (byte >> 3 === 30) return 4;
    return byte >> 6 === 2 ? -1 : -2;
  }
  function utf8CheckIncomplete(self2, buf, i) {
    var j = buf.length - 1;
    if (j < i) return 0;
    var nb = utf8CheckByte(buf[j]);
    if (nb >= 0) {
      if (nb > 0) self2.lastNeed = nb - 1;
      return nb;
    }
    if (--j < i || nb === -2) return 0;
    nb = utf8CheckByte(buf[j]);
    if (nb >= 0) {
      if (nb > 0) self2.lastNeed = nb - 2;
      return nb;
    }
    if (--j < i || nb === -2) return 0;
    nb = utf8CheckByte(buf[j]);
    if (nb >= 0) {
      if (nb > 0) {
        if (nb === 2) nb = 0;
        else self2.lastNeed = nb - 3;
      }
      return nb;
    }
    return 0;
  }
  function utf8CheckExtraBytes(self2, buf, p) {
    if ((buf[0] & 192) !== 128) {
      self2.lastNeed = 0;
      return "�";
    }
    if (self2.lastNeed > 1 && buf.length > 1) {
      if ((buf[1] & 192) !== 128) {
        self2.lastNeed = 1;
        return "�";
      }
      if (self2.lastNeed > 2 && buf.length > 2) {
        if ((buf[2] & 192) !== 128) {
          self2.lastNeed = 2;
          return "�";
        }
      }
    }
  }
  function utf8FillLast(buf) {
    var p = this.lastTotal - this.lastNeed;
    var r = utf8CheckExtraBytes(this, buf);
    if (r !== void 0) return r;
    if (this.lastNeed <= buf.length) {
      buf.copy(this.lastChar, p, 0, this.lastNeed);
      return this.lastChar.toString(this.encoding, 0, this.lastTotal);
    }
    buf.copy(this.lastChar, p, 0, buf.length);
    this.lastNeed -= buf.length;
  }
  function utf8Text(buf, i) {
    var total = utf8CheckIncomplete(this, buf, i);
    if (!this.lastNeed) return buf.toString("utf8", i);
    this.lastTotal = total;
    var end2 = buf.length - (total - this.lastNeed);
    buf.copy(this.lastChar, 0, end2);
    return buf.toString("utf8", i, end2);
  }
  function utf8End(buf) {
    var r = buf && buf.length ? this.write(buf) : "";
    if (this.lastNeed) return r + "�";
    return r;
  }
  function utf16Text(buf, i) {
    if ((buf.length - i) % 2 === 0) {
      var r = buf.toString("utf16le", i);
      if (r) {
        var c = r.charCodeAt(r.length - 1);
        if (c >= 55296 && c <= 56319) {
          this.lastNeed = 2;
          this.lastTotal = 4;
          this.lastChar[0] = buf[buf.length - 2];
          this.lastChar[1] = buf[buf.length - 1];
          return r.slice(0, -1);
        }
      }
      return r;
    }
    this.lastNeed = 1;
    this.lastTotal = 2;
    this.lastChar[0] = buf[buf.length - 1];
    return buf.toString("utf16le", i, buf.length - 1);
  }
  function utf16End(buf) {
    var r = buf && buf.length ? this.write(buf) : "";
    if (this.lastNeed) {
      var end2 = this.lastTotal - this.lastNeed;
      return r + this.lastChar.toString("utf16le", 0, end2);
    }
    return r;
  }
  function base64Text(buf, i) {
    var n = (buf.length - i) % 3;
    if (n === 0) return buf.toString("base64", i);
    this.lastNeed = 3 - n;
    this.lastTotal = 3;
    if (n === 1) {
      this.lastChar[0] = buf[buf.length - 1];
    } else {
      this.lastChar[0] = buf[buf.length - 2];
      this.lastChar[1] = buf[buf.length - 1];
    }
    return buf.toString("base64", i, buf.length - n);
  }
  function base64End(buf) {
    var r = buf && buf.length ? this.write(buf) : "";
    if (this.lastNeed) return r + this.lastChar.toString("base64", 0, 3 - this.lastNeed);
    return r;
  }
  function simpleWrite(buf) {
    return buf.toString(this.encoding);
  }
  function simpleEnd(buf) {
    return buf && buf.length ? this.write(buf) : "";
  }
  return string_decoder;
}
var endOfStream$1;
var hasRequiredEndOfStream;
function requireEndOfStream() {
  if (hasRequiredEndOfStream) return endOfStream$1;
  hasRequiredEndOfStream = 1;
  var ERR_STREAM_PREMATURE_CLOSE = requireErrors().codes.ERR_STREAM_PREMATURE_CLOSE;
  function once2(callback) {
    var called = false;
    return function() {
      if (called) return;
      called = true;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      callback.apply(this, args);
    };
  }
  function noop2() {
  }
  function isRequest2(stream2) {
    return stream2.setHeader && typeof stream2.abort === "function";
  }
  function eos2(stream2, opts, callback) {
    if (typeof opts === "function") return eos2(stream2, null, opts);
    if (!opts) opts = {};
    callback = once2(callback || noop2);
    var readable2 = opts.readable || opts.readable !== false && stream2.readable;
    var writable = opts.writable || opts.writable !== false && stream2.writable;
    var onlegacyfinish = function onlegacyfinish2() {
      if (!stream2.writable) onfinish();
    };
    var writableEnded = stream2._writableState && stream2._writableState.finished;
    var onfinish = function onfinish2() {
      writable = false;
      writableEnded = true;
      if (!readable2) callback.call(stream2);
    };
    var readableEnded = stream2._readableState && stream2._readableState.endEmitted;
    var onend = function onend2() {
      readable2 = false;
      readableEnded = true;
      if (!writable) callback.call(stream2);
    };
    var onerror = function onerror2(err) {
      callback.call(stream2, err);
    };
    var onclose = function onclose2() {
      var err;
      if (readable2 && !readableEnded) {
        if (!stream2._readableState || !stream2._readableState.ended) err = new ERR_STREAM_PREMATURE_CLOSE();
        return callback.call(stream2, err);
      }
      if (writable && !writableEnded) {
        if (!stream2._writableState || !stream2._writableState.ended) err = new ERR_STREAM_PREMATURE_CLOSE();
        return callback.call(stream2, err);
      }
    };
    var onrequest = function onrequest2() {
      stream2.req.on("finish", onfinish);
    };
    if (isRequest2(stream2)) {
      stream2.on("complete", onfinish);
      stream2.on("abort", onclose);
      if (stream2.req) onrequest();
      else stream2.on("request", onrequest);
    } else if (writable && !stream2._writableState) {
      stream2.on("end", onlegacyfinish);
      stream2.on("close", onlegacyfinish);
    }
    stream2.on("end", onend);
    stream2.on("finish", onfinish);
    if (opts.error !== false) stream2.on("error", onerror);
    stream2.on("close", onclose);
    return function() {
      stream2.removeListener("complete", onfinish);
      stream2.removeListener("abort", onclose);
      stream2.removeListener("request", onrequest);
      if (stream2.req) stream2.req.removeListener("finish", onfinish);
      stream2.removeListener("end", onlegacyfinish);
      stream2.removeListener("close", onlegacyfinish);
      stream2.removeListener("finish", onfinish);
      stream2.removeListener("end", onend);
      stream2.removeListener("error", onerror);
      stream2.removeListener("close", onclose);
    };
  }
  endOfStream$1 = eos2;
  return endOfStream$1;
}
var async_iterator;
var hasRequiredAsync_iterator;
function requireAsync_iterator() {
  if (hasRequiredAsync_iterator) return async_iterator;
  hasRequiredAsync_iterator = 1;
  var _Object$setPrototypeO;
  function _defineProperty(obj, key, value) {
    key = _toPropertyKey(key);
    if (key in obj) {
      Object.defineProperty(obj, key, { value, enumerable: true, configurable: true, writable: true });
    } else {
      obj[key] = value;
    }
    return obj;
  }
  function _toPropertyKey(arg) {
    var key = _toPrimitive(arg, "string");
    return typeof key === "symbol" ? key : String(key);
  }
  function _toPrimitive(input, hint) {
    if (typeof input !== "object" || input === null) return input;
    var prim = input[Symbol.toPrimitive];
    if (prim !== void 0) {
      var res = prim.call(input, hint);
      if (typeof res !== "object") return res;
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return (hint === "string" ? String : Number)(input);
  }
  var finished = requireEndOfStream();
  var kLastResolve = Symbol("lastResolve");
  var kLastReject = Symbol("lastReject");
  var kError = Symbol("error");
  var kEnded = Symbol("ended");
  var kLastPromise = Symbol("lastPromise");
  var kHandlePromise = Symbol("handlePromise");
  var kStream = Symbol("stream");
  function createIterResult(value, done) {
    return {
      value,
      done
    };
  }
  function readAndResolve(iter) {
    var resolve2 = iter[kLastResolve];
    if (resolve2 !== null) {
      var data = iter[kStream].read();
      if (data !== null) {
        iter[kLastPromise] = null;
        iter[kLastResolve] = null;
        iter[kLastReject] = null;
        resolve2(createIterResult(data, false));
      }
    }
  }
  function onReadable(iter) {
    process.nextTick(readAndResolve, iter);
  }
  function wrapForNext(lastPromise, iter) {
    return function(resolve2, reject2) {
      lastPromise.then(function() {
        if (iter[kEnded]) {
          resolve2(createIterResult(void 0, true));
          return;
        }
        iter[kHandlePromise](resolve2, reject2);
      }, reject2);
    };
  }
  var AsyncIteratorPrototype = Object.getPrototypeOf(function() {
  });
  var ReadableStreamAsyncIteratorPrototype = Object.setPrototypeOf((_Object$setPrototypeO = {
    get stream() {
      return this[kStream];
    },
    next: function next() {
      var _this = this;
      var error2 = this[kError];
      if (error2 !== null) {
        return Promise.reject(error2);
      }
      if (this[kEnded]) {
        return Promise.resolve(createIterResult(void 0, true));
      }
      if (this[kStream].destroyed) {
        return new Promise(function(resolve2, reject2) {
          process.nextTick(function() {
            if (_this[kError]) {
              reject2(_this[kError]);
            } else {
              resolve2(createIterResult(void 0, true));
            }
          });
        });
      }
      var lastPromise = this[kLastPromise];
      var promise;
      if (lastPromise) {
        promise = new Promise(wrapForNext(lastPromise, this));
      } else {
        var data = this[kStream].read();
        if (data !== null) {
          return Promise.resolve(createIterResult(data, false));
        }
        promise = new Promise(this[kHandlePromise]);
      }
      this[kLastPromise] = promise;
      return promise;
    }
  }, _defineProperty(_Object$setPrototypeO, Symbol.asyncIterator, function() {
    return this;
  }), _defineProperty(_Object$setPrototypeO, "return", function _return() {
    var _this2 = this;
    return new Promise(function(resolve2, reject2) {
      _this2[kStream].destroy(null, function(err) {
        if (err) {
          reject2(err);
          return;
        }
        resolve2(createIterResult(void 0, true));
      });
    });
  }), _Object$setPrototypeO), AsyncIteratorPrototype);
  var createReadableStreamAsyncIterator = function createReadableStreamAsyncIterator2(stream2) {
    var _Object$create;
    var iterator = Object.create(ReadableStreamAsyncIteratorPrototype, (_Object$create = {}, _defineProperty(_Object$create, kStream, {
      value: stream2,
      writable: true
    }), _defineProperty(_Object$create, kLastResolve, {
      value: null,
      writable: true
    }), _defineProperty(_Object$create, kLastReject, {
      value: null,
      writable: true
    }), _defineProperty(_Object$create, kError, {
      value: null,
      writable: true
    }), _defineProperty(_Object$create, kEnded, {
      value: stream2._readableState.endEmitted,
      writable: true
    }), _defineProperty(_Object$create, kHandlePromise, {
      value: function value(resolve2, reject2) {
        var data = iterator[kStream].read();
        if (data) {
          iterator[kLastPromise] = null;
          iterator[kLastResolve] = null;
          iterator[kLastReject] = null;
          resolve2(createIterResult(data, false));
        } else {
          iterator[kLastResolve] = resolve2;
          iterator[kLastReject] = reject2;
        }
      },
      writable: true
    }), _Object$create));
    iterator[kLastPromise] = null;
    finished(stream2, function(err) {
      if (err && err.code !== "ERR_STREAM_PREMATURE_CLOSE") {
        var reject2 = iterator[kLastReject];
        if (reject2 !== null) {
          iterator[kLastPromise] = null;
          iterator[kLastResolve] = null;
          iterator[kLastReject] = null;
          reject2(err);
        }
        iterator[kError] = err;
        return;
      }
      var resolve2 = iterator[kLastResolve];
      if (resolve2 !== null) {
        iterator[kLastPromise] = null;
        iterator[kLastResolve] = null;
        iterator[kLastReject] = null;
        resolve2(createIterResult(void 0, true));
      }
      iterator[kEnded] = true;
    });
    stream2.on("readable", onReadable.bind(null, iterator));
    return iterator;
  };
  async_iterator = createReadableStreamAsyncIterator;
  return async_iterator;
}
var from_1;
var hasRequiredFrom;
function requireFrom() {
  if (hasRequiredFrom) return from_1;
  hasRequiredFrom = 1;
  function asyncGeneratorStep(gen, resolve2, reject2, _next, _throw, key, arg) {
    try {
      var info = gen[key](arg);
      var value = info.value;
    } catch (error2) {
      reject2(error2);
      return;
    }
    if (info.done) {
      resolve2(value);
    } else {
      Promise.resolve(value).then(_next, _throw);
    }
  }
  function _asyncToGenerator(fn) {
    return function() {
      var self2 = this, args = arguments;
      return new Promise(function(resolve2, reject2) {
        var gen = fn.apply(self2, args);
        function _next(value) {
          asyncGeneratorStep(gen, resolve2, reject2, _next, _throw, "next", value);
        }
        function _throw(err) {
          asyncGeneratorStep(gen, resolve2, reject2, _next, _throw, "throw", err);
        }
        _next(void 0);
      });
    };
  }
  function ownKeys(object, enumerableOnly) {
    var keys = Object.keys(object);
    if (Object.getOwnPropertySymbols) {
      var symbols = Object.getOwnPropertySymbols(object);
      enumerableOnly && (symbols = symbols.filter(function(sym) {
        return Object.getOwnPropertyDescriptor(object, sym).enumerable;
      })), keys.push.apply(keys, symbols);
    }
    return keys;
  }
  function _objectSpread(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = null != arguments[i] ? arguments[i] : {};
      i % 2 ? ownKeys(Object(source), true).forEach(function(key) {
        _defineProperty(target, key, source[key]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function(key) {
        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
      });
    }
    return target;
  }
  function _defineProperty(obj, key, value) {
    key = _toPropertyKey(key);
    if (key in obj) {
      Object.defineProperty(obj, key, { value, enumerable: true, configurable: true, writable: true });
    } else {
      obj[key] = value;
    }
    return obj;
  }
  function _toPropertyKey(arg) {
    var key = _toPrimitive(arg, "string");
    return typeof key === "symbol" ? key : String(key);
  }
  function _toPrimitive(input, hint) {
    if (typeof input !== "object" || input === null) return input;
    var prim = input[Symbol.toPrimitive];
    if (prim !== void 0) {
      var res = prim.call(input, hint);
      if (typeof res !== "object") return res;
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return (hint === "string" ? String : Number)(input);
  }
  var ERR_INVALID_ARG_TYPE = requireErrors().codes.ERR_INVALID_ARG_TYPE;
  function from(Readable2, iterable, opts) {
    var iterator;
    if (iterable && typeof iterable.next === "function") {
      iterator = iterable;
    } else if (iterable && iterable[Symbol.asyncIterator]) iterator = iterable[Symbol.asyncIterator]();
    else if (iterable && iterable[Symbol.iterator]) iterator = iterable[Symbol.iterator]();
    else throw new ERR_INVALID_ARG_TYPE("iterable", ["Iterable"], iterable);
    var readable2 = new Readable2(_objectSpread({
      objectMode: true
    }, opts));
    var reading = false;
    readable2._read = function() {
      if (!reading) {
        reading = true;
        next();
      }
    };
    function next() {
      return _next2.apply(this, arguments);
    }
    function _next2() {
      _next2 = _asyncToGenerator(function* () {
        try {
          var _yield$iterator$next = yield iterator.next(), value = _yield$iterator$next.value, done = _yield$iterator$next.done;
          if (done) {
            readable2.push(null);
          } else if (readable2.push(yield value)) {
            next();
          } else {
            reading = false;
          }
        } catch (err) {
          readable2.destroy(err);
        }
      });
      return _next2.apply(this, arguments);
    }
    return readable2;
  }
  from_1 = from;
  return from_1;
}
var _stream_readable;
var hasRequired_stream_readable;
function require_stream_readable() {
  if (hasRequired_stream_readable) return _stream_readable;
  hasRequired_stream_readable = 1;
  _stream_readable = Readable2;
  var Duplex;
  Readable2.ReadableState = ReadableState;
  require$$2$1.EventEmitter;
  var EElistenerCount = function EElistenerCount2(emitter, type) {
    return emitter.listeners(type).length;
  };
  var Stream2 = requireStream();
  var Buffer2 = require$$0$4.Buffer;
  var OurUint8Array = (typeof commonjsGlobal !== "undefined" ? commonjsGlobal : typeof window !== "undefined" ? window : typeof self !== "undefined" ? self : {}).Uint8Array || function() {
  };
  function _uint8ArrayToBuffer(chunk) {
    return Buffer2.from(chunk);
  }
  function _isUint8Array(obj) {
    return Buffer2.isBuffer(obj) || obj instanceof OurUint8Array;
  }
  var debugUtil = require$$0$3;
  var debug2;
  if (debugUtil && debugUtil.debuglog) {
    debug2 = debugUtil.debuglog("stream");
  } else {
    debug2 = function debug3() {
    };
  }
  var BufferList2 = requireBuffer_list();
  var destroyImpl = requireDestroy();
  var _require = requireState(), getHighWaterMark = _require.getHighWaterMark;
  var _require$codes = requireErrors().codes, ERR_INVALID_ARG_TYPE = _require$codes.ERR_INVALID_ARG_TYPE, ERR_STREAM_PUSH_AFTER_EOF = _require$codes.ERR_STREAM_PUSH_AFTER_EOF, ERR_METHOD_NOT_IMPLEMENTED = _require$codes.ERR_METHOD_NOT_IMPLEMENTED, ERR_STREAM_UNSHIFT_AFTER_END_EVENT = _require$codes.ERR_STREAM_UNSHIFT_AFTER_END_EVENT;
  var StringDecoder2;
  var createReadableStreamAsyncIterator;
  var from;
  inheritsExports(Readable2, Stream2);
  var errorOrDestroy = destroyImpl.errorOrDestroy;
  var kProxyEvents = ["error", "close", "destroy", "pause", "resume"];
  function prependListener(emitter, event, fn) {
    if (typeof emitter.prependListener === "function") return emitter.prependListener(event, fn);
    if (!emitter._events || !emitter._events[event]) emitter.on(event, fn);
    else if (Array.isArray(emitter._events[event])) emitter._events[event].unshift(fn);
    else emitter._events[event] = [fn, emitter._events[event]];
  }
  function ReadableState(options, stream2, isDuplex) {
    Duplex = Duplex || require_stream_duplex();
    options = options || {};
    if (typeof isDuplex !== "boolean") isDuplex = stream2 instanceof Duplex;
    this.objectMode = !!options.objectMode;
    if (isDuplex) this.objectMode = this.objectMode || !!options.readableObjectMode;
    this.highWaterMark = getHighWaterMark(this, options, "readableHighWaterMark", isDuplex);
    this.buffer = new BufferList2();
    this.length = 0;
    this.pipes = null;
    this.pipesCount = 0;
    this.flowing = null;
    this.ended = false;
    this.endEmitted = false;
    this.reading = false;
    this.sync = true;
    this.needReadable = false;
    this.emittedReadable = false;
    this.readableListening = false;
    this.resumeScheduled = false;
    this.paused = true;
    this.emitClose = options.emitClose !== false;
    this.autoDestroy = !!options.autoDestroy;
    this.destroyed = false;
    this.defaultEncoding = options.defaultEncoding || "utf8";
    this.awaitDrain = 0;
    this.readingMore = false;
    this.decoder = null;
    this.encoding = null;
    if (options.encoding) {
      if (!StringDecoder2) StringDecoder2 = requireString_decoder().StringDecoder;
      this.decoder = new StringDecoder2(options.encoding);
      this.encoding = options.encoding;
    }
  }
  function Readable2(options) {
    Duplex = Duplex || require_stream_duplex();
    if (!(this instanceof Readable2)) return new Readable2(options);
    var isDuplex = this instanceof Duplex;
    this._readableState = new ReadableState(options, this, isDuplex);
    this.readable = true;
    if (options) {
      if (typeof options.read === "function") this._read = options.read;
      if (typeof options.destroy === "function") this._destroy = options.destroy;
    }
    Stream2.call(this);
  }
  Object.defineProperty(Readable2.prototype, "destroyed", {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: false,
    get: function get2() {
      if (this._readableState === void 0) {
        return false;
      }
      return this._readableState.destroyed;
    },
    set: function set(value) {
      if (!this._readableState) {
        return;
      }
      this._readableState.destroyed = value;
    }
  });
  Readable2.prototype.destroy = destroyImpl.destroy;
  Readable2.prototype._undestroy = destroyImpl.undestroy;
  Readable2.prototype._destroy = function(err, cb) {
    cb(err);
  };
  Readable2.prototype.push = function(chunk, encoding) {
    var state2 = this._readableState;
    var skipChunkCheck;
    if (!state2.objectMode) {
      if (typeof chunk === "string") {
        encoding = encoding || state2.defaultEncoding;
        if (encoding !== state2.encoding) {
          chunk = Buffer2.from(chunk, encoding);
          encoding = "";
        }
        skipChunkCheck = true;
      }
    } else {
      skipChunkCheck = true;
    }
    return readableAddChunk(this, chunk, encoding, false, skipChunkCheck);
  };
  Readable2.prototype.unshift = function(chunk) {
    return readableAddChunk(this, chunk, null, true, false);
  };
  function readableAddChunk(stream2, chunk, encoding, addToFront, skipChunkCheck) {
    debug2("readableAddChunk", chunk);
    var state2 = stream2._readableState;
    if (chunk === null) {
      state2.reading = false;
      onEofChunk(stream2, state2);
    } else {
      var er;
      if (!skipChunkCheck) er = chunkInvalid(state2, chunk);
      if (er) {
        errorOrDestroy(stream2, er);
      } else if (state2.objectMode || chunk && chunk.length > 0) {
        if (typeof chunk !== "string" && !state2.objectMode && Object.getPrototypeOf(chunk) !== Buffer2.prototype) {
          chunk = _uint8ArrayToBuffer(chunk);
        }
        if (addToFront) {
          if (state2.endEmitted) errorOrDestroy(stream2, new ERR_STREAM_UNSHIFT_AFTER_END_EVENT());
          else addChunk(stream2, state2, chunk, true);
        } else if (state2.ended) {
          errorOrDestroy(stream2, new ERR_STREAM_PUSH_AFTER_EOF());
        } else if (state2.destroyed) {
          return false;
        } else {
          state2.reading = false;
          if (state2.decoder && !encoding) {
            chunk = state2.decoder.write(chunk);
            if (state2.objectMode || chunk.length !== 0) addChunk(stream2, state2, chunk, false);
            else maybeReadMore(stream2, state2);
          } else {
            addChunk(stream2, state2, chunk, false);
          }
        }
      } else if (!addToFront) {
        state2.reading = false;
        maybeReadMore(stream2, state2);
      }
    }
    return !state2.ended && (state2.length < state2.highWaterMark || state2.length === 0);
  }
  function addChunk(stream2, state2, chunk, addToFront) {
    if (state2.flowing && state2.length === 0 && !state2.sync) {
      state2.awaitDrain = 0;
      stream2.emit("data", chunk);
    } else {
      state2.length += state2.objectMode ? 1 : chunk.length;
      if (addToFront) state2.buffer.unshift(chunk);
      else state2.buffer.push(chunk);
      if (state2.needReadable) emitReadable(stream2);
    }
    maybeReadMore(stream2, state2);
  }
  function chunkInvalid(state2, chunk) {
    var er;
    if (!_isUint8Array(chunk) && typeof chunk !== "string" && chunk !== void 0 && !state2.objectMode) {
      er = new ERR_INVALID_ARG_TYPE("chunk", ["string", "Buffer", "Uint8Array"], chunk);
    }
    return er;
  }
  Readable2.prototype.isPaused = function() {
    return this._readableState.flowing === false;
  };
  Readable2.prototype.setEncoding = function(enc) {
    if (!StringDecoder2) StringDecoder2 = requireString_decoder().StringDecoder;
    var decoder = new StringDecoder2(enc);
    this._readableState.decoder = decoder;
    this._readableState.encoding = this._readableState.decoder.encoding;
    var p = this._readableState.buffer.head;
    var content = "";
    while (p !== null) {
      content += decoder.write(p.data);
      p = p.next;
    }
    this._readableState.buffer.clear();
    if (content !== "") this._readableState.buffer.push(content);
    this._readableState.length = content.length;
    return this;
  };
  var MAX_HWM = 1073741824;
  function computeNewHighWaterMark(n) {
    if (n >= MAX_HWM) {
      n = MAX_HWM;
    } else {
      n--;
      n |= n >>> 1;
      n |= n >>> 2;
      n |= n >>> 4;
      n |= n >>> 8;
      n |= n >>> 16;
      n++;
    }
    return n;
  }
  function howMuchToRead(n, state2) {
    if (n <= 0 || state2.length === 0 && state2.ended) return 0;
    if (state2.objectMode) return 1;
    if (n !== n) {
      if (state2.flowing && state2.length) return state2.buffer.head.data.length;
      else return state2.length;
    }
    if (n > state2.highWaterMark) state2.highWaterMark = computeNewHighWaterMark(n);
    if (n <= state2.length) return n;
    if (!state2.ended) {
      state2.needReadable = true;
      return 0;
    }
    return state2.length;
  }
  Readable2.prototype.read = function(n) {
    debug2("read", n);
    n = parseInt(n, 10);
    var state2 = this._readableState;
    var nOrig = n;
    if (n !== 0) state2.emittedReadable = false;
    if (n === 0 && state2.needReadable && ((state2.highWaterMark !== 0 ? state2.length >= state2.highWaterMark : state2.length > 0) || state2.ended)) {
      debug2("read: emitReadable", state2.length, state2.ended);
      if (state2.length === 0 && state2.ended) endReadable(this);
      else emitReadable(this);
      return null;
    }
    n = howMuchToRead(n, state2);
    if (n === 0 && state2.ended) {
      if (state2.length === 0) endReadable(this);
      return null;
    }
    var doRead = state2.needReadable;
    debug2("need readable", doRead);
    if (state2.length === 0 || state2.length - n < state2.highWaterMark) {
      doRead = true;
      debug2("length less than watermark", doRead);
    }
    if (state2.ended || state2.reading) {
      doRead = false;
      debug2("reading or ended", doRead);
    } else if (doRead) {
      debug2("do read");
      state2.reading = true;
      state2.sync = true;
      if (state2.length === 0) state2.needReadable = true;
      this._read(state2.highWaterMark);
      state2.sync = false;
      if (!state2.reading) n = howMuchToRead(nOrig, state2);
    }
    var ret;
    if (n > 0) ret = fromList(n, state2);
    else ret = null;
    if (ret === null) {
      state2.needReadable = state2.length <= state2.highWaterMark;
      n = 0;
    } else {
      state2.length -= n;
      state2.awaitDrain = 0;
    }
    if (state2.length === 0) {
      if (!state2.ended) state2.needReadable = true;
      if (nOrig !== n && state2.ended) endReadable(this);
    }
    if (ret !== null) this.emit("data", ret);
    return ret;
  };
  function onEofChunk(stream2, state2) {
    debug2("onEofChunk");
    if (state2.ended) return;
    if (state2.decoder) {
      var chunk = state2.decoder.end();
      if (chunk && chunk.length) {
        state2.buffer.push(chunk);
        state2.length += state2.objectMode ? 1 : chunk.length;
      }
    }
    state2.ended = true;
    if (state2.sync) {
      emitReadable(stream2);
    } else {
      state2.needReadable = false;
      if (!state2.emittedReadable) {
        state2.emittedReadable = true;
        emitReadable_(stream2);
      }
    }
  }
  function emitReadable(stream2) {
    var state2 = stream2._readableState;
    debug2("emitReadable", state2.needReadable, state2.emittedReadable);
    state2.needReadable = false;
    if (!state2.emittedReadable) {
      debug2("emitReadable", state2.flowing);
      state2.emittedReadable = true;
      process.nextTick(emitReadable_, stream2);
    }
  }
  function emitReadable_(stream2) {
    var state2 = stream2._readableState;
    debug2("emitReadable_", state2.destroyed, state2.length, state2.ended);
    if (!state2.destroyed && (state2.length || state2.ended)) {
      stream2.emit("readable");
      state2.emittedReadable = false;
    }
    state2.needReadable = !state2.flowing && !state2.ended && state2.length <= state2.highWaterMark;
    flow(stream2);
  }
  function maybeReadMore(stream2, state2) {
    if (!state2.readingMore) {
      state2.readingMore = true;
      process.nextTick(maybeReadMore_, stream2, state2);
    }
  }
  function maybeReadMore_(stream2, state2) {
    while (!state2.reading && !state2.ended && (state2.length < state2.highWaterMark || state2.flowing && state2.length === 0)) {
      var len = state2.length;
      debug2("maybeReadMore read 0");
      stream2.read(0);
      if (len === state2.length)
        break;
    }
    state2.readingMore = false;
  }
  Readable2.prototype._read = function(n) {
    errorOrDestroy(this, new ERR_METHOD_NOT_IMPLEMENTED("_read()"));
  };
  Readable2.prototype.pipe = function(dest, pipeOpts) {
    var src = this;
    var state2 = this._readableState;
    switch (state2.pipesCount) {
      case 0:
        state2.pipes = dest;
        break;
      case 1:
        state2.pipes = [state2.pipes, dest];
        break;
      default:
        state2.pipes.push(dest);
        break;
    }
    state2.pipesCount += 1;
    debug2("pipe count=%d opts=%j", state2.pipesCount, pipeOpts);
    var doEnd = (!pipeOpts || pipeOpts.end !== false) && dest !== process.stdout && dest !== process.stderr;
    var endFn = doEnd ? onend : unpipe;
    if (state2.endEmitted) process.nextTick(endFn);
    else src.once("end", endFn);
    dest.on("unpipe", onunpipe);
    function onunpipe(readable2, unpipeInfo) {
      debug2("onunpipe");
      if (readable2 === src) {
        if (unpipeInfo && unpipeInfo.hasUnpiped === false) {
          unpipeInfo.hasUnpiped = true;
          cleanup();
        }
      }
    }
    function onend() {
      debug2("onend");
      dest.end();
    }
    var ondrain = pipeOnDrain(src);
    dest.on("drain", ondrain);
    var cleanedUp = false;
    function cleanup() {
      debug2("cleanup");
      dest.removeListener("close", onclose);
      dest.removeListener("finish", onfinish);
      dest.removeListener("drain", ondrain);
      dest.removeListener("error", onerror);
      dest.removeListener("unpipe", onunpipe);
      src.removeListener("end", onend);
      src.removeListener("end", unpipe);
      src.removeListener("data", ondata);
      cleanedUp = true;
      if (state2.awaitDrain && (!dest._writableState || dest._writableState.needDrain)) ondrain();
    }
    src.on("data", ondata);
    function ondata(chunk) {
      debug2("ondata");
      var ret = dest.write(chunk);
      debug2("dest.write", ret);
      if (ret === false) {
        if ((state2.pipesCount === 1 && state2.pipes === dest || state2.pipesCount > 1 && indexOf2(state2.pipes, dest) !== -1) && !cleanedUp) {
          debug2("false write response, pause", state2.awaitDrain);
          state2.awaitDrain++;
        }
        src.pause();
      }
    }
    function onerror(er) {
      debug2("onerror", er);
      unpipe();
      dest.removeListener("error", onerror);
      if (EElistenerCount(dest, "error") === 0) errorOrDestroy(dest, er);
    }
    prependListener(dest, "error", onerror);
    function onclose() {
      dest.removeListener("finish", onfinish);
      unpipe();
    }
    dest.once("close", onclose);
    function onfinish() {
      debug2("onfinish");
      dest.removeListener("close", onclose);
      unpipe();
    }
    dest.once("finish", onfinish);
    function unpipe() {
      debug2("unpipe");
      src.unpipe(dest);
    }
    dest.emit("pipe", src);
    if (!state2.flowing) {
      debug2("pipe resume");
      src.resume();
    }
    return dest;
  };
  function pipeOnDrain(src) {
    return function pipeOnDrainFunctionResult() {
      var state2 = src._readableState;
      debug2("pipeOnDrain", state2.awaitDrain);
      if (state2.awaitDrain) state2.awaitDrain--;
      if (state2.awaitDrain === 0 && EElistenerCount(src, "data")) {
        state2.flowing = true;
        flow(src);
      }
    };
  }
  Readable2.prototype.unpipe = function(dest) {
    var state2 = this._readableState;
    var unpipeInfo = {
      hasUnpiped: false
    };
    if (state2.pipesCount === 0) return this;
    if (state2.pipesCount === 1) {
      if (dest && dest !== state2.pipes) return this;
      if (!dest) dest = state2.pipes;
      state2.pipes = null;
      state2.pipesCount = 0;
      state2.flowing = false;
      if (dest) dest.emit("unpipe", this, unpipeInfo);
      return this;
    }
    if (!dest) {
      var dests = state2.pipes;
      var len = state2.pipesCount;
      state2.pipes = null;
      state2.pipesCount = 0;
      state2.flowing = false;
      for (var i = 0; i < len; i++) dests[i].emit("unpipe", this, {
        hasUnpiped: false
      });
      return this;
    }
    var index2 = indexOf2(state2.pipes, dest);
    if (index2 === -1) return this;
    state2.pipes.splice(index2, 1);
    state2.pipesCount -= 1;
    if (state2.pipesCount === 1) state2.pipes = state2.pipes[0];
    dest.emit("unpipe", this, unpipeInfo);
    return this;
  };
  Readable2.prototype.on = function(ev, fn) {
    var res = Stream2.prototype.on.call(this, ev, fn);
    var state2 = this._readableState;
    if (ev === "data") {
      state2.readableListening = this.listenerCount("readable") > 0;
      if (state2.flowing !== false) this.resume();
    } else if (ev === "readable") {
      if (!state2.endEmitted && !state2.readableListening) {
        state2.readableListening = state2.needReadable = true;
        state2.flowing = false;
        state2.emittedReadable = false;
        debug2("on readable", state2.length, state2.reading);
        if (state2.length) {
          emitReadable(this);
        } else if (!state2.reading) {
          process.nextTick(nReadingNextTick, this);
        }
      }
    }
    return res;
  };
  Readable2.prototype.addListener = Readable2.prototype.on;
  Readable2.prototype.removeListener = function(ev, fn) {
    var res = Stream2.prototype.removeListener.call(this, ev, fn);
    if (ev === "readable") {
      process.nextTick(updateReadableListening, this);
    }
    return res;
  };
  Readable2.prototype.removeAllListeners = function(ev) {
    var res = Stream2.prototype.removeAllListeners.apply(this, arguments);
    if (ev === "readable" || ev === void 0) {
      process.nextTick(updateReadableListening, this);
    }
    return res;
  };
  function updateReadableListening(self2) {
    var state2 = self2._readableState;
    state2.readableListening = self2.listenerCount("readable") > 0;
    if (state2.resumeScheduled && !state2.paused) {
      state2.flowing = true;
    } else if (self2.listenerCount("data") > 0) {
      self2.resume();
    }
  }
  function nReadingNextTick(self2) {
    debug2("readable nexttick read 0");
    self2.read(0);
  }
  Readable2.prototype.resume = function() {
    var state2 = this._readableState;
    if (!state2.flowing) {
      debug2("resume");
      state2.flowing = !state2.readableListening;
      resume(this, state2);
    }
    state2.paused = false;
    return this;
  };
  function resume(stream2, state2) {
    if (!state2.resumeScheduled) {
      state2.resumeScheduled = true;
      process.nextTick(resume_, stream2, state2);
    }
  }
  function resume_(stream2, state2) {
    debug2("resume", state2.reading);
    if (!state2.reading) {
      stream2.read(0);
    }
    state2.resumeScheduled = false;
    stream2.emit("resume");
    flow(stream2);
    if (state2.flowing && !state2.reading) stream2.read(0);
  }
  Readable2.prototype.pause = function() {
    debug2("call pause flowing=%j", this._readableState.flowing);
    if (this._readableState.flowing !== false) {
      debug2("pause");
      this._readableState.flowing = false;
      this.emit("pause");
    }
    this._readableState.paused = true;
    return this;
  };
  function flow(stream2) {
    var state2 = stream2._readableState;
    debug2("flow", state2.flowing);
    while (state2.flowing && stream2.read() !== null) ;
  }
  Readable2.prototype.wrap = function(stream2) {
    var _this = this;
    var state2 = this._readableState;
    var paused = false;
    stream2.on("end", function() {
      debug2("wrapped end");
      if (state2.decoder && !state2.ended) {
        var chunk = state2.decoder.end();
        if (chunk && chunk.length) _this.push(chunk);
      }
      _this.push(null);
    });
    stream2.on("data", function(chunk) {
      debug2("wrapped data");
      if (state2.decoder) chunk = state2.decoder.write(chunk);
      if (state2.objectMode && (chunk === null || chunk === void 0)) return;
      else if (!state2.objectMode && (!chunk || !chunk.length)) return;
      var ret = _this.push(chunk);
      if (!ret) {
        paused = true;
        stream2.pause();
      }
    });
    for (var i in stream2) {
      if (this[i] === void 0 && typeof stream2[i] === "function") {
        this[i] = /* @__PURE__ */ function methodWrap(method) {
          return function methodWrapReturnFunction() {
            return stream2[method].apply(stream2, arguments);
          };
        }(i);
      }
    }
    for (var n = 0; n < kProxyEvents.length; n++) {
      stream2.on(kProxyEvents[n], this.emit.bind(this, kProxyEvents[n]));
    }
    this._read = function(n2) {
      debug2("wrapped _read", n2);
      if (paused) {
        paused = false;
        stream2.resume();
      }
    };
    return this;
  };
  if (typeof Symbol === "function") {
    Readable2.prototype[Symbol.asyncIterator] = function() {
      if (createReadableStreamAsyncIterator === void 0) {
        createReadableStreamAsyncIterator = requireAsync_iterator();
      }
      return createReadableStreamAsyncIterator(this);
    };
  }
  Object.defineProperty(Readable2.prototype, "readableHighWaterMark", {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: false,
    get: function get2() {
      return this._readableState.highWaterMark;
    }
  });
  Object.defineProperty(Readable2.prototype, "readableBuffer", {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: false,
    get: function get2() {
      return this._readableState && this._readableState.buffer;
    }
  });
  Object.defineProperty(Readable2.prototype, "readableFlowing", {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: false,
    get: function get2() {
      return this._readableState.flowing;
    },
    set: function set(state2) {
      if (this._readableState) {
        this._readableState.flowing = state2;
      }
    }
  });
  Readable2._fromList = fromList;
  Object.defineProperty(Readable2.prototype, "readableLength", {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: false,
    get: function get2() {
      return this._readableState.length;
    }
  });
  function fromList(n, state2) {
    if (state2.length === 0) return null;
    var ret;
    if (state2.objectMode) ret = state2.buffer.shift();
    else if (!n || n >= state2.length) {
      if (state2.decoder) ret = state2.buffer.join("");
      else if (state2.buffer.length === 1) ret = state2.buffer.first();
      else ret = state2.buffer.concat(state2.length);
      state2.buffer.clear();
    } else {
      ret = state2.buffer.consume(n, state2.decoder);
    }
    return ret;
  }
  function endReadable(stream2) {
    var state2 = stream2._readableState;
    debug2("endReadable", state2.endEmitted);
    if (!state2.endEmitted) {
      state2.ended = true;
      process.nextTick(endReadableNT, state2, stream2);
    }
  }
  function endReadableNT(state2, stream2) {
    debug2("endReadableNT", state2.endEmitted, state2.length);
    if (!state2.endEmitted && state2.length === 0) {
      state2.endEmitted = true;
      stream2.readable = false;
      stream2.emit("end");
      if (state2.autoDestroy) {
        var wState = stream2._writableState;
        if (!wState || wState.autoDestroy && wState.finished) {
          stream2.destroy();
        }
      }
    }
  }
  if (typeof Symbol === "function") {
    Readable2.from = function(iterable, opts) {
      if (from === void 0) {
        from = requireFrom();
      }
      return from(Readable2, iterable, opts);
    };
  }
  function indexOf2(xs, x) {
    for (var i = 0, l = xs.length; i < l; i++) {
      if (xs[i] === x) return i;
    }
    return -1;
  }
  return _stream_readable;
}
var _stream_transform;
var hasRequired_stream_transform;
function require_stream_transform() {
  if (hasRequired_stream_transform) return _stream_transform;
  hasRequired_stream_transform = 1;
  _stream_transform = Transform2;
  var _require$codes = requireErrors().codes, ERR_METHOD_NOT_IMPLEMENTED = _require$codes.ERR_METHOD_NOT_IMPLEMENTED, ERR_MULTIPLE_CALLBACK = _require$codes.ERR_MULTIPLE_CALLBACK, ERR_TRANSFORM_ALREADY_TRANSFORMING = _require$codes.ERR_TRANSFORM_ALREADY_TRANSFORMING, ERR_TRANSFORM_WITH_LENGTH_0 = _require$codes.ERR_TRANSFORM_WITH_LENGTH_0;
  var Duplex = require_stream_duplex();
  inheritsExports(Transform2, Duplex);
  function afterTransform(er, data) {
    var ts = this._transformState;
    ts.transforming = false;
    var cb = ts.writecb;
    if (cb === null) {
      return this.emit("error", new ERR_MULTIPLE_CALLBACK());
    }
    ts.writechunk = null;
    ts.writecb = null;
    if (data != null)
      this.push(data);
    cb(er);
    var rs = this._readableState;
    rs.reading = false;
    if (rs.needReadable || rs.length < rs.highWaterMark) {
      this._read(rs.highWaterMark);
    }
  }
  function Transform2(options) {
    if (!(this instanceof Transform2)) return new Transform2(options);
    Duplex.call(this, options);
    this._transformState = {
      afterTransform: afterTransform.bind(this),
      needTransform: false,
      transforming: false,
      writecb: null,
      writechunk: null,
      writeencoding: null
    };
    this._readableState.needReadable = true;
    this._readableState.sync = false;
    if (options) {
      if (typeof options.transform === "function") this._transform = options.transform;
      if (typeof options.flush === "function") this._flush = options.flush;
    }
    this.on("prefinish", prefinish);
  }
  function prefinish() {
    var _this = this;
    if (typeof this._flush === "function" && !this._readableState.destroyed) {
      this._flush(function(er, data) {
        done(_this, er, data);
      });
    } else {
      done(this, null, null);
    }
  }
  Transform2.prototype.push = function(chunk, encoding) {
    this._transformState.needTransform = false;
    return Duplex.prototype.push.call(this, chunk, encoding);
  };
  Transform2.prototype._transform = function(chunk, encoding, cb) {
    cb(new ERR_METHOD_NOT_IMPLEMENTED("_transform()"));
  };
  Transform2.prototype._write = function(chunk, encoding, cb) {
    var ts = this._transformState;
    ts.writecb = cb;
    ts.writechunk = chunk;
    ts.writeencoding = encoding;
    if (!ts.transforming) {
      var rs = this._readableState;
      if (ts.needTransform || rs.needReadable || rs.length < rs.highWaterMark) this._read(rs.highWaterMark);
    }
  };
  Transform2.prototype._read = function(n) {
    var ts = this._transformState;
    if (ts.writechunk !== null && !ts.transforming) {
      ts.transforming = true;
      this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform);
    } else {
      ts.needTransform = true;
    }
  };
  Transform2.prototype._destroy = function(err, cb) {
    Duplex.prototype._destroy.call(this, err, function(err2) {
      cb(err2);
    });
  };
  function done(stream2, er, data) {
    if (er) return stream2.emit("error", er);
    if (data != null)
      stream2.push(data);
    if (stream2._writableState.length) throw new ERR_TRANSFORM_WITH_LENGTH_0();
    if (stream2._transformState.transforming) throw new ERR_TRANSFORM_ALREADY_TRANSFORMING();
    return stream2.push(null);
  }
  return _stream_transform;
}
var _stream_passthrough;
var hasRequired_stream_passthrough;
function require_stream_passthrough() {
  if (hasRequired_stream_passthrough) return _stream_passthrough;
  hasRequired_stream_passthrough = 1;
  _stream_passthrough = PassThrough2;
  var Transform2 = require_stream_transform();
  inheritsExports(PassThrough2, Transform2);
  function PassThrough2(options) {
    if (!(this instanceof PassThrough2)) return new PassThrough2(options);
    Transform2.call(this, options);
  }
  PassThrough2.prototype._transform = function(chunk, encoding, cb) {
    cb(null, chunk);
  };
  return _stream_passthrough;
}
var pipeline_1;
var hasRequiredPipeline;
function requirePipeline() {
  if (hasRequiredPipeline) return pipeline_1;
  hasRequiredPipeline = 1;
  var eos2;
  function once2(callback) {
    var called = false;
    return function() {
      if (called) return;
      called = true;
      callback.apply(void 0, arguments);
    };
  }
  var _require$codes = requireErrors().codes, ERR_MISSING_ARGS = _require$codes.ERR_MISSING_ARGS, ERR_STREAM_DESTROYED = _require$codes.ERR_STREAM_DESTROYED;
  function noop2(err) {
    if (err) throw err;
  }
  function isRequest2(stream2) {
    return stream2.setHeader && typeof stream2.abort === "function";
  }
  function destroyer(stream2, reading, writing, callback) {
    callback = once2(callback);
    var closed = false;
    stream2.on("close", function() {
      closed = true;
    });
    if (eos2 === void 0) eos2 = requireEndOfStream();
    eos2(stream2, {
      readable: reading,
      writable: writing
    }, function(err) {
      if (err) return callback(err);
      closed = true;
      callback();
    });
    var destroyed = false;
    return function(err) {
      if (closed) return;
      if (destroyed) return;
      destroyed = true;
      if (isRequest2(stream2)) return stream2.abort();
      if (typeof stream2.destroy === "function") return stream2.destroy();
      callback(err || new ERR_STREAM_DESTROYED("pipe"));
    };
  }
  function call(fn) {
    fn();
  }
  function pipe(from, to) {
    return from.pipe(to);
  }
  function popCallback(streams) {
    if (!streams.length) return noop2;
    if (typeof streams[streams.length - 1] !== "function") return noop2;
    return streams.pop();
  }
  function pipeline() {
    for (var _len = arguments.length, streams = new Array(_len), _key = 0; _key < _len; _key++) {
      streams[_key] = arguments[_key];
    }
    var callback = popCallback(streams);
    if (Array.isArray(streams[0])) streams = streams[0];
    if (streams.length < 2) {
      throw new ERR_MISSING_ARGS("streams");
    }
    var error2;
    var destroys = streams.map(function(stream2, i) {
      var reading = i < streams.length - 1;
      var writing = i > 0;
      return destroyer(stream2, reading, writing, function(err) {
        if (!error2) error2 = err;
        if (err) destroys.forEach(call);
        if (reading) return;
        destroys.forEach(call);
        callback(error2);
      });
    });
    return streams.reduce(pipe);
  }
  pipeline_1 = pipeline;
  return pipeline_1;
}
(function(module, exports) {
  var Stream2 = require$$0$2;
  if (process.env.READABLE_STREAM === "disable" && Stream2) {
    module.exports = Stream2.Readable;
    Object.assign(module.exports, Stream2);
    module.exports.Stream = Stream2;
  } else {
    exports = module.exports = require_stream_readable();
    exports.Stream = Stream2 || exports;
    exports.Readable = exports;
    exports.Writable = require_stream_writable();
    exports.Duplex = require_stream_duplex();
    exports.Transform = require_stream_transform();
    exports.PassThrough = require_stream_passthrough();
    exports.finished = requireEndOfStream();
    exports.pipeline = requirePipeline();
  }
})(readable, readable.exports);
var readableExports = readable.exports;
/**
 * Archiver Core
 *
 * @ignore
 * @license [MIT]{@link https://github.com/archiverjs/node-archiver/blob/master/LICENSE}
 * @copyright (c) 2012-2014 Chris Talkington, contributors.
 */
var fs$2 = require$$0;
var glob$1 = readdirGlob_1;
var async = require$$2;
var path$2 = require$$1;
var util$a = archiverUtilsExports$1;
var inherits$7 = require$$0$3.inherits;
var ArchiverError = errorExports;
var Transform$3 = readableExports.Transform;
var win32 = process.platform === "win32";
var Archiver$1 = function(format, options) {
  if (!(this instanceof Archiver$1)) {
    return new Archiver$1(format, options);
  }
  if (typeof format !== "string") {
    options = format;
    format = "zip";
  }
  options = this.options = util$a.defaults(options, {
    highWaterMark: 1024 * 1024,
    statConcurrency: 4
  });
  Transform$3.call(this, options);
  this._format = false;
  this._module = false;
  this._pending = 0;
  this._pointer = 0;
  this._entriesCount = 0;
  this._entriesProcessedCount = 0;
  this._fsEntriesTotalBytes = 0;
  this._fsEntriesProcessedBytes = 0;
  this._queue = async.queue(this._onQueueTask.bind(this), 1);
  this._queue.drain(this._onQueueDrain.bind(this));
  this._statQueue = async.queue(this._onStatQueueTask.bind(this), options.statConcurrency);
  this._statQueue.drain(this._onQueueDrain.bind(this));
  this._state = {
    aborted: false,
    finalize: false,
    finalizing: false,
    finalized: false,
    modulePiped: false
  };
  this._streams = [];
};
inherits$7(Archiver$1, Transform$3);
Archiver$1.prototype._abort = function() {
  this._state.aborted = true;
  this._queue.kill();
  this._statQueue.kill();
  if (this._queue.idle()) {
    this._shutdown();
  }
};
Archiver$1.prototype._append = function(filepath, data) {
  data = data || {};
  var task = {
    source: null,
    filepath
  };
  if (!data.name) {
    data.name = filepath;
  }
  data.sourcePath = filepath;
  task.data = data;
  this._entriesCount++;
  if (data.stats && data.stats instanceof fs$2.Stats) {
    task = this._updateQueueTaskWithStats(task, data.stats);
    if (task) {
      if (data.stats.size) {
        this._fsEntriesTotalBytes += data.stats.size;
      }
      this._queue.push(task);
    }
  } else {
    this._statQueue.push(task);
  }
};
Archiver$1.prototype._finalize = function() {
  if (this._state.finalizing || this._state.finalized || this._state.aborted) {
    return;
  }
  this._state.finalizing = true;
  this._moduleFinalize();
  this._state.finalizing = false;
  this._state.finalized = true;
};
Archiver$1.prototype._maybeFinalize = function() {
  if (this._state.finalizing || this._state.finalized || this._state.aborted) {
    return false;
  }
  if (this._state.finalize && this._pending === 0 && this._queue.idle() && this._statQueue.idle()) {
    this._finalize();
    return true;
  }
  return false;
};
Archiver$1.prototype._moduleAppend = function(source, data, callback) {
  if (this._state.aborted) {
    callback();
    return;
  }
  this._module.append(source, data, (function(err) {
    this._task = null;
    if (this._state.aborted) {
      this._shutdown();
      return;
    }
    if (err) {
      this.emit("error", err);
      setImmediate(callback);
      return;
    }
    this.emit("entry", data);
    this._entriesProcessedCount++;
    if (data.stats && data.stats.size) {
      this._fsEntriesProcessedBytes += data.stats.size;
    }
    this.emit("progress", {
      entries: {
        total: this._entriesCount,
        processed: this._entriesProcessedCount
      },
      fs: {
        totalBytes: this._fsEntriesTotalBytes,
        processedBytes: this._fsEntriesProcessedBytes
      }
    });
    setImmediate(callback);
  }).bind(this));
};
Archiver$1.prototype._moduleFinalize = function() {
  if (typeof this._module.finalize === "function") {
    this._module.finalize();
  } else if (typeof this._module.end === "function") {
    this._module.end();
  } else {
    this.emit("error", new ArchiverError("NOENDMETHOD"));
  }
};
Archiver$1.prototype._modulePipe = function() {
  this._module.on("error", this._onModuleError.bind(this));
  this._module.pipe(this);
  this._state.modulePiped = true;
};
Archiver$1.prototype._moduleSupports = function(key) {
  if (!this._module.supports || !this._module.supports[key]) {
    return false;
  }
  return this._module.supports[key];
};
Archiver$1.prototype._moduleUnpipe = function() {
  this._module.unpipe(this);
  this._state.modulePiped = false;
};
Archiver$1.prototype._normalizeEntryData = function(data, stats) {
  data = util$a.defaults(data, {
    type: "file",
    name: null,
    date: null,
    mode: null,
    prefix: null,
    sourcePath: null,
    stats: false
  });
  if (stats && data.stats === false) {
    data.stats = stats;
  }
  var isDir = data.type === "directory";
  if (data.name) {
    if (typeof data.prefix === "string" && "" !== data.prefix) {
      data.name = data.prefix + "/" + data.name;
      data.prefix = null;
    }
    data.name = util$a.sanitizePath(data.name);
    if (data.type !== "symlink" && data.name.slice(-1) === "/") {
      isDir = true;
      data.type = "directory";
    } else if (isDir) {
      data.name += "/";
    }
  }
  if (typeof data.mode === "number") {
    if (win32) {
      data.mode &= 511;
    } else {
      data.mode &= 4095;
    }
  } else if (data.stats && data.mode === null) {
    if (win32) {
      data.mode = data.stats.mode & 511;
    } else {
      data.mode = data.stats.mode & 4095;
    }
    if (win32 && isDir) {
      data.mode = 493;
    }
  } else if (data.mode === null) {
    data.mode = isDir ? 493 : 420;
  }
  if (data.stats && data.date === null) {
    data.date = data.stats.mtime;
  } else {
    data.date = util$a.dateify(data.date);
  }
  return data;
};
Archiver$1.prototype._onModuleError = function(err) {
  this.emit("error", err);
};
Archiver$1.prototype._onQueueDrain = function() {
  if (this._state.finalizing || this._state.finalized || this._state.aborted) {
    return;
  }
  if (this._state.finalize && this._pending === 0 && this._queue.idle() && this._statQueue.idle()) {
    this._finalize();
  }
};
Archiver$1.prototype._onQueueTask = function(task, callback) {
  var fullCallback = () => {
    if (task.data.callback) {
      task.data.callback();
    }
    callback();
  };
  if (this._state.finalizing || this._state.finalized || this._state.aborted) {
    fullCallback();
    return;
  }
  this._task = task;
  this._moduleAppend(task.source, task.data, fullCallback);
};
Archiver$1.prototype._onStatQueueTask = function(task, callback) {
  if (this._state.finalizing || this._state.finalized || this._state.aborted) {
    callback();
    return;
  }
  fs$2.lstat(task.filepath, (function(err, stats) {
    if (this._state.aborted) {
      setImmediate(callback);
      return;
    }
    if (err) {
      this._entriesCount--;
      this.emit("warning", err);
      setImmediate(callback);
      return;
    }
    task = this._updateQueueTaskWithStats(task, stats);
    if (task) {
      if (stats.size) {
        this._fsEntriesTotalBytes += stats.size;
      }
      this._queue.push(task);
    }
    setImmediate(callback);
  }).bind(this));
};
Archiver$1.prototype._shutdown = function() {
  this._moduleUnpipe();
  this.end();
};
Archiver$1.prototype._transform = function(chunk, encoding, callback) {
  if (chunk) {
    this._pointer += chunk.length;
  }
  callback(null, chunk);
};
Archiver$1.prototype._updateQueueTaskWithStats = function(task, stats) {
  if (stats.isFile()) {
    task.data.type = "file";
    task.data.sourceType = "stream";
    task.source = util$a.lazyReadStream(task.filepath);
  } else if (stats.isDirectory() && this._moduleSupports("directory")) {
    task.data.name = util$a.trailingSlashIt(task.data.name);
    task.data.type = "directory";
    task.data.sourcePath = util$a.trailingSlashIt(task.filepath);
    task.data.sourceType = "buffer";
    task.source = Buffer.concat([]);
  } else if (stats.isSymbolicLink() && this._moduleSupports("symlink")) {
    var linkPath = fs$2.readlinkSync(task.filepath);
    var dirName = path$2.dirname(task.filepath);
    task.data.type = "symlink";
    task.data.linkname = path$2.relative(dirName, path$2.resolve(dirName, linkPath));
    task.data.sourceType = "buffer";
    task.source = Buffer.concat([]);
  } else {
    if (stats.isDirectory()) {
      this.emit("warning", new ArchiverError("DIRECTORYNOTSUPPORTED", task.data));
    } else if (stats.isSymbolicLink()) {
      this.emit("warning", new ArchiverError("SYMLINKNOTSUPPORTED", task.data));
    } else {
      this.emit("warning", new ArchiverError("ENTRYNOTSUPPORTED", task.data));
    }
    return null;
  }
  task.data = this._normalizeEntryData(task.data, stats);
  return task;
};
Archiver$1.prototype.abort = function() {
  if (this._state.aborted || this._state.finalized) {
    return this;
  }
  this._abort();
  return this;
};
Archiver$1.prototype.append = function(source, data) {
  if (this._state.finalize || this._state.aborted) {
    this.emit("error", new ArchiverError("QUEUECLOSED"));
    return this;
  }
  data = this._normalizeEntryData(data);
  if (typeof data.name !== "string" || data.name.length === 0) {
    this.emit("error", new ArchiverError("ENTRYNAMEREQUIRED"));
    return this;
  }
  if (data.type === "directory" && !this._moduleSupports("directory")) {
    this.emit("error", new ArchiverError("DIRECTORYNOTSUPPORTED", { name: data.name }));
    return this;
  }
  source = util$a.normalizeInputSource(source);
  if (Buffer.isBuffer(source)) {
    data.sourceType = "buffer";
  } else if (util$a.isStream(source)) {
    data.sourceType = "stream";
  } else {
    this.emit("error", new ArchiverError("INPUTSTEAMBUFFERREQUIRED", { name: data.name }));
    return this;
  }
  this._entriesCount++;
  this._queue.push({
    data,
    source
  });
  return this;
};
Archiver$1.prototype.directory = function(dirpath, destpath, data) {
  if (this._state.finalize || this._state.aborted) {
    this.emit("error", new ArchiverError("QUEUECLOSED"));
    return this;
  }
  if (typeof dirpath !== "string" || dirpath.length === 0) {
    this.emit("error", new ArchiverError("DIRECTORYDIRPATHREQUIRED"));
    return this;
  }
  this._pending++;
  if (destpath === false) {
    destpath = "";
  } else if (typeof destpath !== "string") {
    destpath = dirpath;
  }
  var dataFunction = false;
  if (typeof data === "function") {
    dataFunction = data;
    data = {};
  } else if (typeof data !== "object") {
    data = {};
  }
  var globOptions = {
    stat: true,
    dot: true
  };
  function onGlobEnd() {
    this._pending--;
    this._maybeFinalize();
  }
  function onGlobError(err) {
    this.emit("error", err);
  }
  function onGlobMatch(match2) {
    globber.pause();
    var ignoreMatch = false;
    var entryData = Object.assign({}, data);
    entryData.name = match2.relative;
    entryData.prefix = destpath;
    entryData.stats = match2.stat;
    entryData.callback = globber.resume.bind(globber);
    try {
      if (dataFunction) {
        entryData = dataFunction(entryData);
        if (entryData === false) {
          ignoreMatch = true;
        } else if (typeof entryData !== "object") {
          throw new ArchiverError("DIRECTORYFUNCTIONINVALIDDATA", { dirpath });
        }
      }
    } catch (e) {
      this.emit("error", e);
      return;
    }
    if (ignoreMatch) {
      globber.resume();
      return;
    }
    this._append(match2.absolute, entryData);
  }
  var globber = glob$1(dirpath, globOptions);
  globber.on("error", onGlobError.bind(this));
  globber.on("match", onGlobMatch.bind(this));
  globber.on("end", onGlobEnd.bind(this));
  return this;
};
Archiver$1.prototype.file = function(filepath, data) {
  if (this._state.finalize || this._state.aborted) {
    this.emit("error", new ArchiverError("QUEUECLOSED"));
    return this;
  }
  if (typeof filepath !== "string" || filepath.length === 0) {
    this.emit("error", new ArchiverError("FILEFILEPATHREQUIRED"));
    return this;
  }
  this._append(filepath, data);
  return this;
};
Archiver$1.prototype.glob = function(pattern, options, data) {
  this._pending++;
  options = util$a.defaults(options, {
    stat: true,
    pattern
  });
  function onGlobEnd() {
    this._pending--;
    this._maybeFinalize();
  }
  function onGlobError(err) {
    this.emit("error", err);
  }
  function onGlobMatch(match2) {
    globber.pause();
    var entryData = Object.assign({}, data);
    entryData.callback = globber.resume.bind(globber);
    entryData.stats = match2.stat;
    entryData.name = match2.relative;
    this._append(match2.absolute, entryData);
  }
  var globber = glob$1(options.cwd || ".", options);
  globber.on("error", onGlobError.bind(this));
  globber.on("match", onGlobMatch.bind(this));
  globber.on("end", onGlobEnd.bind(this));
  return this;
};
Archiver$1.prototype.finalize = function() {
  if (this._state.aborted) {
    var abortedError = new ArchiverError("ABORTED");
    this.emit("error", abortedError);
    return Promise.reject(abortedError);
  }
  if (this._state.finalize) {
    var finalizingError = new ArchiverError("FINALIZING");
    this.emit("error", finalizingError);
    return Promise.reject(finalizingError);
  }
  this._state.finalize = true;
  if (this._pending === 0 && this._queue.idle() && this._statQueue.idle()) {
    this._finalize();
  }
  var self2 = this;
  return new Promise(function(resolve2, reject2) {
    var errored;
    self2._module.on("end", function() {
      if (!errored) {
        resolve2();
      }
    });
    self2._module.on("error", function(err) {
      errored = true;
      reject2(err);
    });
  });
};
Archiver$1.prototype.setFormat = function(format) {
  if (this._format) {
    this.emit("error", new ArchiverError("FORMATSET"));
    return this;
  }
  this._format = format;
  return this;
};
Archiver$1.prototype.setModule = function(module) {
  if (this._state.aborted) {
    this.emit("error", new ArchiverError("ABORTED"));
    return this;
  }
  if (this._state.module) {
    this.emit("error", new ArchiverError("MODULESET"));
    return this;
  }
  this._module = module;
  this._modulePipe();
  return this;
};
Archiver$1.prototype.symlink = function(filepath, target, mode) {
  if (this._state.finalize || this._state.aborted) {
    this.emit("error", new ArchiverError("QUEUECLOSED"));
    return this;
  }
  if (typeof filepath !== "string" || filepath.length === 0) {
    this.emit("error", new ArchiverError("SYMLINKFILEPATHREQUIRED"));
    return this;
  }
  if (typeof target !== "string" || target.length === 0) {
    this.emit("error", new ArchiverError("SYMLINKTARGETREQUIRED", { filepath }));
    return this;
  }
  if (!this._moduleSupports("symlink")) {
    this.emit("error", new ArchiverError("SYMLINKNOTSUPPORTED", { filepath }));
    return this;
  }
  var data = {};
  data.type = "symlink";
  data.name = filepath.replace(/\\/g, "/");
  data.linkname = target.replace(/\\/g, "/");
  data.sourceType = "buffer";
  if (typeof mode === "number") {
    data.mode = mode;
  }
  this._entriesCount++;
  this._queue.push({
    data,
    source: Buffer.concat([])
  });
  return this;
};
Archiver$1.prototype.pointer = function() {
  return this._pointer;
};
Archiver$1.prototype.use = function(plugin) {
  this._streams.push(plugin);
  return this;
};
var core = Archiver$1;
var zipStream = { exports: {} };
var archiveEntry = { exports: {} };
var ArchiveEntry$2 = archiveEntry.exports = function() {
};
ArchiveEntry$2.prototype.getName = function() {
};
ArchiveEntry$2.prototype.getSize = function() {
};
ArchiveEntry$2.prototype.getLastModifiedDate = function() {
};
ArchiveEntry$2.prototype.isDirectory = function() {
};
var archiveEntryExports = archiveEntry.exports;
var zipArchiveEntry = { exports: {} };
var generalPurposeBit = { exports: {} };
var util$9 = { exports: {} };
var util$8 = util$9.exports = {};
util$8.dateToDos = function(d, forceLocalTime) {
  forceLocalTime = forceLocalTime || false;
  var year = forceLocalTime ? d.getFullYear() : d.getUTCFullYear();
  if (year < 1980) {
    return 2162688;
  } else if (year >= 2044) {
    return 2141175677;
  }
  var val = {
    year,
    month: forceLocalTime ? d.getMonth() : d.getUTCMonth(),
    date: forceLocalTime ? d.getDate() : d.getUTCDate(),
    hours: forceLocalTime ? d.getHours() : d.getUTCHours(),
    minutes: forceLocalTime ? d.getMinutes() : d.getUTCMinutes(),
    seconds: forceLocalTime ? d.getSeconds() : d.getUTCSeconds()
  };
  return val.year - 1980 << 25 | val.month + 1 << 21 | val.date << 16 | val.hours << 11 | val.minutes << 5 | val.seconds / 2;
};
util$8.dosToDate = function(dos) {
  return new Date((dos >> 25 & 127) + 1980, (dos >> 21 & 15) - 1, dos >> 16 & 31, dos >> 11 & 31, dos >> 5 & 63, (dos & 31) << 1);
};
util$8.fromDosTime = function(buf) {
  return util$8.dosToDate(buf.readUInt32LE(0));
};
util$8.getEightBytes = function(v) {
  var buf = Buffer.alloc(8);
  buf.writeUInt32LE(v % 4294967296, 0);
  buf.writeUInt32LE(v / 4294967296 | 0, 4);
  return buf;
};
util$8.getShortBytes = function(v) {
  var buf = Buffer.alloc(2);
  buf.writeUInt16LE((v & 65535) >>> 0, 0);
  return buf;
};
util$8.getShortBytesValue = function(buf, offset) {
  return buf.readUInt16LE(offset);
};
util$8.getLongBytes = function(v) {
  var buf = Buffer.alloc(4);
  buf.writeUInt32LE((v & 4294967295) >>> 0, 0);
  return buf;
};
util$8.getLongBytesValue = function(buf, offset) {
  return buf.readUInt32LE(offset);
};
util$8.toDosTime = function(d) {
  return util$8.getLongBytes(util$8.dateToDos(d));
};
var utilExports$1 = util$9.exports;
var zipUtil$2 = utilExports$1;
var DATA_DESCRIPTOR_FLAG = 1 << 3;
var ENCRYPTION_FLAG = 1 << 0;
var NUMBER_OF_SHANNON_FANO_TREES_FLAG = 1 << 2;
var SLIDING_DICTIONARY_SIZE_FLAG = 1 << 1;
var STRONG_ENCRYPTION_FLAG = 1 << 6;
var UFT8_NAMES_FLAG = 1 << 11;
var GeneralPurposeBit$1 = generalPurposeBit.exports = function() {
  if (!(this instanceof GeneralPurposeBit$1)) {
    return new GeneralPurposeBit$1();
  }
  this.descriptor = false;
  this.encryption = false;
  this.utf8 = false;
  this.numberOfShannonFanoTrees = 0;
  this.strongEncryption = false;
  this.slidingDictionarySize = 0;
  return this;
};
GeneralPurposeBit$1.prototype.encode = function() {
  return zipUtil$2.getShortBytes(
    (this.descriptor ? DATA_DESCRIPTOR_FLAG : 0) | (this.utf8 ? UFT8_NAMES_FLAG : 0) | (this.encryption ? ENCRYPTION_FLAG : 0) | (this.strongEncryption ? STRONG_ENCRYPTION_FLAG : 0)
  );
};
GeneralPurposeBit$1.prototype.parse = function(buf, offset) {
  var flag = zipUtil$2.getShortBytesValue(buf, offset);
  var gbp = new GeneralPurposeBit$1();
  gbp.useDataDescriptor((flag & DATA_DESCRIPTOR_FLAG) !== 0);
  gbp.useUTF8ForNames((flag & UFT8_NAMES_FLAG) !== 0);
  gbp.useStrongEncryption((flag & STRONG_ENCRYPTION_FLAG) !== 0);
  gbp.useEncryption((flag & ENCRYPTION_FLAG) !== 0);
  gbp.setSlidingDictionarySize((flag & SLIDING_DICTIONARY_SIZE_FLAG) !== 0 ? 8192 : 4096);
  gbp.setNumberOfShannonFanoTrees((flag & NUMBER_OF_SHANNON_FANO_TREES_FLAG) !== 0 ? 3 : 2);
  return gbp;
};
GeneralPurposeBit$1.prototype.setNumberOfShannonFanoTrees = function(n) {
  this.numberOfShannonFanoTrees = n;
};
GeneralPurposeBit$1.prototype.getNumberOfShannonFanoTrees = function() {
  return this.numberOfShannonFanoTrees;
};
GeneralPurposeBit$1.prototype.setSlidingDictionarySize = function(n) {
  this.slidingDictionarySize = n;
};
GeneralPurposeBit$1.prototype.getSlidingDictionarySize = function() {
  return this.slidingDictionarySize;
};
GeneralPurposeBit$1.prototype.useDataDescriptor = function(b) {
  this.descriptor = b;
};
GeneralPurposeBit$1.prototype.usesDataDescriptor = function() {
  return this.descriptor;
};
GeneralPurposeBit$1.prototype.useEncryption = function(b) {
  this.encryption = b;
};
GeneralPurposeBit$1.prototype.usesEncryption = function() {
  return this.encryption;
};
GeneralPurposeBit$1.prototype.useStrongEncryption = function(b) {
  this.strongEncryption = b;
};
GeneralPurposeBit$1.prototype.usesStrongEncryption = function() {
  return this.strongEncryption;
};
GeneralPurposeBit$1.prototype.useUTF8ForNames = function(b) {
  this.utf8 = b;
};
GeneralPurposeBit$1.prototype.usesUTF8ForNames = function() {
  return this.utf8;
};
var generalPurposeBitExports = generalPurposeBit.exports;
var unixStat = {
  /**
   * Bits used to indicate the filesystem object type.
   */
  FILE_TYPE_FLAG: 61440,
  // 0170000
  /**
   * Indicates symbolic links.
   */
  LINK_FLAG: 40960
};
var constants$3 = {
  EMPTY: Buffer.alloc(0),
  SHORT_MASK: 65535,
  SHORT_SHIFT: 16,
  SHORT_ZERO: Buffer.from(Array(2)),
  LONG_ZERO: Buffer.from(Array(4)),
  MIN_VERSION_INITIAL: 10,
  MIN_VERSION_DATA_DESCRIPTOR: 20,
  MIN_VERSION_ZIP64: 45,
  VERSION_MADEBY: 45,
  METHOD_STORED: 0,
  METHOD_DEFLATED: 8,
  PLATFORM_UNIX: 3,
  PLATFORM_FAT: 0,
  SIG_LFH: 67324752,
  SIG_DD: 134695760,
  SIG_CFH: 33639248,
  SIG_EOCD: 101010256,
  SIG_ZIP64_EOCD: 101075792,
  SIG_ZIP64_EOCD_LOC: 117853008,
  ZIP64_MAGIC_SHORT: 65535,
  ZIP64_MAGIC: 4294967295,
  ZIP64_EXTRA_ID: 1,
  ZLIB_BEST_SPEED: 1,
  MODE_MASK: 4095,
  S_IFDIR: 16384,
  // 040000 directory
  S_IFREG: 32768,
  // 0100000 regular
  // DOS file type flags
  S_DOS_A: 32,
  // 040 Archive
  S_DOS_D: 16
};
var inherits$6 = require$$0$3.inherits;
var normalizePath$1 = normalizePath$3;
var ArchiveEntry$1 = archiveEntryExports;
var GeneralPurposeBit = generalPurposeBitExports;
var UnixStat = unixStat;
var constants$2 = constants$3;
var zipUtil$1 = utilExports$1;
var ZipArchiveEntry$1 = zipArchiveEntry.exports = function(name) {
  if (!(this instanceof ZipArchiveEntry$1)) {
    return new ZipArchiveEntry$1(name);
  }
  ArchiveEntry$1.call(this);
  this.platform = constants$2.PLATFORM_FAT;
  this.method = -1;
  this.name = null;
  this.size = 0;
  this.csize = 0;
  this.gpb = new GeneralPurposeBit();
  this.crc = 0;
  this.time = -1;
  this.minver = constants$2.MIN_VERSION_INITIAL;
  this.mode = -1;
  this.extra = null;
  this.exattr = 0;
  this.inattr = 0;
  this.comment = null;
  if (name) {
    this.setName(name);
  }
};
inherits$6(ZipArchiveEntry$1, ArchiveEntry$1);
ZipArchiveEntry$1.prototype.getCentralDirectoryExtra = function() {
  return this.getExtra();
};
ZipArchiveEntry$1.prototype.getComment = function() {
  return this.comment !== null ? this.comment : "";
};
ZipArchiveEntry$1.prototype.getCompressedSize = function() {
  return this.csize;
};
ZipArchiveEntry$1.prototype.getCrc = function() {
  return this.crc;
};
ZipArchiveEntry$1.prototype.getExternalAttributes = function() {
  return this.exattr;
};
ZipArchiveEntry$1.prototype.getExtra = function() {
  return this.extra !== null ? this.extra : constants$2.EMPTY;
};
ZipArchiveEntry$1.prototype.getGeneralPurposeBit = function() {
  return this.gpb;
};
ZipArchiveEntry$1.prototype.getInternalAttributes = function() {
  return this.inattr;
};
ZipArchiveEntry$1.prototype.getLastModifiedDate = function() {
  return this.getTime();
};
ZipArchiveEntry$1.prototype.getLocalFileDataExtra = function() {
  return this.getExtra();
};
ZipArchiveEntry$1.prototype.getMethod = function() {
  return this.method;
};
ZipArchiveEntry$1.prototype.getName = function() {
  return this.name;
};
ZipArchiveEntry$1.prototype.getPlatform = function() {
  return this.platform;
};
ZipArchiveEntry$1.prototype.getSize = function() {
  return this.size;
};
ZipArchiveEntry$1.prototype.getTime = function() {
  return this.time !== -1 ? zipUtil$1.dosToDate(this.time) : -1;
};
ZipArchiveEntry$1.prototype.getTimeDos = function() {
  return this.time !== -1 ? this.time : 0;
};
ZipArchiveEntry$1.prototype.getUnixMode = function() {
  return this.platform !== constants$2.PLATFORM_UNIX ? 0 : this.getExternalAttributes() >> constants$2.SHORT_SHIFT & constants$2.SHORT_MASK;
};
ZipArchiveEntry$1.prototype.getVersionNeededToExtract = function() {
  return this.minver;
};
ZipArchiveEntry$1.prototype.setComment = function(comment) {
  if (Buffer.byteLength(comment) !== comment.length) {
    this.getGeneralPurposeBit().useUTF8ForNames(true);
  }
  this.comment = comment;
};
ZipArchiveEntry$1.prototype.setCompressedSize = function(size) {
  if (size < 0) {
    throw new Error("invalid entry compressed size");
  }
  this.csize = size;
};
ZipArchiveEntry$1.prototype.setCrc = function(crc) {
  if (crc < 0) {
    throw new Error("invalid entry crc32");
  }
  this.crc = crc;
};
ZipArchiveEntry$1.prototype.setExternalAttributes = function(attr) {
  this.exattr = attr >>> 0;
};
ZipArchiveEntry$1.prototype.setExtra = function(extra) {
  this.extra = extra;
};
ZipArchiveEntry$1.prototype.setGeneralPurposeBit = function(gpb) {
  if (!(gpb instanceof GeneralPurposeBit)) {
    throw new Error("invalid entry GeneralPurposeBit");
  }
  this.gpb = gpb;
};
ZipArchiveEntry$1.prototype.setInternalAttributes = function(attr) {
  this.inattr = attr;
};
ZipArchiveEntry$1.prototype.setMethod = function(method) {
  if (method < 0) {
    throw new Error("invalid entry compression method");
  }
  this.method = method;
};
ZipArchiveEntry$1.prototype.setName = function(name, prependSlash = false) {
  name = normalizePath$1(name, false).replace(/^\w+:/, "").replace(/^(\.\.\/|\/)+/, "");
  if (prependSlash) {
    name = `/${name}`;
  }
  if (Buffer.byteLength(name) !== name.length) {
    this.getGeneralPurposeBit().useUTF8ForNames(true);
  }
  this.name = name;
};
ZipArchiveEntry$1.prototype.setPlatform = function(platform2) {
  this.platform = platform2;
};
ZipArchiveEntry$1.prototype.setSize = function(size) {
  if (size < 0) {
    throw new Error("invalid entry size");
  }
  this.size = size;
};
ZipArchiveEntry$1.prototype.setTime = function(time, forceLocalTime) {
  if (!(time instanceof Date)) {
    throw new Error("invalid entry time");
  }
  this.time = zipUtil$1.dateToDos(time, forceLocalTime);
};
ZipArchiveEntry$1.prototype.setUnixMode = function(mode) {
  mode |= this.isDirectory() ? constants$2.S_IFDIR : constants$2.S_IFREG;
  var extattr = 0;
  extattr |= mode << constants$2.SHORT_SHIFT | (this.isDirectory() ? constants$2.S_DOS_D : constants$2.S_DOS_A);
  this.setExternalAttributes(extattr);
  this.mode = mode & constants$2.MODE_MASK;
  this.platform = constants$2.PLATFORM_UNIX;
};
ZipArchiveEntry$1.prototype.setVersionNeededToExtract = function(minver) {
  this.minver = minver;
};
ZipArchiveEntry$1.prototype.isDirectory = function() {
  return this.getName().slice(-1) === "/";
};
ZipArchiveEntry$1.prototype.isUnixSymlink = function() {
  return (this.getUnixMode() & UnixStat.FILE_TYPE_FLAG) === UnixStat.LINK_FLAG;
};
ZipArchiveEntry$1.prototype.isZip64 = function() {
  return this.csize > constants$2.ZIP64_MAGIC || this.size > constants$2.ZIP64_MAGIC;
};
var zipArchiveEntryExports = zipArchiveEntry.exports;
var archiveOutputStream = { exports: {} };
var util$7 = { exports: {} };
var Stream$1 = require$$0$2.Stream;
var PassThrough$2 = readableExports.PassThrough;
var util$6 = util$7.exports = {};
util$6.isStream = function(source) {
  return source instanceof Stream$1;
};
util$6.normalizeInputSource = function(source) {
  if (source === null) {
    return Buffer.alloc(0);
  } else if (typeof source === "string") {
    return Buffer.from(source);
  } else if (util$6.isStream(source) && !source._readableState) {
    var normalized = new PassThrough$2();
    source.pipe(normalized);
    return normalized;
  }
  return source;
};
var utilExports = util$7.exports;
var inherits$5 = require$$0$3.inherits;
var Transform$2 = readableExports.Transform;
var ArchiveEntry = archiveEntryExports;
var util$5 = utilExports;
var ArchiveOutputStream$1 = archiveOutputStream.exports = function(options) {
  if (!(this instanceof ArchiveOutputStream$1)) {
    return new ArchiveOutputStream$1(options);
  }
  Transform$2.call(this, options);
  this.offset = 0;
  this._archive = {
    finish: false,
    finished: false,
    processing: false
  };
};
inherits$5(ArchiveOutputStream$1, Transform$2);
ArchiveOutputStream$1.prototype._appendBuffer = function(zae, source, callback) {
};
ArchiveOutputStream$1.prototype._appendStream = function(zae, source, callback) {
};
ArchiveOutputStream$1.prototype._emitErrorCallback = function(err) {
  if (err) {
    this.emit("error", err);
  }
};
ArchiveOutputStream$1.prototype._finish = function(ae) {
};
ArchiveOutputStream$1.prototype._normalizeEntry = function(ae) {
};
ArchiveOutputStream$1.prototype._transform = function(chunk, encoding, callback) {
  callback(null, chunk);
};
ArchiveOutputStream$1.prototype.entry = function(ae, source, callback) {
  source = source || null;
  if (typeof callback !== "function") {
    callback = this._emitErrorCallback.bind(this);
  }
  if (!(ae instanceof ArchiveEntry)) {
    callback(new Error("not a valid instance of ArchiveEntry"));
    return;
  }
  if (this._archive.finish || this._archive.finished) {
    callback(new Error("unacceptable entry after finish"));
    return;
  }
  if (this._archive.processing) {
    callback(new Error("already processing an entry"));
    return;
  }
  this._archive.processing = true;
  this._normalizeEntry(ae);
  this._entry = ae;
  source = util$5.normalizeInputSource(source);
  if (Buffer.isBuffer(source)) {
    this._appendBuffer(ae, source, callback);
  } else if (util$5.isStream(source)) {
    this._appendStream(ae, source, callback);
  } else {
    this._archive.processing = false;
    callback(new Error("input source must be valid Stream or Buffer instance"));
    return;
  }
  return this;
};
ArchiveOutputStream$1.prototype.finish = function() {
  if (this._archive.processing) {
    this._archive.finish = true;
    return;
  }
  this._finish();
};
ArchiveOutputStream$1.prototype.getBytesWritten = function() {
  return this.offset;
};
ArchiveOutputStream$1.prototype.write = function(chunk, cb) {
  if (chunk) {
    this.offset += chunk.length;
  }
  return Transform$2.prototype.write.call(this, chunk, cb);
};
var archiveOutputStreamExports = archiveOutputStream.exports;
var zipArchiveOutputStream = { exports: {} };
var Buffer$2 = require$$0$4.Buffer;
var CRC_TABLE = [
  0,
  1996959894,
  3993919788,
  2567524794,
  124634137,
  1886057615,
  3915621685,
  2657392035,
  249268274,
  2044508324,
  3772115230,
  2547177864,
  162941995,
  2125561021,
  3887607047,
  2428444049,
  498536548,
  1789927666,
  4089016648,
  2227061214,
  450548861,
  1843258603,
  4107580753,
  2211677639,
  325883990,
  1684777152,
  4251122042,
  2321926636,
  335633487,
  1661365465,
  4195302755,
  2366115317,
  997073096,
  1281953886,
  3579855332,
  2724688242,
  1006888145,
  1258607687,
  3524101629,
  2768942443,
  901097722,
  1119000684,
  3686517206,
  2898065728,
  853044451,
  1172266101,
  3705015759,
  2882616665,
  651767980,
  1373503546,
  3369554304,
  3218104598,
  565507253,
  1454621731,
  3485111705,
  3099436303,
  671266974,
  1594198024,
  3322730930,
  2970347812,
  795835527,
  1483230225,
  3244367275,
  3060149565,
  1994146192,
  31158534,
  2563907772,
  4023717930,
  1907459465,
  112637215,
  2680153253,
  3904427059,
  2013776290,
  251722036,
  2517215374,
  3775830040,
  2137656763,
  141376813,
  2439277719,
  3865271297,
  1802195444,
  476864866,
  2238001368,
  4066508878,
  1812370925,
  453092731,
  2181625025,
  4111451223,
  1706088902,
  314042704,
  2344532202,
  4240017532,
  1658658271,
  366619977,
  2362670323,
  4224994405,
  1303535960,
  984961486,
  2747007092,
  3569037538,
  1256170817,
  1037604311,
  2765210733,
  3554079995,
  1131014506,
  879679996,
  2909243462,
  3663771856,
  1141124467,
  855842277,
  2852801631,
  3708648649,
  1342533948,
  654459306,
  3188396048,
  3373015174,
  1466479909,
  544179635,
  3110523913,
  3462522015,
  1591671054,
  702138776,
  2966460450,
  3352799412,
  1504918807,
  783551873,
  3082640443,
  3233442989,
  3988292384,
  2596254646,
  62317068,
  1957810842,
  3939845945,
  2647816111,
  81470997,
  1943803523,
  3814918930,
  2489596804,
  225274430,
  2053790376,
  3826175755,
  2466906013,
  167816743,
  2097651377,
  4027552580,
  2265490386,
  503444072,
  1762050814,
  4150417245,
  2154129355,
  426522225,
  1852507879,
  4275313526,
  2312317920,
  282753626,
  1742555852,
  4189708143,
  2394877945,
  397917763,
  1622183637,
  3604390888,
  2714866558,
  953729732,
  1340076626,
  3518719985,
  2797360999,
  1068828381,
  1219638859,
  3624741850,
  2936675148,
  906185462,
  1090812512,
  3747672003,
  2825379669,
  829329135,
  1181335161,
  3412177804,
  3160834842,
  628085408,
  1382605366,
  3423369109,
  3138078467,
  570562233,
  1426400815,
  3317316542,
  2998733608,
  733239954,
  1555261956,
  3268935591,
  3050360625,
  752459403,
  1541320221,
  2607071920,
  3965973030,
  1969922972,
  40735498,
  2617837225,
  3943577151,
  1913087877,
  83908371,
  2512341634,
  3803740692,
  2075208622,
  213261112,
  2463272603,
  3855990285,
  2094854071,
  198958881,
  2262029012,
  4057260610,
  1759359992,
  534414190,
  2176718541,
  4139329115,
  1873836001,
  414664567,
  2282248934,
  4279200368,
  1711684554,
  285281116,
  2405801727,
  4167216745,
  1634467795,
  376229701,
  2685067896,
  3608007406,
  1308918612,
  956543938,
  2808555105,
  3495958263,
  1231636301,
  1047427035,
  2932959818,
  3654703836,
  1088359270,
  936918e3,
  2847714899,
  3736837829,
  1202900863,
  817233897,
  3183342108,
  3401237130,
  1404277552,
  615818150,
  3134207493,
  3453421203,
  1423857449,
  601450431,
  3009837614,
  3294710456,
  1567103746,
  711928724,
  3020668471,
  3272380065,
  1510334235,
  755167117
];
if (typeof Int32Array !== "undefined") {
  CRC_TABLE = new Int32Array(CRC_TABLE);
}
function ensureBuffer(input) {
  if (Buffer$2.isBuffer(input)) {
    return input;
  }
  var hasNewBufferAPI = typeof Buffer$2.alloc === "function" && typeof Buffer$2.from === "function";
  if (typeof input === "number") {
    return hasNewBufferAPI ? Buffer$2.alloc(input) : new Buffer$2(input);
  } else if (typeof input === "string") {
    return hasNewBufferAPI ? Buffer$2.from(input) : new Buffer$2(input);
  } else {
    throw new Error("input must be buffer, number, or string, received " + typeof input);
  }
}
function bufferizeInt(num) {
  var tmp = ensureBuffer(4);
  tmp.writeInt32BE(num, 0);
  return tmp;
}
function _crc32(buf, previous) {
  buf = ensureBuffer(buf);
  if (Buffer$2.isBuffer(previous)) {
    previous = previous.readUInt32BE(0);
  }
  var crc = ~~previous ^ -1;
  for (var n = 0; n < buf.length; n++) {
    crc = CRC_TABLE[(crc ^ buf[n]) & 255] ^ crc >>> 8;
  }
  return crc ^ -1;
}
function crc32$5() {
  return bufferizeInt(_crc32.apply(null, arguments));
}
crc32$5.signed = function() {
  return _crc32.apply(null, arguments);
};
crc32$5.unsigned = function() {
  return _crc32.apply(null, arguments) >>> 0;
};
var bufferCrc32 = crc32$5;
var crc32$4 = {};
/*! crc32.js (C) 2014-present SheetJS -- http://sheetjs.com */
(function(exports) {
  (function(factory) {
    if (typeof DO_NOT_EXPORT_CRC === "undefined") {
      {
        factory(exports);
      }
    } else {
      factory({});
    }
  })(function(CRC32) {
    CRC32.version = "1.2.2";
    function signed_crc_table() {
      var c = 0, table = new Array(256);
      for (var n = 0; n != 256; ++n) {
        c = n;
        c = c & 1 ? -306674912 ^ c >>> 1 : c >>> 1;
        c = c & 1 ? -306674912 ^ c >>> 1 : c >>> 1;
        c = c & 1 ? -306674912 ^ c >>> 1 : c >>> 1;
        c = c & 1 ? -306674912 ^ c >>> 1 : c >>> 1;
        c = c & 1 ? -306674912 ^ c >>> 1 : c >>> 1;
        c = c & 1 ? -306674912 ^ c >>> 1 : c >>> 1;
        c = c & 1 ? -306674912 ^ c >>> 1 : c >>> 1;
        c = c & 1 ? -306674912 ^ c >>> 1 : c >>> 1;
        table[n] = c;
      }
      return typeof Int32Array !== "undefined" ? new Int32Array(table) : table;
    }
    var T0 = signed_crc_table();
    function slice_by_16_tables(T) {
      var c = 0, v = 0, n = 0, table = typeof Int32Array !== "undefined" ? new Int32Array(4096) : new Array(4096);
      for (n = 0; n != 256; ++n) table[n] = T[n];
      for (n = 0; n != 256; ++n) {
        v = T[n];
        for (c = 256 + n; c < 4096; c += 256) v = table[c] = v >>> 8 ^ T[v & 255];
      }
      var out = [];
      for (n = 1; n != 16; ++n) out[n - 1] = typeof Int32Array !== "undefined" ? table.subarray(n * 256, n * 256 + 256) : table.slice(n * 256, n * 256 + 256);
      return out;
    }
    var TT = slice_by_16_tables(T0);
    var T1 = TT[0], T2 = TT[1], T3 = TT[2], T4 = TT[3], T5 = TT[4];
    var T6 = TT[5], T7 = TT[6], T8 = TT[7], T9 = TT[8], Ta = TT[9];
    var Tb = TT[10], Tc = TT[11], Td = TT[12], Te = TT[13], Tf = TT[14];
    function crc32_bstr(bstr, seed) {
      var C = seed ^ -1;
      for (var i = 0, L = bstr.length; i < L; ) C = C >>> 8 ^ T0[(C ^ bstr.charCodeAt(i++)) & 255];
      return ~C;
    }
    function crc32_buf(B, seed) {
      var C = seed ^ -1, L = B.length - 15, i = 0;
      for (; i < L; ) C = Tf[B[i++] ^ C & 255] ^ Te[B[i++] ^ C >> 8 & 255] ^ Td[B[i++] ^ C >> 16 & 255] ^ Tc[B[i++] ^ C >>> 24] ^ Tb[B[i++]] ^ Ta[B[i++]] ^ T9[B[i++]] ^ T8[B[i++]] ^ T7[B[i++]] ^ T6[B[i++]] ^ T5[B[i++]] ^ T4[B[i++]] ^ T3[B[i++]] ^ T2[B[i++]] ^ T1[B[i++]] ^ T0[B[i++]];
      L += 15;
      while (i < L) C = C >>> 8 ^ T0[(C ^ B[i++]) & 255];
      return ~C;
    }
    function crc32_str(str, seed) {
      var C = seed ^ -1;
      for (var i = 0, L = str.length, c = 0, d = 0; i < L; ) {
        c = str.charCodeAt(i++);
        if (c < 128) {
          C = C >>> 8 ^ T0[(C ^ c) & 255];
        } else if (c < 2048) {
          C = C >>> 8 ^ T0[(C ^ (192 | c >> 6 & 31)) & 255];
          C = C >>> 8 ^ T0[(C ^ (128 | c & 63)) & 255];
        } else if (c >= 55296 && c < 57344) {
          c = (c & 1023) + 64;
          d = str.charCodeAt(i++) & 1023;
          C = C >>> 8 ^ T0[(C ^ (240 | c >> 8 & 7)) & 255];
          C = C >>> 8 ^ T0[(C ^ (128 | c >> 2 & 63)) & 255];
          C = C >>> 8 ^ T0[(C ^ (128 | d >> 6 & 15 | (c & 3) << 4)) & 255];
          C = C >>> 8 ^ T0[(C ^ (128 | d & 63)) & 255];
        } else {
          C = C >>> 8 ^ T0[(C ^ (224 | c >> 12 & 15)) & 255];
          C = C >>> 8 ^ T0[(C ^ (128 | c >> 6 & 63)) & 255];
          C = C >>> 8 ^ T0[(C ^ (128 | c & 63)) & 255];
        }
      }
      return ~C;
    }
    CRC32.table = T0;
    CRC32.bstr = crc32_bstr;
    CRC32.buf = crc32_buf;
    CRC32.str = crc32_str;
  });
})(crc32$4);
const { Transform: Transform$1 } = readableExports;
const crc32$3 = crc32$4;
let CRC32Stream$1 = class CRC32Stream extends Transform$1 {
  constructor(options) {
    super(options);
    this.checksum = Buffer.allocUnsafe(4);
    this.checksum.writeInt32BE(0, 0);
    this.rawSize = 0;
  }
  _transform(chunk, encoding, callback) {
    if (chunk) {
      this.checksum = crc32$3.buf(chunk, this.checksum) >>> 0;
      this.rawSize += chunk.length;
    }
    callback(null, chunk);
  }
  digest(encoding) {
    const checksum = Buffer.allocUnsafe(4);
    checksum.writeUInt32BE(this.checksum >>> 0, 0);
    return encoding ? checksum.toString(encoding) : checksum;
  }
  hex() {
    return this.digest("hex").toUpperCase();
  }
  size() {
    return this.rawSize;
  }
};
var crc32Stream = CRC32Stream$1;
const { DeflateRaw } = require$$0$5;
const crc32$2 = crc32$4;
let DeflateCRC32Stream$1 = class DeflateCRC32Stream extends DeflateRaw {
  constructor(options) {
    super(options);
    this.checksum = Buffer.allocUnsafe(4);
    this.checksum.writeInt32BE(0, 0);
    this.rawSize = 0;
    this.compressedSize = 0;
  }
  push(chunk, encoding) {
    if (chunk) {
      this.compressedSize += chunk.length;
    }
    return super.push(chunk, encoding);
  }
  _transform(chunk, encoding, callback) {
    if (chunk) {
      this.checksum = crc32$2.buf(chunk, this.checksum) >>> 0;
      this.rawSize += chunk.length;
    }
    super._transform(chunk, encoding, callback);
  }
  digest(encoding) {
    const checksum = Buffer.allocUnsafe(4);
    checksum.writeUInt32BE(this.checksum >>> 0, 0);
    return encoding ? checksum.toString(encoding) : checksum;
  }
  hex() {
    return this.digest("hex").toUpperCase();
  }
  size(compressed = false) {
    if (compressed) {
      return this.compressedSize;
    } else {
      return this.rawSize;
    }
  }
};
var deflateCrc32Stream = DeflateCRC32Stream$1;
var lib = {
  CRC32Stream: crc32Stream,
  DeflateCRC32Stream: deflateCrc32Stream
};
var inherits$4 = require$$0$3.inherits;
var crc32$1 = bufferCrc32;
var { CRC32Stream: CRC32Stream2 } = lib;
var { DeflateCRC32Stream: DeflateCRC32Stream2 } = lib;
var ArchiveOutputStream = archiveOutputStreamExports;
var constants$1 = constants$3;
var zipUtil = utilExports$1;
var ZipArchiveOutputStream$1 = zipArchiveOutputStream.exports = function(options) {
  if (!(this instanceof ZipArchiveOutputStream$1)) {
    return new ZipArchiveOutputStream$1(options);
  }
  options = this.options = this._defaults(options);
  ArchiveOutputStream.call(this, options);
  this._entry = null;
  this._entries = [];
  this._archive = {
    centralLength: 0,
    centralOffset: 0,
    comment: "",
    finish: false,
    finished: false,
    processing: false,
    forceZip64: options.forceZip64,
    forceLocalTime: options.forceLocalTime
  };
};
inherits$4(ZipArchiveOutputStream$1, ArchiveOutputStream);
ZipArchiveOutputStream$1.prototype._afterAppend = function(ae) {
  this._entries.push(ae);
  if (ae.getGeneralPurposeBit().usesDataDescriptor()) {
    this._writeDataDescriptor(ae);
  }
  this._archive.processing = false;
  this._entry = null;
  if (this._archive.finish && !this._archive.finished) {
    this._finish();
  }
};
ZipArchiveOutputStream$1.prototype._appendBuffer = function(ae, source, callback) {
  if (source.length === 0) {
    ae.setMethod(constants$1.METHOD_STORED);
  }
  var method = ae.getMethod();
  if (method === constants$1.METHOD_STORED) {
    ae.setSize(source.length);
    ae.setCompressedSize(source.length);
    ae.setCrc(crc32$1.unsigned(source));
  }
  this._writeLocalFileHeader(ae);
  if (method === constants$1.METHOD_STORED) {
    this.write(source);
    this._afterAppend(ae);
    callback(null, ae);
    return;
  } else if (method === constants$1.METHOD_DEFLATED) {
    this._smartStream(ae, callback).end(source);
    return;
  } else {
    callback(new Error("compression method " + method + " not implemented"));
    return;
  }
};
ZipArchiveOutputStream$1.prototype._appendStream = function(ae, source, callback) {
  ae.getGeneralPurposeBit().useDataDescriptor(true);
  ae.setVersionNeededToExtract(constants$1.MIN_VERSION_DATA_DESCRIPTOR);
  this._writeLocalFileHeader(ae);
  var smart = this._smartStream(ae, callback);
  source.once("error", function(err) {
    smart.emit("error", err);
    smart.end();
  });
  source.pipe(smart);
};
ZipArchiveOutputStream$1.prototype._defaults = function(o) {
  if (typeof o !== "object") {
    o = {};
  }
  if (typeof o.zlib !== "object") {
    o.zlib = {};
  }
  if (typeof o.zlib.level !== "number") {
    o.zlib.level = constants$1.ZLIB_BEST_SPEED;
  }
  o.forceZip64 = !!o.forceZip64;
  o.forceLocalTime = !!o.forceLocalTime;
  return o;
};
ZipArchiveOutputStream$1.prototype._finish = function() {
  this._archive.centralOffset = this.offset;
  this._entries.forEach((function(ae) {
    this._writeCentralFileHeader(ae);
  }).bind(this));
  this._archive.centralLength = this.offset - this._archive.centralOffset;
  if (this.isZip64()) {
    this._writeCentralDirectoryZip64();
  }
  this._writeCentralDirectoryEnd();
  this._archive.processing = false;
  this._archive.finish = true;
  this._archive.finished = true;
  this.end();
};
ZipArchiveOutputStream$1.prototype._normalizeEntry = function(ae) {
  if (ae.getMethod() === -1) {
    ae.setMethod(constants$1.METHOD_DEFLATED);
  }
  if (ae.getMethod() === constants$1.METHOD_DEFLATED) {
    ae.getGeneralPurposeBit().useDataDescriptor(true);
    ae.setVersionNeededToExtract(constants$1.MIN_VERSION_DATA_DESCRIPTOR);
  }
  if (ae.getTime() === -1) {
    ae.setTime(/* @__PURE__ */ new Date(), this._archive.forceLocalTime);
  }
  ae._offsets = {
    file: 0,
    data: 0,
    contents: 0
  };
};
ZipArchiveOutputStream$1.prototype._smartStream = function(ae, callback) {
  var deflate = ae.getMethod() === constants$1.METHOD_DEFLATED;
  var process2 = deflate ? new DeflateCRC32Stream2(this.options.zlib) : new CRC32Stream2();
  var error2 = null;
  function handleStuff() {
    var digest = process2.digest().readUInt32BE(0);
    ae.setCrc(digest);
    ae.setSize(process2.size());
    ae.setCompressedSize(process2.size(true));
    this._afterAppend(ae);
    callback(error2, ae);
  }
  process2.once("end", handleStuff.bind(this));
  process2.once("error", function(err) {
    error2 = err;
  });
  process2.pipe(this, { end: false });
  return process2;
};
ZipArchiveOutputStream$1.prototype._writeCentralDirectoryEnd = function() {
  var records = this._entries.length;
  var size = this._archive.centralLength;
  var offset = this._archive.centralOffset;
  if (this.isZip64()) {
    records = constants$1.ZIP64_MAGIC_SHORT;
    size = constants$1.ZIP64_MAGIC;
    offset = constants$1.ZIP64_MAGIC;
  }
  this.write(zipUtil.getLongBytes(constants$1.SIG_EOCD));
  this.write(constants$1.SHORT_ZERO);
  this.write(constants$1.SHORT_ZERO);
  this.write(zipUtil.getShortBytes(records));
  this.write(zipUtil.getShortBytes(records));
  this.write(zipUtil.getLongBytes(size));
  this.write(zipUtil.getLongBytes(offset));
  var comment = this.getComment();
  var commentLength = Buffer.byteLength(comment);
  this.write(zipUtil.getShortBytes(commentLength));
  this.write(comment);
};
ZipArchiveOutputStream$1.prototype._writeCentralDirectoryZip64 = function() {
  this.write(zipUtil.getLongBytes(constants$1.SIG_ZIP64_EOCD));
  this.write(zipUtil.getEightBytes(44));
  this.write(zipUtil.getShortBytes(constants$1.MIN_VERSION_ZIP64));
  this.write(zipUtil.getShortBytes(constants$1.MIN_VERSION_ZIP64));
  this.write(constants$1.LONG_ZERO);
  this.write(constants$1.LONG_ZERO);
  this.write(zipUtil.getEightBytes(this._entries.length));
  this.write(zipUtil.getEightBytes(this._entries.length));
  this.write(zipUtil.getEightBytes(this._archive.centralLength));
  this.write(zipUtil.getEightBytes(this._archive.centralOffset));
  this.write(zipUtil.getLongBytes(constants$1.SIG_ZIP64_EOCD_LOC));
  this.write(constants$1.LONG_ZERO);
  this.write(zipUtil.getEightBytes(this._archive.centralOffset + this._archive.centralLength));
  this.write(zipUtil.getLongBytes(1));
};
ZipArchiveOutputStream$1.prototype._writeCentralFileHeader = function(ae) {
  var gpb = ae.getGeneralPurposeBit();
  var method = ae.getMethod();
  var offsets = ae._offsets;
  var size = ae.getSize();
  var compressedSize = ae.getCompressedSize();
  if (ae.isZip64() || offsets.file > constants$1.ZIP64_MAGIC) {
    size = constants$1.ZIP64_MAGIC;
    compressedSize = constants$1.ZIP64_MAGIC;
    ae.setVersionNeededToExtract(constants$1.MIN_VERSION_ZIP64);
    var extraBuf = Buffer.concat([
      zipUtil.getShortBytes(constants$1.ZIP64_EXTRA_ID),
      zipUtil.getShortBytes(24),
      zipUtil.getEightBytes(ae.getSize()),
      zipUtil.getEightBytes(ae.getCompressedSize()),
      zipUtil.getEightBytes(offsets.file)
    ], 28);
    ae.setExtra(extraBuf);
  }
  this.write(zipUtil.getLongBytes(constants$1.SIG_CFH));
  this.write(zipUtil.getShortBytes(ae.getPlatform() << 8 | constants$1.VERSION_MADEBY));
  this.write(zipUtil.getShortBytes(ae.getVersionNeededToExtract()));
  this.write(gpb.encode());
  this.write(zipUtil.getShortBytes(method));
  this.write(zipUtil.getLongBytes(ae.getTimeDos()));
  this.write(zipUtil.getLongBytes(ae.getCrc()));
  this.write(zipUtil.getLongBytes(compressedSize));
  this.write(zipUtil.getLongBytes(size));
  var name = ae.getName();
  var comment = ae.getComment();
  var extra = ae.getCentralDirectoryExtra();
  if (gpb.usesUTF8ForNames()) {
    name = Buffer.from(name);
    comment = Buffer.from(comment);
  }
  this.write(zipUtil.getShortBytes(name.length));
  this.write(zipUtil.getShortBytes(extra.length));
  this.write(zipUtil.getShortBytes(comment.length));
  this.write(constants$1.SHORT_ZERO);
  this.write(zipUtil.getShortBytes(ae.getInternalAttributes()));
  this.write(zipUtil.getLongBytes(ae.getExternalAttributes()));
  if (offsets.file > constants$1.ZIP64_MAGIC) {
    this.write(zipUtil.getLongBytes(constants$1.ZIP64_MAGIC));
  } else {
    this.write(zipUtil.getLongBytes(offsets.file));
  }
  this.write(name);
  this.write(extra);
  this.write(comment);
};
ZipArchiveOutputStream$1.prototype._writeDataDescriptor = function(ae) {
  this.write(zipUtil.getLongBytes(constants$1.SIG_DD));
  this.write(zipUtil.getLongBytes(ae.getCrc()));
  if (ae.isZip64()) {
    this.write(zipUtil.getEightBytes(ae.getCompressedSize()));
    this.write(zipUtil.getEightBytes(ae.getSize()));
  } else {
    this.write(zipUtil.getLongBytes(ae.getCompressedSize()));
    this.write(zipUtil.getLongBytes(ae.getSize()));
  }
};
ZipArchiveOutputStream$1.prototype._writeLocalFileHeader = function(ae) {
  var gpb = ae.getGeneralPurposeBit();
  var method = ae.getMethod();
  var name = ae.getName();
  var extra = ae.getLocalFileDataExtra();
  if (ae.isZip64()) {
    gpb.useDataDescriptor(true);
    ae.setVersionNeededToExtract(constants$1.MIN_VERSION_ZIP64);
  }
  if (gpb.usesUTF8ForNames()) {
    name = Buffer.from(name);
  }
  ae._offsets.file = this.offset;
  this.write(zipUtil.getLongBytes(constants$1.SIG_LFH));
  this.write(zipUtil.getShortBytes(ae.getVersionNeededToExtract()));
  this.write(gpb.encode());
  this.write(zipUtil.getShortBytes(method));
  this.write(zipUtil.getLongBytes(ae.getTimeDos()));
  ae._offsets.data = this.offset;
  if (gpb.usesDataDescriptor()) {
    this.write(constants$1.LONG_ZERO);
    this.write(constants$1.LONG_ZERO);
    this.write(constants$1.LONG_ZERO);
  } else {
    this.write(zipUtil.getLongBytes(ae.getCrc()));
    this.write(zipUtil.getLongBytes(ae.getCompressedSize()));
    this.write(zipUtil.getLongBytes(ae.getSize()));
  }
  this.write(zipUtil.getShortBytes(name.length));
  this.write(zipUtil.getShortBytes(extra.length));
  this.write(name);
  this.write(extra);
  ae._offsets.contents = this.offset;
};
ZipArchiveOutputStream$1.prototype.getComment = function(comment) {
  return this._archive.comment !== null ? this._archive.comment : "";
};
ZipArchiveOutputStream$1.prototype.isZip64 = function() {
  return this._archive.forceZip64 || this._entries.length > constants$1.ZIP64_MAGIC_SHORT || this._archive.centralLength > constants$1.ZIP64_MAGIC || this._archive.centralOffset > constants$1.ZIP64_MAGIC;
};
ZipArchiveOutputStream$1.prototype.setComment = function(comment) {
  this._archive.comment = comment;
};
var zipArchiveOutputStreamExports = zipArchiveOutputStream.exports;
var compressCommons = {
  ZipArchiveEntry: zipArchiveEntryExports,
  ZipArchiveOutputStream: zipArchiveOutputStreamExports
};
var archiverUtils = { exports: {} };
var file$1 = { exports: {} };
var fs$1 = gracefulFs;
var path$1 = require$$1;
var flatten = lodash_flatten;
var difference = lodash_difference;
var union = lodash_union;
var isPlainObject = lodash_isplainobject;
var glob = requireGlob();
var file = file$1.exports = {};
var pathSeparatorRe = /[\/\\]/g;
var processPatterns = function(patterns, fn) {
  var result = [];
  flatten(patterns).forEach(function(pattern) {
    var exclusion = pattern.indexOf("!") === 0;
    if (exclusion) {
      pattern = pattern.slice(1);
    }
    var matches = fn(pattern);
    if (exclusion) {
      result = difference(result, matches);
    } else {
      result = union(result, matches);
    }
  });
  return result;
};
file.exists = function() {
  var filepath = path$1.join.apply(path$1, arguments);
  return fs$1.existsSync(filepath);
};
file.expand = function(...args) {
  var options = isPlainObject(args[0]) ? args.shift() : {};
  var patterns = Array.isArray(args[0]) ? args[0] : args;
  if (patterns.length === 0) {
    return [];
  }
  var matches = processPatterns(patterns, function(pattern) {
    return glob.sync(pattern, options);
  });
  if (options.filter) {
    matches = matches.filter(function(filepath) {
      filepath = path$1.join(options.cwd || "", filepath);
      try {
        if (typeof options.filter === "function") {
          return options.filter(filepath);
        } else {
          return fs$1.statSync(filepath)[options.filter]();
        }
      } catch (e) {
        return false;
      }
    });
  }
  return matches;
};
file.expandMapping = function(patterns, destBase, options) {
  options = Object.assign({
    rename: function(destBase2, destPath) {
      return path$1.join(destBase2 || "", destPath);
    }
  }, options);
  var files = [];
  var fileByDest = {};
  file.expand(options, patterns).forEach(function(src) {
    var destPath = src;
    if (options.flatten) {
      destPath = path$1.basename(destPath);
    }
    if (options.ext) {
      destPath = destPath.replace(/(\.[^\/]*)?$/, options.ext);
    }
    var dest = options.rename(destBase, destPath, options);
    if (options.cwd) {
      src = path$1.join(options.cwd, src);
    }
    dest = dest.replace(pathSeparatorRe, "/");
    src = src.replace(pathSeparatorRe, "/");
    if (fileByDest[dest]) {
      fileByDest[dest].src.push(src);
    } else {
      files.push({
        src: [src],
        dest
      });
      fileByDest[dest] = files[files.length - 1];
    }
  });
  return files;
};
file.normalizeFilesArray = function(data) {
  var files = [];
  data.forEach(function(obj) {
    if ("src" in obj || "dest" in obj) {
      files.push(obj);
    }
  });
  if (files.length === 0) {
    return [];
  }
  files = _(files).chain().forEach(function(obj) {
    if (!("src" in obj) || !obj.src) {
      return;
    }
    if (Array.isArray(obj.src)) {
      obj.src = flatten(obj.src);
    } else {
      obj.src = [obj.src];
    }
  }).map(function(obj) {
    var expandOptions = Object.assign({}, obj);
    delete expandOptions.src;
    delete expandOptions.dest;
    if (obj.expand) {
      return file.expandMapping(obj.src, obj.dest, expandOptions).map(function(mapObj) {
        var result2 = Object.assign({}, obj);
        result2.orig = Object.assign({}, obj);
        result2.src = mapObj.src;
        result2.dest = mapObj.dest;
        ["expand", "cwd", "flatten", "rename", "ext"].forEach(function(prop) {
          delete result2[prop];
        });
        return result2;
      });
    }
    var result = Object.assign({}, obj);
    result.orig = Object.assign({}, obj);
    if ("src" in result) {
      Object.defineProperty(result, "src", {
        enumerable: true,
        get: function fn() {
          var src;
          if (!("result" in fn)) {
            src = obj.src;
            src = Array.isArray(src) ? flatten(src) : [src];
            fn.result = file.expand(expandOptions, src);
          }
          return fn.result;
        }
      });
    }
    if ("dest" in result) {
      result.dest = obj.dest;
    }
    return result;
  }).flatten().value();
  return files;
};
var fileExports = file$1.exports;
var fs = gracefulFs;
var path = require$$1;
var lazystream = lazystream$2;
var normalizePath = normalizePath$3;
var defaults = lodash_defaults;
var Stream = require$$0$2.Stream;
var PassThrough$1 = readableExports.PassThrough;
var utils = archiverUtils.exports = {};
utils.file = fileExports;
utils.collectStream = function(source, callback) {
  var collection = [];
  var size = 0;
  source.on("error", callback);
  source.on("data", function(chunk) {
    collection.push(chunk);
    size += chunk.length;
  });
  source.on("end", function() {
    var buf = Buffer.alloc(size);
    var offset = 0;
    collection.forEach(function(data) {
      data.copy(buf, offset);
      offset += data.length;
    });
    callback(null, buf);
  });
};
utils.dateify = function(dateish) {
  dateish = dateish || /* @__PURE__ */ new Date();
  if (dateish instanceof Date) {
    dateish = dateish;
  } else if (typeof dateish === "string") {
    dateish = new Date(dateish);
  } else {
    dateish = /* @__PURE__ */ new Date();
  }
  return dateish;
};
utils.defaults = function(object, source, guard) {
  var args = arguments;
  args[0] = args[0] || {};
  return defaults(...args);
};
utils.isStream = function(source) {
  return source instanceof Stream;
};
utils.lazyReadStream = function(filepath) {
  return new lazystream.Readable(function() {
    return fs.createReadStream(filepath);
  });
};
utils.normalizeInputSource = function(source) {
  if (source === null) {
    return Buffer.alloc(0);
  } else if (typeof source === "string") {
    return Buffer.from(source);
  } else if (utils.isStream(source)) {
    return source.pipe(new PassThrough$1());
  }
  return source;
};
utils.sanitizePath = function(filepath) {
  return normalizePath(filepath, false).replace(/^\w+:/, "").replace(/^(\.\.\/|\/)+/, "");
};
utils.trailingSlashIt = function(str) {
  return str.slice(-1) !== "/" ? str + "/" : str;
};
utils.unixifyPath = function(filepath) {
  return normalizePath(filepath, false).replace(/^\w+:/, "");
};
utils.walkdir = function(dirpath, base, callback) {
  var results = [];
  if (typeof base === "function") {
    callback = base;
    base = dirpath;
  }
  fs.readdir(dirpath, function(err, list) {
    var i = 0;
    var file2;
    var filepath;
    if (err) {
      return callback(err);
    }
    (function next() {
      file2 = list[i++];
      if (!file2) {
        return callback(null, results);
      }
      filepath = path.join(dirpath, file2);
      fs.stat(filepath, function(err2, stats) {
        results.push({
          path: filepath,
          relative: path.relative(base, filepath).replace(/\\/g, "/"),
          stats
        });
        if (stats && stats.isDirectory()) {
          utils.walkdir(filepath, base, function(err3, res) {
            res.forEach(function(dirEntry) {
              results.push(dirEntry);
            });
            next();
          });
        } else {
          next();
        }
      });
    })();
  });
};
var archiverUtilsExports = archiverUtils.exports;
/**
 * ZipStream
 *
 * @ignore
 * @license [MIT]{@link https://github.com/archiverjs/node-zip-stream/blob/master/LICENSE}
 * @copyright (c) 2014 Chris Talkington, contributors.
 */
var inherits$3 = require$$0$3.inherits;
var ZipArchiveOutputStream = compressCommons.ZipArchiveOutputStream;
var ZipArchiveEntry = compressCommons.ZipArchiveEntry;
var util$4 = archiverUtilsExports;
var ZipStream = zipStream.exports = function(options) {
  if (!(this instanceof ZipStream)) {
    return new ZipStream(options);
  }
  options = this.options = options || {};
  options.zlib = options.zlib || {};
  ZipArchiveOutputStream.call(this, options);
  if (typeof options.level === "number" && options.level >= 0) {
    options.zlib.level = options.level;
    delete options.level;
  }
  if (!options.forceZip64 && typeof options.zlib.level === "number" && options.zlib.level === 0) {
    options.store = true;
  }
  options.namePrependSlash = options.namePrependSlash || false;
  if (options.comment && options.comment.length > 0) {
    this.setComment(options.comment);
  }
};
inherits$3(ZipStream, ZipArchiveOutputStream);
ZipStream.prototype._normalizeFileData = function(data) {
  data = util$4.defaults(data, {
    type: "file",
    name: null,
    namePrependSlash: this.options.namePrependSlash,
    linkname: null,
    date: null,
    mode: null,
    store: this.options.store,
    comment: ""
  });
  var isDir = data.type === "directory";
  var isSymlink = data.type === "symlink";
  if (data.name) {
    data.name = util$4.sanitizePath(data.name);
    if (!isSymlink && data.name.slice(-1) === "/") {
      isDir = true;
      data.type = "directory";
    } else if (isDir) {
      data.name += "/";
    }
  }
  if (isDir || isSymlink) {
    data.store = true;
  }
  data.date = util$4.dateify(data.date);
  return data;
};
ZipStream.prototype.entry = function(source, data, callback) {
  if (typeof callback !== "function") {
    callback = this._emitErrorCallback.bind(this);
  }
  data = this._normalizeFileData(data);
  if (data.type !== "file" && data.type !== "directory" && data.type !== "symlink") {
    callback(new Error(data.type + " entries not currently supported"));
    return;
  }
  if (typeof data.name !== "string" || data.name.length === 0) {
    callback(new Error("entry name must be a non-empty string value"));
    return;
  }
  if (data.type === "symlink" && typeof data.linkname !== "string") {
    callback(new Error("entry linkname must be a non-empty string value when type equals symlink"));
    return;
  }
  var entry = new ZipArchiveEntry(data.name);
  entry.setTime(data.date, this.options.forceLocalTime);
  if (data.namePrependSlash) {
    entry.setName(data.name, true);
  }
  if (data.store) {
    entry.setMethod(0);
  }
  if (data.comment.length > 0) {
    entry.setComment(data.comment);
  }
  if (data.type === "symlink" && typeof data.mode !== "number") {
    data.mode = 40960;
  }
  if (typeof data.mode === "number") {
    if (data.type === "symlink") {
      data.mode |= 40960;
    }
    entry.setUnixMode(data.mode);
  }
  if (data.type === "symlink" && typeof data.linkname === "string") {
    source = Buffer.from(data.linkname);
  }
  return ZipArchiveOutputStream.prototype.entry.call(this, entry, source, callback);
};
ZipStream.prototype.finalize = function() {
  this.finish();
};
var zipStreamExports = zipStream.exports;
/**
 * ZIP Format Plugin
 *
 * @module plugins/zip
 * @license [MIT]{@link https://github.com/archiverjs/node-archiver/blob/master/LICENSE}
 * @copyright (c) 2012-2014 Chris Talkington, contributors.
 */
var engine$1 = zipStreamExports;
var util$3 = archiverUtilsExports$1;
var Zip = function(options) {
  if (!(this instanceof Zip)) {
    return new Zip(options);
  }
  options = this.options = util$3.defaults(options, {
    comment: "",
    forceUTC: false,
    namePrependSlash: false,
    store: false
  });
  this.supports = {
    directory: true,
    symlink: true
  };
  this.engine = new engine$1(options);
};
Zip.prototype.append = function(source, data, callback) {
  this.engine.entry(source, data, callback);
};
Zip.prototype.finalize = function() {
  this.engine.finalize();
};
Zip.prototype.on = function() {
  return this.engine.on.apply(this.engine, arguments);
};
Zip.prototype.pipe = function() {
  return this.engine.pipe.apply(this.engine, arguments);
};
Zip.prototype.unpipe = function() {
  return this.engine.unpipe.apply(this.engine, arguments);
};
var zip = Zip;
var tarStream = {};
var bl$1 = { exports: {} };
const { Buffer: Buffer$1 } = require$$0$4;
const symbol = Symbol.for("BufferList");
function BufferList$1(buf) {
  if (!(this instanceof BufferList$1)) {
    return new BufferList$1(buf);
  }
  BufferList$1._init.call(this, buf);
}
BufferList$1._init = function _init(buf) {
  Object.defineProperty(this, symbol, { value: true });
  this._bufs = [];
  this.length = 0;
  if (buf) {
    this.append(buf);
  }
};
BufferList$1.prototype._new = function _new(buf) {
  return new BufferList$1(buf);
};
BufferList$1.prototype._offset = function _offset(offset) {
  if (offset === 0) {
    return [0, 0];
  }
  let tot = 0;
  for (let i = 0; i < this._bufs.length; i++) {
    const _t = tot + this._bufs[i].length;
    if (offset < _t || i === this._bufs.length - 1) {
      return [i, offset - tot];
    }
    tot = _t;
  }
};
BufferList$1.prototype._reverseOffset = function(blOffset) {
  const bufferId = blOffset[0];
  let offset = blOffset[1];
  for (let i = 0; i < bufferId; i++) {
    offset += this._bufs[i].length;
  }
  return offset;
};
BufferList$1.prototype.get = function get(index2) {
  if (index2 > this.length || index2 < 0) {
    return void 0;
  }
  const offset = this._offset(index2);
  return this._bufs[offset[0]][offset[1]];
};
BufferList$1.prototype.slice = function slice2(start, end2) {
  if (typeof start === "number" && start < 0) {
    start += this.length;
  }
  if (typeof end2 === "number" && end2 < 0) {
    end2 += this.length;
  }
  return this.copy(null, 0, start, end2);
};
BufferList$1.prototype.copy = function copy(dst, dstStart, srcStart, srcEnd) {
  if (typeof srcStart !== "number" || srcStart < 0) {
    srcStart = 0;
  }
  if (typeof srcEnd !== "number" || srcEnd > this.length) {
    srcEnd = this.length;
  }
  if (srcStart >= this.length) {
    return dst || Buffer$1.alloc(0);
  }
  if (srcEnd <= 0) {
    return dst || Buffer$1.alloc(0);
  }
  const copy2 = !!dst;
  const off = this._offset(srcStart);
  const len = srcEnd - srcStart;
  let bytes = len;
  let bufoff = copy2 && dstStart || 0;
  let start = off[1];
  if (srcStart === 0 && srcEnd === this.length) {
    if (!copy2) {
      return this._bufs.length === 1 ? this._bufs[0] : Buffer$1.concat(this._bufs, this.length);
    }
    for (let i = 0; i < this._bufs.length; i++) {
      this._bufs[i].copy(dst, bufoff);
      bufoff += this._bufs[i].length;
    }
    return dst;
  }
  if (bytes <= this._bufs[off[0]].length - start) {
    return copy2 ? this._bufs[off[0]].copy(dst, dstStart, start, start + bytes) : this._bufs[off[0]].slice(start, start + bytes);
  }
  if (!copy2) {
    dst = Buffer$1.allocUnsafe(len);
  }
  for (let i = off[0]; i < this._bufs.length; i++) {
    const l = this._bufs[i].length - start;
    if (bytes > l) {
      this._bufs[i].copy(dst, bufoff, start);
      bufoff += l;
    } else {
      this._bufs[i].copy(dst, bufoff, start, start + bytes);
      bufoff += l;
      break;
    }
    bytes -= l;
    if (start) {
      start = 0;
    }
  }
  if (dst.length > bufoff) return dst.slice(0, bufoff);
  return dst;
};
BufferList$1.prototype.shallowSlice = function shallowSlice(start, end2) {
  start = start || 0;
  end2 = typeof end2 !== "number" ? this.length : end2;
  if (start < 0) {
    start += this.length;
  }
  if (end2 < 0) {
    end2 += this.length;
  }
  if (start === end2) {
    return this._new();
  }
  const startOffset = this._offset(start);
  const endOffset = this._offset(end2);
  const buffers = this._bufs.slice(startOffset[0], endOffset[0] + 1);
  if (endOffset[1] === 0) {
    buffers.pop();
  } else {
    buffers[buffers.length - 1] = buffers[buffers.length - 1].slice(0, endOffset[1]);
  }
  if (startOffset[1] !== 0) {
    buffers[0] = buffers[0].slice(startOffset[1]);
  }
  return this._new(buffers);
};
BufferList$1.prototype.toString = function toString(encoding, start, end2) {
  return this.slice(start, end2).toString(encoding);
};
BufferList$1.prototype.consume = function consume(bytes) {
  bytes = Math.trunc(bytes);
  if (Number.isNaN(bytes) || bytes <= 0) return this;
  while (this._bufs.length) {
    if (bytes >= this._bufs[0].length) {
      bytes -= this._bufs[0].length;
      this.length -= this._bufs[0].length;
      this._bufs.shift();
    } else {
      this._bufs[0] = this._bufs[0].slice(bytes);
      this.length -= bytes;
      break;
    }
  }
  return this;
};
BufferList$1.prototype.duplicate = function duplicate() {
  const copy2 = this._new();
  for (let i = 0; i < this._bufs.length; i++) {
    copy2.append(this._bufs[i]);
  }
  return copy2;
};
BufferList$1.prototype.append = function append(buf) {
  if (buf == null) {
    return this;
  }
  if (buf.buffer) {
    this._appendBuffer(Buffer$1.from(buf.buffer, buf.byteOffset, buf.byteLength));
  } else if (Array.isArray(buf)) {
    for (let i = 0; i < buf.length; i++) {
      this.append(buf[i]);
    }
  } else if (this._isBufferList(buf)) {
    for (let i = 0; i < buf._bufs.length; i++) {
      this.append(buf._bufs[i]);
    }
  } else {
    if (typeof buf === "number") {
      buf = buf.toString();
    }
    this._appendBuffer(Buffer$1.from(buf));
  }
  return this;
};
BufferList$1.prototype._appendBuffer = function appendBuffer(buf) {
  this._bufs.push(buf);
  this.length += buf.length;
};
BufferList$1.prototype.indexOf = function(search, offset, encoding) {
  if (encoding === void 0 && typeof offset === "string") {
    encoding = offset;
    offset = void 0;
  }
  if (typeof search === "function" || Array.isArray(search)) {
    throw new TypeError('The "value" argument must be one of type string, Buffer, BufferList, or Uint8Array.');
  } else if (typeof search === "number") {
    search = Buffer$1.from([search]);
  } else if (typeof search === "string") {
    search = Buffer$1.from(search, encoding);
  } else if (this._isBufferList(search)) {
    search = search.slice();
  } else if (Array.isArray(search.buffer)) {
    search = Buffer$1.from(search.buffer, search.byteOffset, search.byteLength);
  } else if (!Buffer$1.isBuffer(search)) {
    search = Buffer$1.from(search);
  }
  offset = Number(offset || 0);
  if (isNaN(offset)) {
    offset = 0;
  }
  if (offset < 0) {
    offset = this.length + offset;
  }
  if (offset < 0) {
    offset = 0;
  }
  if (search.length === 0) {
    return offset > this.length ? this.length : offset;
  }
  const blOffset = this._offset(offset);
  let blIndex = blOffset[0];
  let buffOffset = blOffset[1];
  for (; blIndex < this._bufs.length; blIndex++) {
    const buff = this._bufs[blIndex];
    while (buffOffset < buff.length) {
      const availableWindow = buff.length - buffOffset;
      if (availableWindow >= search.length) {
        const nativeSearchResult = buff.indexOf(search, buffOffset);
        if (nativeSearchResult !== -1) {
          return this._reverseOffset([blIndex, nativeSearchResult]);
        }
        buffOffset = buff.length - search.length + 1;
      } else {
        const revOffset = this._reverseOffset([blIndex, buffOffset]);
        if (this._match(revOffset, search)) {
          return revOffset;
        }
        buffOffset++;
      }
    }
    buffOffset = 0;
  }
  return -1;
};
BufferList$1.prototype._match = function(offset, search) {
  if (this.length - offset < search.length) {
    return false;
  }
  for (let searchOffset = 0; searchOffset < search.length; searchOffset++) {
    if (this.get(offset + searchOffset) !== search[searchOffset]) {
      return false;
    }
  }
  return true;
};
(function() {
  const methods = {
    readDoubleBE: 8,
    readDoubleLE: 8,
    readFloatBE: 4,
    readFloatLE: 4,
    readInt32BE: 4,
    readInt32LE: 4,
    readUInt32BE: 4,
    readUInt32LE: 4,
    readInt16BE: 2,
    readInt16LE: 2,
    readUInt16BE: 2,
    readUInt16LE: 2,
    readInt8: 1,
    readUInt8: 1,
    readIntBE: null,
    readIntLE: null,
    readUIntBE: null,
    readUIntLE: null
  };
  for (const m in methods) {
    (function(m2) {
      if (methods[m2] === null) {
        BufferList$1.prototype[m2] = function(offset, byteLength) {
          return this.slice(offset, offset + byteLength)[m2](0, byteLength);
        };
      } else {
        BufferList$1.prototype[m2] = function(offset = 0) {
          return this.slice(offset, offset + methods[m2])[m2](0);
        };
      }
    })(m);
  }
})();
BufferList$1.prototype._isBufferList = function _isBufferList(b) {
  return b instanceof BufferList$1 || BufferList$1.isBufferList(b);
};
BufferList$1.isBufferList = function isBufferList(b) {
  return b != null && b[symbol];
};
var BufferList_1 = BufferList$1;
const DuplexStream = readableExports.Duplex;
const inherits$2 = inheritsExports;
const BufferList = BufferList_1;
function BufferListStream(callback) {
  if (!(this instanceof BufferListStream)) {
    return new BufferListStream(callback);
  }
  if (typeof callback === "function") {
    this._callback = callback;
    const piper = (function piper2(err) {
      if (this._callback) {
        this._callback(err);
        this._callback = null;
      }
    }).bind(this);
    this.on("pipe", function onPipe(src) {
      src.on("error", piper);
    });
    this.on("unpipe", function onUnpipe(src) {
      src.removeListener("error", piper);
    });
    callback = null;
  }
  BufferList._init.call(this, callback);
  DuplexStream.call(this);
}
inherits$2(BufferListStream, DuplexStream);
Object.assign(BufferListStream.prototype, BufferList.prototype);
BufferListStream.prototype._new = function _new2(callback) {
  return new BufferListStream(callback);
};
BufferListStream.prototype._write = function _write(buf, encoding, callback) {
  this._appendBuffer(buf);
  if (typeof callback === "function") {
    callback();
  }
};
BufferListStream.prototype._read = function _read(size) {
  if (!this.length) {
    return this.push(null);
  }
  size = Math.min(size, this.length);
  this.push(this.slice(0, size));
  this.consume(size);
};
BufferListStream.prototype.end = function end(chunk) {
  DuplexStream.prototype.end.call(this, chunk);
  if (this._callback) {
    this._callback(null, this.slice());
    this._callback = null;
  }
};
BufferListStream.prototype._destroy = function _destroy(err, cb) {
  this._bufs.length = 0;
  this.length = 0;
  cb(err);
};
BufferListStream.prototype._isBufferList = function _isBufferList2(b) {
  return b instanceof BufferListStream || b instanceof BufferList || BufferListStream.isBufferList(b);
};
BufferListStream.isBufferList = BufferList.isBufferList;
bl$1.exports = BufferListStream;
bl$1.exports.BufferListStream = BufferListStream;
bl$1.exports.BufferList = BufferList;
var blExports = bl$1.exports;
var headers$2 = {};
var alloc$1 = Buffer.alloc;
var ZEROS = "0000000000000000000";
var SEVENS = "7777777777777777777";
var ZERO_OFFSET = "0".charCodeAt(0);
var USTAR_MAGIC = Buffer.from("ustar\0", "binary");
var USTAR_VER = Buffer.from("00", "binary");
var GNU_MAGIC = Buffer.from("ustar ", "binary");
var GNU_VER = Buffer.from(" \0", "binary");
var MASK = parseInt("7777", 8);
var MAGIC_OFFSET = 257;
var VERSION_OFFSET = 263;
var clamp = function(index2, len, defaultValue) {
  if (typeof index2 !== "number") return defaultValue;
  index2 = ~~index2;
  if (index2 >= len) return len;
  if (index2 >= 0) return index2;
  index2 += len;
  if (index2 >= 0) return index2;
  return 0;
};
var toType = function(flag) {
  switch (flag) {
    case 0:
      return "file";
    case 1:
      return "link";
    case 2:
      return "symlink";
    case 3:
      return "character-device";
    case 4:
      return "block-device";
    case 5:
      return "directory";
    case 6:
      return "fifo";
    case 7:
      return "contiguous-file";
    case 72:
      return "pax-header";
    case 55:
      return "pax-global-header";
    case 27:
      return "gnu-long-link-path";
    case 28:
    case 30:
      return "gnu-long-path";
  }
  return null;
};
var toTypeflag = function(flag) {
  switch (flag) {
    case "file":
      return 0;
    case "link":
      return 1;
    case "symlink":
      return 2;
    case "character-device":
      return 3;
    case "block-device":
      return 4;
    case "directory":
      return 5;
    case "fifo":
      return 6;
    case "contiguous-file":
      return 7;
    case "pax-header":
      return 72;
  }
  return 0;
};
var indexOf = function(block, num, offset, end2) {
  for (; offset < end2; offset++) {
    if (block[offset] === num) return offset;
  }
  return end2;
};
var cksum = function(block) {
  var sum = 8 * 32;
  for (var i = 0; i < 148; i++) sum += block[i];
  for (var j = 156; j < 512; j++) sum += block[j];
  return sum;
};
var encodeOct = function(val, n) {
  val = val.toString(8);
  if (val.length > n) return SEVENS.slice(0, n) + " ";
  else return ZEROS.slice(0, n - val.length) + val + " ";
};
function parse256(buf) {
  var positive;
  if (buf[0] === 128) positive = true;
  else if (buf[0] === 255) positive = false;
  else return null;
  var tuple = [];
  for (var i = buf.length - 1; i > 0; i--) {
    var byte = buf[i];
    if (positive) tuple.push(byte);
    else tuple.push(255 - byte);
  }
  var sum = 0;
  var l = tuple.length;
  for (i = 0; i < l; i++) {
    sum += tuple[i] * Math.pow(256, i);
  }
  return positive ? sum : -1 * sum;
}
var decodeOct = function(val, offset, length) {
  val = val.slice(offset, offset + length);
  offset = 0;
  if (val[offset] & 128) {
    return parse256(val);
  } else {
    while (offset < val.length && val[offset] === 32) offset++;
    var end2 = clamp(indexOf(val, 32, offset, val.length), val.length, val.length);
    while (offset < end2 && val[offset] === 0) offset++;
    if (end2 === offset) return 0;
    return parseInt(val.slice(offset, end2).toString(), 8);
  }
};
var decodeStr = function(val, offset, length, encoding) {
  return val.slice(offset, indexOf(val, 0, offset, offset + length)).toString(encoding);
};
var addLength = function(str) {
  var len = Buffer.byteLength(str);
  var digits = Math.floor(Math.log(len) / Math.log(10)) + 1;
  if (len + digits >= Math.pow(10, digits)) digits++;
  return len + digits + str;
};
headers$2.decodeLongPath = function(buf, encoding) {
  return decodeStr(buf, 0, buf.length, encoding);
};
headers$2.encodePax = function(opts) {
  var result = "";
  if (opts.name) result += addLength(" path=" + opts.name + "\n");
  if (opts.linkname) result += addLength(" linkpath=" + opts.linkname + "\n");
  var pax = opts.pax;
  if (pax) {
    for (var key in pax) {
      result += addLength(" " + key + "=" + pax[key] + "\n");
    }
  }
  return Buffer.from(result);
};
headers$2.decodePax = function(buf) {
  var result = {};
  while (buf.length) {
    var i = 0;
    while (i < buf.length && buf[i] !== 32) i++;
    var len = parseInt(buf.slice(0, i).toString(), 10);
    if (!len) return result;
    var b = buf.slice(i + 1, len - 1).toString();
    var keyIndex = b.indexOf("=");
    if (keyIndex === -1) return result;
    result[b.slice(0, keyIndex)] = b.slice(keyIndex + 1);
    buf = buf.slice(len);
  }
  return result;
};
headers$2.encode = function(opts) {
  var buf = alloc$1(512);
  var name = opts.name;
  var prefix = "";
  if (opts.typeflag === 5 && name[name.length - 1] !== "/") name += "/";
  if (Buffer.byteLength(name) !== name.length) return null;
  while (Buffer.byteLength(name) > 100) {
    var i = name.indexOf("/");
    if (i === -1) return null;
    prefix += prefix ? "/" + name.slice(0, i) : name.slice(0, i);
    name = name.slice(i + 1);
  }
  if (Buffer.byteLength(name) > 100 || Buffer.byteLength(prefix) > 155) return null;
  if (opts.linkname && Buffer.byteLength(opts.linkname) > 100) return null;
  buf.write(name);
  buf.write(encodeOct(opts.mode & MASK, 6), 100);
  buf.write(encodeOct(opts.uid, 6), 108);
  buf.write(encodeOct(opts.gid, 6), 116);
  buf.write(encodeOct(opts.size, 11), 124);
  buf.write(encodeOct(opts.mtime.getTime() / 1e3 | 0, 11), 136);
  buf[156] = ZERO_OFFSET + toTypeflag(opts.type);
  if (opts.linkname) buf.write(opts.linkname, 157);
  USTAR_MAGIC.copy(buf, MAGIC_OFFSET);
  USTAR_VER.copy(buf, VERSION_OFFSET);
  if (opts.uname) buf.write(opts.uname, 265);
  if (opts.gname) buf.write(opts.gname, 297);
  buf.write(encodeOct(opts.devmajor || 0, 6), 329);
  buf.write(encodeOct(opts.devminor || 0, 6), 337);
  if (prefix) buf.write(prefix, 345);
  buf.write(encodeOct(cksum(buf), 6), 148);
  return buf;
};
headers$2.decode = function(buf, filenameEncoding, allowUnknownFormat) {
  var typeflag = buf[156] === 0 ? 0 : buf[156] - ZERO_OFFSET;
  var name = decodeStr(buf, 0, 100, filenameEncoding);
  var mode = decodeOct(buf, 100, 8);
  var uid = decodeOct(buf, 108, 8);
  var gid = decodeOct(buf, 116, 8);
  var size = decodeOct(buf, 124, 12);
  var mtime = decodeOct(buf, 136, 12);
  var type = toType(typeflag);
  var linkname = buf[157] === 0 ? null : decodeStr(buf, 157, 100, filenameEncoding);
  var uname = decodeStr(buf, 265, 32);
  var gname = decodeStr(buf, 297, 32);
  var devmajor = decodeOct(buf, 329, 8);
  var devminor = decodeOct(buf, 337, 8);
  var c = cksum(buf);
  if (c === 8 * 32) return null;
  if (c !== decodeOct(buf, 148, 8)) throw new Error("Invalid tar header. Maybe the tar is corrupted or it needs to be gunzipped?");
  if (USTAR_MAGIC.compare(buf, MAGIC_OFFSET, MAGIC_OFFSET + 6) === 0) {
    if (buf[345]) name = decodeStr(buf, 345, 155, filenameEncoding) + "/" + name;
  } else if (GNU_MAGIC.compare(buf, MAGIC_OFFSET, MAGIC_OFFSET + 6) === 0 && GNU_VER.compare(buf, VERSION_OFFSET, VERSION_OFFSET + 2) === 0) ;
  else {
    if (!allowUnknownFormat) {
      throw new Error("Invalid tar header: unknown format.");
    }
  }
  if (typeflag === 0 && name && name[name.length - 1] === "/") typeflag = 5;
  return {
    name,
    mode,
    uid,
    gid,
    size,
    mtime: new Date(1e3 * mtime),
    type,
    linkname,
    uname,
    gname,
    devmajor,
    devminor
  };
};
var util$2 = require$$0$3;
var bl = blExports;
var headers$1 = headers$2;
var Writable$1 = readableExports.Writable;
var PassThrough = readableExports.PassThrough;
var noop$2 = function() {
};
var overflow$1 = function(size) {
  size &= 511;
  return size && 512 - size;
};
var emptyStream = function(self2, offset) {
  var s = new Source(self2, offset);
  s.end();
  return s;
};
var mixinPax = function(header, pax) {
  if (pax.path) header.name = pax.path;
  if (pax.linkpath) header.linkname = pax.linkpath;
  if (pax.size) header.size = parseInt(pax.size, 10);
  header.pax = pax;
  return header;
};
var Source = function(self2, offset) {
  this._parent = self2;
  this.offset = offset;
  PassThrough.call(this, { autoDestroy: false });
};
util$2.inherits(Source, PassThrough);
Source.prototype.destroy = function(err) {
  this._parent.destroy(err);
};
var Extract = function(opts) {
  if (!(this instanceof Extract)) return new Extract(opts);
  Writable$1.call(this, opts);
  opts = opts || {};
  this._offset = 0;
  this._buffer = bl();
  this._missing = 0;
  this._partial = false;
  this._onparse = noop$2;
  this._header = null;
  this._stream = null;
  this._overflow = null;
  this._cb = null;
  this._locked = false;
  this._destroyed = false;
  this._pax = null;
  this._paxGlobal = null;
  this._gnuLongPath = null;
  this._gnuLongLinkPath = null;
  var self2 = this;
  var b = self2._buffer;
  var oncontinue = function() {
    self2._continue();
  };
  var onunlock = function(err) {
    self2._locked = false;
    if (err) return self2.destroy(err);
    if (!self2._stream) oncontinue();
  };
  var onstreamend = function() {
    self2._stream = null;
    var drain = overflow$1(self2._header.size);
    if (drain) self2._parse(drain, ondrain);
    else self2._parse(512, onheader);
    if (!self2._locked) oncontinue();
  };
  var ondrain = function() {
    self2._buffer.consume(overflow$1(self2._header.size));
    self2._parse(512, onheader);
    oncontinue();
  };
  var onpaxglobalheader = function() {
    var size = self2._header.size;
    self2._paxGlobal = headers$1.decodePax(b.slice(0, size));
    b.consume(size);
    onstreamend();
  };
  var onpaxheader = function() {
    var size = self2._header.size;
    self2._pax = headers$1.decodePax(b.slice(0, size));
    if (self2._paxGlobal) self2._pax = Object.assign({}, self2._paxGlobal, self2._pax);
    b.consume(size);
    onstreamend();
  };
  var ongnulongpath = function() {
    var size = self2._header.size;
    this._gnuLongPath = headers$1.decodeLongPath(b.slice(0, size), opts.filenameEncoding);
    b.consume(size);
    onstreamend();
  };
  var ongnulonglinkpath = function() {
    var size = self2._header.size;
    this._gnuLongLinkPath = headers$1.decodeLongPath(b.slice(0, size), opts.filenameEncoding);
    b.consume(size);
    onstreamend();
  };
  var onheader = function() {
    var offset = self2._offset;
    var header;
    try {
      header = self2._header = headers$1.decode(b.slice(0, 512), opts.filenameEncoding, opts.allowUnknownFormat);
    } catch (err) {
      self2.emit("error", err);
    }
    b.consume(512);
    if (!header) {
      self2._parse(512, onheader);
      oncontinue();
      return;
    }
    if (header.type === "gnu-long-path") {
      self2._parse(header.size, ongnulongpath);
      oncontinue();
      return;
    }
    if (header.type === "gnu-long-link-path") {
      self2._parse(header.size, ongnulonglinkpath);
      oncontinue();
      return;
    }
    if (header.type === "pax-global-header") {
      self2._parse(header.size, onpaxglobalheader);
      oncontinue();
      return;
    }
    if (header.type === "pax-header") {
      self2._parse(header.size, onpaxheader);
      oncontinue();
      return;
    }
    if (self2._gnuLongPath) {
      header.name = self2._gnuLongPath;
      self2._gnuLongPath = null;
    }
    if (self2._gnuLongLinkPath) {
      header.linkname = self2._gnuLongLinkPath;
      self2._gnuLongLinkPath = null;
    }
    if (self2._pax) {
      self2._header = header = mixinPax(header, self2._pax);
      self2._pax = null;
    }
    self2._locked = true;
    if (!header.size || header.type === "directory") {
      self2._parse(512, onheader);
      self2.emit("entry", header, emptyStream(self2, offset), onunlock);
      return;
    }
    self2._stream = new Source(self2, offset);
    self2.emit("entry", header, self2._stream, onunlock);
    self2._parse(header.size, onstreamend);
    oncontinue();
  };
  this._onheader = onheader;
  this._parse(512, onheader);
};
util$2.inherits(Extract, Writable$1);
Extract.prototype.destroy = function(err) {
  if (this._destroyed) return;
  this._destroyed = true;
  if (err) this.emit("error", err);
  this.emit("close");
  if (this._stream) this._stream.emit("close");
};
Extract.prototype._parse = function(size, onparse) {
  if (this._destroyed) return;
  this._offset += size;
  this._missing = size;
  if (onparse === this._onheader) this._partial = false;
  this._onparse = onparse;
};
Extract.prototype._continue = function() {
  if (this._destroyed) return;
  var cb = this._cb;
  this._cb = noop$2;
  if (this._overflow) this._write(this._overflow, void 0, cb);
  else cb();
};
Extract.prototype._write = function(data, enc, cb) {
  if (this._destroyed) return;
  var s = this._stream;
  var b = this._buffer;
  var missing = this._missing;
  if (data.length) this._partial = true;
  if (data.length < missing) {
    this._missing -= data.length;
    this._overflow = null;
    if (s) return s.write(data, cb);
    b.append(data);
    return cb();
  }
  this._cb = cb;
  this._missing = 0;
  var overflow2 = null;
  if (data.length > missing) {
    overflow2 = data.slice(missing);
    data = data.slice(0, missing);
  }
  if (s) s.end(data);
  else b.append(data);
  this._overflow = overflow2;
  this._onparse();
};
Extract.prototype._final = function(cb) {
  if (this._partial) return this.destroy(new Error("Unexpected end of data"));
  cb();
};
var extract = Extract;
var fsConstants = require$$0.constants || require$$0$1;
var once = onceExports;
var noop$1 = function() {
};
var qnt = commonjsGlobal.Bare ? queueMicrotask : process.nextTick.bind(process);
var isRequest = function(stream2) {
  return stream2.setHeader && typeof stream2.abort === "function";
};
var isChildProcess = function(stream2) {
  return stream2.stdio && Array.isArray(stream2.stdio) && stream2.stdio.length === 3;
};
var eos$1 = function(stream2, opts, callback) {
  if (typeof opts === "function") return eos$1(stream2, null, opts);
  if (!opts) opts = {};
  callback = once(callback || noop$1);
  var ws = stream2._writableState;
  var rs = stream2._readableState;
  var readable2 = opts.readable || opts.readable !== false && stream2.readable;
  var writable = opts.writable || opts.writable !== false && stream2.writable;
  var cancelled = false;
  var onlegacyfinish = function() {
    if (!stream2.writable) onfinish();
  };
  var onfinish = function() {
    writable = false;
    if (!readable2) callback.call(stream2);
  };
  var onend = function() {
    readable2 = false;
    if (!writable) callback.call(stream2);
  };
  var onexit = function(exitCode) {
    callback.call(stream2, exitCode ? new Error("exited with error code: " + exitCode) : null);
  };
  var onerror = function(err) {
    callback.call(stream2, err);
  };
  var onclose = function() {
    qnt(onclosenexttick);
  };
  var onclosenexttick = function() {
    if (cancelled) return;
    if (readable2 && !(rs && (rs.ended && !rs.destroyed))) return callback.call(stream2, new Error("premature close"));
    if (writable && !(ws && (ws.ended && !ws.destroyed))) return callback.call(stream2, new Error("premature close"));
  };
  var onrequest = function() {
    stream2.req.on("finish", onfinish);
  };
  if (isRequest(stream2)) {
    stream2.on("complete", onfinish);
    stream2.on("abort", onclose);
    if (stream2.req) onrequest();
    else stream2.on("request", onrequest);
  } else if (writable && !ws) {
    stream2.on("end", onlegacyfinish);
    stream2.on("close", onlegacyfinish);
  }
  if (isChildProcess(stream2)) stream2.on("exit", onexit);
  stream2.on("end", onend);
  stream2.on("finish", onfinish);
  if (opts.error !== false) stream2.on("error", onerror);
  stream2.on("close", onclose);
  return function() {
    cancelled = true;
    stream2.removeListener("complete", onfinish);
    stream2.removeListener("abort", onclose);
    stream2.removeListener("request", onrequest);
    if (stream2.req) stream2.req.removeListener("finish", onfinish);
    stream2.removeListener("end", onlegacyfinish);
    stream2.removeListener("close", onlegacyfinish);
    stream2.removeListener("finish", onfinish);
    stream2.removeListener("exit", onexit);
    stream2.removeListener("end", onend);
    stream2.removeListener("error", onerror);
    stream2.removeListener("close", onclose);
  };
};
var endOfStream = eos$1;
var constants = fsConstants;
var eos = endOfStream;
var inherits$1 = inheritsExports;
var alloc = Buffer.alloc;
var Readable = readableExports.Readable;
var Writable = readableExports.Writable;
var StringDecoder = require$$4.StringDecoder;
var headers = headers$2;
var DMODE = parseInt("755", 8);
var FMODE = parseInt("644", 8);
var END_OF_TAR = alloc(1024);
var noop = function() {
};
var overflow = function(self2, size) {
  size &= 511;
  if (size) self2.push(END_OF_TAR.slice(0, 512 - size));
};
function modeToType(mode) {
  switch (mode & constants.S_IFMT) {
    case constants.S_IFBLK:
      return "block-device";
    case constants.S_IFCHR:
      return "character-device";
    case constants.S_IFDIR:
      return "directory";
    case constants.S_IFIFO:
      return "fifo";
    case constants.S_IFLNK:
      return "symlink";
  }
  return "file";
}
var Sink = function(to) {
  Writable.call(this);
  this.written = 0;
  this._to = to;
  this._destroyed = false;
};
inherits$1(Sink, Writable);
Sink.prototype._write = function(data, enc, cb) {
  this.written += data.length;
  if (this._to.push(data)) return cb();
  this._to._drain = cb;
};
Sink.prototype.destroy = function() {
  if (this._destroyed) return;
  this._destroyed = true;
  this.emit("close");
};
var LinkSink = function() {
  Writable.call(this);
  this.linkname = "";
  this._decoder = new StringDecoder("utf-8");
  this._destroyed = false;
};
inherits$1(LinkSink, Writable);
LinkSink.prototype._write = function(data, enc, cb) {
  this.linkname += this._decoder.write(data);
  cb();
};
LinkSink.prototype.destroy = function() {
  if (this._destroyed) return;
  this._destroyed = true;
  this.emit("close");
};
var Void = function() {
  Writable.call(this);
  this._destroyed = false;
};
inherits$1(Void, Writable);
Void.prototype._write = function(data, enc, cb) {
  cb(new Error("No body allowed for this entry"));
};
Void.prototype.destroy = function() {
  if (this._destroyed) return;
  this._destroyed = true;
  this.emit("close");
};
var Pack = function(opts) {
  if (!(this instanceof Pack)) return new Pack(opts);
  Readable.call(this, opts);
  this._drain = noop;
  this._finalized = false;
  this._finalizing = false;
  this._destroyed = false;
  this._stream = null;
};
inherits$1(Pack, Readable);
Pack.prototype.entry = function(header, buffer, callback) {
  if (this._stream) throw new Error("already piping an entry");
  if (this._finalized || this._destroyed) return;
  if (typeof buffer === "function") {
    callback = buffer;
    buffer = null;
  }
  if (!callback) callback = noop;
  var self2 = this;
  if (!header.size || header.type === "symlink") header.size = 0;
  if (!header.type) header.type = modeToType(header.mode);
  if (!header.mode) header.mode = header.type === "directory" ? DMODE : FMODE;
  if (!header.uid) header.uid = 0;
  if (!header.gid) header.gid = 0;
  if (!header.mtime) header.mtime = /* @__PURE__ */ new Date();
  if (typeof buffer === "string") buffer = Buffer.from(buffer);
  if (Buffer.isBuffer(buffer)) {
    header.size = buffer.length;
    this._encode(header);
    var ok2 = this.push(buffer);
    overflow(self2, header.size);
    if (ok2) process.nextTick(callback);
    else this._drain = callback;
    return new Void();
  }
  if (header.type === "symlink" && !header.linkname) {
    var linkSink = new LinkSink();
    eos(linkSink, function(err) {
      if (err) {
        self2.destroy();
        return callback(err);
      }
      header.linkname = linkSink.linkname;
      self2._encode(header);
      callback();
    });
    return linkSink;
  }
  this._encode(header);
  if (header.type !== "file" && header.type !== "contiguous-file") {
    process.nextTick(callback);
    return new Void();
  }
  var sink = new Sink(this);
  this._stream = sink;
  eos(sink, function(err) {
    self2._stream = null;
    if (err) {
      self2.destroy();
      return callback(err);
    }
    if (sink.written !== header.size) {
      self2.destroy();
      return callback(new Error("size mismatch"));
    }
    overflow(self2, header.size);
    if (self2._finalizing) self2.finalize();
    callback();
  });
  return sink;
};
Pack.prototype.finalize = function() {
  if (this._stream) {
    this._finalizing = true;
    return;
  }
  if (this._finalized) return;
  this._finalized = true;
  this.push(END_OF_TAR);
  this.push(null);
};
Pack.prototype.destroy = function(err) {
  if (this._destroyed) return;
  this._destroyed = true;
  if (err) this.emit("error", err);
  this.emit("close");
  if (this._stream && this._stream.destroy) this._stream.destroy();
};
Pack.prototype._encode = function(header) {
  if (!header.pax) {
    var buf = headers.encode(header);
    if (buf) {
      this.push(buf);
      return;
    }
  }
  this._encodePax(header);
};
Pack.prototype._encodePax = function(header) {
  var paxHeader = headers.encodePax({
    name: header.name,
    linkname: header.linkname,
    pax: header.pax
  });
  var newHeader = {
    name: "PaxHeader",
    mode: header.mode,
    uid: header.uid,
    gid: header.gid,
    size: paxHeader.length,
    mtime: header.mtime,
    type: "pax-header",
    linkname: header.linkname && "PaxHeader",
    uname: header.uname,
    gname: header.gname,
    devmajor: header.devmajor,
    devminor: header.devminor
  };
  this.push(headers.encode(newHeader));
  this.push(paxHeader);
  overflow(this, paxHeader.length);
  newHeader.size = header.size;
  newHeader.type = header.type;
  this.push(headers.encode(newHeader));
};
Pack.prototype._read = function(n) {
  var drain = this._drain;
  this._drain = noop;
  drain();
};
var pack = Pack;
tarStream.extract = extract;
tarStream.pack = pack;
/**
 * TAR Format Plugin
 *
 * @module plugins/tar
 * @license [MIT]{@link https://github.com/archiverjs/node-archiver/blob/master/LICENSE}
 * @copyright (c) 2012-2014 Chris Talkington, contributors.
 */
var zlib = require$$0$5;
var engine = tarStream;
var util$1 = archiverUtilsExports$1;
var Tar = function(options) {
  if (!(this instanceof Tar)) {
    return new Tar(options);
  }
  options = this.options = util$1.defaults(options, {
    gzip: false
  });
  if (typeof options.gzipOptions !== "object") {
    options.gzipOptions = {};
  }
  this.supports = {
    directory: true,
    symlink: true
  };
  this.engine = engine.pack(options);
  this.compressor = false;
  if (options.gzip) {
    this.compressor = zlib.createGzip(options.gzipOptions);
    this.compressor.on("error", this._onCompressorError.bind(this));
  }
};
Tar.prototype._onCompressorError = function(err) {
  this.engine.emit("error", err);
};
Tar.prototype.append = function(source, data, callback) {
  var self2 = this;
  data.mtime = data.date;
  function append2(err, sourceBuffer) {
    if (err) {
      callback(err);
      return;
    }
    self2.engine.entry(data, sourceBuffer, function(err2) {
      callback(err2, data);
    });
  }
  if (data.sourceType === "buffer") {
    append2(null, source);
  } else if (data.sourceType === "stream" && data.stats) {
    data.size = data.stats.size;
    var entry = self2.engine.entry(data, function(err) {
      callback(err, data);
    });
    source.pipe(entry);
  } else if (data.sourceType === "stream") {
    util$1.collectStream(source, append2);
  }
};
Tar.prototype.finalize = function() {
  this.engine.finalize();
};
Tar.prototype.on = function() {
  return this.engine.on.apply(this.engine, arguments);
};
Tar.prototype.pipe = function(destination, options) {
  if (this.compressor) {
    return this.engine.pipe.apply(this.engine, [this.compressor]).pipe(destination, options);
  } else {
    return this.engine.pipe.apply(this.engine, arguments);
  }
};
Tar.prototype.unpipe = function() {
  if (this.compressor) {
    return this.compressor.unpipe.apply(this.compressor, arguments);
  } else {
    return this.engine.unpipe.apply(this.engine, arguments);
  }
};
var tar = Tar;
/**
 * JSON Format Plugin
 *
 * @module plugins/json
 * @license [MIT]{@link https://github.com/archiverjs/node-archiver/blob/master/LICENSE}
 * @copyright (c) 2012-2014 Chris Talkington, contributors.
 */
var inherits = require$$0$3.inherits;
var Transform = readableExports.Transform;
var crc32 = bufferCrc32;
var util = archiverUtilsExports$1;
var Json = function(options) {
  if (!(this instanceof Json)) {
    return new Json(options);
  }
  options = this.options = util.defaults(options, {});
  Transform.call(this, options);
  this.supports = {
    directory: true,
    symlink: true
  };
  this.files = [];
};
inherits(Json, Transform);
Json.prototype._transform = function(chunk, encoding, callback) {
  callback(null, chunk);
};
Json.prototype._writeStringified = function() {
  var fileString = JSON.stringify(this.files);
  this.write(fileString);
};
Json.prototype.append = function(source, data, callback) {
  var self2 = this;
  data.crc32 = 0;
  function onend(err, sourceBuffer) {
    if (err) {
      callback(err);
      return;
    }
    data.size = sourceBuffer.length || 0;
    data.crc32 = crc32.unsigned(sourceBuffer);
    self2.files.push(data);
    callback(null, data);
  }
  if (data.sourceType === "buffer") {
    onend(null, source);
  } else if (data.sourceType === "stream") {
    util.collectStream(source, onend);
  }
};
Json.prototype.finalize = function() {
  this._writeStringified();
  this.end();
};
var json = Json;
/**
 * Archiver Vending
 *
 * @ignore
 * @license [MIT]{@link https://github.com/archiverjs/node-archiver/blob/master/LICENSE}
 * @copyright (c) 2012-2014 Chris Talkington, contributors.
 */
var Archiver = core;
var formats = {};
var vending = function(format, options) {
  return vending.create(format, options);
};
vending.create = function(format, options) {
  if (formats[format]) {
    var instance = new Archiver(format, options);
    instance.setFormat(format);
    instance.setModule(new formats[format](options));
    return instance;
  } else {
    throw new Error("create(" + format + "): format not registered");
  }
};
vending.registerFormat = function(format, module) {
  if (formats[format]) {
    throw new Error("register(" + format + "): format already registered");
  }
  if (typeof module !== "function") {
    throw new Error("register(" + format + "): format module invalid");
  }
  if (typeof module.prototype.append !== "function" || typeof module.prototype.finalize !== "function") {
    throw new Error("register(" + format + "): format module missing methods");
  }
  formats[format] = module;
};
vending.isRegisteredFormat = function(format) {
  if (formats[format]) {
    return true;
  }
  return false;
};
vending.registerFormat("zip", zip);
vending.registerFormat("tar", tar);
vending.registerFormat("json", json);
var archiver$1 = vending;
const index = /* @__PURE__ */ getDefaultExportFromCjs(archiver$1);
const archiver = index;
const __dirname$1 = path$9.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path$9.join(__dirname$1, "..");
const gotSingleInstanceLock = app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) {
  app.quit();
}
app.disableHardwareAcceleration();
app.commandLine.appendSwitch("disable-gpu");
app.commandLine.appendSwitch("disable-gpu-compositing");
const FORCE_DEBUG_BUILD = false;
const DEVTOOLS_ENABLED = process.env.DEVTOOLS_ENABLED === "true" || FORCE_DEBUG_BUILD;
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path$9.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path$9.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path$9.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win = null;
const settingsFilePath = path$9.join(app.getPath("userData"), "settings.json");
function loadSettings() {
  try {
    const raw = fs$a.readFileSync(settingsFilePath, "utf-8");
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return parsed;
    }
  } catch {
  }
  return {};
}
function saveSettings(settings) {
  fs$a.writeFileSync(
    settingsFilePath,
    JSON.stringify(settings, null, 2),
    "utf-8"
  );
}
const persistedSettings = loadSettings();
let generatedImagesDir = persistedSettings.downloadFolder ?? path$9.join(app.getPath("downloads"), "GPT Image Studio");
let filenamePrefix = persistedSettings.filenamePrefix ?? "★";
let debugMode = (persistedSettings.debugMode ?? false) || FORCE_DEBUG_BUILD;
const pendingDownloads = /* @__PURE__ */ new Map();
const webviewOwners = /* @__PURE__ */ new Map();
const workspaceWebContentsIds = /* @__PURE__ */ new Map();
const DIAGNOSTICS_ENABLED = !app.isPackaged || process.env.WS_AUDIT_FORCE === "true" || FORCE_DEBUG_BUILD;
const logsDir = process.env.PORTABLE_EXECUTABLE_DIR ? path$9.join(process.env.PORTABLE_EXECUTABLE_DIR, "logs") : path$9.join(path$9.dirname(app.getPath("exe")), "logs");
const wsAuditLogPath = path$9.join(logsDir, "ws-audit.log");
if (DIAGNOSTICS_ENABLED) {
  try {
    fs$a.mkdirSync(logsDir, { recursive: true });
  } catch {
  }
}
function logMainEvent(workspaceId, event, details) {
  if (!DIAGNOSTICS_ENABLED)
    return;
  const line = `[WS-AUDIT][main] ${(/* @__PURE__ */ new Date()).toISOString()} | workspace=${workspaceId ?? "unknown"} | event=${event} ${JSON.stringify(details ?? {})}`;
  console.log(line);
  try {
    fs$a.appendFileSync(wsAuditLogPath, line + "\n", "utf-8");
  } catch {
  }
}
const debugLogsDir = path$9.join(app.getPath("userData"), "DebugLogs");
function ensureSessionDir(sessionId) {
  const dir2 = path$9.join(debugLogsDir, sessionId);
  fs$a.mkdirSync(dir2, { recursive: true });
  return dir2;
}
const DEBUG_LOG_FILES = ["pipeline", "prompt", "workspace", "dom", "error"];
function isDebugLogFile(value) {
  return DEBUG_LOG_FILES.includes(value);
}
function buildUnifiedDiff(original, inserted) {
  const a = original.split("\n");
  const b = inserted.split("\n");
  const n = a.length;
  const m = b.length;
  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i2 = n - 1; i2 >= 0; i2--) {
    for (let j2 = m - 1; j2 >= 0; j2--) {
      dp[i2][j2] = a[i2] === b[j2] ? dp[i2 + 1][j2 + 1] + 1 : Math.max(dp[i2 + 1][j2], dp[i2][j2 + 1]);
    }
  }
  const lines = [
    "--- original.txt",
    "+++ inserted.txt",
    `@@ -1,${n} +1,${m} @@`
  ];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      lines.push("  " + a[i]);
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      lines.push("- " + a[i]);
      i++;
    } else {
      lines.push("+ " + b[j]);
      j++;
    }
  }
  while (i < n) {
    lines.push("- " + a[i]);
    i++;
  }
  while (j < m) {
    lines.push("+ " + b[j]);
    j++;
  }
  return lines.join("\n");
}
function sanitizeFilenamePart(value) {
  return value.replace(/[\\/:*?"<>|]/g, "_").trim();
}
function buildAutoFilename(dir2, baseName, workTypePrefix) {
  const safeName = sanitizeFilenamePart(baseName) || "Untitled";
  const safePrefix = sanitizeFilenamePart(filenamePrefix);
  const safeWorkTypePrefix = sanitizeFilenamePart(workTypePrefix);
  const base = `${safePrefix}${safeWorkTypePrefix}${safeName}`;
  const firstCandidate = `${base}.png`;
  if (!fs$a.existsSync(path$9.join(dir2, firstCandidate))) {
    return firstCandidate;
  }
  let n = 2;
  let candidate = `${base}${n}.png`;
  while (fs$a.existsSync(path$9.join(dir2, candidate))) {
    n++;
    candidate = `${base}${n}.png`;
  }
  return candidate;
}
function buildRevisionFilename(dir2, sourceFilePath) {
  const ext2 = path$9.extname(sourceFilePath) || ".png";
  const base = path$9.basename(sourceFilePath, ext2);
  let candidateBase = `${base}+`;
  while (fs$a.existsSync(path$9.join(dir2, `${candidateBase}${ext2}`))) {
    candidateBase = `${candidateBase}+`;
  }
  return `${candidateBase}${ext2}`;
}
app.on("second-instance", () => {
  if (win) {
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});
app.on("web-contents-created", (_event, contents) => {
  contents.on("will-attach-webview", (_event2, webPreferences) => {
    webPreferences.devTools = DEVTOOLS_ENABLED;
  });
});
function createWindow() {
  win = new BrowserWindow({
    width: 1800,
    height: 1100,
    minWidth: 1400,
    minHeight: 900,
    title: "GPT Image Studio",
    icon: path$9.join(process.env.VITE_PUBLIC, "icon.ico"),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path$9.join(__dirname$1, "preload.mjs"),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true,
      sandbox: true,
      devTools: DEVTOOLS_ENABLED
    }
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path$9.join(RENDERER_DIST, "index.html"));
  }
  win.webContents.setWindowOpenHandler(() => ({
    action: "deny"
  }));
}
app.whenReady().then(() => {
  session.defaultSession.setUserAgent(
    session.defaultSession.getUserAgent()
  );
  if (!fs$a.existsSync(generatedImagesDir)) {
    fs$a.mkdirSync(generatedImagesDir, { recursive: true });
  }
  const handleWillDownload = (_event, item, webContents2) => {
    const workspaceId = webviewOwners.get(webContents2.id);
    const pending = workspaceId ? pendingDownloads.get(workspaceId) : void 0;
    logMainEvent(workspaceId, "Download Started", {
      webContentsId: webContents2.id,
      pendingArmedFor: (pending == null ? void 0 : pending.id) ?? null,
      pendingBaseName: (pending == null ? void 0 : pending.baseName) ?? null
    });
    if (workspaceId) {
      pendingDownloads.delete(workspaceId);
    }
    const fileName = (pending == null ? void 0 : pending.revisionSourcePath) ? buildRevisionFilename(generatedImagesDir, pending.revisionSourcePath) : buildAutoFilename(
      generatedImagesDir,
      (pending == null ? void 0 : pending.baseName) ?? "Untitled",
      (pending == null ? void 0 : pending.workTypePrefix) ?? ""
    );
    const filePath = path$9.join(generatedImagesDir, fileName);
    item.setSavePath(filePath);
    logMainEvent(workspaceId, "Save Started", {
      webContentsId: webContents2.id,
      filePath
    });
    item.once("done", (_2, state2) => {
      logMainEvent(workspaceId, "Save Completed", {
        webContentsId: webContents2.id,
        filePath,
        state: state2
      });
      win == null ? void 0 : win.webContents.send("image:downloaded", {
        id: (pending == null ? void 0 : pending.id) ?? null,
        filePath: state2 === "completed" ? filePath : null
      });
    });
  };
  session.defaultSession.on("will-download", handleWillDownload);
  session.fromPartition("persist:gpt-image-studio").on("will-download", handleWillDownload);
  ipcMain.on(
    "image:armDownload",
    (event, id, baseName, workTypePrefix) => {
      pendingDownloads.set(id, { id, baseName, workTypePrefix });
      logMainEvent(id, "Download Armed", { baseName, workTypePrefix });
      event.returnValue = true;
    }
  );
  ipcMain.on(
    "image:armRevisionDownload",
    (event, id, sourceFilePath) => {
      pendingDownloads.set(id, {
        id,
        baseName: "",
        workTypePrefix: "",
        revisionSourcePath: sourceFilePath
      });
      logMainEvent(id, "Revision Download Armed", { sourceFilePath });
      event.returnValue = true;
    }
  );
  ipcMain.on(
    "browser:registerWebview",
    (_event, workspaceId, webContentsId) => {
      webviewOwners.set(webContentsId, workspaceId);
      workspaceWebContentsIds.set(workspaceId, webContentsId);
      logMainEvent(workspaceId, "Webview Registered", { webContentsId });
    }
  );
  ipcMain.on(
    "browser:unregisterWebview",
    (_event, workspaceId) => {
      for (const [webContentsId, ownerId] of webviewOwners) {
        if (ownerId === workspaceId) {
          webviewOwners.delete(webContentsId);
          logMainEvent(workspaceId, "Webview Unregistered", { webContentsId });
        }
      }
      workspaceWebContentsIds.delete(workspaceId);
      pendingDownloads.delete(workspaceId);
    }
  );
  ipcMain.on("ws-audit:log", (event, line) => {
    if (!DIAGNOSTICS_ENABLED)
      return;
    console.log(line);
    try {
      fs$a.appendFileSync(wsAuditLogPath, `${line} | ipcSenderId=${event.sender.id}
`, "utf-8");
    } catch {
    }
  });
  ipcMain.handle(
    "image:verifyFile",
    async (_2, filePath) => {
      const timeoutMs = 3e3;
      const pollMs = 100;
      const startedAt = Date.now();
      while (Date.now() - startedAt <= timeoutMs) {
        try {
          const stat2 = fs$a.statSync(filePath);
          if (stat2.size > 0) {
            return { exists: true, size: stat2.size };
          }
        } catch {
        }
        await new Promise((resolve2) => setTimeout(resolve2, pollMs));
      }
      return { exists: false, size: 0 };
    }
  );
  ipcMain.handle("image:readAsDataUrl", (_2, filePath) => {
    const buffer = fs$a.readFileSync(filePath);
    const ext2 = path$9.extname(filePath).toLowerCase();
    const mimeType = ext2 === ".jpg" || ext2 === ".jpeg" ? "image/jpeg" : "image/png";
    return `data:${mimeType};base64,${buffer.toString("base64")}`;
  });
  ipcMain.handle("settings:getDownloadFolder", () => generatedImagesDir);
  ipcMain.handle("settings:browseDownloadFolder", async () => {
    if (!win) {
      return { success: false };
    }
    const result = await dialog.showOpenDialog(win, {
      properties: ["openDirectory", "createDirectory"]
    });
    if (result.canceled || !result.filePaths[0]) {
      return { success: false, canceled: true };
    }
    const folder = result.filePaths[0];
    if (!fs$a.existsSync(folder)) {
      fs$a.mkdirSync(folder, { recursive: true });
    }
    generatedImagesDir = folder;
    persistedSettings.downloadFolder = folder;
    saveSettings(persistedSettings);
    return { success: true, folder };
  });
  ipcMain.handle("settings:getFilenamePrefix", () => filenamePrefix);
  ipcMain.handle("settings:setFilenamePrefix", (_2, prefix) => {
    filenamePrefix = prefix;
    persistedSettings.filenamePrefix = prefix;
    saveSettings(persistedSettings);
    return { success: true };
  });
  ipcMain.handle("settings:openDownloadFolder", async () => {
    if (!fs$a.existsSync(generatedImagesDir)) {
      fs$a.mkdirSync(generatedImagesDir, { recursive: true });
    }
    const result = await shell.openPath(generatedImagesDir);
    return { success: result === "", error: result || null };
  });
  ipcMain.handle(
    "settings:getFirstLaunchNoticeShown",
    () => !!persistedSettings.firstLaunchNoticeShown
  );
  ipcMain.handle("settings:markFirstLaunchNoticeShown", () => {
    persistedSettings.firstLaunchNoticeShown = true;
    saveSettings(persistedSettings);
    return { success: true };
  });
  ipcMain.handle("settings:getAppInfo", () => {
    let gitCommit = null;
    try {
      gitCommit = execSync("git rev-parse --short HEAD", {
        cwd: process.env.APP_ROOT,
        stdio: ["ignore", "pipe", "ignore"]
      }).toString().trim();
    } catch {
      gitCommit = null;
    }
    return {
      appVersion: app.getVersion(),
      electronVersion: process.versions.electron,
      nodeVersion: process.versions.node,
      gitCommit
    };
  });
  ipcMain.handle("settings:getDebugMode", () => debugMode);
  ipcMain.handle("settings:setDebugMode", (_2, value) => {
    debugMode = value;
    persistedSettings.debugMode = value;
    saveSettings(persistedSettings);
    return { success: true };
  });
  ipcMain.handle("settings:getDebugLogsPath", () => debugLogsDir);
  ipcMain.on("debug:log", (_event, sessionId, file2, line) => {
    if (!debugMode || !isDebugLogFile(file2))
      return;
    try {
      const dir2 = ensureSessionDir(sessionId);
      fs$a.appendFileSync(path$9.join(dir2, `${file2}.log`), line + "\n", "utf-8");
    } catch {
    }
  });
  ipcMain.handle(
    "debug:savePromptData",
    (_2, payload) => {
      if (!debugMode)
        return { success: false };
      try {
        const dir2 = ensureSessionDir(payload.sessionId);
        fs$a.writeFileSync(path$9.join(dir2, "original_prompt.txt"), payload.original, "utf-8");
        fs$a.writeFileSync(path$9.join(dir2, "resolved_prompt.txt"), payload.substituted, "utf-8");
        fs$a.writeFileSync(path$9.join(dir2, "composer_readback.txt"), payload.composerReadback, "utf-8");
        fs$a.writeFileSync(
          path$9.join(dir2, "prompt_diff.txt"),
          buildUnifiedDiff(payload.substituted, payload.composerReadback),
          "utf-8"
        );
        const sha256 = createHash("sha256").update(payload.substituted, "utf-8").digest("hex");
        const summary = [
          `[PROMPT] ${(/* @__PURE__ */ new Date()).toISOString()} | workspace=${payload.workspaceId}`,
          `  name=${payload.promptName} id=${payload.promptId}`,
          `  originalCharCount=${payload.original.length} originalLineCount=${payload.original.split("\n").length}`,
          `  substitutedCharCount=${payload.substituted.length} substitutedLineCount=${payload.substituted.split("\n").length}`,
          `  sha256=${sha256}`
        ].join("\n");
        fs$a.appendFileSync(path$9.join(dir2, "prompt.log"), summary + "\n\n", "utf-8");
        return { success: true, sha256 };
      } catch (err) {
        return { success: false, error: String(err) };
      }
    }
  );
  ipcMain.handle(
    "debug:saveWorkspaceSnapshot",
    (_2, sessionId, phase, workspaceJson) => {
      if (!debugMode)
        return { success: false };
      try {
        const dir2 = ensureSessionDir(sessionId);
        fs$a.writeFileSync(path$9.join(dir2, `workspace_${phase}.json`), workspaceJson, "utf-8");
        return { success: true };
      } catch (err) {
        return { success: false, error: String(err) };
      }
    }
  );
  ipcMain.handle(
    "debug:saveComposerSnapshot",
    (_2, sessionId, payload) => {
      if (!debugMode)
        return { success: false };
      try {
        const dir2 = ensureSessionDir(sessionId);
        fs$a.writeFileSync(path$9.join(dir2, "composer.html"), payload.html ?? "", "utf-8");
        fs$a.writeFileSync(path$9.join(dir2, "composer.txt"), payload.text ?? "", "utf-8");
        return { success: true };
      } catch (err) {
        return { success: false, error: String(err) };
      }
    }
  );
  ipcMain.handle(
    "debug:captureError",
    (_2, payload) => {
      if (!debugMode)
        return { success: false };
      try {
        const dir2 = ensureSessionDir(payload.sessionId);
        const summary = [
          `[ERROR] ${(/* @__PURE__ */ new Date()).toISOString()} | workspace=${payload.workspaceId} | stage=${payload.stage}`,
          `  reason=${payload.reason}`,
          `  exception=${payload.exception ?? "(none)"}`,
          `  stack=${payload.stack ?? "(none)"}`
        ].join("\n");
        fs$a.appendFileSync(path$9.join(dir2, "error.log"), summary + "\n\n", "utf-8");
        return { success: true };
      } catch (err) {
        return { success: false, error: String(err) };
      }
    }
  );
  ipcMain.handle(
    "debug:screenshot",
    async (_2, sessionId, workspaceId, phase) => {
      if (!debugMode)
        return { success: false };
      try {
        const webContentsId = workspaceWebContentsIds.get(workspaceId);
        const contents = webContentsId !== void 0 ? webContents.fromId(webContentsId) : void 0;
        if (!contents) {
          return { success: false, error: "no webview webContents for this workspace" };
        }
        const image = await contents.capturePage();
        const dir2 = ensureSessionDir(sessionId);
        const filePath = path$9.join(dir2, `screenshot_${phase}.png`);
        fs$a.writeFileSync(filePath, image.toPNG());
        return { success: true, filePath };
      } catch (err) {
        return { success: false, error: String(err) };
      }
    }
  );
  function toFailureDetails(err, failingPath) {
    if (err instanceof Error) {
      return {
        message: err.message,
        code: err.code ?? null,
        stack: err.stack ?? null,
        path: failingPath
      };
    }
    return { message: String(err), code: null, stack: null, path: failingPath };
  }
  function writeExportErrorLog(details) {
    try {
      fs$a.mkdirSync(debugLogsDir, { recursive: true });
      const report = [
        "Timestamp:",
        (/* @__PURE__ */ new Date()).toISOString(),
        "",
        "Output path:",
        details.path,
        "",
        "Error message:",
        details.message,
        "",
        "Error code:",
        details.code ?? "(none)",
        "",
        "Error stack:",
        details.stack ?? "(none)",
        ""
      ].join("\n");
      fs$a.writeFileSync(path$9.join(debugLogsDir, "export-error.txt"), report, "utf-8");
    } catch {
    }
  }
  function reportExportFailure(details) {
    writeExportErrorLog(details);
    return {
      success: false,
      error: details.message,
      code: details.code,
      stack: details.stack,
      path: details.path
    };
  }
  ipcMain.handle("debug:exportDiagnostics", async (_2, sessionId) => {
    if (!win) {
      return { success: false };
    }
    const sessionDir = path$9.join(debugLogsDir, sessionId);
    if (!fs$a.existsSync(sessionDir)) {
      return { success: false, error: "no debug session found for this Generate run" };
    }
    let sessionEntries;
    try {
      sessionEntries = fs$a.readdirSync(sessionDir);
    } catch (err) {
      return reportExportFailure(toFailureDetails(err, sessionDir));
    }
    if (sessionEntries.length === 0) {
      return reportExportFailure({
        message: `debug session folder has no files to export: ${sessionDir}`,
        code: null,
        stack: null,
        path: sessionDir
      });
    }
    const stamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-").replace("T", "_").slice(0, 19);
    const defaultName = `Diagnostics_${stamp}.zip`;
    const result = await dialog.showSaveDialog(win, {
      defaultPath: defaultName,
      filters: [{ name: "ZIP", extensions: ["zip"] }]
    });
    if (result.canceled || !result.filePath) {
      return { success: false, canceled: true };
    }
    const outputPath = result.filePath;
    const cleanupFailedOutput = (output) => {
      try {
        output.destroy();
      } catch {
      }
      try {
        if (fs$a.existsSync(outputPath)) {
          fs$a.unlinkSync(outputPath);
        }
      } catch {
      }
    };
    try {
      await new Promise((resolve2, reject2) => {
        const output = fs$a.createWriteStream(outputPath);
        const archive = archiver("zip", { zlib: { level: 9 } });
        let settled = false;
        const fail = (err) => {
          if (settled) return;
          settled = true;
          cleanupFailedOutput(output);
          reject2(err);
        };
        output.on("close", () => {
          if (settled) return;
          settled = true;
          resolve2();
        });
        output.on("error", fail);
        archive.on("error", fail);
        archive.on("warning", (warning) => {
          console.error("[debug:exportDiagnostics] archiver warning:", warning);
          if (warning.code === "ENOENT") {
            fail(warning);
          }
        });
        archive.pipe(output);
        archive.directory(sessionDir, false);
        archive.finalize().catch(fail);
      });
      const stat2 = fs$a.statSync(outputPath);
      if (stat2.size === 0) {
        try {
          fs$a.unlinkSync(outputPath);
        } catch {
        }
        return reportExportFailure({
          message: "archive completed with no error but produced a 0-byte file",
          code: null,
          stack: null,
          path: outputPath
        });
      }
      return { success: true, filePath: outputPath };
    } catch (err) {
      return reportExportFailure(toFailureDetails(err, outputPath));
    }
  });
  ipcMain.handle(
    "backup:export",
    async (_2, json2) => {
      if (!win) {
        return { success: false };
      }
      const result = await dialog.showSaveDialog(win, {
        defaultPath: "GPT_Image_Studio_Backup.json",
        filters: [{ name: "JSON", extensions: ["json"] }]
      });
      if (result.canceled || !result.filePath) {
        return { success: false, canceled: true };
      }
      fs$a.writeFileSync(result.filePath, json2, "utf-8");
      return { success: true, filePath: result.filePath };
    }
  );
  ipcMain.handle("backup:import", async () => {
    if (!win) {
      return { success: false };
    }
    const result = await dialog.showOpenDialog(win, {
      properties: ["openFile"],
      filters: [{ name: "JSON", extensions: ["json"] }]
    });
    if (result.canceled || !result.filePaths[0]) {
      return { success: false, canceled: true };
    }
    try {
      const raw = fs$a.readFileSync(result.filePaths[0], "utf-8");
      const data = JSON.parse(raw);
      return { success: true, data };
    } catch {
      return {
        success: false,
        error: "Could not read or parse the selected file."
      };
    }
  });
  createWindow();
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
