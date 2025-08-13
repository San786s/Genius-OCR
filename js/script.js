console.log("🚀 OCR App Loaded"); // Debugging: Check if JavaScript is loaded

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM fully loaded!"); // Confirm DOM is ready

  // ---------- IMAGE OCR FILE INPUT ----------
  const generalFileInput = document.getElementById("file-input");
  const generalFileNameDisplay = document.getElementById("file-name");
  const processBtn = document.getElementById("process-btn");

  if (generalFileInput && generalFileNameDisplay) {
    generalFileInput.addEventListener("change", function (e) {
      const fileName = e.target.files[0]?.name || "No file chosen";
      generalFileNameDisplay.textContent = fileName;
      console.log("📂 General File selected:", fileName);
    });
  }

  if (processBtn) {
    processBtn.addEventListener("click", async () => {
      const file = generalFileInput.files[0];
      let selectedOptionElement = document.getElementById("selected-option");
      let language = selectedOptionElement
        ? selectedOptionElement.getAttribute("data-value") || "eng"
        : "eng"; // fallback to English

      if (!file) {
        alert("⚠️ Please upload a file.");
        return;
      }

      console.log("📂 Processing file:", file.name, "with language:", language);
      document.getElementById("processing-section").style.display = "block";

      const reader = new FileReader();
      reader.onload = async (e) => {
        const image = new Image();
        image.src = e.target.result;

        image.onload = async () => {
          console.log("🖼️ Image loaded, enhancing quality...");

          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          const scaleFactor = 2;
          canvas.width = image.width * scaleFactor;
          canvas.height = image.height * scaleFactor;
          ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

          console.log("🔍 Running OCR with Tesseract...");
          try {
            const worker = await Tesseract.createWorker({
              logger: (m) => console.log(m),
            });

            await worker.load();
            await worker.loadLanguage(language);
            await worker.initialize(language);

            const {
              data: { text },
            } = await worker.recognize(canvas);
            await worker.terminate();

            console.log("✅ Tesseract OCR result:", text);
            document.getElementById("output-text").value = text.trim()
              ? text
              : "No text detected.";
          } catch (error) {
            console.error("❌ Tesseract Error:", error);
            alert("❌ Tesseract failed. Trying EasyOCR...");
            const easyText = await runEasyOCR(canvas, language);
            document.getElementById("output-text").value = easyText;
          } finally {
            document.getElementById("processing-section").style.display = "none";
          }
        };
      };
      reader.readAsDataURL(file);
    });
  }

  // ---------- EASY OCR FALLBACK ----------
  async function runEasyOCR(canvas, language) {
    try {
      console.log("🔄 Running EasyOCR...");
      const easyOCR = new EasyOCR();
      const result = await easyOCR.recognize(canvas, { lang: language });
      console.log("✅ EasyOCR result:", result);
      return result.trim() ? result : "EasyOCR failed.";
    } catch (error) {
      console.error("❌ EasyOCR Error:", error);
      alert("❌ OCR failed completely. Try another image.");
      return "";
    }
  }

  // ---------- PDF PROCESSING ----------
  const pdfFileInput = document.getElementById("pdf-file-input");
  const pdfFileNameDisplay = document.getElementById("pdf-file-name");
  const pdfProcessBtn = document.getElementById("pdf-process-btn");
  const pdfDownloadBtn = document.getElementById("pdf-download-btn");

  if (pdfFileInput && pdfFileNameDisplay) {
    pdfFileInput.addEventListener("change", function () {
      console.log("✅ PDF file input changed!");
      pdfFileNameDisplay.textContent =
        pdfFileInput.files.length > 0 ? pdfFileInput.files[0].name : "No file chosen";
    });
  }

  if (pdfProcessBtn) {
    pdfProcessBtn.addEventListener("click", convertPdfToImage);
  }

  if (pdfDownloadBtn) {
    pdfDownloadBtn.addEventListener("click", downloadImages);
  }

  // ---------- COPY TEXT TO CLIPBOARD ----------
  const copyBtn = document.getElementById("copy-btn");
  if (copyBtn) {
    copyBtn.addEventListener("click", () => {
      const textArea = document.getElementById("output-text");
      textArea.select();
      document.execCommand("copy");
      alert("✅ Text copied to clipboard!");
    });
  }

  // ---------- DOWNLOAD TEXT FILE FUNCTION ----------
  const downloadButton = document.getElementById("download-btn");
  if (downloadButton) {
    downloadButton.addEventListener("click", () => {
      console.log("📥 Download button clicked!");
      downloadFile("txt");
    });
  } else {
    console.error("❌ Download button NOT found.");
  }

  function downloadFile(fileType = "txt") {
    const text = document.getElementById("output-text").value;
    if (!text.trim()) {
      alert("⚠️ No text available to download!");
      return;
    }
    let filename = "extracted-text";
    if (fileType === "txt") filename += ".txt";
    else if (fileType === "doc" || fileType === "docx") filename += ".docx";
    else if (fileType === "pdf") filename += ".pdf";

    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    console.log(`✅ Downloaded file: ${filename}`);
  }

  // ---------- DROPDOWN OPTION SELECTION ----------
  const selectedOption = document.getElementById("selected-option");
  const optionsBox = document.getElementById("options-box");
  const options = document.querySelectorAll(".option");

  // Toggle dropdown visibility
  if (selectedOption && optionsBox) {
    selectedOption.addEventListener("click", () => {
      optionsBox.style.display = optionsBox.style.display === "block" ? "none" : "block";
    });
  }

  // Option selection and data-value update
  options.forEach((option) => {
    option.addEventListener("click", () => {
      if (selectedOption) {
        selectedOption.textContent = option.textContent; // Update visible text
        selectedOption.setAttribute("data-value", option.getAttribute("data-value")); // Update data-value attribute
        optionsBox.style.display = "none";
      }
    });
  });

  // Close dropdown if clicking outside
  document.addEventListener("click", (event) => {
    const isInsideCustomDropdown = event.target.closest(".custom-dropdown");
    if (!isInsideCustomDropdown && optionsBox) {
      optionsBox.style.display = "none";
    }
  });

  // ---------- FAQ TOGGLE ----------
  const faqItems = document.querySelectorAll(".faq-item");
  faqItems.forEach((item) => {
    item.addEventListener("click", () => {
      item.classList.toggle("active");
    });
  });

  // ---------- DARK MODE TOGGLE ----------
  const themeToggle = document.getElementById("theme-toggle");
  const modalThemeToggle = document.getElementById("modal-theme-toggle");
  const body = document.body;
  function applyDarkModeText(isDark) {
    const text = isDark ? "☀️ Light Mode" : "🌙 Dark Mode";
    if (themeToggle) themeToggle.textContent = text;
    if (modalThemeToggle) modalThemeToggle.textContent = text;
  }
  function toggleDarkMode() {
    body.classList.toggle("dark-mode");
    const isDark = body.classList.contains("dark-mode");
    applyDarkModeText(isDark);
    localStorage.setItem("dark-mode", isDark ? "enabled" : "disabled");
  }
  // Initial Load
  if (localStorage.getItem("dark-mode") === "enabled") {
    body.classList.add("dark-mode");
    applyDarkModeText(true);
  } else {
    applyDarkModeText(false);
  }
  if (themeToggle) {
    themeToggle.addEventListener("click", toggleDarkMode);
  } else {
    console.error("Dark mode toggle button not found!");
  }
  if (modalThemeToggle) {
    modalThemeToggle.addEventListener("click", toggleDarkMode);
  }
});


