const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

// Xcode 27 raises the minimum supported iOS Simulator deployment target to 15.0.
// A few pods' auto-generated privacy-manifest resource bundle targets still
// default to much older values (9.0/12.0/13.4) and fail to build there.
const FIX_MARKER = '# withPodfileDeploymentTargetFix';
const FIX_SNIPPET = `
    ${FIX_MARKER}
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        if config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'].to_f < 15.0
          config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '15.1'
        end
      end
    end
`;

module.exports = function withPodfileDeploymentTargetFix(config) {
  return withDangerousMod(config, [
    'ios',
    (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      let contents = fs.readFileSync(podfilePath, 'utf8');

      if (contents.includes(FIX_MARKER)) {
        return config;
      }

      const anchor = /(react_native_post_install\(\s*[\s\S]*?\)\n)/;
      if (!anchor.test(contents)) {
        throw new Error(
          'withPodfileDeploymentTargetFix: could not find react_native_post_install(...) call in Podfile to anchor the fix.'
        );
      }

      contents = contents.replace(anchor, `$1${FIX_SNIPPET}`);
      fs.writeFileSync(podfilePath, contents);
      return config;
    },
  ]);
};
