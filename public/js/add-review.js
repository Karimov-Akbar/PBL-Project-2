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
        testSentiment("Love the color and style, but material snags easily")
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

  // Split text into sentences
  function splitIntoSentences(text) {
    // Handle common abbreviations to avoid false sentence breaks
    const preprocessed = text
      .replace(/Mr\./g, "Mr")
      .replace(/Mrs\./g, "Mrs")
      .replace(/Dr\./g, "Dr")
      .replace(/Ms\./g, "Ms")
      .replace(/etc\./g, "etc")
      .replace(/vs\./g, "vs")
      .replace(/i\.e\./g, "ie")
      .replace(/e\.g\./g, "eg")
      .replace(/St\./g, "St")
      .replace(/\bi\b\./g, "i") // Handle lowercase "i."

    // Split by sentence terminators followed by space or end of string
    return preprocessed
      .split(/(?<=[.!?])\s+|(?<=[.!?])$/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .map((s) => {
        // Restore periods to common abbreviations
        return s
          .replace(/\bMr\b/g, "Mr.")
          .replace(/\bMrs\b/g, "Mrs.")
          .replace(/\bDr\b/g, "Dr.")
          .replace(/\bMs\b/g, "Ms.")
          .replace(/\betc\b/g, "etc.")
          .replace(/\bvs\b/g, "vs.")
          .replace(/\bie\b/g, "i.e.")
          .replace(/\beg\b/g, "e.g.")
          .replace(/\bSt\b/g, "St.")
      })
  }

  // Split a sentence into clauses based on common conjunctions and punctuation
  function splitIntoClauses(sentence) {
    // Split on common conjunctions and punctuation that separate clauses
    const clauseSplitters =
      /,\s+|\s+but\s+|\s+yet\s+|\s+however\s+|\s+although\s+|\s+though\s+|\s+despite\s+|\s+nevertheless\s+|\s+nonetheless\s+|\s+still\s+|\s+while\s+|\s+whereas\s+|\s+even\s+though\s+/gi

    const clauses = sentence
      .split(clauseSplitters)
      .map((c) => c.trim())
      .filter((c) => c.length > 0)

    return clauses
  }

  // Enhanced sentiment analysis without predefined word lists
  async function analyzeSentiment(text) {
    if (!sentiment) return 0.5

    try {
      // Get overall base sentiment from ml5.js
      const overallResult = await sentiment.predict(text)
      console.log("Overall sentiment result:", overallResult)

      let overallScore = 0.5
      if (overallResult && typeof overallResult === "object" && overallResult.confidence !== undefined) {
        overallScore = overallResult.confidence
      }

      // Check if this is a review with mixed sentiment
      const hasMixedSentimentIndicators =
        /but|however|although|though|yet|despite|nevertheless|nonetheless|still|while|whereas|even though/i.test(text)

      // Split the review into sentences for more detailed analysis
      const sentences = splitIntoSentences(text)
      console.log("Sentences:", sentences)

      // Analyze each sentence individually
      const sentenceScores = []
      let totalPositiveSentences = 0
      let totalNegativeSentences = 0
      let totalNeutralSentences = 0

      for (const sentence of sentences) {
        if (sentence.length < 3) continue // Skip very short sentences

        const sentenceResult = await sentiment.predict(sentence)
        let sentenceScore = 0.5

        if (sentenceResult && typeof sentenceResult === "object" && sentenceResult.confidence !== undefined) {
          sentenceScore = sentenceResult.confidence
        }

        // Count positive, negative, and neutral sentences
        if (sentenceScore > 0.7) {
          totalPositiveSentences++
        } else if (sentenceScore < 0.3) {
          totalNegativeSentences++
        } else {
          totalNeutralSentences++
        }

        // For sentences with potential mixed sentiment,
        // analyze at the clause level for more precision
        const clauses = splitIntoClauses(sentence)
        const clauseScores = []
        let totalPositiveClauses = 0
        let totalNegativeClauses = 0
        let totalNeutralClauses = 0

        if (clauses.length > 1) {
          for (const clause of clauses) {
            if (clause.length < 3) continue

            const clauseResult = await sentiment.predict(clause)
            let clauseScore = 0.5

            if (clauseResult && typeof clauseResult === "object" && clauseResult.confidence !== undefined) {
              clauseScore = clauseResult.confidence
            }

            // Count positive, negative, and neutral clauses
            if (clauseScore > 0.7) {
              totalPositiveClauses++
            } else if (clauseScore < 0.3) {
              totalNegativeClauses++
            } else {
              totalNeutralClauses++
            }

            clauseScores.push({
              text: clause,
              score: clauseScore,
            })
          }

          console.log("Clause scores for sentence:", sentence, clauseScores)
        }

        sentenceScores.push({
          text: sentence,
          score: sentenceScore,
          clauses: clauseScores,
          positiveClauseCount: totalPositiveClauses,
          negativeClauseCount: totalNegativeClauses,
          neutralClauseCount: totalNeutralClauses,
        })
      }

      console.log("Sentence scores:", sentenceScores)
      console.log(
        "Positive sentences:",
        totalPositiveSentences,
        "Negative sentences:",
        totalNegativeSentences,
        "Neutral sentences:",
        totalNeutralSentences,
      )

      // Calculate the enhanced score using multi-level analysis
      const enhancedScore = calculateEnhancedScore(
        text,
        overallScore,
        sentenceScores,
        hasMixedSentimentIndicators,
        totalPositiveSentences,
        totalNegativeSentences,
        totalNeutralSentences,
      )
      console.log("Enhanced sentiment score:", enhancedScore)

      return enhancedScore
    } catch (error) {
      console.error("Error analyzing sentiment:", error)
      return 0.5 // Default neutral score on error
    }
  }

  // Calculate enhanced score using multi-level analysis
  function calculateEnhancedScore(
    fullText,
    overallScore,
    sentenceScores,
    hasMixedSentimentIndicators,
    totalPositiveSentences,
    totalNegativeSentences,
    totalNeutralSentences,
  ) {
    if (sentenceScores.length === 0) return overallScore

    // 1. Basic sentence-level analysis
    let totalSentenceScore = 0
    sentenceScores.forEach((item) => {
      totalSentenceScore += item.score
    })
    const averageSentenceScore = totalSentenceScore / sentenceScores.length

    // 2. Clause-level analysis for mixed sentiment detection
    let hasClauseLevelMixedSentiment = false
    let lowestClauseScore = 1
    let highestClauseScore = 0
    let clauseScoreDifference = 0
    let totalPositiveClauses = 0
    let totalNegativeClauses = 0
    let totalNeutralClauses = 0

    sentenceScores.forEach((sentence) => {
      if (sentence.clauses && sentence.clauses.length > 1) {
        // Count clause sentiment types
        totalPositiveClauses += sentence.positiveClauseCount || 0
        totalNegativeClauses += sentence.negativeClauseCount || 0
        totalNeutralClauses += sentence.neutralClauseCount || 0

        // Find the min and max clause scores within this sentence
        const clauseScores = sentence.clauses.map((c) => c.score)
        const minClauseScore = Math.min(...clauseScores)
        const maxClauseScore = Math.max(...clauseScores)

        // Update overall min/max
        lowestClauseScore = Math.min(lowestClauseScore, minClauseScore)
        highestClauseScore = Math.max(highestClauseScore, maxClauseScore)

        // Check for significant difference between clauses
        const difference = maxClauseScore - minClauseScore
        clauseScoreDifference = Math.max(clauseScoreDifference, difference)

        if (difference > 0.3) {
          hasClauseLevelMixedSentiment = true
        }
      }
    })

    console.log("Clause analysis:", {
      totalPositiveClauses,
      totalNegativeClauses,
      totalNeutralClauses,
      lowestClauseScore,
      highestClauseScore,
      clauseScoreDifference,
      hasClauseLevelMixedSentiment,
    })

    // 3. Detect sentiment shifts between sentences
    let sentimentShifts = 0
    let lastScore = sentenceScores[0].score

    for (let i = 1; i < sentenceScores.length; i++) {
      const currentScore = sentenceScores[i].score
      const scoreDifference = Math.abs(currentScore - lastScore)

      // If there's a significant shift in sentiment between sentences
      if (scoreDifference > 0.2) {
        sentimentShifts++
      }

      lastScore = currentScore
    }

    // 4. Give more weight to the latter parts of reviews (conclusions)
    const lastThirdSentences = sentenceScores.slice(-Math.max(1, Math.floor(sentenceScores.length / 3)))
    let lastThirdScore = 0
    lastThirdSentences.forEach((item) => {
      lastThirdScore += item.score
    })
    const averageLastThirdScore = lastThirdScore / lastThirdSentences.length

    // 5. Check for extreme sentences (very positive or very negative)
    const extremeSentences = sentenceScores.filter((item) => item.score > 0.8 || item.score < 0.2)
    const hasExtremePositive = extremeSentences.some((item) => item.score > 0.8)
    const hasExtremeNegative = extremeSentences.some((item) => item.score < 0.2)

    // 6. Check for punctuation and formatting
    const exclamationCount = (fullText.match(/!/g) || []).length
    const questionCount = (fullText.match(/\?/g) || []).length
    const allCapsWords = fullText.match(/\b[A-Z]{2,}\b/g) || []

    // 7. Calculate the final enhanced score

    // Start with a weighted combination of scores
    let enhancedScore

    // Check for specific patterns that indicate mixed sentiment
    const hasMixedSentiment =
      hasMixedSentimentIndicators ||
      hasClauseLevelMixedSentiment ||
      (hasExtremePositive && hasExtremeNegative) ||
      (totalPositiveSentences > 0 && totalNegativeSentences > 0) ||
      (totalPositiveClauses > 0 && totalNegativeClauses > 0)

    // Check for reviews that start positive but then list multiple issues
    const startsPositiveWithIssues =
      sentenceScores.length > 0 && sentenceScores[0].score > 0.7 && totalNegativeSentences > 0

    // Check for reviews with multiple negative points
    const hasMultipleNegativePoints = totalNegativeSentences > 1 || totalNegativeClauses > 2

    // Check for reviews with more negative than positive points
    const hasMoreNegativeThanPositive =
      totalNegativeSentences > totalPositiveSentences || totalNegativeClauses > totalPositiveClauses

    console.log("Pattern detection:", {
      hasMixedSentiment,
      startsPositiveWithIssues,
      hasMultipleNegativePoints,
      hasMoreNegativeThanPositive,
    })

    // Special handling for mixed sentiment reviews
    if (hasMixedSentiment) {
      // Base score that considers all levels of analysis
      const baseScore = overallScore * 0.2 + averageSentenceScore * 0.3 + averageLastThirdScore * 0.5

      // For reviews with more negative than positive points, move toward negative
      if (hasMoreNegativeThanPositive) {
        // Calculate a score that's weighted toward the negative side
        enhancedScore = 0.4 + (baseScore - 0.5) * 0.4
      }
      // For reviews that start positive but then list issues, move toward neutral/negative
      else if (startsPositiveWithIssues) {
        enhancedScore = 0.45 + (baseScore - 0.5) * 0.5
      }
      // For reviews with multiple negative points, move toward neutral
      else if (hasMultipleNegativePoints) {
        enhancedScore = 0.5 + (baseScore - 0.5) * 0.6
      }
      // For other mixed sentiment reviews, slightly moderate the score
      else {
        enhancedScore = 0.5 + (baseScore - 0.5) * 0.7
      }

      // If the review has a high overall score but multiple negative sentences/clauses,
      // this is likely a case where ml5.js is being too positive
      if (overallScore > 0.8 && (totalNegativeSentences > 1 || totalNegativeClauses > 2)) {
        // Move significantly toward neutral
        enhancedScore = 0.5 + (enhancedScore - 0.5) * 0.4
      }
    } else {
      // Standard weighting for non-mixed reviews
      enhancedScore = overallScore * 0.4 + averageSentenceScore * 0.3 + averageLastThirdScore * 0.3
    }

    // Adjust for punctuation and formatting
    if (exclamationCount > 0) {
      const exclamationModifier = Math.min(exclamationCount * 0.03, 0.15)
      if (enhancedScore > 0.5) {
        enhancedScore += exclamationModifier
      } else if (enhancedScore < 0.5) {
        enhancedScore -= exclamationModifier
      }
    }

    if (allCapsWords.length > 0) {
      const capsModifier = Math.min(allCapsWords.length * 0.03, 0.12)
      if (enhancedScore > 0.5) {
        enhancedScore += capsModifier
      } else if (enhancedScore < 0.5) {
        enhancedScore -= capsModifier
      }
    }

    // Ensure score stays within 0-1 range
    enhancedScore = Math.max(0, Math.min(1, enhancedScore))

    return enhancedScore
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