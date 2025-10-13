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
  // Save & Generate Barcode
  //========================
  window.saveToDB = function () {
    const name = document.getElementById("productName").value.trim();
    let code = document.getElementById("barcodeInput").value.trim();

    
    if (name === "") {
      showmess("Enter a product name!", "error");
      return;
    }


    if (/^\d{12}$/.test(code)) {
      code = code + getEAN13Checksum(code);
      document.getElementById("barcodeInput").value = code;
    }

    if (!/^\d{13}$/.test(code)) {
      showmess("Barcode must be 13 digits only!", "error");
      return;
    }

  
    const box = document.createElement("div");
    box.classList.add("barcode-box");

    const nameP = document.createElement("p");
    nameP.innerText = name;
    box.appendChild(nameP);

    
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    try {
      JsBarcode(svg, code, {
        format: "EAN13",
        lineColor: "#000",
        width: 2,
        height: 80,
        displayValue: true
      });
    } catch (err) {
      console.error("Barcode generation failed:", err);
      showmess("Invalid EAN-13 code!", "error");
      return;
    }

    box.appendChild(svg);
    document.getElementById("barcodeGrid").appendChild(box);

    // Save to Database (backend endpoint)
    fetch("http://localhost:3000/save-barcode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item_name: name, barcode: code })
    })
      .then(res => res.json())
      .then(() => showmess("Added successfully!", "successful"))
      .catch(err => {
        console.error("Error saving barcode:", err);
        showmess("Error saving to database!", "error");
      });
  };

  //========================
  // Clear All Barcodes
  //========================
  window.clearBarcodes = function () {
    document.getElementById("barcodeGrid").innerHTML = "";
    showmess("Cleared all barcodes!", "info");
  };

  //========================
  // Print Barcodes
  //========================
  window.printBarcodes = function () {
    window.print();
  };

  //========================
  // Toast Message
  //========================
  function showmess(message, type = "info") {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.style.background =
      type === 'successful' ? "#28a745" :
      type === 'error' ? "#dc3545" :
      "#333";
    toast.className = "show";
    setTimeout(() => {
      toast.className = toast.className.replace("show", "");
    }, 3000);
  }

  //========================
  // EAN-13 Checksum Generator
  //========================
  function getEAN13Checksum(code12) {
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(code12[i]);
      sum += (i % 2 === 0) ? digit : digit * 3;
    }
    const checksum = (10 - (sum % 10)) % 10;
    return checksum.toString();
  }
});
