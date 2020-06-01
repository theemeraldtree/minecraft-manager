import pMap from 'p-map';
import HTTPRequest from '../host/httprequest';

const Downloader = {
  downloadConcurrently(items, opts = { concurrency: 30 }) {
    const { concurrency } = opts;
    return pMap(items, item => new Promise(async resolve => {
        if (item !== undefined) {
          await HTTPRequest.downloadInline(item.url, item.dest);
          if (item.onFinish) item.onFinish();
          resolve();
        } else {
          resolve();
        }
      }), { concurrency });
  }
};

export default Downloader;
