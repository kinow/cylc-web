<!--
Copyright (C) NIWA & British Crown (Met Office) & Contributors.

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
-->

<template>
  <div>
    <CylcObjectMenu />
    <div class="c-tree">
      <tree-component
        :workflows="workflowTree"
        :hoverable="false"
        :activable="false"
        :multiple-active="false"
        :min-depth="1"
        ref="tree0"
        key="tree0"
      ></tree-component>
    </div>
  </div>
</template>

<script>
import mixin from '@/mixins'
import treeViewMixin from '@/mixins/treeview'
import TreeComponent from '@/components/cylc/tree/Tree.vue'
import CylcTree from '@/components/cylc/tree/cylc-tree'
import { WORKFLOW_TREE_DELTAS_SUBSCRIPTION } from '@/graphql/queries'
import Alert from '@/model/Alert.model'
import { applyDeltas } from '@/components/cylc/tree/deltas'
import CylcObjectMenu from '@/components/cylc/cylcObject/Menu'

export default {
  mixins: [
    mixin,
    treeViewMixin
  ],

  name: 'Tree',

  props: {
    workflowName: {
      type: String,
      required: true
    }
  },

  components: {
    CylcObjectMenu,
    TreeComponent
  },

  metaInfo () {
    return {
      title: this.getPageTitle('App.workflow', { name: this.workflowName })
    }
  },

  data: () => ({
    /**
     * This is the CylcTree, which contains the hierarchical tree data structure.
     * It is created from the GraphQL data, with the only difference that this one
     * contains hierarchy, while the GraphQL is flat-ish.
     * @type {null|CylcTree}
     */
    tree: new CylcTree()
  }),

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
      vm
        .$workflowService
        .startDeltasSubscription(WORKFLOW_TREE_DELTAS_SUBSCRIPTION, vm.variables, {
          next: function next (response) {
            applyDeltas(vm.tree, response.data.deltas)
          },
          error: function error (err) {
            vm.setAlert(new Alert(err.message, null, 'error'))
          }
        })
    })
  },

  /**
   * Called when the user updates the view's route (e.g. changes URL parameters). We
   * stop any active subscription and clear data structures used locally. We also
   * start a new subscription.
   */
  beforeRouteUpdate (to, from, next) {
    this.$workflowService.stopDeltasSubscription()
    this.tree.clear()
    const vm = this
    // NOTE: this must be done in the nextTick so that vm.variables will use the updated prop!
    this.$nextTick(() => {
      vm
        .$workflowService
        .startDeltasSubscription(WORKFLOW_TREE_DELTAS_SUBSCRIPTION, vm.variables, {
          next: function next (response) {
            applyDeltas(vm.tree, response.data.deltas)
          },
          error: function error (err) {
            vm.setAlert(new Alert(err.message, null, 'error'))
          }
        })
    })
    next()
  },

  /**
   * Called when the user leaves the view. We stop the active subscription and clear
   * data structures used locally.
   */
  beforeRouteLeave (to, from, next) {
    this.$workflowService.stopDeltasSubscription()
    this.tree = null
    next()
  }
}
</script>
