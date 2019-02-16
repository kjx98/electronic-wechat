#! /usr/bin/sh

dirn=`dirname $0`
tmpf="/tmp/wechat.desktop"
sed -e "s?WECHATDIR?$dirn?" < $dirn/wechat.desktop > $tmpf
desq="$HOME/.local/share/applications/wechat.desktop"

echo "update $desq"
diff -q $tmpf $desq || cp $tmpf $desq
