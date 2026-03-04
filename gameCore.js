import { apiRequest, DATABASE_ID, USERS_COLLECTION_ID, PLAYER_DEFAULT_COLLECTION_ID, EQUIPMENT_COLLECTION_ID } from './api.js';
import { updateHeaderUI } from './ui.js';

let currentUserId = null;
let playerData = null;
let equipmentCache = {};

export function setCurrentUserId(id) {
    currentUserId = id;
}

export function getCurrentUserId() {
    return currentUserId;
}

export function getPlayerData() {
    return playerData;
}

export function setPlayerData(data) {
    playerData = data;
}

// 获取装备属性（已缓存）
export async function getEquipmentStats(equipId) {
    if (!equipId || equipId === '无') return { attack: 0, defense: 0, hp: 0, expMultiplier: 1, currencyMultiplier: 1 };
    if (equipmentCache[equipId]) return equipmentCache[equipId];
    try {
        const doc = await apiRequest(`/databases/${DATABASE_ID}/collections/${EQUIPMENT_COLLECTION_ID}/documents/${equipId}`);
        equipmentCache[equipId] = {
            attack: doc.attack || 0,
            defense: doc.defense || 0,
            hp: doc.hp || 0,
            expMultiplier: doc.expMultiplier || 1,
            currencyMultiplier: doc.currencyMultiplier || 1
        };
        return equipmentCache[equipId];
    } catch (error) {
        console.warn(`装备 ${equipId} 不存在，返回默认值`);
        return { attack: 0, defense: 0, hp: 0, expMultiplier: 1, currencyMultiplier: 1 };
    }
}

// 计算装备总生命加成
async function calcEquipmentHpBonus() {
    let hpBonus = 0;
    if (playerData.equipWeapon && playerData.equipWeapon !== '无') {
        const weapon = await getEquipmentStats(playerData.equipWeapon);
        hpBonus += weapon.hp || 0;
    }
    if (playerData.equipArmor && playerData.equipArmor !== '无') {
        const armor = await getEquipmentStats(playerData.equipArmor);
        hpBonus += armor.hp || 0;
    }
    if (playerData.equipAccessory && playerData.equipAccessory !== '无') {
        const accessory = await getEquipmentStats(playerData.equipAccessory);
        hpBonus += accessory.hp || 0;
    }
    return hpBonus;
}

// 重新计算总最大生命值（直接更新内存，不保存）
export async function recalcTotalMaxHp() {
    if (!playerData) return;
    const baseMaxHp = playerData.baseMaxHp || playerData.maxHp || 300;
    const equipBonus = await calcEquipmentHpBonus();
    const totalMaxHp = baseMaxHp + equipBonus;
    if (playerData.hp > totalMaxHp) playerData.hp = totalMaxHp;
    playerData.maxHp = totalMaxHp;
    if (!playerData.baseMaxHp) playerData.baseMaxHp = baseMaxHp;
}

// 创建新玩家数据
export async function createPlayerData(userId, roleName) {
    let defaultData;
    try {
        defaultData = await apiRequest(`/databases/${DATABASE_ID}/collections/${PLAYER_DEFAULT_COLLECTION_ID}/documents/default`);
    } catch (error) {
        console.error('无法获取默认玩家配置，使用硬编码', error);
        defaultData = {
            level: 1, lingShi: 100, hp: 300, maxHp: 300, exp: 0, expToNext: 100,
            baseAttack: 5, baseDefense: 2,
            backpack: JSON.stringify({ "回血丹": 5, "晶石令": 3 }),
            position: 'xinshoucun'
        };
    }

    const baseMaxHp = defaultData.maxHp || 300;
    const initialBackpack = {
        "回血丹": 5,
        "晶石令": 3,
        "新手剑": 1,
        "新手衣": 1
    };

    const playerDoc = {
        name: roleName,
        level: defaultData.level,
        lingShi: defaultData.lingShi,
        hp: defaultData.hp,
        maxHp: baseMaxHp,
        baseMaxHp: baseMaxHp,
        exp: defaultData.exp,
        expToNext: defaultData.expToNext,
        baseAttack: defaultData.baseAttack,
        baseDefense: defaultData.baseDefense,
        equipWeapon: '无',
        equipArmor: '无',
        equipAccessory: '无',
        backpack: JSON.stringify(initialBackpack),
        killCount: 0,
        totalIncome: defaultData.lingShi,
        continuousSign: 0,
        lastSignDate: null,
        position: defaultData.position,
        battleMonsterId: null,
        battleMonsterHp: null
    };

    await apiRequest(`/databases/${DATABASE_ID}/collections/${USERS_COLLECTION_ID}/documents`, {
        method: 'POST',
        body: JSON.stringify({ documentId: userId, data: playerDoc })
    });
    return playerDoc;
}

