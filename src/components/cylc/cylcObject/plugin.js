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

import CylcObject from '@/components/cylc/cylcObject/CylcObject'

/**
 * Cylc Objects plug-in.
 */
export default {
  /**
   * Called when the Vue application is created, and this plug-in is loaded.
   * @param Vue {object} - Vue application
   * @param options {*} - options passed to the plug-in (if any)
   */
  install (Vue, options) {
    // We could...

    // register the CylcObject component globally (no need to import)
    Vue.component('cylc-object', CylcObject)

    // add a global directive
    Vue.directive('cylc-object', {
      bind (el, binding, vnode, oldVnode) {
        // define that a cylc-object will have an @click and automagically
        // trigger an event?
      }
    })

    // create a singleton in the application to listen for events
    Vue.prototype.$cylcObjectsMenu = {}
  }
}
