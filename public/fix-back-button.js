// Override Microsoft's history manipulation
(function() {
  'use strict';
  
  // Store the original referrer when page loads
  const originalReferrer = document.referrer;
  const urlParams = new URLSearchParams(window.location.search);
  const prolificId = urlParams.get('PROLIFIC_PID');
  
  // Get the expected back URL from referrer or default to index2.html
  let backUrl = '/index2.html';
  if (originalReferrer && originalReferrer.includes(window.location.hostname)) {
    try {
      const referrerUrl = new URL(originalReferrer);
      backUrl = referrerUrl.pathname + referrerUrl.search;
    } catch (e) {
      console.warn('Could not parse referrer URL:', originalReferrer);
    }
  }
  
  // Add PROLIFIC_PID to back URL if it exists
  if (prolificId) {
    const backUrlObj = new URL(backUrl, window.location.origin);
    if (!backUrlObj.searchParams.has('PROLIFIC_PID')) {
      backUrlObj.searchParams.set('PROLIFIC_PID', prolificId);
      backUrl = backUrlObj.pathname + backUrlObj.search;
    }
  }
  
  console.log('Fixed back button - will navigate to:', backUrl);
  
  // Override history methods to prevent Microsoft from changing the URL
  const originalReplaceState = history.replaceState;
  const originalPushState = history.pushState;
  
  history.replaceState = function(state, title, url) {
    // Block attempts to change to Microsoft domain
    if (url && typeof url === 'string' && 
        (url.includes('microsoft.com') || url.includes('create.microsoft.com'))) {
      console.log('Blocked history.replaceState to:', url);
      return;
    }
    return originalReplaceState.call(this, state, title, url);
  };
  
  history.pushState = function(state, title, url) {
    // Block attempts to change to Microsoft domain
    if (url && typeof url === 'string' && 
        (url.includes('microsoft.com') || url.includes('create.microsoft.com'))) {
      console.log('Blocked history.pushState to:', url);
      return;
    }
    return originalPushState.call(this, state, title, url);
  };
  
  // Override popstate to handle back button correctly
  window.addEventListener('popstate', function(event) {
    console.log('Popstate event triggered, navigating to:', backUrl);
    window.location.href = backUrl;
  });
  
  // Override any attempts to change window.location
  let locationChanging = false;
  const originalLocation = window.location;
  
  // Create a custom back function that can be called
  window.goBack = function() {
    console.log('Custom goBack called, navigating to:', backUrl);
    window.location.href = backUrl;
  };
  
  // Also listen for any back button clicks in the page
  document.addEventListener('click', function(event) {
    const target = event.target;
    
    // Look for any element that might be a back button
    if (target.textContent && 
        (target.textContent.toLowerCase().includes('back') || 
         target.getAttribute('aria-label')?.toLowerCase().includes('back'))) {
      console.log('Detected back button click, preventing default and using custom navigation');
      event.preventDefault();
      event.stopPropagation();
      window.goBack();
      return false;
    }
  });
  
  // Set up a mutation observer to watch for dynamically added back buttons
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      mutation.addedNodes.forEach(function(node) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          // Look for back buttons in newly added content
          const backButtons = node.querySelectorAll 
            ? node.querySelectorAll('[aria-label*="back" i], [title*="back" i], button:contains("Back")')
            : [];
          
          backButtons.forEach(function(btn) {
            btn.addEventListener('click', function(e) {
              console.log('Detected dynamically added back button click');
              e.preventDefault();
              e.stopPropagation();
              window.goBack();
              return false;
            });
          });
        }
      });
    });
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
})();