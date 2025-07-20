// textSelectionDictionary.js
const myQuery = `
查華語	https://dict.revised.moe.edu.tw/search.jsp?md=1&word=
看四縣	https://gnisew.github.io/tools/dict/sixian.html?cas=
找海陸	https://gnisew.github.io/tools/dict/hailu.html?cas=
尋詔安	https://gnisew.github.io/tools/dict/index.html?cas=
覓南四縣	https://gnisew.github.io/tools/dict/sixiannan.html?cas=
查臺台語	https://sutian.moe.edu.tw/zh-hant/tshiau/?lui=tai_su&tsha=
`;

(function() {
    // 解析 myQuery 字串
    function parseMyQuery(queryString) {
        return queryString.trim().split('\n').reduce((acc, line) => {
            const [name, url] = line.split('\t').map(item => item.trim());
            if (name && url) {
                acc[name] = url;
            }
            return acc;
        }, {});
    }

    // 創建樣式
    function createStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .tsd-popup {
                display: none;
                position: absolute;
                background-color: #f9f9f9;
                border: 1px solid #ccc;
                padding: 5px;
                border-radius: 5px;
                box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                z-index: 1000;
            }
            .tsd-popup a {
                display: block;
                padding: 5px 10px;
                text-decoration: none;
                color: #333;
            }
            .tsd-popup a:hover {
                background-color: #e9e9e9;
            }
        `;
        document.head.appendChild(style);
    }

    // 創建彈出框
	function createPopup(queries) {
		const popup = document.createElement('div');
		popup.className = 'tsd-popup';
		popup.innerHTML = Object.keys(queries).map(name => 
			`<a href="#" class="tsd-query-link" data-query="${name}" target="_blank">${name}</a>`
		).join('');
		document.body.appendChild(popup);
		return popup;
	}

    // 主要功能
    function init() {
        const queries = parseMyQuery(myQuery);
        createStyles();
        const popup = createPopup(queries);

        document.addEventListener('mouseup', function(event) {
            const selection = window.getSelection().toString().trim();
            if (selection) {
                popup.style.display = 'block';
                popup.style.left = `${event.pageX - 20}px`;
                popup.style.top = `${event.pageY + 10}px`;
                
                popup.querySelectorAll('.tsd-query-link').forEach(link => {
                    const queryName = link.getAttribute('data-query');
                    const baseUrl = queries[queryName];
                    link.href = `${baseUrl}${encodeURIComponent(selection)}`;
                });
            } else {
                popup.style.display = 'none';
            }
        });

        document.addEventListener('mousedown', function(event) {
            if (!popup.contains(event.target)) {
                popup.style.display = 'none';
            }
        });

        popup.addEventListener('mousedown', function(event) {
            event.stopPropagation();
        });

        popup.addEventListener('mouseup', function(event) {
            event.stopPropagation();
        });

        popup.querySelectorAll('.tsd-query-link').forEach(link => {
            link.addEventListener('click', function(event) {
                event.stopPropagation();
            });
        });
    }

    // 暴露初始化函數到全局作用域
    window.initTextSelectionDictionary = init;
})();