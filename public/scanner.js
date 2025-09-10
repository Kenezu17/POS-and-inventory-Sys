function sendToServer(barcodeValue, imageData) {
  fetch("/scanner", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ barcode: barcodeValue, image: imageData })
  })
  .then(res => res.json())
  .then(data => console.log("Sent to server:", data))
  .catch(err => console.error("Send error:", err));
}

window.addEventListener("load", () => {
  const status = document.getElementById("cameraStatus");
  const html5QrCode = new Html5Qrcode("reader");

  html5QrCode.start(
    { facingMode: "environment" },  
    { fps: 60, qrbox: 400 },
    (decodedText) => {
      console.log("Decoded:", decodedText);

     
const videoElement = document.querySelector("#reader video");
if (!videoElement) 
  return;
const width = 250;   
const height = 100;  

const canvas = document.createElement("canvas");
canvas.width = width;
canvas.height = height;

const ctx = canvas.getContext("2d");
ctx.drawImage(videoElement, 0, 0, width, height);

const imageData = canvas.toDataURL("image/png");

      sendToServer(decodedText, imageData);

      status.textContent = "Scanned: " + decodedText;
      status.style.color = "green";
    },
    (err) => {
      console.log("Scan error:", err);
    }
  ).then(() => {
    status.textContent = "Camera is Open";
    status.style.color = 'green'
    
  }).catch(err => {
    status.textContent = "Camera error: " + err;
    status.style.color ='red'
  });
});
