async function submitForm(event) {
  event.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const response = await axios.post(
      "http://localhost:3000/api/users/signin",
      { email, password },
    );

    // 1. SAVE THE TOKEN (For Authentication)
    localStorage.setItem("token", response.data.token);

    // 2. SAVE USER IDENTITY (For UI and Database filtering)
    localStorage.setItem("currentUserId", response.data.userId);
    localStorage.setItem("userName", response.data.name);

    // 3. SAVE THE EMAIL (CRITICAL: Used to build private chat rooms)
    // This fixes the 'null' issue you saw in your console logs
    localStorage.setItem("userEmail", email);

    console.log(
      "Login Success! Email saved:",
      localStorage.getItem("userEmail"),
    );

    // 4. Redirect to the Chat Page
    window.location.href = "../chat/chat.html";
  } catch (err) {
    if (err.response) {
      const { status } = err.response;

      if (status === 401 || status === 404) {
        alert(err.response.data.message);
      } else {
        alert("Invalid credentials. Please try again.");
      }
    } else {
      alert(
        "Server is not responding. Please check if your backend is running.",
      );
    }
    console.error("Signin Error:", err);
  }
}

// Ensure the form listener is attached if you aren't using 'onclick' in HTML
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", submitForm);
}
