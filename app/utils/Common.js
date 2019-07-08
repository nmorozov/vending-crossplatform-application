const ch = require('child_process');
const fs = require('fs');
const http = require('http');

module.exports.fsRun = async cmd => {
  return new Promise((resolve, reject) => {
    ch.exec(cmd, (err, data) => err ? reject(err) : resolve(data))
  });
}

module.exports.fsRead = async path => {
  return new Promise((resolve, reject) => {
    fs.readFile(path, (err, data) => err ? reject(err) : resolve(data))
  });
}

module.exports.fsWrite = async (path, buffer) => {
  return new Promise((resolve, reject) => {
    fs.writeFile(path, buffer, (err, data) => err ? reject(err) : resolve(data))
  });
}

module.exports.download = async (url, path) => {
  return new Promise((resolve, reject) => {
    let file = fs.createWriteStream(path);
    let request = http.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    });
    request.on('error', e => reject(e));
  });
}
  
module.exports.fsCopyFile = async (from, to) => {
  return new Promise((resolve, reject) => {
    fs.copyFile(from, to, (err, data) => err ? reject(err) : resolve(data))
  });
}

module.exports.fsMkDirTemp = async path => {
  return new Promise((resolve, reject) => {
    fs.mkdtemp(path, (err, data) => err ? reject(err) : resolve(data))
  });
}

module.exports.fsMkDir = async path => {
  return new Promise((resolve, reject) => {
    ch.exec(`mkdir -p ${path}`, (err, data) => err ? reject(err) : resolve(path))
  });
}

module.exports.fsAccess = async path => {
  return new Promise((resolve, reject) => {
    fs.access(path, (err, data) => err ? reject(err) : resolve(path))
  });
}
