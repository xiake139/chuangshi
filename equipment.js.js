import { databases, DATABASE_ID, EQUIPMENT_COLLECTION_ID } from './appwrite.js';
import { getPlayerData, savePlayerData } from './gameCore.js';

let equipmentList = [];

export async function renderEquipmentPanel() {
    const data = getPlayerData();
    try {
        const response = await databases.listDocuments(DATABASE_ID, EQUIPMENT_COLLECTION_ID);
        equipmentList = response.documents;
    } catch (error) {
        equipmentList = [];
    }
    
    return `
        <h3>装备</h3>
        <div class="item-row">
            <span>武器: ${data.equipWeapon || '无'}</span>
            <button class="change-btn" data-type="weapon">更换</button>
        </div>
        <div class="item-row">
            <span>防具: ${data.equipArmor || '无'}</span>
            <button class="change-btn" data-type="armor">更换</button>
        </div>
        <div class="item-row">
            <span>饰品: ${data.equipAccessory || '无'}</span>
            <button class="change-btn" data-type="accessory">更换</button>
        </div>
        <div id="equipList" style="display:none; margin-top:10px;">
            <h4>可选装备</h4>
            <div id="availableEquips"></div>
        </div>
    `;
}

export async function bindEvents() {
    document.querySelectorAll('.change-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const type = e.target.dataset.type;
            const container = document.getElementById('equipList');
            const listDiv = document.getElementById('availableEquips');
            const filtered = equipmentList.filter(eq => eq.type === type);
            let html = '';
            filtered.forEach(eq => {
                html += `
                    <div class="item-row">
                        <span>${eq.name} (攻击+${eq.attack} 防御+${eq.defense})</span>
                        <button class="equip-select" data-type="${type}" data-name="${eq.$id}">穿戴</button>
                    </div>
                `;
            });
            listDiv.innerHTML = html;
            container.style.display = 'block';
            
            document.querySelectorAll('.equip-select').forEach(sel => {
                sel.addEventListener('click', async (ev) => {
                    const equipType = ev.target.dataset.type;
                    const equipId = ev.target.dataset.name;
                    const data = getPlayerData();
                    if (equipType === 'weapon') data.equipWeapon = equipId;
                    else if (equipType === 'armor') data.equipArmor = equipId;
                    else if (equipType === 'accessory') data.equipAccessory = equipId;
                    await savePlayerData();
                    alert(`已装备 ${equipId}`);
                    container.style.display = 'none';
                    document.getElementById('contentPanel').innerHTML = await renderEquipmentPanel();
                    bindEvents();
                });
            });
        });
    });
}