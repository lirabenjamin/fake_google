(function() {
  // Time tracking variables
  let sessionStartTime = Date.now();
  let totalActiveTime = 0;
  let lastActiveTime = Date.now();
  let isIframeActive = true;
  let activeTimeInterval;

  // Extract PROLIFIC_PID from URL query string
  function getProlificId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('PROLIFIC_PID');
  }

  // Update active time counter
  function updateActiveTime() {
    if (isIframeActive) {
      const now = Date.now();
      totalActiveTime += now - lastActiveTime;
      lastActiveTime = now;
    }
  }

  // Track iframe focus/blur events
  function setupActiveTimeTracking() {
    // Track when iframe gains/loses focus
    window.addEventListener('focus', function() {
      isIframeActive = true;
      lastActiveTime = Date.now();
    });

    window.addEventListener('blur', function() {
      updateActiveTime();
      isIframeActive = false;
    });

    // Track when user becomes active/inactive within iframe
    document.addEventListener('visibilitychange', function() {
      if (document.hidden) {
        updateActiveTime();
        isIframeActive = false;
      } else {
        isIframeActive = true;
        lastActiveTime = Date.now();
      }
    });

    // Track mouse movement and keyboard activity within iframe
    let activityTimeout;
    function resetActivityTimeout() {
      clearTimeout(activityTimeout);
      if (!isIframeActive) {
        isIframeActive = true;
        lastActiveTime = Date.now();
      }
      
      activityTimeout = setTimeout(() => {
        updateActiveTime();
        isIframeActive = false;
      }, 30000); // Consider inactive after 30 seconds of no activity
    }

    document.addEventListener('mousemove', resetActivityTimeout);
    document.addEventListener('keypress', resetActivityTimeout);
    document.addEventListener('scroll', resetActivityTimeout);
    document.addEventListener('click', resetActivityTimeout);

    // Update active time every second
    activeTimeInterval = setInterval(updateActiveTime, 1000);

    // Initialize activity timeout
    resetActivityTimeout();
  }

  // Send active time data periodically
  function sendActiveTimeData() {
    const prolificId = getProlificId();
    
    if (!prolificId) {
      return;
    }

    updateActiveTime(); // Make sure we have the latest time

    const timeData = {
      prolificId: prolificId,
      eventType: 'active_time',
      totalActiveTime: Math.round(totalActiveTime / 1000), // Convert to seconds
      sessionDuration: Math.round((Date.now() - sessionStartTime) / 1000), // Total session time
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      referrer: document.referrer,
      pageUrl: window.location.href
    };

    console.log('Sending active time data:', timeData);

    fetch('/api/track-time', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(timeData),
      keepalive: true // Important for requests during page unload
    })
    .then(response => {
      console.log('Time tracking response:', response.status, response.statusText);
      return response.json();
    })
    .then(data => {
      console.log('Time tracking success:', data);
    })
    .catch(error => {
      console.error('Error tracking active time:', error);
    });
  }

  // Track click event
  function trackClick(linkElement, event) {
    const prolificId = getProlificId();
    
    if (!prolificId) {
      console.warn('PROLIFIC_PID not found in URL');
      return;
    }

    updateActiveTime(); // Update active time before sending click data

    const clickData = {
      prolificId: prolificId,
      eventType: 'click',
      linkClicked: linkElement.href,
      linkText: linkElement.textContent.trim(),
      currentActiveTime: Math.round(totalActiveTime / 1000), // Active time at moment of click
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      referrer: document.referrer,
      pageUrl: window.location.href
    };

    console.log('Tracking click:', clickData); // Debug log

    // Send tracking data to API
    fetch('/api/track-click', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(clickData),
      keepalive: true
    })
    .then(response => {
      console.log('Click tracking response:', response.status, response.statusText);
      return response.json();
    })
    .then(data => {
      console.log('Click tracking success:', data);
    })
    .catch(error => {
      console.error('Error tracking click:', error);
    });
  }

  // Add PROLIFIC_PID to internal links and set up click tracking
  function initializeTracking() {
    const prolificId = getProlificId();
    const links = document.querySelectorAll('a[href]');
    
    console.log(`Initializing tracking with PROLIFIC_PID: ${prolificId}`);
    console.log(`Found ${links.length} links to process`);
    
    let modifiedLinks = 0;
    
    links.forEach(link => {
      // Add click tracking
      link.addEventListener('click', function(event) {
        trackClick(this, event);
      });
      
      // Preserve PROLIFIC_PID for internal links
      if (prolificId && isInternalLink(link)) {
        const originalHref = link.href;
        preserveProlificIdInLink(link, prolificId);
        if (link.href !== originalHref) {
          modifiedLinks++;
        }
      }
    });
    
    console.log(`Modified ${modifiedLinks} links to preserve PROLIFIC_PID`);
  }

  // Check if a link is internal (same domain or relative)
  function isInternalLink(link) {
    try {
      const linkUrl = new URL(link.href, window.location.origin);
      const currentUrl = new URL(window.location.href);
      
      // Same domain or relative link
      return linkUrl.hostname === currentUrl.hostname || 
             link.getAttribute('href').startsWith('/') ||
             link.getAttribute('href').startsWith('./') ||
             link.getAttribute('href').startsWith('../') ||
             !link.getAttribute('href').includes('://');
    } catch (e) {
      // If URL parsing fails, assume it's internal
      return true;
    }
  }

  // Add PROLIFIC_PID to a link if it doesn't already have it
  function preserveProlificIdInLink(link, prolificId) {
    try {
      const linkUrl = new URL(link.href, window.location.origin);
      
      // Only add if PROLIFIC_PID is not already present
      if (!linkUrl.searchParams.has('PROLIFIC_PID')) {
        linkUrl.searchParams.set('PROLIFIC_PID', prolificId);
        link.href = linkUrl.toString();
      }
    } catch (e) {
      // If URL parsing fails, try a simpler approach
      const href = link.getAttribute('href');
      if (href && !href.includes('PROLIFIC_PID')) {
        const separator = href.includes('?') ? '&' : '?';
        link.href = href + separator + 'PROLIFIC_PID=' + encodeURIComponent(prolificId);
      }
    }
  }

  // Send final active time data when page unloads
  function handlePageUnload() {
    const prolificId = getProlificId();
    
    if (!prolificId) {
      return;
    }

    updateActiveTime();

    const timeData = {
      prolificId: prolificId,
      eventType: 'session_end',
      totalActiveTime: Math.round(totalActiveTime / 1000),
      sessionDuration: Math.round((Date.now() - sessionStartTime) / 1000),
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      referrer: document.referrer,
      pageUrl: window.location.href
    };

    // Use sendBeacon for reliable unload tracking
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/track-time', JSON.stringify(timeData));
    } else {
      // Fallback for older browsers
      fetch('/api/track-time', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(timeData),
        keepalive: true
      }).catch(() => {}); // Ignore errors during unload
    }
  }

  // Initialize everything when DOM is ready
  function initialize() {
    initializeTracking();
    setupActiveTimeTracking();

    // Send active time data every 30 seconds
    setInterval(sendActiveTimeData, 30000);

    // Send data when page unloads
    window.addEventListener('beforeunload', handlePageUnload);
    window.addEventListener('pagehide', handlePageUnload);

    // Send initial data after 5 seconds
    setTimeout(sendActiveTimeData, 5000);
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
})();