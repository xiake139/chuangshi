import { databases, DATABASE_ID, MAP_COLLECTION_ID, MONSTERS_COLLECTION_ID } from './appwrite.js';
import { getPlayerData, savePlayerData, calcTotalAttack, calcTotalDefense, getEquipmentStats } from './gameCore.js';
import { showPanel } from './ui.js';

let currentMapData = null;

export async function renderMapPanel() {
    const data = getPlayerData();
    const pos = data.position || 'xinshoucun';
    try {
        currentMapData = await databases.getDocument(DATABASE_ID, MAP_COLLECTION_ID, pos);
    } catch (error) {
        currentMapData = {
            name: '未知地域',
            description: '这里似乎还没有被探索。',
            monsterList: JSON.stringify([]),
            npcList: JSON.stringify([]),
            forward: null, back: null, left: null, right: null,
            buildings: JSON.stringify([])
        };
    }
    return renderMapHTML(currentMapData);
}

function renderMapHTML(map) {
    const monsterList = JSON.parse(map.monsterList || '[]');
    const npcList = JSON.parse(map.npcList || '[]');
    const buildings = JSON.parse(map.buildings || '[]');
    
    let monsterHtml = monsterList.map(m => `<span class="monster-tag" data-monster="${m}">${m}</span>`).join(' ');
    let npcHtml = npcList.map(n => `<span class="npc-tag" data-npc="${n}">${n}</span>`).join(' ');
    
    return `
        <div class="map-card">
            <div class="location-name">${map.name}</div>
            <div class="location-desc">${map.description}</div>
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
        el.addEventListener('click', (e) => alert(`你与 ${e.target.dataset.npc} 交谈了一番。`));
    });
}

async function moveTo(dest) {
    if (!dest) { alert('无路可走'); return; }
    const data = getPlayerData();
    data.position = dest;
    await savePlayerData({ position: dest });
    showPanel('map');
}

async function explore() {
    if (!currentMapData) return;
    const monsterList = JSON.parse(currentMapData.monsterList || '[]');
    if (monsterList.length === 0) { alert('这里没有怪物'); return; }
    const randomMonster = monsterList[Math.floor(Math.random() * monsterList.length)];
    await fightMonster(randomMonster);
}

async function fightMonster(monsterId) {
    let monster;
    try {
        monster = await databases.getDocument(DATABASE_ID, MONSTERS_COLLECTION_ID, monsterId);
    } catch (error) {
        alert(`怪物 ${monsterId} 不存在`);
        return;
    }
    
    const player = getPlayerData();
    if (player.hp <= 0) { alert('你已经没有力气了'); return; }
    
    const playerAttack = await calcTotalAttack();
    const playerDefense = await calcTotalDefense();
    
    const playerDamage = Math.max(1, playerAttack - monster.defense);
    const monsterDamage = Math.max(1, monster.attack - playerDefense);
    
    let monsterHp = monster.hp;
    monsterHp -= playerDamage;
    
    if (monsterHp <= 0) {
        const expReward = monster.expReward;
        const lingShiReward = monster.lingShiReward;
        const dropItems = JSON.parse(monster.dropItems || '[]');
        
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
        
        while (player.exp >= player.expToNext) {
            player.level += 1;
            player.exp -= player.expToNext;
            player.expToNext = Math.floor(player.expToNext * 1.2);
            player.maxHp += 20;
            player.hp = player.maxHp;
        }
        
        await savePlayerData();
        alert(`击败 ${monster.name}，获得 ${finalExp} 修为、${finalLingShi} 灵石${dropItems.length ? '，并获得物品' : ''}`);
    } else {
        player.hp -= monsterDamage;
        if (player.hp < 0) player.hp = 0;
        await savePlayerData();
        alert(`你对 ${monster.name} 造成 ${playerDamage} 伤害，怪物剩余 ${monsterHp} 生命。\n怪物对你造成 ${monsterDamage} 伤害，你剩余 ${player.hp}/${player.maxHp} 生命。`);
    }
    
    if (player.hp <= 0) alert('你已死亡，请使用回血丹');
}

function talkNpc() {
    alert('你与 NPC 交谈，但什么也没发生。');
}