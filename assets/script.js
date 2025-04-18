// --- Global Variables & Initial Setup ---
let uploadedFile = null;
let translationMemory = JSON.parse(localStorage.getItem('translationMemory') || '{}');
let firstChunkTime = 0;
let failedChunksData = []; // <-- NEW: Store { index, chunkData, reason } for failed chunks
let currentAllTranslatedEntries = []; // <-- NEW: Store the current state of translated entries
let currentOriginalFileName = 'translation'; // <-- NEW: Store filename base
let currentLang = 'English'; // <-- NEW: Store target language
let currentApiKey = ''; // <-- NEW: Store API key
let currentBaseDelay = 1000; // <-- NEW: Store settings
let currentQuotaDelay = 60000;
let currentModel = 'gemini-1.5-flash-latest';
let currentPromptTemplate = '';
let currentTemperature = 0.7;
let currentTopP = 0.95;
let currentTopK = 40;
let currentMaxOutputTokens = 8192;
let currentStopSequencesStr = '';

// Set the specific proxy URL
const proxyUrl = 'https://middleman.yebekhe.workers.dev';

// --- DOM Element References ---
const htmlElement = document.documentElement;
const themeToggle = document.getElementById('themeToggle');
const languageToggle = document.getElementById('languageToggle');
const clearMemoryButton = document.getElementById('clear-memory-button');
const translateForm = document.getElementById('translate-form');
const dropzoneElement = document.getElementById("dropzone-upload");
const srtTextInput = document.getElementById('srt_text');
const apiKeyInput = document.getElementById('api_key');
const rememberMeCheckbox = document.getElementById('remember_me');
const useProxyCheckbox = document.getElementById('useProxyCheckbox');
const togglePasswordBtn = document.getElementById('togglePasswordBtn');
const langInput = document.getElementById('lang-input');
const baseDelayInput = document.getElementById('base_delay');
const quotaDelayInput = document.getElementById('quota_delay');
const chunkCountInput = document.getElementById('chunk_count');
const modelSelect = document.getElementById('model');
const temperatureInput = document.getElementById('temperature');
const topPInput = document.getElementById('top_p');
const topKInput = document.getElementById('top_k');
const maxOutputTokensInput = document.getElementById('max_output_tokens');
const stopSequencesInput = document.getElementById('stop_sequences');
const translationPromptTextarea = document.getElementById('translation_prompt');
const progressContainer = document.getElementById('progress-container');
const progressBar = document.getElementById('progress');
const progressText = document.getElementById('progress-text');
const chunkStatusSpan = document.getElementById('chunk-status');
const timeEstimateSpan = document.getElementById('time-estimate');
const downloadLinkContainer = document.getElementById('download-link');
const errorMessageDiv = document.getElementById('error-message');
const submitButton = document.getElementById('submit-button');
const submitButtonText = submitButton.querySelector('.button-text');
const fileInputSection = document.getElementById('file-input');
const textInputSection = document.getElementById('text-input');
const inputMethodRadios = document.querySelectorAll('input[name="input_method"]');
const apiKeyNote = document.getElementById('api-key-note');
const pageTitle = document.getElementById('page-title');
const uploadInstructions = document.getElementById('upload-instructions');
const warningMessage = document.getElementById('warning-message');
const inputMethodLabel = document.getElementById('input-method-label');
const fileLabel = document.getElementById('file-label');
const textLabel = document.getElementById('text-label');
const apiKeyLabel = document.getElementById('api-key-label');
const rememberMeLabel = document.getElementById('remember-me-label');
const langLabel = document.getElementById('lang-label');
const advancedSettingsSummaryText = document.getElementById('advanced-settings-summary-text'); // Target text span
const useProxyLabel = document.getElementById('use-proxy-label');
const modelLabel = document.getElementById('model-label');
const baseDelayLabel = document.getElementById('base-delay-label');
const quotaDelayLabel = document.getElementById('quota-delay-label');
const chunkCountLabel = document.getElementById('chunk-count-label');
const translationPromptLabel = document.getElementById('translation-prompt-label');

// PDF.js Worker setup - REMOVED FROM HERE
// pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// Function to extract text from PDF file
async function extractPdfText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const typedArray = new Uint8Array(event.target.result);
                const loadingTask = pdfjsLib.getDocument({ data: typedArray });
                const pdf = await loadingTask.promise;
                console.log('PDF loaded');

                let fullText = '';
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    const pageText = textContent.items.map(item => item.str).join(' '); // Join items with space
                    fullText += pageText + '\n\n'; // Add double newline between pages
                }
                console.log(`Extracted text length: ${fullText.length}`);
                resolve(fullText.trim());
            } catch (error) {
                console.error('Error reading PDF:', error);
                reject('Error reading PDF file. Ensure it is a valid, text-based PDF.');
            }
        };
        reader.onerror = (error) => {
            console.error('File Reader Error:', error);
            reject('Error reading the uploaded file.');
        };
        reader.readAsArrayBuffer(file);
    });
}

// --- Dropzone Configuration ---
Dropzone.autoDiscover = false;
if (dropzoneElement) {
    try { // Add try-catch for safety
        const myDropzone = new Dropzone(dropzoneElement, {
            url: "#", // Dummy URL
            autoProcessQueue: false,
            acceptedFiles: ".pdf", // Changed to PDF
            maxFiles: 1,
            addRemoveLinks: true,
            dictDefaultMessage: dropzoneElement.querySelector('.dz-message') ? dropzoneElement.querySelector('.dz-message').innerHTML : "<p>Drop files here or click to upload.</p>",
            dictRemoveFile: "Remove",
            dictMaxFilesExceeded: "You can only upload one file.",
            dictInvalidFileType: "You can only upload .pdf files.", // Changed to PDF
            init: function() {
                this.on("addedfile", function(file) {
                    if (this.files.length > 1) {
                        this.removeFile(this.files[0]);
                    }
                    uploadedFile = file;
                    hideError();
                    console.log("File added:", file.name);
                });
                this.on("removedfile", function(file) {
                    uploadedFile = null;
                    console.log("File removed:", file.name);
                });
                this.on("error", function(file, errorMsg) {
                    console.error("Dropzone error:", errorMsg);
                    let userMessage = "Error adding file.";
                    if (typeof errorMsg === 'string') {
                        if (errorMsg.includes("You can only upload")) userMessage = errorMsg;
                        else if (errorMsg.includes("File is too big")) userMessage = "File is too large.";
                        else userMessage = "Invalid file. Please ensure it's a valid .pdf file."; // Changed to PDF
                    }
                    showError(userMessage);
                    if (file.previewElement) {
                        const removeLink = file.previewElement.querySelector("[data-dz-remove]");
                        if (removeLink) { removeLink.click(); }
                        else { file.previewElement.remove(); }
                    }
                    uploadedFile = null;
                });
            }
        });
    } catch (e) {
        console.error("Failed to initialize Dropzone:", e);
        if (dropzoneElement) {
            dropzoneElement.textContent = "Error initializing file drop zone.";
            dropzoneElement.style.border = "2px dashed var(--error-color)";
        }
    }
} else {
    console.warn("Dropzone element '#dropzone-upload' not found.");
}