const translations = {
  "en": {
    "Home": "Home",
    "API": "API",
    "PDF TO WORD": "PDF TO WORD",
    "PDF TO EXCEL": "PDF TO EXCEL",
    "PDF TO IMAGE": "PDF TO IMAGE",
    "Image to Text Converter – Convert Images, PDFs, and Screenshots into Editable Text":
      "Image to Text Converter – Convert Images, PDFs, and Screenshots into Editable Text",
    "Convert images and scanned documents into editable text instantly using our free online OCR tool. Extract text from JPG, PNG, PDF, or screenshots and save them as Word, Excel, or plain text.":
      "Convert images and scanned documents into editable text instantly using our free online OCR tool. Extract text from JPG, PNG, PDF, or screenshots and save them as Word, Excel, or plain text.",
    "Image to Text Converter": "Image to Text Converter",
    "Choose File": "Choose File",
    "Select Language": "Select Language",
    "Extract Text": "Extract Text",
    "Upload an image (JPG, PNG) or PDF to extract text.": "Upload an image (JPG, PNG) or PDF to extract text.",
    "Copy": "Copy",
    "Download": "Download",
    "What is an Image to Text Converter?": "What is an Image to Text Converter?",
    "Extract text from images (JPG, PNG, etc.).": "Extract text from images (JPG, PNG, etc.).",
    "Convert PDF to Word, Excel, or Text.": "Convert PDF to Word, Excel, or Text.",
    "Accurate and secure OCR technology.": "Accurate and secure OCR technology.",
    "Free and easy to use.": "Free and easy to use.",
    "Image to Text Converter Icon": "Image to Text Converter Icon",
    "How to Convert an Image to Text Online?": "How to Convert an Image to Text Online?",
    "Follow these simple steps to extract text from images and PDFs using our advanced OCR tool.": "Follow these simple steps to extract text from images and PDFs using our advanced OCR tool.",
    "1️⃣ Upload Your Image or PDF": "1️⃣ Upload Your Image or PDF",
    "Click the 'Upload' button to select an image (JPG, PNG, BMP) or a PDF file from your device.": "Click the 'Upload' button to select an image (JPG, PNG, BMP) or a PDF file from your device.",
    "Supported Formats: JPG, PNG, BMP, GIF, PDF": "Supported Formats: JPG, PNG, BMP, GIF, PDF",
    "Upload Options: Device, Google Drive, Dropbox": "Upload Options: Device, Google Drive, Dropbox",
    "2️⃣ Choose Language for Better Accuracy": "2️⃣ Choose Language for Better Accuracy",
    "Select the language of the text in your document. Our AI-powered OCR software supports multiple languages, ensuring precise text extraction.": "Select the language of the text in your document. Our AI-powered OCR software supports multiple languages, ensuring precise text extraction.",
    "Supports: English, Spanish, French, German, Hindi, Arabic, Chinese, and more.": "Supports: English, Spanish, French, German, Hindi, Arabic, Chinese, and more.",
    "Bonus: Our tool also recognizes handwritten text.": "Bonus: Our tool also recognizes handwritten text.",
    "3️⃣ Click Convert & Extract Text": "3️⃣ Click Convert & Extract Text",
    "Hit the 'Convert' button, and our tool will instantly process the image, extracting text with high accuracy.": "Hit the 'Convert' button, and our tool will instantly process the image, extracting text with high accuracy.",
    "Preview the extracted text before downloading.": "Preview the extracted text before downloading.",
    "4️⃣ Copy or Download Your Text": "4️⃣ Copy or Download Your Text",
    "Once the conversion is complete, you can:": "Once the conversion is complete, you can:",
    "Copy the text and paste it anywhere.": "Copy the text and paste it anywhere.",
    "Download the extracted text in your preferred format:": "Download the extracted text in your preferred format:",
    "Word (.docx) – for editing in Microsoft Word": "Word (.docx) – for editing in Microsoft Word",
    "Excel (.xlsx) – for structured data extraction": "Excel (.xlsx) – for structured data extraction",
    "Plain Text (.txt) – for basic text storage": "Plain Text (.txt) – for basic text storage",
    "🚀 Instant, free, and no registration required!": "🚀 Instant, free, and no registration required!",
    "Features of Our Free Online OCR Tool": "Features of Our Free Online OCR Tool",
    "High Accuracy: Extracts text with precision, even from low-quality images.": "High Accuracy: Extracts text with precision, even from low-quality images.",
    "Multiple File Formats: Supports JPG, PNG, GIF, BMP, TIFF, and PDFs.": "Multiple File Formats: Supports JPG, PNG, GIF, BMP, TIFF, and PDFs.",
    "User-Friendly: No technical knowledge required – just upload and convert.": "User-Friendly: No technical knowledge required – just upload and convert.",
    "Secure & Private: Files are processed securely and deleted automatically.": "Secure & Private: Files are processed securely and deleted automatically.",
    "100% Free: Unlimited conversions with no hidden costs.": "100% Free: Unlimited conversions with no hidden costs.",
    "Applications of OCR Technology": "Applications of OCR Technology",
    "Students & Academics: Convert scanned textbooks and notes into editable documents.": "Students & Academics: Convert scanned textbooks and notes into editable documents.",
    "Business & Office Work: Digitize invoices, contracts, and reports.": "Business & Office Work: Digitize invoices, contracts, and reports.",
    "Legal & Government Documents: Convert official papers into text for editing.": "Legal & Government Documents: Convert official papers into text for editing.",
    "Healthcare Records: Extract medical notes and prescriptions.": "Healthcare Records: Extract medical notes and prescriptions.",
    "Personal Use: Copy text from images, posters, and scanned documents.": "Personal Use: Copy text from images, posters, and scanned documents.",
    "Benefits of Using an Online OCR Tool": "Benefits of Using an Online OCR Tool",
    "Time-Saving: No manual typing, extract text instantly.": "Time-Saving: No manual typing, extract text instantly.",
    "Boosts Productivity: Automates data entry and document processing.": "Boosts Productivity: Automates data entry and document processing.",
    "Improves Accuracy: Eliminates human errors.": "Improves Accuracy: Eliminates human errors.",
    "Accessible Anywhere: Works on any device with an internet connection.": "Accessible Anywhere: Works on any device with an internet connection.",
    "Eco-Friendly: Reduce paper usage by digitizing documents.": "Eco-Friendly: Reduce paper usage by digitizing documents.",
    "Frequently Asked Questions (FAQs)": "Frequently Asked Questions (FAQs)",
    "1. Is OCR technology accurate?" : "1. Is OCR technology accurate?",
    "Yes, OCR (Optical Character Recognition) technology has advanced significantly and can extract text with over 95% accuracy, especially when working with high-quality images." : "Yes, OCR (Optical Character Recognition) technology has advanced significantly and can extract text with over 95% accuracy, especially when working with high-quality images.",
    "2. What file formats are supported?" : "2. What file formats are supported?",
    "Our Image to Text Converter supports JPG, PNG, BMP, GIF, TIFF, and PDF formats for seamless text extraction." : "Our Image to Text Converter supports JPG, PNG, BMP, GIF, TIFF, and PDF formats for seamless text extraction.",
    "3. Is the Image to Text Converter free to use?" : "3. Is the Image to Text Converter free to use?",
    "Yes! Our online OCR tool is completely free, with no hidden charges or restrictions." : "Yes! Our online OCR tool is completely free, with no hidden charges or restrictions.",
    "4. Can I convert handwritten text using OCR?" : "4. Can I convert handwritten text using OCR?",
    "OCR technology can recognize handwritten text, but accuracy depends on the clarity and neatness of the handwriting." : "OCR technology can recognize handwritten text, but accuracy depends on the clarity and neatness of the handwriting.",
    "5. Is my data secure?" : "5. Is my data secure?",
    "Yes, we respect your privacy. All uploaded files are processed securely and deleted automatically after conversion." : "Yes, we respect your privacy. All uploaded files are processed securely and deleted automatically after conversion.",
    "6. Does OCR work for multiple languages?" : "6. Does OCR work for multiple languages?",
    "Yes, our OCR tool supports multiple languages, including English, Spanish, French, German, and more." : "Yes, our OCR tool supports multiple languages, including English, Spanish, French, German, and more.",
    "7. Can I extract text from scanned PDFs?" : "7. Can I extract text from scanned PDFs?",
    "Absolutely! Our OCR tool allows you to extract text from scanned PDFs and convert them into editable formats." : "Absolutely! Our OCR tool allows you to extract text from scanned PDFs and convert them into editable formats.",
    "8. How long does it take to convert an image to text?" : "8. How long does it take to convert an image to text?",
    "The process takes only a few seconds, depending on the image size and quality." : "The process takes only a few seconds, depending on the image size and quality.",
    "9. Can I convert multiple images at once?" : "9. Can I convert multiple images at once?",
    "Currently, we support one file at a time, but bulk conversion features are coming soon." : "Currently, we support one file at a time, but bulk conversion features are coming soon.",
    "10. Do I need to install software?" : "10. Do I need to install software?",
    "No, our OCR tool is completely online. You can access it from any browser without installing any software." : "No, our OCR tool is completely online. You can access it from any browser without installing any software.",
    "Conclusion" : "Conclusion",
    "A free Image to Text Converter is an essential tool for students, professionals, and businesses. Our OCR Online Tool provides a fast, accurate, and secure solution for converting images into editable text." : "A free Image to Text Converter is an essential tool for students, professionals, and businesses. Our OCR Online Tool provides a fast, accurate, and secure solution for converting images into editable text.",
    "Try our free online OCR tool today and simplify your document management!" : "Try our free online OCR tool today and simplify your document management!",
    "Keywords:" : "Keywords:",
    "Image to Text Converter, OCR Online, Free OCR Tool, Convert Image to Text, Extract Text from Image, Convert PDF to Word, Optical Character Recognition, Online OCR, Picture to Text Converter, Convert Scanned Documents, Image Text Extraction Tool, OCR for PDF to Word, Text Scanner Online" : "Image to Text Converter, OCR Online, Free OCR Tool, Convert Image to Text, Extract Text from Image, Convert PDF to Word, Optical Character Recognition, Online OCR, Picture to Text Converter, Convert Scanned Documents, Image Text Extraction Tool, OCR for PDF to Word, Text Scanner Online",
"📝 Convert Image to Word in Seconds – Free & Accurate OCR Tool": "📝 Convert Image to Word in Seconds – Free & Accurate OCR Tool",
    "Extract text from images and download it as a Word document with just a few clicks.": "Extract text from images and download it as a Word document with just a few clicks.",
    "About": "About",
    "Key Features": "Key Features",
    "Pricing": "Pricing",
    "API": "API",
    "FAQ": "FAQ",
    "Legal": "Legal",
    "Terms of Service": "Terms of Service",
    "Privacy Policy": "Privacy Policy",
    "Contact Us": "Contact Us",
    "Connect With Us": "Connect With Us",
    "Email: support@onlineocr.com": "Email: support@onlineocr.com",
    "Phone: +1 (234) 567-890": "Phone: +1 (234) 567-890",

        // PDF to Image Section
        "PDF to Image Converter": "PDF to Image Converter",
        "Upload a PDF file to convert it into high-quality images and download them as a ZIP file.": "Upload a PDF file to convert it into high-quality images and download them as a ZIP file.",
        "Drag & Drop or Choose PDF File": "Drag & Drop or Choose PDF File",
        "No file chosen": "No file chosen",
        "Convert to Images": "Convert to Images",
        "Processing... Please wait.": "Processing... Please wait.",
        "Download as ZIP": "Download as ZIP",
        
        // Features Section
        "Convert PDF to High-Quality Images": "Convert PDF to High-Quality Images",
        "Effortlessly transform your PDFs into high-resolution images. Supports JPG, PNG, and other formats for seamless sharing.": "Effortlessly transform your PDFs into high-resolution images. Supports JPG, PNG, and other formats for seamless sharing.",
        "Extract Pages as Separate Images": "Extract Pages as Separate Images",
        "Convert each page of your PDF into a separate image file while preserving layout, text clarity, and formatting.": "Convert each page of your PDF into a separate image file while preserving layout, text clarity, and formatting.",
        "Secure & Fast PDF to Image Conversion": "Secure & Fast PDF to Image Conversion",
        "Experience fast and encrypted processing to ensure data security. No watermark, no quality loss.": "Experience fast and encrypted processing to ensure data security. No watermark, no quality loss.",
        "Works on Any Device": "Works on Any Device",
        "Access our PDF-to-image converter from any device—Windows, Mac, Android, or iOS—directly from your browser.": "Access our PDF-to-image converter from any device—Windows, Mac, Android, or iOS—directly from your browser.",
        "High-Resolution Image Output": "High-Resolution Image Output",
        "Get crystal-clear image quality for professional use. Retains sharp text and vivid colors.": "Get crystal-clear image quality for professional use. Retains sharp text and vivid colors.",
        "100% Free for Limited Use": "100% Free for Limited Use",
        "Convert up to 5 PDFs per hour for free. Upgrade for unlimited access.": "Convert up to 5 PDFs per hour for free. Upgrade for unlimited access.",
        "Online OCR is a powerful and accurate image-to-text conversion tool designed to help you extract text from images, scanned documents, and PDFs in seconds. Our AI-powered OCR technology ensures high precision, supporting multiple languages and file formats, making document digitization effortless.": 
        "Online OCR is a powerful and accurate image-to-text conversion tool designed to help you extract text from images, scanned documents, and PDFs in seconds. Our AI-powered OCR technology ensures high precision, supporting multiple languages and file formats, making document digitization effortless.",
      "Our Mission": "Our Mission",
      "At Online OCR, we are dedicated to providing a seamless and efficient solution for converting images into editable text. Our mission is to empower individuals and businesses by simplifying text extraction with cutting-edge OCR technology. Empowering users worldwide with fast and accurate text extraction from images, PDFs, and scanned documents.":
        "At Online OCR, we are dedicated to providing a seamless and efficient solution for converting images into editable text. Our mission is to empower individuals and businesses by simplifying text extraction with cutting-edge OCR technology. Empowering users worldwide with fast and accurate text extraction from images, PDFs, and scanned documents.",
      "Why Choose Online OCR?": "Why Choose Online OCR?",
      "High Accuracy": "High Accuracy",
      "Our AI-powered OCR engine ensures precise text extraction.": "Our AI-powered OCR engine ensures precise text extraction.",
      "Fast Processing": "Fast Processing",
      "Get your text instantly with lightning-fast performance.": "Get your text instantly with lightning-fast performance.",
      "Multiple Formats": "Multiple Formats",
      "Supports JPG, PNG, PDF, and exports text as TXT, DOC, or PDF.": "Supports JPG, PNG, PDF, and exports text as TXT, DOC, or PDF.",
      "Secure & Private": "Secure & Private",
      "Your data remains safe with our encrypted processing.": "Your data remains safe with our encrypted processing.",
      "What Our Users Say": "What Our Users Say",
      "\"This tool has saved me hours of work! Highly recommend it!\"": "\"This tool has saved me hours of work! Highly recommend it!\"",
      "- Sarah L.": "- Sarah L.",
      "\"The accuracy of Online OCR is impressive. A must-have tool!\"": "\"The accuracy of Online OCR is impressive. A must-have tool!\"",
      "- Michael T.": "- Michael T.",
      "PDF to Image Converter – Convert PDFs into High-Quality JPG or PNG": "PDF to Image Converter – Convert PDFs into High-Quality JPG or PNG",
"Easily convert PDF documents into high-resolution images with our free online PDF to Image converter.Extract pages from PDF files and save them as JPG, PNG, or other image formats with no quality loss.": "Easily convert PDF documents into high-resolution images with our free online PDF to Image converter.Extract pages from PDF files and save them as JPG, PNG, or other image formats with no quality loss.",

  // Image to Excel Section
    "Image to Excel Conversion": "Image to Excel Conversion",
    "AI-Powered Image to Excel": "AI-Powered Image to Excel",
    "Convert images containing tables into fully editable Excel sheets with precision. Preserve formatting and structure effortlessly.": "Convert images containing tables into fully editable Excel sheets with precision. Preserve formatting and structure effortlessly.",
    "Extract Tables from PDFs": "Extract Tables from PDFs",
    "Extract Tables from Scanned PDFs": "Extract Tables from Scanned PDFs",
    "Transform scanned PDF files into accurate Excel spreadsheets, ensuring data integrity and precise table extraction.": "Transform scanned PDF files into accurate Excel spreadsheets, ensuring data integrity and precise table extraction.",
    "Secure Data Processing": "Secure Data Processing",
    "Privacy & Data Security": "Privacy & Data Security",
    "All uploaded files are encrypted and automatically deleted after processing. Registered users get additional security features.": "All uploaded files are encrypted and automatically deleted after processing. Registered users get additional security features.",
    "Cross-Platform Compatibility": "Cross-Platform Compatibility",
    "Works on Any Device": "Works on Any Device",
    "Access our Excel conversion tool from Windows, Mac, Linux, Android, or iOS without software installation—100% online.": "Access our Excel conversion tool from Windows, Mac, Linux, Android, or iOS without software installation—100% online.",
    "AI-Driven Excel Conversion": "AI-Driven Excel Conversion",
    "AI-Powered Accuracy": "AI-Powered Accuracy",
    "Utilizing AI-driven OCR technology, our tool ensures up to 99% accuracy in extracting structured data into Excel format.": "Utilizing AI-driven OCR technology, our tool ensures up to 99% accuracy in extracting structured data into Excel format.",
    "Free Excel Conversion": "Free Excel Conversion",
    "100% Free for Limited Use": "100% Free for Limited Use",
    "Process up to 5 files per hour for free. Upgrade to unlock unlimited conversions and premium features.": "Process up to 5 files per hour for free. Upgrade to unlock unlimited conversions and premium features.",
    "📊 Convert Image to Excel - Extract Text & Download as XLSX": "📊 Convert Image to Excel - Extract Text & Download as XLSX",
   "Convert images into fully editable Excel spreadsheets with 99% accuracy using our AI-powered OCR tool. Extract tables, numbers, and structured data in just a few clicks.": "Convert images into fully editable Excel spreadsheets with 99% accuracy using our AI-powered OCR tool. Extract tables, numbers, and structured data in just a few clicks.",
    "☀️ Light Mode": "☀️ Light Mode"
  },

  hi: {
    "Home": "होम",
    "API": "एपीआई",
    "PDF TO WORD": "पीडीएफ से वर्ड",
    "PDF TO EXCEL": "पीडीएफ से एक्सेल",
    "PDF TO IMAGE": "पीडीएफ से छवि",
    "Image to Text Converter – Convert Images, PDFs, and Screenshots into Editable Text":
      "छवि से पाठ कन्वर्टर - छवियों, पीडीएफ और स्क्रीनशॉट को संपादन योग्य पाठ में बदलें",
    "Convert images and scanned documents into editable text instantly using our free online OCR tool. Extract text from JPG, PNG, PDF, or screenshots and save them as Word, Excel, or plain text.":
      "हमारे मुफ्त ऑनलाइन ओसीआर टूल का उपयोग करके छवियों और स्कैन किए गए दस्तावेजों को तुरंत संपादन योग्य पाठ में बदलें। JPG, PNG, PDF या स्क्रीनशॉट से पाठ निकालें और उन्हें Word, Excel या सादा पाठ के रूप में सहेजें।",
    "Image to Text Converter":"छवि से पाठ कनवर्टर",
      "Choose File":"फाइलें चुनें",
      "Select Language" : "भाषा चुनें",
      "Extract Text": "पाठ निकालें",
    "Upload an image (JPG, PNG) or PDF to extract text.": "पाठ निकालने के लिए एक छवि (JPG, PNG) या PDF अपलोड करें।",
    "Copy": "कॉपी करें",
    "Download": "डाउनलोड करें",
      "What is an Image to Text Converter?" : "छवि से पाठ कनवर्टर क्या है?",
      "Extract text from images (JPG, PNG, etc.)." : "छवियों (JPG, PNG, आदि) से पाठ निकालें।",
      "Convert PDF to Word, Excel, or Text." : "PDF को Word, Excel, या टेक्स्ट में बदलें।",
      "Accurate and secure OCR technology." : "सटीक और सुरक्षित OCR तकनीक।",
      "Free and easy to use." : "मुफ्त और उपयोग में आसान।",
      "Image to Text Converter Icon" : "छवि से पाठ कनवर्टर आइकन",
      "How to Convert an Image to Text Online?" : "ऑनलाइन छवि को पाठ में कैसे बदलें?",
      "Follow these simple steps to extract text from images and PDFs using our advanced OCR tool." : "हमारे उन्नत OCR टूल का उपयोग करके छवियों और PDF से पाठ निकालने के लिए इन सरल चरणों का पालन करें।",
      "1️⃣ Upload Your Image or PDF" : "1️⃣ अपनी छवि या PDF अपलोड करें",
      "Click the 'Upload' button to select an image (JPG, PNG, BMP) or a PDF file from your device." : "'अपलोड' बटन पर क्लिक करें और अपने डिवाइस से छवि (JPG, PNG, BMP) या PDF फ़ाइल चुनें।",
      "Supported Formats: JPG, PNG, BMP, GIF, PDF" : "समर्थित प्रारूप: JPG, PNG, BMP, GIF, PDF",
      "Upload Options: Device, Google Drive, Dropbox" : "अपलोड विकल्प: डिवाइस, गूगल ड्राइव, ड्रॉपबॉक्स",
      "2️⃣ Choose Language for Better Accuracy" : "2️⃣ बेहतर सटीकता के लिए भाषा चुनें",
      "Select the language of the text in your document. Our AI-powered OCR software supports multiple languages, ensuring precise text extraction." : "अपने दस्तावेज़ में पाठ की भाषा चुनें। हमारी AI-समर्थित OCR सॉफ़्टवेयर कई भाषाओं का समर्थन करती है, जिससे सटीक पाठ निष्कर्षण सुनिश्चित होता है।",
      "Supports: English, Spanish, French, German, Hindi, Arabic, Chinese, and more." : "समर्थन करता है: अंग्रेजी, स्पेनिश, फ्रेंच, जर्मन, हिंदी, अरबी, चीनी, और अधिक।",
      "Bonus: Our tool also recognizes handwritten text." : "बोनस: हमारा टूल हस्तलिखित पाठ को भी पहचानता है।",
      "3️⃣ Click Convert & Extract Text" : "3️⃣ कन्वर्ट पर क्लिक करें और पाठ निकालें",
      "Hit the 'Convert' button, and our tool will instantly process the image, extracting text with high accuracy." : "'कन्वर्ट' बटन दबाएं, और हमारा टूल तुरंत छवि को प्रोसेस करेगा और उच्च सटीकता के साथ पाठ निकालेगा।",
      "Preview the extracted text before downloading." : "डाउनलोड करने से पहले निकाले गए पाठ का पूर्वावलोकन करें।",
      "4️⃣ Copy or Download Your Text" : "4️⃣ अपना पाठ कॉपी करें या डाउनलोड करें",
      "Once the conversion is complete, you can:" : "एक बार रूपांतरण पूरा होने के बाद, आप:",
      "Copy the text and paste it anywhere." : "पाठ को कॉपी करें और कहीं भी पेस्ट करें।",
      "Download the extracted text in your preferred format:" : "अपने पसंदीदा प्रारूप में निकाला गया पाठ डाउनलोड करें:",
      "Word (.docx) – for editing in Microsoft Word" : "Word (.docx) – माइक्रोसॉफ्ट वर्ड में संपादन के लिए",
      "Excel (.xlsx) – for structured data extraction" : "Excel (.xlsx) – संरचित डेटा निष्कर्षण के लिए",
      "Plain Text (.txt) – for basic text storage" : "Plain Text (.txt) – सामान्य पाठ भंडारण के लिए",
      "🚀 Instant, free, and no registration required!" : "🚀 त्वरित, मुफ्त और कोई पंजीकरण आवश्यक नहीं!",
      "Features of Our Free Online OCR Tool" : "हमारे मुफ्त ऑनलाइन OCR टूल की विशेषताएं",
      "High Accuracy: Extracts text with precision, even from low-quality images." : "उच्च सटीकता: कम गुणवत्ता वाली छवियों से भी पाठ को सटीक रूप से निकालता है।",
      "Multiple File Formats: Supports JPG, PNG, GIF, BMP, TIFF, and PDFs." : "कई फ़ाइल प्रारूप: JPG, PNG, GIF, BMP, TIFF, और PDF का समर्थन करता है।",
      "User-Friendly: No technical knowledge required – just upload and convert." : "उपयोगकर्ता-अनुकूल: कोई तकनीकी ज्ञान आवश्यक नहीं – बस अपलोड करें और कन्वर्ट करें।",
      "Secure & Private: Files are processed securely and deleted automatically." : "सुरक्षित और निजी: फ़ाइलें सुरक्षित रूप से प्रोसेस की जाती हैं और स्वचालित रूप से हटा दी जाती हैं।",
      "100% Free: Unlimited conversions with no hidden costs." : "100% मुफ्त: कोई छिपी हुई लागत नहीं, असीमित रूपांतरण।",
      "Applications of OCR Technology" : "OCR तकनीक के अनुप्रयोग",
      "Students & Academics: Convert scanned textbooks and notes into editable documents." : "छात्र और शिक्षाविद: स्कैन की गई पाठ्यपुस्तकों और नोट्स को संपादन योग्य दस्तावेज़ों में बदलें।",
      "Business & Office Work: Digitize invoices, contracts, and reports." : "व्यवसाय और कार्यालय कार्य: चालान, अनुबंध और रिपोर्ट को डिजिटाइज़ करें।",
      "Legal & Government Documents: Convert official papers into text for editing." : "कानूनी और सरकारी दस्तावेज़: आधिकारिक कागजात को संपादन योग्य पाठ में बदलें।",
      "Healthcare Records: Extract medical notes and prescriptions." : "स्वास्थ्य रिकॉर्ड: चिकित्सा नोट्स और पर्चे निकालें।",
      "Personal Use: Copy text from images, posters, and scanned documents." : "व्यक्तिगत उपयोग: छवियों, पोस्टरों और स्कैन किए गए दस्तावेज़ों से पाठ कॉपी करें।",
      "Benefits of Using an Online OCR Tool" : "ऑनलाइन OCR टूल का उपयोग करने के लाभ",
      "Time-Saving: No manual typing, extract text instantly." : "समय की बचत: मैन्युअल टाइपिंग की आवश्यकता नहीं, पाठ को तुरंत निकालें।",
      "Boosts Productivity: Automates data entry and document processing." : "उत्पादकता बढ़ाएं: डेटा प्रविष्टि और दस्तावेज़ प्रसंस्करण को स्वचालित करें।",
      "Improves Accuracy: Eliminates human errors." : "सटीकता में सुधार: मानवीय त्रुटियों को समाप्त करें।",
      "Accessible Anywhere: Works on any device with an internet connection." : "कहीं भी पहुंच: इंटरनेट कनेक्शन वाले किसी भी डिवाइस पर काम करता है।",
      "Eco-Friendly: Reduce paper usage by digitizing documents." : "पर्यावरण-अनुकूल: दस्तावेज़ों को डिजिटाइज़ करके कागज के उपयोग को कम करें।",
        "Frequently Asked Questions (FAQs)" : "अक्सर पूछे जाने वाले प्रश्न (FAQs)",
        "1. Is OCR technology accurate?" : "1. क्या OCR तकनीक सटीक है?",
        "Yes, OCR (Optical Character Recognition) technology has advanced significantly and can extract text with over 95% accuracy, especially when working with high-quality images." : "हाँ, OCR (ऑप्टिकल कैरेक्टर रिकग्निशन) तकनीक काफी उन्नत हो चुकी है और उच्च गुणवत्ता वाली छवियों के साथ काम करते समय 95% से अधिक सटीकता के साथ पाठ निकाल सकती है।",
        "2. What file formats are supported?" : "2. कौन-कौन से फ़ाइल प्रारूप समर्थित हैं?",
        "Our Image to Text Converter supports JPG, PNG, BMP, GIF, TIFF, and PDF formats for seamless text extraction." : "हमारा छवि से पाठ कनवर्टर JPG, PNG, BMP, GIF, TIFF और PDF प्रारूपों का समर्थन करता है ताकि आसानी से पाठ निकाला जा सके।",
        "3. Is the Image to Text Converter free to use?" : "3. क्या छवि से पाठ कनवर्टर मुफ्त है?",
        "Yes! Our online OCR tool is completely free, with no hidden charges or restrictions." : "हाँ! हमारा ऑनलाइन OCR टूल पूरी तरह से मुफ्त है, इसमें कोई छिपे हुए शुल्क या प्रतिबंध नहीं हैं।",
        "4. Can I convert handwritten text using OCR?" : "4. क्या मैं OCR का उपयोग करके हस्तलिखित पाठ को कन्वर्ट कर सकता हूँ?",
        "OCR technology can recognize handwritten text, but accuracy depends on the clarity and neatness of the handwriting." : "OCR तकनीक हस्तलिखित पाठ को पहचान सकती है, लेकिन सटीकता हस्तलेखन की स्पष्टता और सफाई पर निर्भर करती है।",
        "5. Is my data secure?" : "5. क्या मेरे डेटा की सुरक्षा है?",
        "Yes, we respect your privacy. All uploaded files are processed securely and deleted automatically after conversion." : "हाँ, हम आपकी गोपनीयता का सम्मान करते हैं। सभी अपलोड की गई फ़ाइलें सुरक्षित रूप से प्रोसेस की जाती हैं और रूपांतरण के बाद स्वचालित रूप से हटा दी जाती हैं।",
        "6. Does OCR work for multiple languages?" : "6. क्या OCR कई भाषाओं के लिए काम करता है?",
        "Yes, our OCR tool supports multiple languages, including English, Spanish, French, German, and more." : "हाँ, हमारा OCR टूल कई भाषाओं का समर्थन करता है, जिनमें अंग्रेज़ी, स्पेनिश, फ्रेंच, जर्मन, और अन्य शामिल हैं।",
        "7. Can I extract text from scanned PDFs?" : "7. क्या मैं स्कैन किए गए PDF से पाठ निकाल सकता हूँ?",
        "Absolutely! Our OCR tool allows you to extract text from scanned PDFs and convert them into editable formats." : "बिल्कुल! हमारा OCR टूल आपको स्कैन किए गए PDF से पाठ निकालने और उन्हें संपादन योग्य प्रारूपों में बदलने की सुविधा देता है।",
        "8. How long does it take to convert an image to text?" : "8. छवि को पाठ में बदलने में कितना समय लगता है?",
        "The process takes only a few seconds, depending on the image size and quality." : "यह प्रक्रिया केवल कुछ सेकंड लेती है, जो छवि के आकार और गुणवत्ता पर निर्भर करता है।",
        "9. Can I convert multiple images at once?" : "9. क्या मैं एक साथ कई छवियों को कन्वर्ट कर सकता हूँ?",
        "Currently, we support one file at a time, but bulk conversion features are coming soon." : "वर्तमान में, हम एक बार में एक फ़ाइल का समर्थन करते हैं, लेकिन जल्द ही बैच रूपांतरण सुविधाएँ उपलब्ध होंगी।",
        "10. Do I need to install software?" : "10. क्या मुझे कोई सॉफ़्टवेयर इंस्टॉल करने की आवश्यकता है?",
        "No, our OCR tool is completely online. You can access it from any browser without installing any software." : "नहीं, हमारा OCR टूल पूरी तरह से ऑनलाइन है। आप इसे किसी भी ब्राउज़र से एक्सेस कर सकते हैं बिना कोई सॉफ़्टवेयर इंस्टॉल किए।",
        "Conclusion" : "निष्कर्ष",
        "A free Image to Text Converter is an essential tool for students, professionals, and businesses. Our OCR Online Tool provides a fast, accurate, and secure solution for converting images into editable text." : "एक मुफ्त छवि से पाठ कनवर्टर छात्रों, पेशेवरों और व्यवसायों के लिए एक आवश्यक उपकरण है। हमारा OCR ऑनलाइन टूल छवियों को संपादन योग्य पाठ में बदलने के लिए एक तेज़, सटीक और सुरक्षित समाधान प्रदान करता है।",
        "Try our free online OCR tool today and simplify your document management!" : "आज ही हमारे मुफ्त ऑनलाइन OCR टूल का उपयोग करें और अपने दस्तावेज़ प्रबंधन को आसान बनाएं!",
        "Keywords:" : "मुख्य शब्द:",
        "Image to Text Converter, OCR Online, Free OCR Tool, Convert Image to Text, Extract Text from Image, Convert PDF to Word, Optical Character Recognition, Online OCR, Picture to Text Converter, Convert Scanned Documents, Image Text Extraction Tool, OCR for PDF to Word, Text Scanner Online" : "छवि से पाठ कनवर्टर, ऑनलाइन OCR, मुफ्त OCR टूल, छवि को पाठ में बदलें, छवि से पाठ निकालें, PDF को Word में बदलें, ऑप्टिकल कैरेक्टर रिकग्निशन, ऑनलाइन OCR, चित्र से पाठ कनवर्टर, स्कैन किए गए दस्तावेज़ों को कनवर्ट करें, छवि पाठ निष्कर्षण उपकरण, PDF से Word के लिए OCR, ऑनलाइन टेक्स्ट स्कैनर",
"Dark Mode": "🌙 डार्क मोड",
"AI-Powered Image to Word": "AI-संचालित छवि से वर्ड",
    "Convert images into fully editable Word documents with our AI-driven OCR. Preserve text formatting and layout effortlessly.": "हमारे AI-संचालित OCR के साथ छवियों को पूरी तरह से संपादन योग्य वर्ड दस्तावेज़ों में बदलें। पाठ स्वरूपण और लेआउट को आसानी से संरक्षित करें।",
    "Extract Text from Scanned PDFs": "स्कैन किए गए PDF से पाठ निकालें",
    "Convert scanned PDFs into Word documents while retaining structure, tables, and formatting for seamless editing.": "स्कैन किए गए PDF को वर्ड दस्तावेज़ों में बदलें, संरचना, तालिकाएं और स्वरूपण को बनाए रखते हुए निर्बाध संपादन के लिए।",
    "Privacy & Security Guaranteed": "गोपनीयता और सुरक्षा की गारंटी",
    "All uploaded files are encrypted and deleted after processing. Registered users can store documents securely.": "सभी अपलोड की गई फ़ाइलों को प्रसंस्करण के बाद एन्क्रिप्ट और हटा दिया जाता है। पंजीकृत उपयोगकर्ता दस्तावेज़ों को सुरक्षित रूप से संग्रहीत कर सकते हैं।",
    "Works on Any Device": "किसी भी डिवाइस पर काम करता है",
    "Convert images to Word on Windows, Mac, Linux, Android, and iOS—no software installation required.": "Windows, Mac, Linux, Android, और iOS पर छवियों को वर्ड में बदलें—किसी सॉफ़्टवेयर इंस्टॉलेशन की आवश्यकता नहीं है।",
    "AI-Driven OCR for High Accuracy": "उच्च सटीकता के लिए AI-संचालित OCR",
    "Extract text with 99% accuracy using AI-powered OCR. Supports multiple languages, including handwritten text.": "AI-संचालित OCR का उपयोग करके 99% सटीकता के साथ पाठ निकालें। हस्तलिखित पाठ सहित कई भाषाओं का समर्थन करता है।",
    "100% Free for Limited Use": "सीमित उपयोग के लिए 100% मुफ्त",
    "Process up to 5 images per hour for free. Upgrade to unlock unlimited conversions.": "मुफ्त में प्रति घंटे छवियों को संसाधित करें। असीमित रूपांतरण के लिए अपग्रेड करें।",
    "About Online OCR": "ऑनलाइन OCR के बारे में",
    "Online OCR is a powerful text extraction tool that allows users to convert images into editable text with high accuracy.": "ऑनलाइन OCR एक शक्तिशाली पाठ निष्कर्षण उपकरण है जो उपयोगकर्ताओं को छवियों को उच्च सटीकता के साथ संपादन योग्य पाठ में बदलने की अनुमति देता है।",
    "Quick Links": "त्वरित लिंक",
    "Legal": "कानूनी",
    "Connect With Us": "हमसे जुड़ें",
    "© 2024 Online OCR. All rights reserved.": "© 2024 ऑनलाइन OCR। सर्वाधिकार सुरक्षित.",
    "Back to Top": "शीर्ष पर वापस जाएं",
    "About": "परिचय",
    "Key Features": "मुख्य विशेषताएँ",
    "Pricing": "मूल्य निर्धारण",
    "API": "API",
    "FAQ": "सामान्य प्रश्न",
    "Legal": "कानूनी",
    "Terms of Service": "सेवा की शर्तें",
    "Privacy Policy": "गोपनीयता नीति",
    "Contact Us": "संपर्क करें",
    "Connect With Us": "हमसे जुड़ें",
    "Email: support@onlineocr.com": "ईमेल: support@onlineocr.com",
    "Phone: +1 (234) 567-890": "फोन: +1 (234) 567-890",
        "📝 Convert Image to Word in Seconds – Free & Accurate OCR Tool": "📝 कुछ ही सेकंड में छवि को वर्ड में बदलें – मुफ्त और सटीक OCR टूल",
    "Extract text from images and download it as a Word document with just a few clicks.": "छवियों से पाठ निकालें और कुछ ही क्लिक में इसे वर्ड दस्तावेज़ के रूप में डाउनलोड करें.",

        // PDF to Image Section
        "PDF to Image Converter": "PDF से छवि कनवर्टर",
        "Upload a PDF file to convert it into high-quality images and download them as a ZIP file.": "उच्च-गुणवत्ता वाली छवियों में बदलने के लिए एक PDF फ़ाइल अपलोड करें और उन्हें ZIP फ़ाइल के रूप में डाउनलोड करें।",
        "Drag & Drop or Choose PDF File": "खींचें और छोड़ें या PDF फ़ाइल चुनें",
        "No file chosen": "कोई फ़ाइल चुनी नहीं गई",
        "Convert to Images": "छवियों में बदलें",
        "Processing... Please wait.": "प्रसंस्करण... कृपया प्रतीक्षा करें।",
        "Download as ZIP": "ZIP के रूप में डाउनलोड करें",
        
        // Features Section
        "Convert PDF to High-Quality Images": "PDF को उच्च-गुणवत्ता वाली छवियों में बदलें",
        "Effortlessly transform your PDFs into high-resolution images. Supports JPG, PNG, and other formats for seamless sharing.": "अपने PDF को आसानी से उच्च-रिज़ॉल्यूशन छवियों में बदलें। JPG, PNG और अन्य प्रारूपों का समर्थन करता है जो सहज साझाकरण के लिए हैं।",
        "Extract Pages as Separate Images": "पृष्ठों को अलग-अलग छवियों के रूप में निकालें",
        "Convert each page of your PDF into a separate image file while preserving layout, text clarity, and formatting.": "अपने PDF के प्रत्येक पृष्ठ को अलग-अलग छवि फ़ाइल में बदलें, लेआउट, पाठ स्पष्टता और स्वरूपण को बनाए रखते हुए।",
        "Secure & Fast PDF to Image Conversion": "सुरक्षित और तेज़ PDF से छवि रूपांतरण",
        "Experience fast and encrypted processing to ensure data security. No watermark, no quality loss.": "डेटा सुरक्षा सुनिश्चित करने के लिए तेज़ और एन्क्रिप्टेड प्रसंस्करण का अनुभव करें। कोई वॉटरमार्क नहीं, कोई गुणवत्ता हानि नहीं।",
        "Works on Any Device": "किसी भी डिवाइस पर काम करता है",
        "Access our PDF-to-image converter from any device—Windows, Mac, Android, or iOS—directly from your browser.": "किसी भी डिवाइस—Windows, Mac, Android, या iOS—से हमारे PDF-से-छवि कनवर्टर तक सीधे अपने ब्राउज़र से पहुंचें।",
        "High-Resolution Image Output": "उच्च-रिज़ॉल्यूशन छवि आउटपुट",
        "Get crystal-clear image quality for professional use. Retains sharp text and vivid colors.": "पेशेवर उपयोग के लिए स्पष्ट छवि गुणवत्ता प्राप्त करें। तेज़ पाठ और ज्वलंत रंग बनाए रखता है।",
        "100% Free for Limited Use": "सीमित उपयोग के लिए 100% मुफ्त",
        "Convert up to 5 PDFs per hour for free. Upgrade for unlimited access.": "मुफ्त में प्रति घंटे 5 PDFs को कनवर्ट करें। असीमित पहुंच के लिए अपग्रेड करें।",
        "PDF to Image Converter – Convert PDFs into High-Quality JPG or PNG": "पीडीएफ से छवि कनवर्टर – पीडीएफ को उच्च-गुणवत्ता वाले JPG या PNG में बदलें",
"Easily convert PDF documents into high-resolution images with our free online PDF to Image converter.Extract pages from PDF files and save them as JPG, PNG, or other image formats with no quality loss.": "हमारे मुफ्त ऑनलाइन पीडीएफ से छवि कनवर्टर का उपयोग करके आसानी से पीडीएफ दस्तावेज़ों को उच्च-रिज़ॉल्यूशन छवियों में बदलें।पीडीएफ फ़ाइलों से पृष्ठ निकालें और उन्हें JPG, PNG, या अन्य छवि स्वरूपों में बिना गुणवत्ता हानि के सहेजें।",

    //Image to Excel Section
 "Image to Excel Conversion": "इमेज को एक्सेल में बदलना",
    "AI-Powered Image to Excel": "एआई-संचालित इमेज टू एक्सेल",
    "Convert images containing tables into fully editable Excel sheets with precision. Preserve formatting and structure effortlessly.": "टेबल्स वाली इमेज को सटीकता से पूरी तरह संपादन योग्य एक्सेल शीट में बदलें। फ़ॉर्मेटिंग और संरचना को आसानी से बनाए रखें।",
    "Extract Tables from PDFs": "पीडीएफ से टेबल निकालें",
    "Extract Tables from Scanned PDFs": "स्कैन की गई पीडीएफ से टेबल निकालें",
    "Transform scanned PDF files into accurate Excel spreadsheets, ensuring data integrity and precise table extraction.": "स्कैन की गई पीडीएफ फ़ाइलों को सटीक एक्सेल स्प्रेडशीट में बदलें, डेटा की शुद्धता और तालिका निष्कर्षण सुनिश्चित करें।",
    "Secure Data Processing": "सुरक्षित डेटा प्रोसेसिंग",
    "Privacy & Data Security": "गोपनीयता और डेटा सुरक्षा",
    "All uploaded files are encrypted and automatically deleted after processing. Registered users get additional security features.": "सभी अपलोड की गई फाइलें एन्क्रिप्टेड होती हैं और प्रोसेसिंग के बाद स्वचालित रूप से हट जाती हैं। पंजीकृत उपयोगकर्ताओं को अतिरिक्त सुरक्षा सुविधाएँ मिलती हैं।",
    "Cross-Platform Compatibility": "क्रॉस-प्लेटफ़ॉर्म संगतता",
    "Works on Any Device": "किसी भी डिवाइस पर काम करता है",
    "Access our Excel conversion tool from Windows, Mac, Linux, Android, or iOS without software installation—100% online.": "बिना किसी सॉफ्टवेयर इंस्टॉलेशन के Windows, Mac, Linux, Android या iOS से हमारे एक्सेल कन्वर्ज़न टूल तक पहुँचें — 100% ऑनलाइन।",
    "AI-Driven Excel Conversion": "एआई-आधारित एक्सेल रूपांतरण",
    "AI-Powered Accuracy": "एआई-संचालित सटीकता",
    "Utilizing AI-driven OCR technology, our tool ensures up to 99% accuracy in extracting structured data into Excel format.": "एआई-संचालित ओसीआर तकनीक का उपयोग करके, हमारा टूल एक्सेल प्रारूप में संरचित डेटा निकालने में 99% तक सटीकता सुनिश्चित करता है।",
    "Free Excel Conversion": "नि:शुल्क एक्सेल रूपांतरण",
    "100% Free for Limited Use": "सीमित उपयोग के लिए 100% मुफ़्त",
    "Process up to 5 files per hour for free. Upgrade to unlock unlimited conversions and premium features.": "प्रति घंटे 5 फाइलें नि:शुल्क प्रोसेस करें। असीमित कन्वर्ज़न और प्रीमियम सुविधाओं के लिए अपग्रेड करें।",
    "📊 Convert Image to Excel - Extract Text & Download as XLSX": "📊 इमेज को एक्सेल में बदलें - टेक्स्ट निकालें और XLSX के रूप में डाउनलोड करें",
     "Convert images into fully editable Excel spreadsheets with 99% accuracy using our AI-powered OCR tool. Extract tables, numbers, and structured data in just a few clicks.": "हमारे एआई-संचालित ओसीआर टूल का उपयोग करके छवियों को 99% सटीकता के साथ पूरी तरह संपादन योग्य एक्सेल स्प्रेडशीट में बदलें। कुछ ही क्लिक में टेबल, नंबर और संरचित डेटा निकालें।",
    "☀️ Light Mode": "☀️ लाइट मोड"
  },


  es: {
    "Home": "Inicio",
    "API": "API",
    "PDF TO WORD": "PDF a Word",
    "PDF TO EXCEL": "PDF a Excel",
    "PDF TO IMAGE": "PDF a Imagen",
    "Image to Text Converter – Convert Images, PDFs, and Screenshots into Editable Text":
      "Convertidor de imagen a texto: convierta imágenes, PDF y capturas de pantalla en texto editable",
    "Convert images and scanned documents into editable text instantly using our free online OCR tool. Extract text from JPG, PNG, PDF, or screenshots and save them as Word, Excel, or plain text.":
      "Convierte imágenes y documentos escaneados en texto editable al instante con nuestra herramienta OCR gratuita en línea. Extraiga texto de JPG, PNG, PDF o capturas de pantalla y guárdelo como Word, Excel o texto sin formato.",
    "Image to Text Converter":"Convertidor de imagen a texto",
      "Choose File": "Elija Archivo",
      "Select Language" : "Seleccionar idioma",
      "Extract Text": "Extraer texto",
    "Upload an image (JPG, PNG) or PDF to extract text.": "Sube una imagen (JPG, PNG) o PDF para extraer texto.",
    "Copy": "Copiar",
    "Download": "Descargar",
      "What is an Image to Text Converter?" : "¿Qué es un Convertidor de Imagen a Texto?",
      "Extract text from images (JPG, PNG, etc.)." : "Extrae texto de imágenes (JPG, PNG, etc.).",
      "Convert PDF to Word, Excel, or Text." : "Convierte PDF a Word, Excel o Texto.",
      "Accurate and secure OCR technology." : "Tecnología OCR precisa y segura.",
      "Free and easy to use." : "Gratis y fácil de usar.",
      "Image to Text Converter Icon" : "Ícono de Convertidor de Imagen a Texto",
      "How to Convert an Image to Text Online?" : "¿Cómo Convertir una Imagen a Texto en Línea?",
      "Follow these simple steps to extract text from images and PDFs using our advanced OCR tool." : "Siga estos sencillos pasos para extraer texto de imágenes y PDFs usando nuestra herramienta OCR avanzada.",
      "1️⃣ Upload Your Image or PDF" : "1️⃣ Cargue su Imagen o PDF",
      "Click the 'Upload' button to select an image (JPG, PNG, BMP) or a PDF file from your device." : "Haga clic en el botón 'Cargar' para seleccionar una imagen (JPG, PNG, BMP) o un archivo PDF desde su dispositivo.",
      "Supported Formats: JPG, PNG, BMP, GIF, PDF" : "Formatos Soportados: JPG, PNG, BMP, GIF, PDF",
      "Upload Options: Device, Google Drive, Dropbox" : "Opciones de Carga: Dispositivo, Google Drive, Dropbox",
      "2️⃣ Choose Language for Better Accuracy" : "2️⃣ Elija el Idioma para Mejor Precisión",
      "Select the language of the text in your document. Our AI-powered OCR software supports multiple languages, ensuring precise text extraction." : "Seleccione el idioma del texto en su documento. Nuestro software OCR basado en IA admite múltiples idiomas, garantizando una extracción precisa del texto.",
      "Supports: English, Spanish, French, German, Hindi, Arabic, Chinese, and more." : "Soporta: Inglés, Español, Francés, Alemán, Hindi, Árabe, Chino, y más.",
      "Bonus: Our tool also recognizes handwritten text." : "Bono: Nuestra herramienta también reconoce texto escrito a mano.",
      "3️⃣ Click Convert & Extract Text" : "3️⃣ Haga Clic en Convertir y Extraer Texto",
      "Hit the 'Convert' button, and our tool will instantly process the image, extracting text with high accuracy." : "Presione el botón 'Convertir' y nuestra herramienta procesará la imagen al instante, extrayendo texto con alta precisión.",
      "Preview the extracted text before downloading." : "Previsualice el texto extraído antes de descargarlo.",
      "4️⃣ Copy or Download Your Text" : "4️⃣ Copie o Descargue su Texto",
      "Once the conversion is complete, you can:" : "Una vez que la conversión esté completa, usted puede:",
      "Copy the text and paste it anywhere." : "Copiar el texto y pegarlo en cualquier lugar.",
      "Download the extracted text in your preferred format:" : "Descargar el texto extraído en su formato preferido:",
      "Word (.docx) – for editing in Microsoft Word" : "Word (.docx) – para editar en Microsoft Word",
      "Excel (.xlsx) – for structured data extraction" : "Excel (.xlsx) – para extracción de datos estructurados",
      "Plain Text (.txt) – for basic text storage" : "Texto Plano (.txt) – para almacenamiento básico de texto",
      "🚀 Instant, free, and no registration required!" : "🚀 Instantáneo, gratis y sin necesidad de registro!",
      "Features of Our Free Online OCR Tool" : "Características de Nuestra Herramienta OCR Gratuita en Línea",
      "High Accuracy: Extracts text with precision, even from low-quality images." : "Alta Precisión: Extrae texto con precisión, incluso de imágenes de baja calidad.",
      "Multiple File Formats: Supports JPG, PNG, GIF, BMP, TIFF, and PDFs." : "Múltiples Formatos de Archivo: Soporta JPG, PNG, GIF, BMP, TIFF y PDFs.",
      "User-Friendly: No technical knowledge required – just upload and convert." : "Fácil de Usar: No se requiere conocimiento técnico – solo suba y convierta.",
      "Secure & Private: Files are processed securely and deleted automatically." : "Seguro y Privado: Los archivos se procesan de forma segura y se eliminan automáticamente.",
      "100% Free: Unlimited conversions with no hidden costs." : "100% Gratis: Conversiones ilimitadas sin costos ocultos.",
      "Applications of OCR Technology" : "Aplicaciones de la Tecnología OCR",
      "Students & Academics: Convert scanned textbooks and notes into editable documents." : "Estudiantes y Académicos: Convierta libros de texto y notas escaneados en documentos editables.",
      "Business & Office Work: Digitize invoices, contracts, and reports." : "Negocios y Oficinas: Digitalice facturas, contratos e informes.",
      "Legal & Government Documents: Convert official papers into text for editing." : "Documentos Legales y Gubernamentales: Convierta documentos oficiales en texto editable.",
      "Healthcare Records: Extract medical notes and prescriptions." : "Registros Médicos: Extraiga notas médicas y recetas.",
      "Personal Use: Copy text from images, posters, and scanned documents." : "Uso Personal: Copie texto de imágenes, carteles y documentos escaneados.",
      "Benefits of Using an Online OCR Tool" : "Beneficios de Usar una Herramienta OCR en Línea",
      "Time-Saving: No manual typing, extract text instantly." : "Ahorro de Tiempo: Sin necesidad de escribir manualmente, extrae texto al instante.",
      "Boosts Productivity: Automates data entry and document processing." : "Aumenta la Productividad: Automatiza la entrada de datos y el procesamiento de documentos.",
      "Improves Accuracy: Eliminates human errors." : "Mejora la Precisión: Elimina los errores humanos.",
      "Accessible Anywhere: Works on any device with an internet connection." : "Accesible en Cualquier Lugar: Funciona en cualquier dispositivo con conexión a internet.",
      "Eco-Friendly: Reduce paper usage by digitizing documents." : "Ecológico: Reduce el uso de papel digitalizando documentos.",
"Frequently Asked Questions (FAQs)": "Preguntas Frecuentes (FAQs)",
  "1. Is OCR technology accurate?" : "1. ¿Es precisa la tecnología OCR?",
  "Yes, OCR (Optical Character Recognition) technology has advanced significantly and can extract text with over 95% accuracy, especially when working with high-quality images." : "Sí, la tecnología OCR (Reconocimiento Óptico de Caracteres) ha avanzado significativamente y puede extraer texto con más del 95% de precisión, especialmente cuando se trabaja con imágenes de alta calidad.",
  "2. What file formats are supported?" : "2. ¿Qué formatos de archivo son compatibles?",
  "Our Image to Text Converter supports JPG, PNG, BMP, GIF, TIFF, and PDF formats for seamless text extraction." : "Nuestro Convertidor de Imagen a Texto admite formatos JPG, PNG, BMP, GIF, TIFF y PDF para una extracción de texto sin problemas.",
  "3. Is the Image to Text Converter free to use?" : "3. ¿Es gratuito el Convertidor de Imagen a Texto?",
  "Yes! Our online OCR tool is completely free, with no hidden charges or restrictions." : "¡Sí! Nuestra herramienta OCR en línea es completamente gratuita, sin cargos ocultos ni restricciones.",
  "4. Can I convert handwritten text using OCR?" : "4. ¿Puedo convertir texto manuscrito con OCR?",
  "OCR technology can recognize handwritten text, but accuracy depends on the clarity and neatness of the handwriting." : "La tecnología OCR puede reconocer texto manuscrito, pero la precisión depende de la claridad y prolijidad de la escritura.",
  "5. Is my data secure?" : "5. ¿Mis datos están seguros?",
  "Yes, we respect your privacy. All uploaded files are processed securely and deleted automatically after conversion." : "Sí, respetamos tu privacidad. Todos los archivos subidos se procesan de forma segura y se eliminan automáticamente después de la conversión.",
  "6. Does OCR work for multiple languages?" : "6. ¿El OCR funciona con varios idiomas?",
  "Yes, our OCR tool supports multiple languages, including English, Spanish, French, German, and more." : "Sí, nuestra herramienta OCR admite varios idiomas, incluidos inglés, español, francés, alemán y más.",
  "7. Can I extract text from scanned PDFs?" : "7. ¿Puedo extraer texto de archivos PDF escaneados?",
  "Absolutely! Our OCR tool allows you to extract text from scanned PDFs and convert them into editable formats." : "¡Por supuesto! Nuestra herramienta OCR te permite extraer texto de archivos PDF escaneados y convertirlos en formatos editables.",
  "8. How long does it take to convert an image to text?" : "8. ¿Cuánto tiempo tarda en convertir una imagen en texto?",
  "The process takes only a few seconds, depending on the image size and quality." : "El proceso solo toma unos segundos, dependiendo del tamaño y la calidad de la imagen.",
  "9. Can I convert multiple images at once?" : "9. ¿Puedo convertir varias imágenes a la vez?",
  "Currently, we support one file at a time, but bulk conversion features are coming soon." : "Actualmente, admitimos un archivo a la vez, pero pronto estarán disponibles las funciones de conversión masiva.",
  "10. Do I need to install software?" : "10. ¿Necesito instalar algún software?",
  "No, our OCR tool is completely online. You can access it from any browser without installing any software." : "No, nuestra herramienta OCR es completamente en línea. Puedes acceder a ella desde cualquier navegador sin necesidad de instalar software.",
  "Conclusion" : "Conclusión",
  "A free Image to Text Converter is an essential tool for students, professionals, and businesses. Our OCR Online Tool provides a fast, accurate, and secure solution for converting images into editable text." : "Un Convertidor de Imagen a Texto gratuito es una herramienta esencial para estudiantes, profesionales y empresas. Nuestra herramienta OCR en línea proporciona una solución rápida, precisa y segura para convertir imágenes en texto editable.",
  "Try our free online OCR tool today and simplify your document management!" : "¡Prueba hoy nuestra herramienta OCR en línea gratuita y simplifica la gestión de tus documentos!",
  "Keywords:" : "Palabras clave:",
  "Image to Text Converter, OCR Online, Free OCR Tool, Convert Image to Text, Extract Text from Image, Convert PDF to Word, Optical Character Recognition, Online OCR, Picture to Text Converter, Convert Scanned Documents, Image Text Extraction Tool, OCR for PDF to Word, Text Scanner Online" : "Convertidor de Imagen a Texto, OCR en Línea, Herramienta OCR Gratuita, Convertir Imagen en Texto, Extraer Texto de Imagen, Convertir PDF a Word, Reconocimiento Óptico de Caracteres, OCR Online, Convertidor de Imagen a Texto, Convertir Documentos Escaneados, Herramienta de Extracción de Texto de Imagen, OCR para PDF a Word, Escáner de Texto Online",
"Dark Mode": "🌙 Modo Oscuro", 
"AI-Powered Image to Word": "Imagen a Word con IA",
    "Convert images into fully editable Word documents with our AI-driven OCR. Preserve text formatting and layout effortlessly.": "Convierte imágenes en documentos de Word completamente editables con nuestro OCR impulsado por IA. Conserva el formato y el diseño del texto sin esfuerzo.",
    "Extract Text from Scanned PDFs": "Extraer texto de PDF escaneados",
    "Convert scanned PDFs into Word documents while retaining structure, tables, and formatting for seamless editing.": "Convierte PDF escaneados en documentos de Word conservando la estructura, tablas y formato para una edición sin problemas.",
    "Privacy & Security Guaranteed": "Privacidad y seguridad garantizadas",
    "All uploaded files are encrypted and deleted after processing. Registered users can store documents securely.": "Todos los archivos subidos se cifran y eliminan después del procesamiento. Los usuarios registrados pueden almacenar documentos de forma segura.",
    "Works on Any Device": "Funciona en cualquier dispositivo",
    "Convert images to Word on Windows, Mac, Linux, Android, and iOS—no software installation required.": "Convierte imágenes a Word en Windows, Mac, Linux, Android y iOS: no se requiere instalación de software.",
    "AI-Driven OCR for High Accuracy": "OCR impulsado por IA para alta precisión",
    "Extract text with 99% accuracy using AI-powered OCR. Supports multiple languages, including handwritten text.": "Extrae texto con un 99% de precisión utilizando OCR impulsado por IA. Admite múltiples idiomas, incluido texto manuscrito.",
    "100% Free for Limited Use": "100% gratis para uso limitado",
    "Process up to <span id='MainContent_TextFreeFiles'>5</span> images per hour for free. Upgrade to unlock unlimited conversions.": "Procesa hasta <span id='MainContent_TextFreeFiles'>5</span> imágenes por hora de forma gratuita. Actualiza para desbloquear conversiones ilimitadas.",
    "About Online OCR": "Acerca de Online OCR",
    "Online OCR is a powerful text extraction tool that allows users to convert images into editable text with high accuracy.": "Online OCR es una potente herramienta de extracción de texto que permite a los usuarios convertir imágenes en texto editable con alta precisión.",
    "Quick Links": "Enlaces rápidos",
    "Legal": "Legal",
    "Connect With Us": "Conéctate con nosotros",
    "© 2024 Online OCR. All rights reserved.": "© 2024 Online OCR. Todos los derechos reservados.",
    "Back to Top": "Volver al inicio", 
    "About": "Acerca de",
    "Key Features": "Características clave",
    "Pricing": "Precios",
    "API": "API",
    "FAQ": "Preguntas frecuentes",
    "Legal": "Legal",
    "Terms of Service": "Términos de servicio",
    "Privacy Policy": "Política de privacidad",
    "Contact Us": "Contáctenos",
    "Connect With Us": "Conéctate con nosotros",
    "Email: support@onlineocr.com": "Correo electrónico: support@onlineocr.com",
    "Phone: +1 (234) 567-890": "Teléfono: +1 (234) 567-890",
     "Image to Text Converter": "Convertidor de Imagen a Texto",
    "Upload an image (JPG, PNG) or PDF to extract text.": "Sube una imagen (JPG, PNG) o PDF para extraer texto.",
"📝 Convert Image to Word in Seconds – Free & Accurate OCR Tool": "📝 Convierte imágenes a Word en segundos – Herramienta OCR gratuita y precisa",
    "Extract text from images and download it as a Word document with just a few clicks.": "Extrae texto de imágenes y descárgalo como un documento de Word en solo unos clics.",

// PDF to Image Section
"PDF to Image Converter": "Convertidor de PDF a imagen",
"Upload a PDF file to convert it into high-quality images and download them as a ZIP file.": 
"Suba un archivo PDF para convertirlo en imágenes de alta calidad y descargarlas como un archivo ZIP.",
"Drag & Drop or Choose PDF File": 
"Arrastrar y soltar o Elegir archivo PDF",
"No file chosen": "Ningún archivo seleccionado",
"Convert to Images": "Convertir a imágenes",
"Processing... Please wait.": "Procesando... Por favor espere.",
"Download as ZIP": "Descargar como ZIP",

// Features Section
"Convert PDF to High-Quality Images": "Convertir PDF a imágenes de alta calidad",
"Effortlessly transform your PDFs into high-resolution images. Supports JPG, PNG, and other formats for seamless sharing.": 
"Transforme sus PDF en imágenes de alta resolución sin esfuerzo. Admite JPG, PNG y otros formatos para un intercambio sin problemas.",
"Extract Pages as Separate Images": "Extraer páginas como imágenes separadas",
"Convert each page of your PDF into a separate image file while preserving layout, text clarity, and formatting.": 
"Convierta cada página de su PDF en un archivo de imagen separado, conservando el diseño, la claridad del texto y el formato.",
"Secure & Fast PDF to Image Conversion": "Conversión de PDF a imagen segura y rápida",
"Experience fast and encrypted processing to ensure data security. No watermark, no quality loss.": 
"Experimente un procesamiento rápido y cifrado para garantizar la seguridad de los datos. Sin marca de agua, sin pérdida de calidad.",
"Works on Any Device": "Funciona en cualquier dispositivo",
"Access our PDF-to-image converter from any device—Windows, Mac, Android, or iOS—directly from your browser.": 
"Acceda a nuestro convertidor de PDF a imagen desde cualquier dispositivo—Windows, Mac, Android o iOS—directamente desde su navegador.",
"High-Resolution Image Output": "Salida de imágenes de alta resolución",
"Get crystal-clear image quality for professional use. Retains sharp text and vivid colors.": 
"Obtenga una calidad de imagen nítida para uso profesional. Conserva texto nítido y colores vivos.",
"100% Free for Limited Use": "100% gratis para uso limitado",
"Convert up to 5 PDFs per hour for free. Upgrade for unlimited access.": 
"Convierta hasta 5 PDFs por hora de forma gratuita. Actualice para obtener acceso ilimitado.",
"PDF to Image Converter – Convert PDFs into High-Quality JPG or PNG": "Convertidor de PDF a Imagen – Convierte PDFs en JPG o PNG de Alta Calidad",
"Easily convert PDF documents into high-resolution images with our free online PDF to Image converter.Extract pages from PDF files and save them as JPG, PNG, or other image formats with no quality loss.": "Convierte fácilmente documentos PDF en imágenes de alta resolución con nuestro convertidor en línea gratuito de PDF a Imagen.Extrae páginas de archivos PDF y guárdalas como JPG, PNG u otros formatos de imagen sin pérdida de calidad.",

//Image to Excel Section
"Image to Excel Conversion": "Conversión de imagen a Excel",
    "AI-Powered Image to Excel": "Imagen a Excel con IA",
    "Convert images containing tables into fully editable Excel sheets with precision. Preserve formatting and structure effortlessly.": "Convierte imágenes con tablas en hojas de Excel totalmente editables con precisión. Conserva el formato y la estructura sin esfuerzo.",
    "Extract Tables from PDFs": "Extraer tablas de PDFs",
    "Extract Tables from Scanned PDFs": "Extraer tablas de PDFs escaneados",
    "Transform scanned PDF files into accurate Excel spreadsheets, ensuring data integrity and precise table extraction.": "Transforma archivos PDF escaneados en hojas de Excel precisas, asegurando la integridad de los datos y la extracción precisa de tablas.",
    "Secure Data Processing": "Procesamiento de datos seguro",
    "Privacy & Data Security": "Privacidad y seguridad de los datos",
    "All uploaded files are encrypted and automatically deleted after processing. Registered users get additional security features.": "Todos los archivos subidos están encriptados y se eliminan automáticamente después del procesamiento. Los usuarios registrados obtienen funciones de seguridad adicionales.",
    "Cross-Platform Compatibility": "Compatibilidad multiplataforma",
    "Works on Any Device": "Funciona en cualquier dispositivo",
    "Access our Excel conversion tool from Windows, Mac, Linux, Android, or iOS without software installation—100% online.": "Accede a nuestra herramienta de conversión de Excel desde Windows, Mac, Linux, Android o iOS sin instalación de software — 100% en línea.",
    "AI-Driven Excel Conversion": "Conversión de Excel con IA",
    "AI-Powered Accuracy": "Precisión impulsada por IA",
    "Utilizing AI-driven OCR technology, our tool ensures up to 99% accuracy in extracting structured data into Excel format.": "Usando tecnología OCR impulsada por IA, nuestra herramienta garantiza hasta un 99% de precisión en la extracción de datos estructurados al formato Excel.",
    "Free Excel Conversion": "Conversión gratuita a Excel",
    "100% Free for Limited Use": "100% gratis para uso limitado",
    "Process up to 5 files per hour for free. Upgrade to unlock unlimited conversions and premium features.": "Procesa hasta 5 archivos por hora de forma gratuita. Mejora tu plan para conversiones ilimitadas y funciones premium.",
    "📊 Convert Image to Excel - Extract Text & Download as XLSX": "📊 Convertir imagen a Excel - Extraer texto y descargar como XLSX",
    "Convert images into fully editable Excel spreadsheets with 99% accuracy using our AI-powered OCR tool. Extract tables, numbers, and structured data in just a few clicks.": "Convierte imágenes en hojas de cálculo de Excel totalmente editables con un 99% de precisión usando nuestra herramienta OCR impulsada por IA. Extrae tablas, números y datos estructurados en solo unos clics.",
    "☀️ Light Mode": "☀️ Modo claro"
  },

  fr: {
    "Home": "Accueil",
    "API": "API",
    "PDF TO WORD": "PDF en Word",
    "PDF TO EXCEL": "PDF en Excel",
    "PDF TO IMAGE": "PDF en Image",
    "Image to Text Converter – Convert Images, PDFs, and Screenshots into Editable Text": "Convertisseur d'image en texte - Convertissez des images, des PDF et des captures d'écran en texte modifiable",
    "Convert images and scanned documents into editable text instantly using our free online OCR tool. Extract text from JPG, PNG, PDF, or screenshots and save them as Word, Excel, or plain text.": "Convertissez instantanément des images et des documents numérisés en texte modifiable à l'aide de notre outil OCR en ligne gratuit. Extrayez du texte à partir de JPG, PNG, PDF ou de captures d'écran et enregistrez-les sous Word, Excel ou texte brut.",
    "Image to Text Converter": "Convertisseur d'image en texte",
    "Choose File": "Choisissez un fichier",
    "Select Language": "Sélectionnez la langue",
    "Extract Text": "Extraire le texte",
    "Upload an image (JPG, PNG) or PDF to extract text.": "Téléchargez une image (JPG, PNG) ou un PDF pour extraire le texte.",
    "Copy": "Copier",
    "Download": "Télécharger",
    "What is an Image to Text Converter?": "Qu'est-ce qu'un convertisseur d'image en texte?",
    "Extract text from images (JPG, PNG, etc.).": "Extrayez du texte à partir d'images (JPG, PNG, etc.).",
    "Convert PDF to Word, Excel, or Text.": "Convertissez des PDF en Word, Excel ou texte.",
    "Accurate and secure OCR technology.": "Technologie OCR précise et sécurisée.",
    "Free and easy to use.": "Gratuit et facile à utiliser.",
    "Image to Text Converter Icon": "Icône du convertisseur d'image en texte",
    "How to Convert an Image to Text Online?": "Comment convertir une image en texte en ligne?",
    "Follow these simple steps to extract text from images and PDFs using our advanced OCR tool.": "Suivez ces étapes simples pour extraire du texte à partir d'images et de PDF à l'aide de notre outil OCR avancé.",
    "1️⃣ Upload Your Image or PDF": "1️⃣ Téléchargez votre image ou PDF",
    "Click the 'Upload' button to select an image (JPG, PNG, BMP) or a PDF file from your device.": "Cliquez sur le bouton 'Télécharger' pour sélectionner une image (JPG, PNG, BMP) ou un fichier PDF depuis votre appareil.",
    "Supported Formats: JPG, PNG, BMP, GIF, PDF": "Formats pris en charge : JPG, PNG, BMP, GIF, PDF",
    "Upload Options: Device, Google Drive, Dropbox": "Options de téléchargement : Appareil, Google Drive, Dropbox",
    "2️⃣ Choose Language for Better Accuracy": "2️⃣ Choisissez la langue pour une meilleure précision",
    "Select the language of the text in your document. Our AI-powered OCR software supports multiple languages, ensuring precise text extraction.": "Sélectionnez la langue du texte dans votre document. Notre logiciel OCR alimenté par l'IA prend en charge plusieurs langues, garantissant une extraction de texte précise.",
    "Supports: English, Spanish, French, German, Hindi, Arabic, Chinese, and more.": "Prend en charge : Anglais, Espagnol, Français, Allemand, Hindi, Arabe, Chinois et plus encore.",
    "Bonus: Our tool also recognizes handwritten text.": "Bonus : Notre outil reconnaît également le texte manuscrit.",
    "3️⃣ Click Convert & Extract Text": "3️⃣ Cliquez sur Convertir et extraire le texte",
    "Hit the 'Convert' button, and our tool will instantly process the image, extracting text with high accuracy.": "Cliquez sur le bouton 'Convertir' et notre outil traitera instantanément l'image en extrayant le texte avec une grande précision.",
    "Preview the extracted text before downloading.": "Prévisualisez le texte extrait avant de le télécharger.",
    "4️⃣ Copy or Download Your Text": "4️⃣ Copiez ou téléchargez votre texte",
    "Once the conversion is complete, you can:": "Une fois la conversion terminée, vous pouvez :",
    "Copy the text and paste it anywhere.": "Copiez le texte et collez-le n'importe où.",
    "Download the extracted text in your preferred format:": "Téléchargez le texte extrait dans votre format préféré :",
    "Word (.docx) – for editing in Microsoft Word": "Word (.docx) – pour modification dans Microsoft Word",
    "Excel (.xlsx) – for structured data extraction": "Excel (.xlsx) – pour l'extraction de données structurées",
    "Plain Text (.txt) – for basic text storage": "Texte brut (.txt) – pour un stockage de texte simple",
    "🚀 Instant, free, and no registration required!": "🚀 Instantané, gratuit et sans inscription requise!",
    "Features of Our Free Online OCR Tool": "Caractéristiques de notre outil OCR en ligne gratuit",
    "High Accuracy: Extracts text with precision, even from low-quality images.": "Haute précision : extrait du texte avec précision, même à partir d'images de faible qualité.",
    "Multiple File Formats: Supports JPG, PNG, GIF, BMP, TIFF, and PDFs.": "Formats de fichiers multiples : prend en charge JPG, PNG, GIF, BMP, TIFF et PDF.",
    "User-Friendly: No technical knowledge required – just upload and convert.": "Convivial : aucune connaissance technique requise – il suffit de télécharger et de convertir.",
    "Secure & Private: Files are processed securely and deleted automatically.": "Sécurisé et privé : les fichiers sont traités en toute sécurité et supprimés automatiquement.",
    "100% Free: Unlimited conversions with no hidden costs.": "100% gratuit : conversions illimitées sans coûts cachés.",
    "Applications of OCR Technology": "Applications de la technologie OCR",
    "Students & Academics: Convert scanned textbooks and notes into editable documents.": "Étudiants et universitaires : convertissez des manuels numérisés et des notes en documents modifiables.",
    "Business & Office Work: Digitize invoices, contracts, and reports.": "Travail commercial et de bureau : numérisez des factures, des contrats et des rapports.",
    "Legal & Government Documents: Convert official papers into text for editing.": "Documents juridiques et gouvernementaux : convertissez des documents officiels en texte modifiable.",
    "Healthcare Records: Extract medical notes and prescriptions.": "Dossiers médicaux : extrayez des notes médicales et des ordonnances.",
    "Personal Use: Copy text from images, posters, and scanned documents.": "Usage personnel : copiez du texte à partir d'images, d'affiches et de documents numérisés.",
    "Benefits of Using an Online OCR Tool": "Avantages de l'utilisation d'un outil OCR en ligne",
    "Time-Saving: No manual typing, extract text instantly.": "Gain de temps : pas de saisie manuelle, extraction instantanée du texte.",
    "Boosts Productivity: Automates data entry and document processing.": "Améliore la productivité : automatise la saisie de données et le traitement des documents.",
    "Improves Accuracy: Eliminates human errors.": "Améliore la précision : élimine les erreurs humaines.",
    "Accessible Anywhere: Works on any device with an internet connection.": "Accessible partout : fonctionne sur tout appareil avec une connexion Internet.",
    "Eco-Friendly: Reduce paper usage by digitizing documents.": "Écologique : réduisez l'utilisation du papier en numérisant les documents.",
    "Frequently Asked Questions (FAQs)": "Questions Fréquemment Posées (FAQ)",
    "1. Is OCR technology accurate?": "1. La technologie OCR est-elle précise ?",
    "Yes, OCR (Optical Character Recognition) technology has advanced significantly and can extract text with over 95% accuracy, especially when working with high-quality images.": "Oui, la technologie OCR (Reconnaissance Optique de Caractères) a beaucoup progressé et peut extraire du texte avec une précision de plus de 95 %, en particulier avec des images de haute qualité.",
    "2. What file formats are supported?": "2. Quels formats de fichier sont pris en charge ?",
    "Our Image to Text Converter supports JPG, PNG, BMP, GIF, TIFF, and PDF formats for seamless text extraction.": "Notre convertisseur d'image en texte prend en charge les formats JPG, PNG, BMP, GIF, TIFF et PDF pour une extraction de texte fluide.",
    "3. Is the Image to Text Converter free to use?": "3. Le convertisseur d'image en texte est-il gratuit ?",
    "Yes! Our online OCR tool is completely free, with no hidden charges or restrictions.": "Oui ! Notre outil OCR en ligne est entièrement gratuit, sans frais cachés ni restrictions.",
    "4. Can I convert handwritten text using OCR?": "4. Puis-je convertir du texte manuscrit avec l'OCR ?",
    "OCR technology can recognize handwritten text, but accuracy depends on the clarity and neatness of the handwriting.": "La technologie OCR peut reconnaître le texte manuscrit, mais la précision dépend de la clarté et de la lisibilité de l'écriture.",
    "5. Is my data secure?": "5. Mes données sont-elles sécurisées ?",
    "Yes, we respect your privacy. All uploaded files are processed securely and deleted automatically after conversion.": "Oui, nous respectons votre vie privée. Tous les fichiers téléchargés sont traités de manière sécurisée et supprimés automatiquement après la conversion.",
    "6. Does OCR work for multiple languages?": "6. L'OCR fonctionne-t-il pour plusieurs langues ?",
    "Yes, our OCR tool supports multiple languages, including English, Spanish, French, German, and more.": "Oui, notre outil OCR prend en charge plusieurs langues, y compris l'anglais, l'espagnol, le français, l'allemand et bien d'autres.",
    "7. Can I extract text from scanned PDFs?": "7. Puis-je extraire du texte à partir de fichiers PDF scannés ?",
    "Absolutely! Our OCR tool allows you to extract text from scanned PDFs and convert them into editable formats.": "Absolument ! Notre outil OCR vous permet d'extraire du texte à partir de fichiers PDF scannés et de les convertir en formats modifiables.",
    "8. How long does it take to convert an image to text?": "8. Combien de temps faut-il pour convertir une image en texte ?",
    "The process takes only a few seconds, depending on the image size and quality.": "Le processus ne prend que quelques secondes, en fonction de la taille et de la qualité de l'image.",
    "9. Can I convert multiple images at once?": "9. Puis-je convertir plusieurs images en même temps ?",
    "Currently, we support one file at a time, but bulk conversion features are coming soon.": "Actuellement, nous prenons en charge un fichier à la fois, mais des fonctionnalités de conversion en lot arriveront bientôt.",
    "10. Do I need to install software?": "10. Dois-je installer un logiciel ?",
    "No, our OCR tool is completely online. You can access it from any browser without installing any software.": "Non, notre outil OCR est entièrement en ligne. Vous pouvez y accéder depuis n'importe quel navigateur sans installer de logiciel.",
    "Conclusion": "Conclusion",
    "A free Image to Text Converter is an essential tool for students, professionals, and businesses. Our OCR Online Tool provides a fast, accurate, and secure solution for converting images into editable text.": "Un convertisseur d'image en texte gratuit est un outil essentiel pour les étudiants, les professionnels et les entreprises. Notre outil OCR en ligne offre une solution rapide, précise et sécurisée pour convertir des images en texte modifiable.",
    "Try our free online OCR tool today and simplify your document management!": "Essayez notre outil OCR en ligne gratuit aujourd'hui et simplifiez la gestion de vos documents !",
    "Keywords:": "Mots-clés :",
    "Image to Text Converter, OCR Online, Free OCR Tool, Convert Image to Text, Extract Text from Image, Convert PDF to Word, Optical Character Recognition, Online OCR, Picture to Text Converter, Convert Scanned Documents, Image Text Extraction Tool, OCR for PDF to Word, Text Scanner Online": "Convertisseur d'image en texte, OCR en ligne, outil OCR gratuit, convertir une image en texte, extraire du texte d'une image, convertir un PDF en Word, reconnaissance optique de caractères, OCR en ligne, convertisseur d'image en texte, convertir des documents scannés, outil d'extraction de texte d'image, OCR pour PDF en Word, scanner de texte en ligne",
  "Dark Mode": "🌙 Mode Sombre",
  "AI-Powered Image to Word": "Image à Word alimenté par IA",
    "Convert images into fully editable Word documents with our AI-driven OCR. Preserve text formatting and layout effortlessly.": "Convertissez des images en documents Word entièrement modifiables avec notre OCR alimenté par IA. Conservez la mise en forme et la disposition du texte sans effort.",
    "Extract Text from Scanned PDFs": "Extraire le texte des PDF scannés",
    "Convert scanned PDFs into Word documents while retaining structure, tables, and formatting for seamless editing.": "Convertissez des PDF scannés en documents Word tout en conservant la structure, les tableaux et la mise en forme pour une édition fluide.",
    "Privacy & Security Guaranteed": "Confidentialité et sécurité garanties",
    "All uploaded files are encrypted and deleted after processing. Registered users can store documents securely.": "Tous les fichiers téléchargés sont chiffrés et supprimés après traitement. Les utilisateurs enregistrés peuvent stocker des documents en toute sécurité.",
    "Works on Any Device": "Fonctionne sur tous les appareils",
    "Convert images to Word on Windows, Mac, Linux, Android, and iOS—no software installation required.": "Convertissez des images en Word sur Windows, Mac, Linux, Android et iOS : aucune installation de logiciel requise.",
    "AI-Driven OCR for High Accuracy": "OCR alimenté par IA pour une grande précision",
    "Extract text with 99% accuracy using AI-powered OCR. Supports multiple languages, including handwritten text.": "Extrayez du texte avec une précision de 99 % grâce à l'OCR alimenté par IA. Prend en charge plusieurs langues, y compris le texte manuscrit.",
    "100% Free for Limited Use": "100 % gratuit pour un usage limité",
    "Process up to <span id='MainContent_TextFreeFiles'>5</span> images per hour for free. Upgrade to unlock unlimited conversions.": "Traitez jusqu'à <span id='MainContent_TextFreeFiles'>5</span> images par heure gratuitement. Passez à la version payante pour débloquer des conversions illimitées.",
    "About Online OCR": "À propos d'Online OCR",
    "Online OCR is a powerful text extraction tool that allows users to convert images into editable text with high accuracy.": "Online OCR est un outil puissant d'extraction de texte qui permet aux utilisateurs de convertir des images en texte modifiable avec une grande précision.",
    "Quick Links": "Liens rapides",
    "Legal": "Légal",
    "Connect With Us": "Connectez-vous avec nous",
    "© 2024 Online OCR. All rights reserved.": "© 2024 Online OCR. Tous droits réservés.",
    "Back to Top": "Retour en haut",
        "Image to Text Converter": "Convertisseur d'Image en Texte",
    "Upload an image (JPG, PNG) or PDF to extract text.": "Téléchargez une image (JPG, PNG) ou un PDF pour extraire du texte.",
    "About": "À propos",
    "Key Features": "Caractéristiques clés",
    "Pricing": "Tarification",
    "API": "API",
    "FAQ": "FAQ",
    "Legal": "Légal",
    "Terms of Service": "Conditions d'utilisation",
    "Privacy Policy": "Politique de confidentialité",
    "Contact Us": "Nous contacter",
    "Connect With Us": "Connectez-vous avec nous",
    "Email: support@onlineocr.com": "E-mail : support@onlineocr.com",
    "Phone: +1 (234) 567-890": "Téléphone : +1 (234) 567-890",
    "📝 Convert Image to Word in Seconds – Free & Accurate OCR Tool": "📝 Convertissez une image en Word en quelques secondes – Outil OCR gratuit et précis", 
    "Extract text from images and download it as a Word document with just a few clicks.": "Extrayez du texte à partir d’images et téléchargez-le en document Word en quelques clics.",

  // PDF to Image Section
  "PDF to Image Converter": "Convertisseur PDF en image",
  "Upload a PDF file to convert it into high-quality images and download them as a ZIP file.": "Téléchargez un fichier PDF pour le convertir en images de haute qualité et les télécharger sous forme de fichier ZIP.",
  "Drag & Drop or Choose PDF File": "Glisser-déposer ou Choisir un fichier PDF",
  "No file chosen": "Aucun fichier choisi",
  "Convert to Images": "Convertir en images",
  "Processing... Please wait.": "Traitement... Veuillez patienter.",
  "Download as ZIP": "Télécharger au format ZIP",

  // Features Section
  "Convert PDF to High-Quality Images": "Convertir PDF en images de haute qualité",
  "Effortlessly transform your PDFs into high-resolution images. Supports JPG, PNG, and other formats for seamless sharing.": 
  "Transformez facilement vos PDF en images haute résolution. Prend en charge JPG, PNG et d'autres formats pour un partage fluide.",
  "Extract Pages as Separate Images": "Extraire des pages en images séparées",
  "Convert each page of your PDF into a separate image file while preserving layout, text clarity, and formatting.": 
  "Convertissez chaque page de votre PDF en un fichier image séparé tout en conservant la mise en page, la clarté du texte et le formatage.",
  "Secure & Fast PDF to Image Conversion": "Conversion de PDF en image sécurisée et rapide",
  "Experience fast and encrypted processing to ensure data security. No watermark, no quality loss.": 
  "Profitez d'un traitement rapide et chiffré pour garantir la sécurité des données. Sans filigrane, sans perte de qualité.",
  "Works on Any Device": "Fonctionne sur tous les appareils",
  "Access our PDF-to-image converter from any device—Windows, Mac, Android, or iOS—directly from your browser.": 
  "Accédez à notre convertisseur PDF en image depuis n'importe quel appareil—Windows, Mac, Android ou iOS—directement depuis votre navigateur.",
  "High-Resolution Image Output": "Sortie d'images haute résolution",
  "Get crystal-clear image quality for professional use. Retains sharp text and vivid colors.": 
  "Obtenez une qualité d'image cristalline pour un usage professionnel. Conserve un texte net et des couleurs vives.",
  "100% Free for Limited Use": "100 % gratuit pour un usage limité",
  "Convert up to 5 PDFs per hour for free. Upgrade for unlimited access.": 
  "Convertissez jusqu'à 5 PDFs par heure gratuitement. Passez à la version payante pour un accès illimité.",
  "PDF to Image Converter – Convert PDFs into High-Quality JPG or PNG": "Convertisseur PDF en Image – Convertissez des PDF en JPG ou PNG de Haute Qualité",
  "Easily convert PDF documents into high-resolution images with our free online PDF to Image converter.Extract pages from PDF files and save them as JPG, PNG, or other image formats with no quality loss.": "Convertissez facilement des documents PDF en images haute résolution avec notre convertisseur PDF en Image en ligne gratuit.Extrayez les pages des fichiers PDF et enregistrez-les sous forme de JPG, PNG ou d'autres formats d'image sans perte de qualité.",

// Image to Excel Section
 "Image to Excel Conversion": "Conversion d'image en Excel",
    "AI-Powered Image to Excel": "Image en Excel alimentée par l'IA",
    "Convert images containing tables into fully editable Excel sheets with precision. Preserve formatting and structure effortlessly.": "Convertissez des images contenant des tableaux en feuilles Excel entièrement éditables avec précision. Préservez facilement la mise en forme et la structure.",
    "Extract Tables from PDFs": "Extraire des tableaux des PDF",
    "Extract Tables from Scanned PDFs": "Extraire des tableaux des PDF numérisés",
    "Transform scanned PDF files into accurate Excel spreadsheets, ensuring data integrity and precise table extraction.": "Transformez des fichiers PDF numérisés en feuilles de calcul Excel précises, garantissant l'intégrité des données et une extraction exacte des tableaux.",
    "Secure Data Processing": "Traitement sécurisé des données",
    "Privacy & Data Security": "Confidentialité et sécurité des données",
    "All uploaded files are encrypted and automatically deleted after processing. Registered users get additional security features.": "Tous les fichiers téléchargés sont chiffrés et supprimés automatiquement après le traitement. Les utilisateurs enregistrés bénéficient de fonctionnalités de sécurité supplémentaires.",
    "Cross-Platform Compatibility": "Compatibilité multiplateforme",
    "Works on Any Device": "Fonctionne sur tous les appareils",
    "Access our Excel conversion tool from Windows, Mac, Linux, Android, or iOS without software installation—100% online.": "Accédez à notre outil de conversion Excel depuis Windows, Mac, Linux, Android ou iOS sans installer de logiciel — 100 % en ligne.",
    "AI-Driven Excel Conversion": "Conversion Excel par l'IA",
    "AI-Powered Accuracy": "Précision pilotée par l'IA",
    "Utilizing AI-driven OCR technology, our tool ensures up to 99% accuracy in extracting structured data into Excel format.": "Grâce à la technologie OCR pilotée par l'IA, notre outil garantit une précision allant jusqu'à 99 % pour extraire des données structurées au format Excel.",
    "Free Excel Conversion": "Conversion Excel gratuite",
    "100% Free for Limited Use": "100 % gratuit pour une utilisation limitée",
    "Process up to 5 files per hour for free. Upgrade to unlock unlimited conversions and premium features.": "Traitez jusqu'à 5 fichiers par heure gratuitement. Passez à une version supérieure pour débloquer les conversions illimitées et les fonctionnalités premium.",
    "📊 Convert Image to Excel - Extract Text & Download as XLSX": "📊 Convertir une image en Excel - Extraire du texte et télécharger en XLSX",
    "Convert images into fully editable Excel spreadsheets with 99% accuracy using our AI-powered OCR tool. Extract tables, numbers, and structured data in just a few clicks.": "Convertissez des images en feuilles de calcul Excel entièrement modifiables avec une précision de 99 % grâce à notre outil OCR alimenté par l'IA. Extrayez des tableaux, des chiffres et des données structurées en quelques clics.",
    "☀️ Light Mode": "☀️ Mode clair"
  },
  de: {
    "Home": "Startseite",
    "API": "API",
    "PDF TO WORD": "PDF zu Word",
    "PDF TO EXCEL": "PDF zu Excel",
    "PDF TO IMAGE": "PDF zu Bild",
    "Image to Text Converter – Convert Images, PDFs, and Screenshots into Editable Text":
      "Bild-zu-Text-Konverter – Konvertieren Sie Bilder, PDFs und Screenshots in bearbeitbaren Text",
    "Convert images and scanned documents into editable text instantly using our free online OCR tool. Extract text from JPG, PNG, PDF, or screenshots and save them as Word, Excel, or plain text.":
      "Konvertieren Sie Bilder und gescannte Dokumente mit unserem kostenlosen Online-OCR-Tool sofort in bearbeitbaren Text. Extrahieren Sie Text aus JPG, PNG, PDF oder Screenshots und speichern Sie ihn als Word, Excel oder Klartext.",
    "Extract Text": "Text extrahieren",
    "Upload an image (JPG, PNG) or PDF to extract text.": "Laden Sie ein Bild (JPG, PNG) oder eine PDF hoch, um Text zu extrahieren.",
    "Copy": "Kopieren",
    "Download": "Herunterladen",
    "Features of Our Free Online OCR Tool": "Funktionen unseres kostenlosen Online-OCR-Tools",
    "Image to Text Converter – Convert Images, PDFs, and Screenshots into Editable Text": "Bild-zu-Text-Konverter – Bilder, PDFs und Screenshots in bearbeitbaren Text umwandeln",
    "Convert images and scanned documents into editable text instantly using our free online OCR tool. Extract text from JPG, PNG, PDF, or screenshots and save them as Word, Excel, or plain text.": "Wandeln Sie Bilder und gescannte Dokumente mit unserem kostenlosen Online-OCR-Tool sofort in bearbeitbaren Text um. Extrahieren Sie Text aus JPG, PNG, PDF oder Screenshots und speichern Sie ihn als Word-, Excel- oder Klartextdatei.",
    "Image to Text Converter": "Bild-zu-Text-Konverter",
    "Choose File": "Datei auswählen",
    "Select Language": "Sprache auswählen",
    "Extract Text": "Text extrahieren",
    "Upload an image (JPG, PNG) or PDF to extract text.": "Laden Sie ein Bild (JPG, PNG) oder eine PDF-Datei hoch, um Text zu extrahieren.",
    "Copy": "Kopieren",
    "Download": "Herunterladen",
    "What is an Image to Text Converter?": "Was ist ein Bild-zu-Text-Konverter?",
    "Extract text from images (JPG, PNG, etc.).": "Extrahieren Sie Text aus Bildern (JPG, PNG usw.).",
    "Convert PDF to Word, Excel, or Text.": "Konvertieren Sie PDFs in Word, Excel oder Text.",
    "Accurate and secure OCR technology.": "Präzise und sichere OCR-Technologie.",
    "Free and easy to use.": "Kostenlos und einfach zu bedienen.",
    "Image to Text Converter Icon": "Bild-zu-Text-Konverter-Symbol",
    "How to Convert an Image to Text Online?": "Wie konvertiert man ein Bild online in Text?",
    "Follow these simple steps to extract text from images and PDFs using our advanced OCR tool.": "Befolgen Sie diese einfachen Schritte, um mit unserem fortschrittlichen OCR-Tool Text aus Bildern und PDFs zu extrahieren.",
    "1️⃣ Upload Your Image or PDF": "1️⃣ Laden Sie Ihr Bild oder Ihre PDF hoch",
    "Click the 'Upload' button to select an image (JPG, PNG, BMP) or a PDF file from your device.": "Klicken Sie auf die Schaltfläche 'Hochladen', um ein Bild (JPG, PNG, BMP) oder eine PDF-Datei von Ihrem Gerät auszuwählen.",
    "Supported Formats: JPG, PNG, BMP, GIF, PDF": "Unterstützte Formate: JPG, PNG, BMP, GIF, PDF",
    "Upload Options: Device, Google Drive, Dropbox": "Upload-Optionen: Gerät, Google Drive, Dropbox",
    "2️⃣ Choose Language for Better Accuracy": "2️⃣ Wählen Sie die Sprache für bessere Genauigkeit",
    "Select the language of the text in your document. Our AI-powered OCR software supports multiple languages, ensuring precise text extraction.": "Wählen Sie die Sprache des Textes in Ihrem Dokument aus. Unsere KI-gestützte OCR-Software unterstützt mehrere Sprachen und sorgt für eine präzise Textextraktion.",
    "Supports: English, Spanish, French, German, Hindi, Arabic, Chinese, and more.": "Unterstützt: Englisch, Spanisch, Französisch, Deutsch, Hindi, Arabisch, Chinesisch und mehr.",
    "Bonus: Our tool also recognizes handwritten text.": "Bonus: Unser Tool erkennt auch handschriftlichen Text.",
    "3️⃣ Click Convert & Extract Text": "3️⃣ Klicken Sie auf Konvertieren & Text extrahieren",
    "Hit the 'Convert' button, and our tool will instantly process the image, extracting text with high accuracy.": "Drücken Sie die Schaltfläche 'Konvertieren', und unser Tool verarbeitet das Bild sofort und extrahiert den Text mit hoher Genauigkeit.",
    "Preview the extracted text before downloading.": "Vorschau des extrahierten Textes vor dem Herunterladen.",
    "4️⃣ Copy or Download Your Text": "4️⃣ Kopieren oder Laden Sie Ihren Text herunter",
    "Once the conversion is complete, you can:": "Sobald die Konvertierung abgeschlossen ist, können Sie:",
    "Copy the text and paste it anywhere.": "Den Text kopieren und an beliebiger Stelle einfügen.",
    "Download the extracted text in your preferred format:": "Laden Sie den extrahierten Text in Ihrem bevorzugten Format herunter:",
    "Word (.docx) – for editing in Microsoft Word": "Word (.docx) – zum Bearbeiten in Microsoft Word",
    "Excel (.xlsx) – for structured data extraction": "Excel (.xlsx) – für strukturierte Datenextraktion",
    "Plain Text (.txt) – for basic text storage": "Plain Text (.txt) – für die grundlegende Textspeicherung",
    "🚀 Instant, free, and no registration required!": "🚀 Sofort, kostenlos und keine Registrierung erforderlich!",
    "Features of Our Free Online OCR Tool": "Funktionen unseres kostenlosen Online-OCR-Tools",
    "High Accuracy: Extracts text with precision, even from low-quality images.": "Hohe Genauigkeit: Extrahiert Text präzise, selbst aus Bildern mit geringer Qualität.",
    "Multiple File Formats: Supports JPG, PNG, GIF, BMP, TIFF, and PDFs.": "Mehrere Dateiformate: Unterstützt JPG, PNG, GIF, BMP, TIFF und PDFs.",
    "User-Friendly: No technical knowledge required – just upload and convert.": "Benutzerfreundlich: Kein technisches Wissen erforderlich – einfach hochladen und konvertieren.",
    "Secure & Private: Files are processed securely and deleted automatically.": "Sicher & Privat: Dateien werden sicher verarbeitet und automatisch gelöscht.",
    "100% Free: Unlimited conversions with no hidden costs.": "100% kostenlos: Unbegrenzte Konvertierungen ohne versteckte Kosten.",
    "Applications of OCR Technology": "Anwendungen der OCR-Technologie",
    "Students & Academics: Convert scanned textbooks and notes into editable documents.": "Studenten & Akademiker: Scannen Sie Lehrbücher und Notizen und wandeln Sie sie in bearbeitbare Dokumente um.",
    "Business & Office Work: Digitize invoices, contracts, and reports.": "Geschäft & Büroarbeit: Digitalisieren Sie Rechnungen, Verträge und Berichte.",
    "Legal & Government Documents: Convert official papers into text for editing.": "Rechtliche & Regierungsdokumente: Wandeln Sie offizielle Dokumente in bearbeitbaren Text um.",
    "Healthcare Records: Extract medical notes and prescriptions.": "Gesundheitsakten: Extrahieren Sie medizinische Notizen und Rezepte.",
    "Personal Use: Copy text from images, posters, and scanned documents.": "Persönlicher Gebrauch: Kopieren Sie Text aus Bildern, Plakaten und gescannten Dokumenten.",
    "Benefits of Using an Online OCR Tool": "Vorteile der Verwendung eines Online-OCR-Tools",
    "Time-Saving: No manual typing, extract text instantly.": "Zeitersparnis: Kein manuelles Tippen erforderlich, Text wird sofort extrahiert.",
    "Boosts Productivity: Automates data entry and document processing.": "Steigert die Produktivität: Automatisiert die Dateneingabe und Dokumentenverarbeitung.",
    "Improves Accuracy: Eliminates human errors.": "Verbessert die Genauigkeit: Beseitigt menschliche Fehler.",
    "Accessible Anywhere: Works on any device with an internet connection.": "Überall zugänglich: Funktioniert auf jedem Gerät mit Internetverbindung.",
    "Eco-Friendly: Reduce paper usage by digitizing documents.": "Umweltfreundlich: Reduzieren Sie den Papierverbrauch durch die Digitalisierung von Dokumenten.",

      "Frequently Asked Questions (FAQs)": "Häufig gestellte Fragen (FAQs)",
      "1. Is OCR technology accurate?": "1. Ist die OCR-Technologie genau?",
      "Yes, OCR (Optical Character Recognition) technology has advanced significantly and can extract text with over 95% accuracy, especially when working with high-quality images.": "Ja, die OCR-Technologie (Optische Zeichenerkennung) hat sich erheblich weiterentwickelt und kann Text mit über 95 % Genauigkeit extrahieren, insbesondere bei hochwertigen Bildern.",
      "2. What file formats are supported?": "2. Welche Dateiformate werden unterstützt?",
      "Our Image to Text Converter supports JPG, PNG, BMP, GIF, TIFF, and PDF formats for seamless text extraction.": "Unser Bild-zu-Text-Konverter unterstützt die Formate JPG, PNG, BMP, GIF, TIFF und PDF für eine nahtlose Textextraktion.",
      "3. Is the Image to Text Converter free to use?": "3. Ist der Bild-zu-Text-Konverter kostenlos?",
      "Yes! Our online OCR tool is completely free, with no hidden charges or restrictions.": "Ja! Unser Online-OCR-Tool ist völlig kostenlos, ohne versteckte Gebühren oder Einschränkungen.",
      "4. Can I convert handwritten text using OCR?": "4. Kann ich handschriftlichen Text mit OCR konvertieren?",
      "OCR technology can recognize handwritten text, but accuracy depends on the clarity and neatness of the handwriting.": "Die OCR-Technologie kann handschriftlichen Text erkennen, aber die Genauigkeit hängt von der Klarheit und Sauberkeit der Handschrift ab.",
      "5. Is my data secure?": "5. Sind meine Daten sicher?",
      "Yes, we respect your privacy. All uploaded files are processed securely and deleted automatically after conversion.": "Ja, wir respektieren Ihre Privatsphäre. Alle hochgeladenen Dateien werden sicher verarbeitet und nach der Konvertierung automatisch gelöscht.",
      "6. Does OCR work for multiple languages?": "6. Funktioniert OCR für mehrere Sprachen?",
      "Yes, our OCR tool supports multiple languages, including English, Spanish, French, German, and more.": "Ja, unser OCR-Tool unterstützt mehrere Sprachen, darunter Englisch, Spanisch, Französisch, Deutsch und mehr.",
      "7. Can I extract text from scanned PDFs?": "7. Kann ich Text aus gescannten PDFs extrahieren?",
      "Absolutely! Our OCR tool allows you to extract text from scanned PDFs and convert them into editable formats.": "Absolut! Unser OCR-Tool ermöglicht es Ihnen, Text aus gescannten PDFs zu extrahieren und in bearbeitbare Formate umzuwandeln.",
      "8. How long does it take to convert an image to text?": "8. Wie lange dauert die Umwandlung eines Bildes in Text?",
      "The process takes only a few seconds, depending on the image size and quality.": "Der Vorgang dauert nur wenige Sekunden, abhängig von der Bildgröße und -qualität.",
      "9. Can I convert multiple images at once?": "9. Kann ich mehrere Bilder auf einmal konvertieren?",
      "Currently, we support one file at a time, but bulk conversion features are coming soon.": "Derzeit unterstützen wir nur eine Datei gleichzeitig, aber Funktionen für die Massenkonvertierung werden bald verfügbar sein.",
      "10. Do I need to install software?": "10. Muss ich Software installieren?",
      "No, our OCR tool is completely online. You can access it from any browser without installing any software.": "Nein, unser OCR-Tool ist vollständig online. Sie können es von jedem Browser aus nutzen, ohne Software zu installieren.",
      "Conclusion": "Fazit",
      "A free Image to Text Converter is an essential tool for students, professionals, and businesses. Our OCR Online Tool provides a fast, accurate, and secure solution for converting images into editable text.": "Ein kostenloser Bild-zu-Text-Konverter ist ein unverzichtbares Werkzeug für Studenten, Fachleute und Unternehmen. Unser Online-OCR-Tool bietet eine schnelle, genaue und sichere Lösung zur Umwandlung von Bildern in bearbeitbaren Text.",
      "Try our free online OCR tool today and simplify your document management!": "Probieren Sie noch heute unser kostenloses Online-OCR-Tool aus und vereinfachen Sie Ihr Dokumentenmanagement!",
      "Keywords:": "Schlüsselwörter:",
      "Image to Text Converter, OCR Online, Free OCR Tool, Convert Image to Text, Extract Text from Image, Convert PDF to Word, Optical Character Recognition, Online OCR, Picture to Text Converter, Convert Scanned Documents, Image Text Extraction Tool, OCR for PDF to Word, Text Scanner Online": "Bild-zu-Text-Konverter, OCR Online, Kostenloses OCR-Tool, Bild in Text umwandeln, Text aus Bild extrahieren, PDF in Word konvertieren, Optische Zeichenerkennung, Online-OCR, Bild-zu-Text-Umwandler, Gescannte Dokumente konvertieren, Bildtextextraktionstool, OCR für PDF zu Word, Online-Textscanner",
  "Dark Mode": "🌙 Dunkler Modus",
  "AI-Powered Image to Word": "Bild zu Word mit KI",
    "Convert images into fully editable Word documents with our AI-driven OCR. Preserve text formatting and layout effortlessly.": "Konvertieren Sie Bilder mit unserem KI-gestützten OCR in vollständig bearbeitbare Word-Dokumente. Behalten Sie Textformatierung und Layout mühelos bei.",
    "Extract Text from Scanned PDFs": "Text aus gescannten PDFs extrahieren",
    "Convert scanned PDFs into Word documents while retaining structure, tables, and formatting for seamless editing.": "Konvertieren Sie gescannte PDFs in Word-Dokumente und behalten Sie dabei Struktur, Tabellen und Formatierung für nahtlose Bearbeitung bei.",
    "Privacy & Security Guaranteed": "Datenschutz und Sicherheit garantiert",
    "All uploaded files are encrypted and deleted after processing. Registered users can store documents securely.": "Alle hochgeladenen Dateien werden verschlüsselt und nach der Verarbeitung gelöscht. Registrierte Benutzer können Dokumente sicher speichern.",
    "Works on Any Device": "Funktioniert auf jedem Gerät",
    "Convert images to Word on Windows, Mac, Linux, Android, and iOS—no software installation required.": "Konvertieren Sie Bilder auf Windows, Mac, Linux, Android und iOS in Word – keine Softwareinstallation erforderlich.",
    "AI-Driven OCR for High Accuracy": "KI-gestütztes OCR für hohe Genauigkeit",
    "Extract text with 99% accuracy using AI-powered OCR. Supports multiple languages, including handwritten text.": "Extrahieren Sie Text mit 99 % Genauigkeit mittels KI-gestütztem OCR. Unterstützt mehrere Sprachen, einschließlich handgeschriebenem Text.",
    "100% Free for Limited Use": "100 % kostenlos für begrenzte Nutzung",
    "Process up to 5 images per hour for free. Upgrade to unlock unlimited conversions.": "Verarbeiten Sie bis zu 5 Bilder pro Stunde kostenlos. Upgraden Sie, um unbegrenzte Konvertierungen freizuschalten.",
    "About Online OCR": "Über Online OCR",
    "Online OCR is a powerful text extraction tool that allows users to convert images into editable text with high accuracy.": "Online OCR ist ein leistungsstarkes Texterkennungstool, mit dem Benutzer Bilder mit hoher Genauigkeit in bearbeitbaren Text umwandeln können.",
    "Quick Links": "Schnelllinks",
    "Legal": "Rechtliches",
    "Connect With Us": "Kontaktieren Sie uns",
    "© 2024 Online OCR. All rights reserved.": "© 2024 Online OCR. Alle Rechte vorbehalten.",
    "Back to Top": "Zurück nach oben",
    "About": "Über uns",
    "Key Features": "Hauptmerkmale",
    "Pricing": "Preisgestaltung",
    "API": "API",
    "FAQ": "FAQ",
    "Legal": "Rechtliches",
    "Terms of Service": "Nutzungsbedingungen",
    "Privacy Policy": "Datenschutzrichtlinie",
    "Contact Us": "Kontaktieren Sie uns",
    "Connect With Us": "Verbinde dich mit uns",
    "Email: support@onlineocr.com": "E-Mail: support@onlineocr.com",
    "Phone: +1 (234) 567-890": "Telefon: +1 (234) 567-890",
    "Image to Text Converter": " Bild-zu-Text-Konverter",
    "Upload an image (JPG, PNG) or PDF to extract text.": "Laden Sie ein Bild (JPG, PNG) oder eine PDF hoch, um Text zu extrahieren.",
     "Convert Image to Word in Seconds – Free & Accurate OCR Tool": "Bild in Word in Sekunden umwandeln – Kostenloses & genaues OCR-Tool",
    "📝 Extract text from images and download it as a Word document with just a few clicks.": "📝 Extrahieren Sie Text aus Bildern und laden Sie ihn mit nur wenigen Klicks als Word-Dokument herunter.",

        // PDF-zu-Bild-Sektion
        "PDF to Image Converter": "PDF-zu-Bild-Konverter",
        "Upload a PDF file to convert it into high-quality images and download them as a ZIP file.": "Laden Sie eine PDF-Datei hoch, um sie in hochauflösende Bilder zu konvertieren und als ZIP-Datei herunterzuladen.",
        "Drag & Drop or Choose PDF File": "Ziehen & Ablegen oder PDF-Datei auswählen",
        "No file chosen": "Keine Datei ausgewählt",
        "Convert to Images": "In Bilder konvertieren",
        "Processing... Please wait.": "Verarbeitung läuft... Bitte warten.",
        "Download as ZIP": "Als ZIP herunterladen",
    
        // Funktionsbereich
        "Convert PDF to High-Quality Images": "PDF in hochauflösende Bilder umwandeln",
        "Effortlessly transform your PDFs into high-resolution images. Supports JPG, PNG, and other formats for seamless sharing.": "Wandeln Sie Ihre PDFs mühelos in hochauflösende Bilder um. Unterstützt JPG, PNG und andere Formate für einfaches Teilen.",
        "Extract Pages as Separate Images": "Seiten als einzelne Bilder extrahieren",
        "Convert each page of your PDF into a separate image file while preserving layout, text clarity, and formatting.": "Wandeln Sie jede Seite Ihrer PDF-Datei in eine separate Bilddatei um, wobei Layout, Textklarheit und Formatierung erhalten bleiben.",
        "Secure & Fast PDF to Image Conversion": "Sichere & schnelle PDF-zu-Bild-Konvertierung",
        "Experience fast and encrypted processing to ensure data security. No watermark, no quality loss.": "Erleben Sie eine schnelle und verschlüsselte Verarbeitung für maximale Datensicherheit. Kein Wasserzeichen, kein Qualitätsverlust.",
        "Works on Any Device": "Funktioniert auf allen Geräten",
        "Access our PDF-to-image converter from any device—Windows, Mac, Android, or iOS—directly from your browser.": "Nutzen Sie unseren PDF-zu-Bild-Konverter auf jedem Gerät – Windows, Mac, Android oder iOS – direkt in Ihrem Browser.",
        "High-Resolution Image Output": "Hochauflösende Bildausgabe",
        "Get crystal-clear image quality for professional use. Retains sharp text and vivid colors.": "Erhalten Sie gestochen scharfe Bildqualität für professionelle Anwendungen. Bewahrt klare Texte und lebendige Farben.",
        "100% Free for Limited Use": "100 % kostenlos für begrenzte Nutzung",
        "Convert up to 5 PDFs per hour for free. Upgrade for unlimited access.": "Konvertieren Sie bis zu 5 PDFs pro Stunde kostenlos. Upgrade für unbegrenzten Zugang verfügbar.",
        "PDF to Image Converter – Convert PDFs into High-Quality JPG or PNG": "PDF-zu-Bild-Konverter – Konvertieren Sie PDFs in hochqualitative JPG oder PNG",
        "Easily convert PDF documents into high-resolution images with our free online PDF to Image converter.Extract pages from PDF files and save them as JPG, PNG, or other image formats with no quality loss." : "Konvertieren Sie PDF-Dokumente ganz einfach in hochauflösende Bilder mit unserem kostenlosen Online-PDF-zu-Bild-Konverter.Extrahieren Sie Seiten aus PDF-Dateien und speichern Sie sie als JPG, PNG oder andere Bildformate ohne Qualitätsverlust.",
        
        // Image to Excel Section
      "Image to Excel Conversion": "Bild-zu-Excel-Konvertierung",
    "AI-Powered Image to Excel": "KI-gestützte Bild-zu-Excel-Funktion",
    "Convert images containing tables into fully editable Excel sheets with precision. Preserve formatting and structure effortlessly.": "Konvertieren Sie Bilder mit Tabellen präzise in vollständig bearbeitbare Excel-Tabellen. Formatierung und Struktur bleiben mühelos erhalten.",
    "Extract Tables from PDFs": "Tabellen aus PDFs extrahieren",
    "Extract Tables from Scanned PDFs": "Tabellen aus gescannten PDFs extrahieren",
    "Transform scanned PDF files into accurate Excel spreadsheets, ensuring data integrity and precise table extraction.": "Gescannten PDF-Dateien in präzise Excel-Tabellen umwandeln, dabei die Datenintegrität und genaue Tabellenerkennung sicherstellen.",
    "Secure Data Processing": "Sichere Datenverarbeitung",
    "Privacy & Data Security": "Datenschutz & Datensicherheit",
    "All uploaded files are encrypted and automatically deleted after processing. Registered users get additional security features.": "Alle hochgeladenen Dateien werden verschlüsselt und nach der Verarbeitung automatisch gelöscht. Registrierte Nutzer erhalten zusätzliche Sicherheitsfunktionen.",
    "Cross-Platform Compatibility": "Plattformübergreifende Kompatibilität",
    "Works on Any Device": "Funktioniert auf jedem Gerät",
    "Access our Excel conversion tool from Windows, Mac, Linux, Android, or iOS without software installation—100% online.": "Zugriff auf unser Excel-Konvertierungstool von Windows, Mac, Linux, Android oder iOS ohne Softwareinstallation — 100 % online.",
    "AI-Driven Excel Conversion": "KI-gesteuerte Excel-Konvertierung",
    "AI-Powered Accuracy": "KI-gestützte Genauigkeit",
    "Utilizing AI-driven OCR technology, our tool ensures up to 99% accuracy in extracting structured data into Excel format.": "Mit KI-basierter OCR-Technologie garantiert unser Tool eine Genauigkeit von bis zu 99 % beim Extrahieren strukturierter Daten in Excel-Format.",
    "Free Excel Conversion": "Kostenlose Excel-Konvertierung",
    "100% Free for Limited Use": "100 % kostenlos für begrenzte Nutzung",
    "Process up to 5 files per hour for free. Upgrade to unlock unlimited conversions and premium features.": "Verarbeiten Sie bis zu 5 Dateien pro Stunde kostenlos. Mit einem Upgrade erhalten Sie unbegrenzte Konvertierungen und Premium-Funktionen.",
    "📊 Convert Image to Excel - Extract Text & Download as XLSX": "📊 Bild in Excel umwandeln - Text extrahieren & als XLSX herunterladen",
      "Convert images into fully editable Excel spreadsheets with 99% accuracy using our AI-powered OCR tool. Extract tables, numbers, and structured data in just a few clicks.": "Konvertieren Sie Bilder mit unserem KI-gestützten OCR-Tool mit 99 % Genauigkeit in vollständig bearbeitbare Excel-Tabellen. Extrahieren Sie Tabellen, Zahlen und strukturierte Daten mit nur wenigen Klicks.",
    "☀️ Light Mode": "☀️ Heller Modus"
  }
};
document.addEventListener("DOMContentLoaded", function () {
  const savedLanguage = localStorage.getItem("selectedLanguage") || "en"; // Default to English
document.getElementById("ui-language-select").value = savedLanguage; // Update dropdown
  translatePage(savedLanguage); // Apply stored language
});

