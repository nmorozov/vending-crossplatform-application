/* eslint global-require: 0, flowtype-errors/show-errors: 0 */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build-main`, this file is compiled to
 * `./app/main.prod.js` using webpack. This gives us some performance wins.
 *
 * @flow
 */
import { app, BrowserWindow } from 'electron';
import MenuBuilder from './menu';

import Logger from './utils/Logger';
import Resources from './utils/Resources';
import Scheduler from './utils/Scheduler';
import { fsAccess, fsRead, fsWrite, fsRun } from './utils/Common';

import { version } from './package.json';

const request = require('request-promise');
const fs = require('fs');
const ch = require('child_process');

const Board = require('vending-board');
const Vendotek = require('vendotek');
const PAX_D200 = require('pax-d200');

const express = require('express');
const bodyParser = require('body-parser');
const WebSocket = require('ws');

const fetch = require ('node-fetch');

app.express = express();

app.mainWindow = null;

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();

  app.config = JSON.parse(fs.readFileSync(process.resourcesPath + '/app.asar.unpacked/dist/config.json'));
  if (fs.existsSync('/etc/vending/config.json')) {
    let config = JSON.parse(fs.readFileSync('/etc/vending/config.json'));
    Object.assign(app.config, config);
  }

  app.log = process.env.ELECTRON_ENABLE_LOGGING ? console.log : function() {
    let str = [];
    for (let i = 0; i < arguments.length; i++) {
      if (typeof arguments[i] == 'object') {
        if (arguments[i] instanceof Error) {
          str.push(arguments[i].message + ' \n ' + arguments[i].stack);
        } else {
          str.push(JSON.stringify(arguments[i], null, '  '));
        }
      } else {
        str.push(arguments[i].toString());
      }
    }
    Logger.writeLine(str.join(' '));
  };

  app.error = process.env.ELECTRON_ENABLE_LOGGING ? console.error : function() {
    let str = [];
    for (let i = 0; i < arguments.length; i++) {
      if (typeof arguments[i] == 'object') {
        if (arguments[i] instanceof Error) {
          str.push(arguments[i].message + ' \n ' + arguments[i].stack);
        } else {
          str.push(JSON.stringify(arguments[i]));
        }
      } else {
        str.push(arguments[i].toString());
      }
    }
    Logger.writeLine('ERROR: ' + str.join(' '));
  };

} else {
  app.config = JSON.parse(fs.readFileSync(__dirname + '/config.json'));

  app.log = console.log;
  app.error = console.error;
}

app.log(`APP VERSION: ${version}`);

app.config.nextDisablePayment = app.config.disablePayment;
app.config.currentPrinting = 0;// 0 -печать удачная, 1 - печать с ошибкой

app.monitoring = {};
app.monitoring.version = version;
app.monitoring.currentPage = "";
app.monitoring.payment = app.config.nextDisablePayment ? 0 : 1;
app.monitoring.coinStatus = 0;
app.monitoring.envelopeModuleStatus =[];
app.monitoring.printerStatus = 0;
app.monitoring.lastPrinting = 0;
app.monitoring.command = {envelopeRestart: 0, payment: 0, printerRestart: 0, vendingRestart: 0};
app.log(`app.monitoring=`,app.monitoring);

app.fingerprint = require('./utils/fingerprint');
//--------execute command from server-----------
let executeCommandFromServer = async () => {
  app.log('-------->executeCommandFromServer');
  if (app.monitoring.currentPage === 'Home') {
    if (app.monitoring.command.envelopeRestart === 1) {
      app.log('-------->envelopeRestart = 1');
      app.monitoring.command.envelopeRestart = 0;
      app.board.coverReinit();
    };
    if (app.monitoring.command.payment === 1) {
      app.log('-------->payment = 1');
      app.monitoring.command.payment = 0;
      app.config.nextDisablePayment = 1;
    };
    if (app.monitoring.command.payment === 2) {
      app.log('-------->payment = 2');
      app.monitoring.command.payment = 0;
      app.config.nextDisablePayment = 0;
    };
    if (app.monitoring.command.printerRestart === 1) {
      app.log('-------->printerRestart = 1');
      app.monitoring.command.printerRestart = 0;
      app.board.printerButtonOnOff(0);
      setTimeout(() => {app.board.resetErrorBoard();},2000);
    };
    if (app.monitoring.command.vendingRestart === 1) {
      app.log('-------->vendingRestart = 1');
      app.monitoring.command.vendingRestart = 0;
      app.board.deviceGlobalRebut();
    };
  }
}
setTimeout(() => {
  setInterval(executeCommandFromServer, 10000);
}, 10000);

//----------------------------------------------
if (
  process.env.NODE_ENV === 'development' ||
  process.env.DEBUG_PROD === 'true'
) {
  require('electron-debug')();
  const path = require('path');
  const p = path.join(__dirname, '..', 'app', 'node_modules');
  require('module').globalPaths.push(p);
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS', 'REDUX_DEVTOOLS'];

  return Promise.all(
    extensions.map(name => installer.default(installer[name], forceDownload))
  ).catch(app.log);
};

const checkResources = async () => {
  let userPath = app.getPath('userData');

  let hash = await fsAccess(userPath + '/resourceHash')
    .then(() => fsRead(userPath + '/resourceHash'))
    .then(hash => hash.toString('utf-8'))
    .catch(e => '');

  app.config.resourceHash = parseInt(hash);
}

app.imagesPath = __dirname;
const checkLocalImages = async () => {
  let userPath = app.getPath('userData');
  app.imagesPath = userPath;

  if (process.env.NODE_ENV === 'development') {
    let existIPath = await fsAccess(userPath + '/images').catch(e => '');
    if (!existIPath)
      await fsRun(`cp -r ${__dirname}/dist/* ${userPath}/`);
    return;
  }

  try {
    let existIPath = await fsAccess(userPath + '/images').catch(e => '');
    if (!existIPath)
      await fsRun(`cp -r ${process.resourcesPath}/app.asar.unpacked/dist/* ${userPath}/`);

    let existLPath = await fsAccess(userPath + '/../../Desktop/Vending').catch(e => '');
    if (!existLPath)
      await fsRun(`ln -s ${userPath} ${userPath}/../../Desktop/Vending`);

    let existCPath = await fsAccess(userPath + '/../../Desktop/config.json').catch(e => '');
    if (!existCPath)
      await fsRun(`ln -s /etc/vending/config.json ${userPath}/../../Desktop/config.json`);
  } catch (e) {
    app.error(`ERROR CHECK LOCAL IMAGES: ${e.message || e}`);
    app.imagesPath = process.resourcesPath + '/app.asar.unpacked/dist';
  }
}

/**
 * Add event listeners...
 */

