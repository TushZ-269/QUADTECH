// Wait for the HTML to be fully loaded before running any script
document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. Get all Calculator Input Elements ---
    const productNameEl = document.getElementById('product-name');
    const incomeEl = document.getElementById('income');
    const costProductionEl = document.getElementById('cost-production');
    const costRawEl = document.getElementById('cost-raw');
    const costTransportEl = document.getElementById('cost-transport');
    const costBillsEl = document.getElementById('cost-bills');
    const costOtherEl = document.getElementById('cost-other');

    // --- 2. Get all Simulator Sliders ---
    const simRawEl = document.getElementById('sim-raw');
    const simTransportEl = document.getElementById('sim-transport');
    const simProductionEl = document.getElementById('sim-production');
    const simBillsEl = document.getElementById('sim-bills');

    // --- 3. Get all Slider Labels ---
    const simRawLabel = document.getElementById('sim-raw-label');
    const simTransportLabel = document.getElementById('sim-transport-label');
    const simProductionLabel = document.getElementById('sim-production-label');
    const simBillsLabel = document.getElementById('sim-bills-label');

    // --- 4. Get all Output/Result Elements ---
    const baselineProfitEl = document.getElementById('baseline-profit');
    const baselineRoiEl = document.getElementById('baseline-roi');
    const simulatedProfitEl = document.getElementById('simulated-profit');
    const simulatedRoiEl = document.getElementById('simulated-roi');
    const roiImpactEl = document.getElementById('roi-impact');

    // --- 5. Get Feature Elements ---
    const newsFeedEl = document.getElementById('news-feed');
    const newsProductNameEl = document.getElementById('news-product-name');
    const newsContentEl = document.getElementById('news-content');
    const advicePopupEl = document.getElementById('advice-popup');
    const adviceCloseBtn = document.getElementById('advice-close-btn');

    // --- 6. Get Metal Price Feature Elements ---
    const findMetalPriceBtn = document.getElementById('find-metal-price-btn');
    const metalCalcPopup = document.getElementById('metal-calc-popup');
    const metalPopupCloseBtn = document.getElementById('metal-popup-close-btn');
    const popupMetalName = document.getElementById('popup-metal-name');
    const popupMetalPrice = document.getElementById('popup-metal-price');
    const popupQuantityInput = document.getElementById('popup-quantity-input');
    const popupUnitSelect = document.getElementById('popup-unit-select');
    const popupApplyBtn = document.getElementById('popup-apply-btn');

    // This will store the data for the selected metal
    let selectedMetalData = {
        name: '',
        price: 0,
        apiUnit: '' // 'toz' or 'lb'
    };
    
    // Conversion rates from API base units (price per base unit)
    const CONVERSIONS = {
        // 1 toz = 31.1g, 0.0311kg, 0.06857lb (oops, 1/14.58)
        // 1 lb = 453.59g, 0.453kg, 14.5833 toz (oops, 1/0.068)
        toz: { pricePer: 1, g: 31.1035, kg: 0.0311035, toz: 1 },
        lb:  { pricePer: 1, g: 453.592, kg: 0.453592, lb: 1 }
    };
    // Helper array to identify precious metals from API
    const preciousMetals = ['gold', 'silver', 'platinum', 'palladium'];

    // --- 7. The Main Calculation Function ---
    function calculate() {
        const income = parseFloat(incomeEl.value) || 0;
        const costProduction = parseFloat(costProductionEl.value) || 0;
        const costRaw = parseFloat(costRawEl.value) || 0;
        const costTransport = parseFloat(costTransportEl.value) || 0;
        const costBills = parseFloat(costBillsEl.value) || 0;
        const costOther = parseFloat(costOtherEl.value) || 0;
        
        const totalCost = costProduction + costRaw + costTransport + costBills + costOther;
        const netProfit = income - totalCost;
        const baselineROI = (totalCost === 0) ? 0 : (netProfit / totalCost) * 100;
        
        baselineProfitEl.textContent = formatCurrency(netProfit);
        baselineRoiEl.textContent = `${baselineROI.toFixed(2)}%`;
        styleText(baselineProfitEl, netProfit);
        styleText(baselineRoiEl, baselineROI);
        
        // Simulation calculation
        const simRawPercent = parseFloat(simRawEl.value) / 100;
        const simTransportPercent = parseFloat(simTransportEl.value) / 100;
        const simProductionPercent = parseFloat(simProductionEl.value) / 100;
        const simBillsPercent = parseFloat(simBillsEl.value) / 100;
        
        simRawLabel.textContent = `${simRawEl.value}%`;
        simTransportLabel.textContent = `${simTransportEl.value}%`;
        simProductionLabel.textContent = `${simProductionEl.value}%`;
        simBillsLabel.textContent = `${simBillsEl.value}%`;
        
        const simCostProduction = costProduction * (1 + simProductionPercent);
        const simCostRaw = costRaw * (1 + simRawPercent);
        const simCostTransport = costTransport * (1 + simTransportPercent);
        const simCostBills = costBills * (1 + simBillsPercent);
        
        const simTotalCost = simCostProduction + simCostRaw + simCostTransport + simCostBills + costOther;
        const simNetProfit = income - simTotalCost;
        const simulatedROI = (simTotalCost === 0) ? 0 : (simNetProfit / simTotalCost) * 100;
        
        simulatedProfitEl.textContent = formatCurrency(simNetProfit);
        simulatedRoiEl.textContent = `${simulatedROI.toFixed(2)}%`;
        styleText(simulatedProfitEl, simNetProfit);
        styleText(simulatedRoiEl, simulatedROI);
        
        // ROI Impact
        const roiDifference = simulatedROI - baselineROI;
        if (roiDifference > 0.01) {
            roiImpactEl.textContent = `(↑ ${roiDifference.toFixed(2)}%)`;
            roiImpactEl.className = 'positive';
        } else if (roiDifference < -0.01) {
            roiImpactEl.textContent = `(↓ ${Math.abs(roiDifference).toFixed(2)}%)`;
            roiImpactEl.className = 'negative';
        } else {
            roiImpactEl.textContent = '(No Change)';
            roiImpactEl.className = 'neutral';
        }
    }

    // --- 8. Helper Functions ---
    function formatCurrency(num) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(num);
    }

    function styleText(element, value) {
        if (value > 0) { element.style.color = 'var(--secondary-accent)'; } 
        else if (value < 0) { element.style.color = 'var(--negative-accent)'; } 
        else { element.style.color = 'var(--text-secondary)'; }
    }

    function formatMetalName(name) {
        return name.replace(/_/g, ' ') // Replace underscores with spaces
                   .split(' ')
                   .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize
                   .join(' ');
    }

    // --- 9. Event Listeners for Calculator ---
    const allInputs = [
        incomeEl, costProductionEl, costRawEl, costTransportEl, costBillsEl, costOtherEl,
        simRawEl, simTransportEl, simProductionEl, simBillsEl
    ];
    allInputs.forEach(el => { el.addEventListener('input', calculate); });

    // --- 10. REAL-TIME DATA (FINNHUB/MANDI) FUNCTIONS ---
    let debounceTimer;
    productNameEl.addEventListener('input', () => {
        const productName = productNameEl.value.trim();
        newsProductNameEl.textContent = productName; // Update title
        clearTimeout(debounceTimer);
        
        if (productName.length > 2) {
            newsFeedEl.style.display = 'block';
            newsContentEl.innerHTML = `<p style="color: var(--primary-accent);">Fetching live data...</p>`;
            // Wait 500ms after user stops typing
            debounceTimer = setTimeout(() => {
                fetchRealTimeData(productName);
            }, 500); 
        } else {
            // Don't hide if the metal finder is active
            if (!newsProductNameEl.textContent.includes("Live Metals")) {
                newsFeedEl.style.display = 'none';
            }
        }
    });

    async function fetchRealTimeData(productName) {
        try {
            // Use the /api/data endpoint on our server
            const response = await fetch(`http://localhost:3000/api/data?product=${encodeURIComponent(productName)}`);
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            displayRealTimeData(data); // Call display function
        } catch (error) {
            console.error('Error fetching real-time data:', error);
            newsContentEl.innerHTML = `<p style="color: var(--negative-accent);">Error loading data. Is the server running?</p>`;
        }
    }

    function displayRealTimeData(data) {
        newsContentEl.innerHTML = ''; // Clear loading message

        if (data.type === 'finnhub') {
            const quote = data.quote;
            const news = data.news;

            // Display the quote
            if (quote && quote.c) {
                const change = quote.d ? quote.d.toFixed(2) : 0;
                const changePercent = quote.dp ? quote.dp.toFixed(2) : 0;
                const changeColor = change > 0 ? 'var(--secondary-accent)' : 'var(--negative-accent)';
                
                newsContentEl.innerHTML += `
                    <div class="news-item">
                        <h4>Live Quote (${data.symbol})</h4>
                        <p style="font-size: 1.5rem; font-weight: 700; color: var(--text-primary);">
                            ${formatCurrency(quote.c)} 
                            <span style="font-size: 1rem; color: ${changeColor};">
                                (${change > 0 ? '+' : ''}${change} / ${changePercent}%)
                            </span>
                        </p>
                        <span class="source">Finnhub.io (Real-time Market)</span>
                    </div>
                `;
            }

            // Display the news
            if (news && news.length > 0) {
                news.slice(0, 2).forEach(article => { // Show first 2 articles
                    newsContentEl.innerHTML += `
                        <div class="news-item">
                            <h4>${article.headline}</h4>
                            <p>${article.summary.substring(0, 100)}...</p>
                            <span class="source">${article.source} (via Finnhub)</span>
                        </div>
                    `;
                });
            } else {
                newsContentEl.innerHTML += `<div class="news-item"><p>No company news found for ${data.symbol}.</p></div>`;
            }

        } else if (data.type === 'mandi') {
            if (data.commodity && data.commodity.records.length > 0) {
                const commodity = data.commodity.records[0];
                newsContentEl.innerHTML += `
                    <div class="news-item">
                        <h4>Latest Raw Material Price (${commodity.commodity})</h4>
                        <p>The latest price in <strong>${commodity.market}, ${commodity.state}</strong> is <strong>₹${commodity.modal_price}</strong> per Quintal.</p>
                        <span class="source">data.gov.in (Daily Mandi)</span>
                    </div>
                `;
            } else {
                newsContentEl.innerHTML += `<div class="news-item"><p>No daily mandi data found.</p></div>`;
            }

        } else {
            newsContentEl.innerHTML = `<p>No live data found for this product. Try "Cotton", "Wheat", or "Tata Steel".</p>`;
        }
    }

    // --- 11. Advice Popup Listeners ---
    setTimeout(() => { advicePopupEl.classList.add('show'); }, 3000);
    adviceCloseBtn.addEventListener('click', () => { advicePopupEl.classList.remove('show'); });


    // --- 12. Metal Price Integration Logic ---

    // Listen for click on "Find Live Price" button
    findMetalPriceBtn.addEventListener('click', fetchMetalPrices);

    async function fetchMetalPrices() {
        newsFeedEl.style.display = 'block';
        newsProductNameEl.textContent = "Live Metals";
        newsContentEl.innerHTML = `<p style="color: var(--primary-accent);">Fetching live metal prices...</p>`;
        
        try {
            // Use the /api/metal-prices endpoint on our server
            const response = await fetch('http://localhost:3000/api/metal-prices');
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Failed to fetch metal prices');
            }
            const data = await response.json();
            
            if (data.status === 'success') {
                displayMetalList(data.metals);
            } else {
                newsContentEl.innerHTML = `<p style="color: var(--negative-accent);">Error loading metal prices.</p>`;
            }
        } catch (error) {
            console.error('Error fetching metal prices:', error);
            newsContentEl.innerHTML = `<p style="color: var(--negative-accent);">Error: ${error.message}</p>`;
        }
    }

    // Display the list of metals as buttons in the news feed
    function displayMetalList(metals) {
        newsContentEl.innerHTML = '<div class="metal-select-list"></div>';
        const listContainer = newsContentEl.querySelector('.metal-select-list');
        
        for (const metalName in metals) {
            // Skip currencies which are also in the list
            if (metalName.length === 3 || metalName.length === 6 || metalName.startsWith('lbma') || metalName.startsWith('mcx')) {
                continue;
            }
            
            const price = metals[metalName];
            
            // Determine the base unit from the API
            let apiUnit = 'lb'; // Default to pound
            let apiUnitText = 'per lb';
            if (preciousMetals.some(pm => metalName.toLowerCase().includes(pm))) {
                apiUnit = 'toz'; // Troy Ounce
                apiUnitText = 'per troy ounce';
            }

            const niceName = formatMetalName(metalName);
            
            const button = document.createElement('button');
            button.className = 'metal-select-btn';
            button.innerHTML = `
                <span class="metal-name">${niceName}</span>
                <span class="metal-price">${formatCurrency(price)} ${apiUnitText}</span>
            `;
            
            // Store data on the button itself for the popup
            button.dataset.name = niceName;
            button.dataset.price = price;
            button.dataset.apiUnit = apiUnit;
            button.dataset.apiUnitText = apiUnitText;
            
            // Add click listener to open the popup
            button.addEventListener('click', () => openMetalPopup(button.dataset));
            
            listContainer.appendChild(button);
        }
    }
    
    // Open the popup with the correct metal data
    function openMetalPopup(metalData) {
        // 1. Store data for calculation
        selectedMetalData = {
            name: metalData.name,
            price: parseFloat(metalData.price),
            apiUnit: metalData.apiUnit // 'toz' or 'lb'
        };

        // 2. Set popup text
        popupMetalName.textContent = metalData.name;
        popupMetalPrice.textContent = `${formatCurrency(metalData.price)} ${metalData.apiUnitText}`;
        
        // 3. Set unit options based on the metal's base unit
        popupUnitSelect.innerHTML = ''; // Clear old options
        if (metalData.apiUnit === 'toz') {
            popupUnitSelect.innerHTML = `
                <option value="toz">per Troy Ounce</option>
                <option value="g">per Gram</option>
                <option value="kg">per Kilogram</option>
            `;
        } else { // 'lb'
            popupUnitSelect.innerHTML = `
                <option value="lb">per Pound</option>
                <option value="kg">per Kilogram</option>
                <option value="g">per Gram</option>
            `;
        }
        
        // 4. Show the popup
        popupQuantityInput.value = '';
        metalCalcPopup.classList.add('show');
    }

    // --- Close popup listeners ---
    metalPopupCloseBtn.addEventListener('click', () => {
        metalCalcPopup.classList.remove('show');
    });
    metalCalcPopup.addEventListener('click', (e) => {
        // Also close by clicking on the dark overlay
        if (e.target === metalCalcPopup) {
            metalCalcPopup.classList.remove('show');
        }
    });

    // --- Calculate and Apply Cost from Popup ---
    popupApplyBtn.addEventListener('click', () => {
        const quantity = parseFloat(popupQuantityInput.value) || 0;
        if (quantity === 0) return;
        
        const selectedUnit = popupUnitSelect.value; // e.g., 'g'
        const basePrice = selectedMetalData.price; // e.g., 355000 (price per base unit)
        const baseUnit = selectedMetalData.apiUnit; // e.g., 'toz'
        
        // This is the core conversion
        // Price per gram = (Price per toz) / (grams in a toz)
        // Price per kg = (Price per lb) / (kg in a lb)
        const pricePerSelectedUnit = basePrice / CONVERSIONS[baseUnit][selectedUnit];
        
        const totalCost = pricePerSelectedUnit * quantity;
        
        // 4. Apply to input field
        costRawEl.value = totalCost.toFixed(0); // Set to whole number
        
        // 5. Hide popup
        metalCalcPopup.classList.remove('show');
        
        // 6. Recalculate dashboard!
        calculate();
    });

    // --- 13. Initial Run ---
    // Run calculator once on load to set up default values
    calculate();
});