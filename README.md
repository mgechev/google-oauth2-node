# Node.js Google OAuth2 Client

Using this client you can get a refresh and access tokens for using Google APIs. The client is specifically designed to be used in node.js, as an "Installed Application".

## Installation

```bash
npm i google-oauth2-node --save
```

## Usage

```ts
import { auth } from 'google-oauth2-node';

const clientId = '...';
const clientSecret = '...';
const scope = 'https://www.googleapis.com/auth/analytics.readonly';

auth({ clientId, clientSecret, scope }).then(res => console.log(res), err => console.error(err));
```

## License

MIT
