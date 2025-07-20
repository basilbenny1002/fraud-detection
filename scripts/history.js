document.addEventListener("DOMContentLoaded", () => {
  // Check if user is logged in
  if (!localStorage.getItem("user_id") || !localStorage.getItem("name")) {
    window.location.href = "signin.html"
    return
  }

  // Initialize history page
  displayUserInfo()
  setupEventListeners()
  loadHistoryData()
})

// Global variables for history data
let allHistoryData = []
let currentFilter = "all"
let searchQuery = ""
let currentSortColumn = null
let currentSortDirection = "asc"

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

  // Search functionality
  const searchInput = document.getElementById("searchInput")
  if (searchInput) {
    searchInput.addEventListener("input", debounce(handleSearch, 300))
  }

  // Filter functionality
  const filterDropdown = document.getElementById("filterDropdown")
  if (filterDropdown) {
    filterDropdown.addEventListener("click", handleFilter)
  }

  // Modal functionality
  const modal = document.getElementById("transactionModal")
  const closeModal = document.getElementById("closeModal")

  if (closeModal) {
    closeModal.onclick = () => {
      modal.style.display = "none"
    }
  }

  // Close modal when clicking outside
  window.onclick = (event) => {
    if (event.target === modal) {
      modal.style.display = "none"
    }
  }

  // Add column sorting
  const tableHeaders = document.querySelectorAll(".history-table th")
  tableHeaders.forEach((header, index) => {
    if (index < 5) {
      // Skip the Action column
      header.style.cursor = "pointer"
      header.addEventListener("click", () => {
        const column = getColumnNameByIndex(index)
        sortTable(column)
      })
    }
  })
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

function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

function handleSearch(event) {
  searchQuery = event.target.value.toLowerCase()
  filterAndDisplayData()
}

function handleFilter(event) {
  if (event.target.dataset.filter) {
    currentFilter = event.target.dataset.filter
    const filterButton = document.getElementById("filterButton")
    const filterText = event.target.textContent

    if (filterButton) {
      filterButton.innerHTML = `
      <i class="fas fa-filter"></i>
      ${filterText}
      <i class="fas fa-chevron-down"></i>
    `
    }

    filterAndDisplayData()
  }
}

function getColumnNameByIndex(index) {
  const columns = ["type", "target", "date", "result", "confidence"]
  return columns[index]
}

function sortTable(column) {
  if (currentSortColumn === column) {
    // Toggle direction if clicking the same column
    currentSortDirection = currentSortDirection === "asc" ? "desc" : "asc"
  } else {
    currentSortColumn = column
    currentSortDirection = "asc"
  }

  // Update visual indicators
  const tableHeaders = document.querySelectorAll(".history-table th")
  tableHeaders.forEach((header) => {
    header.classList.remove("sorted-asc", "sorted-desc")
  })

  const headerIndex = ["type", "target", "date", "result", "confidence"].indexOf(column)
  if (headerIndex >= 0) {
    tableHeaders[headerIndex].classList.add(currentSortDirection === "asc" ? "sorted-asc" : "sorted-desc")
  }

  // Sort the data
  allHistoryData.sort((a, b) => {
    let valueA = a[column]
    let valueB = b[column]

    // Special handling for dates
    if (column === "date") {
      valueA = new Date(valueA)
      valueB = new Date(valueB)
    }

    // Special handling for confidence
    if (column === "confidence") {
      valueA = Number.parseFloat(valueA)
      valueB = Number.parseFloat(valueB)
    }

    // Compare values
    if (valueA < valueB) {
      return currentSortDirection === "asc" ? -1 : 1
    }
    if (valueA > valueB) {
      return currentSortDirection === "asc" ? 1 : -1
    }
    return 0
  })

  // Redisplay the sorted data
  displayHistoryData(allHistoryData, true)
}

function filterAndDisplayData() {
  let filteredData = allHistoryData

  // Apply type filter
  if (currentFilter !== "all") {
    filteredData = filteredData.filter((item) => item.type === currentFilter)
  }

  // Apply search filter
  if (searchQuery) {
    filteredData = filteredData.filter(
      (item) =>
        item.target.toLowerCase().includes(searchQuery) ||
        item.result.toLowerCase().includes(searchQuery) ||
        item.type.toLowerCase().includes(searchQuery),
    )
  }

  displayHistoryData(filteredData, true)
  updateTotalResults(filteredData.length)
}

