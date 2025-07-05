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

// NASA Image and Video Library API endpoint
const NASA_IMAGE_API_URL = 'https://images-api.nasa.gov/search';

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
// Show the gallery with 9 items, one per date from start to end, randomly chosen from APOD and NASA Library for that date
function showGallery(items) {
  if (!items.length) {
    showMessage('No entries found for this date range.');
    return;
  }
  // Helper to get all dates between start and end (inclusive)
  function getDateArray(start, end) {
    const arr = [];
    let dt = new Date(start);
    const endDt = new Date(end);
    while (dt <= endDt) {
      arr.push(dt.toISOString().slice(0, 10));
      dt.setDate(dt.getDate() + 1);
    }
    return arr;
  }
  // Group items by date
  const itemsByDate = {};
  items.forEach(item => {
    if (!item.date) return;
    if (!itemsByDate[item.date]) itemsByDate[item.date] = [];
    itemsByDate[item.date].push(item);
  });
  // Get the selected date range from the inputs
  const start = startInput.value;
  const end = endInput.value;
  const dateList = getDateArray(start, end);
  // For each date, randomly select one item if available
  const randomItems = dateList
    .map(date => {
      const arr = itemsByDate[date];
      if (arr && arr.length > 0) {
        return arr[Math.floor(Math.random() * arr.length)];
      } else {
        return null;
      }
    })
    .filter(Boolean)
    .slice(0, 9);
  gallery.innerHTML = randomItems.map(item => {
    if (item.media_type === 'image') {
      return `
        <article class="gallery-item" tabindex="0" aria-labelledby="title-${item.date}"
          data-title="${item.title.replace(/&/g, '&amp;').replace(/"/g, '&quot;')}"
          data-date="${item.date}"
          data-img="${item.url}"
          data-explanation="${item.explanation.replace(/&/g, '&amp;').replace(/"/g, '&quot;')}">
          <img src="${item.url}" alt="${item.title}" class="gallery-thumb" />
          <h2 id="title-${item.date}" class="gallery-title">${item.title}</h2>
          <p>${item.date}</p>
        </article>
      `;
    } else if (item.media_type === 'video') {
      let videoEmbed = '';
      let thumbUrl = item.url;
      if (item.url.includes('youtube.com') || item.url.includes('youtu.be')) {
        let videoId = '';
        const ytMatch = item.url.match(/(?:youtube\.com\/.*[?&]v=|youtu\.be\/)([\w-]+)/);
        if (ytMatch) videoId = ytMatch[1];
        if (videoId) {
          videoEmbed = `<iframe width="100%" height="200" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen title="${item.title}"></iframe>`;
          thumbUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
        }
      }
      if (!videoEmbed) {
        videoEmbed = `<a href="${item.url}" target="_blank" rel="noopener" class="video-link">Watch Video</a>`;
      }
      return `
        <article class="gallery-item" tabindex="0" aria-labelledby="title-${item.date}"
          data-title="${item.title.replace(/&/g, '&amp;').replace(/"/g, '&quot;')}"
          data-date="${item.date}"
          data-img="${thumbUrl}"
          data-explanation="${item.explanation.replace(/&/g, '&amp;').replace(/"/g, '&quot;')}">
          <div class="video-thumb">${videoEmbed}</div>
          <h2 id="title-${item.date}" class="gallery-title">${item.title}</h2>
          <p>${item.date}</p>
        </article>
      `;
    } else {
      return '';
    }
  }).join('');
}

// Fetch both APOD and NASA Image and Video Library images for the selected date range and set background
async function fetchImages(start, end) {
  showLoading();
  try {
    // Fetch APOD images
    const apodUrl = `${NASA_APOD_API_URL}?api_key=${NASA_API_KEY}&start_date=${start}&end_date=${end}`;
    const apodRes = await fetch(apodUrl);
    if (!apodRes.ok) throw new Error('Failed to fetch APOD images.');
    const apodData = await apodRes.json();
    const apodItems = Array.isArray(apodData) ? apodData : [apodData];

    // Set background image to the first APOD image (if available)
    const firstImage = apodItems.find(item => item.media_type === 'image');
    if (firstImage && firstImage.url) {
      document.body.style.backgroundImage = `url('${firstImage.url}')`;
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundPosition = 'center';
      document.body.style.backgroundRepeat = 'no-repeat';
    } else {
      document.body.style.backgroundImage = '';
    }

    // Fetch NASA Image and Video Library images (filter by exact date range)
    // We'll fetch results and filter them by date between start and end
    const imageLibUrl = `${NASA_IMAGE_API_URL}?q=space&media_type=image,video`;
    const imageLibRes = await fetch(imageLibUrl);
    let imageLibItems = [];
    if (imageLibRes.ok) {
      const imageLibData = await imageLibRes.json();
      const items = (imageLibData.collection && imageLibData.collection.items) ? imageLibData.collection.items : [];
      // Filter items by date range
      imageLibItems = items.map(item => {
        const dataItem = item.data[0];
        const links = item.links || [];
        const media_type = dataItem.media_type;
        let url = '';
        if (media_type === 'image') {
          const imgLink = links.find(l => l.render === 'image');
          url = imgLink ? imgLink.href : '';
        } else if (media_type === 'video') {
          const vidLink = links.find(l => l.render === 'image');
          url = vidLink ? vidLink.href : '';
        }
        return {
          title: dataItem.title || 'NASA Media',
          date: dataItem.date_created ? dataItem.date_created.split('T')[0] : '',
          url: url,
          explanation: dataItem.description || '',
          media_type: media_type
        };
      })
      // Only keep items within the selected date range
      .filter(item => {
        if (!item.date) return false;
        return item.date >= start && item.date <= end && item.url;
      });
    }

    // Combine APOD and NASA Image Library items
    const allItems = [...apodItems, ...imageLibItems];
    showGallery(allItems);
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

// Show modal with large image (for images), or just info for videos, full title, date, and explanation
function openModal({ title, date, img, explanation }) {
  // Find the item in the current gallery by date and title
  const item = Array.from(document.querySelectorAll('.gallery-item')).find(el =>
    el.dataset.title === title && el.dataset.date === date
  );
  let mediaType = 'image';
  if (item) {
    // Try to detect if this is a video card
    const videoThumb = item.querySelector('.video-thumb');
    if (videoThumb) mediaType = 'video';
  }
  const modalImg = modal.querySelector('.modal-img');
  if (mediaType === 'video') {
    // Hide the image for video modals
    modalImg.style.display = 'none';
  } else {
    // Show the image for image modals
    modalImg.style.display = '';
    modalImg.src = img;
    modalImg.alt = title;
  }
  // Set the full title
  modal.querySelector('.modal-title').textContent = title;
  // Set the date
  modal.querySelector('.modal-date').textContent = date;
  // Set the explanation text
  modal.querySelector('.modal-explanation').textContent = explanation;
  // Show the modal
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
  // Get all details from data attributes
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
