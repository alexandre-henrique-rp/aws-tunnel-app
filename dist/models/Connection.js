"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createConnection = createConnection;
exports.endConnection = endConnection;
exports.getConnectionStats = getConnectionStats;
function createConnection(profileId, profileName, region, instanceId, localPort, remotePort) {
    return {
        id: crypto.randomUUID(),
        profileId,
        profileName,
        region,
        instanceId,
        localPort,
        remotePort,
        connectedAt: new Date(),
        status: "connected",
    };
}
function endConnection(connection, status, error) {
    const disconnectedAt = new Date();
    const duration = Math.floor((disconnectedAt.getTime() - connection.connectedAt.getTime()) / 1000);
    return {
        ...connection,
        disconnectedAt,
        status,
        error,
        duration,
    };
}
function getConnectionStats(connections) {
    if (connections.length === 0) {
        return {
            totalConnections: 0,
            successfulConnections: 0,
            failedConnections: 0,
            averageDuration: 0,
        };
    }
    const successful = connections.filter((c) => c.status === "disconnected");
    const failed = connections.filter((c) => c.status === "failed");
    const totalDuration = connections.reduce((sum, c) => sum + (c.duration || 0), 0);
    const averageDuration = totalDuration / connections.length;
    return {
        totalConnections: connections.length,
        successfulConnections: successful.length,
        failedConnections: failed.length,
        averageDuration: Math.round(averageDuration),
        lastConnection: connections[connections.length - 1],
    };
}
