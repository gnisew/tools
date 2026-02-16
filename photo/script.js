document.addEventListener('DOMContentLoaded', () => {
    // 1. 初始化 Fabric Canvas
    const canvas = new fabric.Canvas('c', {
        preserveObjectStacking: true, // 選取物件時保持層級
        selection: false, // 手機上通常關閉框選功能，避免誤觸
    });

    // 設定選取框樣式 (針對觸控優化)
    fabric.Object.prototype.set({
        transparentCorners: false,
        cornerColor: '#ffffff',
        cornerStrokeColor: '#3b82f6',
        borderColor: '#3b82f6',
        cornerSize: 24, // 加大控制點，方便手指點擊
        padding: 10,
        borderDashArray: [4, 4],
        rotatingPointOffset: 20
    });

    // DOM 元素引用
    const container = document.getElementById('canvas-container');
    const deleteBtnDiv = document.getElementById('object-controls');
    const stickerMenu = document.getElementById('sticker-menu');
    const placeholderText = document.getElementById('placeholder-text');

    // 初始化畫布大小
    resizeCanvas(300, 300);

    // --- 事件監聽綁定 ---

    // 刪除按鈕顯示/隱藏
    canvas.on('selection:created', () => deleteBtnDiv.classList.remove('hidden'));
    canvas.on('selection:updated', () => deleteBtnDiv.classList.remove('hidden'));
    canvas.on('selection:cleared', () => deleteBtnDiv.classList.add('hidden'));

    // 按鈕：上傳背景
    document.getElementById('btn-upload-bg').addEventListener('click', () => {
        document.getElementById('bg-upload').click();
    });

    // Input：背景檔案變更
    document.getElementById('bg-upload').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(f) {
            const data = f.target.result;
            fabric.Image.fromURL(data, function(img) {
                // 隱藏提示文字
                placeholderText.style.display = 'none';

                // 計算適配螢幕的尺寸
                const maxWidth = container.offsetWidth; 
                const maxHeight = container.offsetHeight;
                
                // 確保有些許邊距
                const padding = 20;
                const availableWidth = maxWidth - padding;
                const availableHeight = maxHeight - padding;

                let newWidth = img.width;
                let newHeight = img.height;
                
                // 縮放邏輯：確保圖片完整顯示在容器內 (contain)
                const ratio = Math.min(availableWidth / newWidth, availableHeight / newHeight);
                
                // 應用縮放
                const finalWidth = newWidth * ratio;
                const finalHeight = newHeight * ratio;

                // 重設畫布大小
                resizeCanvas(finalWidth, finalHeight);

                // 設定背景圖
                canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas), {
                    scaleX: ratio,
                    scaleY: ratio,
                    originX: 'left',
                    originY: 'top'
                });
                
                // 重置貼圖選單
                stickerMenu.classList.add('hidden');
            });
        };
        reader.readAsDataURL(file);
    });

    // 按鈕：加文字
    document.getElementById('btn-add-text').addEventListener('click', () => {
        if (!checkBackground()) return;
        
        const text = new fabric.IText('雙擊編輯', {
            left: canvas.width / 2,
            top: canvas.height / 2,
            fontFamily: 'Noto Sans TC',
            fill: '#ffffff',
            stroke: '#000000',
            strokeWidth: 1,
            fontSize: 40,
            originX: 'center',
            originY: 'center'
        });
        canvas.add(text);
        canvas.setActiveObject(text);
    });

    // 按鈕：切換貼圖選單
    document.getElementById('btn-toggle-sticker').addEventListener('click', toggleStickerMenu);
    
    // 按鈕：關閉貼圖選單
    document.getElementById('btn-close-menu').addEventListener('click', toggleStickerMenu);

    // 按鈕：上傳圖層
    document.getElementById('btn-upload-layer').addEventListener('click', () => {
        if (!checkBackground()) return;
        document.getElementById('sticker-upload').click();
    });

    // Input：圖層檔案變更
    document.getElementById('sticker-upload').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(f) {
            fabric.Image.fromURL(f.target.result, function(img) {
                // 縮放貼圖，避免太大
                // 預設縮放到畫布寬度的 30%
                const targetSize = canvas.width * 0.3;
                const scaleFactor = targetSize / img.width;
                
                img.set({
                    left: canvas.width / 2,
                    top: canvas.height / 2,
                    originX: 'center',
                    originY: 'center',
                    scaleX: scaleFactor,
                    scaleY: scaleFactor
                });
                canvas.add(img);
                canvas.setActiveObject(img);
            });
        };
        reader.readAsDataURL(file);
    });

    // 按鈕：刪除選取
    document.getElementById('btn-delete').addEventListener('click', () => {
        const activeObject = canvas.getActiveObject();
        if (activeObject) {
            canvas.remove(activeObject);
            canvas.discardActiveObject();
            canvas.requestRenderAll();
        }
    });

    // 按鈕：下載圖片
    document.getElementById('btn-download').addEventListener('click', () => {
        // 取消選取狀態
        canvas.discardActiveObject();
        canvas.renderAll();

        if (!canvas.backgroundImage) {
            alert('請先上傳照片作為背景！');
            return;
        }

        const dataURL = canvas.toDataURL({
            format: 'png',
            quality: 1,
            multiplier: 2 // 下載 2 倍高畫質
        });

        const link = document.createElement('a');
        link.download = `photo-edit-${Date.now()}.png`;
        link.href = dataURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    // --- 輔助函數 ---

    function resizeCanvas(w, h) {
        canvas.setWidth(w);
        canvas.setHeight(h);
        canvas.renderAll();
    }

    function checkBackground() {
        if (!canvas.backgroundImage) {
            alert('請先上傳照片作為背景！');
            return false;
        }
        return true;
    }

    function toggleStickerMenu() {
        if (!checkBackground()) return;
        stickerMenu.classList.toggle('hidden');
    }

    // 初始化貼圖列表
    const emojis = ['😎', '❤️', '🔥', '🎉', '👍', '🐱', '🐶', '🌟', '💢', '💧', '👑', '🕶️', '💬', '🎀', '💯', '🚀', '🌹', '🎂', '💩', '👻'];
    const stickerGrid = document.getElementById('sticker-grid-container');
    
    emojis.forEach(emoji => {
        const div = document.createElement('div');
        div.className = 'sticker-item';
        div.textContent = emoji;
        div.onclick = () => addEmoji(emoji);
        stickerGrid.appendChild(div);
    });

    function addEmoji(emoji) {
        const text = new fabric.Text(emoji, {
            left: canvas.width / 2,
            top: canvas.height / 2,
            fontSize: canvas.width * 0.15, // 相對大小
            originX: 'center',
            originY: 'center',
            selectable: true
        });
        canvas.add(text);
        stickerMenu.classList.add('hidden'); // 選完自動關閉
        canvas.setActiveObject(text);
    }
    
    // 視窗調整時的簡單處理 (可選)
    window.addEventListener('resize', () => {
        // 這裡可以加入更複雜的重新適配邏輯
        // 目前保持不變，避免圖片被切裁
    });
});