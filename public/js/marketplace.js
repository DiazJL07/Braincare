(() => {
  function qs(sel) { return document.querySelector(sel) }
  function qsa(sel) { return Array.from(document.querySelectorAll(sel)) }

  function filterAndSortGrid(gridSel) {
    const term = (qs('#mp-search')?.value || '').trim().toLowerCase()
    const sort = qs('#mp-sort')?.value || 'recent'
    const cards = qsa(`${gridSel} .mp-card`)
    let visible = []

    cards.forEach(c => {
      const name = (c.getAttribute('data-name') || '')
      const matches = !term || name.includes(term)
      c.style.display = matches ? '' : 'none'
      if (matches) visible.push(c)
    })

    const cmp = {
      recent: (a, b) => new Date(b.getAttribute('data-created')) - new Date(a.getAttribute('data-created')),
      rating: (a, b) => (parseFloat(b.getAttribute('data-rating')) || 0) - (parseFloat(a.getAttribute('data-rating')) || 0),
      reviews: (a, b) => (parseInt(b.getAttribute('data-reviews')) || 0) - (parseInt(a.getAttribute('data-reviews')) || 0)
    }[sort]

    visible.sort(cmp)
    const grid = qs(gridSel)
    visible.forEach(c => grid.appendChild(c))
    return visible.length
  }

  function applySearchAndSort() {
    const v1 = filterAndSortGrid('#mp-grid')
    const v2 = filterAndSortGrid('#mp-grid-services')
    const v3 = filterAndSortGrid('#mp-grid-sessions')
    const empty = qs('#mp-empty')
    if (empty) empty.style.display = (v1 + v2 + v3) ? 'none' : 'block'
  }

  function init() {
    const sortEl = qs('#mp-sort')
    if (sortEl && sortEl.dataset.initialSort) sortEl.value = sortEl.dataset.initialSort
    applySearchAndSort()
    const input = qs('#mp-search')
    if (input) input.addEventListener('input', () => applySearchAndSort())
    if (sortEl) sortEl.addEventListener('change', () => applySearchAndSort())
  }

  document.addEventListener('DOMContentLoaded', init)
})()
