import SettingsManager from '../manager/settingsManager';

/* eslint-disable */
class JavaHandler {
  /**
   * Gets the Java Path for the requested profile
   * If no profile is given, the default global
   * setting will be used
   * @param {object} [profile] - The profile to use
   */
  getJavaPath = (profile) => {
    if (profile && profile.mcm.java?.override) {

    } else {
      return SettingsManager.currentSettings.java.path;
    }
  }
}

export default new JavaHandler();
