async function submitForm(event) {
  event.preventDefault();

  const email = document.getElementById("email").value;
  const name = document.getElementById("name").value;
  const password = document.getElementById("password").value;
  const phone = document.getElementById("phone").value;

  // Validation Check
  if (password.length < 8) {
    alert("Password must be at least 8 characters long.");
    return; // Stop the function from proceeding to the Axios call
  }

  try {
    // 1. Sending the POST request
    // Note: Included 'phone' so the backend validation doesn't fail
    const response = await axios.post(
      "http://localhost:3000/api/users/signup",
      {
        name,
        email,
        password,
        phone,
      },
    );

    // 2. If successful (Status 201)
    alert(response.data.message);
    console.log("Success:", response.data);
    event.target.reset();
    window.location.href = "../Signin/signin.html";
  } catch (err) {
    // 3. Handling errors separately
    if (err.response) {
      // Error Case A: Status 400 (Validation error or User exists)
      if (err.response.status === 400) {
        alert(err.response.data.message);
      }
      // Error Case B: Status 500 (Server crash/Database error)
      else if (err.response.status === 500) {
        alert("Internal Server Error: Please try again later.");
      }
    }

    console.error("Signup Error:", err);
  }
}
