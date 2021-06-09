import { applyDeltas } from '@/components/cylc/tree/deltas'
import Alert from '@/model/Alert.model'
import { SUBSCRIPTION_DELTAS } from '@/graphql/queries'

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
      fragments: {},
      /**
       * This is the workflow data. The GraphQL subscription query adds data
       * to this object in the view. Other structures can be created with
       * reactivity for views such as Tree, Table, Dot, Graph, etc.
       * @type {*}
       */
      workflow: {},
      /**
       * Options passed to the GraphQL subscription (Apollo Client).
       */
      subscriptionOptions: {
        next: function next (response) {
          applyDeltas(response.data.deltas, this.workflow)
        },
        error: function error (err) {
          this.setAlert(new Alert(err.message, null, 'error'))
        }
      }
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
    createQuery () {
      const baseQuery = SUBSCRIPTION_DELTAS
      console.log(this.fragments)
      // TODO: aggregate fragments and create the final query
      return baseQuery
    },
    startSubscription () {
      const query = this.createQuery()
      const variables = this.variables
      const subscriptionOptions = this.subscriptionOptions
      this.$workflowService.startDeltasSubscription(query, variables, subscriptionOptions)
    }
  }
}