// --- Theme Management ---
function updateTheme(setLight) { // Parameter indicates the desired state
    const themeIcon = themeToggle?.querySelector('i');
    if (!themeIcon) return; // Safety check

    htmlElement.classList.toggle('dark-mode', !setLight); // Add dark-mode if setLight is false

    if (setLight) {
        themeIcon.classList.remove('fa-moon');
        themeIcon.classList.add('fa-sun');
    } else {
        themeIcon.classList.remove('fa-sun');
        themeIcon.classList.add('fa-moon');
    }
    localStorage.setItem('theme', setLight ? 'light' : 'dark');
    console.log(`Theme set to ${setLight ? 'light' : 'dark'}`);
}

// --- Language Management ---
function updateLanguage(lang) {
    const isRTL = lang === 'Persian';
    htmlElement.classList.toggle('rtl-text', isRTL);

    // Footer Elements
    const footerPersian = document.querySelector('.footer p:first-child');
    const footerEnglish = document.querySelector('.footer p:nth-child(2)');

    try {
        if (isRTL) {
            htmlElement.lang = 'fa';
            // Show Persian footer, hide English
            if (footerPersian) footerPersian.style.display = 'block';
            if (footerEnglish) footerEnglish.style.display = 'none';

            if (pageTitle) pageTitle.textContent = 'مترجم PDF'; // Changed
            if (uploadInstructions) uploadInstructions.textContent = 'فایل PDF را بارگذاری یا متن را الصاق کنید، کلید API Gemini و زبان مقصد را ارائه دهید.'; // Changed
            if (warningMessage) warningMessage.textContent = '⚠️ اگر در ایران هستید، برای دسترسی به API Gemini به دلیل تحریم، «استفاده از پروکسی» را در تنظیمات پیشرفته فعال کنید.';
            const advancedWarning = document.querySelector('.advanced-warning-message'); // Target advanced warning specifically
            if (advancedWarning) advancedWarning.textContent = '⚠️ تنظیم این پارامترها می‌تواند بر عملکرد، هزینه و کیفیت ترجمه تأثیر بگذارد. با احتیاط عمل کنید.';
            if (inputMethodLabel) inputMethodLabel.textContent = 'روش ورودی:';
            const fileRadioLabel = document.querySelector('label.radio-label:has(input[value="file"])');
            if (fileRadioLabel) fileRadioLabel.lastChild.textContent = ' بارگذاری فایل';
            const textRadioLabel = document.querySelector('label.radio-label:has(input[value="text"])');
            if (textRadioLabel) textRadioLabel.lastChild.textContent = ' الصاق متن';
            if (fileLabel) fileLabel.textContent = 'بارگذاری فایل PDF:'; // Changed
            if (textLabel) textLabel.textContent = 'الصاق محتوای متن:'; // Changed
            if (apiKeyLabel) apiKeyLabel.textContent = 'کلید API Gemini:';
            if (apiKeyInput) apiKeyInput.placeholder = 'کلید API خود را وارد کنید';
            if (rememberMeLabel) rememberMeLabel.textContent = 'ذخیره کلید API';
            if (langLabel) langLabel.textContent = 'زبان مقصد:';
            if (langInput) langInput.placeholder = 'مثال: انگلیسی، فرانسوی';
            if (advancedSettingsSummaryText) advancedSettingsSummaryText.textContent = 'تنظیمات پیشرفته';
            if (useProxyLabel) useProxyLabel.textContent = 'استفاده از پروکسی';
            const rememberMeNote = rememberMeLabel?.closest('.checkbox-group')?.querySelector('.note');
            if (rememberMeNote) rememberMeNote.textContent = '(در حافظه محلی ذخیره می‌شود)';
             const useProxyNote = useProxyLabel?.closest('.checkbox-group')?.querySelector('.note');
            if (useProxyNote) useProxyNote.textContent = 'اگر دسترسی مستقیم به Gemini مسدود است فعال کنید.';
            if (modelLabel) modelLabel.textContent = 'مدل Gemini:';
            const modelNote = modelLabel?.closest('.form-group')?.querySelector('.note');
            if (modelNote) modelNote.textContent = 'مدل هوش مصنوعی برای ترجمه را انتخاب کنید.';
            if (baseDelayLabel) baseDelayLabel.textContent = 'تأخیر پایه (ms):';
            const baseDelayNote = baseDelayLabel?.closest('.form-group')?.querySelector('.note');
            if(baseDelayNote) baseDelayNote.textContent = 'تأخیر بین درخواست‌های موفق هر بخش.';
            if (quotaDelayLabel) quotaDelayLabel.textContent = 'تأخیر سهمیه (ms):';
            const quotaDelayNote = quotaDelayLabel?.closest('.form-group')?.querySelector('.note');
            if(quotaDelayNote) quotaDelayNote.textContent = 'تأخیر پس از رسیدن به محدودیت (خطای 429).';
            if (chunkCountLabel) chunkCountLabel.textContent = 'تعداد بخش‌ها:';
            const chunkCountNote = chunkCountLabel?.closest('.form-group')?.querySelector('.note');
            if(chunkCountNote) chunkCountNote.textContent = 'تقسیم متن به این تعداد بخش (1-100).'; // Changed
            const tempLabel = document.getElementById('temperature-label'); if (tempLabel) tempLabel.textContent = 'دما:';
            const tempNote = tempLabel?.closest('.form-group')?.querySelector('.note'); if(tempNote) tempNote.textContent = 'کنترل تصادفی بودن (0.0-2.0). مقادیر بالاتر = خلاقیت/تصادفی بیشتر.';
            const topPLabel = document.getElementById('top-p-label'); if (topPLabel) topPLabel.textContent = 'Top-P:';
            const topPNote = topPLabel?.closest('.form-group')?.querySelector('.note'); if(topPNote) topPNote.textContent = 'نمونه‌برداری هسته‌ای (0.0-1.0).';
            const topKLabel = document.getElementById('top-k-label'); if (topKLabel) topKLabel.textContent = 'Top-K:';
            const topKNote = topKLabel?.closest('.form-group')?.querySelector('.note'); if(topKNote) topKNote.textContent = 'نمونه‌برداری از K توکن محتمل‌تر (عدد صحیح >= 1).';
            const maxTokensLabel = document.getElementById('max-output-tokens-label'); if (maxTokensLabel) maxTokensLabel.textContent = 'حداکثر توکن خروجی:';
            const maxTokensNote = maxTokensLabel?.closest('.form-group')?.querySelector('.note'); if(maxTokensNote) maxTokensNote.textContent = 'حداکثر تعداد توکن برای تولید در هر درخواست.';
            const stopSeqLabel = document.getElementById('stop-sequences-label'); if (stopSeqLabel) stopSeqLabel.textContent = 'دنباله‌های توقف (جدا شده با کاما):';
            const stopSeqNote = stopSeqLabel?.closest('.form-group')?.querySelector('.note'); if(stopSeqNote) stopSeqNote.textContent = 'اگر این رشته‌ها ظاهر شوند، تولید متوقف شود. خالی بگذارید اگر نیازی نیست.';
            if (translationPromptLabel) translationPromptLabel.textContent = 'دستورالعمل سیستم / پرامپت:';
             const promptNote = translationPromptLabel?.closest('.form-group')?.querySelector('.note');
            if(promptNote) promptNote.textContent = 'دستورالعمل‌های داده شده به مدل هوش مصنوعی.';
            if (submitButtonText) submitButtonText.textContent = 'ترجمه';
            const submitHint = submitButton?.querySelector('.shortcut-hint');
            if (submitHint) submitHint.textContent = '(Ctrl+Enter)';
            if (apiKeyNote) apiKeyNote.innerHTML = "کلید API خود را از <a href='https://aistudio.google.com/app/apikey' target='_blank'>Google AI Studio</a> دریافت کنید.";

        } else { // English
            htmlElement.lang = 'en';
            // Hide Persian footer, show English
            if (footerPersian) footerPersian.style.display = 'none';
            if (footerEnglish) footerEnglish.style.display = 'block';

            if (pageTitle) pageTitle.textContent = 'PDF Translator'; // Changed
            if (uploadInstructions) uploadInstructions.textContent = 'Upload a PDF file or paste text, provide your Gemini API key, and select the target language.'; // Changed
            if (warningMessage) warningMessage.textContent = '⚠️ If in Iran, enable "Use Proxy" in Settings for Gemini API access due to sanctions.';
             const advancedWarning = document.querySelector('.advanced-warning-message');
            if (advancedWarning) advancedWarning.textContent = '⚠️ Adjusting these settings can affect performance, cost, and translation quality. Proceed with caution.';
            if (inputMethodLabel) inputMethodLabel.textContent = 'Input Method:';
            const fileRadioLabel = document.querySelector('label.radio-label:has(input[value="file"])');
            if (fileRadioLabel) fileRadioLabel.lastChild.textContent = ' Upload File';
            const textRadioLabel = document.querySelector('label.radio-label:has(input[value="text"])');
            if (textRadioLabel) textRadioLabel.lastChild.textContent = ' Paste Text';
            if (fileLabel) fileLabel.textContent = 'Upload PDF File:'; // Changed
            if (textLabel) textLabel.textContent = 'Paste Text Content:'; // Changed
            if (apiKeyLabel) apiKeyLabel.textContent = 'Gemini API Key:';
            if (apiKeyInput) apiKeyInput.placeholder = 'Enter your Gemini API key';
            if (rememberMeLabel) rememberMeLabel.textContent = 'Remember API key';
            if (langLabel) langLabel.textContent = 'Target Language:';
            if (langInput) langInput.placeholder = 'e.g., Spanish, French, Japanese';
            if (advancedSettingsSummaryText) advancedSettingsSummaryText.textContent = 'Advanced Settings';
            if (useProxyLabel) useProxyLabel.textContent = 'Use Proxy';
            const rememberMeNote = rememberMeLabel?.closest('.checkbox-group')?.querySelector('.note');
            if (rememberMeNote) rememberMeNote.textContent = '(uses Local Storage)';
             const useProxyNote = useProxyLabel?.closest('.checkbox-group')?.querySelector('.note');
            if (useProxyNote) useProxyNote.textContent = 'Enable if direct Gemini API access is blocked (e.g., sanctioned regions).';
            if (modelLabel) modelLabel.textContent = 'Gemini Model:';
            const modelNote = modelLabel?.closest('.form-group')?.querySelector('.note');
            if (modelNote) modelNote.textContent = 'Select the AI model for translation.';
            if (baseDelayLabel) baseDelayLabel.textContent = 'Base Delay (ms):';
             const baseDelayNote = baseDelayLabel?.closest('.form-group')?.querySelector('.note');
            if(baseDelayNote) baseDelayNote.textContent = 'Delay between successful chunk requests.';
            if (quotaDelayLabel) quotaDelayLabel.textContent = 'Quota Delay (ms):';
            const quotaDelayNote = quotaDelayLabel?.closest('.form-group')?.querySelector('.note');
            if(quotaDelayNote) quotaDelayNote.textContent = 'Delay after hitting a rate limit (429 error).';
            if (chunkCountLabel) chunkCountLabel.textContent = 'Number of Chunks:';
            const chunkCountNote = chunkCountLabel?.closest('.form-group')?.querySelector('.note');
            if(chunkCountNote) chunkCountNote.textContent = 'Split text into this many parts (1-100).'; // Changed
             const tempLabel = document.getElementById('temperature-label'); if (tempLabel) tempLabel.textContent = 'Temperature:';
             const tempNote = tempLabel?.closest('.form-group')?.querySelector('.note'); if(tempNote) tempNote.textContent = 'Controls randomness (0.0-2.0). Higher values = more creative/random.';
             const topPLabel = document.getElementById('top-p-label'); if (topPLabel) topPLabel.textContent = 'Top-P:';
             const topPNote = topPLabel?.closest('.form-group')?.querySelector('.note'); if(topPNote) topPNote.textContent = 'Nucleus sampling (0.0-1.0). Considers tokens comprising the top P probability mass.';
             const topKLabel = document.getElementById('top-k-label'); if (topKLabel) topKLabel.textContent = 'Top-K:';
             const topKNote = topKLabel?.closest('.form-group')?.querySelector('.note'); if(topKNote) topKNote.textContent = 'Sample from the K most likely tokens (integer >= 1).';
             const maxTokensLabel = document.getElementById('max-output-tokens-label'); if (maxTokensLabel) maxTokensLabel.textContent = 'Max Output Tokens:';
             const maxTokensNote = maxTokensLabel?.closest('.form-group')?.querySelector('.note'); if(maxTokensNote) maxTokensNote.textContent = 'Maximum number of tokens to generate per request (check model limits).';
             const stopSeqLabel = document.getElementById('stop-sequences-label'); if (stopSeqLabel) stopSeqLabel.textContent = 'Stop Sequences (comma-separated):';
             const stopSeqNote = stopSeqLabel?.closest('.form-group')?.querySelector('.note'); if(stopSeqNote) stopSeqNote.textContent = 'Stop generation if these strings appear. Leave blank if none.';
            if (translationPromptLabel) translationPromptLabel.textContent = 'System Prompt / Instructions:';
             const promptNote = translationPromptLabel?.closest('.form-group')?.querySelector('.note');
            if(promptNote) promptNote.textContent = 'Instructions given to the AI model.';
            if (submitButtonText) submitButtonText.textContent = 'Translate';
            const submitHint = submitButton?.querySelector('.shortcut-hint');
            if (submitHint) submitHint.textContent = '(Ctrl+Enter)';
            if (apiKeyNote) apiKeyNote.innerHTML = "Get your API key from <a href='https://aistudio.google.com/app/apikey' target='_blank'>Google AI Studio</a>.";
        }
        // Also update progress texts if they exist and are visible
        updateProgressTextsForLanguage(lang);

        localStorage.setItem('language', lang);
        console.log(`Language set to ${lang}, UI updated.`);
    } catch (e) {
        console.error("Error updating language UI:", e);
    }
}

