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

export const cylcObjects = Object.freeze({
  User: 'user',
  Workflow: 'workflow',
  CyclePoint: 'cycle point',
  Namespace: 'namespace',
  // Task: 'task',
  Job: 'job'
})

const identifierOrder = [
  cylcObjects.User,
  cylcObjects.Workflow,
  cylcObjects.CyclePoint,
  cylcObjects.Namespace,
  // cylcObjects.Task,
  cylcObjects.Job
]

export const mutationMapping = {
  // object: [[typeName: String, impliesMultiple: Boolean]]
  user: [
  ],
  workflow: [
    ['WorkflowID', false]
  ],
  'cycle point': [
    ['CyclePoint', false],
    ['CyclePointGlob', true]
  ],
  namespace: [
    ['NamespaceName', false],
    ['NamespaceIDGlob', true]
  ],
  task: [
    ['TaskID', false]
  ],
  job: [
    ['JobID', false]
  ]
}

export const compoundFields = {
  WorkflowID: (tokens) => {
    return `${tokens[cylcObjects.User]}|${tokens[cylcObjects.Workflow]}`
  },
  NamespaceIDGlob: (tokens) => {
    return `${tokens[cylcObjects.Namespace]}.${tokens[cylcObjects.CyclePoint]}`
  },
  TaskID: (tokens) => {
    return `${tokens[cylcObjects.Task]}.${tokens[cylcObjects.CyclePoint]}`
  }
}

export function tokenise (id) {
  id = id.split('|')
  const ret = {}
  for (let ind = 0; ind < id.length; ind++) {
    ret[identifierOrder[ind]] = id[ind]
  }
  return ret
}

export function getType (tokens) {
  let last = null
  let item = null
  for (const key of identifierOrder) {
    item = tokens[key]
    if (!item) {
      break
    }
    last = key
  }
  return last
}
