// 數據整理
let data = `
年級	班級	性別	你喜歡哪幾關？請選三個。
3	乙	生理女	02 彈力風火輪, 05 浮沉子, 09 磁力彈弓
3	乙	生理男	01 吸管氣球火箭, 03 進擊的毛根, 08 手搖吸塵器
3	乙	生理男	03 進擊的毛根, 05 浮沉子, 07 吸管幫浦
3	乙	生理男	05 浮沉子, 07 吸管幫浦, 09 磁力彈弓
3	乙	生理男	02 彈力風火輪, 06 液體大力士, 09 磁力彈弓
3	乙	生理男	05 浮沉子, 06 液體大力士, 09 磁力彈弓
3	乙	生理男	06 液體大力士, 07 吸管幫浦, 09 磁力彈弓
3	乙	生理女	02 彈力風火輪, 03 進擊的毛根, 09 磁力彈弓
3	乙	生理男	02 彈力風火輪, 08 手搖吸塵器, 09 磁力彈弓
3	乙	生理男	01 吸管氣球火箭, 02 彈力風火輪, 06 液體大力士, 07 吸管幫浦, 08 手搖吸塵器, 10 魔幻變色鏡
3	乙	生理女	02 彈力風火輪, 07 吸管幫浦, 09 磁力彈弓
3	乙	生理女	06 液體大力士, 07 吸管幫浦, 10 魔幻變色鏡
3	乙	生理男	02 彈力風火輪, 07 吸管幫浦, 10 魔幻變色鏡
3	乙	生理女	01 吸管氣球火箭, 02 彈力風火輪, 03 進擊的毛根
3	乙	生理女	01 吸管氣球火箭, 05 浮沉子, 09 磁力彈弓
3	乙	生理女	07 吸管幫浦, 09 磁力彈弓, 10 魔幻變色鏡
5	甲	生理女	01 吸管氣球火箭, 02 彈力風火輪, 03 進擊的毛根
5	甲	生理女	01 吸管氣球火箭, 05 浮沉子, 08 手搖吸塵器
5	甲	生理女	01 吸管氣球火箭, 02 彈力風火輪, 09 磁力彈弓
5	甲	生理女	01 吸管氣球火箭, 02 彈力風火輪, 10 魔幻變色鏡
5	甲	生理女	06 液體大力士, 08 手搖吸塵器, 10 魔幻變色鏡
5	甲	生理男	02 彈力風火輪, 04 爆走毛刷, 09 磁力彈弓
5	甲	生理男	02 彈力風火輪, 07 吸管幫浦, 09 磁力彈弓
5	乙	生理女	03 進擊的毛根, 09 磁力彈弓, 10 魔幻變色鏡
5	甲	生理女	03 進擊的毛根, 05 浮沉子, 07 吸管幫浦
5	甲	生理男	02 彈力風火輪, 03 進擊的毛根, 09 磁力彈弓
5	甲	生理男	01 吸管氣球火箭, 04 爆走毛刷, 06 液體大力士
5	甲	生理女	01 吸管氣球火箭, 09 磁力彈弓, 10 魔幻變色鏡
5	甲	生理男	01 吸管氣球火箭, 03 進擊的毛根, 04 爆走毛刷
5	甲	生理男	01 吸管氣球火箭, 04 爆走毛刷, 05 浮沉子
3	甲	生理女	05 浮沉子, 08 手搖吸塵器, 10 魔幻變色鏡
3	甲	生理女	01 吸管氣球火箭, 06 液體大力士, 07 吸管幫浦
3	甲	生理男	05 浮沉子, 07 吸管幫浦, 09 磁力彈弓
3	甲	生理男	01 吸管氣球火箭, 02 彈力風火輪, 03 進擊的毛根
3	甲	生理女	02 彈力風火輪, 06 液體大力士, 08 手搖吸塵器
3	甲	生理男	01 吸管氣球火箭, 03 進擊的毛根, 07 吸管幫浦
3	甲	生理男	02 彈力風火輪, 03 進擊的毛根, 08 手搖吸塵器
3	甲	生理男	04 爆走毛刷, 08 手搖吸塵器, 10 魔幻變色鏡
3	甲	生理男	02 彈力風火輪, 04 爆走毛刷, 09 磁力彈弓
3	甲	生理女	01 吸管氣球火箭, 04 爆走毛刷, 06 液體大力士
3	甲	生理男	01 吸管氣球火箭, 06 液體大力士, 09 磁力彈弓
3	甲	生理女	02 彈力風火輪, 03 進擊的毛根, 05 浮沉子, 07 吸管幫浦, 09 磁力彈弓, 10 魔幻變色鏡
3	甲	生理女	02 彈力風火輪, 07 吸管幫浦, 09 磁力彈弓
3	甲	生理女	02 彈力風火輪, 07 吸管幫浦, 09 磁力彈弓
3	甲	生理男	03 進擊的毛根, 08 手搖吸塵器, 09 磁力彈弓
3	甲	生理男	01 吸管氣球火箭, 03 進擊的毛根, 06 液體大力士
4	乙	生理男	02 彈力風火輪
4	乙	生理男	01 吸管氣球火箭, 03 進擊的毛根, 04 爆走毛刷
4	乙	生理女	01 吸管氣球火箭, 02 彈力風火輪, 10 魔幻變色鏡
4	乙	生理男	02 彈力風火輪, 04 爆走毛刷, 05 浮沉子
4	乙	生理女	02 彈力風火輪, 03 進擊的毛根, 10 魔幻變色鏡
4	乙	生理女	01 吸管氣球火箭, 03 進擊的毛根, 06 液體大力士
4	乙	生理男	01 吸管氣球火箭, 09 磁力彈弓, 10 魔幻變色鏡
4	乙	生理男	02 彈力風火輪, 03 進擊的毛根, 04 爆走毛刷
4	乙	生理男	04 爆走毛刷, 05 浮沉子
4	乙	生理男	04 爆走毛刷, 05 浮沉子, 09 磁力彈弓
4	乙	生理女	02 彈力風火輪, 04 爆走毛刷, 05 浮沉子
4	乙	生理女	02 彈力風火輪, 03 進擊的毛根, 10 魔幻變色鏡
4	乙	生理女	03 進擊的毛根, 07 吸管幫浦, 09 磁力彈弓
4	乙	生理女	02 彈力風火輪, 04 爆走毛刷, 10 魔幻變色鏡
4	甲	生理女	01 吸管氣球火箭, 02 彈力風火輪, 03 進擊的毛根, 04 爆走毛刷, 05 浮沉子, 06 液體大力士, 07 吸管幫浦, 08 手搖吸塵器, 09 磁力彈弓, 10 魔幻變色鏡
4	甲	生理男	08 手搖吸塵器
4	甲	生理女	02 彈力風火輪, 03 進擊的毛根, 04 爆走毛刷
4	甲	生理女	05 浮沉子, 07 吸管幫浦, 10 魔幻變色鏡
4	甲	生理女	04 爆走毛刷
4	甲	生理男	01 吸管氣球火箭, 02 彈力風火輪, 03 進擊的毛根, 04 爆走毛刷, 05 浮沉子, 06 液體大力士, 07 吸管幫浦, 08 手搖吸塵器, 09 磁力彈弓, 10 魔幻變色鏡
4	甲	生理女	04 爆走毛刷
4	甲	生理男	03 進擊的毛根
4	甲	生理男	08 手搖吸塵器
4	甲	生理女	03 進擊的毛根, 08 手搖吸塵器, 09 磁力彈弓
4	甲	生理男	03 進擊的毛根, 04 爆走毛刷, 08 手搖吸塵器
4	甲	生理男	08 手搖吸塵器
4	甲	生理女	02 彈力風火輪, 04 爆走毛刷
`;

