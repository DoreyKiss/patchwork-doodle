import { GameActionRequest } from '../requests';

export type PatchworkDoodleAction = StartGameAction | DoodleCardAction;

export type StartGameAction = GameActionRequest & {
    type: 'start';
};

export type DoodleCardAction = GameActionRequest & {
    type: 'doodle_card';
    cardId: string;
    x: number;
    y: number;
    rotationCount: number;
    isFlipped: boolean;
    power?: DoodlePower;
};

export type DoodlePower = DoodleOneTilePower | PickNeighborPower | CutPatchPower;

export type DoodleOneTilePower = {
    type: 'one';
};

export type PickNeighborPower = {
    type: 'neighbor';
};

export type CutPatchPower = {
    type: 'cut';
    axis: 'x' | 'y';
    axisPos: number;
    /** Left/Top = 0, Right/Bottom = 1 */
    selectedPiece: 0 | 1;
};
