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

import {
  createCyclePointNode,
  createFamilyProxyNode,
  createJobNode,
  createTaskProxyNode
} from '@/components/cylc/tree/tree-nodes'
import { populateTreeFromGraphQLData } from '@/components/cylc/tree/index'
import store from '@/store/'
import AlertModel from '@/model/Alert.model'

/**
 * Helper object used to iterate pruned deltas data.
 */
const PRUNED = {
  jobs: 'removeJob',
  taskProxies: 'removeTaskProxy',
  familyProxies: 'removeFamilyProxy'
}

/**
 * @typedef {Object} DeltasPruned
 * @property {Array<string>} taskProxies - IDs of task proxies removed
 * @property {Array<string>} familyProxies - IDs of family proxies removed
 * @property {Array<string>} jobs - IDs of jobs removed
 */

/**
 * Deltas pruned.
 *
 * @param {DeltasPruned} pruned - deltas pruned
 * @param {CylcTree} tree
 */
function applyDeltasPruned (pruned, tree) {
  Object.keys(PRUNED).forEach(prunedKey => {
    if (pruned[prunedKey]) {
      for (const id of pruned[prunedKey]) {
        try {
          tree[PRUNED[prunedKey]](id)
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Error applying pruned-delta, will continue processing the remaining data', error, id)
          store.dispatch('setAlert', new AlertModel('Error applying pruned-delta, see browser console logs for more. Please reload your browser tab to retrieve the full flow state', null, 'error'))
        }
      }
    }
  })
}

/**
 * Helper object used to iterate added deltas data.
 */
const ADDED = {
  cyclePoints: [createCyclePointNode, 'addCyclePoint'],
  familyProxies: [createFamilyProxyNode, 'addFamilyProxy'],
  taskProxies: [createTaskProxyNode, 'addTaskProxy'],
  jobs: [createJobNode, 'addJob']
}

/**
 * @typedef {Object} DeltasAdded
 * @property {Object} workflow
 * @property {Array<Object>} cyclePoints
 * @property {Array<Object>} familyProxies
 * @property {Array<Object>} taskProxies
 * @property {Array<Object>} jobs
 */

/**
 * Deltas added.
 *
 * @param {DeltasAdded} added
 * @param {CylcTree} tree
 */
function applyDeltasAdded (added, tree) {
  Object.keys(ADDED).forEach(addedKey => {
    if (added[addedKey]) {
      added[addedKey].forEach(addedData => {
        try {
          const createNodeFunction = ADDED[addedKey][0]
          const treeFunction = ADDED[addedKey][1]
          const node = createNodeFunction(addedData)
          tree[treeFunction](node)
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Error applying added-delta, will continue processing the remaining data', error, addedData)
          store.dispatch('setAlert', new AlertModel('Error applying added-delta, see browser console logs for more. Please reload your browser tab to retrieve the full flow state', null, 'error'))
        }
      })
    }
  })
}

/**
 * Helper object used to iterate updated deltas data.
 */
const UPDATED = {
  familyProxies: [createFamilyProxyNode, 'updateFamilyProxy'],
  taskProxies: [createTaskProxyNode, 'updateTaskProxy'],
  jobs: [createJobNode, 'updateJob']
}

/**
 * @typedef {Object} DeltasUpdated
 * @property {Array<Object>} familyProxies
 * @property {Array<Object>} taskProxies
 * @property {Array<Object>} jobs
 */

/**
 * Deltas updated.
 *
 * @param updated {DeltasUpdated} updated
 * @param {CylcTree} tree
 */
function applyDeltasUpdated (updated, tree) {
  Object.keys(UPDATED).forEach(updatedKey => {
    if (updated[updatedKey]) {
      updated[updatedKey].forEach(updatedData => {
        try {
          const updateNodeFunction = UPDATED[updatedKey][0]
          const treeFunction = UPDATED[updatedKey][1]
          const node = updateNodeFunction(updatedData)
          tree[treeFunction](node)
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Error applying updated-delta, will continue processing the remaining data', error, updatedData)
          store.dispatch('setAlert', new AlertModel('Error applying updated-delta, see browser console logs for more. Please reload your browser tab to retrieve the full flow state', null, 'error'))
        }
      })
    }
  })
}

