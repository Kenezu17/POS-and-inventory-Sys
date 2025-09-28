document.addEventListener('DOMContentLoaded', function () {
  const menuBtn = document.getElementById('menu-btn');
  const sidebar = document.querySelector('.sidebar');
  const navLinks = document.querySelectorAll(".nav a");
  const currentpage = location.pathname.split('/').pop();

  //========================
  // Active Nav
  //========================
  navLinks.forEach(link => {
    if (link.getAttribute('href') === currentpage) {
      link.classList.add('active');
    }
  });

  //========================
  // Sidebar toggle
  //========================
  if (menuBtn) {
    menuBtn.addEventListener('click', function () {
      sidebar.classList.toggle('collapsed');
    });
  }

  //========================
  // Save to DB
  //========================
window.saveToDB = function () {
  const name = document.getElementById("productName").value.trim();
  const code = document.getElementById("barcodeInput").value.trim();

  if (name === "" || code.length !== 13 ) {
    showmess("Enter a product name and valid 13-digit barcode!","error");
    return;
  }
  

  const box = document.createElement("div");
  box.classList.add("barcode-box");


  const nameP = document.createElement("p");
  nameP.innerText = name;
  box.appendChild(nameP);

  
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  JsBarcode(svg, code, { format: "EAN13", displayValue: true }); 
  box.appendChild(svg);

  document.getElementById("barcodeGrid").appendChild(box);

  // Save to DB
  fetch("http://localhost:3000/save-barcode", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ item_name: name, barcode: code })
  })
    .then(res => res.json())
    .then(data => showmess(data = 'Added','successful'))
    .catch(err =>{
      showmess.console.error(err, 'error');   
    })
};


  //========================
  // Clear All Barcodes
  //========================
 window.clearBarcodes = function () {
  const grid = document.getElementById("barcodeGrid");
  grid.innerHTML = ""; 
}
  //========================
  // Print Barcodes
  //========================
  window.printBarcodes = function () {
    window.print();
  };

   // ==============================
  // Toast Message
  // ==============================
  function showmess(message, type = "info"){
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.style.background =
      type === 'successful' ? "#28a745":
      type === 'error'? "#dc3545" :
      "#333";
    toast.className = "show";

    setTimeout(() => {
      toast.className = toast.className.replace("show", "");
    }, 3000);
  }
});

