#include <WiFi.h>
#include <WiFiManager.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <EEPROM.h>

// Pin configuration
#define RELAY_PIN 26

// Constants
#define HARDWARE_ID_LENGTH 32
#define EEPROM_SIZE 64
#define HARDWARE_ID_ADDR 0
#define STATUS_CHECK_INTERVAL 5000  // 5 seconds

// WiFi and server settings
const char* serverUrl = "http://192.168.1.22:5000";  // Update with your backend IP
char hardwareId[HARDWARE_ID_LENGTH + 1] = "";
unsigned long lastStatusCheck = 0;

// WiFiManager instance
WiFiManager wifiManager;


// Function prototypes
void checkDeviceStatus();
void updateRelayState(bool state);
void saveHardwareId();
void loadHardwareId();

void setup() {
  // Initialize serial and hardware
  Serial.begin(115200);
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, HIGH);  // Start with relay off

  // Initialize EEPROM and load hardware ID
  EEPROM.begin(EEPROM_SIZE);
  loadHardwareId();
  
  // If no hardware ID is set, generate a default one
  if (strlen(hardwareId) == 0) {
    uint64_t chipId = ESP.getEfuseMac();
    snprintf(hardwareId, HARDWARE_ID_LENGTH + 1, "ESP32-%08X", (uint32_t)chipId);
    saveHardwareId();
  }

  wifiManager.resetSettings();

  // WiFi Manager setup
  WiFiManagerParameter custom_hardware_id("hardware_id", "Hardware ID (Required)", hardwareId, HARDWARE_ID_LENGTH + 1);
  wifiManager.addParameter(&custom_hardware_id);
  
  // Try to connect to WiFi
  if (!wifiManager.autoConnect("ESP32-SmartOutlet")) {
    Serial.println("Failed to connect, restarting...");
    ESP.restart();
  }

  // Save hardware ID if changed
  if (strcmp(custom_hardware_id.getValue(), hardwareId) != 0) {
    strncpy(hardwareId, custom_hardware_id.getValue(), HARDWARE_ID_LENGTH);
    hardwareId[HARDWARE_ID_LENGTH] = '\0';
    saveHardwareId();
  }
  
  // Print connection info
  Serial.println("\n=== Smart Outlet ===");
  Serial.print("Hardware ID: ");
  Serial.println(hardwareId);
  Serial.print("Backend: ");
  Serial.println(serverUrl);
  Serial.print("Local IP: ");
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
  Serial.print("Relay set to: ");
  Serial.println(state ? "ON (LOW)" : "OFF (HIGH)");
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

void checkDeviceStatus() {
  Serial.println("\n--- Checking device status ---");
  Serial.print("WiFi status: ");
  Serial.println(WiFi.status() == WL_CONNECTED ? "Connected" : "Disconnected");
  
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected, attempting to reconnect...");
    WiFi.reconnect();
    delay(1000); // Give some time for reconnection
    if (WiFi.status() == WL_CONNECTED) {
      Serial.println("Successfully reconnected to WiFi");
    } else {
      Serial.println("Failed to reconnect to WiFi");
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