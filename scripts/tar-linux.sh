#!/bin/bash

if [ ! -d dist ]; then
	npm run build:linux
	if [ "$1" != "linux" ]; then
		npm run build:osx
	fi
fi

cd dist

if [ "$1" != "linux" ]; then
  echo 'Start compressing for mac.'
  tar zcf 'mac-osx.tar.gz' -C mac 'electron-wechat.app'
  echo 'Compress for macos x64 succeed.'
fi

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
echo 'Compress for Linux x64 succeed.'

echo 'Start compressing src for linux.'
mkdir app.asar.unpacked
ln -s ../../src app.asar.unpacked
#tar zcf electron-wechat-linux-x64/resources/app-src.tgz app.asar.unpacked/src/*
tar zcf app-src.tgz app.asar.unpacked/src/*
rm -rf app.asar.unpacked
echo 'Compress src for Linux succeed.'

cd ..
