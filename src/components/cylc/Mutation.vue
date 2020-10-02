<!--
Copyright (C) NIWA & British Crown (Met Office) & Contributors.

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
-->

<template>
  <v-container>
    <v-card
      class="mx-auto d-inline-block"
      style="padding: 1em;"
      outlined
    >
      <FormGenerator
       :mutation='mutation'
       :types='types'
       :callbackSubmit='call'
      />
      <br />
      <p
       style="font-size:1.5em;"
      >
        <Task
         :status="status"
         :progress="0"
        />
        {{ status }}
      </p>
      <pre v-if="status === 'failed'">{{ response }}</pre>
    </v-card>
    <v-card
      max-width="500"
      outlined
    >
    </v-card>
  </v-container>
</template>

<script>
import gql from 'graphql-tag'

import FormGenerator from '@/components/graphqlFormGenerator/FormGenerator'
import Task from '@/components/cylc/Task'
import { constructMutation } from '@/utils/aotf'

// enumeration for the mutation status, maps onto Cylc Task status
const status = {
  waiting: 'waiting',
  submitted: 'submitted',
  succeeded: 'succeeded',
  failed: 'failed',
  submitFailed: 'submit-failed'
}
Object.freeze(status)

// the "data" function, defined here so we can easily reset the component
const initialState = () => ({
  response: '',
  status: status.waiting
})

export default {
  name: 'mutation',

  components: {
    FormGenerator,
    Task
  },

  props: {
    mutation: {
      // graphql mutation object as returned by introspection query
      type: Object,
      required: true
    },
    types: {
      // list of all graphql types as returned by introspection query
      // (required for resolving InputType objects
      type: Array
    }
  },

  data: initialState,

  methods: {
    /* Execute the GraphQL mutation */
    async call (args) {
      this.status = status.submitted
      let result = null
      try {
        result = await this.$workflowService.apolloClient.mutate({
          mutation: gql(constructMutation(this.mutation)),
          variables: args
        })
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(err)
        this.status = status.submitFailed
        return
      }
      const responses = result.data[this.mutation.name].result
      if (responses && responses.length === 1) {
        this.status = status.succeeded
        this.response = responses[0].response
        return
      }
      this.response = result
      this.status = status.failed
    },

    /* Reset this component to it's initial state. */
    reset () {
      Object.assign(this.$data, initialState())
    }
  },

  watch: {
    mutation: function () {
      // reset the form if the mutation changes
      // (i.e. this component is being re-used)
      this.reset()
    }
  }

}
</script>
