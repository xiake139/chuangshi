// 配置常量
export const APPWRITE_ENDPOINT = 'https://fra.cloud.appwrite.io/v1';
export const PROJECT_ID = 'chuangshixiuluozhuan';
export const DATABASE_ID = 'chuangshixiuluozhuan';

// 集合ID
export const USERS_COLLECTION_ID = 'players';
export const MAP_COLLECTION_ID = 'maps';
export const SHOP_COLLECTION_ID = 'shop';
export const CRYSTAL_SHOP_COLLECTION_ID = 'crystal_shop';
export const PLAYER_DEFAULT_COLLECTION_ID = 'player_default';
export const MONSTERS_COLLECTION_ID = 'monsters';
export const EQUIPMENT_COLLECTION_ID = 'equipment';

// 通用 fetch 请求函数，自动携带 cookie
export async function apiRequest(path, options = {}) {
    const url = `${APPWRITE_ENDPOINT}${path}`;
    const headers = {
        'Content-Type': 'application/json',
        'X-Appwrite-Project': PROJECT_ID,
        ...(options.headers || {})
    };
    try {
        const response = await fetch(url, {
            ...options,
            headers,
            credentials: 'include',
            mode: 'cors'
        });
        const data = await response.json();
        if (!response.ok) {
            // 输出详细错误
            console.error('API 请求失败:', {
                url,
                status: response.status,
                data
            });
            const error = new Error(data.message || `HTTP ${response.status}`);
            error.code = data.code;
            error.type = data.type;
            throw error;
        }
        return data;
    } catch (error) {
        console.error('网络或解析错误:', error);
        throw error;
    }
}