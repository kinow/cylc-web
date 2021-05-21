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
    <toolbar
      v-on:add="this.addView"
    ></toolbar>
    <div class="workflow-panel fill-height">
      <lumino
        ref="lumino"
        v-on:lumino:deleted="onWidgetDeletedEvent"
        tab-title-prop="tab-title"
      >
        <v-skeleton-loader
          v-for="widgetId of treeWidgets"
          :key="widgetId"
          :id="widgetId"
          :loading="isLoading"
          type="list-item-three-line"
          tab-title="tree"
        >
          <tree-component
            :workflows="tree.root.children"
          />
        </v-skeleton-loader>
        <v-skeleton-loader
            v-for="widgetId of tableWidgets"
            :key="widgetId"
            :id="widgetId"
            :loading="isLoading"
            type="list-item-three-line"
            tab-title="table"
        >
         <table-component
           :tasks="tableTasks"
         />
        </v-skeleton-loader>
        <mutations-view
          v-for="widgetId of mutationsWidgets"
          :key="widgetId"
          :id="widgetId"
          :workflow-name="workflowName"
          tab-title="mutations"
        />
      </lumino>
    </div>
  </div>
</template>

<script>
import mixin from '@/mixins'
import graphqlMixin from '@/mixins/graphql'
import treeViewMixin from '@/mixins/treeview'
import alertsMixin from '@/mixins/alerts'
import { mapState } from 'vuex'
import Lumino from '@/components/cylc/workflow/Lumino'
import { WORKFLOW_TREE_DELTAS_SUBSCRIPTION } from '@/graphql/queries'
import CylcTree from '@/components/cylc/tree/cylc-tree'
import { applyDeltas } from '@/components/cylc/tree/deltas'
import { applyTableDeltas } from '@/components/cylc/table/deltas'
import Alert from '@/model/Alert.model'
import { each, iter } from '@lumino/algorithm'
import TreeComponent from '@/components/cylc/tree/Tree.vue'
import TableComponent from '@/components/cylc/table/Table.vue'
import MutationsView from '@/views/Mutations'
import Vue from 'vue'
import Toolbar from '@/components/cylc/workflow/Toolbar.vue'
import CylcObjectMenu from '@/components/cylc/cylcObject/Menu'
import partial from 'lodash/partial'

