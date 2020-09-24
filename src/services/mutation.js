/**
 * Copyright (C) NIWA & British Crown (Met Office) & Contributors.
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

import gql from 'graphql-tag'
import {
  getIntrospectionQuery as getGraphQLIntrospectionQuery,
  print
} from 'graphql'
// import { constructMutation } from '@/utils/graphql'
import {
  mutationMapping
} from '@/components/cylc/cylcObject'
import {
  getNullValue
} from '@/utils/graphql'

export function tokensToArgs (mutation, tokens) {
  const ret = {}
  for (const token in tokens) {
    for (const arg of mutation.args) {
      if (arg.cylcObject && arg.cylcObject === token) {
        ret[arg.name] = tokens[token]
      }
    }
  }
  return ret
}

function camelToWords (camel) {
  const result = camel.replace(/([A-Z])/g, ' $1')
  return result.charAt(0).toUpperCase() + result.slice(1)
}

export function processMutations (mutations, types) {
  let descLines = null
  for (const mutation of mutations) {
    descLines = mutation.description.split(/\n+/)
    mutation._title = camelToWords(mutation.name)
    mutation._shortDescription = descLines[0]
    mutation._help = descLines.slice(1).join('\n')
    processArguments(mutation, types)
  }
}

function processArguments (mutation, types) {
  let pointer = null
  let multiple = null
  let required = null
  let cylcObject = null
  for (const arg of mutation.args) {
    pointer = arg.type
    multiple = false
    required = false
    cylcObject = null
    while (pointer) {
      // walk down the nested type tree
      if (pointer.kind === 'LIST') {
        multiple = true
      } else if (pointer.kind === 'NON_NULL') {
        required = true
      } else if (pointer.name) {
        for (const objectName in mutationMapping) {
          for (
            const [type, impliesMultiple] of mutationMapping[objectName]
          ) {
            if (pointer.name === type) {
              cylcObject = objectName
              if (impliesMultiple) {
                multiple = true
              }
              break
            }
          }
          if (cylcObject) {
            break
          }
        }
        if (cylcObject) {
          break
        }
      }
      pointer = pointer.ofType
    }
    arg._title = camelToWords(arg.name)
    arg._cylcObject = cylcObject
    arg._multiple = multiple
    arg._required = required
    if (arg.defaultValue) {
      arg._default = JSON.parse(arg.defaultValue)
    } else {
      arg._default = getNullValue(arg.type, types)
    }
  }
}

export function listMutations (mutations) {
  const names = []
  if (!this.mutations) {
    return names
  }
  for (const mutation of this.mutations) {
    names.push(mutation.name)
  }
  return names
}

export function getIntrospectionQuery () {
  // we are only interested in mutations so can make our life
  // a little easier by restricting the scope of the default
  // introspection query
  const fullIntrospection = gql(getGraphQLIntrospectionQuery())
  const mutationQuery = gql(`
    query {
      __schema {
        mutationType {
          ...FullType
        }
        types {
          ...FullType
        }
      }
    }
  `)
  // TODO: this returns all types, we only need certain ones

  // NOTE: we are converting to string form then re-parsing
  // back to a query, as something funny happens when you
  // try to modify the gql objects by hand.
  return gql(
    // the query we actually want to run
    print(mutationQuery.definitions[0]) +
    // the fragments which power it
    print(fullIntrospection.definitions[1]) +
    print(fullIntrospection.definitions[2]) +
    print(fullIntrospection.definitions[3])
  )
}

export function getMutation (name) {
  if (name === 'sampleMutation') {
    return this.sampleMutation
  }
  for (const mutation of this.mutations) {
    if (mutation.name === name) {
      return mutation
    }
  }
}

/* Return names of mutations which relate to the provided object type.
 */
export function filterAssociations (cylcObject, tokens, mutations) {
  const satisfied = []
  const all = []
  let requiresInfo = false
  let applies = false
  let mutation = null
  for (const mutationName in mutations) {
    requiresInfo = false
    applies = false
    mutation = mutations[mutationName]
    for (const arg of mutation.args) {
      if (arg._cylcObject) {
        if (arg._cylcObject === cylcObject) {
          applies = true
        }
        if (tokens[arg._cylcObject]) {
          // pass
        } else {
          requiresInfo = true
        }
      } else if (arg._required) {
        requiresInfo = true
      }
    }
    if (!applies) {
      continue
    }
    all.push(mutation)
    if (!requiresInfo) {
      satisfied.push(mutation)
    }
  }
  return [satisfied, all]
}
