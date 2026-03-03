import { databases, DATABASE_ID, USERS_COLLECTION_ID, PLAYER_DEFAULT_COLLECTION_ID, EQUIPMENT_COLLECTION_ID } from './appwrite.js';
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

export async function getEquipmentStats(equipName) {
    if (!equipName || equipName === '无') return { attack: 0, defense: 0, hp: 0, expMultiplier: 1, currencyMultiplier: 1 };
    if (equipmentCache[equipName]) return equipmentCache[equipName];
    try {
        const doc = await databases.getDocument(DATABASE_ID, EQUIPMENT_COLLECTION_ID, equipName);
        equipmentCache[equipName] = {
            attack: doc.attack || 0,
            defense: doc.defense || 0,
            hp: doc.hp || 0,
            expMultiplier: doc.expMultiplier || 1,
            currencyMultiplier: doc.currencyMultiplier || 1
        };
        return equipmentCache[equipName];
    } catch (error) {
        console.warn(`装备 ${equipName} 不存在，返回默认值`);
        return { attack: 0, defense: 0, hp: 0, expMultiplier: 1, currencyMultiplier: 1 };
    }
}

export async function createPlayerData(userId, roleName) {
    let defaultData;
    try {
        defaultData = await databases.getDocument(DATABASE_ID, PLAYER_DEFAULT_COLLECTION_ID, 'default');
    } catch (error) {
        console.error('无法获取默认玩家配置，使用硬编码', error);
        defaultData = {
            level: 1, lingShi: 100, hp: 300, maxHp: 300, exp: 0, expToNext: 100,
            baseAttack: 5, baseDefense: 2, equipWeapon: 'xinshoujian', equipArmor: 'xinshouyi',
            equipAccessory: '无', backpack: JSON.stringify({ "回血丹": 5, "晶石令": 3 }),
            position: 'xinshoucun'
        };
    }
    const playerDoc = {
        name: roleName,
        level: defaultData.level,
        lingShi: defaultData.lingShi,
        hp: defaultData.hp,
        maxHp: defaultData.maxHp,
        exp: defaultData.exp,
        expToNext: defaultData.expToNext,
        baseAttack: defaultData.baseAttack,
        baseDefense: defaultData.baseDefense,
        equipWeapon: defaultData.equipWeapon,
        equipArmor: defaultData.equipArmor,
        equipAccessory: defaultData.equipAccessory,
        backpack: defaultData.backpack,
        killCount: 0,
        totalIncome: defaultData.lingShi,
        continuousSign: 0,
        lastSignDate: null,
        position: defaultData.position
    };
    await databases.createDocument(DATABASE_ID, USERS_COLLECTION_ID, userId, playerDoc);
}

export async function loadPlayerData(userId) {
    try {
        const doc = await databases.getDocument(DATABASE_ID, USERS_COLLECTION_ID, userId);
        if (doc.backpack && typeof doc.backpack === 'string') {
            try { doc.backpack = JSON.parse(doc.backpack); } catch { doc.backpack = {}; }
        }
        playerData = doc;
    } catch (error) {
        if (error.code === 404) {
            await createPlayerData(userId, '沈曦炎');
            return loadPlayerData(userId);
        } else throw error;
    }
    updateHeaderUI();
    return playerData;
}

export async function savePlayerData(updatedFields = {}) {
    if (!currentUserId || !playerData) return;
    Object.assign(playerData, updatedFields);
    const dataToSave = { ...playerData };
    if (dataToSave.backpack && typeof dataToSave.backpack === 'object') {
        dataToSave.backpack = JSON.stringify(dataToSave.backpack);
    }
    await databases.updateDocument(DATABASE_ID, USERS_COLLECTION_ID, currentUserId, dataToSave);
    updateHeaderUI();
}

export async function calcTotalAttack() {
    let base = playerData.baseAttack || 0;
    const weaponStats = await getEquipmentStats(playerData.equipWeapon);
    base += weaponStats.attack || 0;
    return base;
}

export async function calcTotalDefense() {
    let base = playerData.baseDefense || 0;
    const armorStats = await getEquipmentStats(playerData.equipArmor);
    base += armorStats.defense || 0;
    return base;
}

export async function calcTotalHp() {
    let base = playerData.maxHp || 300;
    const armorStats = await getEquipmentStats(playerData.equipArmor);
    base += armorStats.hp || 0;
    return base;
}