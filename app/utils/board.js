const Serialport = require('serialport');

const ch = require('child_process');
const EventEmitter = require('events');

const NUMBER_OF_ENVELOP = 4;
const DEFAULT_ENVELOP = 4;

const PRINTER_PROGRAMM = 'print_main';
const PRINTER_PATH = '/dev/usb/lp0';
const PRINT_RESOLUTION = '360DPI';
const IMAGE_SCALING_AWERS = '100';
const IMAGE_SCALING_REWERS = '100';
const SATURATION = '1';
const CMYK_DOT_SIZE = '3';
const PAPER_TOP_AWERS = '3150';
const PAPER_TOP_REWERS = '3150';
const PAPER_LEFT_AWERS = '6900';
const PAPER_LEFT_REWERS = '6870';
const COLOR_LEVEL = 'R100G100B100';

const AWERS_FILE = '/var/tmp/A.bmp';
const REWERS_FILE = '/var/tmp/R.bmp';

const COMMAND_CHECK_COIN = 0x01;
const COMMAND_GET_COIN = 0x02;
const COMMAND_CHECK_ENVELOP = 0x03;
const COMMAND_GET_ENVELOP = 0x04;
const COMMAND_CHECK_PRINT = 0x05;
const COMMAND_PRINT_STARTED = 0x06;
const COMMAND_FIX_PAPER = 0x07;
const COMMAND_RESPONSE = 0x08;
const COMMAND_REPORT = 0x09;
const COMMAND_ERROR = 0x0A;
const COMMAND_INFO = 0x0B;

const PRINT_STATE_UNDEFINED = 0;
const PRINT_STATE_OFF = 1;
const PRINT_STATE_PROCESS = 2;
const PRINT_STATE_READY = 3;
const PRINT_STATE_PAPER_ERROR = 4;
const PRINT_STATE_PAPER_EMPTY = 5;
const PRINT_STATE_GLOBAL_ERROR = 6;

const VENDOR_ID = '10c4';

class Board extends EventEmitter {
  constructor(port) {
    super();
    this.port = port;
  }

  static async connect() {
    console.log('Scan ports');
    let ports = await Serialport.list();

    for (let i = 0; i < ports.length; i++) {
      if (ports[i].vendorId == VENDOR_ID) {
        console.log('Found port', ports[i].comName);
        let board = new Board(ports[i].comName);
        await board.connect();
        return board;
      }
    }

    throw new Error('Board not connected');
  }

  async connect() {
    console.log('Connecting to port');
    await new Promise((resolve, reject) => {
      this.conn = new Serialport(this.port, {
        baudRate: 115200
      }, err => err ? reject(err) : resolve());
    })
    console.log('Connected to port');
    this.conn.on('error', err => this.onError(err));
    this.conn.on('data', data => this.onData(data));
  }

  disconnect() {
    this.disconnected = true;
    this.conn.end();
    this.conn.destroy();
  }

  onError(err) {
    if (this.disconnected) {
      console.log('Error after disconnect', err);
      return;
    }
    console.log('Doard error:', err);
    console.error(err);

    this.emit('error', err);
  }

  onData(data) {
    console.log('Data received', data);

    let parsedData = this.parseData(data);
    this.emit(parsedData.typeName + (parsedData.command ? '_' + parsedData.commandName : ''), parsedData);
  }

  getTypeName(type) {
    switch (type) {
      case COMMAND_RESPONSE: return 'response';
      case COMMAND_REPORT: return 'report';
      case COMMAND_ERROR: return 'global_error';
      case COMMAND_INFO: return 'info';

      default: return 'unknown_type';
    }
  }

  getCommandName(command) {
    switch (command) {
      case COMMAND_CHECK_COIN: return 'check_coin';
      case COMMAND_GET_COIN: return 'get_coin';
      case COMMAND_CHECK_ENVELOP: return 'check_envelop';
      case COMMAND_GET_ENVELOP: return 'get_envelop';
      case COMMAND_CHECK_PRINT: return 'check_printer';
      case COMMAND_PRINT_STARTED: return 'printing';
      case COMMAND_FIX_PAPER: return 'fix_paper';

      default: return 'unknown_command';
    }
  }

