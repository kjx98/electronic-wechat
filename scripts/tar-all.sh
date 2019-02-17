#!/bin/bash

cd dist

echo 'Start compressing for Mac OS X.'
tar zcf 'mac-osx.tar.gz' 'Electronic WeChat-darwin-x64'
echo 'Compressing for Mac OS X succeed.'

echo 'Start compressing for Linux x64.'
tar Jcf 'linux-x64.tar.xz' 'electron-wechat-linux-x64'
echo 'Compressing for Linux x64 succeed.'

cd ..
