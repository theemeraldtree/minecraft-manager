import pMap from 'p-map';
import HTTPRequest from '../host/httprequest';
import Hosts from '../host/Hosts';
import DownloadsManager from '../manager/downloadsManager';
import Curse from '../host/curse/curse';


/**
 * Downloader Utility class for handling multiple concurrent downloads
 */
const Downloader = {
  /**
   * Downloads a list of items concurrently
   * @param {array} items - The items to be downloaded
   * @param {object} opts - Extra options
   */
  downloadConcurrently(items, opts = { concurrency: 30 }) {
    const { concurrency } = opts;
    return pMap(items, item => new Promise(async resolve => {
        if (item !== undefined) {
          await HTTPRequest.downloadInline(item.url, item.dest);
          if (item.onFinish) {
            item.onFinish();
          }
          resolve();
        } else {
          resolve();
        }
      }), { concurrency });
  },
  /**
   * Downloads an array of hosted assets to a destination
   * @param {string} host - The host being downlaoded from
   * @param {array} assets - The assets to be downloaded
   * @param {object} profile - The profile to download the assets to
   */
  downloadHostedAssets(host, assets, profile) {
    return new Promise(async resolve => {
      const download = await DownloadsManager.createProgressiveDownload(`Assets\n_A_${profile.name}`);

      let numberFinished = 0;

      const updateProgress = () => {
        numberFinished++;
        DownloadsManager.setDownloadProgress(download.name, Math.floor((numberFinished / assets.length) * 100));
      };

      await pMap(assets, rawAsset => new Promise(async (res, rej) => {
        let asset = rawAsset;
        if (!asset.name && host === 'curse') {
          asset = await Curse.getFullAsset(asset);
          asset.hosts.curse.fileID = rawAsset.hosts.curse.fileID;
        }

        try {
          await Hosts.installAssetVersionToProfile(
            host,
            profile,
            asset,
            'unknown',
            false,
            { disableSave: true });

          updateProgress();
          res();
        } catch (e) {
          rej(e);
        }
        }), { concurrency: 10 });

      DownloadsManager.removeDownload(download.name);

      profile.save();
      resolve();
    });
  }
};

export default Downloader;
