import { account } from './appwrite.js';
import { createPlayerData, setCurrentUserId, loadPlayerData } from './gameCore.js';
import { showGameScreen } from './ui.js';

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

document.getElementById('loginBtn').addEventListener('click', async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    if (!email || !password) {
        authMessage.innerText = '请输入邮箱和密码';
        return;
    }
    try {
        if (isLoginMode) {
            await account.createEmailSession(email, password);
        } else {
            await account.create('unique()', email, password);
            await account.createEmailSession(email, password);
            let roleName = roleNameInput.value.trim() || '沈曦炎';
            const user = await account.get();
            await createPlayerData(user.$id, roleName);
        }
        const user = await account.get();
        setCurrentUserId(user.$id);
        await loadPlayerData(user.$id);
        showGameScreen();
    } catch (error) {
        authMessage.innerText = error.message;
    }
});

document.getElementById('registerBtn').addEventListener('click', async () => {
    if (isLoginMode) switchSpan.click();
    document.getElementById('loginBtn').click();
});