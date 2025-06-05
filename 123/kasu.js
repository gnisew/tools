        (function() {
            const referrer = document.referrer;
            const currentHost = window.location.hostname;
            
            // 如果有來源網址且不包含 'kasu'，則跳轉
            if (referrer && !referrer.toLowerCase().includes('kasu') && referrer !== '') {
                // 檢查是否為直接輸入網址（沒有 referrer）
                if (referrer !== window.location.href) {
                    window.location.href = 'https://sites.google.com/view/oikasu';
                }
            }
        })();