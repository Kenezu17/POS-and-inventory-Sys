function sendToServer(barcodeValue, imageData) {
  fetch("/scanner", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ barcode: barcodeValue, image: imageData })
  })
  .then(async res => {
    if (!res.ok) {
      
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || "Barcode not found");
    }
    return res.json(); 
  })
  .then(data => {
    console.log(" Sent to server:", data);
    showScanResult(true, barcodeValue);  
  })
  .catch(err => {
    console.error(" Send error:", err);
    showScanResult(false, barcodeValue); 
  });
}

function showScanResult(success, barcode, name = "") {
  const status = document.getElementById("cameraStatus");
  const successSound = document.getElementById("successSound");
  const errorSound = document.getElementById("errorSound");

  if (success) {
    status.textContent = `✔️ Scanned: ${barcode} (${name})`;
    status.style.color = "green";
    successSound.currentTime = 0;
    successSound.play();
  } else {
    status.textContent = `❌ Barcode not found: ${barcode}`;
    status.style.color = "red";
    errorSound.currentTime = 0;
    
  }
}


window.addEventListener("load", () => {
  const status = document.getElementById("cameraStatus");
  const html5QrCode = new Html5Qrcode("reader");
  let lastscan = 0;
  const cooldown = 5000;

  function onScanSuccess(decodedText) {
    const now = Date.now();
    if(now - lastscan < cooldown) return;
    lastscan = now;

    console.log("Decoded:", decodedText);
    status.textContent = `Scanned: ${decodedText}`;

    
    const videoElement = document.querySelector("#reader video");
    if (!videoElement) return;

    const canvas = document.createElement("canvas");
    canvas.width = 250;
    canvas.height = 100;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoElement, 0, 0, 250, 100);
    const imageData = canvas.toDataURL("image/png");

    sendToServer(decodedText, imageData);
  }

  function onScanError(err) {
    console.log("Scan error:", err);
  }

  Html5Qrcode.getCameras().then(cameras => {
    if(cameras && cameras.length){
      html5QrCode.start(
         { facingMode: "environment" },
        { fps: 20, qrbox: 450 },
        onScanSuccess,
        onScanError
      ).then(() => {
        status.textContent = "Camera is Open";
        status.style.color = 'green';
      }).catch(err => {
        status.textContent = "Camera error: " + err;
        status.style.color = 'red';
      });
    } else {
      status.textContent = "No cameras found";
      status.style.color = 'red';
    }
  }).catch(err => {
    status.textContent = "Camera error: " + err;
    status.style.color = 'red';
  });
});
