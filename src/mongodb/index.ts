import { Plugin } from '@hapi/hapi';
import {
  Collection, MongoClient, MongoClientOptions, Document,
} from 'mongodb';

declare module '@hapi/hapi' {
  interface Server {
    getMongoCollection: <DocumentType extends Document>(
      name: string
    ) => Collection<DocumentType>;
  }

  interface Request {
    getMongoCollection: <DocumentType extends Document>(
      name: string
    ) => Collection<DocumentType>;
  }
}

interface MongodbPluginOptions {
  url: string;
  settings: MongoClientOptions;
}

const MongodbPlugin: Plugin<MongodbPluginOptions> = {
  name: 'Mongodb',
  version: '1.0.0',
  async register(server, options) {
    let mongoClient: MongoClient;

    const connect = async (connectionOptions: MongodbPluginOptions) => {
      const client = new MongoClient(
        connectionOptions.url,
        connectionOptions.settings,
      );
      await client.connect();
      const db = client.db();
      const connectionOptionsToLog = {
        ...connectionOptions,
        url: connectionOptions.url.replace(
          /mongodb(\+srv)?:\/\/([^/]+?):([^@]+)@/,
          'mongodb$1://$2:******@',
        ),
      };

      server.logger.info(
        `MongoClient connection created for ${JSON.stringify(
          connectionOptionsToLog,
        )}`,
      );

      return { client, db };
    };

    try {
      const { client, db } = await connect(options);
      mongoClient = client;
      server.decorate(
        'request',
        'getMongoCollection',
        <T extends Document>(collectionName: string) => db.collection<T>(collectionName),
      );
      server.decorate(
        'server',
        'getMongoCollection',
        <T extends Document>(collectionName: string) => db.collection<T>(collectionName),
      );
    } catch (err) {
      server.logger.error(err);
      throw err;
    }

    server.events.on('stop', () => {
      if (mongoClient) {
        mongoClient
          .close()
          .then(() => server.logger.info('`MongoClient connection closed'))
          .catch((err) => {
            if (err) {
              server.logger.error(err);
            }
          });
      }
    });
  },
};

export default MongodbPlugin;
