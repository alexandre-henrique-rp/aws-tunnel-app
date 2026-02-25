import { EventEmitter } from "events";
import { Profile } from "../models/Profile";

export interface TokenStatus {
  hasToken: boolean;
  expiresAt?: Date;
  expiresIn?: number;
  isExpired: boolean;
  isExpiringSoon: boolean;
  warningLevel: "none" | "warning" | "critical";
}

export interface TokenWarningEvent {
  profileId: string;
  profileName: string;
  expiresAt: Date;
  minutesRemaining: number;
  warningLevel: "warning" | "critical";
}

export class TokenMonitor extends EventEmitter {
  private static instance: TokenMonitor;
  private intervalId: NodeJS.Timeout | null = null;
  private checkInterval = 60000;
  private warningMinutes = 30;
  private currentProfile: Profile | null = null;
  private warnedProfiles: Map<string, boolean> = new Map();

  private constructor() {
    super();
  }

  static getInstance(): TokenMonitor {
    if (!TokenMonitor.instance) {
      TokenMonitor.instance = new TokenMonitor();
    }
    return TokenMonitor.instance;
  }

  setWarningThreshold(minutes: number): void {
    this.warningMinutes = minutes;
  }

  startMonitoring(profile: Profile): void {
    this.stopMonitoring();
    this.currentProfile = profile;
    this.warnedProfiles.clear();

    if (!profile.expiration) {
      return;
    }

    this.intervalId = setInterval(() => {
      this.checkTokenStatus();
    }, this.checkInterval);

    this.checkTokenStatus();
  }

  stopMonitoring(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.currentProfile = null;
    this.warnedProfiles.clear();
  }

  getTokenStatus(profile: Profile): TokenStatus {
    const status: TokenStatus = {
      hasToken: !!profile.sessionToken,
      isExpired: false,
      isExpiringSoon: false,
      warningLevel: "none",
    };

    if (!profile.expiration) {
      return status;
    }

    const expiresAt = new Date(profile.expiration);
    const now = new Date();
    const expiresIn = Math.floor((expiresAt.getTime() - now.getTime()) / 1000 / 60);

    status.expiresAt = expiresAt;
    status.expiresIn = expiresIn;
    status.isExpired = expiresIn <= 0;
    status.isExpiringSoon = expiresIn > 0 && expiresIn <= this.warningMinutes;

    if (status.isExpired) {
      status.warningLevel = "critical";
    } else if (expiresIn <= 5) {
      status.warningLevel = "critical";
    } else if (status.isExpiringSoon) {
      status.warningLevel = "warning";
    }

    return status;
  }

  isExpiringSoon(profile: Profile, thresholdMinutes?: number): boolean {
    const threshold = thresholdMinutes || this.warningMinutes;
    const status = this.getTokenStatus(profile);
    return status.isExpiringSoon || (status.expiresIn || 0) <= threshold;
  }

  getTimeUntilExpiry(profile: Profile): number | null {
    if (!profile.expiration) return null;
    
    const expiresAt = new Date(profile.expiration);
    const now = new Date();
    return Math.floor((expiresAt.getTime() - now.getTime()) / 1000 / 60);
  }

  private checkTokenStatus(): void {
    if (!this.currentProfile) return;

    const status = this.getTokenStatus(this.currentProfile);
    const profileKey = this.currentProfile.id;

    if (status.isExpired) {
      this.emit("tokenExpired", {
        profileId: this.currentProfile.id,
        profileName: this.currentProfile.name,
      });
      this.stopMonitoring();
      return;
    }

    if (status.isExpiringSoon && !this.warnedProfiles.get(profileKey)) {
      const warningLevel: "warning" | "critical" = status.warningLevel === "critical" ? "critical" : "warning";
      const event: TokenWarningEvent = {
        profileId: this.currentProfile.id,
        profileName: this.currentProfile.name,
        expiresAt: status.expiresAt!,
        minutesRemaining: status.expiresIn!,
        warningLevel,
      };

      this.emit("tokenWarning", event);
      this.warnedProfiles.set(profileKey, true);
    }

    this.emit("tokenStatusUpdate", status);
  }

  getCurrentProfile(): Profile | null {
    return this.currentProfile;
  }

  isMonitoring(): boolean {
    return this.intervalId !== null;
  }
}

export const tokenMonitor = TokenMonitor.getInstance();
