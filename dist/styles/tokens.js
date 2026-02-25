"use strict";
// ─── Design Tokens ───────────────────────────────────────────────────────────
// Sistema de design centralizado para o AWS Tunnel App.
// Todas as cores, espaçamentos, tipografia e sombras ficam aqui.
Object.defineProperty(exports, "__esModule", { value: true });
exports.darkTheme = exports.lightTheme = exports.typography = exports.shadows = exports.radius = exports.spacing = void 0;
exports.spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    '2xl': 32,
    '3xl': 48,
};
exports.radius = {
    sm: 6,
    md: 10,
    lg: 14,
    xl: 20,
    full: 9999,
};
exports.shadows = {
    sm: '0 1px 2px rgba(0,0,0,0.05)',
    md: '0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05)',
    lg: '0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -4px rgba(0,0,0,0.04)',
    focus: '0 0 0 3px rgba(99,102,241,0.25)',
    focusDanger: '0 0 0 3px rgba(239,68,68,0.25)',
};
exports.typography = {
    size: {
        xs: 11,
        sm: 12,
        base: 13,
        md: 14,
        lg: 16,
        xl: 18,
        '2xl': 22,
    },
    weight: {
        regular: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
    },
    family: {
        sans: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif",
        mono: "'SF Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace",
    },
};
// ─── Light Theme ─────────────────────────────────────────────────────────────
// Sem `as const` nos temas — literal types impedem atribuição cruzada light/dark.
exports.lightTheme = {
    bg: {
        app: '#F0F2F5',
        surface: '#FFFFFF',
        surfaceHover: '#F8FAFC',
        muted: '#F1F5F9',
        input: '#FFFFFF',
        inputHover: '#FAFBFC',
    },
    border: {
        default: '#E2E8F0',
        strong: '#CBD5E1',
        muted: '#F1F5F9',
        focus: '#6366F1',
    },
    text: {
        primary: '#0F172A',
        secondary: '#475569',
        muted: '#94A3B8',
        placeholder: '#CBD5E1',
        inverse: '#FFFFFF',
        link: '#6366F1',
    },
    status: {
        online: { bg: '#F0FDF4', border: '#BBF7D0', text: '#15803D', dot: '#22C55E' },
        offline: { bg: '#FFF1F2', border: '#FECDD3', text: '#BE123C', dot: '#F43F5E' },
    },
    action: {
        primary: '#6366F1',
        primaryHover: '#4F46E5',
        primaryFg: '#FFFFFF',
        success: '#16A34A',
        successHover: '#15803D',
        successFg: '#FFFFFF',
        danger: '#DC2626',
        dangerHover: '#B91C1C',
        dangerFg: '#FFFFFF',
        neutral: '#475569',
        neutralHover: '#334155',
        neutralFg: '#FFFFFF',
    },
    feedback: {
        success: { bg: '#F0FDF4', border: '#BBF7D0', text: '#15803D' },
        error: { bg: '#FFF1F2', border: '#FECDD3', text: '#BE123C' },
        info: { bg: '#EFF6FF', border: '#BFDBFE', text: '#1D4ED8' },
        warning: { bg: '#FFFBEB', border: '#FDE68A', text: '#B45309' },
    },
};
// ─── Dark Theme ──────────────────────────────────────────────────────────────
exports.darkTheme = {
    bg: {
        app: '#080E1A',
        surface: '#111827',
        surfaceHover: '#1C2535',
        muted: '#0D1320',
        input: '#0D1626',
        inputHover: '#111827',
    },
    border: {
        default: '#1E2D45',
        strong: '#2D3F5A',
        muted: '#111827',
        focus: '#818CF8',
    },
    text: {
        primary: '#E2E8F0',
        secondary: '#94A3B8',
        muted: '#4B5E7A',
        placeholder: '#2D3F5A',
        inverse: '#080E1A',
        link: '#818CF8',
    },
    status: {
        online: { bg: '#052E16', border: '#14532D', text: '#4ADE80', dot: '#4ADE80' },
        offline: { bg: '#1C0A0F', border: '#4C0519', text: '#FDA4AF', dot: '#FB7185' },
    },
    action: {
        primary: '#818CF8',
        primaryHover: '#6366F1',
        primaryFg: '#FFFFFF',
        success: '#4ADE80',
        successHover: '#22C55E',
        successFg: '#052E16',
        danger: '#F87171',
        dangerHover: '#EF4444',
        dangerFg: '#FFFFFF',
        neutral: '#94A3B8',
        neutralHover: '#CBD5E1',
        neutralFg: '#080E1A',
    },
    feedback: {
        success: { bg: '#052E16', border: '#14532D', text: '#4ADE80' },
        error: { bg: '#1C0A0F', border: '#4C0519', text: '#FDA4AF' },
        info: { bg: '#0C1A3B', border: '#1E3A8A', text: '#93C5FD' },
        warning: { bg: '#1C0F00', border: '#451A03', text: '#FCD34D' },
    },
};
