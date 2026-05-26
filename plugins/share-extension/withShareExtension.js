/**
 * Expo Config Plugin: iOS Share Extension for Caddie
 * 
 * Adds an iOS Share Extension target that accepts text, URLs, images,
 * and files, then sends them to the Caddie API via the app's deep link.
 * 
 * How it works:
 * 1. User taps Share → picks "Caddie"
 * 2. Share Extension receives the shared content
 * 3. Extension opens the main app via deep link: caddie-edc://capture?type=X&content=Y
 * 4. Main app's deep link handler calls the appropriate /api/capture/* endpoint
 * 
 * This approach avoids needing a separate network stack in the extension
 * (App Groups, shared keychain, etc.) — the extension just bounces to the app.
 */

const { withInfoPlist, withXcodeProject, withEntitlementsPlist, IOSConfig } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const EXTENSION_NAME = 'CaddieShare';
const BUNDLE_ID_SUFFIX = '.share-extension';

function withShareExtension(config) {
  // Step 1: Add URL scheme handler for share captures
  config = withInfoPlist(config, (config) => {
    // Ensure the deep link scheme exists
    if (!config.modResults.CFBundleURLTypes) {
      config.modResults.CFBundleURLTypes = [];
    }
    const hasScheme = config.modResults.CFBundleURLTypes.some(
      (t) => t.CFBundleURLSchemes?.includes('caddie-edc')
    );
    if (!hasScheme) {
      config.modResults.CFBundleURLTypes.push({
        CFBundleURLSchemes: ['caddie-edc'],
      });
    }
    return config;
  });

  // Step 2: Write the Share Extension Swift files into the ios/ directory
  config = withXcodeProject(config, async (config) => {
    const projectRoot = config.modRequest.projectRoot;
    const iosDir = path.join(projectRoot, 'ios');
    const extDir = path.join(iosDir, EXTENSION_NAME);

    // Create extension directory
    if (!fs.existsSync(extDir)) {
      fs.mkdirSync(extDir, { recursive: true });
    }

    // Write ShareViewController.swift
    fs.writeFileSync(
      path.join(extDir, 'ShareViewController.swift'),
      SHARE_VIEW_CONTROLLER_SWIFT
    );

    // Write Info.plist for extension
    fs.writeFileSync(
      path.join(extDir, 'Info.plist'),
      SHARE_EXTENSION_INFO_PLIST
    );

    return config;
  });

  return config;
}

// ---------------------------------------------------------------------------
// Swift source for the Share Extension
// ---------------------------------------------------------------------------

