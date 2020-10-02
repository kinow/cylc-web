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
  <v-list
   dense
   one-line
  >
    <v-list-item-title>{{ label }}</v-list-item-title>
      <v-list-item
        dense
        v-for="(item, index) in value"
        :key="index"
      >
        <v-list-item-content>
          <!-- The input -->
          <component
           v-model="value[index]"
           :propOverrides="{'dense': true}"
           :gqlType="gqlType.ofType"
           :types="types"
           :is="FormInput"
           label=""
          >
            <template v-slot:append-outer>
              <v-icon
               @click="remove(index)"
              >
                {{ svgPaths.close }}
              </v-icon>
            </template>
          </component>
          <!--
            NOTE: we use :is here due to a nested component
            registration issue.
          -->
        </v-list-item-content>
      </v-list-item>
      <v-list-item
       dense
      >
        <v-btn
         @click="add()"
         text
        >
          <v-icon>{{ svgPaths.open }}</v-icon>
          Add Item
        </v-btn>
      </v-list-item>
  </v-list>
</template>

<script>
import { formElement } from '@/components/graphqlFormGenerator/mixins'
import { getNullValue } from '@/utils/aotf'
import { mdiPlusCircle, mdiCloseCircle } from '@mdi/js'

export default {
  name: 'g-list',

  mixins: [
    formElement
  ],

  data () {
    return {
      svgPaths: {
        open: mdiPlusCircle,
        close: mdiCloseCircle
      }
    }
  },

  methods: {
    /* Add an item to the list. */
    add () {
      this.value.push(
        getNullValue(this.gqlType.ofType, this.types)
      )
    },

    /* Remove the item at `index` from the list. */
    remove (index) {
      this.value.splice(index, 1)
    }
  }
}
</script>
