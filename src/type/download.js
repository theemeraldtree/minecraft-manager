function Download(name, url, dest) {
  this.name = name;
  this.url = url;
  this.dest = dest;
  this.progress = 'Waiting...';
  this.progressPercent = 0;
}

Download.prototype.setProgress = function(progress) {
  this.progress = progress;
};

Download.prototype.setProgressPercent = function(percent) {
  this.progressPercent = percent;
};

export default Download;
