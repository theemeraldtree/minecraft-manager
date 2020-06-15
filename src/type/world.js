import rimraf from 'rimraf';
import path from 'path';
import OMAFFileAsset from './omafFileAsset';

export default class World extends OMAFFileAsset {
  constructor(json) {
    super(json);
    if (!this.datapacks) {
      this.datapacks = [];
    }

    this.datapacks = this.datapacks.map(datapack => new OMAFFileAsset(datapack));
  }

  deleteDatapack(profile, assetT) {
    let asset = assetT;
    if (!(asset instanceof OMAFFileAsset)) {
      asset = new OMAFFileAsset(asset);
    }

    rimraf.sync(path.join(profile.gameDir, this.getMainFile().path, asset.getMainFile().path));
    this.datapacks.splice(
      this.datapacks.find(dp => dp.id === asset.id),
      1
    );
  }
}
