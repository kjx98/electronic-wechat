/**
 * Created by Zhongyi on 3/25/16.
 */

'use strict';

const { dialog, shell, app, nativeImage } = require('electron');
const AppConfig = require('../configuration');
const https = require('https');
const path = require('path');
const get = require('get');
const fs = require('fs-extra'),
      tar = require('tar');

const lan = AppConfig.readSettings('language');
let Common;
if (lan === 'zh-CN') {
  Common = require('../common_cn');
} else {
  Common = require('../common');
}


class UpdateHandler {
  setAppDir(appDir) {
	  UpdateHandler.appDir = appDir;
  }

  checkForUpdate(version, silent) {
    UpdateHandler.CHECKED = true;
    var appDir = UpdateHandler.appDir;
    const promise = new Promise((res, rej) => {
      if (Common.ELECTRON === app.getName()) {
        rej(Common.UPDATE_ERROR_ELECTRON);
      }
      const req = https.get({
        host: Common.GITHUB_API_HOST,
        headers: { 'user-agent': Common.USER_AGENT },
        path: Common.GITHUB_API_RELEASE_LATEST_PATH,
      }, (response) => {
        let body = '';
        response.on('data', (d) => {
          body += d;
        });
        response.on('end', () => {
          this._parseUpdateData(body, version, res, rej);
        });
      });
      req.on('error', (err) => {
        rej(Common.UPDATE_ERROR_NETWORK);
      });
      req.end();
    }).then((fetched) => {
      this.showDialog(fetched.name, fetched.description, 'Update', (response) => {
        if (!response) return;
        if (appDir) {
          // to be download fecthed.url
          //console.log('to be downloaded url:', fetched.url);
          //console.log('appDir:', appDir);
		      this.dnldUpdate(fetched, appDir);
		    } else shell.openExternal(fetched.url);
      });
    }).catch((message) => {
      if (silent) return;
      if (!message) {
        message = Common.UPDATE_ERROR_UNKNOWN;
      }
      this.showDialog(Common.UPDATE_NA_TITLE, message, 'OK');
    });
  }

  showDialog(message, detail, positiveButton, callback) {
    const iconImage = nativeImage.createFromPath(path.join(__dirname, '../assets/icon.png'));

    dialog.showMessageBox({
      type: 'info',
      buttons: ['Cancel', positiveButton],
      defaultId: 1,
      cancelId: 0,
      title: message,
      message,
      detail,
      icon: iconImage,
    }, callback);
  }

  _parseUpdateData(body, version, res, rej) {
    const data = JSON.parse(body);
    if (!data || !data.tag_name) rej(Common.UPDATE_ERROR_EMPTY_RESPONSE);
    const fetched = {
      version: data.tag_name,
      is_prerelease: data.prerelease,
      name: data.name,
      url: data.html_url,
      description: data.body,
    };

    const versionRegex = /^v[0-9]+\.[0-9]+\.*[0-9]*$/;
    if (versionRegex.test(fetched.version) && fetched.version > version && !fetched.is_prerelease) {
      data.assets.forEach((val,index) => {
        if (val.name == "app-src.tgz" && process.platform == "linux") {
          fetched.url = val.browser_download_url;
        }
      });
      res(fetched);
    } else {
      rej(Common.UPDATE_ERROR_LATEST(version));
    }
  }

  dnldUpdate (fetch, appDir) {
    let appD = appDir+'/resources';
    new Promise((resolve, reject) => {
      var dl = get({uri: fetch.url, max_redirs: 20});
      dl.asBuffer((err, data) => {
        if (err) throw err;
        let dir = fs.mkdtempSync('/tmp/upgrade_wx');
        //console.log('tempDir:', dir);
        console.log('download length:', data.length);
        let stream = new require('stream').Readable();
        stream.push(data);
        stream.push(null);
        stream.pipe(tar.extract({
              sync: true,
              gzip: true,
              cwd: dir
        })).on('close', () => {
              // 解压完毕，复制更新文件
              console.log('updates tar extracted, to:', appD)
              fs.copySync(dir, appD);
              fs.removeSync(dir);
              // 返回 true 表示需要重启
              resolve(true);
        });
      });
    }).then(result => {
      if (result) {
        app.relaunch({ args: process.argv.slice(1) });  // 重启
        app.exit(0);
      }
    }).catch(e => {
      // e 错误
      console.log('dnld update error:', e);
    });
  }

}

UpdateHandler.CHECKED = false;
UpdateHandler.appDir = null;

module.exports = UpdateHandler;
