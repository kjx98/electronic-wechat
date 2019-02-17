#!/bin/bash

if [ ! -d dist ]; then
	npm run build:linux
	npm run build:osx
fi

cd dist

echo 'Start compressing for mac.'
tar zcf 'mac-osx.tar.gz' -C mac 'electron-wechat.app'

echo 'Start compressing for Linux x64.'
if [ ! -d electron-wechat-linux-x64 ]; then
  if [ ! -d linux-unpacked ]; then
	(cd ..;npm run build:linux)
  fi
  rm -rf linux-unpacked/swiftshader
  rm -f linux-unpacked/libEGL*.so
  rm -f linux-unpacked/libGLE*.so
  cp ../assets/icon.png linux-unpacked
  cp ../scripts/start.sh linux-unpacked
  cp ../scripts/wechat.desktop linux-unpacked
  mv linux-unpacked electron-wechat-linux-x64
fi
tar Jcf 'linux-x64.tar.xz' 'electron-wechat-linux-x64'
echo 'Compressing for Linux x64 succeed.'

cd ..