export default {
  mixins: [
    alertsMixin,
    mixin,
    graphqlMixin,
    treeViewMixin
  ],
  name: 'Workflow',
  props: {
    workflowName: {
      type: String,
      required: true
    }
  },
  components: {
    CylcObjectMenu,
    Lumino,
    TreeComponent,
    TableComponent,
    MutationsView,
    Toolbar
  },
  metaInfo () {
    return {
      title: this.getPageTitle('App.workflow', { name: this.workflowName })
    }
  },
  data: () => ({
    deltaSubscriptions: [],
    /**
     * The CylcTree object, which receives delta updates. We must have only one for this
     * view, and it should contain data only while the tree subscription is active (i.e.
     * there are tree widgets added to the Lumino component).
     *
     * @type {CylcTree}
     */
    tree: new CylcTree(),
    table: {},
    isLoading: true,
    // the widgets added to the view
    /**
     * @type {
     *   Object.<string, string>
     * }
     */
    widgets: {},
    deltasCallbacks: {}
  }),
  computed: {
    ...mapState('user', ['user']),
    treeWidgets () {
      return Object
        .entries(this.widgets)
        .filter(([id, type]) => type === TreeComponent.name)
        .map(([id]) => id)
    },
    tableWidgets () {
      return Object
        .entries(this.widgets)
        .filter(([id, type]) => type === TableComponent.name)
        .map(([id]) => id)
    },
    mutationsWidgets () {
      return Object
        .entries(this.widgets)
        .filter(([id, type]) => type === MutationsView.name)
        .map(([id]) => id)
    },
    tableTasks () {
      return Object.values(this.table)
    }
  },
  beforeRouteEnter (to, from, next) {
    next(vm => {
      vm.$nextTick(() => {
        vm.addView('tree')
      })
    })
  },
  beforeRouteUpdate (to, from, next) {
    this.isLoading = true
    // clear the tree with current workflow data
    this.table = {}
    // stop delta subscription if any
    this.$workflowService.stopDeltasSubscription()
    // clear all widgets
    this.removeAllWidgets()
    next()
    // start over again with the new deltas query/variables/new widget as in beforeRouteEnter
    // and in the next tick as otherwise we would get stale/old variables for the graphql query
    this.$nextTick(() => {
      // Create a Tree View for the current workflow by default
      this.addView('tree')
    })
  },
  beforeRouteLeave (to, from, next) {
    this.$workflowService.stopDeltasSubscription()
    this.tree.clear()
    this.table = {}
    next()
  },
  methods: {
    /**
     * @return {number} subscription ID
     */
    subscribeDeltas () {
      const id = new Date().getTime()
      // start deltas subscription if not running
      if (this.deltaSubscriptions.length === 0) {
        const vm = this
        this.$workflowService
          .startDeltasSubscription(WORKFLOW_TREE_DELTAS_SUBSCRIPTION, this.variables, {
            next: function next (response) {
              Object.values(vm.deltasCallbacks).forEach(deltasCallback => {
                deltasCallback(response.data.deltas)
              })
              vm.isLoading = false
            },
            error: function error (err) {
              vm.setAlert(new Alert(err.message, null, 'error'))
              vm.isLoading = false
            }
          })
      }
      this.deltaSubscriptions.push(id)
      return id
    },
    /**
     * Add a new view widget.
     *
     * TODO: These views should all have a standard interface.
     */
    addView (view) {
      if (view === 'tree') {
        const subscriptionId = this.subscribeDeltas()
        Vue.set(this.widgets, subscriptionId, TreeComponent.name)
        if (!Object.keys(this.deltasCallbacks).includes(TreeComponent.name)) {
          this.deltasCallbacks[TreeComponent.name] = partial(applyDeltas, this.tree)
        }
      } else if (view === 'table') {
        const subscriptionId = this.subscribeDeltas()
        Vue.set(this.widgets, subscriptionId, TableComponent.name)
        if (!Object.keys(this.deltasCallbacks).includes(TableComponent.name)) {
          this.deltasCallbacks[TableComponent.name] = partial(applyTableDeltas, this.table)
        }
      } else if (view === 'mutations') {
        Vue.set(this.widgets, (new Date()).getTime(), MutationsView.name)
      } else {
        throw Error(`Unknown view "${view}"`)
      }
    },
    /**
     * Remove all the widgets present in the UI.
     */
    removeAllWidgets () {
      const dockWidgets = this.$refs.lumino.dock.widgets()
      const widgets = []
      each(iter(dockWidgets), widget => {
        widgets.push(widget)
      })
      widgets.forEach(widget => widget.close())
    },
    /**
     * Called for each widget removed. Each widget contains a subscription
     * attached. This method will check if it needs to cancel the
     * subscription (e.g. we removed the last widget using a deltas
     * subscription).
     *
     * Calling it might change the value of the `isLoading` data
     * attribute.
     *
     * @param {{
     *   id: string
     * }} event UI event containing the widget ID (string value, needs to be parsed)
     */
    onWidgetDeletedEvent (event) {
      Vue.delete(this.widgets, event.id)
      const vm = this
      const subscriptionId = Number.parseFloat(event.id)
      if (vm.deltaSubscriptions.includes(subscriptionId)) {
        vm.deltaSubscriptions.splice(this.deltaSubscriptions.indexOf(subscriptionId), 1)
        // if there are no more tree widgets, we want to remove the tree-deltas-callback
        if (this.treeWidgets.length === 0) {
          delete this.deltasCallbacks[TreeComponent.name]
          this.tree.clear()
        }
        if (this.tableWidgets.length === 0) {
          delete this.deltasCallbacks[TableComponent.name]
          Object.keys(this.table).forEach(key => delete this.table[key])
        }
        // if there are no more widgets in the UI after this, then we want to stop the subscriptions
        if (this.deltaSubscriptions.length === 0) {
          this.$workflowService.stopDeltasSubscription()
          this.tree.clear()
          Object.keys(this.table).forEach(key => delete this.table[key])
        }
        // TODO: not needed?
        if (Object.entries(this.widgets).length === 0) {
          this.isLoading = true
        }
      }
    }
  }
}
</script>
