const { threadId, parentPort } = require("worker_threads");
const path = require('path');
const cwebpPath = path.join(__dirname, "cwebp.exe");
const exec = require('child_process').execFile;//get child_process module

function cwebp(input_image,output_image,option,logging='-quiet') {
  const query = `${option} "${input_image}" -o "${output_image}" "${logging}"`; //command to convert image 
  console.log("${cwebpPath}", query)
  return new Promise((resolve, reject) => {
    exec(`"${cwebpPath}"`,query.split(/\s+/),{ shell: true }, (error, stdout, stderr) => {
     
    if (error) {
     console.warn(error);
    }
    resolve(stdout? stdout : stderr);
   });
  });
};

parentPort.on("message", async({file, outPath, encodeOpt}) => {
  console.log("====线程收到消息",threadId);
  await cwebp(file, outPath, encodeOpt);
  console.log("====线程回复消息");
  parentPort.postMessage({file, outPath});
})