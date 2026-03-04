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
        // 忽略错误（可能没有会话）
    }
}

// 登录
async function login(email, password) {
    return apiRequest('/account/sessions/email', {
        method: 'POST',
        body: JSON.stringify({ email, password })
    });
}

// 获取当前用户
async function getAccount() {
    return apiRequest('/account');
}

// 注册
async function register(email, password, name) {
    // 先尝试登出，避免会话冲突
    await logoutIfAny();
    await apiRequest('/account', {
        method: 'POST',
        body: JSON.stringify({ userId: 'unique()', email, password, name })
    });
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
            await login(email, password);
            const user = await getAccount();
            setCurrentUserId(user.$id);
            await loadPlayerData(user.$id);
        } else {
            // 注册模式：必须输入角色名
            const roleName = roleNameInput.value.trim();
            if (!roleName) {
                authMessage.innerText = '请输入角色名';
                return;
            }
            await register(email, password, roleName);
            const user = await getAccount();
            setCurrentUserId(user.$id);
            // 显式创建玩家数据，并直接使用返回的数据
            const newPlayerData = await createPlayerData(user.$id, roleName);
            setPlayerData(newPlayerData);
            updateHeaderUI();
        }
        showGameScreen();
    } catch (error) {
        authMessage.innerText = error.message;
    }
});

document.getElementById('registerBtn').addEventListener('click', async () => {
    if (isLoginMode) switchSpan.click();
    document.getElementById('loginBtn').click();
});