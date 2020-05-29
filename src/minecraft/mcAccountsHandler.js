/* eslint-disable */
import { v4 as uuidv4 } from 'uuid';
import jimp from 'jimp';
import path from 'path';
import fs from 'fs';
import SettingsManager from '../manager/settingsManager';
import HTTPRequest from '../host/httprequest';
import LauncherManager from '../manager/launcherManager';
import FSU from '../util/fsu';
const MCAccountsHandler = {
  getAccountByEmail(email) {
    return SettingsManager.currentSettings.accounts.find(account => account.email === email);
  },
  getClientToken() {
    return SettingsManager.currentSettings.authClientToken;
  },
  generateClientToken() {
    SettingsManager.currentSettings.authClientToken = uuidv4();
    SettingsManager.save();
  },
  getAccounts() {
    return SettingsManager.currentSettings.accounts;
  },
  async addAccountLauncher(email, token, uuid) {
    const skinReq = (await HTTPRequest.get(`https://sessionserver.mojang.com/session/minecraft/profile/${uuid}`)).data;
        
    const finish = headTexture => {
      SettingsManager.currentSettings.accounts.push({
        email,
        name: skinReq.name,
        uuid,
        headTexture,
        accessToken: token
      });

      SettingsManager.save();
    }

    if(skinReq.properties) {
      const skinURL = JSON.parse(atob(skinReq.properties[0].value)).textures.SKIN.url;

      const img = await jimp.read(skinURL);

      img.crop(8, 8, 8, 8).getBase64(jimp.MIME_PNG, (err, res) => {
          finish(res);
      });
    }else{
      finish('');
    }
  },
  registerAccount(email, password) {
    return new Promise(async resolve => {

    if (email && password && !this.getAccountByEmail(email)) {
      if (!this.getClientToken()) this.generateClientToken();      

      HTTPRequest.post('https://authserver.mojang.com/authenticate', {
        agent: {
          name: 'Minecraft',
          version: 1
        },
        username: email,
        password,
        clientToken: this.getClientToken()
      }).then(async respA => {
        const resp = respA.data;

        const name = resp.selectedProfile.name;
        const uuid = resp.selectedProfile.id;
  
        const skinReq = (await HTTPRequest.get(`https://sessionserver.mojang.com/session/minecraft/profile/${uuid}`)).data;
        
        const finish = async (headTexture) => {
          SettingsManager.currentSettings.accounts.push({
            email,
            name,
            uuid,
            headTexture,
            accessToken: resp.accessToken
          });
    
          SettingsManager.save();

          // TODO: Automatically add profiles to the vanilla minecraft launcher if integration is enabled
          // this is hard to do because of different client tokens between mcm and the launcher

          resolve('good');
        }

        if(skinReq.properties) {
          const skinURL = JSON.parse(atob(skinReq.properties[0].value)).textures.SKIN.url;
  
          const img = await jimp.read(skinURL);

          img.crop(8, 8, 8, 8).getBase64(jimp.MIME_PNG, (err, res) => {
              finish(res);
          });
        }else{
          finish('');
        }
  
      }).catch((e, a, b) => {
        resolve(e.response.data.errorMessage);
      });

    } else {
      if(!email) {
        resolve('Please enter an email/username.');
        return;
      } else if (!password) {
        resolve('Please enter a password');
      }else{
        resolve('That account has already been added.');
      }
    }
      });
  },
  async deleteAccount(email) {
    SettingsManager.currentSettings.accounts.splice(this.getAccounts().findIndex(acc => acc.email === email), 1)
    SettingsManager.save();

    if(SettingsManager.currentSettings.launcherIntegration) {
      const launcherProfiles = await FSU.readJSON(LauncherManager.getLauncherProfiles());
      Object.keys(launcherProfiles.authenticationDatabase).forEach(authdName => {
        const authd = launcherProfiles.authenticationDatabase[authdName];
        if(authd.username === email) {
          launcherProfiles.authenticationDatabase[authdName] = undefined;
        }
      });

      fs.writeFile(LauncherManager.getLauncherProfiles(), JSON.stringify(launcherProfiles), () => {

      });
    }
  },
  getActiveAccount() {
    return SettingsManager.currentSettings.activeAccount;
  },
  setActiveAccount(uuid) {
    SettingsManager.currentSettings.activeAccount = uuid;
    SettingsManager.save();
  },
  getAccessTokenFromUUID(uuid) {
    return SettingsManager.currentSettings.accounts.find(acc => acc.uuid === uuid).accessToken;
  },
  getNameFromUUID(uuid) {
    return SettingsManager.currentSettings.accounts.find(acc => acc.uuid === uuid).name;
  },
  getAccountFromUUID(uuid) {
    return SettingsManager.currentSettings.accounts.find(acc => acc.uuid === uuid);
  }
};

export default MCAccountsHandler;
