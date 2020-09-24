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

import { GQuery } from '@/services/gquery'
import store from '@/store/'
import Alert from '@/model/Alert.model'

import { createApolloClient } from '@/utils/graphql'
import { HOLD_WORKFLOW, RELEASE_WORKFLOW, STOP_WORKFLOW } from '@/graphql/queries'
/* eslint-disable no-unused-vars */
import { SubscriptionClient } from 'subscriptions-transport-ws'
import ZenObservable from 'zen-observable'
import { DocumentNode } from 'graphql'
/* eslint-enable no-unused-vars */

import {
  getIntrospectionQuery,
  processMutations
} from '@/services/mutation'

class WorkflowService extends GQuery {
  /**
   * @constructor
   * @param {string} httpUrl
   * @param {SubscriptionClient|null} subscriptionClient
   */
  constructor (httpUrl, subscriptionClient) {
    super()
    this.query = null
    this.subscriptionClient = subscriptionClient
    this.apolloClient = createApolloClient(httpUrl, subscriptionClient)
    /**
     * Observable for a merged query subscription.
     * @type {ZenObservable.Subscription}
     */
    this.observable = null
    /**
     * Observable for a deltas query subscription.
     * @type {ZenObservable.Subscription}
     */
    this.deltasObservable = null
    this.debug = process.env.NODE_ENV !== 'production'

    // mutations defaults
    this.mutations = null
    this.types = null
    this.associations = null

    this.loadMutations()
  }

  // deltas subscriptions

  /**
   * Create and start a deltas subscription.
   *
   * @param query {DocumentNode} - an already parsed GraphQL query (i.e. not a `string`)
   * @param variables {{}}
   * @param subscriptionOptions {{
   *   next: Function,
   *   error: Function
   * }}
   */
  startDeltasSubscription (query, variables, subscriptionOptions) {
    if (!query) {
      throw new Error('You must provide a query for the subscription')
    }
    if (!variables) {
      variables = {}
    }
    if (this.debug) {
      // eslint-disable-next-line no-console
      console.debug('graphql query:', query.loc.source.body)
      // eslint-disable-next-line no-console
      console.debug('graphql variables:', variables)
    }
    this.deltasObservable = this.apolloClient.subscribe({
      query: query,
      variables: variables,
      fetchPolicy: 'no-cache'
    }).subscribe({
      next (value) {
        subscriptionOptions.next(value)
      },
      error (errorValue) {
        subscriptionOptions.error(errorValue)
      }
    })
  }

  /**
   * Stops the current deltas subscription, if set.
   */
  stopDeltasSubscription () {
    if (this.deltasObservable) {
      this.deltasObservable.unsubscribe()
    }
  }

  // subscriptions with query-merging

  recompute () {
    super.recompute()
    this.request()
  }

  /**
   * Perform a REST GraphQL request. The request will use the merged-query
   * as payload. Deltas are requested in a separate subscription/query,
   * due to issues merging `Workflow` subscriptions with `Delta` subscriptions.
   */
  request () {
    if (!this.query) {
      return null
    }
    if (this.debug) {
      // eslint-disable-next-line no-console
      console.debug('graphql request:', this.query)
    }
    const vm = this
    if (this.observable !== null) {
      this.observable.unsubscribe()
      this.observable = null
    }
    this.observable = this.apolloClient.subscribe({
      query: this.query,
      fetchPolicy: 'no-cache'
    }).subscribe({
      next (response) {
        // commit results
        store.dispatch(
          'workflows/set',
          response.data.workflows
        )
        // set all subscriptions to active
        vm.subscriptions
          .filter(s => s.active === false)
          .forEach(s => {
            s.active = true
          })
        // run callback functions on the views
        vm.callbackActive()
      },
      error (err) {
        store.dispatch(
          'setAlert',
          new Alert(err.message, null, 'error')
        )
      },
      complete () {
      }
    })
  }

  // TODO: I believe these will be removed once we integrate the api-on-the-fly
  //       code with other components
  // mutations

  releaseWorkflow (workflowId) {
    return this.apolloClient.mutate({
      mutation: RELEASE_WORKFLOW,
      variables: {
        workflow: workflowId
      }
    })
  }

  holdWorkflow (workflowId) {
    return this.apolloClient.mutate({
      mutation: HOLD_WORKFLOW,
      variables: {
        workflow: workflowId
      }
    })
  }

  stopWorkflow (workflowId) {
    return this.apolloClient.mutate({
      mutation: STOP_WORKFLOW,
      variables: {
        workflow: workflowId
      }
    })
  }

  loadMutations () {
    // TODO: this assumes all workflows use the same schema which is and
    // isn't necessarily true, not quite sure, come back to this later
    this.apolloClient.query({
      query: getIntrospectionQuery(),
      fetchPolicy: 'no-cache'
    }).then((response) => {
      this.mutations = response.data.__schema.mutationType.fields
      this.types = response.data.__schema.types
      processMutations(this.mutations, this.types)
      // this.associations = associateMutations(mutations)
      console.log(this.mutations)
    })
  }
}

export default WorkflowService
