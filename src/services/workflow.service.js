import { GQuery } from '@/services/gquery'
import store from '@/store/'
import Alert from '@/model/Alert.model'
import { createApolloClient } from '@/utils/graphql'
import gql from 'graphql-tag'

// TODO: remove these once the api-on-the-fly mutations are hooked into the UI
const HOLD_WORKFLOW = gql`
mutation HoldWorkflowMutation($workflow: String!) {
  holdWorkflow (workflows: [$workflow]) {
    result
  }
}
`

const RELEASE_WORKFLOW = gql`
mutation ReleaseWorkflowMutation($workflow: String!) {
  releaseWorkflow(workflows: [$workflow]){
    result
  }
}
`

const STOP_WORKFLOW = gql`
mutation StopWorkflowMutation($workflow: String!) {
  stopWorkflow (workflows: [$workflow]) {
    result
  }
}
`

class SubscriptionWorkflowService extends GQuery {
  /**
   * @constructor
   * @param {string} httpUrl
   * @param {SubscriptionClient|null} subscriptionClient
   */
  constructor (httpUrl, subscriptionClient) {
    super()
    this.apolloClient = createApolloClient(httpUrl, subscriptionClient)
    this.observable = null
  }

  recompute () {
    super.recompute()
    this.request()
  }

  /**
   * Subscribe a new query.
   * @param {Object} view - The view to subscribe the query to.
   * @param {string} query - The query to subscribe.
   * @param {{string: string}} [variables] - The query variables.
   * @return {number} The subscription ID (used for un-subscribing).
   */
  subscribe (view, query, variables = {}) {
    const id = Math.random()
    this.subscriptions.push({
      id,
      view,
      query: query,
      variables: variables,
      active: false
    })
    this.query = query
    this.variables = variables
    this.request()
    return id
  }

  request () {
    /**
     * Perform a REST GraphQL request for all subscriptions.
     */
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.debug('graphql request:', this.query)
    }
    if (!this.query) {
      return null
    }
    const vm = this
    if (this.observable !== null) {
      this.observable.unsubscribe()
      this.observable = null
    }
    this.observable = this.apolloClient.subscribe({
      query: this.query,
      variables: this.variables,
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
          .forEach(s => { s.active = true })
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
}

export default SubscriptionWorkflowService
