@ECHO off
echo %~1
echo %~dp0
cd /d %~dp0

node ./webpconv.js %~1
pause