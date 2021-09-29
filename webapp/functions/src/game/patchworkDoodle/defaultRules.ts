import { PwdRules } from '../../shared/patchworkDoodle/patchworkDoodleDbModel';

export const defaultRules: PwdRules = {
    boardCardCount: 8,
    dieSize: 3,
    roundRemainingCards: 2,
    drawingBoardSize: {
        width: 9,
        height: 9
    },
    deckSize: 30
};
