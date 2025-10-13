document.addEventListener("DOMContentLoaded", function () {
  const socket = io("http://localhost:3000"); 
  const productsGrid = document.querySelector(".products-grid");
  const subtotalDisplay = document.querySelector(".totals p:first-child");
  const totalDisplay = document.querySelector(".totals p:last-child");

  const modalOverlay = document.getElementById('modalOverlay');
  const doneBtn = document.getElementById('doneBtn');
  const loadingOverlay = document.getElementById("loadingOverlay");

 
  const clearBtn = document.querySelector(".clear-btn");
  const cashBtn = document.querySelector(".cash-btn");
  const gcashBtn = document.querySelector(".gcash-btn");
  const printBtn = document.querySelector(".print-btn");
  const filterButtons = document.querySelectorAll(".filters button");


  const voice = document.querySelector('.voice');
  const logout = document.querySelector('.Logout');

  function showConfirm(message, callback) {
  const modal = document.getElementById("confirmModal");
  const msg = document.getElementById("confirmMessage");
  const yesBtn = document.getElementById("confirmYes");
  const noBtn = document.getElementById("confirmNo");

  msg.textContent = message;
  modal.style.display = "flex";

 
  yesBtn.onclick = () => {
    modal.style.display = "none";
    callback(true);
  };

  noBtn.onclick = () => {
    modal.style.display = "none";
    callback(false);
  };
}

voice.addEventListener("click", ()=>{
    showmess("Voice command feature not available", "successful")
})

logout.addEventListener('click', (e) => {
  e.preventDefault();
  localStorage.clear();
  sessionStorage.clear();
  window.location.href = "login.html";
});

const username = localStorage.getItem("userUsername");       
console.log("Logged in username:", username);
  if (!username) return; 

  fetch("/employee") 
    .then(res => res.json())
    .then(employees => {
      console.log(employees)
      const staff = employees.find(e => e.username === username);
      if (staff) {
        console.log(staff)
        console.log("Staff found:", staff);

        document.querySelector(".profilepic").src = staff.profileImage || "/uploads/default.png";
        document.getElementById("name").textContent = `${staff.fname} ${staff.lname}`;
      } else {
        console.warn("Staff not found!");
      }
    })
    .catch(err => console.error("Error fetching staff data:", err));



  let currentOrder = [];
  let allProducts = [];

  //=========================
  // Load products from server
  //=========================
  async function loadProducts() {
    try {
      const response = await fetch("http://localhost:3000/products");
      const products = await response.json();
      allProducts = products;
      renderProducts(products);
    } catch (err) {
      console.error(" Failed to load products:", err);
    }
  }

  //=========================
  // Render products
  //=========================
 function renderProducts(products) {
  productsGrid.innerHTML = "";

  products.forEach((product) => {
    const priceL = parseFloat(product.price);
    const priceM = product.category.toLowerCase() === "milktea" ? priceL * 0.8 : priceL;
    const priceS = product.category.toLowerCase() === "milktea" ? priceL * 0.6 : priceL;

    const card = document.createElement("div");
    card.classList.add("product-card");
    card.dataset.category = product.category.toLowerCase().replace(/\s+/g, "");

    if (product.category.toLowerCase() === "milktea") {
      card.innerHTML = `
        <img src="http://localhost:3000/uploads/${product.image}" 
             alt="${product.product_name}" 
             style="width:150px; height:120px; border:0.5px solid black;">
        <h4>${product.product_name}</h4>
        <div class="sizes">
          <button class="size-btn" data-name="${product.product_name}" data-size="L" data-price="${priceL}">L</button>
          <button class="size-btn" data-name="${product.product_name}" data-size="M" data-price="${priceM}">M</button>
          <button class="size-btn" data-name="${product.product_name}" data-size="S" data-price="${priceS}">S</button>
        </div>
      `;
    } else {
      card.innerHTML = `
        <img src="http://localhost:3000/uploads/${product.image}" 
             alt="${product.product_name}" 
             style="width:150px; height:120px; border:0.5px solid black;">
        <h4>${product.product_name}</h4>
        <p style ="  font-weight: bold;">₱${product.price}</p>
      `;
    }

    productsGrid.appendChild(card);
  });


    // Milk Tea 
    document.querySelectorAll(".size-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const name = btn.dataset.name;
        const size = btn.dataset.size;
        const price = parseFloat(btn.dataset.price);
        addToOrder(name, size, price);
      });
    });

    // Normal product 
    document.querySelectorAll(".product-card p").forEach((p) => {
      p.parentElement.addEventListener("click", () => {
        const name = p.previousElementSibling.textContent;
        const price = parseFloat(p.textContent.replace("₱", ""));
        addToOrder(name, "", price);
      });
    });
  }

  //=========================
  // Add to order
  //=========================
  function addToOrder(name, size, price) {
  currentOrder.push({ name, size, price });
  renderOrder();
}


  //=========================
  // Render order sidebar
  //=========================
  function renderOrder() {
    const orderSidebar = document.querySelector(".order-sidebar");
    const existingItems = orderSidebar.querySelectorAll(".order-item");
    existingItems.forEach((i) => i.remove());

    let subtotal = 0;
    currentOrder.forEach((item) => {
      subtotal += item.price;
      const div = document.createElement("div");
      div.classList.add("order-item");
      div.innerHTML = `
        <span>${item.name} ${item.size ? "(" + item.size + ")" : ""}</span>
        <span>₱${item.price.toFixed(2)}</span>
      `;
      orderSidebar.insertBefore(div, orderSidebar.querySelector(".totals"));
    });

    subtotalDisplay.textContent = `Subtotal: ₱${subtotal.toFixed(2)}`;
    totalDisplay.textContent = `Total: ₱${subtotal.toFixed(2)}`;
  }

  //=========================
  // Clear Order
  //=========================
  function clearOrder() {
    currentOrder = [];
    renderOrder();
  }

  clearBtn?.addEventListener("click", () => {
    if (currentOrder.length === 0) {
      showmess("🧾 No items to clear.", "error");
      return;
    }
   showConfirm("Are you sure you want to clear the current order?", (confirmed) => {
    if (confirmed) {
     clearOrder();
  }
});
  });


