document.addEventListener("DOMContentLoaded", function () {
    const form = document.querySelector("form"); 

    form.addEventListener("submit", function (e) {
        e.preventDefault(); 

        const user = document.getElementById("username").value.trim();
        const pass = document.getElementById("password").value.trim();

        if (user === "admin" && pass === "admin123") {
            
            window.location.href = "admin.dash.html";
        } else {
          
            alert("Wrong username or password!");
        }
    });
});
