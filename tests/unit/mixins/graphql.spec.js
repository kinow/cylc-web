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

import { expect } from 'chai'
import graphqlMixin from '@/mixins/graphql'
import { shallowMount } from '@vue/test-utils'
import store from '@/store'

describe('GraphQL mixin', () => {
  const mountFunction = options => {
    return shallowMount({
      mixins: [graphqlMixin],
      render () {},
      store,
      ...options
    })
  }
  it('should compute the workflow ID and GraphQL variables', () => {
    const username = 'cylc'
    const workflow = 'test'
    store.state.user.user = {
      username: 'cylc'
    }
    const component = mountFunction({
      data () {
        return {
          workflowName: workflow
        }
      }
    })
    expect(component.vm.workflowId).to.equal(`${username}|${workflow}`)
    expect(component.vm.variables).to.deep.equal({ workflowId: `${username}|${workflow}` })
  })
})
