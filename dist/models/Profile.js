"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProfile = createProfile;
exports.validateProfile = validateProfile;
function createProfile(data) {
    const now = new Date();
    return {
        id: data.id || crypto.randomUUID(),
        name: data.name || "",
        region: data.region || "us-east-1",
        instanceId: data.instanceId || "",
        localPort: data.localPort || 5432,
        remotePort: data.remotePort || 5432,
        accessKeyId: data.accessKeyId,
        secretAccessKey: data.secretAccessKey,
        sessionToken: data.sessionToken,
        expiration: data.expiration,
        createdAt: data.createdAt || now,
        updatedAt: data.updatedAt || now,
    };
}
function validateProfile(profile) {
    const errors = [];
    if (!profile.name?.trim()) {
        errors.push("Nome do perfil é obrigatório");
    }
    if (!profile.region?.trim()) {
        errors.push("Região é obrigatória");
    }
    if (!profile.instanceId?.trim()) {
        errors.push("ID da instância é obrigatório");
    }
    if (!profile.localPort || profile.localPort < 1 || profile.localPort > 65535) {
        errors.push("Porta local deve estar entre 1 e 65535");
    }
    if (!profile.remotePort || profile.remotePort < 1 || profile.remotePort > 65535) {
        errors.push("Porta remota deve estar entre 1 e 65535");
    }
    return errors;
}
