#include <WiFi.h>
#include <WebServer.h>

#define RELAY_PIN 26

WebServer server(80);

// Relay ON handler
void handleRelayOn() {
  digitalWrite(RELAY_PIN, HIGH);
  server.send(200, "text/plain", "Relay is ON");
  Serial.println("Relay turned ON");
}

// Relay OFF handler
void handleRelayOff() {
  digitalWrite(RELAY_PIN, LOW);
  server.send(200, "text/plain", "Relay is OFF");
  Serial.println("Relay turned OFF");
}

// Default root page
void handleRoot() {
  server.send(200, "text/html", "<h1>ESP32 Relay Control</h1><p><a href='/on'>Turn ON</a><br><a href='/off'>Turn OFF</a></p>");
}

void setup() {
  Serial.begin(115200);
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, HIGH);  

  // Start WiFi in Access Point mode
  WiFi.softAP("ESP32_Relay_AP", "12345678");  // SSID and password
  IPAddress IP = WiFi.softAPIP();
  Serial.print("AP IP address: ");
  Serial.println(IP);  // Should be 192.168.4.1
  //testing 
  // Web server routes
  server.on("/", handleRoot);
  server.on("/off", handleRelayOn);
  server.on("/on", handleRelayOff);
  server.begin();
  Serial.println("HTTP server started");
}

void loop() {
  server.handleClient();
}