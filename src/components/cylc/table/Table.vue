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
    </v-row>
    <!-- Table component -->
<!--    <div>-->
<!--      <table style="width:100%">-->
<!--        <tr style="text-align:left">-->
<!--          <th>First Name</th>-->
<!--          <th>Last Name</th>-->
<!--          <th>Age</th>-->
<!--        </tr>-->
<!--        <tr>-->
<!--          <td>Steven</td>-->
<!--          <td>Morrissey</td>-->
<!--          <td>61</td>-->
<!--        </tr>-->
<!--        <tr>-->
<!--          <td>Johnny</td>-->
<!--          <td>Marr</td>-->
<!--          <td>57</td>-->
<!--        </tr>-->
<!--        <tr>-->
<!--          <td>Freddie</td>-->
<!--          <td>Mercury</td>-->
<!--          <td>45</td>-->
<!--        </tr>-->
<!--        <tr>-->
<!--          <td>Brian</td>-->
<!--          <td>May</td>-->
<!--          <td>73</td>-->
<!--        </tr>-->
<!--        <tr>-->
<!--        <td>Roger</td>-->
<!--        <td>Taylor</td>-->
<!--        <td>71</td>-->
<!--        </tr>-->
<!--        <tr>-->
<!--        <td>Carl</td>-->
<!--        <td>Sagan</td>-->
<!--        <td>62</td>-->
<!--        </tr>-->
<!--      </table>-->
<!--    </div>-->
    <table>
      <thead>
        <tr>
          <th>Task</th>
          <th>Cyclepoint</th>
          <th>Batch System</th>
        </tr>
      </thead>
      <tr
        v-for="task of this.tasks"
        :key="task.id"
      >
        <!-- HTML goes here… with some JS/CSS/etc -->
        <td>{{ task.id }}</td>
        <td>{{ task.id }}</td>
        <td>{{ task.id }}</td>
      </tr>
    </table>
  </v-container>
</template>

<script>
import TaskState from '@/model/TaskState.model'
import Task from '@/components/cylc/Task'
import clonedeep from 'lodash.clonedeep'

export default {
  name: 'TableComponent',
  props: {
    tasks: {
      type: Array,
      required: true
    },
    hoverable: Boolean,
    activable: Boolean,
    multipleActive: Boolean,
    filterable: {
      type: Boolean,
      default: true
    }
  },
  components: {
    Task
  },
  data () {
    return {
      tasksFilter: {
        name: '',
        states: []
      },
      activeFilters: null,
      maximumTasks: 4
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
    }
  }
}
</script>
