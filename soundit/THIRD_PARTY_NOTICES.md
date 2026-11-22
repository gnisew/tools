# Third-Party Notices

This product is based on [AudioMass](https://github.com/pkalogiros/audiomass) (MIT, see `LICENSE`).
The bundled libraries below keep their own licenses.

| Component | Files | License |
| --- | --- | --- |
| WaveSurfer.js 2.0.5 + regions plugin | `dist/wavesurfer.js`, `dist/plugin/wavesurfer.regions.js` | BSD-3-Clause |
| lamejs (LAME MP3 encoder) | `lame.js` | LGPL-2.1-or-later |
| libFLAC 1.3.3 (via libflac.js) | `libflac.js`, `libflac.wasm` | BSD-3-Clause (Xiph.Org) |
| RNNoise | `rnn_denoise.js`, `rnn_denoise.wasm` | BSD-3-Clause |
| lz4-wasm | `lzma.js`, `lz4-block-codec-wasm.js`, `lz4-block-codec.wasm` | BSD-2-Clause |

## LGPL (lamejs)

`lame.js` is an unmodified, separately loaded file; it can be replaced with another version of the library.
Its copyright and license notices are kept inside the file
(Takehiro Tominaga, Gabriel Bouvigne, Mark Taylor, Robert Hegemann, Naoki Shibata, David Robinson, Glen Sawyer).
The full license text: https://www.gnu.org/licenses/old-licenses/lgpl-2.1.txt

## BSD notices

Copyright and license notices for the BSD components, as published by their authors:

- **WaveSurfer.js** — Copyright (c) katspaugh and contributors. BSD-3-Clause.
- **libFLAC** — Copyright (C) 2000-2009 Josh Coalson; Copyright (C) 2011-2016 Xiph.Org Foundation. BSD-3-Clause.
- **RNNoise** — Copyright (c) 2017 Mozilla; (c) 2007-2017 Jean-Marc Valin; (c) 2005-2017 Xiph.Org Foundation; (c) 2003-2004 Mark Borgerding. BSD-3-Clause.
- **lz4-wasm** — Copyright (C) 2018 Raymond Hill. BSD-2-Clause (full text kept in `lz4-block-codec-wasm.js`).

BSD-3-Clause terms: redistributions of source code must retain the above copyright notice, this list of
conditions and the following disclaimer; redistributions in binary form must reproduce them in the
documentation and/or other materials provided with the distribution; the names of the copyright holders
may not be used to endorse or promote derived products without specific prior written permission.
The software is provided "as is", without warranty of any kind.
