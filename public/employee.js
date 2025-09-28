document.addEventListener("DOMContentLoaded", function () {
  const menuBtn = document.getElementById("menu-btn");
  const sidebar = document.querySelector(".sidebar");
  const navLinks = document.querySelectorAll(".nav a");
  const currentpage = location.pathname.split("/").pop();

  navLinks.forEach(link => {
    if (link.getAttribute("href") === currentpage) {
      link.classList.add("active");
    }
  });

  menuBtn?.addEventListener("click", () => {
    sidebar.classList.toggle("collapsed");
  });

   // ===============================
  // Search Employee
  // ===============================

const employeeSearch = document.querySelector('.search input');

employeeSearch?.addEventListener('input', () => {
  const query = employeeSearch.value.toLowerCase();
  document.querySelectorAll('#cardz .cardz-item').forEach(card => {
    const name = card.querySelector('h2')?.textContent.toLowerCase() || "";

    if (name.includes(query)) {
      card.style.display = "flex"; 
    } else {
      card.style.display = "none";
    }
  });
});


  const addBtn = document.querySelector(".addemploye");
  const accform = document.querySelector(".modal");
  const cancelbtn = document.querySelector(".cancel-btn");
  const closeBtn = document.getElementById("closeModal");

  const profilepic = document.getElementById("profilePic");
  const preview = document.getElementById("preview");

  profilepic?.addEventListener("change", () => {
    const file = profilepic.files[0];
    if (!file) {
      preview.style.display = "none";
      preview.src = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      preview.src = e.target.result;
      preview.style.display = "block";
    };
    reader.readAsDataURL(file);
  });

  addBtn?.addEventListener("click", () => {
    accform.style.display = "flex";
  });

  cancelbtn?.addEventListener("click", () => {
    accform.style.display = "none";
  });

  closeBtn?.addEventListener("click", () => {
    accform.style.display = "none";
  });

  // ===============================
  // Form submit
  // ===============================
  accform?.addEventListener("submit", async e => {
    e.preventDefault();

    const fname = document.getElementById("fname").value.trim();
    const lname = document.getElementById("lname").value.trim();
    const contact = document.getElementById("contact").value.trim();
    const address = document.getElementById("address").value.trim();
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    document.getElementById("fulname").textContent = `${fname} ${lname}`;
    if (!fname || !lname || contact.length !== 11 || !/^\d+$/.test(contact) || !address) {
      showmess("All fields required and valid 11-digit contact number!", "error");
      return;
    }
    if (!username || !password) {
      showmess("Username and password required", "error");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("fname", fname);
      formData.append("lname", lname);
      formData.append("contact", contact);
      formData.append("address", address);
      formData.append("username", username);
      formData.append("password", password);

      if (profilepic.files[0]) {
        formData.append("profilePic", profilepic.files[0]); // ✅ matches multer
      }

      const res = await fetch("http://localhost:3000/employee", {
        method: "POST",
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        showmess(data.message || "Error adding staff", "error");
        return;
      }

      showmess("Staff successfully added", "successful");
      accform.reset();
      preview.style.display = "none";
      accform.style.display = "none";
      loadEmployees();
    } catch (err) {
      console.error(err);
      showmess("Server error saving staff", "error");
    }
  });

  // ===============================
  // Add employee card
  // ===============================
  function addEmployeeCard(emp = {}) {
    const cardContainer = document.getElementById("cardz");
    if (!cardContainer) return;

    const imgSrc = emp.profileImage
      ? `<img src="http://localhost:3000/${emp.profileImage}" alt="${emp.fname} ${emp.lname}" style="width:70px;height:70px;border-radius:50%" />`
      : `<img src="https://via.placeholder.com/70" alt="No Image" style="width:70px;height:70px;border-radius:50%" />`;

    const card = document.createElement("article");
    card.className = "cardz-item";
    card.dataset.id = emp.id;

    card.innerHTML = `
      <div class="profile">
        ${imgSrc}
        <h2>${emp.fname} ${emp.lname}</h2>
      </div>
      <div class="info" >
       <p><span class="label"><i class='bx bxs-phone'></i> Contact:</span> ${emp.contact}</p>
       <p><span class="label"><i class='bx bxs-map'></i> Address:</span> ${emp.address}</p>

      </div>
      <div class="buttons" >
        <button class="btn btn-change" type="button">Change Password</button>
        <button class="btn btn-delete" type="button">🗑 Delete</button>
      </div>
    `;

    // Delete
    card.querySelector(".btn-delete").addEventListener("click", async () => {
      if (!emp.id) return showmess("Cannot delete: missing id", "error");
      if (!confirm("Delete this employee?")) return;

      try {
        const res = await fetch(`http://localhost:3000/employee/${emp.id}`, { method: "DELETE" });
        if (res.ok) {
          card.remove();
          showmess("Employee deleted", "successful");
        } else {
          const err = await res.json().catch(() => ({}));
          showmess(err.message || "Failed to delete employee", "error");
        }
      } catch (err) {
        console.error(err);
        showmess("Server error deleting employee", "error");
      }
    });

    // Change password
    card.querySelector(".btn-change").addEventListener("click", async () => {
      if (!emp.id) return showmess("Cannot change password: missing id", "error");
      const newPass = prompt(`Enter new password for ${emp.fname} ${emp.lname}:`);
      if (!newPass) return;

      try {
        const res = await fetch(`http://localhost:3000/employee/${emp.id}/password`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: newPass })
        });

        if (res.ok) showmess("Password updated", "successful");
        else {
          const err = await res.json().catch(() => ({}));
          showmess(err.message || "Failed to update password", "error");
        }
      } catch (err) {
        console.error(err);
        showmess("Server error updating password", "error");
      }
    });

    cardContainer.appendChild(card);
  }

  // ===============================
  // Load employees
  // ===============================
  async function loadEmployees() {
    try {
      const res = await fetch("http://localhost:3000/employee");
      const employees = await res.json();
      const cardContainer = document.getElementById("cardz");
      cardContainer.innerHTML = "";
      employees.forEach(emp => addEmployeeCard(emp));
    } catch (err) {
      showmess("Error loading employees: " + err.message, "error");
    }
  }

  loadEmployees();

  // ===============================
  // Toast
  // ===============================
  function showmess(message, type = "info") {
    const toast = document.getElementById("toast");
    if (!toast) return;

    toast.textContent = message;
    toast.style.background =
      type === "successful" ? "#28a745" :
      type === "error" ? "#dc3545" :
      "#333";
    toast.className = "toast show";

    setTimeout(() => {
      toast.className = "toast";
    }, 3000);
  }
});
