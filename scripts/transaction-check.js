document.addEventListener("DOMContentLoaded", () => {
  // Check if user is logged in
  if (!localStorage.getItem("user_id") || !localStorage.getItem("name")) {
    window.location.href = "signin.html"
    return
  }

  // Initialize transaction check page
  displayUserInfo()
  setupEventListeners()
  setDateInputMaxToToday() // New function call to set max date
  setupDateValidation() // New function call for date validation
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

function setDateInputMaxToToday() {
  const today = new Date().toISOString().split("T")[0] // Get today's date in YYYY-MM-DD format
  const signupDateInput = document.getElementById("signup_date")
  const purchaseDateInput = document.getElementById("purchase_date")

  if (signupDateInput) {
    signupDateInput.setAttribute("max", today)
  }
  if (purchaseDateInput) {
    purchaseDateInput.setAttribute("max", today)
  }
}

function setupDateValidation() {
  const signupDateInput = document.getElementById("signup_date")
  const purchaseDateInput = document.getElementById("purchase_date")

  if (signupDateInput && purchaseDateInput) {
    // When signup date changes, update the min attribute of purchase date
    signupDateInput.addEventListener("change", () => {
      purchaseDateInput.setAttribute("min", signupDateInput.value)
      // If purchase date is already set and is now before signup date, clear it
      if (purchaseDateInput.value && purchaseDateInput.value < signupDateInput.value) {
        purchaseDateInput.value = signupDateInput.value // Or clear it: purchaseDateInput.value = '';
      }
    })

    // Initial setting in case signup date has a default value
    if (signupDateInput.value) {
      purchaseDateInput.setAttribute("min", signupDateInput.value)
    }
  }
}

function getDayName(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", { weekday: "long" })
}

function predict(event) {
  event.preventDefault()

  // Get form data
  const source = document.getElementById("source").value
  const browser = document.getElementById("browser").value
  const sex = document.getElementById("sex").value === "Female" ? "F" : "M" // Map Male/Female to M/F
  const age = Number.parseInt(document.getElementById("age").value)
  const country_name = document.getElementById("country_name").value
  const n_device_occur = Number.parseInt(document.getElementById("n_device_occur").value)

  const signupDate = new Date(document.getElementById("signup_date").value)
  const signup_month = signupDate.getMonth() + 1 // Month is 0-indexed
  const signup_day = signupDate.getDate()
  const signup_day_name = getDayName(document.getElementById("signup_date").value)

  const purchaseDate = new Date(document.getElementById("purchase_date").value)
  const purchase_month = purchaseDate.getMonth() + 1 // Month is 0-indexed
  const purchase_day = purchaseDate.getDate()
  const purchase_day_name = getDayName(document.getElementById("purchase_date").value)

  const purchase_over_time = Number.parseFloat(document.getElementById("purchase_over_time").value)
  const mail = document.getElementById("clientMail").value // Get mail value

  console.log("Form data collected:", {
    source,
    browser,
    sex,
    age,
    country_name,
    n_device_occur,
    signup_month,
    signup_day,
    signup_day_name,
    purchase_month,
    purchase_day,
    purchase_day_name,
    purchase_over_time,
    mail, // Include mail in log
  })

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
    source,
    browser,
    sex,
    age,
    country_name,
    n_device_occur,
    signup_month,
    signup_day,
    signup_day_name,
    purchase_month,
    purchase_day,
    purchase_day_name,
    purchase_over_time,
    mail, // Include mail in request data
  }

  console.log("Request data being sent:", requestData)

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
      console.log("Raw backend response:", data)
      // Pass mail to displayPredictionResult
      displayPredictionResult(data.Prediction, mail, data.Confidence)
    })
    .catch((error) => {
      console.error("Error:", error)
      // Show error instead of dummy data
      displayPredictionResult(null, mail, null, error.message)
    })
}

function displayPredictionResult(prediction, mail, confidence, errorMessage = "") {
  console.log("Processing transaction results with:", { prediction, mail, confidence, errorMessage })
  console.log("Prediction type:", typeof prediction, "Confidence type:", typeof confidence)

  const predictionResultDiv = document.getElementById("predictionResult")
  predictionResultDiv.style.display = "block"
  predictionResultDiv.className = "result-display"

  if (errorMessage) {
    console.log("Displaying error message:", errorMessage)
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
  let confidenceClass = "low" // Default to green
  let interpretation = ""

  // Use raw confidence value from backend
  const rawConfidence = confidence
  console.log("Using raw confidence:", rawConfidence)

  // Set result based on prediction value (0 = not fraudulent, 1 = fraudulent)
  console.log("Checking prediction value:", prediction)

  if (prediction === 1) {
    console.log("Setting as FRAUDULENT")
    resultClass = "scam"
    resultIcon = "fas fa-exclamation-triangle"
    resultTitle = "FRAUDULENT TRANSACTION DETECTED!"
    resultDescription = "This transaction has been flagged as potentially fraudulent."

    // Only use red/yellow colors for fraudulent transactions
    if (rawConfidence >= 70) {
      confidenceClass = "high" // red
    } else if (rawConfidence >= 30) {
      confidenceClass = "medium" // yellow
    } else {
      confidenceClass = "low" // green
    }
    interpretation = `${confidenceClass.charAt(0).toUpperCase() + confidenceClass.slice(1)} confidence fraud detection`
  } else if (prediction === 0) {
    console.log("Setting as LEGITIMATE")
    resultClass = "not-scam"
    resultIcon = "fas fa-check-circle"
    resultTitle = "Transaction Appears Legitimate"
    resultDescription = "This transaction does not show signs of fraud."

    // For legitimate transactions, always use green
    confidenceClass = "low" // green
    interpretation = "High confidence - Transaction appears legitimate"
  } else {
    console.log("Unknown prediction value, defaulting to LEGITIMATE")
    resultClass = "not-scam"
    resultIcon = "fas fa-check-circle"
    resultTitle = "Transaction Appears Legitimate"
    resultDescription = "This transaction does not show signs of fraud."
    confidenceClass = "low" // green
    interpretation = "Transaction appears legitimate"
  }

  console.log("Final result class:", resultClass, "Title:", resultTitle)

  predictionResultDiv.classList.add(resultClass)

  // Only show email notification for fraudulent transactions
  let emailNotification = ""
  if (mail && prediction === 1) {
    console.log("Adding email notification for fraudulent transaction")
    emailNotification = `
      <div class="email-notification">
        <i class="fas fa-envelope"></i>
        <span>Fraud alert sent to ${mail}</span>
      </div>
    `
  }

  let confidenceDisplay = ""
  if (rawConfidence !== null && rawConfidence !== undefined) {
    console.log("Creating confidence display with value:", rawConfidence)
    confidenceDisplay = `
      <div class="confidence-display">
        <div class="confidence-header">
          <span class="confidence-label">Confidence Score</span>
          <span class="confidence-value ${confidenceClass}">${rawConfidence}%</span>
        </div>
        <div class="confidence-bar">
          <div class="confidence-fill ${confidenceClass}" style="width: ${rawConfidence}%"></div>
        </div>
        <div class="confidence-interpretation">${interpretation}</div>
      </div>
    `
  } else {
    console.log("Confidence value is null/undefined, not showing confidence display")
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

  console.log("Transaction results display completed")
}
