import { spawn, exec, ChildProcess } from "child_process";
import { promisify } from "util";
import { Profile } from "../models/Profile";

const execAsync = promisify(exec);

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
  State: { Name: string };
  Tags: { Key: string; Value: string }[];
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

export class CLIExecutor {
  private static instance: CLIExecutor;

  static getInstance(): CLIExecutor {
    if (!CLIExecutor.instance) {
      CLIExecutor.instance = new CLIExecutor();
    }
    return CLIExecutor.instance;
  }

  private getEnv(profile: Profile): NodeJS.ProcessEnv {
    const env = { ...process.env };
    if (profile.name) {
      env.AWS_PROFILE = profile.name;
    }
    if (profile.region) {
      env.AWS_DEFAULT_REGION = profile.region;
    }
    return env;
  }

  async executeCommand(
    command: string,
    profile?: Profile
  ): Promise<CLIResult> {
    try {
      const env = profile ? this.getEnv(profile) : process.env;
      const { stdout, stderr } = await execAsync(command, { env });
      return {
        success: true,
        stdout,
        stderr,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        stdout: error.stdout,
        stderr: error.stderr,
        exitCode: error.code,
      };
    }
  }

  async executeAsyncCommand(
    args: string[],
    profile?: Profile,
    onData?: (data: string) => void
  ): Promise<CLIResult> {
    return new Promise((resolve) => {
      const env = profile ? this.getEnv(profile) : process.env;
      const child = spawn("aws", args, {
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

  async listEC2Instances(profile: Profile): Promise<CLIResult & { instances?: EC2Instance[] }> {
    const result = await this.executeCommand(
      `aws ec2 describe-instances --query 'Reservations[].Instances[]' --output json`,
      profile
    );

    if (result.success && result.stdout) {
      try {
        const instances = JSON.parse(result.stdout) as EC2Instance[];
        return { ...result, instances };
      } catch {
        return { ...result, instances: [] };
      }
    }

    return { ...result, instances: [] };
  }

  async listSSMInstances(profile: Profile): Promise<CLIResult & { instances?: SSMInstance[] }> {
    const result = await this.executeCommand(
      `aws ssm describe-instance-information --query 'InstanceInformationList[]' --output json`,
      profile
    );

    if (result.success && result.stdout) {
      try {
        const instances = JSON.parse(result.stdout) as SSMInstance[];
        return { ...result, instances };
      } catch {
        return { ...result, instances: [] };
      }
    }

    return { ...result, instances: [] };
  }

  async getInstanceStatus(instanceId: string, profile: Profile): Promise<CLIResult & { status?: string }> {
    const result = await this.executeCommand(
      `aws ec2 describe-instance-status --Instance-ids ${instanceId} --query 'InstanceStatuses[0].InstanceState.Name' --output text`,
      profile
    );

    return { ...result, status: result.stdout?.trim() };
  }

  async startSession(instanceId: string, profile: Profile): Promise<CLIResult> {
    return this.executeAsyncCommand(
      ["ssm", "start-session", "--target", instanceId],
      profile
    );
  }

  async startPortForwarding(
    instanceId: string,
    localPort: number,
    remotePort: number,
    profile: Profile,
    onData?: (data: string) => void
  ): Promise<CLIResult> {
    return this.executeAsyncCommand(
      [
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
      ],
      profile,
      onData
    );
  }

  async terminateSession(profile: Profile): Promise<CLIResult> {
    return this.executeCommand(
      "aws ssm terminate-session --session-id $(aws ssm describe-sessions --state Active --query 'Sessions[0].SessionId' --output text)",
      profile
    );
  }

  async listProfiles(): Promise<string[]> {
    const result = await this.executeCommand("aws configure list-profiles");
    if (result.success && result.stdout) {
      return result.stdout.trim().split("\n").filter(Boolean);
    }
    return [];
  }

  async getCallerIdentity(profile?: Profile): Promise<CLIResult & { identity?: any }> {
    const result = await this.executeCommand(
      "aws sts get-caller-identity --output json",
      profile
    );

    if (result.success && result.stdout) {
      try {
        const identity = JSON.parse(result.stdout);
        return { ...result, identity };
      } catch {
        return result;
      }
    }

    return result;
  }

  async validateCredentials(profile: Profile): Promise<boolean> {
    const result = await this.getCallerIdentity(profile);
    return result.success && !!result.identity;
  }

  async runCommandOnInstance(
    instanceId: string,
    command: string,
    profile: Profile
  ): Promise<CLIResult & { commandId?: string }> {
    const result = await this.executeAsyncCommand(
      [
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
      ],
      profile
    );

    if (result.success && result.stdout) {
      try {
        const output = JSON.parse(result.stdout);
        return { ...result, commandId: output.Command?.CommandId };
      } catch {
        return result;
      }
    }

    return result;
  }

  getAWSCLIVersion(): Promise<string | null> {
    return new Promise((resolve) => {
      exec("aws --version", (error, stdout) => {
        if (error) {
          resolve(null);
        } else {
          const match = stdout.match(/aws-cli\/(\S+)/);
          resolve(match ? match[1] : null);
        }
      });
    });
  }
}

export const cliExecutor = CLIExecutor.getInstance();
