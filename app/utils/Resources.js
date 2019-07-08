const tar = require('tar');
const { app } = require('electron');

const { download } = require('./Common');

module.exports.download = async hash => {
  let userPath = app.getPath('userData');
  try {
    await download(
      `http://${app.config.serverHost}:${app.config.serverPort}/public/uploads/resources/${app.config.id}/${hash}.tgz`,
      `${userPath}/resource.tgz`
    );
  } catch (e) {
    app.error(`ERROR upload resource: ${e.message}`);
    return;
  }
};

module.exports.unpack = async () => {
  let userPath = app.getPath('userData');
  try {
    await tar.x({
      gzip: true,
      file: `${userPath}/resource.tgz`,
      cwd: `${userPath}/images`
    });
  } catch (e) {
    app.error(`ERROR unpack resource: ${e.message}`);
  }
}
