#include <WiFi.h>
#include <WiFiManager.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <EEPROM.h>
#include <string>

// Pin configuration
#define RELAY_PIN 26
#define LED_CONNECTION 2  // D2 for connection status
#define LED_RELAY_STATE 4 // D4 for relay state

// Constants
#define HARDWARE_ID_LENGTH 32
#define IP_ADDRESS_LENGTH 16  // For storing IP address (e.g., "192.168.1.100")
#define EEPROM_SIZE 128      // Increased to accommodate both hardware ID and IP
#define HARDWARE_ID_ADDR 0
#define IP_ADDRESS_ADDR 64   // Start address for IP in EEPROM
#define STATUS_CHECK_INTERVAL 5000  // 5 seconds

// WiFi and server settings
char serverUrl[64];  // Will be constructed from IP
char backendIp[IP_ADDRESS_LENGTH] = "192.168.1.22";  // Default IP
char hardwareId[HARDWARE_ID_LENGTH + 1] = "";
unsigned long lastStatusCheck = 0;

// WiFiManager instance
WiFiManager wifiManager;


// Function prototypes
void checkDeviceStatus();
void updateRelayState(bool state);
void saveHardwareId();
void loadHardwareId();
void saveBackendIp();
void loadBackendIp();
void updateServerUrl();

void setup() {
  // Initialize serial and hardware
  Serial.begin(115200);
  
  // Initialize pins
  pinMode(RELAY_PIN, OUTPUT);
  pinMode(LED_CONNECTION, OUTPUT);
  pinMode(LED_RELAY_STATE, OUTPUT);
  
  // Start with relay off and LEDs off
  digitalWrite(RELAY_PIN, HIGH);
  digitalWrite(LED_CONNECTION, LOW);
  digitalWrite(LED_RELAY_STATE, LOW);

  // Initialize EEPROM and load settings
  EEPROM.begin(EEPROM_SIZE);
  loadHardwareId();
  loadBackendIp();
  updateServerUrl();
  
  // If no hardware ID is set, generate a default one
  if (strlen(hardwareId) == 0) {
    uint64_t chipId = ESP.getEfuseMac();
    snprintf(hardwareId, HARDWARE_ID_LENGTH + 1, "ESP32-%08X", (uint32_t)chipId);
    saveHardwareId();
  }

  wifiManager.resetSettings();

  // WiFi Manager setup
  WiFiManagerParameter custom_hardware_id("hardware_id", "Hardware ID (Required)", hardwareId, HARDWARE_ID_LENGTH + 1);
  WiFiManagerParameter custom_backend_ip("backend_ip", "Backend IP (e.g., 192.168.1.22)", backendIp, IP_ADDRESS_LENGTH);
  
  wifiManager.addParameter(&custom_hardware_id);
  wifiManager.addParameter(&custom_backend_ip);
  
  // Try to connect to WiFi
  if (!wifiManager.autoConnect("ESP32-SmartOutlet")) {
    Serial.println("Failed to connect, restarting...");
    ESP.restart();
  }

  // Save settings if changed
  bool settingsChanged = false;
  
  // Check hardware ID
  if (strcmp(custom_hardware_id.getValue(), hardwareId) != 0) {
    strncpy(hardwareId, custom_hardware_id.getValue(), HARDWARE_ID_LENGTH);
    hardwareId[HARDWARE_ID_LENGTH] = '\0';
    saveHardwareId();
    settingsChanged = true;
  }
  
  // Check backend IP
  if (strcmp(custom_backend_ip.getValue(), backendIp) != 0) {
    strncpy(backendIp, custom_backend_ip.getValue(), IP_ADDRESS_LENGTH - 1);
    backendIp[IP_ADDRESS_LENGTH - 1] = '\0';
    saveBackendIp();
    updateServerUrl();
    settingsChanged = true;
  }
  
  if (settingsChanged) {
    Serial.println("Settings updated, restarting...");
    delay(1000);
    ESP.restart();
  }
  
  // Print connection info
  Serial.println("\n=== Smart Outlet ===");
  Serial.print("Hardware ID: ");
  Serial.println(hardwareId);
  Serial.print("Backend IP: ");
  Serial.println(backendIp);
  Serial.print("Backend URL: ");
  Serial.println(serverUrl);
  Serial.print("Local IP: ");
  Serial.println(WiFi.localIP());
  Serial.println("===================\n");
  Serial.println(WiFi.localIP());
  Serial.println("===================\n");

  checkDeviceStatus();
}

void loop() {
  if (millis() - lastStatusCheck > STATUS_CHECK_INTERVAL) {
    checkDeviceStatus();
    lastStatusCheck = millis();
  }

  delay(100);
}

void updateRelayState(bool state) {
  // Invert the logic for normally open relay
  // HIGH = relay off (circuit open), LOW = relay on (circuit closed)
  digitalWrite(RELAY_PIN, state ? LOW : HIGH);
  // Update relay state LED (D4)
  digitalWrite(LED_RELAY_STATE, state ? HIGH : LOW);
  Serial.print("Relay set to: ");
  Serial.println(state ? "ON (LOW)" : "OFF (HIGH)");
}

void blinkConnectionLED(int times = 1, int delayMs = 200) {
  for (int i = 0; i < times; i++) {
    digitalWrite(LED_CONNECTION, HIGH);
    delay(delayMs);
    digitalWrite(LED_CONNECTION, LOW);
    if (i < times - 1) delay(delayMs);
  }
}

void saveHardwareId() {
  for (int i = 0; i < strlen(hardwareId); i++) {
    EEPROM.write(HARDWARE_ID_ADDR + i, hardwareId[i]);
  }
  EEPROM.write(HARDWARE_ID_ADDR + strlen(hardwareId), '\0');
  EEPROM.commit();
}

