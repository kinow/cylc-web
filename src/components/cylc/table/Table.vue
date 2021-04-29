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
  <v-container
    class="ma-0 pa-2"
  >
    <!-- Toolbar -->
    <v-row
      no-gutters
      class="d-flex flex-wrap"
    >
      <!-- Filters -->
      <v-col
        v-if="filterable"
        class="grow"
      >
        <v-row
          no-gutters
        >
          <v-col
            cols="12"
            md="5"
            class="pr-md-2 mb-2 mb-md-0"
          >
            <v-text-field
              id="c-table-filter-task-name"
              clearable
              dense
              flat
              hide-details
              outlined
              placeholder="Filter by task name"
              v-model="tasksFilter.name"
            ></v-text-field>
          </v-col>
          <v-col
            cols="12"
            md="5"
            class="pr-md-2 mb-2 mb-md-0"
          >
            <v-select
              id="c-table-filter-task-states"
              :items="taskStates"
              clearable
              dense
              flat
              hide-details
              multiple
              outlined
              placeholder="Filter by task state"
              v-model="tasksFilter.states"
            >
              <template v-slot:item="slotProps">
                <Task :status="slotProps.item.value"/>
                <span class="ml-2">{{ slotProps.item.value }}</span>
              </template>
              <template v-slot:selection="slotProps">
                <div class="mr-2" v-if="slotProps.index >= 0 && slotProps.index < maximumTasks">
                  <Task :status="slotProps.item.value"/>
                </div>
                <span
                  v-if="slotProps.index === maximumTasks"
                  class="grey--text caption"
                >
            (+{{ tasksFilter.states.length - maximumTasks }})
          </span>
              </template>
            </v-select>
          </v-col>
          <v-col
            cols="12"
            md="2">
            <!-- TODO: we shouldn't need to set the height (px) here, but for some reason the Vuetify
                       components don't seem to agree on the height here -->
            <v-btn
              id="c-table-filter-btn"
              height="40"
              block
              outlined
              @click="filterTasks"
            >Filter</v-btn>
          </v-col>
        </v-row>
      </v-col>
      <!-- Expand, collapse all -->
      <v-col
        v-if="expandCollapseToggle"
        class="shrink"
      >
        <div
          class="d-flex flex-nowrap"
        >
          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
              <v-btn
                v-on="on"
                @click="expandAll((tableitem) => !['task-proxy', 'job', 'job-details'].includes(tableitem.node.type))"
                icon
              >
                <v-icon>{{ svgPaths.expandIcon }}</v-icon>
              </v-btn>
            </template>
            <span>Expand all</span>
          </v-tooltip>
          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
              <v-btn
                v-on="on"
                @click="collapseAll()"
                icon
              >
                <v-icon>{{ svgPaths.collapseIcon }}</v-icon>
              </v-btn>
            </template>
            <span>Collapse all</span>
          </v-tooltip>
        </div>
      </v-col>
    </v-row>
    <!-- Table component -->
    <v-row
      no-gutters
      >
      <!-- each workflow is a table root -->
      <table-item
        v-for="workflow of workflows"
        :key="workflow.id"
        :node="workflow"
        :hoverable="hoverable"
        :initialExpanded="expanded"
        v-on:table-item-created="onTableItemCreated"
        v-on:table-item-destroyed="onTableItemDestroyed"
        v-on:table-item-expanded="onTableItemExpanded"
        v-on:table-item-collapsed="onTableItemCollapsed"
        v-on:table-item-clicked="onTableItemClicked"
      >
        <template v-for="(_, slot) of $scopedSlots" v-slot:[slot]="scope"><slot :name="slot" v-bind="scope"/></template>
      </table-item>
    </v-row>
  </v-container>
</template>

<script>
import TableItem from '@/components/cylc/table/TableItem'
import Vue from 'vue'
import TaskState from '@/model/TaskState.model'
import Task from '@/components/cylc/Task'
import clonedeep from 'lodash.clonedeep'
import { mdiPlus, mdiMinus } from '@mdi/js'

