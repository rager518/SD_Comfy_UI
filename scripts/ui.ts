import { ComfyDialog as _ComfyDialog } from './ui/dialog'
export const ComfyDialog = _ComfyDialog

type Position2D = {
  x: number
  y: number
}

type Props = {
  parent?: HTMLElement
  $?: (el: HTMLElement) => void
  dataset?: DOMStringMap
  style?: Partial<CSSStyleDeclaration>
  for?: string
  textContent?: string
  [key: string]: any
}

type Children = Element[] | Element | string | string[]

type ElementType<K extends string> = K extends keyof HTMLElementTagNameMap
  ? HTMLElementTagNameMap[K]
  : HTMLElement

export function $el<TTag extends string>(
  tag: TTag,
  propsOrChildren?: Children | Props,
  children?: Children
): ElementType<TTag> {
  const split = tag.split('.')
  const element = document.createElement(split.shift() as string)
  if (split.length > 0) {
    element.classList.add(...split)
  }

  if (propsOrChildren) {
    if (typeof propsOrChildren === 'string') {
      propsOrChildren = { textContent: propsOrChildren }
    } else if (propsOrChildren instanceof Element) {
      propsOrChildren = [propsOrChildren]
    }
    if (Array.isArray(propsOrChildren)) {
      element.append(...propsOrChildren)
    } else {
      const {
        parent,
        $: cb,
        dataset,
        style,
        ...rest
      } = propsOrChildren as Props

      if (rest.for) {
        element.setAttribute('for', rest.for)
      }

      if (style) {
        Object.assign(element.style, style)
      }

      if (dataset) {
        Object.assign(element.dataset, dataset)
      }

      Object.assign(element, rest)
      if (children) {
        element.append(...(Array.isArray(children) ? children : [children]))
      }

      if (parent) {
        parent.append(element)
      }

      if (cb) {
        cb(element)
      }
    }
  }
  return element as ElementType<TTag>
}

function dragElement(dragEl, settings): () => void {
  var posDiffX = 0,
    posDiffY = 0,
    posStartX = 0,
    posStartY = 0,
    newPosX = 0,
    newPosY = 0
  if (dragEl.getElementsByClassName('drag-handle')[0]) {
    // if present, the handle is where you move the DIV from:
    dragEl.getElementsByClassName('drag-handle')[0].onmousedown = dragMouseDown
  } else {
    // otherwise, move the DIV from anywhere inside the DIV:
    dragEl.onmousedown = dragMouseDown
  }

  // When the element resizes (e.g. view queue) ensure it is still in the windows bounds
  const resizeObserver = new ResizeObserver(() => {
    ensureInBounds()
  }).observe(dragEl)

  function ensureInBounds() {
    try {
      newPosX = Math.min(
        document.body.clientWidth - dragEl.clientWidth,
        Math.max(0, dragEl.offsetLeft)
      )
      newPosY = Math.min(
        document.body.clientHeight - dragEl.clientHeight,
        Math.max(0, dragEl.offsetTop)
      )

      positionElement()
    } catch (exception) {
      // robust
    }
  }

  function positionElement() {
    if (dragEl.style.display === 'none') return

    const halfWidth = document.body.clientWidth / 2
    const anchorRight = newPosX + dragEl.clientWidth / 2 > halfWidth

    // set the element's new position:
    if (anchorRight) {
      dragEl.style.left = 'unset'
      dragEl.style.right =
        document.body.clientWidth - newPosX - dragEl.clientWidth + 'px'
    } else {
      dragEl.style.left = newPosX + 'px'
      dragEl.style.right = 'unset'
    }

    dragEl.style.top = newPosY + 'px'
    dragEl.style.bottom = 'unset'

    if (savePos) {
      localStorage.setItem(
        'Comfy.MenuPosition',
        JSON.stringify({
          x: dragEl.offsetLeft,
          y: dragEl.offsetTop
        })
      )
    }
  }

  function restorePos() {
    let posString = localStorage.getItem('Comfy.MenuPosition')
    if (posString) {
      const pos = JSON.parse(posString) as Position2D
      newPosX = pos.x
      newPosY = pos.y
      positionElement()
      ensureInBounds()
    }
  }

  let savePos = undefined


  function dragMouseDown(e) {
    e = e || window.event
    e.preventDefault()
    // get the mouse cursor position at startup:
    posStartX = e.clientX
    posStartY = e.clientY
    document.onmouseup = closeDragElement
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag
  }

  function elementDrag(e) {
    e = e || window.event
    e.preventDefault()

    dragEl.classList.add('comfy-menu-manual-pos')

    // calculate the new cursor position:
    posDiffX = e.clientX - posStartX
    posDiffY = e.clientY - posStartY
    posStartX = e.clientX
    posStartY = e.clientY

    newPosX = Math.min(
      document.body.clientWidth - dragEl.clientWidth,
      Math.max(0, dragEl.offsetLeft + posDiffX)
    )
    newPosY = Math.min(
      document.body.clientHeight - dragEl.clientHeight,
      Math.max(0, dragEl.offsetTop + posDiffY)
    )

    positionElement()
  }

  window.addEventListener('resize', () => {
    ensureInBounds()
  })

  function closeDragElement() {
    // stop moving when mouse button is released:
    document.onmouseup = null
    document.onmousemove = null
  }

  return restorePos
}