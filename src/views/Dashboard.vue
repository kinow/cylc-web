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
    fluid
    grid-list
    class="c-dashboard mt-4"
  >
    <v-layout wrap>
      <v-flex xs12 md6 lg6>
        <p class="display-1">Workflows</p>
        <v-data-table
          :headers="workflowsHeader"
          :items="workflowsTable"
          :loading="isLoading"
          hide-default-footer
          hide-default-header
        >
          <v-progress-linear slot="progress" color="grey" indeterminate></v-progress-linear>
          <!-- TODO: remove it if the linter is fixed later #510 -->
          <!-- eslint-disable-next-line vue/valid-v-slot -->
          <template v-slot:item.count="{ item }">
            <v-skeleton-loader
              :loading="isLoading"
              :max-width="50"
              type="table-cell"
              tile
              >
                <span class="headline font-weight-light">{{ item.count }}</span>
            </v-skeleton-loader>
          </template>
          <!-- TODO: remove it if the linter is fixed later #510 -->
          <!-- eslint-disable-next-line vue/valid-v-slot -->
          <template v-slot:item.text="{ item }">
            <span class="title font-weight-light">{{ item.text }}</span>
          </template>
        </v-data-table>
      </v-flex>
      <v-flex xs12 md6 lg6>
        <p class="display-1">Events</p>
        <v-data-table
          :headers="eventsHeader"
          :items="events"
          hide-default-footer
          hide-default-header
        >
          <!-- TODO: remove it if the linter is fixed later #510 -->
          <!-- eslint-disable-next-line vue/valid-v-slot -->
          <template v-slot:item.id="{ item }">
            <span class="title font-weight-light">{{ item.id }}</span>
          </template>
          <!-- TODO: remove it if the linter is fixed later #510 -->
          <!-- eslint-disable-next-line vue/valid-v-slot -->
          <template v-slot:item.text="{ item }">
            <span class="title font-weight-light">{{ item.text }}</span>
          </template>
          <template v-slot:no-data>
            <td class="title">No events</td>
          </template>
        </v-data-table>
      </v-flex>
    </v-layout>
    <v-divider />
    <v-layout wrap>
      <v-flex xs12 md6 lg6>
        <v-list three-line>
          <v-list-item to="/workflows">
            <v-list-item-avatar size="60" style="font-size: 2em;">
              <v-icon large>{{ svgPaths.table }}</v-icon>
            </v-list-item-avatar>
            <v-list-item-content>
              <v-list-item-title class="title font-weight-light">
                Workflows Table
              </v-list-item-title>
              <v-list-item-subtitle>
                View name, host, port, etc. of your workflows
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
          <v-list-item to="/user-profile">
            <v-list-item-avatar size="60" style="font-size: 2em;">
              <v-icon large>{{ svgPaths.settings }}</v-icon>
            </v-list-item-avatar>
            <v-list-item-content>
              <v-list-item-title class="title font-weight-light">
                Settings
              </v-list-item-title>
              <v-list-item-subtitle>
                View your Hub permissions, and alter user preferences
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
          <v-list-item :href=hubUrl>
            <v-list-item-avatar size="60" style="font-size: 2em;">
              <v-icon large>{{ svgPaths.hub }}</v-icon>
            </v-list-item-avatar>
            <v-list-item-content>
              <v-list-item-title class="title font-weight-light">
                Cylc Hub
              </v-list-item-title>
              <v-list-item-subtitle>
                Visit the Hub to manage your running UI Servers
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-flex>
      <v-flex xs12 md6 lg6>
        <v-list three-line>
          <v-list-item href="#/guide">
            <v-list-item-avatar size="60" style="font-size: 2em;">
              <v-icon large>{{ svgPaths.quickstart }}</v-icon>
            </v-list-item-avatar>
            <v-list-item-content>
              <v-list-item-title class="title font-weight-light">
                Cylc UI Quickstart
              </v-list-item-title>
              <v-list-item-subtitle>
                Learn how to use the Cylc UI
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
          <!-- TODO: change from latest to stable once out of beta -->
          <v-list-item href="https://cylc.github.io/cylc-doc/latest/html/suite-design-guide/index.html">
            <v-list-item-avatar size="60" style="font-size: 2em;">
              <v-icon large>{{ svgPaths.workflow }}</v-icon>
            </v-list-item-avatar>
            <v-list-item-content>
              <v-list-item-title class="title font-weight-light">
                Workflow Design Guide
              </v-list-item-title>
              <v-list-item-subtitle>
                How to make complex Cylc and Rose workflows simpler and easier to maintain
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
          <!-- TODO: change from latest to stable once out of beta -->
          <v-list-item href="https://cylc.github.io/cylc-doc/latest/html/index.html">
            <v-list-item-avatar size="60" style="font-size: 2em;">
              <v-icon large>{{ svgPaths.documentation }}</v-icon>
            </v-list-item-avatar>
            <v-list-item-content>
              <v-list-item-title class="title font-weight-light">
                Documentation
              </v-list-item-title>
              <v-list-item-subtitle>
                The complete Cylc documentation
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
import mixin from '@/mixins/index'
import { mapState } from 'vuex'
import { createUrl } from '@/utils/urls'
import { DASHBOARD_QUERY } from '@/graphql/queries'
import { mdiTable, mdiCog, mdiHubspot, mdiBook, mdiBookOpenVariant, mdiBookMultiple } from '@mdi/js'
import WorkflowState from '@/model/WorkflowState.model'

