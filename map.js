import { apiRequest, DATABASE_ID, MAP_COLLECTION_ID, MONSTERS_COLLECTION_ID } from './api.js';
import { getPlayerData, savePlayerData, calcTotalAttack, calcTotalDefense, getEquipmentStats, applyLevelUp } from './gameCore.js';
import { showPanel, showLog } from './ui.js';

let currentMapData = null;
let monsterNameMap = {};      // ID -> 中文名
let monsterBaseMap = {};      // ID -> 怪物基础数据
const npcNameMap = { 'cunzhang': '村长' };

const positionMap = {
    '新手村': 'xinshoucun',
    '竹林': 'zhulin',
    '集市': 'jishi',
    '海岸': 'haian',
    '沙滩': 'shatan'
};

// 获取怪物基础数据（带缓存）
async function getMonsterBase(monsterId) {
    if (monsterBaseMap[monsterId]) return monsterBaseMap[monsterId];
    try {
        const monster = await apiRequest(`/databases/${DATABASE_ID}/collections/${MONSTERS_COLLECTION_ID}/documents/${monsterId}`);
        monsterBaseMap[monsterId] = monster;
        monsterNameMap[monsterId] = monster.name || monsterId;
        return monster;
    } catch (error) {
        console.warn(`获取怪物 ${monsterId} 失败`, error);
        return null;
    }
}

export async function renderMapPanel() {
    const data = getPlayerData();
    let pos = data.position || 'xinshoucun';
    console.log('当前玩家位置原始值:', pos);

    const mappedPos = positionMap[pos] || pos;
    if (mappedPos !== pos) {
        console.log(`将中文位置 "${pos}" 映射为英文ID "${mappedPos}"`);
        pos = mappedPos;
    }

    try {
        currentMapData = await apiRequest(`/databases/${DATABASE_ID}/collections/${MAP_COLLECTION_ID}/documents/${pos}`);
        console.log('地图数据加载成功:', currentMapData);
    } catch (error) {
        console.error(`获取地图文档失败 (位置ID: ${pos})：`, error.message);
        currentMapData = {
            name: '未知地域',
            description: `无法加载地图数据。位置ID: ${pos}，错误: ${error.message}`,
            monsterList: JSON.stringify([]),
            npcList: JSON.stringify([]),
            forward: null, back: null, left: null, right: null,
            buildings: JSON.stringify([])
        };
        return renderMapHTML(currentMapData, [], []);
    }

    const monsterIds = JSON.parse(currentMapData.monsterList || '[]');
    const npcIds = JSON.parse(currentMapData.npcList || '[]');

    // 并发获取所有怪物的中文名（利用缓存）
    const monsterNamePromises = monsterIds.map(async id => {
        const base = await getMonsterBase(id);
        return base ? base.name : id;
    });
    const monsterNames = await Promise.all(monsterNamePromises);

    const npcNames = npcIds.map(id => npcNameMap[id] || id);

    return renderMapHTML(currentMapData, monsterIds, monsterNames, npcIds, npcNames);
}

function renderMapHTML(map, monsterIds, monsterNames, npcIds, npcNames) {
    const buildings = JSON.parse(map.buildings || '[]');
    
    let monsterHtml = '';
    for (let i = 0; i < monsterIds.length; i++) {
        monsterHtml += `<span class="monster-tag" data-monster="${monsterIds[i]}">${monsterNames[i]}</span> `;
    }

    let npcHtml = '';
    for (let i = 0; i < npcIds.length; i++) {
        npcHtml += `<span class="npc-tag" data-npc="${npcIds[i]}">${npcNames[i]}</span> `;
    }
    
    const descHtml = map.description ? `<div class="location-desc">${map.description}</div>` : '';
    
    return `
        <div class="map-card">
            <div class="location-name">${map.name}</div>
            ${descHtml}
            ${buildings.length ? `<div class="buildings">建筑: ${buildings.join(', ')}</div>` : ''}
            <div class="monster-npc">
                ${monsterHtml}
                ${npcHtml}
            </div>
        </div>
        <div class="direction-panel">
            <button class="dir-btn" id="moveForward">前</button>
            <button class="dir-btn" id="moveLeft">左</button>
            <button class="dir-btn" id="moveBack">后</button>
            <button class="dir-btn" id="moveRight">右</button>
        </div>
        <button class="btn" id="exploreBtn">探索（打怪）</button>
        <button class="btn" id="talkNpcBtn">对话 NPC</button>
    `;
}

export async function bindMapEvents() {
    document.getElementById('moveForward')?.addEventListener('click', () => moveTo(currentMapData.forward));
    document.getElementById('moveLeft')?.addEventListener('click', () => moveTo(currentMapData.left));
    document.getElementById('moveBack')?.addEventListener('click', () => moveTo(currentMapData.back));
    document.getElementById('moveRight')?.addEventListener('click', () => moveTo(currentMapData.right));
    document.getElementById('exploreBtn')?.addEventListener('click', explore);
    document.getElementById('talkNpcBtn')?.addEventListener('click', talkNpc);
    
    document.querySelectorAll('.monster-tag').forEach(el => {
        el.addEventListener('click', (e) => fightMonster(e.target.dataset.monster));
    });
    document.querySelectorAll('.npc-tag').forEach(el => {
        const npcId = el.dataset.npc;
        const npcName = npcNameMap[npcId] || npcId;
        el.addEventListener('click', () => showLog(`你与 ${npcName} 交谈了一番。`));
    });
}

