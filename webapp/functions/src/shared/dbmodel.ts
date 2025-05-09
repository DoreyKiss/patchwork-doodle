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
    /** Information about the room itself. */
    meta: DbRoomMeta;

    /** 
     * User presence.
     * {userId: {connectionId: true}} 
     * */
    connections: DbRoomConnections;

    /**
     * Private part of the game state for each user such as cards in hand.
     * {userId: state} 
     * */
    private: Record<string, DbEmptyPrivateState>;

    /** Internal game state required by backend to actually run the game. */
    internal: DbEmptyInternalState;

    /** Public game state which all connected users may see. */
    public: DbPublicState;
}

export interface DbEmptyPrivateState { }

export interface DbEmptyInternalState { }

export interface DbPublicState {
    step: string;
    readyStates: Record<string, boolean>;
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

export enum CommonGameSteps {
    lobby = 'lobby'
}

export type DbRoomUser = { name: string; };

export type DbRoomUsers = Record<string, DbRoomUser>;
export type DbRoomConnections = Record<string, IndexGroup>;
