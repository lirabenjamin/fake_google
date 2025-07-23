(function() {
  // Extract PROLIFIC_PID from URL query string
  function getProlificId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('PROLIFIC_PID');
  }

  // Track click event
  function trackClick(linkElement, event) {
    const prolificId = getProlificId();
    
    if (!prolificId) {
      console.warn('PROLIFIC_PID not found in URL');
      return;
    }

    const clickData = {
      prolificId: prolificId,
      linkClicked: linkElement.href,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      referrer: document.referrer
    };

    // Send tracking data to API
    fetch('/api/track-click', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(clickData)
    }).catch(error => {
      console.error('Error tracking click:', error);
    });
  }

  // Add click listeners to all links
  function initializeTracking() {
    const links = document.querySelectorAll('a[href]');
    
    links.forEach(link => {
      link.addEventListener('click', function(event) {
        trackClick(this, event);
      });
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeTracking);
  } else {
    initializeTracking();
  }
})();