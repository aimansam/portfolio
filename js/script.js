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
const aboutSkillFilters = document.querySelectorAll('.about-skill-filter')
const aboutSkillPages = document.querySelectorAll('.about-skill-page')
const certificateCarousels = document.querySelectorAll('.about-certificate-carousel')

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

if (aboutSkillFilters.length && aboutSkillPages.length) {
  aboutSkillFilters.forEach((button) => {
    button.addEventListener('click', () => {
      const selectedFilter = button.dataset.skillFilter

      aboutSkillFilters.forEach((item) => {
        item.classList.toggle('is-active', item === button)
      })

      aboutSkillPages.forEach((page) => {
        page.classList.toggle('is-active', page.dataset.skillPage === selectedFilter)
      })
    })
  })
}

if (certificateCarousels.length) {
  certificateCarousels.forEach((carousel) => {
    const viewport = carousel.querySelector('.about-certificate-viewport')
    const nextButton = carousel.querySelector('[data-certificate-nav="next"]')
    const prevButton = carousel.querySelector('[data-certificate-nav="prev"]')
    let autoSlideId = null

    if (!viewport || !nextButton || !prevButton) {
      return
    }

    const scrollByCard = (direction) => {
      const card = viewport.querySelector('.about-certificate-item')
      if (!card) {
        return
      }

      const gap = 14
      viewport.scrollBy({
        left: direction * (card.clientWidth + gap),
        behavior: 'smooth'
      })
    }

    const advanceCarousel = () => {
      const card = viewport.querySelector('.about-certificate-item')
      if (!card) {
        return
      }

      const gap = 14
      const step = card.clientWidth + gap
      const maxScrollLeft = viewport.scrollWidth - viewport.clientWidth
      const nextScrollLeft = viewport.scrollLeft + step

      if (nextScrollLeft >= maxScrollLeft - 4) {
        viewport.scrollTo({ left: 0, behavior: 'smooth' })
        return
      }

      viewport.scrollBy({ left: step, behavior: 'smooth' })
    }

    const stopAutoSlide = () => {
      if (autoSlideId !== null) {
        window.clearInterval(autoSlideId)
        autoSlideId = null
      }
    }

    const startAutoSlide = () => {
      stopAutoSlide()
      autoSlideId = window.setInterval(advanceCarousel, 4000)
    }

    prevButton.addEventListener('click', () => scrollByCard(-1))
    nextButton.addEventListener('click', () => scrollByCard(1))

    carousel.addEventListener('mouseenter', stopAutoSlide)
    carousel.addEventListener('mouseleave', startAutoSlide)
    carousel.addEventListener('focusin', stopAutoSlide)
    carousel.addEventListener('focusout', startAutoSlide)
    carousel.addEventListener('touchstart', stopAutoSlide, { passive: true })
    carousel.addEventListener('touchend', startAutoSlide, { passive: true })

    startAutoSlide()
  })
}

if (typeof lucide !== 'undefined') {
  lucide.createIcons()
}

