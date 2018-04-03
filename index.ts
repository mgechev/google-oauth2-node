import * as express from 'express';

import { post } from 'request-promise';
import { parse } from 'url';
import { Server } from 'http';

const OAuth2TokenURL = 'https://www.googleapis.com/oauth2/v4/token';
const OAuth2CodeURL = 'https://accounts.google.com/o/oauth2/v2/auth';

export interface Config {
  clientId: string;
  clientSecret: string;
  scope: string;
}

export const auth = (config: Config) => {
  return listenForTokens(config, (port: number) =>
    require('opn')(
      `${OAuth2CodeURL}?client_id=${config.clientId}&redirect_uri=http://localhost:${port}&response_type=code&scope=${
        config.scope
      }`,
      { wait: false }
    )
  );
};

const listenForTokens = (config: Config, ready: Function) => {
  const app = express();
  const socketList: any[] = [];

  let server: Server;
  let port: number;

  let resolveCallback: Function;
  let rejectCallback: Function;

  const { clientId, clientSecret } = config;

  const cleanup = (cb: Function, res: express.Response, text: string, result: any) => {
    res.set({ 'content-type': 'text/html; charset=utf-8' });
    res.end(text);
    socketList.forEach(s => s.destroy());
    server.close(() => cb(result));
  };

  app.get('/', (req, res) => {
    const response = (e: string) => `<span style="font-size: 80px;">${e}</span>`;
    const resolve = cleanup.bind(null, resolveCallback, res, response('🙌'));
    const reject = cleanup.bind(null, rejectCallback, res, response('❌'));

    const params = parse(req.url, true);
    const { code, error } = params.query;

    if (error) {
      reject(error);
    } else {
      post(OAuth2TokenURL, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: encodeURI(
          `client_id=${clientId}&client_secret=${clientSecret}&redirect_uri=http://localhost:${port}&grant_type=authorization_code&code=${code}`
        )
      }).then(response => resolve(JSON.parse(response)), reject);
    }
  });

  server = app.listen(0, () => {
    port = server.address().port;
    ready(port);

    // Used for speeding up `server.close()`.
    server.on('connection', socket => {
      socketList.push(socket);
      socket.on('close', () => socketList.splice(socketList.indexOf(socket, 1)));
    });
  });

  return new Promise((s, f) => {
    resolveCallback = s;
    rejectCallback = f;
  });
};
