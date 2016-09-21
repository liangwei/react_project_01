var webpack = require('webpack');
var path = require('path');

module.exports = {
  entry: {
    feature_1: './js/feature_1.js'
  },
  output: {
    path: path.join(__dirname,'js','dist'),
    filename: '[name].js',
    // chunkFilename: 'chunk[id].js?ver'+new Date().getTime(),
    // publicPath: 'http://res2.esf.leju.com/xk_www/statics/dist/js/'
  },
  resolve: {
    extensions: ['', '.js','.css']
  },
  module: {
    loaders: [{
      test: /\.css$/,
      loaders: ['style', 'css']
      },
      {
        test: /\.jsx?$/,  
        exclude: /(node_modules|bower_components)/,  
        loader: 'babel', // 'babel-loader' is also a legal name to reference  
        query: {  
          presets: ['react', 'es2015']  
        }  
      }
    ]
  },
  plugins: [
    // new webpack.optimize.UglifyJsPlugin({
    //   compressor:{
    //     warnings:false
    //   }
    // }),
    //保持react为产品模式
    new webpack.DefinePlugin({
      'process.env':{
        'NODE_ENV': JSON.stringify('production')
      }
    }),
    new webpack.ProvidePlugin({
        $: "jquery",
        React:'react',
        ReactDom:'react-dom'
    }),
    new webpack.optimize.OccurenceOrderPlugin()
  ]
};
