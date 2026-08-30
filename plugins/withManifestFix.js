const { withAndroidManifest } = require('expo/config-plugins');

module.exports = function withManifestFix(config) {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults.manifest;
    const application = androidManifest.application?.[0];

    // Ensure tools namespace is added to AndroidManifest
    if (!androidManifest.$) {
      androidManifest.$ = {};
    }
    if (!androidManifest.$['xmlns:tools']) {
      androidManifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
    }

    if (application && Array.isArray(application['meta-data'])) {
      for (const metaData of application['meta-data']) {
        const name = metaData.$?.['android:name'];
        if (
          name === 'com.google.firebase.messaging.default_notification_color' ||
          name === 'com.google.firebase.messaging.default_notification_icon'
        ) {
          metaData.$['tools:replace'] = 'android:resource';
        }
      }
    }

    return config;
  });
};
