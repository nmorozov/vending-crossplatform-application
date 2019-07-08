import electron from 'electron';
const app = electron.remote.app;

export function sendStat(type, data) {
  // app.log('<<<>>>>',JSON.stringify({ type, data }));
  // app.log(`<<<>>>>http://${app.config.serverHost}:${app.config.serverPort}/vending/${app.config.id}/statistics`);
 
  return fetch(`http://${app.config.serverHost}:${app.config.serverPort}/vending/${app.config.id}/statistics`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({ type, data })
  }).catch(e => app.log(`ERROR send statistic: ${e.message}`));
}
