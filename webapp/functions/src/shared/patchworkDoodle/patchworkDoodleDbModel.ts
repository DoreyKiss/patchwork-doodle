import { CommonGameSteps, DbEmptyInternalState, DbEmptyPrivateState, DbPublicState, DbRoom, DbRoomMeta } from '../dbmodel';

export interface PatchworkDoodleDbRoom extends DbRoom {
    private: Record<string, PwdDbPrivateState>;
    internal: PwdDbInternalState;
    public: PwdDbPublicState;
    meta: PwdDbMeta;
}

export interface PwdDbInternalState extends DbEmptyInternalState {
    deck: string[];
    discardPile: string[];
}

export interface PwdDbPrivateState extends DbEmptyPrivateState {
    serializedBoard: string;
    startingCard: string;
    doodledCards: PwdDoodledCard[];
}

export interface PwdDbPublicState extends DbPublicState {
    step: CommonGameSteps | PwdStep;
    board: string[];
    /** The index of the card the token is placed after. */
    tokenPosition: number;
    lastDieRoll?: number;
}

export interface PwdDbMeta extends DbRoomMeta {
    rules: PwdRules;
}

export interface PwdDoodledCard {
    display: string;
    originalCardId: string;
    x: number;
    y: number;
}

export enum PwdStep {
    doodle_starting_card = 'doodle_starting_card',
    fill_board = 'fill_board',
    roll_dice = 'roll_dice', // action
    doodle_card = 'doodle_card',
    remove_current_card = 'remove_current_card', // action
    count_points = 'count_points', // action
    partial_results = 'partial_results',
    end_results = 'end_results',
}

export interface PwdRules {
    boardCardCount: number;
    roundRemainingCards: number;
    drawingBoardSize: { width: number, height: number; };
    deckSize: number;
    dieSize: number;
}
