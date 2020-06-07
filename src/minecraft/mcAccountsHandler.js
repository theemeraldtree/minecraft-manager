import { v4 as uuidv4 } from 'uuid';
import jimp from 'jimp';
import fs from 'fs';
import SettingsManager from '../manager/settingsManager';
import HTTPRequest from '../host/httprequest';
import LauncherManager from '../manager/launcherManager';
import FSU from '../util/fsu';
import logInit from '../util/logger';
import ToastManager from '../manager/toastManager';

const logger = logInit('MCAccountsHandler');

const MCAccountsHandler = {
  getAccountByEmail(email) {
    return SettingsManager.currentSettings.accounts.find(account => account.email === email);
  },
  getClientToken() {
    return SettingsManager.currentSettings.authClientToken;
  },
  generateClientToken() {
    logger.info('Generating client token...');
    SettingsManager.currentSettings.authClientToken = uuidv4();
    SettingsManager.save();
  },
  getAccounts() {
    return SettingsManager.currentSettings.accounts;
  },
  addAccountLauncher(email, token, uuid) {
    return new Promise(async resolve => {
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

        resolve();
      };

      if (skinReq.properties) {
        const skinURL = JSON.parse(atob(skinReq.properties[0].value)).textures.SKIN.url;

        const img = await jimp.read(skinURL);

        img.crop(8, 8, 8, 8).getBase64(jimp.MIME_PNG, (err, res) => {
            finish(res);
        });
      } else {
        finish('');
      }
    });
  },
  registerAccount(email, password) {
    return new Promise(async resolve => {
      logger.info(`Registering account ${email}`);
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

        // extra information (such as whether the account is paid, legacy, migrated, suspended, or other info)
        // is not presesnt for some reason; https://wiki.vg/Authentication

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
        };

        if (skinReq.properties) {
          const skinURL = JSON.parse(atob(skinReq.properties[0].value)).textures.SKIN.url;

          const img = await jimp.read(skinURL);

          img.crop(8, 8, 8, 8).getBase64(jimp.MIME_PNG, (err, res) => {
              finish(res);
          });
        } else {
          finish('');
        }
      }).catch((e) => {
        resolve(e.response.data.errorMessage);
      });
    } else if (!email) {
        resolve('Please enter an email/username.');
      } else if (!password) {
        resolve('Please enter a password');
      } else {
        resolve('That account has already been added.');
      }
      });
  },
  async deleteAccount(email) {
    logger.info(`Deleting account ${email}...`);


    logger.info(`Sending invalidate request for ${email}...`);
    HTTPRequest.post('https://authserver.mojang.com/invalidate', {
      accessToken: this.getAccountByEmail(email).accessToken,
      clientToken: this.getClientToken()
    }).then(() => {
      logger.info(`Successfully invalidated token for ${email}`);
    }).catch(e => {
      logger.info(`Unable to invalidate token for ${email}: ${e.response.data}`);
    });

    SettingsManager.currentSettings.accounts.splice(this.getAccounts().findIndex(acc => acc.email === email), 1);
    SettingsManager.save();

    if (SettingsManager.currentSettings.launcherIntegration) {
      const launcherProfiles = await FSU.readJSON(LauncherManager.getLauncherProfiles());
      Object.keys(launcherProfiles.authenticationDatabase).forEach(authdName => {
        const authd = launcherProfiles.authenticationDatabase[authdName];
        if (authd.username === email) {
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
  },
  refreshAccount(account) {
    logger.info(`Refreshing token for ${account.email}`);
    HTTPRequest.post('https://authserver.mojang.com/refresh', {
      accessToken: account.accessToken,
      clientToken: this.getClientToken()
    }).then(resp => {
      if (resp.data.accessToken) {
        logger.info(`Received a new valid token for ${account.email}; storing it...`);
        SettingsManager.currentSettings.accounts.find(acc => acc.email === account.email).accessToken = resp.data.accessToken;
        SettingsManager.save();
      }
    }).catch(() => {
      logger.info(`Unable to find a new valid token for ${account.email}`);
      this.deleteAccount(account.email);
      ToastManager.createToast('Authentication Error', `Minecraft Manager was unable to verify if the account "${account.name}"; try logging in again.`);
    });
  },
  verifyUsable() {
    this.getAccounts().forEach(async account => {
      HTTPRequest.post('https://authserver.mojang.com/validate', {
        accessToken: account.accessToken,
        clientToken: this.getClientToken()
      }).then(() => {
      }).catch(e => {
        if (e.response.status === 403) {
          // 403 forbidden; token is not valid
          this.refreshAccount(account);
          logger.info(`Account ${account.email} has an invalid access token; requesting a new one...`);
        } else {
          // some other error; let the user know
          logger.error(`Error verifying access token for ${account.email}: ${JSON.stringify(e.response.data)}`);
          ToastManager.createToast('Something went wrong with Authentication', JSON.stringify(e.response.data));
        }
      });
    });
  }
};

export default MCAccountsHandler;
