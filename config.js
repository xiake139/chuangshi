// ==================== 配置 (Appwrite) ====================
const APPWRITE_ENDPOINT = 'https://sgp.cloud.appwrite.io/v1';   // 您的 API 端点
const APPWRITE_PROJECT_ID = '69a51a3d0032cf6aa54f';             // 您的项目 ID
const APPWRITE_DATABASE_ID = 'chuangshi';                       // 您的数据库 ID
const APPWRITE_COLLECTION_ID = 'game_data';                     // 您的集合 ID

// 初始化 Appwrite 客户端
const client = new Appwrite.Client();
client
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID);

const account = new Appwrite.Account(client);
const databases = new Appwrite.Databases(client);

// 挂载到全局，方便其他文件使用
window.appwriteAccount = account;
window.appwriteDatabases = databases;
window.APPWRITE_DATABASE_ID = APPWRITE_DATABASE_ID;
window.APPWRITE_COLLECTION_ID = APPWRITE_COLLECTION_ID;