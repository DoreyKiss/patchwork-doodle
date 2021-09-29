/** Remaps an object to a new object with the same keys but different values. */
export function remapRecord<TIn, TOut>(obj: Record<string, TIn>, mapper: (key: string, value: TIn, index: number) => TOut): Record<string, TOut> {
    const result = Object.fromEntries(
        Object.entries(obj).map((entry, index) =>
            [entry[0], mapper(entry[0], entry[1], index)]
        )
    );

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return result;
}
