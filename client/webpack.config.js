const webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  entry: {
    main: ['./src/index.js']
  },
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: '[name].[contenthash].js',
    publicPath: '/'
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            cacheDirectory: true
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx'],
    alias: {
      'axios$': path.resolve(__dirname, 'node_modules/axios/dist/axios.js')
    },
    fallback: {
      "crypto": require.resolve("crypto-browserify"),
      "stream": require.resolve("stream-browserify"),
      "buffer": require.resolve("buffer/"),
      "util": require.resolve("util/"),
      "process": false,
      "http": false,
      "https": false,
      "zlib": false,
      "url": false
    }
  },
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer']
    }),
    new webpack.DefinePlugin({
      'process.env': JSON.stringify(process.env),
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      'process.browser': true,
      'process.version': JSON.stringify(process.version)
    }),
    new HtmlWebpackPlugin({
      template: './public/index.html',
      filename: 'index.html',
      inject: true
    })
  ],
  devServer: {
    historyApiFallback: true,
    hot: true,
    port: 3000,
    static: {
      directory: path.join(__dirname, 'public')
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true
      },
      '/socket.io': {
        target: 'http://localhost:5001',
        ws: true
      }
    }
  }
};
