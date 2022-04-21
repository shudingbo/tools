const fs = require('fs');
const path = require('path');
const filterScanDir = require("filter-scan-dir");
const exec = require('child_process').execFile;//get child_process module

const cwebpPath = path.join(__dirname, "cwebp.exe");
const { Worker } = require("worker_threads");
const os = require("os");

async function readChunk(file, opt) {
  const fh = await fs.promises.open(file);
  let buff = new Buffer.alloc(opt.length);
  await fh.read(buff, 0, opt.length, 0);
  fh.close();
  return buff;
}


function isWebp(buffer) {
  if (!buffer || buffer.length < 12) {
    return false;
  }

  return buffer[8] === 87
    && buffer[9] === 69
    && buffer[10] === 66
    && buffer[11] === 80;
}

function cwebp(input_image, output_image, option, logging = '-quiet') {
  const query = `${option} "${input_image}" -o "${output_image}" "${logging}"`; //command to convert image 
  return new Promise((resolve, reject) => {
    exec(`"${cwebpPath}"`, query.split(/\s+/), { shell: true }, (error, stdout, stderr) => {
      if (error) {
        console.warn(error);
      }
      resolve(stdout ? stdout : stderr);
    });
  });
};


let handleDir = './';
let arguments = process.argv.splice(2);
if (arguments.length === 0) {
  let parse = path.parse(process.argv[0]);
  if (parse.base !== 'node.exe') {
    handleDir = parse.dir;
  }
} else {
  handleDir = arguments[0];
  if (fs.existsSync(handleDir) === false) {
    console.warn(`xxx Folder not exist: ${handleDir}`);
    process.exit(1);
  }
}

handleDir = path.normalize(handleDir);

let pngRegexp = '^wp_[\\S\\w]*.png$';
let reg = new RegExp(pngRegexp);

imgLs = filterScanDir.sync({
  dir: handleDir,
  includeRoot: true,
  includeDir: false,
  filter: (file, path, extras) => {
    return reg.test(file);
  }
});

const WorkerState = {
  IDLE: 0, //空闲
  BUSY: 1, //忙碌
}

function timeout(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

let length = imgLs.length;
let totalSrcSize = 0;
let totalDstSize = 0;
const tb = [];

let cores = os.cpus().length;
let workerSize = cores;
let workers = [];
let cnt = 0;
for (let i = 0; i < workerSize; i++) {
  const thread = new Worker(`${__dirname}/cwebpThread.js`, {
    trackUnmanagedFds: true,
  });
  let worker = {
    state: WorkerState.IDLE,
    instance: thread,
  };
  workers.push(worker);
  thread.on("message", ({ file, outPath }) => {
    cnt++;
    worker.state = WorkerState.IDLE;
    let srcSize = fs.statSync(file).size;
    let dstSize = fs.statSync(outPath).size;
    totalSrcSize += srcSize;
    totalDstSize += dstSize
    console.log(`convert ${cnt}/${length}.  ${file} ${srcSize} -> ${dstSize}, ratio: ${(dstSize / srcSize).toFixed(3)}`);

    tb.push({
      srcSize, dstSize,
      ratio: Number((dstSize / srcSize).toFixed(3))
    }
    );

    if (cnt == length) {
      console.log('=== start rename webP file');
      let idx = 0;
      for (let file of imgLs) {
        let res = path.parse(file);
        let webPPath = path.join(res.dir, `${res.name}.webp`);
        if (fs.existsSync(webPPath) === true) {
          console.log(`rename ${idx}/${length}.  ${file}`);
          fs.unlinkSync(file);
          fs.renameSync(webPPath, file);
        }
        idx++;
      }
      this.endTime = Date.now();

      if (totalSrcSize > 0) {
        console.table(tb);
        console.log(`size change ${totalSrcSize} -> ${totalDstSize}, ratio: ${(totalDstSize / totalSrcSize).toFixed(3)}`);
      } else {
        console.log('No File compress');
      }
      console.log("===总共耗时： ", (this.endTime - this.startTime) / 1000, "秒");
      for (let i = 0; i < workerSize; i++) {
        workers[i].instance.terminate();
      }
    }
  })
}


(async () => {
  try {
    const encodeOpt = "-near_lossless 50 -m 6 -mt";
    //const encodeOpt = "-lossless 50 -m 6 -mt";

    console.log(`=== start Gen webP file: ${encodeOpt}`);
    this.startTime = Date.now();
    this.handleCnt = 0;
    for (let file of imgLs) {
      let res = path.parse(file);
      let outPath = path.join(res.dir, `${res.name}.webp`);
      const buffer = await readChunk(file, { length: 12 });
      if (isWebp(buffer) === true) {
        continue;
      }
      this.handleCnt++;
      let worker = null;
      while (true) {
        let findWorker = false;
        for (let i = 0; i < workerSize; i++) {
          if (workers[i].state == WorkerState.IDLE) {
            findWorker = true;
            worker = workers[i];
            break;
          }
        }
        if (!findWorker) {
          await timeout(50);
        }
        else {
          break;
        }
      }
      worker.state = WorkerState.BUSY;
      worker.instance.postMessage({ file, outPath, encodeOpt });
    }

    if (this.handleCnt == 0) {
      for (let i = 0; i < workerSize; i++) {
        workers[i].instance.terminate();
      }
    }
  } catch (err) {
    console.log('err:', err);
  }
})();







