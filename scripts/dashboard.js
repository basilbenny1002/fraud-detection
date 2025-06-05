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

  // Tool card clicks
  const toolCards = document.querySelectorAll(".tool-card")
  toolCards.forEach((card) => {
    card.addEventListener("click", (e) => {
      // This is handled by the onclick attributes in HTML
    })
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

function loadDashboardData() {
  // This would typically load real data from your API
  // For now, we'll use the static data that's already in the HTML
  // You can add API calls here to load real dashboard data
  // Example:
  // fetchDashboardStats()
  // fetchRecentActivity()
}

function fetchDashboardStats() {
  const userId = localStorage.getItem("user_id")
  const apiUrl = `http://127.0.0.1:8000/dashboard/stats/${userId}`

  fetch(apiUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("api_key")}`,
    },
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.status_code === 200) {
        updateStatsCards(data.stats)
      }
    })
    .catch((error) => {
      console.log("Using demo data - API not available")
    })
}

function updateStatsCards(stats) {
  // Update the stats cards with real data
  const statValues = document.querySelectorAll(".stat-value")
  if (statValues.length >= 4) {
    statValues[0].textContent = stats.total_checks || "1,248"
    statValues[1].textContent = stats.fraud_detected || "267"
    statValues[2].textContent = stats.api_calls || "3,842"
    statValues[3].textContent = stats.accuracy_rate || "94.8%"
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
