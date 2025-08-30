document.addEventListener('DOMContentLoaded', () => {
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    const mainNavLinks = document.querySelectorAll('#main-nav a');
    const mobileNavLinks = document.querySelectorAll('#mobile-menu a');
    const sevenmailForm = document.getElementById('sevenmailForm');
    const sevenmailUsernameInput = document.getElementById('sevenmailUsername');
    const sevenmailPreview = document.getElementById('sevenmail-preview');
    const sevenmailStatusMessage = document.getElementById('sevenmail-status-message');

    const searchForm = document.getElementById('searchForm');
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    const aiSummary = document.getElementById('aiSummary');
    const aiSummaryContent = document.getElementById('aiSummaryContent');
    const aiFollowUp = document.getElementById('aiFollowUp');
    const knowledgePanel = document.getElementById('knowledgePanel');
    const knowledgePanelTitle = document.getElementById('knowledgePanelTitle');
    const knowledgePanelContent = document.getElementById('knowledgePanelContent');
    const webResults = document.getElementById('webResults');

    const knowledgeBase = {
        "Elon Musk": {
            title: "Elon Musk",
            image: "https://placehold.co/150x150/0072FF/white?text=Elon+Musk",
            description: "Elon Musk is a business magnate and investor. He is the founder, CEO, and chief engineer of SpaceX; angel investor, CEO, and product architect of Tesla, Inc.; founder of The Boring Company; co-founder of Neuralink and OpenAI; and owner of X (formerly Twitter).",
            links: [
                { text: "Tesla", url: "https://www.tesla.com" },
                { text: "SpaceX", url: "https://www.spacex.com" },
                { text: "X (formerly Twitter)", url: "https://twitter.com/elonmusk" }
            ]
        },
        "Google": {
            title: "Google",
            image: "https://placehold.co/150x150/00C6FF/white?text=Google",
            description: "Google LLC is an American multinational technology company focusing on online advertising, search engine technology, cloud computing, computer software, quantum computing, e-commerce, artificial intelligence, and consumer electronics.",
            links: [
                { text: "Google Search", url: "https://www.google.com" },
                { text: "Gmail", url: "https://mail.google.com" },
                { text: "Google Cloud", url: "https://cloud.google.com" }
            ]
        },
        "Apple": {
            title: "Apple Inc.",
            image: "https://placehold.co/150x150/0072FF/white?text=Apple",
            description: "Apple Inc. is an American multinational technology company headquartered in Cupertino, California. It designs, develops, and sells consumer electronics, computer software, and online services.",
            links: [
                { text: "Official Website", url: "https://www.apple.com" },
                { text: "iPhone", url: "https://www.apple.com/iphone/" },
                { text: "MacBook", url: "https://www.apple.com/macbook-pro/" }
            ]
        },
        "modi": {
            title: "Narendra Modi",
            image: "https://placehold.co/150x150/00C6FF/white?text=Narendra+Modi",
            description: "Narendra Damodardas Modi is an Indian politician who has been serving as the 14th and current prime minister of India since 2014.",
            links: [
                { text: "Official Website", url: "https://www.narendramodi.in/" },
                { text: "Prime Minister of India", url: "https://www.pmindia.gov.in/" },
                { text: "Twitter", url: "https://twitter.com/narendramodi" }
            ]
        },
        "The Boring Company": {
            title: "The Boring Company",
            image: "https://placehold.co/150x150/00C6FF/white?text=The+Boring+Company",
            description: "The Boring Company is an American infrastructure and tunnel construction services company founded by Elon Musk. Its mission is to solve the problem of soul-crushing traffic.",
            links: [
                { text: "Official Website", url: "https://www.boringcompany.com/" },
                { text: "Wikipedia", url: "https://en.wikipedia.org/wiki/The_Boring_Company" }
            ]
        }
    };
    
    const aiFollowUpQueries = {
        "Elon Musk": [
            "What are the main products of Tesla?",
            "Tell me more about SpaceX's Starship project.",
            "What is Neuralink's primary goal?"
        ],
        "Google": [
            "What is Google's history?",
            "What are the main services offered by Google?",
            "How does Google's search algorithm work?"
        ],
        "Apple": [
            "Who are the founders of Apple?",
            "What are Apple's most popular products?",
            "Tell me about Apple's software ecosystem."
        ],
        "modi": [
            "What are some key policies of the Modi government?",
            "What is Narendra Modi's political background?",
            "Tell me about the Digital India initiative."
        ],
        "The Boring Company": [
            "What is the main goal of The Boring Company?",
            "Where does The Boring Company operate?",
            "Who founded The Boring Company?"
        ]
    };

    // Gemini API call function with search grounding
    async function fetchAIResponse(query) {
        const apiKey = ""; // API key is provided by the server environment
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

        const systemPrompt = "You are a world-class research assistant. Provide a concise, single-paragraph summary of the key findings from the search results. Use markdown for formatting, including bold text where appropriate.";
        
        const payload = {
            contents: [{ parts: [{ text: query }] }],
            tools: [{ "google_search": {} }],
            systemInstruction: {
                parts: [{ text: systemPrompt }]
            },
        };

        // Dummy response for demonstration
        const dummyText = "This is a dummy AI summary for the query **'"+query+"'**. This response is a placeholder because the live API call failed. It shows how the search engine would display a summary and citations if the API was working correctly.";
        const dummySources = [
            { title: "Example Source 1", uri: "https://example.com/source1" },
            { title: "Example Source 2", uri: "https://example.com/source2" }
        ];

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error("API error response:", errorText);
                throw new Error(`API error: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            const candidate = result.candidates?.[0];

            if (candidate && candidate.content?.parts?.[0]?.text) {
                const text = candidate.content.parts[0].text;
                let sources = [];
                const groundingMetadata = candidate.groundingMetadata;
                if (groundingMetadata && groundingMetadata.groundingAttributions) {
                    sources = groundingMetadata.groundingAttributions
                        .map(attribution => ({
                            uri: attribution.web?.uri,
                            title: attribution.web?.title,
                        }))
                        .filter(source => source.uri && source.title);
                }
                
                return { text, sources };
            } else {
                throw new Error("Invalid API response format");
            }
        } catch (error) {
            console.error("Error fetching AI response:", error);
            return { text: dummyText, sources: dummySources };
        }
    }
    
    // Function to render AI response
    async function renderAIResponse(query) {
        aiSummary.classList.remove('hidden');
        aiSummaryContent.innerHTML = '<div class="flex items-center space-x-2 text-cyan-400"><div class="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div><span>Generating AI summary...</span></div>';
        

        const response = await fetchAIResponse(query);
        
        aiSummaryContent.innerHTML = '';
        const summaryParagraph = document.createElement('p');
        summaryParagraph.innerHTML = response.text;
        aiSummaryContent.appendChild(summaryParagraph);

        if (response.sources && response.sources.length > 0) {
            const sourcesList = document.createElement('ul');
            sourcesList.className = "list-disc list-inside text-sm text-gray-500 mt-4";
            sourcesList.innerHTML = 'Sources:';
            const uniqueSources = Array.from(new Set(response.sources.map(s => s.uri)))
                                      .map(uri => response.sources.find(s => s.uri === uri));
            uniqueSources.forEach(source => {
                const listItem = document.createElement('li');
                listItem.innerHTML = `<a href="${source.uri}" target="_blank" rel="noopener noreferrer" class="hover:underline">${source.title || source.uri}</a>`;
                sourcesList.appendChild(listItem);
            });
            aiSummaryContent.appendChild(sourcesList);
        }
        
        // Add follow-up queries based on the original search term
        aiFollowUp.innerHTML = '';
        const mainTerm = Object.keys(knowledgeBase).find(key => key.toLowerCase() === query.toLowerCase());
        if (mainTerm) {
             const followUps = aiFollowUpQueries[mainTerm];
             if (followUps && followUps.length > 0) {
                followUps.forEach(followUpText => {
                    const button = document.createElement('button');
                    button.className = "px-4 py-2 text-sm rounded-full bg-slate-700 hover:bg-slate-600 transition-colors text-gray-300";
                    button.textContent = followUpText;
                    button.addEventListener('click', () => {
                        searchInput.value = followUpText;
                        searchForm.dispatchEvent(new Event('submit'));
                    });
                    aiFollowUp.appendChild(button);
                });
             }
        }
    }

    // Function to render web results
    function renderWebResults(query) {
        webResults.innerHTML = '';

        const dummyResults = [
            { title: `About ${query}`, url: `https://example.com/about/${query.toLowerCase().replace(/\s/g, '-')}`, snippet: `Learn more about the history and details of ${query}.` },
            { title: `${query} products and services`, url: `https://example.com/${query.toLowerCase().replace(/\s/g, '-')}/products`, snippet: `A comprehensive list of products and services provided by ${query}.` },
            { title: `${query} News and Updates`, url: `https://example.com/news/${query.toLowerCase().replace(/\s/g, '-')}`, snippet: `The latest news and announcements regarding ${query}.` }
        ];
        
        dummyResults.forEach(result => {
            const resultDiv = document.createElement('div');
            resultDiv.className = "card-bg-gradient rounded-xl p-4 shadow-md hover:ring-2 hover:ring-cyan-500 transition-shadow";
            resultDiv.innerHTML = `
                <h4 class="text-xl font-semibold text-cyan-400"><a href="${result.url}" target="_blank" rel="noopener noreferrer">${result.title}</a></h4>
                <p class="text-green-500 text-sm mt-1">${result.url}</p>
                <p class="text-gray-400 mt-2">${result.snippet}</p>
            `;
            webResults.appendChild(resultDiv);
        });
    }

    // Function to handle search form submission
    function handleSearch(e) {
        e.preventDefault();
        const query = searchInput.value.trim();
        if (!query) return;

        // Clear previous results
        searchResults.innerHTML = '';

        // Add search query to conversation history
        const userQueryCard = document.createElement('div');
        userQueryCard.className = 'ai-card w-full card-bg-gradient rounded-2xl p-6 shadow-lg';
        userQueryCard.innerHTML = `<span class="text-gray-300"><b>You:</b> ${query}</span>`;
        searchResults.appendChild(userQueryCard);

        // Check for hardcoded knowledge panel entries first
        const knowledgePanelKey = Object.keys(knowledgeBase).find(key => key.toLowerCase() === query.toLowerCase());

        if (knowledgePanelKey) {
            const personData = knowledgeBase[knowledgePanelKey];
            knowledgePanelTitle.textContent = personData.title;
            knowledgePanelContent.innerHTML = `
                <div class="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-4">
                    <img src="${personData.image}" alt="${personData.title}" class="rounded-lg max-w-[150px]">
                    <p class="text-gray-400">${personData.description}</p>
                </div>
                <div class="mt-4">
                    <h5 class="font-semibold text-gray-300">Links:</h5>
                    <ul class="list-disc list-inside text-cyan-400 mt-2 space-y-1">
                        ${personData.links.map(link => `<li><a href="${link.url}" target="_blank" rel="noopener noreferrer" class="hover:underline">${link.text}</a></li>`).join('')}
                    </ul>
                </div>
            `;
            knowledgePanel.classList.remove('hidden');
        } else {
            knowledgePanel.classList.add('hidden');
        }
        
        // Show AI summary and web results
        renderAIResponse(query);
        renderWebResults(query);
    }

    // --- Event Listeners ---
    
    // Toggle mobile menu visibility
    mobileMenuButton.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
    });

    // Smooth scroll for navigation links
    function setupSmoothScroll(links) {
        links.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href');
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    window.scrollTo({
                        top: targetElement.offsetTop,
                        behavior: 'smooth'
                    });
                }
                // Close mobile menu after clicking a link
                if (!mobileMenu.classList.contains('hidden')) {
                    mobileMenu.classList.add('hidden');
                }
            });
        });
    }

    setupSmoothScroll(mainNavLinks);
    setupSmoothScroll(mobileNavLinks);

    // 7mail form event listener
    sevenmailForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = sevenmailUsernameInput.value.trim();
        const password = sevenmailPasswordInput.value.trim();
        
        if (username && password) {
            sevenmailStatusMessage.textContent = "A permanent mail account has been created for kanishk@7mail.com.";
            sevenmailStatusMessage.classList.remove('hidden');
            sevenmailForm.reset();
            sevenmailPreview.textContent = 'username@7mail.com';
        } else {
            sevenmailStatusMessage.classList.remove('hidden');
            sevenmailStatusMessage.textContent = 'Please enter a username and password.';
            sevenmailStatusMessage.classList.add('text-red-500');
            sevenmailStatusMessage.classList.remove('text-green-500');
        }
    });

    // 7mail username input listener
    sevenmailUsernameInput.addEventListener('input', (e) => {
        const username = e.target.value.trim();
        if (username) {
            sevenmailPreview.textContent = `${username}@7mail.com`;
        } else {
            sevenmailPreview.textContent = 'username@7mail.com';
        }
        sevenmailStatusMessage.classList.add('hidden');
    });

    // Search form listener
    searchForm.addEventListener('submit', handleSearch);
});
