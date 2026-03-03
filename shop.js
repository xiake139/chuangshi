import { databases, DATABASE_ID, SHOP_COLLECTION_ID } from './appwrite.js';
import { getPlayerData, savePlayerData } from './gameCore.js';

let shopItems = [];

export async function renderShopPanel() {
    const data = getPlayerData();
    try {
        const response = await databases.listDocuments(DATABASE_ID, SHOP_COLLECTION_ID);
        shopItems = response.documents;
    } catch (error) {
        shopItems = [];
    }
    
    let html = `<h3>商城</h3><p>灵石: ${data.lingShi}</p>`;
    shopItems.forEach(item => {
        let disable = (item.requireLv && data.level < item.requireLv) ? 'disabled' : '';
        html += `
            <div class="item-row">
                <span>${item.name}<br><small>${item.desc}</small><br>价格: ${item.price}灵石</span>
                <button class="buy-btn" data-item='${JSON.stringify(item)}' ${disable}>购买</button>
            </div>
        `;
    });
    return html;
}

export async function bindEvents() {
    document.querySelectorAll('.buy-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const item = JSON.parse(e.target.dataset.item);
            const data = getPlayerData();
            if (data.lingShi < item.price) { alert('灵石不足'); return; }
            if (item.requireLv && data.level < item.requireLv) { alert('等级不足'); return; }
            data.lingShi -= item.price;
            if (!data.backpack[item.name]) data.backpack[item.name] = 0;
            data.backpack[item.name] += 1;
            await savePlayerData();
            alert(`购买成功，获得 ${item.name}`);
            document.getElementById('contentPanel').innerHTML = await renderShopPanel();
            bindEvents();
        });
    });
}