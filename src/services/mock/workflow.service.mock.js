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

import { checkpoint } from '@/services/mock/checkpoint.js'
import { GQuery } from '@/services/gquery'
import store from '@/store/index'
import {
  cylcObjects,
  mutationStatus,
  processMutations
} from '@/utils/aotf'

const MUTATIONS = [
  {
    name: 'workflowMutation',
    _title: 'Workflow Mutation',
    description: `
      Lorem ipsum dolor sit amet, consectetur adipiscing elit.

      Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
      enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
      aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit
      in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
      Excepteur sint occaecat cupidatat non proident, sunt in culpa qui
      officia deserunt mollit anim id est laborum.
    `,
    args: [
      {
        name: 'workflow',
        type: {
          name: 'WorkflowID',
          kind: null
        }
      }
    ]
  },
  {
    name: 'cycleMutation',
    _title: 'Cycle Mutation',
    description: 'cycle',
    args: [
      {
        name: 'workflow',
        type: {
          name: 'WorkflowID',
          kind: null
        }
      },
      {
        name: 'cycle',
        type: {
          name: 'CyclePoint',
          kind: null
        }
      }
    ]
  },
  {
    name: 'namespaceMutation',
    _title: 'Namespace Mutation',
    description: 'namespace',
    args: [
      {
        name: 'workflow',
        type: {
          name: 'WorkflowID',
          kind: null
        }
      },
      {
        name: 'namespace',
        type: {
          name: 'NamespaceName',
          kind: null
        }
      }
    ]
  },
  {
    name: 'jobMutation',
    _title: 'Job Mutation',
    description: 'job',
    args: [
      {
        name: 'workflow',
        type: {
          name: 'WorkflowID',
          kind: null
        }
      },
      {
        name: 'job',
        type: {
          name: 'JobID',
          kind: null
        }
      }
    ]
  }
]

const primaryMutations = {}
primaryMutations[cylcObjects.Workflow] = ['workflowMutation']

const TYPES = []

/**
 * Stand-in WorkflowService for off-line work.
 * This class provides the functionality for fetching mock data.
 */
class MockWorkflowService extends GQuery {
  constructor (httpUrl, subscriptionClient) {
    super(/* enableWebSockets */ false)
    this.query = null
    const workflows = checkpoint.workflows
    const one = workflows[0]
    let baseTimestamp = new Date().getTime()
    // TODO: remove if the checkpoint workflow adds message triggers, as this is used
    //       only for testing in the offline mode.
    // NOTE: In the query for GraphQL, use a sort on the timestamp value, to make sure
    //       the elements returned are in order, showing the most recent ones first!
    //       We also have satisfied:true in the query, that's why we have the .filter below.
    const outputs = [...Array(15).keys()]
      .map(i => {
        const label = `msg-label-${i}`
        const message = `This is the message of the label ${i}`
        baseTimestamp += 1000
        return {
          label,
          message,
          timestamp: baseTimestamp,
          satisfied: i % 2 === 0
        }
      })
      .filter(output => output.satisfied)
      .sort((a, b) => b.timestamp - a.timestamp)
    one.taskProxies.forEach(taskProxy => {
      taskProxy.jobs.forEach(job => {
        job.taskProxy = {
          outputs: outputs
        }
      })
    })
    store.dispatch('workflows/set', workflows).then(() => {})
    this.loadMutations()
    // mutations and types are both initiliazed in loadMutations
    this.apolloClient = {
      query: () => new Promise((resolve) => {
        resolve({
          data: {
            __schema: {
              mutationType: {
                fields: this.mutations
              },
              types: this.types
            }
          }
        })
      })
    }
  }

  /**
   * Subscribe to a query.
   * This wraps the GQuery method to set each subscription to active.
   * @param view
   * @param query
   * @return {number}
   */
  subscribe (view, query) {
    this.query = query
    const id = super.subscribe(view, query)
    this.subscriptions.forEach(s => {
      s.active = true
    })
    this.callbackActive()
    return id
  }

  mutate (mutationName, id) {
    return [mutationStatus.SUCCEEDED, {}]
  }

  unregister (view) {
  }

  recompute () {}

  startDeltasSubscription (query, variables, subscriptionOptions) {
    if (!query.loc.source.body.includes('deltas')) {
      this.query = query
    }
    store.dispatch('workflows/set', checkpoint.workflows).then(() => {})
    const subscription = {
      unsubscribe: (subscription) => {
        this.subscriptions.splice(this.subscriptions.indexOf(subscription), 1)
      }
    }
    this.subscriptions.push({
      subscription
    })
    subscriptionOptions.next({
      data: {
        deltas: {
          added: {
            workflow: checkpoint.workflows[0],
            taskProxies: checkpoint.workflows[0].taskProxies
          }
        },
        workflows: checkpoint.workflows
      }
    })
  }

  stopDeltasSubscription (subscription) {

  }

  loadMutations () {
    this.mutations = MUTATIONS
    this.types = TYPES
    processMutations(this.mutations, this.types)
    this.primaryMutations = primaryMutations
  }
}

export default MockWorkflowService