function loadHistoryData() {
  const userId = localStorage.getItem("user_id")

  // Show loading state
  const tableBody = document.getElementById("historyTableBody")
  if (tableBody) {
    tableBody.innerHTML = `
    <tr>
      <td colspan="6" class="loading-row">
        <div class="loading-spinner">
          <i class="fas fa-spinner fa-spin"></i>
          Loading history...
        </div>
      </td>
    </tr>
  `
  }

  // Make API call to get transaction details
  fetch(`https://ecommerce-transaction-fraud-detection.onrender.com/get_transaction_details`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user_id: userId,
    }),
  })
    .then((response) => {
      if (response.status === 404) {
        // Handle 404 - no data found for new user
        throw new Error("NO_DATA")
      }
      return response.json()
    })
    .then((data) => {
      if (data.Status_code === 200 && data.Content && Object.keys(data.Content).length > 0) {
        const historyData = parseHistoryData(data.Content)
        allHistoryData = historyData
        filterAndDisplayData()
      } else {
        // Handle empty content
        throw new Error("NO_DATA")
      }
    })
    .catch((error) => {
      console.error("Error fetching history:", error)

      if (error.message === "NO_DATA") {
        // Show no data message for new users
        showNoHistoryData()
      } else {
        // For other errors, show a generic error message
        showHistoryError()
      }
    })
}

function parseHistoryData(content) {
  const historyData = []

  Object.keys(content).forEach((key) => {
    const item = content[key]
    // New array structure:
    // [0: target_or_id, 1: user_id, 2: prediction, 3: user_mail, 4: method,
    //  5: type_string, 6: confidence, 7: json_string_or_null, 8: timestamp]
    const [targetOrId, userId, prediction, userMail, method, typeString, confidence, jsonStringOrNull, timestamp] = item

    const activityType = typeString === "Website" ? "website" : "transaction"

    // Format target with ID prefix for transactions
    const displayTarget = activityType === "transaction" ? `ID: ${targetOrId}` : targetOrId

    // Determine result and status based on prediction (index 2)
    let result, status
    if (prediction === 1) {
      result = "Fraudulent"
      status = "danger"
    } else {
      result = "Legitimate"
      status = "success"
    }

    let transactionDetailsParsed = null
    if (activityType === "transaction" && jsonStringOrNull) {
      try {
        transactionDetailsParsed = JSON.parse(jsonStringOrNull)
      } catch (e) {
        console.error("Error parsing transaction JSON string:", e, jsonStringOrNull)
      }
    }

    const historyItem = {
      id: key,
      type: activityType,
      target: displayTarget,
      date: timestamp, // Use timestamp directly
      result: result,
      status: status,
      confidence: confidence || 0,
      fullDetails: {
        originalTarget: targetOrId, // Store original for website URL
        prediction: prediction,
        userMail: userMail,
        method: method,
        typeString: typeString,
        confidence: confidence,
        transactionSpecificData: transactionDetailsParsed, // Parsed JSON for transactions
        timestamp: timestamp,
      },
    }

    historyData.push(historyItem)
  })

  // Sort by date (newest first)
  historyData.sort((a, b) => new Date(b.date) - new Date(a.date))

  return historyData
}

function displayHistoryData(data, clearTable = false) {
  const tableBody = document.getElementById("historyTableBody")

  if (!tableBody) return

  if (clearTable) {
    tableBody.innerHTML = ""
  }

  if (data.length === 0) {
    tableBody.innerHTML = `
    <tr>
      <td colspan="6" class="loading-row">No entries found</td>
    </tr>
  `
    return
  }

  data.forEach((item, index) => {
    const row = document.createElement("tr")

    const typeIcon = item.type === "website" ? "fas fa-globe" : "fas fa-exchange-alt"
    const typeClass = item.type === "website" ? "website" : "transaction"

    // Update confidence color logic - red only for fraud cases
    let confidenceClass = "low" // default to low (green)
    if (item.result === "Fraudulent") {
      confidenceClass = item.confidence >= 80 ? "high" : item.confidence >= 60 ? "medium" : "low"
    }

    // Display raw datetime string
    const dateDisplay = item.date

    row.innerHTML = `
    <td>
      <div class="activity-type ${typeClass}">
        <i class="${typeIcon}"></i>
        ${item.type.charAt(0).toUpperCase() + item.type.slice(1)}
      </div>
    </td>
    <td>${item.target}</td>
    <td>${dateDisplay}</td>
    <td>
      <span class="status-badge ${item.status}">${item.result}</span>
    </td>
    <td>
      <div class="confidence-bar">
        <div class="confidence-progress">
          <div class="confidence-fill ${confidenceClass}" style="width: ${item.confidence}%"></div>
        </div>
        <span class="confidence-text">${Number.parseFloat(item.confidence).toFixed(2)}%</span>
      </div>
    </td>
    <td>
      ${
        item.type === "transaction"
          ? `<button class="btn btn-sm btn-outline" onclick="showDetails(${index}, 'transaction')">View Details</button>`
          : item.fullDetails.userMail &&
              item.fullDetails.userMail !== "No mail" &&
              item.fullDetails.userMail !== "no mail" &&
              item.fullDetails.userMail !== ""
            ? `<button class="btn btn-sm btn-outline" onclick="showDetails(${index}, 'website')">View Details</button>`
            : `<span class="text-light">-</span>`
      }
    </td>
  `

    tableBody.appendChild(row)
  })

  // Store current filtered data globally for modal access
  window.currentHistoryData = data

  // Enable buttons when there's data
  if (data.length > 0) {
    enableHistoryButtons()
  } else {
    disableHistoryButtons()
  }
}

