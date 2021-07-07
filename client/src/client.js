import { ApolloClient } from 'apollo-client'
import { InMemoryCache } from 'apollo-cache-inmemory'
import { ApolloLink } from 'apollo-link'
import { HttpLink } from 'apollo-link-http'
import { setContext } from 'apollo-link-context'
import gql from 'graphql-tag'

const typeDefs = gql`
  extend type Pet {
    new: Boolean!
  }
`;

const resolvers = {
  Pet: {
    new: () => false
  }
};


const delay = setContext(
  request =>
    new Promise((success, fail) => {
      setTimeout(() => {
        success()
      }, 800)
    })
)

const cache = new InMemoryCache()
const http = new HttpLink({
  uri: 'http://localhost:4000/'
})

const link = ApolloLink.from([
  delay,
  http
])

const client = new ApolloClient({
  cache,
  link,
  typeDefs,
  resolvers
})

export default client
