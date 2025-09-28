

function romaToNumber(t) {
    // 羅馬字轉字母調
t=t.replace(/Ő([aeioumngptkhbd]{0,5})/g, "O$19");
t=t.replace(/Ó([aeioumngptkhbd]{0,5})/g, "O$12");
t=t.replace(/Ò([aeioumngptkhbd]{0,5})/g, "O$13");
t=t.replace(/Ô([aeioumngptkhbd]{0,5})/g, "O$15");
t=t.replace(/Ǒ([aeioumngptkhbd]{0,5})/g, "O$16");
t=t.replace(/Ō([aeioumngptkhbd]{0,5})/g, "O$17");
t=t.replace(/O̍([aeioumngptkhbd]{0,5})/g, "O$18");
t=t.replace(/ő([aeioumngptkhbd]{0,5})/g, "o$19");
t=t.replace(/ó([aeioumngptkhbd]{0,5})/g, "o$12");
t=t.replace(/ò([aeioumngptkhbd]{0,5})/g, "o$13");
t=t.replace(/ô([aeioumngptkhbd]{0,5})/g, "o$15");
t=t.replace(/ǒ([aeioumngptkhbd]{0,5})/g, "o$16");
t=t.replace(/ō([aeioumngptkhbd]{0,5})/g, "o$17");
t=t.replace(/o̍([aeioumngptkhbd]{0,5})/g, "o$18");
t=t.replace(/A̋([aeioumngptkhbd]{0,5})/g, "A$19");
t=t.replace(/Á([aeioumngptkhbd]{0,5})/g, "A$12");
t=t.replace(/À([aeioumngptkhbd]{0,5})/g, "A$13");
t=t.replace(/Â([aeioumngptkhbd]{0,5})/g, "A$15");
t=t.replace(/Ǎ([aeioumngptkhbd]{0,5})/g, "A$16");
t=t.replace(/Ā([aeioumngptkhbd]{0,5})/g, "A$17");
t=t.replace(/A̍([aeioumngptkhbd]{0,5})/g, "A$18");
t=t.replace(/a̋([aeioumngptkhbd]{0,5})/g, "a$19");
t=t.replace(/á([aeioumngptkhbd]{0,5})/g, "a$12");
t=t.replace(/à([aeioumngptkhbd]{0,5})/g, "a$13");
t=t.replace(/â([aeioumngptkhbd]{0,5})/g, "a$15");
t=t.replace(/ǎ([aeioumngptkhbd]{0,5})/g, "a$16");
t=t.replace(/ā([aeioumngptkhbd]{0,5})/g, "a$17");
t=t.replace(/a̍([aeioumngptkhbd]{0,5})/g, "a$18");
t=t.replace(/E̋([aeioumngptkhbdr]{0,5})/g, "E$19");
t=t.replace(/É([aeioumngptkhbdr]{0,5})/g, "E$12");
t=t.replace(/È([aeioumngptkhbdr]{0,5})/g, "E$13");
t=t.replace(/Ê([aeioumngptkhbdr]{0,5})/g, "E$15");
t=t.replace(/Ě([aeioumngptkhbdr]{0,5})/g, "E$16");
t=t.replace(/Ē([aeioumngptkhbdr]{0,5})/g, "E$17");
t=t.replace(/E̍([aeioumngptkhbdr]{0,5})/g, "E$18");
t=t.replace(/e̋([aeioumngptkhbdr]{0,5})/g, "e$19");
t=t.replace(/é([aeioumngptkhbdr]{0,5})/g, "e$12");
t=t.replace(/è([aeioumngptkhbdr]{0,5})/g, "e$13");
t=t.replace(/ê([aeioumngptkhbdr]{0,5})/g, "e$15");
t=t.replace(/ě([aeioumngptkhbdr]{0,5})/g, "e$16");
t=t.replace(/ē([aeioumngptkhbdr]{0,5})/g, "e$17");
t=t.replace(/e̍([aeioumngptkhbdr]{0,5})/g, "e$18");
t=t.replace(/Ű([aeioumngptkhbd]{0,5})/g, "U$19");
t=t.replace(/Ú([aeioumngptkhbd]{0,5})/g, "U$12");
t=t.replace(/Ù([aeioumngptkhbd]{0,5})/g, "U$13");
t=t.replace(/Û([aeioumngptkhbd]{0,5})/g, "U$15");
t=t.replace(/Ǔ([aeioumngptkhbd]{0,5})/g, "U$16");
t=t.replace(/Ū([aeioumngptkhbd]{0,5})/g, "U$17");
t=t.replace(/U̍([aeioumngptkhbd]{0,5})/g, "U$18");
t=t.replace(/ű([aeioumngptkhbd]{0,5})/g, "u$19");
t=t.replace(/ú([aeioumngptkhbd]{0,5})/g, "u$12");
t=t.replace(/ù([aeioumngptkhbd]{0,5})/g, "u$13");
t=t.replace(/û([aeioumngptkhbd]{0,5})/g, "u$15");
t=t.replace(/ǔ([aeioumngptkhbd]{0,5})/g, "u$16");
t=t.replace(/ū([aeioumngptkhbd]{0,5})/g, "u$17");
t=t.replace(/u̍([aeioumngptkhbd]{0,5})/g, "u$18");
t=t.replace(/I̋([aeioumngptkhbdr]{0,5})/g, "I$19");
t=t.replace(/Í([aeioumngptkhbdr]{0,5})/g, "I$12");
t=t.replace(/Ì([aeioumngptkhbdr]{0,5})/g, "I$13");
t=t.replace(/Î([aeioumngptkhbdr]{0,5})/g, "I$15");
t=t.replace(/Ǐ([aeioumngptkhbdr]{0,5})/g, "I$16");
t=t.replace(/Ī([aeioumngptkhbdr]{0,5})/g, "I$17");
t=t.replace(/I̍([aeioumngptkhbdr]{0,5})/g, "I$18");
t=t.replace(/i̋([aeioumngptkhbdr]{0,5})/g, "i$19");
t=t.replace(/í([aeioumngptkhbdr]{0,5})/g, "i$12");
t=t.replace(/ì([aeioumngptkhbdr]{0,5})/g, "i$13");
t=t.replace(/î([aeioumngptkhbdr]{0,5})/g, "i$15");
t=t.replace(/ǐ([aeioumngptkhbdr]{0,5})/g, "i$16");
t=t.replace(/ī([aeioumngptkhbdr]{0,5})/g, "i$17");
t=t.replace(/i̍([aeioumngptkhbdr]{0,5})/g, "i$18");
t=t.replace(/M̋([aeioumngptkhbd]{0,5})/g, "M$19");
t=t.replace(/Ḿ([aeioumngptkhbd]{0,5})/g, "M$12");
t=t.replace(/M̀([aeioumngptkhbd]{0,5})/g, "M$13");
t=t.replace(/M̂([aeioumngptkhbd]{0,5})/g, "M$15");
t=t.replace(/M̌([aeioumngptkhbd]{0,5})/g, "M$16");
t=t.replace(/M̄([aeioumngptkhbd]{0,5})/g, "M$17");
t=t.replace(/M̍([aeioumngptkhbd]{0,5})/g, "M$18");
t=t.replace(/m̋([aeioumngptkhbd]{0,5})/g, "m$19");
t=t.replace(/ḿ([aeioumngptkhbd]{0,5})/g, "m$12");
t=t.replace(/m̀([aeioumngptkhbd]{0,5})/g, "m$13");
t=t.replace(/m̂([aeioumngptkhbd]{0,5})/g, "m$15");
t=t.replace(/m̌([aeioumngptkhbd]{0,5})/g, "m$16");
t=t.replace(/m̄([aeioumngptkhbd]{0,5})/g, "m$17");
t=t.replace(/M̍([aeioumngptkhbd]{0,5})/g, "M$18");
t=t.replace(/m̍([aeioumngptkhbd]{0,5})/g, "m$18");
t=t.replace(/N̋([aeioumngptkhbd]{0,5})/g, "N$19");
t=t.replace(/Ń([aeioumngptkhbd]{0,5})/g, "N$12");
t=t.replace(/Ǹ([aeioumngptkhbd]{0,5})/g, "N$13");
t=t.replace(/N̂([aeioumngptkhbd]{0,5})/g, "N$15");
t=t.replace(/Ň([aeioumngptkhbd]{0,5})/g, "N$16");
t=t.replace(/N̄([aeioumngptkhbd]{0,5})/g, "N$17");
t=t.replace(/N̍([aeioumngptkhbd]{0,5})/g, "N$18");
t=t.replace(/n̋([aeioumngptkhbd]{0,5})/g, "n$19");
t=t.replace(/ń([aeioumngptkhbd]{0,5})/g, "n$12");
t=t.replace(/ǹ([aeioumngptkhbd]{0,5})/g, "n$13");
t=t.replace(/n̂([aeioumngptkhbd]{0,5})/g, "n$15");
t=t.replace(/ň([aeioumngptkhbd]{0,5})/g, "n$16");
t=t.replace(/n̄([aeioumngptkhbd]{0,5})/g, "n$17");
t=t.replace(/n̍([aeioumngptkhbd]{0,5})/g, "n$18");
t = t.replace(/([aeiourmn]|nn|ng)(?!\w)/gi, '$11');
t = t.replace(/([aeiourmn]|nn|ng)([ptkh])(?!\w)/gi, '$1$24');
t = t.replace(/\bChh([aeioumngptkhbd]{0,5})([1-9])(?!\w)/g, 'Tsh$1$2');
t = t.replace(/\bCh([aeioumngptkhbd]{0,5})([1-9])(?!\w)/g, 'Ts$1$2');
t = t.replace(/\bchh([aeioumngptkhbd]{0,5})([1-9])(?!\w)/g, 'tsh$1$2');
t = t.replace(/\bch([aeioumngptkhbd]{0,5})([1-9])(?!\w)/g, 'ts$1$2');
return t;
}