// 加载玩家数据
export async function loadPlayerData(userId) {
    try {
        const doc = await apiRequest(`/databases/${DATABASE_ID}/collections/${USERS_COLLECTION_ID}/documents/${userId}`);
        if (doc.backpack && typeof doc.backpack === 'string') {
            try { doc.backpack = JSON.parse(doc.backpack); } catch { doc.backpack = {}; }
        }
        if (doc.baseMaxHp === undefined || doc.baseMaxHp === null) {
            doc.baseMaxHp = doc.maxHp || 300;
            playerData = doc;
            await recalcTotalMaxHp();
        } else {
            playerData = doc;
        }
    } catch (error) {
        if (error.code === 404) {
            throw new Error('玩家数据不存在，请重新注册');
        } else {
            throw error;
        }
    }
    updateHeaderUI();
    return playerData;
}

// 保存玩家数据
export async function savePlayerData(updatedFields = {}) {
    if (!currentUserId || !playerData) return;
    Object.assign(playerData, updatedFields);
    const dataToSave = { ...playerData };
    if (dataToSave.backpack && typeof dataToSave.backpack === 'object') {
        dataToSave.backpack = JSON.stringify(dataToSave.backpack);
    }
    await apiRequest(`/databases/${DATABASE_ID}/collections/${USERS_COLLECTION_ID}/documents/${currentUserId}`, {
        method: 'PATCH',
        body: JSON.stringify({ data: dataToSave })
    });
    updateHeaderUI();
}

// 升级处理（每升一级，基础攻击和防御增加 当前等级 * 2 * 当前等级）
export async function applyLevelUp() {
    let changed = false;
    while (playerData.exp >= playerData.expToNext) {
        playerData.level += 1;
        playerData.exp -= playerData.expToNext;
        playerData.expToNext = Math.floor(playerData.expToNext * 1.2);

        // 新增攻击防御：当前等级 * 2 * 当前等级
        const increment = playerData.level * 2 * playerData.level;
        playerData.baseAttack += increment;
        playerData.baseDefense += increment;

        playerData.baseMaxHp += 20; // 生命成长保持不变
        changed = true;
    }
    if (changed) {
        await recalcTotalMaxHp();
        playerData.hp = playerData.maxHp; // 升级回满血
    }
}

// 装备变更后调用（重新计算最大生命）
export async function onEquipmentChanged() {
    await recalcTotalMaxHp();
    if (playerData.hp > playerData.maxHp) playerData.hp = playerData.maxHp;
}

// 计算总攻击（基础+装备）
export async function calcTotalAttack() {
    let base = playerData.baseAttack || 0;
    const weaponStats = await getEquipmentStats(playerData.equipWeapon);
    base += weaponStats.attack || 0;
    return base;
}

// 计算总防御（基础+装备）
export async function calcTotalDefense() {
    let base = playerData.baseDefense || 0;
    const armorStats = await getEquipmentStats(playerData.equipArmor);
    base += armorStats.defense || 0;
    return base;
}

// 获取总最大生命
export function getTotalMaxHp() {
    return playerData.maxHp;
}