  getErrorName(error, command) {
    switch (command) {
      case COMMAND_CHECK_COIN:
      case COMMAND_GET_COIN:
        switch (error) {
          case 0: return '';
          case 1: return 'Толкатель не вначале';
          case 2: return 'Ошибка заднего концевика';
        }
        break;

      case COMMAND_CHECK_ENVELOP:
      case COMMAND_GET_ENVELOP:
        switch (error) {
          case 0: return '';
          case 1: return 'Неправильный модуль (Номер > 4)';
          case 2: return 'Нету картриджа';
          case 3: return 'Нету конверта';
          case 4: return 'Толкатель не вначале';
          case 5: return 'Ошибка заднего концевика';
        }
        break;

      case COMMAND_CHECK_PRINT:
      case COMMAND_PRINT_STARTED:
        switch (error) {
          case 0: return '';
          case 1: return 'Нету монеты';
          case 2: return 'Ошибка заднего концевика';
          case 3: return 'Каретка не вначале';
          case 4: return 'Принтер занят';
          case 5: return 'Принтер не готов печатать';
          case 6: return 'Датчик бумаги';
        }
        break;
    }
    return 'unknown_error';
  }

  getGlobalErrorName(error) {
    switch (error) {
      case 0: return '';
      case 1: return 'Ошибка каретки';
      case 2: return 'Ошибка выдачи монеты';
      case 3: return 'Ошибка принтера';

      default: return 'unknown_error';
    }
  }
  getInfoName(error) {
    switch (error) {
      case 0: return '';
      case 1: return 'button_click';

      default: return 'unknown_info';
    }
  }

  getStateName(state, command) {
    if (command == COMMAND_CHECK_PRINT || command == COMMAND_PRINT_STARTED || command == COMMAND_FIX_PAPER) {
      switch (state) {
        case PRINT_STATE_UNDEFINED: return 'Не определено';
        case PRINT_STATE_OFF: return 'Выключен';
        case PRINT_STATE_PROCESS: return 'В процессе';
        case PRINT_STATE_READY: return 'Готов к печати';
        case PRINT_STATE_PAPER_ERROR: return 'Ошибка бумаги';
        case PRINT_STATE_PAPER_EMPTY: return 'Нету бумаги';
        case PRINT_STATE_GLOBAL_ERROR: return 'Глобальная ошибка';
      }
    }

    return undefined;
  }

  parseData(data) {
    let obj = {};

    obj.type = data[2];
    obj.typeName = this.getTypeName(obj.type);
    switch (obj.typeName) {
      case 'response':
        obj.command = data[3];
        obj.commandName = this.getCommandName(obj.command);
        obj.error = data[4];
        obj.errorName = this.getErrorName(obj.error, obj.command);
        obj.number = data[5];
        obj.state = this.getStateName(obj.number, obj.command);
        break;

      case 'report':
        obj.command = data[3];
        obj.commandName = this.getCommandName(obj.command);
        obj.error = data[4];
        obj.errorName = this.getErrorName(obj.error);
        obj.number = data[5];
        break;

      case 'error':
        obj.error = data[3];
        obj.errorName = this.getGlobalErrorName(obj.error);
        break;

      case 'info':
        obj.info = data[3];
        obj.infoName = this.getGlobalErrorName(obj.info);
        break;
    }

    return obj;
  }

  crc8(buffer, len) {
    let crc = 0;

    for (let i = 0; i < len; i++) {
        crc = crc + buffer[i]*211;
        crc = crc ^ (crc >> 8);
        crc = crc & 0xFF;
    }

    return crc;
  }

  async awaitEvent(event, timeout) {
    return new Promise((resolve, reject) => {
      let check_response = data => {
        clearTimeout(timeoutFunc);
        resolve(data);
      }

      let timeoutFunc = () => {
        this.removeListener(event, check_response);
        reject(new Error('Timeout response'));
      };

      this.once(event, check_response);
      setTimeout(timeoutFunc, timeout);
    });
  }

  async sendCommand(command, data = 0x00, retries = 0) {
    let message = Buffer.alloc(8, 0x00);
    message[0] = 0xAA;
    message[1] = 0xEE;
    message[2] = command;
    message[3] = data;
    message[7] = this.crc8(message, 7);

    console.log('Send message', message);
    this.conn.write(message);

    console.log('Await response');
    let response = await this.awaitEvent('response_' + this.getCommandName(command), 100);

    if (response.error && retries) {
      response = await new Promise((resolve, reject) => {
        setTimeout(() => {
          this.sendCommand(command, data, --retries)
            .then(res => resolve(res));
        }, 1000);
      });
    }

    return response;
  }

  async sendPing(command) {
    let message = Buffer.alloc(8, 0x00);
    message[0] = 0xAA;
    message[1] = 0xEE;
    message[2] = command;
    message[7] = this.crc8(message, 7);

    this.conn.write(message);
  }

  async ping() {
    console.log('Ping');
    let res = await this.sendPing(COMMAND_CHECK_COIN);
    return res;
  }