function pojToTailuoFn(text) {
  const replacements = [
    [/oe/g, "ue"],
    [/őe/g, "űe"],
    [/óe/g, "ué"],
    [/òe/g, "uè"],
    [/ôe/g, "uê"],
    [/ǒe/g, "uě"],
    [/ōe/g, "uē"],
    [/o̍e/g, "ue̍"],
    [/oé/g, "ué"],
    [/oè/g, "uè"],
    [/oê/g, "uê"],
    [/oě/g, "uě"],
    [/oē/g, "uē"],
    [/oe̍/g, "ue̍"],
    [/Oé/g, "Ué"],
    [/Oè/g, "Uè"],
    [/Oê/g, "Uê"],
    [/O/g, "Uě"],
    [/Oē/g, "Uē"],
    [/Oe̍/g, "Ue̍"],
    [/oa/g, "ua"],
    [/őa/g, "űa"],
    [/óa/g, "uá"],
    [/òa/g, "uà"],
    [/ôa/g, "uâ"],
    [/ǒa/g, "uǎ"],
    [/ōa/g, "uā"],
    [/o̍a/g, "u̍a"],
    [/oá/g, "uá"],
    [/oà/g, "uà"],
    [/oâ/g, "uâ"],
    [/oǎ/g, "uǎ"],
    [/oā/g, "uā"],
    [/oa̍/g, "ua̍"],
    [/oa̋/g, "ua̋"],
    [/ek\b/g, "ik"],
    [/e̋k\b/g, "i̋k"],
    [/ék\b/g, "ík"],
    [/èk\b/g, "ìk"],
    [/êk\b/g, "îk"],
    [/ěk\b/g, "ǐk"],
    [/ēk\b/g, "īk"],
    [/e̍k\b/g, "i̍k"],
    [/eng\b/g, "ing"],
    [/e̋ng\b/g, "i̋ng"],
    [/éng\b/g, "íng"],
    [/èng\b/g, "ìng"],
    [/êng\b/g, "îng"],
    [/ěng\b/g, "ǐng"],
    [/ēng\b/g, "īng"],
    [/e̍ng\b/g, "i̍ng"],
    [/Oe/g, "Ue"],
    [/Őe/g, "Űe"],
    [/Óe/g, "Ué"],
    [/Òe/g, "Uè"],
    [/Ôe/g, "Uê"],
    [/Ǒe/g, "Uě"],
    [/Ōe/g, "Uē"],
    [/O̍e/g, "U̍e"],
    [/Oa/g, "Ua"],
    [/Őa/g, "Űa"],
    [/Óa/g, "Uá"],
    [/Òa/g, "Uà"],
    [/Ôa/g, "Uâ"],
    [/Ǒa/g, "Uǎ"],
    [/Ōa/g, "Uā"],
    [/O̍a/g, "U̍a"],
    [/Oá/g, "Uá"],
    [/Oà/g, "Uà"],
    [/Oâ/g, "Uâ"],
    [/Oǎ/g, "Uǎ"],
    [/Oā/g, "Uā"],
    [/Oa̍/g, "Ua̍"],
    [/Oa̋/g, "Ua̋"],
    [/Ek\b/g, "I̍k"],
    [/E̋k\b/g, "I̋k"],
    [/Ék\b/g, "Ík"],
    [/Èk\b/g, "Ìk"],
    [/Êk\b/g, "Îk"],
    [/Ěk\b/g, "Ǐk"],
    [/Ēk\b/g, "Īk"],
    [/E̍k\b/g, "I̍k"],
    [/Eng\b/g, "I̍ng"],
    [/E̋ng\b/g, "I̋ng"],
    [/Éng\b/g, "Íng"],
    [/Èng\b/g, "Ìng"],
    [/Êng\b/g, "Îng"],
    [/Ěng\b/g, "Ǐng"],
    [/Ēng\b/g, "Īng"],
    [/E̍ng\b/g, "I̍ng"],
    [/Ő\u0358/g, "Őo"],
    [/Ó\u0358/g, "Óo"],
    [/Ò\u0358/g, "Òo"],
    [/Ô\u0358/g, "Ôo"],
    [/Ǒ\u0358/g, "Ǒo"],
    [/Ō\u0358/g, "Ōo"],
    [/O̍\u0358/g, "O̍o"],
    [/Ő\u00B7/g, "Őo"],
    [/Ó\u00B7/g, "Óo"],
    [/Ò\u00B7/g, "Òo"],
    [/Ô\u00B7/g, "Ôo"],
    [/Ǒ\u00B7/g, "Ǒo"],
    [/Ō\u00B7/g, "Ōo"],
    [/O̍\u00B7/g, "O̍o"],
    [/o\u0358/g, "oo"],
    [/ő\u0358/g, "őo"],
    [/ó\u0358/g, "óo"],
    [/ò\u0358/g, "òo"],
    [/ô\u0358/g, "ôo"],
    [/ǒ\u0358/g, "ǒo"],
    [/ō\u0358/g, "ōo"],
    [/o̍\u0358/g, "o̍o"],
    [/o\u00B7/g, "oo"],
    [/ő\u00B7/g, "őo"],
    [/ó\u00B7/g, "óo"],
    [/ò\u00B7/g, "òo"],
    [/ô\u00B7/g, "ôo"],
    [/ǒ\u00B7/g, "ǒo"],
    [/ō\u00B7/g, "ōo"],
    [/o̍\u00B7/g, "o̍o"],
    [/ⁿ/g, "nn"],
  ]
  for (const [pattern, replacement] of replacements) {
    text = text.replace(pattern, replacement)
  }
  return text
}



