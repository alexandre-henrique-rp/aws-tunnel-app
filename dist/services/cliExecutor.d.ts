import { Profile } from "../models/Profile";
export interface CLIResult {
    success: boolean;
    stdout?: string;
    stderr?: string;
    error?: string;
    exitCode?: number;
}
export interface EC2Instance {
    InstanceId: string;
    InstanceType: string;
    State: {
        Name: string;
    };
    Tags: {
        Key: string;
        Value: string;
    }[];
    PrivateIpAddress?: string;
    PublicIpAddress?: string;
}
export interface SSMInstance {
    InstanceId: string;
    Name?: string;
    IPAddress?: string;
    PlatformType?: string;
    PlatformName?: string;
    InstanceStatus?: string;
}
export declare class CLIExecutor {
    private static instance;
    static getInstance(): CLIExecutor;
    private getEnv;
    executeCommand(command: string, profile?: Profile): Promise<CLIResult>;
    executeAsyncCommand(args: string[], profile?: Profile, onData?: (data: string) => void): Promise<CLIResult>;
    listEC2Instances(profile: Profile): Promise<CLIResult & {
        instances?: EC2Instance[];
    }>;
    listSSMInstances(profile: Profile): Promise<CLIResult & {
        instances?: SSMInstance[];
    }>;
    getInstanceStatus(instanceId: string, profile: Profile): Promise<CLIResult & {
        status?: string;
    }>;
    startSession(instanceId: string, profile: Profile): Promise<CLIResult>;
    startPortForwarding(instanceId: string, localPort: number, remotePort: number, profile: Profile, onData?: (data: string) => void): Promise<CLIResult>;
    terminateSession(profile: Profile): Promise<CLIResult>;
    listProfiles(): Promise<string[]>;
    getCallerIdentity(profile?: Profile): Promise<CLIResult & {
        identity?: any;
    }>;
    validateCredentials(profile: Profile): Promise<boolean>;
    runCommandOnInstance(instanceId: string, command: string, profile: Profile): Promise<CLIResult & {
        commandId?: string;
    }>;
    getAWSCLIVersion(): Promise<string | null>;
}
export declare const cliExecutor: CLIExecutor;
