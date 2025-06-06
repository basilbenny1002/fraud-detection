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

  // Uncomment below for real API call
  fetch(`http://localhost:8000/dashboard/stats`, {
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
      // Use dummy data as fallback
      const dummyStats = {
        total_checks: 0,
        frauds_detected: 0,
        api_calls: 0,
      }
      updateStatsCards(dummyStats)
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

  // Uncomment below for real API call
  fetch(`http://localhost:8000/recent-activity`, {
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
      updateRecentActivity(data.activities)
    })
    .catch((error) => {
      console.error("Error fetching recent activity:", error)
      // Use dummy data as fallback
      const dummyActivity = [
        {
          type: "transaction",
          target: "ID: 58A72C3",
          date: "Today, 10:23 AM",
          result: "Legitimate",
          status: "success",
        },
        {
          type: "website",
          target: "example-shop.com",
          date: "Today, 9:45 AM",
          result: "Fraudulent",
          status: "danger",
        },
        {
          type: "transaction",
          target: "ID: 58A71B2",
          date: "Yesterday, 4:12 PM",
          result: "Legitimate",
          status: "success",
        },
        {
          type: "transaction",
          target: "ID: 58A70A1",
          date: "Yesterday, 2:30 PM",
          result: "Suspicious",
          status: "warning",
        },
        {
          type: "website",
          target: "secure-payments.net",
          date: "Yesterday, 11:15 AM",
          result: "Fraudulent",
          status: "danger",
        },
      ]
      updateRecentActivity(dummyActivity)
    })
}

function updateRecentActivity(activities) {
  const tableBody = document.getElementById("recentActivityTable")

  if (!tableBody) return

  tableBody.innerHTML = ""

  activities.forEach((activity) => {
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
            ? `<button class="btn btn-sm btn-outline" onclick="showTransactionDetails('${activity.target}')">View Details</button>`
            : `<span class="text-light">-</span>`
        }
      </td>
    `

    tableBody.appendChild(row)
  })
}

// Update showTransactionDetails function to include method
function showTransactionDetails(target) {
  // Simulate API call with dummy data
  const dummyDetails = {
    amount: "$2,450.00",
    email: "user" + Math.floor(Math.random() * 1000) + "@example.com",
    method: Math.random() > 0.5 ? "GUI" : "API",
    oldBalanceOrig: "$15,230.50",
    newBalanceOrig: "$12,780.50",
    oldBalanceDest: "$8,920.25",
    newBalanceDest: "$11,370.25",
    type: "TRANSFER",
    isFraud: "No",
    isFlaggedFraud: "No",
  }

  updateTransactionModal(dummyDetails)

  // Uncomment below for real API call
  /*
  fetch(`http://localhost:8000/transaction-details`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      target: target
    })
  })
    .then(response => response.json())
    .then(data => {
      updateTransactionModal(data)
    })
    .catch(error => {
      console.error("Error fetching transaction details:", error)
      updateTransactionModal(dummyDetails)
    })
  */
}

function updateTransactionModal(details) {
  document.getElementById("modalAmount").textContent = details.amount
  document.getElementById("modalEmail").textContent = details.email
  document.getElementById("modalMethod").textContent = details.method || "GUI"
  document.getElementById("modalOldBalanceOrig").textContent = details.oldBalanceOrig
  document.getElementById("modalNewBalanceOrig").textContent = details.newBalanceOrig
  document.getElementById("modalOldBalanceDest").textContent = details.oldBalanceDest
  document.getElementById("modalNewBalanceDest").textContent = details.newBalanceDest
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
