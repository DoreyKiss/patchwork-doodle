import { RoomType, ROOM_TYPES } from '../dbmodel';

export function createRoomDatabaseId(type: RoomType, id: string): string;
export function createRoomDatabaseId(type: string, id: string): string | null {
    if (!ROOM_TYPES.includes(type as RoomType)) {
        return null;
    }
    return `${type}|${id}`;
}

export function parseRoomId(roomDatabaseId: string): { type: RoomType, id: string; } | null {
    const [type, id] = roomDatabaseId.split('|');
    if (!ROOM_TYPES.includes(type as RoomType)) {
        return null;
    }
    return { type: type as RoomType, id };
}
