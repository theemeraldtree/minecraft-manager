import ToastManager from '../../../manager/toastManager';

export default function modVersionCheck(profile, newProfile, asset) {
  if (!newProfile.hasFramework()) {
    ToastManager.createToast(
      'Missing Modloader',
      `${newProfile.name} does not have a modloader installed. Please install one first.`
    );
    return false;
  }
  if (
    (profile.frameworks.forge && !newProfile.frameworks.forge) ||
    (profile.frameworks.fabric && !newProfile.frameworks.fabric)
  ) {
    ToastManager.createToast(
      'Incompatible Modloaders',
      `The modloader for ${asset.name} and for ${newProfile.name} are different. They are not compatible with each other`
    );

    return false;
  }

  if (profile.version.minecraft.version !== newProfile.version.minecraft.version) {
    ToastManager.createToast(
      'Unmatching Versions',
      `${newProfile.name}'s Minecraft Version is not compatible with the version you have of ${asset.name}. Please install an up-to-date version in ${newProfile.name}`
    );
    return false;
  }

  return true;
}
