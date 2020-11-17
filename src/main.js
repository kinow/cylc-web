/**
 * Copyright (C) NIWA & British Crown (Met Office) & Contributors.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'

// Plugins
import './plugins'
import vuetify from './plugins/vuetify'

// Application imports
import App from './App'
import i18n from '@/i18n'
import router from '@/router'
import store from '@/store'

// GraphQL client
/**
 * @type SubscriptionWorkflowService
 */
import SubscriptionWorkflowService from 'workflow-service'
import { createGraphQLUrls, createSubscriptionClient } from '@/utils/graphql'
import CylcObjectPlugin from '@/components/cylc/cylcObject/plugin'

// WorkflowService singleton available application-wide
// On the offline mode, we do not have a WebSocket link, so we must create a null SubscriptionClient to use an empty link
const graphQLUrls = createGraphQLUrls()
let subscriptionClient = null
if (process.env.NODE_ENV !== 'offline') {
  subscriptionClient = createSubscriptionClient(graphQLUrls.wsUrl)
}
const workflowService = new SubscriptionWorkflowService(graphQLUrls.httpUrl, subscriptionClient)
Vue.prototype.$workflowService = workflowService

Vue.config.productionTip = false

// load Cylc Object mutations plug-in

Vue.use(CylcObjectPlugin)

/* eslint-disable no-new */
const app = new Vue({
  i18n,
  router,
  store,
  vuetify,
  render (h) {
    return h(App, {
      props: {
        baseUrl: this.$el.attributes['data-base-url'].value
      }
    })
  }
}).$mount('#app')
// e2e tests use the offline mode, so here we expose the Vue.js app so Cypress can access it programmatically
// e.g. window.app.$store and window.app.$workflowService.
// Ref: https://www.cypress.io/blog/2017/11/28/testing-vue-web-application-with-vuex-data-store-and-rest-backend/
if (['test', 'offline'].includes(process.env.NODE_ENV)) {
  window.app = app
}
