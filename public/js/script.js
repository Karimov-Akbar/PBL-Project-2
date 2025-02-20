document.addEventListener("DOMContentLoaded", () => {
  fetchReviews()
  setupSmoothScrolling()
  setupStatAnimation()
  setupModal()
})

// Add new function for mobile menu
function setupMobileMenu() {
  const burgerButton = document.querySelector(".burger-menu")
  const nav = document.querySelector("nav ul")
  const header = document.querySelector("header")

  if (!burgerButton || !nav || !header) {
    console.warn("Mobile menu elements not found. Skipping setup.")
    return
  }

  burgerButton.addEventListener("click", () => {
    nav.classList.toggle("active")
    burgerButton.classList.toggle("active")
    header.classList.toggle("nav-open")
  })

  // Close menu when clicking outside
  document.addEventListener("click", (e) => {
    if (!header.contains(e.target) && nav.classList.contains("active")) {
      nav.classList.remove("active")
      burgerButton.classList.remove("active")
      header.classList.remove("nav-open")
    }
  })

  // Close menu when clicking on a link
  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("active")
      burgerButton.classList.remove("active")
      header.classList.remove("nav-open")
    })
  })
}

async function fetchReviews() {
  try {
    const response = await fetch("/api/reviews")
    const reviews = await response.json()
    displayPositiveReviews(reviews)
    displayStats(reviews)
  } catch (error) {
    console.error("Error fetching reviews:", error)
  }
}

function displayPositiveReviews(reviews) {
  const positiveReviews = reviews
    .filter((review) => Number.parseInt(review.rating) >= 4)
    .sort(() => 0.5 - Math.random())
    .slice(0, 3)

  const reviewGrid = document.getElementById("reviewGrid")
  reviewGrid.innerHTML = positiveReviews
    .map(
      (review) => `
        <div class="review-item">
            <p class="review-text">"${review.review_text.substring(0, 150)}..."</p>
            <h3 class="review-title">${review.title}</h3>
            <p class="review-author">By ${generateName()}</p>
            <button class="read-more-btn" 
                data-title="${escapeHtml(review.title)}"
                data-review="${escapeHtml(review.review_text)}"
                data-rating="${review.rating}"
                data-department="${escapeHtml(review.department_name)}">
                Read More
            </button>
        </div>
    `,
    )
    .join("")

  setupReadMoreButtons()
}

function displayStats(reviews) {
  const totalReviews = reviews.length
  const averageRating = reviews.reduce((sum, review) => sum + Number(review.rating), 0) / totalReviews
  const uniqueProducts = new Set(reviews.map((review) => review.clothing_id)).size

  const statsContainer = document.getElementById("statsContainer")
  statsContainer.innerHTML = `
        <div class="stat-item">
            <h3>${totalReviews}</h3>
            <p>Reviews Analyzed</p>
        </div>
        <div class="stat-item">
            <h3>${averageRating.toFixed(2)}</h3>
            <p>Average Rating</p>
        </div>
        <div class="stat-item">
            <h3>${uniqueProducts}</h3>
            <p>Unique Products</p>
        </div>
    `

  setupStatAnimation()
}

function setupSmoothScrolling() {
  const navLinks = document.querySelectorAll('nav a[href^="#"]')
  navLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault()
      const targetId = this.getAttribute("href")
      const targetElement = document.querySelector(targetId)
      targetElement.scrollIntoView({ behavior: "smooth" })
    })
  })
}

function setupStatAnimation() {
  const stats = document.querySelectorAll(".stat-item h3")
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateValue(entry.target, 0, Number.parseFloat(entry.target.innerText), 2000)
          observer.unobserve(entry.target)
        }
      })
    },
    { threshold: 0.5 },
  )

  stats.forEach((stat) => observer.observe(stat))
}

function animateValue(obj, start, end, duration) {
  let startTimestamp = null
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp
    const progress = Math.min((timestamp - startTimestamp) / duration, 1)
    obj.innerHTML = Number.isInteger(end)
      ? Math.floor(progress * (end - start) + start)
      : (progress * (end - start) + start).toFixed(2)
    if (progress < 1) {
      window.requestAnimationFrame(step)
    }
  }
  window.requestAnimationFrame(step)
}

function setupModal() {
  const modal = document.getElementById("reviewModal")
  const closeButton = document.querySelector(".close-button")

  closeButton.onclick = () => {
    modal.style.display = "none"
  }

  window.onclick = (event) => {
    if (event.target == modal) {
      modal.style.display = "none"
    }
  }
}

function openModal(title, review, rating, department) {
  const modal = document.getElementById("reviewModal")
  const modalTitle = document.getElementById("modalTitle")
  const modalReview = document.getElementById("modalReview")
  const modalDetails = document.getElementById("modalDetails")

  modalTitle.textContent = title
  modalReview.textContent = review
  modalDetails.innerHTML = `
        <p><strong>Rating:</strong> ${rating} / 5</p>
        <p><strong>Department:</strong> ${department}</p>
    `

  modal.style.display = "block"
}

function escapeHtml(text) {
  const div = document.createElement("div")
  div.textContent = text
  return div.innerHTML
}

function setupReadMoreButtons() {
  const buttons = document.querySelectorAll(".read-more-btn")
  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const title = button.dataset.title
      const review = button.dataset.review
      const rating = button.dataset.rating
      const department = button.dataset.department
      openModal(title, review, rating, department)
    })
  })
}

function generateName() {
  const firstNames = ["Emma", "Sophia", "Olivia", "Ava", "Isabella", "Mia", "Charlotte", "Amelia"]
  const lastInitials = ["A", "B", "C", "D", "E", "F", "G", "H", "J", "K", "L", "M"]
  const randomFirst = firstNames[Math.floor(Math.random() * firstNames.length)]
  const randomInitial = lastInitials[Math.floor(Math.random() * lastInitials.length)]
  return `${randomFirst} ${randomInitial}.`
}