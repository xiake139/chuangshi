import { getPlayerData, savePlayerData } from './gameCore.js';
import { showLog } from './ui.js';

const rewards = [
    { day: 1, lingShi: 50, items: { '回血丹': 2 } },
    { day: 2, lingShi: 80, items: { '聚灵丹': 1 } },
    { day: 3, lingShi: 120, items: { '大回血丹': 2 } },
    { day: 4, lingShi: 150, items: { '攻击符': 2 } },
    { day: 5, lingShi: 200, items: { '筑基丹': 1 } },
    { day: 6, lingShi: 300, items: { '防御符': 3 } },
    { day: 7, lingShi: 500, items: { '筑基丹': 3 } }
];

export async function renderSignPanel() {
    const data = getPlayerData();
    const continuous = data.continuousSign || 0;
    let html = `<h3>每日签到</h3><p>连续签到：${continuous}天</p>`;
    rewards.forEach((r, idx) => {
        let day = idx + 1;
        let status = (day === continuous + 1) ? '（可签到）' : (day <= continuous ? '（已完成）' : '（未解锁）');
        let itemDesc = Object.entries(r.items).map(([k,v]) => `${k}x${v}`).join(' + ');
        html += `<div class="item-row">第${day}天: ${r.lingShi}灵石 + ${itemDesc} ${status}</div>`;
    });
    html += `<button class="btn" id="signBtn">签到</button>`;
    return html;
}

export async function bindEvents() {
    document.getElementById('signBtn')?.addEventListener('click', async () => {
        const data = getPlayerData();
        const today = new Date().toDateString();
        if (data.lastSignDate === today) {
            showLog('今天已经签过到了');
            return;
        }
        let continuous = data.continuousSign || 0;
        if (data.lastSignDate) {
            const last = new Date(data.lastSignDate);
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            if (last.toDateString() !== yesterday.toDateString()) continuous = 0;
        }
        const nextDay = continuous + 1;
        const rewardIdx = (nextDay - 1) % 7;
        const reward = rewards[rewardIdx];
        data.lingShi += reward.lingShi;
        for (let [item, count] of Object.entries(reward.items)) {
            if (!data.backpack[item]) data.backpack[item] = 0;
            data.backpack[item] += count;
        }
        data.continuousSign = (continuous % 7) + 1;
        data.lastSignDate = today;
        await savePlayerData();
        showLog(`签到成功！获得${reward.lingShi}灵石及奖励。`);
        document.getElementById('contentPanel').innerHTML = await renderSignPanel();
        bindEvents();
    });
}