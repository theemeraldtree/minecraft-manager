import HTTPRequest from '../host/httprequest';
import SettingsManager from '../manager/settingsManager';
import logInit from './logger';
import Global from './global';

// Privacy-respecting Analytics
// https://github.com/theemeraldtree/analytics

const logger = logInit('Analytics');

const Analytics = {
  send: type => {
    try {
      if (SettingsManager.currentSettings.analyticsEnabled && Global.MCM_VERSION.indexOf('beta') === -1) {
        logger.info(`Sending ${type} analytic`);
        HTTPRequest.get(`https://github.com/theemeraldtree/analytics/releases/download/mcm15/${type}`);
      }
    } catch (e) {
      logger.error(`Unable to send ${type} analytic`);
      logger.error(e);
    }
  }
};

export default Analytics;