// Function to normalize text for better translation matching
function normalizeText(text) {
  return text.replace(/\s+/g, " ").trim(); // Remove extra spaces & trim
}

// Function to translate content
function translatePage(language) {
  document.querySelectorAll("h1, h2, h3, p, button, span:not(.fimg), label span, .section-title").forEach((element) => {
    if (!element.dataset.original) {
      element.dataset.original = normalizeText(element.innerText);
    }

    const originalText = element.dataset.original;

    if (translations[language] && translations[language][originalText]) {
      element.textContent = translations[language][originalText];
    }
  });



  // ✅ Fix for `.fimg h2` to avoid breaking images
  document.querySelectorAll(".fimg h2").forEach((element) => {
    if (!element.dataset.original) {
      element.dataset.original = normalizeText(element.textContent);
    }

    const originalText = element.dataset.original;

    if (translations[language] && translations[language][originalText]) {
      element.textContent = translations[language][originalText];
    }
  });

  // ✅ Fix for section titles
  document.querySelectorAll(".image-text-converter h2, section h2").forEach((element) => {
    if (!element.dataset.original) {
      element.dataset.original = normalizeText(element.textContent);
    }

    const originalText = element.dataset.original;

    if (translations[language] && translations[language][originalText]) {
      element.textContent = translations[language][originalText];
    }
  });

  // ✅ Fix for `.steps-container` (Ensures All Step Text is Translated)
  document.querySelectorAll(".steps-container h2, .steps-container p, .steps-container span, .steps-container li").forEach((element) => {
    if (!element.dataset.original) {
      element.dataset.original = normalizeText(element.innerText);
    }

    const originalText = element.dataset.original;

    if (translations[language] && translations[language][originalText]) {
      element.innerText = translations[language][originalText];
    }
  });

  // ✅ Fix for `<p>` tags with `<strong>` elements (Keeps `<strong>` formatting)
  document.querySelectorAll(".steps-container p").forEach((element) => {
    if (!element.dataset.original) {
      element.dataset.original = normalizeText(element.innerHTML); // Preserve `<strong>` tags
    }

    const originalText = element.dataset.original;

    if (translations[language] && translations[language][originalText]) {
      element.innerHTML = translations[language][originalText];
    }
  });

  // ✅ Fix for `<li>` elements inside `section` (Avoids Navbar interference)
  document.querySelectorAll("section ul li").forEach((element) => {
    if (!element.dataset.original) {
      element.dataset.original = normalizeText(element.textContent);
    }

    const originalText = element.dataset.original;

    if (translations[language] && translations[language][originalText]) {
      element.textContent = translations[language][originalText];
    }
  });
  // ✅ Fix for Footer Quick Links & Legal Links
document.querySelectorAll(".footer-section ul li a").forEach((element) => {
  if (!element.dataset.original) {
    element.dataset.original = normalizeText(element.innerText);
  }

  const originalText = element.dataset.original;

  if (translations[language] && translations[language][originalText]) {
    element.innerText = translations[language][originalText];
  }
});
// ✅ Fix for Footer Copyright Text
document.querySelectorAll("footer p").forEach((element) => {
  if (!element.dataset.original) {
    element.dataset.original = normalizeText(element.innerText);
  }

  const originalText = element.dataset.original;

  if (translations[language] && translations[language][originalText]) {
    element.innerText = translations[language][originalText];
  }
});


  // ✅ Fix for Navbar `<a>` elements (Avoids breaking links)
  document.querySelectorAll("nav ul li a").forEach((element) => {
    if (!element.dataset.original) {
      element.dataset.original = normalizeText(element.innerText);
    }

    const originalText = element.dataset.original;

    if (translations[language] && translations[language][originalText]) {
      element.innerText = translations[language][originalText];
    }
  });

  // ✅ Fix for FAQ Section
  document.querySelectorAll(".faq-question").forEach((question) => {
    if (!question.dataset.original) {
      question.dataset.original = normalizeText(question.childNodes[0].textContent);
    }

    const originalText = question.dataset.original;

    if (translations[language] && translations[language][originalText]) {
      question.childNodes[0].textContent = translations[language][originalText] + " ";
    }
  });

  document.querySelectorAll(".faq-answer").forEach((answer) => {
    if (!answer.dataset.original) {
      answer.dataset.original = normalizeText(answer.textContent);
    }

    const originalText = answer.dataset.original;

    if (translations[language] && translations[language][originalText]) {
      answer.textContent = translations[language][originalText];
    }
  });
}

