# Deployment Fix TODO

## Phase 1: Fix package.json Dependencies ✅
- [x] Move vite to devDependencies
- [x] Move @vitejs/plugin-react to devDependencies
- [x] Move typescript to devDependencies
- [x] Add @types/react and @types/react-dom
- [x] Update Node version to 20.x
- [x] Keep runtime dependencies in dependencies

## Phase 2: Update Render Configuration ✅
- [x] Fix build command to install dev dependencies (npm ci → npm install)
- [x] Update Node version to 20
- [x] Verify environment variables

## Phase 3: Update Vercel Configuration ✅
- [x] Update Node version to 20.x
- [x] Verify build configuration

## Phase 4: Update .nvmrc ✅
- [x] Change from 18 to 20

## Phase 5: Deploy 🚀
- [ ] Git add, commit, and push
- [ ] Monitor deployment

## Issue Being Fixed
- Error: "sh: 1: vite: not found" during Render deployment
- Root cause: vite in wrong dependency section + build command not installing dev deps
- Node 18 EOL warning

## Changes Made:
1. **package.json**: Moved vite, @vitejs/plugin-react, and typescript to devDependencies
2. **package.json**: Added @types/react and @types/react-dom for TypeScript support
3. **package.json**: Updated Node engine from 18.x to 20.x
4. **render.yaml**: Changed build command from `npm ci` to `npm install` to ensure dev dependencies are installed
5. **render.yaml**: Updated NODE_VERSION from 18 to 20
6. **vercel.json**: Updated NODE_VERSION from 18.x to 20.x
7. **.nvmrc**: Updated from 18 to 20
