<img src="assets/icon.png" alt="logo" height="120" align="right" />

# Electronic WeChat

*A better WeChat on Linux (maybe also macOS). Built with [Electron](https://github.com/electron/electron).*

Resurgence, 重新启用, 更新使用electron 4.0, 增加微信群 机器人Hook 监听, 增加xmpp转发.

origin README.md moved to README-geeeeeeeeek.md

---

**Important:** If you want to build the app by yourself rather than download the release directly, please consider to use the source code from [the stable branch](https://github.com/kjx98/electronic-wechat/tree/stable), the master branch is under development and we cannot guarantee it to be stable.

[![Build Status](https://travis-ci.org/kjx98/electronic-wechat.svg?branch=master)](https://travis-ci.org/kjx98/electronic-wechat)


## Features ([CHANGELOG](CHANGELOG.md))

- **Modern UI and all features from Web WeChat.**
- **Block message recall.**
- **Stickers showing support.** [[?]](https://github.com/geeeeeeeeek/electronic-wechat/issues/2)
- Share subscribed passages on Weibo, Qzone, Facebook, Twitter, Evernote, and email.
- Mention users in a group chat.
- Drag and drop to send photos.
- Behaves like a native app, based on dozens of optimization.
- Removes URL link redirects and takes you directly to blocked websites (e.g. taobao.com).

## How To Use

To clone and run this repository you'll need [Git](https://git-scm.com) and [Node.js](https://nodejs.org/en/download/) (which comes with [npm](https://www.npmjs.com/)) installed on your computer. From your command line:

``` bash
# Clone this repository
git clone https://github.com/kjx98/electronic-wechat.git
# Go into the repository
cd electronic-wechat
# Install dependencies and run the app
npm install && npm start
```

To pack into an app, simply type one of these:

``` shell
npm run build:osx
npm run build:linux
```

**New:** Install with your familiar package manager. Check out [images maintained by the community](https://github.com/geeeeeeeeek/electronic-wechat/wiki/System-Support-Matrix#%E7%A4%BE%E5%8C%BA%E8%B4%A1%E7%8C%AE%E7%9A%84%E5%AE%89%E8%A3%85%E5%8C%85)!

**New:** Or, with homebrew!

```bash
brew cask install electronic-wechat
```

#### [Download Released App](https://github.com/kjx98/electronic-wechat/releases)

#### License [MIT](LICENSE.md)

*Electronic WeChat* is released by this open source project. While Web WeChat is a major component  in the app, it should be noted that this is a community release and not an official WeChat release.
