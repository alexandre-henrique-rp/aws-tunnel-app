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
export declare class TokenMonitor extends EventEmitter {
    private static instance;
    private intervalId;
    private checkInterval;
    private warningMinutes;
    private currentProfile;
    private warnedProfiles;
    private constructor();
    static getInstance(): TokenMonitor;
    setWarningThreshold(minutes: number): void;
    startMonitoring(profile: Profile): void;
    stopMonitoring(): void;
    getTokenStatus(profile: Profile): TokenStatus;
    isExpiringSoon(profile: Profile, thresholdMinutes?: number): boolean;
    getTimeUntilExpiry(profile: Profile): number | null;
    private checkTokenStatus;
    getCurrentProfile(): Profile | null;
    isMonitoring(): boolean;
}
export declare const tokenMonitor: TokenMonitor;
