import { applyDeltas } from '@/components/cylc/tree/deltas'
import Alert from '@/model/Alert.model'
import { FRAGMENT_WORKFLOW_DATA, SUBSCRIPTION_DELTAS, WORKFLOW_DELTAS } from '@/graphql/queries'
// eslint-disable-next-line no-unused-vars
import { print } from 'graphql/language/printer'

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

export default {
  metaInfo () {
    return {
      title: this.getPageTitle('App.workflow', { name: this.workflowName })
    }
  },
  data () {
    return {
      /**
       * @type {Object.<string, Object>}
       */
      fragments: {
        AddedData: {
          workflow: WORKFLOW_DELTAS.added
        },
        UpdatedData: {
          workflow: WORKFLOW_DELTAS.updated
        },
        PrunedData: {
          workflow: WORKFLOW_DELTAS.pruned
        },
        WorkflowData: {
          workflow: FRAGMENT_WORKFLOW_DATA
        }
      },
      /**
       * This is the workflow data. The GraphQL subscription query adds data
       * to this object in the view. Other structures can be created with
       * reactivity for views such as Tree, Table, Dot, Graph, etc.
       * @type {*}
       */
      workflow: {}
    }
  },
  computed: {
    /**
     * Current workflow name, via Vue Router.
     *
     * @returns {string}
     */
    workflowName () {
      return this.$route.params.workflowName
    }
  },
  /**
   * Called when the user enters the view. This is executed before the component is fully
   * created. So there is no direct access to things like `.data` or `.computed` properties.
   * The component also hasn't been bound to the DOM (i.e. before `mounted()`).
   *
   * Here is where we create the subscription that populates the `CylcTree` object, and
   * also applies the deltas whenever data is received from the backend.
   */
  beforeRouteEnter (to, from, next) {
    next(vm => {
      vm.startSubscription()
    })
  },
  /**
   * Called when the user updates the view's route (e.g. changes URL parameters). We
   * stop any active subscription and clear data structures used locally. We also
   * start a new subscription.
   */
  beforeRouteUpdate (to, from, next) {
    this.$workflowService.stopDeltasSubscription()
    this.workflow = {}
    // NOTE: this must be done in the nextTick so that this.variables will use the updated prop!
    this.$nextTick(function () {
      this.startSubscription()
    })
    next()
  },
  /**
   * Called when the user leaves the view. We stop the active subscription and clear
   * data structures used locally.
   */
  beforeRouteLeave (to, from, next) {
    this.$workflowService.stopDeltasSubscription()
    this.workflow = null
    next()
  },
  methods: {
    /**
     * Combine the fragments of the view and add the combined fragments into
     * the query.
     *
     * @param {DocumentNode} query
     */
    combineFragments (query) {
      // For each key in this.fragments...
      Object.entries(this.fragments).forEach(value => {
        const key = value[0]
        const fragment = value[1]
        // NOTE: The key of the fragment is meaningless to us; it's used only for the mixin-merging
        //       of Vue 2. In Vue 3 we will use the composition API, so that might change soon-ish.
        // Let's now reduce all the fragments into a single fragment...
        const newFragment = Object.values(fragment).reduce((accumulator, fragment) => {
          if (accumulator === null) {
            // Let's use the first fragment to get started...
            return fragment
          }
          const selections = accumulator.definitions[0].selectionSet.selections
          const newSelections = fragment.definitions[0].selectionSet.selections
          selections.push(...newSelections)
          return accumulator
        }, null)
        const combinedDefinition = newFragment.definitions[0]
        // The name of the definition as defined by the view.
        combinedDefinition.name.value = key
        // And now add it to our list of definitions of the GraphQL query. The very first
        // definition here is always a Subscription, which uses the fragments (remaining
        // definitions).
        query.definitions.push(combinedDefinition)
      })
    },
    /**
     * Create the WebSockets GraphQL Subscription query.
     *
     * @returns {DocumentNode}
     */
    createQuery () {
      const baseQuery = SUBSCRIPTION_DELTAS
      // N.B. if later we decide to merge fragments or queries instead, we only need to
      // modify createQuery and combineFragments (probably rename or write a new function
      // that merges instead of combining).

      // The fragments are combined and added to the base query.
      this.combineFragments(baseQuery)
      return baseQuery
    },
    startSubscription () {
      const query = this.createQuery()
      const variables = this.variables
      const vm = this
      this.$workflowService.startDeltasSubscription(query, variables, {
        next: function next (response) {
          applyDeltas(response.data.deltas, vm.workflow)
        },
        error: function error (err) {
          this.setAlert(new Alert(err.message, null, 'error'))
        }
      })
    }
  }
}
