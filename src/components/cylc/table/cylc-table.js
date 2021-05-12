import Vue from 'vue'
import { mergeWith } from 'lodash'

function mergeWithCustomizer (objValue, srcValue, key, object, source) {
  if (srcValue !== undefined) {
    // 1. object[key], or objValue, is undefined
    //    meaning the destination object does not have the property
    //    so let's add it with reactivity!
    if (objValue === undefined) {
      Vue.set(object, `${key}`, srcValue)
    }
    // 2. object[key], or objValue, is defined but without reactivity
    //    this means somehow the object got a new property that is not reactive
    //    so let's now make it reactive with the new value!
    if (object[key] && !object[key].__ob__) {
      Vue.set(object, `${key}`, srcValue)
    }
  }
}
/**
 * @param {TaskProxyNode} taskProxy
 */
function updateTaskProxy (taskProxy) {
  const node = this.lookup.get(taskProxy.id)
  if (node) {
    mergeWith(node, taskProxy, mergeWithCustomizer)
  }
}
