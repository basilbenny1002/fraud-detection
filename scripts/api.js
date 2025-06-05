document.addEventListener("DOMContentLoaded", () => {
  // Check if user is logged in
  if (!localStorage.getItem("user_id") || !localStorage.getItem("name")) {
    window.location.href = "signin.html"
    return
  }

  // Display API key
  displayApiKey()

  // Handle navigation
  setupNavigation()

  // Handle copy functionality
  setupCopyButtons()
})

function displayApiKey() {
  const apiKeyDisplay = document.getElementById("apiKeyDisplay")
  const apiKey = localStorage.getItem("api_key")

  if (apiKey) {
    apiKeyDisplay.textContent = apiKey
  } else {
    apiKeyDisplay.textContent = "sk-example-1234567890abcdef"
    apiKeyDisplay.style.opacity = "0.6"
  }
}

function setupNavigation() {
  const navLinks = document.querySelectorAll(".api-nav a")
  const sections = document.querySelectorAll(".api-section")

  // Handle click navigation
  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault()
      const targetId = link.getAttribute("href").substring(1)
      const targetSection = document.getElementById(targetId)

      if (targetSection) {
        targetSection.scrollIntoView({
          behavior: "smooth",
          block: "start",
        })

        // Update active state
        navLinks.forEach((l) => l.classList.remove("active"))
        link.classList.add("active")
      }
    })
  })

  // Handle scroll-based navigation highlighting
  window.addEventListener("scroll", () => {
    let current = ""
    sections.forEach((section) => {
      const sectionTop = section.offsetTop - 100
      if (window.pageYOffset >= sectionTop) {
        current = section.getAttribute("id")
      }
    })

    navLinks.forEach((link) => {
      link.classList.remove("active")
      if (link.getAttribute("href") === `#${current}`) {
        link.classList.add("active")
      }
    })
  })
}

function setupCopyButtons() {
  // API key copy button
  const copyApiKeyBtn = document.getElementById("copyApiKey")
  if (copyApiKeyBtn) {
    copyApiKeyBtn.addEventListener("click", () => {
      const apiKey = document.getElementById("apiKeyDisplay").textContent
      copyToClipboard(apiKey)
      showCopyFeedback(copyApiKeyBtn)
    })
  }

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
  const mobileMenuBtn = document.createElement("button")
  mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>'
  mobileMenuBtn.className = "btn btn-outline mobile-menu-btn"
  mobileMenuBtn.onclick = toggleSidebar
  header.querySelector(".header-actions").prepend(mobileMenuBtn)
}
