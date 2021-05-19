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

import { mapActions, mapState } from 'vuex'
/* eslint-disable no-unused-vars */
import User from '@/model/User.model'

/**
 * A mixin for application alerts.
 */
export default {
  computed: {
    /**
     * We use the user from the store to compute the workflow ID. The view
     * has only the workflow name from the Vue route. We then combine it
     * with the user name and the default divider '|' to create the workflow
     * ID.
     * @return {User}
     */
    ...mapState('user', ['user'])
  },
  methods: {
    /**
     * Create a UI alert.
     */
    ...mapActions(['setAlert'])
  }
}