document.getElementById("ui-language-select").addEventListener("change", function () {
  const selectedLanguage = this.value;
  
  // Save selected language in localStorage
  localStorage.setItem("selectedLanguage", selectedLanguage);

  // Apply translation
  translatePage(selectedLanguage);
});



// Extract Text Using Flask API (OCR Processing)
async function extractText() {
const fileInput = document.getElementById("file-input");
const file = fileInput?.files[0];
const language = document.getElementById("selected-option")?.getAttribute("data-value");

if (!file) {
    alert("⚠️ Please upload a file.");
    return;
}

let formData = new FormData();
formData.append("file", file);
formData.append("language", language);

document.getElementById("processing-section").style.display = "block";

try {
    const response = await fetch("https://San786s-Flask-Genius.hf.space/extract-text", {
        method: "POST",
        body: formData
    });

    const data = await response.json();

    if (data.text) {
        document.getElementById("output-text").value = data.text;
        console.log("✅ Extracted Text:", data.text);
    } else {
        throw new Error("No text detected.");
    }
} catch (error) {
    console.error("❌ OCR Extraction Failed:", error);
    alert("❌ Error extracting text: " + error.message);
} finally {
    document.getElementById("processing-section").style.display = "none";
}
}



async function downloadFile(format) {
    // ✅ Define button elements FIRST
    const button = document.getElementById(`download-${format}-btn`);
    const icon = button?.querySelector("i");
    const text = button?.querySelector("span");

    try {
        // ✅ Show spinner/loading
        if (button && icon && text) {
            button.disabled = true;
            text.innerText = "Processing...";
            icon.classList.replace("fa-download", "fa-spinner");
            icon.classList.add("fa-spin");
        }

        const extractedText = document.getElementById("output-text").value;
        const fileInput = document.getElementById("file-input");
        const file = fileInput?.files[0];

        if (format === "txt") {
            if (!extractedText) throw new Error("No text available for download");
            const blob = new Blob([extractedText], { type: "text/plain" });
            downloadBlob(blob, "extracted_text.txt");
            return;
        }

        if (!file) throw new Error("Please upload a file before downloading");

        const endpoint = {
            "docx": "https://San786s-Flask-Genius.hf.space/ocr-to-word",
            "xlsx": "https://San786s-Flask-Genius.hf.space/ocr-to-excel",
            "pdf-images": "https://San786s-Flask-Genius.hf.space/pdf-to-images"
        }[format];

        if (!endpoint) throw new Error("Invalid format selected");

        const formData = new FormData();
        formData.append("file", file);
        formData.append("language", document.getElementById("selected-option")?.getAttribute("data-value"));

        if (extractedText) {
            formData.append("extracted_text", extractedText);
        }

        const response = await fetch(endpoint, {
            method: "POST",
            body: formData
        });

        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
            } catch (e) {
                throw new Error(`Server error: ${response.status} ${response.statusText}`);
            }
            throw new Error(errorData?.error || "Server processing failed");
        }

        if (format === "docx") {
            const blob = await response.blob();
            if (blob.size === 0) throw new Error("Empty document generated");
            const filename = `${file.name.split('.')[0]}_extracted.docx`;
            downloadBlob(blob, filename);
            return;
        }

        const contentType = response.headers.get("content-type");
        if (contentType.includes("application/json")) {
            const data = await response.json();
            if (data.download_url) {
                window.location.href = data.download_url;
            } else {
                throw new Error("No download URL provided");
            }
        } else {
            const blob = await response.blob();
            const filename = `${file.name.split('.')[0]}.${format}`;
            downloadBlob(blob, filename);
        }

    } catch (error) {
        console.error("Download failed:", error);
        alert(`Error: ${error.message}`);
    } finally {
        // ✅ Reset button to normal
        if (button && icon && text) {
            button.disabled = false;
            text.innerText = `Download ${format.toUpperCase()}`;
            icon.classList.replace("fa-spinner", "fa-download");
            icon.classList.remove("fa-spin");
        }
    }
}



