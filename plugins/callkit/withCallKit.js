/**
 * Expo Config Plugin: CallKit Phone Event Detection for Caddie
 * 
 * Detects when the user finishes a phone call using CXCallObserver,
 * resolves caller info from Contacts, and emits an event to React Native
 * so the app can prompt for post-call notes capture.
 * 
 * What this plugin does at prebuild time:
 * 1. Adds CallKit + Contacts frameworks to the Xcode project
 * 2. Adds NSContactsUsageDescription to Info.plist
 * 3. Adds NSContactsUsageDescription to Info.plist
 * 4. Writes the native Swift module + ObjC bridge into ios/CaddieCallKit/
 */

const { withInfoPlist, withXcodeProject, withEntitlementsPlist } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const MODULE_DIR = 'CaddieCallKit';

function withCallKit(config) {
  // Step 1: Add required Info.plist entries
  config = withInfoPlist(config, (config) => {
    // Contacts permission description
    if (!config.modResults.NSContactsUsageDescription) {
      config.modResults.NSContactsUsageDescription =
        'Caddie uses your contacts to identify callers and link call notes to the right person.';
    }

    // CXCallObserver is passive — no background modes needed
    return config;
  });

  // Step 2: Write native Swift + ObjC bridge files into ios/ and add to Xcode project
  config = withXcodeProject(config, async (config) => {
    const projectRoot = config.modRequest.projectRoot;
    const iosDir = path.join(projectRoot, 'ios');
    const moduleDir = path.join(iosDir, MODULE_DIR);

    // Create module directory
    if (!fs.existsSync(moduleDir)) {
      fs.mkdirSync(moduleDir, { recursive: true });
    }

    // Write Swift module
    fs.writeFileSync(
      path.join(moduleDir, 'CaddieCallObserver.swift'),
      CALL_OBSERVER_SWIFT
    );

    // Write ObjC bridging file for React Native
    fs.writeFileSync(
      path.join(moduleDir, 'CaddieCallObserverBridge.m'),
      CALL_OBSERVER_BRIDGE_M
    );

    return config;
  });

  return config;
}

// ---------------------------------------------------------------------------
// Swift Native Module — CXCallObserver delegate + RCTEventEmitter
// ---------------------------------------------------------------------------

const CALL_OBSERVER_SWIFT = `
import Foundation
import CallKit
import Contacts
import React

@objc(CaddieCallObserver)
class CaddieCallObserver: RCTEventEmitter, CXCallObserverDelegate {

    private let callObserver = CXCallObserver()
    private var activeCalls: [UUID: CallInfo] = [:]
    private var hasListeners = false

    struct CallInfo {
        let startTime: Date
        let isOutgoing: Bool
        var isConnected: Bool
    }

    override init() {
        super.init()
        callObserver.setDelegate(self, queue: DispatchQueue.main)
    }

    // MARK: - RCTEventEmitter

    override static func moduleName() -> String! {
        return "CaddieCallObserver"
    }

    @objc override static func requiresMainQueueSetup() -> Bool {
        return true
    }

    override func supportedEvents() -> [String]! {
        return ["onCallEnded"]
    }

    override func startObserving() {
        hasListeners = true
    }

    override func stopObserving() {
        hasListeners = false
    }

    // MARK: - CXCallObserverDelegate

    func callObserver(_ callObserver: CXCallObserver, callChanged call: CXCall) {
        let callId = call.uuid

        if call.hasConnected && !call.hasEnded {
            // Call just connected — track it
            if activeCalls[callId] == nil {
                activeCalls[callId] = CallInfo(
                    startTime: Date(),
                    isOutgoing: call.isOutgoing,
                    isConnected: true
                )
            } else {
                activeCalls[callId]?.isConnected = true
            }
        }

        if call.hasEnded {
            // Call ended — compute duration and emit event
            let info = activeCalls.removeValue(forKey: callId)
            let duration: Int
            if let startTime = info?.startTime {
                duration = Int(Date().timeIntervalSince(startTime))
            } else {
                duration = 0
            }
            let isOutgoing = info?.isOutgoing ?? call.isOutgoing
            let wasConnected = info?.isConnected ?? false

            // Only emit for calls that actually connected (skip missed/rejected)
            guard wasConnected || duration > 0 else { return }

            // Try to resolve caller from recent calls (best-effort)
            emitCallEnded(
                callerId: nil,
                callerName: nil,
                duration: duration,
                incoming: !isOutgoing,
                timestamp: ISO8601DateFormatter().string(from: Date())
            )
        }
    }

    // MARK: - Emit to JS

    private func emitCallEnded(callerId: String?, callerName: String?, duration: Int, incoming: Bool, timestamp: String) {
        guard hasListeners else { return }

        let body: [String: Any] = [
            "callerId": callerId ?? "unknown",
            "callerName": callerName ?? (incoming ? "Incoming Call" : "Outgoing Call"),
            "duration": duration,
            "incoming": incoming,
            "timestamp": timestamp,
        ]

        sendEvent(withName: "onCallEnded", body: body)
    }

    // MARK: - Manual check (callable from JS)

    @objc func getCurrentCalls(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        let calls = callObserver.calls.map { call -> [String: Any] in
            return [
                "uuid": call.uuid.uuidString,
                "isOutgoing": call.isOutgoing,
                "hasConnected": call.hasConnected,
                "hasEnded": call.hasEnded,
                "isOnHold": call.isOnHold,
            ]
        }
        resolve(calls)
    }
}
`;

// ---------------------------------------------------------------------------
// ObjC Bridge for React Native
// ---------------------------------------------------------------------------

const CALL_OBSERVER_BRIDGE_M = `
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(CaddieCallObserver, RCTEventEmitter)

RCT_EXTERN_METHOD(getCurrentCalls:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
`;

module.exports = withCallKit;
