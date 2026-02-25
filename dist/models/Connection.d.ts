export interface Connection {
    id: string;
    profileId: string;
    profileName: string;
    region: string;
    instanceId: string;
    localPort: number;
    remotePort: number;
    connectedAt: Date;
    disconnectedAt?: Date;
    status: "connected" | "disconnected" | "failed" | "reconnecting";
    error?: string;
    duration?: number;
}
export interface ConnectionStats {
    totalConnections: number;
    successfulConnections: number;
    failedConnections: number;
    averageDuration: number;
    lastConnection?: Connection;
}
export declare function createConnection(profileId: string, profileName: string, region: string, instanceId: string, localPort: number, remotePort: number): Connection;
export declare function endConnection(connection: Connection, status: Connection["status"], error?: string): Connection;
export declare function getConnectionStats(connections: Connection[]): ConnectionStats;
