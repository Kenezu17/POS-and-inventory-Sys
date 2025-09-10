document.addEventListener('DOMContentLoaded', function(){
    const menuBtn = document.getElementById('menu-btn')
    const sidebar = document.querySelector('.sidebar')

     const navLinks = document.querySelectorAll(".nav a");
    const currentpage = location.pathname.split('/').pop();

    
  // ==============================
  // Highlight Active Nav Link
  // ==============================
   
  navLinks.forEach(link => {
    if (link.getAttribute('href') === currentpage) {
      link.classList.add('active');
    }
  });
   
  // ==============================
  // Side Tggle
  // ==============================
     if(menuBtn){
        menuBtn.addEventListener('click', function() {
        sidebar.classList.toggle('collapsed') 
         })
    }
     // ==============================
  // Sales chart
  // ==============================

  const sales = document.getElementById('sales')
  const chart = document.getElementById('chart').getContext('2d')

  const monthlysales = document.getElementById("rev-total");
  

  
})