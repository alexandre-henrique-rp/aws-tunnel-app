export interface Profile {
    id: string;
    name: string;
    region: string;
    instanceId: string;
    localPort: number;
    remotePort: number;
    accessKeyId?: string;
    secretAccessKey?: string;
    sessionToken?: string;
    expiration?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}
export declare function createProfile(data: Partial<Profile>): Profile;
export declare function validateProfile(profile: Partial<Profile>): string[];
