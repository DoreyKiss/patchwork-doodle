import { RoomType } from '../shared/dbmodel';
import { GameManagerBase } from './gameManagerBase';
import { PatchworkDoodleGameManager } from './patchworkDoodle/patchworkDoodleGameManager';

type Constructor<T> = {
    new(...args: unknown[]): T;
    readonly prototype: T;
};

const managerTypes: Record<RoomType, Constructor<GameManagerBase>> = {
    'patchwork_doodle': PatchworkDoodleGameManager
};

export function getGameManager(roomType: RoomType, roomDbId: string, userId: string): GameManagerBase {
    const manager = new managerTypes[roomType];
    if (manager) {
        manager.init(roomDbId, userId);
    }

    return manager;
}