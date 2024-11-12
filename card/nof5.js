
// === 防止下拉更新的處理 ===
document.addEventListener('DOMContentLoaded', function() {
    var isTouchDevice = 'ontouchstart' in window || navigator.msMaxTouchPoints;
    
    if (isTouchDevice) {
        let startY = 0;
        let startX = 0;
        
        // 新增：設定 CSS 防止下拉
        document.body.style.overscrollBehavior = 'none';
        document.documentElement.style.overscrollBehavior = 'none';
        
        // 處理觸控開始
        document.addEventListener('touchstart', function(e) {
            startY = e.touches[0].pageY;
            startX = e.touches[0].pageX;
        }, { passive: false });

        // 處理觸控移動
        document.addEventListener('touchmove', function(e) {
            // 確保有觸控點
            if (e.touches.length > 0) {
                // 計算移動距離
                const deltaY = e.touches[0].pageY - startY;
                const deltaX = e.touches[0].pageX - startX;
                
                // 如果是垂直滑動且在頁面頂部
                if (Math.abs(deltaY) > Math.abs(deltaX)) {
                    // 在頁面頂部且想要下拉
                    if (window.scrollY <= 0 && deltaY > 0) {
                        e.preventDefault();
                    }
                    
                    // 在頁面底部且想要上拉
                    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight && deltaY < 0) {
                        e.preventDefault();
                    }
                }
            }
        }, { passive: false });

        // 新增：防止 iOS 橡皮筋效果
        document.addEventListener('touchmove', function(e) {
            if (e.touches.length > 1) {
                e.preventDefault();
            }
        }, { passive: false });
        
        // 新增：處理特定容器的觸控事件
        const container = document.getElementById('canvas-container');
        if (container) {
            container.addEventListener('touchmove', function(e) {
                e.preventDefault();
            }, { passive: false });
        }
    }
    
    // 新增：CSS 樣式
    const style = document.createElement('style');
    style.textContent = `
        html, body {
            overscroll-behavior: none;
            overflow-x: hidden;
            height: 100%;
            position: fixed;
            width: 100%;
        }
        #canvas-container {
            touch-action: none;
            -webkit-overflow-scrolling: none;
            overflow: hidden;
            position: absolute;
            width: 100%;
            height: 100%;
        }
    `;
    document.head.appendChild(style);
});

// 新增：確保視窗大小改變時重新計算
window.addEventListener('resize', function() {
    // 強制重新計算視窗高度（解決 iOS Safari 工具列問題）
    let vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
});
/*
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
*/





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

