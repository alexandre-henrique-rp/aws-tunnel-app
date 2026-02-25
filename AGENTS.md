# AGENTS.md - AWS Tunnel App Development Guide

## Build, Run & Test Commands

### Installation

```bash
npm install   # or yarn install
```

### Build Commands

```bash
npm run build           # Build main + renderer
npm run build:main     # Build only main process (TypeScript)
npm run build:renderer # Build only renderer (esbuild)
```

### Run Commands

```bash
npm start              # Build and run electron app
npm run pack           # Build unpacked distribution
npm run dist           # Build distributable installer
```

### Development

- No hot reload - rebuild required after changes
- Use `npm run build:main` for quick main process rebuilds

### Testing

- **No test framework currently configured**
- To add tests, install Jest or Vitest
- Example test run: `npx jest --testPathPattern="filename.test.ts"`

---

## Code Style Guidelines

### General Principles

- Use TypeScript with **strict mode enabled** (`tsconfig.json`)
- Avoid `any` - prefer explicit types or `unknown`
- Use functional components with hooks in React
- Use async/await consistently
- Handle errors explicitly - never silently ignore

### TypeScript Configuration

- Target: ES2020, Module: CommonJS, Strict mode: enabled
- JSX: react-jsx, ES module interop: enabled

### Imports & Exports

```typescript
// Good order: external libs → internal modules → relative imports
import React, { useState } from "react";
import { BrowserWindow, ipcMain } from "electron";
import { Profile } from "./models/Profile";
import { cliExecutor } from "./services/cliExecutor";

// Use named exports
export class CLIExecutor { }
export const cliExecutor = CLIExecutor.getInstance();
```

### Naming Conventions

- Files: PascalCase (`AppView.tsx`), camelCase (`cliExecutor.ts`)
- Classes: PascalCase (`class AWSManager`)
- Functions/Variables: camelCase (`getInstance()`, `startMonitoring()`)
- Interfaces/Types: PascalCase (`interface Profile`)
- Constants: UPPER_SNAKE_CASE for config (`DEFAULT_PORT = 5432`)

### Types & Interfaces

```typescript
interface Profile {
  id: string;
  name: string;
  region: string;
  instanceId: string;
  localPort: number;
  remotePort: number;
  accessKeyId?: string;
  secretAccessKey?: string;
}

type ConnectionState = { isConnected: boolean; isConnecting: boolean; };
type ProfileUpdate = Partial<Profile>;
```

### Error Handling

```typescript
// Good - explicit error handling
try {
  const result = await someOperation();
  return result;
} catch (error: unknown) {
  if (error instanceof Error) console.error(error.message);
  return null;
}

// Use Result pattern for operations that can fail
interface CLIResult {
  success: boolean;
  stdout?: string;
  stderr?: string;
  error?: string;
}
```

### React Components

```typescript
export const AppView: React.FC = () => {
  const [state, setState] = useState<Type>(initialValue);
  useEffect(() => { /* effect */ return () => { /* cleanup */ }; }, [deps]);
  return <div>...</div>;
};

// Inline styles
const styles: { [key: string]: React.CSSProperties } = {
  container: { ... },
};
```

### Electron IPC

```typescript
// Main: use invoke/handle
ipcMain.handle("channel:name", async (event, ...args) => await result);

// Renderer: use window.electron
const result = await window.electron.channel.name(args);

// Whitelist channels in preload for security
const validChannels = ["connection:status", "token:warning"];
```

### File Organization

```bach
src/
├── main.ts           # Electron main process
├── preload.ts        # Context bridge
├── renderer.ts       # Renderer entry
├── awsManager.ts     # AWS SDK wrapper
├── trayManager.ts    # System tray
├── models/           # Data interfaces (Profile.ts, Connection.ts)
├── services/         # Business logic (cliExecutor, tokenMonitor, etc.)
├── storage/          # Persistence (profileStorage, secureStorage)
├── views/            # React components (AppView.tsx, SimpleAWSView.tsx)
└── utils/            # Utilities (dependencyChecker.ts)
```

### Best Practices

1. Always validate inputs from IPC and user input
2. Use descriptive variable names - avoid single letters
3. Keep functions small and focused (single responsibility)
4. Document complex logic with JSDoc
5. Use optional chaining and nullish coalescing
6. Log important operations (console.error for failures)
7. Handle platform differences via `process.platform`

### Common Issues

- **Renderer uses esbuild** - main uses tsc
- **Preload runs in Node context** - has Electron API access
- **Context isolation enabled** - use contextBridge for IPC
- **AWS credentials in Profile model** - handle securely
