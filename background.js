const HUGGING_FACE_API_URL = 'https://api-inference.huggingface.co/models/facebook/bart-large-cnn';
const HUGGING_FACE_API_KEY = 'your_api_key_here'; // Replace with your actual API key


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'summarize') {
      chrome.storage.sync.get(['enabled', 'summaryLength'], (result) => {
        if (result.enabled) {
          summarizeVideo(request.videoInfo, result.summaryLength)
            .then(summary => sendResponse({ summary }))
            .catch(error => sendResponse({ error: error.message }));
        } else {
          sendResponse({ error: 'Summarizer is disabled' });
        }
      });
      return true;
    }
  });

async function summarizeVideo(videoInfo) {
  const maxLength = length === 'short' ? 50 : length === 'long' ? 200 : 100;
  const prompt = `Summarize the following YouTube video in about ${maxLength} words:\nTitle: ${videoInfo.title}\nDescription: ${videoInfo.description}`;
  
  const response = await fetch(HUGGING_FACE_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${HUGGING_FACE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ inputs: prompt })
  });

  if (!response.ok) {
    throw new Error('Failed to generate summary');
  }

  const result = await response.json();
  return result[0].summary_text;
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'summarize') {
    // Call AI summarization service (placeholder)
    summarizeVideo(request.videoInfo)
      .then(summary => sendResponse({ summary }))
      .catch(error => sendResponse({ error: error.message }));
    return true; // Indicates async response
  }
});

async function summarizeVideo(videoInfo) {
  // Placeholder for AI summarization logic
  // In a real implementation, this would call an AI service
  return `This is a summary of "${videoInfo.title}": ${videoInfo.description.substring(0, 100)}...`;
}