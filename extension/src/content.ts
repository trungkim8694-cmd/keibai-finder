// content.ts
// Lắng nghe yêu cầu từ Popup Extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "GET_HIGHLIGHTED_TEXT") {
    // Lấy chuỗi văn bản đang được bôi đen trên trình duyệt
    const selection = window.getSelection();
    const highlightedText = selection ? selection.toString().trim() : "";
    
    sendResponse({ text: highlightedText });
  }
  return true; // Giữ kết nối asynchronous
});