void loadHardwareId() {
  int i = 0;
  char ch = EEPROM.read(HARDWARE_ID_ADDR + i);

  while (ch != '\0' && i < HARDWARE_ID_LENGTH) {
    hardwareId[i] = ch;
    i++;
    ch = EEPROM.read(HARDWARE_ID_ADDR + i);
  }
  hardwareId[i] = '\0';
}

void saveBackendIp() {
  for (int i = 0; i < strlen(backendIp); i++) {
    EEPROM.write(IP_ADDRESS_ADDR + i, backendIp[i]);
  }
  EEPROM.write(IP_ADDRESS_ADDR + strlen(backendIp), '\0');
  EEPROM.commit();
  Serial.print("Saved backend IP: ");
  Serial.println(backendIp);
}

void loadBackendIp() {
  int i = 0;
  char ch = EEPROM.read(IP_ADDRESS_ADDR + i);

  // If no IP is saved, use default
  if (ch == 0xFF) {
    strncpy(backendIp, "192.168.1.22", IP_ADDRESS_LENGTH - 1);
    backendIp[IP_ADDRESS_LENGTH - 1] = '\0';
    saveBackendIp();
    return;
  }

  while (ch != '\0' && i < IP_ADDRESS_LENGTH - 1) {
    backendIp[i] = ch;
    i++;
    ch = EEPROM.read(IP_ADDRESS_ADDR + i);
  }
  backendIp[i] = '\0';
  Serial.print("Loaded backend IP: ");
  Serial.println(backendIp);
}

void updateServerUrl() {
  snprintf(serverUrl, sizeof(serverUrl), "http://%s:5000", backendIp);
  Serial.print("Updated server URL to: ");
  Serial.println(serverUrl);
}

void checkDeviceStatus() {
  Serial.println("\n--- Checking device status ---");
  Serial.print("WiFi status: ");
  Serial.println(WiFi.status() == WL_CONNECTED ? "Connected" : "Disconnected");
  
  if (WiFi.status() != WL_CONNECTED) {
    digitalWrite(LED_CONNECTION, LOW); // Turn off connection LED
    Serial.println("WiFi not connected, attempting to reconnect...");
    WiFi.reconnect();
    delay(1000); // Give some time for reconnection
    if (WiFi.status() == WL_CONNECTED) {
      Serial.println("Successfully reconnected to WiFi");
      blinkConnectionLED(3, 100); // Triple blink on successful connection
    } else {
      Serial.println("Failed to reconnect to WiFi");
      // Blink once to indicate connection failure
      digitalWrite(LED_CONNECTION, HIGH);
      delay(100);
      digitalWrite(LED_CONNECTION, LOW);
    }
    return;
  }

  // Create the URL for the API request
  String url = String(serverUrl) + "/api/device/status?hardware_id=" + String(hardwareId);
  Serial.print("Requesting URL: ");
  Serial.println(url);
  
  // Make the HTTP GET request
  HTTPClient http;
  http.setConnectTimeout(5000);  // 5 second timeout
  http.setTimeout(5000);        // 5 second timeout
  
  bool httpBegin = http.begin(url);
  if (!httpBegin) {
    Serial.println("Failed to begin HTTP connection");
    return;
  }
  
  Serial.println("Sending GET request...");
  int httpCode = http.GET();
  Serial.print("HTTP Status code: ");
  Serial.println(httpCode);
  
  if (httpCode == HTTP_CODE_OK) {
    // Blink connection LED to indicate successful communication
    digitalWrite(LED_CONNECTION, HIGH);
    delay(50);
    digitalWrite(LED_CONNECTION, LOW);
    
    String payload = http.getString();
    Serial.print("Response payload: ");
    Serial.println(payload);
    
    DynamicJsonDocument doc(1024);
    DeserializationError error = deserializeJson(doc, payload);
    
    if (!error) {
      Serial.println("Successfully parsed JSON response");
      // The API returns an array of devices, find ours by hardware_id
      if (!doc.is<JsonArray>()) {
        Serial.println("Error: Expected JSON array in response");
        http.end();
        return;
      }
      
      JsonArray devices = doc.as<JsonArray>();
      bool deviceFound = false;
      
      Serial.print("Found ");
      Serial.print(devices.size());
      Serial.println(" devices in response");
      
      for (JsonObject device : devices) {
        const char* deviceHwId = device["hardware_id"];
        Serial.print("Checking device: ");
        Serial.println(deviceHwId ? deviceHwId : "null");
        
        if (deviceHwId && strcmp(deviceHwId, hardwareId) == 0) {
          deviceFound = true;
          bool shouldBeEnabled = device["is_enabled"];
          bool currentState = (digitalRead(RELAY_PIN) == LOW); // LOW means ON in our inverted logic
          
          Serial.print("Device match! Current state: ");
          Serial.print(currentState ? "ON" : "OFF");
          Serial.print(", Desired state: ");
          Serial.println(shouldBeEnabled ? "ON" : "OFF");
          
          if (currentState != shouldBeEnabled) {
            Serial.println("Updating relay state...");
            updateRelayState(shouldBeEnabled);
          } else {
            Serial.println("No state change needed");
          }
          break;
        }
      }
      
      if (!deviceFound) {
        Serial.println("Device not found in the response");
      }
      Serial.println("Device not found in backend");
    } else {
      Serial.println("Invalid response from server");
    }
  } else if (httpCode == -1) {
    Serial.println("Error: Connection failed");
  } else {
    Serial.print("HTTP Error: ");
    Serial.println(httpCode);
    Serial.print("Error: ");
    Serial.println(http.errorToString(httpCode).c_str());
  }
  
  http.end();  // Make sure to close the connection
  Serial.println("--- End of status check ---");

  
  http.end();
}