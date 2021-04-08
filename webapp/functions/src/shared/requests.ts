import { RoomType } from './dbmodel';

export interface GameActionRequest {
    roomDbId: string;
}

export interface ErrorResponse {
    success: false;
    message?: string;
}

export interface CreateRoomRequest {
    type: RoomType;
    name: string;
}

export type CreateRoomResponse = ErrorResponse | {
    success: true;
    databaseId: string;
    type: string,
    id: string;
};

export interface JoinRoomRequest {
    databaseId: string;
}

export type JoinRoomResponse = ErrorResponse | {
    success: true;
};

export interface RoomRequest {
    roomDbId: string;
}

export type RoomResponse = ErrorResponse | {
    success: true;
};
