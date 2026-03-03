import { Client, Account, Databases } from 'https://cdn.jsdelivr.net/npm/appwrite@13.0.0/+esm';

const client = new Client();
client
    .setEndpoint('https://fra.cloud.appwrite.io/v1')
    .setProject('chuangshixiuluozhuan');

export const account = new Account(client);
export const databases = new Databases(client);

export const DATABASE_ID = 'chuangshixiuluozhuan';
export const USERS_COLLECTION_ID = 'players';
export const MAP_COLLECTION_ID = 'maps';
export const SHOP_COLLECTION_ID = 'shop';
export const CRYSTAL_SHOP_COLLECTION_ID = 'crystal_shop';
export const PLAYER_DEFAULT_COLLECTION_ID = 'player_default';
export const MONSTERS_COLLECTION_ID = 'monsters';
export const EQUIPMENT_COLLECTION_ID = 'equipment';