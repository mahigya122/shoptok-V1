module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: (() => {
      const base = [
        [
          'module-resolver',
          {
            root: ['./'],
            alias: {
              '@': './'
            }
          }
        ]
      ];
      try {
        // Only include the reanimated plugin if the worklets package is installed
        require.resolve('react-native-worklets');
        base.push('react-native-reanimated/plugin');
      } catch (e) {
        // skip adding the plugin to avoid transform-time errors
      }
      return base;
    })()
  };
};
