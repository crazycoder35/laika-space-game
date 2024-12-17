const path = require('path');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  const config = {
    entry: './src/main.ts',
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: [
            {
              loader: 'babel-loader',
              options: {
                presets: [
                  ['@babel/preset-env', { targets: 'last 2 versions' }],
                  '@babel/preset-typescript'
                ],
                plugins: isProduction ? [
                  '@babel/plugin-transform-runtime',
                  'babel-plugin-transform-remove-console'
                ] : []
              }
            }
          ],
          exclude: /node_modules/
        },
        {
          test: /\.(png|svg|jpg|jpeg|gif)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'assets/images/[name].[hash][ext]'
          }
        },
        {
          test: /\.(glsl|vs|fs|vert|frag)$/,
          type: 'asset/source',
          generator: {
            filename: 'assets/shaders/[name].[hash][ext]'
          }
        },
        {
          test: /\.(mp3|wav|ogg)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'assets/audio/[name].[hash][ext]'
          }
        }
      ]
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
      alias: {
        '@core': path.resolve(__dirname, 'src/core/'),
        '@components': path.resolve(__dirname, 'src/components/'),
        '@scenes': path.resolve(__dirname, 'src/scenes/'),
        '@types': path.resolve(__dirname, 'src/types/'),
        '@assets': path.resolve(__dirname, 'src/assets/')
      }
    },
    output: {
      filename: isProduction ? '[name].[contenthash].js' : '[name].js',
      path: path.resolve(__dirname, 'dist'),
      clean: true
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(isProduction ? 'production' : 'development'),
        'process.env.API_URL': JSON.stringify(process.env.API_URL || 'http://localhost:3000')
      }),
      new CleanWebpackPlugin(),
      new CopyWebpackPlugin({
        patterns: [
          { from: 'public', to: '' }
        ]
      })
    ],
    devServer: {
      static: {
        directory: path.join(__dirname, 'public'),
      },
      hot: true,
      port: 9000,
      compress: true
    },
    devtool: isProduction ? 'source-map' : 'eval-source-map',
    cache: {
      type: 'filesystem'
    }
  };

  if (isProduction) {
    // Production-only optimizations
    config.optimization = {
      minimize: true,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            compress: {
              drop_console: true,
              drop_debugger: true
            },
            format: {
              comments: false
            }
          },
          extractComments: false
        })
      ],
      splitChunks: {
        chunks: 'all',
        minSize: 20000,
        maxSize: 244000,
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all'
          }
        }
      }
    };

    // Production-only plugins
    config.plugins.push(
      new CompressionPlugin({
        test: /\.(js|css|html|svg)$/,
        algorithm: 'gzip'
      })
    );

    // Add bundle analyzer in production if requested
    if (process.env.ANALYZE) {
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: false
        })
      );
    }
  }

  return config;
};
