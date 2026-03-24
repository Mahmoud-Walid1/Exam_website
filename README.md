<p align="center">
  <img src="images/logo1.png" alt="مكتبة المعلمين" width="120" style="border-radius: 20px;">
  <img src="images/logo2.png" alt="العلوم والتقنية للجميع" width="120" style="border-radius: 20px;">
</p>

<h1 align="center">📚 مكتبة المعلمين — اختبارات محاكية نهائية</h1>

<p align="center">
  <strong>منصة متكاملة لعرض وإدارة الاختبارات المحاكية النهائية لجميع المراحل الدراسية</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Version-2.0-blue?style=for-the-badge" alt="Version">
  <img src="https://img.shields.io/badge/Firebase-Powered-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase">
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5">
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3">
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JS">
</p>

---

## ✨ المميزات

<table>
  <tr>
    <td>🔥 <strong>Firebase في الخلفية</strong></td>
    <td>مزامنة فورية للبيانات مع قاعدة بيانات Firestore سحابية</td>
  </tr>
  <tr>
    <td>🔐 <strong>نظام مصادقة آمن</strong></td>
    <td>تسجيل دخول محمي عبر Firebase Authentication</td>
  </tr>
  <tr>
    <td>🎬 <strong>أيقونات تفاعلية</strong></td>
    <td>أيقونات Lord Icon متحركة تتفاعل مع المستخدم</td>
  </tr>
  <tr>
    <td>⌨️ <strong>أنيميشن الكتابة</strong></td>
    <td>تأثير الآلة الكاتبة على العناوين الرئيسية</td>
  </tr>
  <tr>
    <td>🎠 <strong>شريط متحرك لا نهائي</strong></td>
    <td>عرض الملازم بشكل متواصل بدون فراغات</td>
  </tr>
  <tr>
    <td>🖼️ <strong>صور الاختبارات</strong></td>
    <td>إمكانية إضافة صور مخصصة لكل اختبار عبر URL</td>
  </tr>
  <tr>
    <td>👥 <strong>إدارة المسؤولين</strong></td>
    <td>إضافة حسابات أدمن متعددة من لوحة التحكم</td>
  </tr>
  <tr>
    <td>🎯 <strong>فلاتر ذكية</strong></td>
    <td>تصفية حسب المرحلة والصف والمادة الدراسية</td>
  </tr>
  <tr>
    <td>📱 <strong>تصميم متجاوب</strong></td>
    <td>يعمل بكفاءة على جميع الأجهزة والشاشات</td>
  </tr>
  <tr>
    <td>📊 <strong>نظام تقارير</strong></td>
    <td>تقارير تفصيلية وإحصائيات عن الاختبارات</td>
  </tr>
</table>

---

## 🛠️ التقنيات المستخدمة

| التقنية | الدور |
|---------|-------|
| **HTML5** | البنية الأساسية للصفحات |
| **CSS3** | التصميم والتنسيق والأنيميشن |
| **JavaScript (ES6+)** | المنطق البرمجي والتفاعل |
| **Firebase Firestore** | قاعدة البيانات السحابية |
| **Firebase Auth** | نظام المصادقة والتحقق |
| **Lord Icon** | الأيقونات التفاعلية المتحركة |
| **Google Fonts** | خطوط Cairo و Tajawal العربية |

---

## 📁 هيكل المشروع

```
Exam_website/
├── 📄 index.html               # الصفحة الرئيسية
├── 📄 admin.html               # لوحة التحكم
├── 📄 reports.html             # صفحة التقارير
├── 📄 init-subjects.html       # تهيئة المواد الدراسية
│
├── 📂 css/
│   ├── style.css               # الأنماط الرئيسية
│   ├── admin.css               # أنماط لوحة التحكم
│   └── reports.css             # أنماط التقارير
│
├── 📂 js/
│   ├── main.js                 # منطق الصفحة الرئيسية
│   ├── admin.js                # منطق لوحة التحكم
│   ├── firebase-data.js        # إدارة بيانات Firestore
│   ├── firebase-auth.js        # نظام المصادقة
│   ├── firebase-storage.js     # إدارة التخزين
│   ├── data.js                 # بيانات مساعدة
│   └── reports.js              # منطق التقارير
│
├── 📂 icons/                   # أيقونات المواد الدراسية
│   ├── math.png                # رياضيات
│   ├── arabic.png              # لغة عربية
│   ├── science.png             # علوم
│   ├── english.png             # لغة إنجليزية
│   ├── Physics.png             # فيزياء
│   ├── chemistry.png           # كيمياء
│   ├── social_studies.png      # دراسات اجتماعية
│   ├── islamic_studies.png     # دراسات إسلامية
│   └── default.png             # الأيقونة الافتراضية
│
└── 📂 images/                  # شعارات الموقع
    ├── logo1.png               # شعار مكتبة المعلمين
    └── logo2.png               # شعار العلوم والتقنية
```

---

## 🚀 التشغيل

### 1. استنساخ المشروع

```bash
git clone https://github.com/Mahmoud-Walid1/Exam_website.git
cd Exam_website
```

### 2. إعداد Firebase

1. أنشئ مشروع على [Firebase Console](https://console.firebase.google.com/)
2. فعّل **Firestore Database** و **Authentication** (Email/Password)
3. انسخ إعدادات المشروع `firebaseConfig` إلى ملفات HTML

### 3. تشغيل الموقع

افتح الموقع عبر أي خادم محلي:

```bash
# باستخدام Python
python -m http.server 8000

# أو باستخدام Live Server في VS Code
```

ثم افتح `http://localhost:8000` في المتصفح.

---

## 📖 دليل الاستخدام

### 🏠 الصفحة الرئيسية
- **شريط الملازم المتحرك** — عرض مستمر لأحدث الاختبارات والملازم
- **فلاتر ذكية** — تصفية حسب المرحلة (ابتدائي / متوسط / ثانوي)، الصف، والمادة
- **بطاقات الاختبارات** — عرض جذاب مع إمكانية الشراء مباشرة من متجر سلة

### ⚙️ لوحة التحكم
- **إدارة الاختبارات** — إضافة، تعديل، وحذف الاختبارات مع اختيار الأيقونات
- **إدارة المواد** — إضافة وحذف المواد الدراسية لكل مرحلة
- **شريط الملازم** — التحكم في محتوى الشريط المتحرك
- **إدارة المسؤولين** — إضافة حسابات أدمن جديدة بالبريد الإلكتروني
- **صور الاختبارات** — إضافة صور مخصصة لكل اختبار عبر رابط URL

---

## 🌐 النشر

### GitHub Pages

1. ادخل إعدادات المستودع: **Settings → Pages**
2. اختر **Branch: main** واضغط **Save**
3. سيكون الموقع متاحاً على: `https://mahmoud-walid1.github.io/Exam_website/`

### Netlify / Vercel

يمكن رفع المشروع مباشرة بربط مستودع GitHub.

---

## 📄 الترخيص

مشروع خاص بـ **مكتبة المعلمين — العلوم والتقنية للجميع** © 2024

---

<p align="center">
  <strong>صُنع بـ ❤️ لخدمة المعلمين والطلاب</strong>
</p>
