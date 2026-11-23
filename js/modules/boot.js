/**
 * Home page intro: a short terminal "login" that types itself out, ends in ACCESS GRANTED and splits open
 * to reveal the page. The head script of index.html adds `fx-boot` to <html> before first paint (a dark
 * cover, scrolling locked, hero animations paused); this module draws the terminal on top of it and removes
 * the class when it is time for the page to appear. Any click, key press or touch skips it.
 * Nothing here runs for visitors who prefer reduced motion (the head script never adds the class).
 */

const root = () => document.documentElement

const el = (tag, className, text) => {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text !== undefined) node.textContent = text
  return node
}

const lines = (name) => [
  { cmd: 'ssh guest@aimansam.my' },
  { out: 'connection established', dim: true },
  { cmd: 'whoami' },
  { out: name.toLowerCase(), hot: true },
  { cmd: 'cat role.txt' },
  { out: 'pentester / red teamer  [CPTS] [CEH]' },
  { cmd: './open --graduate-roles' },
  { bar: true }
]

// Resolves when the page should start its own entrance (as the terminal begins to split open).
export const runBoot = () => new Promise((resolve) => {
  if (!root().classList.contains('fx-boot') || !document.body) {
    root().classList.remove('fx-boot')
    resolve()
    return
  }

  const name = document.getElementById('hero-title')?.textContent?.trim() || 'Aiman Sam'

  const overlay = el('div', 'fx-term')
  overlay.setAttribute('aria-hidden', 'true')
  const top = el('div', 'fx-term-half fx-term-top')
  const bottom = el('div', 'fx-term-half fx-term-bottom')
  const seam = el('div', 'fx-term-seam')
  const screen = el('div', 'fx-term-screen')
  const hint = el('div', 'fx-term-hint', 'click or press any key to skip')
  overlay.append(top, bottom, screen, seam, hint)
  document.body.append(overlay)

  let skipped = false
  let wake = null
  let timer = 0
  const wait = (ms) => new Promise((done) => {
    if (skipped) { done(); return }
    wake = done
    timer = window.setTimeout(done, ms)
  })
  const skip = () => {
    if (skipped) return
    skipped = true
    window.clearTimeout(timer)
    wake?.()
  }
  const skipEvents = ['pointerdown', 'keydown', 'touchstart']
  const onSkip = (event) => {
    // Space and the arrow keys would otherwise scroll the page the moment it unlocks.
    if (event.type === 'keydown') {
      if (event.ctrlKey || event.metaKey || event.altKey) return
      event.preventDefault()
    }
    skip()
  }
  skipEvents.forEach((type) => window.addEventListener(type, onSkip, { passive: type !== 'keydown' }))

  let finished = false
  const finish = () => {
    if (finished) return
    finished = true
    skipEvents.forEach((type) => window.removeEventListener(type, onSkip))
    root().classList.remove('fx-boot')
    overlay.classList.add('is-leaving')
    resolve()
    window.setTimeout(() => overlay.remove(), 1100)
  }

  const typeInto = async (node, text, speed) => {
    for (const char of text) {
      if (skipped) { node.textContent = text; return }
      node.textContent += char
      await wait(speed + Math.random() * 14)
    }
  }

  const run = async () => {
    const caret = el('span', 'fx-term-caret')
    await wait(150)
    for (const line of lines(name)) {
      if (skipped) break
      const row = el('div', 'fx-term-line')
      screen.append(row)
      if (line.cmd) {
        row.append(el('span', 'fx-term-prompt', '$ '))
        const body = el('span', 'fx-term-cmd')
        row.append(body, caret)
        await typeInto(body, line.cmd, 16)
        await wait(120)
      } else if (line.out) {
        row.className += line.hot ? ' is-hot' : line.dim ? ' is-dim' : ''
        row.textContent = line.out
        await wait(160)
      } else if (line.bar) {
        const bar = el('span', 'fx-term-bar')
        const fill = el('span', 'fx-term-bar-fill')
        const pct = el('span', 'fx-term-pct', '0%')
        bar.append(fill)
        row.append(bar, pct)
        const steps = 14
        for (let step = 1; step <= steps && !skipped; step += 1) {
          fill.style.transform = `scaleX(${step / steps})`
          pct.textContent = `${Math.round((step / steps) * 100)}%`
          await wait(22)
        }
        fill.style.transform = 'scaleX(1)'
        pct.textContent = '100%'
      }
    }
    caret.remove()
    if (!skipped) {
      screen.append(el('div', 'fx-term-line fx-term-granted', 'ACCESS GRANTED'))
      overlay.classList.add('is-granted')
      await wait(520)
    }
    finish()
  }

  run().catch(() => finish())
  // Safety net: never hold the page longer than a few seconds, whatever happens above.
  window.setTimeout(finish, 5200)
})
