// Find our date picker inputs on the page
const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');

// Call the setupDateInputs function from dateRange.js
// This sets up the date pickers to:
// - Default to a range of 9 days (from 9 days ago to today)
// - Restrict dates to NASA's image archive (starting from 1995)
setupDateInputs(startInput, endInput);

// Get references to the button and gallery
const getImagesBtn = document.querySelector('.filters button');
const gallery = document.getElementById('gallery');

// NASA APOD API endpoint and key
const NASA_API_URL = 'https://api.nasa.gov/planetary/apod';
const NASA_API_KEY = 'DEMO_KEY'; // Replace with your own key for more requests

// Show a loading message in the gallery
function showLoading() {
  gallery.innerHTML = `
    <div class="placeholder">
      <div class="placeholder-icon">🔄</div>
      <p>Loading space photos…</p>
    </div>
  `;
}

// Show a message if no images are found or an error occurs
function showMessage(msg) {
  gallery.innerHTML = `
    <div class="placeholder">
      <div class="placeholder-icon">🚫</div>
      <p>${msg}</p>
    </div>
  `;
}

// Create gallery HTML from NASA API data
function showGallery(items) {
  // Only show images (not videos)
  const images = items.filter(item => item.media_type === 'image');
  if (images.length === 0) {
    showMessage('No images found for this date range.');
    return;
  }
  gallery.innerHTML = images.map(item => `
    <div class="gallery-item" tabindex="0" data-title="${item.title}" data-date="${item.date}" data-img="${item.url}" data-explanation="${item.explanation}">
      <img src="${item.url}" alt="${item.title}" />
      <h3>${item.title}</h3>
      <p>${item.date}</p>
    </div>
  `).join('');
}

// Fetch images from NASA API for the selected date range
async function fetchImages(start, end) {
  showLoading();
  try {
    const url = `${NASA_API_URL}?api_key=${NASA_API_KEY}&start_date=${start}&end_date=${end}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch images.');
    const data = await res.json();
    showGallery(Array.isArray(data) ? data : [data]);
  } catch (err) {
    showMessage('Could not load images. Please try again.');
  }
}

// Listen for button click to fetch and show images
getImagesBtn.addEventListener('click', () => {
  const start = startInput.value;
  const end = endInput.value;
  if (!start || !end) {
    showMessage('Please select a start and end date.');
    return;
  }
  fetchImages(start, end);
});

// Modal logic
function createModal() {
  // Create modal elements
  const modal = document.createElement('div');
  modal.id = 'modal';
  modal.style.display = 'none';
  modal.innerHTML = `
    <div class="modal-content">
      <span class="modal-close" tabindex="0">&times;</span>
      <img class="modal-img" src="" alt="Large NASA" />
      <h2 class="modal-title"></h2>
      <p class="modal-date"></p>
      <p class="modal-explanation"></p>
    </div>
  `;
  document.body.appendChild(modal);
  return modal;
}

const modal = createModal();

// Show modal with image details
function openModal({ title, date, img, explanation }) {
  modal.querySelector('.modal-img').src = img;
  modal.querySelector('.modal-img').alt = title;
  modal.querySelector('.modal-title').textContent = title;
  modal.querySelector('.modal-date').textContent = date;
  modal.querySelector('.modal-explanation').textContent = explanation;
  modal.style.display = 'flex';
}

// Close modal
function closeModal() {
  modal.style.display = 'none';
}

// Listen for gallery item clicks
gallery.addEventListener('click', (e) => {
  const item = e.target.closest('.gallery-item');
  if (!item) return;
  openModal({
    title: item.dataset.title,
    date: item.dataset.date,
    img: item.dataset.img,
    explanation: item.dataset.explanation
  });
});

// Close modal on X or outside click
modal.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-close') || e.target === modal) {
    closeModal();
  }
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});
