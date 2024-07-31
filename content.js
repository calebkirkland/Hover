let hoveredElement = null;
let summaryPopup = null;

document.addEventListener('mouseover', handleMouseOver);
document.addEventListener('mouseout', handleMouseOut);
document.addEventListener('keydown', handleKeyDown);
document.addEventListener('keyup', handleKeyUp);

const YOUTUBE_API_KEY = 'your_youtube_api_key_here'; // Replace with your actual API key

async function fetchVideoInfo(videoId) {
  const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${YOUTUBE_API_KEY}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error('Failed to fetch video info');
  }

  const data = await response.json();
  const videoInfo = data.items[0].snippet;
  return {
    id: videoId,
    title: videoInfo.title,
    description: videoInfo.description
  };
}

function handleMouseOver(event) {
  const thumbnail = event.target.closest('ytd-thumbnail');
  if (thumbnail) {
    hoveredElement = thumbnail;
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
  if (event.ctrlKey && hoveredElement) {
    const videoId = extractVideoId(hoveredElement);
    if (videoId) {
      fetchVideoInfo(videoId);
    }
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
  const link = element.querySelector('a#thumbnail');
  if (link) {
    const url = new URL(link.href);
    return url.searchParams.get('v');
  }
  return null;
}

async function handleKeyDown(event) {
  if (event.ctrlKey && event.shiftKey && hoveredElement) {
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
      background: white;
      border: 1px solid #ccc;
      padding: 10px;
      max-width: 300px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);`;
  
    if (isLoading) {
      summaryPopup.textContent = 'Generating summary...';
    } else if (isError) {
      summaryPopup.textContent = 'Error: ' + content;
      summaryPopup.style.color = 'red';
    } else {
      summaryPopup.textContent = content;
    }
  
    const rect = hoveredElement.getBoundingClientRect();
    summaryPopup.style.left = `${rect.left}px`;
    summaryPopup.style.top = `${rect.bottom + 5}px`;
  
    document.body.appendChild(summaryPopup);
}
  