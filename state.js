// ==================== 全局状态 ====================
let player = null;
let inventory = [];
let currentTab = 'login';
let gameLog = [];

let dailyCheckin = { last: null, days: 0 };
let quests = [];
let friends = [];
let mails = [];
let guild = null;
let gachaHistory = [];
let pets = [];
let marketplace = [];
let dailyTasks = [];
let activeEvent = null;

let userId = null; // 当前登录用户 ID，从 Appwrite 获取