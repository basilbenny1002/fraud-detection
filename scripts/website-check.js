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
  const clientMail = document.getElementById("clientMail").value

  // Prepare data for API request
  const requestData = {
    user_id: userId,
    url: websiteUrl,
    mail: clientMail || null, // Add this line
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

  console.log("Request data being sent:", requestData)

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

  // Clear previous email sent message
  const emailSentMessage = document.getElementById("emailSentMessage")
  if (emailSentMessage) {
    emailSentMessage.remove()
  }

  // Scroll to results
  resultCard.scrollIntoView({ behavior: "smooth" })

  // Make API call
  fetch("https://ecommerce-transaction-fraud-detection.onrender.com/predict/website", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestData),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("Raw backend response:", data)
      updateWebsiteCheckResults(data, websiteUrl, clientMail) // Pass clientMail here
    })
    .catch((error) => {
      console.error("Error checking website:", error)
      // Don't generate dummy data - show the actual error
      updateWebsiteCheckResults(null, websiteUrl, clientMail, error.message) // Pass clientMail here
    })
}

function updateWebsiteCheckResults(data, websiteUrl, clientMail, errorMessage = null) {
  console.log("Processing results with data:", data)

  // Handle error case
  if (errorMessage || !data) {
    console.log("Handling error case:", errorMessage)
    const statusBadge = document.getElementById("resultStatusBadge")
    if (statusBadge) {
      statusBadge.className = "status-badge error"
      const statusTextElement = document.getElementById("resultStatusText")
      if (statusTextElement) {
        statusTextElement.textContent = "Analysis Failed"
      }
      const iconElement = statusBadge.querySelector("i")
      if (iconElement) {
        iconElement.className = "fas fa-exclamation-triangle"
      }
    }
    return
  }

  const prediction = data.Prediction
  const confidence = data.Confidence

  console.log("Extracted values - Prediction:", prediction, "Confidence:", confidence)
  console.log("Prediction type:", typeof prediction, "Confidence type:", typeof confidence)

  // Determine status based on prediction (0 = not fraudulent, 1 = fraudulent)
  let status, statusText, statusIcon

  console.log("Checking prediction value:", prediction)

  if (prediction === 1) {
    console.log("Setting as FRAUDULENT")
    status = "fraudulent"
    statusText = "Fraudulent - High Risk"
    statusIcon = "fas fa-times-circle"
  } else if (prediction === 0) {
    console.log("Setting as SAFE")
    status = "safe"
    statusText = "Safe - Low Risk"
    statusIcon = "fas fa-check-circle"
  } else {
    console.log("Unknown prediction value, defaulting to SAFE")
    status = "safe"
    statusText = "Safe - Low Risk"
    statusIcon = "fas fa-check-circle"
  }

  console.log("Final status:", status, "statusText:", statusText)

  // Update status badge
  const statusBadge = document.getElementById("resultStatusBadge")
  if (statusBadge) {
    statusBadge.className = `status-badge ${status}`
    const statusTextElement = document.getElementById("resultStatusText")
    if (statusTextElement) {
      statusTextElement.textContent = statusText
    }

    // Replace spinner with appropriate icon
    const iconElement = statusBadge.querySelector("i")
    if (iconElement) {
      iconElement.className = statusIcon
    }
  }

  // Use raw confidence value from backend
  const rawConfidence = confidence
  console.log("Using raw confidence:", rawConfidence)

  // Fix color logic: Green for safe websites, red only for fraudulent websites
  let confidenceClass = "low" // This will be green
  if (prediction === 1) {
    // Only use red colors for fraudulent websites
    if (rawConfidence >= 70) {
      confidenceClass = "high" // red
    } else if (rawConfidence >= 30) {
      confidenceClass = "medium" // yellow
    } else {
      confidenceClass = "low" // green
    }
  }
  // For safe websites (prediction === 0), always use green (low class)

  console.log("Confidence class:", confidenceClass)

  // Update score bar with fixed color logic
  const scoreBar = document.getElementById("resultScoreBar")
  const scoreValue = document.getElementById("resultScoreValue")

  if (scoreBar) {
    scoreBar.style.width = `${rawConfidence}%`
    scoreBar.className = `score-fill ${confidenceClass}`
  }

  if (scoreValue) {
    scoreValue.textContent = `${rawConfidence}%`
  }

  // Update the label from "Risk Score" to "Confidence Score"
  const scoreLabel = document.querySelector(".result-score .result-label")
  if (scoreLabel) {
    scoreLabel.textContent = "Confidence Score:"
  }

  // Add conditional email sent message
  const resultDetails = document.querySelector(".result-details")
  let emailSentMessage = document.getElementById("emailSentMessage")

  if (prediction === 1 && clientMail) {
    if (!emailSentMessage) {
      emailSentMessage = document.createElement("div")
      emailSentMessage.id = "emailSentMessage"
      emailSentMessage.className = "result-factors li risk-factor" // Reusing a class for styling
      resultDetails.appendChild(emailSentMessage)
    }
    emailSentMessage.textContent = `An email has been sent to ${clientMail} regarding this fraudulent detection.`
    emailSentMessage.style.marginTop = "1rem" // Add some spacing
  } else {
    if (emailSentMessage) {
      emailSentMessage.remove()
    }
  }

  console.log("Results update completed")
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
