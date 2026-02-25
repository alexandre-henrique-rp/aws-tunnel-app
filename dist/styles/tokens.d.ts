export declare const spacing: {
    readonly xs: 4;
    readonly sm: 8;
    readonly md: 12;
    readonly lg: 16;
    readonly xl: 24;
    readonly '2xl': 32;
    readonly '3xl': 48;
};
export declare const radius: {
    readonly sm: 6;
    readonly md: 10;
    readonly lg: 14;
    readonly xl: 20;
    readonly full: 9999;
};
export declare const shadows: {
    readonly sm: "0 1px 2px rgba(0,0,0,0.05)";
    readonly md: "0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05)";
    readonly lg: "0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -4px rgba(0,0,0,0.04)";
    readonly focus: "0 0 0 3px rgba(99,102,241,0.25)";
    readonly focusDanger: "0 0 0 3px rgba(239,68,68,0.25)";
};
export declare const typography: {
    readonly size: {
        readonly xs: 11;
        readonly sm: 12;
        readonly base: 13;
        readonly md: 14;
        readonly lg: 16;
        readonly xl: 18;
        readonly '2xl': 22;
    };
    readonly weight: {
        readonly regular: 400;
        readonly medium: 500;
        readonly semibold: 600;
        readonly bold: 700;
    };
    readonly family: {
        readonly sans: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif";
        readonly mono: "'SF Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace";
    };
};
export declare const lightTheme: {
    bg: {
        app: string;
        surface: string;
        surfaceHover: string;
        muted: string;
        input: string;
        inputHover: string;
    };
    border: {
        default: string;
        strong: string;
        muted: string;
        focus: string;
    };
    text: {
        primary: string;
        secondary: string;
        muted: string;
        placeholder: string;
        inverse: string;
        link: string;
    };
    status: {
        online: {
            bg: string;
            border: string;
            text: string;
            dot: string;
        };
        offline: {
            bg: string;
            border: string;
            text: string;
            dot: string;
        };
    };
    action: {
        primary: string;
        primaryHover: string;
        primaryFg: string;
        success: string;
        successHover: string;
        successFg: string;
        danger: string;
        dangerHover: string;
        dangerFg: string;
        neutral: string;
        neutralHover: string;
        neutralFg: string;
    };
    feedback: {
        success: {
            bg: string;
            border: string;
            text: string;
        };
        error: {
            bg: string;
            border: string;
            text: string;
        };
        info: {
            bg: string;
            border: string;
            text: string;
        };
        warning: {
            bg: string;
            border: string;
            text: string;
        };
    };
};
export type Theme = typeof lightTheme;
export declare const darkTheme: Theme;
