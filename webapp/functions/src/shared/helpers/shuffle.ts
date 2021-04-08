function shuffle<TItem>(array: TItem[]): TItem[] {
    array = [...array];
    return shuffleInPlace(array);
}

function shuffleInPlace<TItem>(array: TItem[]): TItem[] {
    for (let index = array.length - 1; index > 0; index--) {
        const newIndex = Math.floor(Math.random() * (index + 1));
        [array[index], array[newIndex]] = [array[newIndex], array[index]];
    }

    return array;
}

function pick<TItem>(array: TItem[], pickCount: number): TItem[] {
    array = [...array];

    const length = array.length;
    if (pickCount > length) {
        throw new Error('Array contains less elements than needed!');
    }

    for (let index = 0; index < pickCount; index++) {
        const newIndex = Math.floor(Math.random() * (length - index)) + index;
        [array[index], array[newIndex]] = [array[newIndex], array[index]];
    }

    return array.slice(0, pickCount);
}

export {
    pick,
    shuffle,
    shuffleInPlace
};
