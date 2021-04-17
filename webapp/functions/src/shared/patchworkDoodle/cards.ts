
export const cardCharacters = {
    spaceChar: '.',
    patchChar: '#',
    lineBreakChar: '|'
};

export class Card {
    readonly display: string;

    constructor(
        public readonly id: string,
        public readonly cardDefinition: readonly string[]
    ) {
        this.display = cardDefinition.join(cardCharacters.lineBreakChar);
    }
}

export const starterCards = [
    new Card('sc340', [
        '..#',
        '.##',
        '.#.',
        '###'
    ]),
    new Card('sc341', [
        '.#.',
        '###',
        '.#.',
        '##.'
    ]),
    new Card('sc430', [
        '.#..',
        '####',
        '#..#'
    ]),
    new Card('sc431', [
        '..#.',
        '####',
        '.##.'
    ]),
    new Card('sc432', [
        '##..',
        '.#.#',
        '.###'
    ]),
    new Card('sc440', [
        '.#..',
        '####',
        '.#..',
        '.#..'
    ]),
    new Card('sc530', [
        '.#...',
        '#####',
        '...#.'
    ]),
    new Card('sc531', [
        '..#..',
        '#####',
        '..#..'
    ]),
    new Card('sc532', [
        '..###',
        '..#..',
        '###..'
    ]),
    new Card('sc533', [
        '..#..',
        '###..',
        '..###'
    ])
];

export const patchCards = [
    new Card('pc110', [
        '#'
    ]),
    new Card('pc210', [
        '##'
    ]),
    new Card('pc220', [
        '##',
        '##'
    ]),
    new Card('pc221', [
        '#.',
        '##'
    ]),
    new Card('pc320', [
        '###',
        '#..'
    ]),
    new Card('pc321', [
        '###',
        '.#.'
    ]),
    new Card('pc322', [
        '###',
        '#.#'
    ]),
    new Card('pc330', [
        '#..',
        '#..',
        '###'
    ]),
    new Card('pc331', [
        '#..',
        '##.',
        '.##'
    ]),
    new Card('pc332', [
        '#..',
        '###',
        '..#'
    ]),
    new Card('pc333', [
        '.#.',
        '.#.',
        '###'
    ]),
    new Card('pc334', [
        '##.',
        '.##',
        '##.'
    ]),
    new Card('pc420', [
        '##..',
        '.###'
    ]),
    new Card('pc421', [
        '..#.',
        '####'
    ]),
    new Card('pc430', [
        '..#.',
        '####',
        '..#.'
    ]),
    new Card('sc520', [
        '.#...',
        '#####'
    ])
];

export const cardsById: Map<string, Card> = new Map(
    [...starterCards, ...patchCards].map(card => [card.id, card])
);

