'use strict';

const path = require('path');
const {app, ipcMain, webContents, session} = require('electron');

const { client, xml, jid } = require('@xmpp/client');

const UpdateHandler = require('./handlers/update');
const Common = require('./common');
const AppConfig = require('./configuration');

const SplashWindow = require('./windows/controllers/splash');
const WeChatWindow = require('./windows/controllers/wechat');
const SettingsWindow = require('./windows/controllers/settings')
const AppTray = require('./windows/controllers/app_tray');
var jidSent = '';
var appDir=null;

class ElectronicWeChat {
  constructor() {
    this.wechatWindow = null;
    this.splashWindow = null;
    this.settingsWindow = null;
    this.tray = null;
    this.xmpp = null;
  }

  init() {
    if(this.checkInstance()) {
      this.initApp();
      this.initIPC();
      if (AppConfig.readSettings('jid')) {
    		this.initXmpp();
      }
    } else {
      app.quit();
    }
  }
  checkInstance() {
    if (AppConfig.readSettings('multi-instance') === 'on') return true;
    const shouldQuit = !app.requestSingleInstanceLock()
    if (shouldQuit) {
      app.quit()
    } else {
      app.on('second-instance', (event,commandLine, workingDirectory) => {
        if(this.splashWindow && this.splashWindow.isShown){
          this.splashWindow.show();
        }
        if(this.wechatWindow){
          this.wechatWindow.show();
        }
        if(this.settingsWindow && this.settingsWindow.isShown){
          this.settingsWindow.show();
        }
      });
      app.on('ready', () => {
      })
    }
    return !shouldQuit;
  }
  initApp() {
    app.on('ready', ()=> {
      this.createSplashWindow();
      this.createWeChatWindow();
      this.createTray();

      if (!AppConfig.readSettings('language')) {
        AppConfig.saveSettings('language', 'en');
        AppConfig.saveSettings('prevent-recall', 'on');
        AppConfig.saveSettings('icon', 'black');
        AppConfig.saveSettings('multi-instance','on');
      }
      AppConfig.saveSettings('appVersion', app.getVersion());
    });

    app.on('activate', () => {
      if (this.wechatWindow == null) {
        this.createWeChatWindow();
      } else {
        this.wechatWindow.show();
      }
    });
  }

  initXmpp() {
    var myJid = AppConfig.readSettings('jid');
    var jidPass = AppConfig.readSettings('jidPass');
    jidSent = AppConfig.readSettings('jidSent');
    var addr = jid(myJid);
    //  service: addr.getDomain(),
    // addr.getDomain() for hot-chilli.net
    var xmpp = client({
      service: 'xmpp://'+addr.getDomain()+':5222',
      resource: 'electron-wechat',
      username: addr.getLocal(),
      password: jidPass,
    })
	  this.xmpp = xmpp;

    xmpp.on('error', err => {
      console.log('❌', err.toString())
    })
    xmpp.on('offline', () => {
      console.log('⏹', 'offline')
    })

    xmpp.on('stanza', async stanza => {
      if (stanza.is('message')) {
        const message = stanza.clone();
        if (message.attrs.type == 'chat') {
          var text = message.getChildText('body');
          //console.log('got xmpp msg attrs:', message.attrs);
          //console.log('msg body:', text);
          // send to wechat
          if (text) {
            console.log('will send-msg', text);
            if (this.wxSender) this.wxSender.send('send-msg', text);
			/*
			var lines = text.split(/\n/);
			for (var i=0;i<lines.length;i++) {
				var sText = lines[i];
				i++;
				if (i < lines.length) {
					sText += '\r\n' + lines[i];
				}
            	console.log('will send-msg', sText);
             	if (this.wxSender) this.wxSender.send('send-msg', sText);
			}
			*/
          }
        }
      }
    })

    xmpp.on('online', async address => {
      console.log('▶', 'online as', address.toString())
      // Makes itself available
      await xmpp.send(xml('presence'))

      // Sends a chat message to itself
      const message = xml(
        'message',
        {type: 'chat', to: address},
        xml('body', 'hello world')
      )
      await xmpp.send(message);
    })

    /*
    // Debug
    xmpp.on('status', status => {
      console.debug('🛈', 'status', status)
    })
    xmpp.on('input', input => {
      console.debug('⮈', input)
    })
    xmpp.on('output', output => {
      console.debug('⮊', output)
    })
    */
    xmpp.start().catch(console.error)
  };

