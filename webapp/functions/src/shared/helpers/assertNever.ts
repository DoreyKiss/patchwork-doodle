// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function assertNever(value: never, shouldThrow = true): void | never {
    if (shouldThrow) {
        throw new Error('Coding error! This path should never be reached!');
    }
}
