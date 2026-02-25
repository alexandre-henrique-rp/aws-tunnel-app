"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.dependencyChecker = exports.DependencyChecker = void 0;
const child_process_1 = require("child_process");
const util_1 = require("util");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const electron_1 = require("electron");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
class DependencyChecker {
    static getInstance() {
        if (!DependencyChecker.instance) {
            DependencyChecker.instance = new DependencyChecker();
        }
        return DependencyChecker.instance;
    }
    async checkAWSCLI() {
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
        }
        catch (error) {
            return {
                name: "AWS CLI",
                installed: false,
                error: error.message || "AWS CLI não encontrado",
            };
        }
    }
    async findAWSCLIPath() {
        try {
            const { stdout } = await execAsync("which aws");
            return stdout.trim();
        }
        catch {
            return undefined;
        }
    }
    async checkAWSSDK() {
        try {
            const awsSdkPath = require.resolve("aws-sdk");
            const packageJson = require("aws-sdk/package.json");
            return {
                name: "AWS SDK",
                installed: true,
                version: packageJson.version,
                path: awsSdkPath,
            };
        }
        catch {
            return {
                name: "AWS SDK",
                installed: false,
                error: "AWS SDK não encontrado. Execute: npm install aws-sdk",
            };
        }
    }
    getNodeVersion() {
        return process.version;
    }
    getPlatform() {
        return `${process.platform} (${process.arch})`;
    }
    async getFullReport() {
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
    async installAWSCLI() {
        const platform = process.platform;
        try {
            if (platform === "win32") {
                return {
                    success: false,
                    message: "Windows: Instale AWS CLI via MSI installer ou Chocolatey",
                };
            }
            else if (platform === "darwin") {
                await execAsync("curl 'https://awscli.amazonaws.com/AWSCLIV2.pkg' -o '/tmp/awscliv2.pkg' && sudo installer -pkg /tmp/awscliv2.pkg -target /");
                return { success: true, message: "AWS CLI instalado com sucesso" };
            }
            else {
                await execAsync("curl 'https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip' -o '/tmp/awscliv2.zip' && unzip -q /tmp/awscliv2.zip -d /tmp && sudo /tmp/aws/install");
                return { success: true, message: "AWS CLI instalado com sucesso" };
            }
        }
        catch (error) {
            return {
                success: false,
                message: `Erro ao instalar: ${error.message}`,
            };
        }
    }
    async installAWSSDK() {
        try {
            const packageJsonPath = path.join(electron_1.app.getAppPath(), "package.json");
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
            if (!packageJson.dependencies?.["aws-sdk"]) {
                packageJson.dependencies["aws-sdk"] = "^2.1350.0";
                fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
            }
            return {
                success: true,
                message: "Adicione aws-sdk às dependências no package.json e execute npm install",
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Erro: ${error.message}`,
            };
        }
    }
    async verifyAndPrompt() {
        const report = await this.getFullReport();
        const missingDeps = [];
        if (!report.awsCLI.installed)
            missingDeps.push("AWS CLI");
        if (!report.awsSDK.installed)
            missingDeps.push("AWS SDK");
        if (missingDeps.length > 0) {
            console.warn(`[DependencyChecker] Atenção: ${missingDeps.join(", ")} não instalados`);
        }
        return report;
    }
}
exports.DependencyChecker = DependencyChecker;
exports.dependencyChecker = DependencyChecker.getInstance();
