const images = require("images");
const fs = require("fs");
var path = require('path');

let isUnPack = false;

let fntPath = '';
let pngPath = '';
let outPath = '';


const szHelp = `node ./fnt.js <path>
`;

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
            } else {
                if( fs.existsSync( str ) === true ) {
                    let p = path.parse(str);
                    if( p.ext === '.fnt' ) {
                        fntPath = str;
                        pngPath = path.join(p.dir, `${p.name}.png`);
                        outPath = path.join(p.dir,'out');
                        if( fs.existsSync(outPath) === false ) {
                            fs.mkdirSync(outPath);
                        }
                        if( fs.existsSync(pngPath) === false ) {
                            console.log('--- cant find png file');
                            process.exit(1);
                            return;
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


function parseFnt( fntFile ) {
    let str = fs.readFileSync(fntFile).toString();
    let strs = str.split('\n');
    let orgiImg = images(pngPath);

    for( let it of strs ) {
        if( it.startsWith('char ') ){
            let attrs = it.split(' ');
            let id = 0;
            let x =0;
            let y = 0;
            let w = 0;
            let h = 0;
            for( let attr of attrs ) {
                if(attr.startsWith('id=')) {
                    id = Number( attr.substring(3) );
                }else if( attr.startsWith('x=') ) {
                    x = Number( attr.substring(2) );
                }else if( attr.startsWith('y=') ) {
                    y = Number( attr.substring(2) );
                }else if( attr.startsWith('width=') ) {
                    w = Number( attr.substring(6) );
                }else if( attr.startsWith('height=') ) {
                    h = Number( attr.substring(7) );
                }
            }
            let out = path.join(outPath, `${id}.png`);
            let imgT = images(orgiImg,x,y,w,h);
            imgT.save( out);
        }
    }

}

parseArgv();
if( fntPath.length > 3 ) { // unPack Fnt
    parseFnt( fntPath );
}





console.log( fntPath, pngPath );


