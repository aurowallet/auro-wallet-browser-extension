require('@babel/register')({
    // Override the default ignore to compile node_modules, or specify particular ones
    ignore: [/node_modules\/(?!@aurowallet\/mina-provider)/], // Adjust the regex to match the third-party library you need to transpile
    presets: ['@babel/preset-env', '@babel/preset-react'] // Ensure you have the necessary presets for React and ES6+
  });