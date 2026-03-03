import { renderMapPanel, bindMapEvents } from './map.js';
import { renderStatePanel } from './state.js';
import { renderBackpackPanel } from './backpack.js';
import { renderEquipmentPanel } from './equipment.js';
import { renderShopPanel } from './shop.js';
import { renderCrystalShopPanel } from './crystalShop.js';
import { renderSignPanel } from './sign.js';
import { renderManagePanel } from './manage.js';
import { getPlayerData } from './gameCore.js';

const contentPanel = document.getElementById('contentPanel');

export async function showPanel(panelName) {
    let content = '';
    switch (panelName) {
        case 'map': content = await renderMapPanel(); break;
        case 'state': content = await renderStatePanel(); break;
        case 'backpack': content = await renderBackpackPanel(); break;
        case 'equip': content = await renderEquipmentPanel(); break;
        case 'shop': content = await renderShopPanel(); break;
        case 'crystal': content = await renderCrystalShopPanel(); break;
        case 'sign': content = await renderSignPanel(); break;
        case 'manage': content = await renderManagePanel(); break;
        default: content = await renderMapPanel();
    }
    contentPanel.innerHTML = content;
    await bindPanelEvents(panelName);
}

async function bindPanelEvents(panelName) {
    switch (panelName) {
        case 'map': await bindMapEvents(); break;
        case 'state': break;
        case 'backpack': await (await import('./backpack.js')).bindEvents(); break;
        case 'equip': await (await import('./equipment.js')).bindEvents(); break;
        case 'shop': await (await import('./shop.js')).bindEvents(); break;
        case 'crystal': await (await import('./crystalShop.js')).bindEvents(); break;
        case 'sign': await (await import('./sign.js')).bindEvents(); break;
        case 'manage': await (await import('./manage.js')).bindEvents(); break;
    }
}

export function updateHeaderUI() {
    const data = getPlayerData();
    if (!data) return;
    document.getElementById('playerName').innerText = data.name || '沈曦炎';
    document.getElementById('playerLv').innerText = `Lv.${data.level}`;
    document.getElementById('lingShi').innerText = data.lingShi;
    document.getElementById('hpDisplay').innerHTML = `${data.hp}/${data.maxHp}`;
    document.getElementById('cultivationVal').innerText = `${data.exp}/${data.expToNext}`;
    document.getElementById('currentLocTag').innerText = data.position || '新手村';
}

document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => showPanel(e.target.dataset.panel));
});

export function showGameScreen() {
    document.getElementById('authScreen').classList.add('hidden');
    document.getElementById('gameScreen').classList.remove('hidden');
    showPanel('map');
}