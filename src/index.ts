import Hapi, { Server } from '@hapi/hapi';
import basicAuthPlugin from '@hapi/basic';
import pino from 'hapi-pino';
import mongodb from './mongodb';
import validate from './authentication';
import usersPlugin from './users';

export const init = async (): Promise<Server> => {
  const server = Hapi.server({
    port: process.env.PORT || 4000,
    host: '0.0.0.0',
  });

  await server.register(basicAuthPlugin);

  server.auth.strategy('simple', 'basic', { validate });
  server.auth.default({
    strategy: 'simple',
  });

  await server.register({
    plugin: pino,
    options: {
      prettyPrint: process.env.NODE_ENV !== 'production',
      // Redact Authorization headers, see https://getpino.io/#/docs/redaction
      redact: ['req.headers.authorization'],
    },
  });

  await server.register([
    {
      plugin: mongodb,
      options: {
        url: 'mongodb://localhost:27017/test',
        settings: {},
      },
    },
  ]);

  await server.register([
    {
      plugin: usersPlugin,
      options: {},
      routes: {
        prefix: '/users',
      },
    },
  ]);

  server.route({
    method: 'GET',
    path: '/status',
    handler(request) {
      request.logger.info('In handler %s', request.path);
      return { success: true };
    },
    options: {
      auth: false,
    },
  });

  server.logger.info('server initialized');

  return server;
};

export const start = async (server: Hapi.Server): Promise<void> => {
  await server.start();
  server.logger.info(
    `Listening on ${server.settings.host || ''}:${server.settings.port || ''}`,
  );
};

process.on('unhandledRejection', (err) => {
  // eslint-disable-next-line no-console
  console.error('unhandledRejection');
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});

init()
  .then((server) => start(server))
  // eslint-disable-next-line no-console
  .catch((e) => console.log('Error at startup', e));
