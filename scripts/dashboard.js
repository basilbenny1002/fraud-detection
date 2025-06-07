document.addEventListener("DOMContentLoaded", () => {
  // Check if user is logged in
  if (!localStorage.getItem("user_id") || !localStorage.getItem("name")) {
    window.location.href = "signin.html"
    return
  }

  // Initialize dashboard
  displayUserInfo()
  setupEventListeners()
  loadDashboardData()
})

function displayUserInfo() {
  const userProfileNameElement = document.getElementById("userProfileName")
  const userName = localStorage.getItem("name") || "User"
  const userProfileIconElement = document.getElementById("userProfileIcon")
  const userID = localStorage.getItem("user_id") || "default"

  console.log(userName, userID)

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

function loadDashboardData() {
  fetchDashboardStats()
  fetchRecentActivity()
}

function fetchDashboardStats() {
  const userId = localStorage.getItem("user_id")

  fetch(`http://127.0.0.1:8000/dashboard/stats`, {
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
      updateStatsCards(data)
    })
    .catch((error) => {
      console.error("Error fetching stats:", error)
      // Use zero stats for new users
      const emptyStats = {
        total_checks: 0,
        frauds_detected: 0,
        api_calls: 0,
      }
      updateStatsCards(emptyStats)
    })
}

function updateStatsCards(stats) {
  const totalChecksElement = document.getElementById("totalChecks")
  const fraudsDetectedElement = document.getElementById("fraudsDetected")
  const apiCallsElement = document.getElementById("apiCalls")

  if (totalChecksElement) totalChecksElement.textContent = stats.total_checks || "0"
  if (fraudsDetectedElement) fraudsDetectedElement.textContent = stats.frauds_detected || "0"
  if (apiCallsElement) apiCallsElement.textContent = stats.api_calls || "0"
}

function fetchRecentActivity() {
  const userId = localStorage.getItem("user_id")

  // Make API call to get recent activity
  fetch(`http://127.0.0.1:8000/recent`, {
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
        const activities = parseRecentActivityData(data.Content)
        updateRecentActivity(activities)
      } else {
        // Handle empty content
        throw new Error("NO_DATA")
      }
    })
    .catch((error) => {
      console.error("Error fetching recent activity:", error)

      if (error.message === "NO_DATA") {
        // Show no data message for new users
        showNoRecentActivity()
      } else {
        // For other errors, show a generic error message
        showRecentActivityError()
      }
    })
}

function parseRecentActivityData(content) {
  const activities = []

  Object.keys(content).forEach((key) => {
    const item = content[key]
    // New array structure: [target, user_id, amount, oldbalanceOrg, newbalanceOrig, oldbalanceDest, newbalanceDest, isFraud, isFlaggedFraud, user_mail, type, method, target_type, confidence, TIMES]
    const [
      target,
      user_id,
      amount,
      oldbalanceOrg,
      newbalanceOrig,
      oldbalanceDest,
      newbalanceDest,
      isFraud,
      isFlaggedFraud,
      user_mail,
      type,
      method,
      target_type,
      confidence,
      times,
    ] = item

    // Determine if it's a website or transaction based on target_type
    const activityType = target_type === "Website" ? "website" : "transaction"

    // Determine result and status based on isFraud
    let result, status
    if (isFraud === 1) {
      result = "Fraudulent"
      status = "danger"
    } else {
      result = "Legitimate"
      status = "success"
    }

    // Use raw datetime string from backend
    const date = times

    const activity = {
      type: activityType,
      target: target,
      date: date,
      result: result,
      status: status,
      transactionData:
        activityType === "transaction"
          ? {
              amount: amount,
              email: user_mail,
              method: method || "GUI",
              oldBalanceOrig: oldbalanceOrg,
              newBalanceOrig: newbalanceOrig,
              oldBalanceDest: oldbalanceDest,
              newBalanceDest: newbalanceDest,
              type: type,
              isFraud: isFraud === 1 ? "Yes" : "No",
              isFlaggedFraud:
                isFlaggedFraud === "NULL" ? "No" : isFlaggedFraud === 1 || isFlaggedFraud === "1" ? "Yes" : "No",
            }
          : null,
    }

    activities.push(activity)
  })

  return activities
}

