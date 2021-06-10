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

// Code related to GraphQL queries, fragments, variables, etc.

import gql from 'graphql-tag'
// eslint-disable-next-line no-unused-vars
import { DocumentNode } from 'graphql'

// IMPORTANT: queries here may be used in the offline mode to create mock data. Before removing or renaming
// queries here, please check under the services/mock folder for occurrences of the variable name.

/**
 * @type {DocumentNode}
 */
const SUBSCRIPTION_DELTAS = gql`
subscription OnWorkflowTreeDeltasData ($workflowId: ID) {
  deltas (workflows: [$workflowId], stripNull: true) {
    id
    shutdown
    added {
      ...AddedData
    }
    updated {
      ...UpdatedData
    }
    pruned {
      ...PrunedData
    }
  }
}
`

/**
 * @private
 * @type {string}
 */
const WORKFLOW_SELECTION = `
workflow {
  ...WorkflowData
}`

const WORKFLOW_DELTAS = {
  added: gql`
  fragment AddedData on Added {
    ${WORKFLOW_SELECTION}
  }`,
  updated: gql`
  fragment UpdatedData on Updated {
    ${WORKFLOW_SELECTION}
  }`,
  pruned: gql`
  fragment PrunedData on Pruned {
    workflow
  }`
}

/**
 * @private
 * @type {string}
 */
const CYCLEPOINT_SELECTION = `
cyclePoints: familyProxies (ids: ["root"], ghosts: true) {
  ...CyclePointData
}`

const CYCLEPOINT_DELTAS = {
  added: gql`
  fragment CyclePointAddedData on Added {
    ${CYCLEPOINT_SELECTION}
  }`,
  updated: gql`
  fragment CyclePointUpdatedData on Updated {
    ${CYCLEPOINT_SELECTION}
  }`
}

const FAMILY_PROXY_SELECTION = `
familyProxies (exids: ["root"], sort: { keys: ["name"] }, ghosts: true) {
  ...FamilyProxyData
}
`

const FAMILY_PROXY_DELTAS = {
  added: gql`
  fragment FamilyProxyAddedData on Added {
    ${FAMILY_PROXY_SELECTION}
  }`,
  updated: gql`
  fragment FamilyProxyUpdatedData on Updated {
    ${FAMILY_PROXY_SELECTION}
  }`,
  pruned: gql`
  fragment FamilyProxyPrunedData on Pruned {
    familyProxies
  }`
}

const TASK_PROXY_SELECTION = `
taskProxies (sort: { keys: ["name"], reverse: false }, ghosts: true) {
  ...TaskProxyData
}`

const TASK_PROXY_DELTAS = {
  added: gql`
  fragment TaskProxyAddedData on Added {
    ${TASK_PROXY_SELECTION}
  }`,
  updated: gql`
  fragment TaskProxyUpdatedData on Updated {
    ${TASK_PROXY_SELECTION}
  }`,
  pruned: gql`
  fragment TaskProxyPrunedData on Pruned {
    taskProxies
  }`
}

const JOB_SELECTION = `
jobs(sort: { keys: ["submit_num"], reverse:true }) {
  ...JobData
}
`

const JOB_DELTAS = {
  added: gql`
  fragment JobAddedData on Added {
    ${JOB_SELECTION}
  }`,
  updated: gql`
  fragment JobUpdatedData on Updated {
    ${JOB_SELECTION}
  }`,
  pruned: gql`
  fragment JobPrunedData on Pruned {
    jobs
  }`
}

const FRAGMENT_WORKFLOW_DATA = gql`
fragment WorkflowData on Workflow {
  id
  name
  status
  owner
  host
  port
}
`

const FRAGMENT_CYCLEPOINT_DATA = gql`
fragment CyclePointData on FamilyProxy {
  id
  cyclePoint
}`

const FRAGMENT_FAMILY_PROXY_DATA = gql`
fragment FamilyProxyData on FamilyProxy {
  id
  name
  state
  cyclePoint
  firstParent {
    id
    name
    cyclePoint
    state
  }
}`

const FRAGMENT_TASK_PROXY_DATA = gql`
fragment TaskProxyData on TaskProxy {
  id
  name
  state
  isHeld
  isQueued
  isRunahead
  cyclePoint
  firstParent {
    id
    name
    cyclePoint
    state
  }
  task {
    meanElapsedTime
    name
  }
}`

const FRAGMENT_JOB_DATA = gql`
fragment JobData on Job {
  id
  firstParent: taskProxy {
    id
  }
  jobRunnerName
  jobId
  platform
  startedTime
  submittedTime
  finishedTime
  state
  submitNum
  taskProxy {
    outputs (satisfied: true, sort: { keys: ["time"], reverse: true}) {
      label
      message
    }
  }
}`

// --- old

