# SRT Translator (Using Gemini API)

This web tool allows you to translate SubRip Subtitle (.srt) files or pasted SRT content into another language using Google's Gemini AI models. The translation process happens entirely in your browser, requiring your own Gemini API key.

---

## English

### Live Demo

**You can access the live version of this tool here:**

**[https://itsyebekhe.github.io/subtitle-translate/](https://itsyebekhe.github.io/subtitle-translate/)**

### Features

*   Translate `.srt` files or pasted SRT text.
*   Supports various Google Gemini models.
*   Client-side processing (your API key stays in your browser).
*   Option to remember API key locally (using browser's Local Storage).
*   Configurable translation parameters (temperature, Top-P, Top-K, etc.).
*   Adjustable request delays and chunking for handling rate limits.
*   Optional proxy support for regions with restricted API access.
*   Manual retry option for specific chunks that fail during translation.
*   Light/Dark theme support.
*   Basic Translation Memory (stores successful translations locally to avoid re-translating identical lines).
*   Language toggle (English/Persian interface).

### How to Use

1.  **Open the Tool:** Go to [https://itsyebekhe.github.io/subtitle-translate/](https://itsyebekhe.github.io/subtitle-translate/).
2.  **Select Input Method:**
    *   **Upload File:** Click the "Upload File" radio button, then drag & drop your `.srt` file onto the designated area or click it to browse.
    *   **Paste Text:** Click the "Paste Text" radio button and paste your complete SRT content into the text area.
3.  **Enter API Key:** Go to the "Settings & API Key" section (you might need to click to expand it). Paste your Google Gemini API key into the "Gemini API Key" field.
    *   You can get an API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
    *   Check the "Remember API key" box if you want your browser to store it locally for future use (use with caution on shared computers).
4.  **Choose Target Language:** Enter the desired target language (e.g., "Spanish", "Japanese", "Persian") in the "Target Language" field. Be specific (e.g., "Brazilian Portuguese" instead of just "Portuguese" if needed).
5.  **(Optional) Configure Advanced Settings:** Expand the "Settings & API Key" section to adjust:
    *   **Gemini Model:** Select the desired AI model. Performance and cost may vary.
    *   **Proxy:** Enable if you are in a region where direct access to the Gemini API is blocked (like Iran). *Requires the proxy URL to be correctly configured.*
    *   **Delays:** Adjust `Base Delay` (between successful requests) and `Quota Delay` (after hitting rate limits). Defaults are generally safe.
    *   **Chunks:** Set how many parts the SRT file should be split into for processing. Higher numbers can sometimes help with very long files or strict rate limits, but increase overhead.
    *   **Generation Parameters:** Fine-tune `Temperature`, `Top-P`, `Top-K`, `Max Output Tokens`, and `Stop Sequences` to control the AI's output style. Hover over or consult Gemini documentation for details. **Modifying these significantly can impact translation quality or cause errors.**
    *   **System Prompt:** Modify the instructions given to the AI model (use with caution).
6.  **Translate:** Click the "Translate" button.
7.  **Progress:** Monitor the progress bar and status text below the form.
8.  **Download / Retry:**
    *   Once complete, a "Download Translated SRT" button will appear. Click it to save the file.
    *   If any chunks failed during the process, "Retry Chunk X" buttons will appear below the download link. Clicking these will attempt to re-translate only that specific failed part using the same settings. The download link will update automatically if a retry is successful.
9.  **Clear Memory (Optional):** Click the trash can icon (<i class="fa fa-trash"></i>) in the header to clear the locally stored translation memory.

### Important Notes

*   **API Key Security:** Your API key is processed in your browser and sent directly to Google (or the proxy). While not stored on any external server by *this tool*, be mindful of browser extensions or local security. Use the "Remember Me" feature cautiously.
*   **API Costs:** Using the Gemini API may incur costs based on your usage. Refer to Google AI pricing.
*   **Rate Limits:** Google enforces rate limits (requests per minute). The tool attempts to handle this with delays, but excessive requests or very large files might still hit limits. Adjusting delays can help.
*   **Translation Quality:** AI translation quality varies depending on the model, language pair, context, and the specific text. Review translations for accuracy.
*   **Browser Storage:** API Key remembrance and Translation Memory use your browser's Local Storage. Clearing your browser data will remove these.

### Troubleshooting / Reporting Issues

*   **Errors during translation:** Check the error message displayed. Ensure your API key is valid and has access to the selected model. If using the proxy, ensure it's operational. Check the browser's developer console (F12) for more detailed error messages (especially network errors).
*   **Incorrect Output:** Try adjusting the "System Prompt" or using a different Gemini model.
*   **File Issues:** Report bugs or suggest improvements via the project's issue tracker (if available, e.g., on GitHub).

### Credits

Created with ❤️ by [yebekhe](https://x.com/yebekhe)

---
<br>

## فارسی (Persian)

### نسخه زنده (دمو)

**می‌توانید به نسخه زنده این ابزار از طریق لینک زیر دسترسی پیدا کنید:**

**[https://itsyebekhe.github.io/subtitle-translate/](https://itsyebekhe.github.io/subtitle-translate/)**

### ویژگی‌ها

*   ترجمه فایل‌های `.srt` یا متن SRT الصاق شده.
*   پشتیبانی از مدل‌های مختلف Google Gemini.
*   پردازش سمت کاربر (کلید API شما در مرورگر شما باقی می‌ماند).
*   گزینه‌ای برای به خاطر سپردن کلید API به صورت محلی (با استفاده از Local Storage مرورگر).
*   پارامترهای ترجمه قابل تنظیم (دما، Top-P، Top-K و غیره).
*   تأخیرهای قابل تنظیم درخواست و تقسیم‌بندی (chunking) برای مدیریت محدودیت‌های نرخ ارسال درخواست (rate limits).
*   پشتیبانی اختیاری از پروکسی برای مناطقی که دسترسی API محدود شده است.
*   گزینه تلاش مجدد دستی برای بخش‌های خاصی که در حین ترجمه با شکست مواجه می‌شوند.
*   پشتیبانی از تم روشن/تاریک.
*   حافظه ترجمه اولیه (ذخیره ترجمه‌های موفق به صورت محلی برای جلوگیری از ترجمه مجدد خطوط یکسان).
*   تغییر زبان رابط کاربری (انگلیسی/فارسی).

### نحوه استفاده

1.  **باز کردن ابزار:** به آدرس [https://itsyebekhe.github.io/subtitle-translate/](https://itsyebekhe.github.io/subtitle-translate/) بروید.
2.  **انتخاب روش ورودی:**
    *   **بارگذاری فایل:** دکمه رادیویی «بارگذاری فایل» را انتخاب کنید، سپس فایل `.srt` خود را به قسمت مشخص شده بکشید و رها کنید یا روی آن کلیک کنید تا فایل را انتخاب نمایید.
    *   **الصاق متن:** دکمه رادیویی «الصاق متن» را انتخاب کنید و محتوای کامل SRT خود را در کادر متنی مربوطه الصاق (Paste) کنید.
3.  **وارد کردن کلید API:** به بخش «تنظیمات پیشرفته» بروید (ممکن است لازم باشد برای باز شدن روی آن کلیک کنید). کلید API گوگل Gemini خود را در فیلد «کلید API Gemini» الصاق کنید.
    *   می‌توانید کلید API را از [Google AI Studio](https://aistudio.google.com/app/apikey) دریافت کنید.
    *   اگر می‌خواهید مرورگر شما کلید را برای استفاده‌های بعدی به صورت محلی ذخیره کند، گزینه «ذخیره کلید API» را علامت بزنید (در کامپیوترهای اشتراکی با احتیاط استفاده کنید).
4.  **انتخاب زبان مقصد:** زبان مقصد مورد نظر (مثلاً «فارسی»، «انگلیسی»، «آلمانی») را در فیلد «زبان مقصد» وارد کنید. دقیق باشید (مثلاً در صورت نیاز «پرتغالی برزیلی» به جای فقط «پرتغالی»).
5.  **(اختیاری) پیکربندی تنظیمات پیشرفته:** بخش «تنظیمات پیشرفته» را باز کنید تا موارد زیر را تنظیم نمایید:
    *   **مدل Gemini:** مدل هوش مصنوعی مورد نظر را انتخاب کنید. عملکرد و هزینه ممکن است متفاوت باشد.
    *   **پروکسی:** اگر در منطقه‌ای هستید که دسترسی مستقیم به Gemini API مسدود است (مانند ایران)، این گزینه را فعال کنید. *نیاز به پیکربندی صحیح URL پروکسی دارد.*
    *   **تأخیرها:** `تأخیر پایه` (بین درخواست‌های موفق) و `تأخیر سهمیه` (پس از رسیدن به محدودیت نرخ ارسال) را تنظیم کنید. مقادیر پیش‌فرض معمولاً ایمن هستند.
    *   **تعداد بخش‌ها:** تعیین کنید که فایل SRT برای پردازش به چند قسمت تقسیم شود. اعداد بالاتر گاهی اوقات می‌توانند به فایل‌های بسیار طولانی یا محدودیت‌های شدید نرخ ارسال کمک کنند، اما سربار را افزایش می‌دهند.
    *   **پارامترهای تولید:** پارامترهای `دما`، `Top-P`، `Top-K`، `حداکثر توکن خروجی` و `دنباله‌های توقف` را برای کنترل سبک خروجی هوش مصنوعی تنظیم دقیق کنید. برای جزئیات، مستندات Gemini را مطالعه کنید. **تغییر قابل توجه این موارد می‌تواند بر کیفیت ترجمه تأثیر بگذارد یا باعث خطا شود.**
    *   **دستورالعمل سیستم / پرامپت:** دستورالعمل‌های داده شده به مدل هوش مصنوعی را تغییر دهید (با احتیاط استفاده کنید).
6.  **ترجمه:** روی دکمه «ترجمه» کلیک کنید.
7.  **پیشرفت:** نوار پیشرفت و متن وضعیت زیر فرم را مشاهده کنید.
8.  **دانلود / تلاش مجدد:**
    *   پس از اتمام، دکمه «دانلود فایل SRT» ظاهر می‌شود. برای ذخیره فایل روی آن کلیک کنید.
    *   اگر هر بخشی در طول فرآیند با شکست مواجه شد، دکمه‌های «تلاش مجدد بخش X» در زیر لینک دانلود ظاهر می‌شوند. کلیک بر روی این دکمه‌ها تلاش می‌کند تا فقط آن بخش ناموفق خاص را با همان تنظیمات دوباره ترجمه کند. در صورت موفقیت‌آمیز بودن تلاش مجدد، لینک دانلود به‌طور خودکار به‌روز می‌شود.
9.  **پاک کردن حافظه (اختیاری):** روی آیکون سطل زباله (<i class="fa fa-trash"></i>) در هدر کلیک کنید تا حافظه ترجمه ذخیره شده محلی پاک شود.

### نکات مهم

*   **امنیت کلید API:** کلید API شما در مرورگر شما پردازش شده و مستقیماً به Google (یا پروکسی) ارسال می‌شود. اگرچه توسط *این ابزار* در هیچ سرور خارجی ذخیره نمی‌شود، مراقب افزونه‌های مرورگر یا امنیت محلی باشید. از ویژگی «ذخیره کلید API» با احتیاط استفاده کنید.
*   **هزینه‌های API:** استفاده از Gemini API ممکن است بر اساس میزان استفاده شما هزینه داشته باشد. به قیمت‌گذاری Google AI مراجعه کنید.
*   **محدودیت‌های نرخ ارسال (Rate Limits):** گوگل محدودیت‌هایی را برای تعداد درخواست‌ها در دقیقه اعمال می‌کند. این ابزار سعی می‌کند با استفاده از تأخیرها این موضوع را مدیریت کند، اما درخواست‌های بیش از حد یا فایل‌های بسیار بزرگ ممکن است همچنان به محدودیت‌ها برخورد کنند. تنظیم تأخیرها می‌تواند کمک کند.
*   **کیفیت ترجمه:** کیفیت ترجمه هوش مصنوعی بسته به مدل، جفت زبان، زمینه و متن خاص متفاوت است. ترجمه‌ها را از نظر دقت بررسی کنید.
*   **حافظه مرورگر:** قابلیت به خاطر سپردن کلید API و حافظه ترجمه از Local Storage مرورگر شما استفاده می‌کنند. پاک کردن داده‌های مرورگر شما این موارد را حذف می‌کند.

### عیب‌یابی / گزارش مشکلات

*   **خطا در حین ترجمه:** پیام خطای نمایش داده شده را بررسی کنید. مطمئن شوید کلید API شما معتبر است و به مدل انتخاب شده دسترسی دارد. اگر از پروکسی استفاده می‌کنید، از عملکرد صحیح آن اطمینان حاصل کنید. کنسول توسعه‌دهنده مرورگر (F12) را برای پیام‌های خطای دقیق‌تر (به خصوص خطاهای شبکه) بررسی کنید.
*   **خروجی نادرست:** سعی کنید «دستورالعمل سیستم» را تنظیم کنید یا از مدل Gemini دیگری استفاده نمایید.
*   **مشکلات فایل:** اشکالات را گزارش دهید یا بهبودها را از طریق ردیاب مشکلات پروژه (در صورت وجود، مثلاً در GitHub) پیشنهاد دهید.

### سازنده

ساخته شده با ❤️ توسط [yebekhe](https://x.com/yebekhe)
"# pdf-translator" 
