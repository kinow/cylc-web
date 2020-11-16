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
  <div class="treeitem" v-show="filtered">
    <div
        :class="getNodeClass()"
        :style="getNodeStyle()"
    >
      <!-- the node's left icon; used for expand/collapse -->
      <v-flex
        class="node-expand-collapse-button"
        shrink
        v-if="hasChildren"
        @click="typeClicked"
        :style="getTypeStyle()"
      >{{ isExpanded ? '&#9661;' : '&#9655;' }}</v-flex>
      <!-- the node value -->
      <!-- TODO: revisit these values that can be replaced by constants later (and in other components too). -->
      <div :class="getNodeDataClass()" @click="nodeClicked" v-if="node.type === 'cyclepoint'">
        <task
          v-cylc-object
          :id="node.node.id"
          :status="node.node.state"
          :isHeld="node.node.isHeld"
          :progress=0
        />
        <span class="mx-1">{{ node.node.name }}</span>
      </div>
      <div :class="getNodeDataClass()" @click="nodeClicked" v-else-if="node.type === 'family-proxy'">
        <task
          v-cylc-object
          :id="node.node.id"
          :status="node.node.state"
          :isHeld="node.node.isHeld"
          :progress="node.node.progress"
        />
        <span class="mx-1">{{ node.node.name }}</span>
      </div>
      <div :class="getNodeDataClass()" @click="nodeClicked" v-else-if="node.type === 'task-proxy'">
        <task
          v-cylc-object
          :id="node.node.id"
          :status="node.node.state"
          :isHeld="node.node.isHeld"
          :progress="node.node.progress"
        />
        <span class="mx-1">{{ node.node.name }}</span>
        <div v-if="!isExpanded" class="node-summary">
          <!-- Task summary -->
          <job
            v-cylc-object
            v-for="(task, index) in node.children"
            :id="task.id"
            :key="`${task.id}-summary-${index}`"
            :status="task.node.state"
          />
        </div>
      </div>
      <div :class="getNodeDataClass()" v-else-if="node.type === 'job'">
        <div :class="getNodeDataClass()" @click="jobNodeClicked">
          <job
            v-cylc-object
            :id="node.node.id"
            :status="node.node.state"
          />
          <span class="mx-1">#{{ node.node.submitNum }}</span>
          <span class="grey--text">{{ node.node.host }}</span>
        </div>
        <!-- leaf node -->
      </div>
      <div :class="getNodeDataClass()" v-else>
        <span @click="nodeClicked" class="mx-1">{{ node.node.name }}</span>
      </div>
    </div>
    <div class="leaf" v-if="displayLeaf && node.type === 'job'">
      <div class="arrow-up" :style="getLeafTriangleStyle()"></div>
      <div class="leaf-data font-weight-light py-4 pl-2">
        <div v-for="leafProperty in leafProperties" :key="leafProperty.id" class="leaf-entry">
          <span class="px-4 leaf-entry-title">{{ leafProperty.title }}</span>
          <span class="grey--text leaf-entry-value">{{ node.node[leafProperty.property] }}</span>
        </div>
      </div>
    </div>
    <span v-show="isExpanded">
      <!-- component recursion -->
      <TreeItem
          v-for="child in sortedChildren(node.type, node.children)"
          ref="treeitem"
          :key="child.id"
          :node="child"
          :depth="depth + 1"
          :hoverable="hoverable"
          :initialExpanded="initialExpanded"
          v-on:tree-item-created="$listeners['tree-item-created']"
          v-on:tree-item-destroyed="$listeners['tree-item-destroyed']"
          v-on:tree-item-expanded="$listeners['tree-item-expanded']"
          v-on:tree-item-collapsed="$listeners['tree-item-collapsed']"
          v-on:tree-item-clicked="$listeners['tree-item-clicked']"
      ></TreeItem>
    </span>
  </div>
</template>

