/* 
© 2025 Aravinth Raj R. All rights reserved.
Unauthorized copying of this file, via any medium, is strictly prohibited.
Proprietary and confidential.  
Written by Aravinth Raj R <aravinthr235@gmail.com>, 2025.
*/
import express from 'express';
import bodyParser from 'body-parser';

import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
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

async function startRestServer() {
  app.use('/rest', router);

  app.listen(config.restPort, () => {
    logger.info(`🚀 REST Server running at http://localhost:${config.restPort}/rest`);
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
  app.use(bodyParser.json());

  app.use(
    '/graphql',
    authenticateJWT,
    accessControl,
    expressMiddleware(graphqlServer, {
      context: async ({ req, res }) => ({ req, res }),
    }),
  );

  app.listen(config.graphqlPort, () => {
    logger.info(`🚀 GRAPHQL Server running at http://localhost:${config.graphqlPort}/graphql`);
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
