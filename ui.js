// ==================== 界面渲染 ====================
function render() {
    const app = document.getElementById('app');
    if (!app) return;
    // 检查是否已登录（通过 Appwrite 会话）
    // 由于无法同步获取，我们通过全局 userId 是否存在来判断（但 userId 只在登录后设置）
    // 更稳妥：尝试获取会话，但会异步。这里沿用原来的逻辑：如果 !Parse.User.current() 改为判断 appwriteAccount.get 但会异步。
    // 简单处理：通过检查全局 userId 是否有效，但初始加载时 userId 可能为 null，且未登录时也为 null，无法区分。
    // 因此我们依赖 main.js 中的初始化逻辑：如果未登录，render 时会显示登录界面。
    // 这里沿用原判断方式：如果 userId 为 null 且没有尝试自动登录？实际上 main.js 已经处理了自动登录，若失败 userId 仍为 null。
    // 所以我们直接用 userId 是否为 null 来判断。
    if (!userId) {
        app.innerHTML = renderAuthScreen();
        attachAuthEvents();
        return;
    }
    app.innerHTML = renderMainGame();
    attachGameEvents();
}

function renderAuthScreen() {
    return `
        <div class="panel" style="text-align:center;">
            <h1>📜 创世修仙 · 文字RPG</h1>
            <div id="authTabLogin" class="tab-content active">
                <h2>登录</h2>
                <input type="email" id="loginEmail" placeholder="邮箱" />
                <input type="password" id="loginPassword" placeholder="密码" />
                <button id="loginBtn">进入冒险</button>
                <p style="color:#8895b0;">还没有契约？ <button id="goToRegisterBtn" style="background:transparent; border:none; box-shadow:none; text-decoration:underline;">缔结契约</button></p>
            </div>
            <div id="authTabRegister" class="tab-content">
                <h2>注册</h2>
                <input type="email" id="regEmail" placeholder="邮箱" />
                <input type="password" id="regPassword" placeholder="密码" />
                <input type="text" id="regName" placeholder="角色名称" />
                <button id="registerBtn">注册并开始</button>
                <button id="backToLoginBtn">返回登录</button>
            </div>
            <div id="authError" class="error-msg" style="display:none;"></div>
        </div>
    `;
}

function renderMainGame() {
    const stats = calcPlayerStats();
    const hpPercent = (player.hp / player.maxHp) * 100;
    let mainContent = '';
    if (currentTab === 'status') mainContent = renderStatus();
    else if (currentTab === 'inventory') mainContent = renderInventory();
    else if (currentTab === 'dungeon') mainContent = renderDungeon();
    else if (currentTab === 'shop') mainContent = renderShop();
    else if (currentTab === 'map') mainContent = renderMap();
    else if (currentTab === 'checkin') mainContent = renderCheckin();
    else if (currentTab === 'extra') mainContent = renderExtra();

    return `
        <div class="panel" style="padding:16px;">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap;">
                <h2 style="border:none;">⚔️ ${player.name} Lv.${player.level}</h2>
                <div style="color:#b7c9e2;">💰 ${player.gold} G</div>
            </div>
            <div style="background:#0b0f1a; border-radius:20px; height:20px; margin:10px 0;">
                <div style="width:${hpPercent}%; background:#aa8cd2; height:20px; border-radius:20px;"></div>
            </div>
            <div class="stat-grid">
                <span>❤️ ${player.hp}/${player.maxHp}</span>
                <span>⚔️ ${stats.attack}</span>
                <span>🛡️ ${stats.defense}</span>
                <span>💨 ${stats.agility}</span>
                <span>✨ ${player.exp} EXP</span>
            </div>
            <div>装备: 武${player.weapon ? player.weapon.name : '无'} 防${player.armor ? player.armor.name : '无'} 饰${player.accessory ? player.accessory.name : '无'} 宠${player.pet ? player.pet.name : '无'}</div>
        </div>
        <div class="nav-bar">
            <button class="tab-btn" data-tab="status">📊 状态</button>
            <button class="tab-btn" data-tab="inventory">🎒 背包</button>
            <button class="tab-btn" data-tab="dungeon">🏹 打怪</button>
            <button class="tab-btn" data-tab="shop">🏪 商城</button>
            <button class="tab-btn" data-tab="map">🗺️ 地图</button>
            <button class="tab-btn" data-tab="checkin">📆 签到</button>
            <button class="tab-btn special" data-tab="extra">✨ 额外功能</button>
        </div>
        <div class="panel">${mainContent}</div>
        <div style="display: flex; align-items: center; gap: 8px; margin-top: 16px;">
            <div class="log-area" style="flex: 1;">${gameLog.map(msg => `<div>${msg}</div>`).join('')}</div>
            <button id="clearLogBtn" style="padding: 8px 16px; background: #3c4a68;">🗑️ 清空</button>
        </div>
        <div style="text-align:right;"><button id="logoutBtn">🚪 登出</button></div>
    `;
}

