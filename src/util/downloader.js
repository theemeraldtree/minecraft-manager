import pMap from 'p-map';
import HTTPRequest from '../host/httprequest';

const Downloader = {
  downloadConcurrently(items, opts = { concurrency: 30 }) {
    const { concurrency } = opts;
    return pMap(items, item => HTTPRequest.downloadInline(item.url, item.dest), { concurrency });
  }
};

export default Downloader;
