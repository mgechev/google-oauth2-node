const opn = require('opn');
import { post } from 'request-promise';
import { parse } from 'url';
import * as express from 'express';
import { Server } from 'http';

const OAuth2TokenURL = 'https://www.googleapis.com/oauth2/v4/token';
const OAuth2CodeURL = 'https://accounts.google.com/o/oauth2/v2/auth';

export interface Config {
  clientId: string;
  clientSecret: string;
  scope: string;
}

export const auth = (config: Config) => {
  return listenForTokens((port: number) =>
    opn(
      `${OAuth2CodeURL}?client_id=${config.clientId}&redirect_uri=http://localhost:${port}&response_type=code&scope=${
        config.scope
      }`,
      { wait: false }
    )
  );
};

const listenForTokens = (ready: Function) => {
  const app = express();
  const socketList: any[] = [];

  let server: Server;
  let port: number;

  let resolveCallback: Function;
  let rejectCallback: Function;

  const cleanup = (cb: Function, res: express.Response, result: any) => {
    res.end();
    socketList.forEach(s => s.destroy());
    server.close(() => cb(result));
  };

  app.get('/', (req, res) => {
    const resolve = cleanup.bind(null, resolveCallback, res);
    const reject = cleanup.bind(null, rejectCallback, res);

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
          `client_id=${ClientID}&client_secret=${ClientSecret}&redirect_uri=http://localhost:${port}&grant_type=authorization_code&code=${code}`
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
