@ECHO off
echo %~1

cd /d %~dp0
node cdnprehot.js domain="https://*.com.cn/" path=%~1 mode=0 out=upa -v

cd /D %~dp0
node alicdn.js -f="C:\*\prehot-upa.txt" -i="accKeyId" -k="accKeySec" -n=10

pause