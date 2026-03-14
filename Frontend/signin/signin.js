async function submitForm(event) {
  event.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const response = await axios.post(
      "http://localhost:3000/api/users/signin",
      { email, password },
    );

    // 2. SAVE THE TOKEN to LocalStorage
    // This is the "ID Card" your auth middleware looks for!
    localStorage.setItem("token", response.data.token);
    localStorage.setItem("currentUserId", response.data.userId);
    localStorage.setItem("userName", response.data.name);

    console.log(localStorage.getItem("token"));

    // 3. Redirect to the Chat Page
    window.location.href = "../chat/chat.html";
  } catch (err) {
    if (err.response) {
      // Extract status from the response object
      const { status } = err.response;

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