/**
 * @typedef {Object} Deltas
 * @property {string} id
 * @property {boolean} shutdown
 * @property {?DeltasAdded} added
 * @property {?DeltasUpdated} updated
 * @property {?DeltasPruned} pruned
 */

/**
 * Handle the initial data burst of deltas. Should create a tree given a workflow from the GraphQL
 * data. This tree contains the base structure to which the deltas are applied to.
 *
 * @param {Deltas} deltas - GraphQL deltas
 * @param {CylcTree} tree - Tree object backed by an array and a Map
 */
function handleInitialDataBurst (deltas, tree) {
  const workflow = deltas.added.workflow
  // A workflow (e.g. five) may not have any families as 'root' is filtered
  workflow.familyProxies = workflow.familyProxies || []
  populateTreeFromGraphQLData(tree, workflow)
  tree.tallyCyclePointStates()
}

/**
 * Handle the deltas. This function receives the new set of deltas, and the tree object. It is assumed
 * the tree has been correctly created. Except for family proxies, it is expected that other elements
 * are only created via the deltas.added attribute.
 *
 * Family proxies are a special case, due to hierarchy within families, so we have no easy way to grab
 * the first family from the top of the hierarchy in the deltas.
 *l
 * @param {Deltas} deltas - GraphQL deltas
 * @param {CylcTree} tree - Tree object backed by an array and a Map
 */
function handleDeltas (deltas, tree) {
  if (deltas.pruned) {
    applyDeltasPruned(deltas.pruned, tree)
  }
  if (deltas.added) {
    applyDeltasAdded(deltas.added, tree)
  }
  if (deltas.updated) {
    applyDeltasUpdated(deltas.updated, tree)
  }
  // if added, removed, or updated deltas, we want to re-calculate the cycle point states now
  if (deltas.pruned || deltas.added || deltas.updated) {
    tree.tallyCyclePointStates()
  }
}

/**
 * @param {?CylcTree} tree
 * @param {?Deltas} deltas
 */
export function applyDeltas (tree, deltas) {
  if (deltas && tree) {
    // first we check whether it is a shutdown response
    if (deltas.shutdown) {
      tree.clear()
      return
    }
    if (tree.isEmpty()) {
      // When the tree is null, we have two possible scenarios:
      //   1. This means that we will receive our initial data burst in deltas.added.workflow
      //      which we can use to create the tree structure.
      //   2. Or this means that after the shutdown (when we delete the tree), we received a delta.
      //      In this case we don't really have any way to fix the tree.
      // In both cases, actually, the user has little that s/he could do, besides refreshing the
      // page. So we fail silently and wait for a request with the initial data.
      if (!deltas.added || !deltas.added.workflow) {
        // eslint-disable-next-line no-console
        console.error('Received a delta before the workflow initial data burst')
        store.dispatch('setAlert', new AlertModel('Received a delta before the workflow initial data burst. Please reload your browser tab to retrieve the full flow state', null, 'error'))
        return
      }
      try {
        handleInitialDataBurst(deltas, tree)
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error applying initial data burst for deltas', error, deltas)
        store.dispatch('setAlert', new AlertModel('Error applying initial data burst for deltas. Please reload your browser tab to retrieve the full flow state', null, 'error'))
        throw error
      }
    } else {
      // the tree was created, and now the next messages should contain
      // 1. new data added under deltas.added (but not in deltas.added.workflow)
      // 2. data updated in deltas.updated
      // 3. data pruned in deltas.pruned
      try {
        handleDeltas(deltas, tree)
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Unexpected error applying deltas', error, deltas)
        throw error
      }
    }
  } else {
    throw Error('Workflow tree subscription did not return data.deltas')
  }
}
