import { GameActionRequest } from '../requests';

export type PatchworkDoodleAction = StartGameAction | DoodleCardAction;

export type StartGameAction = GameActionRequest & {
    type: 'start';
};

export type DoodleCardAction = GameActionRequest & {
    type: 'doodle_card';
};
