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

export function createConnection(
  profileId: string,
  profileName: string,
  region: string,
  instanceId: string,
  localPort: number,
  remotePort: number
): Connection {
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

export function endConnection(connection: Connection, status: Connection["status"], error?: string): Connection {
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

export function getConnectionStats(connections: Connection[]): ConnectionStats {
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
