var btnA="拼轉注↓";
var btnB="注轉拼↓";

var btnX="↑清除";
var btnC="複製↓";



var myA = ["iang","ㄧㄤ","iong","ㄧㄛㄥ","iung","ㄧㄨㄥ","uang","ㄨㄤ","ang","ㄤ","iag","ㄧㄚㄍ","ied","ㄧㄝㄉ","ien","ㄧㄝㄣ","ong","ㄛㄥ","ung","ㄨㄥ","iid","ㄉ","iim","ㄇ","iin","ㄣ","iab","ㄧㄚㄅ","iam","ㄧㄚㄇ","iau","ㄧㄠ","iog","ㄧㄛㄍ","ieb","ㄧㄝㄅ","iem","ㄧㄝㄇ","ieu","ㄧㄝㄨ","iug","ㄧㄨㄍ","iun","ㄧㄨㄣ","uad","ㄨㄚㄉ","uai","ㄨㄞ","uan","ㄨㄢ","ued","ㄨㄝㄉ","uen","ㄨㄝㄣ","iui","ㄧㄨㄧ","ioi","ㄧㄛㄧ","iud","ㄧㄨㄉ","ion","ㄧㄛㄣ","iib","ㄅ","ab","ㄚㄅ","ad","ㄚㄉ","ag","ㄚㄍ","ai","ㄞ","am","ㄚㄇ","an","ㄢ","au","ㄠ","ed","ㄝㄉ","en","ㄝㄣ","eu","ㄝㄨ","er","ㄜ","id","ㄧㄉ","in","ㄧㄣ","iu","ㄧㄨ","od","ㄛㄉ","og","ㄛㄍ","oi","ㄛㄧ","ud","ㄨㄉ","ug","ㄨㄍ","un","ㄨㄣ","em","ㄝㄇ","ii","","on","ㄛㄣ","ui","ㄨㄧ","eb","ㄝㄅ","io","ㄧㄛ","ia","ㄧㄚ","ib","ㄧㄅ","ie","ㄧㄝ","im","ㄧㄇ","ua","ㄨㄚ","bb","万","a","ㄚ","e","ㄝ","i","ㄧ","o","ㄛ","u","ㄨ","ng","兀","rh","ㄖ","r","ㄖ","zh","ㄓ","ch","ㄔ","sh","ㄕ","b","ㄅ","p","ㄆ","m","ㄇ","f","ㄈ","d","ㄉ","t","ㄊ","n","ㄋ","l","ㄌ","g","ㄍ","k","ㄎ","h","ㄏ","j","ㄐ","q","ㄑ","x","ㄒ","z","ㄗ","c","ㄘ","s","ㄙ","v","万"];

var myB = ["ㄧㄛㄥ","iong",
"ㄧㄨㄥ","iung",
"ㄧㄚㄍ","iag",
"ㄧㄝㄉ","ied",
"ㄧㄝㄣ","ien",
"ㄧㄚㄅ","iab",
"ㄧㄚㄇ","iam",
"ㄧㄛㄍ","iog",
"ㄧㄝㄅ","ieb",
"ㄧㄝㄇ","iem",
"ㄧㄝㄨ","ieu",
"ㄧㄨㄍ","iug",
"ㄧㄨㄣ","iun",
"ㄨㄚㄉ","uad",
"ㄨㄝㄉ","ued",
"ㄨㄝㄣ","uen",
"ㄧㄨㄧ","iui",
"ㄧㄛㄧ","ioi",
"ㄧㄨㄉ","iud",
"ㄧㄛㄣ","ion",
"ㄧㄤ","iang",
"ㄨㄤ","uang",
"ㄛㄥ","ong",
"ㄨㄥ","ung",
"ㄧㄠ","iau",
"ㄨㄞ","uai",
"ㄨㄢ","uan",
"ㄚㄅ","ab",
"ㄚㄉ","ad",
"ㄚㄍ","ag",
"ㄚㄇ","am",
"ㄝㄉ","ed",
"ㄝㄣ","en",
"ㄝㄨ","eu",
"ㄧㄉ","id",
"ㄧㄣ","in",
"ㄧㄨ","iu",
"ㄛㄉ","od",
"ㄛㄍ","og",
"ㄛㄧ","oi",
"ㄨㄉ","ud",
"ㄨㄍ","ug",
"ㄨㄣ","un",
"ㄝㄇ","em",
"ㄛㄣ","on",
"ㄝㄅ","eb",
"ㄧㄛ","io",
"ㄧㄚ","ia",
"ㄧㄅ","ib",
"ㄧㄝ","ie",
"ㄧㄇ","im",
"ㄨㄚ","ua",
"ㄨㄧ","ui",
"ㄘㄉ","ciid",
"ㄘㄇ","ciim",
"ㄘㄣ","ciin",
"ㄙㄅ","siib",
"ㄙㄉ","siid",
"ㄙㄇ","siim",
"ㄙㄣ","siin",
"ㄗㄅ","ziib",
"ㄗㄉ","ziid",
"ㄗㄇ","ziim",
"ㄗㄣ","ziin",
"ㄤ","ang",
"ㄞ","ai",
"ㄢ","an",
"ㄠ","au",
"ㄜ","er",
"ㄚ","a",
"ㄝ","e",
"ㄧ","i",
"ㄛ","o",
"ㄨ","u",
"兀","ng",
"ㄖ","rh",
"ㄓ","zh",
"ㄔ","ch",
"ㄕ","sh",
"ㄅ","b",
"ㄆ","p",
"ㄇ","m",
"ㄈ","f",
"ㄉ","d",
"ㄊ","t",
"ㄋ","n",
"ㄌ","l",
"ㄍ","g",
"ㄎ","k",
"ㄏ","h",
"ㄐ","j",
"ㄑ","q",
"ㄒ","x",
"万","v",
"ㄘ","cii",
"ㄙ","sii",
"ㄗ","zii"];