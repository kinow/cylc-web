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
import { merge } from '@/graphql/merge'
import gql from 'graphql-tag'
import { print } from 'graphql/language/printer'

describe('merge', () => {
  it('should merge two subscriptions correctly', () => {
    const queryA = gql`subscription A {
      workflows {
        id
      }
    }`
    const queryB = gql`subscription B {
      workflows {
        name
      }
    }`
    const newQuery = print(merge(queryA, queryB))
    const expectedQuery = print(gql`subscription MergedAB {
      workflows {
        id
        name
      }
    }    
    `)
    expect(newQuery).to.equal(expectedQuery)
  })
})
