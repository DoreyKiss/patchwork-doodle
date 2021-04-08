/* eslint-disable @typescript-eslint/no-empty-interface */
export interface DbModel {
    users: Record<string, DbUser>;
    rooms: Record<string, DbRoom>;
}

export type IndexGroup = Record<string, true>;

export interface DbUser {
    displayName?: string;
    /** {roomId: true} */
    rooms: IndexGroup;
}

export interface DbRoom {
    meta: DbRoomMeta;

    /** {userId: {connectionId: true}} */
    connections: DbRoomConnections;

    /** {userId: state} */
    private: Record<string, DbPrivateState> | false;
    internal: DbInternalState | false;
    public: DbPrivateState | false;
}

export interface DbPrivateState { }

export interface DbInternalState {
}

export interface DbPublicState {
    step: string;
}

export const ROOM_TYPES = ['patchwork_doodle'] as const;
export type RoomType = typeof ROOM_TYPES[number];

export interface DbRoomMeta {
    createdAt: number;
    name: string;
    owner: string;
    /** {userId: true} */
    users: DbRoomUsers;
    players: IndexGroup;
    spectators: IndexGroup;
}

export type DbRoomUsers = Record<string, { name: string; }> | false;
export type DbRoomConnections = Record<string, IndexGroup> | false;
