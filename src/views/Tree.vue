<template>
  <div>
    <div class="c-tree">
      <tree
        :workflows="workflowTree"
        :hoverable="false"
        :activable="false"
        :multiple-active="false"
        :min-depth="1"
        ref="tree0"
        key="tree0"
      ></tree>
    </div>
  </div>
</template>

<script>
import { mixin } from '@/mixins/index'
import { mapGetters, mapState } from 'vuex'
import Tree from '@/components/cylc/tree/Tree'
import gql from 'graphql-tag'
import { WORKFLOW_DATA_FRAGMENT, TREE_DATA_FRAGMENT } from '@/graphql/queries'

export default {
  mixins: [mixin],

  props: {
    workflowName: {
      type: String,
      required: true
    }
  },

  components: {
    tree: Tree
  },

  metaInfo () {
    return {
      title: this.getPageTitle('App.workflow', { name: this.workflowName })
    }
  },

  data: () => ({
    viewID: '',
    subscriptions: {},
    isLoading: true
  }),

  computed: {
    ...mapGetters('workflows', ['workflowTree']),
    ...mapState('user', ['user'])
  },

  created () {
    this.viewID = `Tree(${this.workflowName}): ${Math.random()}`
    this.$workflowService.register(
      this,
      {
        activeCallback: this.setActive
      }
    )
    this.subscribe('root')
  },

  beforeDestroy () {
    this.$workflowService.unregister(this)
  },

  methods: {
    /**
     * Subscribe this view to a new GraphQL query.
     * @param {string} queryName - Must be in QUERIES.
     */
    subscribe (queryName) {
      if (!(queryName in this.subscriptions)) {
        const query = gql`
          subscription TreeView ($ids: [ID]) {
            workflows (ids: $ids) {
              ...workflowData
              ...treeData
            }
          }
          ${WORKFLOW_DATA_FRAGMENT}
          ${TREE_DATA_FRAGMENT}
        `
        const workflowId = `${this.user.username}|${this.workflowName}`
        const variables = {
          ids: [workflowId]
        }
        this.subscriptions[queryName] =
          this.$workflowService.subscribe(
            this,
            query,
            variables
          )
      }
    },

    /**
     * Unsubscribe this view to a new GraphQL query.
     * @param {string} queryName - Must be in QUERIES.
     */
    unsubscribe (queryName) {
      if (queryName in this.subscriptions) {
        this.$workflowService.unsubscribe(
          this.subscriptions[queryName]
        )
      }
    },

    /** Toggle the isLoading state.
     * @param {bool} isActive - Are this views subs active.
     */
    setActive (isActive) {
      this.isLoading = !isActive
    }
  }
}
</script>
