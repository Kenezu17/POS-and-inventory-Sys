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



});