// 將原始數據轉換為所需的數據結構
function parseData(data) {
    const lines = data.trim().split('\n').filter((line, index) => index !== 0 && line.trim() !== ''); // 跳過第一行

    return lines.map(line => {
        const [grade, classGroup, gender, preferences] = line.split('\t');
        return {
            grade: grade.trim(),
            classGroup: classGroup.trim(),
            gender: gender.trim(),
            preferences: preferences.split(', ').map(pref => pref.trim())
        };
    });
}

let parsedData = parseData(data);

// 獲取所有年級、班級和性別
function getUniqueValues(data, key) {
    return Array.from(new Set(data.map(entry => entry[key])));
}

const grades = ['低', '中', '高'].concat(getUniqueValues(parsedData, 'grade'));
const classes = getUniqueValues(parsedData, 'classGroup');
const genders = getUniqueValues(parsedData, 'gender');

// 解析數據並獲取標題行
let headers = data.trim().split('\n')[0].split('\t');

// 動態生成選擇器
function createSelectors(containerId, index) {
    const container = document.getElementById(containerId);

    const gradeSelect = document.createElement('select');
    gradeSelect.id = `gradeSelect${index}`;
    gradeSelect.innerHTML = '<option value="all">全</option>' + grades.map(grade => `<option value="${grade}">${grade}</option>`).join('');

    const classSelect = document.createElement('select');
    classSelect.id = `classSelect${index}`;
    classSelect.innerHTML = '<option value="all">全</option>' + classes.map(classGroup => `<option value="${classGroup}">${classGroup}</option>`).join('');

    const genderSelect = document.createElement('select');
    genderSelect.id = `genderSelect${index}`;
    genderSelect.innerHTML = '<option value="all">全</option>' + genders.map(gender => `<option value="${gender}">${gender}</option>`).join('');

    const selectorDiv = document.createElement('div');
    selectorDiv.className = 'selector';
    selectorDiv.innerHTML = `
        <label for="gradeSelect${index}">[組${index}] ${headers[0]}:</label>
    `;
    selectorDiv.appendChild(gradeSelect);
    selectorDiv.innerHTML += `
        <label for="classSelect${index}">${headers[1]}:</label>
    `;
    selectorDiv.appendChild(classSelect);
    selectorDiv.innerHTML += `
        <label for="genderSelect${index}">${headers[2]}:</label>
    `;
    selectorDiv.appendChild(genderSelect);

    container.appendChild(selectorDiv);
}

