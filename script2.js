document.addEventListener('DOMContentLoaded', () => {
    
    // (All the calculator variable setup and functions from 1-8 are identical)
    // ... (calculator, sliders, helpers, etc.) ...
    
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

    // --- 6. The Main Calculation Function (Unchanged) ---
    function calculate() {
        // (This function is identical to the previous version)
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
    // --- 7. Helper Functions (Unchanged) ---
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
    // --- 8. Event Listeners for Calculator ---
    const allInputs = [
        incomeEl, costProductionEl, costRawEl, costTransportEl, costBillsEl, costOtherEl,
        simRawEl, simTransportEl, simProductionEl, simBillsEl
    ];
    allInputs.forEach(el => { el.addEventListener('input', calculate); });

    // --- 9. *** UPDATED REAL-TIME DATA FUNCTIONS *** ---

    let debounceTimer;
    productNameEl.addEventListener('input', () => {
        const productName = productNameEl.value.trim();
        newsProductNameEl.textContent = productName;
        
        // Clear the old timer
        clearTimeout(debounceTimer);
        
        if (productName.length > 2) {
            newsFeedEl.style.display = 'block';
            newsContentEl.innerHTML = `<p style="color: var(--primary-accent);">Fetching live data...</p>`;
            
            // Set a new timer to avoid spamming the API on every keystroke
            debounceTimer = setTimeout(() => {
                fetchRealTimeData(productName);
            }, 500); // Wait 500ms after user stops typing
            
        } else {
            newsFeedEl.style.display = 'none';
        }
    });

    async function fetchRealTimeData(productName) {
        try {
            const response = await fetch(`http://localhost:3000/api/data?product=${encodeURIComponent(productName)}`);
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            displayRealTimeData(data); // Call the updated display function
        } catch (error) {
            console.error('Error fetching real-time data:', error);
            newsContentEl.innerHTML = `<p style="color: var(--negative-accent);">Error loading data. Is the server running?</p>`;
        }
    }

    // This function is new and handles Finnhub/Mandi data
    function displayRealTimeData(data) {
        newsContentEl.innerHTML = ''; // Clear loading message

        if (data.type === 'finnhub') {
            // --- Display Finnhub Data ---
            const quote = data.quote;
            const news = data.news;

            // Display the quote
            if (quote && quote.c) {
                const change = quote.d.toFixed(2);
                const changePercent = quote.dp.toFixed(2);
                const changeColor = change > 0 ? 'var(--secondary-accent)' : 'var(--negative-accent)';
                
                newsContentEl.innerHTML += `
                    <div class="news-item">
                        <h4>Live Quote (${data.symbol})</h4>
                        <p style="font-size: 1.5rem; font-weight: 700; color: var(--text-primary);">
                            ₹${quote.c} 
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
                // Show first 2 articles
                news.slice(0, 2).forEach(article => {
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
            // --- Display Mandi Data ---
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
            // --- No data found ---
            newsContentEl.innerHTML = `<p>No live data found for this product. Try "Cotton", "Wheat", or "Tata Steel".</p>`;
        }
    }

    // --- 10. Advice Popup Listeners (Unchanged) ---
    setTimeout(() => { advicePopupEl.classList.add('show'); }, 3000);
    adviceCloseBtn.addEventListener('click', () => { advicePopupEl.classList.remove('show'); });

    // --- 11. Initial Run ---
    calculate();
});