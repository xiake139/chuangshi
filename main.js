import { account } from './appwrite.js';
import { setCurrentUserId, loadPlayerData } from './gameCore.js';
import { showGameScreen } from './ui.js';

async function checkSession() {
    try {
        const user = await account.get();
        setCurrentUserId(user.$id);
        await loadPlayerData(user.$id);
        showGameScreen();
    } catch (error) {
        console.log('请登录');
    }
}

checkSession();