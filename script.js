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
            <div class="product-card" onclick="openProductDetails(${index})" style="cursor: pointer; position: relative; opacity: ${isOutOfStock ? '0.8' : '1'};">
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

function openProductDetails(index) {
    const p = window.currentProducts[index];
    if (!p) return;

    const modal = document.getElementById('productViewModal');
    if (!modal) return;
    modal.style.display = "flex";

    const gallery = document.getElementById('photoGallery');
    const counter = document.getElementById('image-counter');
    
    // 1. PHOTO LOADING (No changes here)
    gallery.innerHTML = `
        <div style="width:100%; height:300px; display:flex; align-items:center; justify-content:center; flex-direction:column;" class="skeleton">
            <div class="spinner"></div>
            <span style="font-size:12px; color:gray;">Fetching high-quality photos...</span>
        </div>
    `;

    if(counter) counter.innerText = "Loading...";
    currentGalleryImages = [];

    let imagesToCheck = 15;
    let checkedCount = 0;
    for (let i = 1; i <= imagesToCheck; i++) {
        let imgSrc = `${p.Folder_Path}/${i}.png`;
        let img = new Image();
        img.src = imgSrc;
        img.onload = function() {
            currentGalleryImages.push(imgSrc);
            checkedCount++;
            if (checkedCount === imagesToCheck) finalizeGallery(gallery, counter);
        };
        img.onerror = function() {
            checkedCount++;
            if (checkedCount === imagesToCheck) finalizeGallery(gallery, counter);
        };
    }

    // 2. TEXT DETAILS & BADGES
    const brandName = p.Brand || "Premium Brand";
    const rating = parseFloat(p.Rating) || 5.0;
    const isFreeShipping = p.Shipping === "Free" || p.Shipping === "FREE";
    const isNewArrival = p.Status === "New" || p.Status === "NEW";
    const isFlashSale = p.Flash_Sale === "Yes" || p.Flash_Sale === "YES";

    // Item Name display
    document.getElementById('viewName').innerHTML = `
        <div style="margin-bottom: 5px;">${p.Name}</div>
        
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px; flex-wrap: wrap;">
            <span style="color: #1B4D2E; font-weight: 800; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">
                ${brandName}
            </span>
            <span style="height: 12px; width: 1px; background: #ddd;"></span>
            <span style="color: #27ae60; font-size: 11px; font-weight: 600; display: flex; align-items: center; gap: 4px;">
                <i class="fas fa-check-circle"></i> 100% Authentic
            </span>
        </div>

        <div style="display: flex; gap: 6px; margin-bottom: 10px; flex-wrap: wrap;">
            ${isFreeShipping ? `<span style="background: #e8f5e9; color: #2e7d32; padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: 800; border: 1px solid #c8e6c9;">FREE SHIPPING</span>` : ''}
            ${isNewArrival ? `<span style="background: #e3f2fd; color: #1565c0; padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: 800; border: 1px solid #bbdefb;">NEW ARRIVAL</span>` : ''}
            ${isFlashSale ? `<span style="background: #fff3e0; color: #e65100; padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: 800; border: 1px solid #ffe0b2;"><i class="fas fa-bolt"></i> FLASH SALE</span>` : ''}
            
            <div style="background: #fafafa; padding: 3px 8px; border-radius: 4px; border: 1px solid #eee; display: flex; align-items: center; gap: 4px;">
                <i class="fas fa-star" style="color: #ffc107; font-size: 10px;"></i>
                <span style="font-size: 10px; font-weight: 700; color: #444;">${rating.toFixed(1)}</span>
                <span style="font-size: 9px; color: #888; text-transform: uppercase;">Credit Rating</span>
            </div>
        </div>
    `;

    document.getElementById('viewDesc').innerText = p.Description;

    // --- COLOR VARIATION ---
    const colorContainer = document.getElementById('viewColors');
    if (colorContainer) {
        const colors = p.Colors ? p.Colors.split(',').map(c => c.trim()) : [];
        colorContainer.innerHTML = colors.length > 0 ? '<p style="font-size:11px; font-weight:bold; color:#888; margin-bottom:5px;">SELECT COLOR:</p>' : '';
        colors.forEach(color => {
            const btn = document.createElement('button');
            btn.innerText = color;
            btn.className = "variation-btn color-btn";
            btn.onclick = () => {
                document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            };
            colorContainer.appendChild(btn);
        });
        if(colors.length > 0) colorContainer.querySelector('button').click();
    }

   // --- CAPACITY & ADVANCED PRICE LOGIC ---
    const capacityContainer = document.getElementById('viewCapacity');
    const priceElement = document.getElementById('viewPrice');
    
    // Arrays from Sheets
    const capacities = p.Capacity ? p.Capacity.toString().split(',').map(s => s.trim()) : ["Standard"];
    const instPrices = p.Installment_Price ? p.Installment_Price.toString().split(',').map(s => s.trim()) : [];
    const cashPrices = p.Cash_Price ? p.Cash_Price.toString().split(',').map(s => s.trim()) : [];
    const regPrices = p.Regular_Price ? p.Regular_Price.toString().split(',').map(s => s.trim()) : [];
    
    const interestRate = parseFloat(p.Interest_Rate) || 0;
    const processingFee = parseFloat(p.Processing_Fee) || 0;

    capacityContainer.innerHTML = p.Capacity ? '<p style="font-size:11px; font-weight:bold; color:#888; margin-bottom:5px;">SELECT STORAGE:</p>' : '';
    
    capacities.forEach((cap, i) => {
        const btn = document.createElement('button');
        btn.innerText = cap;
        btn.className = "variation-btn capacity-btn";
        
        btn.onclick = () => {
            document.querySelectorAll('.capacity-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const curRegPrice = parseFloat(regPrices[i]) || parseFloat(regPrices[0]) || 0;
            const curCashPrice = parseFloat(cashPrices[i]) || parseFloat(cashPrices[0]) || 0;
            const sheetMonths = parseInt(p.Plan) || 12;

            let selectedTerm = sheetMonths;
            let currentDP = 0;

            const renderInstallmentUI = () => {
                const balance = curRegPrice - currentDP;
                const monthlyBase = (balance / selectedTerm) + (balance * interestRate);
                const firstPayTotal = monthlyBase + processingFee;
                const monthlyInterestPercent = (interestRate * 100).toFixed(0);
                let saleBadge = curCashPrice < curRegPrice ? `<span style="background:var(--golden-yellow); color:var(--forest-green); font-size:10px; padding:2px 6px; border-radius:4px; font-weight:bold; margin-left:8px;">CASH SALE</span>` : '';

                priceElement.innerHTML = `
                    <div style="margin-bottom:12px; text-decoration: none !important;">
                        <span style="text-decoration:line-through; color:#999; font-size:13px;">₱${curRegPrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span> ${saleBadge}
                        <div style="font-size:26px; font-weight:800; color:var(--forest-green); letter-spacing:-1px;">₱${curCashPrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                    </div>

                    <div class="clickable-monthly" id="toggleSchedule" 
                         style="cursor:pointer; background:#ffffff; padding:12px; border-radius:10px; border:1px solid #e0e0e0; 
                                display:flex; align-items:center; justify-content:space-between; box-shadow: 0 2px 4px rgba(0,0,0,0.03);
                                text-decoration: none !important; outline: none !important;">
                        <div style="display:flex; flex-direction:column; gap:2px; text-decoration: none !important;">
                            <div style="font-size:14px; font-weight:700; color:#e67e22; text-decoration: none !important;">
                                Installment: ₱${monthlyBase.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} / mo.
                            </div>
                            <div style="font-size:11px; color:#888; font-weight:500; text-decoration: none !important;">
                                For ${selectedTerm} months term ${currentDP > 0 ? `(₱${currentDP.toLocaleString(undefined, {minimumFractionDigits: 2})} DP)` : ''}
                            </div>
                        </div>
                        <div style="text-align:right; text-decoration: none !important;">
                            <span style="font-size:10px; color:var(--forest-green); font-weight:700; text-transform:uppercase; display:block; text-decoration: none !important;">View Plan</span>
                            <i class="fas fa-chevron-down" style="font-size:10px; color:var(--forest-green);"></i>
                        </div>
                    </div>

                    <div id="scheduleTableContainer" style="display:none; margin-top:15px; border:1px solid #eee; border-radius:12px; overflow:hidden; background:#f9f9f9;">
                        <div style="padding:15px; background:white; border-bottom:1px solid #eee;">
                            <label style="font-size:10px; font-weight:800; color:#888; display:block; margin-bottom:8px; text-transform:uppercase;">Select Payment Term:</label>
                            <div style="display:flex; gap:5px; margin-bottom:15px;">
                                ${[3, 6, sheetMonths].filter((v, idx, a) => a.indexOf(v) === idx).sort((a,b) => a-b).map(m => `
                                    <button class="term-selector-btn" data-months="${m}"
                                            style="flex:1; padding:10px; font-size:11px; font-weight:bold; border-radius:8px; cursor:pointer; 
                                            border:1px solid ${m === selectedTerm ? 'var(--forest-green)' : '#eee'};
                                            background:${m === selectedTerm ? 'var(--forest-green)' : '#fff'};
                                            color:${m === selectedTerm ? 'white' : '#666'}; transition:0.2s;">
                                        ${m} Months
                                    </button>
                                `).join('')}
                            </div>

                            <label style="font-size:10px; font-weight:800; color:#888; display:block; margin-bottom:8px; text-transform:uppercase;">Custom Downpayment (Optional):</label>
                            <div style="position:relative;">
                                <span style="position:absolute; left:12px; top:50%; transform:translateY(-50%); font-weight:bold; color:#444;">₱</span>
                                <input type="number" id="dpInput" value="${currentDP || ''}" placeholder="0.00" 
                                       style="width:100%; padding:12px 12px 12px 25px; border-radius:8px; border:1px solid #ddd; font-weight:700; font-size:14px; outline:none; box-sizing:border-box;">
                            </div>
                        </div>

                        <div style="background:#1B4D2E; color:white; padding:10px; font-size:10px; font-weight:bold; text-align:center; text-transform:uppercase;">
                            FLAVI DEAL INSTALLMENT PLAN
                        </div>
                        <table style="width:100%; border-collapse:collapse; font-size:10px; background:white;">
                            <tr style="background:#f4f4f4; border-bottom:1px solid #ddd;">
                                <th style="padding:12px 5px; text-align:left; width:15%; padding-left:15px;">Month</th>
                                <th style="padding:12px 5px; text-align:center; white-space:nowrap;">Monthly Interest Rate</th>
                                <th style="padding:12px 5px; text-align:right; padding-right:15px;">Monthly Due</th>
                            </tr>
                            ${Array.from({length: selectedTerm}, (_, i) => i + 1).map(m => {
                                let isFirst = m === 1;
                                let amt = isFirst ? firstPayTotal : monthlyBase;
                                return `
                                <tr style="border-bottom:1px solid #f9f9f9;">
                                    <td style="padding:12px 5px; font-weight:bold; color:#555; padding-left:15px;">${m}</td>
                                    <td style="padding:12px 5px; text-align:center; color:#999;">${monthlyInterestPercent}%</td>
                                    <td style="padding:12px 5px; text-align:right; font-weight:700; color:#333; padding-right:15px;">
                                        ₱${amt.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                        ${isFirst ? `<div style="color:#e67e22; font-size:8px; font-weight:bold;">+ ₱${processingFee.toLocaleString(undefined, {minimumFractionDigits: 2})} One-time Proc. Fee</div>` : ''}
                                    </td>
                                </tr>`;
                            }).join('')}
                        </table>
                        
                        <div style="padding:15px; background:#fffcf5; border-top:1px solid #eee;">
                            <div style="display:flex; justify-content:space-between; margin-bottom:10px; font-size:11px; font-weight:700; border-bottom:1px dashed #ddd; padding-bottom:8px;">
                                <span>Total Loan Balance:</span>
                                <span>₱${balance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                            </div>
                            <p style="font-size:9px; color:#9e7e4a; margin:0; line-height:1.4;">
                                * Terms and conditions applied. A one-time processing bill of <b>₱${processingFee.toLocaleString(undefined, {minimumFractionDigits: 2})}</b> will be added on the first due date.
                            </p>
                            <div style="margin-top:8px; font-size:9px; font-weight:bold; color:#1B4D2E; text-align:center; opacity:0.6;">
                                POWERED BY ERRIHO PERSONAL FINANCE
                            </div>
                        </div>
                    </div>
                `;

                // RE-BIND CLICK EVENTS
                const tableDiv = document.getElementById('scheduleTableContainer');
                document.getElementById('toggleSchedule').onclick = () => {
                    tableDiv.style.display = tableDiv.style.display === "none" ? "block" : "none";
                };

                document.querySelectorAll('.term-selector-btn').forEach(tBtn => {
                    tBtn.onclick = () => {
                        selectedTerm = parseInt(tBtn.getAttribute('data-months'));
                        renderInstallmentUI();
                        document.getElementById('scheduleTableContainer').style.display = "block";
                    };
                });

                const dpInput = document.getElementById('dpInput');
                dpInput.oninput = (e) => {
                    currentDP = parseFloat(e.target.value) || 0;
                    clearTimeout(window.dpTimer);
                    window.dpTimer = setTimeout(() => {
                        renderInstallmentUI();
                        document.getElementById('scheduleTableContainer').style.display = "block";
                        document.getElementById('dpInput').focus();
                    }, 800);
                };
            };

            renderInstallmentUI();
        };
        capacityContainer.appendChild(btn);
    });
    
    const firstCapBtn = capacityContainer.querySelector('.capacity-btn');
    if(firstCapBtn) firstCapBtn.click();

    // 3. ACTION BUTTONS
    const actionContainer = document.querySelector('.action-buttons');
    if (actionContainer) {
        if (p.Stock_Count <= 0) {
            actionContainer.innerHTML = `<div style="background:#fdeaea; color:#e74c3c; padding:15px; border-radius:10px; text-align:center; font-weight:bold; width:100%;">● SOLD OUT</div>`;
        } else {
            actionContainer.innerHTML = `
                <button id="addToCartBtn" class="btn-regular">Add to Cart</button>
                <button id="buyNowBtn" class="btn-easy">Buy Now</button>
            `;
            
            document.getElementById('addToCartBtn').onclick = () => {
                const col = document.querySelector('.color-btn.active')?.innerText || "N/A";
                const cap = document.querySelector('.capacity-btn.active')?.innerText || "N/A";
                alert(`Added to Cart: ${p.Name}\nColor: ${col}\nStorage: ${cap}`);
            };

            document.getElementById('buyNowBtn').onclick = () => {
                const col = document.querySelector('.color-btn.active')?.innerText || "N/A";
                const cap = document.querySelector('.capacity-btn.active')?.innerText || "N/A";
                alert(`Redirecting to Checkout...\nItem: ${p.Name} (${cap})`);
            };
        }
    }
}

// Function para ayusin ang gallery pagkatapos ma-check lahat ng images
function finalizeGallery(gallery, counter) {
    // I-sort para hindi maghalo-halo ang sequence (1, 2, 3...)
    currentGalleryImages.sort((a, b) => {
        return parseInt(a.split('/').pop()) - parseInt(b.split('/').pop());
    });

    gallery.innerHTML = currentGalleryImages.map((src, idx) => 
        `<img src="${src}" class="gallery-img" onclick="openFullscreenSwipe(${idx})">`
    ).join('');

    const total = currentGalleryImages.length;
    if(counter) counter.innerText = `1 / ${total}`;

    gallery.onscroll = () => {
        let page = Math.round(gallery.scrollLeft / gallery.clientWidth) + 1;
        if(counter) counter.innerText = `${page} / ${total}`;
    };
}

// FULLSCREEN SWIPE LOGIC
function openFullscreenSwipe(startIndex) {
    const fs = document.getElementById('fullscreenView');
    const fsGallery = document.getElementById('fullscreenGallery');
    const fsCounter = document.getElementById('fs-counter');
    
    fs.style.display = "flex";
    
    // I-render ang lahat ng images sa loob ng fullscreen container para swipeable
    fsGallery.innerHTML = currentGalleryImages.map(src => 
        `<img src="${src}" class="fs-slide">`
    ).join('');
    
    const total = currentGalleryImages.length;
    
    // I-scroll sa saktong image na ni-click
    setTimeout(() => {
        fsGallery.scrollLeft = fsGallery.clientWidth * startIndex;
        if(fsCounter) fsCounter.innerText = `${startIndex + 1} / ${total}`;
    }, 50);

    fsGallery.onscroll = () => {
        let page = Math.round(fsGallery.scrollLeft / fsGallery.clientWidth) + 1;
        if(fsCounter) fsCounter.innerText = `${page} / ${total}`;
    };
}

function closeFullImage() {
    document.getElementById('fullscreenView').style.display = "none";
}
// 4. Tawagin ang fetch function pagka-load ng page
window.onload = fetchProducts;

function toggleModal() {
    const modal = document.getElementById('accountModal');
    modal.style.display = (modal.style.display === "flex") ? "none" : "flex";
}

function showRegister() {
    document.getElementById('modalTitle').innerText = "Create Account";
    document.getElementById('loginFields').style.display = "none";
    document.getElementById('registerFields').style.display = "block";
}

function showLogin() {
    document.getElementById('modalTitle').innerText = "Customer Login";
    document.getElementById('loginFields').style.display = "block";
    document.getElementById('registerFields').style.display = "none";
}

async function handleRegister() {
    const regBtn = document.getElementById('regBtn');
    
    const name = document.getElementById('regName').value;
    const user = document.getElementById('regUser').value;
    const email = document.getElementById('regEmail').value;
    const mobile = document.getElementById('regMobile').value;
    const pin = document.getElementById('regPin').value;
    const subscribe = document.getElementById('regSubscribe').checked;

    if (!name || !user || !email || !mobile || !pin) {
        return alert("Please fill up all fields.");
    }

    regBtn.disabled = true;
    regBtn.innerText = "Sending OTP... Please wait";

    const url = `${webAppUrl}?action=register&name=${encodeURIComponent(name)}&user=${encodeURIComponent(user)}&email=${encodeURIComponent(email)}&mobile=${encodeURIComponent(mobile)}&pin=${encodeURIComponent(pin)}&subscribe=${subscribe}`;

    try {
        const response = await fetch(url);
        const result = await response.text();

        alert("OTP request sent! Check your email.");
        showOTPBox(); 
    } catch (error) {
        alert("Check your email for the OTP.");
        showOTPBox();
    } finally {
        regBtn.disabled = false;
        regBtn.innerText = "Send OTP to Email";
    }
}

function showOTPBox() {
    document.getElementById('modalTitle').innerText = "Verify Email OTP";
    document.getElementById('registerFields').style.display = "none";
    document.getElementById('otpFields').style.display = "block";
}

async function verifyOTP() {
    const verifyBtn = document.getElementById('verifyBtn');
    const otpInput = document.getElementById('otpInput').value;
    const mobileInput = document.getElementById('regMobile').value;
    const fullName = document.getElementById('regName').value; // Kunin ang name para sa dashboard

    if (!otpInput) {
        alert("Please enter the OTP code.");
        return;
    }

    verifyBtn.disabled = true;
    verifyBtn.innerText = "Verifying...";

    const verifyUrl = `${webAppUrl}?action=verify&mobile=${encodeURIComponent(mobileInput)}&otp=${encodeURIComponent(otpInput)}`;

    try {
        const response = await fetch(verifyUrl);
        const result = await response.text();
        
        if (result === "Verified") {
            alert("Account verified successfully!");
            
            // AUTOMATIC LOGIN: Ipakita agad ang Dashboard pagka-verify
            const userData = {
                status: "Success",
                name: fullName
            };
            
            // I-save ang session
            localStorage.setItem("flavi_user", JSON.stringify(userData));
            
            // Tawagin ang function para ipakita ang dashboard
            showDashboard(userData);
            
        } else {
            alert("Invalid OTP code. Please try again.");
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Verification failed. Please try again.");
    } finally {
        verifyBtn.disabled = false;
        verifyBtn.innerText = "Verify & Complete";
    }
}
// Function para magpalit ng view sa Dashboard
function switchDash(tab) {
    document.querySelectorAll('.dash-section').forEach(s => s.style.display = 'none');
    document.querySelectorAll('.dash-tab').forEach(t => t.classList.remove('active'));
    document.getElementById('dash-' + tab).style.display = 'block';
    event.target.classList.add('active');
}

// Update handleLogin para ipakita ang Dashboard
async function handleLogin() {
    const user = document.getElementById('username').value;
    const pin = document.getElementById('pin').value;

    if (!user || !pin) return alert("Please enter username and PIN.");

    try {
        const loginUrl = `${webAppUrl}?action=login&user=${encodeURIComponent(user)}&pin=${encodeURIComponent(pin)}`;
        const response = await fetch(loginUrl);
        const result = await response.json();

        if (result.status === "Success") {
            showDashboard(result);
        } else {
            alert("Invalid Username, PIN, or Account Not Verified.");
        }
    } catch (error) {
        alert("Login failed. Check your connection.");
    }
}

function showDashboard(data) {
    // I-lock muna ang fields (View Mode)
    document.getElementById('dashboardFields').style.display = "block";
    document.getElementById('loginFields').style.display = "none";
    
    // I-display ang data base sa tamang keys mula sa JSON
    document.getElementById('dashName').innerText = data.name || "User"; 
    document.getElementById('editName').value = data.name || "";
    document.getElementById('editEmail').value = data.email || "No Email Found";
    
    // Itago ang "Change" fields hangga't wala pang OTP
    document.getElementById('extraFields').style.display = "none";
    
    // I-save ang buong data sa localStorage para sa update later
    localStorage.setItem("flavi_user", JSON.stringify(data));
}

function handleLogout() {
    localStorage.removeItem("flavi_user");
    location.reload(); // I-refresh ang page para bumalik sa dati
}

// I-check kung logged in na si user pagka-load ng page
window.onload = function() {
    fetchProducts();
    
    // Check if user is already logged in
    const savedUser = localStorage.getItem("flavi_user");
    if (savedUser) {
        const userData = JSON.parse(savedUser);
        showDashboard(userData);
    }
};

async function requestProfileChange() {
    alert("An OTP has been sent to your email to authorize this change.");
    // Dito tatawag tayo ng katulad sa handleRegister pero 'action=updateProfile'
    // I-re-reuse natin ang showOTPBox()
    showOTPBox();
}

// --- FIX: PINAG-ISANG REQUEST PROFILE OTP ---
async function requestProfileOTP() {
    const savedUser = JSON.parse(localStorage.getItem("flavi_user"));
    const email = savedUser ? savedUser.email : "";

    if (!email || email === "No Email Found") {
        alert("Error: Your email could not be found. Please log in again.");
        return;
    }

    if (!confirm("We will send an OTP to " + email + " to authorize editing. Do you want to proceed?")) return;

    // Pakita natin na naglo-load
    const reqBtn = document.getElementById('requestUpdateBtn');
    if(reqBtn) {
        reqBtn.disabled = true;
        reqBtn.innerText = "Sending OTP...";
    }

    const url = `${webAppUrl}?action=requestUpdateOTP&email=${encodeURIComponent(email)}`;
    
    try {
        const response = await fetch(url);
        const result = await response.text();

        if (result.trim() === "Success") {
            alert("OTP sent to your email!");
            
            // FLOW: Lipat sa OTP Screen
            document.getElementById('dashboardFields').style.display = 'none';
            document.getElementById('otpFields').style.display = 'block';
            document.getElementById('modalTitle').innerText = "Verify Identity";
            
            // Itabi ang mobile number para sa verification later
            document.getElementById('regMobile').value = savedUser.mobile || "";
            
            // Importante: Flag para sa verifyOTP function
            window.isUpdatingProfile = true;
        } else {
            alert("Error: " + result);
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Connection failed. Check your internet.");
    } finally {
        if(reqBtn) {
            reqBtn.disabled = false;
            reqBtn.innerText = "Request OTP to Edit Details";
        }
    }
}

// --- FIX: PINAG-ISANG VERIFY OTP FUNCTION ---
async function verifyOTP() {
    const verifyBtn = document.getElementById('verifyBtn');
    const otpInput = document.getElementById('otpInput').value;
    const mobileInput = document.getElementById('regMobile').value;
    const fullName = document.getElementById('regName').value; 

    if (!otpInput) return alert("Please enter the OTP code.");

    verifyBtn.disabled = true;
    verifyBtn.innerText = "Verifying...";

    const verifyUrl = `${webAppUrl}?action=verify&mobile=${encodeURIComponent(mobileInput)}&otp=${encodeURIComponent(otpInput)}`;

    try {
        const response = await fetch(verifyUrl);
        const result = await response.text();
        
        if (result === "Verified") {
            if (window.isUpdatingProfile) {
                // FLOW: Kung Profile Update ito, unlock the fields
                alert("Identity Verified! You can now edit your details.");
                document.getElementById('otpFields').style.display = 'none';
                document.getElementById('dashboardFields').style.display = 'block';
                document.getElementById('dash-profile').style.display = 'block';
                unlockProfileFields();
            } else {
                // FLOW: Kung Registration ito, login agad
                alert("Account verified successfully!");
                const userData = { status: "Success", name: fullName, mobile: mobileInput };
                localStorage.setItem("flavi_user", JSON.stringify(userData));
                showDashboard(userData);
            }
        } else {
            alert("Invalid OTP code. Please try again.");
        }
    } catch (error) {
        alert("Verification failed.");
    } finally {
        verifyBtn.disabled = false;
        verifyBtn.innerText = "Verify & Complete";
    }
}

function unlockProfileFields() {
    // Siguraduhin na ang inputs ay may class na 'profile-input' sa HTML
    const inputs = document.querySelectorAll('.profile-input');
    inputs.forEach(input => {
        input.removeAttribute('readonly');
        input.style.border = "1px solid var(--forest-green)";
        input.style.background = "#fff";
    });

    if(document.getElementById('extraFields')) document.getElementById('extraFields').style.display = 'block';
    if(document.getElementById('requestUpdateBtn')) document.getElementById('requestUpdateBtn').style.display = 'none';
    if(document.getElementById('saveProfileBtn')) document.getElementById('saveProfileBtn').style.display = 'block';
}

async function saveProfileChanges() {
    const savedUser = JSON.parse(localStorage.getItem("flavi_user"));
    const oldEmail = savedUser.email;

    const newName = document.getElementById('editName').value;
    const newEmail = document.getElementById('editEmail').value;
    const newMobile = document.getElementById('editMobile').value;
    const newUser = document.getElementById('editUser').value;
    const newPin = document.getElementById('editPin').value;

    const url = `${webAppUrl}?action=updateUser&oldEmail=${encodeURIComponent(oldEmail)}&newName=${encodeURIComponent(newName)}&newEmail=${encodeURIComponent(newEmail)}&newMobile=${encodeURIComponent(newMobile)}&newUser=${encodeURIComponent(newUser)}&newPin=${encodeURIComponent(newPin)}`;

    try {
        const response = await fetch(url);
        const result = await response.text();
        if(result === "Success") {
            alert("Profile updated successfully! Logging out to refresh data.");
            handleLogout();
        } else {
            alert("Update failed: " + result);
        }
    } catch (e) {
        alert("Update Error.");
    }
}

// Keyboard Support para sa Fullscreen Gallery
document.addEventListener('keydown', (e) => {
    const fs = document.getElementById('fullscreenView');
    const gallery = document.getElementById('fullscreenGallery');
    
    if (fs && fs.style.display === "flex") {
        if (e.key === "ArrowRight") {
            gallery.scrollBy({ left: gallery.clientWidth, behavior: 'smooth' });
        } else if (e.key === "ArrowLeft") {
            gallery.scrollBy({ left: -gallery.clientWidth, behavior: 'smooth' });
        } else if (e.key === "Escape") {
            closeFullImage();
        }
    }
});
