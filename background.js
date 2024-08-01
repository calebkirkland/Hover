const HUGGING_FACE_API_URL = 'https://api-inference.huggingface.co/models/facebook/bart-large-cnn';
const HUGGING_FACE_API_KEY = ''; // Replace with your HuggingFace API key


// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//     if (request.action === 'summarize') {
//       chrome.storage.sync.get(['enabled', 'summaryLength'], (result) => {
//         if (result.enabled) {
//           summarizeVideo(request.videoInfo, result.summaryLength)
//             .then(summary => sendResponse({ summary }))
//             .catch(error => sendResponse({ error: error.message }));
//         } else {
//           sendResponse({ error: 'Summarizer is disabled' });
//         }
//       });
//       return true;
//     }
//   });

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'summarize') {
    // Always treat the summarizer as enabled
    summarizeVideo(request.videoInfo, 'medium')
      .then(summary => sendResponse({ summary }))
      .catch(error => sendResponse({ error: error.message }));
    return true; // Indicates async response
  }
});

async function summarizeVideo(videoInfo, length) {
  const maxLength = length === 'short' ? 50 : length === 'long' ? 200 : 100;
  const prompt = `Summarize the following YouTube video in about ${maxLength} characters:\nTitle: ${videoInfo.title}\nDescription: ${videoInfo.description}`;
  
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
  let summary = result[0].summary_text;
  
  // Remove the prompt and title from the summary
  const promptIndex = summary.indexOf('Summarize the following YouTube video');
  if (promptIndex !== -1) {
    summary = summary.substring(0, promptIndex);
  }
  
  // Remove the title if it's at the beginning of the summary
  const titleIndex = summary.indexOf(videoInfo.title);
  if (titleIndex === 0) {
    summary = summary.substring(videoInfo.title.length).trim();
  }
  
  return summary.trim();
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
