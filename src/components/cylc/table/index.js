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

// eslint-disable-next-line no-unused-vars
import CylcTable from '@/components/cylc/table/cylc-table'
import {
  containsTableData,
  createWorkflowNode,
  createCyclePointNode,
  createFamilyProxyNode,
  createTaskProxyNode,
  createJobNode
} from '@/components/cylc/table/table-nodes'

/**
 * Populate the given table using the also provided GraphQL workflow object.
 *
 * Every node has data, and a .name property used to display the node in the table in the UI.
 *
 * @param table {null|CylcTable} - A hierarchical table
 * @param workflow {null|Object} - GraphQL workflow object
 * @throws {Error} - If the workflow or table are either null or invalid (e.g. missing data)
 */
function populateTableFromGraphQLData (table, workflow) {
  if (!table || !workflow || !containsTableData(workflow)) {
    // throw new Error('You must provide valid data to populate the table!')
    // a stopped workflow is valid, but won't have anything that we can use
    // to populate the table, only workflow data and empty families
    return
  }
  // the workflow object gets augmented to become a valid node for the table
  const rootNode = createWorkflowNode(workflow)
  table.setWorkflow(rootNode)
  for (const cyclePoint of workflow.cyclePoints) {
    const cyclePointNode = createCyclePointNode(cyclePoint)
    table.addCyclePoint(cyclePointNode)
  }
  for (const familyProxy of workflow.familyProxies) {
    const familyProxyNode = createFamilyProxyNode(familyProxy)
    table.addFamilyProxy(familyProxyNode)
  }
  for (const taskProxy of workflow.taskProxies) {
    const taskProxyNode = createTaskProxyNode(taskProxy)
    table.addTaskProxy(taskProxyNode)
    // A TaskProxy could no jobs (yet)
    if (taskProxy.jobs) {
      for (const job of taskProxy.jobs) {
        const jobNode = createJobNode(job)
        table.addJob(jobNode)
      }
    }
  }
}

export {
  populateTableFromGraphQLData
}
