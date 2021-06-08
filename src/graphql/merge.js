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

// Code responsible for merging GraphQL queries.

import { DocumentNode } from 'graphql'
import {
  // eslint-disable-next-line no-unused-vars
  OperationDefinitionNode
} from 'graphql/language/ast'

/**
 * @param {DocumentNode} document
 * @returns {boolean}
 */
function isDocumentValid (document) {
  return document &&
    document instanceof DocumentNode &&
    document.definitions.length > 0
}

/**
 * @param {DocumentNode[]} definitions
 * @returns {OperationDefinitionNode|null}
 */
function getOperationNode (definitions) {
  const operations = definitions
    .filter(definition => definition.kind === 'OperationDefinition')
  return operations.length > 0 ? operations[0] : null
}

/**
 * @return {OperationDefinitionNode}
 */
function createNewQuery (operation = 'subscription') {
  return {
    kind: 'OperationDefinition',
    operation: operation,
    name: {
      kind: 'Name',
      value: 'Merged'
    },
    variableDefinitions: [],
    directives: [],
    selectionSet: {
      kind: 'SelectionSet',
      selections: []
    }
  }
}

/**
 * @param {DocumentNode[]} queries
 * @returns {OperationDefinitionNode}
 */
function merge (...queries) {
  if (queries.length < 2) {
    throw new Error(`You must provide at least 2 queries to be merged, ${queries.length} given`)
  }
  const newQuery = createNewQuery()
  for (const query of queries) {
    const operationNode = getOperationNode(query.definitions)
    if (!operationNode) {
      throw new Error(`Failed to find the operation node in query ${operationNode}`)
    }
    // We can only merge query and subscription documents, not mutations
    if (!['query', 'subscription'].includes(operationNode.operation)) {
      throw new Error(`Invalid query: ${operationNode}`)
    }
    // We can only merge OperationDefinition (e.g. it doesn't work to merge OperationDefinition + VariableDefinition for instance)
    if (newQuery.kind !== operationNode.kind) {
      throw new Error(`Queries kind must match, had ${newQuery.kind} and found ${operationNode.kind}`)
    }
    // We can only merge compatible operations (e.g. we cannot merge query + mutation)
    if (newQuery.operation && newQuery.operation !== operationNode.operation) {
      throw new Error(`Queries operations must match, had ${newQuery.operation} and found ${operationNode.operation}`)
    }
    // Aggregate all the selections in the queries (i.e. all fields & fragments).
    newQuery.selectionSet.selections.push(...operationNode.selectionSet.selections)

    // This will make the operation name something like 'MergedTreeTableGraph...'.
    newQuery.name.value += operationNode.name.value
  }
  return newQuery
}

export {
  isDocumentValid,
  merge
}
