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

// Add sorting functionality and "No entries found" message
let currentPage = 1
let isLoading = false
let hasMoreData = true
let currentFilter = "all"
let searchQuery = ""
let allHistoryData = []
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

  // Infinite scroll
  const tableWrapper = document.querySelector(".table-wrapper")
  if (tableWrapper) {
    tableWrapper.addEventListener("scroll", handleScroll)
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

  // Update visual indicators (optional)
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
      // Extract date parts for comparison
      valueA = new Date(valueA.replace("Today, ", "").replace("Yesterday, ", ""))
      valueB = new Date(valueB.replace("Today, ", "").replace("Yesterday, ", ""))
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
  if (isLoading || !hasMoreData) return

  isLoading = true
  showLoadingMore()

  const userId = localStorage.getItem("user_id")

  // Simulate API call with dummy data
  setTimeout(() => {
    const newData = generateDummyHistoryData(currentPage)

    if (currentPage === 1) {
      allHistoryData = newData
    } else {
      allHistoryData = [...allHistoryData, ...newData]
    }

    // Simulate end of data after 5 pages
    if (currentPage >= 5) {
      hasMoreData = false
      showNoMoreResults()
    }

    filterAndDisplayData()
    currentPage++
    isLoading = false
    hideLoadingMore()
  }, 1000)

  // Uncomment below for real API call
  /*
  fetch(`http://localhost:8000/history`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user_id: userId,
      page: currentPage,
      limit: 20
    })
  })
    .then(response => response.json())
    .then(data => {
      if (currentPage === 1) {
        allHistoryData = data.history
      } else {
        allHistoryData = [...allHistoryData, ...data.history]
      }
      
      hasMoreData = data.hasMore
      
      if (!hasMoreData) {
        showNoMoreResults()
      }
      
      filterAndDisplayData()
      currentPage++
      isLoading = false
      hideLoadingMore()
    })
    .catch(error => {
      console.error("Error fetching history:", error)
      isLoading = false
      hideLoadingMore()
    })
  */
}

function generateDummyHistoryData(page) {
  const types = ["website", "transaction"]
  const results = ["Legitimate", "Fraudulent", "Suspicious"]
  const statuses = ["success", "danger", "warning"]

  const data = []
  const itemsPerPage = 20

  for (let i = 0; i < itemsPerPage; i++) {
    const type = types[Math.floor(Math.random() * types.length)]
    const resultIndex = Math.floor(Math.random() * results.length)
    const result = results[resultIndex]
    const status = statuses[resultIndex]

    const item = {
      id: `${page}_${i}`,
      type: type,
      target:
        type === "website"
          ? `example-${Math.floor(Math.random() * 1000)}.com`
          : `ID: ${Math.random().toString(36).substr(2, 7).toUpperCase()}`,
      date: generateRandomDate(),
      result: result,
      status: status,
      confidence: Math.floor(Math.random() * 40) + 60, // 60-99%
    }

    data.push(item)
  }

  return data
}

