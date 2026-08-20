package com.pixelpal.app;

import android.content.Context;
import android.net.wifi.WifiManager;
import android.util.Log;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.InetAddress;
import java.net.SocketTimeoutException;
import java.nio.charset.StandardCharsets;
import java.util.HashSet;
import java.util.Set;
import org.json.JSONObject;

@CapacitorPlugin(name = "UdpPlugin")
public class UdpPlugin extends Plugin {
    private static final String TAG = "UdpPlugin";
    private static final int DEFAULT_UDP_PORT = 53537;
    private static final int DEFAULT_TIMEOUT_MS = 2000;

    @PluginMethod
    public void discover(PluginCall call) {
        String token = call.getString("token", "");
        int targetPort = call.getInt("port", DEFAULT_UDP_PORT);
        int timeoutMs = call.getInt("timeout", DEFAULT_TIMEOUT_MS);

        new Thread(() -> {
            WifiManager.MulticastLock multicastLock = null;
            DatagramSocket socket = null;
            try {
                Context context = getContext();
                if (context != null) {
                    WifiManager wifi = (WifiManager) context.getApplicationContext().getSystemService(Context.WIFI_SERVICE);
                    if (wifi != null) {
                        multicastLock = wifi.createMulticastLock("PixelPalUdpMulticastLock");
                        multicastLock.setReferenceCounted(true);
                        multicastLock.acquire();
                    }
                }

                socket = new DatagramSocket();
                socket.setBroadcast(true);
                socket.setSoTimeout(timeoutMs);

                JSONObject payload = new JSONObject();
                payload.put("action", "discover");
                if (token != null && !token.trim().isEmpty()) {
                    payload.put("token", token.trim());
                }

                byte[] sendBuffer = payload.toString().getBytes(StandardCharsets.UTF_8);
                DatagramPacket broadcastPacket = new DatagramPacket(
                    sendBuffer,
                    sendBuffer.length,
                    InetAddress.getByName("255.255.255.255"),
                    targetPort
                );

                socket.send(broadcastPacket);
                Log.d(TAG, "Sent UDP discovery broadcast to 255.255.255.255:" + targetPort + " -> " + payload);

                JSArray devices = new JSArray();
                Set<String> seenIps = new HashSet<>();
                long startTime = System.currentTimeMillis();
                byte[] receiveBuf = new byte[4096];

                while ((System.currentTimeMillis() - startTime) < timeoutMs) {
                    try {
                        DatagramPacket receivePacket = new DatagramPacket(receiveBuf, receiveBuf.length);
                        socket.receive(receivePacket);

                        String senderIp = receivePacket.getAddress().getHostAddress();
                        String responseData = new String(receivePacket.getData(), 0, receivePacket.getLength(), StandardCharsets.UTF_8).trim();
                        Log.d(TAG, "Received UDP response from " + senderIp + ": " + responseData);

                        JSObject dev = new JSObject();
                        try {
                            JSONObject resJson = new JSONObject(responseData);

                            String ip = resJson.optString("ip", senderIp);
                            if (ip == null || ip.isEmpty()) {
                                ip = senderIp;
                            }

                            int wsPort = resJson.optInt("port", 53535);
                            int mediaPort = resJson.optInt("media_port", 53536);
                            int udpPort = resJson.optInt("udp_port", targetPort);
                            boolean tokenMatched = resJson.optBoolean("token_matched", false);
                            String deviceName = resJson.optString("device_name", resJson.optString("name", resJson.optString("hostname", "PC at " + ip)));

                            dev.put("ip", ip);
                            dev.put("port", wsPort);
                            dev.put("media_port", mediaPort);
                            dev.put("udp_port", udpPort);
                            dev.put("token_matched", tokenMatched);
                            dev.put("device_name", deviceName);
                            dev.put("name", deviceName);
                            dev.put("raw", responseData);

                            String uniqueKey = ip + ":" + wsPort;
                            if (!seenIps.contains(uniqueKey)) {
                                seenIps.add(uniqueKey);
                                devices.put(dev);
                            }
                        } catch (Exception parseEx) {
                            Log.w(TAG, "Non-JSON UDP response from " + senderIp + ": " + responseData);
                            dev.put("ip", senderIp);
                            dev.put("port", 53535);
                            dev.put("media_port", 53536);
                            dev.put("udp_port", targetPort);
                            dev.put("token_matched", false);
                            dev.put("device_name", "PC at " + senderIp);
                            dev.put("name", "PC at " + senderIp);
                            dev.put("raw", responseData);

                            if (!seenIps.contains(senderIp)) {
                                seenIps.add(senderIp);
                                devices.put(dev);
                            }
                        }

                    } catch (SocketTimeoutException ste) {
                        // Reached timeout
                        break;
                    } catch (Exception e) {
                        Log.e(TAG, "Error receiving UDP packet", e);
                        break;
                    }
                }

                JSObject result = new JSObject();
                result.put("devices", devices);
                call.resolve(result);

            } catch (Exception e) {
                Log.e(TAG, "Error during UDP discovery", e);
                call.reject("UDP discovery failed: " + e.getMessage(), e);
            } finally {
                if (socket != null && !socket.isClosed()) {
                    socket.close();
                }
                if (multicastLock != null && multicastLock.isHeld()) {
                    try {
                        multicastLock.release();
                    } catch (Exception ignored) {}
                }
            }
        }).start();
    }
}
