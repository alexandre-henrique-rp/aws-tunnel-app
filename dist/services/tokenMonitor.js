"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokenMonitor = exports.TokenMonitor = void 0;
const events_1 = require("events");
class TokenMonitor extends events_1.EventEmitter {
    constructor() {
        super();
        this.intervalId = null;
        this.checkInterval = 60000;
        this.warningMinutes = 30;
        this.currentProfile = null;
        this.warnedProfiles = new Map();
    }
    static getInstance() {
        if (!TokenMonitor.instance) {
            TokenMonitor.instance = new TokenMonitor();
        }
        return TokenMonitor.instance;
    }
    setWarningThreshold(minutes) {
        this.warningMinutes = minutes;
    }
    startMonitoring(profile) {
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
    stopMonitoring() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.currentProfile = null;
        this.warnedProfiles.clear();
    }
    getTokenStatus(profile) {
        const status = {
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
        }
        else if (expiresIn <= 5) {
            status.warningLevel = "critical";
        }
        else if (status.isExpiringSoon) {
            status.warningLevel = "warning";
        }
        return status;
    }
    isExpiringSoon(profile, thresholdMinutes) {
        const threshold = thresholdMinutes || this.warningMinutes;
        const status = this.getTokenStatus(profile);
        return status.isExpiringSoon || (status.expiresIn || 0) <= threshold;
    }
    getTimeUntilExpiry(profile) {
        if (!profile.expiration)
            return null;
        const expiresAt = new Date(profile.expiration);
        const now = new Date();
        return Math.floor((expiresAt.getTime() - now.getTime()) / 1000 / 60);
    }
    checkTokenStatus() {
        if (!this.currentProfile)
            return;
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
            const warningLevel = status.warningLevel === "critical" ? "critical" : "warning";
            const event = {
                profileId: this.currentProfile.id,
                profileName: this.currentProfile.name,
                expiresAt: status.expiresAt,
                minutesRemaining: status.expiresIn,
                warningLevel,
            };
            this.emit("tokenWarning", event);
            this.warnedProfiles.set(profileKey, true);
        }
        this.emit("tokenStatusUpdate", status);
    }
    getCurrentProfile() {
        return this.currentProfile;
    }
    isMonitoring() {
        return this.intervalId !== null;
    }
}
exports.TokenMonitor = TokenMonitor;
exports.tokenMonitor = TokenMonitor.getInstance();
