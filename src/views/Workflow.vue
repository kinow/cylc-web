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
<!--          <table-component-->
<!--              :workflows="table.root.children"-->
<!--          />-->
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
import { mixin } from '@/mixins'
import { datatree } from '@/mixins/treeview'
import { datatable } from '@/mixins/tableview'
import { mapState } from 'vuex'
import Lumino from '@/components/cylc/workflow/Lumino'
import { WORKFLOW_TREE_DELTAS_SUBSCRIPTION } from '@/graphql/queries'
import CylcTree from '@/components/cylc/tree/cylc-tree'
import { applyDeltas } from '@/components/cylc/tree/deltas'
import Alert from '@/model/Alert.model'
import { each, iter } from '@lumino/algorithm'
import TreeComponent from '@/components/cylc/tree/Tree.vue'
import TableComponent from '@/components/cylc/table/Table.vue'
import MutationsView from '@/views/Mutations'
import Vue from 'vue'
import Toolbar from '@/components/cylc/workflow/Toolbar.vue'
import CylcObjectMenu from '@/components/cylc/cylcObject/Menu'

export default {
  mixins: [
    mixin,
    datatree,
    datatable
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
    deltaTableSubscriptions: [],
    /**
     * The CylcTree object, which receives delta updates. We must have only one for this
     * view, and it should contain data only while the tree subscription is active (i.e.
     * there are tree widgets added to the Lumino component).
     *
     * @type {CylcTree}
     */
    tree: new CylcTree(),
    isLoading: true,
    // the widgets added to the view
    /**
     * @type {
     *   Object.<string, string>
     * }
     */
    widgets: {}
  }),
  computed: {
    ...mapState('user', ['user']),
    treeWidgets () {
      return Object
        .entries(this.widgets)
        .filter(([id, type]) => type === TreeComponent.name)
        .map(([id, type]) => id)
    },
    tableWidgets () {
      return Object
        .entries(this.widgets)
        .filter(([id, type]) => type === TableComponent.name)
        .map(([id, type]) => id)
    },
    mutationsWidgets () {
      return Object
        .entries(this.widgets)
        .filter(([id, type]) => type === MutationsView.name)
        .map(([id, type]) => id)
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
    this.tree.clear()
    // stop delta subscription if any
    this.$workflowService.stopDeltasSubscription()
    this.tree.clear()
    this.table.clear()
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
    this.table.clear()
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
              applyDeltas(response.data.deltas, vm.tree)
              vm.isLoading = false
            },
            error: function error (err) {
              vm.setAlert(new Alert(err.message, null, 'error'))
              vm.isLoading = false
            }
          })
      }
      if (this.deltaSubscriptions.length === 0) {
        const vm = this
        this.$workflowService
          .startDeltasSubscription(WORKFLOW_TREE_DELTAS_SUBSCRIPTION, this.variables, {
            next: function next (response) {
              applyDeltas(response.data.deltas, vm.tree)
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
      } else if (view === 'table') {
        const subscriptionId = this.subscribeTableDeltas()
        Vue.set(this.widgets, subscriptionId, TableComponent.name)
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
        // if this is a tree widget with a deltas subscription, then stop it if the last widget using it
        vm.deltaSubscriptions.splice(this.deltaSubscriptions.indexOf(subscriptionId), 1)
        if (this.deltaSubscriptions.length === 0) {
          this.$workflowService.stopDeltasSubscription()
          this.tree.clear()
        } else if (vm.deltaTableSubscriptions.includes(subscriptionId)) {
          // if this is a table widget with a deltas subscription, then stop it if the last widget using it
          vm.deltaSubscriptions.splice(this.deltaSubscriptions.indexOf(subscriptionId), 1)
          if (this.deltaTableSubscriptions.length === 0) {
            this.$workflowService.stopTableDeltasSubscription()
            this.table.clear()
          }
        }
        if (Object.entries(this.widgets).length === 0) {
          this.isLoading = true
        }
      }
    }
  }
}
</script>
