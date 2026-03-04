import { apiRequest } from './api.js';
import { setCurrentUserId, loadPlayerData } from './gameCore.js';
import { showGameScreen } from './ui.js';

async function checkSession() {
    try {
        const user = await apiRequest('/account');
        setCurrentUserId(user.$id);
        await loadPlayerData(user.$id);
        showGameScreen();
    } catch (error) {
        console.log('请登录');
    }
}

checkSession();