function renderStatus() {
    const stats = calcPlayerStats();
    return `
        <h3>⚜️ 角色状态</h3>
        <div>名称：${player.name}</div>
        <div>等级：${player.level} (下一级需 ${player.level * 100} EXP)</div>
        <div>基础攻击：${player.baseAttack}  总攻击：${stats.attack}</div>
        <div>基础防御：${player.baseDefense}  总防御：${stats.defense}</div>
        <div>基础敏捷：${player.baseAgility}  总敏捷：${stats.agility}</div>
        <div>生命：${player.hp}/${player.maxHp}</div>
        <div>宠物：${player.pet ? player.pet.name : '无'}</div>
        <div>武器：${player.weapon ? player.weapon.name : '无'}  防具：${player.armor ? player.armor.name : '无'}  饰品：${player.accessory ? player.accessory.name : '无'}</div>
        <h3>🏅 成就</h3>
        <div>击杀数: ${player.kills || 0}  签到: ${dailyCheckin.days}天</div>
    `;
}

function renderInventory() {
    if (!inventory.length) return '<p>背包空空如也。</p>';
    let html = '<h3>📦 背包</h3><div class="item-list">';
    inventory.forEach((item, idx) => {
        let actions = '';
        if (item.type === 'consumable') {
            actions = `<button class="use-item" data-index="${idx}">使用</button>`;
        } else if (item.type === 'weapon' || item.type === 'armor' || item.type === 'accessory') {
            const equipped = (player.weapon && player.weapon.id === item.id) ||
                             (player.armor && player.armor.id === item.id) ||
                             (player.accessory && player.accessory.id === item.id);
            actions = equipped ? '<span>已装备</span>' : `<button class="equip-item" data-index="${idx}">装备</button>`;
        } else if (item.type === 'pet') {
            const equipped = player.pet && player.pet.id === item.id;
            actions = equipped ? '<span>已出战</span>' : `<button class="equip-pet" data-index="${idx}">出战</button>`;
        }
        html += `<div class="item-entry">
            <span><b>${item.name}</b> x${item.qty || 1} <small>${item.desc || ''}</small></span>
            <span>${actions}</span>
        </div>`;
    });
    html += '</div>';
    return html;
}

function renderDungeon() {
    let html = '<h3>🏰 副本 · 打怪</h3>';
    dungeons.forEach(d => {
        html += `<div style="margin:10px 0; background:#1e2439; padding:10px; border-radius:16px;">
            <b>${d.name}</b> (Lv.${d.minLevel}+) 怪物:${d.monster} (HP${d.hp} 攻${d.atk})<br>
            奖励: ${d.rewardExp}exp/${d.rewardGold}G<br>
            <button class="fight-dungeon" data-dungeon='${JSON.stringify(d)}'>进入战斗</button>
        </div>`;
    });
    return html;
}

function renderShop() {
    let html = '<h3>🏪 神秘商店</h3><div class="item-list">';
    shopItems.forEach(item => {
        html += `<div class="item-entry">
            <span><b>${item.name}</b> - ${item.price}G <small>${item.desc}</small></span>
            <button class="buy-item" data-item='${JSON.stringify(item)}'>购买</button>
        </div>`;
    });
    html += '</div>';
    return html;
}

function renderMap() {
    return `
        <h3>🗺️ 世界地图</h3>
        <p>🌲 寂静森林 ·  🌋 烈焰山 ·  🏰 王都</p>
        <button class="travel" data-to="森林">前往森林 (可能遇到草药)</button>
        <button class="travel" data-to="山脚">山脚 (采矿点)</button>
        <button class="travel" data-to="遗迹">古老遗迹 (随机事件)</button>
    `;
}

function renderCheckin() {
    const today = new Date().toDateString();
    const checked = dailyCheckin.last === today;
    return `
        <h3>📆 每日签到</h3>
        <p>累计签到: ${dailyCheckin.days} 天</p>
        ${checked ? '<p>✅ 今日已签到</p>' : '<button id="checkinBtn">✨ 签到领取奖励</button>'}
        <p>连续签到奖励: 7天额外礼包</p>
    `;
}

function renderExtra() {
    return `
        <h3>✨ 额外功能</h3>
        <div style="display:grid; gap:10px; grid-template-columns: repeat(2,1fr);">
            <div><button class="extra-func" data-func="quests">📋 1. 任务/成就</button> <span>${quests.filter(q => !q.completed).length}进行中</span></div>
            <div><button class="extra-func" data-func="friends">👥 2. 好友</button> <span>好友数: ${friends.length}</span></div>
            <div><button class="extra-func" data-func="mails">✉️ 3. 邮件</button> <span>${mails.length}封</span></div>
            <div><button class="extra-func" data-func="guild">⚔️ 4. 公会</button> <span>${guild ? guild.name : '未加入'}</span></div>
            <div><button class="extra-func" data-func="gacha">🎴 5. 抽卡/扭蛋</button> <span>抽卡次数: ${gachaHistory.length}</span></div>
            <div><button class="extra-func" data-func="pets">🐕 6. 宠物</button> <span>宠物: ${pets.length}</span></div>
            <div><button class="extra-func" data-func="market">🏷️ 7. 交易行</button> <span>上架${marketplace.length}</span></div>
            <div><button class="extra-func" data-func="dailyTasks">⏳ 8. 每日任务</button> <span>日常${dailyTasks.filter(t => !t.completed).length}</span></div>
            <div><button class="extra-func" data-func="events">🎉 9. 游戏活动</button> <span>${activeEvent ? '进行中' : '无'}</span></div>
            <div><button class="extra-func" data-func="leaderboard">🏆 10. 排行榜</button> <span>(点击查看)</span></div>
        </div>
        <div id="extraDetail" class="extra-detail-panel">点击上方按钮查看详情。</div>
    `;
}