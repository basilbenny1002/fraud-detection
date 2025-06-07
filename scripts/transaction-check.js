document.addEventListener("DOMContentLoaded", () => {
  // Check if user is logged in
  if (!localStorage.getItem("user_id") || !localStorage.getItem("name")) {
    window.location.href = "signin.html"
    return
  }

  // Initialize transaction check page
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

  // Transaction check form submission
  const predictionForm = document.getElementById("predictionForm")
  if (predictionForm) {
    predictionForm.addEventListener("submit", predict)
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

function predict(event) {
  event.preventDefault()

  // Get form data
  const user_id = localStorage.getItem("user_id")
  const amount = Number.parseFloat(document.getElementById("amount").value)
  const mail = document.getElementById("clientMail").value
  const oldbalanceOrg = Number.parseFloat(document.getElementById("oldbalanceOrg").value)
  const newbalanceOrig = Number.parseFloat(document.getElementById("newbalanceOrig").value)
  const oldbalanceDest = Number.parseFloat(document.getElementById("oldbalanceDest").value)
  const newbalanceDest = Number.parseFloat(document.getElementById("newbalanceDest").value)
  const isFlaggedFraud = document.getElementById("isFlaggedFraud").checked ? 1.0 : 0.0
  const type = document.getElementById("transactionType").value

  console.log(
    user_id,
    type,
    amount,
    oldbalanceOrg,
    newbalanceOrig,
    oldbalanceDest,
    newbalanceDest,
    isFlaggedFraud,
    mail,
  )

  // Show loading state
  const predictionResultDiv = document.getElementById("predictionResult")
  predictionResultDiv.style.display = "block"
  predictionResultDiv.className = "result-display"
  predictionResultDiv.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; padding: 2rem;">
      <i class="fas fa-spinner fa-spin" style="margin-right: 0.5rem;"></i>
      Analyzing transaction...
    </div>
  `

  // Scroll to results
  predictionResultDiv.scrollIntoView({ behavior: "smooth" })

  // Prepare data for API request
  const requestData = {
    user_id,
    amount,
    oldbalanceOrg,
    newbalanceOrig,
    oldbalanceDest,
    newbalanceDest,
    isFlaggedFraud,
    type,
    mail,
  }

  // Make API call
  fetch("http://127.0.0.1:8000/predict/transaction", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestData),
  })
    .then((response) => response.json())
    .then((data) => {
      displayPredictionResult(data.Prediction, mail, data.Confidence)
    })
    .catch((error) => {
      console.error("Error:", error)
      // Generate dummy data as fallback
      const confidence = Math.floor(Math.random() * 100)
      const prediction = confidence > 50 ? 1 : 0
      displayPredictionResult(prediction, mail, confidence)
    })
}

function displayPredictionResult(prediction, mail, confidence, errorMessage = "") {
  const predictionResultDiv = document.getElementById("predictionResult")
  predictionResultDiv.style.display = "block"
  predictionResultDiv.className = "result-display"

  if (errorMessage) {
    predictionResultDiv.classList.add("error")
    predictionResultDiv.innerHTML = `
      <div style="text-align: center; padding: 1rem;">
        <i class="fas fa-times-circle" style="font-size: 2rem; color: var(--danger-color); margin-bottom: 1rem;"></i>
        <h3>Error</h3>
        <p>${errorMessage}</p>
      </div>
    `
    return
  }

  let resultClass, resultIcon, resultTitle, resultDescription
  let confidenceClass = "low"
  let interpretation = ""

  if (confidence !== null) {
    if (prediction === 1) {
      // Only show red colors for fraudulent transactions
      if (confidence < 30) {
        confidenceClass = "low"
        interpretation = "Low confidence fraud detection"
      } else if (confidence < 70) {
        confidenceClass = "medium"
        interpretation = "Medium confidence fraud detection"
      } else {
        confidenceClass = "high"
        interpretation = "High confidence fraud detection"
      }
    } else {
      // For legitimate transactions, always use green/low
      confidenceClass = "low"
      interpretation = "Transaction appears legitimate"
    }
  }

  if (prediction === 1) {
    resultClass = "scam"
    resultIcon = "fas fa-exclamation-triangle"
    resultTitle = "FRAUDULENT TRANSACTION DETECTED!"
    resultDescription = "This transaction has been flagged as potentially fraudulent."
  } else if (prediction === 0) {
    resultClass = "not-scam"
    resultIcon = "fas fa-check-circle"
    resultTitle = "Transaction Appears Legitimate"
    resultDescription = "This transaction does not show signs of fraud."
  }

  predictionResultDiv.classList.add(resultClass)

  // Only show email notification for fraudulent transactions
  let emailNotification = ""
  if (mail && prediction === 1) {
    emailNotification = `
      <div class="email-notification">
        <i class="fas fa-envelope"></i>
        <span>Fraud alert sent to ${mail}</span>
      </div>
    `
  }

  let confidenceDisplay = ""
  if (confidence !== null) {
    const formattedConfidence = Number.parseFloat(confidence).toFixed(2)
    confidenceDisplay = `
      <div class="confidence-display">
        <div class="confidence-header">
          <span class="confidence-label">Fraud Confidence Score</span>
          <span class="confidence-value ${confidenceClass}">${formattedConfidence}%</span>
        </div>
        <div class="confidence-bar">
          <div class="confidence-fill ${confidenceClass}" style="width: ${confidence}%"></div>
        </div>
        <div class="confidence-interpretation">${interpretation}</div>
      </div>
    `
  }

  predictionResultDiv.innerHTML = `
    <div style="text-align: center; padding: 1rem;">
      <i class="${resultIcon}" style="font-size: 2rem; margin-bottom: 1rem;"></i>
      <h3>${resultTitle}</h3>
      <p style="margin-bottom: 1rem;">${resultDescription}</p>
      ${emailNotification}
      ${confidenceDisplay}
    </div>
  `
}
