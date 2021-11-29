const fs = require('fs');
const pathC = require('path');
const URL = require('url');

let g_domain = 'http://dowfcdnnt45uo1.focuszy.cn/nor/downa';
let g_workPath = 'E:\\workspace\\issue\\cy\\hot\\23\\Bz2File';
let g_outP = "downa";
let g_mode = 1;   // 0 ,生成 预热地址;1,生成 curl下载文件
let g_pathAsVer = false;
let g_outFileFd = null;

let argv = process.argv.slice(2);
for( let it of argv ){
	let a = it.split('=');
	if(a.length=== 2){
		switch(a[0]){
			case 'domain':
				g_domain = a[1];
			break;
			case 'path':
				g_workPath = a[1];
			break;
			case 'mode':{
				let mode = parseInt( a[1]);
				if( mode === 0 || mode === 1 ){
					g_mode = mode;
				}
			}break;
			case 'out':{
				g_outP = a[1];
			}break;
		}
	} else {
		switch(a[0]){
			case '-v' : {
				g_pathAsVer = true;
			}break;
		}
	}
}

if( g_pathAsVer === true ) {
	let p = pathC.parse( g_workPath );
	g_domain += `/${p.name}`;

	let url = new URL.URL(g_domain);
	var reg = new RegExp( '//' , "g" )
	url.pathname = url.pathname.replace( reg , '/' );

	g_domain = `${url.origin}${url.pathname}`;
}

console.log( g_domain, g_workPath,g_mode );

var arguments = process.argv.splice(2);
if( arguments.length === 2 ){
    console.log(' error config param');
    return;
}


function mkStr( ele,path, mode=1){
	if( mode === 1 ){
		let outPath = "url =" +g_domain + "/" + path + " \r\n";
		outPath += "--create-dirs\r\n"
		outPath += `output=${g_outP}/` + path;
		return outPath;		
	}else{
		outPath = g_domain + "/" + path;
		return outPath;
	}
}


function readDirSync(path, lv){
	var pa = fs.readdirSync(path);
	pa.forEach(function(ele,index){
		let info = fs.statSync(path+"/"+ele)	
		if(info.isDirectory()){
			//console.log("dir: "+ele);
			let lvT = lv+1;
			readDirSync(path+"/"+ele,lvT);
		}else{
			let pathT = path + "/" + ele;
			
			//console.log( pathT );
			let outPath = pathC.relative(g_workPath, pathT);
			let p = pathC.parse( pathT );
			if( p.ext !== '.gz' ) {
				//outPath = g_domain + "/" + outPath;
				outPath = mkStr( ele, outPath, g_mode );
				outPath = outPath.replace(/\\/g, '/' );
				
				//console.log( outPath);
				fs.writeSync( g_outFileFd,outPath+"\n" );				
			}
		}	
	})
	
	if( lv === 0 ){
		fs.closeSync( g_outFileFd );
	}
}

g_outFileFd = fs.openSync(`prehot-${g_outP}.txt`,'w');
if( g_outFileFd !== 0 ){
	readDirSync(g_workPath, 0);
}




