document.addEventListener("DOMContentLoaded", function () {
  async function login(e) {
    e.preventDefault(); 

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!username || !password) {
      alert("Please fill out both Username and Password.");
      return;
    }

    try {
      const res = await fetch("http://localhost:3000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        alert(data.message);
        if (data.role === "owner") window.location.href = "admin.dash.html";
        else if (data.role === "staff") window.location.href = "pos.html";
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
