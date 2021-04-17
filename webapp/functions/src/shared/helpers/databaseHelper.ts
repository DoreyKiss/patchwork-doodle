export const DbPath = {
    user: (userId: string): string =>
        `users/${userId}`,

    room: (roomDbId: string): string =>
        `rooms/${roomDbId}`,
    roomPublicState: (roomDbId: string): string =>
        `rooms/${roomDbId}/public`,
    roomInternalState: (roomDbId: string): string =>
        `rooms/${roomDbId}/internal`,
    roomPrivateState: (roomDbId: string): string =>
        `rooms/${roomDbId}/private`,
    roomConnection: (roomDbId: string, userId: string): string =>
        `rooms/${roomDbId}/connections/${userId}`,
    roomConnections: (roomDbId: string): string =>
        `rooms/${roomDbId}/connections`,
    roomUser: (roomDbId: string, userId: string): string =>
        `rooms/${roomDbId}/meta/users/${userId}`,
    roomUsers: (roomDbId: string): string =>
        `rooms/${roomDbId}/meta/users`
};

/**
 * Deletes a key from the given object. Return the object if there are remaining keys, false otherwise.
 * Used because firebase do not keep empty objects inside the database, so we represent these as false instead.
 */
export function deleteDbKey<TValue>(obj: Record<string, TValue> | false, key: string): Record<string, TValue> | false {
    if (!obj) {
        return false;
    }

    delete obj[key];
    if (Object.keys(obj).length === 0) {
        return false;
    }
    return obj;
}

export function updateDbObject<TValue>(obj: Record<string, TValue> | false, updater: (obj: Record<string, TValue>) => void): Record<string, TValue>;
export function updateDbObject<TValue>(obj: Record<string, TValue> | false, updater: (obj: Record<string, TValue>) => Promise<void>): Promise<Record<string, TValue>>;
export function updateDbObject<TValue>(obj: Record<string, TValue> | false, updater: (obj: Record<string, TValue>) => void | Promise<void>): Record<string, TValue> | Promise<Record<string, TValue>> {
    if (!obj) {
        obj = {};
    }

    const result = updater(obj);
    if (result) {
        return result.then(() => obj as Record<string, TValue>);
    }
    return obj;
}

export function updateDbArray<TValue>(obj: TValue[] | false, updater: (array: TValue[]) => void): TValue[];
export function updateDbArray<TValue>(obj: TValue[] | false, updater: (array: TValue[]) => Promise<void>): Promise<TValue[]>;
export function updateDbArray<TValue>(obj: TValue[] | false, updater: (array: TValue[]) => void | Promise<void>): TValue[] | Promise<TValue[]> {
    if (!obj) {
        obj = [];
    }

    const result = updater(obj);
    if (result) {
        return result.then(() => obj as TValue[]);
    }
    return obj;
}
