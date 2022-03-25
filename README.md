# tools
一些工具

## zip.js
 批量 gz 格式 压缩 .fnt,.json,.mp3
```
node ./zip.js <path> -t=mp3 -d -s=1024
   -t=json,mp3,altas 要处理的文件类型
   -d 删除源文件
   -s=1024
```

## fnt.js
提取fnt图片单独图片
```
node ./fnt.js <path>
```


## fntmerge.js
合并指定路径下多个fnt资源。输出一张2^n 正方形合图
```
node ./fntmerge.js <path>
```

* -o 输出png文件名   ```-o=test.png```
* -s 输出合图宽度,没有指定则自己运算 ```-s=512```
* -d 是否显示调试信息   ```-d```

## getJsonString.js
获取所有json文件里的字并且统计输出
```
node ./getJsonString.js <path> -a -o="C:\Users\sdb\Desktop\out"
```

## webpConv.js

转换文件名前缀为wp_的png文件为 webp格式。

```bash
node ./webpconv.js <要转换的路径>
```

* webpconv.bat 拖动文件夹到此批处理上，将对文件夹下的所有png进行格式转换

## mkAttachDB.js
   生成含有表分区的 sqlserver 附加数据库命令。

