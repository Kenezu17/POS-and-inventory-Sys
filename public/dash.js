document.addEventListener('DOMContentLoaded', function () {
  const menuBtn = document.getElementById('menu-btn');
  const sidebar = document.querySelector('.sidebar');
  const navLinks = document.querySelectorAll(".nav a");
  const currentpage = location.pathname.split('/').pop();
  
//========================
// Active Nabv
//========================
  navLinks.forEach(link => {
    if (link.getAttribute('href') === currentpage) {
      link.classList.add('active');
    }
  });
  
//========================
// Side toggle
//========================
  if (menuBtn) {
    menuBtn.addEventListener('click', function () {
      sidebar.classList.toggle('collapsed');
    });
  }
 
  



//========================
// sales chart
//========================
  let chartInstance;
  let salesData = [];

  async function loadSalesData() {
    try {
      const res = await fetch("http://localhost:3000/sales");
      salesData = await res.json();

      setupButtons();
      const currentYear = new Date().getFullYear();
      renderMonthChart(currentYear);
    } catch (err) {
      console.error("Error loading sales data:", err);
    }
  }

  function setupButtons() {
    const monthBtn = document.getElementById("monthBtn");
    const yearBtn = document.getElementById("yearBtn");

    monthBtn.addEventListener("click", () => {
      setActive(monthBtn);
      const currentYear = new Date().getFullYear();
      renderMonthChart(currentYear);
    });

    yearBtn.addEventListener("click", () => {
      setActive(yearBtn);
      renderYearChart();
    });
  }

  function setActive(activeBtn) {
    document.querySelectorAll(".analytics-header button")
      .forEach(btn => btn.classList.remove("active"));
    activeBtn.classList.add("active");
  }


  function renderMonthChart(year) {
    const ctx = document.getElementById("salesChart").getContext("2d");

    const months = [
      "January","February","March","April","May","June",
      "July","August","September","October","November","December"
    ];

    const revenues = new Array(12).fill(0);

    salesData.forEach(item => {
      if (item.year === year) {
        revenues[item.month - 1] = parseFloat(item.revenue);
      }
    });

    if (chartInstance) chartInstance.destroy();

    chartInstance = new Chart(ctx, {
      type: "bar",
      data: {
        labels: months,
        datasets: [{
          label: `Revenue for ${year} (₱)`,
          data: revenues,
          backgroundColor: "rgba(75, 192, 192, 0.6)",
          borderColor: "rgba(75, 192, 192, 1)",
          borderWidth: 1
        }]
      },
      options: { responsive: true }
    });
  }

  function renderYearChart() {
    const ctx = document.getElementById("salesChart").getContext("2d");

    const years = [...new Set(salesData.map(item => item.year))].sort();
    const revenues = years.map(year => {
      return salesData
        .filter(item => item.year === year)
        .reduce((sum, item) => sum + parseFloat(item.revenue), 0);
    });

    if (chartInstance) chartInstance.destroy();

    chartInstance = new Chart(ctx, {
      type: "line",
      data: {
        labels: years,
        datasets: [{
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          label: "Revenue by Year (₱)",
          data: revenues,
          borderColor: "rgba(54, 162, 235, 1)",
          fill: true,
          tension: 0.4
        }]
      },
      options: { responsive: true }
    });
  }

  loadSalesData();

//========================
// Revenue and daily orders
//========================

fetch('http://localhost:3000/reports')
.then(res => res.json())
.then(data =>{
  document.getElementById('rev-total').textContent  = 
      `₱${parseFloat(data.totalRevenue || 0).toLocaleString()}`
})
fetch('http://localhost:3000/records')
.then( res => res.json())
.then(data =>{
  document.getElementById('todaysales').textContent  = 
   `${parseFloat(data.total_sales || 0).toLocaleString()}`
  document.getElementById('todayorders').textContent  = 
   `${parseFloat(data.total_quantity || 0).toLocaleString()}`
})


//========================
// Logout Session
//========================
const profileToggle = document.getElementById('profile-toggle');
const profileDropdown = document.getElementById('profile-dropdown');
const logoutBtn = document.getElementById('logout-btn');

profileToggle.addEventListener('click', () => {
  profileDropdown.classList.toggle('show');
});

document.addEventListener('click', (e) => {
  if (!profileToggle.contains(e.target) && !profileDropdown.contains(e.target)) {
    profileDropdown.classList.remove('show');
  }
});

logoutBtn.addEventListener('click', (e) => {
  e.preventDefault();
  localStorage.clear();
  sessionStorage.clear();
  window.location.href = "login.html";
});


const socket = io();


function timeAgo(date) {
  const now = new Date();
  const diff = Math.floor((now - new Date(date)) / 60000);
  if (diff < 1) return "just now";
  if (diff === 1) return "1 min ago";
  if (diff < 60) return diff + " mins ago";
  const hrs = Math.floor(diff / 60);
  if (hrs < 24) return hrs + " hrs ago";
  return new Date(date).toLocaleString();
}

function getTypeClass(activity) {
  const msg = (activity.message || "").toLowerCase();
  const type = (activity.type || "").toLowerCase();

  if (type === "lowstock" || msg.includes("low stock")) return "lowStock";
  if (type === "productupdated" || msg.includes("product updated")) return "Updated";
  if (type === "productadded" || msg.includes("added")) return "added";
  if (type === "productdeleted" || msg.includes("deleted")) return "deleted";
  if (type === "productrestocked" || msg.includes("restocked")) return "restocked";

  if (type === "itemupdated" || msg.includes("item updated")) return "Updated";
  if (type === "itemadded" || msg.includes("added")) return "added";
  if (type === "itemdeleted" || msg.includes("deleted")) return "deleted";
  if (type === "itemrestocked" || msg.includes("restocked")) return "restocked";

  return "default";
}


function renderActivity(a) {
  const li = document.createElement("li");
  li.innerHTML = `
    <span class="activity-icon ${getTypeClass(a)}"></span>
    <span class="message">${a.message}</span>
    <span class="time">${timeAgo(a.time)}</span>
  `;
  return li;
}

function shouldShowActivity(activity) {
  const settings = JSON.parse(localStorage.getItem("notificationSettings") || "{}");
  const msg = (activity.message || "").toLowerCase();
  const type = (activity.type || "").toLowerCase();

  if (!settings.lowStock && (msg.includes("low stock") || type === "lowstock")) return false;
  if (!settings.productUpdated && (msg.includes("product updated") || type === "productupdated")) return false;
  if (!settings.productUpdated && (msg.includes("deleted") || type === "productupdated")) return false;
  if (!settings.productUpdated && (msg.includes("added") || type === "productupdated")) return false;

  if (!settings.itemUpdated && (msg.includes("deleted") || type === "itemupdated")) return false;
  if (!settings.itemUpdated && (msg.includes("restocked") || type === "itemupdated")) return false;
  if (!settings.itemUpdated && (msg.includes("added") || type === "itemupdated")) return false;

  return true;
}

async function loadActivities() {
  try {
    const res = await fetch("http://localhost:3000/activities");
    const activities = await res.json();
    const list = document.getElementById("activityList");
    list.innerHTML = "";

    const now = new Date();
    const daysLimit = 1; 

    activities.forEach(a => {
      const activityDate = new Date(a.time);
      const diffDays = (now - activityDate) / (1000 * 60 * 60 * 24);

    
      if (diffDays > daysLimit) return;

      if (shouldShowActivity(a)) {
        list.appendChild(renderActivity(a));
      }
    });
  } catch (err) {
    console.error("Error loading activities:", err);
  }
}


socket.on("new-activity", (activity) => {
  if (!shouldShowActivity(activity)) return;
  const list = document.getElementById("activityList");
  list.prepend(renderActivity(activity));
});


loadActivities();
});