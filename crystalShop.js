import { apiRequest, DATABASE_ID, CRYSTAL_SHOP_COLLECTION_ID } from './api.js';
import { getPlayerData } from './gameCore.js';
import { showLog } from './ui.js';

export async function renderCrystalShopPanel() {
    const data = getPlayerData();
    const crystal = 0;
    
    let items = [];
    try {
        const response = await apiRequest(`/databases/${DATABASE_ID}/collections/${CRYSTAL_SHOP_COLLECTION_ID}/documents`);
        items = response.documents;
    } catch (error) {
        items = [];
    }
    
    let html = `<h3>晶石商城</h3><p>晶石: ${crystal}</p>`;
    items.forEach(item => {
        html += `
            <div class="item-row">
                <span>${item.name}<br><small>${item.desc}</small><br>价格: ${item.crystalPrice}晶石</span>
                <button class="buy-btn" data-item='${JSON.stringify(item)}' ${crystal < item.crystalPrice ? 'disabled' : ''}>购买</button>
            </div>
        `;
    });
    return html;
}

export async function bindEvents() {
    document.querySelectorAll('.buy-btn').forEach(btn => {
        btn.addEventListener('click', () => showLog('晶石系统暂未开放'));
    });
}