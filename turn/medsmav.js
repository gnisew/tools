// 解析驗證規則
function parseRules() {
  return medsmav
    .trim()
    .split('\n')
    .map(line => {
      const [prefix, middle, suffix] = line.trim().split('\t');
      return { prefix, middle, suffix };
    });
}

// 驗證帳號和密碼
function validateCredentials(email, password) {
  const rules = parseRules();
  
  // 檢查是否為有效的電子郵件格式
  if (!email.includes('@')) {
    return "帳號格式錯誤";
  }
  
  const localPart = email.split('@')[0];
  
  // 檢查是否符合任一規則
  for (const rule of rules) {
    // 檢查帳號前綴
    const startsWithPrefix = localPart.startsWith(rule.prefix);
    
    // 檢查帳號中間部分
    const containsMiddle = rule.middle.endsWith('@') 
      ? localPart.endsWith(rule.middle.slice(0, -1))
      : localPart.includes(rule.middle);
    
    // 檢查密碼後綴
    const endsWithSuffix = password.endsWith(rule.suffix);
    
    if (startsWithPrefix && containsMiddle && endsWithSuffix) {
      return true;
    }
  }
  
  // 判斷錯誤類型
  let isEmailValid = false;
  
  for (const rule of rules) {
    const startsWithPrefix = localPart.startsWith(rule.prefix);
    const containsMiddle = rule.middle.endsWith('@') 
      ? localPart.endsWith(rule.middle.slice(0, -1))
      : localPart.includes(rule.middle);
    
    if (startsWithPrefix && containsMiddle) {
      isEmailValid = true;
      break;
    }
  }
  
  return isEmailValid ? "密碼錯誤" : "帳號錯誤";
}

// 處理表單提交
document.getElementById('loginForm').addEventListener('submit', function(e) {
  e.preventDefault();
  
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const errorMessage = document.getElementById('errorMessage');
  
  const validationResult = validateCredentials(email, password);
  
  if (validationResult === true) {
    // 登入成功
    errorMessage.textContent = '';
    
    // 隱藏登入表單，顯示主要內容
    document.getElementById('loginOverlay').style.display = 'none';
    document.getElementById('mainContent').style.display = 'block';
  } else {
    // 顯示錯誤訊息
    errorMessage.textContent = validationResult;
  }
});


let medsmav = `
jan	5@	4520
uio	0@	6606
`;