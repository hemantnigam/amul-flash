const { withAndroidManifest } = require('expo/config-plugins');

function withFirebaseManifestFix(config) {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults.manifest;
    const application = androidManifest.application?.[0];

    // Ensure tools namespace is added to AndroidManifest root
    if (!androidManifest.$) {
      androidManifest.$ = {};
    }
    androidManifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';

    // Tag all firebase notification meta-data with tools:replace
    if (application && Array.isArray(application['meta-data'])) {
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

      // Remove duplicate default_notification_color entries if multiple exist
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
}

module.exports = function withManifestFix(config) {
  return withFirebaseManifestFix(config);
};
