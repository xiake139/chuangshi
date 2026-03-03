import { getPlayerData, savePlayerData } from './gameCore.js';

export async function renderBackpackPanel() {
    const data = getPlayerData();
    const items = data.backpack || {};
    let html = '<h3>背包</h3>';
    for (let [name, count] of Object.entries(items)) {
        if (count <= 0) continue;
        html += `
            <div class="item-row">
                <span>${name} x${count}</span>
                <button class="use-btn" data-item="${name}">使用</button>
            </div>
        `;
    }
    if (Object.keys(items).length === 0) html += '<p>空空如也</p>';
    return html;
}

export async function bindEvents() {
    document.querySelectorAll('.use-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const item = e.target.dataset.item;
            const data = getPlayerData();
            if (!data.backpack[item] || data.backpack[item] <= 0) return;
            
            if (item === '回血丹') {
                data.hp = Math.min(data.maxHp, data.hp + 50);
                data.backpack[item] -= 1;
                if (data.backpack[item] === 0) delete data.backpack[item];
                await savePlayerData();
                alert('使用回血丹，生命+50');
            } else if (item === '聚灵丹') {
                data.exp += 100;
                data.backpack[item] -= 1;
                if (data.backpack[item] === 0) delete data.backpack[item];
                await savePlayerData();
                alert('使用聚灵丹，修为+100');
            } else {
                alert('该物品无法直接使用');
            }
            document.getElementById('contentPanel').innerHTML = await renderBackpackPanel();
            bindEvents();
        });
    });
}