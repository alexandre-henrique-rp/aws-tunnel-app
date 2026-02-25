export interface DependencyStatus {
    name: string;
    installed: boolean;
    version?: string;
    path?: string;
    error?: string;
}
export interface FullDependencyReport {
    awsCLI: DependencyStatus;
    awsSDK: DependencyStatus;
    nodeVersion: string;
    platform: string;
}
export declare class DependencyChecker {
    private static instance;
    static getInstance(): DependencyChecker;
    checkAWSCLI(): Promise<DependencyStatus>;
    private findAWSCLIPath;
    checkAWSSDK(): Promise<DependencyStatus>;
    getNodeVersion(): string;
    getPlatform(): string;
    getFullReport(): Promise<FullDependencyReport>;
    installAWSCLI(): Promise<{
        success: boolean;
        message: string;
    }>;
    installAWSSDK(): Promise<{
        success: boolean;
        message: string;
    }>;
    verifyAndPrompt(): Promise<FullDependencyReport>;
}
export declare const dependencyChecker: DependencyChecker;
