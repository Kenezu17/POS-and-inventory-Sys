window.addEventListener('load', () => {
  const barcodeTextEl = document.getElementById('barcode');
  const barcodeImgEl = document.getElementById('barimg');
   const placeholder = document.getElementById('placeholder');

  const eventsource = new EventSource("http://localhost:3000/events");

  eventsource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log("Update from Server", data);

    if (data.barcode) {
      barcodeTextEl.textContent = data.barcode;   
     barcodeTextEl.value = data.barcode;

    }
    if (data.image) {
      barcodeImgEl.src = data.image;   
      barcodeImgEl.style.display ='block'
     placeholder.style.display ='none'
    }
  };
});