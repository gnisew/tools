    var isTouchDevice = 'ontouchstart' in window || navigator.msMaxTouchPoints;

    if (isTouchDevice) {
      var lastTouchY = 0;
      window.addEventListener('touchstart', function (e) {
        if (e.touches.length === 1) {
          lastTouchY = e.touches[0].clientY;
        }
      });

      window.addEventListener('touchmove', function (e) {
        if (e.touches.length === 1) {
          var touchY = e.touches[0].clientY;
          var isScrollingUp = touchY > lastTouchY;

          if (window.scrollY === 0 && isScrollingUp) {
            e.preventDefault();
          }

          lastTouchY = touchY;
        }
      }, { passive: false });
    }




function c(x){console.log(x);}
function ca(){console.log("A");}
function cb(){console.log("B");}
function cc(){console.log("C");}

function updateFiles(){
  //<button id="updateButton">強制更新</button>
    var updateButton = document.getElementById('updateButton');
    updateButton.addEventListener('click', function() {
      var scriptsAndLinks = document.querySelectorAll('script, link[rel="stylesheet"]');
      var mediaElements = document.querySelectorAll('audio, img');
      var fileTypes = ['.js', '.css', '.mp3', '.jpg', '.png', '.gif', '.wav', '.txt'];

      // 快取無效化檔案
      for (var i = 0; i < scriptsAndLinks.length; i++) {
        var element = scriptsAndLinks[i];
        var url = element.src || element.href;

        for (var j = 0; j < fileTypes.length; j++) {
          var fileType = fileTypes[j];
          if (url && url.endsWith(fileType)) {
            element.src = element.href = url + "?" + new Date().getTime();
            break;
          }
        }
      }

      // 快取無效化媒體檔案
      for (var k = 0; k < mediaElements.length; k++) {
        var mediaElement = mediaElements[k];
        var mediaUrl = mediaElement.src || mediaElement.href;

        for (var l = 0; l < fileTypes.length; l++) {
          var fileType = fileTypes[l];
          if (mediaUrl && mediaUrl.endsWith(fileType)) {
            mediaElement.src = mediaElement.href = mediaUrl + "?" + new Date().getTime();
            break;
          }
        }
      }
    });
}






//===================================;
function wordToAbc(x){
  //字串轉123abc編碼;
  let arr = Array.from(x)
  let len = arr.length;
  let out = "";
  for (let i =0; i < len; i++){
    out = out + decimalToAbc(wordToDecimal(arr[i]));
  }
  return out;
}


function abcToWord(x){
  //123abc編碼轉字串;
  let arr = x.match(new RegExp(".{1,3}", "g"));
  let len = arr.length;
  let out = "";
  for (let i =0; i < len; i++){
    let ten = abcToDecimal(arr[i]);
    out = out + decimalToWord(ten);
  }
  return out;
}


function wordToDecimal(unicode) {
  const codePoint = Array.from(unicode)
    .map(char => char.codePointAt(0))
    .reduce((acc, curr) => acc + curr.toString(16), '');
  return parseInt(codePoint, 16);
}


function decimalToAbc(decimal) {
  const base = 62; // 英數編碼的基數
  const characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  let code = '';
  while (decimal > 0) {
    const remainder = decimal % base;
    code = characters.charAt(remainder) + code;
    decimal = Math.floor(decimal / base);
  }
  while (code.length < 3) {
    code = '0' + code;
  }
  return code;
}


function decimalToWord(decimal) {
  if (decimal < 0x10000) {
    return String.fromCharCode(decimal);
  } else {
    const surrogatePair = decimal - 0x10000;
    const highSurrogate = 0xd800 + (surrogatePair >> 10);
    const lowSurrogate = 0xdc00 + (surrogatePair & 0x3ff);
    return String.fromCharCode(highSurrogate, lowSurrogate);
  }
}


function abcToDecimal(code) {
  const base = 62;
  let decimal = 0;

  for (let i = 0; i < code.length; i++) {
    const character = code.charAt(i);
    decimal = decimal * base + characterToValue(character);
  }
  return decimal;
}

function characterToValue(character) {
  const characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  return characters.indexOf(character);
}



//截圖;
function takeScreenshot(id) {
  var element = document.getElementById(id); // 要截圖的元素
  html2canvas(element).then(function(canvas) {
    var link = document.createElement('a');
    link.href = canvas.toDataURL('image/png'); // 轉換為圖片 URL
    link.download = 'screenshot.png'; // 下載圖片的文件名
    link.click();
  });
}


//===================================;

