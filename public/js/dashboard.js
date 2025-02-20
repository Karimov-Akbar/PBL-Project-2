document.addEventListener("DOMContentLoaded", () => {
  fetchReviews()
})

async function fetchReviews() {
  const response = await fetch("/api/reviews")
  const reviews = await response.json()

  displayStats(reviews)
  displaySentiment(reviews)
  displayRatingDistribution(reviews)
  displayTopDepartments(reviews)
  displayAgeDistribution(reviews)
  displayRecentReviews(reviews)
}

function displayStats(reviews) {
  const totalReviews = reviews.length
  const averageRating = (reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews).toFixed(2)
  const recommendedCount = reviews.filter((review) => review.recommended_ind === 1).length

  const statsContent = document.getElementById("statsContent")
  statsContent.innerHTML = `
      <p><strong>Total Reviews:</strong> ${totalReviews}</p>
      <p><strong>Average Rating:</strong> ${averageRating} / 5</p>
      <p><strong>Recommended:</strong> ${recommendedCount} (${((recommendedCount / totalReviews) * 100).toFixed(2)}%)</p>
  `
}

function displaySentiment(reviews) {
  // Filter out reviews with null or undefined sentiment scores
  const validReviews = reviews.filter((review) => review.sentiment_score != null)
  const sentiments = validReviews.map((review) => Number.parseFloat(review.sentiment_score))
  const averageSentiment =
    sentiments.length > 0 ? (sentiments.reduce((sum, score) => sum + score, 0) / sentiments.length).toFixed(2) : 0

  const sentimentContent = document.getElementById("sentimentContent")
  sentimentContent.innerHTML = `
      <p><strong>Average Sentiment Score:</strong> ${averageSentiment}</p>
      <p><strong>Interpretation:</strong> ${interpretSentiment(averageSentiment)}</p>
  `
}

function interpretSentiment(score) {
  score = Number.parseFloat(score)
  if (score > 0.7) return "Very Positive"
  if (score > 0.5) return "Positive"
  if (score > 0.3) return "Neutral"
  if (score > 0.1) return "Negative"
  return "Very Negative"
}

function displayRatingDistribution(reviews) {
  const ratings = [0, 0, 0, 0, 0]
  reviews.forEach((review) => {
    ratings[review.rating - 1]++
  })

  const ctx = document.getElementById("ratingChart").getContext("2d")
  new window.Chart(ctx, {
    type: "bar",
    data: {
      labels: ["1 Star", "2 Stars", "3 Stars", "4 Stars", "5 Stars"],
      datasets: [
        {
          label: "Number of Reviews",
          data: ratings,
          backgroundColor: "rgba(255, 107, 107, 0.8)",
          borderColor: "rgba(255, 107, 107, 1)",
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          bodyFont: {
            size: 14,
          },
          padding: 12,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: "rgba(0, 0, 0, 0.1)",
          },
          ticks: {
            font: {
              size: 14,
            },
          },
        },
        x: {
          grid: {
            display: false,
          },
          ticks: {
            font: {
              size: 14,
            },
          },
        },
      },
    },
  })
}