// =============================
// Helper Function to Save Sale
// =============================
async function saveTransaction(paymentType, total) {
  if (!currentOrder || currentOrder.length === 0) {
    console.warn("No items to save.");
    return;
  }

 
  const items = currentOrder.map(item => ({
    product_name: item.product_name || item.name || "Unknown",
    quantity: parseInt(item.quantity) || 1,
    price: parseFloat(item.price) || 0
  }));

  try {
    const res = await fetch("http://localhost:3000/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        payment_type: paymentType,
        items: items,
        total: parseFloat(total) || 0
      })
    });

    const data = await res.json();
    console.log("Transaction saved:", data);


  } catch (err) {
    console.error("Error saving sale:", err);
  }
}

  //=========================
  // Payment Options
  //=========================
 
// CASH
cashBtn.addEventListener("click", () => {
  if (currentOrder.length === 0) {
   showmess(" No items in the order to process.", "error");
    return;
  }

  modalOverlay.style.display = "none";
  loadingOverlay.style.display = "flex";

  const total = currentOrder.reduce((sum, i) => sum + i.price, 0);
  const spinner = document.getElementById("spinner");
  const checkmark = document.getElementById("checkmark");
  const loadingText = document.getElementById("loadingText");

  spinner.style.display = "block";
  checkmark.style.display = "none";
  loadingText.textContent = "Processing payment...";

  setTimeout(async() => {
    spinner.style.display = "none";
    checkmark.style.display = "block";
    loadingText.innerHTML = `Payment Complete!<br>Total: ₱${total.toFixed(2)}`;

   await saveTransaction("cash", total);
  

  setTimeout(async() => {
    loadingOverlay.style.display = "none";
    await printReceiptWithOwner(currentOrder, total, 1 )
    clearOrder();
    }, 2000)
  }, 2000);
});

// GCASH
gcashBtn.addEventListener("click", () => {
  if (currentOrder.length === 0) {
    showmess(" No items in the order to process.", "error");
    return;
  }
   modalOverlay.style.display = "flex";

});

doneBtn.addEventListener("click", () => {
  showConfirm("Has the GCash payment been received?", async (confirmed) => {
    if (!confirmed) {
      modalOverlay.style.display = "none";
      return;
    }

    modalOverlay.style.display = "none";
    loadingOverlay.style.display = "flex";

    const total = currentOrder.reduce((sum, i) => sum + i.price, 0);
    const spinner = document.getElementById("spinner");
    const checkmark = document.getElementById("checkmark");
    const loadingText = document.getElementById("loadingText");

    spinner.style.display = "block";
    checkmark.style.display = "none";
    loadingText.textContent = "Processing payment...";


    setTimeout(async () => {
      spinner.style.display = "none";
      checkmark.style.display = "block";
      loadingText.innerHTML = `Payment Complete!<br>Total: ₱${total.toFixed(2)}`;

      await saveTransaction("Gcash", total);


      setTimeout(async () => {
        loadingOverlay.style.display = "none";
        await printReceiptWithOwner(currentOrder, total, 1);
        clearOrder();
      }, 2000); 
    }, 3000);
  });
});