  initIPC() {
    ipcMain.on('badge-changed', (event, num) => {
      if (this.xmpp && this.xmpp.status === 'online' && !this.xmppok) {
        this.xmppok = true;
        var webC = webContents.getFocusedWebContents();
        if (webC) webC.send('send-msg', "xmpp ready!!!");
	      //this.wechatWindow.webContents.send('send-msg', 'xmpp ready!!!');
        console.log("notify wx xmpp ready!!!");
      }
      if (process.platform == "darwin") {
        app.dock.setBadge(num);
        if (num) {
          this.tray.setTitle(` ${num}`);
        } else {
          this.tray.setTitle('');
        }
      } else if (process.platform === "linux" || process.platform === "win32") {
          app.setBadgeCount(num * 1);
          this.tray.setUnreadStat((num * 1 > 0)? 1 : 0);
      }
    });

    ipcMain.on('user-logged', () => {
      this.wechatWindow.resizeWindow(true, this.splashWindow)
      //var ele=this.wechatWindow.angular.element('.chat_list');
      //console.log(".chat_list scope:", ele);
      /*
      // Query all cookies.
      session.defaultSession.cookies.get({}, (error, cookies) => {
        console.log("got cookies:");
        console.log(error, cookies);
      })
      */
    });

    ipcMain.on('wx-rendered', (event, isLogged) => {
      this.wechatWindow.resizeWindow(isLogged, this.splashWindow)
    });

    ipcMain.on('wx-msg', (event, msg) => {
      var content = msg.replace(/@JacK/, '');
      console.log('wx-msg:', content);
      if (!this.xmpp) return;
      this.wxSender = event.sender;
      // Sends a chat message to itself
      const message = xml(
        'message',
        {type: 'chat', to: jidSent},
        xml('body', {}, content)
      )
      this.xmpp.send(message);
      //event.sender.send('send-msg', 'everything ok!!');
    });

    ipcMain.on('log', (event, message) => {
      console.log(message);
    });

    ipcMain.on('reload', (event, repetitive) => {
      if (repetitive) {
        this.wechatWindow.loginState.current = this.wechatWindow.loginState.NULL;
        this.wechatWindow.connectWeChat();
      } else {
        this.wechatWindow.loadURL(Common.WEB_WECHAT);
      }
    });

    ipcMain.on('update', (event, message) => {
      let updateHandler = new UpdateHandler();
      updateHandler.checkForUpdate(`v${app.getVersion()}`, false);
    });

    ipcMain.on('open-settings-window', (event, message) => {
      if (this.settingsWindow) {
        this.settingsWindow.show();
      } else {
        this.createSettingsWindow();
        this.settingsWindow.show();
      }
    });

    ipcMain.on('close-settings-window', (event, messgae) => {
      this.settingsWindow.close();
      this.settingsWindow = null;
    })
  };

  createTray() {
    this.tray = new AppTray(this.splashWindow, this.wechatWindow);
  }

  createSplashWindow() {
    this.splashWindow = new SplashWindow();
    this.splashWindow.show();
  }

  createWeChatWindow() {
    this.wechatWindow = new WeChatWindow();
  }

  createSettingsWindow() {
    this.settingsWindow = new SettingsWindow();
  }

}

// if run using nodejs/electron, shift first arg
if (process.argv[0].substr(-6) != "wechat") {
	process.argv.shift()
}

if (process.platform == 'linux') {
  appDir = path.dirname(process.argv[0]);
  new UpdateHandler().setAppDir(appDir);
  //console.log('appDir:', appDir);
}

/*
// print process.argv
process.argv.forEach((val, index) => {
  console.log(`${index}: ${val}`);
});
*/
new ElectronicWeChat().init();