const initBoard = async () => {
  if (!app.config.disablePrinter) {

    app.log('Connect to board');
    app.config.boardSettings.log = app.log;

    let board = await Board.connect(app.config.boardSettings).catch(err => {
      app.error(err);
      setTimeout(initBoard, 1000);
      throw err;
    });
    if (!board) return;

    app.log('Connected to board');

    board.once('error', (err) => {
      app.error(err);
      app.board.disconnect();
      app.board = null;
      clearInterval(timerFunc);
      Scheduler.removeTask('cleanHead');
      setTimeout(initBoard, 1000);
    });

    // let timerFunc = () => {
    //   app.board.ping();
    // };

//-----------------------------------------------------------------------------------------------------
// [
//   {"eventId": 1, "eventOn": 1, "eventName": "Отсутствие всех конвертов", "eventBody": ""},
//   {"eventId": 2, "eventOn": 1, "eventName": "Ошибка толкателя", "eventBody": ""},
//   {"eventId": 3, "eventOn": 1, "eventName": "Ошибка заднего концевика", "eventBody": ""},
//   {"eventId": 4, "eventOn": 1, "eventName": "Ошибка при выдаче конверта", "eventBody": ""},
//   {"eventId": 5, "eventOn": 1, "eventName": "Отсутствие монеты", "eventBody": ""},
//   {"eventId": 6, "eventOn": 1, "eventName": "Принтер. Глобальная ошибка", "eventBody": ""},
//   {"eventId": 7, "eventOn": 1, "eventName": "Принтер. Ошибка бумаги", "eventBody": ""},
//   {"eventId": 8, "eventOn": 1, "eventName": "Принтер. Нет бумаги", "eventBody": ""},
//   {"eventId": 9, "eventOn": 1, "eventName": "Последняя печать была с ошибкой", "eventBody": ""},
//   {"eventId": 10, "eventOn": 1, "eventName": "Пропала связь с аппаратом", "eventBody": ""},
//   {"eventId": 11, "eventOn": 1, "eventName": "Связь с аппаратом востановлена", "eventBody": ""}
// ]
//------------------------------------------------------------------------------------------------------
    let timerFunc = async () => {
      app.monitoring.payment = app.config.nextDisablePayment ? 0 : 1;
      let coin = await board.checkCoin();
      if (app.monitoring.currentPage === 'Home') {
        app.monitoring.coinStatus = coin.error;
        let printer = await board.checkPrinterMonitoring();
        app.monitoring.coinStatus = printer.error;
        app.monitoring.printerStatus = printer.number;
        // if (printer.state === 'Не определено') app.monitoring.printerStatus = 0;
        // else if (printer.state === 'Выключен') app.monitoring.printerStatus = 1;
        // else if (printer.state === 'В процессе') app.monitoring.printerStatus = 2;
        // else if (printer.state === 'Готов к печати') app.monitoring.printerStatus = 3;
        // else if (printer.state === 'Ошибка бумаги') app.monitoring.printerStatus = 4;
        // else if (printer.state === 'Нет бумаги') app.monitoring.printerStatus = 5;
        // else if (printer.state === 'Глобальная ошибка') app.monitoring.printerStatus = 6;

        let envelops = await board.checkAllEnvelops();
        envelops.map((returnEnvelops) => {
          app.monitoring.envelopeModuleStatus[returnEnvelops.number - 1] = {
            'number': returnEnvelops.number, 'statusId': returnEnvelops.error,
            'statusName': returnEnvelops.error ? returnEnvelops.errorName : 'Ок'
          };
        });
      };
      // app.monitoring.envelopeModuleStatus[0].statusId = 6;
      if (app.monitoring.currentPage !== 'PlaceOrder') app.monitoring.lastPrinting = app.config.currentPrinting;
      app.log(`---> app.monitoring =`, app.monitoring);
      let data = app.monitoring;
      if (app.monitoring.currentPage === 'PlaceOrder') data.lastPrinting = 0;
      console.log("---->data.lastPrinting=", data.lastPrinting);
      console.log("---->app.monitoring.lastPrinting=", app.monitoring.lastPrinting);
      let res = fetch(`http://${app.config.serverHost}:${app.config.serverPort}/vending/${app.config.id}/monitoring`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      }).catch(e => app.log(`ERROR send statistic: ${e.message}`));
    };

    setInterval(timerFunc, 20000);

    board.on('info_button_click', () => {
      try {
        app.board.disconnect();
      } catch (e) {
        app.log('Board disconnect error', e.message);
      }
      try {
        if (app.vendotek) app.vendotek.disconnect();
      } catch (e) {
        app.log('Vendotek disconnect error', e.message);
      }
      app.exit(0);
    });

    app.board = board;

    app.config.schedule.cleanHead.map(interval => {
      Scheduler.addTask('cleanHead', () => app.board.cleanHead(), interval);
    });
  }
  else {
    //------------------------------------------------------------------------------------------------------
    let timerFunc = async () => {
      app.monitoring.payment = app.config.nextDisablePayment ? 0 : 1;
      if (app.monitoring.currentPage === 'Home') {
        app.monitoring.coinStatus = 1;
        app.monitoring.printerStatus = 3;

        app.monitoring.envelopeModuleStatus[0] = {'statusId' :6};
        app.monitoring.envelopeModuleStatus[1] = {'statusId' :6};
        app.monitoring.envelopeModuleStatus[2] = {'statusId' :6};
        app.monitoring.envelopeModuleStatus[3] = {'statusId' :6};
      };
      app.log(`---> app.monitoring =`, app.monitoring);
      if (app.monitoring.currentPage !== 'PlaceOrder') app.monitoring.lastPrinting = app.config.currentPrinting;
      let data = app.monitoring;
      console.log("---->app.config.currentPrinting=", app.config.currentPrinting);
      console.log("---->app.monitoring.lastPrinting=", app.monitoring.lastPrinting);
      let res = fetch(`http://${app.config.serverHost}:${app.config.serverPort}/vending/${app.config.id}/monitoring`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      }).catch(e => app.log(`ERROR send statistic: ${e.message}`));
    };

    setInterval(timerFunc, 20000);
  }
}

