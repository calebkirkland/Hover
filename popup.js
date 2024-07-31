// Add any settings logic here
document.addEventListener('DOMContentLoaded', () => {
    const enableSummarizer = document.getElementById('enableSummarizer');
    const summaryLength = document.getElementById('summaryLength');
  
    chrome.storage.sync.get(['enabled', 'summaryLength'], (result) => {
      enableSummarizer.checked = result.enabled ?? true;
      summaryLength.value = result.summaryLength ?? 'medium';
    });
  
    enableSummarizer.addEventListener('change', () => {
      chrome.storage.sync.set({ enabled: enableSummarizer.checked });
    });
  
    summaryLength.addEventListener('change', () => {
      chrome.storage.sync.set({ summaryLength: summaryLength.value });
    });
  });
  