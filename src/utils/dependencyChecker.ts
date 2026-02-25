import { exec, spawn } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as path from "path";
import { app } from "electron";

const execAsync = promisify(exec);

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

export class DependencyChecker {
  private static instance: DependencyChecker;

  static getInstance(): DependencyChecker {
    if (!DependencyChecker.instance) {
      DependencyChecker.instance = new DependencyChecker();
    }
    return DependencyChecker.instance;
  }

  async checkAWSCLI(): Promise<DependencyStatus> {
    try {
      const { stdout } = await execAsync("aws --version 2>&1");
      const versionMatch = stdout.match(/aws-cli\/(\S+)/);
      const version = versionMatch ? versionMatch[1] : "unknown";
      
      return {
        name: "AWS CLI",
        installed: true,
        version,
        path: await this.findAWSCLIPath(),
      };
    } catch (error: any) {
      return {
        name: "AWS CLI",
        installed: false,
        error: error.message || "AWS CLI não encontrado",
      };
    }
  }

  private async findAWSCLIPath(): Promise<string | undefined> {
    try {
      const { stdout } = await execAsync("which aws");
      return stdout.trim();
    } catch {
      return undefined;
    }
  }

  async checkAWSSDK(): Promise<DependencyStatus> {
    try {
      const awsSdkPath = require.resolve("aws-sdk");
      const packageJson = require("aws-sdk/package.json");
      
      return {
        name: "AWS SDK",
        installed: true,
        version: packageJson.version,
        path: awsSdkPath,
      };
    } catch {
      return {
        name: "AWS SDK",
        installed: false,
        error: "AWS SDK não encontrado. Execute: npm install aws-sdk",
      };
    }
  }

  getNodeVersion(): string {
    return process.version;
  }

  getPlatform(): string {
    return `${process.platform} (${process.arch})`;
  }

  async getFullReport(): Promise<FullDependencyReport> {
    const [awsCLI, awsSDK] = await Promise.all([
      this.checkAWSCLI(),
      this.checkAWSSDK(),
    ]);

    return {
      awsCLI,
      awsSDK,
      nodeVersion: this.getNodeVersion(),
      platform: this.getPlatform(),
    };
  }

  async installAWSCLI(): Promise<{ success: boolean; message: string }> {
    const platform = process.platform;
    
    try {
      if (platform === "win32") {
        return {
          success: false,
          message: "Windows: Instale AWS CLI via MSI installer ou Chocolatey",
        };
      } else if (platform === "darwin") {
        await execAsync("curl 'https://awscli.amazonaws.com/AWSCLIV2.pkg' -o '/tmp/awscliv2.pkg' && sudo installer -pkg /tmp/awscliv2.pkg -target /");
        return { success: true, message: "AWS CLI instalado com sucesso" };
      } else {
        await execAsync("curl 'https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip' -o '/tmp/awscliv2.zip' && unzip -q /tmp/awscliv2.zip -d /tmp && sudo /tmp/aws/install");
        return { success: true, message: "AWS CLI instalado com sucesso" };
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Erro ao instalar: ${error.message}`,
      };
    }
  }

  async installAWSSDK(): Promise<{ success: boolean; message: string }> {
    try {
      const packageJsonPath = path.join(app.getAppPath(), "package.json");
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
      
      if (!packageJson.dependencies?.["aws-sdk"]) {
        packageJson.dependencies["aws-sdk"] = "^2.1350.0";
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      }
      
      return {
        success: true,
        message: "Adicione aws-sdk às dependências no package.json e execute npm install",
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Erro: ${error.message}`,
      };
    }
  }

  async verifyAndPrompt(): Promise<FullDependencyReport> {
    const report = await this.getFullReport();
    
    const missingDeps: string[] = [];
    if (!report.awsCLI.installed) missingDeps.push("AWS CLI");
    if (!report.awsSDK.installed) missingDeps.push("AWS SDK");
    
    if (missingDeps.length > 0) {
      console.warn(`[DependencyChecker] Atenção: ${missingDeps.join(", ")} não instalados`);
    }
    
    return report;
  }
}

export const dependencyChecker = DependencyChecker.getInstance();
