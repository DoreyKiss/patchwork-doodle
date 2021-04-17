import { DbRoom, RoomType } from '../shared/dbmodel';
import { RoomResponse } from '../shared/requests';
import { GameManagerBase } from './gameManagerBase';
import { PatchworkDoodleGameManager } from './patchworkDoodle/patchworkDoodleGameManager';

type Constructor<T> = {
    new(...args: unknown[]): T;
    readonly prototype: T;
};

const managerTypes: Record<RoomType, Constructor<GameManagerBase>> = {
    'patchwork_doodle': PatchworkDoodleGameManager
};

class DefaultGameManager extends GameManagerBase {
    createSpecificRoom(): DbRoom { throw new Error('Method not implemented.'); }
    action(): Promise<RoomResponse> { throw new Error('Method not implemented.'); }
}

export function getDefaultGameManager(roomDbId: string, userId: string): DefaultGameManager {
    const manager = new DefaultGameManager();
    if (manager) {
        manager.init(roomDbId, userId);
    }

    return manager;
}

export function getGameManager(roomType: RoomType, roomDbId: string, userId: string): GameManagerBase {
    const manager = new managerTypes[roomType];
    if (manager) {
        manager.init(roomDbId, userId);
    }

    return manager;
}
