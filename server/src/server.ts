import express from 'express';
import path from 'node:path';
import type { Request, Response } from 'express';
import db from './config/connection.js';
// import routes from './routes/index.js';

import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { typeDefs, resolvers } from './schemas/index.js';
import { authenticateToken } from './services/auth.js';

const __dirname = path.resolve();

const server = new ApolloServer({
    typeDefs,
    resolvers,
    // enable introspection for dev environment (disabled by default in v4.11)
    introspection: true,
});

const startApolloServer = async () => {
    await server.start(); // start apollo server
    await db();

    const PORT = process.env.PORT || 3001;
    const app = express();

    app.use(express.urlencoded({ extended: false }));
    app.use(express.json());

    app.use('/graphql', expressMiddleware(server as any,
        { context: async ({ req }) => authenticateToken({ req })}
    ));

    if (process.env.NODE_ENV === 'production') {
        app.use(express.static(`${__dirname}/../client/dist`));

        app.get('*', (_req: Request, res: Response) => {
            res.sendFile(`${__dirname}/../client/dist/index.html`);
        });
    }

    app.listen(PORT, () => {
        console.log(`API server running on port ${PORT}`);
        console.log(`GraphQL server ready at http://localhost:${PORT}/graphql`);
    });
}

startApolloServer();
