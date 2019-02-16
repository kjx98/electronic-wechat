#!/bin/bash

cd dist

echo 'Start compressing for Linux x64.'
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
tar Jcf 'linux-x64.tar.xz' 'electron-wechat-linux-x64'
echo 'Compressing for Linux x64 succeed.'

cd ..