// Helper function to download blobs
function downloadBlob(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    }, 100);
}


// Convert PDF to Image via Flask API
async function convertPdfToImage() {
    const fileInput = document.getElementById("pdf-file-input");
    const file = fileInput?.files[0];
    const previewContainer = document.getElementById("pdf-images");

    if (!file) {
        alert("⚠️ Please upload a PDF file.");
        return;
    }

    if (!file.name.endsWith(".pdf")) {
        alert("⚠️ Only PDF files are supported for this conversion.");
        return;
    }

    const formData = new FormData();
    formData.append("file", file);

    document.getElementById("pdf-processing-section").style.display = "block";
    previewContainer.innerHTML = "";

    try {
        const response = await fetch("https://San786s-Flask-Genius.hf.space/pdf-to-images", {
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: "Conversion failed" }));
            throw new Error(error.error || "PDF conversion failed");
        }

        const data = await response.json();

        // Display preview images
        if (data.preview_urls?.length > 0) {
            data.preview_urls.forEach((url, index) => {
                const img = document.createElement("img");
                // Ensure URL is absolute
                const absoluteUrl = url.startsWith('http') ? url : `https://San786s-Flask-Genius.hf.space${url}`;
                img.src = absoluteUrl;
                img.alt = `Page ${index + 1}`;
                img.style = "max-width: 100%; margin: 10px 0; border: 1px solid #ddd;";
                previewContainer.appendChild(img);
            });

            // Update download button
            const downloadBtn = document.getElementById("pdf-download-btn");
            if (data.download_url) {
                // Ensure download URL is absolute
                const absoluteDownloadUrl = data.download_url.startsWith('http') 
                    ? data.download_url 
                    : `https://San786s-Flask-Genius.hf.space${data.download_url}`;
                
                downloadBtn.onclick = () => {
                    window.location.href = absoluteDownloadUrl;
                };
                downloadBtn.style.display = "inline-block";
            }
        } else {
            throw new Error("No images generated for preview");
        }
    } catch (error) {
        console.error("❌ PDF to Image Conversion Failed:", error);
        alert(`❌ Error converting PDF: ${error.message}`);
    } finally {
        document.getElementById("pdf-processing-section").style.display = "none";
    }
}

