const menuBtn = document.getElementById("menu-btn");
const sidebar = document.querySelector(".sidebar");


menuBtn.addEventListener("click", function() {
  sidebar.classList.toggle("collapsed");
});


    document.addEventListener('DOMContentLoaded', function () {
      const productsBtn = document.querySelector('.products-btn');
       const invbtn = document.querySelector('.inv-btn');
      const inventorySection = document.querySelector('#inventory')
      const productsSection = document.querySelector('#products');
      const navLinks = document.querySelectorAll(".nav a")
      const currentpage = location.pathname.split('/').pop();
      // add products
      const addBtn = document.querySelector('.add-BTN');
      const modal = document.querySelector('.side-Panel');
      const closeBtn = document.querySelector('.cls');
     //scanner
      const additem = document.querySelector('.additem')
      const Panel = document.querySelector('.panel')
      const cl = document.querySelector('.close')

      if (productsBtn && inventorySection && productsSection) {
        productsBtn.addEventListener('click', function () {
          productsSection.style.display = "block";
          inventorySection.style.display = "none"; 
        });
          productsSection.style.display = 'none';
      }
       if (invbtn && inventorySection && productsSection) {
          invbtn.addEventListener('click', function () {
          inventorySection.style.display = "block";
          productsSection.style.display = "none";
        });
      }
      navLinks.forEach(link =>{
        if(link.getAttribute('href') === currentpage){
          link.classList.add('active')
        }
      })

    addBtn.addEventListener('click', function() {
     modal.classList.add('active');
     console.log('cick')
  });

  closeBtn.addEventListener('click', function(){
    modal.classList.remove('active')
  })
  additem.addEventListener('click', function(){
    Panel.classList.add('active');
     
  })
   cl.addEventListener('click', function() {
    Panel.classList.remove('active');
   
    
    
    });
 });  
  

