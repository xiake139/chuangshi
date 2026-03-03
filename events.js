// ==================== 认证事件 (Appwrite) ====================
function attachAuthEvents() {
    const goToRegisterBtn = document.getElementById('goToRegisterBtn');
    const backToLoginBtn = document.getElementById('backToLoginBtn');
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');

    if (goToRegisterBtn) {
        goToRegisterBtn.addEventListener('click', () => {
            document.getElementById('authTabLogin').classList.remove('active');
            document.getElementById('authTabRegister').classList.add('active');
        });
    }
    if (backToLoginBtn) {
        backToLoginBtn.addEventListener('click', () => {
            document.getElementById('authTabRegister').classList.remove('active');
            document.getElementById('authTabLogin').classList.add('active');
        });
    }

    if (loginBtn) {
        loginBtn.addEventListener('click', async () => {
            const email = document.getElementById('loginEmail').value.trim();
            const pass = document.getElementById('loginPassword').value;
            const errorDiv = document.getElementById('authError');
            errorDiv.style.display = 'none';
            if (!email || !pass) {
                errorDiv.innerHTML = '邮箱和密码不能为空';
                errorDiv.style.display = 'block';
                return;
            }
            try {
                await appwriteAccount.createEmailSession(email, pass);
                const user = await appwriteAccount.get();
                userId = user.$id;
                await loadGameData();
                currentTab = 'status';
                addLog(`欢迎回来，${player.name}`);
                render();
            } catch (e) {
                errorDiv.innerHTML = e.message;
                errorDiv.style.display = 'block';
            }
        });
    }

    if (registerBtn) {
        registerBtn.addEventListener('click', async () => {
            const email = document.getElementById('regEmail').value.trim();
            const pass = document.getElementById('regPassword').value;
            const name = document.getElementById('regName').value.trim() || '冒险者';
            const errorDiv = document.getElementById('authError');
            errorDiv.style.display = 'none';
            if (!email || !pass) {
                errorDiv.innerHTML = '邮箱和密码不能为空';
                errorDiv.style.display = 'block';
                return;
            }
            if (pass.length < 6) {
                errorDiv.innerHTML = '密码至少6位';
                errorDiv.style.display = 'block';
                return;
            }
            try {
                // 创建用户
                await appwriteAccount.create('unique()', email, pass, name);
                // 自动登录
                await appwriteAccount.createEmailSession(email, pass);
                const user = await appwriteAccount.get();
                userId = user.$id;

                // 初始化新玩家数据
                player = {
                    name: name,
                    level: 1,
                    exp: 0,
                    gold: 100,
                    hp: 100,
                    maxHp: 100,
                    baseAttack: 15,
                    baseDefense: 0,
                    baseAgility: 0,
                    baseMaxHp: 100,
                    weapon: null,
                    armor: null,
                    accessory: null,
                    pet: null,
                    kills: 0,
                };
                inventory = [];
                dailyCheckin = { last: null, days: 0 };
                quests = [];
                friends = [];
                mails = [];
                guild = null;
                gachaHistory = [];
                pets = [];
                marketplace = [];
                dailyTasks = [];
                activeEvent = null;

                await saveCharacter();
                addLog('角色创建成功，冒险开始！');
                render();
            } catch (e) {
                const errorDetail = e.code ? `错误码 ${e.code}: ${e.message}` : e.message;
                errorDiv.innerHTML = `注册失败: ${errorDetail}`;
                errorDiv.style.display = 'block';
                console.error('注册错误', e);
            }
        });
    }

    // 切换登录注册的额外事件
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('switch-to-register')) {
            const email = document.getElementById('loginEmail').value;
            document.getElementById('authTabLogin').classList.remove('active');
            document.getElementById('authTabRegister').classList.add('active');
            document.getElementById('regEmail').value = email;
            document.getElementById('authError').style.display = 'none';
        } else if (e.target.classList.contains('switch-to-login')) {
            const email = document.getElementById('regEmail').value;
            document.getElementById('authTabRegister').classList.remove('active');
            document.getElementById('authTabLogin').classList.add('active');
            document.getElementById('loginEmail').value = email;
            document.getElementById('authError').style.display = 'none';
        }
    });
}