function convertToFullMark(t) {
  // 標點符號轉換對照（含可能的後續空格）
  t = t.replace(/!( )?/g, "！");
  t = t.replace(/\(( )?/g, "（");
  t = t.replace(/\)( )?/g, "）");
  t = t.replace(/,( )?/g, "，");
  t = t.replace(/\.( )?/g, "。");
  t = t.replace(/:( )?/g, "：");
  t = t.replace(/;( )?/g, "；");
  t = t.replace(/\?( )?/g, "？");
  t = t.replace(/~( )?/g, "～");
  t = t.replace(/"( )?/g, "「");
  t = t.replace(/"( )?/g, "」");
  t = t.replace(/'( )?/g, "『");
  t = t.replace(/'( )?/g, "』");

  t = t.replace(/“( )?/g, "「");
  t = t.replace(/”( )?/g, "」");
  t = t.replace(/‘( )?/g, "『");
  t = t.replace(/’( )?/g, "』");

  return t;
}


function numberToRoma(t) {
    // 數字調轉羅馬字    

t = t.replace(/([aeiourmn]|nn|ng)(1)/gi, '$1')
t = t.replace(/([aeiourmn]|nn|ng)([ptkh])(4)/gi, '$1$2')

t=t.replace(/([MNmn])(n)(g|gh)(9)\b/g, '$1n̋$3');
t=t.replace(/([MNmn])(n)(g|gh)(2)\b/g, '$1ń$3');
t=t.replace(/([MNmn])(n)(g|gh)(3)\b/g, '$1ǹ$3');
t=t.replace(/([MNmn])(n)(g|gh)(5)\b/g, '$1n̂$3');
t=t.replace(/([MNmn])(n)(g|gh)(6)\b/g, '$1ň$3');
t=t.replace(/([MNmn])(n)(g|gh)(7)\b/g, '$1n̄$3');
t=t.replace(/([MNmn])(n)(g|gh)(8)\b/g, '$1n̍$3');

t=t.replace(/(O)([eiouy]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(9)\b/g, 'Ő$2');
t=t.replace(/(O)([eiouy]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(2)\b/g, 'Ó$2');
t=t.replace(/(O)([eiouy]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(3)\b/g, 'Ò$2');
t=t.replace(/(O)([eiouy]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(5)\b/g, 'Ô$2');
t=t.replace(/(O)([eiouy]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(6)\b/g, 'Ǒ$2');
t=t.replace(/(O)([eiouy]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(7)\b/g, 'Ō$2');
t=t.replace(/(O)([eiouy]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(8)\b/g, 'O̍$2');
t=t.replace(/(o)([eiouy]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(9)\b/g, 'ő$2');
t=t.replace(/(o)([eiouy]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(2)\b/g, 'ó$2');
t=t.replace(/(o)([eiouy]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(3)\b/g, 'ò$2');
t=t.replace(/(o)([eiouy]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(5)\b/g, 'ô$2');
t=t.replace(/(o)([eiouy]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(6)\b/g, 'ǒ$2');
t=t.replace(/(o)([eiouy]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(7)\b/g, 'ō$2');
t=t.replace(/(o)([eiouy]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(8)\b/g, 'o̍$2');
t=t.replace(/(Yu)((?:n|ng)?)(7)\b/g, 'Ǖ$2');
t=t.replace(/(Yu)((?:n|ng)?)(2)\b/g, 'Ǘ$2');
t=t.replace(/(Yu)((?:n|ng)?)(6)\b/g, 'Ǚ$2');
t=t.replace(/(Yu)((?:n|ng)?)(3)\b/g, 'Ǜ$2');
t=t.replace(/(yu)((?:n|ng)?)(7)\b/g, 'ǖ$2');
t=t.replace(/(yu)((?:n|ng)?)(2)\b/g, 'ǘ$2');
t=t.replace(/(yu)((?:n|ng)?)(6)\b/g, 'ǚ$2');
t=t.replace(/(yu)((?:n|ng)?)(3)\b/g, 'ǜ$2');
t=t.replace(/(Y)([iu]{0,1}(?:[mngbdptkh]|nnh|ng|nn)?)(7)\b/g, 'Ȳ$2');
t=t.replace(/(Y)([iu]{0,1}(?:[mngbdptkh]|nnh|ng|nn)?)(6)\b/g, 'Y̌$2');
t=t.replace(/(Y)([iu]{0,1}(?:[mngbdptkh]|nnh|ng|nn)?)(2)\b/g, 'Ý$2');
t=t.replace(/(Y)([iu]{0,1}(?:[mngbdptkh]|nnh|ng|nn)?)(3)\b/g, 'Ỳ$2');
t=t.replace(/(Y)([iu]{0,1}(?:[mngbdptkh]|nnh|ng|nn)?)(5)\b/g, 'Ŷ$2');
t=t.replace(/(y)([iu]{0,1}(?:[mngbdptkh]|nnh|ng|nn)?)(7)\b/g, 'ȳ$2');
t=t.replace(/(y)([iu]{0,1}(?:[mngbdptkh]|nnh|ng|nn)?)(6)\b/g, 'y̌$2');
t=t.replace(/(y)([iu]{0,1}(?:[mngbdptkh]|nnh|ng|nn)?)(2)\b/g, 'ý$2');
t=t.replace(/(y)([iu]{0,1}(?:[mngbdptkh]|nnh|ng|nn)?)(3)\b/g, 'ỳ$2');
t=t.replace(/(y)([iu]{0,1}(?:[mngbdptkh]|nnh|ng|nn)?)(5)\b/g, 'ŷ$2');
t=t.replace(/(A)([eiou]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(9)\b/g, 'A̋$2');
t=t.replace(/(A)([eiou]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(2)\b/g, 'Á$2');
t=t.replace(/(A)([eiou]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(3)\b/g, 'À$2');
t=t.replace(/(A)([eiou]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(5)\b/g, 'Â$2');
t=t.replace(/(A)([eiou]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(6)\b/g, 'Ǎ$2');
t=t.replace(/(A)([eiou]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(7)\b/g, 'Ā$2');
t=t.replace(/(A)([eiou]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(8)\b/g, 'A̍$2');
t=t.replace(/(a)([eiou]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(9)\b/g, 'a̋$2');
t=t.replace(/(a)([eiou]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(2)\b/g, 'á$2');
t=t.replace(/(a)([eiou]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(3)\b/g, 'à$2');
t=t.replace(/(a)([eiou]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(5)\b/g, 'â$2');
t=t.replace(/(a)([eiou]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(6)\b/g, 'ǎ$2');
t=t.replace(/(a)([eiou]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(7)\b/g, 'ā$2');
t=t.replace(/(a)([eiou]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(8)\b/g, 'a̍$2');


t=t.replace(/(E)([eiur]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(9)\b/g, 'E̋$2');
t=t.replace(/(E)([eiur]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(2)\b/g, 'É$2');
t=t.replace(/(E)([eiur]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(3)\b/g, 'È$2');
t=t.replace(/(E)([eiur]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(5)\b/g, 'Ê$2');
t=t.replace(/(E)([eiur]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(6)\b/g, 'Ě$2');
t=t.replace(/(E)([eiur]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(7)\b/g, 'Ē$2');
t=t.replace(/(E)([eiur]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(8)\b/g, 'E̍$2');
t=t.replace(/(e)([eiur]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(9)\b/g, 'e̋$2');
t=t.replace(/(e)([eiur]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(2)\b/g, 'é$2');
t=t.replace(/(e)([eiur]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(3)\b/g, 'è$2');
t=t.replace(/(e)([eiur]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(5)\b/g, 'ê$2');
t=t.replace(/(e)([eiur]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(6)\b/g, 'ě$2');
t=t.replace(/(e)([eiur]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(7)\b/g, 'ē$2');
t=t.replace(/(e)([eiur]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(8)\b/g, 'e̍$2');
t=t.replace(/(U)((?:[mngbdptkh]|nnh|ng|nn)?)(9)\b/g, 'Ű$2');
t=t.replace(/(U)((?:[mngbdptkh]|nnh|ng|nn)?)(2)\b/g, 'Ú$2');
t=t.replace(/(U)((?:[mngbdptkh]|nnh|ng|nn)?)(3)\b/g, 'Ù$2');
t=t.replace(/(U)((?:[mngbdptkh]|nnh|ng|nn)?)(5)\b/g, 'Û$2');
t=t.replace(/(U)((?:[mngbdptkh]|nnh|ng|nn)?)(6)\b/g, 'Ǔ$2');
t=t.replace(/(U)((?:[mngbdptkh]|nnh|ng|nn)?)(7)\b/g, 'Ū$2');
t=t.replace(/(U)((?:[mngbdptkh]|nnh|ng|nn)?)(8)\b/g, 'U̍$2');
t=t.replace(/(u)((?:[mngbdptkh]|nnh|ng|nn)?)(9)\b/g, 'ű$2');
t=t.replace(/(u)((?:[mngbdptkh]|nnh|ng|nn)?)(2)\b/g, 'ú$2');
t=t.replace(/(u)((?:[mngbdptkh]|nnh|ng|nn)?)(3)\b/g, 'ù$2');
t=t.replace(/(u)((?:[mngbdptkh]|nnh|ng|nn)?)(5)\b/g, 'û$2');
t=t.replace(/(u)((?:[mngbdptkh]|nnh|ng|nn)?)(6)\b/g, 'ǔ$2');
t=t.replace(/(u)((?:[mngbdptkh]|nnh|ng|nn)?)(7)\b/g, 'ū$2');
t=t.replace(/(u)((?:[mngbdptkh]|nnh|ng|nn)?)(8)\b/g, 'u̍$2');
t=t.replace(/(I)([i]{0,1}(?:[mngbdptkhrr]|nnh|ng|nn)?)(9)\b/g, 'I̋$2');
t=t.replace(/(I)([i]{0,1}(?:[mngbdptkhr]|nnh|ng|nn)?)(2)\b/g, 'Í$2');
t=t.replace(/(I)([i]{0,1}(?:[mngbdptkhr]|nnh|ng|nn)?)(3)\b/g, 'Ì$2');
t=t.replace(/(I)([i]{0,1}(?:[mngbdptkhr]|nnh|ng|nn)?)(5)\b/g, 'Î$2');
t=t.replace(/(I)([i]{0,1}(?:[mngbdptkhr]|nnh|ng|nn)?)(6)\b/g, 'Ǐ$2');
t=t.replace(/(I)([i]{0,1}(?:[mngbdptkhr]|nnh|ng|nn)?)(7)\b/g, 'Ī$2');
t=t.replace(/(I)([i]{0,1}(?:[mngbdptkhr]|nnh|ng|nn)?)(8)\b/g, 'I̍$2');
t=t.replace(/(i)([i]{0,1}(?:[mngbdptkhr]|nnh|ng|nn)?)(9)\b/g, 'i̋$2');
t=t.replace(/(i)([i]{0,1}(?:[mngbdptkhr]|nnh|ng|nn)?)(2)\b/g, 'í$2');
t=t.replace(/(i)([i]{0,1}(?:[mngbdptkhr]|nnh|ng|nn)?)(3)\b/g, 'ì$2');
t=t.replace(/(i)([i]{0,1}(?:[mngbdptkhr]|nnh|ng|nn)?)(5)\b/g, 'î$2');
t=t.replace(/(i)([i]{0,1}(?:[mngbdptkhr]|nnh|ng|nn)?)(6)\b/g, 'ǐ$2');
t=t.replace(/(i)([i]{0,1}(?:[mngbdptkhr]|nnh|ng|nn)?)(7)\b/g, 'ī$2');
t=t.replace(/(i)([i]{0,1}(?:[mngbdptkhr]|nnh|ng|nn)?)(8)\b/g, 'i̍$2');
t=t.replace(/(M)((?:h)?)(9)\b/g, 'M̋$2');
t=t.replace(/(M)((?:h)?)(2)\b/g, 'Ḿ$2');
t=t.replace(/(M)((?:h)?)(3)\b/g, 'M̀$2');
t=t.replace(/(M)((?:h)?)(5)\b/g, 'M̂$2');
t=t.replace(/(M)((?:h)?)(6)\b/g, 'M̌$2');
t=t.replace(/(M)((?:h)?)(7)\b/g, 'M̄$2');
t=t.replace(/(M)((?:h)?)(8)\b/g, 'M̍$2');
t=t.replace(/(m)((?:h)?)(9)\b/g, 'm̋$2');
t=t.replace(/(m)((?:h)?)(2)\b/g, 'ḿ$2');
t=t.replace(/(m)((?:h)?)(3)\b/g, 'm̀$2');
t=t.replace(/(m)((?:h)?)(5)\b/g, 'm̂$2');
t=t.replace(/(m)((?:h)?)(6)\b/g, 'm̌$2');
t=t.replace(/(m)((?:h)?)(7)\b/g, 'm̄$2');
t=t.replace(/(m)((?:h)?)(8)\b/g, 'm̍$2');

t=t.replace(/(N)((g|gh)?)(9)\b/g, 'N̋$2');
t=t.replace(/(N)((g|gh)?)(2)\b/g, 'Ń$2');
t=t.replace(/(N)((g|gh)?)(3)\b/g, 'Ǹ$2');
t=t.replace(/(N)((g|gh)?)(5)\b/g, 'N̂$2');
t=t.replace(/(N)((g|gh)?)(6)\b/g, 'Ň$2');
t=t.replace(/(N)((g|gh)?)(7)\b/g, 'N̄$2');
t=t.replace(/(N)((g|gh)?)(8)\b/g, 'N̍$2');

t=t.replace(/(n)((g|gh)?)(9)\b/g, 'n̋$2');
t=t.replace(/(n)((g|gh)?)(2)\b/g, 'ń$2');
t=t.replace(/(n)((g|gh)?)(3)\b/g, 'ǹ$2');
t=t.replace(/(n)((g|gh)?)(5)\b/g, 'n̂$2');
t=t.replace(/(n)((g|gh)?)(6)\b/g, 'ň$2');
t=t.replace(/(n)((g|gh)?)(7)\b/g, 'n̄$2');
t=t.replace(/(n)((g|gh)?)(8)\b/g, 'n̍$2');

return t;
}