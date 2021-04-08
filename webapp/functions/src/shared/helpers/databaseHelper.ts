export const DbPath = {
    user: (userId: string): string =>
        `users/${userId}`,

    room: (roomDbId: string): string =>
        `rooms/${roomDbId}`,
    roomConnection: (roomDbId: string, userId: string): string =>
        `rooms/${roomDbId}/connections/${userId}`,
    roomConnections: (roomDbId: string): string =>
        `rooms/${roomDbId}/connections`,
    roomUser: (roomDbId: string, userId: string): string =>
        `rooms/${roomDbId}/meta/users/${userId}`,
    roomUsers: (roomDbId: string): string =>
        `rooms/${roomDbId}/meta/users`
};
