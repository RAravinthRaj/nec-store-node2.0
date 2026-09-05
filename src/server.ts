/* 
© 2025 Aravinth Raj R. All rights reserved.
Unauthorized copying of this file, via any medium, is strictly prohibited.
Proprietary and confidential.  
Written by Aravinth Raj R <aravinthr235@gmail.com>, 2025.
*/
import express, { Express, Request, Response } from 'express';

import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { ApolloServerPluginLandingPageDisabled } from '@apollo/server/plugin/disabled';
import {
  authenticateJWT,
  accessControl,
  bodySizeLimit,
  corsMiddleware,
  httpsRedirect,
  rate_limiter,
  helmetMiddleware,
} from './middlewares';
import { resolvers, typeDefs } from './graphql/graphql.schema';
import router from './routes/rest.route';
import { config, validateConfig } from './config/config';
import logger from './utils/logger';
import { startReportWorker } from './workers/report.worker';
import { syncDatabase } from './models';

const createBaseApp = (): Express => {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(corsMiddleware);
  app.use(rate_limiter);
  app.use(bodySizeLimit);
  app.use(httpsRedirect);
  app.use(helmetMiddleware);

  return app;
};

async function startRestServer() {
  const restApp = createBaseApp();
  restApp.use('/rest', router);

  restApp.listen(config.restPort, () => {
    logger.info(`REST server listening on port ${config.restPort}`);
  });
}

async function startGraphqlServer() {
  const graphqlServer = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: config.nodeEnv === 'development',
    plugins: [
      config.nodeEnv === 'development'
        ? ApolloServerPluginLandingPageLocalDefault({ embed: true })
        : ApolloServerPluginLandingPageDisabled(),
    ],
    formatError: (formattedError) => {
      return {
        message: formattedError.message,
        path: formattedError.path,
        locations: formattedError.locations,
        extensions: {
          code: formattedError.extensions?.code,
        },
      };
    },
  });

  await graphqlServer.start();
  const graphqlApp = createBaseApp();

  graphqlApp.use(
    '/graphql',
    authenticateJWT,
    accessControl,
    expressMiddleware(graphqlServer, {
      context: async ({ req, res }: { req: Request; res: Response }) => ({
        req,
        res,
      }),
    }),
  );

  graphqlApp.listen(config.graphqlPort, () => {
    logger.info(`GraphQL server listening on port ${config.graphqlPort}`);
  });
}

async function connectRedisAndStartWorker() {
  startReportWorker();
  logger.info(`🚀 Connected to REDIS Server`);
}

validateConfig();

syncDatabase()
  .then(() => {
    logger.info('Database connected successfully');
    startRestServer();
    startGraphqlServer();
    connectRedisAndStartWorker();
  })
  .catch((err) => {
    logger.error(`Error occurred: ${err}`);
  });
