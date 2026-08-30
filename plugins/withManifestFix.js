const { withAndroidManifest, withMainActivity } = require('expo/config-plugins');

function withLockScreenManifest(config) {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults.manifest;
    const application = androidManifest.application?.[0];

    // Ensure tools namespace is added to AndroidManifest root
    if (!androidManifest.$) {
      androidManifest.$ = {};
    }
    androidManifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';

    // 1. Configure MainActivity to show when locked and turn screen on
    if (application && Array.isArray(application.activity)) {
      application.activity.forEach((activity) => {
        if (!activity.$) activity.$ = {};
        activity.$['android:showWhenLocked'] = 'true';
        activity.$['android:turnScreenOn'] = 'true';
        activity.$['android:showForAllUsers'] = 'true';
      });
    }

    // 2. Tag all firebase notification meta-data with tools:replace
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

      // 3. Remove duplicate default_notification_color entries if multiple exist
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

function withLockScreenMainActivity(config) {
  return withMainActivity(config, async (config) => {
    let contents = config.modResults.contents;

    if (!contents.includes('setShowWhenLocked')) {
      const lockFlagsCode = `
    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O_MR1) {
      setShowWhenLocked(true)
      setTurnScreenOn(true)
    } else {
      window.addFlags(
        android.view.WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
        android.view.WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
        android.view.WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD or
        android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
      )
    }`;

      // 1. If super.onCreate(...) already exists in MainActivity.kt, inject right after it
      const superOnCreateMatch = contents.match(/super\.onCreate\([^)]*\)/);
      if (superOnCreateMatch) {
        contents = contents.replace(
          superOnCreateMatch[0],
          `${superOnCreateMatch[0]}${lockFlagsCode}`
        );
      } else {
        // 2. If onCreate does not exist, define single onCreate
        const classMatch = contents.match(/class MainActivity\s*:\s*ReactActivity\(\)\s*\{/);
        if (classMatch) {
          contents = contents.replace(
            classMatch[0],
            `${classMatch[0]}\n  override fun onCreate(savedInstanceState: android.os.Bundle?) {\n    super.onCreate(savedInstanceState)${lockFlagsCode}\n  }\n`
          );
        }
      }
    }

    config.modResults.contents = contents;
    return config;
  });
}

module.exports = function withManifestFix(config) {
  return withLockScreenMainActivity(withLockScreenManifest(config));
};
