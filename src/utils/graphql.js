/**
 * Copyright (C) NIWA & British Crown (Met Office) & Contributors.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import dedent from 'dedent'
import {
  ApolloClient,
  ApolloLink,
  HttpLink,
  InMemoryCache,
  split
} from '@apollo/client'
import { getMainDefinition } from '@apollo/client/utilities'
import { WebSocketLink } from '@apollo/client/link/ws'
import { SubscriptionClient } from 'subscriptions-transport-ws'
import store from '@/store'
import gql from 'graphql-tag'

/**
 * Create the HTTP and WebSocket URLs for an ApolloClient.
 *
 * @private
 * @return {{wsUrl: string, httpUrl: string}}
 * @private
 */
export function createGraphQLUrls () {
  // TODO: revisit this and evaluate other ways to build the GraphQL URL - not safe to rely on window.location (?)
  const baseUrl = `${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}${window.location.pathname}`
  const httpUrl = `${window.location.protocol}//${baseUrl}graphql`
  const wsUrl = `${window.location.protocol.startsWith('https') ? 'wss' : 'ws'}://${baseUrl}subscriptions`
  return {
    httpUrl: httpUrl,
    wsUrl: wsUrl
  }
}

/**
 * Create a subscription client.
 *
 * @private
 * @param {string} wsUrl - WebSocket subscription URL
 * @param {{
 *   reconnect: boolean,
 *   lazy: boolean
 * }} options - SubscriptionClient options (only two main options added here, see their doc for more)
 * @param {*} wsImpl
 * @return {SubscriptionClient} a subscription client
 */
export function createSubscriptionClient (wsUrl, options = {}, wsImpl = null) {
  const opts = Object.assign({
    reconnect: true,
    lazy: false
  }, options)
  const subscriptionClient = new SubscriptionClient(wsUrl, opts, wsImpl)
  // these are the available hooks in the subscription client lifecycle
  subscriptionClient.onConnecting(() => {
    store.commit('SET_OFFLINE', true)
  })
  subscriptionClient.onConnected(() => {
    store.commit('SET_OFFLINE', false)
  })
  subscriptionClient.onReconnecting(() => {
    store.commit('SET_OFFLINE', true)
  })
  subscriptionClient.onReconnected(() => {
    store.commit('SET_OFFLINE', false)
  })
  subscriptionClient.onDisconnected(() => {
    store.commit('SET_OFFLINE', true)
  })
  // TODO: at the moment the error displays an Event object, but the browser also displays the problem, as well as the offline indicator
  //       would be nice to find a better error message using the error object
  // subscriptionClient.onError((error) => {
  //   console.error(error)
  //   store.commit('SET_ALERT', new Alert(error, null, 'error'))
  // })
  return subscriptionClient
}

/**
 * Create an ApolloClient using the given URI's.
 *
 * If a `queryUri` is provided, it will be used for handling Query operations.
 *
 * If a `subscriptionUri` is provided, it will be used for handling Subscription operations.
 *
 * If no `subscriptionUri` is provided, any Subscription operation will fail, as we will be
 * using an empty link (a simple instance of `ApolloLink`).
 *
 * The link object is actually a split function (from the `apollo-link` module). This function
 * works similarly to a ternary operator. Based on the operation, it will return a Query or
 * a Subscription link.
 *
 * @public
 * @param {string} httpUrl
 * @param {SubscriptionClient|null} subscriptionClient
 * @returns {ApolloClient} an ApolloClient
 */
export function createApolloClient (httpUrl, subscriptionClient) {
  const httpLink = new HttpLink({
    uri: httpUrl
  })

  const wsLink = subscriptionClient !== null ? new WebSocketLink(subscriptionClient)
    : new ApolloLink() // return an empty link, useful for testing, offline mode, etc

  const link = split(
    ({ query }) => {
      const definition = getMainDefinition(query)
      return definition.kind === 'OperationDefinition' && definition.operation === 'subscription'
    },
    wsLink,
    httpLink
  )

  return new ApolloClient({
    link: link,
    cache: new InMemoryCache(),
    defaultOptions: {
      query: {
        fetchPolicy: 'no-cache',
        errorPolicy: 'all'
      },
      watchQuery: {
        fetchPolicy: 'no-cache',
        errorPolicy: 'all'
      }
    },
    connectToDevTools: process.env.NODE_ENV !== 'production'
  })
}

