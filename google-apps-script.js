/**
 * Google Apps Script Web App for The Kingdom Leaders (TKL)
 * Automatically routes registrations into separate sheets (tabs) for CURRENT events only:
 * 1. West Chapter Grand Launch (18 Sep 2026 - Praise Evangelical Church, Mugalivakkam) [Free Entry]
 * 2. Central Chapter Meeting 1 (18 Sep 2026 - Kings & Queens Assembly, Mogappair West) [₹250 Entry]
 * 3. Member Connections (Join TKL / Contact Us page)
 */

// 1. Configuration - Sheet / Tab Names for CURRENT Events Only
const SHEET_WEST = "West Chapter Grand Launch";      // Current Event (18 Sep 2026 - Free Entry)
const SHEET_CENTRAL = "Central Chapter Meeting 1";   // Current Event (18 Sep 2026 - ₹250 Entry)
const SHEET_CONTACT = "Member Connections";          // Contact / Join TKL form
const DRIVE_FOLDER_NAME = "Registration Receipts";   // Google Drive Folder for Central Chapter Receipts

function doPost(e) {
  try {
    // Parse incoming JSON data
    const data = JSON.parse(e.postData.contents);
    const formType = data.formType; // 'marketplace' or 'member'
    const eventName = data.eventName || "";
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet;
    
    if (formType === 'marketplace') {
      // Determine which current event tab to write to based on eventName keywords
      let targetSheetName = SHEET_WEST;
      const lowerEvent = eventName.toLowerCase();
      
      if (lowerEvent.includes("central") || lowerEvent.includes("mogappair")) {
        targetSheetName = SHEET_CENTRAL;
      } else if (lowerEvent.includes("west") || lowerEvent.includes("mugalivakkam")) {
        targetSheetName = SHEET_WEST;
      } else {
        // Fallback default to West Chapter Grand Launch
        targetSheetName = SHEET_WEST;
      }
      
      // Get existing tab or create new tab automatically
      sheet = ss.getSheetByName(targetSheetName) || ss.insertSheet(targetSheetName);
      
      // Initialize headers if the tab is newly created
      if (sheet.getLastRow() === 0) {
        sheet.appendRow([
          "Timestamp", "Full Name", "Email Address", "Mobile Number", "Residential PIN Code",
          "Business / Company Name", "Profession / Role", "Existing TKL Member?", "Referred By",
          "Entry Type", "Additional Guests", "Total Cost (₹)", "Receipt Link"
        ]);
        
        // Distinct header styling per event
        let headerColor = "#FFE0B2"; // Warm Orange for West Chapter
        if (targetSheetName === SHEET_CENTRAL) {
          headerColor = "#FFF3CD"; // Warm Gold for Central Chapter
        }
        
        sheet.getRange(1, 1, 1, 13).setFontWeight("bold").setBackground(headerColor);
        sheet.setFrozenRows(1);
      }
      
      // Handle file upload to Google Drive if receipt screenshot is attached (for paid events like Central)
      let receiptLink = (data.totalCost === 0) ? "Free Registration (No Receipt Needed)" : "No Receipt Uploaded";
      if (data.receiptData && data.receiptName) {
        receiptLink = uploadToDrive(data.receiptData, data.receiptMimeType, data.receiptName, data.name);
      }
      
      // Append row to the respective event sheet
      sheet.appendRow([
        new Date(),
        data.name || "",
        data.email || "",
        "'" + (data.phone || ""),
        "'" + (data.pincode || ""),
        data.company || "",
        data.role || "",
        data.isExistingMember || "No",
        data.referredBy || "",
        data.entryType || (targetSheetName === SHEET_WEST ? "Free Entry (Dinner Included)" : "Paid Entry ₹250 (Dinner Included)"),
        data.additionalGuests || 0,
        data.totalCost !== undefined ? data.totalCost : 0,
        receiptLink
      ]);
      
    } else if (formType === 'member') {
      // Setup Sheet: Member Connections (Contact Page)
      sheet = ss.getSheetByName(SHEET_CONTACT) || ss.insertSheet(SHEET_CONTACT);
      
      // Initialize headers if empty
      if (sheet.getLastRow() === 0) {
        sheet.appendRow([
          "Timestamp", "Full Name", "Contact Number", "Gender", "Church Name", 
          "Business Name", "Business PIN", "Business Address", 
          "Residential Address", "Residential PIN", "Referred By", 
          "Lead Willingness", "Join Prayer Team"
        ]);
        sheet.getRange(1, 1, 1, 13).setFontWeight("bold").setBackground("#D1ECF1");
        sheet.setFrozenRows(1);
      }
      
      // Append member connection row
      sheet.appendRow([
        new Date(),
        data.fullname || "",
        "'" + (data.phone || ""),
        data.gender || "",
        data.church || "",
        data.bizname || "",
        "'" + (data.bizpin || ""),
        data.bizaddr || "",
        data.resaddr || "",
        "'" + (data.respin || ""),
        data.referred || "",
        data.leadWillingness || "",
        data.prayerTeam || ""
      ]);
    } else {
      throw new Error("Invalid form type specified");
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Data successfully written to Google Sheet"
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Helper to upload a base64 receipt to Google Drive
 */
function uploadToDrive(base64Data, mimeType, filename, participantName) {
  try {
    const bytes = Utilities.base64Decode(base64Data);
    const blob = Utilities.newBlob(bytes, mimeType || "image/png", (participantName || "Participant") + "_" + filename);
    
    // Find or create receipts folder
    const folders = DriveApp.getFoldersByName(DRIVE_FOLDER_NAME);
    let folder;
    if (folders.hasNext()) {
      folder = folders.next();
    } else {
      folder = DriveApp.createFolder(DRIVE_FOLDER_NAME);
    }
    
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return file.getUrl();
  } catch (err) {
    return "Upload error: " + err.toString();
  }
}

/**
 * Handle HTTP GET requests (for troubleshooting deployment status)
 */
function doGet(e) {
  return ContentService.createTextOutput("TKL Form Handler Web App is active and running! Ready to receive form submissions.")
    .setMimeType(ContentService.MimeType.TEXT);
}