export default {
  name: 'Table',
  props: {
    workflows: {
      type: Array,
      required: true
    },
    hoverable: Boolean,
    activable: Boolean,
    multipleActive: Boolean,
    filterable: {
      type: Boolean,
      default: true
    },
    expandCollapseToggle: {
      type: Boolean,
      default: true
    }
  },
  components: {
    Task,
    'table-item': TableItem
  },
  data () {
    return {
      tableItemCache: {},
      activeCache: new Set(),
      expandedCache: new Set(),
      expanded: true,
      expandedFilter: null,
      collapseFilter: null,
      tasksFilter: {
        name: '',
        states: []
      },
      activeFilters: null,
      maximumTasks: 4,
      svgPaths: {
        expandIcon: mdiPlus,
        collapseIcon: mdiMinus
      }
    }
  },
  computed: {
    taskStates: () => {
      return TaskState.enumValues.map(taskState => {
        return {
          text: taskState.name.replace(/_/g, ' '),
          value: taskState.name
        }
      }).sort((left, right) => {
        return left.text.localeCompare(right.text)
      })
    },
    tasksFilterStates: function () {
      return this.activeFilters.states.map(selectedTaskState => {
        return selectedTaskState
      })
    }
  },
  watch: {
    workflows: {
      deep: true,
      handler: function (val, oldVal) {
        if (this.activeFilters !== null) {
          this.$nextTick(() => {
            this.filterNodes(this.workflows)
          })
        }
      }
    }
  },
  methods: {
    filterByTaskName () {
      return this.activeFilters.name !== undefined &&
          this.activeFilters.name !== null &&
          this.activeFilters.name.trim() !== ''
    },
    filterByTaskState () {
      return this.activeFilters.states !== undefined &&
          this.activeFilters.states !== null &&
          this.activeFilters.states.length > 0
    },
    filterTasks () {
      const taskNameFilterSet = this.tasksFilter.name !== undefined &&
          this.tasksFilter.name !== null &&
          this.tasksFilter.name.trim() !== ''
      const taskStatesFilterSet = this.tasksFilter.states !== undefined &&
          this.tasksFilter.states !== null &&
          this.tasksFilter.states.length > 0
      if (taskNameFilterSet || taskStatesFilterSet) {
        this.activeFilters = clonedeep(this.tasksFilter)
        this.filterNodes(this.workflows)
      } else {
        this.removeAllFilters()
        this.activeFilters = null
      }
    },
    filterNodes (nodes) {
      for (const node of nodes) {
        this.filterNode(node)
      }
    },
    filterNode (node) {
      let filtered = false
      if (['cyclepoint', 'family-proxy'].includes(node.type)) {
        for (const child of node.children) {
          filtered = this.filterNode(child) || filtered
        }
      } else if (node.type === 'task-proxy') {
        if (this.filterByTaskName() && this.filterByTaskState()) {
          filtered = node.node.name.includes(this.activeFilters.name) && this.tasksFilterStates.includes(node.node.state)
        } else if (this.filterByTaskName()) {
          filtered = node.node.name.includes(this.activeFilters.name)
        } else if (this.filterByTaskState()) {
          filtered = this.tasksFilterStates.includes(node.node.state)
        }
      }
      this.tableItemCache[node.id].filtered = filtered
      return filtered
    },
    removeAllFilters () {
      for (const tableitem of Object.values(this.tableItemCache)) {
        tableitem.filtered = true
      }
    },
    expandAll (filter = null) {
      const collection = filter ? [...Object.values(this.tableItemCache)].filter(filter) : Object.values(this.tableItemCache)
      for (const tableItem of collection) {
        tableItem.isExpanded = true
        this.expandedCache.add(tableItem)
      }
      this.expanded = true
    },
    collapseAll (filter = null) {
      const collection = filter ? [...this.expandedCache].filter(filter) : this.expandedCache
      for (const tableItem of collection) {
        tableItem.isExpanded = false
        this.expandedCache.delete(tableItem)
      }
      if (!filter) {
        this.expanded = false
      }
    },
    onTableItemExpanded (tableItem) {
      this.expandedCache.add(tableItem)
      this.expanded = true
    },
    onTableItemCollapsed (tableItem) {
      this.expandedCache.delete(tableItem)
    },
    onTableItemCreated (tableItem) {
      Vue.set(this.tableItemCache, tableItem.$props.node.id, tableItem)
      if (tableItem.isExpanded) {
        this.expandedCache.add(tableItem)
      }
    },
    onTableItemDestroyed (tableItem) {
      // make sure the item is removed from all caches, otherwise we will have a memory leak
      Vue.delete(this.tableItemCache, tableItem.$props.node.id)
      this.expandedCache.delete(tableItem)
      this.activeCache.delete(tableItem)
    },
    onTableItemClicked (tableItem) {
      if (this.activable) {
        if (!this.multipleActive) {
          // only one item can be active, so make sure everything else that was active is now !active
          for (const cached of this.activeCache) {
            if (cached !== tableItem) {
              cached.active = false
            }
          }
          // empty cache
          this.activeCache.clear()
        }

        tableItem.active = !tableItem.active
        if (tableItem.active) {
          this.activeCache.add(tableItem)
        }
      }
    }
  }
}
</script>