// Remove the displayImages() and downloadImages() functions as they're no longer needed



// Function to Display Converted Images
// function displayImages(imageUrls) {
//   const pdfImagesContainer = document.getElementById("pdf-images");
//   pdfImagesContainer.innerHTML = ""; // Clear previous images

//   imageUrls.forEach((imageUrl, index) => {
//     const img = document.createElement("img");
//     img.src = imageUrl;
//     img.style = "max-width:100%; margin-top:10px;";
//     img.setAttribute("data-index", index);
//     pdfImagesContainer.appendChild(img);
//   });
// }

// Download Converted Images as ZIP
// async function downloadImages() {
//   const images = document.querySelectorAll("#pdf-images img");

//   if (images.length === 0) {
//     alert("⚠️ No images to download.");
//     return;
//   }

//   const zip = new JSZip();
//   const zipFilename = "converted-images.zip";

//   for (let i = 0; i < images.length; i++) {
//     try {
//       const response = await fetch(images[i].src, { mode: "cors" });
//       if (!response.ok) {
//         console.error(`Failed to fetch image ${i + 1}`);
//         continue;
//       }

//       const blob = await response.blob();
//       zip.file(`page-${i + 1}.png`, blob);
//     } catch (error) {
//       console.error(`Error fetching image ${i + 1}:`, error);
//     }
//   }