// ==================== 游戏事件 ====================
function attachGameEvents() {
    // 标签页切换
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            currentTab = e.target.dataset.tab;
            render();
        });
    });

    // 登出
    document.getElementById('logoutBtn')?.addEventListener('click', logout);

    // 清空日志
    document.getElementById('clearLogBtn')?.addEventListener('click', () => {
        gameLog = [];
        render();
    });

    // 使用物品
    document.querySelectorAll('.use-item').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const idx = e.target.dataset.index;
            const item = inventory[idx];
            if (item.type === 'consumable') {
                if (item.hpRestore) {
                    player.hp = Math.min(player.hp + item.hpRestore, player.maxHp);
                    addLog(`使用了 ${item.name}，恢复 ${item.hpRestore} HP`);
                } else {
                    addLog(`使用了 ${item.name}，但没有任何效果`);
                }
                if (item.qty && item.qty > 1) {
                    item.qty -= 1;
                } else {
                    inventory.splice(idx, 1);
                }
                updateDailyTaskProgress('usePotion', 1);
                await saveCharacter();
                render();
            } else {
                addLog('该物品不能直接使用');
            }
        });
    });

    // 装备物品
    document.querySelectorAll('.equip-item').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const idx = e.target.dataset.index;
            const item = inventory[idx];
            if (item.type === 'weapon') {
                if (player.weapon) inventory.push({ ...player.weapon, qty: 1 });
                player.weapon = { 
                    id: item.id, 
                    name: item.name, 
                    type: item.type,
                    desc: item.desc || '',
                    atk: item.atk || 0, 
                    def: item.def || 0, 
                    agi: item.agi || 0 
                };
                if (item.qty && item.qty > 1) item.qty--; else inventory.splice(idx, 1);
                addLog(`装备了 ${item.name}`);
            } else if (item.type === 'armor') {
                if (player.armor) inventory.push({ ...player.armor, qty: 1 });
                player.armor = { 
                    id: item.id, 
                    name: item.name, 
                    type: item.type,
                    desc: item.desc || '',
                    atk: item.atk || 0, 
                    def: item.def || 0, 
                    agi: item.agi || 0 
                };
                if (item.qty && item.qty > 1) item.qty--; else inventory.splice(idx, 1);
                addLog(`装备了 ${item.name}`);
            } else if (item.type === 'accessory') {
                if (player.accessory) inventory.push({ ...player.accessory, qty: 1 });
                player.accessory = { 
                    id: item.id, 
                    name: item.name, 
                    type: item.type,
                    desc: item.desc || '',
                    atk: item.atk || 0, 
                    def: item.def || 0, 
                    agi: item.agi || 0 
                };
                if (item.qty && item.qty > 1) item.qty--; else inventory.splice(idx, 1);
                addLog(`装备了 ${item.name}`);
            }
            updateHp();
            await saveCharacter();
            render();
        });
    });

    // 出战宠物
    document.querySelectorAll('.equip-pet').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const idx = e.target.dataset.index;
            const pet = inventory[idx];
            if (pet.type === 'pet') {
                if (player.pet) inventory.push({ ...player.pet, qty: 1 });
                player.pet = { 
                    id: pet.id, 
                    name: pet.name, 
                    type: pet.type,
                    desc: pet.desc || '',
                    atk: pet.atk || 0, 
                    def: pet.def || 0, 
                    agi: pet.agi || 0 
                };
                inventory.splice(idx, 1);
                addLog(`${pet.name} 已出战`);
                updateHp();
                await saveCharacter();
                render();
            }
        });
    });

    // 购买物品
    document.querySelectorAll('.buy-item').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const item = JSON.parse(e.target.dataset.item);
            if (player.gold >= item.price) {
                player.gold -= item.price;
                const existing = inventory.find(i => i.id === item.id);
                if (existing) {
                    existing.qty = (existing.qty || 1) + 1;
                } else {
                    const newItem = { ...item };
                    delete newItem.price;
                    newItem.qty = 1;
                    inventory.push(newItem);
                }
                addLog(`购买 ${item.name} 成功`);
                await saveCharacter();
                render();
            } else {
                addLog('金币不足');
            }
        });
    });

    // 副本战斗
    document.querySelectorAll('.fight-dungeon').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const d = JSON.parse(e.target.dataset.dungeon);
            if (player.level < d.minLevel) {
                addLog('等级不足，无法挑战');
                return;
            }
            const stats = calcPlayerStats();
            const playerPower = stats.attack + stats.agility * 0.5;
            const monsterPower = d.atk + d.hp * 0.2;
            const win = playerPower > monsterPower * (0.7 + Math.random() * 0.6);
            if (win) {
                player.exp += d.rewardExp;
                player.gold += d.rewardGold;
                player.kills = (player.kills || 0) + 1;
                addLog(`击败 ${d.monster}，获得 ${d.rewardExp}exp ${d.rewardGold}G`);
                d.drops.forEach(drop => {
                    if (Math.random() < drop.rate) {
                        const dropItem = shopItems.find(si => si.id === drop.id);
                        if (dropItem) {
                            const existing = inventory.find(i => i.id === dropItem.id);
                            if (existing) existing.qty = (existing.qty || 1) + 1;
                            else inventory.push({ ...dropItem, qty: 1 });
                            addLog(`掉落物品: ${dropItem.name}`);
                        }
                    }
                });
                if (player.exp >= player.level * 100) {
                    player.level++;
                    player.baseAttack += 3;
                    player.baseDefense += 2;
                    player.baseAgility += 1;
                    player.baseMaxHp += 20;
                    updateHp();
                    player.hp = player.maxHp;
                    addLog(`🎉 升级 LV.${player.level}！`);
                } else {
                    updateHp();
                }
                updateQuestProgress('kill', 1);
                updateDailyTaskProgress('dungeon', 1);
            } else {
                const damage = Math.max(1, d.atk - stats.defense / 2);
                player.hp -= Math.floor(damage);
                addLog(`苦战落败，HP-${Math.floor(damage)}`);
                if (player.hp <= 0) {
                    player.hp = 1;
                    addLog('你被击败了，但勉强逃生...');
                }
            }
            updateHp();
            await saveCharacter();
            render();
        });
    });

    // 签到
    document.getElementById('checkinBtn')?.addEventListener('click', async () => {
        const today = new Date().toDateString();
        if (dailyCheckin.last !== today) {
            dailyCheckin.last = today;
            dailyCheckin.days++;
            let rewardGold = 50;
            if (dailyCheckin.days % 7 === 0) rewardGold += 100;
            player.gold += rewardGold;
            addLog(`签到成功！第${dailyCheckin.days}天，获得${rewardGold}G`);
            await saveCharacter();
            render();
        }
    });

    // 地图旅行
    document.querySelectorAll('.travel').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const place = e.target.dataset.to;
            const r = Math.random();
            if (place === '森林') {
                if (r < 0.5) {
                    player.gold += 20;
                    addLog('在森林发现了草药，卖得20G');
                } else {
                    player.hp -= 5;
                    addLog('在森林遭遇野蜂，HP-5');
                }
            } else if (place === '山脚') {
                if (r < 0.3) {
                    inventory.push({ id: 'material1', name: '铁矿', type: 'material', qty: 1, desc: '锻造材料' });
                    addLog('在山脚发现了铁矿');
                } else {
                    player.hp -= 3;
                    addLog('山脚碎石掉落，HP-3');
                }
            } else if (place === '遗迹') {
                if (r < 0.2) {
                    player.gold += 100;
                    addLog('在遗迹发现宝藏，获得100G');
                } else if (r < 0.6) {
                    player.hp -= 15;
                    addLog('触发陷阱，HP-15');
                } else {
                    addLog('遗迹空无一物');
                }
            }
            updateHp();
            await saveCharacter();
            render();
        });
    });

    // 额外功能按钮
    document.querySelectorAll('.extra-func').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const func = e.target.dataset.func;
            const detailDiv = document.getElementById('extraDetail');
            let content = '';

            if (func === 'quests') {
                content = '<h4>📋 任务列表</h4>';
                quests.forEach(q => {
                    content += `<div>${q.name}: ${q.progress}/${q.target} ${q.completed ? '✅已完成' : ''}</div>`;
                });
                content += '<button id="claimQuestRewards">领取已完成任务奖励</button>';
            } else if (func === 'friends') {
                content = '<h4>👥 好友</h4>';
                if (friends.length === 0) content += '<p>暂无好友。输入ID添加：</p><input id="friendId" placeholder="好友UID"><button id="addFriendBtn">添加</button>';
                else {
                    friends.forEach(f => content += `<div>${f.name} (${f.id})</div>`);
                }
            } else if (func === 'mails') {
                content = '<h4>✉️ 邮件</h4>';
                if (mails.length === 0) content += '<p>暂无邮件。</p>';
                else {
                    mails.forEach((m, i) => {
                        content += `<div><b>${m.title}</b> ${m.content} <button class="claimMail" data-index="${i}">领取附件</button></div>`;
                    });
                }
            } else if (func === 'guild') {
                if (guild) {
                    content = `<h4>⚔️ 公会: ${guild.name}</h4><p>成员: ${guild.members ? guild.members.join(', ') : ''}</p><button id="leaveGuild">退出公会</button>`;
                } else {
                    content = '<p>未加入公会。创建或加入：</p><input id="guildName" placeholder="公会名称"><button id="createGuild">创建</button>';
                }
            } else if (func === 'gacha') {
                content = '<h4>🎴 抽卡 (100G/次)</h4>';
                content += '<button id="doGacha">抽一次</button> <button id="doGachaTen">十连抽</button>';
                content += '<div>历史: ' + gachaHistory.slice(-5).join(', ') + '</div>';
            } else if (func === 'pets') {
                content = '<h4>🐕 我的宠物</h4>';
                if (pets.length === 0) content += '<p>暂无宠物，可通过抽卡或购买宠物蛋获得。</p>';
                else {
                    pets.forEach(p => {
                        content += `<div>${p.name} (攻${p.atk} 防${p.def} 敏${p.agi}) <button class="selectPet" data-id="${p.id}">出战</button></div>`;
                    });
                }
            } else if (func === 'market') {
                const availableItems = inventory.filter(item => {
                    if (player.weapon && player.weapon.id === item.id) return false;
                    if (player.armor && player.armor.id === item.id) return false;
                    if (player.accessory && player.accessory.id === item.id) return false;
                    if (player.pet && player.pet.id === item.id) return false;
                    return true;
                });
                content = '<h4>🏷️ 交易行</h4>';
                content += '<div>上架物品：<select id="marketItemSelect">' + 
                    availableItems.map((item, idx) => `<option value="${idx}">${item.name}</option>`).join('') +
                    '</select> 价格<input id="marketPrice" type="number" value="50"> <button id="listMarket">上架</button></div>';
                content += '<h4>在售</h4>';
                marketplace.forEach((item, idx) => {
                    content += `<div>${item.name} - ${item.price}G 卖家:${item.seller} <button class="buyMarket" data-index="${idx}">购买</button></div>`;
                });
            } else if (func === 'dailyTasks') {
                content = '<h4>⏳ 每日任务</h4>';
                const today = new Date().toDateString();
                dailyTasks.forEach(t => {
                    if (t.date !== today) { t.progress = 0; t.completed = false; t.date = today; }
                    content += `<div>${t.name}: ${t.progress}/${t.target} ${t.completed ? '✅' : ''}</div>`;
                });
                content += '<button id="claimDailyRewards">领取已完成奖励</button>';
            } else if (func === 'events') {
                if (activeEvent) {
                    content = `<h4>🎉 当前活动: ${activeEvent.name}</h4><p>${activeEvent.desc}</p>`;
                } else {
                    content = '<p>暂无活动。</p><button id="startEvent">开启测试活动</button>';
                }
            } else if (func === 'leaderboard') {
                content = '<h4>🏆 排行榜</h4>';
                content += '<p>等级榜: 1. 勇者(Lv.10) 2. 魔法师(Lv.9) 3. 你(Lv.' + player.level + ')</p>';
                content += '<p>击杀榜: 1. 战神(100) 2. 猎手(80) 3. 你(' + (player.kills || 0) + ')</p>';
            }
            detailDiv.innerHTML = content;
            attachExtraButtons(func);
        });
    });
}

