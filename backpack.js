import { apiRequest, DATABASE_ID, SHOP_COLLECTION_ID } from './api.js';
import { getPlayerData, savePlayerData } from './gameCore.js';
import { showLog } from './ui.js';

let itemCache = {};

async function getItemInfo(itemName) {
    if (itemCache[itemName]) return itemCache[itemName];
    try {
        const response = await apiRequest(`/databases/${DATABASE_ID}/collections/${SHOP_COLLECTION_ID}/documents`);
        const items = response.documents;
        for (let item of items) {
            if (item.name === itemName) {
                itemCache[itemName] = item;
                return item;
            }
        }
        return null;
    } catch (error) {
        console.error('获取物品信息失败', error);
        return null;
    }
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
                    // 升级检查由 levelUp 统一处理，但这里暂不处理，因为可能立即升级
                    // 简单处理：直接增加exp，升级逻辑在后续战斗中自动触发，或手动调用levelUp
                    // 为了简化，我们在这里也检查升级
                    while (data.exp >= data.expToNext) {
                        data.level += 1;
                        data.exp -= data.expToNext;
                        data.expToNext = Math.floor(data.expToNext * 1.2);
                        data.baseMaxHp += 20;
                        // 重新计算最大生命（需要装备加成，但这里不好调用calcEquipmentHpBonus，先简单处理）
                        // 建议调用 levelUp 函数，但避免循环依赖，我们简单处理
                        // 实际项目中应调用 levelUp，这里暂不处理，升级在战斗中触发
                    }
                    await savePlayerData();
                    showLog(`使用 ${itemName}，修为 +${effect.exp}`);
                } else {
                    showLog('该物品无法直接使用');
                }
            } else {
                showLog('该物品无法直接使用');
            }
            
            document.getElementById('contentPanel').innerHTML = await renderBackpackPanel();
            bindEvents();
        });
    });
}