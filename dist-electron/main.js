import { app as we, session as Ar, ipcMain as le, shell as ac, webContents as sc, BrowserWindow as Po, dialog as Lr } from "electron";
import { fileURLToPath as oc } from "node:url";
import re from "node:path";
import te from "node:fs";
import { execSync as fc } from "node:child_process";
import { createHash as uc } from "node:crypto";
import Lt from "fs";
import wr from "events";
import Ve from "path";
import Io from "constants";
import Ze from "stream";
import Ee from "util";
import ha from "assert";
import vt from "buffer";
import Co from "zlib";
import lc from "string_decoder";
var oe = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {};
function cc(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
function hc(e) {
  if (e.__esModule) return e;
  var t = e.default;
  if (typeof t == "function") {
    var r = function n() {
      return this instanceof n ? Reflect.construct(t, arguments, this.constructor) : t.apply(this, arguments);
    };
    r.prototype = t.prototype;
  } else r = {};
  return Object.defineProperty(r, "__esModule", { value: !0 }), Object.keys(e).forEach(function(n) {
    var i = Object.getOwnPropertyDescriptor(e, n);
    Object.defineProperty(r, n, i.get ? i : {
      enumerable: !0,
      get: function() {
        return e[n];
      }
    });
  }), r;
}
const dc = typeof process == "object" && process && process.platform === "win32";
var pc = dc ? { sep: "\\" } : { sep: "/" }, No = jo;
function jo(e, t, r) {
  e instanceof RegExp && (e = as(e, r)), t instanceof RegExp && (t = as(t, r));
  var n = Bo(e, t, r);
  return n && {
    start: n[0],
    end: n[1],
    pre: r.slice(0, n[0]),
    body: r.slice(n[0] + e.length, n[1]),
    post: r.slice(n[1] + t.length)
  };
}
function as(e, t) {
  var r = t.match(e);
  return r ? r[0] : null;
}
jo.range = Bo;
function Bo(e, t, r) {
  var n, i, a, s, f, u = r.indexOf(e), d = r.indexOf(t, u + 1), g = u;
  if (u >= 0 && d > 0) {
    if (e === t)
      return [u, d];
    for (n = [], a = r.length; g >= 0 && !f; )
      g == u ? (n.push(g), u = r.indexOf(e, g + 1)) : n.length == 1 ? f = [n.pop(), d] : (i = n.pop(), i < a && (a = i, s = d), d = r.indexOf(t, g + 1)), g = u < d && u >= 0 ? u : d;
    n.length && (f = [a, s]);
  }
  return f;
}
var Fo = No, gc = mc, ko = "\0SLASH" + Math.random() + "\0", Uo = "\0OPEN" + Math.random() + "\0", da = "\0CLOSE" + Math.random() + "\0", qo = "\0COMMA" + Math.random() + "\0", zo = "\0PERIOD" + Math.random() + "\0";
function zn(e) {
  return parseInt(e, 10) == e ? parseInt(e, 10) : e.charCodeAt(0);
}
function vc(e) {
  return e.split("\\\\").join(ko).split("\\{").join(Uo).split("\\}").join(da).split("\\,").join(qo).split("\\.").join(zo);
}
function yc(e) {
  return e.split(ko).join("\\").split(Uo).join("{").split(da).join("}").split(qo).join(",").split(zo).join(".");
}
function Wo(e) {
  if (!e)
    return [""];
  var t = [], r = Fo("{", "}", e);
  if (!r)
    return e.split(",");
  var n = r.pre, i = r.body, a = r.post, s = n.split(",");
  s[s.length - 1] += "{" + i + "}";
  var f = Wo(a);
  return a.length && (s[s.length - 1] += f.shift(), s.push.apply(s, f)), t.push.apply(t, s), t;
}
function mc(e, t) {
  if (!e)
    return [];
  t = t || {};
  var r = t.max == null ? 1 / 0 : t.max;
  return e.substr(0, 2) === "{}" && (e = "\\{\\}" + e.substr(2)), ir(vc(e), r, !0).map(yc);
}
function _c(e) {
  return "{" + e + "}";
}
function bc(e) {
  return /^-?0\d/.test(e);
}
function wc(e, t) {
  return e <= t;
}
function Sc(e, t) {
  return e >= t;
}
function ir(e, t, r) {
  for (var n = []; ; ) {
    const T = Fo("{", "}", e);
    if (!T) return [e];
    const M = T.pre;
    if (/\$$/.test(T.pre)) {
      const B = T.post.length ? ir(T.post, t, !1) : [""];
      for (let U = 0; U < B.length && U < t; U++) {
        const q = M + "{" + T.body + "}" + B[U];
        n.push(q);
      }
      return n;
    }
    var i = /^-?\d+\.\.-?\d+(?:\.\.-?\d+)?$/.test(T.body), a = /^[a-zA-Z]\.\.[a-zA-Z](?:\.\.-?\d+)?$/.test(T.body), s = i || a, f = T.body.indexOf(",") >= 0;
    if (!s && !f) {
      if (T.post.match(/,(?!,).*\}/)) {
        e = T.pre + "{" + T.body + da + T.post, r = !0;
        continue;
      }
      return [e];
    }
    const N = T.post.length ? ir(T.post, t, !1) : [""];
    var u;
    if (s)
      u = T.body.split(/\.\./);
    else if (u = Wo(T.body), u.length === 1 && (u = ir(u[0], t, !1).map(_c), u.length === 1))
      return N.map(function(B) {
        return T.pre + u[0] + B;
      });
    var d;
    if (s) {
      var g = zn(u[0]), p = zn(u[1]), v = Math.max(u[0].length, u[1].length), R = u.length == 3 ? Math.max(Math.abs(zn(u[2])), 1) : 1, A = wc, E = p < g;
      E && (R *= -1, A = Sc);
      var L = u.some(bc);
      d = [];
      for (var c = g; A(c, p) && d.length < t; c += R) {
        var h;
        if (a)
          h = String.fromCharCode(c), h === "\\" && (h = "");
        else if (h = String(c), L) {
          var O = v - h.length;
          if (O > 0) {
            var m = new Array(O + 1).join("0");
            c < 0 ? h = "-" + m + h.slice(1) : h = m + h;
          }
        }
        d.push(h);
      }
    } else {
      d = [];
      for (var x = 0; x < u.length; x++)
        d.push.apply(d, ir(u[x], t, !1));
    }
    for (var x = 0; x < d.length; x++)
      for (var P = 0; P < N.length && n.length < t; P++) {
        var C = M + d[x] + N[P];
        (!r || s || C) && n.push(C);
      }
    return n;
  }
}
const $e = Go = (e, t, r = {}) => (Gr(t), !r.nocomment && t.charAt(0) === "#" ? !1 : new gn(t, r).match(e));
var Go = $e;
const Ui = pc;
$e.sep = Ui.sep;
const Te = Symbol("globstar **");
$e.GLOBSTAR = Te;
const Ec = gc, ss = {
  "!": { open: "(?:(?!(?:", close: "))[^/]*?)" },
  "?": { open: "(?:", close: ")?" },
  "+": { open: "(?:", close: ")+" },
  "*": { open: "(?:", close: ")*" },
  "@": { open: "(?:", close: ")" }
}, qi = "[^/]", Wn = qi + "*?", xc = "(?:(?!(?:\\/|^)(?:\\.{1,2})($|\\/)).)*?", Oc = "(?:(?!(?:\\/|^)\\.).)*?", Ho = (e) => e.split("").reduce((t, r) => (t[r] = !0, t), {}), os = Ho("().*{}+?[]^$\\!"), Rc = Ho("[.("), fs = /\/+/;
$e.filter = (e, t = {}) => (r, n, i) => $e(r, e, t);
const rt = (e, t = {}) => {
  const r = {};
  return Object.keys(e).forEach((n) => r[n] = e[n]), Object.keys(t).forEach((n) => r[n] = t[n]), r;
};
$e.defaults = (e) => {
  if (!e || typeof e != "object" || !Object.keys(e).length)
    return $e;
  const t = $e, r = (n, i, a) => t(n, i, rt(e, a));
  return r.Minimatch = class extends t.Minimatch {
    constructor(i, a) {
      super(i, rt(e, a));
    }
  }, r.Minimatch.defaults = (n) => t.defaults(rt(e, n)).Minimatch, r.filter = (n, i) => t.filter(n, rt(e, i)), r.defaults = (n) => t.defaults(rt(e, n)), r.makeRe = (n, i) => t.makeRe(n, rt(e, i)), r.braceExpand = (n, i) => t.braceExpand(n, rt(e, i)), r.match = (n, i, a) => t.match(n, i, rt(e, a)), r;
};
$e.braceExpand = (e, t) => Vo(e, t);
const Vo = (e, t = {}) => (Gr(e), t.nobrace || !/\{(?:(?!\{).)*\}/.test(e) ? [e] : Ec(e)), Tc = 1024 * 64, Gr = (e) => {
  if (typeof e != "string")
    throw new TypeError("invalid pattern");
  if (e.length > Tc)
    throw new TypeError("pattern is too long");
}, Gn = Symbol("subparse");
$e.makeRe = (e, t) => new gn(e, t || {}).makeRe();
$e.match = (e, t, r = {}) => {
  const n = new gn(t, r);
  return e = e.filter((i) => n.match(i)), n.options.nonull && !e.length && e.push(t), e;
};
const Ac = (e) => e.replace(/\\(.)/g, "$1"), Lc = (e) => e.replace(/\\([^-\]])/g, "$1"), $c = (e) => e.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"), Mc = (e) => e.replace(/[[\]\\]/g, "\\$&");
let gn = class {
  constructor(t, r) {
    Gr(t), r || (r = {}), this.options = r, this.maxGlobstarRecursion = r.maxGlobstarRecursion !== void 0 ? r.maxGlobstarRecursion : 200, this.set = [], this.pattern = t, this.windowsPathsNoEscape = !!r.windowsPathsNoEscape || r.allowWindowsEscape === !1, this.windowsPathsNoEscape && (this.pattern = this.pattern.replace(/\\/g, "/")), this.regexp = null, this.negate = !1, this.comment = !1, this.empty = !1, this.partial = !!r.partial, this.make();
  }
  debug() {
  }
  make() {
    const t = this.pattern, r = this.options;
    if (!r.nocomment && t.charAt(0) === "#") {
      this.comment = !0;
      return;
    }
    if (!t) {
      this.empty = !0;
      return;
    }
    this.parseNegate();
    let n = this.globSet = this.braceExpand();
    r.debug && (this.debug = (...i) => console.error(...i)), this.debug(this.pattern, n), n = this.globParts = n.map((i) => i.split(fs)), this.debug(this.pattern, n), n = n.map((i, a, s) => i.map(this.parse, this)), this.debug(this.pattern, n), n = n.filter((i) => i.indexOf(!1) === -1), this.debug(this.pattern, n), this.set = n;
  }
  parseNegate() {
    if (this.options.nonegate) return;
    const t = this.pattern;
    let r = !1, n = 0;
    for (let i = 0; i < t.length && t.charAt(i) === "!"; i++)
      r = !r, n++;
    n && (this.pattern = t.slice(n)), this.negate = r;
  }
  // set partial to true to test if, for example,
  // "/a/b" matches the start of "/*/b/*/d"
  // Partial means, if you run out of file before you run
  // out of pattern, then that's fine, as long as all
  // the parts match.
  matchOne(t, r, n) {
    return r.indexOf(Te) !== -1 ? this._matchGlobstar(t, r, n, 0, 0) : this._matchOne(t, r, n, 0, 0);
  }
  _matchGlobstar(t, r, n, i, a) {
    let s = -1;
    for (let h = a; h < r.length; h++)
      if (r[h] === Te) {
        s = h;
        break;
      }
    let f = -1;
    for (let h = r.length - 1; h >= 0; h--)
      if (r[h] === Te) {
        f = h;
        break;
      }
    const u = r.slice(a, s), d = n ? r.slice(s + 1) : r.slice(s + 1, f), g = n ? [] : r.slice(f + 1);
    if (u.length) {
      const h = t.slice(i, i + u.length);
      if (!this._matchOne(h, u, n, 0, 0))
        return !1;
      i += u.length;
    }
    let p = 0;
    if (g.length) {
      if (g.length + i > t.length) return !1;
      const h = t.length - g.length;
      if (this._matchOne(t, g, n, h, 0))
        p = g.length;
      else {
        if (t[t.length - 1] !== "" || i + g.length === t.length || !this._matchOne(t, g, n, h - 1, 0))
          return !1;
        p = g.length + 1;
      }
    }
    if (!d.length) {
      let h = !!p;
      for (let O = i; O < t.length - p; O++) {
        const m = String(t[O]);
        if (h = !0, m === "." || m === ".." || !this.options.dot && m.charAt(0) === ".")
          return !1;
      }
      return n || h;
    }
    const v = [[[], 0]];
    let R = v[0], A = 0;
    const E = [0];
    for (const h of d)
      h === Te ? (E.push(A), R = [[], 0], v.push(R)) : (R[0].push(h), A++);
    let L = v.length - 1;
    const c = t.length - p;
    for (const h of v)
      h[1] = c - (E[L--] + h[0].length);
    return !!this._matchGlobStarBodySections(
      t,
      v,
      i,
      0,
      n,
      0,
      !!p
    );
  }
  // return false for "nope, not matching"
  // return null for "not matching, cannot keep trying"
  _matchGlobStarBodySections(t, r, n, i, a, s, f) {
    const u = r[i];
    if (!u) {
      for (let p = n; p < t.length; p++) {
        f = !0;
        const v = t[p];
        if (v === "." || v === ".." || !this.options.dot && v.charAt(0) === ".")
          return !1;
      }
      return f;
    }
    const [d, g] = u;
    for (; n <= g; ) {
      if (this._matchOne(
        t.slice(0, n + d.length),
        d,
        a,
        n,
        0
      ) && s < this.maxGlobstarRecursion) {
        const R = this._matchGlobStarBodySections(
          t,
          r,
          n + d.length,
          i + 1,
          a,
          s + 1,
          f
        );
        if (R !== !1)
          return R;
      }
      const v = t[n];
      if (v === "." || v === ".." || !this.options.dot && v.charAt(0) === ".")
        return !1;
      n++;
    }
    return a || null;
  }
  _matchOne(t, r, n, i, a) {
    let s, f, u, d;
    for (s = i, f = a, u = t.length, d = r.length; s < u && f < d; s++, f++) {
      this.debug("matchOne loop");
      const g = r[f], p = t[s];
      if (this.debug(r, g, p), g === !1 || g === Te) return !1;
      let v;
      if (typeof g == "string" ? (v = p === g, this.debug("string match", g, p, v)) : (v = p.match(g), this.debug("pattern match", g, p, v)), !v) return !1;
    }
    if (s === u && f === d)
      return !0;
    if (s === u)
      return n;
    if (f === d)
      return s === u - 1 && t[s] === "";
    throw new Error("wtf?");
  }
  braceExpand() {
    return Vo(this.pattern, this.options);
  }
  parse(t, r) {
    Gr(t);
    const n = this.options;
    if (t === "**")
      if (n.noglobstar)
        t = "*";
      else
        return Te;
    if (t === "") return "";
    let i = "", a = !1, s = !1;
    const f = [], u = [];
    let d, g = !1, p = -1, v = -1, R, A, E, L = t.charAt(0) === ".", c = n.dot || L;
    const h = () => L ? "" : c ? "(?!(?:^|\\/)\\.{1,2}(?:$|\\/))" : "(?!\\.)", O = (C) => C.charAt(0) === "." ? "" : n.dot ? "(?!(?:^|\\/)\\.{1,2}(?:$|\\/))" : "(?!\\.)", m = () => {
      if (d) {
        switch (d) {
          case "*":
            i += Wn, a = !0;
            break;
          case "?":
            i += qi, a = !0;
            break;
          default:
            i += "\\" + d;
            break;
        }
        this.debug("clearStateChar %j %j", d, i), d = !1;
      }
    };
    for (let C = 0, T; C < t.length && (T = t.charAt(C)); C++) {
      if (this.debug("%s	%s %s %j", t, C, i, T), s) {
        if (T === "/")
          return !1;
        os[T] && (i += "\\"), i += T, s = !1;
        continue;
      }
      switch (T) {
        case "/":
          return !1;
        case "\\":
          if (g && t.charAt(C + 1) === "-") {
            i += T;
            continue;
          }
          m(), s = !0;
          continue;
        case "?":
        case "*":
        case "+":
        case "@":
        case "!":
          if (this.debug("%s	%s %s %j <-- stateChar", t, C, i, T), g) {
            this.debug("  in class"), T === "!" && C === v + 1 && (T = "^"), i += T;
            continue;
          }
          if (T === "*" && d === "*") continue;
          this.debug("call clearStateChar %j", d), m(), d = T, n.noext && m();
          continue;
        case "(": {
          if (g) {
            i += "(";
            continue;
          }
          if (!d) {
            i += "\\(";
            continue;
          }
          const M = {
            type: d,
            start: C - 1,
            reStart: i.length,
            open: ss[d].open,
            close: ss[d].close
          };
          this.debug(this.pattern, "	", M), f.push(M), i += M.open, M.start === 0 && M.type !== "!" && (L = !0, i += O(t.slice(C + 1))), this.debug("plType %j %j", d, i), d = !1;
          continue;
        }
        case ")": {
          const M = f[f.length - 1];
          if (g || !M) {
            i += "\\)";
            continue;
          }
          f.pop(), m(), a = !0, A = M, i += A.close, A.type === "!" && u.push(Object.assign(A, { reEnd: i.length }));
          continue;
        }
        case "|": {
          const M = f[f.length - 1];
          if (g || !M) {
            i += "\\|";
            continue;
          }
          m(), i += "|", M.start === 0 && M.type !== "!" && (L = !0, i += O(t.slice(C + 1)));
          continue;
        }
        case "[":
          if (m(), g) {
            i += "\\" + T;
            continue;
          }
          g = !0, v = C, p = i.length, i += T;
          continue;
        case "]":
          if (C === v + 1 || !g) {
            i += "\\" + T;
            continue;
          }
          R = t.substring(v + 1, C);
          try {
            RegExp("[" + Mc(Lc(R)) + "]"), i += T;
          } catch {
            i = i.substring(0, p) + "(?:$.)";
          }
          a = !0, g = !1;
          continue;
        default:
          m(), os[T] && !(T === "^" && g) && (i += "\\"), i += T;
          break;
      }
    }
    for (g && (R = t.slice(v + 1), E = this.parse(R, Gn), i = i.substring(0, p) + "\\[" + E[0], a = a || E[1]), A = f.pop(); A; A = f.pop()) {
      let C;
      C = i.slice(A.reStart + A.open.length), this.debug("setting tail", i, A), C = C.replace(/((?:\\{2}){0,64})(\\?)\|/g, (M, N, B) => (B || (B = "\\"), N + N + B + "|")), this.debug(`tail=%j
   %s`, C, C, A, i);
      const T = A.type === "*" ? Wn : A.type === "?" ? qi : "\\" + A.type;
      a = !0, i = i.slice(0, A.reStart) + T + "\\(" + C;
    }
    m(), s && (i += "\\\\");
    const x = Rc[i.charAt(0)];
    for (let C = u.length - 1; C > -1; C--) {
      const T = u[C], M = i.slice(0, T.reStart), N = i.slice(T.reStart, T.reEnd - 8);
      let B = i.slice(T.reEnd);
      const U = i.slice(T.reEnd - 8, T.reEnd) + B, q = M.split(")").length, H = M.split("(").length - q;
      let V = B;
      for (let b = 0; b < H; b++)
        V = V.replace(/\)[+*?]?/, "");
      B = V;
      const Y = B === "" && r !== Gn ? "(?:$|\\/)" : "";
      i = M + N + B + Y + U;
    }
    if (i !== "" && a && (i = "(?=.)" + i), x && (i = h() + i), r === Gn)
      return [i, a];
    if (n.nocase && !a && (a = t.toUpperCase() !== t.toLowerCase()), !a)
      return Ac(t);
    const P = n.nocase ? "i" : "";
    try {
      return Object.assign(new RegExp("^" + i + "$", P), {
        _glob: t,
        _src: i
      });
    } catch {
      return new RegExp("$.");
    }
  }
  makeRe() {
    if (this.regexp || this.regexp === !1) return this.regexp;
    const t = this.set;
    if (!t.length)
      return this.regexp = !1, this.regexp;
    const r = this.options, n = r.noglobstar ? Wn : r.dot ? xc : Oc, i = r.nocase ? "i" : "";
    let a = t.map((s) => (s = s.map(
      (f) => typeof f == "string" ? $c(f) : f === Te ? Te : f._src
    ).reduce((f, u) => (f[f.length - 1] === Te && u === Te || f.push(u), f), []), s.forEach((f, u) => {
      f !== Te || s[u - 1] === Te || (u === 0 ? s.length > 1 ? s[u + 1] = "(?:\\/|" + n + "\\/)?" + s[u + 1] : s[u] = n : u === s.length - 1 ? s[u - 1] += "(?:\\/|" + n + ")?" : (s[u - 1] += "(?:\\/|\\/" + n + "\\/)" + s[u + 1], s[u + 1] = Te));
    }), s.filter((f) => f !== Te).join("/"))).join("|");
    a = "^(?:" + a + ")$", this.negate && (a = "^(?!" + a + ").*$");
    try {
      this.regexp = new RegExp(a, i);
    } catch {
      this.regexp = !1;
    }
    return this.regexp;
  }
  match(t, r = this.partial) {
    if (this.debug("match", t, this.pattern), this.comment) return !1;
    if (this.empty) return t === "";
    if (t === "/" && r) return !0;
    const n = this.options;
    Ui.sep !== "/" && (t = t.split(Ui.sep).join("/")), t = t.split(fs), this.debug(this.pattern, "split", t);
    const i = this.set;
    this.debug(this.pattern, "set", i);
    let a;
    for (let s = t.length - 1; s >= 0 && (a = t[s], !a); s--)
      ;
    for (let s = 0; s < i.length; s++) {
      const f = i[s];
      let u = t;
      if (n.matchBase && f.length === 1 && (u = [a]), this.matchOne(u, f, r))
        return n.flipNegate ? !0 : !this.negate;
    }
    return n.flipNegate ? !1 : this.negate;
  }
  static defaults(t) {
    return $e.defaults(t).Minimatch;
  }
};
$e.Minimatch = gn;
var Dc = Ko;
const zi = Lt, { EventEmitter: Pc } = wr, { Minimatch: Hn } = Go, { resolve: Ic } = Ve;
function Cc(e, t) {
  return new Promise((r, n) => {
    zi.readdir(e, { withFileTypes: !0 }, (i, a) => {
      if (i)
        switch (i.code) {
          case "ENOTDIR":
            t ? n(i) : r([]);
            break;
          case "ENOTSUP":
          case "ENOENT":
          case "ENAMETOOLONG":
          case "UNKNOWN":
            r([]);
            break;
          case "ELOOP":
          default:
            n(i);
            break;
        }
      else
        r(a);
    });
  });
}
function Zo(e, t) {
  return new Promise((r, n) => {
    (t ? zi.stat : zi.lstat)(e, (a, s) => {
      if (a)
        switch (a.code) {
          case "ENOENT":
            r(t ? Zo(e, !1) : null);
            break;
          default:
            r(null);
            break;
        }
      else
        r(s);
    });
  });
}
async function* Yo(e, t, r, n, i, a) {
  let s = await Cc(t + e, a);
  for (const f of s) {
    let u = f.name;
    u === void 0 && (u = f, n = !0);
    const d = e + "/" + u, g = d.slice(1), p = t + "/" + g;
    let v = null;
    (n || r) && (v = await Zo(p, r)), !v && f.name !== void 0 && (v = f), v === null && (v = { isDirectory: () => !1 }), v.isDirectory() ? i(g) || (yield { relative: g, absolute: p, stats: v }, yield* Yo(d, t, r, n, i, !1)) : yield { relative: g, absolute: p, stats: v };
  }
}
async function* Nc(e, t, r, n) {
  yield* Yo("", e, t, r, n, !0);
}
function jc(e) {
  return {
    pattern: e.pattern,
    dot: !!e.dot,
    noglobstar: !!e.noglobstar,
    matchBase: !!e.matchBase,
    nocase: !!e.nocase,
    ignore: e.ignore,
    skip: e.skip,
    follow: !!e.follow,
    stat: !!e.stat,
    nodir: !!e.nodir,
    mark: !!e.mark,
    silent: !!e.silent,
    absolute: !!e.absolute
  };
}
class Qo extends Pc {
  constructor(t, r, n) {
    if (super(), typeof r == "function" && (n = r, r = null), this.options = jc(r || {}), this.matchers = [], this.options.pattern) {
      const i = Array.isArray(this.options.pattern) ? this.options.pattern : [this.options.pattern];
      this.matchers = i.map(
        (a) => new Hn(a, {
          dot: this.options.dot,
          noglobstar: this.options.noglobstar,
          matchBase: this.options.matchBase,
          nocase: this.options.nocase
        })
      );
    }
    if (this.ignoreMatchers = [], this.options.ignore) {
      const i = Array.isArray(this.options.ignore) ? this.options.ignore : [this.options.ignore];
      this.ignoreMatchers = i.map(
        (a) => new Hn(a, { dot: !0 })
      );
    }
    if (this.skipMatchers = [], this.options.skip) {
      const i = Array.isArray(this.options.skip) ? this.options.skip : [this.options.skip];
      this.skipMatchers = i.map(
        (a) => new Hn(a, { dot: !0 })
      );
    }
    this.iterator = Nc(Ic(t || "."), this.options.follow, this.options.stat, this._shouldSkipDirectory.bind(this)), this.paused = !1, this.inactive = !1, this.aborted = !1, n && (this._matches = [], this.on("match", (i) => this._matches.push(this.options.absolute ? i.absolute : i.relative)), this.on("error", (i) => n(i)), this.on("end", () => n(null, this._matches))), setTimeout(() => this._next(), 0);
  }
  _shouldSkipDirectory(t) {
    return this.skipMatchers.some((r) => r.match(t));
  }
  _fileMatches(t, r) {
    const n = t + (r ? "/" : "");
    return (this.matchers.length === 0 || this.matchers.some((i) => i.match(n))) && !this.ignoreMatchers.some((i) => i.match(n)) && (!this.options.nodir || !r);
  }
  _next() {
    !this.paused && !this.aborted ? this.iterator.next().then((t) => {
      if (t.done)
        this.emit("end");
      else {
        const r = t.value.stats.isDirectory();
        if (this._fileMatches(t.value.relative, r)) {
          let n = t.value.relative, i = t.value.absolute;
          this.options.mark && r && (n += "/", i += "/"), this.options.stat ? this.emit("match", { relative: n, absolute: i, stat: t.value.stats }) : this.emit("match", { relative: n, absolute: i });
        }
        this._next(this.iterator);
      }
    }).catch((t) => {
      this.abort(), this.emit("error", t), !t.code && !this.options.silent && console.error(t);
    }) : this.inactive = !0;
  }
  abort() {
    this.aborted = !0;
  }
  pause() {
    this.paused = !0;
  }
  resume() {
    this.paused = !1, this.inactive && (this.inactive = !1, this._next());
  }
}
function Ko(e, t, r) {
  return new Qo(e, t, r);
}
Ko.ReaddirGlob = Qo;
function Xo(e, ...t) {
  return (...r) => e(...t, ...r);
}
function Sr(e) {
  return function(...t) {
    var r = t.pop();
    return e.call(this, t, r);
  };
}
var Bc = typeof queueMicrotask == "function" && queueMicrotask, Jo = typeof setImmediate == "function" && setImmediate, ef = typeof process == "object" && typeof process.nextTick == "function";
function tf(e) {
  setTimeout(e, 0);
}
function rf(e) {
  return (t, ...r) => e(() => t(...r));
}
var ar;
Bc ? ar = queueMicrotask : Jo ? ar = setImmediate : ef ? ar = process.nextTick : ar = tf;
var lt = rf(ar);
function lr(e) {
  return Er(e) ? function(...t) {
    const r = t.pop(), n = e.apply(this, t);
    return us(n, r);
  } : Sr(function(t, r) {
    var n;
    try {
      n = e.apply(this, t);
    } catch (i) {
      return r(i);
    }
    if (n && typeof n.then == "function")
      return us(n, r);
    r(null, n);
  });
}
function us(e, t) {
  return e.then((r) => {
    ls(t, null, r);
  }, (r) => {
    ls(t, r && (r instanceof Error || r.message) ? r : new Error(r));
  });
}
function ls(e, t, r) {
  try {
    e(t, r);
  } catch (n) {
    lt((i) => {
      throw i;
    }, n);
  }
}
function Er(e) {
  return e[Symbol.toStringTag] === "AsyncFunction";
}
function Fc(e) {
  return e[Symbol.toStringTag] === "AsyncGenerator";
}
function kc(e) {
  return typeof e[Symbol.asyncIterator] == "function";
}
function J(e) {
  if (typeof e != "function") throw new Error("expected a function");
  return Er(e) ? lr(e) : e;
}
function X(e, t) {
  if (t || (t = e.length), !t) throw new Error("arity is undefined");
  function r(...n) {
    return typeof n[t - 1] == "function" ? e.apply(this, n) : new Promise((i, a) => {
      n[t - 1] = (s, ...f) => {
        if (s) return a(s);
        i(f.length > 1 ? f : f[0]);
      }, e.apply(this, n);
    });
  }
  return r;
}
function nf(e) {
  return function(r, ...n) {
    return X(function(a) {
      var s = this;
      return e(r, (f, u) => {
        J(f).apply(s, n.concat(u));
      }, a);
    });
  };
}
function pa(e, t, r, n) {
  t = t || [];
  var i = [], a = 0, s = J(r);
  return e(t, (f, u, d) => {
    var g = a++;
    s(f, (p, v) => {
      i[g] = v, d(p);
    });
  }, (f) => {
    n(f, i);
  });
}
function vn(e) {
  return e && typeof e.length == "number" && e.length >= 0 && e.length % 1 === 0;
}
const yn = {};
function yt(e) {
  function t(...r) {
    if (e !== null) {
      var n = e;
      e = null, n.apply(this, r);
    }
  }
  return Object.assign(t, e), t;
}
function Uc(e) {
  return e[Symbol.iterator] && e[Symbol.iterator]();
}
function qc(e) {
  var t = -1, r = e.length;
  return function() {
    return ++t < r ? { value: e[t], key: t } : null;
  };
}
function zc(e) {
  var t = -1;
  return function() {
    var n = e.next();
    return n.done ? null : (t++, { value: n.value, key: t });
  };
}
function Wc(e) {
  var t = e ? Object.keys(e) : [], r = -1, n = t.length;
  return function i() {
    var a = t[++r];
    return a === "__proto__" ? i() : r < n ? { value: e[a], key: a } : null;
  };
}
function Gc(e) {
  if (vn(e))
    return qc(e);
  var t = Uc(e);
  return t ? zc(t) : Wc(e);
}
function mt(e) {
  return function(...t) {
    if (e === null) throw new Error("Callback was already called.");
    var r = e;
    e = null, r.apply(this, t);
  };
}
function cs(e, t, r, n) {
  let i = !1, a = !1, s = !1, f = 0, u = 0;
  function d() {
    f >= t || s || i || (s = !0, e.next().then(({ value: v, done: R }) => {
      if (!(a || i)) {
        if (s = !1, R) {
          i = !0, f <= 0 && n(null);
          return;
        }
        f++, r(v, u, g), u++, d();
      }
    }).catch(p));
  }
  function g(v, R) {
    if (f -= 1, !a) {
      if (v) return p(v);
      if (v === !1) {
        i = !0, a = !0;
        return;
      }
      if (R === yn || i && f <= 0)
        return i = !0, n(null);
      d();
    }
  }
  function p(v) {
    a || (s = !1, i = !0, n(v));
  }
  d();
}
var ke = (e) => (t, r, n) => {
  if (n = yt(n), e <= 0)
    throw new RangeError("concurrency limit cannot be less than 1");
  if (!t)
    return n(null);
  if (Fc(t))
    return cs(t, e, r, n);
  if (kc(t))
    return cs(t[Symbol.asyncIterator](), e, r, n);
  var i = Gc(t), a = !1, s = !1, f = 0, u = !1;
  function d(p, v) {
    if (!s)
      if (f -= 1, p)
        a = !0, n(p);
      else if (p === !1)
        a = !0, s = !0;
      else {
        if (v === yn || a && f <= 0)
          return a = !0, n(null);
        u || g();
      }
  }
  function g() {
    for (u = !0; f < e && !a; ) {
      var p = i();
      if (p === null) {
        a = !0, f <= 0 && n(null);
        return;
      }
      f += 1, r(p.value, p.key, mt(d));
    }
    u = !1;
  }
  g();
};
function Hc(e, t, r, n) {
  return ke(t)(e, J(r), n);
}
var qt = X(Hc, 4);
function Vc(e, t, r) {
  r = yt(r);
  var n = 0, i = 0, { length: a } = e, s = !1;
  a === 0 && r(null);
  function f(u, d) {
    u === !1 && (s = !0), s !== !0 && (u ? r(u) : (++i === a || d === yn) && r(null));
  }
  for (; n < a; n++)
    t(e[n], n, mt(f));
}
function Zc(e, t, r) {
  return qt(e, 1 / 0, t, r);
}
function Yc(e, t, r) {
  var n = vn(e) ? Vc : Zc;
  return n(e, J(t), r);
}
var De = X(Yc, 3);
function Qc(e, t, r) {
  return pa(De, e, t, r);
}
var mn = X(Qc, 3), af = nf(mn);
function Kc(e, t, r) {
  return qt(e, 1, t, r);
}
var Fe = X(Kc, 3);
function Xc(e, t, r) {
  return pa(Fe, e, t, r);
}
var ga = X(Xc, 3), sf = nf(ga);
const Qt = Symbol("promiseCallback");
function zt() {
  let e, t;
  function r(n, ...i) {
    if (n) return t(n);
    e(i.length > 1 ? i : i[0]);
  }
  return r[Qt] = new Promise((n, i) => {
    e = n, t = i;
  }), r;
}
function va(e, t, r) {
  typeof t != "number" && (r = t, t = null), r = yt(r || zt());
  var n = Object.keys(e).length;
  if (!n)
    return r(null);
  t || (t = n);
  var i = {}, a = 0, s = !1, f = !1, u = /* @__PURE__ */ Object.create(null), d = [], g = [], p = {};
  Object.keys(e).forEach((O) => {
    var m = e[O];
    if (!Array.isArray(m)) {
      v(O, [m]), g.push(O);
      return;
    }
    var x = m.slice(0, m.length - 1), P = x.length;
    if (P === 0) {
      v(O, m), g.push(O);
      return;
    }
    p[O] = P, x.forEach((C) => {
      if (!e[C])
        throw new Error("async.auto task `" + O + "` has a non-existent dependency `" + C + "` in " + x.join(", "));
      A(C, () => {
        P--, P === 0 && v(O, m);
      });
    });
  }), c(), R();
  function v(O, m) {
    d.push(() => L(O, m));
  }
  function R() {
    if (!s) {
      if (d.length === 0 && a === 0)
        return r(null, i);
      for (; d.length && a < t; ) {
        var O = d.shift();
        O();
      }
    }
  }
  function A(O, m) {
    var x = u[O];
    x || (x = u[O] = []), x.push(m);
  }
  function E(O) {
    var m = u[O] || [];
    m.forEach((x) => x()), R();
  }
  function L(O, m) {
    if (!f) {
      var x = mt((C, ...T) => {
        if (a--, C === !1) {
          s = !0;
          return;
        }
        if (T.length < 2 && ([T] = T), C) {
          var M = {};
          if (Object.keys(i).forEach((N) => {
            M[N] = i[N];
          }), M[O] = T, f = !0, u = /* @__PURE__ */ Object.create(null), s) return;
          r(C, M);
        } else
          i[O] = T, E(O);
      });
      a++;
      var P = J(m[m.length - 1]);
      m.length > 1 ? P(i, x) : P(x);
    }
  }
  function c() {
    for (var O, m = 0; g.length; )
      O = g.pop(), m++, h(O).forEach((x) => {
        --p[x] === 0 && g.push(x);
      });
    if (m !== n)
      throw new Error(
        "async.auto cannot execute tasks due to a recursive dependency"
      );
  }
  function h(O) {
    var m = [];
    return Object.keys(e).forEach((x) => {
      const P = e[x];
      Array.isArray(P) && P.indexOf(O) >= 0 && m.push(x);
    }), m;
  }
  return r[Qt];
}
var Jc = /^(?:async\s)?(?:function)?\s*(?:\w+\s*)?\(([^)]+)\)(?:\s*{)/, eh = /^(?:async\s)?\s*(?:\(\s*)?((?:[^)=\s]\s*)*)(?:\)\s*)?=>/, th = /,/, rh = /(=.+)?(\s*)$/;
function nh(e) {
  let t = "", r = 0, n = e.indexOf("*/");
  for (; r < e.length; )
    if (e[r] === "/" && e[r + 1] === "/") {
      let i = e.indexOf(`
`, r);
      r = i === -1 ? e.length : i;
    } else if (n !== -1 && e[r] === "/" && e[r + 1] === "*") {
      let i = e.indexOf("*/", r);
      i !== -1 ? (r = i + 2, n = e.indexOf("*/", r)) : (t += e[r], r++);
    } else
      t += e[r], r++;
  return t;
}
function ih(e) {
  const t = nh(e.toString());
  let r = t.match(Jc);
  if (r || (r = t.match(eh)), !r) throw new Error(`could not parse args in autoInject
Source:
` + t);
  let [, n] = r;
  return n.replace(/\s/g, "").split(th).map((i) => i.replace(rh, "").trim());
}
function of(e, t) {
  var r = {};
  return Object.keys(e).forEach((n) => {
    var i = e[n], a, s = Er(i), f = !s && i.length === 1 || s && i.length === 0;
    if (Array.isArray(i))
      a = [...i], i = a.pop(), r[n] = a.concat(a.length > 0 ? u : i);
    else if (f)
      r[n] = i;
    else {
      if (a = ih(i), i.length === 0 && !s && a.length === 0)
        throw new Error("autoInject task functions require explicit parameters.");
      s || a.pop(), r[n] = a.concat(u);
    }
    function u(d, g) {
      var p = a.map((v) => d[v]);
      p.push(g), J(i)(...p);
    }
  }), va(r, t);
}
class ah {
  constructor() {
    this.head = this.tail = null, this.length = 0;
  }
  removeLink(t) {
    return t.prev ? t.prev.next = t.next : this.head = t.next, t.next ? t.next.prev = t.prev : this.tail = t.prev, t.prev = t.next = null, this.length -= 1, t;
  }
  empty() {
    for (; this.head; ) this.shift();
    return this;
  }
  insertAfter(t, r) {
    r.prev = t, r.next = t.next, t.next ? t.next.prev = r : this.tail = r, t.next = r, this.length += 1;
  }
  insertBefore(t, r) {
    r.prev = t.prev, r.next = t, t.prev ? t.prev.next = r : this.head = r, t.prev = r, this.length += 1;
  }
  unshift(t) {
    this.head ? this.insertBefore(this.head, t) : hs(this, t);
  }
  push(t) {
    this.tail ? this.insertAfter(this.tail, t) : hs(this, t);
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
    for (var t = this.head; t; )
      yield t.data, t = t.next;
  }
  remove(t) {
    for (var r = this.head; r; ) {
      var { next: n } = r;
      t(r) && this.removeLink(r), r = n;
    }
    return this;
  }
}
function hs(e, t) {
  e.length = 1, e.head = e.tail = t;
}
function ya(e, t, r) {
  if (t == null)
    t = 1;
  else if (t === 0)
    throw new RangeError("Concurrency must not be zero");
  var n = J(e), i = 0, a = [];
  const s = {
    error: [],
    drain: [],
    saturated: [],
    unsaturated: [],
    empty: []
  };
  function f(h, O) {
    s[h].push(O);
  }
  function u(h, O) {
    const m = (...x) => {
      d(h, m), O(...x);
    };
    s[h].push(m);
  }
  function d(h, O) {
    if (!h) return Object.keys(s).forEach((m) => s[m] = []);
    if (!O) return s[h] = [];
    s[h] = s[h].filter((m) => m !== O);
  }
  function g(h, ...O) {
    s[h].forEach((m) => m(...O));
  }
  var p = !1;
  function v(h, O, m, x) {
    if (x != null && typeof x != "function")
      throw new Error("task callback must be a function");
    c.started = !0;
    var P, C;
    function T(N, ...B) {
      if (N) return m ? C(N) : P();
      if (B.length <= 1) return P(B[0]);
      P(B);
    }
    var M = c._createTaskItem(
      h,
      m ? T : x || T
    );
    if (O ? c._tasks.unshift(M) : c._tasks.push(M), p || (p = !0, lt(() => {
      p = !1, c.process();
    })), m || !x)
      return new Promise((N, B) => {
        P = N, C = B;
      });
  }
  function R(h) {
    return function(O, ...m) {
      i -= 1;
      for (var x = 0, P = h.length; x < P; x++) {
        var C = h[x], T = a.indexOf(C);
        T === 0 ? a.shift() : T > 0 && a.splice(T, 1), C.callback(O, ...m), O != null && g("error", O, C.data);
      }
      i <= c.concurrency - c.buffer && g("unsaturated"), c.idle() && g("drain"), c.process();
    };
  }
  function A(h) {
    return h.length === 0 && c.idle() ? (lt(() => g("drain")), !0) : !1;
  }
  const E = (h) => (O) => {
    if (!O)
      return new Promise((m, x) => {
        u(h, (P, C) => {
          if (P) return x(P);
          m(C);
        });
      });
    d(h), f(h, O);
  };
  var L = !1, c = {
    _tasks: new ah(),
    _createTaskItem(h, O) {
      return {
        data: h,
        callback: O
      };
    },
    *[Symbol.iterator]() {
      yield* c._tasks[Symbol.iterator]();
    },
    concurrency: t,
    payload: r,
    buffer: t / 4,
    started: !1,
    paused: !1,
    push(h, O) {
      return Array.isArray(h) ? A(h) ? void 0 : h.map((m) => v(m, !1, !1, O)) : v(h, !1, !1, O);
    },
    pushAsync(h, O) {
      return Array.isArray(h) ? A(h) ? void 0 : h.map((m) => v(m, !1, !0, O)) : v(h, !1, !0, O);
    },
    kill() {
      d(), c._tasks.empty();
    },
    unshift(h, O) {
      return Array.isArray(h) ? A(h) ? void 0 : h.map((m) => v(m, !0, !1, O)) : v(h, !0, !1, O);
    },
    unshiftAsync(h, O) {
      return Array.isArray(h) ? A(h) ? void 0 : h.map((m) => v(m, !0, !0, O)) : v(h, !0, !0, O);
    },
    remove(h) {
      c._tasks.remove(h);
    },
    process() {
      if (!L) {
        for (L = !0; !c.paused && i < c.concurrency && c._tasks.length; ) {
          var h = [], O = [], m = c._tasks.length;
          c.payload && (m = Math.min(m, c.payload));
          for (var x = 0; x < m; x++) {
            var P = c._tasks.shift();
            h.push(P), a.push(P), O.push(P.data);
          }
          i += 1, c._tasks.length === 0 && g("empty"), i === c.concurrency && g("saturated");
          var C = mt(R(h));
          n(O, C);
        }
        L = !1;
      }
    },
    length() {
      return c._tasks.length;
    },
    running() {
      return i;
    },
    workersList() {
      return a;
    },
    idle() {
      return c._tasks.length + i === 0;
    },
    pause() {
      c.paused = !0;
    },
    resume() {
      c.paused !== !1 && (c.paused = !1, lt(c.process));
    }
  };
  return Object.defineProperties(c, {
    saturated: {
      writable: !1,
      value: E("saturated")
    },
    unsaturated: {
      writable: !1,
      value: E("unsaturated")
    },
    empty: {
      writable: !1,
      value: E("empty")
    },
    drain: {
      writable: !1,
      value: E("drain")
    },
    error: {
      writable: !1,
      value: E("error")
    }
  }), c;
}
function ff(e, t) {
  return ya(e, 1, t);
}
function uf(e, t, r) {
  return ya(e, t, r);
}
function sh(e, t, r, n) {
  n = yt(n);
  var i = J(r);
  return Fe(e, (a, s, f) => {
    i(t, a, (u, d) => {
      t = d, f(u);
    });
  }, (a) => n(a, t));
}
var ct = X(sh, 4);
function ma(...e) {
  var t = e.map(J);
  return function(...r) {
    var n = this, i = r[r.length - 1];
    return typeof i == "function" ? r.pop() : i = zt(), ct(
      t,
      r,
      (a, s, f) => {
        s.apply(n, a.concat((u, ...d) => {
          f(u, d);
        }));
      },
      (a, s) => i(a, ...s)
    ), i[Qt];
  };
}
function lf(...e) {
  return ma(...e.reverse());
}
function oh(e, t, r, n) {
  return pa(ke(t), e, r, n);
}
var xr = X(oh, 4);
function fh(e, t, r, n) {
  var i = J(r);
  return xr(e, t, (a, s) => {
    i(a, (f, ...u) => f ? s(f) : s(f, u));
  }, (a, s) => {
    for (var f = [], u = 0; u < s.length; u++)
      s[u] && (f = f.concat(...s[u]));
    return n(a, f);
  });
}
var Wt = X(fh, 4);
function uh(e, t, r) {
  return Wt(e, 1 / 0, t, r);
}
var Hr = X(uh, 3);
function lh(e, t, r) {
  return Wt(e, 1, t, r);
}
var Vr = X(lh, 3);
function cf(...e) {
  return function(...t) {
    var r = t.pop();
    return r(null, ...e);
  };
}
function et(e, t) {
  return (r, n, i, a) => {
    var s = !1, f;
    const u = J(i);
    r(n, (d, g, p) => {
      u(d, (v, R) => {
        if (v || v === !1) return p(v);
        if (e(R) && !f)
          return s = !0, f = t(!0, d), p(null, yn);
        p();
      });
    }, (d) => {
      if (d) return a(d);
      a(null, s ? f : t(!1));
    });
  };
}
function ch(e, t, r) {
  return et((n) => n, (n, i) => i)(De, e, t, r);
}
var Zr = X(ch, 3);
function hh(e, t, r, n) {
  return et((i) => i, (i, a) => a)(ke(t), e, r, n);
}
var Yr = X(hh, 4);
function dh(e, t, r) {
  return et((n) => n, (n, i) => i)(ke(1), e, t, r);
}
var Qr = X(dh, 3);
function hf(e) {
  return (t, ...r) => J(t)(...r, (n, ...i) => {
    typeof console == "object" && (n ? console.error && console.error(n) : console[e] && i.forEach((a) => console[e](a)));
  });
}
var df = hf("dir");
function ph(e, t, r) {
  r = mt(r);
  var n = J(e), i = J(t), a;
  function s(u, ...d) {
    if (u) return r(u);
    u !== !1 && (a = d, i(...d, f));
  }
  function f(u, d) {
    if (u) return r(u);
    if (u !== !1) {
      if (!d) return r(null, ...a);
      n(s);
    }
  }
  return f(null, !0);
}
var cr = X(ph, 3);
function pf(e, t, r) {
  const n = J(t);
  return cr(e, (...i) => {
    const a = i.pop();
    n(...i, (s, f) => a(s, !f));
  }, r);
}
function gf(e) {
  return (t, r, n) => e(t, n);
}
function gh(e, t, r) {
  return De(e, gf(J(t)), r);
}
var Kr = X(gh, 3);
function vh(e, t, r, n) {
  return ke(t)(e, gf(J(r)), n);
}
var hr = X(vh, 4);
function yh(e, t, r) {
  return hr(e, 1, t, r);
}
var dr = X(yh, 3);
function _a(e) {
  return Er(e) ? e : function(...t) {
    var r = t.pop(), n = !0;
    t.push((...i) => {
      n ? lt(() => r(...i)) : r(...i);
    }), e.apply(this, t), n = !1;
  };
}
function mh(e, t, r) {
  return et((n) => !n, (n) => !n)(De, e, t, r);
}
var Xr = X(mh, 3);
function _h(e, t, r, n) {
  return et((i) => !i, (i) => !i)(ke(t), e, r, n);
}
var Jr = X(_h, 4);
function bh(e, t, r) {
  return et((n) => !n, (n) => !n)(Fe, e, t, r);
}
var en = X(bh, 3);
function wh(e, t, r, n) {
  var i = new Array(t.length);
  e(t, (a, s, f) => {
    r(a, (u, d) => {
      i[s] = !!d, f(u);
    });
  }, (a) => {
    if (a) return n(a);
    for (var s = [], f = 0; f < t.length; f++)
      i[f] && s.push(t[f]);
    n(null, s);
  });
}
function Sh(e, t, r, n) {
  var i = [];
  e(t, (a, s, f) => {
    r(a, (u, d) => {
      if (u) return f(u);
      d && i.push({ index: s, value: a }), f(u);
    });
  }, (a) => {
    if (a) return n(a);
    n(null, i.sort((s, f) => s.index - f.index).map((s) => s.value));
  });
}
function _n(e, t, r, n) {
  var i = vn(t) ? wh : Sh;
  return i(e, t, J(r), n);
}
function Eh(e, t, r) {
  return _n(De, e, t, r);
}
var tn = X(Eh, 3);
function xh(e, t, r, n) {
  return _n(ke(t), e, r, n);
}
var rn = X(xh, 4);
function Oh(e, t, r) {
  return _n(Fe, e, t, r);
}
var nn = X(Oh, 3);
function Rh(e, t) {
  var r = mt(t), n = J(_a(e));
  function i(a) {
    if (a) return r(a);
    a !== !1 && n(i);
  }
  return i();
}
var vf = X(Rh, 2);
function Th(e, t, r, n) {
  var i = J(r);
  return xr(e, t, (a, s) => {
    i(a, (f, u) => f ? s(f) : s(f, { key: u, val: a }));
  }, (a, s) => {
    for (var f = {}, { hasOwnProperty: u } = Object.prototype, d = 0; d < s.length; d++)
      if (s[d]) {
        var { key: g } = s[d], { val: p } = s[d];
        u.call(f, g) ? f[g].push(p) : f[g] = [p];
      }
    return n(a, f);
  });
}
var bn = X(Th, 4);
function yf(e, t, r) {
  return bn(e, 1 / 0, t, r);
}
function mf(e, t, r) {
  return bn(e, 1, t, r);
}
var _f = hf("log");
function Ah(e, t, r, n) {
  n = yt(n);
  var i = {}, a = J(r);
  return ke(t)(e, (s, f, u) => {
    a(s, f, (d, g) => {
      if (d) return u(d);
      i[f] = g, u(d);
    });
  }, (s) => n(s, i));
}
var wn = X(Ah, 4);
function bf(e, t, r) {
  return wn(e, 1 / 0, t, r);
}
function wf(e, t, r) {
  return wn(e, 1, t, r);
}
function Sf(e, t = (r) => r) {
  var r = /* @__PURE__ */ Object.create(null), n = /* @__PURE__ */ Object.create(null), i = J(e), a = Sr((s, f) => {
    var u = t(...s);
    u in r ? lt(() => f(null, ...r[u])) : u in n ? n[u].push(f) : (n[u] = [f], i(...s, (d, ...g) => {
      d || (r[u] = g);
      var p = n[u];
      delete n[u];
      for (var v = 0, R = p.length; v < R; v++)
        p[v](d, ...g);
    }));
  });
  return a.memo = r, a.unmemoized = e, a;
}
var Ur;
ef ? Ur = process.nextTick : Jo ? Ur = setImmediate : Ur = tf;
var Ef = rf(Ur), ba = X((e, t, r) => {
  var n = vn(t) ? [] : {};
  e(t, (i, a, s) => {
    J(i)((f, ...u) => {
      u.length < 2 && ([u] = u), n[a] = u, s(f);
    });
  }, (i) => r(i, n));
}, 3);
function xf(e, t) {
  return ba(De, e, t);
}
function Of(e, t, r) {
  return ba(ke(t), e, r);
}
function wa(e, t) {
  var r = J(e);
  return ya((n, i) => {
    r(n[0], i);
  }, t, 1);
}
class Lh {
  constructor() {
    this.heap = [], this.pushCount = Number.MIN_SAFE_INTEGER;
  }
  get length() {
    return this.heap.length;
  }
  empty() {
    return this.heap = [], this;
  }
  percUp(t) {
    let r;
    for (; t > 0 && Vn(this.heap[t], this.heap[r = ds(t)]); ) {
      let n = this.heap[t];
      this.heap[t] = this.heap[r], this.heap[r] = n, t = r;
    }
  }
  percDown(t) {
    let r;
    for (; (r = $h(t)) < this.heap.length && (r + 1 < this.heap.length && Vn(this.heap[r + 1], this.heap[r]) && (r = r + 1), !Vn(this.heap[t], this.heap[r])); ) {
      let n = this.heap[t];
      this.heap[t] = this.heap[r], this.heap[r] = n, t = r;
    }
  }
  push(t) {
    t.pushCount = ++this.pushCount, this.heap.push(t), this.percUp(this.heap.length - 1);
  }
  unshift(t) {
    return this.heap.push(t);
  }
  shift() {
    let [t] = this.heap;
    return this.heap[0] = this.heap[this.heap.length - 1], this.heap.pop(), this.percDown(0), t;
  }
  toArray() {
    return [...this];
  }
  *[Symbol.iterator]() {
    for (let t = 0; t < this.heap.length; t++)
      yield this.heap[t].data;
  }
  remove(t) {
    let r = 0;
    for (let n = 0; n < this.heap.length; n++)
      t(this.heap[n]) || (this.heap[r] = this.heap[n], r++);
    this.heap.splice(r);
    for (let n = ds(this.heap.length - 1); n >= 0; n--)
      this.percDown(n);
    return this;
  }
}
function $h(e) {
  return (e << 1) + 1;
}
function ds(e) {
  return (e + 1 >> 1) - 1;
}
function Vn(e, t) {
  return e.priority !== t.priority ? e.priority < t.priority : e.pushCount < t.pushCount;
}
function Rf(e, t) {
  var r = wa(e, t), {
    push: n,
    pushAsync: i
  } = r;
  r._tasks = new Lh(), r._createTaskItem = ({ data: s, priority: f }, u) => ({
    data: s,
    priority: f,
    callback: u
  });
  function a(s, f) {
    return Array.isArray(s) ? s.map((u) => ({ data: u, priority: f })) : { data: s, priority: f };
  }
  return r.push = function(s, f = 0, u) {
    return n(a(s, f), u);
  }, r.pushAsync = function(s, f = 0, u) {
    return i(a(s, f), u);
  }, delete r.unshift, delete r.unshiftAsync, r;
}
function Mh(e, t) {
  if (t = yt(t), !Array.isArray(e)) return t(new TypeError("First argument to race must be an array of functions"));
  if (!e.length) return t();
  for (var r = 0, n = e.length; r < n; r++)
    J(e[r])(t);
}
var Tf = X(Mh, 2);
function an(e, t, r, n) {
  var i = [...e].reverse();
  return ct(i, t, r, n);
}
function sn(e) {
  var t = J(e);
  return Sr(function(n, i) {
    return n.push((a, ...s) => {
      let f = {};
      if (a && (f.error = a), s.length > 0) {
        var u = s;
        s.length <= 1 && ([u] = s), f.value = u;
      }
      i(null, f);
    }), t.apply(this, n);
  });
}
function Af(e) {
  var t;
  return Array.isArray(e) ? t = e.map(sn) : (t = {}, Object.keys(e).forEach((r) => {
    t[r] = sn.call(this, e[r]);
  })), t;
}
function Sa(e, t, r, n) {
  const i = J(r);
  return _n(e, t, (a, s) => {
    i(a, (f, u) => {
      s(f, !u);
    });
  }, n);
}
function Dh(e, t, r) {
  return Sa(De, e, t, r);
}
var Lf = X(Dh, 3);
function Ph(e, t, r, n) {
  return Sa(ke(t), e, r, n);
}
var $f = X(Ph, 4);
function Ih(e, t, r) {
  return Sa(Fe, e, t, r);
}
var Mf = X(Ih, 3);
function Df(e) {
  return function() {
    return e;
  };
}
const Wi = 5, Pf = 0;
function on(e, t, r) {
  var n = {
    times: Wi,
    intervalFunc: Df(Pf)
  };
  if (arguments.length < 3 && typeof e == "function" ? (r = t || zt(), t = e) : (Ch(n, e), r = r || zt()), typeof t != "function")
    throw new Error("Invalid arguments for async.retry");
  var i = J(t), a = 1;
  function s() {
    i((f, ...u) => {
      f !== !1 && (f && a++ < n.times && (typeof n.errorFilter != "function" || n.errorFilter(f)) ? setTimeout(s, n.intervalFunc(a - 1)) : r(f, ...u));
    });
  }
  return s(), r[Qt];
}
function Ch(e, t) {
  if (typeof t == "object")
    e.times = +t.times || Wi, e.intervalFunc = typeof t.interval == "function" ? t.interval : Df(+t.interval || Pf), e.errorFilter = t.errorFilter;
  else if (typeof t == "number" || typeof t == "string")
    e.times = +t || Wi;
  else
    throw new Error("Invalid arguments for async.retry");
}
function If(e, t) {
  t || (t = e, e = null);
  let r = e && e.arity || t.length;
  Er(t) && (r += 1);
  var n = J(t);
  return Sr((i, a) => {
    (i.length < r - 1 || a == null) && (i.push(a), a = zt());
    function s(f) {
      n(...i, f);
    }
    return e ? on(e, s, a) : on(s, a), a[Qt];
  });
}
function Cf(e, t) {
  return ba(Fe, e, t);
}
function Nh(e, t, r) {
  return et(Boolean, (n) => n)(De, e, t, r);
}
var fn = X(Nh, 3);
function jh(e, t, r, n) {
  return et(Boolean, (i) => i)(ke(t), e, r, n);
}
var un = X(jh, 4);
function Bh(e, t, r) {
  return et(Boolean, (n) => n)(Fe, e, t, r);
}
var ln = X(Bh, 3);
function Fh(e, t, r) {
  var n = J(t);
  return mn(e, (a, s) => {
    n(a, (f, u) => {
      if (f) return s(f);
      s(f, { value: a, criteria: u });
    });
  }, (a, s) => {
    if (a) return r(a);
    r(null, s.sort(i).map((f) => f.value));
  });
  function i(a, s) {
    var f = a.criteria, u = s.criteria;
    return f < u ? -1 : f > u ? 1 : 0;
  }
}
var Nf = X(Fh, 3);
function jf(e, t, r) {
  var n = J(e);
  return Sr((i, a) => {
    var s = !1, f;
    function u() {
      var d = e.name || "anonymous", g = new Error('Callback function "' + d + '" timed out.');
      g.code = "ETIMEDOUT", r && (g.info = r), s = !0, a(g);
    }
    i.push((...d) => {
      s || (a(...d), clearTimeout(f));
    }), f = setTimeout(u, t), n(...i);
  });
}
function kh(e) {
  for (var t = Array(e); e--; )
    t[e] = e;
  return t;
}
function Sn(e, t, r, n) {
  var i = J(r);
  return xr(kh(e), t, i, n);
}
function Bf(e, t, r) {
  return Sn(e, 1 / 0, t, r);
}
function Ff(e, t, r) {
  return Sn(e, 1, t, r);
}
function kf(e, t, r, n) {
  arguments.length <= 3 && typeof t == "function" && (n = r, r = t, t = Array.isArray(e) ? [] : {}), n = yt(n || zt());
  var i = J(r);
  return De(e, (a, s, f) => {
    i(t, a, s, f);
  }, (a) => n(a, t)), n[Qt];
}
function Uh(e, t) {
  var r = null, n;
  return dr(e, (i, a) => {
    J(i)((s, ...f) => {
      if (s === !1) return a(s);
      f.length < 2 ? [n] = f : n = f, r = s, a(s ? null : {});
    });
  }, () => t(r, n));
}
var Uf = X(Uh);
function qf(e) {
  return (...t) => (e.unmemoized || e)(...t);
}
function qh(e, t, r) {
  r = mt(r);
  var n = J(t), i = J(e), a = [];
  function s(u, ...d) {
    if (u) return r(u);
    a = d, u !== !1 && i(f);
  }
  function f(u, d) {
    if (u) return r(u);
    if (u !== !1) {
      if (!d) return r(null, ...a);
      n(s);
    }
  }
  return i(f);
}
var pr = X(qh, 3);
function zf(e, t, r) {
  const n = J(e);
  return pr((i) => n((a, s) => i(a, !s)), t, r);
}
function zh(e, t) {
  if (t = yt(t), !Array.isArray(e)) return t(new Error("First argument to waterfall must be an array of functions"));
  if (!e.length) return t();
  var r = 0;
  function n(a) {
    var s = J(e[r++]);
    s(...a, mt(i));
  }
  function i(a, ...s) {
    if (a !== !1) {
      if (a || r === e.length)
        return t(a, ...s);
      n(s);
    }
  }
  n([]);
}
var Wf = X(zh), Wh = {
  apply: Xo,
  applyEach: af,
  applyEachSeries: sf,
  asyncify: lr,
  auto: va,
  autoInject: of,
  cargo: ff,
  cargoQueue: uf,
  compose: lf,
  concat: Hr,
  concatLimit: Wt,
  concatSeries: Vr,
  constant: cf,
  detect: Zr,
  detectLimit: Yr,
  detectSeries: Qr,
  dir: df,
  doUntil: pf,
  doWhilst: cr,
  each: Kr,
  eachLimit: hr,
  eachOf: De,
  eachOfLimit: qt,
  eachOfSeries: Fe,
  eachSeries: dr,
  ensureAsync: _a,
  every: Xr,
  everyLimit: Jr,
  everySeries: en,
  filter: tn,
  filterLimit: rn,
  filterSeries: nn,
  forever: vf,
  groupBy: yf,
  groupByLimit: bn,
  groupBySeries: mf,
  log: _f,
  map: mn,
  mapLimit: xr,
  mapSeries: ga,
  mapValues: bf,
  mapValuesLimit: wn,
  mapValuesSeries: wf,
  memoize: Sf,
  nextTick: Ef,
  parallel: xf,
  parallelLimit: Of,
  priorityQueue: Rf,
  queue: wa,
  race: Tf,
  reduce: ct,
  reduceRight: an,
  reflect: sn,
  reflectAll: Af,
  reject: Lf,
  rejectLimit: $f,
  rejectSeries: Mf,
  retry: on,
  retryable: If,
  seq: ma,
  series: Cf,
  setImmediate: lt,
  some: fn,
  someLimit: un,
  someSeries: ln,
  sortBy: Nf,
  timeout: jf,
  times: Bf,
  timesLimit: Sn,
  timesSeries: Ff,
  transform: kf,
  tryEach: Uf,
  unmemoize: qf,
  until: zf,
  waterfall: Wf,
  whilst: pr,
  // aliases
  all: Xr,
  allLimit: Jr,
  allSeries: en,
  any: fn,
  anyLimit: un,
  anySeries: ln,
  find: Zr,
  findLimit: Yr,
  findSeries: Qr,
  flatMap: Hr,
  flatMapLimit: Wt,
  flatMapSeries: Vr,
  forEach: Kr,
  forEachSeries: dr,
  forEachLimit: hr,
  forEachOf: De,
  forEachOfSeries: Fe,
  forEachOfLimit: qt,
  inject: ct,
  foldl: ct,
  foldr: an,
  select: tn,
  selectLimit: rn,
  selectSeries: nn,
  wrapSync: lr,
  during: pr,
  doDuring: cr
};
const Gh = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  all: Xr,
  allLimit: Jr,
  allSeries: en,
  any: fn,
  anyLimit: un,
  anySeries: ln,
  apply: Xo,
  applyEach: af,
  applyEachSeries: sf,
  asyncify: lr,
  auto: va,
  autoInject: of,
  cargo: ff,
  cargoQueue: uf,
  compose: lf,
  concat: Hr,
  concatLimit: Wt,
  concatSeries: Vr,
  constant: cf,
  default: Wh,
  detect: Zr,
  detectLimit: Yr,
  detectSeries: Qr,
  dir: df,
  doDuring: cr,
  doUntil: pf,
  doWhilst: cr,
  during: pr,
  each: Kr,
  eachLimit: hr,
  eachOf: De,
  eachOfLimit: qt,
  eachOfSeries: Fe,
  eachSeries: dr,
  ensureAsync: _a,
  every: Xr,
  everyLimit: Jr,
  everySeries: en,
  filter: tn,
  filterLimit: rn,
  filterSeries: nn,
  find: Zr,
  findLimit: Yr,
  findSeries: Qr,
  flatMap: Hr,
  flatMapLimit: Wt,
  flatMapSeries: Vr,
  foldl: ct,
  foldr: an,
  forEach: Kr,
  forEachLimit: hr,
  forEachOf: De,
  forEachOfLimit: qt,
  forEachOfSeries: Fe,
  forEachSeries: dr,
  forever: vf,
  groupBy: yf,
  groupByLimit: bn,
  groupBySeries: mf,
  inject: ct,
  log: _f,
  map: mn,
  mapLimit: xr,
  mapSeries: ga,
  mapValues: bf,
  mapValuesLimit: wn,
  mapValuesSeries: wf,
  memoize: Sf,
  nextTick: Ef,
  parallel: xf,
  parallelLimit: Of,
  priorityQueue: Rf,
  queue: wa,
  race: Tf,
  reduce: ct,
  reduceRight: an,
  reflect: sn,
  reflectAll: Af,
  reject: Lf,
  rejectLimit: $f,
  rejectSeries: Mf,
  retry: on,
  retryable: If,
  select: tn,
  selectLimit: rn,
  selectSeries: nn,
  seq: ma,
  series: Cf,
  setImmediate: lt,
  some: fn,
  someLimit: un,
  someSeries: ln,
  sortBy: Nf,
  timeout: jf,
  times: Bf,
  timesLimit: Sn,
  timesSeries: Ff,
  transform: kf,
  tryEach: Uf,
  unmemoize: qf,
  until: zf,
  waterfall: Wf,
  whilst: pr,
  wrapSync: lr
}, Symbol.toStringTag, { value: "Module" })), Hh = /* @__PURE__ */ hc(Gh);
var Gf = { exports: {} }, nt = Io, Vh = process.cwd, qr = null, Zh = process.env.GRACEFUL_FS_PLATFORM || process.platform;
process.cwd = function() {
  return qr || (qr = Vh.call(process)), qr;
};
try {
  process.cwd();
} catch {
}
if (typeof process.chdir == "function") {
  var ps = process.chdir;
  process.chdir = function(e) {
    qr = null, ps.call(process, e);
  }, Object.setPrototypeOf && Object.setPrototypeOf(process.chdir, ps);
}
var Yh = Qh;
function Qh(e) {
  nt.hasOwnProperty("O_SYMLINK") && process.version.match(/^v0\.6\.[0-2]|^v0\.5\./) && t(e), e.lutimes || r(e), e.chown = a(e.chown), e.fchown = a(e.fchown), e.lchown = a(e.lchown), e.chmod = n(e.chmod), e.fchmod = n(e.fchmod), e.lchmod = n(e.lchmod), e.chownSync = s(e.chownSync), e.fchownSync = s(e.fchownSync), e.lchownSync = s(e.lchownSync), e.chmodSync = i(e.chmodSync), e.fchmodSync = i(e.fchmodSync), e.lchmodSync = i(e.lchmodSync), e.stat = f(e.stat), e.fstat = f(e.fstat), e.lstat = f(e.lstat), e.statSync = u(e.statSync), e.fstatSync = u(e.fstatSync), e.lstatSync = u(e.lstatSync), e.chmod && !e.lchmod && (e.lchmod = function(g, p, v) {
    v && process.nextTick(v);
  }, e.lchmodSync = function() {
  }), e.chown && !e.lchown && (e.lchown = function(g, p, v, R) {
    R && process.nextTick(R);
  }, e.lchownSync = function() {
  }), Zh === "win32" && (e.rename = typeof e.rename != "function" ? e.rename : function(g) {
    function p(v, R, A) {
      var E = Date.now(), L = 0;
      g(v, R, function c(h) {
        if (h && (h.code === "EACCES" || h.code === "EPERM" || h.code === "EBUSY") && Date.now() - E < 6e4) {
          setTimeout(function() {
            e.stat(R, function(O, m) {
              O && O.code === "ENOENT" ? g(v, R, c) : A(h);
            });
          }, L), L < 100 && (L += 10);
          return;
        }
        A && A(h);
      });
    }
    return Object.setPrototypeOf && Object.setPrototypeOf(p, g), p;
  }(e.rename)), e.read = typeof e.read != "function" ? e.read : function(g) {
    function p(v, R, A, E, L, c) {
      var h;
      if (c && typeof c == "function") {
        var O = 0;
        h = function(m, x, P) {
          if (m && m.code === "EAGAIN" && O < 10)
            return O++, g.call(e, v, R, A, E, L, h);
          c.apply(this, arguments);
        };
      }
      return g.call(e, v, R, A, E, L, h);
    }
    return Object.setPrototypeOf && Object.setPrototypeOf(p, g), p;
  }(e.read), e.readSync = typeof e.readSync != "function" ? e.readSync : /* @__PURE__ */ function(g) {
    return function(p, v, R, A, E) {
      for (var L = 0; ; )
        try {
          return g.call(e, p, v, R, A, E);
        } catch (c) {
          if (c.code === "EAGAIN" && L < 10) {
            L++;
            continue;
          }
          throw c;
        }
    };
  }(e.readSync);
  function t(g) {
    g.lchmod = function(p, v, R) {
      g.open(
        p,
        nt.O_WRONLY | nt.O_SYMLINK,
        v,
        function(A, E) {
          if (A) {
            R && R(A);
            return;
          }
          g.fchmod(E, v, function(L) {
            g.close(E, function(c) {
              R && R(L || c);
            });
          });
        }
      );
    }, g.lchmodSync = function(p, v) {
      var R = g.openSync(p, nt.O_WRONLY | nt.O_SYMLINK, v), A = !0, E;
      try {
        E = g.fchmodSync(R, v), A = !1;
      } finally {
        if (A)
          try {
            g.closeSync(R);
          } catch {
          }
        else
          g.closeSync(R);
      }
      return E;
    };
  }
  function r(g) {
    nt.hasOwnProperty("O_SYMLINK") && g.futimes ? (g.lutimes = function(p, v, R, A) {
      g.open(p, nt.O_SYMLINK, function(E, L) {
        if (E) {
          A && A(E);
          return;
        }
        g.futimes(L, v, R, function(c) {
          g.close(L, function(h) {
            A && A(c || h);
          });
        });
      });
    }, g.lutimesSync = function(p, v, R) {
      var A = g.openSync(p, nt.O_SYMLINK), E, L = !0;
      try {
        E = g.futimesSync(A, v, R), L = !1;
      } finally {
        if (L)
          try {
            g.closeSync(A);
          } catch {
          }
        else
          g.closeSync(A);
      }
      return E;
    }) : g.futimes && (g.lutimes = function(p, v, R, A) {
      A && process.nextTick(A);
    }, g.lutimesSync = function() {
    });
  }
  function n(g) {
    return g && function(p, v, R) {
      return g.call(e, p, v, function(A) {
        d(A) && (A = null), R && R.apply(this, arguments);
      });
    };
  }
  function i(g) {
    return g && function(p, v) {
      try {
        return g.call(e, p, v);
      } catch (R) {
        if (!d(R)) throw R;
      }
    };
  }
  function a(g) {
    return g && function(p, v, R, A) {
      return g.call(e, p, v, R, function(E) {
        d(E) && (E = null), A && A.apply(this, arguments);
      });
    };
  }
  function s(g) {
    return g && function(p, v, R) {
      try {
        return g.call(e, p, v, R);
      } catch (A) {
        if (!d(A)) throw A;
      }
    };
  }
  function f(g) {
    return g && function(p, v, R) {
      typeof v == "function" && (R = v, v = null);
      function A(E, L) {
        L && (L.uid < 0 && (L.uid += 4294967296), L.gid < 0 && (L.gid += 4294967296)), R && R.apply(this, arguments);
      }
      return v ? g.call(e, p, v, A) : g.call(e, p, A);
    };
  }
  function u(g) {
    return g && function(p, v) {
      var R = v ? g.call(e, p, v) : g.call(e, p);
      return R && (R.uid < 0 && (R.uid += 4294967296), R.gid < 0 && (R.gid += 4294967296)), R;
    };
  }
  function d(g) {
    if (!g || g.code === "ENOSYS")
      return !0;
    var p = !process.getuid || process.getuid() !== 0;
    return !!(p && (g.code === "EINVAL" || g.code === "EPERM"));
  }
}
var gs = Ze.Stream, Kh = Xh;
function Xh(e) {
  return {
    ReadStream: t,
    WriteStream: r
  };
  function t(n, i) {
    if (!(this instanceof t)) return new t(n, i);
    gs.call(this);
    var a = this;
    this.path = n, this.fd = null, this.readable = !0, this.paused = !1, this.flags = "r", this.mode = 438, this.bufferSize = 64 * 1024, i = i || {};
    for (var s = Object.keys(i), f = 0, u = s.length; f < u; f++) {
      var d = s[f];
      this[d] = i[d];
    }
    if (this.encoding && this.setEncoding(this.encoding), this.start !== void 0) {
      if (typeof this.start != "number")
        throw TypeError("start must be a Number");
      if (this.end === void 0)
        this.end = 1 / 0;
      else if (typeof this.end != "number")
        throw TypeError("end must be a Number");
      if (this.start > this.end)
        throw new Error("start must be <= end");
      this.pos = this.start;
    }
    if (this.fd !== null) {
      process.nextTick(function() {
        a._read();
      });
      return;
    }
    e.open(this.path, this.flags, this.mode, function(g, p) {
      if (g) {
        a.emit("error", g), a.readable = !1;
        return;
      }
      a.fd = p, a.emit("open", p), a._read();
    });
  }
  function r(n, i) {
    if (!(this instanceof r)) return new r(n, i);
    gs.call(this), this.path = n, this.fd = null, this.writable = !0, this.flags = "w", this.encoding = "binary", this.mode = 438, this.bytesWritten = 0, i = i || {};
    for (var a = Object.keys(i), s = 0, f = a.length; s < f; s++) {
      var u = a[s];
      this[u] = i[u];
    }
    if (this.start !== void 0) {
      if (typeof this.start != "number")
        throw TypeError("start must be a Number");
      if (this.start < 0)
        throw new Error("start must be >= zero");
      this.pos = this.start;
    }
    this.busy = !1, this._queue = [], this.fd === null && (this._open = e.open, this._queue.push([this._open, this.path, this.flags, this.mode, void 0]), this.flush());
  }
}
var Jh = td, ed = Object.getPrototypeOf || function(e) {
  return e.__proto__;
};
function td(e) {
  if (e === null || typeof e != "object")
    return e;
  if (e instanceof Object)
    var t = { __proto__: ed(e) };
  else
    var t = /* @__PURE__ */ Object.create(null);
  return Object.getOwnPropertyNames(e).forEach(function(r) {
    Object.defineProperty(t, r, Object.getOwnPropertyDescriptor(e, r));
  }), t;
}
var ce = Lt, rd = Yh, nd = Kh, id = Jh, $r = Ee, be, cn;
typeof Symbol == "function" && typeof Symbol.for == "function" ? (be = Symbol.for("graceful-fs.queue"), cn = Symbol.for("graceful-fs.previous")) : (be = "___graceful-fs.queue", cn = "___graceful-fs.previous");
function ad() {
}
function Hf(e, t) {
  Object.defineProperty(e, be, {
    get: function() {
      return t;
    }
  });
}
var wt = ad;
$r.debuglog ? wt = $r.debuglog("gfs4") : /\bgfs4\b/i.test(process.env.NODE_DEBUG || "") && (wt = function() {
  var e = $r.format.apply($r, arguments);
  e = "GFS4: " + e.split(/\n/).join(`
GFS4: `), console.error(e);
});
if (!ce[be]) {
  var sd = oe[be] || [];
  Hf(ce, sd), ce.close = function(e) {
    function t(r, n) {
      return e.call(ce, r, function(i) {
        i || vs(), typeof n == "function" && n.apply(this, arguments);
      });
    }
    return Object.defineProperty(t, cn, {
      value: e
    }), t;
  }(ce.close), ce.closeSync = function(e) {
    function t(r) {
      e.apply(ce, arguments), vs();
    }
    return Object.defineProperty(t, cn, {
      value: e
    }), t;
  }(ce.closeSync), /\bgfs4\b/i.test(process.env.NODE_DEBUG || "") && process.on("exit", function() {
    wt(ce[be]), ha.equal(ce[be].length, 0);
  });
}
oe[be] || Hf(oe, ce[be]);
var Or = Ea(id(ce));
process.env.TEST_GRACEFUL_FS_GLOBAL_PATCH && !ce.__patched && (Or = Ea(ce), ce.__patched = !0);
function Ea(e) {
  rd(e), e.gracefulify = Ea, e.createReadStream = x, e.createWriteStream = P;
  var t = e.readFile;
  e.readFile = r;
  function r(M, N, B) {
    return typeof N == "function" && (B = N, N = null), U(M, N, B);
    function U(q, H, V, Y) {
      return t(q, H, function(b) {
        b && (b.code === "EMFILE" || b.code === "ENFILE") ? It([U, [q, H, V], b, Y || Date.now(), Date.now()]) : typeof V == "function" && V.apply(this, arguments);
      });
    }
  }
  var n = e.writeFile;
  e.writeFile = i;
  function i(M, N, B, U) {
    return typeof B == "function" && (U = B, B = null), q(M, N, B, U);
    function q(H, V, Y, b, S) {
      return n(H, V, Y, function(D) {
        D && (D.code === "EMFILE" || D.code === "ENFILE") ? It([q, [H, V, Y, b], D, S || Date.now(), Date.now()]) : typeof b == "function" && b.apply(this, arguments);
      });
    }
  }
  var a = e.appendFile;
  a && (e.appendFile = s);
  function s(M, N, B, U) {
    return typeof B == "function" && (U = B, B = null), q(M, N, B, U);
    function q(H, V, Y, b, S) {
      return a(H, V, Y, function(D) {
        D && (D.code === "EMFILE" || D.code === "ENFILE") ? It([q, [H, V, Y, b], D, S || Date.now(), Date.now()]) : typeof b == "function" && b.apply(this, arguments);
      });
    }
  }
  var f = e.copyFile;
  f && (e.copyFile = u);
  function u(M, N, B, U) {
    return typeof B == "function" && (U = B, B = 0), q(M, N, B, U);
    function q(H, V, Y, b, S) {
      return f(H, V, Y, function(D) {
        D && (D.code === "EMFILE" || D.code === "ENFILE") ? It([q, [H, V, Y, b], D, S || Date.now(), Date.now()]) : typeof b == "function" && b.apply(this, arguments);
      });
    }
  }
  var d = e.readdir;
  e.readdir = p;
  var g = /^v[0-5]\./;
  function p(M, N, B) {
    typeof N == "function" && (B = N, N = null);
    var U = g.test(process.version) ? function(V, Y, b, S) {
      return d(V, q(
        V,
        Y,
        b,
        S
      ));
    } : function(V, Y, b, S) {
      return d(V, Y, q(
        V,
        Y,
        b,
        S
      ));
    };
    return U(M, N, B);
    function q(H, V, Y, b) {
      return function(S, D) {
        S && (S.code === "EMFILE" || S.code === "ENFILE") ? It([
          U,
          [H, V, Y],
          S,
          b || Date.now(),
          Date.now()
        ]) : (D && D.sort && D.sort(), typeof Y == "function" && Y.call(this, S, D));
      };
    }
  }
  if (process.version.substr(0, 4) === "v0.8") {
    var v = nd(e);
    c = v.ReadStream, O = v.WriteStream;
  }
  var R = e.ReadStream;
  R && (c.prototype = Object.create(R.prototype), c.prototype.open = h);
  var A = e.WriteStream;
  A && (O.prototype = Object.create(A.prototype), O.prototype.open = m), Object.defineProperty(e, "ReadStream", {
    get: function() {
      return c;
    },
    set: function(M) {
      c = M;
    },
    enumerable: !0,
    configurable: !0
  }), Object.defineProperty(e, "WriteStream", {
    get: function() {
      return O;
    },
    set: function(M) {
      O = M;
    },
    enumerable: !0,
    configurable: !0
  });
  var E = c;
  Object.defineProperty(e, "FileReadStream", {
    get: function() {
      return E;
    },
    set: function(M) {
      E = M;
    },
    enumerable: !0,
    configurable: !0
  });
  var L = O;
  Object.defineProperty(e, "FileWriteStream", {
    get: function() {
      return L;
    },
    set: function(M) {
      L = M;
    },
    enumerable: !0,
    configurable: !0
  });
  function c(M, N) {
    return this instanceof c ? (R.apply(this, arguments), this) : c.apply(Object.create(c.prototype), arguments);
  }
  function h() {
    var M = this;
    T(M.path, M.flags, M.mode, function(N, B) {
      N ? (M.autoClose && M.destroy(), M.emit("error", N)) : (M.fd = B, M.emit("open", B), M.read());
    });
  }
  function O(M, N) {
    return this instanceof O ? (A.apply(this, arguments), this) : O.apply(Object.create(O.prototype), arguments);
  }
  function m() {
    var M = this;
    T(M.path, M.flags, M.mode, function(N, B) {
      N ? (M.destroy(), M.emit("error", N)) : (M.fd = B, M.emit("open", B));
    });
  }
  function x(M, N) {
    return new e.ReadStream(M, N);
  }
  function P(M, N) {
    return new e.WriteStream(M, N);
  }
  var C = e.open;
  e.open = T;
  function T(M, N, B, U) {
    return typeof B == "function" && (U = B, B = null), q(M, N, B, U);
    function q(H, V, Y, b, S) {
      return C(H, V, Y, function(D, k) {
        D && (D.code === "EMFILE" || D.code === "ENFILE") ? It([q, [H, V, Y, b], D, S || Date.now(), Date.now()]) : typeof b == "function" && b.apply(this, arguments);
      });
    }
  }
  return e;
}
function It(e) {
  wt("ENQUEUE", e[0].name, e[1]), ce[be].push(e), xa();
}
var Mr;
function vs() {
  for (var e = Date.now(), t = 0; t < ce[be].length; ++t)
    ce[be][t].length > 2 && (ce[be][t][3] = e, ce[be][t][4] = e);
  xa();
}
function xa() {
  if (clearTimeout(Mr), Mr = void 0, ce[be].length !== 0) {
    var e = ce[be].shift(), t = e[0], r = e[1], n = e[2], i = e[3], a = e[4];
    if (i === void 0)
      wt("RETRY", t.name, r), t.apply(null, r);
    else if (Date.now() - i >= 6e4) {
      wt("TIMEOUT", t.name, r);
      var s = r.pop();
      typeof s == "function" && s.call(null, n);
    } else {
      var f = Date.now() - a, u = Math.max(a - i, 1), d = Math.min(u * 1.2, 100);
      f >= d ? (wt("RETRY", t.name, r), t.apply(null, r.concat([i]))) : ce[be].push(e);
    }
    Mr === void 0 && (Mr = setTimeout(xa, 0));
  }
}
var Gi = { exports: {} }, Dr = { exports: {} }, ys;
function _t() {
  if (ys) return Dr.exports;
  ys = 1, typeof process > "u" || !process.version || process.version.indexOf("v0.") === 0 || process.version.indexOf("v1.") === 0 && process.version.indexOf("v1.8.") !== 0 ? Dr.exports = { nextTick: e } : Dr.exports = process;
  function e(t, r, n, i) {
    if (typeof t != "function")
      throw new TypeError('"callback" argument must be a function');
    var a = arguments.length, s, f;
    switch (a) {
      case 0:
      case 1:
        return process.nextTick(t);
      case 2:
        return process.nextTick(function() {
          t.call(null, r);
        });
      case 3:
        return process.nextTick(function() {
          t.call(null, r, n);
        });
      case 4:
        return process.nextTick(function() {
          t.call(null, r, n, i);
        });
      default:
        for (s = new Array(a - 1), f = 0; f < s.length; )
          s[f++] = arguments[f];
        return process.nextTick(function() {
          t.apply(null, s);
        });
    }
  }
  return Dr.exports;
}
var Zn, ms;
function Vf() {
  if (ms) return Zn;
  ms = 1;
  var e = {}.toString;
  return Zn = Array.isArray || function(t) {
    return e.call(t) == "[object Array]";
  }, Zn;
}
var Yn, _s;
function Zf() {
  return _s || (_s = 1, Yn = Ze), Yn;
}
var Pr = { exports: {} }, bs;
function En() {
  return bs || (bs = 1, function(e, t) {
    var r = vt, n = r.Buffer;
    function i(s, f) {
      for (var u in s)
        f[u] = s[u];
    }
    n.from && n.alloc && n.allocUnsafe && n.allocUnsafeSlow ? e.exports = r : (i(r, t), t.Buffer = a);
    function a(s, f, u) {
      return n(s, f, u);
    }
    i(n, a), a.from = function(s, f, u) {
      if (typeof s == "number")
        throw new TypeError("Argument must not be a number");
      return n(s, f, u);
    }, a.alloc = function(s, f, u) {
      if (typeof s != "number")
        throw new TypeError("Argument must be a number");
      var d = n(s);
      return f !== void 0 ? typeof u == "string" ? d.fill(f, u) : d.fill(f) : d.fill(0), d;
    }, a.allocUnsafe = function(s) {
      if (typeof s != "number")
        throw new TypeError("Argument must be a number");
      return n(s);
    }, a.allocUnsafeSlow = function(s) {
      if (typeof s != "number")
        throw new TypeError("Argument must be a number");
      return r.SlowBuffer(s);
    };
  }(Pr, Pr.exports)), Pr.exports;
}
var _e = {}, ws;
function Ye() {
  if (ws) return _e;
  ws = 1;
  function e(E) {
    return Array.isArray ? Array.isArray(E) : A(E) === "[object Array]";
  }
  _e.isArray = e;
  function t(E) {
    return typeof E == "boolean";
  }
  _e.isBoolean = t;
  function r(E) {
    return E === null;
  }
  _e.isNull = r;
  function n(E) {
    return E == null;
  }
  _e.isNullOrUndefined = n;
  function i(E) {
    return typeof E == "number";
  }
  _e.isNumber = i;
  function a(E) {
    return typeof E == "string";
  }
  _e.isString = a;
  function s(E) {
    return typeof E == "symbol";
  }
  _e.isSymbol = s;
  function f(E) {
    return E === void 0;
  }
  _e.isUndefined = f;
  function u(E) {
    return A(E) === "[object RegExp]";
  }
  _e.isRegExp = u;
  function d(E) {
    return typeof E == "object" && E !== null;
  }
  _e.isObject = d;
  function g(E) {
    return A(E) === "[object Date]";
  }
  _e.isDate = g;
  function p(E) {
    return A(E) === "[object Error]" || E instanceof Error;
  }
  _e.isError = p;
  function v(E) {
    return typeof E == "function";
  }
  _e.isFunction = v;
  function R(E) {
    return E === null || typeof E == "boolean" || typeof E == "number" || typeof E == "string" || typeof E == "symbol" || // ES6 symbol
    typeof E > "u";
  }
  _e.isPrimitive = R, _e.isBuffer = Buffer.isBuffer;
  function A(E) {
    return Object.prototype.toString.call(E);
  }
  return _e;
}
var Hi = { exports: {} }, Ir = { exports: {} }, Ss;
function od() {
  return Ss || (Ss = 1, typeof Object.create == "function" ? Ir.exports = function(t, r) {
    r && (t.super_ = r, t.prototype = Object.create(r.prototype, {
      constructor: {
        value: t,
        enumerable: !1,
        writable: !0,
        configurable: !0
      }
    }));
  } : Ir.exports = function(t, r) {
    if (r) {
      t.super_ = r;
      var n = function() {
      };
      n.prototype = r.prototype, t.prototype = new n(), t.prototype.constructor = t;
    }
  }), Ir.exports;
}
try {
  var Es = require("util");
  if (typeof Es.inherits != "function") throw "";
  Hi.exports = Es.inherits;
} catch {
  Hi.exports = od();
}
var ye = Hi.exports, Qn = { exports: {} }, xs;
function fd() {
  return xs || (xs = 1, function(e) {
    function t(a, s) {
      if (!(a instanceof s))
        throw new TypeError("Cannot call a class as a function");
    }
    var r = En().Buffer, n = Ee;
    function i(a, s, f) {
      a.copy(s, f);
    }
    e.exports = function() {
      function a() {
        t(this, a), this.head = null, this.tail = null, this.length = 0;
      }
      return a.prototype.push = function(f) {
        var u = { data: f, next: null };
        this.length > 0 ? this.tail.next = u : this.head = u, this.tail = u, ++this.length;
      }, a.prototype.unshift = function(f) {
        var u = { data: f, next: this.head };
        this.length === 0 && (this.tail = u), this.head = u, ++this.length;
      }, a.prototype.shift = function() {
        if (this.length !== 0) {
          var f = this.head.data;
          return this.length === 1 ? this.head = this.tail = null : this.head = this.head.next, --this.length, f;
        }
      }, a.prototype.clear = function() {
        this.head = this.tail = null, this.length = 0;
      }, a.prototype.join = function(f) {
        if (this.length === 0) return "";
        for (var u = this.head, d = "" + u.data; u = u.next; )
          d += f + u.data;
        return d;
      }, a.prototype.concat = function(f) {
        if (this.length === 0) return r.alloc(0);
        for (var u = r.allocUnsafe(f >>> 0), d = this.head, g = 0; d; )
          i(d.data, u, g), g += d.data.length, d = d.next;
        return u;
      }, a;
    }(), n && n.inspect && n.inspect.custom && (e.exports.prototype[n.inspect.custom] = function() {
      var a = n.inspect({ length: this.length });
      return this.constructor.name + " " + a;
    });
  }(Qn)), Qn.exports;
}
var Kn, Os;
function Yf() {
  if (Os) return Kn;
  Os = 1;
  var e = _t();
  function t(i, a) {
    var s = this, f = this._readableState && this._readableState.destroyed, u = this._writableState && this._writableState.destroyed;
    return f || u ? (a ? a(i) : i && (this._writableState ? this._writableState.errorEmitted || (this._writableState.errorEmitted = !0, e.nextTick(n, this, i)) : e.nextTick(n, this, i)), this) : (this._readableState && (this._readableState.destroyed = !0), this._writableState && (this._writableState.destroyed = !0), this._destroy(i || null, function(d) {
      !a && d ? s._writableState ? s._writableState.errorEmitted || (s._writableState.errorEmitted = !0, e.nextTick(n, s, d)) : e.nextTick(n, s, d) : a && a(d);
    }), this);
  }
  function r() {
    this._readableState && (this._readableState.destroyed = !1, this._readableState.reading = !1, this._readableState.ended = !1, this._readableState.endEmitted = !1), this._writableState && (this._writableState.destroyed = !1, this._writableState.ended = !1, this._writableState.ending = !1, this._writableState.finalCalled = !1, this._writableState.prefinished = !1, this._writableState.finished = !1, this._writableState.errorEmitted = !1);
  }
  function n(i, a) {
    i.emit("error", a);
  }
  return Kn = {
    destroy: t,
    undestroy: r
  }, Kn;
}
var Xn, Rs;
function Oa() {
  return Rs || (Rs = 1, Xn = Ee.deprecate), Xn;
}
var Jn, Ts;
function Qf() {
  if (Ts) return Jn;
  Ts = 1;
  var e = _t();
  Jn = E;
  function t(b) {
    var S = this;
    this.next = null, this.entry = null, this.finish = function() {
      Y(S, b);
    };
  }
  var r = !process.browser && ["v0.10", "v0.9."].indexOf(process.version.slice(0, 5)) > -1 ? setImmediate : e.nextTick, n;
  E.WritableState = R;
  var i = Object.create(Ye());
  i.inherits = ye;
  var a = {
    deprecate: Oa()
  }, s = Zf(), f = En().Buffer, u = (typeof oe < "u" ? oe : typeof window < "u" ? window : typeof self < "u" ? self : {}).Uint8Array || function() {
  };
  function d(b) {
    return f.from(b);
  }
  function g(b) {
    return f.isBuffer(b) || b instanceof u;
  }
  var p = Yf();
  i.inherits(E, s);
  function v() {
  }
  function R(b, S) {
    n = n || Gt(), b = b || {};
    var D = S instanceof n;
    this.objectMode = !!b.objectMode, D && (this.objectMode = this.objectMode || !!b.writableObjectMode);
    var k = b.highWaterMark, W = b.writableHighWaterMark, G = this.objectMode ? 16 : 16 * 1024;
    k || k === 0 ? this.highWaterMark = k : D && (W || W === 0) ? this.highWaterMark = W : this.highWaterMark = G, this.highWaterMark = Math.floor(this.highWaterMark), this.finalCalled = !1, this.needDrain = !1, this.ending = !1, this.ended = !1, this.finished = !1, this.destroyed = !1;
    var ie = b.decodeStrings === !1;
    this.decodeStrings = !ie, this.defaultEncoding = b.defaultEncoding || "utf8", this.length = 0, this.writing = !1, this.corked = 0, this.sync = !0, this.bufferProcessing = !1, this.onwrite = function(fe) {
      C(S, fe);
    }, this.writecb = null, this.writelen = 0, this.bufferedRequest = null, this.lastBufferedRequest = null, this.pendingcb = 0, this.prefinished = !1, this.errorEmitted = !1, this.bufferedRequestCount = 0, this.corkedRequestsFree = new t(this);
  }
  R.prototype.getBuffer = function() {
    for (var S = this.bufferedRequest, D = []; S; )
      D.push(S), S = S.next;
    return D;
  }, function() {
    try {
      Object.defineProperty(R.prototype, "buffer", {
        get: a.deprecate(function() {
          return this.getBuffer();
        }, "_writableState.buffer is deprecated. Use _writableState.getBuffer instead.", "DEP0003")
      });
    } catch {
    }
  }();
  var A;
  typeof Symbol == "function" && Symbol.hasInstance && typeof Function.prototype[Symbol.hasInstance] == "function" ? (A = Function.prototype[Symbol.hasInstance], Object.defineProperty(E, Symbol.hasInstance, {
    value: function(b) {
      return A.call(this, b) ? !0 : this !== E ? !1 : b && b._writableState instanceof R;
    }
  })) : A = function(b) {
    return b instanceof this;
  };
  function E(b) {
    if (n = n || Gt(), !A.call(E, this) && !(this instanceof n))
      return new E(b);
    this._writableState = new R(b, this), this.writable = !0, b && (typeof b.write == "function" && (this._write = b.write), typeof b.writev == "function" && (this._writev = b.writev), typeof b.destroy == "function" && (this._destroy = b.destroy), typeof b.final == "function" && (this._final = b.final)), s.call(this);
  }
  E.prototype.pipe = function() {
    this.emit("error", new Error("Cannot pipe, not readable"));
  };
  function L(b, S) {
    var D = new Error("write after end");
    b.emit("error", D), e.nextTick(S, D);
  }
  function c(b, S, D, k) {
    var W = !0, G = !1;
    return D === null ? G = new TypeError("May not write null values to stream") : typeof D != "string" && D !== void 0 && !S.objectMode && (G = new TypeError("Invalid non-string/buffer chunk")), G && (b.emit("error", G), e.nextTick(k, G), W = !1), W;
  }
  E.prototype.write = function(b, S, D) {
    var k = this._writableState, W = !1, G = !k.objectMode && g(b);
    return G && !f.isBuffer(b) && (b = d(b)), typeof S == "function" && (D = S, S = null), G ? S = "buffer" : S || (S = k.defaultEncoding), typeof D != "function" && (D = v), k.ended ? L(this, D) : (G || c(this, k, b, D)) && (k.pendingcb++, W = O(this, k, G, b, S, D)), W;
  }, E.prototype.cork = function() {
    var b = this._writableState;
    b.corked++;
  }, E.prototype.uncork = function() {
    var b = this._writableState;
    b.corked && (b.corked--, !b.writing && !b.corked && !b.bufferProcessing && b.bufferedRequest && N(this, b));
  }, E.prototype.setDefaultEncoding = function(S) {
    if (typeof S == "string" && (S = S.toLowerCase()), !(["hex", "utf8", "utf-8", "ascii", "binary", "base64", "ucs2", "ucs-2", "utf16le", "utf-16le", "raw"].indexOf((S + "").toLowerCase()) > -1)) throw new TypeError("Unknown encoding: " + S);
    return this._writableState.defaultEncoding = S, this;
  };
  function h(b, S, D) {
    return !b.objectMode && b.decodeStrings !== !1 && typeof S == "string" && (S = f.from(S, D)), S;
  }
  Object.defineProperty(E.prototype, "writableHighWaterMark", {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: !1,
    get: function() {
      return this._writableState.highWaterMark;
    }
  });
  function O(b, S, D, k, W, G) {
    if (!D) {
      var ie = h(S, k, W);
      k !== ie && (D = !0, W = "buffer", k = ie);
    }
    var fe = S.objectMode ? 1 : k.length;
    S.length += fe;
    var pe = S.length < S.highWaterMark;
    if (pe || (S.needDrain = !0), S.writing || S.corked) {
      var F = S.lastBufferedRequest;
      S.lastBufferedRequest = {
        chunk: k,
        encoding: W,
        isBuf: D,
        callback: G,
        next: null
      }, F ? F.next = S.lastBufferedRequest : S.bufferedRequest = S.lastBufferedRequest, S.bufferedRequestCount += 1;
    } else
      m(b, S, !1, fe, k, W, G);
    return pe;
  }
  function m(b, S, D, k, W, G, ie) {
    S.writelen = k, S.writecb = ie, S.writing = !0, S.sync = !0, D ? b._writev(W, S.onwrite) : b._write(W, G, S.onwrite), S.sync = !1;
  }
  function x(b, S, D, k, W) {
    --S.pendingcb, D ? (e.nextTick(W, k), e.nextTick(H, b, S), b._writableState.errorEmitted = !0, b.emit("error", k)) : (W(k), b._writableState.errorEmitted = !0, b.emit("error", k), H(b, S));
  }
  function P(b) {
    b.writing = !1, b.writecb = null, b.length -= b.writelen, b.writelen = 0;
  }
  function C(b, S) {
    var D = b._writableState, k = D.sync, W = D.writecb;
    if (P(D), S) x(b, D, k, S, W);
    else {
      var G = B(D);
      !G && !D.corked && !D.bufferProcessing && D.bufferedRequest && N(b, D), k ? r(T, b, D, G, W) : T(b, D, G, W);
    }
  }
  function T(b, S, D, k) {
    D || M(b, S), S.pendingcb--, k(), H(b, S);
  }
  function M(b, S) {
    S.length === 0 && S.needDrain && (S.needDrain = !1, b.emit("drain"));
  }
  function N(b, S) {
    S.bufferProcessing = !0;
    var D = S.bufferedRequest;
    if (b._writev && D && D.next) {
      var k = S.bufferedRequestCount, W = new Array(k), G = S.corkedRequestsFree;
      G.entry = D;
      for (var ie = 0, fe = !0; D; )
        W[ie] = D, D.isBuf || (fe = !1), D = D.next, ie += 1;
      W.allBuffers = fe, m(b, S, !0, S.length, W, "", G.finish), S.pendingcb++, S.lastBufferedRequest = null, G.next ? (S.corkedRequestsFree = G.next, G.next = null) : S.corkedRequestsFree = new t(S), S.bufferedRequestCount = 0;
    } else {
      for (; D; ) {
        var pe = D.chunk, F = D.encoding, o = D.callback, l = S.objectMode ? 1 : pe.length;
        if (m(b, S, !1, l, pe, F, o), D = D.next, S.bufferedRequestCount--, S.writing)
          break;
      }
      D === null && (S.lastBufferedRequest = null);
    }
    S.bufferedRequest = D, S.bufferProcessing = !1;
  }
  E.prototype._write = function(b, S, D) {
    D(new Error("_write() is not implemented"));
  }, E.prototype._writev = null, E.prototype.end = function(b, S, D) {
    var k = this._writableState;
    typeof b == "function" ? (D = b, b = null, S = null) : typeof S == "function" && (D = S, S = null), b != null && this.write(b, S), k.corked && (k.corked = 1, this.uncork()), k.ending || V(this, k, D);
  };
  function B(b) {
    return b.ending && b.length === 0 && b.bufferedRequest === null && !b.finished && !b.writing;
  }
  function U(b, S) {
    b._final(function(D) {
      S.pendingcb--, D && b.emit("error", D), S.prefinished = !0, b.emit("prefinish"), H(b, S);
    });
  }
  function q(b, S) {
    !S.prefinished && !S.finalCalled && (typeof b._final == "function" ? (S.pendingcb++, S.finalCalled = !0, e.nextTick(U, b, S)) : (S.prefinished = !0, b.emit("prefinish")));
  }
  function H(b, S) {
    var D = B(S);
    return D && (q(b, S), S.pendingcb === 0 && (S.finished = !0, b.emit("finish"))), D;
  }
  function V(b, S, D) {
    S.ending = !0, H(b, S), D && (S.finished ? e.nextTick(D) : b.once("finish", D)), S.ended = !0, b.writable = !1;
  }
  function Y(b, S, D) {
    var k = b.entry;
    for (b.entry = null; k; ) {
      var W = k.callback;
      S.pendingcb--, W(D), k = k.next;
    }
    S.corkedRequestsFree.next = b;
  }
  return Object.defineProperty(E.prototype, "destroyed", {
    get: function() {
      return this._writableState === void 0 ? !1 : this._writableState.destroyed;
    },
    set: function(b) {
      this._writableState && (this._writableState.destroyed = b);
    }
  }), E.prototype.destroy = p.destroy, E.prototype._undestroy = p.undestroy, E.prototype._destroy = function(b, S) {
    this.end(), S(b);
  }, Jn;
}
var ei, As;
function Gt() {
  if (As) return ei;
  As = 1;
  var e = _t(), t = Object.keys || function(p) {
    var v = [];
    for (var R in p)
      v.push(R);
    return v;
  };
  ei = u;
  var r = Object.create(Ye());
  r.inherits = ye;
  var n = Kf(), i = Qf();
  r.inherits(u, n);
  for (var a = t(i.prototype), s = 0; s < a.length; s++) {
    var f = a[s];
    u.prototype[f] || (u.prototype[f] = i.prototype[f]);
  }
  function u(p) {
    if (!(this instanceof u)) return new u(p);
    n.call(this, p), i.call(this, p), p && p.readable === !1 && (this.readable = !1), p && p.writable === !1 && (this.writable = !1), this.allowHalfOpen = !0, p && p.allowHalfOpen === !1 && (this.allowHalfOpen = !1), this.once("end", d);
  }
  Object.defineProperty(u.prototype, "writableHighWaterMark", {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: !1,
    get: function() {
      return this._writableState.highWaterMark;
    }
  });
  function d() {
    this.allowHalfOpen || this._writableState.ended || e.nextTick(g, this);
  }
  function g(p) {
    p.end();
  }
  return Object.defineProperty(u.prototype, "destroyed", {
    get: function() {
      return this._readableState === void 0 || this._writableState === void 0 ? !1 : this._readableState.destroyed && this._writableState.destroyed;
    },
    set: function(p) {
      this._readableState === void 0 || this._writableState === void 0 || (this._readableState.destroyed = p, this._writableState.destroyed = p);
    }
  }), u.prototype._destroy = function(p, v) {
    this.push(null), this.end(), e.nextTick(v, p);
  }, ei;
}
var ti = {}, Ls;
function $s() {
  if (Ls) return ti;
  Ls = 1;
  var e = En().Buffer, t = e.isEncoding || function(c) {
    switch (c = "" + c, c && c.toLowerCase()) {
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
        return !0;
      default:
        return !1;
    }
  };
  function r(c) {
    if (!c) return "utf8";
    for (var h; ; )
      switch (c) {
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
          return c;
        default:
          if (h) return;
          c = ("" + c).toLowerCase(), h = !0;
      }
  }
  function n(c) {
    var h = r(c);
    if (typeof h != "string" && (e.isEncoding === t || !t(c))) throw new Error("Unknown encoding: " + c);
    return h || c;
  }
  ti.StringDecoder = i;
  function i(c) {
    this.encoding = n(c);
    var h;
    switch (this.encoding) {
      case "utf16le":
        this.text = p, this.end = v, h = 4;
        break;
      case "utf8":
        this.fillLast = u, h = 4;
        break;
      case "base64":
        this.text = R, this.end = A, h = 3;
        break;
      default:
        this.write = E, this.end = L;
        return;
    }
    this.lastNeed = 0, this.lastTotal = 0, this.lastChar = e.allocUnsafe(h);
  }
  i.prototype.write = function(c) {
    if (c.length === 0) return "";
    var h, O;
    if (this.lastNeed) {
      if (h = this.fillLast(c), h === void 0) return "";
      O = this.lastNeed, this.lastNeed = 0;
    } else
      O = 0;
    return O < c.length ? h ? h + this.text(c, O) : this.text(c, O) : h || "";
  }, i.prototype.end = g, i.prototype.text = d, i.prototype.fillLast = function(c) {
    if (this.lastNeed <= c.length)
      return c.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, this.lastNeed), this.lastChar.toString(this.encoding, 0, this.lastTotal);
    c.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, c.length), this.lastNeed -= c.length;
  };
  function a(c) {
    return c <= 127 ? 0 : c >> 5 === 6 ? 2 : c >> 4 === 14 ? 3 : c >> 3 === 30 ? 4 : c >> 6 === 2 ? -1 : -2;
  }
  function s(c, h, O) {
    var m = h.length - 1;
    if (m < O) return 0;
    var x = a(h[m]);
    return x >= 0 ? (x > 0 && (c.lastNeed = x - 1), x) : --m < O || x === -2 ? 0 : (x = a(h[m]), x >= 0 ? (x > 0 && (c.lastNeed = x - 2), x) : --m < O || x === -2 ? 0 : (x = a(h[m]), x >= 0 ? (x > 0 && (x === 2 ? x = 0 : c.lastNeed = x - 3), x) : 0));
  }
  function f(c, h, O) {
    if ((h[0] & 192) !== 128)
      return c.lastNeed = 0, "�";
    if (c.lastNeed > 1 && h.length > 1) {
      if ((h[1] & 192) !== 128)
        return c.lastNeed = 1, "�";
      if (c.lastNeed > 2 && h.length > 2 && (h[2] & 192) !== 128)
        return c.lastNeed = 2, "�";
    }
  }
  function u(c) {
    var h = this.lastTotal - this.lastNeed, O = f(this, c);
    if (O !== void 0) return O;
    if (this.lastNeed <= c.length)
      return c.copy(this.lastChar, h, 0, this.lastNeed), this.lastChar.toString(this.encoding, 0, this.lastTotal);
    c.copy(this.lastChar, h, 0, c.length), this.lastNeed -= c.length;
  }
  function d(c, h) {
    var O = s(this, c, h);
    if (!this.lastNeed) return c.toString("utf8", h);
    this.lastTotal = O;
    var m = c.length - (O - this.lastNeed);
    return c.copy(this.lastChar, 0, m), c.toString("utf8", h, m);
  }
  function g(c) {
    var h = c && c.length ? this.write(c) : "";
    return this.lastNeed ? h + "�" : h;
  }
  function p(c, h) {
    if ((c.length - h) % 2 === 0) {
      var O = c.toString("utf16le", h);
      if (O) {
        var m = O.charCodeAt(O.length - 1);
        if (m >= 55296 && m <= 56319)
          return this.lastNeed = 2, this.lastTotal = 4, this.lastChar[0] = c[c.length - 2], this.lastChar[1] = c[c.length - 1], O.slice(0, -1);
      }
      return O;
    }
    return this.lastNeed = 1, this.lastTotal = 2, this.lastChar[0] = c[c.length - 1], c.toString("utf16le", h, c.length - 1);
  }
  function v(c) {
    var h = c && c.length ? this.write(c) : "";
    if (this.lastNeed) {
      var O = this.lastTotal - this.lastNeed;
      return h + this.lastChar.toString("utf16le", 0, O);
    }
    return h;
  }
  function R(c, h) {
    var O = (c.length - h) % 3;
    return O === 0 ? c.toString("base64", h) : (this.lastNeed = 3 - O, this.lastTotal = 3, O === 1 ? this.lastChar[0] = c[c.length - 1] : (this.lastChar[0] = c[c.length - 2], this.lastChar[1] = c[c.length - 1]), c.toString("base64", h, c.length - O));
  }
  function A(c) {
    var h = c && c.length ? this.write(c) : "";
    return this.lastNeed ? h + this.lastChar.toString("base64", 0, 3 - this.lastNeed) : h;
  }
  function E(c) {
    return c.toString(this.encoding);
  }
  function L(c) {
    return c && c.length ? this.write(c) : "";
  }
  return ti;
}
var ri, Ms;
function Kf() {
  if (Ms) return ri;
  Ms = 1;
  var e = _t();
  ri = h;
  var t = Vf(), r;
  h.ReadableState = c, wr.EventEmitter;
  var n = function(o, l) {
    return o.listeners(l).length;
  }, i = Zf(), a = En().Buffer, s = (typeof oe < "u" ? oe : typeof window < "u" ? window : typeof self < "u" ? self : {}).Uint8Array || function() {
  };
  function f(o) {
    return a.from(o);
  }
  function u(o) {
    return a.isBuffer(o) || o instanceof s;
  }
  var d = Object.create(Ye());
  d.inherits = ye;
  var g = Ee, p = void 0;
  g && g.debuglog ? p = g.debuglog("stream") : p = function() {
  };
  var v = fd(), R = Yf(), A;
  d.inherits(h, i);
  var E = ["error", "close", "destroy", "pause", "resume"];
  function L(o, l, $) {
    if (typeof o.prependListener == "function") return o.prependListener(l, $);
    !o._events || !o._events[l] ? o.on(l, $) : t(o._events[l]) ? o._events[l].unshift($) : o._events[l] = [$, o._events[l]];
  }
  function c(o, l) {
    r = r || Gt(), o = o || {};
    var $ = l instanceof r;
    this.objectMode = !!o.objectMode, $ && (this.objectMode = this.objectMode || !!o.readableObjectMode);
    var I = o.highWaterMark, w = o.readableHighWaterMark, y = this.objectMode ? 16 : 16 * 1024;
    I || I === 0 ? this.highWaterMark = I : $ && (w || w === 0) ? this.highWaterMark = w : this.highWaterMark = y, this.highWaterMark = Math.floor(this.highWaterMark), this.buffer = new v(), this.length = 0, this.pipes = null, this.pipesCount = 0, this.flowing = null, this.ended = !1, this.endEmitted = !1, this.reading = !1, this.sync = !0, this.needReadable = !1, this.emittedReadable = !1, this.readableListening = !1, this.resumeScheduled = !1, this.destroyed = !1, this.defaultEncoding = o.defaultEncoding || "utf8", this.awaitDrain = 0, this.readingMore = !1, this.decoder = null, this.encoding = null, o.encoding && (A || (A = $s().StringDecoder), this.decoder = new A(o.encoding), this.encoding = o.encoding);
  }
  function h(o) {
    if (r = r || Gt(), !(this instanceof h)) return new h(o);
    this._readableState = new c(o, this), this.readable = !0, o && (typeof o.read == "function" && (this._read = o.read), typeof o.destroy == "function" && (this._destroy = o.destroy)), i.call(this);
  }
  Object.defineProperty(h.prototype, "destroyed", {
    get: function() {
      return this._readableState === void 0 ? !1 : this._readableState.destroyed;
    },
    set: function(o) {
      this._readableState && (this._readableState.destroyed = o);
    }
  }), h.prototype.destroy = R.destroy, h.prototype._undestroy = R.undestroy, h.prototype._destroy = function(o, l) {
    this.push(null), l(o);
  }, h.prototype.push = function(o, l) {
    var $ = this._readableState, I;
    return $.objectMode ? I = !0 : typeof o == "string" && (l = l || $.defaultEncoding, l !== $.encoding && (o = a.from(o, l), l = ""), I = !0), O(this, o, l, !1, I);
  }, h.prototype.unshift = function(o) {
    return O(this, o, null, !0, !1);
  };
  function O(o, l, $, I, w) {
    var y = o._readableState;
    if (l === null)
      y.reading = !1, N(o, y);
    else {
      var j;
      w || (j = x(y, l)), j ? o.emit("error", j) : y.objectMode || l && l.length > 0 ? (typeof l != "string" && !y.objectMode && Object.getPrototypeOf(l) !== a.prototype && (l = f(l)), I ? y.endEmitted ? o.emit("error", new Error("stream.unshift() after end event")) : m(o, y, l, !0) : y.ended ? o.emit("error", new Error("stream.push() after EOF")) : (y.reading = !1, y.decoder && !$ ? (l = y.decoder.write(l), y.objectMode || l.length !== 0 ? m(o, y, l, !1) : q(o, y)) : m(o, y, l, !1))) : I || (y.reading = !1);
    }
    return P(y);
  }
  function m(o, l, $, I) {
    l.flowing && l.length === 0 && !l.sync ? (o.emit("data", $), o.read(0)) : (l.length += l.objectMode ? 1 : $.length, I ? l.buffer.unshift($) : l.buffer.push($), l.needReadable && B(o)), q(o, l);
  }
  function x(o, l) {
    var $;
    return !u(l) && typeof l != "string" && l !== void 0 && !o.objectMode && ($ = new TypeError("Invalid non-string/buffer chunk")), $;
  }
  function P(o) {
    return !o.ended && (o.needReadable || o.length < o.highWaterMark || o.length === 0);
  }
  h.prototype.isPaused = function() {
    return this._readableState.flowing === !1;
  }, h.prototype.setEncoding = function(o) {
    return A || (A = $s().StringDecoder), this._readableState.decoder = new A(o), this._readableState.encoding = o, this;
  };
  var C = 8388608;
  function T(o) {
    return o >= C ? o = C : (o--, o |= o >>> 1, o |= o >>> 2, o |= o >>> 4, o |= o >>> 8, o |= o >>> 16, o++), o;
  }
  function M(o, l) {
    return o <= 0 || l.length === 0 && l.ended ? 0 : l.objectMode ? 1 : o !== o ? l.flowing && l.length ? l.buffer.head.data.length : l.length : (o > l.highWaterMark && (l.highWaterMark = T(o)), o <= l.length ? o : l.ended ? l.length : (l.needReadable = !0, 0));
  }
  h.prototype.read = function(o) {
    p("read", o), o = parseInt(o, 10);
    var l = this._readableState, $ = o;
    if (o !== 0 && (l.emittedReadable = !1), o === 0 && l.needReadable && (l.length >= l.highWaterMark || l.ended))
      return p("read: emitReadable", l.length, l.ended), l.length === 0 && l.ended ? fe(this) : B(this), null;
    if (o = M(o, l), o === 0 && l.ended)
      return l.length === 0 && fe(this), null;
    var I = l.needReadable;
    p("need readable", I), (l.length === 0 || l.length - o < l.highWaterMark) && (I = !0, p("length less than watermark", I)), l.ended || l.reading ? (I = !1, p("reading or ended", I)) : I && (p("do read"), l.reading = !0, l.sync = !0, l.length === 0 && (l.needReadable = !0), this._read(l.highWaterMark), l.sync = !1, l.reading || (o = M($, l)));
    var w;
    return o > 0 ? w = k(o, l) : w = null, w === null ? (l.needReadable = !0, o = 0) : l.length -= o, l.length === 0 && (l.ended || (l.needReadable = !0), $ !== o && l.ended && fe(this)), w !== null && this.emit("data", w), w;
  };
  function N(o, l) {
    if (!l.ended) {
      if (l.decoder) {
        var $ = l.decoder.end();
        $ && $.length && (l.buffer.push($), l.length += l.objectMode ? 1 : $.length);
      }
      l.ended = !0, B(o);
    }
  }
  function B(o) {
    var l = o._readableState;
    l.needReadable = !1, l.emittedReadable || (p("emitReadable", l.flowing), l.emittedReadable = !0, l.sync ? e.nextTick(U, o) : U(o));
  }
  function U(o) {
    p("emit readable"), o.emit("readable"), D(o);
  }
  function q(o, l) {
    l.readingMore || (l.readingMore = !0, e.nextTick(H, o, l));
  }
  function H(o, l) {
    for (var $ = l.length; !l.reading && !l.flowing && !l.ended && l.length < l.highWaterMark && (p("maybeReadMore read 0"), o.read(0), $ !== l.length); )
      $ = l.length;
    l.readingMore = !1;
  }
  h.prototype._read = function(o) {
    this.emit("error", new Error("_read() is not implemented"));
  }, h.prototype.pipe = function(o, l) {
    var $ = this, I = this._readableState;
    switch (I.pipesCount) {
      case 0:
        I.pipes = o;
        break;
      case 1:
        I.pipes = [I.pipes, o];
        break;
      default:
        I.pipes.push(o);
        break;
    }
    I.pipesCount += 1, p("pipe count=%d opts=%j", I.pipesCount, l);
    var w = (!l || l.end !== !1) && o !== process.stdout && o !== process.stderr, y = w ? z : Oe;
    I.endEmitted ? e.nextTick(y) : $.once("end", y), o.on("unpipe", j);
    function j(me, Re) {
      p("onunpipe"), me === $ && Re && Re.hasUnpiped === !1 && (Re.hasUnpiped = !0, se());
    }
    function z() {
      p("onend"), o.end();
    }
    var ae = V($);
    o.on("drain", ae);
    var Q = !1;
    function se() {
      p("cleanup"), o.removeListener("close", Qe), o.removeListener("finish", We), o.removeListener("drain", ae), o.removeListener("error", ze), o.removeListener("unpipe", j), $.removeListener("end", z), $.removeListener("end", Oe), $.removeListener("data", qe), Q = !0, I.awaitDrain && (!o._writableState || o._writableState.needDrain) && ae();
    }
    var Le = !1;
    $.on("data", qe);
    function qe(me) {
      p("ondata"), Le = !1;
      var Re = o.write(me);
      Re === !1 && !Le && ((I.pipesCount === 1 && I.pipes === o || I.pipesCount > 1 && F(I.pipes, o) !== -1) && !Q && (p("false write response, pause", I.awaitDrain), I.awaitDrain++, Le = !0), $.pause());
    }
    function ze(me) {
      p("onerror", me), Oe(), o.removeListener("error", ze), n(o, "error") === 0 && o.emit("error", me);
    }
    L(o, "error", ze);
    function Qe() {
      o.removeListener("finish", We), Oe();
    }
    o.once("close", Qe);
    function We() {
      p("onfinish"), o.removeListener("close", Qe), Oe();
    }
    o.once("finish", We);
    function Oe() {
      p("unpipe"), $.unpipe(o);
    }
    return o.emit("pipe", $), I.flowing || (p("pipe resume"), $.resume()), o;
  };
  function V(o) {
    return function() {
      var l = o._readableState;
      p("pipeOnDrain", l.awaitDrain), l.awaitDrain && l.awaitDrain--, l.awaitDrain === 0 && n(o, "data") && (l.flowing = !0, D(o));
    };
  }
  h.prototype.unpipe = function(o) {
    var l = this._readableState, $ = { hasUnpiped: !1 };
    if (l.pipesCount === 0) return this;
    if (l.pipesCount === 1)
      return o && o !== l.pipes ? this : (o || (o = l.pipes), l.pipes = null, l.pipesCount = 0, l.flowing = !1, o && o.emit("unpipe", this, $), this);
    if (!o) {
      var I = l.pipes, w = l.pipesCount;
      l.pipes = null, l.pipesCount = 0, l.flowing = !1;
      for (var y = 0; y < w; y++)
        I[y].emit("unpipe", this, { hasUnpiped: !1 });
      return this;
    }
    var j = F(l.pipes, o);
    return j === -1 ? this : (l.pipes.splice(j, 1), l.pipesCount -= 1, l.pipesCount === 1 && (l.pipes = l.pipes[0]), o.emit("unpipe", this, $), this);
  }, h.prototype.on = function(o, l) {
    var $ = i.prototype.on.call(this, o, l);
    if (o === "data")
      this._readableState.flowing !== !1 && this.resume();
    else if (o === "readable") {
      var I = this._readableState;
      !I.endEmitted && !I.readableListening && (I.readableListening = I.needReadable = !0, I.emittedReadable = !1, I.reading ? I.length && B(this) : e.nextTick(Y, this));
    }
    return $;
  }, h.prototype.addListener = h.prototype.on;
  function Y(o) {
    p("readable nexttick read 0"), o.read(0);
  }
  h.prototype.resume = function() {
    var o = this._readableState;
    return o.flowing || (p("resume"), o.flowing = !0, b(this, o)), this;
  };
  function b(o, l) {
    l.resumeScheduled || (l.resumeScheduled = !0, e.nextTick(S, o, l));
  }
  function S(o, l) {
    l.reading || (p("resume read 0"), o.read(0)), l.resumeScheduled = !1, l.awaitDrain = 0, o.emit("resume"), D(o), l.flowing && !l.reading && o.read(0);
  }
  h.prototype.pause = function() {
    return p("call pause flowing=%j", this._readableState.flowing), this._readableState.flowing !== !1 && (p("pause"), this._readableState.flowing = !1, this.emit("pause")), this;
  };
  function D(o) {
    var l = o._readableState;
    for (p("flow", l.flowing); l.flowing && o.read() !== null; )
      ;
  }
  h.prototype.wrap = function(o) {
    var l = this, $ = this._readableState, I = !1;
    o.on("end", function() {
      if (p("wrapped end"), $.decoder && !$.ended) {
        var j = $.decoder.end();
        j && j.length && l.push(j);
      }
      l.push(null);
    }), o.on("data", function(j) {
      if (p("wrapped data"), $.decoder && (j = $.decoder.write(j)), !($.objectMode && j == null) && !(!$.objectMode && (!j || !j.length))) {
        var z = l.push(j);
        z || (I = !0, o.pause());
      }
    });
    for (var w in o)
      this[w] === void 0 && typeof o[w] == "function" && (this[w] = /* @__PURE__ */ function(j) {
        return function() {
          return o[j].apply(o, arguments);
        };
      }(w));
    for (var y = 0; y < E.length; y++)
      o.on(E[y], this.emit.bind(this, E[y]));
    return this._read = function(j) {
      p("wrapped _read", j), I && (I = !1, o.resume());
    }, this;
  }, Object.defineProperty(h.prototype, "readableHighWaterMark", {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: !1,
    get: function() {
      return this._readableState.highWaterMark;
    }
  }), h._fromList = k;
  function k(o, l) {
    if (l.length === 0) return null;
    var $;
    return l.objectMode ? $ = l.buffer.shift() : !o || o >= l.length ? (l.decoder ? $ = l.buffer.join("") : l.buffer.length === 1 ? $ = l.buffer.head.data : $ = l.buffer.concat(l.length), l.buffer.clear()) : $ = W(o, l.buffer, l.decoder), $;
  }
  function W(o, l, $) {
    var I;
    return o < l.head.data.length ? (I = l.head.data.slice(0, o), l.head.data = l.head.data.slice(o)) : o === l.head.data.length ? I = l.shift() : I = $ ? G(o, l) : ie(o, l), I;
  }
  function G(o, l) {
    var $ = l.head, I = 1, w = $.data;
    for (o -= w.length; $ = $.next; ) {
      var y = $.data, j = o > y.length ? y.length : o;
      if (j === y.length ? w += y : w += y.slice(0, o), o -= j, o === 0) {
        j === y.length ? (++I, $.next ? l.head = $.next : l.head = l.tail = null) : (l.head = $, $.data = y.slice(j));
        break;
      }
      ++I;
    }
    return l.length -= I, w;
  }
  function ie(o, l) {
    var $ = a.allocUnsafe(o), I = l.head, w = 1;
    for (I.data.copy($), o -= I.data.length; I = I.next; ) {
      var y = I.data, j = o > y.length ? y.length : o;
      if (y.copy($, $.length - o, 0, j), o -= j, o === 0) {
        j === y.length ? (++w, I.next ? l.head = I.next : l.head = l.tail = null) : (l.head = I, I.data = y.slice(j));
        break;
      }
      ++w;
    }
    return l.length -= w, $;
  }
  function fe(o) {
    var l = o._readableState;
    if (l.length > 0) throw new Error('"endReadable()" called on non-empty stream');
    l.endEmitted || (l.ended = !0, e.nextTick(pe, l, o));
  }
  function pe(o, l) {
    !o.endEmitted && o.length === 0 && (o.endEmitted = !0, l.readable = !1, l.emit("end"));
  }
  function F(o, l) {
    for (var $ = 0, I = o.length; $ < I; $++)
      if (o[$] === l) return $;
    return -1;
  }
  return ri;
}
var ni, Ds;
function Xf() {
  if (Ds) return ni;
  Ds = 1, ni = n;
  var e = Gt(), t = Object.create(Ye());
  t.inherits = ye, t.inherits(n, e);
  function r(s, f) {
    var u = this._transformState;
    u.transforming = !1;
    var d = u.writecb;
    if (!d)
      return this.emit("error", new Error("write callback called multiple times"));
    u.writechunk = null, u.writecb = null, f != null && this.push(f), d(s);
    var g = this._readableState;
    g.reading = !1, (g.needReadable || g.length < g.highWaterMark) && this._read(g.highWaterMark);
  }
  function n(s) {
    if (!(this instanceof n)) return new n(s);
    e.call(this, s), this._transformState = {
      afterTransform: r.bind(this),
      needTransform: !1,
      transforming: !1,
      writecb: null,
      writechunk: null,
      writeencoding: null
    }, this._readableState.needReadable = !0, this._readableState.sync = !1, s && (typeof s.transform == "function" && (this._transform = s.transform), typeof s.flush == "function" && (this._flush = s.flush)), this.on("prefinish", i);
  }
  function i() {
    var s = this;
    typeof this._flush == "function" ? this._flush(function(f, u) {
      a(s, f, u);
    }) : a(this, null, null);
  }
  n.prototype.push = function(s, f) {
    return this._transformState.needTransform = !1, e.prototype.push.call(this, s, f);
  }, n.prototype._transform = function(s, f, u) {
    throw new Error("_transform() is not implemented");
  }, n.prototype._write = function(s, f, u) {
    var d = this._transformState;
    if (d.writecb = u, d.writechunk = s, d.writeencoding = f, !d.transforming) {
      var g = this._readableState;
      (d.needTransform || g.needReadable || g.length < g.highWaterMark) && this._read(g.highWaterMark);
    }
  }, n.prototype._read = function(s) {
    var f = this._transformState;
    f.writechunk !== null && f.writecb && !f.transforming ? (f.transforming = !0, this._transform(f.writechunk, f.writeencoding, f.afterTransform)) : f.needTransform = !0;
  }, n.prototype._destroy = function(s, f) {
    var u = this;
    e.prototype._destroy.call(this, s, function(d) {
      f(d), u.emit("close");
    });
  };
  function a(s, f, u) {
    if (f) return s.emit("error", f);
    if (u != null && s.push(u), s._writableState.length) throw new Error("Calling transform done when ws.length != 0");
    if (s._transformState.transforming) throw new Error("Calling transform done when still transforming");
    return s.push(null);
  }
  return ni;
}
var ii, Ps;
function ud() {
  if (Ps) return ii;
  Ps = 1, ii = r;
  var e = Xf(), t = Object.create(Ye());
  t.inherits = ye, t.inherits(r, e);
  function r(n) {
    if (!(this instanceof r)) return new r(n);
    e.call(this, n);
  }
  return r.prototype._transform = function(n, i, a) {
    a(null, n);
  }, ii;
}
(function(e, t) {
  var r = Ze;
  process.env.READABLE_STREAM === "disable" && r ? (e.exports = r, t = e.exports = r.Readable, t.Readable = r.Readable, t.Writable = r.Writable, t.Duplex = r.Duplex, t.Transform = r.Transform, t.PassThrough = r.PassThrough, t.Stream = r) : (t = e.exports = Kf(), t.Stream = r || t, t.Readable = t, t.Writable = Qf(), t.Duplex = Gt(), t.Transform = Xf(), t.PassThrough = ud());
})(Gi, Gi.exports);
var ld = Gi.exports, cd = ld.PassThrough, Jf = Ee, xn = cd, eu = {
  Readable: hn
};
Jf.inherits(hn, xn);
Jf.inherits(Vi, xn);
function tu(e, t, r) {
  e[t] = function() {
    return delete e[t], r.apply(this, arguments), this[t].apply(this, arguments);
  };
}
function hn(e, t) {
  if (!(this instanceof hn))
    return new hn(e, t);
  xn.call(this, t), tu(this, "_read", function() {
    var r = e.call(this, t), n = this.emit.bind(this, "error");
    r.on("error", n), r.pipe(this);
  }), this.emit("readable");
}
function Vi(e, t) {
  if (!(this instanceof Vi))
    return new Vi(e, t);
  xn.call(this, t), tu(this, "_write", function() {
    var r = e.call(this, t), n = this.emit.bind(this, "error");
    r.on("error", n), this.pipe(r);
  }), this.emit("writable");
}
/*!
 * normalize-path <https://github.com/jonschlinkert/normalize-path>
 *
 * Copyright (c) 2014-2018, Jon Schlinkert.
 * Released under the MIT License.
 */
var Ra = function(e, t) {
  if (typeof e != "string")
    throw new TypeError("expected path to be a string");
  if (e === "\\" || e === "/") return "/";
  var r = e.length;
  if (r <= 1) return e;
  var n = "";
  if (r > 4 && e[3] === "\\") {
    var i = e[2];
    (i === "?" || i === ".") && e.slice(0, 2) === "\\\\" && (e = e.slice(2), n = "//");
  }
  var a = e.split(/[/\\]+/);
  return t !== !1 && a[a.length - 1] === "" && a.pop(), n + a.join("/");
}, ru = 9007199254740991, hd = "[object Arguments]", dd = "[object Function]", pd = "[object GeneratorFunction]", gd = /^(?:0|[1-9]\d*)$/;
function nu(e, t, r) {
  switch (r.length) {
    case 0:
      return e.call(t);
    case 1:
      return e.call(t, r[0]);
    case 2:
      return e.call(t, r[0], r[1]);
    case 3:
      return e.call(t, r[0], r[1], r[2]);
  }
  return e.apply(t, r);
}
function vd(e, t) {
  for (var r = -1, n = Array(e); ++r < e; )
    n[r] = t(r);
  return n;
}
var Rr = Object.prototype, On = Rr.hasOwnProperty, iu = Rr.toString, yd = Rr.propertyIsEnumerable, Is = Math.max;
function md(e, t) {
  var r = Ad(e) || Td(e) ? vd(e.length, String) : [], n = r.length, i = !!n;
  for (var a in e)
    i && (a == "length" || su(a, n)) || r.push(a);
  return r;
}
function _d(e, t, r, n) {
  return e === void 0 || Ta(e, Rr[r]) && !On.call(n, r) ? t : e;
}
function bd(e, t, r) {
  var n = e[t];
  (!(On.call(e, t) && Ta(n, r)) || r === void 0 && !(t in e)) && (e[t] = r);
}
function wd(e) {
  if (!La(e))
    return Rd(e);
  var t = Od(e), r = [];
  for (var n in e)
    n == "constructor" && (t || !On.call(e, n)) || r.push(n);
  return r;
}
function au(e, t) {
  return t = Is(t === void 0 ? e.length - 1 : t, 0), function() {
    for (var r = arguments, n = -1, i = Is(r.length - t, 0), a = Array(i); ++n < i; )
      a[n] = r[t + n];
    n = -1;
    for (var s = Array(t + 1); ++n < t; )
      s[n] = r[n];
    return s[t] = a, nu(e, this, s);
  };
}
function Sd(e, t, r, n) {
  r || (r = {});
  for (var i = -1, a = t.length; ++i < a; ) {
    var s = t[i], f = n ? n(r[s], e[s], s, r, e) : void 0;
    bd(r, s, f === void 0 ? e[s] : f);
  }
  return r;
}
function Ed(e) {
  return au(function(t, r) {
    var n = -1, i = r.length, a = i > 1 ? r[i - 1] : void 0, s = i > 2 ? r[2] : void 0;
    for (a = e.length > 3 && typeof a == "function" ? (i--, a) : void 0, s && xd(r[0], r[1], s) && (a = i < 3 ? void 0 : a, i = 1), t = Object(t); ++n < i; ) {
      var f = r[n];
      f && e(t, f, n, a);
    }
    return t;
  });
}
function su(e, t) {
  return t = t ?? ru, !!t && (typeof e == "number" || gd.test(e)) && e > -1 && e % 1 == 0 && e < t;
}
function xd(e, t, r) {
  if (!La(r))
    return !1;
  var n = typeof t;
  return (n == "number" ? Aa(r) && su(t, r.length) : n == "string" && t in r) ? Ta(r[t], e) : !1;
}
function Od(e) {
  var t = e && e.constructor, r = typeof t == "function" && t.prototype || Rr;
  return e === r;
}
function Rd(e) {
  var t = [];
  if (e != null)
    for (var r in Object(e))
      t.push(r);
  return t;
}
function Ta(e, t) {
  return e === t || e !== e && t !== t;
}
function Td(e) {
  return Ld(e) && On.call(e, "callee") && (!yd.call(e, "callee") || iu.call(e) == hd);
}
var Ad = Array.isArray;
function Aa(e) {
  return e != null && Md(e.length) && !$d(e);
}
function Ld(e) {
  return Dd(e) && Aa(e);
}
function $d(e) {
  var t = La(e) ? iu.call(e) : "";
  return t == dd || t == pd;
}
function Md(e) {
  return typeof e == "number" && e > -1 && e % 1 == 0 && e <= ru;
}
function La(e) {
  var t = typeof e;
  return !!e && (t == "object" || t == "function");
}
function Dd(e) {
  return !!e && typeof e == "object";
}
var Pd = Ed(function(e, t, r, n) {
  Sd(t, Cd(t), e, n);
}), Id = au(function(e) {
  return e.push(void 0, _d), nu(Pd, void 0, e);
});
function Cd(e) {
  return Aa(e) ? md(e) : wd(e);
}
var ou = Id, Zi = { exports: {} }, ai, Cs;
function fu() {
  return Cs || (Cs = 1, ai = Ze), ai;
}
var Cr = { exports: {} }, Ns;
function Rn() {
  return Ns || (Ns = 1, function(e, t) {
    var r = vt, n = r.Buffer;
    function i(s, f) {
      for (var u in s)
        f[u] = s[u];
    }
    n.from && n.alloc && n.allocUnsafe && n.allocUnsafeSlow ? e.exports = r : (i(r, t), t.Buffer = a);
    function a(s, f, u) {
      return n(s, f, u);
    }
    i(n, a), a.from = function(s, f, u) {
      if (typeof s == "number")
        throw new TypeError("Argument must not be a number");
      return n(s, f, u);
    }, a.alloc = function(s, f, u) {
      if (typeof s != "number")
        throw new TypeError("Argument must be a number");
      var d = n(s);
      return f !== void 0 ? typeof u == "string" ? d.fill(f, u) : d.fill(f) : d.fill(0), d;
    }, a.allocUnsafe = function(s) {
      if (typeof s != "number")
        throw new TypeError("Argument must be a number");
      return n(s);
    }, a.allocUnsafeSlow = function(s) {
      if (typeof s != "number")
        throw new TypeError("Argument must be a number");
      return r.SlowBuffer(s);
    };
  }(Cr, Cr.exports)), Cr.exports;
}
var si = { exports: {} }, js;
function Nd() {
  return js || (js = 1, function(e) {
    function t(a, s) {
      if (!(a instanceof s))
        throw new TypeError("Cannot call a class as a function");
    }
    var r = Rn().Buffer, n = Ee;
    function i(a, s, f) {
      a.copy(s, f);
    }
    e.exports = function() {
      function a() {
        t(this, a), this.head = null, this.tail = null, this.length = 0;
      }
      return a.prototype.push = function(f) {
        var u = { data: f, next: null };
        this.length > 0 ? this.tail.next = u : this.head = u, this.tail = u, ++this.length;
      }, a.prototype.unshift = function(f) {
        var u = { data: f, next: this.head };
        this.length === 0 && (this.tail = u), this.head = u, ++this.length;
      }, a.prototype.shift = function() {
        if (this.length !== 0) {
          var f = this.head.data;
          return this.length === 1 ? this.head = this.tail = null : this.head = this.head.next, --this.length, f;
        }
      }, a.prototype.clear = function() {
        this.head = this.tail = null, this.length = 0;
      }, a.prototype.join = function(f) {
        if (this.length === 0) return "";
        for (var u = this.head, d = "" + u.data; u = u.next; )
          d += f + u.data;
        return d;
      }, a.prototype.concat = function(f) {
        if (this.length === 0) return r.alloc(0);
        for (var u = r.allocUnsafe(f >>> 0), d = this.head, g = 0; d; )
          i(d.data, u, g), g += d.data.length, d = d.next;
        return u;
      }, a;
    }(), n && n.inspect && n.inspect.custom && (e.exports.prototype[n.inspect.custom] = function() {
      var a = n.inspect({ length: this.length });
      return this.constructor.name + " " + a;
    });
  }(si)), si.exports;
}
var oi, Bs;
function uu() {
  if (Bs) return oi;
  Bs = 1;
  var e = _t();
  function t(i, a) {
    var s = this, f = this._readableState && this._readableState.destroyed, u = this._writableState && this._writableState.destroyed;
    return f || u ? (a ? a(i) : i && (this._writableState ? this._writableState.errorEmitted || (this._writableState.errorEmitted = !0, e.nextTick(n, this, i)) : e.nextTick(n, this, i)), this) : (this._readableState && (this._readableState.destroyed = !0), this._writableState && (this._writableState.destroyed = !0), this._destroy(i || null, function(d) {
      !a && d ? s._writableState ? s._writableState.errorEmitted || (s._writableState.errorEmitted = !0, e.nextTick(n, s, d)) : e.nextTick(n, s, d) : a && a(d);
    }), this);
  }
  function r() {
    this._readableState && (this._readableState.destroyed = !1, this._readableState.reading = !1, this._readableState.ended = !1, this._readableState.endEmitted = !1), this._writableState && (this._writableState.destroyed = !1, this._writableState.ended = !1, this._writableState.ending = !1, this._writableState.finalCalled = !1, this._writableState.prefinished = !1, this._writableState.finished = !1, this._writableState.errorEmitted = !1);
  }
  function n(i, a) {
    i.emit("error", a);
  }
  return oi = {
    destroy: t,
    undestroy: r
  }, oi;
}
var fi, Fs;
function lu() {
  if (Fs) return fi;
  Fs = 1;
  var e = _t();
  fi = E;
  function t(b) {
    var S = this;
    this.next = null, this.entry = null, this.finish = function() {
      Y(S, b);
    };
  }
  var r = !process.browser && ["v0.10", "v0.9."].indexOf(process.version.slice(0, 5)) > -1 ? setImmediate : e.nextTick, n;
  E.WritableState = R;
  var i = Object.create(Ye());
  i.inherits = ye;
  var a = {
    deprecate: Oa()
  }, s = fu(), f = Rn().Buffer, u = (typeof oe < "u" ? oe : typeof window < "u" ? window : typeof self < "u" ? self : {}).Uint8Array || function() {
  };
  function d(b) {
    return f.from(b);
  }
  function g(b) {
    return f.isBuffer(b) || b instanceof u;
  }
  var p = uu();
  i.inherits(E, s);
  function v() {
  }
  function R(b, S) {
    n = n || Ht(), b = b || {};
    var D = S instanceof n;
    this.objectMode = !!b.objectMode, D && (this.objectMode = this.objectMode || !!b.writableObjectMode);
    var k = b.highWaterMark, W = b.writableHighWaterMark, G = this.objectMode ? 16 : 16 * 1024;
    k || k === 0 ? this.highWaterMark = k : D && (W || W === 0) ? this.highWaterMark = W : this.highWaterMark = G, this.highWaterMark = Math.floor(this.highWaterMark), this.finalCalled = !1, this.needDrain = !1, this.ending = !1, this.ended = !1, this.finished = !1, this.destroyed = !1;
    var ie = b.decodeStrings === !1;
    this.decodeStrings = !ie, this.defaultEncoding = b.defaultEncoding || "utf8", this.length = 0, this.writing = !1, this.corked = 0, this.sync = !0, this.bufferProcessing = !1, this.onwrite = function(fe) {
      C(S, fe);
    }, this.writecb = null, this.writelen = 0, this.bufferedRequest = null, this.lastBufferedRequest = null, this.pendingcb = 0, this.prefinished = !1, this.errorEmitted = !1, this.bufferedRequestCount = 0, this.corkedRequestsFree = new t(this);
  }
  R.prototype.getBuffer = function() {
    for (var S = this.bufferedRequest, D = []; S; )
      D.push(S), S = S.next;
    return D;
  }, function() {
    try {
      Object.defineProperty(R.prototype, "buffer", {
        get: a.deprecate(function() {
          return this.getBuffer();
        }, "_writableState.buffer is deprecated. Use _writableState.getBuffer instead.", "DEP0003")
      });
    } catch {
    }
  }();
  var A;
  typeof Symbol == "function" && Symbol.hasInstance && typeof Function.prototype[Symbol.hasInstance] == "function" ? (A = Function.prototype[Symbol.hasInstance], Object.defineProperty(E, Symbol.hasInstance, {
    value: function(b) {
      return A.call(this, b) ? !0 : this !== E ? !1 : b && b._writableState instanceof R;
    }
  })) : A = function(b) {
    return b instanceof this;
  };
  function E(b) {
    if (n = n || Ht(), !A.call(E, this) && !(this instanceof n))
      return new E(b);
    this._writableState = new R(b, this), this.writable = !0, b && (typeof b.write == "function" && (this._write = b.write), typeof b.writev == "function" && (this._writev = b.writev), typeof b.destroy == "function" && (this._destroy = b.destroy), typeof b.final == "function" && (this._final = b.final)), s.call(this);
  }
  E.prototype.pipe = function() {
    this.emit("error", new Error("Cannot pipe, not readable"));
  };
  function L(b, S) {
    var D = new Error("write after end");
    b.emit("error", D), e.nextTick(S, D);
  }
  function c(b, S, D, k) {
    var W = !0, G = !1;
    return D === null ? G = new TypeError("May not write null values to stream") : typeof D != "string" && D !== void 0 && !S.objectMode && (G = new TypeError("Invalid non-string/buffer chunk")), G && (b.emit("error", G), e.nextTick(k, G), W = !1), W;
  }
  E.prototype.write = function(b, S, D) {
    var k = this._writableState, W = !1, G = !k.objectMode && g(b);
    return G && !f.isBuffer(b) && (b = d(b)), typeof S == "function" && (D = S, S = null), G ? S = "buffer" : S || (S = k.defaultEncoding), typeof D != "function" && (D = v), k.ended ? L(this, D) : (G || c(this, k, b, D)) && (k.pendingcb++, W = O(this, k, G, b, S, D)), W;
  }, E.prototype.cork = function() {
    var b = this._writableState;
    b.corked++;
  }, E.prototype.uncork = function() {
    var b = this._writableState;
    b.corked && (b.corked--, !b.writing && !b.corked && !b.bufferProcessing && b.bufferedRequest && N(this, b));
  }, E.prototype.setDefaultEncoding = function(S) {
    if (typeof S == "string" && (S = S.toLowerCase()), !(["hex", "utf8", "utf-8", "ascii", "binary", "base64", "ucs2", "ucs-2", "utf16le", "utf-16le", "raw"].indexOf((S + "").toLowerCase()) > -1)) throw new TypeError("Unknown encoding: " + S);
    return this._writableState.defaultEncoding = S, this;
  };
  function h(b, S, D) {
    return !b.objectMode && b.decodeStrings !== !1 && typeof S == "string" && (S = f.from(S, D)), S;
  }
  Object.defineProperty(E.prototype, "writableHighWaterMark", {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: !1,
    get: function() {
      return this._writableState.highWaterMark;
    }
  });
  function O(b, S, D, k, W, G) {
    if (!D) {
      var ie = h(S, k, W);
      k !== ie && (D = !0, W = "buffer", k = ie);
    }
    var fe = S.objectMode ? 1 : k.length;
    S.length += fe;
    var pe = S.length < S.highWaterMark;
    if (pe || (S.needDrain = !0), S.writing || S.corked) {
      var F = S.lastBufferedRequest;
      S.lastBufferedRequest = {
        chunk: k,
        encoding: W,
        isBuf: D,
        callback: G,
        next: null
      }, F ? F.next = S.lastBufferedRequest : S.bufferedRequest = S.lastBufferedRequest, S.bufferedRequestCount += 1;
    } else
      m(b, S, !1, fe, k, W, G);
    return pe;
  }
  function m(b, S, D, k, W, G, ie) {
    S.writelen = k, S.writecb = ie, S.writing = !0, S.sync = !0, D ? b._writev(W, S.onwrite) : b._write(W, G, S.onwrite), S.sync = !1;
  }
  function x(b, S, D, k, W) {
    --S.pendingcb, D ? (e.nextTick(W, k), e.nextTick(H, b, S), b._writableState.errorEmitted = !0, b.emit("error", k)) : (W(k), b._writableState.errorEmitted = !0, b.emit("error", k), H(b, S));
  }
  function P(b) {
    b.writing = !1, b.writecb = null, b.length -= b.writelen, b.writelen = 0;
  }
  function C(b, S) {
    var D = b._writableState, k = D.sync, W = D.writecb;
    if (P(D), S) x(b, D, k, S, W);
    else {
      var G = B(D);
      !G && !D.corked && !D.bufferProcessing && D.bufferedRequest && N(b, D), k ? r(T, b, D, G, W) : T(b, D, G, W);
    }
  }
  function T(b, S, D, k) {
    D || M(b, S), S.pendingcb--, k(), H(b, S);
  }
  function M(b, S) {
    S.length === 0 && S.needDrain && (S.needDrain = !1, b.emit("drain"));
  }
  function N(b, S) {
    S.bufferProcessing = !0;
    var D = S.bufferedRequest;
    if (b._writev && D && D.next) {
      var k = S.bufferedRequestCount, W = new Array(k), G = S.corkedRequestsFree;
      G.entry = D;
      for (var ie = 0, fe = !0; D; )
        W[ie] = D, D.isBuf || (fe = !1), D = D.next, ie += 1;
      W.allBuffers = fe, m(b, S, !0, S.length, W, "", G.finish), S.pendingcb++, S.lastBufferedRequest = null, G.next ? (S.corkedRequestsFree = G.next, G.next = null) : S.corkedRequestsFree = new t(S), S.bufferedRequestCount = 0;
    } else {
      for (; D; ) {
        var pe = D.chunk, F = D.encoding, o = D.callback, l = S.objectMode ? 1 : pe.length;
        if (m(b, S, !1, l, pe, F, o), D = D.next, S.bufferedRequestCount--, S.writing)
          break;
      }
      D === null && (S.lastBufferedRequest = null);
    }
    S.bufferedRequest = D, S.bufferProcessing = !1;
  }
  E.prototype._write = function(b, S, D) {
    D(new Error("_write() is not implemented"));
  }, E.prototype._writev = null, E.prototype.end = function(b, S, D) {
    var k = this._writableState;
    typeof b == "function" ? (D = b, b = null, S = null) : typeof S == "function" && (D = S, S = null), b != null && this.write(b, S), k.corked && (k.corked = 1, this.uncork()), k.ending || V(this, k, D);
  };
  function B(b) {
    return b.ending && b.length === 0 && b.bufferedRequest === null && !b.finished && !b.writing;
  }
  function U(b, S) {
    b._final(function(D) {
      S.pendingcb--, D && b.emit("error", D), S.prefinished = !0, b.emit("prefinish"), H(b, S);
    });
  }
  function q(b, S) {
    !S.prefinished && !S.finalCalled && (typeof b._final == "function" ? (S.pendingcb++, S.finalCalled = !0, e.nextTick(U, b, S)) : (S.prefinished = !0, b.emit("prefinish")));
  }
  function H(b, S) {
    var D = B(S);
    return D && (q(b, S), S.pendingcb === 0 && (S.finished = !0, b.emit("finish"))), D;
  }
  function V(b, S, D) {
    S.ending = !0, H(b, S), D && (S.finished ? e.nextTick(D) : b.once("finish", D)), S.ended = !0, b.writable = !1;
  }
  function Y(b, S, D) {
    var k = b.entry;
    for (b.entry = null; k; ) {
      var W = k.callback;
      S.pendingcb--, W(D), k = k.next;
    }
    S.corkedRequestsFree.next = b;
  }
  return Object.defineProperty(E.prototype, "destroyed", {
    get: function() {
      return this._writableState === void 0 ? !1 : this._writableState.destroyed;
    },
    set: function(b) {
      this._writableState && (this._writableState.destroyed = b);
    }
  }), E.prototype.destroy = p.destroy, E.prototype._undestroy = p.undestroy, E.prototype._destroy = function(b, S) {
    this.end(), S(b);
  }, fi;
}
var ui, ks;
function Ht() {
  if (ks) return ui;
  ks = 1;
  var e = _t(), t = Object.keys || function(p) {
    var v = [];
    for (var R in p)
      v.push(R);
    return v;
  };
  ui = u;
  var r = Object.create(Ye());
  r.inherits = ye;
  var n = cu(), i = lu();
  r.inherits(u, n);
  for (var a = t(i.prototype), s = 0; s < a.length; s++) {
    var f = a[s];
    u.prototype[f] || (u.prototype[f] = i.prototype[f]);
  }
  function u(p) {
    if (!(this instanceof u)) return new u(p);
    n.call(this, p), i.call(this, p), p && p.readable === !1 && (this.readable = !1), p && p.writable === !1 && (this.writable = !1), this.allowHalfOpen = !0, p && p.allowHalfOpen === !1 && (this.allowHalfOpen = !1), this.once("end", d);
  }
  Object.defineProperty(u.prototype, "writableHighWaterMark", {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: !1,
    get: function() {
      return this._writableState.highWaterMark;
    }
  });
  function d() {
    this.allowHalfOpen || this._writableState.ended || e.nextTick(g, this);
  }
  function g(p) {
    p.end();
  }
  return Object.defineProperty(u.prototype, "destroyed", {
    get: function() {
      return this._readableState === void 0 || this._writableState === void 0 ? !1 : this._readableState.destroyed && this._writableState.destroyed;
    },
    set: function(p) {
      this._readableState === void 0 || this._writableState === void 0 || (this._readableState.destroyed = p, this._writableState.destroyed = p);
    }
  }), u.prototype._destroy = function(p, v) {
    this.push(null), this.end(), e.nextTick(v, p);
  }, ui;
}
var li = {}, Us;
function qs() {
  if (Us) return li;
  Us = 1;
  var e = Rn().Buffer, t = e.isEncoding || function(c) {
    switch (c = "" + c, c && c.toLowerCase()) {
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
        return !0;
      default:
        return !1;
    }
  };
  function r(c) {
    if (!c) return "utf8";
    for (var h; ; )
      switch (c) {
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
          return c;
        default:
          if (h) return;
          c = ("" + c).toLowerCase(), h = !0;
      }
  }
  function n(c) {
    var h = r(c);
    if (typeof h != "string" && (e.isEncoding === t || !t(c))) throw new Error("Unknown encoding: " + c);
    return h || c;
  }
  li.StringDecoder = i;
  function i(c) {
    this.encoding = n(c);
    var h;
    switch (this.encoding) {
      case "utf16le":
        this.text = p, this.end = v, h = 4;
        break;
      case "utf8":
        this.fillLast = u, h = 4;
        break;
      case "base64":
        this.text = R, this.end = A, h = 3;
        break;
      default:
        this.write = E, this.end = L;
        return;
    }
    this.lastNeed = 0, this.lastTotal = 0, this.lastChar = e.allocUnsafe(h);
  }
  i.prototype.write = function(c) {
    if (c.length === 0) return "";
    var h, O;
    if (this.lastNeed) {
      if (h = this.fillLast(c), h === void 0) return "";
      O = this.lastNeed, this.lastNeed = 0;
    } else
      O = 0;
    return O < c.length ? h ? h + this.text(c, O) : this.text(c, O) : h || "";
  }, i.prototype.end = g, i.prototype.text = d, i.prototype.fillLast = function(c) {
    if (this.lastNeed <= c.length)
      return c.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, this.lastNeed), this.lastChar.toString(this.encoding, 0, this.lastTotal);
    c.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, c.length), this.lastNeed -= c.length;
  };
  function a(c) {
    return c <= 127 ? 0 : c >> 5 === 6 ? 2 : c >> 4 === 14 ? 3 : c >> 3 === 30 ? 4 : c >> 6 === 2 ? -1 : -2;
  }
  function s(c, h, O) {
    var m = h.length - 1;
    if (m < O) return 0;
    var x = a(h[m]);
    return x >= 0 ? (x > 0 && (c.lastNeed = x - 1), x) : --m < O || x === -2 ? 0 : (x = a(h[m]), x >= 0 ? (x > 0 && (c.lastNeed = x - 2), x) : --m < O || x === -2 ? 0 : (x = a(h[m]), x >= 0 ? (x > 0 && (x === 2 ? x = 0 : c.lastNeed = x - 3), x) : 0));
  }
  function f(c, h, O) {
    if ((h[0] & 192) !== 128)
      return c.lastNeed = 0, "�";
    if (c.lastNeed > 1 && h.length > 1) {
      if ((h[1] & 192) !== 128)
        return c.lastNeed = 1, "�";
      if (c.lastNeed > 2 && h.length > 2 && (h[2] & 192) !== 128)
        return c.lastNeed = 2, "�";
    }
  }
  function u(c) {
    var h = this.lastTotal - this.lastNeed, O = f(this, c);
    if (O !== void 0) return O;
    if (this.lastNeed <= c.length)
      return c.copy(this.lastChar, h, 0, this.lastNeed), this.lastChar.toString(this.encoding, 0, this.lastTotal);
    c.copy(this.lastChar, h, 0, c.length), this.lastNeed -= c.length;
  }
  function d(c, h) {
    var O = s(this, c, h);
    if (!this.lastNeed) return c.toString("utf8", h);
    this.lastTotal = O;
    var m = c.length - (O - this.lastNeed);
    return c.copy(this.lastChar, 0, m), c.toString("utf8", h, m);
  }
  function g(c) {
    var h = c && c.length ? this.write(c) : "";
    return this.lastNeed ? h + "�" : h;
  }
  function p(c, h) {
    if ((c.length - h) % 2 === 0) {
      var O = c.toString("utf16le", h);
      if (O) {
        var m = O.charCodeAt(O.length - 1);
        if (m >= 55296 && m <= 56319)
          return this.lastNeed = 2, this.lastTotal = 4, this.lastChar[0] = c[c.length - 2], this.lastChar[1] = c[c.length - 1], O.slice(0, -1);
      }
      return O;
    }
    return this.lastNeed = 1, this.lastTotal = 2, this.lastChar[0] = c[c.length - 1], c.toString("utf16le", h, c.length - 1);
  }
  function v(c) {
    var h = c && c.length ? this.write(c) : "";
    if (this.lastNeed) {
      var O = this.lastTotal - this.lastNeed;
      return h + this.lastChar.toString("utf16le", 0, O);
    }
    return h;
  }
  function R(c, h) {
    var O = (c.length - h) % 3;
    return O === 0 ? c.toString("base64", h) : (this.lastNeed = 3 - O, this.lastTotal = 3, O === 1 ? this.lastChar[0] = c[c.length - 1] : (this.lastChar[0] = c[c.length - 2], this.lastChar[1] = c[c.length - 1]), c.toString("base64", h, c.length - O));
  }
  function A(c) {
    var h = c && c.length ? this.write(c) : "";
    return this.lastNeed ? h + this.lastChar.toString("base64", 0, 3 - this.lastNeed) : h;
  }
  function E(c) {
    return c.toString(this.encoding);
  }
  function L(c) {
    return c && c.length ? this.write(c) : "";
  }
  return li;
}
var ci, zs;
function cu() {
  if (zs) return ci;
  zs = 1;
  var e = _t();
  ci = h;
  var t = Vf(), r;
  h.ReadableState = c, wr.EventEmitter;
  var n = function(o, l) {
    return o.listeners(l).length;
  }, i = fu(), a = Rn().Buffer, s = (typeof oe < "u" ? oe : typeof window < "u" ? window : typeof self < "u" ? self : {}).Uint8Array || function() {
  };
  function f(o) {
    return a.from(o);
  }
  function u(o) {
    return a.isBuffer(o) || o instanceof s;
  }
  var d = Object.create(Ye());
  d.inherits = ye;
  var g = Ee, p = void 0;
  g && g.debuglog ? p = g.debuglog("stream") : p = function() {
  };
  var v = Nd(), R = uu(), A;
  d.inherits(h, i);
  var E = ["error", "close", "destroy", "pause", "resume"];
  function L(o, l, $) {
    if (typeof o.prependListener == "function") return o.prependListener(l, $);
    !o._events || !o._events[l] ? o.on(l, $) : t(o._events[l]) ? o._events[l].unshift($) : o._events[l] = [$, o._events[l]];
  }
  function c(o, l) {
    r = r || Ht(), o = o || {};
    var $ = l instanceof r;
    this.objectMode = !!o.objectMode, $ && (this.objectMode = this.objectMode || !!o.readableObjectMode);
    var I = o.highWaterMark, w = o.readableHighWaterMark, y = this.objectMode ? 16 : 16 * 1024;
    I || I === 0 ? this.highWaterMark = I : $ && (w || w === 0) ? this.highWaterMark = w : this.highWaterMark = y, this.highWaterMark = Math.floor(this.highWaterMark), this.buffer = new v(), this.length = 0, this.pipes = null, this.pipesCount = 0, this.flowing = null, this.ended = !1, this.endEmitted = !1, this.reading = !1, this.sync = !0, this.needReadable = !1, this.emittedReadable = !1, this.readableListening = !1, this.resumeScheduled = !1, this.destroyed = !1, this.defaultEncoding = o.defaultEncoding || "utf8", this.awaitDrain = 0, this.readingMore = !1, this.decoder = null, this.encoding = null, o.encoding && (A || (A = qs().StringDecoder), this.decoder = new A(o.encoding), this.encoding = o.encoding);
  }
  function h(o) {
    if (r = r || Ht(), !(this instanceof h)) return new h(o);
    this._readableState = new c(o, this), this.readable = !0, o && (typeof o.read == "function" && (this._read = o.read), typeof o.destroy == "function" && (this._destroy = o.destroy)), i.call(this);
  }
  Object.defineProperty(h.prototype, "destroyed", {
    get: function() {
      return this._readableState === void 0 ? !1 : this._readableState.destroyed;
    },
    set: function(o) {
      this._readableState && (this._readableState.destroyed = o);
    }
  }), h.prototype.destroy = R.destroy, h.prototype._undestroy = R.undestroy, h.prototype._destroy = function(o, l) {
    this.push(null), l(o);
  }, h.prototype.push = function(o, l) {
    var $ = this._readableState, I;
    return $.objectMode ? I = !0 : typeof o == "string" && (l = l || $.defaultEncoding, l !== $.encoding && (o = a.from(o, l), l = ""), I = !0), O(this, o, l, !1, I);
  }, h.prototype.unshift = function(o) {
    return O(this, o, null, !0, !1);
  };
  function O(o, l, $, I, w) {
    var y = o._readableState;
    if (l === null)
      y.reading = !1, N(o, y);
    else {
      var j;
      w || (j = x(y, l)), j ? o.emit("error", j) : y.objectMode || l && l.length > 0 ? (typeof l != "string" && !y.objectMode && Object.getPrototypeOf(l) !== a.prototype && (l = f(l)), I ? y.endEmitted ? o.emit("error", new Error("stream.unshift() after end event")) : m(o, y, l, !0) : y.ended ? o.emit("error", new Error("stream.push() after EOF")) : (y.reading = !1, y.decoder && !$ ? (l = y.decoder.write(l), y.objectMode || l.length !== 0 ? m(o, y, l, !1) : q(o, y)) : m(o, y, l, !1))) : I || (y.reading = !1);
    }
    return P(y);
  }
  function m(o, l, $, I) {
    l.flowing && l.length === 0 && !l.sync ? (o.emit("data", $), o.read(0)) : (l.length += l.objectMode ? 1 : $.length, I ? l.buffer.unshift($) : l.buffer.push($), l.needReadable && B(o)), q(o, l);
  }
  function x(o, l) {
    var $;
    return !u(l) && typeof l != "string" && l !== void 0 && !o.objectMode && ($ = new TypeError("Invalid non-string/buffer chunk")), $;
  }
  function P(o) {
    return !o.ended && (o.needReadable || o.length < o.highWaterMark || o.length === 0);
  }
  h.prototype.isPaused = function() {
    return this._readableState.flowing === !1;
  }, h.prototype.setEncoding = function(o) {
    return A || (A = qs().StringDecoder), this._readableState.decoder = new A(o), this._readableState.encoding = o, this;
  };
  var C = 8388608;
  function T(o) {
    return o >= C ? o = C : (o--, o |= o >>> 1, o |= o >>> 2, o |= o >>> 4, o |= o >>> 8, o |= o >>> 16, o++), o;
  }
  function M(o, l) {
    return o <= 0 || l.length === 0 && l.ended ? 0 : l.objectMode ? 1 : o !== o ? l.flowing && l.length ? l.buffer.head.data.length : l.length : (o > l.highWaterMark && (l.highWaterMark = T(o)), o <= l.length ? o : l.ended ? l.length : (l.needReadable = !0, 0));
  }
  h.prototype.read = function(o) {
    p("read", o), o = parseInt(o, 10);
    var l = this._readableState, $ = o;
    if (o !== 0 && (l.emittedReadable = !1), o === 0 && l.needReadable && (l.length >= l.highWaterMark || l.ended))
      return p("read: emitReadable", l.length, l.ended), l.length === 0 && l.ended ? fe(this) : B(this), null;
    if (o = M(o, l), o === 0 && l.ended)
      return l.length === 0 && fe(this), null;
    var I = l.needReadable;
    p("need readable", I), (l.length === 0 || l.length - o < l.highWaterMark) && (I = !0, p("length less than watermark", I)), l.ended || l.reading ? (I = !1, p("reading or ended", I)) : I && (p("do read"), l.reading = !0, l.sync = !0, l.length === 0 && (l.needReadable = !0), this._read(l.highWaterMark), l.sync = !1, l.reading || (o = M($, l)));
    var w;
    return o > 0 ? w = k(o, l) : w = null, w === null ? (l.needReadable = !0, o = 0) : l.length -= o, l.length === 0 && (l.ended || (l.needReadable = !0), $ !== o && l.ended && fe(this)), w !== null && this.emit("data", w), w;
  };
  function N(o, l) {
    if (!l.ended) {
      if (l.decoder) {
        var $ = l.decoder.end();
        $ && $.length && (l.buffer.push($), l.length += l.objectMode ? 1 : $.length);
      }
      l.ended = !0, B(o);
    }
  }
  function B(o) {
    var l = o._readableState;
    l.needReadable = !1, l.emittedReadable || (p("emitReadable", l.flowing), l.emittedReadable = !0, l.sync ? e.nextTick(U, o) : U(o));
  }
  function U(o) {
    p("emit readable"), o.emit("readable"), D(o);
  }
  function q(o, l) {
    l.readingMore || (l.readingMore = !0, e.nextTick(H, o, l));
  }
  function H(o, l) {
    for (var $ = l.length; !l.reading && !l.flowing && !l.ended && l.length < l.highWaterMark && (p("maybeReadMore read 0"), o.read(0), $ !== l.length); )
      $ = l.length;
    l.readingMore = !1;
  }
  h.prototype._read = function(o) {
    this.emit("error", new Error("_read() is not implemented"));
  }, h.prototype.pipe = function(o, l) {
    var $ = this, I = this._readableState;
    switch (I.pipesCount) {
      case 0:
        I.pipes = o;
        break;
      case 1:
        I.pipes = [I.pipes, o];
        break;
      default:
        I.pipes.push(o);
        break;
    }
    I.pipesCount += 1, p("pipe count=%d opts=%j", I.pipesCount, l);
    var w = (!l || l.end !== !1) && o !== process.stdout && o !== process.stderr, y = w ? z : Oe;
    I.endEmitted ? e.nextTick(y) : $.once("end", y), o.on("unpipe", j);
    function j(me, Re) {
      p("onunpipe"), me === $ && Re && Re.hasUnpiped === !1 && (Re.hasUnpiped = !0, se());
    }
    function z() {
      p("onend"), o.end();
    }
    var ae = V($);
    o.on("drain", ae);
    var Q = !1;
    function se() {
      p("cleanup"), o.removeListener("close", Qe), o.removeListener("finish", We), o.removeListener("drain", ae), o.removeListener("error", ze), o.removeListener("unpipe", j), $.removeListener("end", z), $.removeListener("end", Oe), $.removeListener("data", qe), Q = !0, I.awaitDrain && (!o._writableState || o._writableState.needDrain) && ae();
    }
    var Le = !1;
    $.on("data", qe);
    function qe(me) {
      p("ondata"), Le = !1;
      var Re = o.write(me);
      Re === !1 && !Le && ((I.pipesCount === 1 && I.pipes === o || I.pipesCount > 1 && F(I.pipes, o) !== -1) && !Q && (p("false write response, pause", I.awaitDrain), I.awaitDrain++, Le = !0), $.pause());
    }
    function ze(me) {
      p("onerror", me), Oe(), o.removeListener("error", ze), n(o, "error") === 0 && o.emit("error", me);
    }
    L(o, "error", ze);
    function Qe() {
      o.removeListener("finish", We), Oe();
    }
    o.once("close", Qe);
    function We() {
      p("onfinish"), o.removeListener("close", Qe), Oe();
    }
    o.once("finish", We);
    function Oe() {
      p("unpipe"), $.unpipe(o);
    }
    return o.emit("pipe", $), I.flowing || (p("pipe resume"), $.resume()), o;
  };
  function V(o) {
    return function() {
      var l = o._readableState;
      p("pipeOnDrain", l.awaitDrain), l.awaitDrain && l.awaitDrain--, l.awaitDrain === 0 && n(o, "data") && (l.flowing = !0, D(o));
    };
  }
  h.prototype.unpipe = function(o) {
    var l = this._readableState, $ = { hasUnpiped: !1 };
    if (l.pipesCount === 0) return this;
    if (l.pipesCount === 1)
      return o && o !== l.pipes ? this : (o || (o = l.pipes), l.pipes = null, l.pipesCount = 0, l.flowing = !1, o && o.emit("unpipe", this, $), this);
    if (!o) {
      var I = l.pipes, w = l.pipesCount;
      l.pipes = null, l.pipesCount = 0, l.flowing = !1;
      for (var y = 0; y < w; y++)
        I[y].emit("unpipe", this, { hasUnpiped: !1 });
      return this;
    }
    var j = F(l.pipes, o);
    return j === -1 ? this : (l.pipes.splice(j, 1), l.pipesCount -= 1, l.pipesCount === 1 && (l.pipes = l.pipes[0]), o.emit("unpipe", this, $), this);
  }, h.prototype.on = function(o, l) {
    var $ = i.prototype.on.call(this, o, l);
    if (o === "data")
      this._readableState.flowing !== !1 && this.resume();
    else if (o === "readable") {
      var I = this._readableState;
      !I.endEmitted && !I.readableListening && (I.readableListening = I.needReadable = !0, I.emittedReadable = !1, I.reading ? I.length && B(this) : e.nextTick(Y, this));
    }
    return $;
  }, h.prototype.addListener = h.prototype.on;
  function Y(o) {
    p("readable nexttick read 0"), o.read(0);
  }
  h.prototype.resume = function() {
    var o = this._readableState;
    return o.flowing || (p("resume"), o.flowing = !0, b(this, o)), this;
  };
  function b(o, l) {
    l.resumeScheduled || (l.resumeScheduled = !0, e.nextTick(S, o, l));
  }
  function S(o, l) {
    l.reading || (p("resume read 0"), o.read(0)), l.resumeScheduled = !1, l.awaitDrain = 0, o.emit("resume"), D(o), l.flowing && !l.reading && o.read(0);
  }
  h.prototype.pause = function() {
    return p("call pause flowing=%j", this._readableState.flowing), this._readableState.flowing !== !1 && (p("pause"), this._readableState.flowing = !1, this.emit("pause")), this;
  };
  function D(o) {
    var l = o._readableState;
    for (p("flow", l.flowing); l.flowing && o.read() !== null; )
      ;
  }
  h.prototype.wrap = function(o) {
    var l = this, $ = this._readableState, I = !1;
    o.on("end", function() {
      if (p("wrapped end"), $.decoder && !$.ended) {
        var j = $.decoder.end();
        j && j.length && l.push(j);
      }
      l.push(null);
    }), o.on("data", function(j) {
      if (p("wrapped data"), $.decoder && (j = $.decoder.write(j)), !($.objectMode && j == null) && !(!$.objectMode && (!j || !j.length))) {
        var z = l.push(j);
        z || (I = !0, o.pause());
      }
    });
    for (var w in o)
      this[w] === void 0 && typeof o[w] == "function" && (this[w] = /* @__PURE__ */ function(j) {
        return function() {
          return o[j].apply(o, arguments);
        };
      }(w));
    for (var y = 0; y < E.length; y++)
      o.on(E[y], this.emit.bind(this, E[y]));
    return this._read = function(j) {
      p("wrapped _read", j), I && (I = !1, o.resume());
    }, this;
  }, Object.defineProperty(h.prototype, "readableHighWaterMark", {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: !1,
    get: function() {
      return this._readableState.highWaterMark;
    }
  }), h._fromList = k;
  function k(o, l) {
    if (l.length === 0) return null;
    var $;
    return l.objectMode ? $ = l.buffer.shift() : !o || o >= l.length ? (l.decoder ? $ = l.buffer.join("") : l.buffer.length === 1 ? $ = l.buffer.head.data : $ = l.buffer.concat(l.length), l.buffer.clear()) : $ = W(o, l.buffer, l.decoder), $;
  }
  function W(o, l, $) {
    var I;
    return o < l.head.data.length ? (I = l.head.data.slice(0, o), l.head.data = l.head.data.slice(o)) : o === l.head.data.length ? I = l.shift() : I = $ ? G(o, l) : ie(o, l), I;
  }
  function G(o, l) {
    var $ = l.head, I = 1, w = $.data;
    for (o -= w.length; $ = $.next; ) {
      var y = $.data, j = o > y.length ? y.length : o;
      if (j === y.length ? w += y : w += y.slice(0, o), o -= j, o === 0) {
        j === y.length ? (++I, $.next ? l.head = $.next : l.head = l.tail = null) : (l.head = $, $.data = y.slice(j));
        break;
      }
      ++I;
    }
    return l.length -= I, w;
  }
  function ie(o, l) {
    var $ = a.allocUnsafe(o), I = l.head, w = 1;
    for (I.data.copy($), o -= I.data.length; I = I.next; ) {
      var y = I.data, j = o > y.length ? y.length : o;
      if (y.copy($, $.length - o, 0, j), o -= j, o === 0) {
        j === y.length ? (++w, I.next ? l.head = I.next : l.head = l.tail = null) : (l.head = I, I.data = y.slice(j));
        break;
      }
      ++w;
    }
    return l.length -= w, $;
  }
  function fe(o) {
    var l = o._readableState;
    if (l.length > 0) throw new Error('"endReadable()" called on non-empty stream');
    l.endEmitted || (l.ended = !0, e.nextTick(pe, l, o));
  }
  function pe(o, l) {
    !o.endEmitted && o.length === 0 && (o.endEmitted = !0, l.readable = !1, l.emit("end"));
  }
  function F(o, l) {
    for (var $ = 0, I = o.length; $ < I; $++)
      if (o[$] === l) return $;
    return -1;
  }
  return ci;
}
var hi, Ws;
function hu() {
  if (Ws) return hi;
  Ws = 1, hi = n;
  var e = Ht(), t = Object.create(Ye());
  t.inherits = ye, t.inherits(n, e);
  function r(s, f) {
    var u = this._transformState;
    u.transforming = !1;
    var d = u.writecb;
    if (!d)
      return this.emit("error", new Error("write callback called multiple times"));
    u.writechunk = null, u.writecb = null, f != null && this.push(f), d(s);
    var g = this._readableState;
    g.reading = !1, (g.needReadable || g.length < g.highWaterMark) && this._read(g.highWaterMark);
  }
  function n(s) {
    if (!(this instanceof n)) return new n(s);
    e.call(this, s), this._transformState = {
      afterTransform: r.bind(this),
      needTransform: !1,
      transforming: !1,
      writecb: null,
      writechunk: null,
      writeencoding: null
    }, this._readableState.needReadable = !0, this._readableState.sync = !1, s && (typeof s.transform == "function" && (this._transform = s.transform), typeof s.flush == "function" && (this._flush = s.flush)), this.on("prefinish", i);
  }
  function i() {
    var s = this;
    typeof this._flush == "function" ? this._flush(function(f, u) {
      a(s, f, u);
    }) : a(this, null, null);
  }
  n.prototype.push = function(s, f) {
    return this._transformState.needTransform = !1, e.prototype.push.call(this, s, f);
  }, n.prototype._transform = function(s, f, u) {
    throw new Error("_transform() is not implemented");
  }, n.prototype._write = function(s, f, u) {
    var d = this._transformState;
    if (d.writecb = u, d.writechunk = s, d.writeencoding = f, !d.transforming) {
      var g = this._readableState;
      (d.needTransform || g.needReadable || g.length < g.highWaterMark) && this._read(g.highWaterMark);
    }
  }, n.prototype._read = function(s) {
    var f = this._transformState;
    f.writechunk !== null && f.writecb && !f.transforming ? (f.transforming = !0, this._transform(f.writechunk, f.writeencoding, f.afterTransform)) : f.needTransform = !0;
  }, n.prototype._destroy = function(s, f) {
    var u = this;
    e.prototype._destroy.call(this, s, function(d) {
      f(d), u.emit("close");
    });
  };
  function a(s, f, u) {
    if (f) return s.emit("error", f);
    if (u != null && s.push(u), s._writableState.length) throw new Error("Calling transform done when ws.length != 0");
    if (s._transformState.transforming) throw new Error("Calling transform done when still transforming");
    return s.push(null);
  }
  return hi;
}
var di, Gs;
function jd() {
  if (Gs) return di;
  Gs = 1, di = r;
  var e = hu(), t = Object.create(Ye());
  t.inherits = ye, t.inherits(r, e);
  function r(n) {
    if (!(this instanceof r)) return new r(n);
    e.call(this, n);
  }
  return r.prototype._transform = function(n, i, a) {
    a(null, n);
  }, di;
}
(function(e, t) {
  var r = Ze;
  process.env.READABLE_STREAM === "disable" && r ? (e.exports = r, t = e.exports = r.Readable, t.Readable = r.Readable, t.Writable = r.Writable, t.Duplex = r.Duplex, t.Transform = r.Transform, t.PassThrough = r.PassThrough, t.Stream = r) : (t = e.exports = cu(), t.Stream = r || t, t.Readable = t, t.Writable = lu(), t.Duplex = Ht(), t.Transform = hu(), t.PassThrough = jd());
})(Zi, Zi.exports);
var Bd = Zi.exports, du = { exports: {} }, Fd = 9007199254740991, kd = "[object Arguments]", Ud = "[object Function]", qd = "[object GeneratorFunction]", zd = typeof oe == "object" && oe && oe.Object === Object && oe, Wd = typeof self == "object" && self && self.Object === Object && self, Gd = zd || Wd || Function("return this")();
function Hd(e, t) {
  for (var r = -1, n = t.length, i = e.length; ++r < n; )
    e[i + r] = t[r];
  return e;
}
var $a = Object.prototype, Vd = $a.hasOwnProperty, pu = $a.toString, Hs = Gd.Symbol, Zd = $a.propertyIsEnumerable, Vs = Hs ? Hs.isConcatSpreadable : void 0;
function Yd(e, t, r, n, i) {
  var a = -1, s = e.length;
  for (r || (r = Qd), i || (i = []); ++a < s; ) {
    var f = e[a];
    r(f) ? Hd(i, f) : i[i.length] = f;
  }
  return i;
}
function Qd(e) {
  return Jd(e) || Xd(e) || !!(Vs && e && e[Vs]);
}
function Kd(e) {
  var t = e ? e.length : 0;
  return t ? Yd(e) : [];
}
function Xd(e) {
  return tp(e) && Vd.call(e, "callee") && (!Zd.call(e, "callee") || pu.call(e) == kd);
}
var Jd = Array.isArray;
function ep(e) {
  return e != null && np(e.length) && !rp(e);
}
function tp(e) {
  return ap(e) && ep(e);
}
function rp(e) {
  var t = ip(e) ? pu.call(e) : "";
  return t == Ud || t == qd;
}
function np(e) {
  return typeof e == "number" && e > -1 && e % 1 == 0 && e <= Fd;
}
function ip(e) {
  var t = typeof e;
  return !!e && (t == "object" || t == "function");
}
function ap(e) {
  return !!e && typeof e == "object";
}
var gu = Kd, sp = 200, Ma = "__lodash_hash_undefined__", op = 9007199254740991, fp = "[object Arguments]", up = "[object Function]", lp = "[object GeneratorFunction]", cp = /[\\^$.*+?()[\]{}|]/g, hp = /^\[object .+?Constructor\]$/, dp = typeof oe == "object" && oe && oe.Object === Object && oe, pp = typeof self == "object" && self && self.Object === Object && self, Da = dp || pp || Function("return this")();
function gp(e, t, r) {
  switch (r.length) {
    case 0:
      return e.call(t);
    case 1:
      return e.call(t, r[0]);
    case 2:
      return e.call(t, r[0], r[1]);
    case 3:
      return e.call(t, r[0], r[1], r[2]);
  }
  return e.apply(t, r);
}
function vp(e, t) {
  var r = e ? e.length : 0;
  return !!r && _p(e, t, 0) > -1;
}
function yp(e, t) {
  for (var r = -1, n = t.length, i = e.length; ++r < n; )
    e[i + r] = t[r];
  return e;
}
function mp(e, t, r, n) {
  for (var i = e.length, a = r + -1; ++a < i; )
    if (t(e[a], a, e))
      return a;
  return -1;
}
function _p(e, t, r) {
  if (t !== t)
    return mp(e, bp, r);
  for (var n = r - 1, i = e.length; ++n < i; )
    if (e[n] === t)
      return n;
  return -1;
}
function bp(e) {
  return e !== e;
}
function wp(e, t) {
  return e.has(t);
}
function Sp(e, t) {
  return e == null ? void 0 : e[t];
}
function Ep(e) {
  var t = !1;
  if (e != null && typeof e.toString != "function")
    try {
      t = !!(e + "");
    } catch {
    }
  return t;
}
var xp = Array.prototype, Op = Function.prototype, Pa = Object.prototype, pi = Da["__core-js_shared__"], Zs = function() {
  var e = /[^.]+$/.exec(pi && pi.keys && pi.keys.IE_PROTO || "");
  return e ? "Symbol(src)_1." + e : "";
}(), vu = Op.toString, Tn = Pa.hasOwnProperty, yu = Pa.toString, Rp = RegExp(
  "^" + vu.call(Tn).replace(cp, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$"
), Ys = Da.Symbol, Tp = Pa.propertyIsEnumerable, Ap = xp.splice, Qs = Ys ? Ys.isConcatSpreadable : void 0, Ks = Math.max, Lp = mu(Da, "Map"), gr = mu(Object, "create");
function Tt(e) {
  var t = -1, r = e ? e.length : 0;
  for (this.clear(); ++t < r; ) {
    var n = e[t];
    this.set(n[0], n[1]);
  }
}
function $p() {
  this.__data__ = gr ? gr(null) : {};
}
function Mp(e) {
  return this.has(e) && delete this.__data__[e];
}
function Dp(e) {
  var t = this.__data__;
  if (gr) {
    var r = t[e];
    return r === Ma ? void 0 : r;
  }
  return Tn.call(t, e) ? t[e] : void 0;
}
function Pp(e) {
  var t = this.__data__;
  return gr ? t[e] !== void 0 : Tn.call(t, e);
}
function Ip(e, t) {
  var r = this.__data__;
  return r[e] = gr && t === void 0 ? Ma : t, this;
}
Tt.prototype.clear = $p;
Tt.prototype.delete = Mp;
Tt.prototype.get = Dp;
Tt.prototype.has = Pp;
Tt.prototype.set = Ip;
function Kt(e) {
  var t = -1, r = e ? e.length : 0;
  for (this.clear(); ++t < r; ) {
    var n = e[t];
    this.set(n[0], n[1]);
  }
}
function Cp() {
  this.__data__ = [];
}
function Np(e) {
  var t = this.__data__, r = An(t, e);
  if (r < 0)
    return !1;
  var n = t.length - 1;
  return r == n ? t.pop() : Ap.call(t, r, 1), !0;
}
function jp(e) {
  var t = this.__data__, r = An(t, e);
  return r < 0 ? void 0 : t[r][1];
}
function Bp(e) {
  return An(this.__data__, e) > -1;
}
function Fp(e, t) {
  var r = this.__data__, n = An(r, e);
  return n < 0 ? r.push([e, t]) : r[n][1] = t, this;
}
Kt.prototype.clear = Cp;
Kt.prototype.delete = Np;
Kt.prototype.get = jp;
Kt.prototype.has = Bp;
Kt.prototype.set = Fp;
function Xt(e) {
  var t = -1, r = e ? e.length : 0;
  for (this.clear(); ++t < r; ) {
    var n = e[t];
    this.set(n[0], n[1]);
  }
}
function kp() {
  this.__data__ = {
    hash: new Tt(),
    map: new (Lp || Kt)(),
    string: new Tt()
  };
}
function Up(e) {
  return Ln(this, e).delete(e);
}
function qp(e) {
  return Ln(this, e).get(e);
}
function zp(e) {
  return Ln(this, e).has(e);
}
function Wp(e, t) {
  return Ln(this, e).set(e, t), this;
}
Xt.prototype.clear = kp;
Xt.prototype.delete = Up;
Xt.prototype.get = qp;
Xt.prototype.has = zp;
Xt.prototype.set = Wp;
function dn(e) {
  var t = -1, r = e ? e.length : 0;
  for (this.__data__ = new Xt(); ++t < r; )
    this.add(e[t]);
}
function Gp(e) {
  return this.__data__.set(e, Ma), this;
}
function Hp(e) {
  return this.__data__.has(e);
}
dn.prototype.add = dn.prototype.push = Gp;
dn.prototype.has = Hp;
function An(e, t) {
  for (var r = e.length; r--; )
    if (rg(e[r][0], t))
      return r;
  return -1;
}
function Vp(e, t, r, n) {
  var i = -1, a = vp, s = !0, f = e.length, u = [], d = t.length;
  if (!f)
    return u;
  t.length >= sp && (a = wp, s = !1, t = new dn(t));
  e:
    for (; ++i < f; ) {
      var g = e[i], p = g;
      if (g = g !== 0 ? g : 0, s && p === p) {
        for (var v = d; v--; )
          if (t[v] === p)
            continue e;
        u.push(g);
      } else a(t, p, n) || u.push(g);
    }
  return u;
}
function Zp(e, t, r, n, i) {
  var a = -1, s = e.length;
  for (r || (r = Kp), i || (i = []); ++a < s; ) {
    var f = e[a];
    r(f) && yp(i, f);
  }
  return i;
}
function Yp(e) {
  if (!bu(e) || Jp(e))
    return !1;
  var t = _u(e) || Ep(e) ? Rp : hp;
  return t.test(eg(e));
}
function Qp(e, t) {
  return t = Ks(t === void 0 ? e.length - 1 : t, 0), function() {
    for (var r = arguments, n = -1, i = Ks(r.length - t, 0), a = Array(i); ++n < i; )
      a[n] = r[t + n];
    n = -1;
    for (var s = Array(t + 1); ++n < t; )
      s[n] = r[n];
    return s[t] = a, gp(e, this, s);
  };
}
function Ln(e, t) {
  var r = e.__data__;
  return Xp(t) ? r[typeof t == "string" ? "string" : "hash"] : r.map;
}
function mu(e, t) {
  var r = Sp(e, t);
  return Yp(r) ? r : void 0;
}
function Kp(e) {
  return ig(e) || ng(e) || !!(Qs && e && e[Qs]);
}
function Xp(e) {
  var t = typeof e;
  return t == "string" || t == "number" || t == "symbol" || t == "boolean" ? e !== "__proto__" : e === null;
}
function Jp(e) {
  return !!Zs && Zs in e;
}
function eg(e) {
  if (e != null) {
    try {
      return vu.call(e);
    } catch {
    }
    try {
      return e + "";
    } catch {
    }
  }
  return "";
}
var tg = Qp(function(e, t) {
  return Yi(e) ? Vp(e, Zp(t, 1, Yi)) : [];
});
function rg(e, t) {
  return e === t || e !== e && t !== t;
}
function ng(e) {
  return Yi(e) && Tn.call(e, "callee") && (!Tp.call(e, "callee") || yu.call(e) == fp);
}
var ig = Array.isArray;
function ag(e) {
  return e != null && sg(e.length) && !_u(e);
}
function Yi(e) {
  return og(e) && ag(e);
}
function _u(e) {
  var t = bu(e) ? yu.call(e) : "";
  return t == up || t == lp;
}
function sg(e) {
  return typeof e == "number" && e > -1 && e % 1 == 0 && e <= op;
}
function bu(e) {
  var t = typeof e;
  return !!e && (t == "object" || t == "function");
}
function og(e) {
  return !!e && typeof e == "object";
}
var wu = tg, fg = 200, Ia = "__lodash_hash_undefined__", ug = 1 / 0, lg = 9007199254740991, cg = "[object Arguments]", hg = "[object Function]", dg = "[object GeneratorFunction]", pg = /[\\^$.*+?()[\]{}|]/g, gg = /^\[object .+?Constructor\]$/, vg = typeof oe == "object" && oe && oe.Object === Object && oe, yg = typeof self == "object" && self && self.Object === Object && self, $n = vg || yg || Function("return this")();
function mg(e, t, r) {
  switch (r.length) {
    case 0:
      return e.call(t);
    case 1:
      return e.call(t, r[0]);
    case 2:
      return e.call(t, r[0], r[1]);
    case 3:
      return e.call(t, r[0], r[1], r[2]);
  }
  return e.apply(t, r);
}
function _g(e, t) {
  var r = e ? e.length : 0;
  return !!r && Sg(e, t, 0) > -1;
}
function bg(e, t) {
  for (var r = -1, n = t.length, i = e.length; ++r < n; )
    e[i + r] = t[r];
  return e;
}
function wg(e, t, r, n) {
  for (var i = e.length, a = r + -1; ++a < i; )
    if (t(e[a], a, e))
      return a;
  return -1;
}
function Sg(e, t, r) {
  if (t !== t)
    return wg(e, Eg, r);
  for (var n = r - 1, i = e.length; ++n < i; )
    if (e[n] === t)
      return n;
  return -1;
}
function Eg(e) {
  return e !== e;
}
function xg(e, t) {
  return e.has(t);
}
function Og(e, t) {
  return e == null ? void 0 : e[t];
}
function Rg(e) {
  var t = !1;
  if (e != null && typeof e.toString != "function")
    try {
      t = !!(e + "");
    } catch {
    }
  return t;
}
function Su(e) {
  var t = -1, r = Array(e.size);
  return e.forEach(function(n) {
    r[++t] = n;
  }), r;
}
var Tg = Array.prototype, Ag = Function.prototype, Ca = Object.prototype, gi = $n["__core-js_shared__"], Xs = function() {
  var e = /[^.]+$/.exec(gi && gi.keys && gi.keys.IE_PROTO || "");
  return e ? "Symbol(src)_1." + e : "";
}(), Eu = Ag.toString, Mn = Ca.hasOwnProperty, xu = Ca.toString, Lg = RegExp(
  "^" + Eu.call(Mn).replace(pg, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$"
), Js = $n.Symbol, $g = Ca.propertyIsEnumerable, Mg = Tg.splice, eo = Js ? Js.isConcatSpreadable : void 0, to = Math.max, Dg = Na($n, "Map"), vi = Na($n, "Set"), vr = Na(Object, "create");
function At(e) {
  var t = -1, r = e ? e.length : 0;
  for (this.clear(); ++t < r; ) {
    var n = e[t];
    this.set(n[0], n[1]);
  }
}
function Pg() {
  this.__data__ = vr ? vr(null) : {};
}
function Ig(e) {
  return this.has(e) && delete this.__data__[e];
}
function Cg(e) {
  var t = this.__data__;
  if (vr) {
    var r = t[e];
    return r === Ia ? void 0 : r;
  }
  return Mn.call(t, e) ? t[e] : void 0;
}
function Ng(e) {
  var t = this.__data__;
  return vr ? t[e] !== void 0 : Mn.call(t, e);
}
function jg(e, t) {
  var r = this.__data__;
  return r[e] = vr && t === void 0 ? Ia : t, this;
}
At.prototype.clear = Pg;
At.prototype.delete = Ig;
At.prototype.get = Cg;
At.prototype.has = Ng;
At.prototype.set = jg;
function Jt(e) {
  var t = -1, r = e ? e.length : 0;
  for (this.clear(); ++t < r; ) {
    var n = e[t];
    this.set(n[0], n[1]);
  }
}
function Bg() {
  this.__data__ = [];
}
function Fg(e) {
  var t = this.__data__, r = Dn(t, e);
  if (r < 0)
    return !1;
  var n = t.length - 1;
  return r == n ? t.pop() : Mg.call(t, r, 1), !0;
}
function kg(e) {
  var t = this.__data__, r = Dn(t, e);
  return r < 0 ? void 0 : t[r][1];
}
function Ug(e) {
  return Dn(this.__data__, e) > -1;
}
function qg(e, t) {
  var r = this.__data__, n = Dn(r, e);
  return n < 0 ? r.push([e, t]) : r[n][1] = t, this;
}
Jt.prototype.clear = Bg;
Jt.prototype.delete = Fg;
Jt.prototype.get = kg;
Jt.prototype.has = Ug;
Jt.prototype.set = qg;
function er(e) {
  var t = -1, r = e ? e.length : 0;
  for (this.clear(); ++t < r; ) {
    var n = e[t];
    this.set(n[0], n[1]);
  }
}
function zg() {
  this.__data__ = {
    hash: new At(),
    map: new (Dg || Jt)(),
    string: new At()
  };
}
function Wg(e) {
  return Pn(this, e).delete(e);
}
function Gg(e) {
  return Pn(this, e).get(e);
}
function Hg(e) {
  return Pn(this, e).has(e);
}
function Vg(e, t) {
  return Pn(this, e).set(e, t), this;
}
er.prototype.clear = zg;
er.prototype.delete = Wg;
er.prototype.get = Gg;
er.prototype.has = Hg;
er.prototype.set = Vg;
function pn(e) {
  var t = -1, r = e ? e.length : 0;
  for (this.__data__ = new er(); ++t < r; )
    this.add(e[t]);
}
function Zg(e) {
  return this.__data__.set(e, Ia), this;
}
function Yg(e) {
  return this.__data__.has(e);
}
pn.prototype.add = pn.prototype.push = Zg;
pn.prototype.has = Yg;
function Dn(e, t) {
  for (var r = e.length; r--; )
    if (sv(e[r][0], t))
      return r;
  return -1;
}
function Qg(e, t, r, n, i) {
  var a = -1, s = e.length;
  for (r || (r = tv), i || (i = []); ++a < s; ) {
    var f = e[a];
    r(f) && bg(i, f);
  }
  return i;
}
function Kg(e) {
  if (!Tu(e) || nv(e))
    return !1;
  var t = Ru(e) || Rg(e) ? Lg : gg;
  return t.test(iv(e));
}
function Xg(e, t) {
  return t = to(t === void 0 ? e.length - 1 : t, 0), function() {
    for (var r = arguments, n = -1, i = to(r.length - t, 0), a = Array(i); ++n < i; )
      a[n] = r[t + n];
    n = -1;
    for (var s = Array(t + 1); ++n < t; )
      s[n] = r[n];
    return s[t] = a, mg(e, this, s);
  };
}
function Jg(e, t, r) {
  var n = -1, i = _g, a = e.length, s = !0, f = [], u = f;
  if (a >= fg) {
    var d = ev(e);
    if (d)
      return Su(d);
    s = !1, i = xg, u = new pn();
  } else
    u = f;
  e:
    for (; ++n < a; ) {
      var g = e[n], p = g;
      if (g = g !== 0 ? g : 0, s && p === p) {
        for (var v = u.length; v--; )
          if (u[v] === p)
            continue e;
        f.push(g);
      } else i(u, p, r) || (u !== f && u.push(p), f.push(g));
    }
  return f;
}
var ev = vi && 1 / Su(new vi([, -0]))[1] == ug ? function(e) {
  return new vi(e);
} : hv;
function Pn(e, t) {
  var r = e.__data__;
  return rv(t) ? r[typeof t == "string" ? "string" : "hash"] : r.map;
}
function Na(e, t) {
  var r = Og(e, t);
  return Kg(r) ? r : void 0;
}
function tv(e) {
  return fv(e) || ov(e) || !!(eo && e && e[eo]);
}
function rv(e) {
  var t = typeof e;
  return t == "string" || t == "number" || t == "symbol" || t == "boolean" ? e !== "__proto__" : e === null;
}
function nv(e) {
  return !!Xs && Xs in e;
}
function iv(e) {
  if (e != null) {
    try {
      return Eu.call(e);
    } catch {
    }
    try {
      return e + "";
    } catch {
    }
  }
  return "";
}
var av = Xg(function(e) {
  return Jg(Qg(e, 1, Ou));
});
function sv(e, t) {
  return e === t || e !== e && t !== t;
}
function ov(e) {
  return Ou(e) && Mn.call(e, "callee") && (!$g.call(e, "callee") || xu.call(e) == cg);
}
var fv = Array.isArray;
function uv(e) {
  return e != null && lv(e.length) && !Ru(e);
}
function Ou(e) {
  return cv(e) && uv(e);
}
function Ru(e) {
  var t = Tu(e) ? xu.call(e) : "";
  return t == hg || t == dg;
}
function lv(e) {
  return typeof e == "number" && e > -1 && e % 1 == 0 && e <= lg;
}
function Tu(e) {
  var t = typeof e;
  return !!e && (t == "object" || t == "function");
}
function cv(e) {
  return !!e && typeof e == "object";
}
function hv() {
}
var Au = av, dv = "[object Object]";
function pv(e) {
  var t = !1;
  if (e != null && typeof e.toString != "function")
    try {
      t = !!(e + "");
    } catch {
    }
  return t;
}
function gv(e, t) {
  return function(r) {
    return e(t(r));
  };
}
var vv = Function.prototype, Lu = Object.prototype, $u = vv.toString, yv = Lu.hasOwnProperty, mv = $u.call(Object), _v = Lu.toString, bv = gv(Object.getPrototypeOf, Object);
function wv(e) {
  return !!e && typeof e == "object";
}
function Sv(e) {
  if (!wv(e) || _v.call(e) != dv || pv(e))
    return !1;
  var t = bv(e);
  if (t === null)
    return !0;
  var r = yv.call(t, "constructor") && t.constructor;
  return typeof r == "function" && r instanceof r && $u.call(r) == mv;
}
var Mu = Sv, ja = {}, St = Ve, ht = process.platform === "win32", ut = Lt, Ev = process.env.NODE_DEBUG && /fs/.test(process.env.NODE_DEBUG);
function xv() {
  var e;
  if (Ev) {
    var t = new Error();
    e = r;
  } else
    e = n;
  return e;
  function r(i) {
    i && (t.message = i.message, i = t, n(i));
  }
  function n(i) {
    if (i) {
      if (process.throwDeprecation)
        throw i;
      if (!process.noDeprecation) {
        var a = "fs: missing callback " + (i.stack || i.message);
        process.traceDeprecation ? console.trace(a) : console.error(a);
      }
    }
  }
}
function Ov(e) {
  return typeof e == "function" ? e : xv();
}
St.normalize;
if (ht)
  var Et = /(.*?)(?:[\/\\]+|$)/g;
else
  var Et = /(.*?)(?:[\/]+|$)/g;
if (ht)
  var Ba = /^(?:[a-zA-Z]:|[\\\/]{2}[^\\\/]+[\\\/][^\\\/]+)?[\\\/]*/;
else
  var Ba = /^[\/]*/;
ja.realpathSync = function(t, r) {
  if (t = St.resolve(t), r && Object.prototype.hasOwnProperty.call(r, t))
    return r[t];
  var n = t, i = {}, a = {}, s, f, u, d;
  g();
  function g() {
    var L = Ba.exec(t);
    s = L[0].length, f = L[0], u = L[0], d = "", ht && !a[u] && (ut.lstatSync(u), a[u] = !0);
  }
  for (; s < t.length; ) {
    Et.lastIndex = s;
    var p = Et.exec(t);
    if (d = f, f += p[0], u = d + p[1], s = Et.lastIndex, !(a[u] || r && r[u] === u)) {
      var v;
      if (r && Object.prototype.hasOwnProperty.call(r, u))
        v = r[u];
      else {
        var R = ut.lstatSync(u);
        if (!R.isSymbolicLink()) {
          a[u] = !0, r && (r[u] = u);
          continue;
        }
        var A = null;
        if (!ht) {
          var E = R.dev.toString(32) + ":" + R.ino.toString(32);
          i.hasOwnProperty(E) && (A = i[E]);
        }
        A === null && (ut.statSync(u), A = ut.readlinkSync(u)), v = St.resolve(d, A), r && (r[u] = v), ht || (i[E] = A);
      }
      t = St.resolve(v, t.slice(s)), g();
    }
  }
  return r && (r[n] = t), t;
};
ja.realpath = function(t, r, n) {
  if (typeof n != "function" && (n = Ov(r), r = null), t = St.resolve(t), r && Object.prototype.hasOwnProperty.call(r, t))
    return process.nextTick(n.bind(null, null, r[t]));
  var i = t, a = {}, s = {}, f, u, d, g;
  p();
  function p() {
    var L = Ba.exec(t);
    f = L[0].length, u = L[0], d = L[0], g = "", ht && !s[d] ? ut.lstat(d, function(c) {
      if (c) return n(c);
      s[d] = !0, v();
    }) : process.nextTick(v);
  }
  function v() {
    if (f >= t.length)
      return r && (r[i] = t), n(null, t);
    Et.lastIndex = f;
    var L = Et.exec(t);
    return g = u, u += L[0], d = g + L[1], f = Et.lastIndex, s[d] || r && r[d] === d ? process.nextTick(v) : r && Object.prototype.hasOwnProperty.call(r, d) ? E(r[d]) : ut.lstat(d, R);
  }
  function R(L, c) {
    if (L) return n(L);
    if (!c.isSymbolicLink())
      return s[d] = !0, r && (r[d] = d), process.nextTick(v);
    if (!ht) {
      var h = c.dev.toString(32) + ":" + c.ino.toString(32);
      if (a.hasOwnProperty(h))
        return A(null, a[h], d);
    }
    ut.stat(d, function(O) {
      if (O) return n(O);
      ut.readlink(d, function(m, x) {
        ht || (a[h] = x), A(m, x);
      });
    });
  }
  function A(L, c, h) {
    if (L) return n(L);
    var O = St.resolve(g, c);
    r && (r[h] = O), E(O);
  }
  function E(L) {
    t = St.resolve(L, t.slice(f)), p();
  }
};
var Du = dt;
dt.realpath = dt;
dt.sync = Fa;
dt.realpathSync = Fa;
dt.monkeypatch = Tv;
dt.unmonkeypatch = Av;
var Vt = Lt, Qi = Vt.realpath, Ki = Vt.realpathSync, Rv = process.version, Pu = /^v[0-5]\./.test(Rv), Iu = ja;
function Cu(e) {
  return e && e.syscall === "realpath" && (e.code === "ELOOP" || e.code === "ENOMEM" || e.code === "ENAMETOOLONG");
}
function dt(e, t, r) {
  if (Pu)
    return Qi(e, t, r);
  typeof t == "function" && (r = t, t = null), Qi(e, t, function(n, i) {
    Cu(n) ? Iu.realpath(e, t, r) : r(n, i);
  });
}
function Fa(e, t) {
  if (Pu)
    return Ki(e, t);
  try {
    return Ki(e, t);
  } catch (r) {
    if (Cu(r))
      return Iu.realpathSync(e, t);
    throw r;
  }
}
function Tv() {
  Vt.realpath = dt, Vt.realpathSync = Fa;
}
function Av() {
  Vt.realpath = Qi, Vt.realpathSync = Ki;
}
var Lv = function(e, t) {
  for (var r = [], n = 0; n < e.length; n++) {
    var i = t(e[n], n);
    $v(i) ? r.push.apply(r, i) : r.push(i);
  }
  return r;
}, $v = Array.isArray || function(e) {
  return Object.prototype.toString.call(e) === "[object Array]";
}, Mv = Lv, Nu = No, Dv = Cv, ju = "\0SLASH" + Math.random() + "\0", Bu = "\0OPEN" + Math.random() + "\0", ka = "\0CLOSE" + Math.random() + "\0", Fu = "\0COMMA" + Math.random() + "\0", ku = "\0PERIOD" + Math.random() + "\0";
function yi(e) {
  return parseInt(e, 10) == e ? parseInt(e, 10) : e.charCodeAt(0);
}
function Pv(e) {
  return e.split("\\\\").join(ju).split("\\{").join(Bu).split("\\}").join(ka).split("\\,").join(Fu).split("\\.").join(ku);
}
function Iv(e) {
  return e.split(ju).join("\\").split(Bu).join("{").split(ka).join("}").split(Fu).join(",").split(ku).join(".");
}
function Uu(e) {
  if (!e)
    return [""];
  var t = [], r = Nu("{", "}", e);
  if (!r)
    return e.split(",");
  var n = r.pre, i = r.body, a = r.post, s = n.split(",");
  s[s.length - 1] += "{" + i + "}";
  var f = Uu(a);
  return a.length && (s[s.length - 1] += f.shift(), s.push.apply(s, f)), t.push.apply(t, s), t;
}
function Cv(e, t) {
  if (!e)
    return [];
  t = t || {};
  var r = t.max == null ? 1 / 0 : t.max;
  return e.substr(0, 2) === "{}" && (e = "\\{\\}" + e.substr(2)), sr(Pv(e), r, !0).map(Iv);
}
function Nv(e) {
  return "{" + e + "}";
}
function jv(e) {
  return /^-?0\d/.test(e);
}
function Bv(e, t) {
  return e <= t;
}
function Fv(e, t) {
  return e >= t;
}
function sr(e, t, r) {
  for (var n = []; ; ) {
    var i = Nu("{", "}", e);
    if (!i || /\$$/.test(i.pre)) return [e];
    var a = /^-?\d+\.\.-?\d+(?:\.\.-?\d+)?$/.test(i.body), s = /^[a-zA-Z]\.\.[a-zA-Z](?:\.\.-?\d+)?$/.test(i.body), f = a || s, u = i.body.indexOf(",") >= 0;
    if (!f && !u) {
      if (i.post.match(/,(?!,).*\}/)) {
        e = i.pre + "{" + i.body + ka + i.post, r = !0;
        continue;
      }
      return [e];
    }
    var d;
    if (f)
      d = i.body.split(/\.\./);
    else if (d = Uu(i.body), d.length === 1 && (d = sr(d[0], t, !1).map(Nv), d.length === 1)) {
      var p = i.post.length ? sr(i.post, t, !1) : [""];
      return p.map(function(U) {
        return i.pre + d[0] + U;
      });
    }
    var g = i.pre, p = i.post.length ? sr(i.post, t, !1) : [""], v;
    if (f) {
      var R = yi(d[0]), A = yi(d[1]), E = Math.max(d[0].length, d[1].length), L = d.length == 3 ? Math.max(Math.abs(yi(d[2])), 1) : 1, c = Bv, h = A < R;
      h && (L *= -1, c = Fv);
      var O = d.some(jv);
      v = [];
      for (var m = R; c(m, A) && v.length < t; m += L) {
        var x;
        if (s)
          x = String.fromCharCode(m), x === "\\" && (x = "");
        else if (x = String(m), O) {
          var P = E - x.length;
          if (P > 0) {
            var C = new Array(P + 1).join("0");
            m < 0 ? x = "-" + C + x.slice(1) : x = C + x;
          }
        }
        v.push(x);
      }
    } else
      v = Mv(d, function(B) {
        return sr(B, t, !1);
      });
    for (var T = 0; T < v.length; T++)
      for (var M = 0; M < p.length && n.length < t; M++) {
        var N = g + v[T] + p[M];
        (!r || f || N) && n.push(N);
      }
    return n;
  }
}
var Ua = Me;
Me.Minimatch = de;
var yr = function() {
  try {
    return require("path");
  } catch {
  }
}() || {
  sep: "/"
};
Me.sep = yr.sep;
var xt = Me.GLOBSTAR = de.GLOBSTAR = {}, kv = Dv, ro = {
  "!": { open: "(?:(?!(?:", close: "))[^/]*?)" },
  "?": { open: "(?:", close: ")?" },
  "+": { open: "(?:", close: ")+" },
  "*": { open: "(?:", close: ")*" },
  "@": { open: "(?:", close: ")" }
}, Xi = "[^/]", Ji = Xi + "*?", Uv = "(?:(?!(?:\\/|^)(?:\\.{1,2})($|\\/)).)*?", qv = "(?:(?!(?:\\/|^)\\.).)*?", no = zv("().*{}+?[]^$\\!");
function zv(e) {
  return e.split("").reduce(function(t, r) {
    return t[r] = !0, t;
  }, {});
}
var qu = /\/+/;
Me.filter = Wv;
function Wv(e, t) {
  return t = t || {}, function(r, n, i) {
    return Me(r, e, t);
  };
}
function it(e, t) {
  t = t || {};
  var r = {};
  return Object.keys(e).forEach(function(n) {
    r[n] = e[n];
  }), Object.keys(t).forEach(function(n) {
    r[n] = t[n];
  }), r;
}
Me.defaults = function(e) {
  if (!e || typeof e != "object" || !Object.keys(e).length)
    return Me;
  var t = Me, r = function(i, a, s) {
    return t(i, a, it(e, s));
  };
  return r.Minimatch = function(i, a) {
    return new t.Minimatch(i, it(e, a));
  }, r.Minimatch.defaults = function(i) {
    return t.defaults(it(e, i)).Minimatch;
  }, r.filter = function(i, a) {
    return t.filter(i, it(e, a));
  }, r.defaults = function(i) {
    return t.defaults(it(e, i));
  }, r.makeRe = function(i, a) {
    return t.makeRe(i, it(e, a));
  }, r.braceExpand = function(i, a) {
    return t.braceExpand(i, it(e, a));
  }, r.match = function(n, i, a) {
    return t.match(n, i, it(e, a));
  }, r;
};
de.defaults = function(e) {
  return Me.defaults(e).Minimatch;
};
function Me(e, t, r) {
  return In(t), r || (r = {}), !r.nocomment && t.charAt(0) === "#" ? !1 : new de(t, r).match(e);
}
function de(e, t) {
  if (!(this instanceof de))
    return new de(e, t);
  In(e), t || (t = {}), e = e.trim(), !t.allowWindowsEscape && yr.sep !== "/" && (e = e.split(yr.sep).join("/")), this.options = t, this.maxGlobstarRecursion = t.maxGlobstarRecursion !== void 0 ? t.maxGlobstarRecursion : 200, this.set = [], this.pattern = e, this.regexp = null, this.negate = !1, this.comment = !1, this.empty = !1, this.partial = !!t.partial, this.make();
}
de.prototype.debug = function() {
};
de.prototype.make = Gv;
function Gv() {
  var e = this.pattern, t = this.options;
  if (!t.nocomment && e.charAt(0) === "#") {
    this.comment = !0;
    return;
  }
  if (!e) {
    this.empty = !0;
    return;
  }
  this.parseNegate();
  var r = this.globSet = this.braceExpand();
  t.debug && (this.debug = function() {
    console.error.apply(console, arguments);
  }), this.debug(this.pattern, r), r = this.globParts = r.map(function(n) {
    return n.split(qu);
  }), this.debug(this.pattern, r), r = r.map(function(n, i, a) {
    return n.map(this.parse, this);
  }, this), this.debug(this.pattern, r), r = r.filter(function(n) {
    return n.indexOf(!1) === -1;
  }), this.debug(this.pattern, r), this.set = r;
}
de.prototype.parseNegate = Hv;
function Hv() {
  var e = this.pattern, t = !1, r = this.options, n = 0;
  if (!r.nonegate) {
    for (var i = 0, a = e.length; i < a && e.charAt(i) === "!"; i++)
      t = !t, n++;
    n && (this.pattern = e.substr(n)), this.negate = t;
  }
}
Me.braceExpand = function(e, t) {
  return zu(e, t);
};
de.prototype.braceExpand = zu;
function zu(e, t) {
  return t || (this instanceof de ? t = this.options : t = {}), e = typeof e > "u" ? this.pattern : e, In(e), t.nobrace || !/\{(?:(?!\{).)*\}/.test(e) ? [e] : kv(e);
}
var Vv = 1024 * 64, In = function(e) {
  if (typeof e != "string")
    throw new TypeError("invalid pattern");
  if (e.length > Vv)
    throw new TypeError("pattern is too long");
};
de.prototype.parse = Zv;
var Nr = {};
function Zv(e, t) {
  In(e);
  var r = this.options;
  if (e === "**")
    if (r.noglobstar)
      e = "*";
    else
      return xt;
  if (e === "") return "";
  var n = "", i = !!r.nocase, a = !1, s = [], f = [], u, d = !1, g = -1, p = -1, v = e.charAt(0) === "." ? "" : r.dot ? "(?!(?:^|\\/)\\.{1,2}(?:$|\\/))" : "(?!\\.)", R = this;
  function A() {
    if (u) {
      switch (u) {
        case "*":
          n += Ji, i = !0;
          break;
        case "?":
          n += Xi, i = !0;
          break;
        default:
          n += "\\" + u;
          break;
      }
      R.debug("clearStateChar %j %j", u, n), u = !1;
    }
  }
  for (var E = 0, L = e.length, c; E < L && (c = e.charAt(E)); E++) {
    if (this.debug("%s	%s %s %j", e, E, n, c), a && no[c]) {
      n += "\\" + c, a = !1;
      continue;
    }
    switch (c) {
      case "/":
        return !1;
      case "\\":
        A(), a = !0;
        continue;
      case "?":
      case "*":
      case "+":
      case "@":
      case "!":
        if (this.debug("%s	%s %s %j <-- stateChar", e, E, n, c), d) {
          this.debug("  in class"), c === "!" && E === p + 1 && (c = "^"), n += c;
          continue;
        }
        if (c === "*" && u === "*") continue;
        R.debug("call clearStateChar %j", u), A(), u = c, r.noext && A();
        continue;
      case "(":
        if (d) {
          n += "(";
          continue;
        }
        if (!u) {
          n += "\\(";
          continue;
        }
        s.push({
          type: u,
          start: E - 1,
          reStart: n.length,
          open: ro[u].open,
          close: ro[u].close
        }), n += u === "!" ? "(?:(?!(?:" : "(?:", this.debug("plType %j %j", u, n), u = !1;
        continue;
      case ")":
        if (d || !s.length) {
          n += "\\)";
          continue;
        }
        A(), i = !0;
        var h = s.pop();
        n += h.close, h.type === "!" && f.push(h), h.reEnd = n.length;
        continue;
      case "|":
        if (d || !s.length || a) {
          n += "\\|", a = !1;
          continue;
        }
        A(), n += "|";
        continue;
      case "[":
        if (A(), d) {
          n += "\\" + c;
          continue;
        }
        d = !0, p = E, g = n.length, n += c;
        continue;
      case "]":
        if (E === p + 1 || !d) {
          n += "\\" + c, a = !1;
          continue;
        }
        var O = e.substring(p + 1, E);
        try {
          RegExp("[" + O + "]");
        } catch {
          var m = this.parse(O, Nr);
          n = n.substr(0, g) + "\\[" + m[0] + "\\]", i = i || m[1], d = !1;
          continue;
        }
        i = !0, d = !1, n += c;
        continue;
      default:
        A(), a ? a = !1 : no[c] && !(c === "^" && d) && (n += "\\"), n += c;
    }
  }
  for (d && (O = e.substr(p + 1), m = this.parse(O, Nr), n = n.substr(0, g) + "\\[" + m[0], i = i || m[1]), h = s.pop(); h; h = s.pop()) {
    var x = n.slice(h.reStart + h.open.length);
    this.debug("setting tail", n, h), x = x.replace(/((?:\\{2}){0,64})(\\?)\|/g, function(k, W, G) {
      return G || (G = "\\"), W + W + G + "|";
    }), this.debug(`tail=%j
   %s`, x, x, h, n);
    var P = h.type === "*" ? Ji : h.type === "?" ? Xi : "\\" + h.type;
    i = !0, n = n.slice(0, h.reStart) + P + "\\(" + x;
  }
  A(), a && (n += "\\\\");
  var C = !1;
  switch (n.charAt(0)) {
    case "[":
    case ".":
    case "(":
      C = !0;
  }
  for (var T = f.length - 1; T > -1; T--) {
    var M = f[T], N = n.slice(0, M.reStart), B = n.slice(M.reStart, M.reEnd - 8), U = n.slice(M.reEnd - 8, M.reEnd), q = n.slice(M.reEnd);
    U += q;
    var H = N.split("(").length - 1, V = q;
    for (E = 0; E < H; E++)
      V = V.replace(/\)[+*?]?/, "");
    q = V;
    var Y = "";
    q === "" && t !== Nr && (Y = "$");
    var b = N + B + q + Y + U;
    n = b;
  }
  if (n !== "" && i && (n = "(?=.)" + n), C && (n = v + n), t === Nr)
    return [n, i];
  if (!i)
    return Qv(e);
  var S = r.nocase ? "i" : "";
  try {
    var D = new RegExp("^" + n + "$", S);
  } catch {
    return new RegExp("$.");
  }
  return D._glob = e, D._src = n, D;
}
Me.makeRe = function(e, t) {
  return new de(e, t || {}).makeRe();
};
de.prototype.makeRe = Yv;
function Yv() {
  if (this.regexp || this.regexp === !1) return this.regexp;
  var e = this.set;
  if (!e.length)
    return this.regexp = !1, this.regexp;
  var t = this.options, r = t.noglobstar ? Ji : t.dot ? Uv : qv, n = t.nocase ? "i" : "", i = e.map(function(a) {
    return a.map(function(s) {
      return s === xt ? r : typeof s == "string" ? Kv(s) : s._src;
    }).join("\\/");
  }).join("|");
  i = "^(?:" + i + ")$", this.negate && (i = "^(?!" + i + ").*$");
  try {
    this.regexp = new RegExp(i, n);
  } catch {
    this.regexp = !1;
  }
  return this.regexp;
}
Me.match = function(e, t, r) {
  r = r || {};
  var n = new de(t, r);
  return e = e.filter(function(i) {
    return n.match(i);
  }), n.options.nonull && !e.length && e.push(t), e;
};
de.prototype.match = function(t, r) {
  if (typeof r > "u" && (r = this.partial), this.debug("match", t, this.pattern), this.comment) return !1;
  if (this.empty) return t === "";
  if (t === "/" && r) return !0;
  var n = this.options;
  yr.sep !== "/" && (t = t.split(yr.sep).join("/")), t = t.split(qu), this.debug(this.pattern, "split", t);
  var i = this.set;
  this.debug(this.pattern, "set", i);
  var a, s;
  for (s = t.length - 1; s >= 0 && (a = t[s], !a); s--)
    ;
  for (s = 0; s < i.length; s++) {
    var f = i[s], u = t;
    n.matchBase && f.length === 1 && (u = [a]);
    var d = this.matchOne(u, f, r);
    if (d)
      return n.flipNegate ? !0 : !this.negate;
  }
  return n.flipNegate ? !1 : this.negate;
};
de.prototype.matchOne = function(e, t, r) {
  return t.indexOf(xt) !== -1 ? this._matchGlobstar(e, t, r, 0, 0) : this._matchOne(e, t, r, 0, 0);
};
de.prototype._matchGlobstar = function(e, t, r, n, i) {
  var a, s = -1;
  for (a = i; a < t.length; a++)
    if (t[a] === xt) {
      s = a;
      break;
    }
  var f = -1;
  for (a = t.length - 1; a >= 0; a--)
    if (t[a] === xt) {
      f = a;
      break;
    }
  var u = t.slice(i, s), d = r ? t.slice(s + 1) : t.slice(s + 1, f), g = r ? [] : t.slice(f + 1);
  if (u.length) {
    var p = e.slice(n, n + u.length);
    if (!this._matchOne(p, u, r, 0, 0))
      return !1;
    n += u.length;
  }
  var v = 0;
  if (g.length) {
    if (g.length + n > e.length) return !1;
    var R = e.length - g.length;
    if (this._matchOne(e, g, r, R, 0))
      v = g.length;
    else {
      if (e[e.length - 1] !== "" || n + g.length === e.length || (R--, !this._matchOne(e, g, r, R, 0)))
        return !1;
      v = g.length + 1;
    }
  }
  if (!d.length) {
    var A = !!v;
    for (a = n; a < e.length - v; a++) {
      var E = String(e[a]);
      if (A = !0, E === "." || E === ".." || !this.options.dot && E.charAt(0) === ".")
        return !1;
    }
    return r || A;
  }
  for (var L = [[[], 0]], c = L[0], h = 0, O = [0], m = 0; m < d.length; m++) {
    var x = d[m];
    x === xt ? (O.push(h), c = [[], 0], L.push(c)) : (c[0].push(x), h++);
  }
  for (var P = L.length - 1, C = e.length - v, T = 0; T < L.length; T++)
    L[T][1] = C - (O[P--] + L[T][0].length);
  return !!this._matchGlobStarBodySections(
    e,
    L,
    n,
    0,
    r,
    0,
    !!v
  );
};
de.prototype._matchGlobStarBodySections = function(e, t, r, n, i, a, s) {
  var f = t[n];
  if (!f) {
    for (var u = r; u < e.length; u++) {
      s = !0;
      var d = e[u];
      if (d === "." || d === ".." || !this.options.dot && d.charAt(0) === ".")
        return !1;
    }
    return s;
  }
  for (var g = f[0], p = f[1]; r <= p; ) {
    var v = this._matchOne(
      e.slice(0, r + g.length),
      g,
      i,
      r,
      0
    );
    if (v && a < this.maxGlobstarRecursion) {
      var R = this._matchGlobStarBodySections(
        e,
        t,
        r + g.length,
        n + 1,
        i,
        a + 1,
        s
      );
      if (R !== !1)
        return R;
    }
    var d = e[r];
    if (d === "." || d === ".." || !this.options.dot && d.charAt(0) === ".")
      return !1;
    r++;
  }
  return i || null;
};
de.prototype._matchOne = function(e, t, r, n, i) {
  var a, s, f, u;
  for (a = n, s = i, f = e.length, u = t.length; a < f && s < u; a++, s++) {
    this.debug("matchOne loop");
    var d = t[s], g = e[a];
    if (this.debug(t, d, g), d === !1 || d === xt) return !1;
    var p;
    if (typeof d == "string" ? (p = g === d, this.debug("string match", d, g, p)) : (p = g.match(d), this.debug("pattern match", d, g, p)), !p) return !1;
  }
  if (a === f && s === u)
    return !0;
  if (a === f)
    return r;
  if (s === u)
    return a === f - 1 && e[a] === "";
  throw new Error("wtf?");
};
function Qv(e) {
  return e.replace(/\\(.)/g, "$1");
}
function Kv(e) {
  return e.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}
var Cn = { exports: {} };
function Wu(e) {
  return e.charAt(0) === "/";
}
function Gu(e) {
  var t = /^([a-zA-Z]:|[\\\/]{2}[^\\\/]+[\\\/]+[^\\\/]+)?([\\\/])?([\s\S]*?)$/, r = t.exec(e), n = r[1] || "", i = !!(n && n.charAt(1) !== ":");
  return !!(r[2] || i);
}
Cn.exports = process.platform === "win32" ? Gu : Wu;
Cn.exports.posix = Wu;
Cn.exports.win32 = Gu;
var qa = Cn.exports, tt = {};
tt.setopts = ny;
tt.ownProp = Hu;
tt.makeAbs = mr;
tt.finish = iy;
tt.mark = ay;
tt.isIgnored = Zu;
tt.childrenIgnored = sy;
function Hu(e, t) {
  return Object.prototype.hasOwnProperty.call(e, t);
}
var Xv = Lt, Ft = Ve, Jv = Ua, Vu = qa, ea = Jv.Minimatch;
function ey(e, t) {
  return e.localeCompare(t, "en");
}
function ty(e, t) {
  e.ignore = t.ignore || [], Array.isArray(e.ignore) || (e.ignore = [e.ignore]), e.ignore.length && (e.ignore = e.ignore.map(ry));
}
function ry(e) {
  var t = null;
  if (e.slice(-3) === "/**") {
    var r = e.replace(/(\/\*\*)+$/, "");
    t = new ea(r, { dot: !0 });
  }
  return {
    matcher: new ea(e, { dot: !0 }),
    gmatcher: t
  };
}
function ny(e, t, r) {
  if (r || (r = {}), r.matchBase && t.indexOf("/") === -1) {
    if (r.noglobstar)
      throw new Error("base matching requires globstar");
    t = "**/" + t;
  }
  e.silent = !!r.silent, e.pattern = t, e.strict = r.strict !== !1, e.realpath = !!r.realpath, e.realpathCache = r.realpathCache || /* @__PURE__ */ Object.create(null), e.follow = !!r.follow, e.dot = !!r.dot, e.mark = !!r.mark, e.nodir = !!r.nodir, e.nodir && (e.mark = !0), e.sync = !!r.sync, e.nounique = !!r.nounique, e.nonull = !!r.nonull, e.nosort = !!r.nosort, e.nocase = !!r.nocase, e.stat = !!r.stat, e.noprocess = !!r.noprocess, e.absolute = !!r.absolute, e.fs = r.fs || Xv, e.maxLength = r.maxLength || 1 / 0, e.cache = r.cache || /* @__PURE__ */ Object.create(null), e.statCache = r.statCache || /* @__PURE__ */ Object.create(null), e.symlinks = r.symlinks || /* @__PURE__ */ Object.create(null), ty(e, r), e.changedCwd = !1;
  var n = process.cwd();
  Hu(r, "cwd") ? (e.cwd = Ft.resolve(r.cwd), e.changedCwd = e.cwd !== n) : e.cwd = n, e.root = r.root || Ft.resolve(e.cwd, "/"), e.root = Ft.resolve(e.root), process.platform === "win32" && (e.root = e.root.replace(/\\/g, "/")), e.cwdAbs = Vu(e.cwd) ? e.cwd : mr(e, e.cwd), process.platform === "win32" && (e.cwdAbs = e.cwdAbs.replace(/\\/g, "/")), e.nomount = !!r.nomount, r.nonegate = !0, r.nocomment = !0, r.allowWindowsEscape = !1, e.minimatch = new ea(t, r), e.options = e.minimatch.options;
}
function iy(e) {
  for (var t = e.nounique, r = t ? [] : /* @__PURE__ */ Object.create(null), n = 0, i = e.matches.length; n < i; n++) {
    var a = e.matches[n];
    if (!a || Object.keys(a).length === 0) {
      if (e.nonull) {
        var s = e.minimatch.globSet[n];
        t ? r.push(s) : r[s] = !0;
      }
    } else {
      var f = Object.keys(a);
      t ? r.push.apply(r, f) : f.forEach(function(u) {
        r[u] = !0;
      });
    }
  }
  if (t || (r = Object.keys(r)), e.nosort || (r = r.sort(ey)), e.mark) {
    for (var n = 0; n < r.length; n++)
      r[n] = e._mark(r[n]);
    e.nodir && (r = r.filter(function(u) {
      var d = !/\/$/.test(u), g = e.cache[u] || e.cache[mr(e, u)];
      return d && g && (d = g !== "DIR" && !Array.isArray(g)), d;
    }));
  }
  e.ignore.length && (r = r.filter(function(u) {
    return !Zu(e, u);
  })), e.found = r;
}
function ay(e, t) {
  var r = mr(e, t), n = e.cache[r], i = t;
  if (n) {
    var a = n === "DIR" || Array.isArray(n), s = t.slice(-1) === "/";
    if (a && !s ? i += "/" : !a && s && (i = i.slice(0, -1)), i !== t) {
      var f = mr(e, i);
      e.statCache[f] = e.statCache[r], e.cache[f] = e.cache[r];
    }
  }
  return i;
}
function mr(e, t) {
  var r = t;
  return t.charAt(0) === "/" ? r = Ft.join(e.root, t) : Vu(t) || t === "" ? r = t : e.changedCwd ? r = Ft.resolve(e.cwd, t) : r = Ft.resolve(t), process.platform === "win32" && (r = r.replace(/\\/g, "/")), r;
}
function Zu(e, t) {
  return e.ignore.length ? e.ignore.some(function(r) {
    return r.matcher.match(t) || !!(r.gmatcher && r.gmatcher.match(t));
  }) : !1;
}
function sy(e, t) {
  return e.ignore.length ? e.ignore.some(function(r) {
    return !!(r.gmatcher && r.gmatcher.match(t));
  }) : !1;
}
var mi, io;
function oy() {
  if (io) return mi;
  io = 1, mi = g, g.GlobSync = p;
  var e = Du, t = Ua;
  t.Minimatch, Ga().Glob;
  var r = Ve, n = ha, i = qa, a = tt, s = a.setopts, f = a.ownProp, u = a.childrenIgnored, d = a.isIgnored;
  function g(v, R) {
    if (typeof R == "function" || arguments.length === 3)
      throw new TypeError(`callback provided to sync glob
See: https://github.com/isaacs/node-glob/issues/167`);
    return new p(v, R).found;
  }
  function p(v, R) {
    if (!v)
      throw new Error("must provide pattern");
    if (typeof R == "function" || arguments.length === 3)
      throw new TypeError(`callback provided to sync glob
See: https://github.com/isaacs/node-glob/issues/167`);
    if (!(this instanceof p))
      return new p(v, R);
    if (s(this, v, R), this.noprocess)
      return this;
    var A = this.minimatch.set.length;
    this.matches = new Array(A);
    for (var E = 0; E < A; E++)
      this._process(this.minimatch.set[E], E, !1);
    this._finish();
  }
  return p.prototype._finish = function() {
    if (n.ok(this instanceof p), this.realpath) {
      var v = this;
      this.matches.forEach(function(R, A) {
        var E = v.matches[A] = /* @__PURE__ */ Object.create(null);
        for (var L in R)
          try {
            L = v._makeAbs(L);
            var c = e.realpathSync(L, v.realpathCache);
            E[c] = !0;
          } catch (h) {
            if (h.syscall === "stat")
              E[v._makeAbs(L)] = !0;
            else
              throw h;
          }
      });
    }
    a.finish(this);
  }, p.prototype._process = function(v, R, A) {
    n.ok(this instanceof p);
    for (var E = 0; typeof v[E] == "string"; )
      E++;
    var L;
    switch (E) {
      case v.length:
        this._processSimple(v.join("/"), R);
        return;
      case 0:
        L = null;
        break;
      default:
        L = v.slice(0, E).join("/");
        break;
    }
    var c = v.slice(E), h;
    L === null ? h = "." : ((i(L) || i(v.map(function(x) {
      return typeof x == "string" ? x : "[*]";
    }).join("/"))) && (!L || !i(L)) && (L = "/" + L), h = L);
    var O = this._makeAbs(h);
    if (!u(this, h)) {
      var m = c[0] === t.GLOBSTAR;
      m ? this._processGlobStar(L, h, O, c, R, A) : this._processReaddir(L, h, O, c, R, A);
    }
  }, p.prototype._processReaddir = function(v, R, A, E, L, c) {
    var h = this._readdir(A, c);
    if (h) {
      for (var O = E[0], m = !!this.minimatch.negate, x = O._glob, P = this.dot || x.charAt(0) === ".", C = [], T = 0; T < h.length; T++) {
        var M = h[T];
        if (M.charAt(0) !== "." || P) {
          var N;
          m && !v ? N = !M.match(O) : N = M.match(O), N && C.push(M);
        }
      }
      var B = C.length;
      if (B !== 0) {
        if (E.length === 1 && !this.mark && !this.stat) {
          this.matches[L] || (this.matches[L] = /* @__PURE__ */ Object.create(null));
          for (var T = 0; T < B; T++) {
            var M = C[T];
            v && (v.slice(-1) !== "/" ? M = v + "/" + M : M = v + M), M.charAt(0) === "/" && !this.nomount && (M = r.join(this.root, M)), this._emitMatch(L, M);
          }
          return;
        }
        E.shift();
        for (var T = 0; T < B; T++) {
          var M = C[T], U;
          v ? U = [v, M] : U = [M], this._process(U.concat(E), L, c);
        }
      }
    }
  }, p.prototype._emitMatch = function(v, R) {
    if (!d(this, R)) {
      var A = this._makeAbs(R);
      if (this.mark && (R = this._mark(R)), this.absolute && (R = A), !this.matches[v][R]) {
        if (this.nodir) {
          var E = this.cache[A];
          if (E === "DIR" || Array.isArray(E))
            return;
        }
        this.matches[v][R] = !0, this.stat && this._stat(R);
      }
    }
  }, p.prototype._readdirInGlobStar = function(v) {
    if (this.follow)
      return this._readdir(v, !1);
    var R, A;
    try {
      A = this.fs.lstatSync(v);
    } catch (L) {
      if (L.code === "ENOENT")
        return null;
    }
    var E = A && A.isSymbolicLink();
    return this.symlinks[v] = E, !E && A && !A.isDirectory() ? this.cache[v] = "FILE" : R = this._readdir(v, !1), R;
  }, p.prototype._readdir = function(v, R) {
    if (R && !f(this.symlinks, v))
      return this._readdirInGlobStar(v);
    if (f(this.cache, v)) {
      var A = this.cache[v];
      if (!A || A === "FILE")
        return null;
      if (Array.isArray(A))
        return A;
    }
    try {
      return this._readdirEntries(v, this.fs.readdirSync(v));
    } catch (E) {
      return this._readdirError(v, E), null;
    }
  }, p.prototype._readdirEntries = function(v, R) {
    if (!this.mark && !this.stat)
      for (var A = 0; A < R.length; A++) {
        var E = R[A];
        v === "/" ? E = v + E : E = v + "/" + E, this.cache[E] = !0;
      }
    return this.cache[v] = R, R;
  }, p.prototype._readdirError = function(v, R) {
    switch (R.code) {
      case "ENOTSUP":
      case "ENOTDIR":
        var A = this._makeAbs(v);
        if (this.cache[A] = "FILE", A === this.cwdAbs) {
          var E = new Error(R.code + " invalid cwd " + this.cwd);
          throw E.path = this.cwd, E.code = R.code, E;
        }
        break;
      case "ENOENT":
      case "ELOOP":
      case "ENAMETOOLONG":
      case "UNKNOWN":
        this.cache[this._makeAbs(v)] = !1;
        break;
      default:
        if (this.cache[this._makeAbs(v)] = !1, this.strict)
          throw R;
        this.silent || console.error("glob error", R);
        break;
    }
  }, p.prototype._processGlobStar = function(v, R, A, E, L, c) {
    var h = this._readdir(A, c);
    if (h) {
      var O = E.slice(1), m = v ? [v] : [], x = m.concat(O);
      this._process(x, L, !1);
      var P = h.length, C = this.symlinks[A];
      if (!(C && c))
        for (var T = 0; T < P; T++) {
          var M = h[T];
          if (!(M.charAt(0) === "." && !this.dot)) {
            var N = m.concat(h[T], O);
            this._process(N, L, !0);
            var B = m.concat(h[T], E);
            this._process(B, L, !0);
          }
        }
    }
  }, p.prototype._processSimple = function(v, R) {
    var A = this._stat(v);
    if (this.matches[R] || (this.matches[R] = /* @__PURE__ */ Object.create(null)), !!A) {
      if (v && i(v) && !this.nomount) {
        var E = /[\/\\]$/.test(v);
        v.charAt(0) === "/" ? v = r.join(this.root, v) : (v = r.resolve(this.root, v), E && (v += "/"));
      }
      process.platform === "win32" && (v = v.replace(/\\/g, "/")), this._emitMatch(R, v);
    }
  }, p.prototype._stat = function(v) {
    var R = this._makeAbs(v), A = v.slice(-1) === "/";
    if (v.length > this.maxLength)
      return !1;
    if (!this.stat && f(this.cache, R)) {
      var c = this.cache[R];
      if (Array.isArray(c) && (c = "DIR"), !A || c === "DIR")
        return c;
      if (A && c === "FILE")
        return !1;
    }
    var E = this.statCache[R];
    if (!E) {
      var L;
      try {
        L = this.fs.lstatSync(R);
      } catch (h) {
        if (h && (h.code === "ENOENT" || h.code === "ENOTDIR"))
          return this.statCache[R] = !1, !1;
      }
      if (L && L.isSymbolicLink())
        try {
          E = this.fs.statSync(R);
        } catch {
          E = L;
        }
      else
        E = L;
    }
    this.statCache[R] = E;
    var c = !0;
    return E && (c = E.isDirectory() ? "DIR" : "FILE"), this.cache[R] = this.cache[R] || c, A && c === "FILE" ? !1 : c;
  }, p.prototype._mark = function(v) {
    return a.mark(this, v);
  }, p.prototype._makeAbs = function(v) {
    return a.makeAbs(this, v);
  }, mi;
}
var Yu = Qu;
function Qu(e, t) {
  if (e && t) return Qu(e)(t);
  if (typeof e != "function")
    throw new TypeError("need wrapper function");
  return Object.keys(e).forEach(function(n) {
    r[n] = e[n];
  }), r;
  function r() {
    for (var n = new Array(arguments.length), i = 0; i < n.length; i++)
      n[i] = arguments[i];
    var a = e.apply(this, n), s = n[n.length - 1];
    return typeof a == "function" && a !== s && Object.keys(s).forEach(function(f) {
      a[f] = s[f];
    }), a;
  }
}
var za = { exports: {} }, Ku = Yu;
za.exports = Ku(zr);
za.exports.strict = Ku(Xu);
zr.proto = zr(function() {
  Object.defineProperty(Function.prototype, "once", {
    value: function() {
      return zr(this);
    },
    configurable: !0
  }), Object.defineProperty(Function.prototype, "onceStrict", {
    value: function() {
      return Xu(this);
    },
    configurable: !0
  });
});
function zr(e) {
  var t = function() {
    return t.called ? t.value : (t.called = !0, t.value = e.apply(this, arguments));
  };
  return t.called = !1, t;
}
function Xu(e) {
  var t = function() {
    if (t.called)
      throw new Error(t.onceError);
    return t.called = !0, t.value = e.apply(this, arguments);
  }, r = e.name || "Function wrapped with `once`";
  return t.onceError = r + " shouldn't be called more than once", t.called = !1, t;
}
var Wa = za.exports, fy = Yu, ur = /* @__PURE__ */ Object.create(null), uy = Wa, ly = fy(cy);
function cy(e, t) {
  return ur[e] ? (ur[e].push(t), null) : (ur[e] = [t], hy(e));
}
function hy(e) {
  return uy(function t() {
    var r = ur[e], n = r.length, i = dy(arguments);
    try {
      for (var a = 0; a < n; a++)
        r[a].apply(null, i);
    } finally {
      r.length > n ? (r.splice(0, n), process.nextTick(function() {
        t.apply(null, i);
      })) : delete ur[e];
    }
  });
}
function dy(e) {
  for (var t = e.length, r = [], n = 0; n < t; n++) r[n] = e[n];
  return r;
}
var _i, ao;
function Ga() {
  if (ao) return _i;
  ao = 1, _i = E;
  var e = Du, t = Ua;
  t.Minimatch;
  var r = ye, n = wr.EventEmitter, i = Ve, a = ha, s = qa, f = oy(), u = tt, d = u.setopts, g = u.ownProp, p = ly, v = u.childrenIgnored, R = u.isIgnored, A = Wa;
  function E(m, x, P) {
    if (typeof x == "function" && (P = x, x = {}), x || (x = {}), x.sync) {
      if (P)
        throw new TypeError("callback provided to sync glob");
      return f(m, x);
    }
    return new h(m, x, P);
  }
  E.sync = f;
  var L = E.GlobSync = f.GlobSync;
  E.glob = E;
  function c(m, x) {
    if (x === null || typeof x != "object")
      return m;
    for (var P = Object.keys(x), C = P.length; C--; )
      m[P[C]] = x[P[C]];
    return m;
  }
  E.hasMagic = function(m, x) {
    var P = c({}, x);
    P.noprocess = !0;
    var C = new h(m, P), T = C.minimatch.set;
    if (!m)
      return !1;
    if (T.length > 1)
      return !0;
    for (var M = 0; M < T[0].length; M++)
      if (typeof T[0][M] != "string")
        return !0;
    return !1;
  }, E.Glob = h, r(h, n);
  function h(m, x, P) {
    if (typeof x == "function" && (P = x, x = null), x && x.sync) {
      if (P)
        throw new TypeError("callback provided to sync glob");
      return new L(m, x);
    }
    if (!(this instanceof h))
      return new h(m, x, P);
    d(this, m, x), this._didRealPath = !1;
    var C = this.minimatch.set.length;
    this.matches = new Array(C), typeof P == "function" && (P = A(P), this.on("error", P), this.on("end", function(U) {
      P(null, U);
    }));
    var T = this;
    if (this._processing = 0, this._emitQueue = [], this._processQueue = [], this.paused = !1, this.noprocess)
      return this;
    if (C === 0)
      return B();
    for (var M = !0, N = 0; N < C; N++)
      this._process(this.minimatch.set[N], N, !1, B);
    M = !1;
    function B() {
      --T._processing, T._processing <= 0 && (M ? process.nextTick(function() {
        T._finish();
      }) : T._finish());
    }
  }
  h.prototype._finish = function() {
    if (a(this instanceof h), !this.aborted) {
      if (this.realpath && !this._didRealpath)
        return this._realpath();
      u.finish(this), this.emit("end", this.found);
    }
  }, h.prototype._realpath = function() {
    if (this._didRealpath)
      return;
    this._didRealpath = !0;
    var m = this.matches.length;
    if (m === 0)
      return this._finish();
    for (var x = this, P = 0; P < this.matches.length; P++)
      this._realpathSet(P, C);
    function C() {
      --m === 0 && x._finish();
    }
  }, h.prototype._realpathSet = function(m, x) {
    var P = this.matches[m];
    if (!P)
      return x();
    var C = Object.keys(P), T = this, M = C.length;
    if (M === 0)
      return x();
    var N = this.matches[m] = /* @__PURE__ */ Object.create(null);
    C.forEach(function(B, U) {
      B = T._makeAbs(B), e.realpath(B, T.realpathCache, function(q, H) {
        q ? q.syscall === "stat" ? N[B] = !0 : T.emit("error", q) : N[H] = !0, --M === 0 && (T.matches[m] = N, x());
      });
    });
  }, h.prototype._mark = function(m) {
    return u.mark(this, m);
  }, h.prototype._makeAbs = function(m) {
    return u.makeAbs(this, m);
  }, h.prototype.abort = function() {
    this.aborted = !0, this.emit("abort");
  }, h.prototype.pause = function() {
    this.paused || (this.paused = !0, this.emit("pause"));
  }, h.prototype.resume = function() {
    if (this.paused) {
      if (this.emit("resume"), this.paused = !1, this._emitQueue.length) {
        var m = this._emitQueue.slice(0);
        this._emitQueue.length = 0;
        for (var x = 0; x < m.length; x++) {
          var P = m[x];
          this._emitMatch(P[0], P[1]);
        }
      }
      if (this._processQueue.length) {
        var C = this._processQueue.slice(0);
        this._processQueue.length = 0;
        for (var x = 0; x < C.length; x++) {
          var T = C[x];
          this._processing--, this._process(T[0], T[1], T[2], T[3]);
        }
      }
    }
  }, h.prototype._process = function(m, x, P, C) {
    if (a(this instanceof h), a(typeof C == "function"), !this.aborted) {
      if (this._processing++, this.paused) {
        this._processQueue.push([m, x, P, C]);
        return;
      }
      for (var T = 0; typeof m[T] == "string"; )
        T++;
      var M;
      switch (T) {
        case m.length:
          this._processSimple(m.join("/"), x, C);
          return;
        case 0:
          M = null;
          break;
        default:
          M = m.slice(0, T).join("/");
          break;
      }
      var N = m.slice(T), B;
      M === null ? B = "." : ((s(M) || s(m.map(function(H) {
        return typeof H == "string" ? H : "[*]";
      }).join("/"))) && (!M || !s(M)) && (M = "/" + M), B = M);
      var U = this._makeAbs(B);
      if (v(this, B))
        return C();
      var q = N[0] === t.GLOBSTAR;
      q ? this._processGlobStar(M, B, U, N, x, P, C) : this._processReaddir(M, B, U, N, x, P, C);
    }
  }, h.prototype._processReaddir = function(m, x, P, C, T, M, N) {
    var B = this;
    this._readdir(P, M, function(U, q) {
      return B._processReaddir2(m, x, P, C, T, M, q, N);
    });
  }, h.prototype._processReaddir2 = function(m, x, P, C, T, M, N, B) {
    if (!N)
      return B();
    for (var U = C[0], q = !!this.minimatch.negate, H = U._glob, V = this.dot || H.charAt(0) === ".", Y = [], b = 0; b < N.length; b++) {
      var S = N[b];
      if (S.charAt(0) !== "." || V) {
        var D;
        q && !m ? D = !S.match(U) : D = S.match(U), D && Y.push(S);
      }
    }
    var k = Y.length;
    if (k === 0)
      return B();
    if (C.length === 1 && !this.mark && !this.stat) {
      this.matches[T] || (this.matches[T] = /* @__PURE__ */ Object.create(null));
      for (var b = 0; b < k; b++) {
        var S = Y[b];
        m && (m !== "/" ? S = m + "/" + S : S = m + S), S.charAt(0) === "/" && !this.nomount && (S = i.join(this.root, S)), this._emitMatch(T, S);
      }
      return B();
    }
    C.shift();
    for (var b = 0; b < k; b++) {
      var S = Y[b];
      m && (m !== "/" ? S = m + "/" + S : S = m + S), this._process([S].concat(C), T, M, B);
    }
    B();
  }, h.prototype._emitMatch = function(m, x) {
    if (!this.aborted && !R(this, x)) {
      if (this.paused) {
        this._emitQueue.push([m, x]);
        return;
      }
      var P = s(x) ? x : this._makeAbs(x);
      if (this.mark && (x = this._mark(x)), this.absolute && (x = P), !this.matches[m][x]) {
        if (this.nodir) {
          var C = this.cache[P];
          if (C === "DIR" || Array.isArray(C))
            return;
        }
        this.matches[m][x] = !0;
        var T = this.statCache[P];
        T && this.emit("stat", x, T), this.emit("match", x);
      }
    }
  }, h.prototype._readdirInGlobStar = function(m, x) {
    if (this.aborted)
      return;
    if (this.follow)
      return this._readdir(m, !1, x);
    var P = "lstat\0" + m, C = this, T = p(P, M);
    T && C.fs.lstat(m, T);
    function M(N, B) {
      if (N && N.code === "ENOENT")
        return x();
      var U = B && B.isSymbolicLink();
      C.symlinks[m] = U, !U && B && !B.isDirectory() ? (C.cache[m] = "FILE", x()) : C._readdir(m, !1, x);
    }
  }, h.prototype._readdir = function(m, x, P) {
    if (!this.aborted && (P = p("readdir\0" + m + "\0" + x, P), !!P)) {
      if (x && !g(this.symlinks, m))
        return this._readdirInGlobStar(m, P);
      if (g(this.cache, m)) {
        var C = this.cache[m];
        if (!C || C === "FILE")
          return P();
        if (Array.isArray(C))
          return P(null, C);
      }
      var T = this;
      T.fs.readdir(m, O(this, m, P));
    }
  };
  function O(m, x, P) {
    return function(C, T) {
      C ? m._readdirError(x, C, P) : m._readdirEntries(x, T, P);
    };
  }
  return h.prototype._readdirEntries = function(m, x, P) {
    if (!this.aborted) {
      if (!this.mark && !this.stat)
        for (var C = 0; C < x.length; C++) {
          var T = x[C];
          m === "/" ? T = m + T : T = m + "/" + T, this.cache[T] = !0;
        }
      return this.cache[m] = x, P(null, x);
    }
  }, h.prototype._readdirError = function(m, x, P) {
    if (!this.aborted) {
      switch (x.code) {
        case "ENOTSUP":
        case "ENOTDIR":
          var C = this._makeAbs(m);
          if (this.cache[C] = "FILE", C === this.cwdAbs) {
            var T = new Error(x.code + " invalid cwd " + this.cwd);
            T.path = this.cwd, T.code = x.code, this.emit("error", T), this.abort();
          }
          break;
        case "ENOENT":
        case "ELOOP":
        case "ENAMETOOLONG":
        case "UNKNOWN":
          this.cache[this._makeAbs(m)] = !1;
          break;
        default:
          this.cache[this._makeAbs(m)] = !1, this.strict && (this.emit("error", x), this.abort()), this.silent || console.error("glob error", x);
          break;
      }
      return P();
    }
  }, h.prototype._processGlobStar = function(m, x, P, C, T, M, N) {
    var B = this;
    this._readdir(P, M, function(U, q) {
      B._processGlobStar2(m, x, P, C, T, M, q, N);
    });
  }, h.prototype._processGlobStar2 = function(m, x, P, C, T, M, N, B) {
    if (!N)
      return B();
    var U = C.slice(1), q = m ? [m] : [], H = q.concat(U);
    this._process(H, T, !1, B);
    var V = this.symlinks[P], Y = N.length;
    if (V && M)
      return B();
    for (var b = 0; b < Y; b++) {
      var S = N[b];
      if (!(S.charAt(0) === "." && !this.dot)) {
        var D = q.concat(N[b], U);
        this._process(D, T, !0, B);
        var k = q.concat(N[b], C);
        this._process(k, T, !0, B);
      }
    }
    B();
  }, h.prototype._processSimple = function(m, x, P) {
    var C = this;
    this._stat(m, function(T, M) {
      C._processSimple2(m, x, T, M, P);
    });
  }, h.prototype._processSimple2 = function(m, x, P, C, T) {
    if (this.matches[x] || (this.matches[x] = /* @__PURE__ */ Object.create(null)), !C)
      return T();
    if (m && s(m) && !this.nomount) {
      var M = /[\/\\]$/.test(m);
      m.charAt(0) === "/" ? m = i.join(this.root, m) : (m = i.resolve(this.root, m), M && (m += "/"));
    }
    process.platform === "win32" && (m = m.replace(/\\/g, "/")), this._emitMatch(x, m), T();
  }, h.prototype._stat = function(m, x) {
    var P = this._makeAbs(m), C = m.slice(-1) === "/";
    if (m.length > this.maxLength)
      return x();
    if (!this.stat && g(this.cache, P)) {
      var T = this.cache[P];
      if (Array.isArray(T) && (T = "DIR"), !C || T === "DIR")
        return x(null, T);
      if (C && T === "FILE")
        return x();
    }
    var M = this.statCache[P];
    if (M !== void 0) {
      if (M === !1)
        return x(null, M);
      var N = M.isDirectory() ? "DIR" : "FILE";
      return C && N === "FILE" ? x() : x(null, N, M);
    }
    var B = this, U = p("stat\0" + P, q);
    U && B.fs.lstat(P, U);
    function q(H, V) {
      if (V && V.isSymbolicLink())
        return B.fs.stat(P, function(Y, b) {
          Y ? B._stat2(m, P, null, V, x) : B._stat2(m, P, Y, b, x);
        });
      B._stat2(m, P, H, V, x);
    }
  }, h.prototype._stat2 = function(m, x, P, C, T) {
    if (P && (P.code === "ENOENT" || P.code === "ENOTDIR"))
      return this.statCache[x] = !1, T();
    var M = m.slice(-1) === "/";
    if (this.statCache[x] = C, x.slice(-1) === "/" && C && !C.isDirectory())
      return T(null, !1, C);
    var N = !0;
    return C && (N = C.isDirectory() ? "DIR" : "FILE"), this.cache[x] = this.cache[x] || N, M && N === "FILE" ? T() : T(null, N, C);
  }, _i;
}
var Ju = Or, kt = Ve, ta = gu, py = wu, gy = Au, vy = Mu, yy = Ga(), Ot = du.exports = {}, so = /[\/\\]/g, my = function(e, t) {
  var r = [];
  return ta(e).forEach(function(n) {
    var i = n.indexOf("!") === 0;
    i && (n = n.slice(1));
    var a = t(n);
    i ? r = py(r, a) : r = gy(r, a);
  }), r;
};
Ot.exists = function() {
  var e = kt.join.apply(kt, arguments);
  return Ju.existsSync(e);
};
Ot.expand = function(...e) {
  var t = vy(e[0]) ? e.shift() : {}, r = Array.isArray(e[0]) ? e[0] : e;
  if (r.length === 0)
    return [];
  var n = my(r, function(i) {
    return yy.sync(i, t);
  });
  return t.filter && (n = n.filter(function(i) {
    i = kt.join(t.cwd || "", i);
    try {
      return typeof t.filter == "function" ? t.filter(i) : Ju.statSync(i)[t.filter]();
    } catch {
      return !1;
    }
  })), n;
};
Ot.expandMapping = function(e, t, r) {
  r = Object.assign({
    rename: function(a, s) {
      return kt.join(a || "", s);
    }
  }, r);
  var n = [], i = {};
  return Ot.expand(r, e).forEach(function(a) {
    var s = a;
    r.flatten && (s = kt.basename(s)), r.ext && (s = s.replace(/(\.[^\/]*)?$/, r.ext));
    var f = r.rename(t, s, r);
    r.cwd && (a = kt.join(r.cwd, a)), f = f.replace(so, "/"), a = a.replace(so, "/"), i[f] ? i[f].src.push(a) : (n.push({
      src: [a],
      dest: f
    }), i[f] = n[n.length - 1]);
  }), n;
};
Ot.normalizeFilesArray = function(e) {
  var t = [];
  return e.forEach(function(r) {
    ("src" in r || "dest" in r) && t.push(r);
  }), t.length === 0 ? [] : (t = _(t).chain().forEach(function(r) {
    !("src" in r) || !r.src || (Array.isArray(r.src) ? r.src = ta(r.src) : r.src = [r.src]);
  }).map(function(r) {
    var n = Object.assign({}, r);
    if (delete n.src, delete n.dest, r.expand)
      return Ot.expandMapping(r.src, r.dest, n).map(function(a) {
        var s = Object.assign({}, r);
        return s.orig = Object.assign({}, r), s.src = a.src, s.dest = a.dest, ["expand", "cwd", "flatten", "rename", "ext"].forEach(function(f) {
          delete s[f];
        }), s;
      });
    var i = Object.assign({}, r);
    return i.orig = Object.assign({}, r), "src" in i && Object.defineProperty(i, "src", {
      enumerable: !0,
      get: function a() {
        var s;
        return "result" in a || (s = r.src, s = Array.isArray(s) ? ta(s) : [s], a.result = Ot.expand(n, s)), a.result;
      }
    }), "dest" in i && (i.dest = r.dest), i;
  }).flatten().value(), t);
};
var _y = du.exports, ra = Or, oo = Ve, by = eu, el = Ra, wy = ou, Sy = Ze.Stream, Ey = Bd.PassThrough, Pe = Gf.exports = {};
Pe.file = _y;
Pe.collectStream = function(e, t) {
  var r = [], n = 0;
  e.on("error", t), e.on("data", function(i) {
    r.push(i), n += i.length;
  }), e.on("end", function() {
    var i = new Buffer(n), a = 0;
    r.forEach(function(s) {
      s.copy(i, a), a += s.length;
    }), t(null, i);
  });
};
Pe.dateify = function(e) {
  return e = e || /* @__PURE__ */ new Date(), e instanceof Date ? e = e : typeof e == "string" ? e = new Date(e) : e = /* @__PURE__ */ new Date(), e;
};
Pe.defaults = function(e, t, r) {
  var n = arguments;
  return n[0] = n[0] || {}, wy(...n);
};
Pe.isStream = function(e) {
  return e instanceof Sy;
};
Pe.lazyReadStream = function(e) {
  return new by.Readable(function() {
    return ra.createReadStream(e);
  });
};
Pe.normalizeInputSource = function(e) {
  if (e === null)
    return new Buffer(0);
  if (typeof e == "string")
    return new Buffer(e);
  if (Pe.isStream(e) && !e._readableState) {
    var t = new Ey();
    return e.pipe(t), t;
  }
  return e;
};
Pe.sanitizePath = function(e) {
  return el(e, !1).replace(/^\w+:/, "").replace(/^(\.\.\/|\/)+/, "");
};
Pe.trailingSlashIt = function(e) {
  return e.slice(-1) !== "/" ? e + "/" : e;
};
Pe.unixifyPath = function(e) {
  return el(e, !1).replace(/^\w+:/, "");
};
Pe.walkdir = function(e, t, r) {
  var n = [];
  typeof t == "function" && (r = t, t = e), ra.readdir(e, function(i, a) {
    var s = 0, f, u;
    if (i)
      return r(i);
    (function d() {
      if (f = a[s++], !f)
        return r(null, n);
      u = oo.join(e, f), ra.stat(u, function(g, p) {
        n.push({
          path: u,
          relative: oo.relative(t, u).replace(/\\/g, "/"),
          stats: p
        }), p && p.isDirectory() ? Pe.walkdir(u, t, function(v, R) {
          R.forEach(function(A) {
            n.push(A);
          }), d();
        }) : d();
      });
    })();
  });
};
var Nn = Gf.exports, tl = { exports: {} };
/**
 * Archiver Core
 *
 * @ignore
 * @license [MIT]{@link https://github.com/archiverjs/node-archiver/blob/master/LICENSE}
 * @copyright (c) 2012-2014 Chris Talkington, contributors.
 */
(function(e, t) {
  var r = Ee;
  const n = {
    ABORTED: "archive was aborted",
    DIRECTORYDIRPATHREQUIRED: "diretory dirpath argument must be a non-empty string value",
    DIRECTORYFUNCTIONINVALIDDATA: "invalid data returned by directory custom data function",
    ENTRYNAMEREQUIRED: "entry name must be a non-empty string value",
    FILEFILEPATHREQUIRED: "file filepath argument must be a non-empty string value",
    FINALIZING: "archive already finalizing",
    QUEUECLOSED: "queue closed",
    NOENDMETHOD: "no suitable finalize/end method defined by module",
    DIRECTORYNOTSUPPORTED: "support for directory entries not defined by module",
    FORMATSET: "archive format already set",
    INPUTSTEAMBUFFERREQUIRED: "input source must be valid Stream or Buffer instance",
    MODULESET: "module already set",
    SYMLINKNOTSUPPORTED: "support for symlink entries not defined by module",
    SYMLINKFILEPATHREQUIRED: "symlink filepath argument must be a non-empty string value",
    SYMLINKTARGETREQUIRED: "symlink target argument must be a non-empty string value",
    ENTRYNOTSUPPORTED: "entry not supported"
  };
  function i(a, s) {
    Error.captureStackTrace(this, this.constructor), this.message = n[a] || a, this.code = a, this.data = s;
  }
  r.inherits(i, Error), e.exports = i;
})(tl);
var xy = tl.exports, na = { exports: {} }, bi, fo;
function rl() {
  return fo || (fo = 1, bi = Ze), bi;
}
var wi, uo;
function Oy() {
  if (uo) return wi;
  uo = 1;
  function e(A, E) {
    var L = Object.keys(A);
    if (Object.getOwnPropertySymbols) {
      var c = Object.getOwnPropertySymbols(A);
      E && (c = c.filter(function(h) {
        return Object.getOwnPropertyDescriptor(A, h).enumerable;
      })), L.push.apply(L, c);
    }
    return L;
  }
  function t(A) {
    for (var E = 1; E < arguments.length; E++) {
      var L = arguments[E] != null ? arguments[E] : {};
      E % 2 ? e(Object(L), !0).forEach(function(c) {
        r(A, c, L[c]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(A, Object.getOwnPropertyDescriptors(L)) : e(Object(L)).forEach(function(c) {
        Object.defineProperty(A, c, Object.getOwnPropertyDescriptor(L, c));
      });
    }
    return A;
  }
  function r(A, E, L) {
    return E = s(E), E in A ? Object.defineProperty(A, E, { value: L, enumerable: !0, configurable: !0, writable: !0 }) : A[E] = L, A;
  }
  function n(A, E) {
    if (!(A instanceof E))
      throw new TypeError("Cannot call a class as a function");
  }
  function i(A, E) {
    for (var L = 0; L < E.length; L++) {
      var c = E[L];
      c.enumerable = c.enumerable || !1, c.configurable = !0, "value" in c && (c.writable = !0), Object.defineProperty(A, s(c.key), c);
    }
  }
  function a(A, E, L) {
    return E && i(A.prototype, E), Object.defineProperty(A, "prototype", { writable: !1 }), A;
  }
  function s(A) {
    var E = f(A, "string");
    return typeof E == "symbol" ? E : String(E);
  }
  function f(A, E) {
    if (typeof A != "object" || A === null) return A;
    var L = A[Symbol.toPrimitive];
    if (L !== void 0) {
      var c = L.call(A, E);
      if (typeof c != "object") return c;
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return String(A);
  }
  var u = vt, d = u.Buffer, g = Ee, p = g.inspect, v = p && p.custom || "inspect";
  function R(A, E, L) {
    d.prototype.copy.call(A, E, L);
  }
  return wi = /* @__PURE__ */ function() {
    function A() {
      n(this, A), this.head = null, this.tail = null, this.length = 0;
    }
    return a(A, [{
      key: "push",
      value: function(L) {
        var c = {
          data: L,
          next: null
        };
        this.length > 0 ? this.tail.next = c : this.head = c, this.tail = c, ++this.length;
      }
    }, {
      key: "unshift",
      value: function(L) {
        var c = {
          data: L,
          next: this.head
        };
        this.length === 0 && (this.tail = c), this.head = c, ++this.length;
      }
    }, {
      key: "shift",
      value: function() {
        if (this.length !== 0) {
          var L = this.head.data;
          return this.length === 1 ? this.head = this.tail = null : this.head = this.head.next, --this.length, L;
        }
      }
    }, {
      key: "clear",
      value: function() {
        this.head = this.tail = null, this.length = 0;
      }
    }, {
      key: "join",
      value: function(L) {
        if (this.length === 0) return "";
        for (var c = this.head, h = "" + c.data; c = c.next; ) h += L + c.data;
        return h;
      }
    }, {
      key: "concat",
      value: function(L) {
        if (this.length === 0) return d.alloc(0);
        for (var c = d.allocUnsafe(L >>> 0), h = this.head, O = 0; h; )
          R(h.data, c, O), O += h.data.length, h = h.next;
        return c;
      }
      // Consumes a specified amount of bytes or characters from the buffered data.
    }, {
      key: "consume",
      value: function(L, c) {
        var h;
        return L < this.head.data.length ? (h = this.head.data.slice(0, L), this.head.data = this.head.data.slice(L)) : L === this.head.data.length ? h = this.shift() : h = c ? this._getString(L) : this._getBuffer(L), h;
      }
    }, {
      key: "first",
      value: function() {
        return this.head.data;
      }
      // Consumes a specified amount of characters from the buffered data.
    }, {
      key: "_getString",
      value: function(L) {
        var c = this.head, h = 1, O = c.data;
        for (L -= O.length; c = c.next; ) {
          var m = c.data, x = L > m.length ? m.length : L;
          if (x === m.length ? O += m : O += m.slice(0, L), L -= x, L === 0) {
            x === m.length ? (++h, c.next ? this.head = c.next : this.head = this.tail = null) : (this.head = c, c.data = m.slice(x));
            break;
          }
          ++h;
        }
        return this.length -= h, O;
      }
      // Consumes a specified amount of bytes from the buffered data.
    }, {
      key: "_getBuffer",
      value: function(L) {
        var c = d.allocUnsafe(L), h = this.head, O = 1;
        for (h.data.copy(c), L -= h.data.length; h = h.next; ) {
          var m = h.data, x = L > m.length ? m.length : L;
          if (m.copy(c, c.length - L, 0, x), L -= x, L === 0) {
            x === m.length ? (++O, h.next ? this.head = h.next : this.head = this.tail = null) : (this.head = h, h.data = m.slice(x));
            break;
          }
          ++O;
        }
        return this.length -= O, c;
      }
      // Make sure the linked list only shows the minimal necessary information.
    }, {
      key: v,
      value: function(L, c) {
        return p(this, t(t({}, c), {}, {
          // Only inspect one level.
          depth: 0,
          // It should not recurse.
          customInspect: !1
        }));
      }
    }]), A;
  }(), wi;
}
var Si, lo;
function nl() {
  if (lo) return Si;
  lo = 1;
  function e(s, f) {
    var u = this, d = this._readableState && this._readableState.destroyed, g = this._writableState && this._writableState.destroyed;
    return d || g ? (f ? f(s) : s && (this._writableState ? this._writableState.errorEmitted || (this._writableState.errorEmitted = !0, process.nextTick(i, this, s)) : process.nextTick(i, this, s)), this) : (this._readableState && (this._readableState.destroyed = !0), this._writableState && (this._writableState.destroyed = !0), this._destroy(s || null, function(p) {
      !f && p ? u._writableState ? u._writableState.errorEmitted ? process.nextTick(r, u) : (u._writableState.errorEmitted = !0, process.nextTick(t, u, p)) : process.nextTick(t, u, p) : f ? (process.nextTick(r, u), f(p)) : process.nextTick(r, u);
    }), this);
  }
  function t(s, f) {
    i(s, f), r(s);
  }
  function r(s) {
    s._writableState && !s._writableState.emitClose || s._readableState && !s._readableState.emitClose || s.emit("close");
  }
  function n() {
    this._readableState && (this._readableState.destroyed = !1, this._readableState.reading = !1, this._readableState.ended = !1, this._readableState.endEmitted = !1), this._writableState && (this._writableState.destroyed = !1, this._writableState.ended = !1, this._writableState.ending = !1, this._writableState.finalCalled = !1, this._writableState.prefinished = !1, this._writableState.finished = !1, this._writableState.errorEmitted = !1);
  }
  function i(s, f) {
    s.emit("error", f);
  }
  function a(s, f) {
    var u = s._readableState, d = s._writableState;
    u && u.autoDestroy || d && d.autoDestroy ? s.destroy(f) : s.emit("error", f);
  }
  return Si = {
    destroy: e,
    undestroy: n,
    errorOrDestroy: a
  }, Si;
}
var Ei = {}, co;
function $t() {
  if (co) return Ei;
  co = 1;
  const e = {};
  function t(s, f, u) {
    u || (u = Error);
    function d(p, v, R) {
      return typeof f == "string" ? f : f(p, v, R);
    }
    class g extends u {
      constructor(v, R, A) {
        super(d(v, R, A));
      }
    }
    g.prototype.name = u.name, g.prototype.code = s, e[s] = g;
  }
  function r(s, f) {
    if (Array.isArray(s)) {
      const u = s.length;
      return s = s.map((d) => String(d)), u > 2 ? `one of ${f} ${s.slice(0, u - 1).join(", ")}, or ` + s[u - 1] : u === 2 ? `one of ${f} ${s[0]} or ${s[1]}` : `of ${f} ${s[0]}`;
    } else
      return `of ${f} ${String(s)}`;
  }
  function n(s, f, u) {
    return s.substr(0, f.length) === f;
  }
  function i(s, f, u) {
    return (u === void 0 || u > s.length) && (u = s.length), s.substring(u - f.length, u) === f;
  }
  function a(s, f, u) {
    return typeof u != "number" && (u = 0), u + f.length > s.length ? !1 : s.indexOf(f, u) !== -1;
  }
  return t("ERR_INVALID_OPT_VALUE", function(s, f) {
    return 'The value "' + f + '" is invalid for option "' + s + '"';
  }, TypeError), t("ERR_INVALID_ARG_TYPE", function(s, f, u) {
    let d;
    typeof f == "string" && n(f, "not ") ? (d = "must not be", f = f.replace(/^not /, "")) : d = "must be";
    let g;
    if (i(s, " argument"))
      g = `The ${s} ${d} ${r(f, "type")}`;
    else {
      const p = a(s, ".") ? "property" : "argument";
      g = `The "${s}" ${p} ${d} ${r(f, "type")}`;
    }
    return g += `. Received type ${typeof u}`, g;
  }, TypeError), t("ERR_STREAM_PUSH_AFTER_EOF", "stream.push() after EOF"), t("ERR_METHOD_NOT_IMPLEMENTED", function(s) {
    return "The " + s + " method is not implemented";
  }), t("ERR_STREAM_PREMATURE_CLOSE", "Premature close"), t("ERR_STREAM_DESTROYED", function(s) {
    return "Cannot call " + s + " after a stream was destroyed";
  }), t("ERR_MULTIPLE_CALLBACK", "Callback called multiple times"), t("ERR_STREAM_CANNOT_PIPE", "Cannot pipe, not readable"), t("ERR_STREAM_WRITE_AFTER_END", "write after end"), t("ERR_STREAM_NULL_VALUES", "May not write null values to stream", TypeError), t("ERR_UNKNOWN_ENCODING", function(s) {
    return "Unknown encoding: " + s;
  }, TypeError), t("ERR_STREAM_UNSHIFT_AFTER_END_EVENT", "stream.unshift() after end event"), Ei.codes = e, Ei;
}
var xi, ho;
function il() {
  if (ho) return xi;
  ho = 1;
  var e = $t().codes.ERR_INVALID_OPT_VALUE;
  function t(n, i, a) {
    return n.highWaterMark != null ? n.highWaterMark : i ? n[a] : null;
  }
  function r(n, i, a, s) {
    var f = t(i, s, a);
    if (f != null) {
      if (!(isFinite(f) && Math.floor(f) === f) || f < 0) {
        var u = s ? a : "highWaterMark";
        throw new e(u, f);
      }
      return Math.floor(f);
    }
    return n.objectMode ? 16 : 16 * 1024;
  }
  return xi = {
    getHighWaterMark: r
  }, xi;
}
var Oi, po;
function al() {
  if (po) return Oi;
  po = 1, Oi = T;
  function e(F) {
    var o = this;
    this.next = null, this.entry = null, this.finish = function() {
      pe(o, F);
    };
  }
  var t;
  T.WritableState = P;
  var r = {
    deprecate: Oa()
  }, n = rl(), i = vt.Buffer, a = (typeof oe < "u" ? oe : typeof window < "u" ? window : typeof self < "u" ? self : {}).Uint8Array || function() {
  };
  function s(F) {
    return i.from(F);
  }
  function f(F) {
    return i.isBuffer(F) || F instanceof a;
  }
  var u = nl(), d = il(), g = d.getHighWaterMark, p = $t().codes, v = p.ERR_INVALID_ARG_TYPE, R = p.ERR_METHOD_NOT_IMPLEMENTED, A = p.ERR_MULTIPLE_CALLBACK, E = p.ERR_STREAM_CANNOT_PIPE, L = p.ERR_STREAM_DESTROYED, c = p.ERR_STREAM_NULL_VALUES, h = p.ERR_STREAM_WRITE_AFTER_END, O = p.ERR_UNKNOWN_ENCODING, m = u.errorOrDestroy;
  ye(T, n);
  function x() {
  }
  function P(F, o, l) {
    t = t || Zt(), F = F || {}, typeof l != "boolean" && (l = o instanceof t), this.objectMode = !!F.objectMode, l && (this.objectMode = this.objectMode || !!F.writableObjectMode), this.highWaterMark = g(this, F, "writableHighWaterMark", l), this.finalCalled = !1, this.needDrain = !1, this.ending = !1, this.ended = !1, this.finished = !1, this.destroyed = !1;
    var $ = F.decodeStrings === !1;
    this.decodeStrings = !$, this.defaultEncoding = F.defaultEncoding || "utf8", this.length = 0, this.writing = !1, this.corked = 0, this.sync = !0, this.bufferProcessing = !1, this.onwrite = function(I) {
      Y(o, I);
    }, this.writecb = null, this.writelen = 0, this.bufferedRequest = null, this.lastBufferedRequest = null, this.pendingcb = 0, this.prefinished = !1, this.errorEmitted = !1, this.emitClose = F.emitClose !== !1, this.autoDestroy = !!F.autoDestroy, this.bufferedRequestCount = 0, this.corkedRequestsFree = new e(this);
  }
  P.prototype.getBuffer = function() {
    for (var o = this.bufferedRequest, l = []; o; )
      l.push(o), o = o.next;
    return l;
  }, function() {
    try {
      Object.defineProperty(P.prototype, "buffer", {
        get: r.deprecate(function() {
          return this.getBuffer();
        }, "_writableState.buffer is deprecated. Use _writableState.getBuffer instead.", "DEP0003")
      });
    } catch {
    }
  }();
  var C;
  typeof Symbol == "function" && Symbol.hasInstance && typeof Function.prototype[Symbol.hasInstance] == "function" ? (C = Function.prototype[Symbol.hasInstance], Object.defineProperty(T, Symbol.hasInstance, {
    value: function(o) {
      return C.call(this, o) ? !0 : this !== T ? !1 : o && o._writableState instanceof P;
    }
  })) : C = function(o) {
    return o instanceof this;
  };
  function T(F) {
    t = t || Zt();
    var o = this instanceof t;
    if (!o && !C.call(T, this)) return new T(F);
    this._writableState = new P(F, this, o), this.writable = !0, F && (typeof F.write == "function" && (this._write = F.write), typeof F.writev == "function" && (this._writev = F.writev), typeof F.destroy == "function" && (this._destroy = F.destroy), typeof F.final == "function" && (this._final = F.final)), n.call(this);
  }
  T.prototype.pipe = function() {
    m(this, new E());
  };
  function M(F, o) {
    var l = new h();
    m(F, l), process.nextTick(o, l);
  }
  function N(F, o, l, $) {
    var I;
    return l === null ? I = new c() : typeof l != "string" && !o.objectMode && (I = new v("chunk", ["string", "Buffer"], l)), I ? (m(F, I), process.nextTick($, I), !1) : !0;
  }
  T.prototype.write = function(F, o, l) {
    var $ = this._writableState, I = !1, w = !$.objectMode && f(F);
    return w && !i.isBuffer(F) && (F = s(F)), typeof o == "function" && (l = o, o = null), w ? o = "buffer" : o || (o = $.defaultEncoding), typeof l != "function" && (l = x), $.ending ? M(this, l) : (w || N(this, $, F, l)) && ($.pendingcb++, I = U(this, $, w, F, o, l)), I;
  }, T.prototype.cork = function() {
    this._writableState.corked++;
  }, T.prototype.uncork = function() {
    var F = this._writableState;
    F.corked && (F.corked--, !F.writing && !F.corked && !F.bufferProcessing && F.bufferedRequest && D(this, F));
  }, T.prototype.setDefaultEncoding = function(o) {
    if (typeof o == "string" && (o = o.toLowerCase()), !(["hex", "utf8", "utf-8", "ascii", "binary", "base64", "ucs2", "ucs-2", "utf16le", "utf-16le", "raw"].indexOf((o + "").toLowerCase()) > -1)) throw new O(o);
    return this._writableState.defaultEncoding = o, this;
  }, Object.defineProperty(T.prototype, "writableBuffer", {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: !1,
    get: function() {
      return this._writableState && this._writableState.getBuffer();
    }
  });
  function B(F, o, l) {
    return !F.objectMode && F.decodeStrings !== !1 && typeof o == "string" && (o = i.from(o, l)), o;
  }
  Object.defineProperty(T.prototype, "writableHighWaterMark", {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: !1,
    get: function() {
      return this._writableState.highWaterMark;
    }
  });
  function U(F, o, l, $, I, w) {
    if (!l) {
      var y = B(o, $, I);
      $ !== y && (l = !0, I = "buffer", $ = y);
    }
    var j = o.objectMode ? 1 : $.length;
    o.length += j;
    var z = o.length < o.highWaterMark;
    if (z || (o.needDrain = !0), o.writing || o.corked) {
      var ae = o.lastBufferedRequest;
      o.lastBufferedRequest = {
        chunk: $,
        encoding: I,
        isBuf: l,
        callback: w,
        next: null
      }, ae ? ae.next = o.lastBufferedRequest : o.bufferedRequest = o.lastBufferedRequest, o.bufferedRequestCount += 1;
    } else
      q(F, o, !1, j, $, I, w);
    return z;
  }
  function q(F, o, l, $, I, w, y) {
    o.writelen = $, o.writecb = y, o.writing = !0, o.sync = !0, o.destroyed ? o.onwrite(new L("write")) : l ? F._writev(I, o.onwrite) : F._write(I, w, o.onwrite), o.sync = !1;
  }
  function H(F, o, l, $, I) {
    --o.pendingcb, l ? (process.nextTick(I, $), process.nextTick(ie, F, o), F._writableState.errorEmitted = !0, m(F, $)) : (I($), F._writableState.errorEmitted = !0, m(F, $), ie(F, o));
  }
  function V(F) {
    F.writing = !1, F.writecb = null, F.length -= F.writelen, F.writelen = 0;
  }
  function Y(F, o) {
    var l = F._writableState, $ = l.sync, I = l.writecb;
    if (typeof I != "function") throw new A();
    if (V(l), o) H(F, l, $, o, I);
    else {
      var w = k(l) || F.destroyed;
      !w && !l.corked && !l.bufferProcessing && l.bufferedRequest && D(F, l), $ ? process.nextTick(b, F, l, w, I) : b(F, l, w, I);
    }
  }
  function b(F, o, l, $) {
    l || S(F, o), o.pendingcb--, $(), ie(F, o);
  }
  function S(F, o) {
    o.length === 0 && o.needDrain && (o.needDrain = !1, F.emit("drain"));
  }
  function D(F, o) {
    o.bufferProcessing = !0;
    var l = o.bufferedRequest;
    if (F._writev && l && l.next) {
      var $ = o.bufferedRequestCount, I = new Array($), w = o.corkedRequestsFree;
      w.entry = l;
      for (var y = 0, j = !0; l; )
        I[y] = l, l.isBuf || (j = !1), l = l.next, y += 1;
      I.allBuffers = j, q(F, o, !0, o.length, I, "", w.finish), o.pendingcb++, o.lastBufferedRequest = null, w.next ? (o.corkedRequestsFree = w.next, w.next = null) : o.corkedRequestsFree = new e(o), o.bufferedRequestCount = 0;
    } else {
      for (; l; ) {
        var z = l.chunk, ae = l.encoding, Q = l.callback, se = o.objectMode ? 1 : z.length;
        if (q(F, o, !1, se, z, ae, Q), l = l.next, o.bufferedRequestCount--, o.writing)
          break;
      }
      l === null && (o.lastBufferedRequest = null);
    }
    o.bufferedRequest = l, o.bufferProcessing = !1;
  }
  T.prototype._write = function(F, o, l) {
    l(new R("_write()"));
  }, T.prototype._writev = null, T.prototype.end = function(F, o, l) {
    var $ = this._writableState;
    return typeof F == "function" ? (l = F, F = null, o = null) : typeof o == "function" && (l = o, o = null), F != null && this.write(F, o), $.corked && ($.corked = 1, this.uncork()), $.ending || fe(this, $, l), this;
  }, Object.defineProperty(T.prototype, "writableLength", {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: !1,
    get: function() {
      return this._writableState.length;
    }
  });
  function k(F) {
    return F.ending && F.length === 0 && F.bufferedRequest === null && !F.finished && !F.writing;
  }
  function W(F, o) {
    F._final(function(l) {
      o.pendingcb--, l && m(F, l), o.prefinished = !0, F.emit("prefinish"), ie(F, o);
    });
  }
  function G(F, o) {
    !o.prefinished && !o.finalCalled && (typeof F._final == "function" && !o.destroyed ? (o.pendingcb++, o.finalCalled = !0, process.nextTick(W, F, o)) : (o.prefinished = !0, F.emit("prefinish")));
  }
  function ie(F, o) {
    var l = k(o);
    if (l && (G(F, o), o.pendingcb === 0 && (o.finished = !0, F.emit("finish"), o.autoDestroy))) {
      var $ = F._readableState;
      (!$ || $.autoDestroy && $.endEmitted) && F.destroy();
    }
    return l;
  }
  function fe(F, o, l) {
    o.ending = !0, ie(F, o), l && (o.finished ? process.nextTick(l) : F.once("finish", l)), o.ended = !0, F.writable = !1;
  }
  function pe(F, o, l) {
    var $ = F.entry;
    for (F.entry = null; $; ) {
      var I = $.callback;
      o.pendingcb--, I(l), $ = $.next;
    }
    o.corkedRequestsFree.next = F;
  }
  return Object.defineProperty(T.prototype, "destroyed", {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: !1,
    get: function() {
      return this._writableState === void 0 ? !1 : this._writableState.destroyed;
    },
    set: function(o) {
      this._writableState && (this._writableState.destroyed = o);
    }
  }), T.prototype.destroy = u.destroy, T.prototype._undestroy = u.undestroy, T.prototype._destroy = function(F, o) {
    o(F);
  }, Oi;
}
var Ri, go;
function Zt() {
  if (go) return Ri;
  go = 1;
  var e = Object.keys || function(d) {
    var g = [];
    for (var p in d) g.push(p);
    return g;
  };
  Ri = s;
  var t = sl(), r = al();
  ye(s, t);
  for (var n = e(r.prototype), i = 0; i < n.length; i++) {
    var a = n[i];
    s.prototype[a] || (s.prototype[a] = r.prototype[a]);
  }
  function s(d) {
    if (!(this instanceof s)) return new s(d);
    t.call(this, d), r.call(this, d), this.allowHalfOpen = !0, d && (d.readable === !1 && (this.readable = !1), d.writable === !1 && (this.writable = !1), d.allowHalfOpen === !1 && (this.allowHalfOpen = !1, this.once("end", f)));
  }
  Object.defineProperty(s.prototype, "writableHighWaterMark", {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: !1,
    get: function() {
      return this._writableState.highWaterMark;
    }
  }), Object.defineProperty(s.prototype, "writableBuffer", {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: !1,
    get: function() {
      return this._writableState && this._writableState.getBuffer();
    }
  }), Object.defineProperty(s.prototype, "writableLength", {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: !1,
    get: function() {
      return this._writableState.length;
    }
  });
  function f() {
    this._writableState.ended || process.nextTick(u, this);
  }
  function u(d) {
    d.end();
  }
  return Object.defineProperty(s.prototype, "destroyed", {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: !1,
    get: function() {
      return this._readableState === void 0 || this._writableState === void 0 ? !1 : this._readableState.destroyed && this._writableState.destroyed;
    },
    set: function(g) {
      this._readableState === void 0 || this._writableState === void 0 || (this._readableState.destroyed = g, this._writableState.destroyed = g);
    }
  }), Ri;
}
var Ti = {}, jr = { exports: {} };
/*! safe-buffer. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> */
var vo;
function Ry() {
  return vo || (vo = 1, function(e, t) {
    var r = vt, n = r.Buffer;
    function i(s, f) {
      for (var u in s)
        f[u] = s[u];
    }
    n.from && n.alloc && n.allocUnsafe && n.allocUnsafeSlow ? e.exports = r : (i(r, t), t.Buffer = a);
    function a(s, f, u) {
      return n(s, f, u);
    }
    a.prototype = Object.create(n.prototype), i(n, a), a.from = function(s, f, u) {
      if (typeof s == "number")
        throw new TypeError("Argument must not be a number");
      return n(s, f, u);
    }, a.alloc = function(s, f, u) {
      if (typeof s != "number")
        throw new TypeError("Argument must be a number");
      var d = n(s);
      return f !== void 0 ? typeof u == "string" ? d.fill(f, u) : d.fill(f) : d.fill(0), d;
    }, a.allocUnsafe = function(s) {
      if (typeof s != "number")
        throw new TypeError("Argument must be a number");
      return n(s);
    }, a.allocUnsafeSlow = function(s) {
      if (typeof s != "number")
        throw new TypeError("Argument must be a number");
      return r.SlowBuffer(s);
    };
  }(jr, jr.exports)), jr.exports;
}
var yo;
function mo() {
  if (yo) return Ti;
  yo = 1;
  var e = Ry().Buffer, t = e.isEncoding || function(c) {
    switch (c = "" + c, c && c.toLowerCase()) {
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
        return !0;
      default:
        return !1;
    }
  };
  function r(c) {
    if (!c) return "utf8";
    for (var h; ; )
      switch (c) {
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
          return c;
        default:
          if (h) return;
          c = ("" + c).toLowerCase(), h = !0;
      }
  }
  function n(c) {
    var h = r(c);
    if (typeof h != "string" && (e.isEncoding === t || !t(c))) throw new Error("Unknown encoding: " + c);
    return h || c;
  }
  Ti.StringDecoder = i;
  function i(c) {
    this.encoding = n(c);
    var h;
    switch (this.encoding) {
      case "utf16le":
        this.text = p, this.end = v, h = 4;
        break;
      case "utf8":
        this.fillLast = u, h = 4;
        break;
      case "base64":
        this.text = R, this.end = A, h = 3;
        break;
      default:
        this.write = E, this.end = L;
        return;
    }
    this.lastNeed = 0, this.lastTotal = 0, this.lastChar = e.allocUnsafe(h);
  }
  i.prototype.write = function(c) {
    if (c.length === 0) return "";
    var h, O;
    if (this.lastNeed) {
      if (h = this.fillLast(c), h === void 0) return "";
      O = this.lastNeed, this.lastNeed = 0;
    } else
      O = 0;
    return O < c.length ? h ? h + this.text(c, O) : this.text(c, O) : h || "";
  }, i.prototype.end = g, i.prototype.text = d, i.prototype.fillLast = function(c) {
    if (this.lastNeed <= c.length)
      return c.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, this.lastNeed), this.lastChar.toString(this.encoding, 0, this.lastTotal);
    c.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, c.length), this.lastNeed -= c.length;
  };
  function a(c) {
    return c <= 127 ? 0 : c >> 5 === 6 ? 2 : c >> 4 === 14 ? 3 : c >> 3 === 30 ? 4 : c >> 6 === 2 ? -1 : -2;
  }
  function s(c, h, O) {
    var m = h.length - 1;
    if (m < O) return 0;
    var x = a(h[m]);
    return x >= 0 ? (x > 0 && (c.lastNeed = x - 1), x) : --m < O || x === -2 ? 0 : (x = a(h[m]), x >= 0 ? (x > 0 && (c.lastNeed = x - 2), x) : --m < O || x === -2 ? 0 : (x = a(h[m]), x >= 0 ? (x > 0 && (x === 2 ? x = 0 : c.lastNeed = x - 3), x) : 0));
  }
  function f(c, h, O) {
    if ((h[0] & 192) !== 128)
      return c.lastNeed = 0, "�";
    if (c.lastNeed > 1 && h.length > 1) {
      if ((h[1] & 192) !== 128)
        return c.lastNeed = 1, "�";
      if (c.lastNeed > 2 && h.length > 2 && (h[2] & 192) !== 128)
        return c.lastNeed = 2, "�";
    }
  }
  function u(c) {
    var h = this.lastTotal - this.lastNeed, O = f(this, c);
    if (O !== void 0) return O;
    if (this.lastNeed <= c.length)
      return c.copy(this.lastChar, h, 0, this.lastNeed), this.lastChar.toString(this.encoding, 0, this.lastTotal);
    c.copy(this.lastChar, h, 0, c.length), this.lastNeed -= c.length;
  }
  function d(c, h) {
    var O = s(this, c, h);
    if (!this.lastNeed) return c.toString("utf8", h);
    this.lastTotal = O;
    var m = c.length - (O - this.lastNeed);
    return c.copy(this.lastChar, 0, m), c.toString("utf8", h, m);
  }
  function g(c) {
    var h = c && c.length ? this.write(c) : "";
    return this.lastNeed ? h + "�" : h;
  }
  function p(c, h) {
    if ((c.length - h) % 2 === 0) {
      var O = c.toString("utf16le", h);
      if (O) {
        var m = O.charCodeAt(O.length - 1);
        if (m >= 55296 && m <= 56319)
          return this.lastNeed = 2, this.lastTotal = 4, this.lastChar[0] = c[c.length - 2], this.lastChar[1] = c[c.length - 1], O.slice(0, -1);
      }
      return O;
    }
    return this.lastNeed = 1, this.lastTotal = 2, this.lastChar[0] = c[c.length - 1], c.toString("utf16le", h, c.length - 1);
  }
  function v(c) {
    var h = c && c.length ? this.write(c) : "";
    if (this.lastNeed) {
      var O = this.lastTotal - this.lastNeed;
      return h + this.lastChar.toString("utf16le", 0, O);
    }
    return h;
  }
  function R(c, h) {
    var O = (c.length - h) % 3;
    return O === 0 ? c.toString("base64", h) : (this.lastNeed = 3 - O, this.lastTotal = 3, O === 1 ? this.lastChar[0] = c[c.length - 1] : (this.lastChar[0] = c[c.length - 2], this.lastChar[1] = c[c.length - 1]), c.toString("base64", h, c.length - O));
  }
  function A(c) {
    var h = c && c.length ? this.write(c) : "";
    return this.lastNeed ? h + this.lastChar.toString("base64", 0, 3 - this.lastNeed) : h;
  }
  function E(c) {
    return c.toString(this.encoding);
  }
  function L(c) {
    return c && c.length ? this.write(c) : "";
  }
  return Ti;
}
var Ai, _o;
function Ha() {
  if (_o) return Ai;
  _o = 1;
  var e = $t().codes.ERR_STREAM_PREMATURE_CLOSE;
  function t(a) {
    var s = !1;
    return function() {
      if (!s) {
        s = !0;
        for (var f = arguments.length, u = new Array(f), d = 0; d < f; d++)
          u[d] = arguments[d];
        a.apply(this, u);
      }
    };
  }
  function r() {
  }
  function n(a) {
    return a.setHeader && typeof a.abort == "function";
  }
  function i(a, s, f) {
    if (typeof s == "function") return i(a, null, s);
    s || (s = {}), f = t(f || r);
    var u = s.readable || s.readable !== !1 && a.readable, d = s.writable || s.writable !== !1 && a.writable, g = function() {
      a.writable || v();
    }, p = a._writableState && a._writableState.finished, v = function() {
      d = !1, p = !0, u || f.call(a);
    }, R = a._readableState && a._readableState.endEmitted, A = function() {
      u = !1, R = !0, d || f.call(a);
    }, E = function(O) {
      f.call(a, O);
    }, L = function() {
      var O;
      if (u && !R)
        return (!a._readableState || !a._readableState.ended) && (O = new e()), f.call(a, O);
      if (d && !p)
        return (!a._writableState || !a._writableState.ended) && (O = new e()), f.call(a, O);
    }, c = function() {
      a.req.on("finish", v);
    };
    return n(a) ? (a.on("complete", v), a.on("abort", L), a.req ? c() : a.on("request", c)) : d && !a._writableState && (a.on("end", g), a.on("close", g)), a.on("end", A), a.on("finish", v), s.error !== !1 && a.on("error", E), a.on("close", L), function() {
      a.removeListener("complete", v), a.removeListener("abort", L), a.removeListener("request", c), a.req && a.req.removeListener("finish", v), a.removeListener("end", g), a.removeListener("close", g), a.removeListener("finish", v), a.removeListener("end", A), a.removeListener("error", E), a.removeListener("close", L);
    };
  }
  return Ai = i, Ai;
}
var Li, bo;
function Ty() {
  if (bo) return Li;
  bo = 1;
  var e;
  function t(O, m, x) {
    return m = r(m), m in O ? Object.defineProperty(O, m, { value: x, enumerable: !0, configurable: !0, writable: !0 }) : O[m] = x, O;
  }
  function r(O) {
    var m = n(O, "string");
    return typeof m == "symbol" ? m : String(m);
  }
  function n(O, m) {
    if (typeof O != "object" || O === null) return O;
    var x = O[Symbol.toPrimitive];
    if (x !== void 0) {
      var P = x.call(O, m);
      if (typeof P != "object") return P;
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return (m === "string" ? String : Number)(O);
  }
  var i = Ha(), a = Symbol("lastResolve"), s = Symbol("lastReject"), f = Symbol("error"), u = Symbol("ended"), d = Symbol("lastPromise"), g = Symbol("handlePromise"), p = Symbol("stream");
  function v(O, m) {
    return {
      value: O,
      done: m
    };
  }
  function R(O) {
    var m = O[a];
    if (m !== null) {
      var x = O[p].read();
      x !== null && (O[d] = null, O[a] = null, O[s] = null, m(v(x, !1)));
    }
  }
  function A(O) {
    process.nextTick(R, O);
  }
  function E(O, m) {
    return function(x, P) {
      O.then(function() {
        if (m[u]) {
          x(v(void 0, !0));
          return;
        }
        m[g](x, P);
      }, P);
    };
  }
  var L = Object.getPrototypeOf(function() {
  }), c = Object.setPrototypeOf((e = {
    get stream() {
      return this[p];
    },
    next: function() {
      var m = this, x = this[f];
      if (x !== null)
        return Promise.reject(x);
      if (this[u])
        return Promise.resolve(v(void 0, !0));
      if (this[p].destroyed)
        return new Promise(function(M, N) {
          process.nextTick(function() {
            m[f] ? N(m[f]) : M(v(void 0, !0));
          });
        });
      var P = this[d], C;
      if (P)
        C = new Promise(E(P, this));
      else {
        var T = this[p].read();
        if (T !== null)
          return Promise.resolve(v(T, !1));
        C = new Promise(this[g]);
      }
      return this[d] = C, C;
    }
  }, t(e, Symbol.asyncIterator, function() {
    return this;
  }), t(e, "return", function() {
    var m = this;
    return new Promise(function(x, P) {
      m[p].destroy(null, function(C) {
        if (C) {
          P(C);
          return;
        }
        x(v(void 0, !0));
      });
    });
  }), e), L), h = function(m) {
    var x, P = Object.create(c, (x = {}, t(x, p, {
      value: m,
      writable: !0
    }), t(x, a, {
      value: null,
      writable: !0
    }), t(x, s, {
      value: null,
      writable: !0
    }), t(x, f, {
      value: null,
      writable: !0
    }), t(x, u, {
      value: m._readableState.endEmitted,
      writable: !0
    }), t(x, g, {
      value: function(T, M) {
        var N = P[p].read();
        N ? (P[d] = null, P[a] = null, P[s] = null, T(v(N, !1))) : (P[a] = T, P[s] = M);
      },
      writable: !0
    }), x));
    return P[d] = null, i(m, function(C) {
      if (C && C.code !== "ERR_STREAM_PREMATURE_CLOSE") {
        var T = P[s];
        T !== null && (P[d] = null, P[a] = null, P[s] = null, T(C)), P[f] = C;
        return;
      }
      var M = P[a];
      M !== null && (P[d] = null, P[a] = null, P[s] = null, M(v(void 0, !0))), P[u] = !0;
    }), m.on("readable", A.bind(null, P)), P;
  };
  return Li = h, Li;
}
var $i, wo;
function Ay() {
  if (wo) return $i;
  wo = 1;
  function e(d, g, p, v, R, A, E) {
    try {
      var L = d[A](E), c = L.value;
    } catch (h) {
      p(h);
      return;
    }
    L.done ? g(c) : Promise.resolve(c).then(v, R);
  }
  function t(d) {
    return function() {
      var g = this, p = arguments;
      return new Promise(function(v, R) {
        var A = d.apply(g, p);
        function E(c) {
          e(A, v, R, E, L, "next", c);
        }
        function L(c) {
          e(A, v, R, E, L, "throw", c);
        }
        E(void 0);
      });
    };
  }
  function r(d, g) {
    var p = Object.keys(d);
    if (Object.getOwnPropertySymbols) {
      var v = Object.getOwnPropertySymbols(d);
      g && (v = v.filter(function(R) {
        return Object.getOwnPropertyDescriptor(d, R).enumerable;
      })), p.push.apply(p, v);
    }
    return p;
  }
  function n(d) {
    for (var g = 1; g < arguments.length; g++) {
      var p = arguments[g] != null ? arguments[g] : {};
      g % 2 ? r(Object(p), !0).forEach(function(v) {
        i(d, v, p[v]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(d, Object.getOwnPropertyDescriptors(p)) : r(Object(p)).forEach(function(v) {
        Object.defineProperty(d, v, Object.getOwnPropertyDescriptor(p, v));
      });
    }
    return d;
  }
  function i(d, g, p) {
    return g = a(g), g in d ? Object.defineProperty(d, g, { value: p, enumerable: !0, configurable: !0, writable: !0 }) : d[g] = p, d;
  }
  function a(d) {
    var g = s(d, "string");
    return typeof g == "symbol" ? g : String(g);
  }
  function s(d, g) {
    if (typeof d != "object" || d === null) return d;
    var p = d[Symbol.toPrimitive];
    if (p !== void 0) {
      var v = p.call(d, g);
      if (typeof v != "object") return v;
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return (g === "string" ? String : Number)(d);
  }
  var f = $t().codes.ERR_INVALID_ARG_TYPE;
  function u(d, g, p) {
    var v;
    if (g && typeof g.next == "function")
      v = g;
    else if (g && g[Symbol.asyncIterator]) v = g[Symbol.asyncIterator]();
    else if (g && g[Symbol.iterator]) v = g[Symbol.iterator]();
    else throw new f("iterable", ["Iterable"], g);
    var R = new d(n({
      objectMode: !0
    }, p)), A = !1;
    R._read = function() {
      A || (A = !0, E());
    };
    function E() {
      return L.apply(this, arguments);
    }
    function L() {
      return L = t(function* () {
        try {
          var c = yield v.next(), h = c.value, O = c.done;
          O ? R.push(null) : R.push(yield h) ? E() : A = !1;
        } catch (m) {
          R.destroy(m);
        }
      }), L.apply(this, arguments);
    }
    return R;
  }
  return $i = u, $i;
}
var Mi, So;
function sl() {
  if (So) return Mi;
  So = 1, Mi = M;
  var e;
  M.ReadableState = T, wr.EventEmitter;
  var t = function(y, j) {
    return y.listeners(j).length;
  }, r = rl(), n = vt.Buffer, i = (typeof oe < "u" ? oe : typeof window < "u" ? window : typeof self < "u" ? self : {}).Uint8Array || function() {
  };
  function a(w) {
    return n.from(w);
  }
  function s(w) {
    return n.isBuffer(w) || w instanceof i;
  }
  var f = Ee, u;
  f && f.debuglog ? u = f.debuglog("stream") : u = function() {
  };
  var d = Oy(), g = nl(), p = il(), v = p.getHighWaterMark, R = $t().codes, A = R.ERR_INVALID_ARG_TYPE, E = R.ERR_STREAM_PUSH_AFTER_EOF, L = R.ERR_METHOD_NOT_IMPLEMENTED, c = R.ERR_STREAM_UNSHIFT_AFTER_END_EVENT, h, O, m;
  ye(M, r);
  var x = g.errorOrDestroy, P = ["error", "close", "destroy", "pause", "resume"];
  function C(w, y, j) {
    if (typeof w.prependListener == "function") return w.prependListener(y, j);
    !w._events || !w._events[y] ? w.on(y, j) : Array.isArray(w._events[y]) ? w._events[y].unshift(j) : w._events[y] = [j, w._events[y]];
  }
  function T(w, y, j) {
    e = e || Zt(), w = w || {}, typeof j != "boolean" && (j = y instanceof e), this.objectMode = !!w.objectMode, j && (this.objectMode = this.objectMode || !!w.readableObjectMode), this.highWaterMark = v(this, w, "readableHighWaterMark", j), this.buffer = new d(), this.length = 0, this.pipes = null, this.pipesCount = 0, this.flowing = null, this.ended = !1, this.endEmitted = !1, this.reading = !1, this.sync = !0, this.needReadable = !1, this.emittedReadable = !1, this.readableListening = !1, this.resumeScheduled = !1, this.paused = !0, this.emitClose = w.emitClose !== !1, this.autoDestroy = !!w.autoDestroy, this.destroyed = !1, this.defaultEncoding = w.defaultEncoding || "utf8", this.awaitDrain = 0, this.readingMore = !1, this.decoder = null, this.encoding = null, w.encoding && (h || (h = mo().StringDecoder), this.decoder = new h(w.encoding), this.encoding = w.encoding);
  }
  function M(w) {
    if (e = e || Zt(), !(this instanceof M)) return new M(w);
    var y = this instanceof e;
    this._readableState = new T(w, this, y), this.readable = !0, w && (typeof w.read == "function" && (this._read = w.read), typeof w.destroy == "function" && (this._destroy = w.destroy)), r.call(this);
  }
  Object.defineProperty(M.prototype, "destroyed", {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: !1,
    get: function() {
      return this._readableState === void 0 ? !1 : this._readableState.destroyed;
    },
    set: function(y) {
      this._readableState && (this._readableState.destroyed = y);
    }
  }), M.prototype.destroy = g.destroy, M.prototype._undestroy = g.undestroy, M.prototype._destroy = function(w, y) {
    y(w);
  }, M.prototype.push = function(w, y) {
    var j = this._readableState, z;
    return j.objectMode ? z = !0 : typeof w == "string" && (y = y || j.defaultEncoding, y !== j.encoding && (w = n.from(w, y), y = ""), z = !0), N(this, w, y, !1, z);
  }, M.prototype.unshift = function(w) {
    return N(this, w, null, !0, !1);
  };
  function N(w, y, j, z, ae) {
    u("readableAddChunk", y);
    var Q = w._readableState;
    if (y === null)
      Q.reading = !1, Y(w, Q);
    else {
      var se;
      if (ae || (se = U(Q, y)), se)
        x(w, se);
      else if (Q.objectMode || y && y.length > 0)
        if (typeof y != "string" && !Q.objectMode && Object.getPrototypeOf(y) !== n.prototype && (y = a(y)), z)
          Q.endEmitted ? x(w, new c()) : B(w, Q, y, !0);
        else if (Q.ended)
          x(w, new E());
        else {
          if (Q.destroyed)
            return !1;
          Q.reading = !1, Q.decoder && !j ? (y = Q.decoder.write(y), Q.objectMode || y.length !== 0 ? B(w, Q, y, !1) : D(w, Q)) : B(w, Q, y, !1);
        }
      else z || (Q.reading = !1, D(w, Q));
    }
    return !Q.ended && (Q.length < Q.highWaterMark || Q.length === 0);
  }
  function B(w, y, j, z) {
    y.flowing && y.length === 0 && !y.sync ? (y.awaitDrain = 0, w.emit("data", j)) : (y.length += y.objectMode ? 1 : j.length, z ? y.buffer.unshift(j) : y.buffer.push(j), y.needReadable && b(w)), D(w, y);
  }
  function U(w, y) {
    var j;
    return !s(y) && typeof y != "string" && y !== void 0 && !w.objectMode && (j = new A("chunk", ["string", "Buffer", "Uint8Array"], y)), j;
  }
  M.prototype.isPaused = function() {
    return this._readableState.flowing === !1;
  }, M.prototype.setEncoding = function(w) {
    h || (h = mo().StringDecoder);
    var y = new h(w);
    this._readableState.decoder = y, this._readableState.encoding = this._readableState.decoder.encoding;
    for (var j = this._readableState.buffer.head, z = ""; j !== null; )
      z += y.write(j.data), j = j.next;
    return this._readableState.buffer.clear(), z !== "" && this._readableState.buffer.push(z), this._readableState.length = z.length, this;
  };
  var q = 1073741824;
  function H(w) {
    return w >= q ? w = q : (w--, w |= w >>> 1, w |= w >>> 2, w |= w >>> 4, w |= w >>> 8, w |= w >>> 16, w++), w;
  }
  function V(w, y) {
    return w <= 0 || y.length === 0 && y.ended ? 0 : y.objectMode ? 1 : w !== w ? y.flowing && y.length ? y.buffer.head.data.length : y.length : (w > y.highWaterMark && (y.highWaterMark = H(w)), w <= y.length ? w : y.ended ? y.length : (y.needReadable = !0, 0));
  }
  M.prototype.read = function(w) {
    u("read", w), w = parseInt(w, 10);
    var y = this._readableState, j = w;
    if (w !== 0 && (y.emittedReadable = !1), w === 0 && y.needReadable && ((y.highWaterMark !== 0 ? y.length >= y.highWaterMark : y.length > 0) || y.ended))
      return u("read: emitReadable", y.length, y.ended), y.length === 0 && y.ended ? l(this) : b(this), null;
    if (w = V(w, y), w === 0 && y.ended)
      return y.length === 0 && l(this), null;
    var z = y.needReadable;
    u("need readable", z), (y.length === 0 || y.length - w < y.highWaterMark) && (z = !0, u("length less than watermark", z)), y.ended || y.reading ? (z = !1, u("reading or ended", z)) : z && (u("do read"), y.reading = !0, y.sync = !0, y.length === 0 && (y.needReadable = !0), this._read(y.highWaterMark), y.sync = !1, y.reading || (w = V(j, y)));
    var ae;
    return w > 0 ? ae = o(w, y) : ae = null, ae === null ? (y.needReadable = y.length <= y.highWaterMark, w = 0) : (y.length -= w, y.awaitDrain = 0), y.length === 0 && (y.ended || (y.needReadable = !0), j !== w && y.ended && l(this)), ae !== null && this.emit("data", ae), ae;
  };
  function Y(w, y) {
    if (u("onEofChunk"), !y.ended) {
      if (y.decoder) {
        var j = y.decoder.end();
        j && j.length && (y.buffer.push(j), y.length += y.objectMode ? 1 : j.length);
      }
      y.ended = !0, y.sync ? b(w) : (y.needReadable = !1, y.emittedReadable || (y.emittedReadable = !0, S(w)));
    }
  }
  function b(w) {
    var y = w._readableState;
    u("emitReadable", y.needReadable, y.emittedReadable), y.needReadable = !1, y.emittedReadable || (u("emitReadable", y.flowing), y.emittedReadable = !0, process.nextTick(S, w));
  }
  function S(w) {
    var y = w._readableState;
    u("emitReadable_", y.destroyed, y.length, y.ended), !y.destroyed && (y.length || y.ended) && (w.emit("readable"), y.emittedReadable = !1), y.needReadable = !y.flowing && !y.ended && y.length <= y.highWaterMark, F(w);
  }
  function D(w, y) {
    y.readingMore || (y.readingMore = !0, process.nextTick(k, w, y));
  }
  function k(w, y) {
    for (; !y.reading && !y.ended && (y.length < y.highWaterMark || y.flowing && y.length === 0); ) {
      var j = y.length;
      if (u("maybeReadMore read 0"), w.read(0), j === y.length)
        break;
    }
    y.readingMore = !1;
  }
  M.prototype._read = function(w) {
    x(this, new L("_read()"));
  }, M.prototype.pipe = function(w, y) {
    var j = this, z = this._readableState;
    switch (z.pipesCount) {
      case 0:
        z.pipes = w;
        break;
      case 1:
        z.pipes = [z.pipes, w];
        break;
      default:
        z.pipes.push(w);
        break;
    }
    z.pipesCount += 1, u("pipe count=%d opts=%j", z.pipesCount, y);
    var ae = (!y || y.end !== !1) && w !== process.stdout && w !== process.stderr, Q = ae ? Le : rr;
    z.endEmitted ? process.nextTick(Q) : j.once("end", Q), w.on("unpipe", se);
    function se(Dt, Pt) {
      u("onunpipe"), Dt === j && Pt && Pt.hasUnpiped === !1 && (Pt.hasUnpiped = !0, Qe());
    }
    function Le() {
      u("onend"), w.end();
    }
    var qe = W(j);
    w.on("drain", qe);
    var ze = !1;
    function Qe() {
      u("cleanup"), w.removeListener("close", me), w.removeListener("finish", Re), w.removeListener("drain", qe), w.removeListener("error", Oe), w.removeListener("unpipe", se), j.removeListener("end", Le), j.removeListener("end", rr), j.removeListener("data", We), ze = !0, z.awaitDrain && (!w._writableState || w._writableState.needDrain) && qe();
    }
    j.on("data", We);
    function We(Dt) {
      u("ondata");
      var Pt = w.write(Dt);
      u("dest.write", Pt), Pt === !1 && ((z.pipesCount === 1 && z.pipes === w || z.pipesCount > 1 && I(z.pipes, w) !== -1) && !ze && (u("false write response, pause", z.awaitDrain), z.awaitDrain++), j.pause());
    }
    function Oe(Dt) {
      u("onerror", Dt), rr(), w.removeListener("error", Oe), t(w, "error") === 0 && x(w, Dt);
    }
    C(w, "error", Oe);
    function me() {
      w.removeListener("finish", Re), rr();
    }
    w.once("close", me);
    function Re() {
      u("onfinish"), w.removeListener("close", me), rr();
    }
    w.once("finish", Re);
    function rr() {
      u("unpipe"), j.unpipe(w);
    }
    return w.emit("pipe", j), z.flowing || (u("pipe resume"), j.resume()), w;
  };
  function W(w) {
    return function() {
      var j = w._readableState;
      u("pipeOnDrain", j.awaitDrain), j.awaitDrain && j.awaitDrain--, j.awaitDrain === 0 && t(w, "data") && (j.flowing = !0, F(w));
    };
  }
  M.prototype.unpipe = function(w) {
    var y = this._readableState, j = {
      hasUnpiped: !1
    };
    if (y.pipesCount === 0) return this;
    if (y.pipesCount === 1)
      return w && w !== y.pipes ? this : (w || (w = y.pipes), y.pipes = null, y.pipesCount = 0, y.flowing = !1, w && w.emit("unpipe", this, j), this);
    if (!w) {
      var z = y.pipes, ae = y.pipesCount;
      y.pipes = null, y.pipesCount = 0, y.flowing = !1;
      for (var Q = 0; Q < ae; Q++) z[Q].emit("unpipe", this, {
        hasUnpiped: !1
      });
      return this;
    }
    var se = I(y.pipes, w);
    return se === -1 ? this : (y.pipes.splice(se, 1), y.pipesCount -= 1, y.pipesCount === 1 && (y.pipes = y.pipes[0]), w.emit("unpipe", this, j), this);
  }, M.prototype.on = function(w, y) {
    var j = r.prototype.on.call(this, w, y), z = this._readableState;
    return w === "data" ? (z.readableListening = this.listenerCount("readable") > 0, z.flowing !== !1 && this.resume()) : w === "readable" && !z.endEmitted && !z.readableListening && (z.readableListening = z.needReadable = !0, z.flowing = !1, z.emittedReadable = !1, u("on readable", z.length, z.reading), z.length ? b(this) : z.reading || process.nextTick(ie, this)), j;
  }, M.prototype.addListener = M.prototype.on, M.prototype.removeListener = function(w, y) {
    var j = r.prototype.removeListener.call(this, w, y);
    return w === "readable" && process.nextTick(G, this), j;
  }, M.prototype.removeAllListeners = function(w) {
    var y = r.prototype.removeAllListeners.apply(this, arguments);
    return (w === "readable" || w === void 0) && process.nextTick(G, this), y;
  };
  function G(w) {
    var y = w._readableState;
    y.readableListening = w.listenerCount("readable") > 0, y.resumeScheduled && !y.paused ? y.flowing = !0 : w.listenerCount("data") > 0 && w.resume();
  }
  function ie(w) {
    u("readable nexttick read 0"), w.read(0);
  }
  M.prototype.resume = function() {
    var w = this._readableState;
    return w.flowing || (u("resume"), w.flowing = !w.readableListening, fe(this, w)), w.paused = !1, this;
  };
  function fe(w, y) {
    y.resumeScheduled || (y.resumeScheduled = !0, process.nextTick(pe, w, y));
  }
  function pe(w, y) {
    u("resume", y.reading), y.reading || w.read(0), y.resumeScheduled = !1, w.emit("resume"), F(w), y.flowing && !y.reading && w.read(0);
  }
  M.prototype.pause = function() {
    return u("call pause flowing=%j", this._readableState.flowing), this._readableState.flowing !== !1 && (u("pause"), this._readableState.flowing = !1, this.emit("pause")), this._readableState.paused = !0, this;
  };
  function F(w) {
    var y = w._readableState;
    for (u("flow", y.flowing); y.flowing && w.read() !== null; ) ;
  }
  M.prototype.wrap = function(w) {
    var y = this, j = this._readableState, z = !1;
    w.on("end", function() {
      if (u("wrapped end"), j.decoder && !j.ended) {
        var se = j.decoder.end();
        se && se.length && y.push(se);
      }
      y.push(null);
    }), w.on("data", function(se) {
      if (u("wrapped data"), j.decoder && (se = j.decoder.write(se)), !(j.objectMode && se == null) && !(!j.objectMode && (!se || !se.length))) {
        var Le = y.push(se);
        Le || (z = !0, w.pause());
      }
    });
    for (var ae in w)
      this[ae] === void 0 && typeof w[ae] == "function" && (this[ae] = /* @__PURE__ */ function(Le) {
        return function() {
          return w[Le].apply(w, arguments);
        };
      }(ae));
    for (var Q = 0; Q < P.length; Q++)
      w.on(P[Q], this.emit.bind(this, P[Q]));
    return this._read = function(se) {
      u("wrapped _read", se), z && (z = !1, w.resume());
    }, this;
  }, typeof Symbol == "function" && (M.prototype[Symbol.asyncIterator] = function() {
    return O === void 0 && (O = Ty()), O(this);
  }), Object.defineProperty(M.prototype, "readableHighWaterMark", {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: !1,
    get: function() {
      return this._readableState.highWaterMark;
    }
  }), Object.defineProperty(M.prototype, "readableBuffer", {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: !1,
    get: function() {
      return this._readableState && this._readableState.buffer;
    }
  }), Object.defineProperty(M.prototype, "readableFlowing", {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: !1,
    get: function() {
      return this._readableState.flowing;
    },
    set: function(y) {
      this._readableState && (this._readableState.flowing = y);
    }
  }), M._fromList = o, Object.defineProperty(M.prototype, "readableLength", {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: !1,
    get: function() {
      return this._readableState.length;
    }
  });
  function o(w, y) {
    if (y.length === 0) return null;
    var j;
    return y.objectMode ? j = y.buffer.shift() : !w || w >= y.length ? (y.decoder ? j = y.buffer.join("") : y.buffer.length === 1 ? j = y.buffer.first() : j = y.buffer.concat(y.length), y.buffer.clear()) : j = y.buffer.consume(w, y.decoder), j;
  }
  function l(w) {
    var y = w._readableState;
    u("endReadable", y.endEmitted), y.endEmitted || (y.ended = !0, process.nextTick($, y, w));
  }
  function $(w, y) {
    if (u("endReadableNT", w.endEmitted, w.length), !w.endEmitted && w.length === 0 && (w.endEmitted = !0, y.readable = !1, y.emit("end"), w.autoDestroy)) {
      var j = y._writableState;
      (!j || j.autoDestroy && j.finished) && y.destroy();
    }
  }
  typeof Symbol == "function" && (M.from = function(w, y) {
    return m === void 0 && (m = Ay()), m(M, w, y);
  });
  function I(w, y) {
    for (var j = 0, z = w.length; j < z; j++)
      if (w[j] === y) return j;
    return -1;
  }
  return Mi;
}
var Di, Eo;
function ol() {
  if (Eo) return Di;
  Eo = 1, Di = f;
  var e = $t().codes, t = e.ERR_METHOD_NOT_IMPLEMENTED, r = e.ERR_MULTIPLE_CALLBACK, n = e.ERR_TRANSFORM_ALREADY_TRANSFORMING, i = e.ERR_TRANSFORM_WITH_LENGTH_0, a = Zt();
  ye(f, a);
  function s(g, p) {
    var v = this._transformState;
    v.transforming = !1;
    var R = v.writecb;
    if (R === null)
      return this.emit("error", new r());
    v.writechunk = null, v.writecb = null, p != null && this.push(p), R(g);
    var A = this._readableState;
    A.reading = !1, (A.needReadable || A.length < A.highWaterMark) && this._read(A.highWaterMark);
  }
  function f(g) {
    if (!(this instanceof f)) return new f(g);
    a.call(this, g), this._transformState = {
      afterTransform: s.bind(this),
      needTransform: !1,
      transforming: !1,
      writecb: null,
      writechunk: null,
      writeencoding: null
    }, this._readableState.needReadable = !0, this._readableState.sync = !1, g && (typeof g.transform == "function" && (this._transform = g.transform), typeof g.flush == "function" && (this._flush = g.flush)), this.on("prefinish", u);
  }
  function u() {
    var g = this;
    typeof this._flush == "function" && !this._readableState.destroyed ? this._flush(function(p, v) {
      d(g, p, v);
    }) : d(this, null, null);
  }
  f.prototype.push = function(g, p) {
    return this._transformState.needTransform = !1, a.prototype.push.call(this, g, p);
  }, f.prototype._transform = function(g, p, v) {
    v(new t("_transform()"));
  }, f.prototype._write = function(g, p, v) {
    var R = this._transformState;
    if (R.writecb = v, R.writechunk = g, R.writeencoding = p, !R.transforming) {
      var A = this._readableState;
      (R.needTransform || A.needReadable || A.length < A.highWaterMark) && this._read(A.highWaterMark);
    }
  }, f.prototype._read = function(g) {
    var p = this._transformState;
    p.writechunk !== null && !p.transforming ? (p.transforming = !0, this._transform(p.writechunk, p.writeencoding, p.afterTransform)) : p.needTransform = !0;
  }, f.prototype._destroy = function(g, p) {
    a.prototype._destroy.call(this, g, function(v) {
      p(v);
    });
  };
  function d(g, p, v) {
    if (p) return g.emit("error", p);
    if (v != null && g.push(v), g._writableState.length) throw new i();
    if (g._transformState.transforming) throw new n();
    return g.push(null);
  }
  return Di;
}
var Pi, xo;
function Ly() {
  if (xo) return Pi;
  xo = 1, Pi = t;
  var e = ol();
  ye(t, e);
  function t(r) {
    if (!(this instanceof t)) return new t(r);
    e.call(this, r);
  }
  return t.prototype._transform = function(r, n, i) {
    i(null, r);
  }, Pi;
}
var Ii, Oo;
function $y() {
  if (Oo) return Ii;
  Oo = 1;
  var e;
  function t(v) {
    var R = !1;
    return function() {
      R || (R = !0, v.apply(void 0, arguments));
    };
  }
  var r = $t().codes, n = r.ERR_MISSING_ARGS, i = r.ERR_STREAM_DESTROYED;
  function a(v) {
    if (v) throw v;
  }
  function s(v) {
    return v.setHeader && typeof v.abort == "function";
  }
  function f(v, R, A, E) {
    E = t(E);
    var L = !1;
    v.on("close", function() {
      L = !0;
    }), e === void 0 && (e = Ha()), e(v, {
      readable: R,
      writable: A
    }, function(h) {
      if (h) return E(h);
      L = !0, E();
    });
    var c = !1;
    return function(h) {
      if (!L && !c) {
        if (c = !0, s(v)) return v.abort();
        if (typeof v.destroy == "function") return v.destroy();
        E(h || new i("pipe"));
      }
    };
  }
  function u(v) {
    v();
  }
  function d(v, R) {
    return v.pipe(R);
  }
  function g(v) {
    return !v.length || typeof v[v.length - 1] != "function" ? a : v.pop();
  }
  function p() {
    for (var v = arguments.length, R = new Array(v), A = 0; A < v; A++)
      R[A] = arguments[A];
    var E = g(R);
    if (Array.isArray(R[0]) && (R = R[0]), R.length < 2)
      throw new n("streams");
    var L, c = R.map(function(h, O) {
      var m = O < R.length - 1, x = O > 0;
      return f(h, m, x, function(P) {
        L || (L = P), P && c.forEach(u), !m && (c.forEach(u), E(L));
      });
    });
    return R.reduce(d);
  }
  return Ii = p, Ii;
}
(function(e, t) {
  var r = Ze;
  process.env.READABLE_STREAM === "disable" && r ? (e.exports = r.Readable, Object.assign(e.exports, r), e.exports.Stream = r) : (t = e.exports = sl(), t.Stream = r || t, t.Readable = t, t.Writable = al(), t.Duplex = Zt(), t.Transform = ol(), t.PassThrough = Ly(), t.finished = Ha(), t.pipeline = $y());
})(na, na.exports);
var Ue = na.exports;
/**
 * Archiver Core
 *
 * @ignore
 * @license [MIT]{@link https://github.com/archiverjs/node-archiver/blob/master/LICENSE}
 * @copyright (c) 2012-2014 Chris Talkington, contributors.
 */
var Va = Lt, fl = Dc, Ro = Hh, Ci = Ve, Ge = Nn, My = Ee.inherits, he = xy, ul = Ue.Transform, Ni = process.platform === "win32", ne = function(e, t) {
  if (!(this instanceof ne))
    return new ne(e, t);
  typeof e != "string" && (t = e, e = "zip"), t = this.options = Ge.defaults(t, {
    highWaterMark: 1024 * 1024,
    statConcurrency: 4
  }), ul.call(this, t), this._format = !1, this._module = !1, this._pending = 0, this._pointer = 0, this._entriesCount = 0, this._entriesProcessedCount = 0, this._fsEntriesTotalBytes = 0, this._fsEntriesProcessedBytes = 0, this._queue = Ro.queue(this._onQueueTask.bind(this), 1), this._queue.drain(this._onQueueDrain.bind(this)), this._statQueue = Ro.queue(this._onStatQueueTask.bind(this), t.statConcurrency), this._statQueue.drain(this._onQueueDrain.bind(this)), this._state = {
    aborted: !1,
    finalize: !1,
    finalizing: !1,
    finalized: !1,
    modulePiped: !1
  }, this._streams = [];
};
My(ne, ul);
ne.prototype._abort = function() {
  this._state.aborted = !0, this._queue.kill(), this._statQueue.kill(), this._queue.idle() && this._shutdown();
};
ne.prototype._append = function(e, t) {
  t = t || {};
  var r = {
    source: null,
    filepath: e
  };
  t.name || (t.name = e), t.sourcePath = e, r.data = t, this._entriesCount++, t.stats && t.stats instanceof Va.Stats ? (r = this._updateQueueTaskWithStats(r, t.stats), r && (t.stats.size && (this._fsEntriesTotalBytes += t.stats.size), this._queue.push(r))) : this._statQueue.push(r);
};
ne.prototype._finalize = function() {
  this._state.finalizing || this._state.finalized || this._state.aborted || (this._state.finalizing = !0, this._moduleFinalize(), this._state.finalizing = !1, this._state.finalized = !0);
};
ne.prototype._maybeFinalize = function() {
  return this._state.finalizing || this._state.finalized || this._state.aborted ? !1 : this._state.finalize && this._pending === 0 && this._queue.idle() && this._statQueue.idle() ? (this._finalize(), !0) : !1;
};
ne.prototype._moduleAppend = function(e, t, r) {
  if (this._state.aborted) {
    r();
    return;
  }
  this._module.append(e, t, (function(n) {
    if (this._task = null, this._state.aborted) {
      this._shutdown();
      return;
    }
    if (n) {
      this.emit("error", n), setImmediate(r);
      return;
    }
    this.emit("entry", t), this._entriesProcessedCount++, t.stats && t.stats.size && (this._fsEntriesProcessedBytes += t.stats.size), this.emit("progress", {
      entries: {
        total: this._entriesCount,
        processed: this._entriesProcessedCount
      },
      fs: {
        totalBytes: this._fsEntriesTotalBytes,
        processedBytes: this._fsEntriesProcessedBytes
      }
    }), setImmediate(r);
  }).bind(this));
};
ne.prototype._moduleFinalize = function() {
  typeof this._module.finalize == "function" ? this._module.finalize() : typeof this._module.end == "function" ? this._module.end() : this.emit("error", new he("NOENDMETHOD"));
};
ne.prototype._modulePipe = function() {
  this._module.on("error", this._onModuleError.bind(this)), this._module.pipe(this), this._state.modulePiped = !0;
};
ne.prototype._moduleSupports = function(e) {
  return !this._module.supports || !this._module.supports[e] ? !1 : this._module.supports[e];
};
ne.prototype._moduleUnpipe = function() {
  this._module.unpipe(this), this._state.modulePiped = !1;
};
ne.prototype._normalizeEntryData = function(e, t) {
  e = Ge.defaults(e, {
    type: "file",
    name: null,
    date: null,
    mode: null,
    prefix: null,
    sourcePath: null,
    stats: !1
  }), t && e.stats === !1 && (e.stats = t);
  var r = e.type === "directory";
  return e.name && (typeof e.prefix == "string" && e.prefix !== "" && (e.name = e.prefix + "/" + e.name, e.prefix = null), e.name = Ge.sanitizePath(e.name), e.type !== "symlink" && e.name.slice(-1) === "/" ? (r = !0, e.type = "directory") : r && (e.name += "/")), typeof e.mode == "number" ? Ni ? e.mode &= 511 : e.mode &= 4095 : e.stats && e.mode === null ? (Ni ? e.mode = e.stats.mode & 511 : e.mode = e.stats.mode & 4095, Ni && r && (e.mode = 493)) : e.mode === null && (e.mode = r ? 493 : 420), e.stats && e.date === null ? e.date = e.stats.mtime : e.date = Ge.dateify(e.date), e;
};
ne.prototype._onModuleError = function(e) {
  this.emit("error", e);
};
ne.prototype._onQueueDrain = function() {
  this._state.finalizing || this._state.finalized || this._state.aborted || this._state.finalize && this._pending === 0 && this._queue.idle() && this._statQueue.idle() && this._finalize();
};
ne.prototype._onQueueTask = function(e, t) {
  var r = () => {
    e.data.callback && e.data.callback(), t();
  };
  if (this._state.finalizing || this._state.finalized || this._state.aborted) {
    r();
    return;
  }
  this._task = e, this._moduleAppend(e.source, e.data, r);
};
ne.prototype._onStatQueueTask = function(e, t) {
  if (this._state.finalizing || this._state.finalized || this._state.aborted) {
    t();
    return;
  }
  Va.lstat(e.filepath, (function(r, n) {
    if (this._state.aborted) {
      setImmediate(t);
      return;
    }
    if (r) {
      this._entriesCount--, this.emit("warning", r), setImmediate(t);
      return;
    }
    e = this._updateQueueTaskWithStats(e, n), e && (n.size && (this._fsEntriesTotalBytes += n.size), this._queue.push(e)), setImmediate(t);
  }).bind(this));
};
ne.prototype._shutdown = function() {
  this._moduleUnpipe(), this.end();
};
ne.prototype._transform = function(e, t, r) {
  e && (this._pointer += e.length), r(null, e);
};
ne.prototype._updateQueueTaskWithStats = function(e, t) {
  if (t.isFile())
    e.data.type = "file", e.data.sourceType = "stream", e.source = Ge.lazyReadStream(e.filepath);
  else if (t.isDirectory() && this._moduleSupports("directory"))
    e.data.name = Ge.trailingSlashIt(e.data.name), e.data.type = "directory", e.data.sourcePath = Ge.trailingSlashIt(e.filepath), e.data.sourceType = "buffer", e.source = Buffer.concat([]);
  else if (t.isSymbolicLink() && this._moduleSupports("symlink")) {
    var r = Va.readlinkSync(e.filepath), n = Ci.dirname(e.filepath);
    e.data.type = "symlink", e.data.linkname = Ci.relative(n, Ci.resolve(n, r)), e.data.sourceType = "buffer", e.source = Buffer.concat([]);
  } else
    return t.isDirectory() ? this.emit("warning", new he("DIRECTORYNOTSUPPORTED", e.data)) : t.isSymbolicLink() ? this.emit("warning", new he("SYMLINKNOTSUPPORTED", e.data)) : this.emit("warning", new he("ENTRYNOTSUPPORTED", e.data)), null;
  return e.data = this._normalizeEntryData(e.data, t), e;
};
ne.prototype.abort = function() {
  return this._state.aborted || this._state.finalized ? this : (this._abort(), this);
};
ne.prototype.append = function(e, t) {
  if (this._state.finalize || this._state.aborted)
    return this.emit("error", new he("QUEUECLOSED")), this;
  if (t = this._normalizeEntryData(t), typeof t.name != "string" || t.name.length === 0)
    return this.emit("error", new he("ENTRYNAMEREQUIRED")), this;
  if (t.type === "directory" && !this._moduleSupports("directory"))
    return this.emit("error", new he("DIRECTORYNOTSUPPORTED", { name: t.name })), this;
  if (e = Ge.normalizeInputSource(e), Buffer.isBuffer(e))
    t.sourceType = "buffer";
  else if (Ge.isStream(e))
    t.sourceType = "stream";
  else
    return this.emit("error", new he("INPUTSTEAMBUFFERREQUIRED", { name: t.name })), this;
  return this._entriesCount++, this._queue.push({
    data: t,
    source: e
  }), this;
};
ne.prototype.directory = function(e, t, r) {
  if (this._state.finalize || this._state.aborted)
    return this.emit("error", new he("QUEUECLOSED")), this;
  if (typeof e != "string" || e.length === 0)
    return this.emit("error", new he("DIRECTORYDIRPATHREQUIRED")), this;
  this._pending++, t === !1 ? t = "" : typeof t != "string" && (t = e);
  var n = !1;
  typeof r == "function" ? (n = r, r = {}) : typeof r != "object" && (r = {});
  var i = {
    stat: !0,
    dot: !0
  };
  function a() {
    this._pending--, this._maybeFinalize();
  }
  function s(d) {
    this.emit("error", d);
  }
  function f(d) {
    u.pause();
    var g = !1, p = Object.assign({}, r);
    p.name = d.relative, p.prefix = t, p.stats = d.stat, p.callback = u.resume.bind(u);
    try {
      if (n) {
        if (p = n(p), p === !1)
          g = !0;
        else if (typeof p != "object")
          throw new he("DIRECTORYFUNCTIONINVALIDDATA", { dirpath: e });
      }
    } catch (v) {
      this.emit("error", v);
      return;
    }
    if (g) {
      u.resume();
      return;
    }
    this._append(d.absolute, p);
  }
  var u = fl(e, i);
  return u.on("error", s.bind(this)), u.on("match", f.bind(this)), u.on("end", a.bind(this)), this;
};
ne.prototype.file = function(e, t) {
  return this._state.finalize || this._state.aborted ? (this.emit("error", new he("QUEUECLOSED")), this) : typeof e != "string" || e.length === 0 ? (this.emit("error", new he("FILEFILEPATHREQUIRED")), this) : (this._append(e, t), this);
};
ne.prototype.glob = function(e, t, r) {
  this._pending++, t = Ge.defaults(t, {
    stat: !0,
    pattern: e
  });
  function n() {
    this._pending--, this._maybeFinalize();
  }
  function i(f) {
    this.emit("error", f);
  }
  function a(f) {
    s.pause();
    var u = Object.assign({}, r);
    u.callback = s.resume.bind(s), u.stats = f.stat, u.name = f.relative, this._append(f.absolute, u);
  }
  var s = fl(t.cwd || ".", t);
  return s.on("error", i.bind(this)), s.on("match", a.bind(this)), s.on("end", n.bind(this)), this;
};
ne.prototype.finalize = function() {
  if (this._state.aborted) {
    var e = new he("ABORTED");
    return this.emit("error", e), Promise.reject(e);
  }
  if (this._state.finalize) {
    var t = new he("FINALIZING");
    return this.emit("error", t), Promise.reject(t);
  }
  this._state.finalize = !0, this._pending === 0 && this._queue.idle() && this._statQueue.idle() && this._finalize();
  var r = this;
  return new Promise(function(n, i) {
    var a;
    r._module.on("end", function() {
      a || n();
    }), r._module.on("error", function(s) {
      a = !0, i(s);
    });
  });
};
ne.prototype.setFormat = function(e) {
  return this._format ? (this.emit("error", new he("FORMATSET")), this) : (this._format = e, this);
};
ne.prototype.setModule = function(e) {
  return this._state.aborted ? (this.emit("error", new he("ABORTED")), this) : this._state.module ? (this.emit("error", new he("MODULESET")), this) : (this._module = e, this._modulePipe(), this);
};
ne.prototype.symlink = function(e, t, r) {
  if (this._state.finalize || this._state.aborted)
    return this.emit("error", new he("QUEUECLOSED")), this;
  if (typeof e != "string" || e.length === 0)
    return this.emit("error", new he("SYMLINKFILEPATHREQUIRED")), this;
  if (typeof t != "string" || t.length === 0)
    return this.emit("error", new he("SYMLINKTARGETREQUIRED", { filepath: e })), this;
  if (!this._moduleSupports("symlink"))
    return this.emit("error", new he("SYMLINKNOTSUPPORTED", { filepath: e })), this;
  var n = {};
  return n.type = "symlink", n.name = e.replace(/\\/g, "/"), n.linkname = t.replace(/\\/g, "/"), n.sourceType = "buffer", typeof r == "number" && (n.mode = r), this._entriesCount++, this._queue.push({
    data: n,
    source: Buffer.concat([])
  }), this;
};
ne.prototype.pointer = function() {
  return this._pointer;
};
ne.prototype.use = function(e) {
  return this._streams.push(e), this;
};
var Dy = ne, ll = { exports: {} }, cl = { exports: {} }, jn = cl.exports = function() {
};
jn.prototype.getName = function() {
};
jn.prototype.getSize = function() {
};
jn.prototype.getLastModifiedDate = function() {
};
jn.prototype.isDirectory = function() {
};
var hl = cl.exports, dl = { exports: {} }, pl = { exports: {} }, gl = { exports: {} }, je = gl.exports = {};
je.dateToDos = function(e, t) {
  t = t || !1;
  var r = t ? e.getFullYear() : e.getUTCFullYear();
  if (r < 1980)
    return 2162688;
  if (r >= 2044)
    return 2141175677;
  var n = {
    year: r,
    month: t ? e.getMonth() : e.getUTCMonth(),
    date: t ? e.getDate() : e.getUTCDate(),
    hours: t ? e.getHours() : e.getUTCHours(),
    minutes: t ? e.getMinutes() : e.getUTCMinutes(),
    seconds: t ? e.getSeconds() : e.getUTCSeconds()
  };
  return n.year - 1980 << 25 | n.month + 1 << 21 | n.date << 16 | n.hours << 11 | n.minutes << 5 | n.seconds / 2;
};
je.dosToDate = function(e) {
  return new Date((e >> 25 & 127) + 1980, (e >> 21 & 15) - 1, e >> 16 & 31, e >> 11 & 31, e >> 5 & 63, (e & 31) << 1);
};
je.fromDosTime = function(e) {
  return je.dosToDate(e.readUInt32LE(0));
};
je.getEightBytes = function(e) {
  var t = Buffer.alloc(8);
  return t.writeUInt32LE(e % 4294967296, 0), t.writeUInt32LE(e / 4294967296 | 0, 4), t;
};
je.getShortBytes = function(e) {
  var t = Buffer.alloc(2);
  return t.writeUInt16LE((e & 65535) >>> 0, 0), t;
};
je.getShortBytesValue = function(e, t) {
  return e.readUInt16LE(t);
};
je.getLongBytes = function(e) {
  var t = Buffer.alloc(4);
  return t.writeUInt32LE((e & 4294967295) >>> 0, 0), t;
};
je.getLongBytesValue = function(e, t) {
  return e.readUInt32LE(t);
};
je.toDosTime = function(e) {
  return je.getLongBytes(je.dateToDos(e));
};
var Za = gl.exports, vl = Za, yl = 8, ml = 1, Py = 4, Iy = 2, _l = 64, bl = 2048, Se = pl.exports = function() {
  return this instanceof Se ? (this.descriptor = !1, this.encryption = !1, this.utf8 = !1, this.numberOfShannonFanoTrees = 0, this.strongEncryption = !1, this.slidingDictionarySize = 0, this) : new Se();
};
Se.prototype.encode = function() {
  return vl.getShortBytes(
    (this.descriptor ? yl : 0) | (this.utf8 ? bl : 0) | (this.encryption ? ml : 0) | (this.strongEncryption ? _l : 0)
  );
};
Se.prototype.parse = function(e, t) {
  var r = vl.getShortBytesValue(e, t), n = new Se();
  return n.useDataDescriptor((r & yl) !== 0), n.useUTF8ForNames((r & bl) !== 0), n.useStrongEncryption((r & _l) !== 0), n.useEncryption((r & ml) !== 0), n.setSlidingDictionarySize(r & Iy ? 8192 : 4096), n.setNumberOfShannonFanoTrees(r & Py ? 3 : 2), n;
};
Se.prototype.setNumberOfShannonFanoTrees = function(e) {
  this.numberOfShannonFanoTrees = e;
};
Se.prototype.getNumberOfShannonFanoTrees = function() {
  return this.numberOfShannonFanoTrees;
};
Se.prototype.setSlidingDictionarySize = function(e) {
  this.slidingDictionarySize = e;
};
Se.prototype.getSlidingDictionarySize = function() {
  return this.slidingDictionarySize;
};
Se.prototype.useDataDescriptor = function(e) {
  this.descriptor = e;
};
Se.prototype.usesDataDescriptor = function() {
  return this.descriptor;
};
Se.prototype.useEncryption = function(e) {
  this.encryption = e;
};
Se.prototype.usesEncryption = function() {
  return this.encryption;
};
Se.prototype.useStrongEncryption = function(e) {
  this.strongEncryption = e;
};
Se.prototype.usesStrongEncryption = function() {
  return this.strongEncryption;
};
Se.prototype.useUTF8ForNames = function(e) {
  this.utf8 = e;
};
Se.prototype.usesUTF8ForNames = function() {
  return this.utf8;
};
var Cy = pl.exports, Ny = {
  /**
   * Bits used to indicate the filesystem object type.
   */
  FILE_TYPE_FLAG: 61440,
  // 0170000
  /**
   * Indicates symbolic links.
   */
  LINK_FLAG: 40960
}, wl = {
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
}, jy = Ee.inherits, By = Ra, Sl = hl, El = Cy, To = Ny, Ae = wl, xl = Za, ee = dl.exports = function(e) {
  if (!(this instanceof ee))
    return new ee(e);
  Sl.call(this), this.platform = Ae.PLATFORM_FAT, this.method = -1, this.name = null, this.size = 0, this.csize = 0, this.gpb = new El(), this.crc = 0, this.time = -1, this.minver = Ae.MIN_VERSION_INITIAL, this.mode = -1, this.extra = null, this.exattr = 0, this.inattr = 0, this.comment = null, e && this.setName(e);
};
jy(ee, Sl);
ee.prototype.getCentralDirectoryExtra = function() {
  return this.getExtra();
};
ee.prototype.getComment = function() {
  return this.comment !== null ? this.comment : "";
};
ee.prototype.getCompressedSize = function() {
  return this.csize;
};
ee.prototype.getCrc = function() {
  return this.crc;
};
ee.prototype.getExternalAttributes = function() {
  return this.exattr;
};
ee.prototype.getExtra = function() {
  return this.extra !== null ? this.extra : Ae.EMPTY;
};
ee.prototype.getGeneralPurposeBit = function() {
  return this.gpb;
};
ee.prototype.getInternalAttributes = function() {
  return this.inattr;
};
ee.prototype.getLastModifiedDate = function() {
  return this.getTime();
};
ee.prototype.getLocalFileDataExtra = function() {
  return this.getExtra();
};
ee.prototype.getMethod = function() {
  return this.method;
};
ee.prototype.getName = function() {
  return this.name;
};
ee.prototype.getPlatform = function() {
  return this.platform;
};
ee.prototype.getSize = function() {
  return this.size;
};
ee.prototype.getTime = function() {
  return this.time !== -1 ? xl.dosToDate(this.time) : -1;
};
ee.prototype.getTimeDos = function() {
  return this.time !== -1 ? this.time : 0;
};
ee.prototype.getUnixMode = function() {
  return this.platform !== Ae.PLATFORM_UNIX ? 0 : this.getExternalAttributes() >> Ae.SHORT_SHIFT & Ae.SHORT_MASK;
};
ee.prototype.getVersionNeededToExtract = function() {
  return this.minver;
};
ee.prototype.setComment = function(e) {
  Buffer.byteLength(e) !== e.length && this.getGeneralPurposeBit().useUTF8ForNames(!0), this.comment = e;
};
ee.prototype.setCompressedSize = function(e) {
  if (e < 0)
    throw new Error("invalid entry compressed size");
  this.csize = e;
};
ee.prototype.setCrc = function(e) {
  if (e < 0)
    throw new Error("invalid entry crc32");
  this.crc = e;
};
ee.prototype.setExternalAttributes = function(e) {
  this.exattr = e >>> 0;
};
ee.prototype.setExtra = function(e) {
  this.extra = e;
};
ee.prototype.setGeneralPurposeBit = function(e) {
  if (!(e instanceof El))
    throw new Error("invalid entry GeneralPurposeBit");
  this.gpb = e;
};
ee.prototype.setInternalAttributes = function(e) {
  this.inattr = e;
};
ee.prototype.setMethod = function(e) {
  if (e < 0)
    throw new Error("invalid entry compression method");
  this.method = e;
};
ee.prototype.setName = function(e, t = !1) {
  e = By(e, !1).replace(/^\w+:/, "").replace(/^(\.\.\/|\/)+/, ""), t && (e = `/${e}`), Buffer.byteLength(e) !== e.length && this.getGeneralPurposeBit().useUTF8ForNames(!0), this.name = e;
};
ee.prototype.setPlatform = function(e) {
  this.platform = e;
};
ee.prototype.setSize = function(e) {
  if (e < 0)
    throw new Error("invalid entry size");
  this.size = e;
};
ee.prototype.setTime = function(e, t) {
  if (!(e instanceof Date))
    throw new Error("invalid entry time");
  this.time = xl.dateToDos(e, t);
};
ee.prototype.setUnixMode = function(e) {
  e |= this.isDirectory() ? Ae.S_IFDIR : Ae.S_IFREG;
  var t = 0;
  t |= e << Ae.SHORT_SHIFT | (this.isDirectory() ? Ae.S_DOS_D : Ae.S_DOS_A), this.setExternalAttributes(t), this.mode = e & Ae.MODE_MASK, this.platform = Ae.PLATFORM_UNIX;
};
ee.prototype.setVersionNeededToExtract = function(e) {
  this.minver = e;
};
ee.prototype.isDirectory = function() {
  return this.getName().slice(-1) === "/";
};
ee.prototype.isUnixSymlink = function() {
  return (this.getUnixMode() & To.FILE_TYPE_FLAG) === To.LINK_FLAG;
};
ee.prototype.isZip64 = function() {
  return this.csize > Ae.ZIP64_MAGIC || this.size > Ae.ZIP64_MAGIC;
};
var Fy = dl.exports, Ol = { exports: {} }, Rl = { exports: {} }, ky = Ze.Stream, Uy = Ue.PassThrough, ia = Rl.exports = {};
ia.isStream = function(e) {
  return e instanceof ky;
};
ia.normalizeInputSource = function(e) {
  if (e === null)
    return Buffer.alloc(0);
  if (typeof e == "string")
    return Buffer.from(e);
  if (ia.isStream(e) && !e._readableState) {
    var t = new Uy();
    return e.pipe(t), t;
  }
  return e;
};
var qy = Rl.exports, zy = Ee.inherits, Ya = Ue.Transform, Wy = hl, Ao = qy, Ie = Ol.exports = function(e) {
  if (!(this instanceof Ie))
    return new Ie(e);
  Ya.call(this, e), this.offset = 0, this._archive = {
    finish: !1,
    finished: !1,
    processing: !1
  };
};
zy(Ie, Ya);
Ie.prototype._appendBuffer = function(e, t, r) {
};
Ie.prototype._appendStream = function(e, t, r) {
};
Ie.prototype._emitErrorCallback = function(e) {
  e && this.emit("error", e);
};
Ie.prototype._finish = function(e) {
};
Ie.prototype._normalizeEntry = function(e) {
};
Ie.prototype._transform = function(e, t, r) {
  r(null, e);
};
Ie.prototype.entry = function(e, t, r) {
  if (t = t || null, typeof r != "function" && (r = this._emitErrorCallback.bind(this)), !(e instanceof Wy)) {
    r(new Error("not a valid instance of ArchiveEntry"));
    return;
  }
  if (this._archive.finish || this._archive.finished) {
    r(new Error("unacceptable entry after finish"));
    return;
  }
  if (this._archive.processing) {
    r(new Error("already processing an entry"));
    return;
  }
  if (this._archive.processing = !0, this._normalizeEntry(e), this._entry = e, t = Ao.normalizeInputSource(t), Buffer.isBuffer(t))
    this._appendBuffer(e, t, r);
  else if (Ao.isStream(t))
    this._appendStream(e, t, r);
  else {
    this._archive.processing = !1, r(new Error("input source must be valid Stream or Buffer instance"));
    return;
  }
  return this;
};
Ie.prototype.finish = function() {
  if (this._archive.processing) {
    this._archive.finish = !0;
    return;
  }
  this._finish();
};
Ie.prototype.getBytesWritten = function() {
  return this.offset;
};
Ie.prototype.write = function(e, t) {
  return e && (this.offset += e.length), Ya.prototype.write.call(this, e, t);
};
var Gy = Ol.exports, Tl = { exports: {} }, ft = vt.Buffer, aa = [
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
typeof Int32Array < "u" && (aa = new Int32Array(aa));
function Al(e) {
  if (ft.isBuffer(e))
    return e;
  var t = typeof ft.alloc == "function" && typeof ft.from == "function";
  if (typeof e == "number")
    return t ? ft.alloc(e) : new ft(e);
  if (typeof e == "string")
    return t ? ft.from(e) : new ft(e);
  throw new Error("input must be buffer, number, or string, received " + typeof e);
}
function Hy(e) {
  var t = Al(4);
  return t.writeInt32BE(e, 0), t;
}
function Qa(e, t) {
  e = Al(e), ft.isBuffer(t) && (t = t.readUInt32BE(0));
  for (var r = ~~t ^ -1, n = 0; n < e.length; n++)
    r = aa[(r ^ e[n]) & 255] ^ r >>> 8;
  return r ^ -1;
}
function Ka() {
  return Hy(Qa.apply(null, arguments));
}
Ka.signed = function() {
  return Qa.apply(null, arguments);
};
Ka.unsigned = function() {
  return Qa.apply(null, arguments) >>> 0;
};
var Ll = Ka, Xa = {};
/*! crc32.js (C) 2014-present SheetJS -- http://sheetjs.com */
(function(e) {
  (function(t) {
    t(typeof DO_NOT_EXPORT_CRC > "u" ? e : {});
  })(function(t) {
    t.version = "1.2.2";
    function r() {
      for (var T = 0, M = new Array(256), N = 0; N != 256; ++N)
        T = N, T = T & 1 ? -306674912 ^ T >>> 1 : T >>> 1, T = T & 1 ? -306674912 ^ T >>> 1 : T >>> 1, T = T & 1 ? -306674912 ^ T >>> 1 : T >>> 1, T = T & 1 ? -306674912 ^ T >>> 1 : T >>> 1, T = T & 1 ? -306674912 ^ T >>> 1 : T >>> 1, T = T & 1 ? -306674912 ^ T >>> 1 : T >>> 1, T = T & 1 ? -306674912 ^ T >>> 1 : T >>> 1, T = T & 1 ? -306674912 ^ T >>> 1 : T >>> 1, M[N] = T;
      return typeof Int32Array < "u" ? new Int32Array(M) : M;
    }
    var n = r();
    function i(T) {
      var M = 0, N = 0, B = 0, U = typeof Int32Array < "u" ? new Int32Array(4096) : new Array(4096);
      for (B = 0; B != 256; ++B) U[B] = T[B];
      for (B = 0; B != 256; ++B)
        for (N = T[B], M = 256 + B; M < 4096; M += 256) N = U[M] = N >>> 8 ^ T[N & 255];
      var q = [];
      for (B = 1; B != 16; ++B) q[B - 1] = typeof Int32Array < "u" ? U.subarray(B * 256, B * 256 + 256) : U.slice(B * 256, B * 256 + 256);
      return q;
    }
    var a = i(n), s = a[0], f = a[1], u = a[2], d = a[3], g = a[4], p = a[5], v = a[6], R = a[7], A = a[8], E = a[9], L = a[10], c = a[11], h = a[12], O = a[13], m = a[14];
    function x(T, M) {
      for (var N = M ^ -1, B = 0, U = T.length; B < U; ) N = N >>> 8 ^ n[(N ^ T.charCodeAt(B++)) & 255];
      return ~N;
    }
    function P(T, M) {
      for (var N = M ^ -1, B = T.length - 15, U = 0; U < B; ) N = m[T[U++] ^ N & 255] ^ O[T[U++] ^ N >> 8 & 255] ^ h[T[U++] ^ N >> 16 & 255] ^ c[T[U++] ^ N >>> 24] ^ L[T[U++]] ^ E[T[U++]] ^ A[T[U++]] ^ R[T[U++]] ^ v[T[U++]] ^ p[T[U++]] ^ g[T[U++]] ^ d[T[U++]] ^ u[T[U++]] ^ f[T[U++]] ^ s[T[U++]] ^ n[T[U++]];
      for (B += 15; U < B; ) N = N >>> 8 ^ n[(N ^ T[U++]) & 255];
      return ~N;
    }
    function C(T, M) {
      for (var N = M ^ -1, B = 0, U = T.length, q = 0, H = 0; B < U; )
        q = T.charCodeAt(B++), q < 128 ? N = N >>> 8 ^ n[(N ^ q) & 255] : q < 2048 ? (N = N >>> 8 ^ n[(N ^ (192 | q >> 6 & 31)) & 255], N = N >>> 8 ^ n[(N ^ (128 | q & 63)) & 255]) : q >= 55296 && q < 57344 ? (q = (q & 1023) + 64, H = T.charCodeAt(B++) & 1023, N = N >>> 8 ^ n[(N ^ (240 | q >> 8 & 7)) & 255], N = N >>> 8 ^ n[(N ^ (128 | q >> 2 & 63)) & 255], N = N >>> 8 ^ n[(N ^ (128 | H >> 6 & 15 | (q & 3) << 4)) & 255], N = N >>> 8 ^ n[(N ^ (128 | H & 63)) & 255]) : (N = N >>> 8 ^ n[(N ^ (224 | q >> 12 & 15)) & 255], N = N >>> 8 ^ n[(N ^ (128 | q >> 6 & 63)) & 255], N = N >>> 8 ^ n[(N ^ (128 | q & 63)) & 255]);
      return ~N;
    }
    t.table = n, t.bstr = x, t.buf = P, t.str = C;
  });
})(Xa);
const { Transform: Vy } = Ue, Zy = Xa;
let Yy = class extends Vy {
  constructor(t) {
    super(t), this.checksum = Buffer.allocUnsafe(4), this.checksum.writeInt32BE(0, 0), this.rawSize = 0;
  }
  _transform(t, r, n) {
    t && (this.checksum = Zy.buf(t, this.checksum) >>> 0, this.rawSize += t.length), n(null, t);
  }
  digest(t) {
    const r = Buffer.allocUnsafe(4);
    return r.writeUInt32BE(this.checksum >>> 0, 0), t ? r.toString(t) : r;
  }
  hex() {
    return this.digest("hex").toUpperCase();
  }
  size() {
    return this.rawSize;
  }
};
var Qy = Yy;
const { DeflateRaw: Ky } = Co, Xy = Xa;
let Jy = class extends Ky {
  constructor(t) {
    super(t), this.checksum = Buffer.allocUnsafe(4), this.checksum.writeInt32BE(0, 0), this.rawSize = 0, this.compressedSize = 0;
  }
  push(t, r) {
    return t && (this.compressedSize += t.length), super.push(t, r);
  }
  _transform(t, r, n) {
    t && (this.checksum = Xy.buf(t, this.checksum) >>> 0, this.rawSize += t.length), super._transform(t, r, n);
  }
  digest(t) {
    const r = Buffer.allocUnsafe(4);
    return r.writeUInt32BE(this.checksum >>> 0, 0), t ? r.toString(t) : r;
  }
  hex() {
    return this.digest("hex").toUpperCase();
  }
  size(t = !1) {
    return t ? this.compressedSize : this.rawSize;
  }
};
var em = Jy, $l = {
  CRC32Stream: Qy,
  DeflateCRC32Stream: em
}, tm = Ee.inherits, rm = Ll, { CRC32Stream: nm } = $l, { DeflateCRC32Stream: im } = $l, Ml = Gy, K = wl, Z = Za, ve = Tl.exports = function(e) {
  if (!(this instanceof ve))
    return new ve(e);
  e = this.options = this._defaults(e), Ml.call(this, e), this._entry = null, this._entries = [], this._archive = {
    centralLength: 0,
    centralOffset: 0,
    comment: "",
    finish: !1,
    finished: !1,
    processing: !1,
    forceZip64: e.forceZip64,
    forceLocalTime: e.forceLocalTime
  };
};
tm(ve, Ml);
ve.prototype._afterAppend = function(e) {
  this._entries.push(e), e.getGeneralPurposeBit().usesDataDescriptor() && this._writeDataDescriptor(e), this._archive.processing = !1, this._entry = null, this._archive.finish && !this._archive.finished && this._finish();
};
ve.prototype._appendBuffer = function(e, t, r) {
  t.length === 0 && e.setMethod(K.METHOD_STORED);
  var n = e.getMethod();
  if (n === K.METHOD_STORED && (e.setSize(t.length), e.setCompressedSize(t.length), e.setCrc(rm.unsigned(t))), this._writeLocalFileHeader(e), n === K.METHOD_STORED) {
    this.write(t), this._afterAppend(e), r(null, e);
    return;
  } else if (n === K.METHOD_DEFLATED) {
    this._smartStream(e, r).end(t);
    return;
  } else {
    r(new Error("compression method " + n + " not implemented"));
    return;
  }
};
ve.prototype._appendStream = function(e, t, r) {
  e.getGeneralPurposeBit().useDataDescriptor(!0), e.setVersionNeededToExtract(K.MIN_VERSION_DATA_DESCRIPTOR), this._writeLocalFileHeader(e);
  var n = this._smartStream(e, r);
  t.once("error", function(i) {
    n.emit("error", i), n.end();
  }), t.pipe(n);
};
ve.prototype._defaults = function(e) {
  return typeof e != "object" && (e = {}), typeof e.zlib != "object" && (e.zlib = {}), typeof e.zlib.level != "number" && (e.zlib.level = K.ZLIB_BEST_SPEED), e.forceZip64 = !!e.forceZip64, e.forceLocalTime = !!e.forceLocalTime, e;
};
ve.prototype._finish = function() {
  this._archive.centralOffset = this.offset, this._entries.forEach((function(e) {
    this._writeCentralFileHeader(e);
  }).bind(this)), this._archive.centralLength = this.offset - this._archive.centralOffset, this.isZip64() && this._writeCentralDirectoryZip64(), this._writeCentralDirectoryEnd(), this._archive.processing = !1, this._archive.finish = !0, this._archive.finished = !0, this.end();
};
ve.prototype._normalizeEntry = function(e) {
  e.getMethod() === -1 && e.setMethod(K.METHOD_DEFLATED), e.getMethod() === K.METHOD_DEFLATED && (e.getGeneralPurposeBit().useDataDescriptor(!0), e.setVersionNeededToExtract(K.MIN_VERSION_DATA_DESCRIPTOR)), e.getTime() === -1 && e.setTime(/* @__PURE__ */ new Date(), this._archive.forceLocalTime), e._offsets = {
    file: 0,
    data: 0,
    contents: 0
  };
};
ve.prototype._smartStream = function(e, t) {
  var r = e.getMethod() === K.METHOD_DEFLATED, n = r ? new im(this.options.zlib) : new nm(), i = null;
  function a() {
    var s = n.digest().readUInt32BE(0);
    e.setCrc(s), e.setSize(n.size()), e.setCompressedSize(n.size(!0)), this._afterAppend(e), t(i, e);
  }
  return n.once("end", a.bind(this)), n.once("error", function(s) {
    i = s;
  }), n.pipe(this, { end: !1 }), n;
};
ve.prototype._writeCentralDirectoryEnd = function() {
  var e = this._entries.length, t = this._archive.centralLength, r = this._archive.centralOffset;
  this.isZip64() && (e = K.ZIP64_MAGIC_SHORT, t = K.ZIP64_MAGIC, r = K.ZIP64_MAGIC), this.write(Z.getLongBytes(K.SIG_EOCD)), this.write(K.SHORT_ZERO), this.write(K.SHORT_ZERO), this.write(Z.getShortBytes(e)), this.write(Z.getShortBytes(e)), this.write(Z.getLongBytes(t)), this.write(Z.getLongBytes(r));
  var n = this.getComment(), i = Buffer.byteLength(n);
  this.write(Z.getShortBytes(i)), this.write(n);
};
ve.prototype._writeCentralDirectoryZip64 = function() {
  this.write(Z.getLongBytes(K.SIG_ZIP64_EOCD)), this.write(Z.getEightBytes(44)), this.write(Z.getShortBytes(K.MIN_VERSION_ZIP64)), this.write(Z.getShortBytes(K.MIN_VERSION_ZIP64)), this.write(K.LONG_ZERO), this.write(K.LONG_ZERO), this.write(Z.getEightBytes(this._entries.length)), this.write(Z.getEightBytes(this._entries.length)), this.write(Z.getEightBytes(this._archive.centralLength)), this.write(Z.getEightBytes(this._archive.centralOffset)), this.write(Z.getLongBytes(K.SIG_ZIP64_EOCD_LOC)), this.write(K.LONG_ZERO), this.write(Z.getEightBytes(this._archive.centralOffset + this._archive.centralLength)), this.write(Z.getLongBytes(1));
};
ve.prototype._writeCentralFileHeader = function(e) {
  var t = e.getGeneralPurposeBit(), r = e.getMethod(), n = e._offsets, i = e.getSize(), a = e.getCompressedSize();
  if (e.isZip64() || n.file > K.ZIP64_MAGIC) {
    i = K.ZIP64_MAGIC, a = K.ZIP64_MAGIC, e.setVersionNeededToExtract(K.MIN_VERSION_ZIP64);
    var s = Buffer.concat([
      Z.getShortBytes(K.ZIP64_EXTRA_ID),
      Z.getShortBytes(24),
      Z.getEightBytes(e.getSize()),
      Z.getEightBytes(e.getCompressedSize()),
      Z.getEightBytes(n.file)
    ], 28);
    e.setExtra(s);
  }
  this.write(Z.getLongBytes(K.SIG_CFH)), this.write(Z.getShortBytes(e.getPlatform() << 8 | K.VERSION_MADEBY)), this.write(Z.getShortBytes(e.getVersionNeededToExtract())), this.write(t.encode()), this.write(Z.getShortBytes(r)), this.write(Z.getLongBytes(e.getTimeDos())), this.write(Z.getLongBytes(e.getCrc())), this.write(Z.getLongBytes(a)), this.write(Z.getLongBytes(i));
  var f = e.getName(), u = e.getComment(), d = e.getCentralDirectoryExtra();
  t.usesUTF8ForNames() && (f = Buffer.from(f), u = Buffer.from(u)), this.write(Z.getShortBytes(f.length)), this.write(Z.getShortBytes(d.length)), this.write(Z.getShortBytes(u.length)), this.write(K.SHORT_ZERO), this.write(Z.getShortBytes(e.getInternalAttributes())), this.write(Z.getLongBytes(e.getExternalAttributes())), n.file > K.ZIP64_MAGIC ? this.write(Z.getLongBytes(K.ZIP64_MAGIC)) : this.write(Z.getLongBytes(n.file)), this.write(f), this.write(d), this.write(u);
};
ve.prototype._writeDataDescriptor = function(e) {
  this.write(Z.getLongBytes(K.SIG_DD)), this.write(Z.getLongBytes(e.getCrc())), e.isZip64() ? (this.write(Z.getEightBytes(e.getCompressedSize())), this.write(Z.getEightBytes(e.getSize()))) : (this.write(Z.getLongBytes(e.getCompressedSize())), this.write(Z.getLongBytes(e.getSize())));
};
ve.prototype._writeLocalFileHeader = function(e) {
  var t = e.getGeneralPurposeBit(), r = e.getMethod(), n = e.getName(), i = e.getLocalFileDataExtra();
  e.isZip64() && (t.useDataDescriptor(!0), e.setVersionNeededToExtract(K.MIN_VERSION_ZIP64)), t.usesUTF8ForNames() && (n = Buffer.from(n)), e._offsets.file = this.offset, this.write(Z.getLongBytes(K.SIG_LFH)), this.write(Z.getShortBytes(e.getVersionNeededToExtract())), this.write(t.encode()), this.write(Z.getShortBytes(r)), this.write(Z.getLongBytes(e.getTimeDos())), e._offsets.data = this.offset, t.usesDataDescriptor() ? (this.write(K.LONG_ZERO), this.write(K.LONG_ZERO), this.write(K.LONG_ZERO)) : (this.write(Z.getLongBytes(e.getCrc())), this.write(Z.getLongBytes(e.getCompressedSize())), this.write(Z.getLongBytes(e.getSize()))), this.write(Z.getShortBytes(n.length)), this.write(Z.getShortBytes(i.length)), this.write(n), this.write(i), e._offsets.contents = this.offset;
};
ve.prototype.getComment = function(e) {
  return this._archive.comment !== null ? this._archive.comment : "";
};
ve.prototype.isZip64 = function() {
  return this._archive.forceZip64 || this._entries.length > K.ZIP64_MAGIC_SHORT || this._archive.centralLength > K.ZIP64_MAGIC || this._archive.centralOffset > K.ZIP64_MAGIC;
};
ve.prototype.setComment = function(e) {
  this._archive.comment = e;
};
var am = Tl.exports, Dl = {
  ZipArchiveEntry: Fy,
  ZipArchiveOutputStream: am
}, Pl = { exports: {} }, Il = { exports: {} }, Cl = Or, Ut = Ve, sa = gu, sm = wu, om = Au, fm = Mu, um = Ga(), Rt = Il.exports = {}, Lo = /[\/\\]/g, lm = function(e, t) {
  var r = [];
  return sa(e).forEach(function(n) {
    var i = n.indexOf("!") === 0;
    i && (n = n.slice(1));
    var a = t(n);
    i ? r = sm(r, a) : r = om(r, a);
  }), r;
};
Rt.exists = function() {
  var e = Ut.join.apply(Ut, arguments);
  return Cl.existsSync(e);
};
Rt.expand = function(...e) {
  var t = fm(e[0]) ? e.shift() : {}, r = Array.isArray(e[0]) ? e[0] : e;
  if (r.length === 0)
    return [];
  var n = lm(r, function(i) {
    return um.sync(i, t);
  });
  return t.filter && (n = n.filter(function(i) {
    i = Ut.join(t.cwd || "", i);
    try {
      return typeof t.filter == "function" ? t.filter(i) : Cl.statSync(i)[t.filter]();
    } catch {
      return !1;
    }
  })), n;
};
Rt.expandMapping = function(e, t, r) {
  r = Object.assign({
    rename: function(a, s) {
      return Ut.join(a || "", s);
    }
  }, r);
  var n = [], i = {};
  return Rt.expand(r, e).forEach(function(a) {
    var s = a;
    r.flatten && (s = Ut.basename(s)), r.ext && (s = s.replace(/(\.[^\/]*)?$/, r.ext));
    var f = r.rename(t, s, r);
    r.cwd && (a = Ut.join(r.cwd, a)), f = f.replace(Lo, "/"), a = a.replace(Lo, "/"), i[f] ? i[f].src.push(a) : (n.push({
      src: [a],
      dest: f
    }), i[f] = n[n.length - 1]);
  }), n;
};
Rt.normalizeFilesArray = function(e) {
  var t = [];
  return e.forEach(function(r) {
    ("src" in r || "dest" in r) && t.push(r);
  }), t.length === 0 ? [] : (t = _(t).chain().forEach(function(r) {
    !("src" in r) || !r.src || (Array.isArray(r.src) ? r.src = sa(r.src) : r.src = [r.src]);
  }).map(function(r) {
    var n = Object.assign({}, r);
    if (delete n.src, delete n.dest, r.expand)
      return Rt.expandMapping(r.src, r.dest, n).map(function(a) {
        var s = Object.assign({}, r);
        return s.orig = Object.assign({}, r), s.src = a.src, s.dest = a.dest, ["expand", "cwd", "flatten", "rename", "ext"].forEach(function(f) {
          delete s[f];
        }), s;
      });
    var i = Object.assign({}, r);
    return i.orig = Object.assign({}, r), "src" in i && Object.defineProperty(i, "src", {
      enumerable: !0,
      get: function a() {
        var s;
        return "result" in a || (s = r.src, s = Array.isArray(s) ? sa(s) : [s], a.result = Rt.expand(n, s)), a.result;
      }
    }), "dest" in i && (i.dest = r.dest), i;
  }).flatten().value(), t);
};
var cm = Il.exports, oa = Or, $o = Ve, hm = eu, Nl = Ra, dm = ou, pm = Ze.Stream, gm = Ue.PassThrough, Ce = Pl.exports = {};
Ce.file = cm;
Ce.collectStream = function(e, t) {
  var r = [], n = 0;
  e.on("error", t), e.on("data", function(i) {
    r.push(i), n += i.length;
  }), e.on("end", function() {
    var i = Buffer.alloc(n), a = 0;
    r.forEach(function(s) {
      s.copy(i, a), a += s.length;
    }), t(null, i);
  });
};
Ce.dateify = function(e) {
  return e = e || /* @__PURE__ */ new Date(), e instanceof Date ? e = e : typeof e == "string" ? e = new Date(e) : e = /* @__PURE__ */ new Date(), e;
};
Ce.defaults = function(e, t, r) {
  var n = arguments;
  return n[0] = n[0] || {}, dm(...n);
};
Ce.isStream = function(e) {
  return e instanceof pm;
};
Ce.lazyReadStream = function(e) {
  return new hm.Readable(function() {
    return oa.createReadStream(e);
  });
};
Ce.normalizeInputSource = function(e) {
  return e === null ? Buffer.alloc(0) : typeof e == "string" ? Buffer.from(e) : Ce.isStream(e) ? e.pipe(new gm()) : e;
};
Ce.sanitizePath = function(e) {
  return Nl(e, !1).replace(/^\w+:/, "").replace(/^(\.\.\/|\/)+/, "");
};
Ce.trailingSlashIt = function(e) {
  return e.slice(-1) !== "/" ? e + "/" : e;
};
Ce.unixifyPath = function(e) {
  return Nl(e, !1).replace(/^\w+:/, "");
};
Ce.walkdir = function(e, t, r) {
  var n = [];
  typeof t == "function" && (r = t, t = e), oa.readdir(e, function(i, a) {
    var s = 0, f, u;
    if (i)
      return r(i);
    (function d() {
      if (f = a[s++], !f)
        return r(null, n);
      u = $o.join(e, f), oa.stat(u, function(g, p) {
        n.push({
          path: u,
          relative: $o.relative(t, u).replace(/\\/g, "/"),
          stats: p
        }), p && p.isDirectory() ? Ce.walkdir(u, t, function(v, R) {
          R.forEach(function(A) {
            n.push(A);
          }), d();
        }) : d();
      });
    })();
  });
};
var vm = Pl.exports;
/**
 * ZipStream
 *
 * @ignore
 * @license [MIT]{@link https://github.com/archiverjs/node-zip-stream/blob/master/LICENSE}
 * @copyright (c) 2014 Chris Talkington, contributors.
 */
var ym = Ee.inherits, Ja = Dl.ZipArchiveOutputStream, mm = Dl.ZipArchiveEntry, ji = vm, Yt = ll.exports = function(e) {
  if (!(this instanceof Yt))
    return new Yt(e);
  e = this.options = e || {}, e.zlib = e.zlib || {}, Ja.call(this, e), typeof e.level == "number" && e.level >= 0 && (e.zlib.level = e.level, delete e.level), !e.forceZip64 && typeof e.zlib.level == "number" && e.zlib.level === 0 && (e.store = !0), e.namePrependSlash = e.namePrependSlash || !1, e.comment && e.comment.length > 0 && this.setComment(e.comment);
};
ym(Yt, Ja);
Yt.prototype._normalizeFileData = function(e) {
  e = ji.defaults(e, {
    type: "file",
    name: null,
    namePrependSlash: this.options.namePrependSlash,
    linkname: null,
    date: null,
    mode: null,
    store: this.options.store,
    comment: ""
  });
  var t = e.type === "directory", r = e.type === "symlink";
  return e.name && (e.name = ji.sanitizePath(e.name), !r && e.name.slice(-1) === "/" ? (t = !0, e.type = "directory") : t && (e.name += "/")), (t || r) && (e.store = !0), e.date = ji.dateify(e.date), e;
};
Yt.prototype.entry = function(e, t, r) {
  if (typeof r != "function" && (r = this._emitErrorCallback.bind(this)), t = this._normalizeFileData(t), t.type !== "file" && t.type !== "directory" && t.type !== "symlink") {
    r(new Error(t.type + " entries not currently supported"));
    return;
  }
  if (typeof t.name != "string" || t.name.length === 0) {
    r(new Error("entry name must be a non-empty string value"));
    return;
  }
  if (t.type === "symlink" && typeof t.linkname != "string") {
    r(new Error("entry linkname must be a non-empty string value when type equals symlink"));
    return;
  }
  var n = new mm(t.name);
  return n.setTime(t.date, this.options.forceLocalTime), t.namePrependSlash && n.setName(t.name, !0), t.store && n.setMethod(0), t.comment.length > 0 && n.setComment(t.comment), t.type === "symlink" && typeof t.mode != "number" && (t.mode = 40960), typeof t.mode == "number" && (t.type === "symlink" && (t.mode |= 40960), n.setUnixMode(t.mode)), t.type === "symlink" && typeof t.linkname == "string" && (e = Buffer.from(t.linkname)), Ja.prototype.entry.call(this, n, e, r);
};
Yt.prototype.finalize = function() {
  this.finish();
};
var _m = ll.exports;
/**
 * ZIP Format Plugin
 *
 * @module plugins/zip
 * @license [MIT]{@link https://github.com/archiverjs/node-archiver/blob/master/LICENSE}
 * @copyright (c) 2012-2014 Chris Talkington, contributors.
 */
var bm = _m, wm = Nn, pt = function(e) {
  if (!(this instanceof pt))
    return new pt(e);
  e = this.options = wm.defaults(e, {
    comment: "",
    forceUTC: !1,
    namePrependSlash: !1,
    store: !1
  }), this.supports = {
    directory: !0,
    symlink: !0
  }, this.engine = new bm(e);
};
pt.prototype.append = function(e, t, r) {
  this.engine.entry(e, t, r);
};
pt.prototype.finalize = function() {
  this.engine.finalize();
};
pt.prototype.on = function() {
  return this.engine.on.apply(this.engine, arguments);
};
pt.prototype.pipe = function() {
  return this.engine.pipe.apply(this.engine, arguments);
};
pt.prototype.unpipe = function() {
  return this.engine.unpipe.apply(this.engine, arguments);
};
var Sm = pt, es = {}, Bn = { exports: {} };
const { Buffer: Be } = vt, jl = Symbol.for("BufferList");
function ue(e) {
  if (!(this instanceof ue))
    return new ue(e);
  ue._init.call(this, e);
}
ue._init = function(t) {
  Object.defineProperty(this, jl, { value: !0 }), this._bufs = [], this.length = 0, t && this.append(t);
};
ue.prototype._new = function(t) {
  return new ue(t);
};
ue.prototype._offset = function(t) {
  if (t === 0)
    return [0, 0];
  let r = 0;
  for (let n = 0; n < this._bufs.length; n++) {
    const i = r + this._bufs[n].length;
    if (t < i || n === this._bufs.length - 1)
      return [n, t - r];
    r = i;
  }
};
ue.prototype._reverseOffset = function(e) {
  const t = e[0];
  let r = e[1];
  for (let n = 0; n < t; n++)
    r += this._bufs[n].length;
  return r;
};
ue.prototype.get = function(t) {
  if (t > this.length || t < 0)
    return;
  const r = this._offset(t);
  return this._bufs[r[0]][r[1]];
};
ue.prototype.slice = function(t, r) {
  return typeof t == "number" && t < 0 && (t += this.length), typeof r == "number" && r < 0 && (r += this.length), this.copy(null, 0, t, r);
};
ue.prototype.copy = function(t, r, n, i) {
  if ((typeof n != "number" || n < 0) && (n = 0), (typeof i != "number" || i > this.length) && (i = this.length), n >= this.length || i <= 0)
    return t || Be.alloc(0);
  const a = !!t, s = this._offset(n), f = i - n;
  let u = f, d = a && r || 0, g = s[1];
  if (n === 0 && i === this.length) {
    if (!a)
      return this._bufs.length === 1 ? this._bufs[0] : Be.concat(this._bufs, this.length);
    for (let p = 0; p < this._bufs.length; p++)
      this._bufs[p].copy(t, d), d += this._bufs[p].length;
    return t;
  }
  if (u <= this._bufs[s[0]].length - g)
    return a ? this._bufs[s[0]].copy(t, r, g, g + u) : this._bufs[s[0]].slice(g, g + u);
  a || (t = Be.allocUnsafe(f));
  for (let p = s[0]; p < this._bufs.length; p++) {
    const v = this._bufs[p].length - g;
    if (u > v)
      this._bufs[p].copy(t, d, g), d += v;
    else {
      this._bufs[p].copy(t, d, g, g + u), d += v;
      break;
    }
    u -= v, g && (g = 0);
  }
  return t.length > d ? t.slice(0, d) : t;
};
ue.prototype.shallowSlice = function(t, r) {
  if (t = t || 0, r = typeof r != "number" ? this.length : r, t < 0 && (t += this.length), r < 0 && (r += this.length), t === r)
    return this._new();
  const n = this._offset(t), i = this._offset(r), a = this._bufs.slice(n[0], i[0] + 1);
  return i[1] === 0 ? a.pop() : a[a.length - 1] = a[a.length - 1].slice(0, i[1]), n[1] !== 0 && (a[0] = a[0].slice(n[1])), this._new(a);
};
ue.prototype.toString = function(t, r, n) {
  return this.slice(r, n).toString(t);
};
ue.prototype.consume = function(t) {
  if (t = Math.trunc(t), Number.isNaN(t) || t <= 0) return this;
  for (; this._bufs.length; )
    if (t >= this._bufs[0].length)
      t -= this._bufs[0].length, this.length -= this._bufs[0].length, this._bufs.shift();
    else {
      this._bufs[0] = this._bufs[0].slice(t), this.length -= t;
      break;
    }
  return this;
};
ue.prototype.duplicate = function() {
  const t = this._new();
  for (let r = 0; r < this._bufs.length; r++)
    t.append(this._bufs[r]);
  return t;
};
ue.prototype.append = function(t) {
  if (t == null)
    return this;
  if (t.buffer)
    this._appendBuffer(Be.from(t.buffer, t.byteOffset, t.byteLength));
  else if (Array.isArray(t))
    for (let r = 0; r < t.length; r++)
      this.append(t[r]);
  else if (this._isBufferList(t))
    for (let r = 0; r < t._bufs.length; r++)
      this.append(t._bufs[r]);
  else
    typeof t == "number" && (t = t.toString()), this._appendBuffer(Be.from(t));
  return this;
};
ue.prototype._appendBuffer = function(t) {
  this._bufs.push(t), this.length += t.length;
};
ue.prototype.indexOf = function(e, t, r) {
  if (r === void 0 && typeof t == "string" && (r = t, t = void 0), typeof e == "function" || Array.isArray(e))
    throw new TypeError('The "value" argument must be one of type string, Buffer, BufferList, or Uint8Array.');
  if (typeof e == "number" ? e = Be.from([e]) : typeof e == "string" ? e = Be.from(e, r) : this._isBufferList(e) ? e = e.slice() : Array.isArray(e.buffer) ? e = Be.from(e.buffer, e.byteOffset, e.byteLength) : Be.isBuffer(e) || (e = Be.from(e)), t = Number(t || 0), isNaN(t) && (t = 0), t < 0 && (t = this.length + t), t < 0 && (t = 0), e.length === 0)
    return t > this.length ? this.length : t;
  const n = this._offset(t);
  let i = n[0], a = n[1];
  for (; i < this._bufs.length; i++) {
    const s = this._bufs[i];
    for (; a < s.length; )
      if (s.length - a >= e.length) {
        const u = s.indexOf(e, a);
        if (u !== -1)
          return this._reverseOffset([i, u]);
        a = s.length - e.length + 1;
      } else {
        const u = this._reverseOffset([i, a]);
        if (this._match(u, e))
          return u;
        a++;
      }
    a = 0;
  }
  return -1;
};
ue.prototype._match = function(e, t) {
  if (this.length - e < t.length)
    return !1;
  for (let r = 0; r < t.length; r++)
    if (this.get(e + r) !== t[r])
      return !1;
  return !0;
};
(function() {
  const e = {
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
  for (const t in e)
    (function(r) {
      e[r] === null ? ue.prototype[r] = function(n, i) {
        return this.slice(n, n + i)[r](0, i);
      } : ue.prototype[r] = function(n = 0) {
        return this.slice(n, n + e[r])[r](0);
      };
    })(t);
})();
ue.prototype._isBufferList = function(t) {
  return t instanceof ue || ue.isBufferList(t);
};
ue.isBufferList = function(t) {
  return t != null && t[jl];
};
var Em = ue;
const ts = Ue.Duplex, xm = ye, Tr = Em;
function xe(e) {
  if (!(this instanceof xe))
    return new xe(e);
  if (typeof e == "function") {
    this._callback = e;
    const t = (function(n) {
      this._callback && (this._callback(n), this._callback = null);
    }).bind(this);
    this.on("pipe", function(n) {
      n.on("error", t);
    }), this.on("unpipe", function(n) {
      n.removeListener("error", t);
    }), e = null;
  }
  Tr._init.call(this, e), ts.call(this);
}
xm(xe, ts);
Object.assign(xe.prototype, Tr.prototype);
xe.prototype._new = function(t) {
  return new xe(t);
};
xe.prototype._write = function(t, r, n) {
  this._appendBuffer(t), typeof n == "function" && n();
};
xe.prototype._read = function(t) {
  if (!this.length)
    return this.push(null);
  t = Math.min(t, this.length), this.push(this.slice(0, t)), this.consume(t);
};
xe.prototype.end = function(t) {
  ts.prototype.end.call(this, t), this._callback && (this._callback(null, this.slice()), this._callback = null);
};
xe.prototype._destroy = function(t, r) {
  this._bufs.length = 0, this.length = 0, r(t);
};
xe.prototype._isBufferList = function(t) {
  return t instanceof xe || t instanceof Tr || xe.isBufferList(t);
};
xe.isBufferList = Tr.isBufferList;
Bn.exports = xe;
Bn.exports.BufferListStream = xe;
Bn.exports.BufferList = Tr;
var Om = Bn.exports, Mt = {}, Rm = Buffer.alloc, Tm = "0000000000000000000", Am = "7777777777777777777", Bl = 48, Fl = Buffer.from("ustar\0", "binary"), Lm = Buffer.from("00", "binary"), $m = Buffer.from("ustar ", "binary"), Mm = Buffer.from(" \0", "binary"), Dm = parseInt("7777", 8), or = 257, fa = 263, Pm = function(e, t, r) {
  return typeof e != "number" ? r : (e = ~~e, e >= t ? t : e >= 0 || (e += t, e >= 0) ? e : 0);
}, Im = function(e) {
  switch (e) {
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
}, Cm = function(e) {
  switch (e) {
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
}, kl = function(e, t, r, n) {
  for (; r < n; r++)
    if (e[r] === t) return r;
  return n;
}, Ul = function(e) {
  for (var t = 256, r = 0; r < 148; r++) t += e[r];
  for (var n = 156; n < 512; n++) t += e[n];
  return t;
}, at = function(e, t) {
  return e = e.toString(8), e.length > t ? Am.slice(0, t) + " " : Tm.slice(0, t - e.length) + e + " ";
};
function Nm(e) {
  var t;
  if (e[0] === 128) t = !0;
  else if (e[0] === 255) t = !1;
  else return null;
  for (var r = [], n = e.length - 1; n > 0; n--) {
    var i = e[n];
    t ? r.push(i) : r.push(255 - i);
  }
  var a = 0, s = r.length;
  for (n = 0; n < s; n++)
    a += r[n] * Math.pow(256, n);
  return t ? a : -1 * a;
}
var st = function(e, t, r) {
  if (e = e.slice(t, t + r), t = 0, e[t] & 128)
    return Nm(e);
  for (; t < e.length && e[t] === 32; ) t++;
  for (var n = Pm(kl(e, 32, t, e.length), e.length, e.length); t < n && e[t] === 0; ) t++;
  return n === t ? 0 : parseInt(e.slice(t, n).toString(), 8);
}, Bt = function(e, t, r, n) {
  return e.slice(t, kl(e, 0, t, t + r)).toString(n);
}, Bi = function(e) {
  var t = Buffer.byteLength(e), r = Math.floor(Math.log(t) / Math.log(10)) + 1;
  return t + r >= Math.pow(10, r) && r++, t + r + e;
};
Mt.decodeLongPath = function(e, t) {
  return Bt(e, 0, e.length, t);
};
Mt.encodePax = function(e) {
  var t = "";
  e.name && (t += Bi(" path=" + e.name + `
`)), e.linkname && (t += Bi(" linkpath=" + e.linkname + `
`));
  var r = e.pax;
  if (r)
    for (var n in r)
      t += Bi(" " + n + "=" + r[n] + `
`);
  return Buffer.from(t);
};
Mt.decodePax = function(e) {
  for (var t = {}; e.length; ) {
    for (var r = 0; r < e.length && e[r] !== 32; ) r++;
    var n = parseInt(e.slice(0, r).toString(), 10);
    if (!n) return t;
    var i = e.slice(r + 1, n - 1).toString(), a = i.indexOf("=");
    if (a === -1) return t;
    t[i.slice(0, a)] = i.slice(a + 1), e = e.slice(n);
  }
  return t;
};
Mt.encode = function(e) {
  var t = Rm(512), r = e.name, n = "";
  if (e.typeflag === 5 && r[r.length - 1] !== "/" && (r += "/"), Buffer.byteLength(r) !== r.length) return null;
  for (; Buffer.byteLength(r) > 100; ) {
    var i = r.indexOf("/");
    if (i === -1) return null;
    n += n ? "/" + r.slice(0, i) : r.slice(0, i), r = r.slice(i + 1);
  }
  return Buffer.byteLength(r) > 100 || Buffer.byteLength(n) > 155 || e.linkname && Buffer.byteLength(e.linkname) > 100 ? null : (t.write(r), t.write(at(e.mode & Dm, 6), 100), t.write(at(e.uid, 6), 108), t.write(at(e.gid, 6), 116), t.write(at(e.size, 11), 124), t.write(at(e.mtime.getTime() / 1e3 | 0, 11), 136), t[156] = Bl + Cm(e.type), e.linkname && t.write(e.linkname, 157), Fl.copy(t, or), Lm.copy(t, fa), e.uname && t.write(e.uname, 265), e.gname && t.write(e.gname, 297), t.write(at(e.devmajor || 0, 6), 329), t.write(at(e.devminor || 0, 6), 337), n && t.write(n, 345), t.write(at(Ul(t), 6), 148), t);
};
Mt.decode = function(e, t, r) {
  var n = e[156] === 0 ? 0 : e[156] - Bl, i = Bt(e, 0, 100, t), a = st(e, 100, 8), s = st(e, 108, 8), f = st(e, 116, 8), u = st(e, 124, 12), d = st(e, 136, 12), g = Im(n), p = e[157] === 0 ? null : Bt(e, 157, 100, t), v = Bt(e, 265, 32), R = Bt(e, 297, 32), A = st(e, 329, 8), E = st(e, 337, 8), L = Ul(e);
  if (L === 8 * 32) return null;
  if (L !== st(e, 148, 8)) throw new Error("Invalid tar header. Maybe the tar is corrupted or it needs to be gunzipped?");
  if (Fl.compare(e, or, or + 6) === 0)
    e[345] && (i = Bt(e, 345, 155, t) + "/" + i);
  else if (!($m.compare(e, or, or + 6) === 0 && Mm.compare(e, fa, fa + 2) === 0)) {
    if (!r)
      throw new Error("Invalid tar header: unknown format.");
  }
  return n === 0 && i && i[i.length - 1] === "/" && (n = 5), {
    name: i,
    mode: a,
    uid: s,
    gid: f,
    size: u,
    mtime: new Date(1e3 * d),
    type: g,
    linkname: p,
    uname: v,
    gname: R,
    devmajor: A,
    devminor: E
  };
};
var ql = Ee, jm = Om, nr = Mt, zl = Ue.Writable, Wl = Ue.PassThrough, Gl = function() {
}, Mo = function(e) {
  return e &= 511, e && 512 - e;
}, Bm = function(e, t) {
  var r = new Fn(e, t);
  return r.end(), r;
}, Fm = function(e, t) {
  return t.path && (e.name = t.path), t.linkpath && (e.linkname = t.linkpath), t.size && (e.size = parseInt(t.size, 10)), e.pax = t, e;
}, Fn = function(e, t) {
  this._parent = e, this.offset = t, Wl.call(this, { autoDestroy: !1 });
};
ql.inherits(Fn, Wl);
Fn.prototype.destroy = function(e) {
  this._parent.destroy(e);
};
var Xe = function(e) {
  if (!(this instanceof Xe)) return new Xe(e);
  zl.call(this, e), e = e || {}, this._offset = 0, this._buffer = jm(), this._missing = 0, this._partial = !1, this._onparse = Gl, this._header = null, this._stream = null, this._overflow = null, this._cb = null, this._locked = !1, this._destroyed = !1, this._pax = null, this._paxGlobal = null, this._gnuLongPath = null, this._gnuLongLinkPath = null;
  var t = this, r = t._buffer, n = function() {
    t._continue();
  }, i = function(v) {
    if (t._locked = !1, v) return t.destroy(v);
    t._stream || n();
  }, a = function() {
    t._stream = null;
    var v = Mo(t._header.size);
    v ? t._parse(v, s) : t._parse(512, p), t._locked || n();
  }, s = function() {
    t._buffer.consume(Mo(t._header.size)), t._parse(512, p), n();
  }, f = function() {
    var v = t._header.size;
    t._paxGlobal = nr.decodePax(r.slice(0, v)), r.consume(v), a();
  }, u = function() {
    var v = t._header.size;
    t._pax = nr.decodePax(r.slice(0, v)), t._paxGlobal && (t._pax = Object.assign({}, t._paxGlobal, t._pax)), r.consume(v), a();
  }, d = function() {
    var v = t._header.size;
    this._gnuLongPath = nr.decodeLongPath(r.slice(0, v), e.filenameEncoding), r.consume(v), a();
  }, g = function() {
    var v = t._header.size;
    this._gnuLongLinkPath = nr.decodeLongPath(r.slice(0, v), e.filenameEncoding), r.consume(v), a();
  }, p = function() {
    var v = t._offset, R;
    try {
      R = t._header = nr.decode(r.slice(0, 512), e.filenameEncoding, e.allowUnknownFormat);
    } catch (A) {
      t.emit("error", A);
    }
    if (r.consume(512), !R) {
      t._parse(512, p), n();
      return;
    }
    if (R.type === "gnu-long-path") {
      t._parse(R.size, d), n();
      return;
    }
    if (R.type === "gnu-long-link-path") {
      t._parse(R.size, g), n();
      return;
    }
    if (R.type === "pax-global-header") {
      t._parse(R.size, f), n();
      return;
    }
    if (R.type === "pax-header") {
      t._parse(R.size, u), n();
      return;
    }
    if (t._gnuLongPath && (R.name = t._gnuLongPath, t._gnuLongPath = null), t._gnuLongLinkPath && (R.linkname = t._gnuLongLinkPath, t._gnuLongLinkPath = null), t._pax && (t._header = R = Fm(R, t._pax), t._pax = null), t._locked = !0, !R.size || R.type === "directory") {
      t._parse(512, p), t.emit("entry", R, Bm(t, v), i);
      return;
    }
    t._stream = new Fn(t, v), t.emit("entry", R, t._stream, i), t._parse(R.size, a), n();
  };
  this._onheader = p, this._parse(512, p);
};
ql.inherits(Xe, zl);
Xe.prototype.destroy = function(e) {
  this._destroyed || (this._destroyed = !0, e && this.emit("error", e), this.emit("close"), this._stream && this._stream.emit("close"));
};
Xe.prototype._parse = function(e, t) {
  this._destroyed || (this._offset += e, this._missing = e, t === this._onheader && (this._partial = !1), this._onparse = t);
};
Xe.prototype._continue = function() {
  if (!this._destroyed) {
    var e = this._cb;
    this._cb = Gl, this._overflow ? this._write(this._overflow, void 0, e) : e();
  }
};
Xe.prototype._write = function(e, t, r) {
  if (!this._destroyed) {
    var n = this._stream, i = this._buffer, a = this._missing;
    if (e.length && (this._partial = !0), e.length < a)
      return this._missing -= e.length, this._overflow = null, n ? n.write(e, r) : (i.append(e), r());
    this._cb = r, this._missing = 0;
    var s = null;
    e.length > a && (s = e.slice(a), e = e.slice(0, a)), n ? n.end(e) : i.append(e), this._overflow = s, this._onparse();
  }
};
Xe.prototype._final = function(e) {
  if (this._partial) return this.destroy(new Error("Unexpected end of data"));
  e();
};
var km = Xe, Um = Lt.constants || Io, qm = Wa, zm = function() {
}, Wm = oe.Bare ? queueMicrotask : process.nextTick.bind(process), Gm = function(e) {
  return e.setHeader && typeof e.abort == "function";
}, Hm = function(e) {
  return e.stdio && Array.isArray(e.stdio) && e.stdio.length === 3;
}, Hl = function(e, t, r) {
  if (typeof t == "function") return Hl(e, null, t);
  t || (t = {}), r = qm(r || zm);
  var n = e._writableState, i = e._readableState, a = t.readable || t.readable !== !1 && e.readable, s = t.writable || t.writable !== !1 && e.writable, f = !1, u = function() {
    e.writable || d();
  }, d = function() {
    s = !1, a || r.call(e);
  }, g = function() {
    a = !1, s || r.call(e);
  }, p = function(L) {
    r.call(e, L ? new Error("exited with error code: " + L) : null);
  }, v = function(L) {
    r.call(e, L);
  }, R = function() {
    Wm(A);
  }, A = function() {
    if (!f) {
      if (a && !(i && i.ended && !i.destroyed)) return r.call(e, new Error("premature close"));
      if (s && !(n && n.ended && !n.destroyed)) return r.call(e, new Error("premature close"));
    }
  }, E = function() {
    e.req.on("finish", d);
  };
  return Gm(e) ? (e.on("complete", d), e.on("abort", R), e.req ? E() : e.on("request", E)) : s && !n && (e.on("end", u), e.on("close", u)), Hm(e) && e.on("exit", p), e.on("end", g), e.on("finish", d), t.error !== !1 && e.on("error", v), e.on("close", R), function() {
    f = !0, e.removeListener("complete", d), e.removeListener("abort", R), e.removeListener("request", E), e.req && e.req.removeListener("finish", d), e.removeListener("end", u), e.removeListener("close", u), e.removeListener("finish", d), e.removeListener("exit", p), e.removeListener("end", g), e.removeListener("error", v), e.removeListener("close", R);
  };
}, Vm = Hl, Ct = Um, Do = Vm, kn = ye, Zm = Buffer.alloc, Vl = Ue.Readable, tr = Ue.Writable, Ym = lc.StringDecoder, Wr = Mt, Qm = parseInt("755", 8), Km = parseInt("644", 8), Zl = Zm(1024), rs = function() {
}, ua = function(e, t) {
  t &= 511, t && e.push(Zl.slice(0, 512 - t));
};
function Xm(e) {
  switch (e & Ct.S_IFMT) {
    case Ct.S_IFBLK:
      return "block-device";
    case Ct.S_IFCHR:
      return "character-device";
    case Ct.S_IFDIR:
      return "directory";
    case Ct.S_IFIFO:
      return "fifo";
    case Ct.S_IFLNK:
      return "symlink";
  }
  return "file";
}
var Un = function(e) {
  tr.call(this), this.written = 0, this._to = e, this._destroyed = !1;
};
kn(Un, tr);
Un.prototype._write = function(e, t, r) {
  if (this.written += e.length, this._to.push(e)) return r();
  this._to._drain = r;
};
Un.prototype.destroy = function() {
  this._destroyed || (this._destroyed = !0, this.emit("close"));
};
var qn = function() {
  tr.call(this), this.linkname = "", this._decoder = new Ym("utf-8"), this._destroyed = !1;
};
kn(qn, tr);
qn.prototype._write = function(e, t, r) {
  this.linkname += this._decoder.write(e), r();
};
qn.prototype.destroy = function() {
  this._destroyed || (this._destroyed = !0, this.emit("close"));
};
var _r = function() {
  tr.call(this), this._destroyed = !1;
};
kn(_r, tr);
_r.prototype._write = function(e, t, r) {
  r(new Error("No body allowed for this entry"));
};
_r.prototype.destroy = function() {
  this._destroyed || (this._destroyed = !0, this.emit("close"));
};
var He = function(e) {
  if (!(this instanceof He)) return new He(e);
  Vl.call(this, e), this._drain = rs, this._finalized = !1, this._finalizing = !1, this._destroyed = !1, this._stream = null;
};
kn(He, Vl);
He.prototype.entry = function(e, t, r) {
  if (this._stream) throw new Error("already piping an entry");
  if (!(this._finalized || this._destroyed)) {
    typeof t == "function" && (r = t, t = null), r || (r = rs);
    var n = this;
    if ((!e.size || e.type === "symlink") && (e.size = 0), e.type || (e.type = Xm(e.mode)), e.mode || (e.mode = e.type === "directory" ? Qm : Km), e.uid || (e.uid = 0), e.gid || (e.gid = 0), e.mtime || (e.mtime = /* @__PURE__ */ new Date()), typeof t == "string" && (t = Buffer.from(t)), Buffer.isBuffer(t)) {
      e.size = t.length, this._encode(e);
      var i = this.push(t);
      return ua(n, e.size), i ? process.nextTick(r) : this._drain = r, new _r();
    }
    if (e.type === "symlink" && !e.linkname) {
      var a = new qn();
      return Do(a, function(f) {
        if (f)
          return n.destroy(), r(f);
        e.linkname = a.linkname, n._encode(e), r();
      }), a;
    }
    if (this._encode(e), e.type !== "file" && e.type !== "contiguous-file")
      return process.nextTick(r), new _r();
    var s = new Un(this);
    return this._stream = s, Do(s, function(f) {
      if (n._stream = null, f)
        return n.destroy(), r(f);
      if (s.written !== e.size)
        return n.destroy(), r(new Error("size mismatch"));
      ua(n, e.size), n._finalizing && n.finalize(), r();
    }), s;
  }
};
He.prototype.finalize = function() {
  if (this._stream) {
    this._finalizing = !0;
    return;
  }
  this._finalized || (this._finalized = !0, this.push(Zl), this.push(null));
};
He.prototype.destroy = function(e) {
  this._destroyed || (this._destroyed = !0, e && this.emit("error", e), this.emit("close"), this._stream && this._stream.destroy && this._stream.destroy());
};
He.prototype._encode = function(e) {
  if (!e.pax) {
    var t = Wr.encode(e);
    if (t) {
      this.push(t);
      return;
    }
  }
  this._encodePax(e);
};
He.prototype._encodePax = function(e) {
  var t = Wr.encodePax({
    name: e.name,
    linkname: e.linkname,
    pax: e.pax
  }), r = {
    name: "PaxHeader",
    mode: e.mode,
    uid: e.uid,
    gid: e.gid,
    size: t.length,
    mtime: e.mtime,
    type: "pax-header",
    linkname: e.linkname && "PaxHeader",
    uname: e.uname,
    gname: e.gname,
    devmajor: e.devmajor,
    devminor: e.devminor
  };
  this.push(Wr.encode(r)), this.push(t), ua(this, t.length), r.size = e.size, r.type = e.type, this.push(Wr.encode(r));
};
He.prototype._read = function(e) {
  var t = this._drain;
  this._drain = rs, t();
};
var Jm = He;
es.extract = km;
es.pack = Jm;
/**
 * TAR Format Plugin
 *
 * @module plugins/tar
 * @license [MIT]{@link https://github.com/archiverjs/node-archiver/blob/master/LICENSE}
 * @copyright (c) 2012-2014 Chris Talkington, contributors.
 */
var e_ = Co, t_ = es, Yl = Nn, Je = function(e) {
  if (!(this instanceof Je))
    return new Je(e);
  e = this.options = Yl.defaults(e, {
    gzip: !1
  }), typeof e.gzipOptions != "object" && (e.gzipOptions = {}), this.supports = {
    directory: !0,
    symlink: !0
  }, this.engine = t_.pack(e), this.compressor = !1, e.gzip && (this.compressor = e_.createGzip(e.gzipOptions), this.compressor.on("error", this._onCompressorError.bind(this)));
};
Je.prototype._onCompressorError = function(e) {
  this.engine.emit("error", e);
};
Je.prototype.append = function(e, t, r) {
  var n = this;
  t.mtime = t.date;
  function i(s, f) {
    if (s) {
      r(s);
      return;
    }
    n.engine.entry(t, f, function(u) {
      r(u, t);
    });
  }
  if (t.sourceType === "buffer")
    i(null, e);
  else if (t.sourceType === "stream" && t.stats) {
    t.size = t.stats.size;
    var a = n.engine.entry(t, function(s) {
      r(s, t);
    });
    e.pipe(a);
  } else t.sourceType === "stream" && Yl.collectStream(e, i);
};
Je.prototype.finalize = function() {
  this.engine.finalize();
};
Je.prototype.on = function() {
  return this.engine.on.apply(this.engine, arguments);
};
Je.prototype.pipe = function(e, t) {
  return this.compressor ? this.engine.pipe.apply(this.engine, [this.compressor]).pipe(e, t) : this.engine.pipe.apply(this.engine, arguments);
};
Je.prototype.unpipe = function() {
  return this.compressor ? this.compressor.unpipe.apply(this.compressor, arguments) : this.engine.unpipe.apply(this.engine, arguments);
};
var r_ = Je;
/**
 * JSON Format Plugin
 *
 * @module plugins/json
 * @license [MIT]{@link https://github.com/archiverjs/node-archiver/blob/master/LICENSE}
 * @copyright (c) 2012-2014 Chris Talkington, contributors.
 */
var n_ = Ee.inherits, Ql = Ue.Transform, i_ = Ll, Kl = Nn, gt = function(e) {
  if (!(this instanceof gt))
    return new gt(e);
  e = this.options = Kl.defaults(e, {}), Ql.call(this, e), this.supports = {
    directory: !0,
    symlink: !0
  }, this.files = [];
};
n_(gt, Ql);
gt.prototype._transform = function(e, t, r) {
  r(null, e);
};
gt.prototype._writeStringified = function() {
  var e = JSON.stringify(this.files);
  this.write(e);
};
gt.prototype.append = function(e, t, r) {
  var n = this;
  t.crc32 = 0;
  function i(a, s) {
    if (a) {
      r(a);
      return;
    }
    t.size = s.length || 0, t.crc32 = i_.unsigned(s), n.files.push(t), r(null, t);
  }
  t.sourceType === "buffer" ? i(null, e) : t.sourceType === "stream" && Kl.collectStream(e, i);
};
gt.prototype.finalize = function() {
  this._writeStringified(), this.end();
};
var a_ = gt;
/**
 * Archiver Vending
 *
 * @ignore
 * @license [MIT]{@link https://github.com/archiverjs/node-archiver/blob/master/LICENSE}
 * @copyright (c) 2012-2014 Chris Talkington, contributors.
 */
var s_ = Dy, br = {}, bt = function(e, t) {
  return bt.create(e, t);
};
bt.create = function(e, t) {
  if (br[e]) {
    var r = new s_(e, t);
    return r.setFormat(e), r.setModule(new br[e](t)), r;
  } else
    throw new Error("create(" + e + "): format not registered");
};
bt.registerFormat = function(e, t) {
  if (br[e])
    throw new Error("register(" + e + "): format already registered");
  if (typeof t != "function")
    throw new Error("register(" + e + "): format module invalid");
  if (typeof t.prototype.append != "function" || typeof t.prototype.finalize != "function")
    throw new Error("register(" + e + "): format module missing methods");
  br[e] = t;
};
bt.isRegisteredFormat = function(e) {
  return !!br[e];
};
bt.registerFormat("zip", Sm);
bt.registerFormat("tar", r_);
bt.registerFormat("json", a_);
var o_ = bt;
const f_ = /* @__PURE__ */ cc(o_), u_ = f_, Xl = re.dirname(oc(import.meta.url));
process.env.APP_ROOT = re.join(Xl, "..");
const l_ = we.requestSingleInstanceLock();
l_ || we.quit();
we.disableHardwareAcceleration();
we.commandLine.appendSwitch("disable-gpu");
we.commandLine.appendSwitch("disable-gpu-compositing");
const ns = !1, Jl = process.env.DEVTOOLS_ENABLED === "true" || ns, la = process.env.VITE_DEV_SERVER_URL, N_ = re.join(process.env.APP_ROOT, "dist-electron"), ec = re.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = la ? re.join(process.env.APP_ROOT, "public") : ec;
let ge = null;
const tc = re.join(we.getPath("userData"), "settings.json");
function c_() {
  try {
    const e = te.readFileSync(tc, "utf-8"), t = JSON.parse(e);
    if (t && typeof t == "object")
      return t;
  } catch {
  }
  return {};
}
function Br(e) {
  te.writeFileSync(
    tc,
    JSON.stringify(e, null, 2),
    "utf-8"
  );
}
const Ne = c_();
let Ke = Ne.downloadFolder ?? re.join(we.getPath("downloads"), "GPT Image Studio"), ca = Ne.filenamePrefix ?? "★", ot = (Ne.debugMode ?? !1) || ns;
const Fr = /* @__PURE__ */ new Map(), kr = /* @__PURE__ */ new Map(), Fi = /* @__PURE__ */ new Map(), is = !we.isPackaged || process.env.WS_AUDIT_FORCE === "true" || ns, rc = process.env.PORTABLE_EXECUTABLE_DIR ? re.join(process.env.PORTABLE_EXECUTABLE_DIR, "logs") : re.join(re.dirname(we.getPath("exe")), "logs"), nc = re.join(rc, "ws-audit.log");
if (is)
  try {
    te.mkdirSync(rc, { recursive: !0 });
  } catch {
  }
function Nt(e, t, r) {
  if (!is)
    return;
  const n = `[WS-AUDIT][main] ${(/* @__PURE__ */ new Date()).toISOString()} | workspace=${e ?? "unknown"} | event=${t} ${JSON.stringify(r ?? {})}`;
  console.log(n);
  try {
    te.appendFileSync(nc, n + `
`, "utf-8");
  } catch {
  }
}
const fr = re.join(we.getPath("userData"), "DebugLogs");
function jt(e) {
  const t = re.join(fr, e);
  return te.mkdirSync(t, { recursive: !0 }), t;
}
const h_ = ["pipeline", "prompt", "workspace", "dom", "error"];
function d_(e) {
  return h_.includes(e);
}
function p_(e, t) {
  const r = e.split(`
`), n = t.split(`
`), i = r.length, a = n.length, s = Array.from({ length: i + 1 }, () => new Array(a + 1).fill(0));
  for (let g = i - 1; g >= 0; g--)
    for (let p = a - 1; p >= 0; p--)
      s[g][p] = r[g] === n[p] ? s[g + 1][p + 1] + 1 : Math.max(s[g + 1][p], s[g][p + 1]);
  const f = [
    "--- original.txt",
    "+++ inserted.txt",
    `@@ -1,${i} +1,${a} @@`
  ];
  let u = 0, d = 0;
  for (; u < i && d < a; )
    r[u] === n[d] ? (f.push("  " + r[u]), u++, d++) : s[u + 1][d] >= s[u][d + 1] ? (f.push("- " + r[u]), u++) : (f.push("+ " + n[d]), d++);
  for (; u < i; )
    f.push("- " + r[u]), u++;
  for (; d < a; )
    f.push("+ " + n[d]), d++;
  return f.join(`
`);
}
function ki(e) {
  return e.replace(/[\\/:*?"<>|]/g, "_").trim();
}
function g_(e, t, r) {
  const n = ki(t) || "Untitled", i = ki(ca), a = ki(r), s = `${i}${a}${n}`, f = `${s}.png`;
  if (!te.existsSync(re.join(e, f)))
    return f;
  let u = 2, d = `${s}${u}.png`;
  for (; te.existsSync(re.join(e, d)); )
    u++, d = `${s}${u}.png`;
  return d;
}
we.on("second-instance", () => {
  ge && (ge.isMinimized() && ge.restore(), ge.focus());
});
we.on("web-contents-created", (e, t) => {
  t.on("will-attach-webview", (r, n) => {
    n.devTools = Jl;
  });
});
function ic() {
  ge = new Po({
    width: 1800,
    height: 1100,
    minWidth: 1400,
    minHeight: 900,
    title: "GPT Image Studio",
    icon: re.join(process.env.VITE_PUBLIC, "icon.ico"),
    autoHideMenuBar: !0,
    webPreferences: {
      preload: re.join(Xl, "preload.mjs"),
      contextIsolation: !0,
      nodeIntegration: !1,
      webviewTag: !0,
      sandbox: !0,
      devTools: Jl
    }
  }), la ? ge.loadURL(la) : ge.loadFile(re.join(ec, "index.html")), ge.webContents.setWindowOpenHandler(() => ({
    action: "deny"
  }));
}
we.whenReady().then(() => {
  Ar.defaultSession.setUserAgent(
    Ar.defaultSession.getUserAgent()
  ), te.existsSync(Ke) || te.mkdirSync(Ke, { recursive: !0 });
  const e = (i, a, s) => {
    const f = kr.get(s.id), u = f ? Fr.get(f) : void 0;
    Nt(f, "Download Started", {
      webContentsId: s.id,
      pendingArmedFor: (u == null ? void 0 : u.id) ?? null,
      pendingBaseName: (u == null ? void 0 : u.baseName) ?? null
    }), f && Fr.delete(f);
    const d = g_(
      Ke,
      (u == null ? void 0 : u.baseName) ?? "Untitled",
      (u == null ? void 0 : u.workTypePrefix) ?? ""
    ), g = re.join(Ke, d);
    a.setSavePath(g), Nt(f, "Save Started", {
      webContentsId: s.id,
      filePath: g
    }), a.once("done", (p, v) => {
      Nt(f, "Save Completed", {
        webContentsId: s.id,
        filePath: g,
        state: v
      }), ge == null || ge.webContents.send("image:downloaded", {
        id: (u == null ? void 0 : u.id) ?? null,
        filePath: v === "completed" ? g : null
      });
    });
  };
  Ar.defaultSession.on("will-download", e), Ar.fromPartition("persist:gpt-image-studio").on("will-download", e), le.on(
    "image:armDownload",
    (i, a, s, f) => {
      Fr.set(a, { id: a, baseName: s, workTypePrefix: f }), Nt(a, "Download Armed", { baseName: s, workTypePrefix: f }), i.returnValue = !0;
    }
  ), le.on(
    "browser:registerWebview",
    (i, a, s) => {
      kr.set(s, a), Fi.set(a, s), Nt(a, "Webview Registered", { webContentsId: s });
    }
  ), le.on(
    "browser:unregisterWebview",
    (i, a) => {
      for (const [s, f] of kr)
        f === a && (kr.delete(s), Nt(a, "Webview Unregistered", { webContentsId: s }));
      Fi.delete(a), Fr.delete(a);
    }
  ), le.on("ws-audit:log", (i, a) => {
    if (is) {
      console.log(a);
      try {
        te.appendFileSync(nc, `${a} | ipcSenderId=${i.sender.id}
`, "utf-8");
      } catch {
      }
    }
  }), le.handle(
    "image:verifyFile",
    async (i, a) => {
      const u = Date.now();
      for (; Date.now() - u <= 3e3; ) {
        try {
          const d = te.statSync(a);
          if (d.size > 0)
            return { exists: !0, size: d.size };
        } catch {
        }
        await new Promise((d) => setTimeout(d, 100));
      }
      return { exists: !1, size: 0 };
    }
  ), le.handle("settings:getDownloadFolder", () => Ke), le.handle("settings:browseDownloadFolder", async () => {
    if (!ge)
      return { success: !1 };
    const i = await Lr.showOpenDialog(ge, {
      properties: ["openDirectory", "createDirectory"]
    });
    if (i.canceled || !i.filePaths[0])
      return { success: !1, canceled: !0 };
    const a = i.filePaths[0];
    return te.existsSync(a) || te.mkdirSync(a, { recursive: !0 }), Ke = a, Ne.downloadFolder = a, Br(Ne), { success: !0, folder: a };
  }), le.handle("settings:getFilenamePrefix", () => ca), le.handle("settings:setFilenamePrefix", (i, a) => (ca = a, Ne.filenamePrefix = a, Br(Ne), { success: !0 })), le.handle("settings:openDownloadFolder", async () => {
    te.existsSync(Ke) || te.mkdirSync(Ke, { recursive: !0 });
    const i = await ac.openPath(Ke);
    return { success: i === "", error: i || null };
  }), le.handle(
    "settings:getFirstLaunchNoticeShown",
    () => !!Ne.firstLaunchNoticeShown
  ), le.handle("settings:markFirstLaunchNoticeShown", () => (Ne.firstLaunchNoticeShown = !0, Br(Ne), { success: !0 })), le.handle("settings:getAppInfo", () => {
    let i = null;
    try {
      i = fc("git rev-parse --short HEAD", {
        cwd: process.env.APP_ROOT,
        stdio: ["ignore", "pipe", "ignore"]
      }).toString().trim();
    } catch {
      i = null;
    }
    return {
      appVersion: we.getVersion(),
      electronVersion: process.versions.electron,
      nodeVersion: process.versions.node,
      gitCommit: i
    };
  }), le.handle("settings:getDebugMode", () => ot), le.handle("settings:setDebugMode", (i, a) => (ot = a, Ne.debugMode = a, Br(Ne), { success: !0 })), le.handle("settings:getDebugLogsPath", () => fr), le.on("debug:log", (i, a, s, f) => {
    if (!(!ot || !d_(s)))
      try {
        const u = jt(a);
        te.appendFileSync(re.join(u, `${s}.log`), f + `
`, "utf-8");
      } catch {
      }
  }), le.handle(
    "debug:savePromptData",
    (i, a) => {
      if (!ot)
        return { success: !1 };
      try {
        const s = jt(a.sessionId);
        te.writeFileSync(re.join(s, "original_prompt.txt"), a.original, "utf-8"), te.writeFileSync(re.join(s, "resolved_prompt.txt"), a.substituted, "utf-8"), te.writeFileSync(re.join(s, "composer_readback.txt"), a.composerReadback, "utf-8"), te.writeFileSync(
          re.join(s, "prompt_diff.txt"),
          p_(a.substituted, a.composerReadback),
          "utf-8"
        );
        const f = uc("sha256").update(a.substituted, "utf-8").digest("hex"), u = [
          `[PROMPT] ${(/* @__PURE__ */ new Date()).toISOString()} | workspace=${a.workspaceId}`,
          `  name=${a.promptName} id=${a.promptId}`,
          `  originalCharCount=${a.original.length} originalLineCount=${a.original.split(`
`).length}`,
          `  substitutedCharCount=${a.substituted.length} substitutedLineCount=${a.substituted.split(`
`).length}`,
          `  sha256=${f}`
        ].join(`
`);
        return te.appendFileSync(re.join(s, "prompt.log"), u + `

`, "utf-8"), { success: !0, sha256: f };
      } catch (s) {
        return { success: !1, error: String(s) };
      }
    }
  ), le.handle(
    "debug:saveWorkspaceSnapshot",
    (i, a, s, f) => {
      if (!ot)
        return { success: !1 };
      try {
        const u = jt(a);
        return te.writeFileSync(re.join(u, `workspace_${s}.json`), f, "utf-8"), { success: !0 };
      } catch (u) {
        return { success: !1, error: String(u) };
      }
    }
  ), le.handle(
    "debug:saveComposerSnapshot",
    (i, a, s) => {
      if (!ot)
        return { success: !1 };
      try {
        const f = jt(a);
        return te.writeFileSync(re.join(f, "composer.html"), s.html ?? "", "utf-8"), te.writeFileSync(re.join(f, "composer.txt"), s.text ?? "", "utf-8"), { success: !0 };
      } catch (f) {
        return { success: !1, error: String(f) };
      }
    }
  ), le.handle(
    "debug:captureError",
    (i, a) => {
      if (!ot)
        return { success: !1 };
      try {
        const s = jt(a.sessionId), f = [
          `[ERROR] ${(/* @__PURE__ */ new Date()).toISOString()} | workspace=${a.workspaceId} | stage=${a.stage}`,
          `  reason=${a.reason}`,
          `  exception=${a.exception ?? "(none)"}`,
          `  stack=${a.stack ?? "(none)"}`
        ].join(`
`);
        return te.appendFileSync(re.join(s, "error.log"), f + `

`, "utf-8"), { success: !0 };
      } catch (s) {
        return { success: !1, error: String(s) };
      }
    }
  ), le.handle(
    "debug:screenshot",
    async (i, a, s, f) => {
      if (!ot)
        return { success: !1 };
      try {
        const u = Fi.get(s), d = u !== void 0 ? sc.fromId(u) : void 0;
        if (!d)
          return { success: !1, error: "no webview webContents for this workspace" };
        const g = await d.capturePage(), p = jt(a), v = re.join(p, `screenshot_${f}.png`);
        return te.writeFileSync(v, g.toPNG()), { success: !0, filePath: v };
      } catch (u) {
        return { success: !1, error: String(u) };
      }
    }
  );
  function t(i, a) {
    return i instanceof Error ? {
      message: i.message,
      code: i.code ?? null,
      stack: i.stack ?? null,
      path: a
    } : { message: String(i), code: null, stack: null, path: a };
  }
  function r(i) {
    try {
      te.mkdirSync(fr, { recursive: !0 });
      const a = [
        "Timestamp:",
        (/* @__PURE__ */ new Date()).toISOString(),
        "",
        "Output path:",
        i.path,
        "",
        "Error message:",
        i.message,
        "",
        "Error code:",
        i.code ?? "(none)",
        "",
        "Error stack:",
        i.stack ?? "(none)",
        ""
      ].join(`
`);
      te.writeFileSync(re.join(fr, "export-error.txt"), a, "utf-8");
    } catch {
    }
  }
  function n(i) {
    return r(i), {
      success: !1,
      error: i.message,
      code: i.code,
      stack: i.stack,
      path: i.path
    };
  }
  le.handle("debug:exportDiagnostics", async (i, a) => {
    if (!ge)
      return { success: !1 };
    const s = re.join(fr, a);
    if (!te.existsSync(s))
      return { success: !1, error: "no debug session found for this Generate run" };
    let f;
    try {
      f = te.readdirSync(s);
    } catch (R) {
      return n(t(R, s));
    }
    if (f.length === 0)
      return n({
        message: `debug session folder has no files to export: ${s}`,
        code: null,
        stack: null,
        path: s
      });
    const d = `Diagnostics_${(/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-").replace("T", "_").slice(0, 19)}.zip`, g = await Lr.showSaveDialog(ge, {
      defaultPath: d,
      filters: [{ name: "ZIP", extensions: ["zip"] }]
    });
    if (g.canceled || !g.filePath)
      return { success: !1, canceled: !0 };
    const p = g.filePath, v = (R) => {
      try {
        R.destroy();
      } catch {
      }
      try {
        te.existsSync(p) && te.unlinkSync(p);
      } catch {
      }
    };
    try {
      if (await new Promise((A, E) => {
        const L = te.createWriteStream(p), c = u_("zip", { zlib: { level: 9 } });
        let h = !1;
        const O = (m) => {
          h || (h = !0, v(L), E(m));
        };
        L.on("close", () => {
          h || (h = !0, A());
        }), L.on("error", O), c.on("error", O), c.on("warning", (m) => {
          console.error("[debug:exportDiagnostics] archiver warning:", m), m.code === "ENOENT" && O(m);
        }), c.pipe(L), c.directory(s, !1), c.finalize().catch(O);
      }), te.statSync(p).size === 0) {
        try {
          te.unlinkSync(p);
        } catch {
        }
        return n({
          message: "archive completed with no error but produced a 0-byte file",
          code: null,
          stack: null,
          path: p
        });
      }
      return { success: !0, filePath: p };
    } catch (R) {
      return n(t(R, p));
    }
  }), le.handle(
    "backup:export",
    async (i, a) => {
      if (!ge)
        return { success: !1 };
      const s = await Lr.showSaveDialog(ge, {
        defaultPath: "GPT_Image_Studio_Backup.json",
        filters: [{ name: "JSON", extensions: ["json"] }]
      });
      return s.canceled || !s.filePath ? { success: !1, canceled: !0 } : (te.writeFileSync(s.filePath, a, "utf-8"), { success: !0, filePath: s.filePath });
    }
  ), le.handle("backup:import", async () => {
    if (!ge)
      return { success: !1 };
    const i = await Lr.showOpenDialog(ge, {
      properties: ["openFile"],
      filters: [{ name: "JSON", extensions: ["json"] }]
    });
    if (i.canceled || !i.filePaths[0])
      return { success: !1, canceled: !0 };
    try {
      const a = te.readFileSync(i.filePaths[0], "utf-8");
      return { success: !0, data: JSON.parse(a) };
    } catch {
      return {
        success: !1,
        error: "Could not read or parse the selected file."
      };
    }
  }), ic();
});
we.on("activate", () => {
  Po.getAllWindows().length === 0 && ic();
});
we.on("window-all-closed", () => {
  process.platform !== "darwin" && we.quit();
});
export {
  N_ as MAIN_DIST,
  ec as RENDERER_DIST,
  la as VITE_DEV_SERVER_URL
};
