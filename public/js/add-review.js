document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("reviewForm")
  const resultDiv = document.getElementById("result")
  let sentiment

  if (window.ml5) {
    sentiment = window.ml5.sentiment("movieReviews")
    console.log("Sentiment analysis model loaded")
  } else {
    console.error("ml5 is not available. Make sure it's properly loaded.")
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault()

    const formData = new FormData(form)
    const reviewText = formData.get("reviewText")

    // Perform sentiment analysis
    if (sentiment) {
      const result = sentiment.predict(reviewText)
      console.log("Sentiment score:", result.score)
      formData.append("sentimentScore", result.score)
    } else {
      console.warn("Sentiment analysis not available, using default score")
      formData.append("sentimentScore", 0.5) // Default neutral score
    }

    try {
      const response = await fetch("/api/add-review", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        resultDiv.textContent = data.message
        resultDiv.className = "result-message success"
        form.reset()
      } else {
        throw new Error("Failed to submit review")
      }
    } catch (error) {
      console.error("Error:", error)
      resultDiv.textContent = "An error occurred while submitting the review. Please try again."
      resultDiv.className = "result-message error"
    }
  })
})