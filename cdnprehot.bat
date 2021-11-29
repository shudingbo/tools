@ECHO off
echo %~1


node cdnprehot.js domain="https://*.com.cn/" path=%~1 mode=0 out=upa -v

node alicdn.js -f="C:\*\prehot-upa.txt" -i="accKeyId" -k="accKeySec" -n=10