<script>
import Task from '@/components/cylc/Task'
import Job from '@/components/cylc/Job'
import { treeitem } from '@/mixins/treeitem'

/**
 * Offset used to move nodes to the right or left, to represent the nodes hierarchy.
 * @type {number} integer
 */
const NODE_DEPTH_OFFSET = 30

export default {
  name: 'TreeItem',
  mixins: [
    treeitem
  ],
  components: {
    task: Task,
    job: Job
  },
  props: {
    node: {
      type: Object,
      required: true
    },
    depth: {
      type: Number,
      default: 0
    },
    hoverable: Boolean,
    initialExpanded: {
      type: Boolean,
      default: true
    }
  },
  data () {
    return {
      active: false,
      selected: false,
      isExpanded: this.initialExpanded,
      leafProperties: [
        {
          title: 'host id',
          property: 'host'
        },
        {
          title: 'job id',
          property: 'batchSysJobId'
        },
        {
          title: 'batch sys',
          property: 'batchSysName'
        },
        {
          title: 'submit time',
          property: 'submittedTime'
        },
        {
          title: 'start time',
          property: 'startedTime'
        },
        {
          title: 'finish time',
          property: 'finishedTime'
        },
        {
          title: 'latest message',
          property: 'latestMessage'
        }
      ],
      displayLeaf: false,
      filtered: true
    }
  },
  computed: {
    hasChildren () {
      return this.node.children
    }
  },
  created () {
    this.$emit('tree-item-created', this)
  },
  beforeDestroy () {
    this.$emit('tree-item-destroyed', this)
  },
  beforeMount () {
    if (this.node.expanded !== undefined && this.node.expanded !== null) {
      this.isExpanded = this.node.expanded
      this.emitExpandCollapseEvent(this.isExpanded)
    }
  },
  methods: {
    typeClicked () {
      this.isExpanded = !this.isExpanded
      this.emitExpandCollapseEvent(this.isExpanded)
    },
    /**
     * Emits an event `tree-item-expanded` if `expanded` is true, or emits
     * `tree-item-collapsed` if `expanded` is false.
     * @param {boolean} expanded whether the node is expanded or not
     */
    emitExpandCollapseEvent (expanded) {
      if (expanded) {
        this.$emit('tree-item-expanded', this)
      } else {
        this.$emit('tree-item-collapsed', this)
      }
    },
    getTypeStyle () {
      const styles = {}
      if (this.hasChildren) {
        styles.cursor = 'pointer'
      }
      return styles
    },
    /**
     * Handler for when any node of the tree was clicked, except jobs.
     * @param {event} e event
     */
    nodeClicked (e) {
      this.$emit('tree-item-clicked', this)
    },
    /**
     * Handler for when a job node was clicked.
     * @param {event} e event
     */
    jobNodeClicked (e) {
      this.displayLeaf = !this.displayLeaf
    },
    getNodeStyle () {
      return {
        'padding-left': `${this.depth * NODE_DEPTH_OFFSET}px`
      }
    },
    /**
     * All nodes have the same padding-left. However, the job leaf node needs special care, as it will occupy the
     * whole content area.
     *
     * For this, we calculate it similarly to `getNodeStyle` but doing the reverse, to move the element to the
     * left, instead of moving it to the right. Using `depth` to calculate the exact location for the element.
     */
    getLeafTriangleStyle () {
      return {
        // we add half the depth offset to compensate and move the arrow under the job icon, the another 2px
        // just to center-align it
        'margin-left': `${(NODE_DEPTH_OFFSET / 2) + 2 + (this.depth * NODE_DEPTH_OFFSET)}px`
      }
    },
    getNodeClass () {
      return {
        node: true,
        'node--hoverable': this.hoverable,
        'node--active': this.active,
        'ml-3': true
      }
    },
    getNodeDataClass () {
      const classes = {}
      classes['node-data'] = true
      classes[`node-data-${this.node.type}`] = true
      return classes
    }
  }
}
</script>
