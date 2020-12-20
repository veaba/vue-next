import {
  createRenderer,
  createHydrationRenderer,
  warn,
  RootRenderFunction,
  CreateAppFunction,
  Renderer,
  HydrationRenderer,
  App,
  RootHydrateFunction
} from '@vue/runtime-core'
import { nodeOps } from './nodeOps'
import { patchProp, forcePatchProp } from './patchProp'
// 从 compiler 导入，将在生产环境中被 tree-shaken
import { isFunction, isString, isHTMLTag, isSVGTag, extend } from '@vue/shared'

declare module '@vue/reactivity' {
  export interface RefUnwrapBailTypes {
    // 注意: 如果更新此项，请也一并更新 `types/refBail.d.ts`.
    runtimeDOMBailTypes: Node | Window
  }
}

const rendererOptions = extend({ patchProp, forcePatchProp }, nodeOps)

// 懒创建渲染器 - 这使得核心渲染器的逻辑是可以树摇的
// 如果用户只从 Vue 导入响应性工具。
let renderer: Renderer<Element> | HydrationRenderer

let enabledHydration = false

function ensureRenderer() {
  return renderer || (renderer = createRenderer<Node, Element>(rendererOptions))
}

function ensureHydrationRenderer() {
  renderer = enabledHydration
    ? renderer
    : createHydrationRenderer(rendererOptions)
  enabledHydration = true
  // renderer 是作为 HydrationRenderer 类型，as 是 ts 的一种断言手法
  return renderer as HydrationRenderer
}

// 在这里使用显式类型转换，以避免在 rolled-up d.ts 中调用import()。
// TODO: 一个高级的开发技巧吗?
export const render = ((...args) => {
  ensureRenderer().render(...args)
}) as RootRenderFunction<Element>

export const hydrate = ((...args) => {
  ensureHydrationRenderer().hydrate(...args)
}) as RootHydrateFunction

export const createApp = ((...args) => {
  const app = ensureRenderer().createApp(...args) // 本质是调用 `createAppAPI`
  // 开发环境下，注入原生的tag检查
  if (__DEV__) {
    injectNativeTagCheck(app)
  }

  const { mount } = app
  app.mount = (containerOrSelector: Element | string): any => {
    const container = normalizeContainer(containerOrSelector)
    if (!container) return
    const component = app._component
    // 非 `template` 模式
    if (!isFunction(component) && !component.render && !component.template) {
      component.template = container.innerHTML
    }
    // 在mount之前，清空 `innerHTML`
    container.innerHTML = ''
    const proxy = mount(container)
    container.removeAttribute('v-cloak') // 移除 v-cloak attr
    container.setAttribute('data-v-app', '') // 初始化 data-v-app attr
    return proxy
  }

  return app
}) as CreateAppFunction<Element>

export const createSSRApp = ((...args) => {
  const app = ensureHydrationRenderer().createApp(...args)

  if (__DEV__) {
    injectNativeTagCheck(app)
  }

  const { mount } = app
  app.mount = (containerOrSelector: Element | string): any => {
    const container = normalizeContainer(containerOrSelector)
    // ssr 模式下，不处理 v-cloak data-v-app
    if (container) {
      return mount(container, true)
    }
  }

  return app
}) as CreateAppFunction<Element>

function injectNativeTagCheck(app: App) {
  // 注入 `isNativeTag`
  // 用于组件名验证 (仅开发模式下)
  Object.defineProperty(app.config, 'isNativeTag', {
    value: (tag: string) => isHTMLTag(tag) || isSVGTag(tag),
    writable: false
  })
}
// 规范化容器
function normalizeContainer(container: Element | string): Element | null {
  if (isString(container)) {
    const res = document.querySelector(container)
    if (__DEV__ && !res) {
      warn(`Failed to mount app: mount target selector returned null.`)
    }
    return res
  }
  return container
}

// SFC CSS utilities
export { useCssModule } from './helpers/useCssModule'
export { useCssVars } from './helpers/useCssVars'

// DOM-only components
export { Transition, TransitionProps } from './components/Transition'
export {
  TransitionGroup,
  TransitionGroupProps
} from './components/TransitionGroup'

// **Internal** DOM-only runtime directive helpers
export {
  vModelText,
  vModelCheckbox,
  vModelRadio,
  vModelSelect,
  vModelDynamic
} from './directives/vModel'
export { withModifiers, withKeys } from './directives/vOn'
export { vShow } from './directives/vShow'

// 从 core 重新导出所有东西
// h, Component, reactivity API, nextTick, flags & types
export * from '@vue/runtime-core'
