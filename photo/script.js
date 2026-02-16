document.addEventListener('DOMContentLoaded', () => {
    
    // ---------------------------------------------------------
    // 1. 初始化
    // ---------------------------------------------------------
    const canvas = new fabric.Canvas('c', {
        preserveObjectStacking: true,
        selection: false,
        controlsAboveOverlay: true,
        backgroundColor: '#d1d5db'
    });

    let artboardImage = null;

    const PALETTE = ['#000000', '#ffffff', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#7c3aed', '#6b7280'];

    const stickerData = {
        '表情': ['😎', '😂', '🥰', '😍', '😒', '😭', '😡', '😱', '👍', '👎', '👊', '✌️', '👌', '❤️', '💔', '🔥', '✨', '🎉', '💯', '💢', '💤', '👀', '👄', '💀', '👻', '💩', '🤡', '👺'],
        '動物': ['🐱', '🐶', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌'],
        '植物': ['🌹', '🌺', '🌻', '🌼', '🌷', '🌱', '🌲', '🌳', '🌴', '🌵', '🌾', '🌿', '🍀', '🍁', '🍂', '🍃', '🍄', '🧅', '🧄', '🥦', '🥕', '🌽', '🥒'],
        '食物': ['🍎', '🍌', '🍉', '🍇', '🍓', '🍑', '🍒', '🥭', '🍍', '🥝', '🍅', '🥑', '🍔', '🍟', '🍕', '🌭', '🥪', '🌮', '🍜', '🍣', '🍱', '🍛', '🍚', '🍦', '🍩', '🍪', '🎂', '🍻', '🍷', '☕'],
        'CDN圖': [
            { type: 'image', url: 'https://cdn-icons-png.flaticon.com/128/4151/4151475.png' },
            { type: 'image', url: 'https://cdn-icons-png.flaticon.com/128/4151/4151590.png' },
            { type: 'image', url: 'https://cdn-icons-png.flaticon.com/128/4151/4151676.png' },
            { type: 'image', url: 'https://cdn-icons-png.flaticon.com/128/1828/1828884.png' },
            { type: 'image', url: 'https://cdn-icons-png.flaticon.com/128/1828/1828970.png' }
        ]
    };

    const dom = {
        container: document.getElementById('canvas-container'),
        floatingMenu: document.getElementById('floating-menu'),
        menuStandard: document.getElementById('menu-standard'),
        menuLocked: document.getElementById('menu-locked'),
        btnMore: document.getElementById('btn-more'),             
        menuMoreOptions: document.getElementById('menu-more-options'),
        textToolbar: document.getElementById('text-toolbar'),
        placeholder: document.getElementById('placeholder-text'),
        stickerDrawer: document.getElementById('sticker-drawer'),
        stickerTabs: document.getElementById('sticker-tabs'),
        stickerContainer: document.getElementById('sticker-container'),
        saveStatus: document.getElementById('save-status'),
        fontFamily: document.getElementById('font-family'),
        fontSizeDisplay: document.getElementById('font-size-display'),
        btnUnlock: document.getElementById('btn-unlock'),
        
        // 新增的控制項
        btnFlip: document.getElementById('btn-flip'),
        btnRotate: document.getElementById('btn-rotate'),
        btnOpacity: document.getElementById('btn-opacity'),
        opacityControl: document.getElementById('opacity-control'),
        inputOpacity: document.getElementById('input-opacity'),
        opacityVal: document.getElementById('opacity-val'),
        iconOpacityArrow: document.getElementById('icon-opacity-arrow'),
        
        styleDrawer: document.getElementById('text-style-drawer'),
        btnOpenStyle: document.getElementById('btn-open-text-style'),
        btnCloseStyle: document.getElementById('close-text-style'),
        currentColorPreview: document.getElementById('current-color-preview'),
        drawerTextColor: document.getElementById('drawer-text-color'),
        drawerTextColorDisplay: document.getElementById('drawer-text-color-display'),
        drawerColorPalette: document.getElementById('drawer-color-palette'),
        
        inputTextStrokeWidth: document.getElementById('input-text-stroke-width'),
        inputTextStrokeColor: document.getElementById('input-text-stroke-color'),
        textStrokeColorDisplay: document.getElementById('text-stroke-color-display')
    };

    function resizeCanvas() {
        canvas.setWidth(dom.container.offsetWidth);
        canvas.setHeight(dom.container.offsetHeight);
        canvas.renderAll();
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // ---------------------------------------------------------
    // 2. 自定義控制項
    // ---------------------------------------------------------
    const iconRotate = `data:image/svg+xml;utf8,%3Csvg viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg' fill='none' stroke='%23374151' stroke-width='2'%3E%3Cpath d='M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8'/%3E%3Cpath d='M21 3v5h-5'/%3E%3C/svg%3E`;
    const iconMove = `data:image/svg+xml;utf8,%3Csvg viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg' fill='none' stroke='%23374151' stroke-width='2'%3E%3Cpath d='M5 9l-3 3 3 3M9 5l3-3 3 3M19 9l3 3-3 3M9 19l3 3 3-3M2 12h20M12 2v20'/%3E%3C/svg%3E`;
    const imgRotate = document.createElement('img'); imgRotate.src = iconRotate;
    const imgMove = document.createElement('img'); imgMove.src = iconMove;

    function renderIcon(ctx, left, top, styleOverride, fabricObject, imgElement) {
        const size = 24;
        ctx.save();
        ctx.translate(left, top);
        ctx.rotate(fabric.util.degreesToRadians(fabricObject.angle));
        ctx.beginPath();
        ctx.arc(0, 0, 13, 0, 2 * Math.PI);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#e5e7eb';
        ctx.stroke();
        ctx.drawImage(imgElement, -size/2, -size/2, size, size);
        ctx.restore();
    }

    fabric.Object.prototype.set({
        transparentCorners: false, cornerColor: '#ffffff', cornerStrokeColor: '#d1d5db',
        borderColor: '#8b5cf6', borderScaleFactor: 2, cornerSize: 10, cornerStyle: 'circle',
        padding: 5, borderDashArray: [0, 0]
    });

    function updateControlsSpacing(obj) {
        if (!obj.controls || !obj.controls.mtr || !obj.controls.move) return;
        const currentWidth = obj.width * obj.scaleX;
        const minPixelDistance = 35;
        let spacingFactor = minPixelDistance / currentWidth;
        spacingFactor = Math.max(0.15, spacingFactor);
        spacingFactor = Math.min(spacingFactor, 2.0);
        obj.controls.mtr.x = -spacingFactor;
        obj.controls.move.x = spacingFactor;
    }

    function styleControls(obj, isText = false) {
        const controls = {
            tl: new fabric.Control({ x: -0.5, y: -0.5, cursorStyle: 'nwse-resize', actionHandler: fabric.controlsUtils.scalingEqually }),
            tr: new fabric.Control({ x: 0.5, y: -0.5, cursorStyle: 'nesw-resize', actionHandler: fabric.controlsUtils.scalingEqually }),
            bl: new fabric.Control({ x: -0.5, y: 0.5, cursorStyle: 'nesw-resize', actionHandler: fabric.controlsUtils.scalingEqually }),
            br: new fabric.Control({ x: 0.5, y: 0.5, cursorStyle: 'nwse-resize', actionHandler: fabric.controlsUtils.scalingEqually }),
            mtr: new fabric.Control({ x: -0.15, y: 0.5, offsetY: 30, actionHandler: fabric.controlsUtils.rotationWithSnapping, cursorStyle: 'grab', render: (ctx, left, top, style, obj) => renderIcon(ctx, left, top, style, obj, imgRotate), withConnection: false }),
            move: new fabric.Control({ x: 0.15, y: 0.5, offsetY: 30, actionHandler: fabric.controlsUtils.dragHandler, cursorStyle: 'move', render: (ctx, left, top, style, obj) => renderIcon(ctx, left, top, style, obj, imgMove), withConnection: false })
        };
        if (isText) {
            const widthHandler = (eventData, transform, x, y) => {
                const result = fabric.controlsUtils.changeWidth(eventData, transform, x, y);
                updateControlsSpacing(transform.target);
                return result;
            };
            controls.ml = new fabric.Control({ x: -0.5, y: 0, cursorStyle: 'ew-resize', actionHandler: widthHandler, render: renderVerticalBar });
            controls.mr = new fabric.Control({ x: 0.5, y: 0, cursorStyle: 'ew-resize', actionHandler: widthHandler, render: renderVerticalBar });
        }
        obj.controls = controls;
        updateControlsSpacing(obj);
    }

    function renderVerticalBar(ctx, left, top, style, fabricObject) {
        ctx.save();
        ctx.translate(left, top);
        ctx.rotate(fabric.util.degreesToRadians(fabricObject.angle));
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#8b5cf6';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(-4, -10, 8, 20, 4);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }

    function updateFloatingMenu() {
        const obj = canvas.getActiveObject();
        if (!obj || obj === artboardImage || canvas.isDrawingMode || obj.isMoving || obj.isScaling || obj.isRotating) {
            dom.floatingMenu.classList.add('hidden');
            dom.floatingMenu.style.opacity = '0';
            closeMoreMenu();
            return;
        }
        dom.floatingMenu.classList.remove('hidden');
        requestAnimationFrame(() => dom.floatingMenu.style.opacity = '1');
        
        if (obj.lockMovementX) {
            dom.menuStandard.classList.add('hidden');
            dom.menuLocked.classList.remove('hidden');
        } else {
            dom.menuStandard.classList.remove('hidden');
            dom.menuLocked.classList.add('hidden');
        }

        const canvasRect = canvas.getElement().getBoundingClientRect();
        const objRect = obj.getBoundingRect(); 
        const menuRect = dom.floatingMenu.getBoundingClientRect();
        const headerHeight = 50; 
        const gap = 55;          
        
        let left = canvasRect.left + objRect.left + (objRect.width / 2);
        let top = canvasRect.top + objRect.top - menuRect.height - gap;

        if (top < headerHeight + 5) {
            top = canvasRect.top + objRect.top + objRect.height + gap;
        }

        const halfWidth = menuRect.width / 2;
        if (left - halfWidth < 5) left = 5 + halfWidth;
        else if (left + halfWidth > window.innerWidth - 5) left = window.innerWidth - 5 - halfWidth;

        dom.floatingMenu.style.top = `${top}px`;
        dom.floatingMenu.style.left = `${left}px`;
        dom.floatingMenu.style.transform = 'translateX(-50%)';
    }

    function updateFontSizeDisplay(obj) {
        if (obj && obj.type === 'textbox') {
            const effectiveSize = Math.round(obj.fontSize * obj.scaleX);
            dom.fontSizeDisplay.textContent = effectiveSize;
            dom.currentColorPreview.style.backgroundColor = obj.fill;
        }
    }

    // ---------------------------------------------------------
    // 新增：更多選單內的邏輯
    // ---------------------------------------------------------

    // 左右翻轉
    dom.btnFlip.onclick = () => {
        const obj = canvas.getActiveObject();
        if (obj) { 
            obj.set('flipX', !obj.flipX); 
            canvas.renderAll(); 
            saveState(); 
        }
    };

    // 旋轉 90 度
    dom.btnRotate.onclick = () => {
        const obj = canvas.getActiveObject();
        if (obj) {
            let angle = obj.angle % 360;
            // 轉到下一個 90 的倍數
            let newAngle = (Math.round(angle / 90) * 90 + 90) % 360;
            obj.rotate(newAngle);
            canvas.requestRenderAll();
            saveState();
        }
    };

    // 透明度開關
    dom.btnOpacity.onclick = (e) => {
        e.stopPropagation();
        const isHidden = dom.opacityControl.classList.contains('hidden');
        if (isHidden) {
            dom.opacityControl.classList.remove('hidden');
            dom.iconOpacityArrow.classList.add('rotate-180');
            const obj = canvas.getActiveObject();
            if(obj) {
                const opacity = (obj.opacity !== undefined) ? obj.opacity : 1;
                dom.inputOpacity.value = Math.round(opacity * 100);
                dom.opacityVal.textContent = Math.round(opacity * 100);
            }
        } else {
            dom.opacityControl.classList.add('hidden');
            dom.iconOpacityArrow.classList.remove('rotate-180');
        }
    };

    // 透明度調整
    dom.inputOpacity.oninput = (e) => {
        const val = parseInt(e.target.value, 10);
        dom.opacityVal.textContent = val;
        const obj = canvas.getActiveObject();
        if(obj) {
            obj.set('opacity', val / 100);
            canvas.requestRenderAll();
        }
    };
    dom.inputOpacity.onchange = () => saveState();

    function toggleMoreMenu() { 
        const isHidden = dom.menuMoreOptions.classList.contains('hidden'); 
        if (isHidden) {
            dom.menuMoreOptions.classList.remove('hidden');
            // 每次打開時重置透明度選單為收合狀態
            dom.opacityControl.classList.add('hidden');
            dom.iconOpacityArrow.classList.remove('rotate-180');
        } else {
            closeMoreMenu(); 
        }
    }
    
    function closeMoreMenu() { 
        dom.menuMoreOptions.classList.add('hidden'); 
    }
    dom.btnMore.onclick = (e) => { e.stopPropagation(); toggleMoreMenu(); };
    dom.opacityControl.addEventListener('click', (e) => e.stopPropagation());

    document.addEventListener('click', (e) => { if (!dom.floatingMenu.contains(e.target)) closeMoreMenu(); });

    // ---------------------------------------------------------
    // 樣式抽屜
    // ---------------------------------------------------------
    
    PALETTE.forEach(color => {
        const div = document.createElement('div');
        div.className = 'color-dot';
        div.style.backgroundColor = color;
        div.onclick = () => {
            const obj = canvas.getActiveObject();
            if(obj && obj.type === 'textbox') {
                obj.set('fill', color);
                dom.drawerTextColor.value = color;
                dom.drawerTextColorDisplay.style.backgroundColor = color;
                dom.currentColorPreview.style.backgroundColor = color;
                canvas.requestRenderAll();
                saveState();
            }
        };
        dom.drawerColorPalette.appendChild(div);
    });

    dom.btnOpenStyle.onclick = () => {
        const obj = canvas.getActiveObject();
        if(obj && obj.type === 'textbox') {
            dom.drawerTextColor.value = obj.fill;
            dom.drawerTextColorDisplay.style.backgroundColor = obj.fill;
            dom.inputTextStrokeWidth.value = obj.strokeWidth || 0;
            dom.inputTextStrokeColor.value = obj.stroke || '#000000';
            dom.textStrokeColorDisplay.style.backgroundColor = obj.stroke || '#000000';

            dom.styleDrawer.classList.remove('translate-y-full');
            dom.styleDrawer.classList.add('translate-y-0');
        }
    };

    dom.btnCloseStyle.onclick = () => {
        dom.styleDrawer.classList.remove('translate-y-0');
        dom.styleDrawer.classList.add('translate-y-full');
    };

    dom.drawerTextColor.oninput = (e) => {
        const val = e.target.value;
        dom.drawerTextColorDisplay.style.backgroundColor = val;
        dom.currentColorPreview.style.backgroundColor = val;
        const obj = canvas.getActiveObject();
        if(obj) { obj.set('fill', val); canvas.requestRenderAll(); }
    };

    dom.inputTextStrokeWidth.oninput = (e) => {
        const val = parseFloat(e.target.value);
        const obj = canvas.getActiveObject();
        if(obj) { 
            obj.set({
                'strokeWidth': val,
                'paintFirst': 'stroke',
                'strokeLineJoin': 'round',
                'strokeLineCap': 'round'
            });
            canvas.requestRenderAll(); 
        }
    };

    dom.inputTextStrokeColor.oninput = (e) => {
        const val = e.target.value;
        dom.textStrokeColorDisplay.style.backgroundColor = val;
        const obj = canvas.getActiveObject();
        if(obj) { obj.set('stroke', val); canvas.requestRenderAll(); }
    };

    // ---------------------------------------------------------
    // 其他事件
    // ---------------------------------------------------------
    
    canvas.on('selection:created', onSelected);
    canvas.on('selection:updated', onSelected);
    canvas.on('object:scaling', (e) => { updateFloatingMenu(); updateFontSizeDisplay(e.target); updateControlsSpacing(e.target); });
    canvas.on('object:moving', () => updateFloatingMenu()); 
    canvas.on('object:rotating', () => updateFloatingMenu());
    canvas.on('object:modified', (e) => { updateFloatingMenu(); updateFontSizeDisplay(e.target); saveState(); }); 
    canvas.on('selection:cleared', () => {
        dom.floatingMenu.classList.add('hidden');
        dom.textToolbar.classList.add('hidden');
        dom.stickerDrawer.classList.add('translate-y-full');
        dom.styleDrawer.classList.add('translate-y-full');
        closeMoreMenu();
    });

    function onSelected(e) {
        const obj = e.selected[0];
        if (obj === artboardImage) { canvas.discardActiveObject(); canvas.requestRenderAll(); return; }
        updateFloatingMenu();
        if (obj.type === 'textbox' && !obj.lockMovementX) {
            dom.textToolbar.classList.remove('hidden');
            dom.fontFamily.value = obj.fontFamily;
            updateFontSizeDisplay(obj);
        } else {
            dom.textToolbar.classList.add('hidden');
        }
    }

    document.getElementById('btn-upload-bg').onclick = () => document.getElementById('bg-upload').click();
    document.getElementById('bg-upload').onchange = (e) => {
        const file = e.target.files[0]; if(!file) return;
        const reader = new FileReader();
        reader.onload = (f) => {
            fabric.Image.fromURL(f.target.result, (img) => {
                if (artboardImage) canvas.remove(artboardImage);
                dom.placeholder.style.display = 'none';
                const margin = 40;
                const maxWidth = canvas.width - (margin * 2);
                const maxHeight = canvas.height - (margin * 2);
                const scale = Math.min(maxWidth / img.width, maxHeight / img.height);
                img.set({ scaleX: scale, scaleY: scale, left: canvas.width / 2, top: canvas.height / 2, originX: 'center', originY: 'center', selectable: false, evented: false, hasControls: false, hasBorders: false, shadow: new fabric.Shadow({ color: 'rgba(0,0,0,0.2)', blur: 20 }) });
                artboardImage = img;
                canvas.add(img); img.sendToBack(); canvas.requestRenderAll(); saveState();
            });
        }; reader.readAsDataURL(file);
    };

    document.getElementById('btn-download').onclick = () => {
        canvas.discardActiveObject(); canvas.requestRenderAll();
        if (!artboardImage && canvas.getObjects().length === 0) return alert('畫布是空的');
        const link = document.createElement('a'); link.download = `canva-pro-${Date.now()}.png`;
        let options = { format: 'png', multiplier: 2 };
        if (artboardImage) {
            const width = artboardImage.width * artboardImage.scaleX;
            const height = artboardImage.height * artboardImage.scaleY;
            options.left = artboardImage.left - (width / 2);
            options.top = artboardImage.top - (height / 2);
            options.width = width; options.height = height;
        }
        link.href = canvas.toDataURL(options); link.click();
    };

    function saveState() { dom.saveStatus.textContent = '已儲存'; setTimeout(() => dom.saveStatus.textContent = '', 2000); }
    document.getElementById('btn-lock').onclick = () => toggleLock(true);
    dom.btnUnlock.onclick = () => toggleLock(false);
    function toggleLock(locked) { const obj = canvas.getActiveObject(); if (obj) { obj.set({ lockMovementX: locked, lockMovementY: locked, lockRotation: locked, lockScalingX: locked, lockScalingY: locked, selectable: true, evented: true }); obj.hasControls = !locked; obj.borderColor = locked ? '#9ca3af' : '#8b5cf6'; canvas.requestRenderAll(); updateFloatingMenu(); }}
    const moveLayer = (d) => { const o = canvas.getActiveObject(); if(o) { d=='up'?o.bringForward():o.sendBackwards(); if(artboardImage) artboardImage.sendToBack(); closeMoreMenu(); }};
    document.getElementById('btn-layer-up').onclick = () => moveLayer('up');
    document.getElementById('btn-layer-down').onclick = () => moveLayer('down');
    document.getElementById('btn-delete').onclick = () => { const o = canvas.getActiveObject(); if(o) canvas.remove(o); dom.floatingMenu.classList.add('hidden'); };
    document.getElementById('btn-duplicate').onclick = () => { const obj = canvas.getActiveObject(); if (!obj) return; obj.clone((cloned) => { canvas.discardActiveObject(); cloned.set({ left: obj.left + 20, top: obj.top + 20 }); canvas.add(cloned); canvas.setActiveObject(cloned); styleControls(cloned, cloned.type === 'textbox'); });};
    document.getElementById('btn-clear').onclick = () => { if(confirm('確定清空？')) { canvas.clear(); canvas.setBackgroundColor('#d1d5db', canvas.renderAll.bind(canvas)); artboardImage = null; dom.placeholder.style.display = 'flex'; }};

    function loadFont(f) { WebFont.load({ google: { families: [f] }, active: () => canvas.requestRenderAll() }); }
    dom.fontFamily.onchange = (e) => { const o = canvas.getActiveObject(); if(o && o.type==='textbox') { loadFont(e.target.value); o.set('fontFamily', e.target.value); canvas.requestRenderAll(); }};
    
    function changeFontSize(delta) { const obj = canvas.getActiveObject(); if (obj && obj.type === 'textbox') { let currentSize = Math.round(obj.fontSize * obj.scaleX); let newSize = currentSize + delta; if (newSize < 10) newSize = 10; obj.set({ fontSize: newSize, scaleX: 1, scaleY: 1 }); dom.fontSizeDisplay.textContent = newSize; canvas.requestRenderAll(); updateFloatingMenu(); updateControlsSpacing(obj); }}
    document.getElementById('btn-font-plus').onclick = () => changeFontSize(2);
    document.getElementById('btn-font-minus').onclick = () => changeFontSize(-2);
    document.getElementById('btn-close-text').onclick = () => dom.textToolbar.classList.add('hidden');
    
    document.getElementById('btn-add-text').onclick = () => { 
        const t = new fabric.Textbox('雙擊編輯', { 
            left: canvas.width/2, top: canvas.height/2, width: 150, 
            fontSize: 40, fontFamily: 'Noto Sans TC', fill: '#333333', 
            originX: 'center', originY: 'center', textAlign: 'center',
            splitByGrapheme: true,
            paintFirst: 'stroke', strokeWidth: 0,
            strokeLineJoin: 'round', strokeLineCap: 'round'
        }); 
        canvas.add(t); canvas.setActiveObject(t); styleControls(t, true); 
    };

    const drawer = dom.stickerDrawer;
    function initStickers() {
        Object.keys(stickerData).forEach((cat, index) => {
            const btn = document.createElement('button');
            btn.className = `tab-btn ${index === 0 ? 'active' : ''}`;
            btn.textContent = cat;
            btn.onclick = () => switchTab(cat, btn);
            dom.stickerTabs.appendChild(btn);
        });
        renderStickerContent(Object.keys(stickerData)[0]);
    }
    function switchTab(category, btnElement) {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btnElement.classList.add('active');
        renderStickerContent(category);
    }
    function renderStickerContent(category) {
        dom.stickerContainer.innerHTML = ''; 
        const items = stickerData[category] || [];
        items.forEach(item => {
            const div = document.createElement('div');
            div.className = 'sticker-item';
            if (typeof item === 'string') {
                div.textContent = item;
                div.onclick = () => { const t = new fabric.Text(item, { left: canvas.width/2, top: canvas.height/2, fontSize: 80, originX: 'center', originY: 'center' }); canvas.add(t); canvas.setActiveObject(t); styleControls(t, false); closeDrawer(); };
            } else if (item.type === 'image') {
                const img = document.createElement('img'); img.src = item.url; img.className = 'sticker-img';
                div.appendChild(img);
                div.onclick = () => { fabric.Image.fromURL(item.url, (imgObj) => { const scale = (canvas.width * 0.15) / imgObj.width; imgObj.set({ left: canvas.width/2, top: canvas.height/2, scaleX: scale, scaleY: scale, originX: 'center', originY: 'center' }); canvas.add(imgObj); canvas.setActiveObject(imgObj); styleControls(imgObj, false); closeDrawer(); }); };
            }
            dom.stickerContainer.appendChild(div);
        });
    }
    function closeDrawer() { drawer.classList.remove('translate-y-0'); drawer.classList.add('translate-y-full'); saveState(); }
    document.getElementById('btn-stickers').onclick = () => { drawer.classList.remove('translate-y-full'); drawer.classList.add('translate-y-0'); };
    document.getElementById('close-sticker-drawer').onclick = closeDrawer;
    document.getElementById('btn-upload-sticker').onclick = () => document.getElementById('sticker-upload').click();
    document.getElementById('sticker-upload').onchange = (e) => {
        const file = e.target.files[0]; if(!file) return;
        const r = new FileReader(); r.onload = (f) => {
            fabric.Image.fromURL(f.target.result, (img) => {
                const s = (canvas.width * 0.3) / img.width;
                img.set({ left: canvas.width/2, top: canvas.height/2, scaleX: s, scaleY: s, originX: 'center', originY: 'center' });
                canvas.add(img); canvas.setActiveObject(img); styleControls(img, false);
            });
        }; r.readAsDataURL(file);
    };

    initStickers();
});