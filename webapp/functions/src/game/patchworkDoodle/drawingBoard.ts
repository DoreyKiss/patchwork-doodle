import { patchCharacters } from '../../shared/patchworkDoodle/cards';
import { PwdRules } from '../../shared/patchworkDoodle/patchworkDoodleDbModel';

export type DrawResult = DrawFailed | DrawSuccess;

export type DrawFailed = {
    success: false;
    error: string;
};

export type DrawSuccess = {
    success: true;
    display: string;
};

export class DrawingBoard {

    private board: string[][];

    constructor(rules: PwdRules, serializedBoard?: string) {
        if (serializedBoard) {
            this.board = serializedBoard.split(patchCharacters.lineBreakChar).map(x => x.split(''));
        } else {
            this.board = Array(rules.drawingBoardSize.height).fill(0).map(() =>
                Array<string>(rules.drawingBoardSize.width).fill(patchCharacters.spaceChar)
            );
        }
    }

    serializeBoard(): string {
        return this.serialize(this.board);
    }

    tryDraw(
        serializedPatch: string,
        x: number, y: number,
        rotations: number, isFlipped: boolean
    ): DrawResult {
        let patch = serializedPatch.split(patchCharacters.lineBreakChar).map(x => x.split(''));
        if (isFlipped) {
            patch = this.flip(patch);
        }

        if (rotations !== 0) {
            patch = this.rotate(patch, rotations);
        }

        const mHeight = patch.length;
        const mWidth = patch[0].length;
        for (let mY = 0; mY < mHeight; mY++) {
            for (let mX = 0; mX < mWidth; mX++) {
                const newValue = this.getValue(patch, mX, mY);
                if (newValue !== patchCharacters.patchChar) {
                    // Trying to draw space
                    continue;
                }

                const existingValue = this.getValue(this.board, x + mX, y + mY);
                if (!existingValue) {
                    return { success: false, error: 'Trying to draw out of bounds!' };
                }
                if (existingValue === patchCharacters.patchChar) {
                    return { success: false, error: 'Trying to draw over existing patch!' };
                }

                this.board[y + mY][x + mX] = newValue;
            }
        }

        const display = this.serialize(patch);
        return { success: true, display: display };
    }

    public rotate(source: string[][], rotateCount: number): string[][] {
        const sourceHeight = source.length;
        const sourceWidth = source[0].length;
        const targetHeight = rotateCount % 2 === 0 ? sourceHeight : sourceWidth;
        const targetWidth = rotateCount % 2 === 0 ? sourceWidth : sourceHeight;
        const isRightDirection = rotateCount > 0;
        rotateCount = Math.floor(Math.abs(rotateCount)) % 4;

        let target = source;
        for (let i = 0; i < rotateCount; i++) {
            target = Array(targetHeight).fill(0).map(() => []);
            for (let i = 0; i < targetHeight; i++) {
                for (let j = 0; j < targetWidth; j++) {
                    if (isRightDirection) {
                        target[i][j] = source[sourceHeight - j - 1][i];
                    } else {
                        target[i][j] = source[j][sourceWidth - i - 1];
                    }
                }
            }
            source = target;
        }

        return target;
    }

    public flip(source: string[][]): string[][] {
        const height = source.length;
        const width = source[0].length;

        const target: string[][] = Array(height).fill(0).map(() => []);
        for (let i = 0; i < height; i++) {
            for (let j = 0; j < width; j++) {
                target[i][j] = source[height - i - 1][j];
            }
        }

        return target;
    }

    private getValue(matrix: string[][], x: number, y: number): string | undefined {
        const row = matrix[y];
        if (!row) { return undefined; }
        return row[x];
    }

    private serialize(patch: string[][]): string {
        return patch.map(x => x.join('')).join(patchCharacters.lineBreakChar);
    }
}
