document.addEventListener('DOMContentLoaded', () => {
    
    // 初始化 Fabric
    const canvas = new fabric.Canvas('c', {
        preserveObjectStacking: true, selection: false, controlsAboveOverlay: true, backgroundColor: '#d1d5db'
    });
    fabric.Object.prototype.objectCaching = false; 

    let artboardImage = null;
    let isDragging = false;
    let lastPosX, lastPosY;
    let batchFilesQueue = []; 

    const { palette, fonts, stickers } = APP_DATA;

    const dom = {
        container: document.getElementById('canvas-container'),
        floatingMenu: document.getElementById('floating-menu'),
        menuStandard: document.getElementById('menu-standard'),
        menuLocked: document.getElementById('menu-locked'),
        
        editorToolbar: document.getElementById('editor-toolbar'),
        toolbarMainMenu: document.getElementById('toolbar-main-menu'),
        groupTextOnly: document.querySelector('.group-text-only'),
        btnCloseEditor: document.getElementById('btn-close-editor'),
        btnToolbarFlip: document.getElementById('btn-toolbar-flip'),
        btnOpenBgTools: document.getElementById('btn-open-bg-tools'),
        
        btnLoadImg: document.getElementById('btn-load-img'),
        headerImgUpload: document.getElementById('header-img-upload'),

        // Batch Mode DOM
        btnBatchMode: document.getElementById('btn-batch-mode'),
        batchImgUpload: document.getElementById('batch-img-upload'),
        batchSettingsModal: document.getElementById('batch-settings-modal'),
        btnStartBatch: document.getElementById('btn-start-batch'),
        btnCancelBatch: document.getElementById('btn-cancel-batch'),
        batchSuffixInput: document.getElementById('batch-suffix'),
        
        batchModal: document.getElementById('batch-modal'),
        batchProgressBar: document.getElementById('batch-progress-bar'),
        batchStatusText: document.getElementById('batch-status-text'),

        // Clear Modal DOM
        btnShowClearModal: document.getElementById('btn-show-clear-modal'),
        clearModal: document.getElementById('clear-modal'),
        btnClearAll: document.getElementById('btn-clear-all'),
        btnClearObjects: document.getElementById('btn-clear-objects'),
        btnCloseModal: document.getElementById('btn-close-modal'),

        subMenus: document.querySelectorAll('.sub-menu-container'),
        backBtns: document.querySelectorAll('.sub-menu-back'),
        subBackground: document.getElementById('sub-background'),
        btnCloseBgTools: document.getElementById('btn-close-bg-tools'),
        
        btnBgReplace: document.getElementById('btn-bg-replace'),
        bgReplaceUpload: document.getElementById('bg-replace-upload'),
        btnBgRotate: document.getElementById('btn-bg-rotate'),
        btnZoomIn: document.getElementById('btn-zoom-in'),
        btnZoomOut: document.getElementById('btn-zoom-out'),
        btnZoomFit: document.getElementById('btn-zoom-fit'),
        
        fontListContainer: document.getElementById('font-list-container'),
        btnFontMinus: document.getElementById('btn-font-minus'),
        btnFontPlus: document.getElementById('btn-font-plus'),
        fontSizeDisplay: document.getElementById('font-size-display'),
        inputFontSizeSlider: document.getElementById('input-font-size-slider'),
        inputText: document.getElementById('input-text-color'),
        textColorPreview: document.getElementById('text-color-preview'),
        quickColorPalette: document.getElementById('quick-color-palette'),
        
        inputOutlineColor: document.getElementById('input-outline-color'),
        outlineColorPreview: document.getElementById('outline-color-preview'),
        inputOutlineWidth: document.getElementById('input-outline-width'),
        displayOutlineWidth: document.getElementById('display-outline-width'),
        btnOutlineWidthPreset: document.getElementById('btn-outline-width-preset'),
        outlineWidthPresets: document.getElementById('outline-width-presets'),
        btnToggleOutlineColor: document.getElementById('btn-toggle-outline-color'),
        outlineColorPicker: document.getElementById('outline-color-picker'),
        outlineQuickColors: document.getElementById('outline-quick-colors'),

        btnLayerTop: document.getElementById('btn-layer-top'),
        btnLayerUp: document.getElementById('btn-layer-up'),
        btnLayerDown: document.getElementById('btn-layer-down'),
        btnLayerBottom: document.getElementById('btn-layer-bottom'),
        
        inputOpacityFloat: document.getElementById('input-opacity-float'),
        valOpacityFloat: document.getElementById('opacity-val-float'),
        inputOpacityMain: document.getElementById('input-opacity-main'),
        valOpacityMain: document.getElementById('opacity-val-main'),

        btnRotate90: document.getElementById('btn-rotate-90'),
        inputRotate: document.getElementById('input-rotate'),
        rotateVal: document.getElementById('rotate-val'),

        placeholder: document.getElementById('placeholder-text'),
        stickerDrawer: document.getElementById('sticker-drawer'),
        stickerTabs: document.getElementById('sticker-tabs'),
        stickerContainer: document.getElementById('sticker-container'),
        saveStatus: document.getElementById('save-status'),
        btnUnlock: document.getElementById('btn-unlock')
    };

    function resizeCanvas() {
        canvas.setWidth(dom.container.offsetWidth);
        canvas.setHeight(dom.container.offsetHeight);
        if(artboardImage) fitAndCenterImage(); else canvas.renderAll();
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    function preloadFonts() {
        const fontFamilies = fonts.map(f => f.name);
        WebFont.load({
            google: { families: fontFamilies },
            active: () => { console.log('Fonts loaded'); canvas.requestRenderAll(); }
        });
    }
    preloadFonts();

    let userPrefOutlineColor = localStorage.getItem('pref_outline_color') || '#ffffff';
    let userPrefOutlineWidth = parseFloat(localStorage.getItem('pref_outline_width')) || 0;

    const iconRotate = `data:image/svg+xml;utf8,%3Csvg viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg' fill='none' stroke='%23374151' stroke-width='2'%3E%3Cpath d='M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8'/%3E%3Cpath d='M21 3v5h-5'/%3E%3C/svg%3E`;
    const iconMove = `data:image/svg+xml;utf8,%3Csvg viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg' fill='none' stroke='%23374151' stroke-width='2'%3E%3Cpath d='M5 9l-3 3 3 3M9 5l3-3 3 3M19 9l3 3-3 3M9 19l3 3 3-3M2 12h20M12 2v20'/%3E%3C/svg%3E`;
    const imgRotate = document.createElement('img'); imgRotate.src = iconRotate;
    const imgMove = document.createElement('img'); imgMove.src = iconMove;

    function renderIcon(ctx, left, top, styleOverride, fabricObject, imgElement) {
        const size = 24;
        ctx.save(); ctx.translate(left, top); ctx.rotate(fabric.util.degreesToRadians(fabricObject.angle));
        ctx.beginPath(); ctx.arc(0, 0, 13, 0, 2 * Math.PI); ctx.fillStyle = '#ffffff'; ctx.fill();
        ctx.lineWidth = 1; ctx.strokeStyle = '#e5e7eb'; ctx.stroke();
        ctx.drawImage(imgElement, -size/2, -size/2, size, size); ctx.restore();
    }

    fabric.Object.prototype.set({
        transparentCorners: false, cornerColor: '#ffffff', cornerStrokeColor: '#d1d5db',
        borderColor: '#8b5cf6', borderScaleFactor: 2, cornerSize: 10, cornerStyle: 'circle',
        padding: 5, borderDashArray: [0, 0]
    });

    function updateControlsSpacing(obj) {
        if (!obj.controls || !obj.controls.mtr || !obj.controls.move) return;
        const currentWidth = obj.width * obj.scaleX;
        let spacingFactor = Math.max(0.15, Math.min(35 / currentWidth, 2.0));
        obj.controls.mtr.x = -spacingFactor; obj.controls.move.x = spacingFactor;
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
                updateControlsSpacing(transform.target); return result;
            };
            const renderBar = (ctx, left, top, style, fabricObject) => {
                ctx.save(); ctx.translate(left, top); ctx.rotate(fabric.util.degreesToRadians(fabricObject.angle));
                ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#8b5cf6'; ctx.lineWidth = 1;
                ctx.beginPath(); ctx.roundRect(-4, -10, 8, 20, 4); ctx.fill(); ctx.stroke(); ctx.restore();
            };
            controls.ml = new fabric.Control({ x: -0.5, y: 0, cursorStyle: 'ew-resize', actionHandler: widthHandler, render: renderBar });
            controls.mr = new fabric.Control({ x: 0.5, y: 0, cursorStyle: 'ew-resize', actionHandler: widthHandler, render: renderBar });
        }
        obj.controls = controls;
        updateControlsSpacing(obj);
    }

    // Zoom & Pan
    canvas.on('mouse:wheel', function(opt) {
        var delta = opt.e.deltaY;
        var zoom = canvas.getZoom();
        zoom *= 0.999 ** delta;
        if (zoom > 20) zoom = 20; if (zoom < 0.1) zoom = 0.1;
        canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
        opt.e.preventDefault(); opt.e.stopPropagation();
    });
    canvas.on('mouse:down', function(opt) {
        var evt = opt.e;
        if (!canvas.getActiveObject()) { 
            isDragging = true; canvas.selection = false;
            lastPosX = evt.clientX || evt.touches[0].clientX;
            lastPosY = evt.clientY || evt.touches[0].clientY;
        }
    });
    canvas.on('mouse:move', function(opt) {
        if (isDragging) {
            var e = opt.e;
            var vpt = canvas.viewportTransform;
            var clientX = e.clientX || e.touches[0].clientX;
            var clientY = e.clientY || e.touches[0].clientY;
            vpt[4] += clientX - lastPosX;
            vpt[5] += clientY - lastPosY;
            canvas.requestRenderAll();
            lastPosX = clientX; lastPosY = clientY;
        }
    });
    canvas.on('mouse:up', function(opt) {
        canvas.setViewportTransform(canvas.viewportTransform);
        isDragging = false; canvas.selection = true;
    });

    function setZoom(val) { canvas.zoomToPoint(new fabric.Point(canvas.width / 2, canvas.height / 2), val); }
    dom.btnZoomIn.onclick = () => setZoom(canvas.getZoom() * 1.1);
    dom.btnZoomOut.onclick = () => setZoom(canvas.getZoom() * 0.9);
    
    function fitAndCenterImage() {
        if (!artboardImage) return;
        canvas.setViewportTransform([1, 0, 0, 1, 0, 0]); 
        
        artboardImage.set({ originX: 'center', originY: 'center', left: canvas.width / 2, top: canvas.height / 2 });
        artboardImage.setCoords();

        const rect = artboardImage.getBoundingRect();
        const padding = 40;
        const scaleX = (dom.container.offsetWidth - padding) / rect.width;
        const scaleY = (dom.container.offsetHeight - padding) / rect.height;
        const zoom = Math.min(scaleX, scaleY);

        canvas.zoomToPoint(new fabric.Point(canvas.width / 2, canvas.height / 2), zoom);
        const vpt = canvas.viewportTransform;
        vpt[4] = (dom.container.offsetWidth / 2) - (canvas.width / 2) * zoom;
        vpt[5] = (dom.container.offsetHeight / 2) - (canvas.height / 2) * zoom;
        canvas.requestRenderAll();
    }
    dom.btnZoomFit.onclick = fitAndCenterImage;

    // Load Background
    function loadBackgroundImage(file) {
        if(!file) return;
        const reader = new FileReader();
        reader.onload = (f) => {
            fabric.Image.fromURL(f.target.result, (img) => {
                if (artboardImage) canvas.remove(artboardImage);
                dom.placeholder.style.display = 'none';
                
                img.set({
                    originX: 'center', originY: 'center',
                    selectable: false, evented: false,
                    hasControls: false, hasBorders: false,
                    shadow: null 
                });
                
                artboardImage = img;
                canvas.add(img); 
                img.sendToBack(); 
                fitAndCenterImage();
                saveState();
            });
        };
        reader.readAsDataURL(file);
    }

    dom.btnLoadImg.onclick = () => dom.headerImgUpload.click();
    dom.headerImgUpload.onchange = (e) => loadBackgroundImage(e.target.files[0]);

    dom.btnOpenBgTools.onclick = () => {
        dom.editorToolbar.classList.remove('hidden');
        dom.toolbarMainMenu.classList.add('hidden');
        dom.subBackground.classList.remove('hidden');
    };
    dom.btnBgReplace.onclick = () => dom.bgReplaceUpload.click();
    dom.bgReplaceUpload.onchange = (e) => loadBackgroundImage(e.target.files[0]);

    dom.btnBgRotate.onclick = () => {
        if (!artboardImage) return;
        artboardImage.rotate((artboardImage.angle + 90) % 360);
        fitAndCenterImage();
        saveState();
    };

    dom.btnCloseBgTools.onclick = () => {
        dom.editorToolbar.classList.add('hidden');
        canvas.discardActiveObject();
    };

    // UI Init
    fonts.forEach(font => {
        const btn = document.createElement('button');
        btn.className = 'font-btn'; btn.textContent = font.label; btn.style.fontFamily = font.name;
        btn.onclick = () => {
            const obj = canvas.getActiveObject();
            if (obj && obj.type === 'textbox') {
                WebFont.load({ google: { families: [font.name] }, active: () => canvas.requestRenderAll() });
                obj.set('fontFamily', font.name); canvas.requestRenderAll(); saveState();
                document.querySelectorAll('.font-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active');
            }
        };
        dom.fontListContainer.appendChild(btn);
    });

    palette.forEach(color => {
        const div = document.createElement('div'); div.className = 'color-dot'; div.style.backgroundColor = color;
        div.onclick = () => {
            const obj = canvas.getActiveObject();
            if(obj && obj.type === 'textbox') { obj.set('fill', color); dom.textColorPreview.style.backgroundColor = color; canvas.requestRenderAll(); saveState(); }
        };
        dom.quickColorPalette.appendChild(div);
    });

    const clearBtn = document.createElement('div');
    clearBtn.className = 'color-dot border-red-200 relative'; clearBtn.style.background = 'white'; 
    clearBtn.innerHTML = '<div class="absolute inset-0 m-auto w-full h-0.5 bg-red-400 rotate-45"></div>';
    clearBtn.onclick = () => { setOutlineWidth(0); closeAllPopups(); };
    dom.outlineQuickColors.appendChild(clearBtn);

    palette.forEach(color => {
        const div = document.createElement('div'); div.className = 'color-dot'; div.style.backgroundColor = color;
        div.onclick = () => { setOutlineColor(color); closeAllPopups(); };
        dom.outlineQuickColors.appendChild(div);
    });

    const widthPresets = [1, 1.5, 2, 3, 4, 5, 6, 7, 8];
    dom.outlineWidthPresets.innerHTML = '';
    const btnZero = document.createElement('button'); btnZero.className = 'preset-btn text-red-400 border-red-100'; btnZero.textContent = '無';
    btnZero.onclick = () => { setOutlineWidth(0); closeAllPopups(); };
    dom.outlineWidthPresets.appendChild(btnZero);

    widthPresets.forEach(w => {
        const btn = document.createElement('button'); btn.className = 'preset-btn'; btn.textContent = w;
        btn.onclick = () => { 
            setOutlineWidth(w); 
            const obj = canvas.getActiveObject();
            if(w > 0 && (!obj.stroke || obj.stroke === 'transparent')) { setOutlineColor(userPrefOutlineColor); }
            closeAllPopups(); 
        };
        dom.outlineWidthPresets.appendChild(btn);
    });

    document.querySelectorAll('.menu-cat-btn').forEach(btn => {
        btn.onclick = () => {
            const targetId = btn.dataset.target;
            if(targetId) {
                document.getElementById(targetId).classList.remove('hidden');
                dom.toolbarMainMenu.classList.add('hidden');
                syncSubMenuValues(targetId);
            }
        };
    });
    
    dom.backBtns.forEach(btn => {
        if (btn !== dom.btnCloseBgTools) {
            btn.onclick = () => {
                dom.subMenus.forEach(el => el.classList.add('hidden'));
                dom.toolbarMainMenu.classList.remove('hidden');
                closeAllPopups();
            };
        }
    });
    
    dom.btnCloseEditor.onclick = () => {
        dom.editorToolbar.classList.add('hidden');
        canvas.discardActiveObject(); canvas.requestRenderAll();
        closeAllPopups();
    };

    function syncSubMenuValues(targetId) {
        const obj = canvas.getActiveObject();
        if(!obj) return;
        if (targetId === 'sub-opacity') {
            const val = Math.round((obj.opacity || 1) * 100);
            dom.inputOpacityMain.value = val; 
            dom.valOpacityMain.textContent = val + '%';
        } else if (targetId === 'sub-rotate') {
            const val = Math.round(obj.angle % 360);
            dom.inputRotate.value = val; dom.rotateVal.textContent = val + '°';
        } else if (targetId === 'sub-outline') {
            const w = obj.strokeWidth || 0;
            dom.inputOutlineWidth.value = w;
            dom.displayOutlineWidth.textContent = w;
            dom.outlineColorPreview.style.backgroundColor = obj.stroke || '#ffffff';
        }
    }

    // Functionality
    function setFontSize(val) {
        const obj = canvas.getActiveObject();
        if (obj && obj.type === 'textbox') {
            obj.set({ fontSize: val, scaleX: 1, scaleY: 1 });
            dom.fontSizeDisplay.textContent = val; dom.inputFontSizeSlider.value = val;
            canvas.requestRenderAll(); updateFloatingMenu(); updateControlsSpacing(obj);
        }
    }
    dom.btnFontMinus.onclick = () => setFontSize(parseInt(dom.inputFontSizeSlider.value) - 2);
    dom.btnFontPlus.onclick = () => setFontSize(parseInt(dom.inputFontSizeSlider.value) + 2);
    dom.inputFontSizeSlider.oninput = (e) => setFontSize(parseInt(e.target.value));

    dom.inputText.oninput = (e) => {
        const obj = canvas.getActiveObject();
        if(obj && obj.type==='textbox') { obj.set('fill', e.target.value); dom.textColorPreview.style.backgroundColor = e.target.value; canvas.requestRenderAll(); }
    };

    function setOutlineWidth(val) {
        val = parseFloat(val);
        dom.inputOutlineWidth.value = val; dom.displayOutlineWidth.textContent = val;
        userPrefOutlineWidth = val; localStorage.setItem('pref_outline_width', val);
        const obj = canvas.getActiveObject();
        if(obj && obj.type === 'textbox') {
            obj.set({ 'strokeWidth': val, 'paintFirst': 'stroke', 'strokeLineJoin': 'round', 'strokeLineCap': 'round' });
            if (val > 0 && (!obj.stroke || obj.stroke === 'transparent' || obj.stroke === null)) { obj.set('stroke', userPrefOutlineColor); dom.outlineColorPreview.style.backgroundColor = userPrefOutlineColor; }
            canvas.requestRenderAll();
        }
    }
    dom.inputOutlineWidth.oninput = (e) => setOutlineWidth(e.target.value);

    function setOutlineColor(color) {
        dom.outlineColorPreview.style.backgroundColor = color; dom.inputOutlineColor.value = color;
        userPrefOutlineColor = color; localStorage.setItem('pref_outline_color', color);
        const obj = canvas.getActiveObject();
        if(obj && obj.type === 'textbox') { obj.set('stroke', color); if (obj.strokeWidth === 0) { setOutlineWidth(2); } canvas.requestRenderAll(); }
    }
    dom.inputOutlineColor.oninput = (e) => setOutlineColor(e.target.value);

    dom.btnOutlineWidthPreset.onclick = (e) => { e.stopPropagation(); const isHidden = dom.outlineWidthPresets.classList.contains('hidden'); closeAllPopups(); if(isHidden) dom.outlineWidthPresets.classList.remove('hidden'); };
    dom.btnToggleOutlineColor.onclick = (e) => { e.stopPropagation(); const isHidden = dom.outlineColorPicker.classList.contains('hidden'); closeAllPopups(); if(isHidden) dom.outlineColorPicker.classList.remove('hidden'); };
    function closeAllPopups() { dom.outlineWidthPresets.classList.add('hidden'); dom.outlineColorPicker.classList.add('hidden'); }
    document.addEventListener('click', closeAllPopups);
    dom.outlineWidthPresets.addEventListener('click', (e) => e.stopPropagation());
    dom.outlineColorPicker.addEventListener('click', (e) => e.stopPropagation());

    dom.btnLayerTop.onclick = () => { const o=canvas.getActiveObject(); if(o) o.bringToFront(); saveState(); };
    dom.btnLayerBottom.onclick = () => { const o=canvas.getActiveObject(); if(o) { o.sendToBack(); if(artboardImage) artboardImage.sendToBack(); } saveState(); };
    dom.btnLayerUp.onclick = () => { const o=canvas.getActiveObject(); if(o) o.bringForward(); saveState(); };
    dom.btnLayerDown.onclick = () => { const o=canvas.getActiveObject(); if(o) { o.sendBackwards(); if(artboardImage) artboardImage.sendToBack(); } saveState(); };
    
    function updateOpacity(value) {
        const val = parseInt(value);
        dom.inputOpacityFloat.value = val;
        dom.valOpacityFloat.textContent = val;
        dom.inputOpacityMain.value = val;
        dom.valOpacityMain.textContent = val + '%';
        const o = canvas.getActiveObject();
        if(o) {
            o.set('opacity', val / 100);
            canvas.requestRenderAll();
        }
    }
    dom.inputOpacityFloat.oninput = (e) => updateOpacity(e.target.value);
    dom.inputOpacityMain.oninput = (e) => updateOpacity(e.target.value);

    dom.inputRotate.oninput = (e) => { const v=parseInt(e.target.value); dom.rotateVal.textContent=v+'°'; const o=canvas.getActiveObject(); if(o) { o.rotate(v); canvas.requestRenderAll(); updateFloatingMenu(); }};
    dom.btnRotate90.onclick = () => { const o=canvas.getActiveObject(); if(o) { let a=(Math.round(o.angle/90)*90+90)%360; o.rotate(a); dom.inputRotate.value=a; dom.rotateVal.textContent=a+'°'; canvas.requestRenderAll(); updateFloatingMenu(); saveState(); }};
    dom.btnToolbarFlip.onclick = () => { const o=canvas.getActiveObject(); if(o) { o.set('flipX', !o.flipX); canvas.renderAll(); saveState(); }};

    function updateFloatingMenu() {
        const obj = canvas.getActiveObject();
        if (!obj || obj === artboardImage || canvas.isDrawingMode || obj.isMoving || obj.isScaling || obj.isRotating) { dom.floatingMenu.classList.add('hidden'); return; }
        dom.floatingMenu.classList.remove('hidden'); requestAnimationFrame(() => dom.floatingMenu.style.opacity = '1');
        if (obj.lockMovementX) { dom.menuStandard.classList.add('hidden'); dom.menuLocked.classList.remove('hidden'); } else { dom.menuStandard.classList.remove('hidden'); dom.menuLocked.classList.add('hidden'); }
        const cr = canvas.getElement().getBoundingClientRect(); const or = obj.getBoundingRect(); const mr = dom.floatingMenu.getBoundingClientRect();
        let top = cr.top + or.top - mr.height - 55; if (top < 60) top = cr.top + or.top + or.height + 55;
        let left = cr.left + or.left + (or.width / 2);
        dom.floatingMenu.style.top = `${top}px`; dom.floatingMenu.style.left = `${left}px`; dom.floatingMenu.style.transform = 'translateX(-50%)';
    }

    canvas.on('selection:created', onSelected);
    canvas.on('selection:updated', onSelected);
    canvas.on('object:scaling', (e) => { updateFloatingMenu(); updateToolbarUI(e.target); updateControlsSpacing(e.target); });
    canvas.on('object:moving', updateFloatingMenu); canvas.on('object:rotating', updateFloatingMenu);
    canvas.on('object:modified', () => { updateFloatingMenu(); updateToolbarUI(canvas.getActiveObject()); saveState(); }); 
    canvas.on('selection:cleared', () => {
        dom.floatingMenu.classList.add('hidden'); dom.editorToolbar.classList.add('hidden'); dom.stickerDrawer.classList.add('translate-y-full');
        dom.subMenus.forEach(el => el.classList.add('hidden')); dom.toolbarMainMenu.classList.remove('hidden'); closeAllPopups();
    });

    function updateToolbarUI(obj) {
        if (!obj) return;
        if (obj.type === 'textbox') {
            const size = Math.round(obj.fontSize * obj.scaleX);
            dom.fontSizeDisplay.textContent = size; dom.inputFontSizeSlider.value = size;
            dom.textColorPreview.style.backgroundColor = obj.fill;
            dom.outlineColorPreview.style.backgroundColor = obj.stroke || '#ffffff';
            dom.displayOutlineWidth.textContent = obj.strokeWidth || 0; dom.inputOutlineWidth.value = obj.strokeWidth || 0;
        }
        const opacity = Math.round((obj.opacity || 1) * 100);
        dom.inputOpacityFloat.value = opacity;
        dom.valOpacityFloat.textContent = opacity;
        dom.inputOpacityMain.value = opacity;
        dom.valOpacityMain.textContent = opacity + '%';
        dom.inputRotate.value = Math.round(obj.angle % 360); dom.rotateVal.textContent = dom.inputRotate.value + '°';
    }

    function onSelected(e) {
        const obj = e.selected[0];
        if (obj === artboardImage) { canvas.discardActiveObject(); return; }
        updateFloatingMenu();
        if (!obj.lockMovementX) {
            dom.editorToolbar.classList.remove('hidden');
            dom.subBackground.classList.add('hidden');
            dom.toolbarMainMenu.classList.remove('hidden');
            if (obj.type === 'textbox') { dom.groupTextOnly.classList.remove('hidden'); } else { dom.groupTextOnly.classList.add('hidden'); }
            updateToolbarUI(obj);
        } else {
            dom.editorToolbar.classList.add('hidden');
        }
    }

    // ---------------------------------------------------------
    // 批次處理邏輯 (三種模式：預設 / 資料夾 / ZIP)
    // ---------------------------------------------------------
    dom.btnBatchMode.onclick = () => {
        if (!artboardImage) return alert('請先載入一張底圖並設計好您的樣板（文字、貼圖）');
        dom.batchImgUpload.click();
    };

    dom.batchImgUpload.onchange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        
        batchFilesQueue = files;
        dom.batchSettingsModal.classList.remove('hidden');
        dom.batchImgUpload.value = '';
    };

    dom.btnCancelBatch.onclick = () => {
        batchFilesQueue = [];
        dom.batchSettingsModal.classList.add('hidden');
    };

    // 開始按鈕：判斷模式並獲取權限
    dom.btnStartBatch.onclick = async () => {
        if (batchFilesQueue.length === 0) return;
        
        const mode = document.querySelector('input[name="batch-mode"]:checked').value; // 'default', 'folder', or 'zip'
        const suffix = dom.batchSuffixInput.value || '';
        
        dom.batchSettingsModal.classList.add('hidden');

        let dirHandle = null;

        // 如果選擇「指定資料夾」，需要先取得權限
        if (mode === 'folder') {
            if ('showDirectoryPicker' in window) {
                try {
                    dirHandle = await window.showDirectoryPicker();
                } catch (err) {
                    // 使用者取消選擇，停止執行
                    console.log('User cancelled folder picker');
                    return; 
                }
            } else {
                alert('您的瀏覽器不支援「指定資料夾」功能 (僅 Chrome/Edge 電腦版支援)。\n將自動切換為「瀏覽器預設位置」模式。');
            }
        }

        await processBatch(batchFilesQueue, mode, suffix, dirHandle);
    };

    async function processBatch(files, mode, suffix, dirHandle) {
        dom.batchModal.classList.remove('hidden');
        updateBatchProgress(0, files.length);

        const originalJSON = canvas.toJSON();
        const originalBg = artboardImage; 

        // 智慧相對位置計算
        canvas.setViewportTransform([1,0,0,1,0,0]); 
        const bgRect = originalBg.getBoundingRect();
        const bgWidth = bgRect.width;
        const bgHeight = bgRect.height;
        const bgLeft = bgRect.left;
        const bgTop = bgRect.top;

        const overlays = canvas.getObjects().filter(o => o !== originalBg);
        
        const relativeObjects = overlays.map(obj => {
            const objCenter = obj.getCenterPoint();
            const relX = (objCenter.x - bgLeft) / bgWidth;
            const relY = (objCenter.y - bgTop) / bgHeight;
            const scaleRatioToBgWidth = obj.scaleX / bgWidth;

            return {
                object: obj,
                relX, relY,
                scaleRatioToBgWidth
            };
        });

        // 初始化 ZIP (如果模式是 zip)
        let zip = null;
        let folder = null;
        if (mode === 'zip') {
            zip = new JSZip();
            folder = zip.folder("batch_output");
        }

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                updateBatchProgress(i + 1, files.length);

                const imgUrl = await readFileAsDataURL(file);
                
                canvas.clear();
                canvas.setBackgroundColor('#ffffff', null);

                // 等待圖片載入與圖層複製
                await new Promise(resolve => {
                    fabric.Image.fromURL(imgUrl, async (img) => {
                        canvas.setWidth(img.width);
                        canvas.setHeight(img.height);
                        
                        img.set({
                            originX: 'center', originY: 'center',
                            left: canvas.width / 2, top: canvas.height / 2,
                            selectable: false
                        });
                        canvas.add(img);
                        
                        const newBgWidth = img.width;
                        const newBgHeight = img.height;
                        
                        // 確保所有圖層(含圖片)都處理完
                        const clonePromises = relativeObjects.map(item => {
                            return new Promise(resolveClone => {
                                item.object.clone((cloned) => {
                                    const newLeft = (canvas.width / 2 - newBgWidth / 2) + (newBgWidth * item.relX);
                                    const newTop = (canvas.height / 2 - newBgHeight / 2) + (newBgHeight * item.relY);

                                    const newScaleX = newBgWidth * item.scaleRatioToBgWidth;
                                    const scaleFactor = newScaleX / item.object.scaleX;
                                    const newScaleY = item.object.scaleY * scaleFactor;

                                    cloned.set({
                                        left: newLeft,
                                        top: newTop,
                                        originX: 'center',
                                        originY: 'center',
                                        scaleX: newScaleX,
                                        scaleY: newScaleY
                                    });
                                    canvas.add(cloned);
                                    resolveClone();
                                });
                            });
                        });

                        await Promise.all(clonePromises);
                        resolve();
                    });
                });

                canvas.renderAll();
                const blob = await new Promise(resolve => canvas.getElement().toBlob(resolve, 'image/jpeg', 0.95));
                
                const originalName = file.name.replace(/\.[^/.]+$/, "");
                const newFileName = `${originalName}${suffix}.jpg`;

                // --- 依據模式儲存 ---
                if (mode === 'zip') {
                    // 模式 3: 加入 ZIP
                    folder.file(newFileName, blob);

                } else if (mode === 'folder' && dirHandle) {
                    // 模式 2: 指定資料夾 (API 寫入)
                    try {
                        const fileHandle = await dirHandle.getFileHandle(newFileName, { create: true });
                        const writable = await fileHandle.createWritable();
                        await writable.write(blob);
                        await writable.close();
                    } catch (err) {
                        console.error('File write failed, fallback to default download:', err);
                        downloadBlob(blob, newFileName); // 若寫入失敗則退回預設下載
                    }

                } else {
                    // 模式 1: 瀏覽器預設 (或模式2失敗退回)
                    downloadBlob(blob, newFileName);
                    // 延遲以避免瀏覽器阻擋連續下載
                    await new Promise(r => setTimeout(r, 600));
                }
            }

            // 若為 ZIP 模式，最後觸發下載
            if (mode === 'zip') {
                const content = await zip.generateAsync({ type: "blob" });
                downloadBlob(content, `batch_download_${Date.now()}.zip`);
            }

        } catch (err) {
            console.error(err);
            alert('批次處理發生錯誤: ' + err.message);
        } finally {
            dom.batchModal.classList.add('hidden');
            batchFilesQueue = []; 
            
            canvas.loadFromJSON(originalJSON, () => {
                const objs = canvas.getObjects();
                objs.forEach(o => {
                   if (!o.selectable && o.type === 'image') artboardImage = o;
                   else styleControls(o, o.type==='textbox'); 
                });
                
                canvas.setBackgroundColor('#d1d5db', null);
                resizeCanvas();
            });
        }
    }

    function downloadBlob(blob, fileName) {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    }

    function updateBatchProgress(current, total) {
        const pct = Math.round((current / total) * 100);
        dom.batchProgressBar.style.width = `${pct}%`;
        dom.batchStatusText.textContent = `${current} / ${total}`;
    }

    function readFileAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // Export Logic
    document.getElementById('btn-download').onclick = () => {
        if(!artboardImage && canvas.getObjects().length===0) return alert('空畫布');
        const originalVpt = canvas.viewportTransform;
        const originalBg = canvas.backgroundColor;
        canvas.discardActiveObject();
        canvas.setBackgroundColor('#ffffff', null); 
        let opt = { format: 'jpeg', quality: 0.95, enableRetinaScaling: false };
        if(artboardImage) {
            canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
            const rect = artboardImage.getBoundingRect();
            opt.left = Math.ceil(rect.left)+5;
            opt.top = Math.ceil(rect.top)+5;
            opt.width = Math.floor(rect.width)-10;
            opt.height = Math.floor(rect.height)-10;
            opt.multiplier = 1 / artboardImage.scaleX;
        } else { opt.multiplier = 4; }
        const dataURL = canvas.toDataURL(opt);
        canvas.setBackgroundColor(originalBg, null);
        canvas.setViewportTransform(originalVpt);
        canvas.requestRenderAll();
        const link = document.createElement('a'); 
        link.download = `canva-pro-${Date.now()}.jpg`;
        link.href = dataURL; link.click();
    };

    // Clear Modal Logic
    dom.btnShowClearModal.onclick = () => dom.clearModal.classList.remove('hidden');
    dom.btnCloseModal.onclick = () => dom.clearModal.classList.add('hidden');
    dom.btnClearAll.onclick = () => {
        canvas.clear(); 
        canvas.setBackgroundColor('#d1d5db',null); 
        artboardImage=null; 
        dom.placeholder.style.display='flex'; 
        dom.btnZoomFit.click();
        dom.clearModal.classList.add('hidden');
    };
    dom.btnClearObjects.onclick = () => {
        canvas.getObjects().forEach(obj => {
            if (obj !== artboardImage) canvas.remove(obj);
        });
        dom.clearModal.classList.add('hidden');
        canvas.requestRenderAll();
        saveState();
    };

    document.getElementById('btn-add-text').onclick = () => { 
        const t = new fabric.Textbox('雙擊編輯', { left: canvas.width/2, top: canvas.height/2, width: 300, fontSize: 40, fontFamily: 'Noto Sans TC', fill: '#333333', originX: 'center', originY: 'center', textAlign: 'center', splitByGrapheme: true, paintFirst: 'stroke', strokeLineJoin: 'round', strokeLineCap: 'round', strokeWidth: userPrefOutlineWidth, stroke: userPrefOutlineColor }); 
        canvas.add(t); canvas.setActiveObject(t); styleControls(t, true); 
    };

    const drawer = dom.stickerDrawer;
    function initStickers() {
        Object.keys(stickers).forEach((cat, index) => {
            const btn = document.createElement('button'); btn.className = `tab-btn ${index===0?'active':''}`; btn.textContent = cat;
            btn.onclick = () => { document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); renderStickerContent(cat); };
            dom.stickerTabs.appendChild(btn);
        });
        renderStickerContent(Object.keys(stickers)[0]);
    }
    function renderStickerContent(cat) {
        dom.stickerContainer.innerHTML = '';
        stickers[cat].forEach(item => {
            const div = document.createElement('div'); div.className = 'sticker-item';
            if(typeof item === 'string') {
                div.textContent = item; div.onclick = () => { const t = new fabric.Text(item, { left: canvas.width/2, top: canvas.height/2, fontSize: 80, originX: 'center', originY: 'center' }); canvas.add(t); canvas.setActiveObject(t); styleControls(t, false); closeDrawer(); };
            } else {
                const img = document.createElement('img'); img.src = item.url; img.className = 'sticker-img'; div.appendChild(img);
                div.onclick = () => { fabric.Image.fromURL(item.url, (obj) => { const s=(canvas.width*0.15)/obj.width; obj.set({left:canvas.width/2,top:canvas.height/2,scaleX:s,scaleY:s,originX:'center',originY:'center'}); canvas.add(obj); canvas.setActiveObject(obj); styleControls(obj, false); closeDrawer(); }); };
            }
            dom.stickerContainer.appendChild(div);
        });
    }
    function closeDrawer() { drawer.classList.add('translate-y-full'); saveState(); }
    document.getElementById('btn-stickers').onclick = () => { drawer.classList.remove('translate-y-full'); };
    document.getElementById('close-sticker-drawer').onclick = closeDrawer;
    
    document.getElementById('btn-upload-sticker').onclick = () => document.getElementById('sticker-upload').click();
    document.getElementById('sticker-upload').onchange = (e) => {
        const f = e.target.files[0]; if(!f) return; const r = new FileReader();
        r.onload = (ev) => { fabric.Image.fromURL(ev.target.result, (img) => { const s = (canvas.width * 0.3) / img.width; img.set({ left: canvas.width/2, top: canvas.height/2, scaleX: s, scaleY: s, originX: 'center', originY: 'center' }); canvas.add(img); canvas.setActiveObject(img); styleControls(img, false); }); }; r.readAsDataURL(f);
    };

    document.getElementById('btn-lock').onclick = () => { const o=canvas.getActiveObject(); if(o) { o.set({lockMovementX:true, lockMovementY:true, lockRotation:true, lockScalingX:true, lockScalingY:true, selectable:true}); o.hasControls=false; o.borderColor='#9ca3af'; canvas.requestRenderAll(); updateFloatingMenu(); }};
    document.getElementById('btn-unlock').onclick = () => { const o=canvas.getActiveObject(); if(o) { o.set({lockMovementX:false, lockMovementY:false, lockRotation:false, lockScalingX:false, lockScalingY:false}); o.hasControls=true; o.borderColor='#8b5cf6'; canvas.requestRenderAll(); updateFloatingMenu(); }};
    document.getElementById('btn-delete').onclick = () => { const o=canvas.getActiveObject(); if(o) canvas.remove(o); dom.floatingMenu.classList.add('hidden'); };
    document.getElementById('btn-duplicate').onclick = () => { const o=canvas.getActiveObject(); if(o) o.clone((c) => { canvas.discardActiveObject(); c.set({left:o.left+20,top:o.top+20}); canvas.add(c); canvas.setActiveObject(c); styleControls(c, c.type==='textbox'); }); };
    
    function saveState() { dom.saveStatus.textContent = '已儲存'; setTimeout(() => dom.saveStatus.textContent = '', 2000); }
    initStickers();
});