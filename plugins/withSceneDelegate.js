const { withAppDelegate, withInfoPlist, withXcodeProject, IOSConfig } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

// iOS 27 hard-crashes apps that never adopt the UIScene lifecycle (previously this
// was just a soft runtime warning). Since expo prebuild regenerates ios/ from
// scratch, this plugin adds a minimal SceneDelegate + wiring so the crash doesn't
// come back on the next prebuild or EAS build once they move to Xcode 27 too.

const SCENE_DELEGATE_SWIFT = `import UIKit

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?

  func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
    guard let windowScene = scene as? UIWindowScene else { return }
    guard let appDelegate = UIApplication.shared.delegate as? AppDelegate,
          let factory = appDelegate.reactNativeFactory else { return }

    let window = UIWindow(windowScene: windowScene)
    self.window = window
    appDelegate.window = window

    factory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: appDelegate.launchOptions)
  }
}
`;

function withSceneManifest(config) {
  return withInfoPlist(config, (config) => {
    config.modResults.UIApplicationSceneManifest = {
      UIApplicationSupportsMultipleScenes: false,
      UISceneConfigurations: {
        UIWindowSceneSessionRoleApplication: [
          {
            UISceneConfigurationName: 'Default Configuration',
            UISceneDelegateClassName: '$(PRODUCT_MODULE_NAME).SceneDelegate',
          },
        ],
      },
    };
    return config;
  });
}

function withSceneDelegateFile(config) {
  return withXcodeProject(config, (config) => {
    const platformProjectRoot = config.modRequest.platformProjectRoot;
    const projectName = IOSConfig.XcodeUtils.getProjectName(config.modRequest.projectRoot);
    const targetPath = path.join(platformProjectRoot, projectName, 'SceneDelegate.swift');

    fs.writeFileSync(targetPath, SCENE_DELEGATE_SWIFT);

    if (!config.modResults.hasFile(targetPath)) {
      config.modResults = IOSConfig.XcodeUtils.addBuildSourceFileToGroup({
        filepath: path.join(projectName, 'SceneDelegate.swift'),
        groupName: projectName,
        project: config.modResults,
        verbose: true,
      });
    }
    return config;
  });
}

function withAppDelegateSceneSupport(config) {
  return withAppDelegate(config, (config) => {
    let contents = config.modResults.contents;

    if (contents.includes('configurationForConnectingSceneSession')) {
      // Already applied (e.g. re-running prebuild without --clean).
      return config;
    }

    if (!contents.includes('var reactNativeFactory: RCTReactNativeFactory?')) {
      throw new Error(
        'withSceneDelegate: could not find expected AppDelegate.swift anchor "var reactNativeFactory". ' +
          'The Expo/React Native AppDelegate template may have changed — update plugins/withSceneDelegate.js.'
      );
    }

    // Track launchOptions so SceneDelegate can hand them to startReactNative.
    contents = contents.replace(
      'var reactNativeFactory: RCTReactNativeFactory?',
      'var reactNativeFactory: RCTReactNativeFactory?\n  var launchOptions: [UIApplication.LaunchOptionsKey: Any]?'
    );
    contents = contents.replace(
      'reactNativeFactory = factory',
      'reactNativeFactory = factory\n    self.launchOptions = launchOptions'
    );

    // Window creation + startReactNative move to SceneDelegate; leave everything
    // else inside the #if block (e.g. plugin-generated Firebase setup) untouched.
    contents = contents.replace('    window = UIWindow(frame: UIScreen.main.bounds)\n', '');
    contents = contents.replace(
      '    factory.startReactNative(\n      withModuleName: "main",\n      in: window,\n      launchOptions: launchOptions)\n',
      ''
    );

    contents = contents.replace(
      'return super.application(application, didFinishLaunchingWithOptions: launchOptions)\n  }',
      `return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  public func application(
    _ application: UIApplication,
    configurationForConnectingSceneSession connectingSceneSession: UISceneSession,
    options: UIScene.ConnectionOptions
  ) -> UISceneConfiguration {
    let configuration = UISceneConfiguration(name: "Default Configuration", sessionRole: connectingSceneSession.role)
    configuration.delegateClass = SceneDelegate.self
    return configuration
  }`
    );

    config.modResults.contents = contents;
    return config;
  });
}

module.exports = function withSceneDelegate(config) {
  config = withSceneManifest(config);
  config = withSceneDelegateFile(config);
  config = withAppDelegateSceneSupport(config);
  return config;
};