// --- NEW Helper Function ---
function updateProgressTextsForLanguage(lang) {
    const isRTL = lang === 'Persian';
    const progressTextElem = document.getElementById('progress-text');
    const chunkStatusElem = document.getElementById('chunk-status');
    const timeEstimateElem = document.getElementById('time-estimate');

    // Update texts based on current progress values if elements exist
    // This assumes the numeric part (e.g., percentage, chunk numbers) is already correct
    if (progressTextElem) {
        const currentPercentage = progressTextElem.textContent.match(/\d+/)?.[0] || 0; // Extract number
        progressTextElem.textContent = isRTL ? `${currentPercentage}% تکمیل شده` : `${currentPercentage}% Complete`;
    }
    if (chunkStatusElem) {
        const match = chunkStatusElem.textContent.match(/(\d+)\/(\d+)/);
        const currentChunk = match?.[1] || 0;
        const totalChunks = match?.[2] || 0;
        chunkStatusElem.textContent = isRTL ? `پردازش بخش: ${currentChunk}/${totalChunks}` : `Processing chunk: ${currentChunk}/${totalChunks}`;
    }
    // Time estimate text is already handled within updateProgress based on language
}

// --- Utility Functions ---
function togglePasswordVisibility() {
    const icon = togglePasswordBtn?.querySelector('i');
    if (!icon || !apiKeyInput) return;
    if (apiKeyInput.type === 'password') {
        apiKeyInput.type = 'text';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        apiKeyInput.type = 'password';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
    }
}