// 初始化選擇器
function initializeSelectors() {
    const container = document.getElementById('selectors-container');
    container.innerHTML = ''; // 清空容器
    createSelectors('selectors-container', 1);
    createSelectors('selectors-container', 2);

    // 動態生成 displayType 選單
    const displayTypeSelect = document.createElement('select');
    displayTypeSelect.id = 'displayType';
    displayTypeSelect.innerHTML = `
        <option value="percentage">百分比</option>
        <option value="count">次數</option>
    `;

    const displayTypeDiv = document.createElement('div');
    displayTypeDiv.className = 'display-type';
    displayTypeDiv.appendChild(displayTypeSelect);

    document.getElementById('selectors-container').appendChild(displayTypeDiv);

    // 註冊篩選條件變更事件監聽器
    document.querySelectorAll('select').forEach(select => {
        select.addEventListener('change', handleSelectionChange);
    });
}

// 計算所有關卡的所有項目，確保所有項目都在圖表中
function getAllPreferences(data) {
    const allPreferences = new Set();
    data.forEach(entry => {
        entry.preferences.forEach(pref => {
            allPreferences.add(pref);
        });
    });
    return Array.from(allPreferences).sort();
}

// 計算各關卡被選擇的次數
function calculateCounts(filteredData, allPreferences) {
    const counts = {};
    allPreferences.forEach(pref => {
        counts[pref] = 0;
    });
    filteredData.forEach(entry => {
        entry.preferences.forEach(pref => {
            counts[pref]++;
        });
    });
    return counts;
}

// 根據篩選條件過濾數據
function filterData(data, grade, classGroup, gender) {
    return data.filter(entry => {
        let gradeCondition = false;
        if (grade === '低') {
            gradeCondition = entry.grade === '1' || entry.grade === '2';
        } else if (grade === '中') {
            gradeCondition = entry.grade === '3' || entry.grade === '4';
        } else if (grade === '高') {
            gradeCondition = entry.grade === '5' || entry.grade === '6';
        } else {
            gradeCondition = grade === 'all' || entry.grade === grade;
        }

        return gradeCondition &&
               (classGroup === 'all' || entry.classGroup === classGroup) &&
               (gender === 'all' || entry.gender === gender);
    });
}