  async checkCoin() {
    console.log('Check coin');
    let res = await this.sendCommand(COMMAND_CHECK_COIN);
    return res;
  }

  async getCoin() {
    console.log('Get coin');
    let res = await this.sendCommand(COMMAND_GET_COIN);
    return res;
  }

  async checkEnvelop(num) {
    console.log('Check envelop', num);
    let res = await this.sendCommand(COMMAND_CHECK_ENVELOP, num);
    return res;
  }

  async getEnvelop(num) {
    console.log('Get envelop', num);
    let res = await this.sendCommand(COMMAND_GET_ENVELOP, num);
    return res;
  }

  async checkPrinter() {
    console.log('Check printer');
    let res = await this.sendCommand(COMMAND_CHECK_PRINT);
    return res;
  }

  async startPrint() {
    console.log('Start print');
    let res = await this.sendCommand(COMMAND_PRINT_STARTED, null, 20);
    return res;
  }

  async fixPaper() {
    console.log('Fix paper');
    let res = await this.sendCommand(COMMAND_PRINT_STARTED);
    return res;
  }

  async checkAllEnvelops() {
    console.log('Check all envelops');

    let list = [];
    for (let i = 1; i <= NUMBER_OF_ENVELOP; i++) {
      let res = await this.checkEnvelop(i);
      list.push(res);
    }

    return list;
  }

  async printAwers(pathAwers) {
    console.log('Print awers');

    let res = await this.startPrint();
    if (!res || res.error) {
      console.log('Error before printing:', res.errorName);
      throw new Error('Error before printing');
    }

    console.log('Start print awers');
    let cmd = `${PRINTER_PROGRAMM} ` +
      `-P ${PRINTER_PATH} ` +
      `-r ${PRINT_RESOLUTION} ` +
      `-a ${CMYK_DOT_SIZE} ` +
      `-t ${PAPER_TOP_AWERS} ` +
      `-l ${PAPER_LEFT_AWERS} ` +
      `-S ${IMAGE_SCALING_AWERS} ` +
      `-m ${SATURATION} ` +
      `-E ${COLOR_LEVEL} ` +
      `-I ${pathAwers} `;
    console.log('Run cmd:', cmd);
    await new Promise((resolve, reject) => {
      ch.exec(cmd,
        (err, stdout, stderr) => {
          console.log(stdout);
          resolve();
        }
      );
    });

    console.log('Await finish printing');
    res = await this.awaitEvent('report_printing', 50000);
    if (!res || res.error) {
      console.log('Error printing:', res.errorName);
      throw new Error('Printing error');
    }
  }

  async printRewers(pathRewers) {
    console.log('Print rewers');

    let res = await this.startPrint();
    if (!res || res.error) {
      console.log('Error before printing:', res.errorName);
      throw new Error('Error before printing');
    }
    
    console.log('Start print rewers');
    let cmd = `${PRINTER_PROGRAMM} ` +
      `-P ${PRINTER_PATH} ` +
      `-r ${PRINT_RESOLUTION} ` +
      `-a ${CMYK_DOT_SIZE} ` +
      `-t ${PAPER_TOP_REWERS} ` +
      `-l ${PAPER_LEFT_REWERS} ` +
      `-S ${IMAGE_SCALING_REWERS} ` +
      `-m ${SATURATION} ` +
      `-E ${COLOR_LEVEL} ` +
      `-I ${pathRewers} `;
    console.log('Run cmd:', cmd);
    await new Promise((resolve, reject) => {
      ch.exec(cmd,
        (err, stdout, stderr) => {
          console.log(stdout);
          resolve();
        }
      );
    });

    console.log('Await finish printing');
    res = await this.awaitEvent('report_printing', 50000);
    if (!res || res.error) {
      console.log('Error printing:', res.errorName);
      throw new Error('Printing error');
    }
  }

  async tryGetEnvelop(envelop) {
    let res = await this.checkEnvelop(envelop);

    if (res.error && envelop != DEFAULT_ENVELOP) {
      res = await this.checkEnvelop(DEFAULT_ENVELOP);
    }

    if (res.error) {
      for (let i = 1; i <= NUMBER_OF_ENVELOP; i++) {
        if (i == envelop || i == DEFAULT_ENVELOP) continue;

        res = await this.checkEnvelop(i);

        if (!res.error) break;
      }
    }

    if (res.error) throw new Error('All envelops error');

    await this.getEnvelop(res.number);    
  }

  async print(pathAwers, pathRewers, envelop) {
    await this.printAwers(pathAwers);
    await this.tryGetEnvelop(envelop);
    await this.printRewers(pathRewers);
  }
}

module.exports = Board;