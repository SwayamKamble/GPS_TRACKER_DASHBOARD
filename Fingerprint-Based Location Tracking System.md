# Fingerprint-Based Location Tracking System

**Project Documentation**

- **Author:** SwayamKamble
- **Date:** June 10, 2025
- **Version:** 1.0

## 1. Project Overview

This system combines fingerprint biometric authentication with GPS location tracking and GSM connectivity to create a comprehensive attendance and location monitoring solution. Designed for field workers, security personnel, or remote employees, the system provides reliable attendance verification while tracking the location of check-ins.

## 2. Hardware Components

| Component | Description | Purpose |
|-----------|-------------|---------|
| ESP32 | Main microcontroller | System control and processing |
| SIM800L | GSM module | Data transmission to cloud |
| NEO6M | GPS module | Location tracking |
| Fingerprint Sensor | Biometric scanner | User authentication |
| OLED Display (SH1106G) | 128x64 I2C display | User interface |
| 7-8V Battery | Power source | System power |
| 7805 Regulator | Voltage regulator | 5V power supply |
| LEDs | Status indicators | Visual feedback |
| Buzzer | Audio alert | Sound notifications |
| Config Switch | Mode selector | Switch between operation/config modes |

## 3. System Diagram

![Fingerprint-Based Location Tracking System Diagram](svgviewer-png-output.png)

*Figure 1: System architecture showing component connections and data flow*

## 4. System Architecture

The system operates in two distinct modes:

### 4.1 Configuration Mode
- Activates a WiFi access point (SSID: "FingerPrint_Config")
- Provides web interface for system administration
- Enables fingerprint enrollment, deletion, and management
- Allows manual date/time setting and ThingSpeak testing

### 4.2 Operation Mode
- Regular attendance prompting via buzzer (every 2 minutes)
- Fingerprint authentication with feedback
- Location tracking via GPS
- Data transmission to ThingSpeak cloud service

## 5. Key Features

- **Biometric Authentication:** Secure fingerprint recognition
- **Location Tracking:** GPS coordinates for each check-in
- **Remote Monitoring:** Data sent to ThingSpeak cloud platform
- **Offline Capability:** Continues functioning without connectivity
- **Visual Feedback:** OLED display shows system status and user information
- **Time Management:** IST time format (UTC+5:30)
- **Data Logging:** Tracks successful and missed scans

## 6. Setup Instructions

### 6.1 Hardware Assembly
1. Connect the fingerprint sensor to UART2 (pins 16, 17)
2. Connect the GPS module (pins 4, 2)
3. Connect the GSM module (pins 33, 32)
4. Connect the OLED display via I2C
5. Connect the buzzer (pin 5) and LEDs (pins 13, 14, 15)
6. Connect the configuration switch to pin 34
7. Connect the 7805 regulator to the battery and ESP32

### 6.2 Initial Configuration
1. Power on the system with CONFIG_PIN (pin 34) set to HIGH
2. Connect to the WiFi network "FingerPrint_Config" (password: "password123")
3. Navigate to the web interface (IP displayed on OLED)
4. Enroll fingerprints for all users
5. Set the system date and time
6. Verify ThingSpeak connectivity by testing data transmission

## 7. Operation Guide

### 7.1 Normal Operation
1. Set CONFIG_PIN to LOW for operation mode
2. The system will prompt for fingerprint scans every 2 minutes
3. Users have 2 minutes to scan their fingerprint
4. Successful scans are acknowledged with visual and audio feedback
5. Location and attendance data are transmitted to ThingSpeak
6. User information and location are displayed on the OLED screen

### 7.2 ThingSpeak Data Fields
- **Field 1:** Latitude
- **Field 2:** Longitude
- **Field 3:** Missed scan count
- **Field 4:** Successful scans count
- **Field 5:** Timestamp

## 8. Troubleshooting

| Issue | Possible Cause | Solution |
|-------|---------------|----------|
| Fingerprint not recognized | Dirty sensor or finger | Clean sensor and finger, try again |
| No GPS data | Poor satellite reception | Move to open area, check antenna connection |
| No GSM connectivity | Network issues, SIM problem | Check SIM card, antenna, network coverage |
| System not responding | Power issues | Check battery voltage, regulator output |
| OLED not displaying | I2C connection issue | Verify I2C address and connections |
| Failed data transmission | GSM module errors | Check AT command responses in serial monitor |

## 9. Future Enhancements

- Battery level monitoring and low battery alerts
- Multiple fingerprint enrollment per user for redundancy
- Geofencing capabilities for location-based rules
- SMS alerts for missed check-ins
- Enhanced data visualization on ThingSpeak dashboard
- Integration with enterprise attendance systems
- Mobile app for remote monitoring and management

---

© 2025 SwayamKamble. All rights reserved.