// 更新圖表函數
function updateChart(chart, data1, data2, label1, label2, isPercentage) {
    const allPreferences = getAllPreferences(parsedData);
    const counts1 = calculateCounts(data1, allPreferences);
    const counts2 = calculateCounts(data2, allPreferences);

    const labels = allPreferences;
    const values1 = labels.map(label => isPercentage ? (counts1[label] / data1.length * 100).toFixed(2) : counts1[label]);
    const values2 = labels.map(label => isPercentage ? (counts2[label] / data2.length * 100).toFixed(2) : counts2[label]);

    chart.data.labels = labels;
    chart.data.datasets[0].label = label1;
    chart.data.datasets[0].data = values1;
    chart.data.datasets[1].label = label2;
    chart.data.datasets[1].data = values2;
    chart.update();
}

// 處理篩選條件變更
function handleSelectionChange() {
    const selectedGrade1 = document.getElementById('gradeSelect1').value;
    const selectedClass1 = document.getElementById('classSelect1').value;
    const selectedGender1 = document.getElementById('genderSelect1').value;

    const selectedGrade2 = document.getElementById('gradeSelect2').value;
    const selectedClass2 = document.getElementById('classSelect2').value;
    const selectedGender2 = document.getElementById('genderSelect2').value;

    const displayType = document.getElementById('displayType').value;
    const isPercentage = displayType === 'percentage';

    const filteredData1 = filterData(parsedData, selectedGrade1, selectedClass1, selectedGender1);
    const filteredData2 = filterData(parsedData, selectedGrade2, selectedClass2, selectedGender2);

    const label1 = `${selectedGrade1 === 'all' ? '全' + headers[0] : selectedGrade1 + headers[0]} + ${selectedClass1 === 'all' ? '全' + headers[1] : selectedClass1 + headers[1]} + ${selectedGender1 === 'all' ? '全' + headers[2] : selectedGender1}`;
    const label2 = `${selectedGrade2 === 'all' ? '全' + headers[0] : selectedGrade2 + headers[0]} + ${selectedClass2 === 'all' ? '全' + headers[1] : selectedClass2 + headers[1]} + ${selectedGender2 === 'all' ? '全' + headers[2] : selectedGender2}`;

    updateChart(myChart, filteredData1, filteredData2, label1, label2, isPercentage);
}

// 初始化圖表
const ctx = document.getElementById('myChart').getContext('2d');
const myChart = new Chart(ctx, {
    type: 'bar',
    data: {
        labels: [],
        datasets: [{
            label: '',
            data: [],
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
        }, {
            label: '',
            data: [],
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1
        }]
    },
    options: {
        scales: {
            y: {
                beginAtZero: true
            }
        }
    }
});

// 初次加載圖表
const initialData = filterData(parsedData, 'all', 'all', 'all');
updateChart(myChart, initialData, initialData, '第一組全', '第二組全', true); // 預設以百分比顯示

// 編輯區相關代碼
document.getElementById('toggle-editor').addEventListener('click', function() {
    const editor = document.getElementById('editor');
    editor.style.display = editor.style.display === 'none' ? 'block' : 'none';
	data = data.trim().split('\n').filter(line => line.trim() !== '').join('\n');
    document.getElementById('data-editor').value = data;
});

document.getElementById('reset-editor').addEventListener('click', function() {
    document.getElementById('data-editor').value = "";
});

document.getElementById('cancel-editor').addEventListener('click', function() {
    document.getElementById('editor').style.display = 'none';
});

document.getElementById('apply-editor').addEventListener('click', function() {
    const newData = document.getElementById('data-editor').value;
    try {
        // 更新 data 變量
        data = newData.trim();
        
        // 重新解析數據
        parsedData = parseData(data);

        // 更新全局變量 grades, classes, genders
        grades.splice(3, grades.length - 3, ...getUniqueValues(parsedData, 'grade'));
        classes.splice(0, classes.length, ...getUniqueValues(parsedData, 'classGroup'));
        genders.splice(0, genders.length, ...getUniqueValues(parsedData, 'gender'));

        // 重新初始化選擇器和圖表
        headers = data.trim().split('\n')[0].split('\t'); // 更新標題行
        initializeSelectors();
        const initialData = filterData(parsedData, 'all', 'all', 'all');
        updateChart(myChart, initialData, initialData, '第一組全', '第二組全', true);

        // 隱藏編輯區
        document.getElementById('editor').style.display = 'none';
    } catch (e) {
        alert('數據格式錯誤，請檢查後重試。');
    }
});

// 初始化選擇器
initializeSelectors();
