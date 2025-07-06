const baseApiUrl = 'https://api.thingspeak.com/channels/2973268/feeds.json?api_key=FPRYP5EADTKS400S&results=';

let gpsData = null;
let gpsMap = null;
let mapMarkers = [];

function getApiUrl() {
    const dataPoints = document.getElementById('data-points').value;
    return baseApiUrl + dataPoints;
}

async function fetchGpsData() {
    const loadingDiv = document.getElementById('loading');
    const refreshBtn = document.getElementById('refresh-btn');
    const dataPointsSelect = document.getElementById('data-points');
    
    try {
        loadingDiv.style.display = 'block';
        refreshBtn.disabled = true;
        dataPointsSelect.disabled = true;
        refreshBtn.textContent = 'Refreshing...';
        
        const existingError = document.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        const apiUrl = getApiUrl();
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        gpsData = await response.json();
        
        displayChannelInfo();
        displayMap();
        displayFeeds();
        
        showLastUpdated();
        
    } catch (error) {
        console.error('Error fetching GPS data:', error);
        showError('Failed to fetch GPS data. Please check your internet connection and try again.');
    } finally {
        loadingDiv.style.display = 'none';
        refreshBtn.disabled = false;
        dataPointsSelect.disabled = false;
        refreshBtn.textContent = 'Refresh Data';
    }
}

function showError(message) {
    const container = document.querySelector('.container');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    container.insertBefore(errorDiv, container.children[2]);
}

function showLastUpdated() {
    const container = document.querySelector('.container');
    let lastUpdatedDiv = document.querySelector('.last-updated');
    
    if (!lastUpdatedDiv) {
        lastUpdatedDiv = document.createElement('div');
        lastUpdatedDiv.className = 'last-updated';
        container.insertBefore(lastUpdatedDiv, document.querySelector('.channel-info'));
    }
    
    const selectedPoints = document.getElementById('data-points').value;
    const dataCount = gpsData && gpsData.feeds ? gpsData.feeds.length : 0;
    lastUpdatedDiv.textContent = `Last updated: ${new Date().toLocaleString()} | Showing ${dataCount} of ${selectedPoints} requested data points`;
}

function displayChannelInfo() {
    const channelDiv = document.getElementById('channelData');
    
    if (!gpsData || !gpsData.channel) {
        channelDiv.innerHTML = '<p>No channel data available</p>';
        return;
    }
    
    const channel = gpsData.channel;
    
    channelDiv.innerHTML = `
        <div class="info-grid">
            <div class="info-item"><strong>ID:</strong> ${channel.id}</div>
            <div class="info-item"><strong>Name:</strong> ${channel.name}</div>
            <div class="info-item"><strong>Created:</strong> ${new Date(channel.created_at).toLocaleString()}</div>
            <div class="info-item"><strong>Updated:</strong> ${new Date(channel.updated_at).toLocaleString()}</div>
            <div class="info-item"><strong>Last Entry ID:</strong> ${channel.last_entry_id}</div>
        </div>
    `;
}

function initializeMap() {
    if (!gpsMap) {
        // Initialize map centered on India
        gpsMap = L.map('gps-map').setView([20.5937, 78.9629], 5);
        
        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(gpsMap);
    }
}

