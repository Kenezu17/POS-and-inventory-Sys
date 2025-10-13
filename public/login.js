document.addEventListener("DOMContentLoaded", function () {
  async function login(e) {
    e.preventDefault(); 

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!username || !password) {
      showmess("Please fill out both Username and Password.","error");
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
         console.log("Storing username:", data.username);
       localStorage.setItem("userUsername", data.username);
        if (data.role === "owner") window.location.href = "admin.dash.html";
        else if (data.role === "staff") window.location.href = "pos.html";
     } else {
        showmess(data.message, "error");
      }
    } catch (error) {
      console.error("Error:", error);
      showmess("Could not connect to server","error");
    }
  }

  document.querySelector(".logbtn").addEventListener("click", login);

 // ==============================
  // Toast Message
  // ==============================
  function showmess(message, type = "info") {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.style.background =
      type === 'successful' ? "#28a745" :
        type === 'error' ? "#dc3545" :
          "#333";
    toast.className = "show";
    setTimeout(() => { toast.className = toast.className.replace("show", ""); }, 3000);
  }

});