async function moveTo(dest) {
    if (!dest) { showLog('无路可走'); return; }
    const mappedDest = positionMap[dest] || dest;
    try {
        const targetMap = await apiRequest(`/databases/${DATABASE_ID}/collections/${MAP_COLLECTION_ID}/documents/${mappedDest}`);
        const targetName = targetMap.name || mappedDest;
        
        const data = getPlayerData();
        data.position = mappedDest;
        data.battleMonsterId = null;
        data.battleMonsterHp = null;
        await savePlayerData({ position: mappedDest, battleMonsterId: null, battleMonsterHp: null });
        showLog(`移动到 ${targetName}`);
        showPanel('map');
    } catch (error) {
        if (error.code === 404) {
            showLog(`此方向无法移动（地图 ${mappedDest} 不存在）`);
        } else {
            showLog('移动失败：' + error.message);
        }
    }
}

async function explore() {
    if (!currentMapData) return;
    const monsterIds = JSON.parse(currentMapData.monsterList || '[]');
    if (monsterIds.length === 0) { showLog('这里没有怪物'); return; }
    const randomMonsterId = monsterIds[Math.floor(Math.random() * monsterIds.length)];
    await fightMonster(randomMonsterId);
}

async function fightMonster(monsterId) {
    const player = getPlayerData();
    if (player.hp <= 0) { showLog('你已经没有力气了'); return; }

    // 获取怪物基础数据（从缓存或网络）
    const monsterBase = await getMonsterBase(monsterId);
    if (!monsterBase) {
        showLog(`怪物 ${monsterId} 不存在`);
        return;
    }

    // 初始化或继续战斗
    let currentMonsterHp = player.battleMonsterHp;
    let currentMonsterId = player.battleMonsterId;

    if (currentMonsterId !== monsterId || currentMonsterHp === null || currentMonsterHp <= 0) {
        currentMonsterHp = monsterBase.hp;
        currentMonsterId = monsterId;
        showLog(`遇到 ${monsterBase.name}，开始战斗！`);
    }

    // 计算伤害
    const playerAttack = await calcTotalAttack();
    const playerDefense = await calcTotalDefense();
    const playerDamage = Math.max(1, playerAttack - monsterBase.defense);
    const monsterDamage = Math.max(1, monsterBase.attack - playerDefense);

    // 玩家攻击
    currentMonsterHp -= playerDamage;
    showLog(`你对 ${monsterBase.name} 造成 ${playerDamage} 伤害，怪物剩余 ${currentMonsterHp} 生命。`);

    // 检查怪物是否死亡
    if (currentMonsterHp <= 0) {
        // 获得奖励
        const expReward = monsterBase.expReward;
        const lingShiReward = monsterBase.lingShiReward;
        const dropItems = JSON.parse(monsterBase.dropItems || '[]');
        
        const weaponStats = await getEquipmentStats(player.equipWeapon);
        const finalExp = Math.floor(expReward * (weaponStats.expMultiplier || 1));
        const finalLingShi = Math.floor(lingShiReward * (weaponStats.currencyMultiplier || 1));
        
        player.exp += finalExp;
        player.lingShi += finalLingShi;
        player.killCount += 1;
        player.totalIncome += finalLingShi;
        
        dropItems.forEach(item => {
            if (!player.backpack[item.name]) player.backpack[item.name] = 0;
            player.backpack[item.name] += item.count;
        });

        // 清除战斗状态
        player.battleMonsterId = null;
        player.battleMonsterHp = null;

        // 处理升级（只修改内存，稍后统一保存）
        await applyLevelUp();

        // 一次性保存所有更改
        await savePlayerData();

        showLog(`击败 ${monsterBase.name}，获得 ${finalExp} 修为、${finalLingShi} 灵石${dropItems.length ? '，并获得物品' : ''}`);
    } else {
        // 怪物反击
        player.hp -= monsterDamage;
        if (player.hp < 0) player.hp = 0;
        
        // 保存战斗状态
        player.battleMonsterId = currentMonsterId;
        player.battleMonsterHp = currentMonsterHp;
        
        // 玩家可能死亡
        if (player.hp <= 0) {
            player.battleMonsterId = null;
            player.battleMonsterHp = null;
            showLog('你已死亡，请使用回血丹');
        } else {
            showLog(`怪物对你造成 ${monsterDamage} 伤害，你剩余 ${player.hp}/${player.maxHp} 生命。`);
        }

        // 保存所有更改
        await savePlayerData();
    }
}

function talkNpc() {
    showLog('请点击具体的NPC进行对话');
}