//   zip.generateAsync({ type: "blob" }).then((content) => {
//     const link = document.createElement("a");
//     link.href = URL.createObjectURL(content);
//     link.download = zipFilename;
//     document.body.appendChild(link);
//     link.click();
//     setTimeout(() => URL.revokeObjectURL(link.href), 1000); // Delay revoking URL
//     document.body.removeChild(link);
//   });
// }


document.getElementById("uploadForm").addEventListener("submit", function(event) {
  event.preventDefault();
  let formData = new FormData(this);
  let selectedLang = document.getElementById("languageSelect").value; // Get selected language
  formData.append("language", selectedLang);

  fetch("https://San786s-Flask-Genius.hf.space/ocr-to-word", {
      method: "POST",
      body: formData
  }).then(response => response.json())
    .then(data => {
        if (data.download_url) {
            window.location.href = data.download_url;
        } else {
            alert("Error: " + data.error);
        }
    });
});


async function uploadImage() {
    let fileInput = document.getElementById("file-input");  // ✅ Fixed ID

    if (!fileInput.files.length) {
        console.error("❌ No file selected!");
        alert("Please select a file to upload.");
        return;
    }

    let file = fileInput.files[0];
    console.log("📂 Uploading file:", file.name);

    let formData = new FormData();
    formData.append("file", file);
    formData.append("lang", "en");

    try {
        let response = await fetch("https://San786s-Flask-Genius.hf.space/ocr-to-word", {
            method: "POST",
            body: formData,
        });

        let data = await response.json();
        if (!response.ok) {
            console.error("❌ Error:", data.error);
            alert("Error: " + data.error);
            return;
        }

        console.log("✅ OCR successful! Download link:", data.download_url);
        alert("OCR successful! Download the Word file.");
    } catch (error) {
        console.error("❌ Fetch Error:", error);
        alert("Failed to communicate with server.");
    }
}



  // Attach Event Listeners
document.getElementById("pdf-file-input").addEventListener("change", function () {
  console.log("File input changed!"); // Debugging: Check if event is triggered
  
  const fileInput = this; // Reference to the file input element
  const fileNameDisplay = document.getElementById("pdf-file-name");

  if (fileInput.files.length > 0) {
    fileNameDisplay.textContent = fileInput.files[0].name;
    console.log("Selected file:", fileInput.files[0].name);
  } else {
    fileNameDisplay.textContent = "No file chosen";
  }
});

document.getElementById("pdf-process-btn").addEventListener("click", convertPdfToImage);
document.getElementById("pdf-download-btn").addEventListener("click", downloadImages);

// Attach Event Listeners for Buttons
document.getElementById("download-btn")?.addEventListener("click", () => downloadFile("txt"));
document.getElementById("download-word")?.addEventListener("click", () => downloadFile("docx"));
document.getElementById("download-excel")?.addEventListener("click", () => downloadFile("xlsx"));