function saveApiKey() {
    if (!rememberMeCheckbox || !apiKeyInput) return;
    if (rememberMeCheckbox.checked && apiKeyInput.value) {
        try {
            localStorage.setItem('savedApiKey', apiKeyInput.value);
            console.log('API key saved.');
        } catch (e) {
            console.error("Failed to save API key to localStorage:", e);
            showError("Could not save API key. LocalStorage might be full or disabled.");
        }
    } else {
        localStorage.removeItem('savedApiKey');
        console.log('API key not saved or removed.');
    }
}

function loadApiKey() {
    if (!apiKeyInput || !rememberMeCheckbox) return;
    try {
        const savedApiKey = localStorage.getItem('savedApiKey');
        if (savedApiKey) {
            apiKeyInput.value = savedApiKey;
            rememberMeCheckbox.checked = true;
            console.log('API key loaded.');
        }
    } catch (e) {
         console.error("Failed to load API key from localStorage:", e);
    }
}

function showError(message, isSuccess = false) {
    if (!errorMessageDiv) return;
    if (!message) {
        hideError();
        return;
    }
    errorMessageDiv.textContent = message;
    errorMessageDiv.classList.toggle('success', isSuccess);
    errorMessageDiv.classList.add('visible');
}

function hideError() {
    if (!errorMessageDiv) return;
     errorMessageDiv.classList.remove('visible', 'success');
     errorMessageDiv.textContent = '';
}

function resetUI() {
    if (submitButton) submitButton.disabled = false;
    if (submitButtonText) submitButtonText.textContent = localStorage.getItem('language') === 'Persian' ? 'ترجمه' : 'Translate';
    if (progressContainer) progressContainer.style.display = 'none';
    if (progressBar) progressBar.style.width = '0%';
    if (progressText) progressText.textContent = '0% Complete';
    if (chunkStatusSpan) chunkStatusSpan.textContent = 'Processing chunk: 0/0';
    if (timeEstimateSpan) timeEstimateSpan.textContent = 'Estimated time: calculating...';
    if (downloadLinkContainer) downloadLinkContainer.style.display = 'none';
    if (downloadLinkContainer) downloadLinkContainer.innerHTML = '';
    hideError();

    // --- NEW: Clear retry state ---
    failedChunksData = [];
    currentAllTranslatedEntries = [];
    const retryContainer = document.getElementById('retry-container');
    if (retryContainer) retryContainer.remove(); // Remove the whole container
    // --- END NEW ---
}

function updateProgress(chunkIndex, totalChunks, startTime) { // Pass startTime *only* on the very first call (chunkIndex 0)
    if (!progressContainer || !progressBar || !progressText || !chunkStatusSpan || !timeEstimateSpan) {
       console.warn("Progress elements not found, cannot update progress UI.");
       return;
    }
    // Ensure progress container is visible when updates start
    if (progressContainer.style.display === 'none') {
       progressContainer.style.display = 'block';
    }

   const lang = localStorage.getItem('language') || 'English';
   const isRTL = lang === 'Persian';

   const currentDisplayChunk = chunkIndex + 1; // User-facing index (1-based)
   const progressPercentage = totalChunks > 0 ? Math.round((currentDisplayChunk / totalChunks) * 100) : 0;

   progressBar.style.width = `${progressPercentage}%`;
   // Update text based on percentage and language
   progressText.textContent = isRTL ? `${progressPercentage}% تکمیل شده` : `${progressPercentage}% Complete`;

   // Update chunk status number part
   chunkStatusSpan.textContent = isRTL ? `پردازش بخش: ${currentDisplayChunk}/${totalChunks}` : `Processing chunk: ${currentDisplayChunk}/${totalChunks}`;

   // --- Time Estimation Logic ---
   // Initial calculation state (only on the very first call)
   if (chunkIndex === 0 && startTime && totalChunks > 1) {
        timeEstimateSpan.textContent = isRTL ? 'زمان تخمینی: در حال محاسبه...' : 'Estimated time: calculating...';
        // firstChunkTime will be calculated *after* this first chunk finishes
   }
   // Use calculated firstChunkTime for subsequent chunks
   else if (firstChunkTime > 0 && chunkIndex > 0 && totalChunks > 1) {
       const remainingChunks = totalChunks - currentDisplayChunk; // Use user-facing index here
       if (remainingChunks >= 0) {
           const estimatedRemainingTime = remainingChunks * firstChunkTime; // In seconds
           const minutes = Math.floor(estimatedRemainingTime / 60);
           const seconds = Math.floor(estimatedRemainingTime % 60);
           timeEstimateSpan.textContent = isRTL
               ? `زمان تخمینی: ~${minutes}د ${seconds}ث باقیمانده`
               : `Estimated time: ~${minutes}m ${seconds}s remaining`;
       } else { // Should ideally not happen if logic is correct, but fallback
            timeEstimateSpan.textContent = isRTL ? 'زمان تخمینی: در حال نهایی‌سازی...' : 'Estimated time: finalizing...';
       }
   }
   // Handle case with only one chunk or when firstChunkTime isn't ready yet
   else if (totalChunks <= 1 || chunkIndex === 0) {
        timeEstimateSpan.textContent = isRTL ? 'زمان تخمینی: در حال پردازش...' : 'Estimated time: processing...';
   }
   // --- End Time Estimation Logic ---
}

// --- Translation Memory --- (Keep functions as they were, seem ok)
function updateTranslationMemory(sourceText, translatedText, lang) {
    if (!sourceText || !translatedText || typeof sourceText !== 'string' || typeof translatedText !== 'string') return;
    const trimmedSource = sourceText.trim();
    const trimmedTranslated = translatedText.trim();
    if (!trimmedSource || !trimmedTranslated) return;

    if (!translationMemory[lang]) {
        translationMemory[lang] = {};
    }
    translationMemory[lang][trimmedSource] = trimmedTranslated;

    try {
         localStorage.setItem('translationMemory', JSON.stringify(translationMemory));
    } catch (e) {
        console.error("Error saving translation memory:", e);
        showError("Warning: Could not save to translation memory (storage might be full).");
    }
}

function findInTranslationMemory(text, lang) {
     if (!text || typeof text !== 'string') return undefined;
     return translationMemory[lang]?.[text.trim()];
}

