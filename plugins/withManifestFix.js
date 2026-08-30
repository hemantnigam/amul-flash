const { withAndroidManifest } = require('expo/config-plugins');

module.exports = function withManifestFix(config) {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults.manifest;
    const application = androidManifest.application?.[0];

    // Ensure tools namespace is added to AndroidManifest root
    if (!androidManifest.$) {
      androidManifest.$ = {};
    }
    androidManifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';

    if (application && Array.isArray(application['meta-data'])) {
      // 1. Tag all firebase notification meta-data with tools:replace
      application['meta-data'].forEach((metaData) => {
        const name = metaData.$?.['android:name'];
        if (
          name === 'com.google.firebase.messaging.default_notification_color' ||
          name === 'com.google.firebase.messaging.default_notification_icon'
        ) {
          if (!metaData.$) metaData.$ = {};
          metaData.$['tools:replace'] = 'android:resource';
        }
      });

      // 2. Remove duplicate default_notification_color entries if multiple exist
      let seenColor = false;
      application['meta-data'] = application['meta-data'].filter((metaData) => {
        const name = metaData.$?.['android:name'];
        if (name === 'com.google.firebase.messaging.default_notification_color') {
          if (seenColor) return false;
          seenColor = true;
        }
        return true;
      });
    }

    return config;
  });
};
