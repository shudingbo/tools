const images = require("images");
const fs = require("fs");
const {getFiles} = require('./utiliy');
const path = require('path');


let fntPath = '';
let pngPath = '';
let outPath = '';
let outPngName = 'fntMerge.png';
let gOutWidth = 0; // 输出图片大小等高宽

let gShowDebugInfo = false;

/** 
 * @typedef {Object} pngPage
 * @property {number} id
 * @property {string} file  - png名称
 */

/** 
 * @typedef {Object} charItem
 * @property {number} id
 * @property {number} x
 * @property {number} y
 * @property {number} width
 * @property {number} height
 * @property {number} xoffset
 * @property {number} yoffset
 * @property {number} xadvance
 * @property {number} page
 * @property {number} chnl
 */

/** 
 * @typedef {Object} commInfo
 * @property {number} lineHeight
 * @property {number} scaleW
 * @property {number} scaleH
 * @property {number} pages
 */

/** 
 * @typedef {Object} fntItem
 * @property {string} path
 * @property {string} folder
 * @property {string} name
 * @property {string} info
 * @property {commInfo} common
 * @property {Object.<number,pngPage>} page - key is page ID
 * @property {string} charCount
 * @property {Object.<number,charItem>} chars
 * 
 */


/** 
 * @typedef {Object} charMapItem
 * @property {string} fntName
 * @property {charItem} char
 * 
 */

/** 
 * @typedef {Object} imageTileMeta
 * @property {charMapItem} pOriginImage
 * @property {number} x // position in the merged image.
 * @property {number} y
 * 
 */


/** @type {Object.<string,fntItem} - key 是 fnt文件名*/
const gFntFiles = {
};

/** @type {Object.<string,charMapItem} - key 是 <fnt文件名_charID>*/
let gCharMap = {}




const szHelp = `node ./fntmerge.js <path>
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
                    }
                    else if( opt === '-o' ) {
                        if( sp.length === 2 ) {
                            outPngName = sp[1];
                        }
                    }
                    else if( opt === '-s' ) {
                        if( sp.length === 2 ) {
                            gOutWidth = Number( sp[1] );
                        }
                    }else if( opt === '-d' ) {
                        gShowDebugInfo = true;
                    }
                }
            } else {
                if( fs.existsSync( str ) === true ) {
                    fntPath = str;
                    if(outPath.length < 2) {
                        outPath = path.join(fntPath,'out');
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


function parseFnt( fntFile ) {
    let str = fs.readFileSync(fntFile).toString();
    str = str.replace(/\r\n/g,"\n")
    let p = path.parse(fntFile);

    let strs = str.split('\n');
    /** @type {fntItem} */
    let fntItem = { path: fntFile,folder: p.dir,name: p.name, page:{}, chars:{}};
    let charMapT = {};

    let area = 0;
    for( let it of strs ) {
        if( it.startsWith('char ') ){
            let attrs = it.split(' ');

            const charOb = {
                id:  0,
                x: 0,
                y:  0,
                width:  0,
                height:  0,
                xoffset:  0,
                yoffset:  0,
                xadvance:  0,
                page:  0,
                chnl:  0,
            };
            for( let attr of attrs ) {
                attr.trim();
                if(attr === 'char') {
                    continue;
                }
                if(attr.startsWith('id=')) {
                    charOb.id = Number( attr.substring(3) );
                }else if( attr.startsWith('x=') ) {
                    charOb.x = Number( attr.substring(2) );
                }else if( attr.startsWith('y=') ) {
                    charOb.y = Number( attr.substring(2) );
                }else if( attr.startsWith('width=') ) {
                    charOb.width = Number( attr.substring(6) );
                }else if( attr.startsWith('height=') ) {
                    charOb.height = Number( attr.substring(7) );
                }else if( attr.startsWith('xoffset=') ) {
                    charOb.xoffset = Number( attr.substring(8) );
                }
                else if( attr.startsWith('yoffset=') ) {
                    charOb.yoffset = Number( attr.substring(8) );
                }
                else if( attr.startsWith('xadvance=') ) {
                    charOb.xadvance = Number( attr.substring(9) );
                }
                else if( attr.startsWith('page=') ) {
                    charOb.page = Number( attr.substring(5) );
                }
                else if( attr.startsWith('chnl=') ) {
                    charOb.chnl = Number( attr.substring(5) );
                }
            }

            if( charOb.width > 0 && charOb.height > 0 ){
                area += charOb.width * charOb.height;
            }
            
            fntItem.chars[charOb.id] = charOb;

            charMapT[ `${p.name}_${charOb.id}`] = {
                fntName: p.name,
                char: charOb
            }

        } else if( it.startsWith('info ') ){
            fntItem.info = it;
        } else if( it.startsWith('common ') ){
            //fntItem.common = it;
            it.trim();
            let attrs = it.split(' ');
            
            /** @type {commInfo} */
            let commInfo = {
                lineHeight: 20,
                scaleW: 70,
                scaleH: 64,
                pages: 1
            }

            let id = 0;
            let file ='';
            for( let attr of attrs ) {
                if(attr.startsWith('lineHeight=')) {
                    commInfo.lineHeight = Number( attr.substring(11) );
                }else if( attr.startsWith('scaleW=') ) {
                    commInfo.scaleW = Number( attr.substring(7) );
                }else if( attr.startsWith('scaleH=') ) {
                    commInfo.scaleH = Number( attr.substring(7) );
                }else if( attr.startsWith('pages=') ) {
                    commInfo.pages = Number( attr.substring(6) );
                }
            }

            fntItem.common = commInfo;
        } else if( it.startsWith('chars ') ){
            fntItem.charCount = it;
        } else if( it.startsWith('page ') ){
            it.trim();
            let attrs = it.split(' ');
            let id = 0;
            let file ='';
            for( let attr of attrs ) {
                if(attr.startsWith('id=')) {
                    id = Number( attr.substring(3) );
                }else if( attr.startsWith('file=') ) {
                    file = attr.substring(6).split("\"")[0];
                }
            }

            let pagePath = path.join(p.dir, file);
            if( fs.existsSync( pagePath ) === false ) {
                console.log(` ${p.name}.fnt 's png ${file} not exists`);
                return;
            }

            fntItem.page[id] = {id, file};
        }
    }

    gFntFiles[p.name] = fntItem;

    for( let it in charMapT ) {
        gCharMap[it] = charMapT[it];
    }

    return area;
}