/** Walk a GraphQL type yielding all composite types on route.
 *
 * E.G. NonNull<List<String>> would yield:
 *  1. NonNull
 *  2. List
 *  3. String
 *
 * @param type {Object} A type as returned by an introspection query.
 * (i.e. an object of the form {name: x, kind: y, ofType: z}
 *
 * @yields {Object} Type objects of the same form as the type argument.
 */
export function * iterateType (type) {
  while (type) {
    yield type
    type = type.ofType
  }
}

/** Return an appropriate null value for the specified type.
 *
 * @param type {Object} A type field as returned by an introspection query.
 * (an object of the form {name: x, kind: y, ofType: z}).
 * @param types {Array} An array of all types present in the schema.
 * (optional: used to resolve InputObjectType fields).
 *
 * @returns {Object|Array|undefined}
 */
export function getNullValue (type, types = []) {
  let ret = null
  let ofType = null
  for (const subType of iterateType(type)) {
    if (subType.kind === 'LIST') {
      ofType = getNullValue(subType.ofType)
      if (ofType) {
        // this list contains an object
        ret = [
          getNullValue(subType.ofType)
        ]
      } else {
        ret = []
      }
      break
    }
    if (subType.kind === 'INPUT_OBJECT') {
      ret = {}
      for (const type of types) {
        // TODO: this type iteration is already done in the mixin
        //       should we use the mixin or a subset there-of here?
        if (
          type.name === subType.name &&
          type.kind === subType.kind
        ) {
          for (const field of type.inputFields) {
            ret[field.name] = getNullValue(field.type)
          }
          break
        }
      }
      break
    }
  }
  return ret
}

/** Return the signature for an argument.
 *
 * E.G: NonNull<List<String>>  =>  [String]!
 *
 * @param arg {Object} An argument from a introspection query.
 *
 * @returns {string} A type string for use in a client query / mutation.
 */
export function argumentSignature (arg) {
  const stack = [...iterateType(arg.type)]
  stack.reverse()
  let ret = ''
  for (const type of stack) {
    if (
      type.name === null &&
      type.kind === 'LIST'
    ) {
      ret = `[${ret}]`
    } else if (
      type.name === null &&
      type.kind === 'NON_NULL'
    ) {
      ret = ret + '!'
    } else if (type.name) {
      ret = type.name
    } else {
      ret = type.kind
    }
  }
  return ret
}

/** Construct a mutation string from a mutation introspection.
 *
 * @param mutation {Object} A mutation as returned by an introspection query.
 *
 * @returns {string} A mutation string for a client to send to the server.
 */
export function constructMutation (mutation) {
  const argNames = []
  const argTypes = []
  for (const arg of mutation.args) {
    argNames.push(`${arg.name}: $${arg.name}`)
    argTypes.push(`$${arg.name}: ${argumentSignature(arg)}`)
  }

  return dedent`
    mutation ${mutation.name}(${argTypes.join(', ')}) {
      ${mutation.name}(${argNames.join(', ')}) {
        result
      }
    }
  `.trim()
}

// enumeration for the mutation status, maps onto Cylc Task status
export const status = {
  waiting: 'waiting',
  submitted: 'submitted',
  succeeded: 'succeeded',
  failed: 'failed',
  submitFailed: 'submit-failed'
}
Object.freeze(status)

export async function mutate (mutation, args, apolloClient) {
  console.log(
    constructMutation(mutation)
  )
  console.log(
    args
  )
  let result = null
  try {
    result = await apolloClient.mutate({
      mutation: gql(constructMutation(mutation)),
      variables: args
    })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err)
    return [status.submitFailed, err]
  }
  const responses = result.data[mutation.name].result
  if (responses && responses.length === 1) {
    return [status.submitted, responses[0].response]
  }
  return [status.failed, result]
  // TODO: this is actually submit failed but leave it like this until we are
  // ready as it helps differentiate
  // return [status.submitFailed, result]
}