function displayMap() {
    if (!gpsData || !gpsData.feeds || gpsData.feeds.length === 0) {
        return;
    }
    
    // Initialize map if not already done
    initializeMap();
    
    // Clear existing markers
    mapMarkers.forEach(marker => {
        gpsMap.removeLayer(marker);
    });
    mapMarkers = [];
    
    const channel = gpsData.channel;
    const validCoordinates = [];
    
    // Add markers for each GPS coordinate
    gpsData.feeds.forEach((feed, index) => {
        const lat = parseFloat(feed.field1);
        const lng = parseFloat(feed.field2);
        
        // Check if coordinates are valid
        if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
            validCoordinates.push([lat, lng]);
            
            // Create popup content
            const popupContent = `
                <div class="popup-content">
                    <h4>Entry ID: ${feed.entry_id}</h4>
                    <div class="popup-row">
                        <span class="popup-label">Coordinates:</span>
                        <span class="popup-value">${lat.toFixed(6)}, ${lng.toFixed(6)}</span>
                    </div>
                    <div class="popup-row">
                        <span class="popup-label">Timestamp:</span>
                        <span class="popup-value">${new Date(feed.created_at).toLocaleString()}</span>
                    </div>
                    <div class="popup-row">
                        <span class="popup-label">Device Time:</span>
                        <span class="popup-value">${formatDateTime(feed.field5)}</span>
                    </div>
                    <div class="popup-row">
                        <span class="popup-label">Missed Scans:</span>
                        <span class="popup-value">${feed.field3}</span>
                    </div>
                    <div class="popup-row">
                        <span class="popup-label">Successful Scans:</span>
                        <span class="popup-value">${feed.field4}</span>
                    </div>
                    <div class="popup-row">
                        <span class="popup-label">Scan Errors:</span>
                        <span class="popup-value">${feed.field6}</span>
                    </div>
                    <div class="popup-row">
                        <span class="popup-label">Satellites:</span>
                        <span class="popup-value">${feed.field7}</span>
                    </div>
                    <div class="popup-row">
                        <span class="popup-label">Battery:</span>
                        <span class="popup-value">${feed.field8}%</span>
                    </div>
                </div>
            `;
            
            // Create marker with different colors for different entries
            const isLatest = index === gpsData.feeds.length - 1;
            const marker = L.marker([lat, lng], {
                icon: L.divIcon({
                    className: 'custom-div-icon',
                    html: `<div style="
                        background-color: ${isLatest ? '#e74c3c' : '#3498db'};
                        width: 20px;
                        height: 20px;
                        border-radius: 50%;
                        border: 3px solid white;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: white;
                        font-weight: bold;
                        font-size: 10px;
                    ">${feed.entry_id}</div>`,
                    iconSize: [26, 26],
                    iconAnchor: [13, 13]
                })
            }).addTo(gpsMap);
            
            // Bind popup that shows on hover
            marker.bindPopup(popupContent);
            
            // Add hover events
            marker.on('mouseover', function() {
                this.openPopup();
            });
            
            marker.on('mouseout', function() {
                this.closePopup();
            });
            
            mapMarkers.push(marker);
        }
    });
    
    // Fit map to show all markers if there are valid coordinates
    if (validCoordinates.length > 0) {
        if (validCoordinates.length === 1) {
            gpsMap.setView(validCoordinates[0], 15);
        } else {
            const group = new L.featureGroup(mapMarkers);
            gpsMap.fitBounds(group.getBounds().pad(0.1));
        }
    }
}

function displayFeeds() {
    const feedsDiv = document.getElementById('feedsData');
    
    if (!gpsData || !gpsData.feeds || gpsData.feeds.length === 0) {
        feedsDiv.innerHTML = '<p>No feed data available</p>';
        return;
    }
    
    const channel = gpsData.channel;
    
    // Sort feeds by entry_id in descending order (greater ID first)
    const sortedFeeds = gpsData.feeds.sort((a, b) => b.entry_id - a.entry_id);
    
    const feedsHtml = sortedFeeds.map(feed => {
        const formattedDateTime = formatDateTime(feed.field5);
        return `
            <div class="feed-card">
                <div class="feed-header">
                    <h3>Entry ID: ${feed.entry_id}</h3>
                    <span class="timestamp">${new Date(feed.created_at).toLocaleString()}</span>
                </div>
                <div class="feed-data">
                    <div class="data-row">
                        <span class="label">${channel.field1}:</span>
                        <span class="value">${feed.field1}°</span>
                    </div>
                    <div class="data-row">
                        <span class="label">${channel.field2}:</span>
                        <span class="value">${feed.field2}°</span>
                    </div>
                    <div class="data-row">
                        <span class="label">${channel.field3}:</span>
                        <span class="value">${feed.field3}</span>
                    </div>
                    <div class="data-row">
                        <span class="label">${channel.field4}:</span>
                        <span class="value">${feed.field4}</span>
                    </div>
                    <div class="data-row">
                        <span class="label">${channel.field5}:</span>
                        <span class="value">${formattedDateTime}</span>
                    </div>
                    <div class="data-row">
                        <span class="label">${channel.field6}:</span>
                        <span class="value">${feed.field6}</span>
                    </div>
                    <div class="data-row">
                        <span class="label">${channel.field7}:</span>
                        <span class="value">${feed.field7}</span>
                    </div>
                    <div class="data-row">
                        <span class="label">${channel.field8}:</span>
                        <span class="value">${feed.field8}%</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    feedsDiv.innerHTML = feedsHtml;
}

function formatDateTime(dateTimeString) {
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

document.addEventListener('DOMContentLoaded', function() {
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
    
    fetchGpsData();
    
    document.getElementById('refresh-btn').addEventListener('click', fetchGpsData);
    
    // Add event listener for dropdown change
    document.getElementById('data-points').addEventListener('change', function() {
        fetchGpsData();
    });
    
    // Add event listener for dashboard button
    document.getElementById('dashboard-btn').addEventListener('click', function() {
        window.location.href = 'index.html';
    });
});