class FZoneNode
{
    constructor(x,y,w,h)
    {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.pRightChild = null;
        this.pLeftChild = null;
        this.bOccupied = false;
    }
};


class Merge{
    constructor(InWidth, InHeight, InHMargin, InVMargin) {
        this.width = InWidth;
        this.height = InHeight;
        this.hMargin = InHMargin;
        this.vMargin = InVMargin;
        this.pMergedImage = null;

        /** @type {imageTileMeta[]} */
        this.ImageTileMetas = [];
    }

    purge() {
        this.ImageTileMetas = [];
        this.pMergedImage = null;
    }

    /**
     * 
     * @param {FZoneNode} InParent 
     * @param {number} InW 
     * @param {number} InH 
     * @return {FZoneNode}
     */
    findZoneRecursively(InParent, InW, InH)
    {
        if (!InParent || InW > InParent.w || InH > InParent.h)
        {
            return null;
        }

        if (!InParent.bOccupied)
        {
            return InParent;
        }

        // first find the right zone.
        let pZone = this.findZoneRecursively(InParent.pRightChild, InW, InH);
        if (!pZone)
        {
            pZone = this.findZoneRecursively(InParent.pLeftChild, InW, InH);
        }

        return pZone;
    }

    /**
     * 
     * @param {FZoneNode} InZone 
     * @param {charMapItem} InImage 
     * @param {number} InHMargin 
     * @param {number} InVMargin 
     * @param {imageTileMeta} OutMeta 
     * @returns 
     */
    insertImage(InZone, InImage, InHMargin, InVMargin, OutMeta)
    {
        if (!InZone || !InImage)
        {
            return false;
        }

        const kTileWidth = InImage.char.width + InHMargin + InHMargin;
        const kTileHeight = InImage.char.height + InVMargin + InVMargin;

        /** @type {FZoneNode} */
        let pDstZone = this.findZoneRecursively(InZone, kTileWidth, kTileHeight);
        if (!pDstZone)
        {
            return false;
        }
        
        //assert(pDstZone.bOccupied == false);
        pDstZone.bOccupied = true;
        // split it into 2 zones
        pDstZone.pRightChild = new FZoneNode(pDstZone.x + kTileWidth, pDstZone.y, pDstZone.w - kTileWidth, kTileHeight);
        pDstZone.pLeftChild = new FZoneNode(pDstZone.x, pDstZone.y + kTileHeight, pDstZone.w, pDstZone.h - kTileHeight);

        // add the meta data
        OutMeta.pOriginImage = InImage;
        OutMeta.x = pDstZone.x + InHMargin;
        OutMeta.y = pDstZone.y + InVMargin;
        return true;
    }

