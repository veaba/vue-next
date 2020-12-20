// __UNSAFE__
// 原因: 可能设置 innerHTML.
// 这可能来自于在 render 中明确使用 v-html 或 innerHTML 作为 prop。
import { warn } from '@vue/runtime-core'

// 函数. 用户只负责使用可信的内容。
export function patchDOMProp(
  el: any,
  key: string,
  value: any,
  // the following args are passed only due to potential innerHTML/textContent
  // overriding existing VNodes, in which case the old tree must be properly
  // unmounted.
  prevChildren: any,
  parentComponent: any,
  parentSuspense: any,
  unmountChildren: any
) {
  if (key === 'innerHTML' || key === 'textContent') {
    if (prevChildren) {
      unmountChildren(prevChildren, parentComponent, parentSuspense)
    }
    el[key] = value == null ? '' : value
    return
  }
  if (key === 'value' && el.tagName !== 'PROGRESS') {
    // store value as _value as well since
    // non-string values will be stringified.
    el._value = value
    const newValue = value == null ? '' : value
    if (el.value !== newValue) {
      el.value = newValue
    }
    return
  }
  if (value === '' && typeof el[key] === 'boolean') {
    // e.g. <select multiple> compiles to { multiple: '' }
    el[key] = true
  } else if (value == null && typeof el[key] === 'string') {
    // e.g. <div :id="null">
    el[key] = ''
    el.removeAttribute(key)
  } else {
    // some properties perform value validation and throw
    try {
      el[key] = value
    } catch (e) {
      if (__DEV__) {
        warn(
          `Failed setting prop "${key}" on <${el.tagName.toLowerCase()}>: ` +
            `value ${value} is invalid.`,
          e
        )
      }
    }
  }
}