function updateRecentActivity(activities) {
  const tableBody = document.getElementById("recentActivityTable")

  if (!tableBody) return

  tableBody.innerHTML = ""

  activities.forEach((activity, index) => {
    const row = document.createElement("tr")

    const typeIcon = activity.type === "website" ? "fas fa-globe" : "fas fa-exchange-alt"
    const typeClass = activity.type === "website" ? "website" : "transaction"

    row.innerHTML = `
      <td>
        <div class="activity-type ${typeClass}">
          <i class="${typeIcon}"></i>
          ${activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
        </div>
      </td>
      <td>${activity.target}</td>
      <td>${activity.date}</td>
      <td>
        <span class="status-badge ${activity.status}">${activity.result}</span>
      </td>
      <td>
        ${
          activity.type === "transaction"
            ? `<button class="btn btn-sm btn-outline" onclick="showTransactionDetails(${index})">View Details</button>`
            : `<span class="text-light">-</span>`
        }
      </td>
    `

    tableBody.appendChild(row)
  })

  // Store activities globally for modal access
  window.recentActivities = activities
}

function showNoRecentActivity() {
  const tableBody = document.getElementById("recentActivityTable")

  if (!tableBody) return

  tableBody.innerHTML = `
    <tr>
      <td colspan="5" style="text-align: center; padding: 3rem; color: var(--text-light);">
        <div style="display: flex; flex-direction: column; align-items: center; gap: 1rem;">
          <i class="fas fa-search" style="font-size: 2rem; opacity: 0.5;"></i>
          <div>
            <h3 style="margin-bottom: 0.5rem; color: var(--text-color);">No Recent Activity</h3>
            <p style="margin: 0;">Start by checking websites or transactions to see your activity here.</p>
          </div>
          <div style="display: flex; gap: 1rem; margin-top: 1rem;">
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
      </td>
    </tr>
  `
}

function showRecentActivityError() {
  const tableBody = document.getElementById("recentActivityTable")

  if (!tableBody) return

  tableBody.innerHTML = `
    <tr>
      <td colspan="5" style="text-align: center; padding: 2rem; color: var(--text-light);">
        <div style="display: flex; flex-direction: column; align-items: center; gap: 1rem;">
          <i class="fas fa-exclamation-triangle" style="font-size: 2rem; color: var(--warning-color);"></i>
          <div>
            <h3 style="margin-bottom: 0.5rem; color: var(--text-color);">Unable to Load Activity</h3>
            <p style="margin: 0;">There was an error loading your recent activity. Please try refreshing the page.</p>
          </div>
          <button onclick="fetchRecentActivity()" class="btn btn-outline btn-sm">
            <i class="fas fa-refresh"></i>
            Retry
          </button>
        </div>
      </td>
    </tr>
  `
}

// Update showTransactionDetails function to use stored data
function showTransactionDetails(index) {
  const activity = window.recentActivities[index]
  if (activity && activity.transactionData) {
    updateTransactionModal(activity.transactionData)
  }
}

function updateTransactionModal(details) {
  document.getElementById("modalAmount").textContent = `$${details.amount}`
  document.getElementById("modalEmail").textContent = details.email
  document.getElementById("modalMethod").textContent = details.method || "GUI"
  document.getElementById("modalOldBalanceOrig").textContent = `$${details.oldBalanceOrig}`
  document.getElementById("modalNewBalanceOrig").textContent = `$${details.newBalanceOrig}`
  document.getElementById("modalOldBalanceDest").textContent = `$${details.oldBalanceDest}`
  document.getElementById("modalNewBalanceDest").textContent = `$${details.newBalanceDest}`
  document.getElementById("modalType").textContent = details.type
  document.getElementById("modalIsFraud").textContent = details.isFraud
  document.getElementById("modalIsFlaggedFraud").textContent = details.isFlaggedFraud

  const modal = document.getElementById("transactionModal")
  modal.style.display = "block"
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