function clearTranslationMemory() {
    const confirmationText = localStorage.getItem('language') === 'Persian'
        ? 'آیا مطمئن هستید که می‌خواهید تمام ترجمه‌های ذخیره شده در حافظه را پاک کنید؟'
        : 'Are you sure you want to clear all saved translations from memory?';
    if (confirm(confirmationText)) {
        translationMemory = {};
        localStorage.removeItem('translationMemory');
        console.log('Translation memory cleared.');
        alert(localStorage.getItem('language') === 'Persian' ? 'حافظه ترجمه پاک شد!' : 'Translation memory cleared!');
    }
}

// --- Text Chunking Utility (Generic) ---
function splitTextIntoChunks(text, chunkCount) {
    if (!text || chunkCount <= 0) return [];
    const textLength = text.length;
    const chunkSize = Math.ceil(textLength / chunkCount);
    const chunks = [];
    for (let i = 0; i < textLength; i += chunkSize) {
        chunks.push(text.substring(i, i + chunkSize));
    }
    return chunks;
}

// --- API Interaction (Simplified for plain text chunks) ---
async function translateChunk(
    chunkText, // Now accepts plain text string
    apiUrl, baseDelayMs, quotaDelayMs, lang,
    chunkIndex, // User-facing index (1-based)
    totalChunksForLog, // Total chunks for logging (can be 0/null during retry)
    generationConfig, systemInstruction // Pass config and prompt object
) {
    // Input validation
    if (!chunkText || !chunkText.trim()) {
        console.warn(`TranslateChunk called with empty chunk text (Index: ${chunkIndex})`);
        return ''; // Return empty string for empty chunk
    }
    if (!apiUrl || !lang) {
        throw new Error(`TranslateChunk called with missing required parameters (apiUrl, lang) for chunk ${chunkIndex}`);
    }

    // --- Update Progress / Log Start ---
    if (totalChunksForLog && totalChunksForLog > 0) {
         updateProgress(chunkIndex - 1, totalChunksForLog, chunkIndex === 1 ? performance.now() : null);
    }
    console.log(`Starting Chunk ${chunkIndex}${totalChunksForLog ? `/${totalChunksForLog}` : ''} (Text length: ${chunkText.length})`);
    // --- End Progress Update ---

    // Construct the prompt using the system instruction and the chunk text
    const contents = [];
    if (systemInstruction && systemInstruction.parts && systemInstruction.parts.length > 0) {
        contents.push(systemInstruction);
    }
    contents.push({ role: "user", parts: [{ text: chunkText }] });

    let finalPayload = {
         contents: contents,
         safetySettings: [
             { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" }, { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
             { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" }, { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
         ],
         generationConfig: generationConfig
     };

    const headers = { 'Content-Type': 'application/json' };
    const fetchOptions = { method: 'POST', headers: headers, body: JSON.stringify(finalPayload) };

    let attempts = 0;
    const maxAttempts = 4;

    while (attempts < maxAttempts) {
        try {
            if (attempts > 0) {
                 const retryDelay = Math.min(baseDelayMs * Math.pow(2, attempts -1), 15000);
                 console.log(`Chunk ${chunkIndex}: Retrying attempt ${attempts + 1} after ${retryDelay / 1000}s delay...`);
                 await new Promise(resolve => setTimeout(resolve, retryDelay));
            }

            const response = await fetch(apiUrl, fetchOptions);

            if (!response.ok) {
                let errorBodyText = ''; try { errorBodyText = await response.text(); } catch (e) {}
                console.error(`API Error (Chunk ${chunkIndex}, Attempt ${attempts + 1}): ${response.status} ${response.statusText}`, errorBodyText.substring(0, 300));
                if (response.status === 429) {
                    console.warn(`Chunk ${chunkIndex}: Quota exceeded (429). Waiting ${quotaDelayMs / 1000}s...`);
                    await new Promise(resolve => setTimeout(resolve, quotaDelayMs));
                    continue; // No attempt increment for quota
                } else if (response.status >= 500) {
                     console.warn(`Chunk ${chunkIndex}: Server error (${response.status}). Retrying...`); attempts++; continue;
                } else if (response.status === 400) {
                     if (errorBodyText.toLowerCase().includes("invalid argument")) {
                         throw new Error(`API Bad Request (400) - Invalid Argument. Check generation parameters. ${errorBodyText.substring(0,100)}`);
                     } else {
                         throw new Error(`API Bad Request (400). Check Key/Prompt/Model access. ${errorBodyText.substring(0,100)}`);
                     }
                } else { // Other client errors (401, 403, etc.)
                     attempts++; if (attempts >= maxAttempts) throw new Error(`API error ${response.status} after ${maxAttempts} attempts.`);
                     console.warn(`Chunk ${chunkIndex}: API error ${response.status}. Retrying...`); continue;
                }
            }

            // --- Process successful response ---
            const data = await response.json();
            const responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            const finishReason = data?.candidates?.[0]?.finishReason;

            if (finishReason === "MAX_TOKENS") {
                console.warn(`Chunk ${chunkIndex}: Finished due to MAX_TOKENS limit. Output might be truncated.`);
                if (totalChunksForLog && totalChunksForLog > 0) {
                     showError(`Warning: Chunk ${chunkIndex} output may be truncated due to token limit (${generationConfig.maxOutputTokens}).`, false);
                }
            }

            if (responseText === undefined || responseText === null) {
                 console.error(`Invalid API response structure (Chunk ${chunkIndex}): Finish Reason: ${finishReason}`, JSON.stringify(data).substring(0, 300));
                 if (finishReason && finishReason !== "STOP" && finishReason !== "MAX_TOKENS") {
                     // If safety blocked, try to get the category
                     const blockedReason = data?.promptFeedback?.blockReason;
                     const safetyRatings = data?.candidates?.[0]?.safetyRatings;
                     let safetyMessage = '';
                     if (blockedReason) safetyMessage = ` Blocked Reason: ${blockedReason}.`;
                     if (safetyRatings) safetyMessage += ` Ratings: ${JSON.stringify(safetyRatings)}`;
                      throw new Error(`API Error: No text returned. Finish reason: ${finishReason}.${safetyMessage}`);
                 }
                 // Allow empty response if finish reason is STOP or MAX_TOKENS
                 console.warn(`Chunk ${chunkIndex}: Received empty response text but finish reason was ${finishReason}. Returning empty string.`);
                 return ''; // Return empty string for valid empty responses
            }

            const translatedText = (responseText || "").trim(); // Return the translated text directly

            console.log(`Chunk ${chunkIndex} translated successfully.`);
            await new Promise(resolve => setTimeout(resolve, baseDelayMs)); // Base delay after success
            return translatedText;

        } catch (error) {
            console.error(`Error in translateChunk ${chunkIndex} (Attempt ${attempts + 1}):`, error);
            attempts++;
            if (attempts >= maxAttempts) throw new Error(`Failed chunk ${chunkIndex} after ${maxAttempts} attempts: ${error.message}`);
            // Loop will apply backoff delay before next attempt
        }
    }
     // Fallback throw if loop somehow exits without returning/throwing earlier
     throw new Error(`Failed chunk ${chunkIndex} unexpectedly.`);
}

// --- Main Translation Orchestration ---
async function handleFormSubmit(event) {
    event.preventDefault();
    resetUI();
    console.log('Translation process started.');

    // --- Get Settings ---
    currentApiKey = apiKeyInput.value.trim();
    const useProxy = useProxyCheckbox.checked;
    currentLang = langInput.value.trim();
    const inputMethod = document.querySelector('input[name="input_method"]:checked').value;
    currentBaseDelay = parseInt(baseDelayInput.value, 10) || 1000;
    currentQuotaDelay = parseInt(quotaDelayInput.value, 10) || 60000;
    const chunkCount = parseInt(chunkCountInput.value, 10) || 20;
    currentModel = modelSelect.value;
    currentPromptTemplate = translationPromptTextarea.value.trim();
    currentTemperature = parseFloat(temperatureInput.value) || 0.7;
    currentTopP = parseFloat(topPInput.value) || 0.95;
    currentTopK = parseInt(topKInput.value, 10) || 40;
    currentMaxOutputTokens = parseInt(maxOutputTokensInput.value, 10) || 8192;
    currentStopSequencesStr = stopSequencesInput.value.trim();

    if (!currentApiKey) return showError('API Key is required.');
    if (!currentLang) return showError('Target language is required.');
    saveApiKey(); // Save if remember me is checked

    // --- Get Content (PDF or Text) ---
    let sourceContent = '';
    currentOriginalFileName = 'translation'; // Reset filename base

    try {
        if (inputMethod === 'file') {
            if (!uploadedFile) return showError('Please select or drop a PDF file.');
            showProgress();
            progressText.textContent = 'Reading PDF file...'; // Update progress text
            sourceContent = await extractPdfText(uploadedFile);
            currentOriginalFileName = uploadedFile.name.replace(/\.pdf$/i, ''); // Use PDF filename
        } else { // inputMethod === 'text'
            const textContent = srtTextInput?.value.trim(); // Keep using srtTextInput id for now
            if (!textContent) return showError('Please paste text content.');
            sourceContent = textContent;
            console.log("Using pasted text content.");
            currentOriginalFileName = 'pasted_text';
        }

        if (!sourceContent.trim()) return showError('The content is empty.');

    } catch (error) {
        return showError(error.message || 'Failed to read the input content.');
    }

    console.log(`Source content length: ${sourceContent.length}`);

    // --- Chunking (Using Generic Text Split) ---
    const chunks = splitTextIntoChunks(sourceContent, chunkCount);
    if (chunks.length === 0) return showError('Failed to split the text into chunks.');
    console.log(`Split into ${chunks.length} chunks.`);

    // --- Prepare for Translation ---
    const totalChunks = chunks.length;
    currentAllTranslatedEntries = new Array(totalChunks).fill(null); // Initialize array with nulls
    failedChunksData = []; // Reset failed chunks
    firstChunkTime = 0; // Reset timer
    const translationStartTime = performance.now(); // Start overall timer
    showProgress();
    updateProgress(0, totalChunks, 0); // Initial progress update
    submitButton.disabled = true;
    submitButtonText.textContent = 'Translating...';

    // --- Start Translation Process ---
    const translationPromises = chunks.map((chunkData, index) => {
        return (async () => { // Use async IIFE to handle awaits
            const userFacingIndex = index + 1;
            try {
                // Check memory before API call
                const cachedTranslation = findInTranslationMemory(chunkData, currentLang);
                if (cachedTranslation !== undefined) { // Check for undefined, allow empty string from cache
                    console.log(`Chunk ${userFacingIndex}/${totalChunks}: Found in memory.`);
                     // Calculate progress based on index
                     const currentProgressTime = (index === 0 && totalChunks > 1) ? translationStartTime : null;
                     updateProgress(index, totalChunks, currentProgressTime);
                    return { index, translatedText: cachedTranslation, fromCache: true };
                }

                // Prepare API call settings
                let generationConfig = {};
                if (currentTemperature !== null) generationConfig.temperature = currentTemperature;
                if (currentTopP !== null) generationConfig.topP = currentTopP;
                if (currentTopK !== null) generationConfig.topK = currentTopK;
                if (currentMaxOutputTokens !== null) generationConfig.maxOutputTokens = currentMaxOutputTokens;
                if (currentStopSequencesStr) {
                    generationConfig.stopSequences = currentStopSequencesStr.split(',').map(s => s.trim()).filter(Boolean);
                }

                let systemInstruction = currentPromptTemplate ? { role: "system", parts: [{ text: currentPromptTemplate }] } : null;

                // Construct the API URL
                const apiUrl = useProxy
                    ? `${proxyUrl}/v1beta/models/${currentModel}:generateContent?key=${currentApiKey}`
                    : `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${currentApiKey}`;

                // Measure time for the first non-cached chunk accurately
                const isFirstChunk = index === 0;
                const chunkStartTime = performance.now();

                const translatedText = await translateChunk(
                    chunkData, apiUrl,
                    currentBaseDelay, currentQuotaDelay, currentLang,
                    userFacingIndex, // Pass user-facing index
                    totalChunks,
                    generationConfig, systemInstruction
                );

                // --- Timing Calculation --- Should happen *after* await
                const chunkEndTime = performance.now();
                const chunkDuration = (chunkEndTime - chunkStartTime) / 1000;
                if (isFirstChunk) {
                    firstChunkTime = chunkDuration;
                    console.log(`First chunk time set: ${firstChunkTime.toFixed(2)}s`);
                    // Update progress again to show the first estimate if needed
                    updateProgress(index, totalChunks, null);
                }
                 // --- End Timing Calculation ---

                return { index, translatedText, fromCache: false };

            } catch (error) {
                console.error(`Error processing chunk ${userFacingIndex}:`, error);
                failedChunksData.push({ index, chunkData: chunkData, reason: error.message || 'Unknown error' });
                // Don't update progress here for failed chunks, let the loop continue
                return { index, translatedText: null, error: true }; // Indicate error
            }
        })(); // Immediately invoke the async function
    });

    // --- Process Results ---
    try {
        const results = await Promise.all(translationPromises);

        // Populate results array and update memory
        results.forEach(result => {
            if (result && !result.error && result.translatedText !== null) {
                 // Store the successful translation at the correct index
                 currentAllTranslatedEntries[result.index] = { id: result.index, text: result.translatedText };
                // Update memory only if it wasn't from cache
                if (!result.fromCache) {
                    const originalChunk = chunks[result.index]; // Get original chunk data
                    updateTranslationMemory(originalChunk, result.translatedText, currentLang);
                }
            } else if (result && result.error) {
                // For failed chunks, store the original text to allow download/retry
                 currentAllTranslatedEntries[result.index] = { id: result.index, text: chunks[result.index] }; // Store original
            }
        });

        // Save memory to localStorage after all processing
        localStorage.setItem('translationMemory', JSON.stringify(translationMemory));

        const successfulTranslationsCount = results.filter(r => r && !r.error && r.translatedText !== null).length;
        console.log(`Translation finished. Successful: ${successfulTranslationsCount}, Failed: ${failedChunksData.length}`);

        // --- Handle Finish ---
        const endTime = performance.now();
        const duration = ((endTime - translationStartTime) / 1000).toFixed(1);
        const failedChunkIndices = failedChunksData.map(f => f.index + 1);

        if (failedChunkIndices.length > 0) {
            const interfaceLang = localStorage.getItem('language') || 'English';
            const isRTL = interfaceLang === 'Persian';

            const errorMsg = isRTL
                ? `ترجمه با ${failedChunkIndices.length} خطا در بخش(های): ${failedChunkIndices.join(', ')} به پایان رسید.`
                : `Translation finished with ${failedChunkIndices.length} errors on chunk(s): ${failedChunkIndices.join(', ')}.`;
            showError(errorMsg, false); // Show as error
            if (timeEstimateSpan) timeEstimateSpan.textContent = isRTL ? `پایان با ${failedChunkIndices.length} خطا` : `Finished with ${failedChunkIndices.length} errors`;
            progressBar.style.width = '100%'; // Set progress to 100% even with errors
            progressText.textContent = isRTL ? '100% تکمیل شده' : '100% Complete'; // Update text too
            displayRetryButtons(); // Show retry options
        } else {
            const interfaceLang = localStorage.getItem('language') || 'English';
            const isRTL = interfaceLang === 'Persian';
            const successMsg = isRTL ? `ترجمه موفقیت آمیز بود! (${duration} ثانیه)` : `Translation successful! (${duration}s)`;
            showError(successMsg, true); // Show as success
            if (timeEstimateSpan) timeEstimateSpan.textContent = isRTL ? "پایان موفقیت آمیز" : "Finished successfully";
            progressBar.style.width = '100%'; // Ensure progress bar is full
            progressText.textContent = isRTL ? '100% تکمیل شده' : '100% Complete';
        }

        // Always generate download link, even with errors, containing successful/original parts
        generateAndDisplayDownloadLink();

    } catch (error) {
        console.error('Major error during translation processing:', error);
        showError('An unexpected error occurred during translation.');
    } finally {
        submitButton.disabled = false;
        const interfaceLang = localStorage.getItem('language') || 'English';
        submitButtonText.textContent = interfaceLang === 'Persian' ? 'ترجمه' : 'Translate';
    }
}

// --- Generate Download Link (for .txt) ---
function generateAndDisplayDownloadLink() {
    if (currentAllTranslatedEntries.length === 0) {
        console.log("No translated entries to generate download link.");
        return;
    }

    // Join the translated text chunks, handling potential undefined/null entries
    const finalText = currentAllTranslatedEntries
        .map(entry => entry?.text || '') // Use empty string for missing entries
        .join('\n\n'); // Join chunks with double newline

    if (!finalText.trim()) {
        console.log("Generated text is empty, not creating download link.");
        return;
    }

    // Use UTF-8 BOM for better compatibility with text editors
    const blob = new Blob([`\uFEFF${finalText}`], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const downloadFileName = `${currentOriginalFileName}_${currentLang}.txt`; // Changed extension to .txt

    const interfaceLang = localStorage.getItem('language') || 'English';
    const mainText = interfaceLang === 'Persian' ? 'دانلود فایل متنی ترجمه شده' : 'Download Translated Text';

    downloadLinkContainer.innerHTML = `
        <a href="${url}" download="${downloadFileName}" class="button download-button">
            <i class="fas fa-download"></i> ${mainText}
        </a>
        ${failedChunksData.length > 0 ? `
        <span class="retry-info">(Retry failed chunks below)</span>
        ` : ''}
    `;
    downloadLinkContainer.style.display = 'block';
    console.log(`Download link generated for: ${downloadFileName}`);
}

// --- Retry Logic (Adapted for plain text) ---
function displayRetryButtons() {
    if (!failedChunksData || failedChunksData.length === 0) {
         const existingRetryContainer = document.getElementById('retry-container');
         if (existingRetryContainer) existingRetryContainer.remove();
        return;
    }

    let retryContainer = document.getElementById('retry-container');
    if (!retryContainer) {
        retryContainer = document.createElement('div');
        retryContainer.id = 'retry-container';
        retryContainer.classList.add('retry-container');
        // Ensure retry container appears consistently
        const targetElement = downloadLinkContainer || progressContainer || errorMessageDiv || submitButton.closest('.submit-container');
        targetElement?.insertAdjacentElement('afterend', retryContainer);
    }

    retryContainer.innerHTML = ''; // Clear previous buttons

    const title = document.createElement('p');
    title.classList.add('retry-title');
    title.textContent = localStorage.getItem('language') === 'Persian' ? 'تلاش مجدد برای بخش‌های ناموفق:' : 'Retry Failed Chunks:';
    retryContainer.appendChild(title);

    // Sort failed chunks by index for consistent button order
    failedChunksData.sort((a, b) => a.index - b.index).forEach(failedChunk => {
        const button = document.createElement('button');
        button.classList.add('button', 'secondary-button', 'retry-button');
        button.dataset.chunkIndex = failedChunk.index;

        const userFacingIndex = failedChunk.index + 1;
        // Simplified button text
        button.textContent = localStorage.getItem('language') === 'Persian'
            ? `تلاش مجدد بخش ${userFacingIndex}`
            : `Retry Chunk ${userFacingIndex}`;
        button.title = `Click to retry chunk ${userFacingIndex}`; // Tooltip still shows index

        button.addEventListener('click', handleManualRetry);
        retryContainer.appendChild(button);
    });
}

async function handleManualRetry(event) {
    const button = event.target.closest('.retry-button');
    if (!button || button.disabled) return;

    const internalChunkIndex = parseInt(button.dataset.chunkIndex, 10);
    const failedChunkInfo = failedChunksData.find(fc => fc.index === internalChunkIndex);

    if (!failedChunkInfo || !failedChunkInfo.chunkData) { // Check chunkData exists
        console.error("Could not find failed chunk data for index:", internalChunkIndex);
        showError("Error: Could not find data for this chunk retry.", false);
        return;
    }

    const userFacingIndex = internalChunkIndex + 1;
    const originalButtonHTML = button.innerHTML;
    button.disabled = true;
    button.classList.add('loading');
    button.innerHTML = `<span class="spinner"></span> ${localStorage.getItem('language') === 'Persian' ? `در حال تلاش مجدد بخش ${userFacingIndex}...` : `Retrying Chunk ${userFacingIndex}...`}`;
    hideError(); // Hide previous general errors
    console.log(`Retrying translation for Chunk ${userFacingIndex}...`);

    try {
        // Prepare API call settings (same as in main loop)
        let generationConfig = {};
        if (currentTemperature !== null) generationConfig.temperature = currentTemperature;
        if (currentTopP !== null) generationConfig.topP = currentTopP;
        if (currentTopK !== null) generationConfig.topK = currentTopK;
        if (currentMaxOutputTokens !== null) generationConfig.maxOutputTokens = currentMaxOutputTokens;
        if (currentStopSequencesStr) {
            generationConfig.stopSequences = currentStopSequencesStr.split(',').map(s => s.trim()).filter(Boolean);
        }
        let systemInstruction = currentPromptTemplate ? { role: "system", parts: [{ text: currentPromptTemplate }] } : null;
        const useProxy = useProxyCheckbox.checked; // Get current proxy setting
        const apiUrl = useProxy
            ? `${proxyUrl}/v1beta/models/${currentModel}:generateContent?key=${currentApiKey}`
            : `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${currentApiKey}`;

        // Call translateChunk with the failed text chunk
        const translatedText = await translateChunk(
            failedChunkInfo.chunkData, // Pass the failed text string directly
            apiUrl,
            currentBaseDelay,
            currentQuotaDelay,
            currentLang,
            userFacingIndex, // User-facing index for logging
            0, // Pass 0 for totalChunksForLog to signal it's a retry
            generationConfig,
            systemInstruction
        );

        // --- Update the main data store --- (Ensure index is valid)
        if (internalChunkIndex >= 0 && internalChunkIndex < currentAllTranslatedEntries.length) {
            currentAllTranslatedEntries[internalChunkIndex] = { id: internalChunkIndex, text: translatedText };
            console.log(`Successfully retried chunk ${userFacingIndex}. Updated entry.`);

            // Update translation memory
            updateTranslationMemory(failedChunkInfo.chunkData, translatedText, currentLang);
            localStorage.setItem('translationMemory', JSON.stringify(translationMemory)); // Save memory immediately

        } else {
             console.error(`Invalid index ${internalChunkIndex} for retry update.`);
             throw new Error(`Invalid index during retry update.`);
        }

        // Remove this chunk from the failed list
        failedChunksData = failedChunksData.filter(fc => fc.index !== internalChunkIndex);

        // Update UI
        button.remove(); // Remove the button on success
        showError(`Chunk ${userFacingIndex} successfully translated!`, true);
        generateAndDisplayDownloadLink(); // Update download link
        displayRetryButtons(); // Refresh button list (will remove container if empty)

        // Update main status if all retries are done
        if (failedChunksData.length === 0) {
            const lang = localStorage.getItem('language') || 'English';
            showError(lang === 'Persian' ? 'همه بخش‌ها با موفقیت ترجمه شدند!' : 'All chunks successfully translated!', true);
            if (timeEstimateSpan) timeEstimateSpan.textContent = lang === 'Persian' ? "پایان موفقیت آمیز" : "Finished successfully";
        }

    } catch (retryError) {
        console.error(`Manual retry for chunk ${userFacingIndex} failed:`, retryError);
        showError(`Retry failed for Chunk ${userFacingIndex}: ${retryError.message}`, false);
        // Restore button on failure
        button.disabled = false;
        button.classList.remove('loading');
        button.innerHTML = originalButtonHTML; // Restore original content
    } finally {
         // Ensure loading state is always removed from button if it still exists
         const stillExistsButton = document.querySelector(`.retry-button[data-chunk-index="${internalChunkIndex}"]`);
         if(stillExistsButton) {
            stillExistsButton.disabled = false;
            stillExistsButton.classList.remove('loading');
            if (!stillExistsButton.querySelector('.spinner')) { // Avoid adding multiple spinners if innerHTML wasn't set
                 stillExistsButton.innerHTML = originalButtonHTML;
            }
         }
    }
}

// --- Event Listeners Setup --- (Moved inside DOMContentLoaded)
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded and parsed");

    // --- Initialize Libraries requiring DOM/window objects ---
    // Set PDF.js worker source *after* the library script has loaded
    if (typeof pdfjsLib !== 'undefined') {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        console.log('PDF.js worker source set.');
    } else {
        console.error('PDF.js library (pdfjsLib) not found. PDF functionality will fail.');
        showError('Error initializing PDF library. Please check your internet connection or browser extensions.');
    }

    // Initialize Dropzone only if the element exists
    if (dropzoneElement) {
        try {
            const myDropzone = new Dropzone(dropzoneElement, {
                url: "#", // Dummy URL
                autoProcessQueue: false,
                acceptedFiles: ".pdf", // Changed to PDF
                maxFiles: 1,
                addRemoveLinks: true,
                dictDefaultMessage: dropzoneElement.querySelector('.dz-message') ? dropzoneElement.querySelector('.dz-message').innerHTML : "<p>Drop files here or click to upload.</p>",
                dictRemoveFile: "Remove",
                dictMaxFilesExceeded: "You can only upload one file.",
                dictInvalidFileType: "You can only upload .pdf files.", // Changed to PDF
                init: function() {
                    this.on("addedfile", function(file) {
                        if (this.files.length > 1) {
                            this.removeFile(this.files[0]);
                        }
                        uploadedFile = file;
                        hideError();
                        console.log("File added:", file.name);
                    });
                    this.on("removedfile", function(file) {
                        uploadedFile = null;
                        console.log("File removed:", file.name);
                    });
                    this.on("error", function(file, errorMsg) {
                        console.error("Dropzone error:", errorMsg);
                        let userMessage = "Error adding file.";
                        if (typeof errorMsg === 'string') {
                            if (errorMsg.includes("You can only upload")) userMessage = errorMsg;
                            else if (errorMsg.includes("File is too big")) userMessage = "File is too large.";
                            else userMessage = "Invalid file. Please ensure it's a valid .pdf file."; // Changed to PDF
                        }
                        showError(userMessage);
                        if (file.previewElement) {
                            const removeLink = file.previewElement.querySelector("[data-dz-remove]");
                            if (removeLink) { removeLink.click(); }
                            else { file.previewElement.remove(); }
                        }
                        uploadedFile = null;
                    });
                }
            });
            console.log('Dropzone initialized.');
        } catch (e) {
            console.error("Failed to initialize Dropzone:", e);
            if (dropzoneElement) {
                dropzoneElement.textContent = "Error initializing file drop zone.";
                dropzoneElement.style.border = "2px dashed var(--error-color)";
            }
        }
    } else {
        console.warn("Dropzone element '#dropzone-upload' not found.");
    }
    // --- End Library Initializations ---

    // Load saved theme or default to light
    const savedTheme = localStorage.getItem('theme');
    // Set the initial theme state correctly
    updateTheme(savedTheme === 'light' || savedTheme === null); // Pass true for light, false for dark

    // Load saved language or default to English
    const savedLanguage = localStorage.getItem('language') || 'English';
    updateLanguage(savedLanguage);

    // Load saved API key
    loadApiKey();

    // Set initial state for input method display
    const initialInputMethod = document.querySelector('input[name="input_method"]:checked')?.value || 'file';
     if(fileInputSection) fileInputSection.style.display = initialInputMethod === 'file' ? 'block' : 'none';
     if(textInputSection) textInputSection.style.display = initialInputMethod === 'text' ? 'block' : 'none';

    // Attach listeners only after DOM is ready
    if (themeToggle) themeToggle.addEventListener('click', () => {
        // Toggle based on the *current* state
        const isCurrentlyLight = !htmlElement.classList.contains('dark-mode');
        updateTheme(!isCurrentlyLight); // Pass the *new* desired state
    });
    if (languageToggle) languageToggle.addEventListener('click', () => {
        const currentLanguage = localStorage.getItem('language') === 'Persian' ? 'English' : 'Persian';
        updateLanguage(currentLanguage);
        resetUI();
    });
    if (clearMemoryButton) clearMemoryButton.addEventListener('click', clearTranslationMemory);
    if (togglePasswordBtn) togglePasswordBtn.addEventListener('click', togglePasswordVisibility);
    if (rememberMeCheckbox) rememberMeCheckbox.addEventListener('change', saveApiKey);
    if (translateForm) translateForm.addEventListener('submit', handleFormSubmit);

    inputMethodRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            const method = e.target.value;
             if(fileInputSection) fileInputSection.style.display = method === 'file' ? 'block' : 'none';
             if(textInputSection) textInputSection.style.display = method === 'text' ? 'block' : 'none';
            hideError();
        });
    });

    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
            e.preventDefault(); themeToggle?.click();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            if (document.activeElement?.tagName !== 'TEXTAREA' && submitButton && !submitButton.disabled) {
                e.preventDefault(); translateForm?.requestSubmit();
            }
        }
    });

    console.log("Static Translator Initialized");
}); // End DOMContentLoaded
