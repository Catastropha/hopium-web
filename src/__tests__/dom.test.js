import { describe, it, expect } from 'vitest'
import { html, fragment, mount, $, $$, escapeHtml } from '../utils/dom.js'

describe('html', () => {
  it('creates a DOM element from a template string', () => {
    const el = html`<div class="test">Hello</div>`
    expect(el).toBeInstanceOf(HTMLElement)
    expect(el.tagName).toBe('DIV')
    expect(el.className).toBe('test')
    expect(el.textContent).toBe('Hello')
  })

  it('interpolates values', () => {
    const name = 'World'
    const el = html`<span>${name}</span>`
    expect(el.textContent).toBe('World')
  })

  it('handles nested elements', () => {
    const el = html`<div><span>inner</span></div>`
    expect(el.querySelector('span').textContent).toBe('inner')
  })
})

describe('fragment', () => {
  it('creates a document fragment with multiple children', () => {
    const frag = fragment`<span>A</span><span>B</span>`
    expect(frag).toBeInstanceOf(DocumentFragment)
    expect(frag.children.length).toBe(2)
  })
})

describe('mount', () => {
  it('replaces container contents with an element', () => {
    const container = document.createElement('div')
    container.innerHTML = '<p>old</p>'

    const newEl = document.createElement('span')
    newEl.textContent = 'new'

    mount(container, newEl)
    expect(container.children.length).toBe(1)
    expect(container.firstChild.textContent).toBe('new')
  })

  it('replaces container contents with an HTML string', () => {
    const container = document.createElement('div')
    mount(container, '<p>html string</p>')
    expect(container.innerHTML).toBe('<p>html string</p>')
  })
})

describe('$ / $$', () => {
  it('selects a single element', () => {
    const container = document.createElement('div')
    container.innerHTML = '<span class="a">1</span><span class="b">2</span>'

    const el = $('span.a', container)
    expect(el.textContent).toBe('1')
  })

  it('selects all matching elements', () => {
    const container = document.createElement('div')
    container.innerHTML = '<span>1</span><span>2</span><span>3</span>'

    const els = $$('span', container)
    expect(els).toHaveLength(3)
    expect(Array.isArray(els)).toBe(true)
  })
})

describe('escapeHtml', () => {
  it('escapes angle brackets', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert("xss")&lt;/script&gt;'
    )
  })

  it('escapes ampersands', () => {
    expect(escapeHtml('a & b')).toBe('a &amp; b')
  })

  it('does not alter quotes (textContent-based escaping)', () => {
    // escapeHtml uses textContent → innerHTML, which does not escape quotes
    const result = escapeHtml('"hello"')
    expect(result).toBe('"hello"')
  })

  it('passes through safe strings unchanged', () => {
    expect(escapeHtml('hello world')).toBe('hello world')
  })

  it('handles empty string', () => {
    expect(escapeHtml('')).toBe('')
  })
})