//===========
// Print
//===========
document.querySelector(".print-btn").addEventListener("click", async () => {
  if (!currentOrder || currentOrder.length === 0) {
    showmess("No items to print.", "error");
    return;
  }

  const total = currentOrder.reduce((sum, i) => sum + (i.price * i.quantity), 0);
  await printReceiptWithOwner(currentOrder, total, 1); 
});

 async function getOwnerInfo(ownerId) {
  const res = await fetch(`http://localhost:3000/owner/${ownerId}`);
  if (!res.ok) throw new Error("Failed to load store info");
  return await res.json();
}


async function printReceiptWithOwner(orderItems, total, ownerId) {
  try {
    const owner = await getOwnerInfo(ownerId);

    let receiptContainer = document.getElementById("receipt");
    if (!receiptContainer) {
      receiptContainer = document.createElement("div");
      receiptContainer.id = "receipt";
      receiptContainer.className = "receipt";
      receiptContainer.style.display = "none"; 
      document.body.appendChild(receiptContainer);
    }

    let grandTotal = 0;
    let receiptHTML = `
      <div class="receipt-content">
        <h2 style="text-align:center;">${owner.store || "BrewPos"}</h2>
        <p style="text-align:center;">${owner.receipt_f || "Thank you for visiting"}</p>
        <p style="text-align:center;">${owner.address || "cabcuo, Trece Martires City, Cavite"}</p>
        <p style="text-align:center;">${owner.contact || "09123456789"}</p>
        <p>Date: ${new Date().toLocaleString()}</p>
        <hr>
        <table style="width:100%; font-family:monospace; font-size:14px;">
          <thead>
            <tr><th align="left">Item</th><th>Qty</th><th>Price</th><th>Total</th></tr>
          </thead>
          <tbody>
    `;

    orderItems.forEach(item => {
      const qty = parseInt(item.quantity) || 1;
      const price = parseFloat(item.price) || 0;
      const totalItem = qty * price;
      grandTotal += totalItem;
      const sizeLabel = item.size ? ` (${item.size})` : " (R)";
      receiptHTML += `
        <tr>
          <td>${item.product_name || item.name}${sizeLabel}</td>
          <td align="center">${qty}</td>
          <td align="right">₱${price.toFixed(2)}</td>
          <td align="right">₱${totalItem.toFixed(2)}</td>
        </tr>
      `;
    });

    receiptHTML += `
          </tbody>
        </table>
        <hr>
        <p style="font-weight:bold;">Grand Total: ₱${grandTotal.toFixed(2)}</p>
        <p style="text-align:center;">${owner.receipt_h || "Come again soon!"}</p>
      </div>
    `;


    receiptContainer.innerHTML = receiptHTML;

    
    const printStyle = document.createElement("style");
    printStyle.textContent = `
      @media print {
        body * { visibility: hidden !important; }
        #receipt, #receipt * { visibility: visible !important; }
        #receipt {
          display: block !important;
          position: absolute;
          left: 0;
          top: 0;
          width: 80mm;
          padding: 10px;
          font-family: 'Courier New', monospace;
        }
      }
    `;
    document.head.appendChild(printStyle);

    
    await new Promise(resolve => setTimeout(resolve, 300));

 
    window.print();

    receiptContainer.style.display = "none";

  } catch (error) {
    console.error("Error printing receipt:", error);
  }
}



 filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelector(".filters .active")?.classList.remove("active");
    btn.classList.add("active");

    const filterValue = btn.dataset.filter.toLowerCase();

    if (filterValue === "all") {
      renderProducts(allProducts);
    } else {
      const filtered = allProducts.filter(
        (p) => p.category.toLowerCase().replace(/\s+/g, "") === filterValue
      );
      renderProducts(filtered);
    }
  });
});


  //=========================
  // Socket.IO Live Updates
  //=========================
  socket.on("new_product", (product) => {
    allProducts.push(product);
    renderProducts(allProducts);
  });

  socket.on("update_product", (updatedProduct) => {
    const index = allProducts.findIndex((p) => p.id === updatedProduct.id);
    if (index !== -1) allProducts[index] = updatedProduct;
    renderProducts(allProducts);
  });

  socket.on("delete_product", ({ id }) => {
    allProducts = allProducts.filter((p) => p.id !== id);
    renderProducts(allProducts);
  });

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

  //=========================
  // Initialize
  //=========================
  loadProducts();
});
