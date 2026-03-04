import { getPlayerData, calcTotalAttack, calcTotalDefense } from './gameCore.js';

export async function renderStatePanel() {
    const data = getPlayerData();
    const totalAtk = await calcTotalAttack();
    const totalDef = await calcTotalDefense();
    
    return `
        <h3 style="text-align:center">角色状态</h3>
        <div class="item-row"><span>生命值</span> ${data.hp}/${data.maxHp}</div>
        <div class="item-row"><span>总攻击力</span> ${totalAtk} (基础${data.baseAttack} + 装备${totalAtk - data.baseAttack})</div>
        <div class="item-row"><span>总防御力</span> ${totalDef} (基础${data.baseDefense} + 装备${totalDef - data.baseDefense})</div>
        <div class="item-row"><span>修为</span> Lv.${data.level} ${data.exp}/${data.expToNext}</div>
        <div class="item-row"><span>灵石</span> ${data.lingShi}</div>
        <div class="item-row"><span>击杀数</span> ${data.killCount}</div>
        <div class="item-row"><span>总收入</span> ${data.totalIncome}</div>
        <div class="item-row"><span>连续签到</span> ${data.continuousSign}天</div>
        <div class="item-row"><span>当前位置</span> ${data.position}</div>
        <div class="item-row"><span>背包物品</span> ${Object.keys(data.backpack).length}种</div>
    `;
}