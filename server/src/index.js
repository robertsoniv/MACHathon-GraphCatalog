require('dotenv').config();
const { ApolloServer } = require('apollo-server');
const typeDefs = require('./schema');
const LaunchAPI = require('./datasources/launch');
const UserAPI = require('./datasources/user');
const ContentfulAPI = require('./datasources/contentful');
const OrdercloudAPI = require('./datasources/ordercloud');
const resolvers = require('./resolvers');
const { createStore } = require('./utils');
const isEmail = require('isemail');

const store = createStore();

const server = new ApolloServer({ 
    typeDefs,
    resolvers,
    context: async ({ req }) => {
      // simple auth check on every request
      const auth = req.headers && req.headers.authorization || '';
      const email = Buffer.from(auth, 'base64').toString('ascii');
      if (!isEmail.validate(email)) return { user: null };
      // find a user by their email
      const users = await store.users.findOrCreate({ where: { email } });
      const user = users && users[0] || null;
      return { user: { ...user.dataValues } };
    },
    dataSources: () => ({
        contentfulAPI : new ContentfulAPI(),
        ordercloudAPI : new OrdercloudAPI(),
        launchAPI: new LaunchAPI(),
        userAPI: new UserAPI({ store })
    }) 
});

server.listen().then(() => {
    console.log(`
      Server is running!
      Listening on port 4000
      Explore at https://studio.apollographql.com/dev
    `);
  });