//
//  ShareViewController.swift
//  DoughlyShareExtension
//
//  Created by Josh Merrell on 3/23/25.
//

import UIKit
import Social
import UniformTypeIdentifiers

// class ShareViewController: SLComposeServiceViewController {

//     override func isContentValid() -> Bool {
//         // Do validation of contentText and/or NSExtensionContext attachments here
//         return true
//     }

//     // override func didSelectPost() {
//     //     // This is called after the user selects Post. Do the upload of contentText and/or NSExtensionContext attachments.
    
//     //     // Inform the host that we're done, so it un-blocks its UI. Note: Alternatively you could call super's -didSelectPost, which will similarly complete the extension context.
//     //     self.extensionContext!.completeRequest(returningItems: [], completionHandler: nil)
//     // }
//     override func didSelectPost() {
//         if let item = extensionContext?.inputItems.first as? NSExtensionItem {
//             if let attachments = item.attachments {
//                 for provider in attachments {
//                     if provider.hasItemConformingToTypeIdentifier(UTType.url.identifier) {
//                         provider.loadItem(forTypeIdentifier: UTType.url.identifier, options: nil) { (urlItem, error) in
//                             if let url = urlItem as? URL {
//                                 self.openApp(with: url.absoluteString)
//                             }
//                         }
//                         break
//                     } else if provider.hasItemConformingToTypeIdentifier(UTType.text.identifier) {
//                         provider.loadItem(forTypeIdentifier: UTType.text.identifier, options: nil) { (textItem, error) in
//                             if let urlText = textItem as? String {
//                                 self.openApp(with: urlText)
//                             }
//                         }
//                     }
//                 }
//             }
//         }

//         self.extensionContext!.completeRequest(returningItems: [], completionHandler: nil)
//     }

//     private func openApp(with urlString: String) {
//         let appUrl = URL(string: "doughly://share?url=\(urlString.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? "")")!
//         var responder: UIResponder? = self
//         while responder != nil {
//             if responder?.responds(to: Selector(("openURL:"))) == true {
//                 responder?.perform(Selector(("openURL:")), with: appUrl)
//             }
//             responder = responder?.next
//         }
//     }

//     override func configurationItems() -> [Any]! {
//         // To add configuration options via table cells at the bottom of the sheet, return an array of SLComposeSheetConfigurationItem here.
//         return []
//     }

// }

class ShareViewController: UIViewController {
    override func viewDidLoad() {
        super.viewDidLoad()
        handleIncomingItems()
    }

    private func handleIncomingItems() {
        guard let extensionItem = extensionContext?.inputItems.first as? NSExtensionItem else {
            self.extensionContext?.completeRequest(returningItems: nil, completionHandler: nil)
            return
        }

        if let attachments = extensionItem.attachments {
            for provider in attachments {
                if provider.hasItemConformingToTypeIdentifier(UTType.url.identifier) {
                    provider.loadItem(forTypeIdentifier: UTType.url.identifier, options: nil) { (urlItem, error) in
                        if let url = urlItem as? URL {
                            self.openApp(with: url.absoluteString)
                        }
                        self.extensionContext?.completeRequest(returningItems: nil, completionHandler: nil)
                    }
                    return
                } else if provider.hasItemConformingToTypeIdentifier(UTType.text.identifier) {
                    provider.loadItem(forTypeIdentifier: UTType.text.identifier, options: nil) { (textItem, error) in
                        if let urlText = textItem as? String {
                            self.openApp(with: urlText)
                        }
                        self.extensionContext?.completeRequest(returningItems: nil, completionHandler: nil)
                    }
                    return
                }
            }
        }

        self.extensionContext?.completeRequest(returningItems: nil, completionHandler: nil)
    }

    private func openApp(with urlString: String) {
        let appUrl = URL(string: "doughly://share?url=\(urlString.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? "")")!
        var responder: UIResponder? = self
        while responder != nil {
            if responder?.responds(to: Selector(("openURL:"))) == true {
                responder?.perform(Selector(("openURL:")), with: appUrl)
            }
            responder = responder?.next
        }
    }
}