const QUERIES = {
  root: DASHBOARD_QUERY
}

export default {
  mixins: [mixin],
  metaInfo () {
    return {
      title: this.getPageTitle('App.dashboard')
    }
  },
  data () {
    return {
      viewID: '',
      subscriptions: {},
      isLoading: true,
      workflowsHeader: [
        {
          text: 'Count',
          sortable: false,
          value: 'count'
        },
        {
          text: 'Text',
          sortable: false,
          value: 'text'
        }
      ],
      eventsHeader: [
        {
          text: 'ID',
          sortable: false,
          value: 'id'
        },
        {
          text: 'Event',
          sortable: false,
          value: 'text'
        }
      ],
      events: [],
      svgPaths: {
        table: mdiTable,
        settings: mdiCog,
        hub: mdiHubspot,
        quickstart: mdiBook,
        workflow: mdiBookOpenVariant,
        documentation: mdiBookMultiple
      },
      hubUrl: createUrl('/hub/home', false, true)
    }
  },
  computed: {
    ...mapState('workflows', ['workflows']),
    workflowsTable () {
      const table = Object.fromEntries(WorkflowState.enumValues.map(state => [state.name, 0]))
      for (const workflow of this.workflows) {
        if (Object.prototype.hasOwnProperty.call(table, workflow.status)) {
          table[workflow.status] += 1
        }
      }
      return WorkflowState.enumValues.map(state => {
        return {
          text: state.name.charAt(0).toUpperCase() + state.name.slice(1),
          count: table[state.name]
        }
      }).sort((left, right) => {
        return left.text.localeCompare(right.text)
      })
    }
  },
  created () {
    this.viewID = `Dashboard: ${Math.random()}`
    this.$workflowService.register(
      this,
      {
        activeCallback: this.setActive
      }
    )
    this.subscribe('root')
  },
  beforeRouteLeave (to, from, next) {
    this.$workflowService.unregister(this)
    next()
  },
  methods: {
    subscribe (queryName) {
      /**
       * Subscribe this view to a new GraphQL query.
       * @param {string} queryName - Must be in QUERIES.
       */
      if (!(queryName in this.subscriptions)) {
        this.subscriptions[queryName] =
          this.$workflowService.subscribe(
            this,
            QUERIES[queryName].replace('WORKFLOW_ID', this.workflowName)
          )
      }
    },

    unsubscribe (queryName) {
      /**
       * Unsubscribe this view to a new GraphQL query.
       * @param {string} queryName - Must be in QUERIES.
       */
      if (queryName in this.subscriptions) {
        this.$workflowService.unsubscribe(
          this.subscriptions[queryName]
        )
      }
    },

    setActive (isActive) {
      /** Toggle the isLoading state.
       * @param {bool} isActive - Are this views subs active.
       */
      this.isLoading = !isActive
    }
  }
}
</script>
