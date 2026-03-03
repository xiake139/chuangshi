// ==================== 辅助函数 ====================

/**
 * 添加日志消息
 */
function addLog(msg) {
    if (msg.includes('✅')) {
        gameLog = gameLog.filter(log => !log.includes('❌'));
    }
    gameLog.unshift(`[${new Date().toLocaleTimeString()}] ${msg}`);
    if (gameLog.length > 15) gameLog.pop();
    render();
}

/**
 * 计算玩家总属性（含装备、宠物）
 */
function calcPlayerStats() {
    if (!player) return { attack: 0, defense: 0, agility: 0, maxHp: 100 };
    
    let baseAtk = player.baseAttack || 15;
    let baseDef = player.baseDefense || 0;
    let baseAgi = player.baseAgility || 0;
    let baseMaxHp = player.baseMaxHp || 100;

    let equipAtk = 0, equipDef = 0, equipAgi = 0;
    if (player.weapon) {
        const w = player.weapon;
        equipAtk += w.atk || 0;
        equipDef += w.def || 0;
        equipAgi += w.agi || 0;
    }
    if (player.armor) {
        const a = player.armor;
        equipAtk += a.atk || 0;
        equipDef += a.def || 0;
        equipAgi += a.agi || 0;
    }
    if (player.accessory) {
        const ac = player.accessory;
        equipAtk += ac.atk || 0;
        equipDef += ac.def || 0;
        equipAgi += ac.agi || 0;
    }

    let petAtk = 0, petDef = 0, petAgi = 0;
    if (player.pet) {
        const p = player.pet;
        petAtk += p.atk || 0;
        petDef += p.def || 0;
        petAgi += p.agi || 0;
    }

    const totalAtk = baseAtk + equipAtk + petAtk;
    const totalDef = baseDef + equipDef + petDef;
    const totalAgi = baseAgi + equipAgi + petAgi;
    const totalMaxHp = baseMaxHp + (totalDef * 2);

    return {
        attack: totalAtk,
        defense: totalDef,
        agility: totalAgi,
        maxHp: totalMaxHp,
    };
}

/**
 * 更新生命值（装备变化或升级时调用）
 */
function updateHp() {
    if (!player) return;
    const stats = calcPlayerStats();
    const oldMax = player.maxHp;
    player.maxHp = stats.maxHp;
    if (oldMax < player.maxHp) {
        // 最大生命增加，按比例增加当前生命（或直接补满？这里选择补满差额）
        player.hp += player.maxHp - oldMax;
    } else if (player.hp > player.maxHp) {
        // 当前生命不能超过最大生命
        player.hp = player.maxHp;
    }
}