// 额外功能按钮的子事件
function attachExtraButtons(func) {
    if (func === 'quests') {
        document.getElementById('claimQuestRewards')?.addEventListener('click', async () => {
            quests.forEach(q => {
                if (q.progress >= q.target && !q.completed) {
                    q.completed = true;
                    player.exp += q.rewardExp;
                    player.gold += q.rewardGold;
                    addLog(`完成任务 ${q.name}，获得 ${q.rewardExp}exp ${q.rewardGold}G`);
                }
            });
            await saveCharacter();
            render();
        });
    } else if (func === 'friends') {
        document.getElementById('addFriendBtn')?.addEventListener('click', async () => {
            const fid = document.getElementById('friendId').value;
            if (fid) {
                friends.push({ id: fid, name: '好友' + fid.slice(0,4) });
                addLog(`添加好友成功`);
                await saveCharacter();
                render();
            }
        });
    } else if (func === 'mails') {
        document.querySelectorAll('.claimMail').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const idx = e.target.dataset.index;
                const mail = mails[idx];
                if (mail.attachment) {
                    player.gold += mail.attachment.gold || 0;
                    if (mail.attachment.item) {
                        inventory.push(mail.attachment.item);
                    }
                }
                mails.splice(idx, 1);
                addLog('领取邮件附件');
                await saveCharacter();
                render();
            });
        });
    } else if (func === 'guild') {
        document.getElementById('createGuild')?.addEventListener('click', async () => {
            const name = document.getElementById('guildName').value;
            if (name) {
                guild = { name, members: [userId] };
                addLog(`创建公会 ${name}`);
                await saveCharacter();
                render();
            }
        });
        document.getElementById('leaveGuild')?.addEventListener('click', async () => {
            guild = null;
            addLog('退出公会');
            await saveCharacter();
            render();
        });
    } else if (func === 'gacha') {
        document.getElementById('doGacha')?.addEventListener('click', async () => {
            if (player.gold >= 100) {
                player.gold -= 100;
                const r = Math.random();
                let result;
                if (r < 0.4) result = { ...shopItems.find(i => i.id === 'potion') };
                else if (r < 0.7) result = { ...shopItems.find(i => i.id === 'material1') };
                else if (r < 0.9) result = { ...petTemplates[Math.floor(Math.random() * petTemplates.length)] };
                else result = { ...shopItems.find(i => i.id === 'sword2') };
                result.qty = 1;
                inventory.push(result);
                gachaHistory.push(result.name);
                addLog(`抽卡获得: ${result.name}`);
                await saveCharacter();
                render();
            } else addLog('金币不足100');
        });
        document.getElementById('doGachaTen')?.addEventListener('click', async () => {
            if (player.gold >= 900) {
                player.gold -= 900;
                for (let i = 0; i < 10; i++) {
                    const r = Math.random();
                    let result;
                    if (r < 0.4) result = { ...shopItems.find(i => i.id === 'potion') };
                    else if (r < 0.7) result = { ...shopItems.find(i => i.id === 'material1') };
                    else if (r < 0.9) result = { ...petTemplates[Math.floor(Math.random() * petTemplates.length)] };
                    else result = { ...shopItems.find(i => i.id === 'sword2') };
                    result.qty = 1;
                    inventory.push(result);
                    gachaHistory.push(result.name);
                }
                addLog('十连抽完成');
                await saveCharacter();
                render();
            } else addLog('金币不足900');
        });
    } else if (func === 'pets') {
        document.querySelectorAll('.selectPet').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const petId = e.target.dataset.id;
                const pet = pets.find(p => p.id === petId);
                if (pet) {
                    if (player.pet) inventory.push({ ...player.pet, qty: 1 });
                    player.pet = { 
                        id: pet.id, 
                        name: pet.name, 
                        type: pet.type,
                        desc: pet.desc || '',
                        atk: pet.atk || 0, 
                        def: pet.def || 0, 
                        agi: pet.agi || 0 
                    };
                    pets = pets.filter(p => p.id !== petId);
                    addLog(`${pet.name} 已出战`);
                    updateHp();
                    await saveCharacter();
                    render();
                }
            });
        });
    } else if (func === 'market') {
        document.getElementById('listMarket')?.addEventListener('click', async () => {
            const select = document.getElementById('marketItemSelect');
            const idx = select.value;
            const price = parseInt(document.getElementById('marketPrice').value) || 50;
            if (idx !== '' && inventory[idx]) {
                const item = inventory[idx];
                const listingItem = { ...item };
                delete listingItem.qty;
                listingItem.price = price;
                listingItem.seller = userId;
                marketplace.push(listingItem);
                if (item.qty && item.qty > 1) {
                    item.qty--;
                } else {
                    inventory.splice(idx, 1);
                }
                addLog('上架成功');
                await saveCharacter();
                render();
            }
        });
        document.querySelectorAll('.buyMarket').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const idx = e.target.dataset.index;
                const listing = marketplace[idx];
                if (player.gold >= listing.price) {
                    player.gold -= listing.price;
                    const boughtItem = { ...listing, qty: 1 };
                    delete boughtItem.price;
                    delete boughtItem.seller;
                    inventory.push(boughtItem);
                    marketplace.splice(idx, 1);
                    addLog(`购买 ${listing.name} 成功`);
                    await saveCharacter();
                    render();
                } else addLog('金币不足');
            });
        });
    } else if (func === 'dailyTasks') {
        document.getElementById('claimDailyRewards')?.addEventListener('click', async () => {
            dailyTasks.forEach(t => {
                if (t.progress >= t.target && !t.completed) {
                    t.completed = true;
                    player.exp += t.rewardExp;
                    player.gold += t.rewardGold;
                    addLog(`完成每日任务 ${t.name}，获得奖励`);
                }
            });
            await saveCharacter();
            render();
        });
    } else if (func === 'events') {
        document.getElementById('startEvent')?.addEventListener('click', async () => {
            activeEvent = { name: '双倍掉落', desc: '活动期间副本掉落率双倍', start: new Date() };
            addLog('活动已开启');
            await saveCharacter();
            render();
        });
    }
}

// 任务进度更新
function updateQuestProgress(type, amount = 1) {
    quests.forEach(q => {
        if (!q.completed && q.type === type) {
            q.progress = Math.min(q.progress + amount, q.target);
        }
    });
}

// 每日任务进度更新
function updateDailyTaskProgress(type, amount = 1) {
    const today = new Date().toDateString();
    dailyTasks.forEach(t => {
        if (t.date !== today) {
            t.progress = 0;
            t.completed = false;
            t.date = today;
        }
        if (!t.completed && t.type === type) {
            t.progress = Math.min(t.progress + amount, t.target);
        }
    });
}