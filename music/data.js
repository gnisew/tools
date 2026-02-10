/* === 常用樂器代碼對照表 (instrument) ===
鋼琴: acoustic_grand_piano
吉他: acoustic_guitar_nylon
豎琴: orchestral_harp
小提琴: violin
大提琴: cello
長笛: flute
單簧管: clarinet
雙簧管: oboe
薩克斯風: alto_sax
小號: trumpet
木琴: xylophone
鐵琴: glockenspiel
手風琴: accordion
口琴: harmonica
*/
// data.js - 預設曲庫
// 使用反引號 ` ` 來包覆 content，即可支援換行
const exampleSongs = [
    {
        title: "小星星 (Twinkle Star)",
        // 這裡使用了換行，方便閱讀
        content: `
1 1 5 5 | 6 6 5 - | 4 4 3 3 | 2 2 1 - 
5 5 4 4 | 3 3 2 - | 5 5 4 4 | 3 3 2 - 
1 1 5 5 | 6 6 5 - | 4 4 3 3 | 2 2 1 - ||
        `,
        tempo: 100,
        instrument: "acoustic_grand_piano", 
        baseKey: 0 
    },
    {
        title: "兩隻老虎 (缺省測試)",
        // 這裡故意不設 tempo, instrument, baseKey，測試程式是否會補上預設值
        content: `
1 2 3 1 | 1 2 3 1 
3 4 5 - | 3 4 5 - 
5/ 6/ 5/ 4/ 3 1 | 5/ 6/ 5/ 4/ 3 1 
2 5. 1 - | 2 5. 1 - ||
        `
    },
    {
        title: "生日快樂 (Violin)",
        content: `
5. 5./ 6. 5. 1 7. - 
5. 5./ 6. 5. 2 1 - 
5. 5./ 5 3 1 7. 6. 
4 4/ 3 1 2 1 - ||
        `,
        tempo: 90,
        instrument: "violin",
        baseKey: 5 
    }
];