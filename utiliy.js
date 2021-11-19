'use strict'

const fs = require("fs");
var path = require('path');


/** 遍历获取指定路径下的指定类型的文件
 * 
 * @param {string} folder 
 * @param {string[]} fileType ['.jpg','.png']
 * @param {boolean} re - 是否递归查询 default: true
 * @return {string[]}
 */
 function getFiles( folder, fileType, re=true) {
    let out = [];
    _getFiles(folder,fileType, out,re);
    return out;
}




/** 遍历获取指定路径下的指定类型的文件
 * 
 * @param {string} folder 
 * @param {string[]} fileType  - ['.png','.fnt']
 * @param {string[]} outFileList
 * @param {boolean} re - 是否递归查询
 */
function _getFiles( folder, fileType, outFileList, re) {
    let files = fs.readdirSync( folder );
    files.forEach(function(filename) {
        //获取当前文件的绝对路径
        var filedir = path.join(folder, filename);
        //根据文件路径获取文件信息，返回一个fs.Stats对象
        let stats = fs.statSync( filedir );
        var isFile = stats.isFile(); //是文件
        var isDir = stats.isDirectory(); //是文件夹
        if (isFile) {
            let pathT = path.parse( filename );
            
            if( fileType.indexOf(pathT.ext) >= 0 ) {
                outFileList.push( `${folder}/${filename}` );
            }
        }
        if (isDir && re === true) {
            _getFiles(filedir,fileType, outFileList, re); //递归，如果是文件夹，就继续遍历该文件夹下面的文件
        }
    });
}




module.exports = {
    getFiles
}
