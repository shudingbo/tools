
const fs = require("fs");
var path = require('path');
const { pipeline } = require('stream');
const { promisify } = require('util');
const pipe = promisify(pipeline);

// 获取目录下的所有js文件
const jsFiles = [];

let cfgPath = '';
let outPath = '';

let parseType = ['.json'];
let gSzKeyName = []; // 只要统计的键名

let recordTa = false;
const ta = {
    totalSize: 0,
    totalSizeZip: 0,
}

/** 字符映射 */
let charMap = {};

const szHelp=`
node ./getJsonString.js <path> -a -o="C:\\Users\\sdb\\Desktop\\out" -k="name,szName"
`


/**
 * 文件遍历方法
 * @param filePath 需要遍历的文件路径
 */
 function getFiles(filePath) {

    let files = fs.readdirSync( filePath );
    files.forEach(function(filename) {
        //获取当前文件的绝对路径
        var filedir = path.join(filePath, filename);
        //根据文件路径获取文件信息，返回一个fs.Stats对象
        let stats = fs.statSync( filedir );
        var isFile = stats.isFile(); //是文件
        var isDir = stats.isDirectory(); //是文件夹
        if (isFile) {
            let pathT = path.parse( filename );
            
            if( parseType.indexOf(pathT.ext) >= 0 ) {
                jsFiles.push( `${filePath}/${filename}` );
            }
        }
        if (isDir) {
            getFiles(filedir); //递归，如果是文件夹，就继续遍历该文件夹下面的文件
        }
    });
}


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
                            zipType = t;
                        }
                    }else if( opt === '-o' ) {
                        if( sp.length === 2 ) {
                             outPath = sp[1];
                             if( fs.existsSync(outPath) === false ) {
                                fs.mkdirSync(outPath);
                            }
                        }
                    }else if( opt === '-a' ) {
                        recordTa = true;
                    }else if( opt === '-k' ) {
                        if( sp.length === 2 ) {
                            let types = sp[1].split(',');
                            let t = [];
                            for( let it of types ) {
                                t.push(`${it}`);
                            }
                            gSzKeyName = t;
                        }
                    }
                }
            } else {
                if( fs.existsSync( str ) === true ) {
                    cfgPath = str;
                    if(outPath.length < 2) {
                        outPath = path.join(cfgPath,'out');
                        if( fs.existsSync(outPath) === false ) {
                            fs.mkdirSync(outPath);
                        }
                    }
                } else {
                    console.log(szHelp)
                    console.error('路径错误', );
                }
            }
        }
    }
}

function pickString( ob, strArr ) {
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
            }

        } else if( type === 'object' ) {
            pickString( it, strArr );
        }
    }
}



function parseChar() {
    for( let it of jsFiles ) {
        console.log( it );
        let data = fs.readFileSync( it );
        let ob = JSON.parse( data );
        /** @type {string[]} */
        let str = [];
        pickString(ob,str);

        for(let it of str ) {
            for( let i=0;i< it.length; i++ ) {
                let charCode = it.charCodeAt(i);
                let charInfo = charMap[charCode];
                if( charInfo === undefined ) {
                    let ob = {
                        c: it[i],
                        n: 1 
                    };

                    charMap[charCode] = ob;
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
    for( let key in charMap ) {
        let it = charMap[key];
        tmp.push( it );
        charOut.push( it.c );
        displayCnt += it.n;
    }

    tmp.sort((a,b)=> b.n - a.n);

    let out = path.join( outPath, 'outString.txt' );
    fs.writeFileSync(out,charOut.join(''));

    let ta = `totalChar: ${tmp.length} totalDisCnt: ${displayCnt}`;
    console.log(ta);

    let szArr = [];
    szArr.push( ta );

    let a = 0;
    for( let it of tmp ){
        
        a++;
        if( a < 10 ) {
            console.log( a, it.c, it.n );
        }

        szArr.push( JSON.stringify(it) );
    }

    if( recordTa === true ) {
        let str = szArr.join('\r\n');

        let out1 = path.join( outPath, 'outStringTa.txt' );
        fs.writeFileSync(out1,str);

    }

}

parseArgv();

getFiles( cfgPath );

parseChar();
output();

