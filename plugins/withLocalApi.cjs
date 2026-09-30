const { withAndroidManifest } = require('expo/config-plugins');
module.exports = function withLocalApi(config) {
  return withAndroidManifest(config, (config) => {
    const app = config.modResults.manifest.application?.[0];
    if (!app) throw new Error('AndroidManifest sem application');
    app.$ = app.$ || {};
    // Local PHP/Laragon uses HTTP. Keep this explicit in the generated manifest.
    app.$['android:usesCleartextTraffic'] = 'true';
    return config;
  });
};
