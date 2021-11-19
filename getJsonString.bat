@ECHO off
echo %~1
echo %~dp0
cd /d %~dp0
node ./getJsonString.js %~1 -a -g -o="C:\Users\sdb\Desktop\out"

pause