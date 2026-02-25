"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cliExecutor = exports.CLIExecutor = void 0;
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
class CLIExecutor {
    static getInstance() {
        if (!CLIExecutor.instance) {
            CLIExecutor.instance = new CLIExecutor();
        }
        return CLIExecutor.instance;
    }
    getEnv(profile) {
        const env = { ...process.env };
        if (profile.name) {
            env.AWS_PROFILE = profile.name;
        }
        if (profile.region) {
            env.AWS_DEFAULT_REGION = profile.region;
        }
        return env;
    }
    async executeCommand(command, profile) {
        try {
            const env = profile ? this.getEnv(profile) : process.env;
            const { stdout, stderr } = await execAsync(command, { env });
            return {
                success: true,
                stdout,
                stderr,
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message,
                stdout: error.stdout,
                stderr: error.stderr,
                exitCode: error.code,
            };
        }
    }
    async executeAsyncCommand(args, profile, onData) {
        return new Promise((resolve) => {
            const env = profile ? this.getEnv(profile) : process.env;
            const child = (0, child_process_1.spawn)("aws", args, {
                env,
                shell: process.platform === "win32",
            });
            let stdout = "";
            let stderr = "";
            child.stdout?.on("data", (data) => {
                const text = data.toString();
                stdout += text;
                onData?.(text);
            });
            child.stderr?.on("data", (data) => {
                const text = data.toString();
                stderr += text;
                onData?.(text);
            });
            child.on("close", (code) => {
                resolve({
                    success: code === 0,
                    stdout,
                    stderr,
                    exitCode: code ?? undefined,
                });
            });
            child.on("error", (error) => {
                resolve({
                    success: false,
                    error: error.message,
                });
            });
        });
    }
    async listEC2Instances(profile) {
        const result = await this.executeCommand(`aws ec2 describe-instances --query 'Reservations[].Instances[]' --output json`, profile);
        if (result.success && result.stdout) {
            try {
                const instances = JSON.parse(result.stdout);
                return { ...result, instances };
            }
            catch {
                return { ...result, instances: [] };
            }
        }
        return { ...result, instances: [] };
    }
    async listSSMInstances(profile) {
        const result = await this.executeCommand(`aws ssm describe-instance-information --query 'InstanceInformationList[]' --output json`, profile);
        if (result.success && result.stdout) {
            try {
                const instances = JSON.parse(result.stdout);
                return { ...result, instances };
            }
            catch {
                return { ...result, instances: [] };
            }
        }
        return { ...result, instances: [] };
    }
    async getInstanceStatus(instanceId, profile) {
        const result = await this.executeCommand(`aws ec2 describe-instance-status --Instance-ids ${instanceId} --query 'InstanceStatuses[0].InstanceState.Name' --output text`, profile);
        return { ...result, status: result.stdout?.trim() };
    }
    async startSession(instanceId, profile) {
        return this.executeAsyncCommand(["ssm", "start-session", "--target", instanceId], profile);
    }
    async startPortForwarding(instanceId, localPort, remotePort, profile, onData) {
        return this.executeAsyncCommand([
            "ssm",
            "start-session",
            "--target",
            instanceId,
            "--document-name",
            "AWS-StartPortForwardingSession",
            "--parameters",
            JSON.stringify({
                localPortNumber: [localPort.toString()],
                portNumber: [remotePort.toString()],
            }),
        ], profile, onData);
    }
    async terminateSession(profile) {
        return this.executeCommand("aws ssm terminate-session --session-id $(aws ssm describe-sessions --state Active --query 'Sessions[0].SessionId' --output text)", profile);
    }
    async listProfiles() {
        const result = await this.executeCommand("aws configure list-profiles");
        if (result.success && result.stdout) {
            return result.stdout.trim().split("\n").filter(Boolean);
        }
        return [];
    }
    async getCallerIdentity(profile) {
        const result = await this.executeCommand("aws sts get-caller-identity --output json", profile);
        if (result.success && result.stdout) {
            try {
                const identity = JSON.parse(result.stdout);
                return { ...result, identity };
            }
            catch {
                return result;
            }
        }
        return result;
    }
    async validateCredentials(profile) {
        const result = await this.getCallerIdentity(profile);
        return result.success && !!result.identity;
    }
    async runCommandOnInstance(instanceId, command, profile) {
        const result = await this.executeAsyncCommand([
            "ssm",
            "send-command",
            "--instance-ids",
            instanceId,
            "--document-name",
            "AWS-RunShellScript",
            "--parameters",
            JSON.stringify({ commands: [command] }),
            "--output",
            "json",
        ], profile);
        if (result.success && result.stdout) {
            try {
                const output = JSON.parse(result.stdout);
                return { ...result, commandId: output.Command?.CommandId };
            }
            catch {
                return result;
            }
        }
        return result;
    }
    getAWSCLIVersion() {
        return new Promise((resolve) => {
            (0, child_process_1.exec)("aws --version", (error, stdout) => {
                if (error) {
                    resolve(null);
                }
                else {
                    const match = stdout.match(/aws-cli\/(\S+)/);
                    resolve(match ? match[1] : null);
                }
            });
        });
    }
}
exports.CLIExecutor = CLIExecutor;
exports.cliExecutor = CLIExecutor.getInstance();