const initPayment = async () => {
  if (!app.config.disablePayment) {

    app.log(`Connect to Terminal ${app.config.terminal}`);
    app.config.vendotek.log = app.log;

    app.payment = null;

    switch (app.config.terminal) {
      case 'vendotek':
        let vendotek;
        try {
          vendotek = Vendotek.connect(app.config.vendotek);
        } catch (err) {
          app.payment = null;
          app.error(err);
          setTimeout(initPayment, 1000);
        }
        if (!vendotek) return;

        vendotek.once('error', (err) => {
          app.error(err);
          app.payment && app.payment.disconnect();
          app.payment = null;
          setTimeout(initPayment, 1000);
        });

        await vendotek.connecting;
        vendotek.enable();

        app.payment = vendotek;
        break;

      case 'd200':
        app.payment = await PAX_D200.connect(app.config.d200).catch(err => {
          app.payment = null;
          app.error(err);
          setTimeout(initPayment, 1000);
        });
        if (!app.payment) return;

        app.config.schedule.reconciliation.map(interval => {
          Scheduler.addTask('reconciliation', () => app.payment.reconciliation(), interval);
        });
        break;

      default:
        app.error(`UNDEFINED PAYMENT TERMINAL ${app.config.teminal}`);
        return;
    }

    app.log(`Connected to Terminal ${app.config.terminal}`);
  }
}

