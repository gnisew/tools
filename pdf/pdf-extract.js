/*
 * pdf-extract.js — 只讀必要位元組的 PDF 頁面擷取器
 *
 * 用法：
 *   const res = await FastPdfExtract.extractPages(file, [348, 349, 350], {
 *     isCancelled: () => false,
 *     onProgress: ({ bytesRead, objects }) => {},
 *   });
 *   res.bytes     → 只含這些頁面的新 PDF（Uint8Array）
 *   res.indexMap  → Map(原始頁索引 → 新 PDF 的頁索引)
 *
 * 流程：
 *   1. File.slice() 只讀檔尾，找 startxref，沿 /Prev 讀 xref（傳統表格 / xref stream / 混合）
 *   2. 走頁面樹，只讀目標頁面（及必要的中間節點）
 *   3. 只追蹤這些頁面用到的物件（內容、字型、影像…），串流資料原樣複製（不解壓、不重壓）
 *   4. 重新編號並寫出新的 PDF
 *
 * 不支援（會丟出例外，由呼叫端退回完整讀取）：
 *   加密檔、xref 損毀需重建、LZW 等少見的 xref / ObjStm 編碼、瀏覽器沒有 DecompressionStream
 */
(function (global) {
  'use strict';

  // ---------- 小工具 ----------
  const latin1 = (s) => {
    const u = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i) & 255;
    return u;
  };
  const toStr = (u, a = 0, b = u.length) => {
    let s = '';
    for (let i = a; i < b; i += 8192) s += String.fromCharCode.apply(null, u.subarray(i, Math.min(b, i + 8192)));
    return s;
  };
  const isWs = (c) => c === 0 || c === 9 || c === 10 || c === 12 || c === 13 || c === 32;
  const isDelim = (c) => c === 0x28 || c === 0x29 || c === 0x3C || c === 0x3E || c === 0x5B ||
                         c === 0x5D || c === 0x7B || c === 0x7D || c === 0x2F || c === 0x25;
  const isDigit = (c) => c >= 0x30 && c <= 0x39;

  class Name { constructor(v) { this.v = v; } }
  class Ref { constructor(n, g) { this.n = n; this.g = g; } }
  class Str { constructor(raw) { this.raw = raw; } }
  class Raw { constructor(s) { this.s = s; } }                 // 寫出時原樣輸出
  class Stream { constructor(dict, data) { this.dict = dict; this.data = data; } }
  class Eof extends Error { constructor() { super('unexpected end of buffer'); } }
  class Kw { constructor(v) { this.v = v; } }

  const cancelError = () => { const e = new Error('載入已取消'); e.cancelled = true; return e; };

  // ---------- 物件語法解析 ----------
  class Parser {
    constructor(buf, pos, final) { this.b = buf; this.pos = pos || 0; this.len = buf.length; this.final = !!final; }

    skipWs() {
      const b = this.b;
      while (this.pos < this.len) {
        const c = b[this.pos];
        if (isWs(c)) this.pos++;
        else if (c === 0x25) { while (this.pos < this.len && b[this.pos] !== 10 && b[this.pos] !== 13) this.pos++; }
        else break;
      }
    }

    readToken() {
      const b = this.b, s = this.pos;
      while (this.pos < this.len && !isWs(b[this.pos]) && !isDelim(b[this.pos])) this.pos++;
      if (this.pos >= this.len && !this.final) throw new Eof();
      return toStr(b, s, this.pos);
    }

    parseValue() {
      this.skipWs();
      if (this.pos >= this.len) throw new Eof();
      const b = this.b, c = b[this.pos];
      if (c === 0x2F) return this.parseName();
      if (c === 0x28) return this.parseLitString();
      if (c === 0x3C) {
        if (this.pos + 1 >= this.len) throw new Eof();
        return b[this.pos + 1] === 0x3C ? this.parseDict() : this.parseHexString();
      }
      if (c === 0x5B) return this.parseArray();
      if (c === 0x29 || c === 0x3E || c === 0x5D || c === 0x7B || c === 0x7D) throw new Error('unexpected delimiter');
      const tok = this.readToken();
      if (tok === 'true') return true;
      if (tok === 'false') return false;
      if (tok === 'null') return null;
      if (/^[+-]?(\d+\.?\d*|\.\d+)$/.test(tok)) {
        const n = Number(tok);
        if (/^\d+$/.test(tok)) return this.tryRef(n);
        return n;
      }
      return new Kw(tok);
    }

    tryRef(n) {
      const b = this.b, save = this.pos;
      this.skipWs();
      if (this.pos >= this.len && !this.final) throw new Eof();
      let p = this.pos;
      while (p < this.len && isDigit(b[p])) p++;
      if (p > this.pos && (p < this.len || this.final)) {
        if (p >= this.len && !this.final) throw new Eof();
        const gen = Number(toStr(b, this.pos, p));
        this.pos = p;
        this.skipWs();
        if (this.pos >= this.len && !this.final) throw new Eof();
        if (this.pos < this.len && b[this.pos] === 0x52 &&
            (this.pos + 1 >= this.len ? this.final : (isWs(b[this.pos + 1]) || isDelim(b[this.pos + 1])))) {
          this.pos++;
          return new Ref(n, gen);
        }
      }
      this.pos = save;
      return n;
    }

    parseName() {
      this.pos++;
      const b = this.b, s = this.pos;
      while (this.pos < this.len && !isWs(b[this.pos]) && !isDelim(b[this.pos])) this.pos++;
      if (this.pos >= this.len && !this.final) throw new Eof();
      return new Name(toStr(b, s, this.pos));
    }

    parseLitString() {
      const b = this.b, s = this.pos;
      let depth = 1;
      this.pos++;
      while (this.pos < this.len) {
        const c = b[this.pos];
        if (c === 0x5C) this.pos += 2;
        else if (c === 0x28) { depth++; this.pos++; }
        else if (c === 0x29) { depth--; this.pos++; if (depth === 0) return new Str(toStr(b, s, this.pos)); }
        else this.pos++;
      }
      throw new Eof();
    }

    parseHexString() {
      const b = this.b, s = this.pos;
      while (this.pos < this.len && b[this.pos] !== 0x3E) this.pos++;
      if (this.pos >= this.len) throw new Eof();
      this.pos++;
      return new Str(toStr(b, s, this.pos));
    }

    parseArray() {
      this.pos++;
      const arr = [];
      for (;;) {
        this.skipWs();
        if (this.pos >= this.len) throw new Eof();
        if (this.b[this.pos] === 0x5D) { this.pos++; return arr; }
        const v = this.parseValue();
        if (v instanceof Kw) throw new Error('keyword in array: ' + v.v);
        arr.push(v);
      }
    }

    parseDict() {
      this.pos += 2;
      const d = new Map();
      for (;;) {
        this.skipWs();
        if (this.pos + 1 >= this.len) throw new Eof();
        if (this.b[this.pos] === 0x3E && this.b[this.pos + 1] === 0x3E) { this.pos += 2; return d; }
        if (this.b[this.pos] !== 0x2F) throw new Error('dict key is not a name');
        const k = this.parseName().v;
        const v = this.parseValue();
        if (v instanceof Kw) throw new Error('keyword in dict: ' + v.v);
        d.set(k, v);
      }
    }

    readInt() {
      this.skipWs();
      const t = this.readToken();
      if (!/^\d+$/.test(t)) throw new Error('integer expected');
      return Number(t);
    }

    expectKw(kw) {
      this.skipWs();
      const t = this.readToken();
      if (t !== kw) throw new Error(`"${kw}" expected, got "${t}"`);
    }
  }

  // ---------- 解碼（xref stream / ObjStm 用） ----------
  async function inflate(u8) {
    if (typeof DecompressionStream === 'undefined') throw new Error('no DecompressionStream');
    const stream = new Blob([u8]).stream().pipeThrough(new DecompressionStream('deflate'));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }

  function unpredict(data, parms) {
    const predictor = parms.get('Predictor') || 1;
    if (predictor === 1) return data;
    if (predictor < 10) throw new Error('unsupported predictor ' + predictor);
    const colors = parms.get('Colors') || 1;
    const bpc = parms.get('BitsPerComponent') || 8;
    const cols = parms.get('Columns') || 1;
    const bpp = Math.max(1, Math.ceil(colors * bpc / 8));
    const rowLen = Math.ceil(colors * bpc * cols / 8);
    const rows = Math.floor(data.length / (rowLen + 1));
    const out = new Uint8Array(rows * rowLen);
    for (let r = 0; r < rows; r++) {
      const ft = data[r * (rowLen + 1)];
      const src = r * (rowLen + 1) + 1, dst = r * rowLen, prev = dst - rowLen;
      for (let i = 0; i < rowLen; i++) {
        const x = data[src + i];
        const a = i >= bpp ? out[dst + i - bpp] : 0;
        const b = r > 0 ? out[prev + i] : 0;
        const c = (r > 0 && i >= bpp) ? out[prev + i - bpp] : 0;
        let v;
        switch (ft) {
          case 0: v = x; break;
          case 1: v = x + a; break;
          case 2: v = x + b; break;
          case 3: v = x + ((a + b) >> 1); break;
          case 4: {
            const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
            v = x + (pa <= pb && pa <= pc ? a : (pb <= pc ? b : c));
            break;
          }
          default: throw new Error('bad PNG filter');
        }
        out[dst + i] = v & 255;
      }
    }
    return out;
  }

  const BLOCK = 256 * 1024;
  const BLOCK_CACHE_MAX = 256;       // 最多約 64 MB
  const own = (u) => (u.byteLength === u.buffer.byteLength ? u : u.slice());   // 避免串流資料綁住整個快取區塊

  // ---------- 主體 ----------
  class Extractor {
    constructor(file, opts) {
      this.file = file;
      this.size = file.size;
      this.opts = opts || {};
      this.bytesRead = 0;
      this.base = 0;                  // %PDF- 之前若有垃圾位元組，xref 偏移要加上它
      this.xref = new Map();          // num → {type:0} | {type:1, off} | {type:2, stm, idx}
      this.trailer = null;
      this.objCache = new Map();      // num → Promise<value>
      this.stmCache = new Map();      // ObjStm num → Promise<{data, nums, offs, first}>
      this.lastProgress = 0;
      this.reads = 0;                 // 實際 I/O 次數（診斷用）
      this.phase = '';
      this.blocks = new Map();        // 區塊編號 → Promise<Uint8Array>（LRU）
    }

    check() { if (this.opts.isCancelled && this.opts.isCancelled()) throw cancelError(); }

    report(extra) {
      const now = Date.now();
      if (!this.opts.onProgress || now - this.lastProgress < 150) return;
      this.lastProgress = now;
      this.opts.onProgress(Object.assign({ bytesRead: this.bytesRead, reads: this.reads, phase: this.phase, objects: 0 }, extra));
    }

    // 真正向檔案要資料（一次 I/O）
    async rawRead(off, end) {
      this.check();
      const ab = await this.file.slice(off, end).arrayBuffer();
      this.bytesRead += ab.byteLength;
      this.reads++;
      this.report();
      return new Uint8Array(ab);
    }

    // 小範圍讀取走「區塊快取」：以 BLOCK 為單位對齊讀取並快取，
    // 同一頁的物件通常在檔案裡相鄰，一次讀一塊就能服務好幾個物件，大幅減少慢速儲存上的隨機讀取次數
    async read(off, len) {
      const end = Math.min(this.size, off + len);
      if (off < 0 || off >= end) return new Uint8Array(0);
      if (end - off >= BLOCK) return this.rawRead(off, end);        // 大範圍（影像串流等）直接讀
      const b0 = Math.floor(off / BLOCK), b1 = Math.floor((end - 1) / BLOCK);
      const parts = await Promise.all(Array.from({ length: b1 - b0 + 1 }, (_, i) => this.getBlock(b0 + i)));
      if (b0 === b1) return parts[0].subarray(off - b0 * BLOCK, end - b0 * BLOCK);
      const out = new Uint8Array(end - off);
      let o = 0;
      parts.forEach((p, i) => {
        const bs = (b0 + i) * BLOCK;
        const a = Math.max(off, bs) - bs, b = Math.min(end, bs + p.length) - bs;
        out.set(p.subarray(a, b), o); o += b - a;
      });
      return out;
    }

    getBlock(i) {
      let p = this.blocks.get(i);
      if (p) { this.blocks.delete(i); this.blocks.set(i, p); return p; }   // 刷新「最近使用」
      p = this.rawRead(i * BLOCK, Math.min(this.size, (i + 1) * BLOCK));
      this.blocks.set(i, p);
      p.catch(() => this.blocks.delete(i));
      while (this.blocks.size > BLOCK_CACHE_MAX) this.blocks.delete(this.blocks.keys().next().value);
      return p;
    }

    // 在 absolute 位置解析；資料不夠就把緩衝加大重試
    async parseAt(abs, fn, first = 4096) {
      let want = first;
      for (;;) {
        const buf = await this.read(abs, want);
        const final = abs + buf.length >= this.size;
        try {
          return await fn(new Parser(buf, 0, final), buf, final);
        } catch (e) {
          if (e instanceof Eof && !final) { want *= 4; continue; }
          throw e;
        }
      }
    }

    // ----- xref -----
    async loadXref() {
      const head = await this.read(0, 1024);
      const hi = toStr(head).indexOf('%PDF-');
      this.base = hi > 0 ? hi : 0;

      const tailLen = Math.min(this.size, 4096);
      const tail = toStr(await this.read(this.size - tailLen, tailLen));
      const si = tail.lastIndexOf('startxref');
      if (si < 0) throw new Error('startxref not found');
      const m = /startxref\s+(\d+)/.exec(tail.slice(si));
      if (!m) throw new Error('bad startxref');

      const queue = [Number(m[1])];
      const visited = new Set();
      while (queue.length) {
        const off = queue.shift();
        if (visited.has(off)) continue;
        visited.add(off);
        const abs = off + this.base;
        const peek = toStr(await this.read(abs, 32));
        const t = /^\s*xref/.exec(peek);
        let dict;
        if (t) {
          dict = await this.readXrefTable(abs + t[0].length);
          if (!this.trailer) this.trailer = dict;
          const hybrid = dict.get('XRefStm');
          if (typeof hybrid === 'number') await this.readXrefStream(hybrid);
        } else {
          dict = await this.readXrefStream(off);
          if (!this.trailer) this.trailer = dict;
        }
        const prev = dict.get('Prev');
        if (typeof prev === 'number') queue.push(prev);
      }
      if (!this.trailer) throw new Error('no trailer');
      if (this.trailer.has('Encrypt')) throw new Error('encrypted');
      if (!(this.trailer.get('Root') instanceof Ref)) throw new Error('no Root');
    }

    async readXrefTable(start) {
      let cur = start;
      for (;;) {
        const hdr = toStr(await this.read(cur, 64));
        if (/^\s*trailer/.test(hdr)) break;
        const m = /^\s*(\d+)\s+(\d+)\s*/.exec(hdr);
        if (!m) throw new Error('bad xref subsection');
        const first = Number(m[1]), count = Number(m[2]);
        const ds = cur + m[0].length;
        const data = await this.read(ds, count * 20);
        if (data.length < count * 20) throw new Error('truncated xref');
        for (let i = 0; i < count; i++) {
          const o = i * 20;
          if (data[o + 10] !== 0x20 || (data[o + 17] !== 0x6E && data[o + 17] !== 0x66)) throw new Error('bad xref entry');
          const num = first + i;
          if (this.xref.has(num)) continue;
          if (data[o + 17] === 0x6E) this.xref.set(num, { type: 1, off: Number(toStr(data, o, o + 10)) });
          else this.xref.set(num, { type: 0 });
        }
        cur = ds + count * 20;
      }
      const dict = await this.parseAt(cur, (p) => { p.expectKw('trailer'); return p.parseValue(); });
      if (!(dict instanceof Map)) throw new Error('bad trailer');
      return dict;
    }

    async readXrefStream(off) {
      const { obj } = await this.loadAt(off, null);
      if (!(obj instanceof Stream)) throw new Error('xref stream expected');
      const d = obj.dict;
      const data = await this.decodeStream(obj);
      const W = d.get('W');
      if (!Array.isArray(W) || W.length < 3) throw new Error('bad W');
      const size = d.get('Size');
      const index = Array.isArray(d.get('Index')) ? d.get('Index') : [0, size];
      const rowLen = W[0] + W[1] + W[2];
      let p = 0;
      const num = (n) => { let v = 0; for (let i = 0; i < n; i++) v = v * 256 + data[p++]; return v; };
      for (let s = 0; s + 1 < index.length; s += 2) {
        for (let i = 0; i < index[s + 1]; i++) {
          if (p + rowLen > data.length) break;
          const type = W[0] ? num(W[0]) : 1;
          const f2 = num(W[1]);
          const f3 = num(W[2]);
          const n = index[s] + i;
          if (this.xref.has(n)) continue;
          if (type === 1) this.xref.set(n, { type: 1, off: f2 });
          else if (type === 2) this.xref.set(n, { type: 2, stm: f2, idx: f3 });
          else this.xref.set(n, { type: 0 });
        }
      }
      return d;
    }

    async decodeStream(stream) {
      const d = stream.dict;
      let filters = await this.resolve(d.get('Filter'));
      let parms = await this.resolve(d.get('DecodeParms') || d.get('DP'));
      if (filters == null) return stream.data;
      if (!Array.isArray(filters)) filters = [filters];
      if (!Array.isArray(parms)) parms = [parms];
      let data = stream.data;
      for (let i = 0; i < filters.length; i++) {
        const f = (await this.resolve(filters[i]));
        const name = f instanceof Name ? f.v : '';
        if (name !== 'FlateDecode' && name !== 'Fl') throw new Error('unsupported filter ' + name);
        data = await inflate(data);
        const pr = await this.resolve(parms[i]);
        if (pr instanceof Map) {
          const flat = new Map();
          for (const [k, v] of pr) flat.set(k, await this.resolve(v));
          data = unpredict(data, flat);
        }
      }
      return data;
    }

    async resolve(v) {
      return v instanceof Ref ? this.getObject(v.n) : v;
    }

    // ----- 物件 -----
    getObject(num) {
      let p = this.objCache.get(num);
      if (!p) { p = this._load(num); this.objCache.set(num, p); }
      return p;
    }

    async _load(num) {
      const e = this.xref.get(num);
      if (!e || e.type === 0) return null;
      if (e.type === 1) return (await this.loadAt(e.off, num)).obj;
      const st = await this.getObjStm(e.stm);
      let i = st.nums[e.idx] === num ? e.idx : st.nums.indexOf(num);
      if (i < 0) return null;
      const p = new Parser(st.data, st.first + st.offs[i], true);
      return p.parseValue();
    }

    getObjStm(num) {
      let p = this.stmCache.get(num);
      if (!p) {
        p = (async () => {
          const s = await this.getObject(num);
          if (!(s instanceof Stream)) throw new Error('ObjStm expected');
          const data = await this.decodeStream(s);
          const n = await this.resolve(s.dict.get('N'));
          const first = await this.resolve(s.dict.get('First'));
          const hp = new Parser(data, 0, true);
          const nums = [], offs = [];
          for (let i = 0; i < n; i++) { nums.push(hp.readInt()); offs.push(hp.readInt()); }
          return { data, nums, offs, first };
        })();
        this.stmCache.set(num, p);
      }
      return p;
    }

    // 讀「N G obj … endobj」；回傳 { obj: 值或 Stream }
    async loadAt(off, expectNum) {
      const abs = off + this.base;
      return this.parseAt(abs, async (p, buf, final) => {
        const n = p.readInt();
        p.readInt();
        p.expectKw('obj');
        if (expectNum != null && n !== expectNum) throw new Error(`object ${expectNum} not at offset ${off}`);
        const value = p.parseValue();
        if (value instanceof Kw) {
          if (value.v === 'endobj') return { obj: null };
          throw new Error('bad object body');
        }
        p.skipWs();
        if (p.pos >= p.len && !final) throw new Eof();

        const isStream = value instanceof Map && p.pos + 6 <= p.len &&
          buf[p.pos] === 0x73 && toStr(buf, p.pos, p.pos + 6) === 'stream';
        if (!isStream) {
          if (value instanceof Map && p.pos + 6 > p.len && !final) throw new Eof();
          return { obj: value };
        }

        let ds = p.pos + 6;
        if (ds + 2 > buf.length && !final) throw new Eof();
        if (buf[ds] === 13 && buf[ds + 1] === 10) ds += 2;
        else if (buf[ds] === 10 || buf[ds] === 13) ds += 1;

        let len = value.get('Length');
        if (len instanceof Ref) len = await this.getObject(len.n);
        let data = null;
        if (typeof len === 'number' && len >= 0 && abs + ds + len <= this.size) {
          let tailOk = false;
          if (ds + len + 24 <= buf.length) {
            tailOk = /^\s*endstream/.test(toStr(buf, ds + len, ds + len + 24));
            if (tailOk) data = buf.slice(ds, ds + len);
          } else {
            if (ds + len <= buf.length) {
              data = buf.slice(ds, ds + len);
              tailOk = /^\s*endstream/.test(toStr(await this.read(abs + ds + len, 24)));
            } else {
              const all = await this.read(abs + ds, len + 24);          // 資料與結尾檢查一次讀完
              tailOk = all.length >= len && /^\s*endstream/.test(toStr(all, len, all.length));
              if (tailOk) data = own(all.subarray(0, len));
            }
            if (!tailOk) data = null;
          }
        }
        if (!data) data = await this.scanStream(abs + ds);     // /Length 錯誤：掃描 endstream
        return { obj: new Stream(value, data) };
      });
    }

    async scanStream(startAbs) {
      const chunk = 1 << 20, needle = latin1('endstream');
      const parts = [];
      let pos = startAbs;
      let carry = new Uint8Array(0);
      while (pos < this.size) {
        const buf = await this.read(pos, chunk);
        if (!buf.length) break;
        const merged = new Uint8Array(carry.length + buf.length);
        merged.set(carry); merged.set(buf, carry.length);
        const idx = indexOfBytes(merged, needle);
        if (idx >= 0) {
          parts.push(merged.subarray(0, idx));
          let total = 0; parts.forEach(a => total += a.length);
          const out = new Uint8Array(total);
          let o = 0; parts.forEach(a => { out.set(a, o); o += a.length; });
          let end = out.length;
          if (end > 0 && out[end - 1] === 10) end--;
          if (end > 0 && out[end - 1] === 13) end--;
          return out.slice(0, end);
        }
        const keep = needle.length - 1;
        parts.push(merged.subarray(0, merged.length - keep));
        carry = merged.slice(merged.length - keep);
        pos += buf.length;
      }
      throw new Error('endstream not found');
    }

    // ----- 頁面樹 -----
    async findPages(targets) {
      const root = await this.getObject(this.trailer.get('Root').n);
      if (!(root instanceof Map) || !(root.get('Pages') instanceof Ref)) throw new Error('no page tree');
      const want = new Set(targets);
      const found = new Map();       // 頁索引 → { ref, inherit }
      const INHERIT = ['Resources', 'MediaBox', 'CropBox', 'Rotate'];

      const walk = async (ref, start, inherit) => {
        const node = await this.getObject(ref.n);
        if (!(node instanceof Map)) throw new Error('bad page tree node');
        const kidsRaw = await this.resolve(node.get('Kids'));
        if (!Array.isArray(kidsRaw)) return 1;                 // 葉節點（單頁）
        const inh = new Map(inherit);
        for (const k of INHERIT) if (node.has(k)) inh.set(k, node.get(k));

        const count = await this.resolve(node.get('Count'));
        if (count === kidsRaw.length) {                        // 扁平：每個 kid 都是頁面，不必逐一讀取
          kidsRaw.forEach((k, i) => { if (want.has(start + i) && k instanceof Ref) found.set(start + i, { ref: k, inherit: inh }); });
          return kidsRaw.length;
        }
        const kids = await mapLimit(kidsRaw, 16, async (k) => ({ k, node: k instanceof Ref ? await this.getObject(k.n) : null }));
        let cur = start;
        for (const { k, node: kn } of kids) {
          const isNode = kn instanceof Map && kn.has('Kids');
          const c = isNode ? await this.resolve(kn.get('Count')) : 1;
          let hit = false;
          for (let i = cur; i < cur + c && !hit; i++) if (want.has(i)) hit = true;
          if (hit) {
            if (isNode) await walk(k, cur, inh);
            else found.set(cur, { ref: k, inherit: inh });
          }
          cur += c;
        }
        return cur - start;
      };
      await walk(root.get('Pages'), 0, new Map());
      for (const t of targets) if (!found.has(t)) throw new Error('page not found: ' + t);
      return found;
    }

    // ----- 收集頁面用到的所有物件 -----
    async collect(pageRoots) {
      // pageRoots: Map(pageObjNum → 已展平的頁面字典)
      const out = new Map();            // 舊編號 → 值
      const excluded = new Set();       // 其他頁面 / 頁面樹節點：寫出時以 null 取代
      const seen = new Set();
      const pending = [];
      const enqueue = (n) => { if (!seen.has(n)) { seen.add(n); pending.push(n); } };
      const SKIP_KEYS = new Set(['Parent', 'P']);

      const refsOf = (v, cb) => {
        if (v instanceof Ref) cb(v.n);
        else if (Array.isArray(v)) v.forEach(x => refsOf(x, cb));
        else if (v instanceof Map) { for (const [k, x] of v) if (!SKIP_KEYS.has(k)) refsOf(x, cb); }
        else if (v instanceof Stream) refsOf(v.dict, cb);
      };

      for (const [num, dict] of pageRoots) {
        seen.add(num);
        out.set(num, dict);
      }
      for (const dict of pageRoots.values()) refsOf(dict, enqueue);

      const proc = async (n) => {
        const obj = await this.getObject(n);
        if (obj === null || obj === undefined) return;
        if (obj instanceof Map) {
          const t = obj.get('Type');
          if (t instanceof Name && (t.v === 'Page' || t.v === 'Pages' || t.v === 'Catalog')) { excluded.add(n); return; }
        }
        out.set(n, obj);
        refsOf(obj, enqueue);
        this.report({ objects: out.size });
      };

      const CONC = 16;
      await new Promise((resolve, reject) => {
        let running = 0, failed = false;
        const pump = () => {
          if (failed) return;
          while (running < CONC && pending.length) {
            const n = pending.pop();
            running++;
            proc(n).then(() => { running--; pump(); }, (e) => { failed = true; reject(e); });
          }
          if (running === 0 && pending.length === 0) resolve();
        };
        pump();
      });
      return { out, excluded };
    }
  }

  function indexOfBytes(hay, needle) {
    const n = needle.length, first = needle[0];
    outer: for (let i = 0; i <= hay.length - n; i++) {
      if (hay[i] !== first) continue;
      for (let j = 1; j < n; j++) if (hay[i + j] !== needle[j]) continue outer;
      return i;
    }
    return -1;
  }

  async function mapLimit(items, limit, fn) {
    const res = new Array(items.length);
    let next = 0;
    const worker = async () => { while (next < items.length) { const i = next++; res[i] = await fn(items[i], i); } };
    await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
    return res;
  }

  // ---------- 寫出 ----------
  function fmtNum(v) {
    if (Number.isInteger(v)) return String(v);
    const s = String(+v.toFixed(6));
    return /e/i.test(s) ? '0' : s;
  }

  function serialize(v, map, parts) {
    // parts：字串（latin1）陣列；Stream 的資料不會走這裡
    if (v === null || v === undefined) parts.push('null');
    else if (v === true) parts.push('true');
    else if (v === false) parts.push('false');
    else if (typeof v === 'number') parts.push(fmtNum(v));
    else if (v instanceof Name) parts.push('/' + v.v);
    else if (v instanceof Str) parts.push(v.raw);
    else if (v instanceof Raw) parts.push(v.s);
    else if (v instanceof Ref) parts.push(map.has(v.n) ? `${map.get(v.n)} 0 R` : 'null');
    else if (Array.isArray(v)) {
      parts.push('[');
      v.forEach((x, i) => { if (i) parts.push(' '); serialize(x, map, parts); });
      parts.push(']');
    } else if (v instanceof Map) {
      parts.push('<<');
      for (const [k, x] of v) { parts.push('/' + k + ' '); serialize(x, map, parts); parts.push(' '); }
      parts.push('>>');
    } else throw new Error('cannot serialize value');
  }

  function build(pageList, collected) {
    // pageList: [{ oldNum, dict }]，輸出順序
    const { out, excluded } = collected;
    const map = new Map();                              // 舊編號 → 新編號
    let next = 3;
    pageList.forEach(p => map.set(p.oldNum, next++));
    const others = [];
    for (const [n] of out) if (!map.has(n)) { map.set(n, next++); others.push(n); }
    for (const n of excluded) map.delete(n);

    const chunks = [];                                  // string | Uint8Array
    let pos = 0;
    const offsets = [];
    const push = (x) => { chunks.push(x); pos += x.length; };

    push('%PDF-1.7\n%\u00E2\u00E3\u00CF\u00D3\n');

    const writeObj = (newNum, value) => {
      offsets[newNum] = pos;
      push(`${newNum} 0 obj\n`);
      if (value instanceof Stream) {
        const d = new Map(value.dict);
        d.set('Length', value.data.length);
        const parts = [];
        serialize(d, map, parts);
        push(parts.join(''));
        push('\nstream\n');
        push(value.data);
        push('\nendstream');
      } else {
        const parts = [];
        serialize(value, map, parts);
        push(parts.join(''));
      }
      push('\nendobj\n');
    };

    writeObj(1, new Map([['Type', new Name('Catalog')], ['Pages', new Raw('2 0 R')]]));
    writeObj(2, new Map([
      ['Type', new Name('Pages')],
      ['Kids', pageList.map(p => new Raw(`${map.get(p.oldNum)} 0 R`))],
      ['Count', pageList.length],
    ]));
    for (const p of pageList) {
      const d = new Map(p.dict);
      d.set('Parent', new Raw('2 0 R'));
      writeObj(map.get(p.oldNum), d);
    }
    for (const n of others) writeObj(map.get(n), out.get(n));

    const total = next;                                  // 物件數 + 1（含第 0 號）
    const xrefPos = pos;
    let x = `xref\n0 ${total}\n0000000000 65535 f \n`;
    for (let i = 1; i < total; i++) x += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
    x += `trailer\n<< /Size ${total} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF\n`;
    push(x);

    const bytes = new Uint8Array(pos);
    let o = 0;
    for (const c of chunks) {
      if (typeof c === 'string') { for (let i = 0; i < c.length; i++) bytes[o++] = c.charCodeAt(i) & 255; }
      else { bytes.set(c, o); o += c.length; }
    }
    return bytes;
  }

  // ---------- 對外 API ----------
  const xrefCache = new WeakMap();

  async function extractPages(file, indices, opts) {
    const targets = [...new Set(indices)].filter(Number.isInteger).sort((a, b) => a - b);
    if (!targets.length) throw new Error('no pages');
    const ex = new Extractor(file, opts);
    const T = { t0: performance.now() };
    ex.phase = 'xref';
    // 同一個檔案重複擷取（例如預覽一頁接一頁）時，沿用已解析的 xref，不必重讀檔尾
    const known = xrefCache.get(file);
    if (known) { ex.base = known.base; ex.xref = known.xref; ex.trailer = known.trailer; }
    else {
      await ex.loadXref();
      xrefCache.set(file, { base: ex.base, xref: ex.xref, trailer: ex.trailer });
    }
    T.xref = performance.now();
    ex.phase = 'pages';
    const found = await ex.findPages(targets);
    T.pages = performance.now();

    const roots = new Map();
    const pageList = [];
    for (const t of targets) {
      const { ref, inherit } = found.get(t);
      const node = await ex.getObject(ref.n);
      if (!(node instanceof Map)) throw new Error('bad page object');
      const dict = new Map(node);
      for (const [k, v] of inherit) if (!dict.has(k)) dict.set(k, v);
      dict.delete('Parent');
      roots.set(ref.n, dict);
      pageList.push({ oldNum: ref.n, dict });
    }
    // 同一個物件被兩個索引指到（異常檔）時避免重複
    if (roots.size !== targets.length) throw new Error('duplicate page objects');

    ex.phase = 'objects';
    const collected = await ex.collect(roots);
    T.collect = performance.now();
    const bytes = build(pageList, collected);
    if (typeof console !== 'undefined') {
      console.info(`[FastExtract] ${targets.length} 頁 · xref ${Math.round(T.xref - T.t0)} ms · 頁面樹 ${Math.round(T.pages - T.xref)} ms · 收集物件 ${Math.round(T.collect - T.pages)} ms · ` +
        `${collected.out.size} 個物件 · ${ex.reads} 次讀取 · ${(ex.bytesRead / 1048576).toFixed(1)} MB · xref 條目 ${ex.xref.size}`);
    }
    const indexMap = new Map(targets.map((t, i) => [t, i]));
    return { bytes, indexMap, stats: { bytesRead: ex.bytesRead, reads: ex.reads, objects: collected.out.size } };
  }

  global.FastPdfExtract = { extractPages };
})(typeof window !== 'undefined' ? window : globalThis);
