document.addEventListener("DOMContentLoaded", () => {
  if (!localStorage.getItem("user_id") || !localStorage.getItem("name")) {
    window.location.href = "signin.html"
    return
  }

  displayUserInfo()
  setupEventListeners()
  displayApiKey()
  setupNavigation()
  setupCopyButtons()
})

function displayUserInfo() {
  const userProfileNameElement = document.getElementById("userProfileName")
  const userName = localStorage.getItem("name") || "Test"
  const userProfileIconElement = document.getElementById("userProfileIcon")
  const userID = localStorage.getItem("user_id") || "d30d6649394c39a38eac941dcd2017f5"
  console.log(userName, userID)

  if (userProfileNameElement) userProfileNameElement.textContent = userName
  if (userProfileIconElement) {
    userProfileIconElement.src = `https://robohash.org/${userID}?set=set4&bgset=&size=32x32`
  }
}

function setupEventListeners() {
  const logoutLink = document.getElementById("logoutLink")
  if (logoutLink) logoutLink.onclick = logout

  const copyApiKeyButton = document.getElementById("copyApiKeyButton")
  if (copyApiKeyButton) copyApiKeyButton.onclick = copy

  const regenerateApiKeyButton = document.getElementById("regenerateApiKeyButton")
  if (regenerateApiKeyButton) regenerateApiKeyButton.onclick = generate_new_key
}

function displayApiKey() {
  const apiKeyTextElement = document.getElementById("apiKeyText")
  const apiKey = localStorage.getItem("api_key")

  if (apiKeyTextElement) {
    apiKeyTextElement.textContent = apiKey ? apiKey : "No API Key Found"
  }
}

function copy() {
  const currentApiKey = localStorage.getItem("api_key")
  const copyButtonText = document.getElementById("copyButtonText")
  const copyApiKeyButton = document.getElementById("copyApiKeyButton")

  if (!currentApiKey || currentApiKey.startsWith("Error") || currentApiKey.startsWith("User not")) return

  navigator.clipboard
    .writeText(currentApiKey)
    .then(() => {
      if (copyButtonText) copyButtonText.textContent = "Copied!"
      if (copyApiKeyButton) copyApiKeyButton.classList.add("copied")
      setTimeout(() => {
        if (copyButtonText) copyButtonText.textContent = "Copy"
        if (copyApiKeyButton) copyApiKeyButton.classList.remove("copied")
      }, 2000)
    })
    .catch((err) => {
      console.error("Failed to copy API key: ", err)
      alert("Failed to copy. Please copy manually.")
    })
}

function logout() {
  localStorage.clear()
  window.location.href = "signin.html"
}

function generate_new_key() {
  const regenerateButton = document.getElementById("regenerateApiKeyButton")
  const originalContent = regenerateButton.innerHTML

  // Show loading state
  regenerateButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...'
  regenerateButton.disabled = true

  const api_url = "http://127.0.0.1:8000/regenerate_key"
  fetch(api_url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: localStorage.getItem("user_id") }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return response.json()
    })
    .then((data) => {
      if (data.Status_code === 200 && data.API_KEY) {
        console.log("API key regenerated successfully:", data)

        // Update localStorage with new API key
        localStorage.setItem("api_key", data.API_KEY)

        // Update the display
        const apiKeyTextElement = document.getElementById("apiKeyText")
        if (apiKeyTextElement) {
          apiKeyTextElement.textContent = data.API_KEY
        }

        // Show success feedback
        regenerateButton.innerHTML = '<i class="fas fa-check"></i> Generated!'
        regenerateButton.style.color = "var(--success-color)"

        setTimeout(() => {
          regenerateButton.innerHTML = originalContent
          regenerateButton.style.color = ""
          regenerateButton.disabled = false
        }, 2000)
      } else {
        throw new Error(data.Message || "Failed to regenerate API key")
      }
    })
    .catch((error) => {
      console.error("Error regenerating API key:", error)

      // Show error state
      regenerateButton.innerHTML = '<i class="fas fa-times"></i> Error'
      regenerateButton.style.color = "var(--danger-color)"

      // Show user-friendly error message
      const errorMessage = error.message.includes("HTTP error")
        ? "Server error. Please try again later."
        : error.message || "Failed to regenerate API key. Please try again."

      alert(`Error: ${errorMessage}`)

      setTimeout(() => {
        regenerateButton.innerHTML = originalContent
        regenerateButton.style.color = ""
        regenerateButton.disabled = false
      }, 2000)
    })
}

