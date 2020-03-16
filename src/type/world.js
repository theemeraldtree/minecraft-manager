import rimraf from 'rimraf';
import path from 'path';
import GenericAsset from './genericAsset';

function World(omaf) {
  GenericAsset.call(this, omaf);

  if (!this.datapacks) {
    this.datapacks = [];
  }
}

World.prototype = Object.create(GenericAsset.prototype);

World.prototype.deleteDatapack = function(profile, assetT) {
  let asset = assetT;
  if (!(asset instanceof GenericAsset)) {
    asset = new GenericAsset(asset);
  }

  rimraf.sync(path.join(profile.gameDir, this.getMainFile().path, asset.getMainFile().path));
  this.datapacks.splice(
    this.datapacks.find(dp => dp.id === asset.id),
    1
  );
};

export default World;
