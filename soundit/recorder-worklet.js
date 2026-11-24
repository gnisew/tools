/* [修改] 支援單聲道（預設，行為與原本完全相同）與立體聲：
 *  - 單聲道：每滿一段就送出 Float32Array
 *  - 立體聲：每滿一段就送出 [左, 右]（兩個 Float32Array），兩聲道永遠等長
 * 聲道數由 processorOptions.channels 指定（1 或 2）。 */
class PKRec extends AudioWorkletProcessor {
	constructor ( opts ) {
		super ();
		opts = opts || {};
		var po = opts.processorOptions || {};
		this.size = po.size || 4096;
		this.n = po.channels === 2 ? 2 : 1;
		this.b = [];
		for (var c = 0; c < this.n; ++c) this.b.push ( new Float32Array ( this.size ) );
		this.i = 0;
		this.done = false;
		this.port.onmessage = this.flush.bind ( this );
	}

	/* 送出目前的緩衝：full = 整段滿了（直接轉移所有權、換新緩衝）；否則只送出前 len 筆的複本 */
	emit ( len, full ) {
		var out = [], tr = [];
		for (var c = 0; c < this.n; ++c) {
			var b = full ? this.b[c] : this.b[c].subarray (0, len).slice (0);
			out.push ( b );
			tr.push ( b.buffer );
			if (full) this.b[c] = new Float32Array ( this.size );
		}
		this.port.postMessage ( this.n === 1 ? out[0] : out, tr );
	}

	flush () {
		this.done = true;
		if (this.i) {
			this.emit ( this.i, false );
			this.i = 0;
		}
		this.port.postMessage (0);
	}

	process ( ins ) {
		if (this.done) return false;
		var inp = ins[0];
		var ch0 = inp && inp[0];
		if (!ch0) return true;

		var chs = [ ch0 ];
		if (this.n === 2) chs.push ( inp[1] || ch0 );   /* 來源只有單聲道時，右聲道複製左聲道 */

		var size = this.size;
		var i = this.i;
		for (var off = 0; off < ch0.length;) {
			var k = Math.min ( size - i, ch0.length - off );
			for (var c = 0; c < this.n; ++c)
				this.b[c].set ( chs[c].subarray ( off, off + k ), i );
			i += k;
			off += k;
			if (i === size) {
				this.emit ( size, true );
				i = 0;
			}
		}
		this.i = i;
		return true;
	}
}

registerProcessor ('pk-recorder', PKRec);
