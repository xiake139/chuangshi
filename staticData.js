// ==================== 静态数据 ====================
const shopItems = [
    { id: 'sword1', name: '铁剑', type: 'weapon', price: 100, atk: 5, def: 0, agi: 0, desc: '攻击+5' },
    { id: 'sword2', name: '青铜剑', type: 'weapon', price: 250, atk: 12, def: 0, agi: 0, desc: '攻击+12' },
    { id: 'armor1', name: '皮甲', type: 'armor', price: 80, atk: 0, def: 3, agi: 0, desc: '防御+3' },
    { id: 'armor2', name: '锁子甲', type: 'armor', price: 200, atk: 0, def: 8, agi: -1, desc: '防御+8，敏捷-1' },
    { id: 'ring1', name: '敏捷戒指', type: 'accessory', price: 150, atk: 0, def: 0, agi: 2, desc: '敏捷+2' },
    { id: 'potion', name: '治疗药水', type: 'consumable', price: 30, hpRestore: 30, desc: '回复30HP' },
    { id: 'potion2', name: '强力治疗药水', type: 'consumable', price: 80, hpRestore: 80, desc: '回复80HP' },
    { id: 'petEgg', name: '宠物蛋', type: 'pet', price: 200, desc: '随机孵化一只宠物' },
    { id: 'material1', name: '铁矿', type: 'material', price: 20, desc: '锻造材料' },
];

const dungeons = [
    { id: 'd1', name: '寂静森林', minLevel: 1, monster: '哥布林', hp: 30, atk: 8, rewardExp: 50, rewardGold: 30, drops: [{ id: 'potion', rate: 0.3 }, { id: 'material1', rate: 0.5 }] },
    { id: 'd2', name: '幽暗矿洞', minLevel: 3, monster: '蝙蝠群', hp: 60, atk: 15, rewardExp: 80, rewardGold: 50, drops: [{ id: 'armor1', rate: 0.2 }, { id: 'material1', rate: 0.6 }] },
    { id: 'd3', name: '火龙巢穴', minLevel: 5, monster: '幼龙', hp: 120, atk: 25, rewardExp: 200, rewardGold: 150, drops: [{ id: 'sword2', rate: 0.3 }, { id: 'petEgg', rate: 0.1 }] },
];

const petTemplates = [
    { id: 'pet1', name: '小狼', type: 'pet', atk: 3, def: 1, agi: 2, desc: '攻击+3,防御+1,敏捷+2' },
    { id: 'pet2', name: '灵猫', type: 'pet', atk: 1, def: 0, agi: 5, desc: '攻击+1,敏捷+5' },
    { id: 'pet3', name: '龟丞相', type: 'pet', atk: 0, def: 8, agi: -2, desc: '防御+8,敏捷-2' },
];

const questTemplates = [
    { id: 'q1', name: '初次战斗', desc: '击败任意怪物1次', target: 1, type: 'kill', rewardExp: 50, rewardGold: 50 },
    { id: 'q2', name: '收集材料', desc: '获得5个铁矿', target: 5, type: 'collect', itemId: 'material1', rewardExp: 100, rewardGold: 80 },
    { id: 'q3', name: '装备收集', desc: '装备3件不同装备', target: 3, type: 'equip', rewardExp: 150, rewardGold: 120 },
];

const dailyTaskTemplates = [
    { id: 'dt1', name: '每日登录', desc: '登录游戏', target: 1, type: 'login', rewardExp: 20, rewardGold: 30 },
    { id: 'dt2', name: '副本挑战', desc: '完成任意副本2次', target: 2, type: 'dungeon', rewardExp: 40, rewardGold: 50 },
    { id: 'dt3', name: '使用药水', desc: '使用1瓶药水', target: 1, type: 'usePotion', rewardExp: 15, rewardGold: 20 },
];