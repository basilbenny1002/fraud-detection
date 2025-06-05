document.addEventListener("DOMContentLoaded", () => {
  // Check if user is logged in
  if (!localStorage.getItem("user_id") || !localStorage.getItem("name")) {
    window.location.href = "signin.html"
    return
  }

  // Initialize website check page
  displayUserInfo()
  setupEventListeners()
})

function displayUserInfo() {
  const userProfileNameElement = document.getElementById("userProfileName")
  const userName = localStorage.getItem("name") || "User"
  const userProfileIconElement = document.getElementById("userProfileIcon")
  const userID = localStorage.getItem("user_id") || "default"

  if (userProfileNameElement) userProfileNameElement.textContent = userName
  if (userProfileIconElement) {
    userProfileIconElement.src = `https://robohash.org/${userID}?set=set4&bgset=&size=32x32`
  }
}

function setupEventListeners() {
  // Logout functionality
  const logoutLink = document.getElementById("logoutLink")
  const logoutDropdownLink = document.getElementById("logoutDropdownLink")

  if (logoutLink) logoutLink.onclick = logout
  if (logoutDropdownLink) logoutDropdownLink.onclick = logout

  // Sidebar toggle for mobile
  const sidebarToggle = document.getElementById("sidebarToggle")
  if (sidebarToggle) {
    sidebarToggle.onclick = toggleSidebar
  }

  // Website check form submission
  const websiteCheckForm = document.getElementById("websiteCheckForm")
  if (websiteCheckForm) {
    websiteCheckForm.addEventListener("submit", handleWebsiteCheck)
  }

  // URL only mode toggle
  const urlOnlyMode = document.getElementById("urlOnlyMode")
  if (urlOnlyMode) {
    urlOnlyMode.addEventListener("change", toggleFeatureSelection)
  }
}

function toggleFeatureSelection() {
  const urlOnlyMode = document.getElementById("urlOnlyMode").checked
  const featureSelection = document.getElementById("featureSelection")

  if (urlOnlyMode) {
    featureSelection.classList.add("hidden")
  } else {
    featureSelection.classList.remove("hidden")
  }
}

function logout() {
  localStorage.clear()
  window.location.href = "signin.html"
}

function toggleSidebar() {
  const sidebar = document.querySelector(".sidebar")
  if (sidebar) {
    sidebar.classList.toggle("open")
  }
}

function handleWebsiteCheck(event) {
  event.preventDefault()

  // Get form data
  const websiteUrl = document.getElementById("websiteUrl").value
  const urlOnlyMode = document.getElementById("urlOnlyMode").checked
  const userId = localStorage.getItem("user_id")

  let features = {}

  if (!urlOnlyMode) {
    features = {
      credit_card_payment: document.getElementById("creditCardPayment").checked,
      money_back_payment: document.getElementById("moneyBackPayment").checked,
      cash_on_delivery: document.getElementById("cashOnDelivery").checked,
      crypto_currency: document.getElementById("cryptoCurrency").checked,
      free_contact_emails: document.getElementById("freeContactEmails").checked,
      logo_url: document.getElementById("logoUrl").checked,
    }
  }

  // Show results section with loading state
  const resultCard = document.getElementById("websiteCheckResult")
  resultCard.style.display = "block"

  // Update website in results
  document.getElementById("resultWebsite").textContent = websiteUrl

  // Set timestamp
  document.getElementById("resultTimestamp").textContent = new Date().toLocaleString()

  // Reset status to loading
  const statusBadge = document.getElementById("resultStatusBadge")
  statusBadge.className = "status-badge loading"
  document.getElementById("resultStatusText").textContent = "Analyzing..."

  // Reset score bar
  document.getElementById("resultScoreBar").style.width = "0%"
  document.getElementById("resultScoreBar").className = "score-fill"
  document.getElementById("resultScoreValue").textContent = "0%"

  // Reset factors list
  document.getElementById("resultFactorsList").innerHTML = '<li class="loading">Analyzing website...</li>'

  // Scroll to results
  resultCard.scrollIntoView({ behavior: "smooth" })

  // Prepare data for API request
  const requestData = {
    user_id: userId,
    website_url: websiteUrl,
    url_only_mode: urlOnlyMode,
    features: urlOnlyMode ? {} : features,
  }

  // Simulate API call with dummy data
  setTimeout(() => {
    // Generate random confidence for demo
    const confidence = Math.floor(Math.random() * 100)

    // This would be replaced with a real API call
    /*
    const endpoint = urlOnlyMode ? "http://localhost:8000/website-check-url-only" : "http://localhost:8000/website-check"
    
    fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestData)
    })
      .then(response => response.json())
      .then(data => {
        updateWebsiteCheckResults(data)
      })
      .catch(error => {
        console.error("Error checking website:", error)
        updateWebsiteCheckResults(generateDummyResults(websiteUrl, confidence))
      })
    */

    // For now, use dummy data
    updateWebsiteCheckResults(generateDummyResults(websiteUrl, confidence))
  }, 1500)
}

