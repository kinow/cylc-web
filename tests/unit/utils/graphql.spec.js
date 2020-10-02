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

import { expect } from 'chai'
// need the polyfill as otherwise ApolloClient fails to be imported as it checks for a global fetch object on import...
import 'cross-fetch/polyfill'
import * as graphql from '@/utils/graphql'
import store from '@/store'

describe('utils', () => {
  describe('graphql', () => {
    describe('ApolloClient', () => {
      it('should create an apollo client', () => {
        const apolloClient = graphql.createApolloClient('http://localhost:12345', null)
        expect(apolloClient.link !== null).to.equal(true)
        expect(apolloClient.cache !== null).to.equal(true)
      })
    })

    describe('SubscriptionClient', () => {
      beforeEach(() => {
        store.state.offline = false
      })
      it('should create a subscription client', () => {
        const subscriptionClient = graphql.createSubscriptionClient('ws://localhost:12345', {
          reconnect: false,
          lazy: true
        },
        {})
        expect(typeof subscriptionClient.request).to.equal('function')
      })
      it('should call the subscription client callbacks', () => {
        const subscriptionClient = graphql.createSubscriptionClient('ws://localhost:12345', {
          reconnect: false,
          lazy: true
        },
        {})
        expect(store.state.offline).to.equal(false)

        let eventName, offline
        for ({ eventName, offline } of [
          {
            eventName: 'connecting',
            offline: true
          },
          {
            eventName: 'connected',
            offline: false
          },
          {
            eventName: 'reconnecting',
            offline: true
          },
          {
            eventName: 'reconnected',
            offline: false
          },
          {
            eventName: 'disconnected',
            offline: true
          }
        ]) {
          subscriptionClient.eventEmitter.emit(eventName)
          expect(store.state.offline).to.equal(offline)
        }
      })
    })

    describe('GraphQL URLs', () => {
      it('should create the correct URLs', () => {
        const graphQLUrls = graphql.createGraphQLUrls()
        expect(graphQLUrls.httpUrl.slice(0, 4)).to.equal('http')
        expect(graphQLUrls.wsUrl.slice(0, 2)).to.equal('ws')
      })
    })
  })
})
