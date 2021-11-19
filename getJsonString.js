
const fs = require("fs");
const path = require('path');
const {getFiles} = require('./utiliy');


// 获取目录下的所有js文件
let jsFiles = [];

let gCfgPath = '';
let gOutPath = '';

let gParseType = ['.json'];
let gSzKeyName = []; // 只要统计的键名

let gHasData = false;
let gRecordTa = false;

let gRecPos = false;
let gPos = []; // 字符串出现位置


/** 字符映射 */
let gCharMap = {};

const szHelp=`
node ./getJsonString.js <path> -a -o="C:\\Users\\sdb\\Desktop\\out" -k="name,szName" -p
`

function parseArgv() {
    const args = process.argv.slice(2);
    if( args.length > 0 ) {
        for( let i=0; i<args.length; i++ ) {
            let str = args[i];
            if(str.startsWith('-')){
                let sp = str.split('=');
                if( sp.length > 0 ) {
                    let opt = sp[0];
                    if( opt === '-t' ) {
                        if( sp.length === 2 ) {
                            let types = sp[1].split(',');
                            let t = [];
                            for( let it of types ) {
                                t.push(`.${it}`);
                            }
                            gParseType = t;
                        }
                    }else if( opt === '-o' ) {
                        if( sp.length === 2 ) {
                            gOutPath = sp[1];
                        }
                    }else if( opt === '-a' ) {
                        gRecordTa = true;
                    }else if( opt === '-k' ) {
                        if( sp.length === 2 ) {
                            let types = sp[1].split(',');
                            let t = [];
                            for( let it of types ) {
                                t.push(`${it}`);
                            }
                            gSzKeyName = t;
                        }
                    }else if( opt === '-g' ) {
                        gRecPos = true;
                    }
                }
            } else {
                if( fs.existsSync( str ) === true ) {
                    gCfgPath = str;
                } else {
                    console.log(szHelp)
                    console.error('路径错误', );
                }
            }
        }

        if(gOutPath.length < 2) {
            gOutPath = path.join(gCfgPath,'out');
        }
    }
}

function pickFromJson( ob, strArr, file ) {
    if( gRecPos === true && file !== null ) {
        gPos.push( file );
    }

    for( let key in ob ){
        let it = ob[key];
        let type = typeof it;
        if(type === 'string') {
            if(gSzKeyName.length > 0) {
                if( gSzKeyName.indexOf( key) === -1 ) {
                    continue;
                }
            }

            try{
                let t = JSON.parse( it );
            }catch(e){
                strArr.push( it );
                if( gRecPos === true ) {
                    gPos.push( `    ${it}` );
                }
            }

        } else if( type === 'object' ) {
            pickFromJson( it, strArr, null );
        }
    }
}

/**
 * 
 * @param {string} str 
 * @param {string[]} strArr 
 */
function pickVarString(str, strArr) {
    let szTmp = [];
    
    let idx=0;
    let len = str.length;
    let sIdx = -1;
    let sT = '';
    
    for( idx=0; idx<len; idx++ ) {

        if( sIdx === -1 ) {
            let c = str[idx];
            if( (c === '$') 
                && ((idx+1) <len) && (str[idx+1] === '{')
                && ( (((idx-1) >=0) && (str[idx-1] !== '\\')) || ((idx-1)<0))
            ) {
                idx++;
                sIdx = idx;
                if(sT.trim().length > 0) {
                    szTmp.push(sT.trim());
                }
                sT = '';
            } else {
                sT += c;
            }
        } else {
            let c = str[idx];
            if( c === '}' && sIdx >=0 ) {
                let preIdx = idx - 1;
                if( (preIdx >0 ) && str[preIdx] !== '\\' ) { // 不是转义，结束了
                    if(sT.trim().length > 0) {
                        szTmp.push( sT.trim() );
                    }
                    
                    ///
                    sIdx = -1;
                    sT = '';
                }else{
                    sT += c;
                }
            } else {
                sT += c;
            }
        }
    }

    for( let it of szTmp ) {
        strArr.push(it);
    }

}


