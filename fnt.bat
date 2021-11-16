
@ECHO off
echo %~1
echo %~dp0
cd /d %~dp0
node ./fnt.js %~1

pause