function generateRandomDate() {
  const now = new Date()
  const daysAgo = Math.floor(Math.random() * 30)
  const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)

  if (daysAgo === 0) {
    return `Today, ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
  } else if (daysAgo === 1) {
    return `Yesterday, ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
  } else {
    return date.toLocaleDateString() + `, ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
  }
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

  data.forEach((item) => {
    const row = document.createElement("tr")

    const typeIcon = item.type === "website" ? "fas fa-globe" : "fas fa-exchange-alt"
    const typeClass = item.type === "website" ? "website" : "transaction"

    const confidenceClass = item.confidence >= 80 ? "high" : item.confidence >= 60 ? "medium" : "low"

    row.innerHTML = `
      <td>
        <div class="activity-type ${typeClass}">
          <i class="${typeIcon}"></i>
          ${item.type.charAt(0).toUpperCase() + item.type.slice(1)}
        </div>
      </td>
      <td>${item.target}</td>
      <td>${item.date}</td>
      <td>
        <span class="status-badge ${item.status}">${item.result}</span>
      </td>
      <td>
        <div class="confidence-bar">
          <div class="confidence-progress">
            <div class="confidence-fill ${confidenceClass}" style="width: ${item.confidence}%"></div>
          </div>
          <span class="confidence-text">${item.confidence}%</span>
        </div>
      </td>
      <td>
        ${
          item.type === "transaction"
            ? `<button class="btn btn-sm btn-outline" onclick="showTransactionDetails('${item.target}')">View Details</button>`
            : `<span class="text-light">-</span>`
        }
      </td>
    `

    tableBody.appendChild(row)
  })
}

function updateTotalResults(count) {
  const totalResults = document.getElementById("totalResults")
  if (totalResults) {
    totalResults.textContent = count.toLocaleString()
  }
}

function handleScroll(event) {
  const { scrollTop, scrollHeight, clientHeight } = event.target

  if (scrollTop + clientHeight >= scrollHeight - 5 && !isLoading && hasMoreData) {
    loadHistoryData()
  }
}

function showLoadingMore() {
  const loadingMore = document.getElementById("loadingMore")
  if (loadingMore) {
    loadingMore.style.display = "block"
  }
}

function hideLoadingMore() {
  const loadingMore = document.getElementById("loadingMore")
  if (loadingMore) {
    loadingMore.style.display = "none"
  }
}

function showNoMoreResults() {
  const noMoreResults = document.getElementById("noMoreResults")
  if (noMoreResults) {
    noMoreResults.style.display = "block"
  }
}

function showTransactionDetails(target) {
  // Simulate API call with dummy data
  const dummyDetails = {
    amount: "$" + (Math.random() * 10000 + 100).toFixed(2),
    email: "user" + Math.floor(Math.random() * 1000) + "@example.com",
    method: Math.random() > 0.5 ? "GUI" : "API",
    oldBalanceOrig: "$" + (Math.random() * 50000 + 1000).toFixed(2),
    newBalanceOrig: "$" + (Math.random() * 50000 + 1000).toFixed(2),
    oldBalanceDest: "$" + (Math.random() * 50000 + 1000).toFixed(2),
    newBalanceDest: "$" + (Math.random() * 50000 + 1000).toFixed(2),
    type: ["TRANSFER", "PAYMENT", "DEBIT", "CASH_OUT", "CASH_IN"][Math.floor(Math.random() * 5)],
    isFraud: Math.random() > 0.7 ? "Yes" : "No",
    isFlaggedFraud: Math.random() > 0.8 ? "Yes" : "No",
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

function exportHistory() {
  // Create CSV content
  const headers = ["Type", "Target", "Date", "Result", "Confidence"]
  const csvContent = [
    headers.join(","),
    ...allHistoryData.map((item) =>
      [item.type, `"${item.target}"`, `"${item.date}"`, item.result, `${item.confidence}%`].join(","),
    ),
  ].join("\n")

  // Create and download file
  const blob = new Blob([csvContent], { type: "text/csv" })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `fraudshield_history_${new Date().toISOString().split("T")[0]}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
}

function clearHistory() {
  if (confirm("Are you sure you want to clear all history? This action cannot be undone.")) {
    // Simulate API call
    allHistoryData = []
    currentPage = 1
    hasMoreData = true

    const tableBody = document.getElementById("historyTableBody")
    if (tableBody) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" class="loading-row">No history found</td>
        </tr>
      `
    }

    updateTotalResults(0)

    // Uncomment below for real API call
    /*
    const userId = localStorage.getItem("user_id")
    fetch(`http://localhost:8000/clear-history`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: userId
      })
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          allHistoryData = []
          currentPage = 1
          hasMoreData = true
          filterAndDisplayData()
        }
      })
      .catch(error => {
        console.error("Error clearing history:", error)
      })
    */
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
