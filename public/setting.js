document.addEventListener("DOMContentLoaded", async function () {
  const menuBtn = document.getElementById("menu-btn");
  const sidebar = document.querySelector(".sidebar");
  const navLinks = document.querySelectorAll(".nav a");
  const currentpage = location.pathname.split("/").pop();

  // ==============================
  // Active Nav
  // ==============================
  navLinks.forEach((link) => {
    if (link.getAttribute("href") === currentpage) {
      link.classList.add("active");
    }
  });

  // ==============================
  // Sidebar toggle
  // ==============================
  menuBtn?.addEventListener("click", () => {
    sidebar.classList.toggle("collapsed");
  });

  // ==============================
  // STORE INFO
  // ==============================
  const form = document.querySelector(".main");
const userId = 1;
let dataExists = false; 


async function loadStoreInfo() {
  try {
    const res = await fetch(`http://localhost:3000/owner/${userId}`);
    if (!res.ok) throw new Error("Owner not found");

    const data = await res.json();
    if (data) {
      dataExists = true; 
      document.getElementById("fullname").value = data.name || "";
      document.getElementById("name").value = data.store || "";
      document.getElementById("address").value = data.address || "";
      document.getElementById("email").value = data.email || "";
      document.getElementById("contact").value = data.contact || "";
      document.getElementById("h").value = data.receipt_h || "";
      document.getElementById("f").value = data.receipt_f || "";
    }
  } catch (err) {
    console.warn("Could not load owner info:", err);
    dataExists = false; 
  }
}


loadStoreInfo();


form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const storeInfo = {
    name: document.getElementById("fullname").value.trim(),
    store: document.getElementById("name").value.trim(),
    address: document.getElementById("address").value.trim(),
    email: document.getElementById("email").value.trim(),
    contact: document.getElementById("contact").value.trim(),
    receipt_h: document.getElementById("h").value.trim(),
    receipt_f: document.getElementById("f").value.trim(),
  };


  if (
    !storeInfo.name ||
    !storeInfo.store ||
    !storeInfo.address ||
    !storeInfo.email ||
    !storeInfo.contact ||
    !storeInfo.receipt_h ||
    !storeInfo.receipt_f
  ) {
    showmess("All fields are required", "error");
    return;
  }

  try {
    const method = dataExists ? "PATCH" : "POST";
    const endpoint = dataExists ? `/owner/${userId}` : `/owner`;

    const res = await fetch(`http://localhost:3000${endpoint}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(storeInfo),
    });

    const data = await res.json();

    if (res.ok) {
      showmess(data.message || "Saved successfully", "successful");
      dataExists = true; 
     
      localStorage.setItem("storeInfo", JSON.stringify(storeInfo));
    } else {
      showmess(data.message || "Failed to save", "error");
    }
  } catch (err) {
    console.error("Error saving data:", err);
    showmess("Server connection failed", "error");
  }
});

  // ==============================
  // CHANGE PASSWORD FORM
  // ==============================
  document.querySelector(".btn").addEventListener("click", async (e) => {
    e.preventDefault();

    const password = document.querySelector(".password").value.trim();
    const new_password = document.querySelector(".new_password").value.trim();

    if (!password || !new_password) {
      showmess("Both current and new password are required", "error");
      return;
    }

    try {
      const res = await fetch(`http://localhost:3000/changepass/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, new_password }),
      });

      const data = await res.json();

      if (res.ok) {
        showmess(data.message, "successful");
      } else {
        showmess(data.message, "error");
      }

      document.querySelector(".password").value = "";
      document.querySelector(".new_password").value = "";
    } catch (err) {
      showmess("Failed to update password", "error");
      console.error(err);
    }
  });

  // ==============================
  // NOTIFICATION SETTINGS
  // ==============================
  const saved = JSON.parse(localStorage.getItem("notificationSettings") || "{}");

  document.getElementById("lowStockSwitch").checked = saved.lowStock ?? true;
  document.getElementById("productUpdatedSwitch").checked =
    saved.productUpdated ?? true;
  document.getElementById("itemUpdatedSwitch").checked =
    saved.itemUpdated ?? true;

  document.querySelectorAll("input[type='checkbox']").forEach((sw) => {
    sw.addEventListener("change", () => {
      const newSettings = {
        lowStock: document.getElementById("lowStockSwitch").checked,
        productUpdated: document.getElementById("productUpdatedSwitch").checked,
        itemUpdated: document.getElementById("itemUpdatedSwitch").checked,
      };
      localStorage.setItem("notificationSettings", JSON.stringify(newSettings));
    });
  });

  // ==============================
  // Toast Message
  // ==============================
  function showmess(message, type = "info") {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.style.background =
      type === "successful"
        ? "#28a745"
        : type === "error"
        ? "#dc3545"
        : "#333";
    toast.className = "show";
    setTimeout(() => {
      toast.className = toast.className.replace("show", "");
    }, 3000);
  }
});
