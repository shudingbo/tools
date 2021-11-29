@ECHO off
echo %~1
echo %~dp0
cd /d %~dp0
node ./gz.js %~1 -t=json,ttf,altas,mp3 -s=1024

pause