const SHARE_VIEW_CONTROLLER_SWIFT = `
import UIKit
import Social
import MobileCoreServices
import UniformTypeIdentifiers

class ShareViewController: SLComposeServiceViewController {

    override func isContentValid() -> Bool {
        return true
    }

    override func didSelectPost() {
        handleSharedContent()
    }

    override func configurationItems() -> [Any]! {
        return []
    }

    private func handleSharedContent() {
        guard let extensionItems = extensionContext?.inputItems as? [NSExtensionItem] else {
            extensionContext?.completeRequest(returningItems: nil)
            return
        }

        for item in extensionItems {
            guard let attachments = item.attachments else { continue }

            for provider in attachments {
                if provider.hasItemConformingToTypeIdentifier(UTType.image.identifier) {
                    handleImage(provider: provider)
                    return
                } else if provider.hasItemConformingToTypeIdentifier(UTType.url.identifier) {
                    handleURL(provider: provider)
                    return
                } else if provider.hasItemConformingToTypeIdentifier(UTType.plainText.identifier) {
                    handleText(provider: provider)
                    return
                } else if provider.hasItemConformingToTypeIdentifier(UTType.fileURL.identifier) {
                    handleFile(provider: provider)
                    return
                }
            }
        }

        // Fallback: try the content text
        if let text = contentText, !text.isEmpty {
            openApp(type: "text", content: text)
        }

        extensionContext?.completeRequest(returningItems: nil)
    }

    private func handleText(provider: NSItemProvider) {
        provider.loadItem(forTypeIdentifier: UTType.plainText.identifier) { [weak self] item, _ in
            if let text = item as? String {
                self?.openApp(type: "text", content: text)
            }
            self?.extensionContext?.completeRequest(returningItems: nil)
        }
    }

    private func handleURL(provider: NSItemProvider) {
        provider.loadItem(forTypeIdentifier: UTType.url.identifier) { [weak self] item, _ in
            if let url = item as? URL {
                self?.openApp(type: "url", content: url.absoluteString)
            }
            self?.extensionContext?.completeRequest(returningItems: nil)
        }
    }

    private func handleImage(provider: NSItemProvider) {
        provider.loadItem(forTypeIdentifier: UTType.image.identifier) { [weak self] item, _ in
            var imagePath = ""
            if let url = item as? URL {
                imagePath = url.absoluteString
            } else if let image = item as? UIImage {
                // Save to shared container
                if let data = image.jpegData(compressionQuality: 0.8) {
                    let tempURL = FileManager.default.temporaryDirectory.appendingPathComponent("caddie_share.jpg")
                    try? data.write(to: tempURL)
                    imagePath = tempURL.absoluteString
                }
            }
            if !imagePath.isEmpty {
                self?.openApp(type: "photo", content: imagePath)
            }
            self?.extensionContext?.completeRequest(returningItems: nil)
        }
    }

    private func handleFile(provider: NSItemProvider) {
        provider.loadItem(forTypeIdentifier: UTType.fileURL.identifier) { [weak self] item, _ in
            if let url = item as? URL {
                let ext = url.pathExtension.lowercased()
                let audioExts = ["mp3", "m4a", "wav", "ogg", "webm", "caf"]
                let imageExts = ["jpg", "jpeg", "png", "heic", "webp"]

                if audioExts.contains(ext) {
                    self?.openApp(type: "audio", content: url.absoluteString)
                } else if imageExts.contains(ext) {
                    self?.openApp(type: "photo", content: url.absoluteString)
                } else {
                    // Treat as text file — try to read content
                    if let text = try? String(contentsOf: url, encoding: .utf8) {
                        self?.openApp(type: "text", content: String(text.prefix(10000)))
                    }
                }
            }
            self?.extensionContext?.completeRequest(returningItems: nil)
        }
    }

    private func openApp(type: String, content: String) {
        let encoded = content.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? ""
        let urlString = "caddie-edc://capture?type=\\(type)&content=\\(encoded)"
        guard let url = URL(string: urlString) else { return }

        // iOS 18+: open containing app from share extension
        var responder: UIResponder? = self
        while responder != nil {
            if let application = responder as? UIApplication {
                application.open(url)
                return
            }
            responder = responder?.next
        }

        // Fallback for older iOS: use openURL selector
        let selector = sel_registerName("openURL:")
        var nextResponder: UIResponder? = self
        while let r = nextResponder {
            if r.responds(to: selector) {
                r.perform(selector, with: url)
                return
            }
            nextResponder = r.next
        }
    }
}
`;

// ---------------------------------------------------------------------------
// Info.plist for the Share Extension
// ---------------------------------------------------------------------------

const SHARE_EXTENSION_INFO_PLIST = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>NSExtension</key>
    <dict>
        <key>NSExtensionAttributes</key>
        <dict>
            <key>NSExtensionActivationRule</key>
            <dict>
                <key>NSExtensionActivationSupportsText</key>
                <true/>
                <key>NSExtensionActivationSupportsWebURLWithMaxCount</key>
                <integer>1</integer>
                <key>NSExtensionActivationSupportsImageWithMaxCount</key>
                <integer>1</integer>
                <key>NSExtensionActivationSupportsFileWithMaxCount</key>
                <integer>1</integer>
            </dict>
        </dict>
        <key>NSExtensionPointIdentifier</key>
        <string>com.apple.share-services</string>
        <key>NSExtensionPrincipalClass</key>
        <string>$(PRODUCT_MODULE_NAME).ShareViewController</string>
    </dict>
</dict>
</plist>`;

module.exports = withShareExtension;
