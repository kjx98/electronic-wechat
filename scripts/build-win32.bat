set PLATFORM=%1%
set ARCH=%2%
set APP_NAME="Electronic WeChat"

set ignore_list="dist|scripts|\.idea|.*\.md|.*\.yml|node_modules/nodejieba"

electron-packager . "%APP_NAME%" --platform=%PLATFORM% --arch=%ARCH% --asar --icon=assets\icon.png --overwrite --out=.\dist --ignore=%ignore_list%
