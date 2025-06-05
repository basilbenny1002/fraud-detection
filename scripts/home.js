document.addEventListener("DOMContentLoaded", () => {
  // Check if user is logged in
  const userId = localStorage.getItem("user_id")
  const userName = localStorage.getItem("name")

  const authButtons = document.getElementById("authButtons")
  const dashboardLink = document.getElementById("dashboardLink")

  if (userId && userName) {
    // User is logged in, show dashboard link
    authButtons.style.display = "none"
    dashboardLink.style.display = "block"
  } else {
    // User is not logged in, show auth buttons
    authButtons.style.display = "flex"
    dashboardLink.style.display = "none"
  }

  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault()

      const targetId = this.getAttribute("href")
      if (targetId === "#") return

      const targetElement = document.querySelector(targetId)
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: "smooth",
          block: "start",
        })
      }
    })
  })

  // Add animation on scroll
  const animateOnScroll = () => {
    const elements = document.querySelectorAll(".feature-card, .step, .pricing-card")

    elements.forEach((element) => {
      const elementPosition = element.getBoundingClientRect().top
      const screenPosition = window.innerHeight / 1.3

      if (elementPosition < screenPosition) {
        element.style.opacity = "1"
        element.style.transform = element.classList.contains("featured") ? "translateY(0) scale(1.05)" : "translateY(0)"
      }
    })
  }

  // Set initial state for animations
  document.querySelectorAll(".feature-card, .step, .pricing-card").forEach((element) => {
    element.style.opacity = "0"
    element.style.transform = "translateY(20px)"
    element.style.transition = "opacity 0.6s ease, transform 0.6s ease"
  })

  // Run animation on load and scroll
  window.addEventListener("load", animateOnScroll)
  window.addEventListener("scroll", animateOnScroll)
})
