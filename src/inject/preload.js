'use strict';

const { ipcRenderer, webFrame } = require('electron');
const MenuHandler = require('../handlers/menu');
const ShareMenu = require('./share_menu');
const MentionMenu = require('./mention_menu');
const BadgeCount = require('./badge_count');
const Common = require('../common');

const AppConfig = require('../configuration');
var saveLastUser = null;

class Injector {
  init() {
    if (Common.DEBUG_MODE) {
      Injector.lock(window, 'console', window.console);
    }
    this.initInjectBundle();
    this.initAngularInjection();
    this.initIPC();
    webFrame.setVisualZoomLevelLimits(1, 1);

    new MenuHandler().create();
  }

  initAngularInjection() {
    const self = this;
    const angular = window.angular = {};
    let angularBootstrapReal;
    Object.defineProperty(angular, 'bootstrap', {
      get: () => angularBootstrapReal ? function (element, moduleNames) {
        const moduleName = 'webwxApp';
        if (moduleNames.indexOf(moduleName) < 0) return;
        let constants = null;
        angular.injector(['ng', 'Services']).invoke(['confFactory', (confFactory) => (constants = confFactory)]);
        angular.module(moduleName).config(['$httpProvider', ($httpProvider) => {
          $httpProvider.defaults.transformResponse.push((value) => {
            return self.transformResponse(value, constants);
          });
        },
        ]).run(['$rootScope', ($rootScope) => {
          ipcRenderer.send('wx-rendered', MMCgi.isLogin);

          $rootScope.$on('newLoginPage', () => {
            ipcRenderer.send('user-logged', '');
          });
          $rootScope.shareMenu = ShareMenu.inject;
          $rootScope.mentionMenu = MentionMenu.inject;
        }]);
        return angularBootstrapReal.apply(angular, arguments);
      } : angularBootstrapReal,
      set: (real) => (angularBootstrapReal = real),
    });
  }

  initInjectBundle() {
    const initModules = () => {
      if (!window.$) {
        return setTimeout(initModules, 3000);
      }

      MentionMenu.init();
      BadgeCount.init();
    };

    window.onload = () => {
      initModules();
      window.addEventListener('online', () => {
        ipcRenderer.send('reload', true);
      });
    };
  }

  transformResponse(value, constants) {
    if (!value) return value;

    switch (typeof value) {
      case 'object':
        /* Inject emoji stickers and prevent recalling. */
        return this.checkEmojiContent(value, constants);
      case 'string':
        /* Inject share sites to menu. */
        return this.checkTemplateContent(value);
    }
    return value;
  }

  static lock(object, key, value) {
    return Object.defineProperty(object, key, {
      get: () => value,
      set: () => {},
    });
  }

  checkEmojiContent(value, constants) {
    if (!(value.AddMsgList instanceof Array)) return value;
    value.AddMsgList.forEach((msg) => {
      switch (msg.MsgType) {
        case constants.MSGTYPE_TEXT:
          if (msg.FromUserName.slice(0,2) == '@@') {
			      var content = msg.Content.split(':<br/>')[1];
            if (content.indexOf(Common.ROBOT) >= 0) {
              if (saveLastUser != msg.FromUserName) {
                saveLastUser = msg.FromUserName;
                console.log('set saveLastUser/default群', saveLastUser);
              }
              ipcRenderer.send('wx-msg', content);
            }
          }
          break;
        case constants.MSGTYPE_EMOTICON:
          Injector.lock(msg, 'MMDigest', '[Emoticon]');
          Injector.lock(msg, 'MsgType', constants.MSGTYPE_EMOTICON);
          if (msg.ImgHeight >= Common.EMOJI_MAXIUM_SIZE) {
            Injector.lock(msg, 'MMImgStyle', { height: `${Common.EMOJI_MAXIUM_SIZE}px`, width: 'initial' });
          } else if (msg.ImgWidth >= Common.EMOJI_MAXIUM_SIZE) {
            Injector.lock(msg, 'MMImgStyle', { width: `${Common.EMOJI_MAXIUM_SIZE}px`, height: 'initial' });
          }
          break;
        case constants.MSGTYPE_RECALLED:
          if (AppConfig.readSettings('prevent-recall') === 'on') {
            Injector.lock(msg, 'MsgType', constants.MSGTYPE_SYS);
            Injector.lock(msg, 'MMActualContent', Common.MESSAGE_PREVENT_RECALL);
            Injector.lock(msg, 'MMDigest', Common.MESSAGE_PREVENT_RECALL);
          }
          break;
      }
    });
    return value;
  }

  checkTemplateContent(value) {
    const optionMenuReg = /optionMenu\(\);/;
    const messageBoxKeydownReg = /editAreaKeydown\(\$event\)/;
    if (optionMenuReg.test(value)) {
      value = value.replace(optionMenuReg, 'optionMenu();shareMenu();');
    } else if (messageBoxKeydownReg.test(value)) {
      value = value.replace(messageBoxKeydownReg, 'editAreaKeydown($event);mentionMenu($event);');
    }
    return value;
  }

  initIPC() {
    // clear currentUser to receive reddot of new messages from the current chat user
    ipcRenderer.on('hide-wechat-window', () => {
      this.lastUser = angular.element('#chatArea').scope().currentUser;
      angular.element('.chat_list').scope().itemClick("");
	    console.log("saved lastUser:", this.lastUser);
    });
    // recover to the last chat user
    ipcRenderer.on('show-wechat-window', () => {
      if (this.lastUser) {
        angular.element('.chat_list').scope().itemClick(this.lastUser);
      }
    });
    ipcRenderer.on('send-msg', (event, msg) => {
      if (saveLastUser && this.lastUser !== saveLastUser) {
        this.lastUser = saveLastUser;
      }
      if (this.lastUser) {
        var ele=angular.element('.chat_list');
        //var ele=angular.element('div#J_NavChatScrollBody.chat_list');
        //console.log(".chat_list scope:", ele);
        ele.scope().itemClick(this.lastUser);
      }
      window.focus();
      //console.log("try send-msg, lastUser:", this.lastUser, msg);
      const editArea = angular.element('div.box_ft.ng-scope');
      editArea.click();
      //webFrame.insertText(msg);
		var lines = msg.split(/\n/);
		for (var i=0;i<lines.length;i++) {
			var sText = lines[i];
			i++;
			if (i < lines.length) {
				sText += '\r\n' + lines[i] + '\r\n';
			}
      		webFrame.insertText(sText);
		}
      const $btn = angular.element('a.btn.btn_send');
      if ($btn) {
        $btn.scope().sendTextMessage();
      }
      //webFrame.document.sendTextMessage();
    })
  }
}

new Injector().init();
