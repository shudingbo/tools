@ECHO off
echo %~1
echo %~dp0
cd /d %~dp0
node ./fntmerge.js %~1 -d

pause