/**
 * 
 * @param {string} str 
 * @param {string[]} strArr 
 */
function pickFromJs( str,strArr, file ) {
    let idx = 0;

    if( gRecPos === true ) {
        gPos.push( file );
    }

    let match = ['\'','"','`'];
    let totalLen = str.length;

    let startChar = null; // 是否开始匹配到数据
    let startIdx = -1;
    let strT = '';

    for( idx=0; idx<totalLen; idx++ ) {
        if( startChar === null){
            let c = str[idx];
            if( match.indexOf(c) !== -1) {
                startChar = c;
                startIdx = idx;
                strT = '';
            }
        } else {
            let c = str[idx];
            if( c === startChar ) {
                let preIdx = idx - 1;
                if( (preIdx >0 ) && str[preIdx] !== '\\' ) { // 不是转义，结束了
                    if( gRecPos === true ) {
                        gPos.push( `    ${strT}` );
                    }

                    if(startChar === '`'){
                        pickVarString(strT, strArr);
                    } else {
                        strArr.push( strT );
                    }

                    ///
                    startChar = null;
                    startIdx = -1;
                }else{
                    strT += c;
                }
            } else {
                strT += c;
            }
        }
    }
}



function parseChar() {
    for( let it of jsFiles ) {
        console.log( it );
        /** @type {string[]} */
        let str = [];

        let data = fs.readFileSync( it );
        let p = path.parse( it );
        if( p.ext === '.json' ) {
            let ob = JSON.parse( data );
            pickFromJson(ob,str, it);
        } else if( p.ext === '.js' ) {
            pickFromJs( data.toString(), str, it );
        }
        
        if( str.length > 0 ) {
            gHasData = true;
        }

        for(let it of str ) {
            for( let i=0;i< it.length; i++ ) {

                let charCode = it.charCodeAt(i);
                if( charCode < 32 ){
                    continue;
                }

                let charInfo = gCharMap[charCode];
                if( charInfo === undefined ) {
                    let ob = {
                        c: it[i],
                        n: 1,
                        code: charCode
                    };

                    gCharMap[charCode] = ob;
                    // let t = JSON.stringify(ob);
                    // let spT = t.split(';');
                    // if(spT[0].length > 10) {
                    //     console.log( ob );
                    // }

                } else {
                    charInfo.n++;
                }
            }
        }
    }
}


function output(){
    let displayCnt = 0;
    let tmp = [];
    let charOut = [];
    for( let key in gCharMap ) {
        let it = gCharMap[key];
        tmp.push( it );
        displayCnt += it.n;
    }

    tmp.sort((a,b)=> a.code - b.code);
    for( let it of tmp ) {
        charOut.push( it.c );
    }

    let out = path.join( gOutPath, 'outString.txt' );
    fs.writeFileSync(out,charOut.join(''));

    let ta = `totalChar: ${tmp.length} totalDisCnt: ${displayCnt}`;
    console.log(ta);

    let szArr = [];
    szArr.push( ta );

    // 按数量排序
    tmp.sort((a,b)=> b.n - a.n);
    let a = 0;
    for( let it of tmp ){
        a++;
        if( a < 10 ) {
            console.log( a, it.c, it.n );
        }

        szArr.push( `${a} ${it.c} ${it.n}` );
    }

    if( gRecordTa === true ) {
        let str = szArr.join('\r\n');
        let out1 = path.join( gOutPath, 'outStringTa.txt' );
        fs.writeFileSync(out1,str);
    }

    if( gRecPos === true ) {
        let str = gPos.join('\r\n');
        let out1 = path.join( gOutPath, 'outStringPos.txt' );
        fs.writeFileSync(out1,str);
    }

}

parseArgv();

jsFiles = getFiles(gCfgPath, gParseType,true);

parseChar();


if( gHasData === true ) {
    if( fs.existsSync(gOutPath) === false ) {
        fs.mkdirSync(gOutPath);
    }
    output();
}

