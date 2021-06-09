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

import Vue from 'vue'
import mixin from '@/mixins'
import alertsMixin from '@/mixins/alerts'
import graphqlMixin from '@/mixins/graphql'
import { SUBSCRIPTION_DELTAS, WORKFLOW_TREE_DELTAS_SUBSCRIPTION } from '@/graphql/queries'
import { applyDeltas } from '@/components/cylc/tree/deltas'
import Alert from '@/model/Alert.model'

/**
 * A Higher-Order-Component function for **views** (Vue Router route bound).
 *
 * Provides:
 *
 * - GraphQL variables used to filter the GraphQL query
 * - GraphQL fragments used to request more data from the default base query
 *
 * @param {Vue} component
 * @returns {Vue}
 * @see https://medium.com/bethink-pl/higher-order-components-in-vue-js-a79951ac9176
 */
const withWorkflowSubscription = component => {
  return Vue.component('withWorkflowSubscription', {
    render (createElement) {
      return createElement(component)
    },
    mixins: [
      alertsMixin,
      mixin,
      graphqlMixin
    ],
    props: {
      /**
       * Fetched from the Vue Router route. Example: five (i.e. not using
       * the .id yet, but the .name value).
       * @type {string}
       */
      workflowName: {
        type: String,
        required: true
      }
    },
    metaInfo () {
      return {
        title: this.getPageTitle('App.workflow', { name: this.workflowName })
      }
    },
    data () {
      return {
        /**
         * This is the workflow data. The GraphQL subscription query adds data
         * to this object in the view. Other structures can be created with
         * reactivity for views such as Tree, Table, Dot, Graph, etc.
         * @type {*}
         */
        workflow: {},
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
        // TODO: aggregate fragments and create the final query
        return baseQuery
      },
      startSubscription () {
        const query = this.createQuery()
        const variables = this.variables
        // eslint-disable-next-line no-console
        console.debug(`Starting subscription...\nQuery: ${query}\nVariables: ${variables}`)
        const subscriptionOptions = this.subscriptionOptions
        this.$workflowService.startDeltasSubscription(query, variables, subscriptionOptions)
      }
    }
  })
}

export default withWorkflowSubscription
