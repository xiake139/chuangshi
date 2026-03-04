import { apiRequest, DATABASE_ID, MAP_COLLECTION_ID } from './api.js';
import { getPlayerData, calcTotalAttack, calcTotalDefense, getTotalMaxHp } from './gameCore.js';

// 地图名称缓存
let mapNameCache = {};

async function getMapName(mapId) {
    if (mapNameCache[mapId]) return mapNameCache[mapId];
    try {
        const mapDoc = await apiRequest(`/databases/${DATABASE_ID}/collections/${MAP_COLLECTION_ID}/documents/${mapId}`);
        mapNameCache[mapId] = mapDoc.name || mapId;
        return mapNameCache[mapId];
    } catch (error) {
        console.warn(`获取地图 ${mapId} 名称失败`, error);
        return mapId;
    }
}

export async function renderStatePanel() {
    const data = getPlayerData();
    const totalAtk = await calcTotalAttack();
    const totalDef = await calcTotalDefense();
    const totalMaxHp = getTotalMaxHp(); // 改为直接调用同步函数
    
    const positionName = await getMapName(data.position);
    
    return `
        <h3 style="text-align:center">角色状态</h3>
        <div class="item-row"><span>生命值</span> ${data.hp}/${totalMaxHp}</div>
        <div class="item-row"><span>总攻击力</span> ${totalAtk} (基础${data.baseAttack} + 装备${totalAtk - data.baseAttack})</div>
        <div class="item-row"><span>总防御力</span> ${totalDef} (基础${data.baseDefense} + 装备${totalDef - data.baseDefense})</div>
        <div class="item-row"><span>修为</span> Lv.${data.level} ${data.exp}/${data.expToNext}</div>
        <div class="item-row"><span>灵石</span> ${data.lingShi}</div>
        <div class="item-row"><span>击杀数</span> ${data.killCount}</div>
        <div class="item-row"><span>总收入</span> ${data.totalIncome}</div>
        <div class="item-row"><span>连续签到</span> ${data.continuousSign}天</div>
        <div class="item-row"><span>当前位置</span> ${positionName}</div>
        <div class="item-row"><span>背包物品</span> ${Object.keys(data.backpack).length}种</div>
    `;
}