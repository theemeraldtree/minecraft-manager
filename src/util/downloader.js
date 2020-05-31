import pMap from 'p-map';
import HTTPRequest from '../host/httprequest';

const Downloader = {
  downloadConcurrently(items, opts = { concurrency: 30 }) {
    const { concurrency } = opts;
    return pMap(items, item => (item !== undefined ? HTTPRequest.downloadInline(item.url, item.dest) : 0), { concurrency });
  }
};

export default Downloader;
