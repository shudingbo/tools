const fs = require('fs');



const dbName = 'cedb';  // database Name
const mdfFile = 'c2db.mdf';   // database data file
const logFile = 'c2db_log.ldf'; // database log file

const startDate = '2022-03-25';   // table split file Start Date
const endDate = '2025-02-24';  // table split file End Date

const dbPath = '/data/db';     // dbfile save path
const splitPath = '/data/slot';  // split file save path

let outStr = '';

function dateFormat(fmt, date) {
    let ret;
    const opt = {
        "Y+": date.getFullYear().toString(),        // 年
        "m+": (date.getMonth() + 1).toString(),     // 月
        "d+": date.getDate().toString(),            // 日
        "H+": date.getHours().toString(),           // 时
        "M+": date.getMinutes().toString(),         // 分
        "S+": date.getSeconds().toString()          // 秒
        // 有其他格式化字符需求可以继续添加，必须转化成字符串
    };
    for (let k in opt) {
        ret = new RegExp("(" + k + ")").exec(fmt);
        if (ret) {
            fmt = fmt.replace(ret[1], (ret[1].length == 1) ? (opt[k]) : (opt[k].padStart(ret[1].length, "0")))
        };
    };
    return fmt;
}

function mkNdfName( szSDate, szEDate ) {
    let ndfs = '';

    let sDate = new Date(szSDate);
    const eDate = new Date(szEDate);

    while( sDate.getTime() <= eDate.getTime() ) {
        szDate = dateFormat("YYYY_mm_dd", sDate);
        //console.log(szDate);
        ndfs += `(FILENAME = '${splitPath}/FSlot${szDate}.ndf'),\r\n`;
        sDate = new Date(sDate.setDate(sDate.getDate() + 1));
    }

    return ndfs;
}

outStr = `CREATE DATABASE ${dbName}   
    ON (FILENAME = '${dbPath}/${mdfFile}'),   
    (FILENAME = '${dbPath}/${logFile}'),
`

outStr += mkNdfName(startDate, endDate);
outStr += "FOR ATTACH;\r\n"

//console.log(outStr);

fs.writeFileSync( './attachDB.sql', outStr);