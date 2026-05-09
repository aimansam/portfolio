if (document.getElementById('my-work-link')) {
  document.getElementById('my-work-link').addEventListener('click', () => {
    document.getElementById('my-work-section').scrollIntoView({behavior: "smooth"})
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

