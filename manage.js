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
            const { getPlayerData, savePlayerData } = await import('./gameCore.js');
            const data = getPlayerData();
            data.level = 1;
            data.lingShi = 100;
            data.hp = 300;
            data.maxHp = 300;
            data.exp = 0;
            data.expToNext = 100;
            data.baseAttack = 5;
            data.baseDefense = 2;
            data.equipWeapon = 'xinshoujian';
            data.equipArmor = 'xinshouyi';
            data.equipAccessory = '无';
            data.backpack = { '回血丹': 5, '晶石令': 3 };
            data.killCount = 0;
            data.totalIncome = 100;
            data.continuousSign = 0;
            data.lastSignDate = null;
            data.position = 'xinshoucun';
            await savePlayerData();
            alert('数据已重置');
            location.reload();
        }
    });
}