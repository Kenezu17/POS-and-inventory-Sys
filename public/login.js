// login.js
document.addEventListener("DOMContentLoaded", function () {
  async function login(e) {
    e.preventDefault(); // stop form from refreshing page

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    try {
      const res = await fetch("http://localhost:3000/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if(!username && password){
        showToast("Please fill out both Username and Password.")
        return
      }

      if (res.ok) {
        alert(data.message);
        window.location.href = "admin.dash.html"; 
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Could not connect to server");
    }
  }

 
  document.querySelector(".logbtn").addEventListener("click", login);
});
