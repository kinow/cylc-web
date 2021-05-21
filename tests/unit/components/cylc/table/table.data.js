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
import TaskState from '@/model/TaskState.model'
import JobState from '@/model/JobState.model'

const BASE_ID = 'cylc|workflow|1'

const simpleTableTasks = [
  {
    id: `${BASE_ID}|taskA`,
    node: {
      state: TaskState.RUNNING.name,
      name: 'taskA',
      meanElapsedTime: 2000
    },
    children: [
      {
        id: `${BASE_ID}|taskA|1`,
        node: {
          platform: 'localhost',
          jobRunnerName: 'background',
          jobId: '1',
          submittedTime: 'Fri May 21 2021 15:54:29 GMT+1200 (New Zealand Standard Time)',
          startedTime: 'Fri May 21 2021 15:54:29 GMT+1200 (New Zealand Standard Time)',
          finishedTime: null,
          state: JobState.RUNNING.name
        }
      }
    ]
  },
  {
    id: `${BASE_ID}|taskB`,
    node: {
      state: TaskState.WAITING.name,
      name: 'taskB'
    },
    children: []
  },
  {
    id: `${BASE_ID}|taskB`,
    node: {
      state: TaskState.SUBMITTED.name,
      name: 'taskB'
    },
    children: []
  }
]

export {
  simpleTableTasks
}
