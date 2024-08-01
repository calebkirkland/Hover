let hoveredElement = null;
let summaryPopup = null;

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

const debouncedGenerateSummary = debounce(generateSummary, 300);

document.addEventListener('mouseover', handleMouseOver);
document.addEventListener('mouseout', handleMouseOut);
document.addEventListener('keydown', handleKeyDown);
document.addEventListener('keyup', handleKeyUp);

const YOUTUBE_API_KEY = ''; // Replace with your Youtube API key

async function fetchVideoInfo(videoId) {
  const [videoData, captions] = await Promise.all([
    fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${YOUTUBE_API_KEY}`),
    fetchVideoCaptions(videoId)
  ]);
  
  const data = await videoData.json();
  const videoInfo = data.items[0].snippet;
  
  return {
    id: videoId,
    title: videoInfo.title,
    description: videoInfo.description,
    captions: captions
  };
}


async function fetchVideoCaptions(videoId) {
  const url = `https://www.googleapis.com/youtube/v3/captions?part=snippet&videoId=${videoId}&key=${YOUTUBE_API_KEY}`;
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.items && data.items.length > 0) {
    const captionTrackUrl = data.items[0].snippet.downloadUrl;
    const captionResponse = await fetch(captionTrackUrl);
    return await captionResponse.text();
  }
  return null;
}

function handleMouseOver(event) {
  const thumbnail = event.target.closest('ytd-thumbnail');
  if (thumbnail) {
    hoveredElement = thumbnail;
    if (event.ctrlKey && event.shiftKey) {
      debouncedGenerateSummary();
    }
  }
}

function handleMouseOut() {
  hoveredElement = null;
  if (summaryPopup) {
    summaryPopup.remove();
    summaryPopup = null;
  }
}

function handleKeyDown(event) {
  if (event.ctrlKey && event.shiftKey && hoveredElement) {
    debouncedGenerateSummary();
  }
}

function handleKeyUp(event) {
  if (!event.ctrlKey || !event.shiftKey) {
    if (summaryPopup) {
      summaryPopup.remove();
      summaryPopup = null;
    }
  }
}

function extractVideoId(element) {
  if (!element) return null;
  const link = element.querySelector('a#thumbnail');
  if (link) {
    const url = new URL(link.href);
    return url.searchParams.get('v');
  }
  return null;
}

async function generateSummary() {
  const videoId = extractVideoId(hoveredElement);
  if (videoId) {
    showSummaryPopup('', true); // Show loading state
    try {
      const videoInfo = await fetchVideoInfo(videoId);
      chrome.runtime.sendMessage({ action: 'summarize', videoInfo }, response => {
        if (response.summary) {
          showSummaryPopup(response.summary);
        } else if (response.error) {
          showSummaryPopup(response.error, false, true);
        }
      });
    } catch (error) {
      showSummaryPopup(error.message, false, true);
    }
  }
}

function showSummaryPopup(content, isLoading = false, isError = false) {
  if (summaryPopup) {
    summaryPopup.remove();
  }

  summaryPopup = document.createElement('div');
  summaryPopup.className = 'yt-summarizer-popup';
  summaryPopup.style.cssText = `
    position: absolute;
    z-index: 9999;
    background: #1e1e1e;
    color: #ffffff;
    border-radius: 8px;
    padding: 16px;
    max-width: 350px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    font-family: 'Roboto', Arial, sans-serif;
    font-size: 14px;
    line-height: 1.5;
    transition: all 0.3s ease;
  `;

  const header = document.createElement('div');
  header.style.cssText = `
    font-weight: bold;
    font-size: 16px;
    margin-bottom: 12px;
    color: #61dafb;
  `;
  header.textContent = 'AI Summary';

  const contentDiv = document.createElement('div');

  if (isLoading) {
    contentDiv.innerHTML = '<div class="loader"></div> Generating summary...';
  } else if (isError) {
    contentDiv.innerHTML = `<span style="color: #ff6b6b;">Error:</span> ${content}`;
  } else {
    contentDiv.textContent = content;
  }

  summaryPopup.appendChild(header);
  summaryPopup.appendChild(contentDiv);

  const rect = hoveredElement.getBoundingClientRect();
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

  summaryPopup.style.left = `${rect.left + scrollLeft}px`;
  summaryPopup.style.top = `${rect.bottom + scrollTop + 10}px`;

  document.body.appendChild(summaryPopup);

  // Add CSS for loading animation
  const style = document.createElement('style');
  style.textContent = `
    .loader {
      border: 3px solid #3d3d3d;
      border-top: 3px solid #61dafb;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      animation: spin 1s linear infinite;
      display: inline-block;
      margin-right: 10px;
      vertical-align: middle;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}
