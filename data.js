// ==================== 数据加载与保存 (Appwrite) ====================

/**
 * 加载游戏数据（玩家、背包、扩展数据）
 */
async function loadGameData() {
    try {
        const user = await appwriteAccount.get();
        userId = user.$id;

        // 尝试获取用户的游戏数据文档（文档 ID = 用户 ID）
        const document = await appwriteDatabases.getDocument(
            APPWRITE_DATABASE_ID,
            APPWRITE_COLLECTION_ID,
            userId
        );
        const data = document;

        // 从 JSON 字符串解析数据（因为存储时使用了 JSON.stringify）
        player = JSON.parse(data.player || '{}');
        inventory = JSON.parse(data.inventory || '[]');
        const ex = JSON.parse(data.extra || '{}');

        // 从 extra 对象中恢复各个扩展状态
        dailyCheckin = ex.dailyCheckin || { last: null, days: 0 };
        quests = ex.quests || [];
        friends = ex.friends || [];
        mails = ex.mails || [];
        guild = ex.guild || null;
        gachaHistory = ex.gachaHistory || [];
        pets = ex.pets || [];
        marketplace = ex.marketplace || [];
        dailyTasks = ex.dailyTasks || [];
        activeEvent = ex.activeEvent || null;
    } catch (error) {
        if (error.code === 404) {
            // 文档不存在，新用户，创建默认角色
            player = {
                name: '冒险者',
                level: 1,
                exp: 0,
                gold: 100,
                hp: 100,
                maxHp: 100,
                baseAttack: 15,
                baseDefense: 0,
                baseAgility: 0,
                baseMaxHp: 100,
                weapon: null,
                armor: null,
                accessory: null,
                pet: null,
                kills: 0,
            };
            inventory = [];
            dailyCheckin = { last: null, days: 0 };
            quests = [];
            friends = [];
            mails = [];
            guild = null;
            gachaHistory = [];
            pets = [];
            marketplace = [];
            dailyTasks = [];
            activeEvent = null;

            await saveCharacter();
        } else {
            throw error;
        }
    }

    // 后处理：补全可能缺失的字段
    player.baseAttack = player.baseAttack || 15;
    player.baseDefense = player.baseDefense || 0;
    player.baseAgility = player.baseAgility || 0;
    player.baseMaxHp = player.baseMaxHp || 100;
    player.hp = player.hp ?? player.maxHp;

    updateHp();
}

/**
 * 保存游戏数据
 */
async function saveCharacter() {
    if (!player) return;

    // 将要存储的数据进行 JSON 序列化
    const data = {
        player: JSON.stringify(player),
        inventory: JSON.stringify(inventory),
        extra: JSON.stringify({
            dailyCheckin,
            quests,
            friends,
            mails,
            guild,
            gachaHistory,
            pets,
            marketplace,
            dailyTasks,
            activeEvent,
        })
    };

    try {
        await appwriteDatabases.updateDocument(
            APPWRITE_DATABASE_ID,
            APPWRITE_COLLECTION_ID,
            userId,
            data
        );
        addLog('✅ 数据保存成功');
    } catch (error) {
        if (error.code === 404) {
            // 文档不存在，创建新文档
            await appwriteDatabases.createDocument(
                APPWRITE_DATABASE_ID,
                APPWRITE_COLLECTION_ID,
                userId,      // 使用用户 ID 作为文档 ID
                data
            );
            addLog('✅ 数据保存成功');
        } else {
            console.error('保存失败', error);
            addLog(`❌ 保存失败: ${error.message}`);
        }
    }
}

/**
 * 登出（清除本地状态并返回到登录界面）
 */
async function logout() {
    await appwriteAccount.deleteSession('current');
    userId = null;
    player = null;
    inventory = [];
    dailyCheckin = { last: null, days: 0 };
    quests = [];
    friends = [];
    mails = [];
    guild = null;
    gachaHistory = [];
    pets = [];
    marketplace = [];
    dailyTasks = [];
    activeEvent = null;
    currentTab = 'login';
    render();
}