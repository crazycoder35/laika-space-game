const path = require('path');

module.exports = {
  // Asset processing configuration
  assets: {
    // Image processing configuration
    images: {
      input: 'src/assets/images',
      output: 'dist/assets/images',
      tasks: [
        {
          pattern: '**/*.{png,jpg,jpeg}',
          options: {
            compression: {
              enabled: true,
              quality: 85
            },
            resize: {
              width: 1024,
              maintainAspectRatio: true
            },
            format: 'webp'
          }
        },
        {
          pattern: '**/sprites/**/*.{png,jpg,jpeg}',
          options: {
            compression: {
              enabled: true,
              quality: 90
            },
            format: 'png'
          }
        }
      ]
    },

    // Audio processing configuration
    audio: {
      input: 'src/assets/audio',
      output: 'dist/assets/audio',
      tasks: [
        {
          pattern: '**/*.{mp3,wav}',
          options: {
            compression: {
              enabled: true,
              quality: 5
            },
            format: 'mp3',
            bitrate: '128k',
            channels: 2,
            sampleRate: 44100
          }
        },
        {
          pattern: '**/sfx/**/*.{mp3,wav}',
          options: {
            compression: {
              enabled: true,
              quality: 4
            },
            format: 'ogg',
            bitrate: '96k'
          }
        }
      ]
    },

    // Shader processing configuration
    shaders: {
      input: 'src/assets/shaders',
      output: 'dist/assets/shaders',
      tasks: [
        {
          pattern: '**/*.{vert,frag}',
          options: {
            optimize: true,
            defines: {
              MAX_LIGHTS: 4,
              USE_SHADOWS: 1
            },
            includes: [
              path.resolve(__dirname, 'src/assets/shaders/includes')
            ]
          }
        }
      ]
    }
  },

  // Build environment configuration
  environments: {
    development: {
      sourceMaps: true,
      optimization: false,
      minimize: false,
      analyze: false
    },
    production: {
      sourceMaps: 'hidden-source-map',
      optimization: true,
      minimize: true,
      analyze: process.env.ANALYZE === 'true'
    }
  },

  // Bundle splitting configuration
  bundleSplitting: {
    chunks: 'all',
    minSize: 20000,
    maxSize: 244000,
    cacheGroups: {
      vendor: {
        test: /[\\/]node_modules[\\/]/,
        name: 'vendors',
        chunks: 'all'
      },
      common: {
        name: 'common',
        minChunks: 2,
        chunks: 'all',
        priority: -20
      }
    }
  }
}; 