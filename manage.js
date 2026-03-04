import { getPlayerData, savePlayerData } from './gameCore.js';

export function renderManagePanel() {
    return `
        <h3>管理面板</h3>
        <p>此处可预留管理员功能。</p>
        <button id="resetDataBtn" class="btn">重置角色数据（测试）</button>
    `;
}

export async function bindEvents() {
    document.getElementById('resetDataBtn')?.addEventListener('click', async () => {
        if (confirm('确定重置所有数据？')) {
            const data = getPlayerData();
            // 重置为初始状态（无装备）
            data.level = 1;
            data.lingShi = 100;
            data.hp = 300;
            data.maxHp = 300;
            data.baseMaxHp = 300;
            data.exp = 0;
            data.expToNext = 100;
            data.baseAttack = 5;
            data.baseDefense = 2;
            data.equipWeapon = '无';        // 武器设为无
            data.equipArmor = '无';          // 防具设为无
            data.equipAccessory = '无';       // 饰品设为无
            data.backpack = {
                '回血丹': 5,
                '晶石令': 3,
                '新手剑': 1,                  // 放入背包
                '新手衣': 1
            };
            data.killCount = 0;
            data.totalIncome = 100;
            data.continuousSign = 0;
            data.lastSignDate = null;
            data.position = 'xinshoucun';
            data.battleMonsterId = null;
            data.battleMonsterHp = null;

            await savePlayerData();
            alert('数据已重置');
            location.reload(); // 刷新页面重新加载数据
        }
    });
}