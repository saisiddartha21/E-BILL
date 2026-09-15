const http = require('http');

http.get('http://localhost:3000/api/invoices', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log("Invoices count:", Array.isArray(json) ? json.length : json);
      if (Array.isArray(json) && json.length > 0) {
        console.log("Latest Invoice:", json[0].invoiceNumber, "GrandTotal:", json[0].grandTotal);
      }
    } catch(e) {
      console.log("Response:", data.substring(0, 200));
    }
  });
}).on('error', err => {
  console.error("Error connecting to server:", err.message);
});
