document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("reviewForm")
  const resultDiv = document.getElementById("result")
  const reviewTextarea = document.getElementById("reviewText")
  const sentimentScoreDiv = document.getElementById("sentimentScore")
  const sentimentMeterBar = document.getElementById("sentimentMeterBar")
  const sentimentInterpretation = document.getElementById("sentimentInterpretation")
  const ratingSelect = document.getElementById("rating")
  let sentiment
  let lastAnalyzedText = ""
  let debounceTimeout
  let currentSentimentScore = 0.5 // Track the current sentiment score

  // Initialize ml5.js sentiment analysis
  if (window.ml5) {
    try {
      sentiment = window.ml5.sentiment("movieReviews", () => {
        console.log("Sentiment analysis model loaded successfully")
        // Test the model with sample texts to verify it works
        testSentiment("This is wonderful, I love it!")
        testSentiment("This is terrible, I hate it!")
      })
      console.log("Sentiment analysis model loading...")
    } catch (error) {
      console.error("Error initializing sentiment analysis:", error)
      sentimentScoreDiv.textContent = "Sentiment analysis not available"
    }
  } else {
    console.error("ml5 is not available. Make sure it's properly loaded.")
    sentimentScoreDiv.textContent = "Sentiment analysis not available"
  }

  // Function to test sentiment analysis
  async function testSentiment(text) {
    try {
      const result = await sentiment.predict(text)
      console.log(`Test sentiment for "${text}":`, result)
    } catch (error) {
      console.error("Test sentiment error:", error)
    }
  }

  // Function to analyze sentiment using ml5.js confidence
  async function analyzeSentiment(text) {
    if (!sentiment) return 0.5

    try {
      const result = await sentiment.predict(text)
      console.log("Sentiment analysis result:", result)

      // Use the confidence value from ml5.js
      if (result && typeof result === "object" && result.confidence !== undefined) {
        // The confidence seems to be high for positive sentiment and low for negative
        // We'll use this as our sentiment score
        return result.confidence
      }

      return 0.5 // Default neutral score
    } catch (error) {
      console.error("Error analyzing sentiment:", error)
      return 0.5 // Default neutral score on error
    }
  }

  // Function to update sentiment display
  function updateSentimentDisplay(score) {
    // Store the current sentiment score
    currentSentimentScore = score

    sentimentScoreDiv.textContent = `Score: ${score.toFixed(2)}`

    // Update the sentiment meter
    const percentage = score * 100
    sentimentMeterBar.style.width = `${percentage}%`

    // Add appropriate color based on sentiment
    sentimentMeterBar.className = "sentiment-meter-bar"

    // Update rating dropdown based on sentiment score
    let sentimentText = ""
    let ratingValue = ""

    if (score > 0.8) {
      sentimentMeterBar.classList.add("very-positive")
      sentimentText = "Very Positive"
      ratingValue = "5" // Excellent
    } else if (score > 0.6) {
      sentimentMeterBar.classList.add("positive")
      sentimentText = "Positive"
      ratingValue = "4" // Good
    } else if (score > 0.4) {
      sentimentMeterBar.classList.add("neutral")
      sentimentText = "Neutral"
      ratingValue = "3" // Average
    } else if (score > 0.2) {
      sentimentMeterBar.classList.add("negative")
      sentimentText = "Negative"
      ratingValue = "2" // Fair
    } else {
      sentimentMeterBar.classList.add("very-negative")
      sentimentText = "Very Negative"
      ratingValue = "1" // Poor
    }

    sentimentInterpretation.textContent = sentimentText

    // Update the rating dropdown if it hasn't been manually changed
    if (!ratingSelect.dataset.manuallySelected) {
      ratingSelect.value = ratingValue
    }
  }

  // Add event listener for text input to perform real-time sentiment analysis
  reviewTextarea.addEventListener("input", () => {
    // Use debounce to avoid analyzing on every keystroke
    clearTimeout(debounceTimeout)
    debounceTimeout = setTimeout(async () => {
      const reviewText = reviewTextarea.value.trim()

      // Only analyze if there's text and it's different from last analysis
      if (reviewText && reviewText !== lastAnalyzedText) {
        lastAnalyzedText = reviewText

        const score = await analyzeSentiment(reviewText)
        updateSentimentDisplay(score)
      } else if (!reviewText) {
        // Reset display if text is empty
        sentimentScoreDiv.textContent = "Type your review to see sentiment score"
        sentimentMeterBar.style.width = "0%"
        sentimentInterpretation.textContent = ""
        currentSentimentScore = 0.5

        // Reset rating if it hasn't been manually changed
        if (!ratingSelect.dataset.manuallySelected) {
          ratingSelect.value = ""
        }
      }
    }, 500) // Wait for 500ms after the user stops typing
  })

  // Track when the user manually changes the rating
  ratingSelect.addEventListener("change", () => {
    if (ratingSelect.value) {
      ratingSelect.dataset.manuallySelected = "true"
    } else {
      delete ratingSelect.dataset.manuallySelected
    }
  })

  form.addEventListener("submit", async (e) => {
    e.preventDefault()

    const formData = new FormData(form)
    const reviewText = formData.get("reviewText")

    // Use the current sentiment score that was calculated during typing
    formData.append("sentimentScore", currentSentimentScore.toString())

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
        // Reset sentiment display
        sentimentScoreDiv.textContent = "Type your review to see sentiment score"
        sentimentMeterBar.style.width = "0%"
        sentimentInterpretation.textContent = ""
        lastAnalyzedText = ""
        currentSentimentScore = 0.5
        delete ratingSelect.dataset.manuallySelected
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