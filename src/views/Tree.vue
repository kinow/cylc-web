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
import treeViewMixin from '@/mixins/treeview'
import TreeComponent from '@/components/cylc/tree/Tree.vue'
import CylcTree from '@/components/cylc/tree/cylc-tree'
import CylcObjectMenu from '@/components/cylc/cylcObject/Menu'
import alertsMixin from '@/mixins/alerts'
import mixin from '@/mixins'
import graphqlMixin from '@/mixins/graphql'
import workflowViewMixin from '@/mixins/workflow-view'
import {
  CYCLEPOINT_DELTAS,
  FAMILY_PROXY_DELTAS,
  FRAGMENT_CYCLEPOINT_DATA,
  FRAGMENT_FAMILY_PROXY_DATA,
  FRAGMENT_JOB_DATA,
  FRAGMENT_TASK_PROXY_DATA,
  JOB_DELTAS,
  TASK_PROXY_DELTAS
} from '@/graphql/queries'

export default {
  mixins: [
    alertsMixin,
    mixin,
    graphqlMixin,
    workflowViewMixin,
    treeViewMixin
  ],

  name: 'Tree',

  components: {
    CylcObjectMenu,
    TreeComponent
  },

  data: () => ({
    fragments: {
      AddedData: {
        cyclePoint: CYCLEPOINT_DELTAS.added,
        familyProxy: FAMILY_PROXY_DELTAS.added,
        taskProxy: TASK_PROXY_DELTAS.added,
        job: JOB_DELTAS.added
      },
      UpdatedData: {
        cyclePoint: CYCLEPOINT_DELTAS.updated,
        familyProxy: FAMILY_PROXY_DELTAS.updated,
        taskProxy: TASK_PROXY_DELTAS.updated,
        job: JOB_DELTAS.updated
      },
      PrunedData: {
        familyProxy: FAMILY_PROXY_DELTAS.pruned,
        taskProxy: TASK_PROXY_DELTAS.pruned,
        job: JOB_DELTAS.pruned
      },
      CyclePointData: {
        cyclePoint: FRAGMENT_CYCLEPOINT_DATA
      },
      FamilyProxyData: {
        familyProxy: FRAGMENT_FAMILY_PROXY_DATA
      },
      TaskProxyData: {
        taskProxy: FRAGMENT_TASK_PROXY_DATA
      },
      JobData: {
        job: FRAGMENT_JOB_DATA
      }
    }
  }),
  computed: {
    /**
     * This is the CylcTree, which contains the hierarchical tree data structure.
     * It is created from the GraphQL data, with the only difference that this one
     * contains hierarchy, while the GraphQL is flat-ish.
     * @type {null|CylcTree}
     */
    tree () {
      const workflowNode = null
      const workflow = this.workflow
      const options = {
        cyclePointsOrderDesc: localStorage.cyclePointsOrderDesc ? JSON.parse(localStorage.cyclePointsOrderDesc) : CylcTree.DEFAULT_CYCLE_POINTS_ORDER_DESC
      }
      return new CylcTree(workflowNode, workflow, options)
    }
  }
}
</script>
