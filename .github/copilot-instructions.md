# Copilot Instructions for Abuloni

## Project Overview
This is a modern React + TypeScript + Vite application with a minimal setup focused on fast development. The project uses React 19.2.0 with strict TypeScript configuration and modern ESLint flat config.

## Architecture & Key Files
- **Entry Point**: `src/main.tsx` - Standard React 18+ root rendering with StrictMode
- **Main App**: `src/App.tsx` - Simple counter demo component (Vite template default)
- **Styling**: Global CSS in `src/index.css` with dark/light theme support, component styles in `src/App.css`
- **Utility Module**: `src/getText.ts` - Contains commented API integration code (PDF text extraction service)

## Development Workflow

### Build & Dev Commands
```bash
npm run dev        # Start Vite dev server with HMR
npm run build      # TypeScript check + Vite production build
npm run lint       # ESLint with flat config
npm run preview    # Preview production build
```

### TypeScript Configuration
- Uses **project references** with separate configs for app (`tsconfig.app.json`) and tooling (`tsconfig.node.json`)
- **Strict mode enabled** with additional checks: `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`
- **Vite-specific**: `allowImportingTsExtensions`, `verbatimModuleSyntax`, `noEmit`
- Target: ES2022 with React JSX transform

### ESLint Configuration
- Uses **flat config format** (not legacy `.eslintrc`)
- Configured for React Hooks rules and Vite-specific React Refresh
- Extends TypeScript ESLint recommended rules
- Global ignores: `['dist']`

## Project-Specific Patterns

### Import Conventions
- **Asset imports**: SVG files imported directly (e.g., `import reactLogo from './assets/react.svg'`)
- **Public assets**: Referenced with absolute paths (e.g., `src={viteLogo}` where `viteLogo` is `'/vite.svg'`)
- **TypeScript extensions**: Can import `.tsx` files explicitly due to `allowImportingTsExtensions`

### Styling Approach
- **CSS Custom Properties**: Uses `:root` for theme variables
- **Automatic dark/light mode**: `@media (prefers-color-scheme: light)` overrides
- **Component-scoped CSS**: Each component has its own CSS file (e.g., `App.css` for `App.tsx`)

### Code Quality Standards
- **React 19 patterns**: Uses `createRoot` API, not legacy ReactDOM.render
- **Modern React**: Function components with hooks, no class components
- **Type safety**: Strict TypeScript with non-null assertions where DOM elements are guaranteed

## Development Notes
- **HMR**: Vite provides fast refresh - changes to `src/App.tsx` show immediately
- **Incomplete code**: `src/getText.ts` contains commented PDF API code that may be work-in-progress
- **No testing setup**: No test runner or testing libraries configured
- **No routing**: Single-page application without React Router

## External Dependencies
- **Production**: Only React and ReactDOM (minimal surface area)
- **Development**: Full TypeScript + ESLint + Vite toolchain
- **API Integration**: Comments suggest PDFRest API usage (currently inactive)

When working on this project, maintain the minimal, fast-development approach and follow the strict TypeScript configuration.