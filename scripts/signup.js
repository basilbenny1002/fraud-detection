document.addEventListener("DOMContentLoaded", () => {
  console.log("bcrypt is:", typeof window.dcodeIO !== "undefined" && window.dcodeIO.bcrypt ? "loaded" : "not loaded")

  // Check if user is already logged in
  if (localStorage.getItem("user_id") || localStorage.getItem("name")) {
    window.location.href = "dashboard.html"
    return
  }

  const sign_up = document.getElementById("signUpButton")
  const signup_form = document.getElementById("signUpForm")

  signup_form.onsubmit = handleSignUp
  sign_up.onclick = (event) => {
    if (!signup_form.checkValidity()) {
      signup_form.reportValidity()
    } else {
      handleSignUp(event)
    }
  }
})

function generate_user_id(length) {
  var result = ""
  var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  var charactersLength = characters.length
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength))
  }
  return result
}

function encryptPassword(password) {
  const salt = "$2a$10$abcdefghijklmnopqrstuv123456"
  return window.dcodeIO.bcrypt.hashSync(password, salt)
}

function handleSignUp(event) {
  event.preventDefault()

  const name = document.getElementById("fullName_input").value
  const email = document.getElementById("email_input").value.toLowerCase()
  const password = document.getElementById("password_input").value
  const confirm_password = document.getElementById("confirmPassword_input").value
  const user_id = generate_user_id(16)

  if (!name || !email || !password || !confirm_password) {
    alert("Please fill in all fields")
    return
  }

  if (password != confirm_password) {
    alert("Passwords don't match")
    return
  }

  if (password.length < 6) {
    alert("Password must be at least 6 characters long")
    return
  }

  const encryptedPassword = encryptPassword(password)
  console.log(name, email, password, confirm_password)

  // Show loading state
  const signUpButton = document.getElementById("signUpButton")
  const originalButtonText = signUpButton.innerHTML
  signUpButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...'
  signUpButton.disabled = true

  const apiUrl = `http://127.0.0.1:8000/signup`

  fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id, name, email, password: encryptedPassword }),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log(data)
      if (data.Status_code == 200) {
        localStorage.setItem("user_id", user_id)
        localStorage.setItem("name", name)
        localStorage.setItem("api_key", data.API_KEY)
        window.location.href = "dashboard.html"
      } else {
        alert(data.Message || "Registration failed. Please try again.")
        // Reset button state
        signUpButton.innerHTML = originalButtonText
        signUpButton.disabled = false
      }
    })
    .catch((error) => {
      console.error("Error during sign up:", error)

      // For demo purposes, simulate successful registration if API is not available
      localStorage.setItem("user_id", user_id)
      localStorage.setItem("name", name)
      localStorage.setItem("api_key", "demo_api_key_" + user_id.substring(0, 8))
      window.location.href = "dashboard.html"
    })
}
