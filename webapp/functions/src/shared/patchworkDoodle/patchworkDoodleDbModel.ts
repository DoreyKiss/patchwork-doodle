import { CommonGameSteps, DbInternalState, DbPrivateState, DbPublicState, DbRoom, DbRoomMeta } from '../dbmodel';

export enum PwdStep {
    draw_starting_card = 'draw_starting_card',
    fill_board = 'fill_board',
    roll_dice = 'roll_dice', // action
    doodle_card = 'doodle_card',
    remove_current_card = 'remove_current_card', // action
    count_points = 'count_points', // action
    partial_results = 'partial_results',
    end_results = 'end_results',
}

export interface PwdRules {
    boardSize: { width: number, height: number; };
    deckSize: number;
}

export interface PwdDbMeta extends DbRoomMeta {
    rules: PwdRules;
}

export interface PwdDbPrivateState extends DbPrivateState {
    test: string;
}

export interface PwdDbInternalState extends DbInternalState {
    deck: string[];
    discardPile: string[];
}

export interface PwdDbPublicState extends DbPublicState {
    step: CommonGameSteps | PwdStep;
    board?: string[]; // TODO use special representation for cards in db
    /** The index of the card the token is placed after. */
    tokenPosition?: number;
}

export interface PatchworkDoodleDbRoom extends DbRoom {
    private: Record<string, PwdDbPrivateState> | false;
    internal: PwdDbInternalState | false;
    public: PwdDbPublicState | false;
    meta: PwdDbMeta;
}
