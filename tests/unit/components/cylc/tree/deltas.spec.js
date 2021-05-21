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
import { applyDeltas } from '@/components/cylc/tree/deltas'
import CylcTree, { FAMILY_ROOT } from '@/components/cylc/tree/cylc-tree'
import {
  createCyclePointNode, createFamilyProxyNode,
  createWorkflowNode
} from '@/components/cylc/tree/tree-nodes'
import sinon from 'sinon'
import TaskState from '@/model/TaskState.model'
import store from '@/store'

/**
 * Tests for the tree deltas module.
 */
describe('Deltas', () => {
  beforeEach(() => {
    sinon.stub(console, 'log')
  })
  afterEach(() => {
    sinon.restore()
  })
  const WORKFLOW_ID = 'cylc|workflow'
  it('Should skip if no deltas provided', () => {
    expect(() => applyDeltas(null, null)).to.throw(Error)
  })
  it('Should clear the tree if shutdown is found in the deltas', () => {
    const cylcTree = new CylcTree(createWorkflowNode({
      id: WORKFLOW_ID
    }))
    expect(cylcTree.lookup.size).to.equal(1)
    applyDeltas(cylcTree, {
      shutdown: true
    })
    expect(cylcTree.lookup.size).to.equal(0)
  })
  it('Should not tally the cycle point states unless deltas were provided', () => {
    // NOTE: tree is not empty, so we don't apply the initial burst of data to the tree!
    const cylcTree = new CylcTree(createWorkflowNode({
      id: WORKFLOW_ID
    }))
    const fakeTree = sinon.spy(cylcTree)
    applyDeltas(fakeTree, {
      id: WORKFLOW_ID
    })
    expect(fakeTree.tallyCyclePointStates.called).to.equal(false)
  })
  it('Should warn if the initial data burst has invalid data', () => {
    const sandbox = sinon.createSandbox()
    sandbox.stub(console, 'error')
    const cylcTree = new CylcTree()
    applyDeltas(cylcTree, {})
    expect(console.error.calledOnce).to.equal(true)
    sandbox.restore()
  })
  it('Should log to console and throw an error if it fails to handle deltas', () => {
    const sandbox = sinon.createSandbox()
    sandbox.stub(console, 'error')
    const deltasAdded = {
      id: WORKFLOW_ID,
      shutdown: false,
      added: {
        cyclePoints: [
          {
            cyclePoint: `${WORKFLOW_ID}|1`
          }
        ]
      }
    }
    const cylcTree = new CylcTree(createWorkflowNode({
      id: WORKFLOW_ID
    }))
    // let's force the tree to throw an error when adding cycle points, simulating a runtime exception
    sinon.stub(cylcTree, 'addCyclePoint').throws(Error)
    applyDeltas(cylcTree, deltasAdded)
    expect(console.error.calledOnce).to.equal(true)
    sandbox.restore()
    expect(store.state.alert.getText()).to.have.string('added-delta')
  })
  it('Should log to console and throw an error if it fails to handle deltas on the first data burst', () => {
    const sandbox = sinon.createSandbox()
    sandbox.stub(console, 'error')
    const deltasAdded = {
      id: WORKFLOW_ID,
      shutdown: false,
      added: {
        workflow: [
          {
            id: `user|${WORKFLOW_ID}`
          }
        ]
      }
    }
    const cylcTree = new CylcTree()
    sinon.stub(cylcTree, 'tallyCyclePointStates').throws(Error)
    // let's force the tree to throw an error when handling the first data burst, simulating a runtime exception
    expect(() => applyDeltas(cylcTree, deltasAdded)).to.throw(Error)
    expect(console.error.calledOnce).to.equal(true)
    sandbox.restore()
    expect(store.state.alert.getText()).to.have.string('initial data burst')
  })
  describe('Initial data burst', () => {
    let cylcTree
    beforeEach(() => {
      cylcTree = new CylcTree()
    })
    it('Should create the CylcTree structure using the initial data burst', () => {
      const deltasWithInitialDataBurst = {
        id: WORKFLOW_ID,
        shutdown: false,
        added: {
          workflow: {
            id: WORKFLOW_ID,
            cyclePoints: [],
            familyProxies: [],
            taskProxies: []
          }
        }
      }
      const fakeTree = sinon.spy(cylcTree)
      applyDeltas(fakeTree, deltasWithInitialDataBurst)
      expect(cylcTree.root.id).to.equal(WORKFLOW_ID)
      expect(fakeTree.tallyCyclePointStates.called).to.equal(true)
    })
    it('Should not log to console nor throw an error if it fails to handle the initial data burst', () => {
      const sandbox = sinon.createSandbox()
      sandbox.stub(console, 'error')
      const deltasWithInitialDataBurst = {
        id: WORKFLOW_ID,
        shutdown: false,
        added: {
          workflow: {
            id: WORKFLOW_ID,
            cyclePoints: [],
            familyProxies: []
            // taskProxies: [] < --- This means that the workflow is invalid, as it MUST have taskProxies (can be empty)
          }
        }
      }
      expect(() => applyDeltas(cylcTree, deltasWithInitialDataBurst)).to.not.throw(Error)
      expect(console.error.calledOnce).to.equal(false)
      sandbox.restore()
    })
  })
  describe('Added', () => {
    let cylcTree
    beforeEach(() => {
      cylcTree = new CylcTree(createWorkflowNode({
        id: WORKFLOW_ID
      }))
    })
    it('Should apply added deltas', () => {
      const cyclePointId = `${WORKFLOW_ID}|1`
      const deltasAdded = {
        id: WORKFLOW_ID,
        shutdown: false,
        added: {
          cyclePoints: [
            {
              id: cyclePointId,
              cyclePoint: '1'
            }
          ]
        }
      }
      const fakeTree = sinon.spy(cylcTree)
      applyDeltas(fakeTree, deltasAdded)
      expect(cylcTree.root.children[0].id).to.equal(cyclePointId)
      expect(fakeTree.tallyCyclePointStates.called).to.equal(true)
    })
  })
  describe('Updated', () => {
    let cylcTree
    let cyclePoint
    let familyProxy
    beforeEach(() => {
      cylcTree = new CylcTree(createWorkflowNode({
        id: WORKFLOW_ID
      }))
      cyclePoint = createCyclePointNode({
        id: `${WORKFLOW_ID}|1|root`,
        cyclePoint: '1'
      })
      cylcTree.addCyclePoint(cyclePoint)
      familyProxy = createFamilyProxyNode({
        id: `${WORKFLOW_ID}|${cyclePoint.node.name}|FAM`,
        state: TaskState.RUNNING.name,
        cyclePoint: cyclePoint.node.name,
        firstParent: {
          id: `${WORKFLOW_ID}|${cyclePoint.node.name}|${FAMILY_ROOT}`,
          name: FAMILY_ROOT
        }
      })
      cylcTree.addFamilyProxy(familyProxy)
    })
    it('Should apply updated deltas', () => {
      const deltasUpdated = {
        id: WORKFLOW_ID,
        shutdown: false,
        updated: {
          familyProxies: [
            {
              id: familyProxy.id,
              state: TaskState.FAILED.name
            }
          ]
        }
      }
      const fakeTree = sinon.spy(cylcTree)
      applyDeltas(fakeTree, deltasUpdated)
      expect(cylcTree.root.children[0].children[0].node.state).to.equal(TaskState.FAILED.name)
      expect(fakeTree.tallyCyclePointStates.called).to.equal(true)
    })
  })
  describe('Pruned', () => {
    let cylcTree
    let cyclePoint
    let familyProxy
    beforeEach(() => {
      cylcTree = new CylcTree(createWorkflowNode({
        id: WORKFLOW_ID
      }))
      cyclePoint = createCyclePointNode({
        id: `${WORKFLOW_ID}|1|root`,
        cyclePoint: '1'
      })
      cylcTree.addCyclePoint(cyclePoint)
      familyProxy = createFamilyProxyNode({
        id: `${WORKFLOW_ID}|${cyclePoint.node.name}|FAM`,
        state: TaskState.RUNNING.name,
        cyclePoint: cyclePoint.node.name,
        firstParent: {
          id: `${WORKFLOW_ID}|${cyclePoint.node.name}|${FAMILY_ROOT}`,
          name: FAMILY_ROOT
        }
      })
      cylcTree.addFamilyProxy(familyProxy)
    })
    it('Should apply pruned deltas', () => {
      // cyclepoint 1 has 1 family
      expect(cylcTree.root.children[0].children.length).to.equal(1)
      // family is empty, note that root family is never added to the tree
      expect(cylcTree.root.children[0].children[0].children.length).to.equal(0)
      const fakeTree = sinon.spy(cylcTree)
      const deltasPruningFamily = {
        id: WORKFLOW_ID,
        shutdown: false,
        pruned: {
          familyProxies: [
            familyProxy.id
          ]
        }
      }
      applyDeltas(fakeTree, deltasPruningFamily)
      // cycle point is now empty
      expect(cylcTree.root.children[0].children.length).to.equal(0)
      expect(fakeTree.tallyCyclePointStates.called).to.equal(true)

      // when you prune the root family, the cycle point must be removed too
      const deltasPruningCyclePoint = {
        id: WORKFLOW_ID,
        shutdown: false,
        pruned: {
          familyProxies: [
            familyProxy.node.firstParent.id
          ]
        }
      }
      applyDeltas(fakeTree, deltasPruningCyclePoint)
      // now the cycle point was removed as well!
      expect(cylcTree.root.children.length).to.equal(0)
      expect(fakeTree.tallyCyclePointStates.called).to.equal(true)
    })
  })
})
