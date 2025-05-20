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
  digitalWrite(RELAY_PIN, LOW);  // Start with relay off

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
  digitalWrite(RELAY_PIN, state ? HIGH : LOW);
  Serial.print("Relay set to: ");
  Serial.println(state ? "ON" : "OFF");
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
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected, reconnecting...");
    WiFi.reconnect();
    return;
  }

  // Create the URL for the API request
  String url = String(serverUrl) + "/api/device/status?hardware_id=" + String(hardwareId);
  
  // Make the HTTP GET request
  HTTPClient http;
  http.begin(url);
  int httpCode = http.GET();
  
  if (httpCode == HTTP_CODE_OK) {
    String payload = http.getString();
    DynamicJsonDocument doc(1024);
    DeserializationError error = deserializeJson(doc, payload);
    
    if (!error) {
      // The API returns an array of devices, find ours by hardware_id
      JsonArray devices = doc.as<JsonArray>();
      bool deviceFound = false;
      
      for (JsonObject device : devices) {
        const char* deviceHwId = device["hardware_id"];
        if (deviceHwId && strcmp(deviceHwId, hardwareId) == 0) {
          bool shouldBeEnabled = device["is_enabled"];
          if (digitalRead(RELAY_PIN) != (shouldBeEnabled ? HIGH : LOW)) {
            updateRelayState(shouldBeEnabled);
          }
          return; // Found our device, exit
        }
      }
      Serial.println("Device not found in backend");
    } else {
      Serial.println("Invalid response from server");
    }
  } else {
    Serial.print("HTTP Error: ");
    Serial.println(httpCode);
  }

  
  http.end();
}