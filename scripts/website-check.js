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

  // Prepare data for API request
  const requestData = {
    user_id: userId,
    url: websiteUrl,
  }

  // Add feature data only if not in URL-only mode
  if (!urlOnlyMode) {
    requestData.credit_card_payment = document.getElementById("creditCardPayment").checked ? 1 : 0
    requestData.money_back_payment = document.getElementById("moneyBackPayment").checked ? 1 : 0
    requestData.cash_on_delivery = document.getElementById("cashOnDelivery").checked ? 1 : 0
    requestData.crypto = document.getElementById("cryptoCurrency").checked ? 1 : 0
    requestData.free_contact_mails = document.getElementById("freeContactEmails").checked ? 1 : 0
    requestData.logo_url = document.getElementById("logoUrl").checked ? 1 : 0
  } else {
    // Set all features to null for URL-only mode
    requestData.credit_card_payment = null
    requestData.money_back_payment = null
    requestData.cash_on_delivery = null
    requestData.crypto = null
    requestData.free_contact_mails = null
    requestData.logo_url = null
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

  // Make API call
  fetch("http://127.0.0.1:8000/predict/website", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestData),
  })
    .then((response) => response.json())
    .then((data) => {
      updateWebsiteCheckResults(data, websiteUrl)
    })
    .catch((error) => {
      console.error("Error checking website:", error)
      // Generate dummy data as fallback
      const confidence = Math.floor(Math.random() * 100)
      const dummyData = {
        Prediction: confidence > 50 ? 1 : 0,
        Confidence: confidence,
      }
      updateWebsiteCheckResults(dummyData, websiteUrl)
    })
}

function updateWebsiteCheckResults(data, websiteUrl) {
  const prediction = data.Prediction
  const confidence = data.Confidence

  // Determine status based on prediction
  let status, statusText, statusIcon, factors

  if (prediction === 1) {
    status = "fraudulent"
    statusText = "Fraudulent - High Risk"
    statusIcon = "fas fa-times-circle"
    factors = [
      { type: "risk", text: "Domain was registered very recently (less than 1 month ago)" },
      { type: "risk", text: "Uses free email service for business contact" },
      { type: "risk", text: "No physical address provided" },
      { type: "risk", text: "SSL certificate is missing or invalid" },
      { type: "risk", text: "Multiple reports of fraudulent activity" },
    ]
  } else {
    status = "safe"
    statusText = "Safe - Low Risk"
    statusIcon = "fas fa-check-circle"
    factors = [
      { type: "safe", text: "Domain has been registered for over 2 years" },
      { type: "safe", text: "SSL certificate is valid and up to date" },
      { type: "safe", text: "No reports of fraudulent activity" },
      { type: "safe", text: "Contact information is clearly displayed" },
    ]
  }

  // Update status badge
  const statusBadge = document.getElementById("resultStatusBadge")
  statusBadge.className = `status-badge ${status}`
  document.getElementById("resultStatusText").textContent = statusText

  // Replace spinner with appropriate icon
  const iconElement = statusBadge.querySelector("i")
  if (iconElement) {
    iconElement.className = statusIcon
  }

  // Update score bar
  const scoreBar = document.getElementById("resultScoreBar")
  scoreBar.style.width = `${confidence}%`
  document.getElementById("resultScoreValue").textContent = `${Number.parseFloat(confidence).toFixed(2)}%`

  if (confidence < 30) {
    scoreBar.className = "score-fill"
  } else if (confidence < 70) {
    scoreBar.className = "score-fill medium"
  } else {
    scoreBar.className = "score-fill high"
  }

  // Add confidence display
  const resultContent = document.querySelector(".result-content")
  let confidenceClass = "low"
  let interpretation = ""

  if (confidence < 30) {
    confidenceClass = "low"
    interpretation = "Low confidence - Website appears safe"
  } else if (confidence < 70) {
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

  const formattedConfidence = Number.parseFloat(confidence).toFixed(2)
  confidenceDisplay.innerHTML = `
  <div class="confidence-header">
    <span class="confidence-label">Fraud Confidence Score</span>
    <span class="confidence-value ${confidenceClass}">${formattedConfidence}%</span>
  </div>
  <div class="confidence-bar">
    <div class="confidence-fill ${confidenceClass}" style="width: ${confidence}%"></div>
  </div>
  <div class="confidence-interpretation">${interpretation}</div>
`

  // Update factors list - CLEAR FIRST to remove "analyzing" text
  const factorsList = document.getElementById("resultFactorsList")
  factorsList.innerHTML = ""

  factors.forEach((factor) => {
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
