document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search)
  const category = urlParams.get("category")

  if (category) {
    loadCategoryReviews(category)
    setCategoryImage(category)
  } else {
    window.location.href = "/clothes.html"
  }
})

function setCategoryImage(category) {
  const categoryImages = {
    Dresses:
      "https://images.pexels.com/photos/985635/pexels-photo-985635.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    Tops: "https://images.pexels.com/photos/20303775/pexels-photo-20303775.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    Bottoms:
      "https://images.pexels.com/photos/1598507/pexels-photo-1598507.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    Intimate:
      "https://images.pexels.com/photos/15373662/pexels-photo-15373662.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    Jackets:
      "https://images.pexels.com/photos/16897756/pexels-photo-16897756.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
  }

  const categoryImage = document.getElementById("categoryImage")
  categoryImage.src = categoryImages[category] || categoryImages["Dresses"]
  categoryImage.alt = `${category} category image`
}

async function loadCategoryReviews(category, page = 1) {
  const categoryTitle = document.getElementById("categoryTitle")
  const averageReview = document.getElementById("averageReview")
  const latestReviews = document.getElementById("latestReviews")
  const allReviews = document.getElementById("allReviews")

  categoryTitle.textContent = category
  averageReview.textContent = "Loading..."
  latestReviews.innerHTML = '<div class="loading">Loading latest reviews...</div>'
  allReviews.innerHTML = '<div class="loading">Loading reviews...</div>'

  try {
    const response = await fetch(`/api/reviews/${category}?page=${page}`)
    const data = await response.json()

    displayAverageReview(data.averageReview)
    displayLatestReviews(data.latestReviews)
    displayAllReviews(data.allReviews)
    setupPagination(data.totalReviews, category, page)
  } catch (error) {
    console.error("Error fetching reviews:", error)
    averageReview.textContent = "Error loading reviews."
    latestReviews.innerHTML = '<div class="error">Error loading latest reviews.</div>'
    allReviews.innerHTML = '<div class="error">Error loading reviews.</div>'
  }
}

function displayAverageReview(averageReview) {
  const averageReviewElement = document.getElementById("averageReview")
  averageReviewElement.textContent = `Average Rating: ${averageReview.toFixed(2)} / 5`
}

function displayLatestReviews(reviews) {
  const latestReviewsElement = document.getElementById("latestReviews")
  latestReviewsElement.innerHTML = reviews
    .slice(0, 3)
    .map(
      (review) => `
            <div class="review-card">
                <h3>${review.title || "No Title"}</h3>
                <p class="review-text">${review.review_text || "No review text available."}</p>
                <div class="review-rating">Rating: ${review.rating || "N/A"} / 5</div>
            </div>
        `,
    )
    .join("")
}

function displayAllReviews(reviews) {
  const allReviewsElement = document.getElementById("allReviews")
  if (reviews.length === 0) {
    allReviewsElement.innerHTML = '<div class="no-reviews">No reviews found.</div>'
    return
  }
  allReviewsElement.innerHTML = reviews
    .map(
      (review) => `
            <div class="review-card">
                <div class="review-card-rating">
                    <div class="review-rating">Rating:</div>
                    <div class="rating-value">${review.rating || "N/A"}/5</div>
                </div>
                <div class="review-card-content">
                    <h3>${review.title || "No Title"}</h3>
                    <p class="review-text">${review.review_text || "No review text available."}</p>
                </div>
            </div>
        `,
    )
    .join("")
}

function setupPagination(totalReviews, category, currentPage) {
  const paginationElement = document.getElementById("pagination")
  const pageNumbersElement = document.getElementById("pageNumbers")
  const prevPageButton = document.getElementById("prevPage")
  const nextPageButton = document.getElementById("nextPage")

  const totalPages = Math.ceil(totalReviews / 3)
  currentPage = Number(currentPage)

  // Update prev/next button states
  prevPageButton.disabled = currentPage === 1
  nextPageButton.disabled = currentPage === totalPages

  // Add event listeners for prev/next buttons
  prevPageButton.onclick = () => {
    if (currentPage > 1) loadCategoryReviews(category, currentPage - 1)
  }
  nextPageButton.onclick = () => {
    if (currentPage < totalPages) loadCategoryReviews(category, currentPage + 1)
  }

  // Generate page numbers
  let pageNumbers = ""
  const maxVisiblePages = 5
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
  const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1)
  }

  if (startPage > 1) {
    pageNumbers += `<button class="pagination-button" data-page="1">1</button>`
    if (startPage > 2) pageNumbers += '<span class="pagination-ellipsis">...</span>'
  }

  for (let i = startPage; i <= endPage; i++) {
    pageNumbers += `<button class="pagination-button ${i === currentPage ? "active" : ""}" data-page="${i}">${i}</button>`
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) pageNumbers += '<span class="pagination-ellipsis">...</span>'
    pageNumbers += `<button class="pagination-button" data-page="${totalPages}">${totalPages}</button>`
  }

  pageNumbersElement.innerHTML = pageNumbers

  // Add event listeners for page number buttons
  pageNumbersElement.querySelectorAll(".pagination-button").forEach((button) => {
    button.addEventListener("click", () => {
      const page = button.getAttribute("data-page")
      loadCategoryReviews(category, page)
    })
  })
}

// Initial load
const urlParams = new URLSearchParams(window.location.search)
const category = urlParams.get("category")
const page = urlParams.get("page") || 1
if (category) {
  loadCategoryReviews(category, page)
  setCategoryImage(category)
}

