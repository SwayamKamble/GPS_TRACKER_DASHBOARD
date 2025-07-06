document.addEventListener('DOMContentLoaded', function() {
    // Initialize map
    const map = L.map('map').setView([0, 0], 13);
    
    // Add tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    // Create a marker variable that will be updated
    let marker = null;
    
    // ThingSpeak API endpoint
    const apiUrl = 'https://api.thingspeak.com/channels/2973268/feeds.json?api_key=FPRYP5EADTKS400S&results=2';
    
    // Timer variables
    let refreshInterval;
    const refreshTime = 120; // 2 minutes in seconds
    let timeLeft = refreshTime;
    let countdownTimer;
    
    // Function to fetch and process data
    function fetchData() {
        // Show loading indicator
        document.getElementById('refresh-btn').textContent = 'Refreshing...';
        document.getElementById('refresh-btn').disabled = true;
        
        fetch(apiUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                // Get the latest entry (last item in the feeds array)
                const latestEntry = data.feeds[data.feeds.length - 1];
                
                // Extract values
                const latitude = parseFloat(latestEntry.field1);
                const longitude = parseFloat(latestEntry.field2);
                const missedScans = parseInt(latestEntry.field3);
                const successfulScans = parseInt(latestEntry.field4);
                const formattedDateTime = latestEntry.field5;
                const scanErrors = parseInt(latestEntry.field6);
                const satellites = parseInt(latestEntry.field7);
                const battery = parseInt(latestEntry.field8);
                const timestamp = new Date(latestEntry.created_at);
                
                // Update stats display
                document.getElementById('missed-scans').textContent = missedScans;
                document.getElementById('successful-scans').textContent = successfulScans;
                document.getElementById('scan-errors').textContent = scanErrors;
                document.getElementById('satellites').textContent = satellites;
                document.getElementById('battery').textContent = battery + '%';
                document.getElementById('latitude').textContent = latitude.toFixed(6);
                document.getElementById('longitude').textContent = longitude.toFixed(6);
                document.getElementById('device-time').textContent = formatDeviceDateTime(formattedDateTime);
                document.getElementById('last-update').textContent = formatDate(timestamp);
                document.getElementById('fetch-time').textContent = formatDate(new Date());
                
                // Update map
                updateMapMarker(latitude, longitude);
                
                // Show success message and reset button
                document.getElementById('refresh-btn').textContent = 'Refresh Data';
                document.getElementById('refresh-btn').disabled = false;
                
                // Reset the countdown timer
                resetAutoRefreshTimer();
                
                // Show success notification
                showNotification('Data successfully updated!', 'success');
            })
            .catch(error => {
                console.error('Error fetching data:', error);
                document.getElementById('refresh-btn').textContent = 'Refresh Data';
                document.getElementById('refresh-btn').disabled = false;
                showNotification('Failed to fetch data. Please try again.', 'error');
            });
    }
    
    // Function to update map marker
    function updateMapMarker(lat, lng) {
        // If marker already exists, remove it
        if (marker) {
            map.removeLayer(marker);
        }
        
        // Create new marker and add it to the map
        marker = L.marker([lat, lng]).addTo(map);
        
        // Create a popup with the coordinates
        marker.bindPopup(`<b>Location</b><br>Lat: ${lat.toFixed(6)}<br>Lng: ${lng.toFixed(6)}`);
        
        // Center the map on the marker
        map.setView([lat, lng], 13);
    }
    
    // Format date to a readable string
    function formatDate(date) {
        return date.toLocaleString();
    }
    
    // Format device date/time from YYYYMMDDHHMMSS format
    function formatDeviceDateTime(dateTimeString) {
        if (!dateTimeString || dateTimeString.length !== 14) {
            return 'Invalid format';
        }
        
        const year = dateTimeString.substring(0, 4);
        const month = dateTimeString.substring(4, 6);
        const day = dateTimeString.substring(6, 8);
        const hour = dateTimeString.substring(8, 10);
        const minute = dateTimeString.substring(10, 12);
        const second = dateTimeString.substring(12, 14);
        
        return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
    }
    
    // Function to show notification
    function showNotification(message, type) {
        // Create notification element if it doesn't exist
        let notification = document.getElementById('notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'notification';
            document.body.appendChild(notification);
        }
        
        // Set message and style based on type
        notification.textContent = message;
        notification.className = `notification ${type}`;
        
        // Show notification
        notification.style.display = 'block';
        
        // Hide after 3 seconds
        setTimeout(() => {
            notification.style.display = 'none';
        }, 3000);
    }
    
    // Function to update the countdown display
    function updateCountdown() {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        const countdownDisplay = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        document.getElementById('countdown').textContent = countdownDisplay;
        
        if (timeLeft <= 0) {
            fetchData();
        } else {
            timeLeft--;
        }
    }
    
    // Function to reset the auto-refresh timer
    function resetAutoRefreshTimer() {
        // Clear existing timers
        if (countdownTimer) clearInterval(countdownTimer);
        
        // Reset time left
        timeLeft = refreshTime;
        
        // Start new countdown
        countdownTimer = setInterval(updateCountdown, 1000);
    }
    
    // Function to start auto-refresh
    function startAutoRefresh() {
        // Create countdown element if it doesn't exist
        if (!document.getElementById('countdown-container')) {
            const refreshCard = document.querySelector('.stats-card:last-child');
            
            const countdownContainer = document.createElement('div');
            countdownContainer.id = 'countdown-container';
            countdownContainer.innerHTML = `
                <p>Next auto-refresh in: <span id="countdown">2:00</span></p>
                <label class="toggle-container">
                    <input type="checkbox" id="auto-refresh-toggle" checked>
                    <span class="toggle-text">Auto-refresh</span>
                </label>
            `;
            
            refreshCard.appendChild(countdownContainer);
            
            // Add event listener to toggle
            document.getElementById('auto-refresh-toggle').addEventListener('change', function(e) {
                if (e.target.checked) {
                    startAutoRefresh();
                    showNotification('Auto-refresh enabled', 'info');
                } else {
                    stopAutoRefresh();
                    showNotification('Auto-refresh disabled', 'info');
                }
            });
        }
        
        // Start countdown
        resetAutoRefreshTimer();
    }
    
    // Function to stop auto-refresh
    function stopAutoRefresh() {
        if (countdownTimer) {
            clearInterval(countdownTimer);
            document.getElementById('countdown').textContent = 'Disabled';
        }
    }
    
    // Theme toggle functionality
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.querySelector('.theme-icon');
    const currentTheme = localStorage.getItem('theme');
    
    // Apply saved theme
    if (currentTheme) {
        document.documentElement.setAttribute('data-theme', currentTheme);
        themeIcon.textContent = currentTheme === 'dark' ? '☀️' : '🌙';
    }
    
    // Theme toggle event listener
    themeToggle.addEventListener('click', function() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        themeIcon.textContent = newTheme === 'dark' ? '☀️' : '🌙';
    });
    
    // Initial data fetch
    fetchData();
    
    // Set up refresh button
    document.getElementById('refresh-btn').addEventListener('click', fetchData);
    
    // Set up data display button
    document.getElementById('data-display-btn').addEventListener('click', function() {
        window.open('gps-data-display.html', '_blank');
    });
    
    // Start auto-refresh
    startAutoRefresh();
});