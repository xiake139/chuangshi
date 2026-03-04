import { apiRequest, DATABASE_ID, SHOP_COLLECTION_ID, EQUIPMENT_COLLECTION_ID } from './api.js';
import { getPlayerData, savePlayerData } from './gameCore.js';
import { showLog } from './ui.js';

let itemCache = {};

// 先从 shop 集合获取，若失败则从 equipment 集合获取（装备）
async function getItemInfo(itemName) {
    if (itemCache[itemName]) return itemCache[itemName];

    // 尝试从 shop 集合获取
    try {
        const response = await apiRequest(`/databases/${DATABASE_ID}/collections/${SHOP_COLLECTION_ID}/documents`);
        const items = response.documents;
        for (let item of items) {
            if (item.name === itemName) {
                itemCache[itemName] = item;
                return item;
            }
        }
    } catch (error) {
        console.warn('获取商店物品失败', error);
    }

    // 如果 shop 中没有，尝试从 equipment 集合获取（可能是装备）
    try {
        const response = await apiRequest(`/databases/${DATABASE_ID}/collections/${EQUIPMENT_COLLECTION_ID}/documents`);
        const equipmentList = response.documents;
        for (let eq of equipmentList) {
            if (eq.name === itemName) {
                // 构造一个简易物品对象，至少包含 type
                const fakeItem = {
                    name: eq.name,
                    type: eq.type
                };
                itemCache[itemName] = fakeItem;
                return fakeItem;
            }
        }
    } catch (error) {
        console.warn('获取装备信息失败', error);
    }

    return null;
}

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
    const oldButtons = document.querySelectorAll('.use-btn');
    oldButtons.forEach(btn => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
    });

    document.querySelectorAll('.use-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const itemName = e.target.dataset.item;
            const data = getPlayerData();
            if (!data.backpack[itemName] || data.backpack[itemName] <= 0) return;

            const itemInfo = await getItemInfo(itemName);
            if (!itemInfo) {
                showLog(`物品 ${itemName} 信息不存在`);
                return;
            }

            // 如果是装备，提示到装备面板穿戴
            if (itemInfo.type === 'weapon' || itemInfo.type === 'armor' || itemInfo.type === 'accessory') {
                showLog('请到装备面板穿戴');
                return;
            }

            let effect = {};
            if (itemInfo.effect) {
                try {
                    effect = JSON.parse(itemInfo.effect);
                } catch (e) {
                    console.warn('解析 effect 失败', e);
                }
            }

            if (itemInfo.type === 'consumable') {
                if (effect.heal) {
                    const heal = effect.heal;
                    const missingHp = data.maxHp - data.hp;
                    if (missingHp <= 0) {
                        showLog('生命已满，无法使用');
                        return;
                    }
                    const actualHeal = Math.min(heal, missingHp);
                    data.hp += actualHeal;
                    data.backpack[itemName] -= 1;
                    if (data.backpack[itemName] === 0) delete data.backpack[itemName];
                    await savePlayerData();
                    showLog(`使用 ${itemName}，生命 +${actualHeal}，当前 ${data.hp}/${data.maxHp}`);
                } else if (effect.exp) {
                    data.exp += effect.exp;
                    data.backpack[itemName] -= 1;
                    if (data.backpack[itemName] === 0) delete data.backpack[itemName];
                    // 升级检查
                    while (data.exp >= data.expToNext) {
                        data.level += 1;
                        data.exp -= data.expToNext;
                        data.expToNext = Math.floor(data.expToNext * 1.2);
                        data.baseMaxHp += 20;
                        data.maxHp = data.baseMaxHp; // 简化，未考虑装备，但升级时无装备
                        data.hp = data.maxHp;
                    }
                    await savePlayerData();
                    showLog(`使用 ${itemName}，修为 +${effect.exp}`);
                } else {
                    showLog('该物品无法直接使用');
                }
            } else {
                showLog('该物品无法直接使用');
            }

            // 重新渲染背包面板
            document.getElementById('contentPanel').innerHTML = await renderBackpackPanel();
            bindEvents();
        });
    });
}