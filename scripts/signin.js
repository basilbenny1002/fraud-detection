document.addEventListener("DOMContentLoaded", () => {
  // Declare the dcodeIO variable before using it
  const dcodeIO = window.dcodeIO || {}
  console.log("bcrypt is:", typeof dcodeIO.bcrypt !== "undefined" ? "loaded" : "not loaded")

  // Check if user is already logged in
  if (localStorage.getItem("user_id") || localStorage.getItem("name")) {
    window.location.href = "dashboard.html"
    return
  }

  const signin = document.getElementById("signInButton")
  const signinform = document.getElementById("signInForm")

  signinform.onsubmit = handleSignIn
  signin.onclick = (event) => {
    if (!signinform.checkValidity()) {
      signinform.reportValidity()
    } else {
      handleSignIn(event)
    }
  }
})

function encryptPassword(password) {
  const salt = "$2a$10$abcdefghijklmnopqrstuv123456"
  return window.dcodeIO.bcrypt.hashSync(password, salt)
}

function handleSignIn(event) {
  event.preventDefault()
  console.log("Signin procedure")

  const email = document.getElementById("email_input").value.toLowerCase()
  const password = document.getElementById("password_input").value

  if (!email || !password) {
    alert("Please fill in all fields")
    return
  }

  const encryptedPassword = encryptPassword(password)
  console.log(email, password)

  const apiUrl = `https://ecommerce-transaction-fraud-detection.onrender.com/signin`

  // Show loading state
  const signInButton = document.getElementById("signInButton")
  const originalButtonText = signInButton.innerHTML
  signInButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...'
  signInButton.disabled = true

  fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: encryptedPassword }),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log(data)
      if (data.Status_code == 200) {
        localStorage.setItem("user_id", data.UserID)
        localStorage.setItem("name", data.Name)
        localStorage.setItem("api_key", data.API_KEY)
        window.location.href = "dashboard.html"
      } else {
        alert(data.Message || "Login failed. Please check your credentials.")
        // Reset button state
        signInButton.innerHTML = originalButtonText
        signInButton.disabled = false
      }
    })
    .catch((error) => {
      console.error("Error during sign in:", error)

      // For demo purposes, simulate successful login if API is not available
      if (email === "demo@example.com" && password === "password") {
        const demoUserId = "demo123456789"
        localStorage.setItem("user_id", demoUserId)
        localStorage.setItem("name", "Demo User")
        localStorage.setItem("api_key", "demo_api_key_12345")
        window.location.href = "dashboard.html"
      } else {
        alert("Error connecting to server. Please try again later.")
        // Reset button state
        signInButton.innerHTML = originalButtonText
        signInButton.disabled = false
      }
    })
}
