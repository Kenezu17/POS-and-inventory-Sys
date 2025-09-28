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
  const yearsec = document.querySelector('.yearly');
  const yearbtn = document.querySelector('.btn-year')
  const monthsec = document.querySelector('.monthly');
  const monthbtn = document.querySelector('.btn-month')

  yearbtn.addEventListener('click',()=>{
    yearsec.style.display = 'block';
    monthsec.style.display = 'none';
  })

  monthbtn.addEventListener('click',()=>{
    monthsec.style.display = 'block';
    yearsec.style.display = 'none';
  })

//========================
// Reports Monthly
//========================
fetch('http://localhost:3000/reports')
  .then(res => res.json())
  .then(data => {
    document.getElementById('totalRevenueMonth').textContent = 
      `₱${parseFloat(data.totalRevenue || 0).toLocaleString()}`;
    document.getElementById('totalProfitMonth').textContent = 
      `₱${parseFloat(data.totalProfit || 0).toLocaleString()}`;
    document.getElementById('avgGrowthMonth').textContent = 
      `${data.avgGrowth || 0}%`;

    return fetch('http://localhost:3000/reports/monthly');
  })
  .then(res => res.json())
  .then(rows => {
    const tbody = document.querySelector('#monthlyTable tbody');
    tbody.innerHTML = "";

    rows.forEach(r => {
      const revenue = parseFloat(r.revenue || 0);
      const profit = parseFloat(r.profit || 0);
      const expenses = parseFloat(r.expenses || 0);
      const margin = r.margin !== null ? `${r.margin}%` : "—";
      const growth = r.growth !== null && r.growth !== "—" ? `${r.growth}%` : "—";

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${r.month}</td>
        <td style="color:black;">₱${revenue.toLocaleString()}</td>
        <td style="color:green;">₱${profit.toLocaleString()}</td>
        <td style="color:red;">₱${expenses.toLocaleString()}</td>
        <td>${growth}</td>
        <td style="color:blue;">${margin}</td>
      `;
      tbody.appendChild(tr);
    });
  })
  .catch(err => console.error("Fetch error:", err));


//========================
// Reports Yearly
//========================
fetch('http://localhost:3000/report/yearly')
  .then(res => res.json())
  .then(data => {
    document.getElementById('totalRevenueYear').textContent =
      `₱${parseFloat(data.totalRevenue || 0).toLocaleString()}`;
    document.getElementById('totalProfitYear').textContent =
      `₱${parseFloat(data.totalProfit || 0).toLocaleString()}`;
    document.getElementById('avgGrowthYear').textContent =
      `${data.avgGrowth || 0}%`;

    return fetch('http://localhost:3000/yearly');
  })
  .then(res => res.json())
  .then(rows => {
    const tbody = document.querySelector('#yearly-table tbody');
    tbody.innerHTML = "";

    rows.forEach(r => {
      const revenue = parseFloat(r.revenue || 0);
      const profit = parseFloat(r.profit || 0);
      const expenses = parseFloat(r.expenses || 0);
      const margin = r.margin !== null ? `${r.margin}%` : "—";
      const growth = r.growth !== null && r.growth !== "—" ? `${r.growth}%` : "—";

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${r.year}</td>
        <td style="color:black;">₱${revenue.toLocaleString()}</td>
        <td style="color:green;">₱${profit.toLocaleString()}</td>
        <td style="color:red;">₱${expenses.toLocaleString()}</td>
        <td>${growth}</td>
        <td style="color:blue;">${margin}</td>
      `;
      tbody.appendChild(tr);
    });
  })
  .catch(err => console.error("Fetch error:", err));
})