const pingServer = async () => {
  //if (process.env.NODE_ENV === 'production') {
    let id = app.config.id || process.env.USER[(process.env.USER.length-1)];
    id = parseInt(id) || parseInt(app.config.id);
    let userPath = app.getPath('userData');

    let pingInterval = setInterval(async () => {
      let data;
      try {
        data = await request.get({
          uri: `http://${app.config.serverHost}:${app.config.serverPort}/vending/${id}/ping`,
          json: true,
        }).catch(e => '');
        app.log(`Ping server vending ${data && data.id}`);
      } catch (e) {
        app.error(`SERVER PING ERROR: ${e.message}`);
      }
      //---command server response----------- 
      if (data.payment === 1 || data.payment === 2)  app.monitoring.command.payment = data.payment;
      if (data.printerRestart)  app.monitoring.command.printerRestart = 1;
      if (data.vendingRestart)  app.monitoring.command.vendingRestart = 1;
      if (data.envelopeRestart)  app.monitoring.command.envelopeRestart = 1;
      //---update image envelop end coin-----
      if (!data || app.config.resourceHash == data.updateResources) return;
      
      try {
        clearInterval(pingInterval);

        await Resources.download(data.updateResources);
        await Resources.unpack();
        await fsWrite(userPath + '/resourceHash', data.updateResources);
        app.relaunch();
        app.exit(0);

      } catch (e) {
        app.error(`SERVER REQUEST ERROR: ${e.message}`);
        pingServer();
      }
    }, 10000);
  //}
}