function showDetails(index, type) {
  const item = window.currentHistoryData[index]
  if (item && item.fullDetails) {
    updateModalContent(item.fullDetails, type)
  }
}

function updateModalContent(details, type) {
  const modal = document.getElementById("transactionModal")
  const modalHeader = modal.querySelector(".modal-header h3")
  const modalBody = modal.querySelector(".modal-body")

  // Clear previous content
  modalBody.innerHTML = ""

  // Set modal title
  modalHeader.textContent = type === "transaction" ? "Transaction Details" : "Website Check Details"

  // Common details
  addDetailRow(modalBody, type === "transaction" ? "Transaction ID:" : "Target URL:", details.originalTarget)
  addDetailRow(modalBody, "Prediction:", details.prediction === 1 ? "Fraudulent" : "Legitimate")
  addDetailRow(
    modalBody,
    "User Mail:",
    details.userMail && details.userMail !== "No mail" && details.userMail !== "no mail" && details.userMail !== ""
      ? details.userMail
      : "No mail provided",
  )
  addDetailRow(modalBody, "Method:", details.method || "N/A")
  addDetailRow(modalBody, "Confidence:", `${Number.parseFloat(details.confidence).toFixed(2)}%`)
  addDetailRow(modalBody, "Timestamp:", details.timestamp)

  // Type-specific details
  if (type === "transaction" && details.transactionSpecificData) {
    const tsd = details.transactionSpecificData
    addDetailRow(modalBody, "Source:", tsd.source || "N/A")
    addDetailRow(modalBody, "Browser:", tsd.browser || "N/A")
    addDetailRow(modalBody, "Sex:", tsd.sex || "N/A")
    addDetailRow(modalBody, "Age:", tsd.age || "N/A")
    addDetailRow(modalBody, "Country:", tsd.country_name || "N/A")
    addDetailRow(modalBody, "Devices Occurred:", tsd.n_device_occur || "N/A")
    addDetailRow(
      modalBody,
      "Signup Date:",
      formatSignupPurchaseDate(tsd.signup_month, tsd.signup_day, tsd.signup_day_name),
    )
    addDetailRow(
      modalBody,
      "Purchase Date:",
      formatSignupPurchaseDate(tsd.purchase_month, tsd.purchase_day, tsd.purchase_day_name),
    )
    addDetailRow(modalBody, "Purchase Over Time:", tsd.purchase_over_time ? `$${tsd.purchase_over_time}` : "N/A")
  }

  modal.style.display = "block"
}

// Helper function to create a detail row
function addDetailRow(parent, label, value) {
  const row = document.createElement("div")
  row.classList.add("detail-row")
  row.innerHTML = `
  <span class="detail-label">${label}</span>
  <span class="detail-value">${value}</span>
`
  parent.appendChild(row)
}

// Helper function for formatting signup/purchase dates
function formatSignupPurchaseDate(month, day, dayName) {
  if (month && day && dayName) {
    // Assuming month is 1-indexed
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ]
    return `${dayName}, ${monthNames[month - 1]} ${day}`
  }
  return "N/A"
}

function showNoHistoryData() {
  const tableBody = document.getElementById("historyTableBody")
  const noResults = document.getElementById("noResults")

  if (!tableBody) return

  // Hide the table and show the no results section
  tableBody.innerHTML = ""

  if (noResults) {
    noResults.style.display = "block"
    noResults.innerHTML = `
    <div class="no-results-content">
      <i class="fas fa-history"></i>
      <h3>No Transaction History</h3>
      <p>You haven't performed any fraud checks yet. Start by checking websites or transactions to build your history.</p>
      <div style="display: flex; gap: 1rem; margin-top: 1.5rem; justify-content: center;">
        <a href="website-check.html" class="btn btn-primary btn-sm">
          <i class="fas fa-globe"></i>
          Check Website
        </a>
        <a href="transaction-check.html" class="btn btn-outline btn-sm">
          <i class="fas fa-exchange-alt"></i>
          Check Transaction
        </a>
      </div>
    </div>
  `
  }

  // Disable export and clear buttons when no data
  disableHistoryButtons()
  updateTotalResults(0)
}

