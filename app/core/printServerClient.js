import net from 'net';
import { IP_PRINTER, PORT_PRINTER } from '../store/constants/config';

class PrintServer {
  client;

  constructor() {
    this.client = new net.Socket();
  }

  async connect() {
    await new Promise((resolve, reject) => {
      this.client.connect(
        PORT_PRINTER,
        IP_PRINTER,
        () => {
          console.log('Connected to printer');
          resolve();
        }
      );
    });

    return this;
  }

  disconnect() {
    try {
      this.client.removeAllListeners('error');
      this.client.write('^CLOSE', (err) => {
        try {
          this.client.end();
        } catch (e) {}
      });
    } catch (e) {}
  }
}

export default PrintServer;
