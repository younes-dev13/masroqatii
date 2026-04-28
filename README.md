# مسروقاتي - نسخة Firebase حقيقية

## قبل الرفع على GitHub
افتح `script.js` واستبدل `firebaseConfig` بقيم مشروعك من Firebase.

## إعداد Firebase
1. ادخل Firebase Console.
2. Create project.
3. Build > Authentication > Get started > Sign-in method > Google > Enable.
4. Build > Firestore Database > Create database.
5. Project settings > Your apps > Web app > انسخ firebaseConfig.
6. ضع القيم في `script.js`.
7. Firestore Rules: انسخ محتوى `firebase-rules.txt` إلى Rules ثم Publish.

## الرفع
ارفع الملفات كلها إلى GitHub بدل القديمة:
- index.html
- style.css
- script.js
- manifest.json
- sw.js
- icon.svg