/**
 * @type {DocumentNode}
 */
const WORKFLOW_TREE_DELTAS_SUBSCRIPTION = gql`
subscription OnWorkflowTreeDeltasData ($workflowId: ID) {
  deltas (workflows: [$workflowId], stripNull: true) {
   ...WorkflowTreeDeltas
  }
}

# TREE DELTAS BEGIN

fragment WorkflowTreeDeltas on Deltas {
  id
  shutdown
  added {
    ...WorkflowTreeAddedData
  }
  updated {
    ...WorkflowTreeUpdatedData
  }
  pruned {
    ...WorkflowTreePrunedData
  }
}

fragment WorkflowTreeAddedData on Added {
  workflow {
    ...WorkflowData
    cyclePoints: familyProxies (ids: ["root"], ghosts: true) {
      ...CyclePointData
    }
    taskProxies (sort: { keys: ["name"], reverse: false }, ghosts: true) {
      ...TaskProxyData
      jobs(sort: { keys: ["submit_num"], reverse:true }) {
        ...JobData
      }
    }
    familyProxies (exids: ["root"], sort: { keys: ["name"] }, ghosts: true) {
      ...FamilyProxyData
    }
  }
  cyclePoints: familyProxies (ids: ["root"], ghosts: true) {
    ...CyclePointData
  }
  familyProxies (exids: ["root"], sort: { keys: ["name"] }, ghosts: true) {
    ...FamilyProxyData
  }
  taskProxies (sort: { keys: ["name"], reverse: false }, ghosts: true) {
    ...TaskProxyData
  }
  jobs (sort: { keys: ["submit_num"], reverse:true }) {
    ...JobData
  }
}

fragment WorkflowTreeUpdatedData on Updated {
  taskProxies (ghosts: true) {
    ...TaskProxyData
  }
  jobs {
    ...JobData
  }
  familyProxies (exids: ["root"], ghosts: true) {
    ...FamilyProxyData
  }
}

fragment WorkflowTreePrunedData on Pruned {
  jobs
  taskProxies
  familyProxies
}

# TREE DELTAS END

# WORKFLOW DATA BEGIN

fragment WorkflowData on Workflow {
  id
  name
  status
  owner
  host
  port
}

fragment CyclePointData on FamilyProxy {
  id
  cyclePoint
}

fragment FamilyProxyData on FamilyProxy {
  id
  name
  state
  cyclePoint
  firstParent {
    id
    name
    cyclePoint
    state
  }
}

fragment TaskProxyData on TaskProxy {
  id
  name
  state
  isHeld
  isQueued
  isRunahead
  cyclePoint
  firstParent {
    id
    name
    cyclePoint
    state
  }
  task {
    meanElapsedTime
    name
  }
}

fragment JobData on Job {
  id
  firstParent: taskProxy {
    id
  }
  jobRunnerName
  jobId
  platform
  startedTime
  submittedTime
  finishedTime
  state
  submitNum
  taskProxy {
    outputs (satisfied: true, sort: { keys: ["time"], reverse: true}) {
      label
      message
    }
  }
}

# WORKFLOW DATA END
`

/**
 * Query used to retrieve data for the application Dashboard.
 * @type {string}
 */
const DASHBOARD_QUERY = `
subscription DashboardSubscriptionQuery {
  workflows {
    id
    name
    status
  }
}
`

/**
 * Query used to retrieve data for the GScan sidebar.
 * @type {string}
 */
const GSCAN_QUERY = `
subscription GscanSubscriptionQuery {
  workflows {
    id
    name
    status
    owner
    host
    port
    stateTotals
    latestStateTasks(states: [
      "failed",
      "preparing",
      "submit-failed",
      "submitted",
      "running"
    ])
  }
}
`

/**
 * Subscription used in the view that lists workflows in a table.
 * @type {string}
 */
const WORKFLOWS_TABLE_QUERY = `
subscription WorkflowsTableQuery {
  workflows (ignoreInterval: 0) {
    id
    name
    owner
    host
    port
  }
}
`

export {
  SUBSCRIPTION_DELTAS,
  WORKFLOW_DELTAS,
  CYCLEPOINT_DELTAS,
  FAMILY_PROXY_DELTAS,
  TASK_PROXY_DELTAS,
  JOB_DELTAS,
  FRAGMENT_WORKFLOW_DATA,
  FRAGMENT_CYCLEPOINT_DATA,
  FRAGMENT_FAMILY_PROXY_DATA,
  FRAGMENT_TASK_PROXY_DATA,
  FRAGMENT_JOB_DATA,
  WORKFLOW_TREE_DELTAS_SUBSCRIPTION,
  DASHBOARD_QUERY,
  GSCAN_QUERY,
  WORKFLOWS_TABLE_QUERY
}