function showHistoryError() {
  const tableBody = document.getElementById("historyTableBody")

  if (!tableBody) return

  tableBody.innerHTML = `
  <tr>
    <td colspan="6" style="text-align: center; padding: 3rem; color: var(--text-light);">
      <div style="display: flex; flex-direction: column; align-items: center; gap: 1rem;">
        <i class="fas fa-exclamation-triangle" style="font-size: 2rem; color: var(--warning-color);"></i>
        <div>
          <h3 style="margin-bottom: 0.5rem; color: var(--text-color);">Unable to Load History</h3>
          <p style="margin: 0;">There was an error loading your transaction history. Please try refreshing the page.</p>
        </div>
        <button onclick="loadHistoryData()" class="btn btn-outline btn-sm">
          <i class="fas fa-refresh"></i>
          Retry
        </button>
      </div>
    </td>
  </tr>
`

  updateTotalResults(0)
}

function updateTotalResults(count) {
  const totalResults = document.getElementById("totalResults")
  if (totalResults) {
    totalResults.textContent = count.toLocaleString()
  }
}

function exportHistory() {
  const headers = [
    "Type",
    "Target",
    "Date & Time",
    "Result",
    "Confidence",
    "User Mail",
    "Method",
    "Source",
    "Browser",
    "Sex",
    "Age",
    "Country",
    "Devices Occurred",
    "Signup Month",
    "Signup Day",
    "Signup Day Name",
    "Purchase Month",
    "Purchase Day",
    "Purchase Day Name",
    "Purchase Over Time",
  ]

  const csvContent = [
    headers
      .map((h) => `"${h}"`)
      .join(","), // Quote headers
    ...allHistoryData.map((item) => {
      const details = item.fullDetails
      const tsd = details.transactionSpecificData || {} // Transaction specific data

      const row = [
        item.type.charAt(0).toUpperCase() + item.type.slice(1),
        item.target,
        item.date,
        item.result,
        `${Number.parseFloat(item.confidence).toFixed(2)}%`,
        details.userMail && details.userMail !== "No mail" && details.userMail !== "no mail" && details.userMail !== ""
          ? details.userMail
          : "No mail provided",
        details.method || "N/A",
        tsd.source || "",
        tsd.browser || "",
        tsd.sex || "",
        tsd.age || "",
        tsd.country_name || "",
        tsd.n_device_occur || "",
        tsd.signup_month || "",
        tsd.signup_day || "",
        tsd.signup_day_name || "",
        tsd.purchase_month || "",
        tsd.purchase_day || "",
        tsd.purchase_day_name || "",
        tsd.purchase_over_time || "",
      ]
      return row
        .map((value) => {
          // Ensure values are quoted and handle commas within values
          const stringValue = String(value)
          return `"${stringValue.replace(/"/g, '""')}"`
        })
        .join(",")
    }),
  ].join("\n")

  // Create and download file
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `fraudshield_history_details_${new Date().toISOString().split("T")[0]}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
}

function clearHistory() {
  if (confirm("Are you sure you want to clear all history? This action cannot be undone.")) {
    const userId = localStorage.getItem("user_id")

    // Make API call to clear history
    fetch(`https://ecommerce-transaction-fraud-detection.onrender.com/clear_history`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: userId,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.Status_code === 200) {
          allHistoryData = []
          filterAndDisplayData()
          updateTotalResults(0)
        } else {
          throw new Error(data.Message || "Failed to clear history")
        }
      })
      .catch((error) => {
        console.error("Error clearing history:", error)
        alert("Failed to clear history. Please try again.")
      })
  }
}

function disableHistoryButtons() {
  const exportButton = document.querySelector('button[onclick="exportHistory()"]')
  const clearButton = document.querySelector('button[onclick="clearHistory()"]')

  if (exportButton) {
    exportButton.disabled = true
    exportButton.title = "No data to export - perform some checks first"
    exportButton.style.opacity = "0.5"
    exportButton.style.cursor = "not-allowed"
  }

  if (clearButton) {
    clearButton.disabled = true
    clearButton.title = "No data to clear - perform some checks first"
    clearButton.style.opacity = "0.5"
    clearButton.style.cursor = "not-allowed"
  }
}

function enableHistoryButtons() {
  const exportButton = document.querySelector('button[onclick="exportHistory()"]')
  const clearButton = document.querySelector('button[onclick="clearHistory()"]')

  if (exportButton) {
    exportButton.disabled = false
    exportButton.title = "Export history to CSV"
    exportButton.style.opacity = "1"
    exportButton.style.cursor = "pointer"
  }

  if (clearButton) {
    clearButton.disabled = false
    clearButton.title = "Clear all history"
    clearButton.style.opacity = "1"
    clearButton.style.cursor = "pointer"
  }
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
