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
  <div class="c-mutation">
    <!-- clickable dropdown menu -->
    <v-menu
      offset-y
      :disabled="!interactive"
    >
      <!-- the clickable component -->
      <template v-slot:activator="{ on, attrs }">
        <span v-bind="attrs" v-on="on">
          <!-- hoverable tooltip -->
          <v-tooltip
            bottom
            :open-delay="1000"
            :disabled="!descriptive"
          >
            <!-- the wrapped component -->
            <template v-slot:activator="{ on, attrs }">
              <span v-bind="attrs" v-on="on">
                <slot></slot>
              </span>
            </template>
            <!-- the tooltip -->
            <div>
              <span>{{id}}</span>
              <br />
              <span>{{type}}</span>
            </div>
          </v-tooltip>
        </span>
      <!-- the dropdown menu -->
      </template>
      <v-list dense>
        <v-subheader>{{id}}</v-subheader>
        <v-list-item-group color="primary">
          <v-list-item two-line
            v-for="mutation in mutations"
            :key="mutation.name"
            @click="callMutationFromContext(mutation)"
          >
            <v-list-item-icon>
              <div style="font-size:0.5rem;">
                <v-icon medium>{{ mutation._icon }}</v-icon>
              </div>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>
                <span>{{mutation._title}}</span>
              </v-list-item-title>
              <v-list-item-subtitle>
                <span>{{mutation._shortDescription}}</span>
              </v-list-item-subtitle>
            </v-list-item-content>
            <!-- This is how to add buttons for standard operations later -->
            <!--<v-list-item-action>-->
            <!--  <v-btn small rounded color="primary" dark>Foo</v-btn>-->
            <!--</v-list-item-action>-->
          </v-list-item>
        </v-list-item-group>
      </v-list>
    </v-menu>
  </div>
</template>

<script>
import {
  tokenise,
  getType,
  getMutationArgsFromTokens
} from './index'

import {
  filterAssociations
  // tokensToArgs
} from '@/utils/mutation'

import {
  mutate
} from '@/utils/graphql'

export default {
  name: 'CylcObject',

  props: {
    id: {
      type: String,
      required: true
    },
    interactive: {
      type: Boolean,
      required: false,
      default: true
    },
    descriptive: {
      type: Boolean,
      required: false,
      default: true
    }
  },

  computed: {
    /* A dict of tokens representing the object context. */
    tokens () {
      return tokenise(this.id)
    },
    /* The token representing this object. */
    type () {
      return getType(this.tokens)
    },
    /* List of mutations applicable to this object
     * Note: currently filtered by just the ones we can call without additional
     *       info.
     */
    mutations () {
      // TODO - this gets computed on load which is bad
      return filterAssociations(
        this.type,
        this.tokens,
        this.$workflowService.mutations
      )[0]
    }
  },

  methods: {
    /* Call a mutation using only the tokens for args. */
    callMutationFromContext (mutation) {
      console.debug(`mutation: ${mutation._title} ${this.id}`)
      const promise = mutate(
        mutation,
        getMutationArgsFromTokens(mutation, this.tokens),
        this.$workflowService.apolloClient
      )
      promise.then((status, ret) => {
        console.debug(status, ret)
      })
    }
  }
}
</script>
