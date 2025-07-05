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
const NASA_APOD_API_URL = 'https://api.nasa.gov/planetary/apod';
const NASA_API_KEY = '6j2reLrAdel8tIWILpVWR7yGi6deLOhHRW0g6fbe'; // User's personal NASA API key

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

// Fun "Did You Know?" space facts
const spaceFacts = [
  "Did you know? One million Earths could fit inside the Sun!",
  "Did you know? A day on Venus is longer than a year on Venus.",
  "Did you know? Neutron stars can spin at a rate of 600 rotations per second.",
  "Did you know? The footprints on the Moon will be there for millions of years.",
  "Did you know? Jupiter has 95 known moons as of 2025!",
  "Did you know? The hottest planet in our solar system is Venus.",
  "Did you know? Space is completely silent—there’s no air for sound to travel.",
  "Did you know? The largest volcano in the solar system is on Mars: Olympus Mons.",
  "Did you know? Saturn could float in water because it’s mostly made of gas.",
  "Did you know? The Milky Way galaxy will collide with Andromeda in about 4 billion years."
];

function showRandomFact() {
  const factDiv = document.getElementById('space-fact');
  if (!factDiv) return;
  const randomIndex = Math.floor(Math.random() * spaceFacts.length);
  factDiv.textContent = spaceFacts[randomIndex];
}
showRandomFact();

// Create gallery HTML from NASA APOD data, supporting images and videos
function showGallery(items) {
  if (!items.length) {
    showMessage('No entries found for this date range.');
    return;
  }
  gallery.innerHTML = items.map(item => {
    if (item.media_type === 'image') {
      // Image entry
      return `
        <article class="gallery-item" tabindex="0" aria-labelledby="title-${item.date}">
          <img src="${item.url}" alt="${item.title}" />
          <h2 id="title-${item.date}" class="gallery-title">${item.title}</h2>
          <p>${item.date}</p>
        </article>
      `;
    } else if (item.media_type === 'video') {
      // Video entry (YouTube or other)
      let videoEmbed = '';
      if (item.url.includes('youtube.com') || item.url.includes('youtu.be')) {
        // Extract YouTube video ID
        let videoId = '';
        const ytMatch = item.url.match(/(?:youtube\.com\/.*[?&]v=|youtu\.be\/)([\w-]+)/);
        if (ytMatch) videoId = ytMatch[1];
        if (videoId) {
          videoEmbed = `<iframe width="100%" height="200" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen title="${item.title}"></iframe>`;
        }
      }
      if (!videoEmbed) {
        videoEmbed = `<a href="${item.url}" target="_blank" rel="noopener" class="video-link">Watch Video</a>`;
      }
      return `
        <article class="gallery-item" tabindex="0" aria-labelledby="title-${item.date}">
          <div class="video-thumb">${videoEmbed}</div>
          <h2 id="title-${item.date}" class="gallery-title">${item.title}</h2>
          <p>${item.date}</p>
        </article>
      `;
    } else {
      // Unknown media type
      return '';
    }
  }).join('');
}

// Fetch APOD images for the selected date range and set background
async function fetchImages(start, end) {
  showLoading();
  try {
    const url = `${NASA_APOD_API_URL}?api_key=${NASA_API_KEY}&start_date=${start}&end_date=${end}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch images.');
    const data = await res.json();
    const items = Array.isArray(data) ? data : [data];
    // Set background image to the first APOD image (if available)
    const firstImage = items.find(item => item.media_type === 'image');
    if (firstImage && firstImage.url) {
      document.body.style.backgroundImage = `url('${firstImage.url}')`;
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundPosition = 'center';
      document.body.style.backgroundRepeat = 'no-repeat';
    } else {
      document.body.style.backgroundImage = '';
    }
    showGallery(items);
  } catch (err) {
    showMessage('Could not load images. Please try again.');
    document.body.style.backgroundImage = '';
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
