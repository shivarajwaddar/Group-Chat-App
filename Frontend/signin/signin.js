async function submitForm(event) {
  event.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const response = await axios.post(
      "http://localhost:3000/api/users/signin",
      { email, password },
    );

    // 1. Success! Show message
    alert(response.data.message);

    // 2. SAVE THE TOKEN to LocalStorage
    // This is the "ID Card" your auth middleware looks for!
    localStorage.setItem("token", response.data.token);

    console.log(localStorage.getItem("token"));

    // 3. Redirect to the Chat Page
    // window.location.href = "../Chat/chat.html";
  } catch (err) {
    if (err.response) {
      // Check for 401 (Unauthorized/Wrong Password) or 404 (User not found)
      if (status === 401 || status === 404) {
        alert(err.response.data.message);
      } else {
        alert("Something went wrong. Please try again.");
      }
    } else {
      alert("Server is not responding.");
    }
    console.error("Signin Error:", err);
  }
}
