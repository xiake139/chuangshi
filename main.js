// ==================== 启动 ====================
(async function init() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }

    async function start() {
        try {
            // 尝试获取当前登录用户
            const user = await appwriteAccount.get();
            userId = user.$id;
            await loadGameData();
            currentTab = 'status';
            addLog('连接至创世世界');
        } catch (e) {
            // 未登录或会话无效，留在登录界面
            console.log('用户未登录', e);
        }
        render();
    }
})();