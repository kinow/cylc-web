import gql from 'graphql-tag'

// Code related to GraphQL queries, fragments, variables, etc.

// IMPORTANT: queries here may be used in the offline mode to create mock data. Before removing or renaming
// queries here, please check under the services/mock folder for occurrences of the variable name.

export const WORKFLOW_DATA_FRAGMENT = gql`
fragment workflowData on Workflow {
  id
  name
  status
  owner
  host
  port
}
`

export const TREE_DATA_FRAGMENT = gql`
fragment treeData on Workflow {
  cyclePoints: familyProxies(ids: ["root"]) {
    cyclePoint
  }
  taskProxies(sort: { keys: ["cyclePoint"] }) {
    id
    name
    state
    cyclePoint
    latestMessage
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
    jobs(sort: { keys: ["submit_num"], reverse:true }) {
      id
      batchSysName
      batchSysJobId
      host
      startedTime
      submittedTime
      finishedTime
      state
      submitNum
    }
  }
  familyProxies (exids: ["root"], sort: { keys: ["firstParent"]}) {
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
}
`

/**
 * Query used to retrieve data for a workflow Tree view.
 * @type {string}
 */
export const WORKFLOW_TREE_QUERY = `
subscription {
  workflows(ids: ["WORKFLOW_ID"]) {
    id
    name
    status
    owner
    host
    port
    cyclePoints: familyProxies(ids: ["root"]) {
      cyclePoint
    }
    taskProxies(sort: { keys: ["cyclePoint"] }) {
      id
      name
      state
      cyclePoint
      latestMessage
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
      jobs(sort: { keys: ["submit_num"], reverse:true }) {
        id
        batchSysName
        batchSysJobId
        host
        startedTime
        submittedTime
        finishedTime
        state
        submitNum
      }
    }
    familyProxies (exids: ["root"], sort: { keys: ["firstParent"]}) {
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
  }
}
`

/**
 * Query used to retrieve data for a workflow Graph view.
 * @type {string}
 */
export const WORKFLOW_GRAPH_QUERY = `
subscription {
  workflows(ids: ["WORKFLOW_ID"]) {
    id
    name
    status
    owner
    host
    port
    nodesEdges {
      nodes {
        id
        label: id
        parent: firstParent {
          id
          state
        }
        state
        cyclePoint
        task {
          name
        }
        jobs(sort: {keys: ["submit_num"], reverse: true}) {
          id
          batchSysName
          batchSysJobId
          host
          startedTime
          submittedTime
          finishedTime
          state
          submitNum
        }
      }
      edges {
        id
        source
        target
        label: id
      }
    }
    taskProxies(sort: { keys: ["cyclePoint"] }) {
      id
      state
      cyclePoint
      latestMessage
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
      jobs(sort: { keys: ["submit_num"], reverse:true }) {
        id
        batchSysName
        batchSysJobId
        host
        startedTime
        submittedTime
        finishedTime
        state
        submitNum
      }
    }
    familyProxies (sort: { keys: ["firstParent"]}) {
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
  }
}
`

/**
 * Query used to retrieve data for the application Dashboard.
 * @type {string}
 */
export const DASHBOARD_QUERY = `
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
export const GSCAN_QUERY = `
subscription {
  workflows {
    id
    name
    status
    owner
    host
    port
    taskProxies(sort: { keys: ["cyclePoint"] }) {
      id
      name
      state
      cyclePoint
      latestMessage
      task {
        meanElapsedTime
        name
      }
      jobs(sort: { keys: ["submit_num"], reverse:true }) {
        id
        batchSysName
        batchSysJobId
        host
        startedTime
        submittedTime
        finishedTime
        state
        submitNum
      }
    }
  }
}
`

export const WORKFLOWS_TABLE_QUERY = `
subscription {
  workflows {
    id
    name
    owner
    host
    port
  }
}
`