function displayTopDepartments(reviews) {
  const departments = {}
  reviews.forEach((review) => {
    departments[review.department_name] = (departments[review.department_name] || 0) + 1
  })

  const sortedDepartments = Object.entries(departments)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  const ctx = document.getElementById("departmentChart").getContext("2d")
  new window.Chart(ctx, {
    type: "pie",
    data: {
      labels: sortedDepartments.map((d) => d[0]),
      datasets: [
        {
          data: sortedDepartments.map((d) => d[1]),
          backgroundColor: [
            "rgba(255, 99, 132, 0.8)",
            "rgba(54, 162, 235, 0.8)",
            "rgba(255, 206, 86, 0.8)",
            "rgba(75, 192, 192, 0.8)",
            "rgba(153, 102, 255, 0.8)",
          ],
          borderColor: [
            "rgba(255, 99, 132, 1)",
            "rgba(54, 162, 235, 1)",
            "rgba(255, 206, 86, 1)",
            "rgba(75, 192, 192, 1)",
            "rgba(153, 102, 255, 1)",
          ],
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "right",
          labels: {
            padding: 20,
            font: {
              size: 14,
            },
            generateLabels: (chart) => {
              const data = chart.data
              if (data.labels.length && data.datasets.length) {
                return data.labels.map((label, i) => {
                  const value = data.datasets[0].data[i]
                  const total = data.datasets[0].data.reduce((acc, val) => acc + val, 0)
                  const percentage = ((value / total) * 100).toFixed(1)
                  return {
                    text: `${label}: ${percentage}%`,
                    fillStyle: data.datasets[0].backgroundColor[i],
                    strokeStyle: data.datasets[0].borderColor[i],
                    lineWidth: 2,
                    hidden: false,
                    index: i,
                  }
                })
              }
              return []
            },
          },
        },
        tooltip: {
          bodyFont: {
            size: 14,
          },
          padding: 12,
        },
      },
    },
  })
}

function displayAgeDistribution(reviews) {
  const ageGroups = {
    "< 20": 0,
    "20-29": 0,
    "30-39": 0,
    "40-49": 0,
    "50+": 0,
  }

  reviews.forEach((review) => {
    const age = review.age
    if (age < 20) ageGroups["< 20"]++
    else if (age < 30) ageGroups["20-29"]++
    else if (age < 40) ageGroups["30-39"]++
    else if (age < 50) ageGroups["40-49"]++
    else ageGroups["50+"]++
  })

  const ctx = document.getElementById("ageChart").getContext("2d")
  new window.Chart(ctx, {
    type: "doughnut",
    data: {
      labels: Object.keys(ageGroups),
      datasets: [
        {
          data: Object.values(ageGroups),
          backgroundColor: [
            "rgba(255, 99, 132, 0.8)",
            "rgba(54, 162, 235, 0.8)",
            "rgba(255, 206, 86, 0.8)",
            "rgba(75, 192, 192, 0.8)",
            "rgba(153, 102, 255, 0.8)",
          ],
          borderColor: [
            "rgba(255, 99, 132, 1)",
            "rgba(54, 162, 235, 1)",
            "rgba(255, 206, 86, 1)",
            "rgba(75, 192, 192, 1)",
            "rgba(153, 102, 255, 1)",
          ],
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "right",
          labels: {
            padding: 20,
            font: {
              size: 14,
            },
            generateLabels: (chart) => {
              const data = chart.data
              if (data.labels.length && data.datasets.length) {
                return data.labels.map((label, i) => {
                  const value = data.datasets[0].data[i]
                  const total = data.datasets[0].data.reduce((acc, val) => acc + val, 0)
                  const percentage = ((value / total) * 100).toFixed(1)
                  return {
                    text: `${label}: ${percentage}%`,
                    fillStyle: data.datasets[0].backgroundColor[i],
                    strokeStyle: data.datasets[0].borderColor[i],
                    lineWidth: 2,
                    hidden: false,
                    index: i,
                  }
                })
              }
              return []
            },
          },
        },
        tooltip: {
          bodyFont: {
            size: 14,
          },
          padding: 12,
        },
      },
      cutout: "60%",
    },
  })
}

function displayRecentReviews(reviews) {
  const recentReviews = reviews.slice(-5).reverse()
  const reviewsContent = document.getElementById("reviewsContent")

  reviewsContent.innerHTML = recentReviews
    .map(
      (review) => `
      <div class="review">
          <h3>${review.title}</h3>
          <p><strong>Rating:</strong> ${review.rating}/5</p>
          <p><strong>Department:</strong> ${review.department_name}</p>
          <p>${review.review_text.substring(0, 150)}...</p>
      </div>
  `,
    )
    .join("")
}