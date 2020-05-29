/* eslint-disable */
import { v4 as uuidv4 } from 'uuid';
import jimp from 'jimp';
import path from 'path';
import SettingsManager from '../manager/settingsManager';
import HTTPRequest from '../host/httprequest';
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

        if(!resp.selectedProfile) {
          resolve('No Minecraft License available on this Mojang account.');
          return;
        } else if (!resp.selectedProfile.paid) {
          resolve('Minecraft has not been purchased.')
          return;
        } else if (resp.selectedProfile.suspended) {
          resolve('Minecraft account is suspended.');
          return;
        }
        
        const name = resp.selectedProfile.name;
        const uuid = resp.selectedProfile.id;
  
        const skinReq = (await HTTPRequest.get(`https://sessionserver.mojang.com/session/minecraft/profile/${uuid}`)).data;
        
        const finish = (headTexture) => {
          SettingsManager.currentSettings.accounts.push({
            email,
            name,
            uuid,
            headTexture,
            accessToken: resp.accessToken
          });
    
          SettingsManager.save();

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
  deleteAccount(email) {
    SettingsManager.currentSettings.accounts.splice(this.getAccounts().findIndex(acc => acc.email === email), 1)
    SettingsManager.save();
  },
  getActiveAccount() {
    return SettingsManager.currentSettings.activeAccount;
  },
  setActiveAccount(uuid) {
    SettingsManager.currentSettings.activeAccount = uuid;
    SettingsManager.save();
  }
};

export default MCAccountsHandler;
