if (document.getElementById('my-work-link')) {
  document.getElementById('my-work-link').addEventListener('click', () => {
    document.getElementById('my-work-section').scrollIntoView({behavior: "smooth"})
  })
}

const navMenuToggle = document.querySelector('.nav-menu-toggle')
const navIconBox = document.querySelector('.nav-icon-box')
const navIconLinks = document.querySelectorAll('.nav-icon-box .nav-icon-link')

if (navMenuToggle && navIconBox) {
  navMenuToggle.addEventListener('click', () => {
    const isOpen = navMenuToggle.getAttribute('aria-expanded') === 'true'
    navMenuToggle.setAttribute('aria-expanded', String(!isOpen))
    navIconBox.classList.toggle('is-open', !isOpen)
  })

  navIconLinks.forEach((link) => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 800) {
        navMenuToggle.setAttribute('aria-expanded', 'false')
        navIconBox.classList.remove('is-open')
      }
    })
  })
}

const filterButtons = document.querySelectorAll('.filter-button')
const projectCards = document.querySelectorAll('.project-card[data-category]')

if (filterButtons.length && projectCards.length) {
  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const selectedFilter = button.dataset.filter

      filterButtons.forEach((item) => {
        item.classList.toggle('is-active', item === button)
      })

      projectCards.forEach((card) => {
        const matches = selectedFilter === 'all' || card.dataset.category === selectedFilter
        card.classList.toggle('is-hidden', !matches)
      })
    })
  })
}

