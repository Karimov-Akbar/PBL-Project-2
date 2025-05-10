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
  let currentSentimentScore = 0.5

  if (window.ml5) {
    try {
      sentiment = window.ml5.sentiment("movieReviews", () => {
        console.log("Sentiment analysis model loaded successfully")
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

  async function testSentiment(text) {
    try {
      const result = await sentiment.predict(text)
      console.log(`Test sentiment for "${text}":`, result)
    } catch (error) {
      console.error("Test sentiment error:", error)
    }
  }

  function splitIntoSentences(text) {
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
      .replace(/\bi\b\./g, "i")

    return preprocessed
      .split(/(?<=[.!?])\s+|(?<=[.!?])$/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .map((s) => {
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

  function splitIntoClauses(sentence) {
    const clauseSplitters =
      /,\s+|\s+but\s+|\s+yet\s+|\s+however\s+|\s+although\s+|\s+though\s+|\s+despite\s+|\s+nevertheless\s+|\s+nonetheless\s+|\s+still\s+|\s+while\s+|\s+whereas\s+|\s+even\s+though\s+/gi

    const clauses = sentence
      .split(clauseSplitters)
      .map((c) => c.trim())
      .filter((c) => c.length > 0)

    return clauses
  }

  async function analyzeSentiment(text) {
    if (!sentiment) return 0.5

    try {

      if (isNeutralStatement(text)) {
        console.log("Neutral statement detected:", text);
        return 0.5;
      }

      const overallResult = await sentiment.predict(text)
      console.log("Overall sentiment result:", overallResult)

      let overallScore = 0.5
      if (overallResult && typeof overallResult === "object" && overallResult.confidence !== undefined) {
        overallScore = overallResult.confidence
      }

      const hasMixedSentimentIndicators =
        /but|however|although|though|yet|despite|nevertheless|nonetheless|still|while|whereas|even though/i.test(text)

      const sentences = splitIntoSentences(text)
      console.log("Sentences:", sentences)

      const sentenceScores = []
      let totalPositiveSentences = 0
      let totalNegativeSentences = 0
      let totalNeutralSentences = 0

      for (const sentence of sentences) {
        if (sentence.length < 3) continue

        const sentenceResult = await sentiment.predict(sentence)
        let sentenceScore = 0.5

        if (sentenceResult && typeof sentenceResult === "object" && sentenceResult.confidence !== undefined) {
          sentenceScore = sentenceResult.confidence
        }

        if (sentenceScore > 0.7) {
          totalPositiveSentences++
        } else if (sentenceScore < 0.3) {
          totalNegativeSentences++
        } else {
          totalNeutralSentences++
        }

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
      return 0.5
    }
  }

  function isNeutralStatement(text) {
    const normalizedText = text.trim().toLowerCase();
    
    const words = normalizedText.split(/\s+/);
    
    if (words.length <= 5) {
      if (normalizedText.includes('!') || normalizedText.includes('?')) {
        return false;
      }
      
      const hasIntensifiers = words.some(word => word.endsWith('ly'));
      if (hasIntensifiers) {
        return false;
      }

      const hasComparatives = words.some(word => 
        word.endsWith('er') && word.length > 3 || 
        word.endsWith('est') && word.length > 4);
      if (hasComparatives) {
        return false;
      }
      
      const emotionalPunctuation = normalizedText.match(/[!?]{2,}|\.{3,}/g);
      if (emotionalPunctuation) {
        return false;
      }
      
      const originalWords = text.trim().split(/\s+/);
      const hasAllCapsWords = originalWords.some(word => 
        word.length > 1 && word === word.toUpperCase());
      if (hasAllCapsWords) {
        return false;
      }
      
      const wordLengths = words.map(word => word.length);
      const avgWordLength = wordLengths.reduce((sum, len) => sum + len, 0) / words.length;
      const variance = wordLengths.reduce((sum, len) => sum + Math.pow(len - avgWordLength, 2), 0) / words.length;
      
      if (variance > 4) {
        return false;
      }
      
      if (words.length >= 2) {
        const firstWord = words[0];
        const secondWord = words[1];
        
        const isFirstWordShort = firstWord.length <= 3;
        
        const isSecondWordShort = secondWord.length <= 4;
        
        if (isFirstWordShort && isSecondWordShort) {
          return true;
        }
      }
      
      if (words.length <= 3) {
        return true;
      }
    }
    
    return false;
  }

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

    let totalSentenceScore = 0
    sentenceScores.forEach((item) => {
      totalSentenceScore += item.score
    })
    const averageSentenceScore = totalSentenceScore / sentenceScores.length

    let hasClauseLevelMixedSentiment = false
    let lowestClauseScore = 1
    let highestClauseScore = 0
    let clauseScoreDifference = 0
    let totalPositiveClauses = 0
    let totalNegativeClauses = 0
    let totalNeutralClauses = 0

    sentenceScores.forEach((sentence) => {
      if (sentence.clauses && sentence.clauses.length > 1) {
        totalPositiveClauses += sentence.positiveClauseCount || 0
        totalNegativeClauses += sentence.negativeClauseCount || 0
        totalNeutralClauses += sentence.neutralClauseCount || 0

        const clauseScores = sentence.clauses.map((c) => c.score)
        const minClauseScore = Math.min(...clauseScores)
        const maxClauseScore = Math.max(...clauseScores)

        lowestClauseScore = Math.min(lowestClauseScore, minClauseScore)
        highestClauseScore = Math.max(highestClauseScore, maxClauseScore)

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

    let sentimentShifts = 0
    let lastScore = sentenceScores[0].score

    for (let i = 1; i < sentenceScores.length; i++) {
      const currentScore = sentenceScores[i].score
      const scoreDifference = Math.abs(currentScore - lastScore)

      if (scoreDifference > 0.2) {
        sentimentShifts++
      }

      lastScore = currentScore
    }

    const lastThirdSentences = sentenceScores.slice(-Math.max(1, Math.floor(sentenceScores.length / 3)))
    let lastThirdScore = 0
    lastThirdSentences.forEach((item) => {
      lastThirdScore += item.score
    })
    const averageLastThirdScore = lastThirdScore / lastThirdSentences.length

    const extremeSentences = sentenceScores.filter((item) => item.score > 0.8 || item.score < 0.2)
    const hasExtremePositive = extremeSentences.some((item) => item.score > 0.8)
    const hasExtremeNegative = extremeSentences.some((item) => item.score < 0.2)

    const exclamationCount = (fullText.match(/!/g) || []).length
    const questionCount = (fullText.match(/\?/g) || []).length
    const allCapsWords = fullText.match(/\b[A-Z]{2,}\b/g) || []

    let enhancedScore

    const hasMixedSentiment =
      hasMixedSentimentIndicators ||
      hasClauseLevelMixedSentiment ||
      (hasExtremePositive && hasExtremeNegative) ||
      (totalPositiveSentences > 0 && totalNegativeSentences > 0) ||
      (totalPositiveClauses > 0 && totalNegativeClauses > 0)

    const startsPositiveWithIssues =
      sentenceScores.length > 0 && sentenceScores[0].score > 0.7 && totalNegativeSentences > 0

    const hasMultipleNegativePoints = totalNegativeSentences > 1 || totalNegativeClauses > 2

    const hasMoreNegativeThanPositive =
      totalNegativeSentences > totalPositiveSentences || totalNegativeClauses > totalPositiveClauses

    console.log("Pattern detection:", {
      hasMixedSentiment,
      startsPositiveWithIssues,
      hasMultipleNegativePoints,
      hasMoreNegativeThanPositive,
    })

    if (hasMixedSentiment) {
      const baseScore = overallScore * 0.2 + averageSentenceScore * 0.3 + averageLastThirdScore * 0.5

      if (hasMoreNegativeThanPositive) {
        enhancedScore = 0.4 + (baseScore - 0.5) * 0.4
      }
      else if (startsPositiveWithIssues) {
        enhancedScore = 0.45 + (baseScore - 0.5) * 0.5
      }
      else if (hasMultipleNegativePoints) {
        enhancedScore = 0.5 + (baseScore - 0.5) * 0.6
      }
      else {
        enhancedScore = 0.5 + (baseScore - 0.5) * 0.7
      }

      if (overallScore > 0.8 && (totalNegativeSentences > 1 || totalNegativeClauses > 2)) {
        enhancedScore = 0.5 + (enhancedScore - 0.5) * 0.4
      }
    } else {
      enhancedScore = overallScore * 0.4 + averageSentenceScore * 0.3 + averageLastThirdScore * 0.3
    }

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

    if (fullText.length < 30 && !hasMixedSentimentIndicators && 
        !hasExtremePositive && !hasExtremeNegative && 
        exclamationCount === 0 && allCapsWords.length === 0) {
      enhancedScore = 0.5;
      console.log("Short factual statement detected, setting to neutral");
    }
    
    const wordCount = fullText.split(/\s+/).length;
    const sentimentWordRatio = extremeSentences.length / wordCount;
    
    if (sentimentWordRatio < 0.1 && sentenceScores.length > 0) {
      enhancedScore = 0.5 + (enhancedScore - 0.5) * 0.3;
      console.log("Low sentiment word ratio detected, adjusting toward neutral");
    }

    enhancedScore = Math.max(0, Math.min(1, enhancedScore))

    return enhancedScore
  }

  function updateSentimentDisplay(score) {
    currentSentimentScore = score

    sentimentScoreDiv.textContent = `Score: ${score.toFixed(2)}`

    const percentage = score * 100
    sentimentMeterBar.style.width = `${percentage}%`

    sentimentMeterBar.className = "sentiment-meter-bar"

    let sentimentText = ""
    let ratingValue = ""

    if (score > 0.8) {
      sentimentMeterBar.classList.add("very-positive")
      sentimentText = "Very Positive"
      ratingValue = "5"
    } else if (score > 0.6) {
      sentimentMeterBar.classList.add("positive")
      sentimentText = "Positive"
      ratingValue = "4"
    } else if (score > 0.4) {
      sentimentMeterBar.classList.add("neutral")
      sentimentText = "Neutral"
      ratingValue = "3"
    } else if (score > 0.2) {
      sentimentMeterBar.classList.add("negative")
      sentimentText = "Negative"
      ratingValue = "2"
    } else {
      sentimentMeterBar.classList.add("very-negative")
      sentimentText = "Very Negative"
      ratingValue = "1"
    }

    sentimentInterpretation.textContent = sentimentText

    if (!ratingSelect.dataset.manuallySelected) {
      ratingSelect.value = ratingValue
    }
  }

  reviewTextarea.addEventListener("input", () => {
    clearTimeout(debounceTimeout)
    debounceTimeout = setTimeout(async () => {
      const reviewText = reviewTextarea.value.trim()

      if (reviewText && reviewText !== lastAnalyzedText) {
        lastAnalyzedText = reviewText

        const score = await analyzeSentiment(reviewText)
        updateSentimentDisplay(score)
      } else if (!reviewText) {
        sentimentScoreDiv.textContent = "Type your review to see sentiment score"
        sentimentMeterBar.style.width = "0%"
        sentimentInterpretation.textContent = ""
        currentSentimentScore = 0.5

        if (!ratingSelect.dataset.manuallySelected) {
          ratingSelect.value = ""
        }
      }
    }, 500)
  })

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