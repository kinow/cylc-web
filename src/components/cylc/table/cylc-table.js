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
addTaskProxy (taskProxy) {
  if (!this.lookup.has(taskProxy.id)) {
    // progress starts at 0
    taskProxy.node.progress = 0
    // A TaskProxy could be a ghost node, which doesn't have a state/status yet.
    // Note that we cannot have this if-check in `createTaskProxyNode`, as an
    // update-delta might not have a state, and we don't want to merge
    // { state: "" } with an object that contains { state: "running" }, for
    // example.
    if (!taskProxy.node.state) {
      taskProxy.node.state = ''
    }
    this.lookup.set(taskProxy.id, taskProxy)
    if (taskProxy.node.firstParent) {
      const parent = this.findTaskProxyParent(taskProxy)
      if (!parent) {
        // eslint-disable-next-line no-console
        console.error(`Missing parent ${taskProxy.node.firstParent.id}`)
      } else {
        const sortedIndex = sortedIndexBy(
            parent.children,
            taskProxy,
            (t) => t.node.name,
            sortTaskProxyOrFamilyProxy
        )
        parent.children.splice(sortedIndex, 0, taskProxy)
      }
    }
  }
}

/**
 * @param {TaskProxyNode} taskProxy
 */
updateTaskProxy (taskProxy) {
  const node = this.lookup.get(taskProxy.id)
  if (node) {
    mergeWith(node, taskProxy, mergeWithCustomizer)
  }
}
