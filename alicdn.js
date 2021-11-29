const Cdn20180510 = require('@alicloud/cdn-2018-05-10');
const fs = require("fs");
const OpenApi = require('@alicloud/openapi-client');
const URL = require('url');


function timeout (ms) {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, ms, 'done');
  });
}

let g_accessKeyId = "";
let g_accessKeySec = "";

let g_cfg = '';
let g_cnt = 10;
let g_mode = 'preHot';


let argv = process.argv.slice(2);
for( let it of argv ){
	let a = it.split('=');
	if(a.length=== 2){
		switch(a[0]){
			case '-f':
				g_cfg = a[1];
			break;
			case '-i':
				g_accessKeyId = a[1];
			break;
			case '-k':{
				g_accessKeySec = a[1];
			}break;
			case '-n':{
				g_cnt = Number(a[1]);
			}break;
      case '-r':{
				g_mode = "refresh";
			}break;
		}
	} else {

	}
}


console.log( g_cfg, g_accessKeyId, g_accessKeySec,g_cnt );



class Client {
  
  constructor(accKeyId, accKeySec, cfg, cnt) {
    let config = new OpenApi.Config({
      // 您的AccessKey ID
      accessKeyId: accKeyId,
      // 您的AccessKey Secret
      accessKeySecret: accKeySec,
    });
    // 访问的域名
    config.endpoint = "https://cdn.aliyuncs.com";

    this.cli = new Cdn20180510(config);
    this.cfg = cfg;
    this.cnt = cnt;

    this.preTask = {}; // 参与预热的任务
    this.urlList = [];
    this.chkTimer = null;
  }


  async startPrehot() {
    if( fs.existsSync( this.cfg) === false ) {
      console.log(`${this.cfg} not exists!`);
      process.exit(1);
    }

    let lsT = fs.readFileSync( this.cfg ).toString();
    var reg = new RegExp( '\r\n' , "g" )
	  lsT = lsT.replace( reg , '\n' );

    let ls = lsT.split("\n");
    let cnt = 0;
    let fileLs = [];
    for( let it of ls ){
      let urlFile = it.trim();
      if( urlFile.length > 5 ) {
        fileLs.push(it);
        cnt++;
      }

      if( cnt >= this.cnt ) {
        await this._runTask( fileLs );

        cnt = 0;
        fileLs = [];
      }
    }

    if( fileLs.length > 0 ) {
      await this._runTask( fileLs );
    }
  }


  async _runTask( fileLs ) {
    let taskInfo = null;
    if( g_mode === "refresh" ) {
      taskInfo = await this.refresh( fileLs);
    } else {
      taskInfo = await this.prehot( fileLs);
    }
    this.preTask[taskInfo.taskId] = {taskInfo};

    if( this.chkTimer === null ) {
      this.chkTimer = setInterval(()=> {
        this.checkStatus();
      }, 1000);          
    }

    await timeout(5000);
  }


  checkStatus() {
    (async() => {
      let overTaskID = [];
      for( let taskId in this.preTask ) {
        let sta = await this.getTaskStatus( taskId );
        if( sta?.Tasks?.CDNTask === undefined ) {
          overTaskID.push( taskId );
        } else {
          let allOver = true;
          for( let t of sta.Tasks.CDNTask ) {
            if(t.Status !== 'Complete' || t.Process !== '100%' ) {
              allOver = false;
              let url = new URL.URL(t.ObjectPath);
              console.log(`--- file ${url.pathname} ${t.Process}` );
            }
          }

          if( allOver === true ) {
            overTaskID.push( taskId );
          }
        }
      }

      for( let it of overTaskID ) {
        delete this.preTask[it];
      }

      let keys = Object.keys( this.preTask );
      if( keys.length <= 0 ) {
        clearInterval( this.chkTimer );
        this.chkTimer = null;
      }
    })();
  }

  async getTaskStatus( taskId ){
    return await this.cli.describeRefreshTasks({TaskId:taskId});
  }

  async prehot( fileLs) {
    let objPath = fileLs.join('\n');
    let refreshObjectCachesRequest = {
      ObjectPath: objPath,
      area: "domestic",
    };
    // 复制代码运行请自行打印 API 的返回值
    let ret = await this.cli.pushObjectCache(refreshObjectCachesRequest);
    return {taskId: ret.PushTaskId};
  }


  async refresh( fileLs ) {
    let objPath = fileLs.join('\n');
    let refreshObjectCachesRequest = {
      ObjectType: "File",
      ObjectPath: objPath,
    };
    // 复制代码运行请自行打印 API 的返回值
    let ret = await this.cli.refreshObjectCaches(refreshObjectCachesRequest);
    return {taskId: ret.RefreshTaskId};
  }
}

let cdnCli = new Client( g_accessKeyId, g_accessKeySec, g_cfg, g_cnt );

(async() => {
  await cdnCli.startPrehot();
})();




