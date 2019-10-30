<template>
  <v-container
    fill-height
    fluid
    grid-list-xl
  >
    <v-layout
      justify-center
      wrap
    >
      <v-flex
        md12
      >
        <material-card
          :title="$t('Workflows.tableHeader')"
          :elevation="0"
          :flat="true"
          color="grey"
        >
          <v-data-table
            :headers="headers"
            :items="workflows"
            :loading="isLoading"
          >
            <template slot="no-data" v-if="!isLoading">
              <v-alert
                :value="true"
                color="error"
                icon="warning">
                No workflows found for the current user
              </v-alert>
            </template>
            <template
              slot="headerCell"
              slot-scope="{ header }"
            >
              <span
                class="subheading font-weight-light text-success text--darken-3"
                v-text="header.text"
              />
            </template>
            <v-progress-linear slot="progress" color="green" indeterminate></v-progress-linear>
            <template
              slot="item"
              slot-scope="{ item }"
            >
              <tr>
                <td>{{ item.name }}</td>
                <td>{{ item.owner }}</td>
                <td>{{ item.host }}</td>
                <td>{{ item.port }}</td>
                <td class="justify-center">
                  <v-icon
                      small
                      class="mr-2"
                      @click="viewWorkflow(item)"
                  >
                    mdi-table-edit
                  </v-icon>
                  <v-icon
                      small
                      class="mr-2"
                      @click="$router.push({ path: `/dot/${item.name}` })"
                  >
                    mdi-dots-horizontal-circle-outline
                  </v-icon>
                </td>
              </tr>
            </template>
          </v-data-table>
        </material-card>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
import { workflowService } from 'workflow-service'
import { mapState } from 'vuex'
import { mixin } from '@/mixins/index'
import i18n from '@/i18n'

// query to retrieve all workflows
const QUERIES = {
  root: `
      {
        workflows {
          id
          name
          owner
          host
          port
        }
      }
    `
}

export default {
  mixins: [mixin],
  metaInfo () {
    return {
      title: this.getPageTitle('App.workflows')
    }
  },

  data: () => ({
    viewID: 'GScan: ' + Math.random(),
    subscriptions: {},
    isLoading: true,
    headers: [
      {
        sortable: true,
        text: i18n.t('Workflows.tableColumnName'),
        value: 'name'
      },
      {
        sortable: true,
        text: i18n.t('Workflows.tableColumnOwner'),
        value: 'owner'
      },
      {
        sortable: true,
        text: i18n.t('Workflows.tableColumnHost'),
        value: 'host'
      },
      {
        sortable: false,
        text: i18n.t('Workflows.tableColumnPort'),
        value: 'port'
      },
      {
        sortable: false,
        text: i18n.t('Workflows.tableColumnActions'),
        value: 'actions'
      }
    ]
  }),

  computed: {
    ...mapState('workflows', ['workflows'])
  },

  created () {
    workflowService.register(
      this,
      {
        activeCallback: this.setActive
      }
    )
    this.subscribe('root')
  },

  beforeDestroy () {
    workflowService.unregister(this)
  },

  methods: {
    viewWorkflow (workflow) {
      this.$router.push({ path: `/workflows/${workflow.name}` })
    },

    subscribe (queryName) {
      const id = workflowService.subscribe(
        this,
        QUERIES[queryName],
        this.setActive
      )
      if (!(queryName in this.subscriptions)) {
        this.subscriptions[queryName] = {
          id,
          active: false
        }
      }
    },

    unsubscribe (queryName) {
      if (queryName in this.subscriptions) {
        workflowService.unsubscribe(
          this.subscriptions[queryName].id
        )
      }
    },

    setActive (isActive) {
      this.isLoading = !isActive
    }
  }
}
</script>
