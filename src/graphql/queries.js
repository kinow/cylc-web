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
const WORKFLOW_TREE_DELTAS_SUBSCRIPTION = gql`
subscription OnWorkflowDeltasData ($workflowId: ID) {
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
const WORKFLOW_TABLE_DELTAS_SUBSCRIPTION = gql`
subscription OnWorkflowDeltasData($workflowId: ID) {
  deltas(workflows: [$workflowId], stripNull: true) {
    ...WorkflowTableDeltas
  }
}

fragment WorkflowTableDeltas on Deltas {
  id
  shutdown
  added {
    ...WorkflowTableAddedData
  }
  updated {
    ...WorkflowTableUpdatedData
  }
  pruned {
    ...WorkflowTablePrunedData
  }
}

fragment WorkflowTableAddedData on Added {
  workflow {
    ...WorkflowData
    taskProxies(sort: {keys: ["name"], reverse: false}, ghosts: true) {
      ...TaskProxyData
      jobs(sort: {keys: ["submit_num"], reverse: true}) {
        ...JobData
      }
    }
  }
  taskProxies(sort: {keys: ["name"], reverse: false}, ghosts: true) {
    ...TaskProxyData
  }
  jobs(sort: {keys: ["submit_num"], reverse: true}) {
    ...JobData
  }
}

fragment WorkflowTableUpdatedData on Updated {
  taskProxies(ghosts: true) {
    ...TaskProxyData
  }
  jobs {
    ...JobData
  }
}

fragment WorkflowTablePrunedData on Pruned {
  jobs
  taskProxies
}

fragment WorkflowData on Workflow {
  id
  name
  status
  owner
  host
  port
}

fragment TaskProxyData on TaskProxy {
  id
  name
  state
  isHeld
  isQueued
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
    outputs(satisfied: true, sort: {keys: ["time"], reverse: true}) {
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
subscription {
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
subscription {
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
  subscription {
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
  WORKFLOW_TREE_DELTAS_SUBSCRIPTION,
  WORKFLOW_TABLE_DELTAS_SUBSCRIPTION,
  DASHBOARD_QUERY,
  GSCAN_QUERY,
  WORKFLOWS_TABLE_QUERY
}
