// API Key - Replace with your actual Gemini API key
const GEMINI_API_KEY = 'AIzaSyAi858JlsMf4Icm9CUC2EK7a47315tmNuY'; // Replace with your actual key

// Mobile Menu Toggle
const mobileMenu = document.querySelector('.mobile-menu');
const navLinks = document.querySelector('.nav-links');

mobileMenu.addEventListener('click', () => {
    navLinks.classList.toggle('active');
});

// Smooth Scrolling
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href').substring(1);
        const targetElement = document.getElementById(targetId);
        window.scrollTo({
            top: targetElement.offsetTop - 60,
            behavior: 'smooth'
        });
        navLinks.classList.remove('active');
    });
});

// Bottom Sheet Handling
const openDietaryBtn = document.getElementById('open-dietary');
const dietarySheet = document.getElementById('dietary-bottom-sheet');
const applyPreferencesBtn = document.getElementById('apply-preferences');

openDietaryBtn.addEventListener('click', () => {
    dietarySheet.classList.add('open');
});

applyPreferencesBtn.addEventListener('click', () => {
    dietarySheet.classList.remove('open');
});

// Hammer.js for Dragging Bottom Sheet
const hammer = new Hammer(dietarySheet);
hammer.get('pan').set({ direction: Hammer.DIRECTION_VERTICAL });

hammer.on('pan', (e) => {
    const maxTranslate = dietarySheet.offsetHeight;
    const translateY = Math.min(0, e.deltaY);
    dietarySheet.style.transform = `translateY(${translateY}px)`;
});

hammer.on('panend', (e) => {
    if (e.velocityY > 0.5 || e.deltaY > 100) {
        dietarySheet.classList.remove('open');
    } else if (e.velocityY < -0.5 || e.deltaY < -100) {
        dietarySheet.classList.add('open');
    }
    dietarySheet.style.transform = '';
});

// Ingredient Tags
const addIngredientBtn = document.getElementById('add-ingredient');
const ingredientInput = document.getElementById('ingredient-input');
const ingredientTags = document.getElementById('ingredient-tags');

addIngredientBtn.addEventListener('click', () => {
    const ingredient = ingredientInput.value.trim();
    if (ingredient) {
        const tag = document.createElement('span');
        tag.className = 'tag';
        tag.textContent = ingredient;
        const removeBtn = document.createElement('button');
        removeBtn.textContent = 'x';
        removeBtn.addEventListener('click', () => tag.remove());
        tag.appendChild(removeBtn);
        ingredientTags.appendChild(tag);
        ingredientInput.value = '';
    }
});

// Speech Recognition Setup
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

// Speech-to-Text for Ingredients
const speechIngredientBtn = document.getElementById('speech-ingredient');
if (SpeechRecognition) {
    speechIngredientBtn.addEventListener('click', () => {
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        recognition.start();

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            const tag = document.createElement('span');
            tag.className = 'tag';
            tag.textContent = transcript;
            const removeBtn = document.createElement('button');
            removeBtn.textContent = 'x';
            removeBtn.addEventListener('click', () => tag.remove());
            tag.appendChild(removeBtn);
            ingredientTags.appendChild(tag);
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            alert('Speech recognition error: ' + event.error);
        };
    });
} else {
    speechIngredientBtn.style.display = 'none';
}

// AI Meal Plan Generation with Gemini API
const generateMealBtn = document.getElementById('generate-meal');
const loadingSpinner = document.getElementById('loading-spinner');
const mealPlanResult = document.getElementById('meal-plan-result');

generateMealBtn.addEventListener('click', async () => {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
        alert('Please set your Gemini API key in the script.');
        return;
    }

    const ingredients = Array.from(document.querySelectorAll('#ingredient-tags .tag'))
        .map(tag => tag.textContent.replace('x', '').trim());
    const preferences = Array.from(document.querySelectorAll('#dietary-bottom-sheet input:checked'))
        .map(input => input.name);

    const prompt = `Generate a concise meal plan using the following ingredients: ${ingredients.join(', ')}. Consider the following dietary preferences: ${preferences.join(', ') || 'none'}. Provide the meal plan in markdown format with recipes including name, key ingredients, simple instructions, and basic nutrition info.`;

    loadingSpinner.style.display = 'block';
    mealPlanResult.innerHTML = '';
    mealPlanResult.classList.remove('visible');

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            }
        );

        if (!response.ok) throw new Error('Failed to generate meal plan');
        const data = await response.json();
        if (!data.candidates || data.candidates.length === 0) throw new Error('No content generated');

        const generatedText = data.candidates[0].content.parts[0].text;
        const htmlContent = marked.parse(generatedText);
        mealPlanResult.innerHTML = `<h3>Your Meal Plan</h3>${htmlContent}`;
        mealPlanResult.classList.add('visible');
    } catch (error) {
        mealPlanResult.innerHTML = '<p>Sorry, something went wrong. Please try again later.</p>';
        console.error('Error:', error);
    } finally {
        loadingSpinner.style.display = 'none';
    }
});

// Nutrition Search with Gemini API
const searchBtn = document.getElementById('search-btn');
const foodSearch = document.getElementById('food-search');
const nutritionGrid = document.getElementById('nutrition-grid');
const nutritionLoadingSpinner = document.getElementById('nutrition-loading-spinner');

searchBtn.addEventListener('click', async () => {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
        alert('Please set your Gemini API key in the script.');
        return;
    }

    const query = foodSearch.value.trim();
    if (query) {
        const prompt = `Provide brief nutrition information for ${query} in markdown format, focusing on calories and protein content.`;

        nutritionLoadingSpinner.style.display = 'block';
        nutritionGrid.innerHTML = '';

        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }]
                    })
                }
            );

            if (!response.ok) throw new Error('Failed to fetch nutrition info');
            const data = await response.json();
            if (!data.candidates || data.candidates.length === 0) throw new Error('No content generated');

            const generatedText = data.candidates[0].content.parts[0].text;
            const htmlContent = marked.parse(generatedText);
            nutritionGrid.innerHTML = htmlContent;
        } catch (error) {
            nutritionGrid.innerHTML = '<p>Sorry, something went wrong. Please try again later.</p>';
            console.error('Error:', error);
        } finally {
            nutritionLoadingSpinner.style.display = 'none';
        }
    }
});

// Speech-to-Text for Nutrition Search
const speechSearchBtn = document.getElementById('speech-search');
if (SpeechRecognition) {
    speechSearchBtn.addEventListener('click', () => {
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        recognition.start();

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            foodSearch.value = transcript;
            searchBtn.click();
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            alert('Speech recognition error: ' + event.error);
        };
    });
} else {
    speechSearchBtn.style.display = 'none';
}

// Admin Modal
const adminLogin = document.getElementById('admin-login');
const adminModal = document.getElementById('admin-modal');
const closeModal = document.querySelector('.close');

adminLogin.addEventListener('click', (e) => {
    e.preventDefault();
    adminModal.style.display = 'block';
});

closeModal.addEventListener('click', () => {
    adminModal.style.display = 'none';
});

window.addEventListener('click', (e) => {
    if (e.target === adminModal) {
        adminModal.style.display = 'none';
    }
});

// Placeholder for admin login
document.getElementById('admin-form').addEventListener('submit', (e) => {
    e.preventDefault();
    alert('Admin login submitted (placeholder)');
    adminModal.style.display = 'none';
});