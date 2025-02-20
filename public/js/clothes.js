document.addEventListener("DOMContentLoaded", () => {
  fetchClothesCategories()
})

async function fetchClothesCategories() {
  try {
    const response = await fetch("/api/clothes-categories")
    const categories = await response.json()
    displayClothesCategories(categories)
  } catch (error) {
    console.error("Error fetching clothes categories:", error)
    document.getElementById("clothesGrid").innerHTML =
      '<p class="error">Error loading categories. Please try again later.</p>'
  }
}

function displayClothesCategories(categories) {
  const clothesGrid = document.getElementById("clothesGrid")
  clothesGrid.innerHTML = categories
    .map(
      (category) => `
        <a href="/category-reviews?category=${encodeURIComponent(category.name)}" 
           class="clothes-item">
            <img src="${category.image}" alt="${category.name}">
            <h2>${category.name}</h2>
        </a>
    `,
    )
    .join("")
}

function setupModal() {
  const modal = document.getElementById("reviewsModal")
  const closeButton = modal.querySelector(".close-button")

  closeButton.onclick = () => {
    modal.style.display = "none"
  }

  window.onclick = (event) => {
    if (event.target == modal) {
      modal.style.display = "none"
    }
  }
}

async function openReviewsModal(category) {
  const modal = document.getElementById("reviewsModal")
  const modalTitle = document.getElementById("modalTitle")
  const averageReview = document.getElementById("averageReview")
  const latestReviews = document.getElementById("latestReviews")
  const allReviews = document.getElementById("allReviews")
  const pagination = document.getElementById("pagination")

  modalTitle.textContent = category
  averageReview.textContent = "Loading..."
  latestReviews.textContent = "Loading..."
  allReviews.textContent = "Loading..."
  pagination.innerHTML = ""

  modal.style.display = "block"

  try {
    const response = await fetch(`/api/reviews/${category}`)
    const data = await response.json()

    displayAverageReview(data.averageReview)
    displayLatestReviews(data.latestReviews)
    displayAllReviews(data.allReviews)
    setupPagination(data.totalReviews, category)
  } catch (error) {
    console.error("Error fetching reviews:", error)
    averageReview.textContent = "Error loading reviews."
    latestReviews.textContent = "Error loading reviews."
    allReviews.textContent = "Error loading reviews."
  }
}

function displayAverageReview(averageReview) {
  const averageReviewElement = document.getElementById("averageReview")
  averageReviewElement.textContent = `Average Review: ${averageReview.toFixed(2)} / 5`
}

function displayLatestReviews(reviews) {
  const latestReviewsElement = document.getElementById("latestReviews")
  latestReviewsElement.innerHTML = reviews
    .map(
      (review) => `
        <div class="review">
            <h4>${review.title || "No Title"}</h4>
            <p>Rating: ${review.rating || "N/A"} / 5</p>
            <p>${review.text ? review.text.substring(0, 100) + "..." : "No review text available."}</p>
        </div>
    `,
    )
    .join("")
}

function displayAllReviews(reviews) {
  const allReviewsElement = document.getElementById("allReviews")
  allReviewsElement.innerHTML = reviews
    .map(
      (review) => `
        <div class="review">
            <h4>${review.title || "No Title"}</h4>
            <p>Rating: ${review.rating || "N/A"} / 5</p>
            <p>${review.text || "No review text available."}</p>
        </div>
    `,
    )
    .join("")
}

function setupPagination(totalReviews, category) {
  const paginationElement = document.getElementById("pagination")
  const totalPages = Math.ceil(totalReviews / 10)

  paginationElement.innerHTML = Array.from(
    { length: totalPages },
    (_, i) => `
        <button class="pagination-button" data-page="${i + 1}">${i + 1}</button>
    `,
  ).join("")

  paginationElement.addEventListener("click", async (event) => {
    if (event.target.classList.contains("pagination-button")) {
      const page = event.target.dataset.page
      try {
        const response = await fetch(`/api/reviews/${category}?page=${page}`)
        const data = await response.json()
        displayAllReviews(data.allReviews)
      } catch (error) {
        console.error("Error fetching reviews:", error)
        document.getElementById("allReviews").textContent = "Error loading reviews. Please try again."
      }
    }
  })
}