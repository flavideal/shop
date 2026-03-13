// 1. I-paste ang Web App URL mula sa Google Apps Script deployment mo
const webAppUrl = "https://script.google.com/macros/s/AKfycbwOAaFDHHvMAurq6wc5N8kN6fXmm1a2DyGP3rsLETh9nDt1PnXIyEKZPn1rV_DZWAEY/exec"; 

// 2. Ito ang loader na kukuha ng live data
async function fetchProducts() {
    const container = document.getElementById('product-list');
    
    // Ipakita ang loading state
    container.innerHTML = `
        <div class="loader-container">
            <div class="spinner"></div>
            <p style="color: gray; font-size: 14px;">Loading products...</p>
        </div>
    `;

    try {
        const response = await fetch(webAppUrl + "?action=getProducts"); 
        const products = await response.json();
        displayProducts(products);
    } catch (error) {
        console.error("Error fetching products:", error);
        container.innerHTML = `
            <div class="loader-container">
                <p style="color: red;">Failed to load products. Please refresh the page.</p>
            </div>
        `;
    }
}

// 3. I-update ang display function para tumanggap ng data
function displayProducts(products) {
    const container = document.getElementById('product-list');
    container.innerHTML = ""; 
    
    window.currentProducts = products;

    products.forEach((p, index) => {
        // 1. Kuhanin ang pinakaunang price kung sakaling marami ang nakalagay (split by comma)
        const getFirstPrice = (val) => {
            if (!val) return 0;
            const prices = val.toString().split(',');
            return parseFloat(prices[0].trim()) || 0;
        };

        const regPrice = getFirstPrice(p.Regular_Price);
        const cashPrice = getFirstPrice(p.Cash_Price);
        const instPrice = getFirstPrice(p.Installment_Price);
        
        const months = Number(p.Plan) || 12; 
        const interestRate = parseFloat(p.Interest_Rate) || 0;

        // 2. COMPUTATION: (First Installment Price / Plan) + (First Installment Price * Interest Rate)
        const monthlyPayment = (instPrice / months) + (instPrice * interestRate);

        const isOutOfStock = p.Stock_Count <= 0;
        const stockStatus = isOutOfStock 
            ? `<b style="color: #e74c3c;">● SOLD OUT</b>` 
            : `<b style="color: #27ae60;">● In Stock</b>`;

        const card = `
            <div class="product-card" onclick="window.location.href='product.html?id=${index}'" style="cursor: pointer; position: relative; opacity: ${isOutOfStock ? '0.8' : '1'};">
                ${cashPrice < regPrice ? '<span class="sale-badge">SALE</span>' : ''}
                
                ${isOutOfStock ? '<div style="position:absolute; top:40%; left:0; width:100%; background:rgba(231, 76, 60, 0.85); color:white; text-align:center; padding:5px; font-size:11px; font-weight:bold; z-index:2;">SOLD OUT</div>' : ''}
                
                <img src="${p.Folder_Path}/1.png" class="product-image" onerror="this.src='https://via.placeholder.com/150'">
                <div class="product-name">${p.Name}</div>
                <div class="price-regular">₱${regPrice.toLocaleString()}</div>
                <div class="price-cash">₱${cashPrice.toLocaleString()}</div>
                
                <div class="installment-text">
                    As low as <b>₱${Math.round(monthlyPayment).toLocaleString()} / ${months}mo</b>
                </div>
                
                <p style="font-size:10px; margin-top: 8px;">
                    ${stockStatus}
                </p>
            </div>
        `;
        container.innerHTML += card;
    });
}

let currentGalleryImages = []; // Dito itatago ang mga gumaganang image links
