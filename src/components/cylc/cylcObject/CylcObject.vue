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
    <!--<v-tooltip bottom>-->
    <!--  <template v-slot:activator="{ on, attrs }">-->
    <!--    <span v-bind="attrs" v-on="on">-->
    <!--      <slot></slot>-->
    <!--    </span>-->
    <!--  </template>-->
    <!--  <div>-->
    <!--    <span>{{type}}</span>-->
    <!--  </div>-->
    <!--</v-tooltip>-->
    <v-menu offset-y>
      <template v-slot:activator="{ on, attrs }">
        <span v-bind="attrs" v-on="on">
          <slot></slot>
        </span>
      </template>
      <v-list>
        <v-subheader>{{id}}</v-subheader>
        <v-list-item-group v-model="mutation" color="primary">
          <!--<pre>{{this.$workflowService.mutations}}</pre>-->

          <v-list-item two-line
            v-for="mutation in mutations"
            :key="mutation.name"
            @click="mutate(mutation)"
          >
            <v-list-item-content>
            <!--<v-list-item-icon>-->
            <!--  [> TODO <]-->
            <!--  <v-icon></v-icon>-->
            <!--</v-list-item-icon>-->
            <v-list-item-title>
              <span>{{mutation.title}}</span>
            </v-list-item-title>
            <v-list-item-subtitle>
              <span>{{mutation.description}}</span>
            </v-list-item-subtitle>
            <!--<v-list-item-action>-->
            <!--  <v-btn rounded color="primary" dark>Foo</v-btn>-->
            <!--</v-list-item-action>-->
            </v-list-item-content>
          </v-list-item>
        </v-list-item-group>
      </v-list>
    </v-menu>
  </div>
</template>

<script>
import {
  tokenise,
  getType
} from './index'

import {
  filterAssociations
  // tokensToArgs
} from '@/services/mutation'

import { constructMutation } from '@/utils/graphql'

export default {
  name: 'CylcObject',

  props: {
    id: {
      type: String,
      required: true
    }
  },

  data () {
    return {
      mutation: null
    }
  },

  computed: {
    tokens () {
      return tokenise(this.id)
    },
    type () {
      return getType(this.tokens)
    },
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
    args (mutation) {
      const argspec = {}
      for (const arg of mutation.args) {
        for (const token in this.tokens) {
          if (arg.cylcObject && arg.cylcObject === token) {
            if (arg.multiple) {
              argspec[arg.name] = [this.tokens[token]]
            } else {
              argspec[arg.name] = this.tokens[token]
            }
          }
        }
      }
      return argspec
    },
    mutate (mutation) {
      console.log(`% ${mutation.title}`)
      console.log(this.args(mutation))
      const mutilation = constructMutation(mutation.gqlMutation)
      console.log(mutilation)
    }
  }
}
</script>