app.on('error', app.error);

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('ready', async () => {
  if (
    process.env.NODE_ENV === 'development' ||
    process.env.DEBUG_PROD === 'true'
  ) {
    await installExtensions();
  }

  app.mainWindow = new BrowserWindow({
    show: false,
    //fullscreen: true,
    kiosk: true,
    taskbar: false
  });

  let mainWindow = app.mainWindow;

  mainWindow.loadURL(`file://${__dirname}/app.html`);

  // @TODO: Use 'ready-to-show' event
  //        https://github.com/electron/electron/blob/master/docs/api/browser-window.md#using-ready-to-show-event
  mainWindow.webContents.on('did-finish-load', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.on('crashed', event => {
    app.error('CRASH!!! ', event);
  });

  mainWindow.on('error', app.error);

  if (
   process.env.NODE_ENV === 'development' ||
   process.env.DEBUG_PROD === 'true'
  ) {
    const menuBuilder = new MenuBuilder(mainWindow);
    menuBuilder.buildMenu();
  } else {
    mainWindow.setMenu(null);
  }

  app.setName('Vending');

  await checkLocalImages().catch(e => console.error(e));
  await initBoard();
  initPayment();
  pingServer();
  checkResources().catch(e => console.error(e));

});

process.on('unhandledRejection', error => {
  app.error('unhandledRejection', error);
});

process.on('uncaughtException', error => {
  app.error('uncaughtException', error);
});

app.express.use(bodyParser.urlencoded({
  extended: false,
  limit: '200mb'
}));

const handle = async (req, res) => {
  if (app.config.disablePrinter) return app.wss.send('Печать отключена');
  if (!app.board) return app.wss.send('Принтер недоступен');

  let checkPrinter = async () => {
    app.board.checkPrinter().catch(e => '');
    let data = await app.board.awaitEvent('response_check_printer', 1000).catch(e => '');
    if (data && data.number) app.wss.send('Принтер: ' + data.state);
  };

  app.wss.send('Начало печати');

  if (req.body.firstData) {
    await fsWrite('/var/tmp/A.' + (req.body.firstMime == 'image/tiff' ? 'tif' : 'png'), new Buffer(req.body.firstData, 'hex'), {mode: 0o777});
    app.wss.send('Начало печати лицевой стороны');

    let interval = setInterval(checkPrinter, 1000);

    await app.board.printAwers('/var/tmp/A.' + (req.body.firstMime == 'image/tiff' ? 'tif' : 'png'), null, req.body.firstMime == 'image/tiff');

    clearInterval(interval);
    app.wss.send('Конец печати лицевой стороны');
  }
  if (req.body.secondData) {
    await fsWrite('/var/tmp/B.' + (req.body.secondMime == 'image/tiff' ? 'tif' : 'png'), new Buffer(req.body.secondData, 'hex'), {mode: 0o777});
    app.wss.send('Начало печати обратной стороны');
    
    let interval = setInterval(checkPrinter, 1000);
    
    await app.board.printRewers('/var/tmp/B.' + (req.body.secondMime == 'image/tiff' ? 'tif' : 'png'), null, req.body.secondMime == 'image/tiff');
    
    clearInterval(interval);
    app.wss.send('Конец печати обратной стороны');
  } else {
    app.wss.send('Начало прокатки каретки');
    await app.board.rollCarriage();    
    app.wss.send('Конец прокатки каретки');
  }
  app.wss.send('Конец печати');
};

app.express.post('/', handle);

app.express.use('/logs', express.static(app.getPath('userData') + '/log'));

const PORT = 5050;

app.express.listen(PORT, () => {
    console.log('Server started on port', PORT);
});

app.wss = new WebSocket.Server({
  port: PORT + 5,
});

app.wss.send = message => {
  Array.from(app.wss.clients).map(ws => (ws.readyState === WebSocket.OPEN) && ws.send(message));
}
