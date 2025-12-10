(() => {
  function qs(sel) { return document.querySelector(sel) }
  function open() { qs('#ps-modal')?.classList.add('show'); qs('#ps-modal')?.setAttribute('aria-hidden', 'false') }
  function close() { qs('#ps-modal')?.classList.remove('show'); qs('#ps-modal')?.setAttribute('aria-hidden', 'true') }

  document.addEventListener('DOMContentLoaded', () => {
    const openBtn = qs('#ps-open-modal')
    const closeBtn = qs('#ps-close-modal')
    const cancelBtn = qs('#ps-cancel')

    if (openBtn) openBtn.addEventListener('click', open)
    if (closeBtn) closeBtn.addEventListener('click', close)
    if (cancelBtn) cancelBtn.addEventListener('click', close)

    const modal = qs('#ps-modal')
    if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) close() })
  })
})()
