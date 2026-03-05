import { apiRequest } from './api.js';
import { setCurrentUserId, setPlayerData, createPlayerData, loadPlayerData } from './gameCore.js';
import { updateHeaderUI, showGameScreen } from './ui.js';

const authScreen = document.getElementById('authScreen');
const gameScreen = document.getElementById('gameScreen');
const emailInput = document.getElementById('emailInput');
const passwordInput = document.getElementById('passwordInput');
const roleNameInput = document.getElementById('roleNameInput');
const roleNameGroup = document.getElementById('roleNameGroup');
const authMessage = document.getElementById('authMessage');
const switchSpan = document.getElementById('switchToRegister');

let isLoginMode = true;

switchSpan.addEventListener('click', () => {
    isLoginMode = !isLoginMode;
    switchSpan.innerText = isLoginMode ? '没有账号？去注册' : '已有账号？去登录';
    document.getElementById('loginBtn').innerText = isLoginMode ? '登录' : '注册';
    document.getElementById('registerBtn').style.display = isLoginMode ? 'inline-block' : 'none';
    roleNameGroup.style.display = isLoginMode ? 'none' : 'block';
});

// 登出当前会话（忽略错误）
async function logoutIfAny() {
    try {
        await apiRequest('/account/sessions/current', { method: 'DELETE' });
    } catch (e) {
        // 忽略错误
    }
}

// 登录并获取用户
async function login(email, password) {
    await logoutIfAny();
    console.log('正在登录...');
    await apiRequest('/account/sessions/email', {
        method: 'POST',
        body: JSON.stringify({ email, password })
    });
    console.log('登录成功，获取用户信息...');
    return apiRequest('/account');
}

// 注册并获取用户
async function register(email, password, name) {
    await logoutIfAny();
    console.log('正在创建账户...');
    await apiRequest('/account', {
        method: 'POST',
        body: JSON.stringify({ userId: 'unique()', email, password, name })
    });
    console.log('账户创建成功，稍后尝试登录...');
    // 等待一小段时间确保账户生效
    await new Promise(resolve => setTimeout(resolve, 200));
    return login(email, password);
}

document.getElementById('loginBtn').addEventListener('click', async () => {
    console.log('登录按钮被点击');
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    if (!email || !password) {
        authMessage.innerText = '请输入邮箱和密码';
        return;
    }
    try {
        if (isLoginMode) {
            const user = await login(email, password);
            setCurrentUserId(user.$id);
            await loadPlayerData(user.$id);
        } else {
            const roleName = roleNameInput.value.trim();
            if (!roleName) {
                authMessage.innerText = '请输入角色名';
                return;
            }
            const user = await register(email, password, roleName);
            setCurrentUserId(user.$id);
            const newPlayerData = await createPlayerData(user.$id, roleName);
            setPlayerData(newPlayerData);
            updateHeaderUI();
        }
        showGameScreen();
    } catch (error) {
        console.error('认证错误:', error);
        authMessage.innerText = `错误: ${error.message || '未知错误'}`;
    }
});

document.getElementById('registerBtn').addEventListener('click', async () => {
    if (isLoginMode) switchSpan.click();
    document.getElementById('loginBtn').click();
});