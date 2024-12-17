# Laika Space Game Engine

A modern TypeScript-based 2D game engine designed for building space-themed games with a focus on performance and extensibility.

## Features

- **Entity Component System (ECS)**: Flexible and efficient game object management
- **WebGL Rendering**: Hardware-accelerated graphics with batch rendering support
- **Physics Engine**: Custom 2D physics with collision detection
- **Asset Management**: Efficient asset loading and caching system
- **Input System**: Configurable keyboard and mouse input handling
- **Audio System**: Advanced audio management with spatial sound support
- **Save System**: Robust save/load functionality with encryption
- **Memory Management**: Automatic memory optimization and monitoring
- **Build System**: Optimized asset pipeline and build process

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- Modern web browser with WebGL support

## Installation

1. Clone the repository:
```bash
git clone https://github.com/crazycoder35/laika-space-game.git
cd laika-space-game
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

## Project Structure

```
laika-space-game/
├── src/
│   ├── core/           # Core engine components
│   ├── systems/        # Game systems (Physics, Render, etc.)
│   ├── components/     # Game components
│   ├── factories/      # Entity factories
│   ├── types/          # TypeScript type definitions
│   └── build/          # Build system
├── public/
│   └── assets/         # Game assets
├── scripts/            # Build and utility scripts
├── dist/              # Compiled output
└── tests/             # Test files
```

## Usage

### Basic Game Setup

```typescript
import { LaikaGame } from './main';

// Initialize game
const game = new LaikaGame();
game.initialize().catch(console.error);
```

### Creating Game Objects

```typescript
// Create player ship
const playerShip = spaceshipFactory.createPlayerShip({
  position: { x: 400, y: 300 },
  health: 100,
  speed: 300
});

// Create meteor
const meteor = meteorFactory.createMeteor({
  position: { x: 0, y: 0 },
  size: 'large',
  velocity: { x: 1, y: 1 }
});
```

## Building

Development build:
```bash
npm run build:dev
```

Production build:
```bash
npm run build
```

Analyze bundle:
```bash
npm run build:analyze
```

## Testing

Run unit tests:
```bash
npm test
```

Run E2E tests:
```bash
npm run test:e2e
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with TypeScript and WebGL
- Uses Jest for testing
- Webpack for bundling
- Various open-source libraries and tools

## Contact

Your Name - [@yourusername](https://twitter.com/yourusername)
Project Link: [https://github.com/yourusername/laika-space-game](https://github.com/yourusername/laika-space-game)