    /**
     * 
     * @param {charMapItem[]} items
     * 
     * @return {boolean}
     */
    doMerge(items) {
        this.purge();

        if (items.length <= 0)
        {
            return false;
        }
    
        // allocate the zones
        let Zone = new FZoneNode(0, 0, this.width, this.height );
        for (let k = 0; k < items.length; k++)
        {
            let pImage = items[k];
            /** @type {imageTileMeta} */
            let TileMeta = { pOriginImage: null, x:0, y:0 };
            if (this.insertImage(Zone, pImage, this.hMargin, this.vMargin, TileMeta))
            {
                this.ImageTileMetas.push(TileMeta);
            }
        } // end for k
    
        // make a merged image & fill in.
        this.pMergedImage = images(this.width, this.height);
        if (!this.pMergedImage)
        {
            return false;
        }
    
        for (let k = 0; k < this.ImageTileMetas.length; k++)
        {
            const TileMeta = this.ImageTileMetas[k];
            const orgiImgInfo = TileMeta.pOriginImage.char;
            let fntInfo = gFntFiles[ TileMeta.pOriginImage.fntName];

            let orgiImgPath = path.join(fntInfo.folder, fntInfo.page[orgiImgInfo.page].file );
            let orgiImg = getOrgiImg(orgiImgPath);

            const {x,y,width,height} = orgiImgInfo;

            let imgT = images(orgiImg, x,y,width,height);
            this.pMergedImage.draw(imgT, TileMeta.x, TileMeta.y);
            orgiImgInfo.x = TileMeta.x;
            orgiImgInfo.y = TileMeta.y;
        } // end for k
    
        return true;
    }
}

let gOrgiImg = {};

function getOrgiImg(path) {
    let img = gOrgiImg[path];
    if( img === undefined ) {
        img = images(path);
        gOrgiImg[path] = img;
    }

    return img;
}



function packImages( InWidth, InHeight, InHMargin, InVMargin, InBigImageFilename ) {
    let merge = new Merge( InWidth, InHeight, InHMargin, InVMargin );

    let imgs = Object.values( gCharMap);

    if (merge.doMerge(imgs))
	{
		const pMergedImage = merge.pMergedImage;
		const TileMetas = merge.ImageTileMetas;

		if (pMergedImage)
		{
            let outFile = path.join( outPath, outPngName);
            pMergedImage.save( outFile, "png" );

            if( gShowDebugInfo === true){
				console.log("Image Atlas Information:");
				for (let k = 0; k < TileMetas.length; k++)
				{
					const Meta = TileMetas[k];
					console.log(`IMAGE: ${Meta.pOriginImage.fntName}`);
					console.log(`     { x:${Meta.x}, y:${Meta.y}, w:${Meta.pOriginImage.char.width}, h:${Meta.pOriginImage.char.height} }`);
				} // end for k
            }

            // 输出文件
            writeFntFile();

            console.log(`--- success. outPath: ${outPath}`);
		} // end if
	}
}

/**  */
function writeFntFile( ){
    for(let key in gFntFiles){
        let it = gFntFiles[key];
        let strs = [];
        strs.push( it.info );

        let commInfo = it.common;
        strs.push(`common lineHeight=${it.common.lineHeight} scaleW=${gOutWidth} scaleH=${gOutWidth} pages=1`);


        for( let pg in it.page ) {
            let pgIt = it.page[pg];
            strs.push( `page id=${pgIt.id} file=\"${outPngName}\"` )
        }
        
        strs.push(it.charCount);
        for( let k in it.chars ) {
            let c = it.chars[k];
            strs.push( `char id=${c.id} x=${c.x} y=${c.y} width=${c.width} height=${c.height} xoffset=${c.xoffset} yoffset=${c.yoffset} xadvance=${c.xadvance} page=0 chnl=${c.chnl}` );
        }

        let newPath = path.join( outPath, `${it.name}.fnt`);
        fs.writeFileSync(newPath, strs.join('\r\n'));

    }
}

function calcWidthHei( area ){
    for(let i = 6;i<12;i++) {
        let w = 2**i;
        let a = w * w;
        if( a >= area) {
            return w;
        }
    }

    return 0;
}

console.log( fntPath, pngPath );

parseArgv();

let fntFiles = getFiles( fntPath, ['.fnt'], false  );
if( fntFiles.length > 0 ) {
    let area = 0;
    for(let it of fntFiles) {
        let area0 = parseFnt( it );
        if(Number.isInteger( area0)) {
            area += area0;
        }
    }

    let imgW = calcWidthHei(area);
    if( gOutWidth === 0 ) {
        gOutWidth = imgW;
    } else {
        if( gOutWidth < imgW ) {
            console.log(`--- Img Size must more then ${imgW}`);
            return;
        }
    }


    packImages(gOutWidth,gOutWidth,1,1,"test.png");
}
