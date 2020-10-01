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

/* Enum of Cylc "things". */
export const cylcObjects = Object.freeze({
  User: 'user',
  Workflow: 'workflow',
  CyclePoint: 'cycle point',
  Namespace: 'namespace',
  // Task: 'task',
  Job: 'job'
})

/* Cylc things in hierarchy order. */
const identifierOrder = [
  cylcObjects.User,
  cylcObjects.Workflow,
  cylcObjects.CyclePoint,
  cylcObjects.Namespace,
  // cylcObjects.Task,
  cylcObjects.Job
]

/* Mapping of mutation argument types to Cylc "things". */
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

/* Translate a global ID into a token dictionary. */
export function tokenise (id) {
  id = id.split('|')
  const ret = {}
  for (let ind = 0; ind < id.length; ind++) {
    ret[identifierOrder[ind]] = id[ind]
  }
  return ret
}

/* Return the lowest token in the hierarchy. */
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

/* Mutation argument types which are derived from more than one token. */
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

/* Return arguments for the provided mutation which can be obtained from
 * the provided tokens */
export function getMutationArgsFromTokens (mutation, tokens) {
  const argspec = {}
  let value = null
  for (const arg of mutation.args) {
    for (const token in tokens) {
      if (arg._cylcObject && arg._cylcObject === token) {
        if (arg._cylcType in compoundFields) {
          value = compoundFields[arg._cylcType](tokens)
        } else {
          value = tokens[token]
        }
        if (arg._multiple) {
          value = [value]
        }
        argspec[arg.name] = value
        break
      }
    }
    if (!argspec[arg.name]) {
      argspec[arg.name] = arg._default
    }
  }
  return argspec
}
