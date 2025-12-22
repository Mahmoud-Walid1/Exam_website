# دليل إعداد Firebase للموقع

## خطوات إعداد مشروع Firebase

### 1. إنشاء حساب Firebase
1. اذهب إلى [Firebase Console](https://console.firebase.google.com/)
2. سجل دخول بحساب Google الخاص بك
3. اضغط على "Add project" أو "إضافة مشروع"

### 2. إنشاء المشروع
1. اختر اسم المشروع (مثل: "مكتبة-المعلمين-اختبارات")
2. اضغط "Continue" أو "متابعة"
3. يمكنك تعطيل Google Analytics (غير ضروري)
4. اضغط "Create project"

### 3. تفعيل Firestore Database
1. من القائمة الجانبية، اختر "Firestore Database"
2. اضغط "Create database"
3. اختر "Start in **production mode**"
4. اختر موقع قاعدة البيانات (اختر أقرب موقع لك)
5. اضغط "Enable"

### 4. تفعيل Authentication
1. من القائمة الجانبية، اختر "Authentication"
2. اضغط "Get started"
3. من تبويب "Sign-in method"
4. اختر "Email/Password"
5. فعّل الخيار الأول "Enable"
6. اضغط "Save"

### 5. تفعيل Storage
1. من القائمة الجانبية، اختر "Storage"
2. اضغط "Get started"
3. اضغط "Next" ثم "Done"

### 6. الحصول على مفاتيح API
1. من إعدادات المشروع (⚙️ بجانب "Project Overview")
2. اضغط على أيقونة الويب `</>`
3. سجل التطبيق باسم (مثل: "موقع الاختبارات")
4. **لا تفعل** Firebase Hosting الآن
5. انسخ كل البيانات من `firebaseConfig`

### 7. تحديث ملفات الموقع
افتح الملفات التالية وحدّث قسم `firebaseConfig`:

#### في `index.html` (السطر ~123):
```javascript
window.firebaseConfig = {
    apiKey: "YOUR_API_KEY",           // ضع مفتاح API هنا
    authDomain: "YOUR_AUTH_DOMAIN",   // ضع authDomain هنا
    projectId: "YOUR_PROJECT_ID",     // ضع projectId هنا
    storageBucket: "YOUR_STORAGE_BUCKET",  // ضع storageBucket هنا
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",  // ضع messagingSenderId هنا
    appId: "YOUR_APP_ID"              // ضع appId هنا
};
```

#### في `admin.html` (السطر ~176):
```javascript
window.firebaseConfig = {
    // نفس البيانات أعلاه
};
```

### 8. إنشاء أول مستخدم للأدمن
1. من Firebase Console، اذهب لـ "Authentication"
2. اضغط "Add user" أو "Users" ثم "Add user"
3. أدخل البريد الإلكتروني وكلمة المرور
4. اضغط "Add user"

**هذا البريد والباسورد هو ما ستستخدمه لتسجيل الدخول في صفحة الأدمن!**

### 9. ضبط قواعد الأمان (Security Rules)

#### Firestore Rules:
1. اذهب لـ "Firestore Database" → "Rules"
2. استبدل القواعد بهذا:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // السماح بالقراءة للجميع
    match /exams/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    match /settings/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

3. اضغط "Publish"

#### Storage Rules:
1. اذهب لـ "Storage" → "Rules"
2. استبدل القواعد بهذا:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /exams/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

3. اضغط "Publish"

---

## اختبار الموقع محلياً

بعد إعداد Firebase:

1. افتح ملف `index.html` في المتصفح
2. افتح ملف `admin.html` في تبويب جديد
3. سجل دخول بالبريد والباسورد اللي أنشأته
4. جرب إضافة اختبار

---

## رفع الموقع على GitHub Pages

### 1. إنشاء Repository على GitHub
1. اذهب لـ [GitHub](https://github.com)
2. اضغط "New repository"
3. اختر اسم (مثل: `exams-website`)
4. اجعله Public
5. اضغط "Create repository"

### 2. رفع الملفات
```bash
cd "d:\downloads\استاذ صابر\دعايه اختبارات نهائية"
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/exams-website.git
git push -u origin main
```

### 3. تفعيل GitHub Pages
1. من صفحة الـ repository، اذهب لـ Settings
2. من القائمة الجانبية، اختر "Pages"
3. تحت "Source"، اختر "main" branch
4. اضغط "Save"
5. بعد دقيقة، سيظهر رابط الموقع

---

## ملاحظات مهمة

⚠️ **لا تنشر مفاتيح Firebase على GitHub للعامة!**

إذا كان الـ repository عام (Public):
- مفاتيح Firebase ستكون مرئية للجميع
- لكن قواعد الأمان (Security Rules) تحمي البيانات
- فقط المستخدمين المصرح لهم يمكنهم الكتابة

✅ **الأمان مضمون من خلال:**
- Firebase Authentication (فقط المستخدمين المسجلين يمكنهم الدخول للأدمن)
- Security Rules (تمنع الكتابة لغير المصرح لهم)

---

## دعم فني

إذا واجهت أي مشكلة:
1. تأكد من نسخ مفاتيح Firebase بشكل صحيح
2. تحقق من Console في المتصفح (F12) لمعرفة الأخطاء
3. تأكد من تفعيل جميع خدمات Firebase المطلوبة
