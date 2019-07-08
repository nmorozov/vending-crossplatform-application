import fs from 'fs';
import electron from 'electron';

class Logger {
  static folderName = '/log/';

  static async writeLine(text) {
    const userDataPath = this.getUserDataPath();
    const savePath = `${userDataPath}${this.folderName}`;

    if (!fs.existsSync(savePath)) {
      await new Promise((resolve, reject) => fs.mkdir(savePath, '0777', err => err ? reject(err) : resolve()));
    }

    console.log(text);

    let time = new Date();
    time = time.toISOString();

    await new Promise((resolve, reject) =>
      fs.appendFile(
        `${savePath}${this.getCurrentLogFileName()}`,
        `${time} ${text}\n`,
        'utf8',
        err => err ? reject(err) : resolve()
      )
    );
  }

  static getCurrentLogFileName() {
    const today = new Date();
    const yyyy = today.getFullYear();

    let dd = today.getDate();
    let mm = today.getMonth() + 1;

    if (dd < 10) {
      dd = `0${dd}`;
    }

    if (mm < 10) {
      mm = `0${mm}`;
    }

    return `${mm}${dd}${yyyy}.txt`;
  }

  static getUserDataPath() {
    return (electron.app || electron.remote.app).getPath('userData');
  }
}

export default Logger;
