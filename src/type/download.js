function Download(name, url, dest, opts) {
  this.name = name;
  this.url = url;
  this.dest = dest;
  this.progress = 'Waiting...';
  this.progressPercent = 0;
  Object.assign(this, opts);
}

Download.prototype.setProgress = function(progress) {
  this.progress = progress;
};

Download.prototype.setProgressPercent = function(percent) {
  this.progressPercent = percent;
};

export default Download;