function setupNavigation() {
  const navLinks = document.querySelectorAll(".api-nav a")
  const sections = document.querySelectorAll(".api-section")

  // Handle click navigation
  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      const href = link.getAttribute("href")

      // Only prevent default for anchor links (starting with #)
      // Allow normal navigation for external links like dashboard.html
      if (href && href.startsWith("#")) {
        e.preventDefault()
        const targetId = href.substring(1)
        const targetSection = document.getElementById(targetId)

        if (targetSection) {
          targetSection.scrollIntoView({
            behavior: "smooth",
            block: "start",
          })

          // Update active state only for anchor links
          navLinks.forEach((l) => {
            if (l.getAttribute("href") && l.getAttribute("href").startsWith("#")) {
              l.classList.remove("active")
            }
          })
          link.classList.add("active")
        }
      }
      // For non-anchor links (like dashboard.html), let the default behavior happen
    })
  })

  // Handle scroll-based navigation highlighting
  window.addEventListener("scroll", () => {
    let current = ""
    sections.forEach((section) => {
      const sectionTop = section.offsetTop - 100
      const sectionBottom = sectionTop + section.offsetHeight
      const scrollPosition = window.pageYOffset + 200

      if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
        current = section.getAttribute("id")
      }
    })

    // If we're at the bottom of the page, highlight the last section
    if (window.innerHeight + window.pageYOffset >= document.body.offsetHeight - 100) {
      const lastSection = sections[sections.length - 1]
      if (lastSection) {
        current = lastSection.getAttribute("id")
      }
    }

    navLinks.forEach((link) => {
      const href = link.getAttribute("href")
      if (href && href.startsWith("#")) {
        link.classList.remove("active")
        if (href === `#${current}`) {
          link.classList.add("active")
        }
      }
    })
  })
}

function setupCopyButtons() {
  // Code block copy buttons
  const copyCodeBtns = document.querySelectorAll(".copy-code-btn")
  copyCodeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      copyCode(btn)
    })
  })
}

function copyCode(button) {
  const codeBlock = button.closest(".code-block")
  const code = codeBlock.querySelector("code")
  const text = code.textContent

  copyToClipboard(text)
  showCopyFeedback(button)
}

function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text)
  } else {
    // Fallback for older browsers
    const textArea = document.createElement("textarea")
    textArea.value = text
    textArea.style.position = "fixed"
    textArea.style.left = "-999999px"
    textArea.style.top = "-999999px"
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    document.execCommand("copy")
    textArea.remove()
  }
}

function showCopyFeedback(button) {
  const originalIcon = button.innerHTML
  button.innerHTML = '<i class="fas fa-check"></i>'
  button.style.color = "var(--success-color)"

  setTimeout(() => {
    button.innerHTML = originalIcon
    button.style.color = ""
  }, 2000)
}

// Handle mobile sidebar toggle (if needed)
function toggleSidebar() {
  const sidebar = document.querySelector(".api-sidebar")
  sidebar.classList.toggle("open")
}

// Add mobile menu button if needed
if (window.innerWidth <= 1024) {
  const header = document.querySelector(".api-header")
  if (header) {
    const mobileMenuBtn = document.createElement("button")
    mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>'
    mobileMenuBtn.className = "btn btn-outline mobile-menu-btn"
    mobileMenuBtn.onclick = toggleSidebar
    const headerActions = header.querySelector(".header-actions")
    if (headerActions) {
      headerActions.prepend(mobileMenuBtn)
    }
  }
}
