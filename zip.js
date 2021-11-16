
const fs = require("fs");
var path = require('path');
const zlib = require("zlib");
const { pipeline } = require('stream');
const { promisify } = require('util');
const pipe = promisify(pipeline);

// 获取目录下的所有js文件
const jsFiles = [];

let zipType = ['.json','.ttf'];
let checkSize = 1024;
let delSrc = false;

const ta = {
    totalSize: 0,
    totalSizeZip: 0,
}


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
            
            if( zipType.indexOf(pathT.ext) >= 0 ) {
                jsFiles.push( `${filePath}/${filename}` );
            }
        }
        if (isDir) {
            getFiles(filedir); //递归，如果是文件夹，就继续遍历该文件夹下面的文件
        }
    });
}

async function gzip(sourcePath) {
    // 处理输入和输出的文件路径
    let gzipPath = `${sourcePath}.gz`;

    // 创建转化流
    let gzip = zlib.createGzip({level:9});

    // 创建可读流
    let rs = fs.createReadStream(sourcePath);

    // 创建可写流
    let ws = fs.createWriteStream(gzipPath);

    // 实现转化
    await pipe(rs, gzip, ws);
    return gzipPath;
}

const args = process.argv.slice(2);
let handlePath = '';
if( args.length > 0 ) {
    if( fs.existsSync( args[0] ) === true ) {
        handlePath = args[0];
    } else {
        console.log(
`node ./zip.js <path> -t=mp3 -d -s=1024
   -t=json,mp3,altas 要处理的文件类型
   -d 删除源文件
   -s=1024

`
        )
        console.error('路径错误', );
    }

    for( let i=1; i<args.length; i++ ) {
        let str = args[i];
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
            }else if( opt === '-d' ) {
                delSrc = true;
            }
            else if( opt === '-s' ) {
                if( sp.length === 2 ) {
                    let size = Number(sp[1]);
                    checkSize = size;
                }
            }
        }
    }

}

if( handlePath.length > 0 ) {
    getFiles(handlePath);

    try{
        (async ()=>{
            for( let it of jsFiles )
            {
                let stats = fs.statSync( it );
                if( stats.size >= checkSize ) {
                    let gzipPath = await gzip( it );
                    let statsZ = fs.statSync( gzipPath );
                    ta.totalSize += stats.size;
                    ta.totalSizeZip += statsZ.size;
                    console.log(`... ${it} size: ${ statsZ.size} / ${stats.size} zip rat: ( ${ (1-statsZ.size/stats.size).toFixed(3)  } )`);

                    if( delSrc === true ) {
                        fs.rmSync( it );
                    }
                }
            }
            console.log('--- zip info');
            console.log(`--- fileCnt: ${jsFiles.length}`);
            console.log(` ${ ta.totalSizeZip} / ${ta.totalSize} zip rat: ( ${ (1-ta.totalSizeZip/ta.totalSize).toFixed(3) } )`);
        })();
    }catch(err) {
        console.log('xxx ', err );
    }
}






