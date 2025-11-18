// --- Helper for 3-part Date Input ---
function setupDateInputs() {
    const day = document.getElementById('date-day');
    const month = document.getElementById('date-month');
    const year = document.getElementById('date-year');
    const inputs = [day, month, year];
    
    inputs.forEach((input, index) => {
        // 1. AUTO-JUMP to next input
        input.addEventListener('input', (e) => {
            const value = e.target.value;
            const maxLength = parseInt(e.target.maxLength, 10);
            if (value.length >= maxLength && index < inputs.length - 1) {
                inputs[index + 1].focus();
            }
        });

        // 2. NUMBERS-ONLY input
        input.addEventListener('keydown', (e) => {
            // Allow: backspace, tab, delete, arrows, and home/end
            if ([8, 9, 46, 37, 39, 35, 36].includes(e.keyCode)) {
                return;
            }
            // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
            if (e.ctrlKey || e.metaKey) {
                 if (['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) {
                    return;
                 }
            }
            // Ensure that it is a number and stop the keypress
            if (e.key.length === 1 && (e.key < '0' || e.key > '9')) {
                e.preventDefault();
            }
        });
    });
}

/**
 * Sets the 3-part date input to today's date
 */
function setDefaultDate() {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0'); // +1 because months are 0-indexed
    const year = today.getFullYear();
    
    document.getElementById("date-day").value = day;
    document.getElementById("date-month").value = month;
    document.getElementById("date-year").value = year;
}


// Wait for the DOM to be fully loaded
document.addEventListener("DOMContentLoaded", () => {
    
    // --- Get Elements ---
    const form = document.getElementById("data-entry-form");
    const formMessage = document.getElementById("form-message");
    const timeRangeSelect = document.getElementById("time-range");
    const chartTypeSelect = document.getElementById("chart-type");
    const clearDataBtn = document.getElementById("clear-data-btn");
    const ctx = document.getElementById('analytics-chart').getContext('2d');

    // Stats Elements
    const totalRevenueEl = document.getElementById("total-revenue");
    const totalExpenditureEl = document.getElementById("total-expenditure");
    const netProfitEl = document.getElementById("net-profit");
    const avgRevenueEl = document.getElementById("avg-revenue");
    const avgExpenditureEl = document.getElementById("avg-expenditure");

    // AI Advice Elements
    const getAdviceBtn = document.getElementById("get-advice-btn");
    const adviceContainer = document.getElementById("advice-container");
    const adviceTextEl = document.getElementById("advice-text");

    // Global chart variable
    let myChart;

    // --- Database Functions (using localStorage) ---
    
    /**
     * Gets all data from localStorage, parses it, and returns it.
     * @returns {Array} An array of data objects { date, revenue, expenditure }
     */
    function getAllData() {
        const data = localStorage.getItem('businessData');
        return data ? JSON.parse(data) : [];
    }

    /**
     * Saves a new data entry.
     * @param {string} date - The date string (YYYY-MM-DD)
     * @param {number} revenue - The revenue amount
     * @param {number} expenditure - The expenditure amount
     */
    function saveData(date, revenue, expenditure) {
        let data = getAllData();
        
        // Check if data for this date already exists
        const existingEntryIndex = data.findIndex(entry => entry.date === date);

        if (existingEntryIndex > -1) {
            // Update existing entry
            data[existingEntryIndex] = { date, revenue, expenditure };
            formMessage.textContent = `Data for ${date} has been updated!`;
        } else {
            // Add new entry
            data.push({ date, revenue, expenditure });
            formMessage.textContent = `Data for ${date} has been saved!`;
        }

        // Sort data by date (important for the chart)
        data.sort((a, b) => new Date(a.date) - new Date(b.date));

        localStorage.setItem('businessData', JSON.stringify(data));
        
        formMessage.style.display = "block";
        setTimeout(() => { formMessage.style.display = "none"; }, 3000);
    }

    // --- Form Handling ---
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        
        // --- DATE INPUT LOGIC MODIFIED ---
        const day = document.getElementById("date-day").value.padStart(2, '0');
        const month = document.getElementById("date-month").value.padStart(2, '0');
        const year = document.getElementById("date-year").value;
        
        // Combine into YYYY-MM-DD format for saving
        const date = `${year}-${month}-${day}`;
        // --- END OF MODIFICATION ---

        const revenue = parseFloat(document.getElementById("revenue").value);
        const expenditure = parseFloat(document.getElementById("expenditure").value);

        if (!year || !month || !day || year.length < 4 || day.length < 2 || month.length < 2) {
            alert("Please enter a valid date in DD/MM/YYYY format.");
            return;
        }

        saveData(date, revenue, expenditure);
        
        // Reset form fields, but keep today's date
        setDefaultDate();
        document.getElementById("revenue").value = '';
        document.getElementById("expenditure").value = '';
        
        // Update the dashboard with the new data
        updateDashboard();
    });

    // --- Clear Data Button ---
    clearDataBtn.addEventListener("click", () => {
        if (confirm("Are you sure you want to delete ALL data? This cannot be undone.")) {
            localStorage.removeItem('businessData');
            updateDashboard();
        }
    });

    // --- Event Listeners for Filters ---
    timeRangeSelect.addEventListener("change", updateDashboard);
    chartTypeSelect.addEventListener("change", updateDashboard);


    // --- Dashboard & Chart Logic ---

    /**
     * Main function to update stats and chart
     */
    function updateDashboard() {
        const days = parseInt(timeRangeSelect.value);
        const allData = getAllData();

        // 1. Filter data for the selected time range
        const { labels, revenueData, expenditureData, filteredEntries } = prepareChartData(allData, days);
        
        // 2. Update the chart
        renderChart(labels, revenueData, expenditureData);

        // 3. Update the summary statistics
        updateStats(filteredEntries);
    }

    /**
     * Prepares data for the chart and stats
     * @param {Array} allData - The complete data array
     * @param {number} days - The number of days to look back
     * @returns {Object} An object with labels, data arrays, and filtered entries
     */
    function prepareChartData(allData, days) {
        const labels = [];
        const revenueData = [];
        const expenditureData = [];
        const filteredEntries = [];

        const today = new Date();
        const startDate = new Date();
        startDate.setDate(today.getDate() - (days - 1)); // Go back (days - 1) to include today

        // Create a map of existing data for quick lookup
        const dataMap = new Map();
        allData.forEach(entry => {
            dataMap.set(entry.date, entry);
        });

        // Loop from the start date to today
        for (let i = 0; i < days; i++) {
            const currentDay = new Date(startDate);
            currentDay.setDate(startDate.getDate() + i);
            
            const dateString = currentDay.toISOString().split('T')[0]; // "YYYY-MM-DD"
            
            // Format for chart label (e.g., "Nov-17")
            const label = currentDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            labels.push(label);

            if (dataMap.has(dateString)) {
                const entry = dataMap.get(dateString);
                revenueData.push(entry.revenue);
                expenditureData.push(entry.expenditure);
                filteredEntries.push(entry);
            } else {
                // If no data for this day, push 0
                revenueData.push(0);
                expenditureData.push(0);
            }
        }
        
        return { labels, revenueData, expenditureData, filteredEntries };
    }

    /**
     * Renders the chart on the canvas based on user selection
     */
    function renderChart(labels, revenueData, expenditureData) {
        if (myChart) {
            myChart.destroy(); // Destroy the old chart before drawing a new one
        }

        const chartType = chartTypeSelect.value;
        let chartConfig = {
            type: 'bar', // Default type, will be overridden by 'line' if needed
            data: {
                labels: labels,
                datasets: []
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) { return '₹' + value; }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ₹${context.parsed.y}`;
                            }
                        }
                    }
                }
            }
        };

        if (chartType === 'line') {
            chartConfig.type = 'line';
            chartConfig.data.datasets.push(
                {
                    label: 'Revenue',
                    data: revenueData,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    tension: 0.1,
                    fill: false
                },
                {
                    label: 'Expenditure',
                    data: expenditureData,
                    borderColor: 'rgba(255, 99, 132, 1)',
                    backgroundColor: 'rgba(255, 99, 132, 1)',
                    tension: 0.1,
                    fill: false
                }
            );
        } else if (chartType === 'bar') {
            chartConfig.type = 'bar';
            chartConfig.data.datasets.push(
                {
                    label: 'Revenue',
                    data: revenueData,
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Expenditure',
                    data: expenditureData,
                    backgroundColor: 'rgba(255, 99, 132, 0.6)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                }
            );
        } else { // 'combined'
            chartConfig.type = 'bar';
            chartConfig.data.datasets.push(
                {
                    label: 'Revenue (Bar)',
                    data: revenueData,
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1,
                    order: 2
                },
                {
                    label: 'Expenditure (Line)',
                    data: expenditureData,
                    type: 'line', // Override to be a line chart
                    fill: false,
                    borderColor: 'rgba(255, 99, 132, 1)',
                    backgroundColor: 'rgba(255, 99, 132, 1)',
                    tension: 0.1,
                    order: 1 // Draw line on top
                }
            );
        }

        myChart = new Chart(ctx, chartConfig);
    }

    /**
     * Helper function to get stats
     */
    function calculateStats(filteredEntries) {
        const totalRevenue = filteredEntries.reduce((sum, entry) => sum + entry.revenue, 0);
        const totalExpenditure = filteredEntries.reduce((sum, entry) => sum + entry.expenditure, 0);
        const netProfit = totalRevenue - totalExpenditure;
        const numEntries = filteredEntries.length;
        const avgRevenue = numEntries > 0 ? totalRevenue / numEntries : 0;
        const avgExpenditure = numEntries > 0 ? totalExpenditure / numEntries : 0;
        
        return { totalRevenue, totalExpenditure, netProfit, avgRevenue, avgExpenditure };
    }

    /**
     * Calculates and displays the summary statistics
     * @param {Array} filteredEntries - The data entries for the selected period
     */
    function updateStats(filteredEntries) {
        // Use the new helper function to get the numbers
        const { 
            totalRevenue, 
            totalExpenditure, 
            netProfit, 
            avgRevenue, 
            avgExpenditure 
        } = calculateStats(filteredEntries);
        
        // Update the stats box
        document.getElementById("stats-container").querySelector("h3").textContent = `Summary (Last ${timeRangeSelect.value} Days)`;

        totalRevenueEl.textContent = `₹${totalRevenue.toFixed(2)}`;
        totalExpenditureEl.textContent = `₹${totalExpenditure.toFixed(2)}`;
        netProfitEl.textContent = `₹${netProfit.toFixed(2)}`;
        avgRevenueEl.textContent = `₹${avgRevenue.toFixed(2)}`;
        avgExpenditureEl.textContent = `₹${avgExpenditure.toFixed(2)}`;

        // Change color of net profit
        netProfitEl.style.color = netProfit >= 0 ? '#48bb78' : '#e53e3e';
    }


    /**
     * This function will call our backend to get AI advice
     */
    async function fetchAIAdvice() {
        adviceContainer.style.display = "block";
        adviceTextEl.textContent = "Loading... (This may take a moment)";
        getAdviceBtn.disabled = true;

        try {
            // --- 1. Get Latest News ---
            // We call our *own* server's news route
            const newsResponse = await fetch('http://localhost:3000/api/news');
            const newsData = await newsResponse.json();
            
            // We only need the first 5 articles for the prompt
            const top5Articles = newsData.articles ? newsData.articles.slice(0, 5) : [];

            // --- 2. Get Business Data ---
            // We get this from our existing stats function
            const days = parseInt(timeRangeSelect.value);
            const allData = getAllData();
            const { filteredEntries } = prepareChartData(allData, days);
            const stats = calculateStats(filteredEntries);

            // --- 3. Call the new /api/advice route ---
            const adviceResponse = await fetch('http://localhost:3000/api/advice', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    newsArticles: top5Articles,
                    businessData: stats
                }),
            });

            if (!adviceResponse.ok) {
                const err = await adviceResponse.json();
                throw new Error(err.error || 'Failed to get advice from server.');
            }

            const adviceResult = await adviceResponse.json();
            // Use replace to format newlines for HTML
            adviceTextEl.innerHTML = adviceResult.advice.replace(/\n/g, '<br>');

        } catch (error) {
            console.error("Error fetching AI advice:", error);
            adviceTextEl.textContent = `Sorry, an error occurred: ${error.message}`;
        } finally {
            getAdviceBtn.disabled = false;
        }
    }

    // --- Add the event listener for the new button ---
    getAdviceBtn.addEventListener("click", fetchAIAdvice);


    // --- Initial Load ---
    
    // --- DATE LOGIC MODIFIED ---
    // Set default date to today using our new function
    setDefaultDate();
    // Set up the date input listeners
    setupDateInputs();
    // --- END OF MODIFICATION ---

    // Load the dashboard on page load
    updateDashboard();

});