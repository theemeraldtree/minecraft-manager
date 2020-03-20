import rimraf from 'rimraf';
import path from 'path';
import OMAFFileAsset from './omafFileAsset';

function World(omaf) {
  OMAFFileAsset.call(this, omaf);

  if (!this.datapacks) {
    this.datapacks = [];
  }
}

World.prototype = Object.create(OMAFFileAsset.prototype);

World.prototype.deleteDatapack = function(profile, assetT) {
  let asset = assetT;
  if (!(asset instanceof OMAFFileAsset)) {
    asset = new OMAFFileAsset(asset);
  }

  rimraf.sync(path.join(profile.gameDir, this.getMainFile().path, asset.getMainFile().path));
  this.datapacks.splice(
    this.datapacks.find(dp => dp.id === asset.id),
    1
  );
};

export default World;
