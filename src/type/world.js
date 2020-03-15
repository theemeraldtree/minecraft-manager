import GenericAsset from './genericAsset';

function World(omaf) {
  GenericAsset.call(this, omaf);
}

World.prototype = Object.create(GenericAsset.prototype);

export default World;
