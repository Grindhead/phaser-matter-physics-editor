# Tech Context

## Technologies Used

- **Framework:** Phaser 3 (JavaScript/TypeScript game framework)
- **Physics Engine:** Matter.js (integrated with Phaser)
- **Language:** TypeScript
- **Build Tool:** Vite
- **Package Manager:** npm (or yarn, check `package-lock.json` or `yarn.lock`)

## Development Setup

- Requires Node.js and npm/yarn.
- Run `npm install` or `yarn install` to install dependencies.
- Run `npm run dev` or `yarn dev` to start the development server (using Vite).

## Technical Constraints

- Browser-based game, limitations apply (performance, APIs).
- Relies on Phaser 3 and Matter.js capabilities.

## Dependencies

- `phaser`: Core game framework.
- `typescript`: Language support.
- `vite`: Build tool and dev server.
- `@types/node`: Node type definitions (often needed for tooling).
- Potentially others (check `package.json`).

## Tool Usage Patterns

- Vite handles asset bundling, dev server, and production builds.
- TypeScript compiler (`tsc`) checks types during development and build.
