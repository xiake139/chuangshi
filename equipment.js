import { apiRequest, DATABASE_ID, EQUIPMENT_COLLECTION_ID } from './api.js';
import { getPlayerData, onEquipmentChanged, savePlayerData } from './gameCore.js';
import { showLog } from './ui.js';

let allEquipment = [];
let equipmentMap = {};

export async function renderEquipmentPanel() {
    const data = getPlayerData();
    try {
        const response = await apiRequest(`/databases/${DATABASE_ID}/collections/${EQUIPMENT_COLLECTION_ID}/documents`);
        allEquipment = response.documents;
        equipmentMap = {};
        allEquipment.forEach(eq => {
            equipmentMap[eq.$id] = eq;
        });
    } catch (error) {
        allEquipment = [];
        equipmentMap = {};
    }

    const backpack = data.backpack || {};

    const ownedEquipmentNames = [];
    for (let itemName in backpack) {
        if (backpack[itemName] > 0) {
            const eq = allEquipment.find(e => e.name === itemName);
            if (eq) {
                ownedEquipmentNames.push(itemName);
            }
        }
    }

    // 当前装备的中文名
    const weaponName = equipmentMap[data.equipWeapon]?.name || data.equipWeapon || '无';
    const armorName = equipmentMap[data.equipArmor]?.name || data.equipArmor || '无';
    const accessoryName = equipmentMap[data.equipAccessory]?.name || data.equipAccessory || '无';

    // 生成可选装备列表（包含倍率显示）
    let availableHtml = '';
    ownedEquipmentNames.forEach(eqName => {
        const eq = allEquipment.find(e => e.name === eqName);
        if (eq) {
            // 构建倍率字符串
            let multiplierStr = '';
            if (eq.expMultiplier && eq.expMultiplier !== 1) multiplierStr += ` 经验x${eq.expMultiplier}`;
            if (eq.currencyMultiplier && eq.currencyMultiplier !== 1) multiplierStr += ` 灵石x${eq.currencyMultiplier}`;
            if (eq.crystalMultiplier && eq.crystalMultiplier !== 1) multiplierStr += ` 晶石x${eq.crystalMultiplier}`;
            availableHtml += `
                <div class="item-row">
                    <span>${eq.name} (攻击+${eq.attack} 防御+${eq.defense} 生命+${eq.hp}${multiplierStr})</span>
                    <button class="equip-select" data-type="${eq.type}" data-name="${eq.$id}">穿戴</button>
                </div>
            `;
        }
    });

    if (availableHtml === '') {
        availableHtml = '<p>背包中没有可穿戴的装备</p>';
    }

    return `
        <h3>装备</h3>
        <div class="item-row">
            <span>武器: ${weaponName}</span>
            <button class="change-btn" data-type="weapon">更换</button>
        </div>
        <div class="item-row">
            <span>防具: ${armorName}</span>
            <button class="change-btn" data-type="armor">更换</button>
        </div>
        <div class="item-row">
            <span>饰品: ${accessoryName}</span>
            <button class="change-btn" data-type="accessory">更换</button>
        </div>
        <div id="equipList" style="display:none; margin-top:10px;">
            <h4>可选装备</h4>
            <div id="availableEquips">${availableHtml}</div>
        </div>
    `;
}

export async function bindEvents() {
    document.querySelectorAll('.change-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            document.getElementById('equipList').style.display = 'block';
        });
    });

    document.querySelectorAll('.equip-select').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const equipType = e.target.dataset.type;
            const equipId = e.target.dataset.name;
            const data = getPlayerData();
            const eq = equipmentMap[equipId];
            if (!eq) {
                showLog('装备数据异常');
                return;
            }
            if (!data.backpack[eq.name] || data.backpack[eq.name] <= 0) {
                showLog('背包中没有该装备');
                return;
            }

            // 更新玩家装备字段
            if (equipType === 'weapon') data.equipWeapon = equipId;
            else if (equipType === 'armor') data.equipArmor = equipId;
            else if (equipType === 'accessory') data.equipAccessory = equipId;

            // 重新计算最大生命值（内存中）
            await onEquipmentChanged();

            // 保存到数据库（会触发 updateHeaderUI）
            await savePlayerData();

            showLog(`已装备 ${eq.name}`);

            // 重新渲染装备面板
            document.getElementById('contentPanel').innerHTML = await renderEquipmentPanel();
            bindEvents();
        });
    });
}