function generateDummyResults(websiteUrl, confidence = null) {
  // Generate a risk score based on the domain name length (just for demo purposes)
  const score = confidence || Math.min(Math.max(20 + (websiteUrl.length % 50), 0), 100)

  let status, factors

  if (score < 30) {
    status = "safe"
    factors = [
      { type: "safe", text: "Domain has been registered for over 2 years" },
      { type: "safe", text: "SSL certificate is valid and up to date" },
      { type: "safe", text: "No reports of fraudulent activity" },
      { type: "safe", text: "Contact information is clearly displayed" },
    ]
  } else if (score < 70) {
    status = "suspicious"
    factors = [
      { type: "risk", text: "Domain was registered recently (less than 6 months ago)" },
      { type: "risk", text: "Uses free email service for business contact" },
      { type: "safe", text: "SSL certificate is valid" },
      { type: "safe", text: "No reports of fraudulent activity yet" },
    ]
  } else {
    status = "fraudulent"
    factors = [
      { type: "risk", text: "Domain was registered very recently (less than 1 month ago)" },
      { type: "risk", text: "Uses free email service for business contact" },
      { type: "risk", text: "No physical address provided" },
      { type: "risk", text: "SSL certificate is missing or invalid" },
      { type: "risk", text: "Multiple reports of fraudulent activity" },
    ]
  }

  return {
    website_url: websiteUrl,
    status: status,
    risk_score: score,
    confidence: score,
    factors: factors,
  }
}

function updateWebsiteCheckResults(results) {
  // Update status badge
  const statusBadge = document.getElementById("resultStatusBadge")
  statusBadge.className = `status-badge ${results.status}`

  let statusText, statusIcon

  switch (results.status) {
    case "safe":
      statusText = "Safe - Low Risk"
      statusIcon = "fas fa-check-circle"
      break
    case "suspicious":
      statusText = "Suspicious - Medium Risk"
      statusIcon = "fas fa-exclamation-circle"
      break
    case "fraudulent":
      statusText = "Fraudulent - High Risk"
      statusIcon = "fas fa-times-circle"
      break
    default:
      statusText = "Unknown"
      statusIcon = "fas fa-question-circle"
  }

  document.getElementById("resultStatusText").textContent = statusText

  // Replace spinner with appropriate icon
  const iconElement = statusBadge.querySelector("i")
  if (iconElement) {
    iconElement.className = statusIcon
  }

  // Update score bar
  const scoreBar = document.getElementById("resultScoreBar")
  scoreBar.style.width = `${results.risk_score}%`
  document.getElementById("resultScoreValue").textContent = `${results.risk_score}%`

  if (results.risk_score < 30) {
    scoreBar.className = "score-fill"
  } else if (results.risk_score < 70) {
    scoreBar.className = "score-fill medium"
  } else {
    scoreBar.className = "score-fill high"
  }

  // Add confidence display if available
  if (results.confidence) {
    const resultContent = document.querySelector(".result-content")
    let confidenceClass = "low"
    let interpretation = ""

    if (results.confidence < 30) {
      confidenceClass = "low"
      interpretation = "Low confidence - Website appears safe"
    } else if (results.confidence < 70) {
      confidenceClass = "medium"
      interpretation = "Medium confidence - Website requires attention"
    } else {
      confidenceClass = "high"
      interpretation = "High confidence - Website likely fraudulent"
    }

    // Check if confidence display already exists
    let confidenceDisplay = resultContent.querySelector(".confidence-display")
    if (!confidenceDisplay) {
      confidenceDisplay = document.createElement("div")
      confidenceDisplay.className = "confidence-display"
      resultContent.insertBefore(confidenceDisplay, resultContent.querySelector(".result-factors"))
    }

    confidenceDisplay.innerHTML = `
      <div class="confidence-header">
        <span class="confidence-label">Fraud Confidence Score</span>
        <span class="confidence-value ${confidenceClass}">${results.confidence}%</span>
      </div>
      <div class="confidence-bar">
        <div class="confidence-fill ${confidenceClass}" style="width: ${results.confidence}%"></div>
      </div>
      <div class="confidence-interpretation">${interpretation}</div>
    `
  }

  // Update factors list
  const factorsList = document.getElementById("resultFactorsList")
  factorsList.innerHTML = ""

  results.factors.forEach((factor) => {
    const li = document.createElement("li")
    li.textContent = factor.text
    li.className = factor.type === "risk" ? "risk-factor" : "safe-factor"
    factorsList.appendChild(li)
  })
}

// Handle responsive behavior
window.addEventListener("resize", () => {
  if (window.innerWidth > 1024) {
    const sidebar = document.querySelector(".sidebar")
    if (sidebar) {
      sidebar.classList.remove("open")
    }
  }
})
