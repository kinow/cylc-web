/**
 * Vue Router
 *
 * @library
 *
 * https://router.vuejs.org/en/
 */

// Lib imports
import Vue from 'vue'
import Router from 'vue-router'
import Meta from 'vue-meta'
import NProgress from 'nprogress'
import store from '@/store'
import { UserService } from 'user-service'

import '../../node_modules/nprogress/nprogress.css'

// Routes
import paths from './paths'

function route (path, view, name, meta, alias) {
  return {
    name: name || view,
    meta,
    path,
    alias,
    component: (resolve) => import(
      `@/views/${view}.vue`
    ).then(resolve)
  }
}

Vue.use(Router)

// Create a new router
const router = new Router({
  mode: 'hash',
  routes: paths.map(path => route(path.path, path.view, path.name, path.meta, path.alias)),
  //  .concat([{ path: '*', redirect: '/dashboard' }]),
  scrollBehavior (to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    if (to.hash) {
      return { selector: to.hash }
    }
    return { x: 0, y: 0 }
  }
})

Vue.use(Meta)

router.beforeResolve((to, from, next) => {
  NProgress.start()
  if (to.name) {
    if (['Tree', 'Dot'].includes(to.name)) {
      // When a workflow is being displayed, we set the title to a
      // different value.
      store.commit('app/setTitle', to.params.name)
    } else {
      store.commit('app/setTitle', to.name)
    }
    store.dispatch('setAlert', null).then(() => {})
  }
  next()
})

router.beforeEach((to, from, next) => {
  if (!store.state.user.user) {
    UserService.getUserProfile().then(() => {
      next()
    })
  } else {
    next()
  }
})

router.afterEach(() => {
  NProgress.done()
})

export default router
