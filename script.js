// Wait for the DOM to be fully loaded before running our scripts
document.addEventListener("DOMContentLoaded", () => {

    // --- Modal Functionality ---
    
    const modal = document.getElementById("authModal");
    const loginBtn = document.getElementById("loginBtn");
    const signupBtn = document.getElementById("signupBtn");
    const closeBtn = document.querySelector(".close-btn");
    
    const modalTitle = document.getElementById("modal-title");
    const nameField = document.getElementById("name-field");
    const formSubmitBtn = document.getElementById("form-submit-btn");
    const authForm = document.getElementById("auth-form");

    // Function to open the modal
    const openModal = (mode) => {
        if (mode === 'login') {
            modalTitle.textContent = "Login";
            nameField.classList.add("hidden"); // Hide name field
            formSubmitBtn.textContent = "Login";
        } else if (mode === 'signup') {
            modalTitle.textContent = "Sign Up";
            nameField.classList.remove("hidden"); // Show name field
            formSubmitBtn.textContent = "Sign Up";
        }
        modal.style.display = "block";
    };

    // Function to close the modal
    const closeModal = () => {
        modal.style.display = "none";
    };

    // Event Listeners for modal
    loginBtn.onclick = () => openModal('login');
    signupBtn.onclick = () => openModal('signup');
    closeBtn.onclick = closeModal;

    // Close modal if user clicks outside of the modal content
    window.onclick = (event) => {
        if (event.target == modal) {
            closeModal();
        }
    };

    // Handle the form submission (this is a demo)
    authForm.onsubmit = (event) => {
        event.preventDefault(); // Stop the form from reloading the page
        alert("Form submitted! (This is a demo. No data is being saved.)");
        closeModal();
    };


    // --- News API Fetching ---
    
    // We fetch from OUR OWN server, not from the news API
    const apiUrl = 'http://localhost:3000/api/news'; 

    const newsContainer = document.getElementById("news-container");
    const loadingMessage = document.getElementById("loading-message");

    // Function to fetch and display the news
    async function fetchNews() {
        try {
            const response = await fetch(apiUrl);
            
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || `HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();

            // Clear the "loading" message
            loadingMessage.style.display = "none";

            if (data.articles && data.articles.length > 0) {
                displayNews(data.articles);
            } else {
                newsContainer.innerHTML = "<p>No financial news found for Karnataka or Maharashtra at this time.</p>";
            }

        } catch (error) {
            console.error("Error fetching news:", error);
            // Display a user-friendly error message
            loadingMessage.style.display = "none";
            newsContainer.innerHTML = `<p style="color: red;">Error loading news. Please check your API key in the .env file and restart the server. (${error.message})</p>`;
        }
    }

    // Function to take the news data and create HTML elements
    function displayNews(articles) {
        // Clear the container first (in case it had a message)
        newsContainer.innerHTML = ""; 

        articles.forEach(article => {
            // Create the separate DIV for each article
            const articleDiv = document.createElement("div");
            articleDiv.className = "news-article"; // Apply our CSS class

            // Create the headline (H3)
            const title = document.createElement("h3");
            title.textContent = article.title;

            // Create the source and date info
            const source = document.createElement("span");
            source.className = "source";
            const pubDate = new Date(article.publishedAt).toLocaleDateString();
            source.textContent = `Source: ${article.source.name} | Published: ${pubDate}`;
            
            // Create the description
            const description = document.createElement("p");
            description.textContent = article.description || "No description available."; // Use fallback text

            // Create the "Read More" link
            const link = document.createElement("a");
            link.href = article.url;
            link.textContent = "Read Full Article";
            link.target = "_blank"; // Open in a new tab
            link.rel = "noopener noreferrer";

            // Add all the new elements into the article's div
            articleDiv.appendChild(title);
            articleDiv.appendChild(source);
            articleDiv.appendChild(description);
            articleDiv.appendChild(link);

            // Add the article's div to the main news container
            newsContainer.appendChild(articleDiv);
        });
    }

    // Call the function to fetch news when the page loads
    fetchNews();

});