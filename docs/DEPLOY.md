# تشغيل البوابة من مستودع Gitea

Gitea يحفظ الكود فقط ولا يشغّل الموقع. البوابة تطبيق Next.js فيه واجهات خادم (البيانات المفتوحة،
الترجمة، الأخبار)، لذلك تحتاج خادماً يعمل عليه Node.js، ولا يكفي نشرها كصفحات ثابتة.

المستودع: `http://10.21.8.20:3000/14105/dhofar-portal` — الفرع المنشور: `main`.

## الطريقة 1: Docker (الموصى بها)

على الخادم (Linux عليه Docker و Docker Compose):

```bash
sudo git clone http://10.21.8.20:3000/14105/dhofar-portal.git /opt/dhofar-portal
```

```bash
cd /opt/dhofar-portal && cp .env.example .env
```

```bash
docker compose up -d --build
```

البوابة تعمل بعدها على `http://<عنوان الخادم>:8080`. المنفذ 3000 يستخدمه Gitea، ولتغيير منفذ
البوابة أضف `PORTAL_PORT=80` إلى ملف `.env`.

- المستودع خاص، فعند `git clone` أدخل اسم المستخدم ورمز وصول (Settings ← Applications) بصلاحية قراءة المستودعات.
- ملف `.env` يبقى على الخادم ولا يُرفع إلى Gitea. كل قيمه اختيارية (محرك الترجمة، Instagram).

### التحديث بعد كل رفع إلى `main`

```bash
cd /opt/dhofar-portal && ./scripts/deploy.sh
```

السكربت يجلب آخر نسخة من `main` ويعيد بناء الحاوية وتشغيلها.

## الطريقة 2: تحديث تلقائي عند كل رفع (Gitea Actions)

الملف `.gitea/workflows/deploy.yml` يشغّل `scripts/deploy.sh` على الخادم عند كل رفع إلى `main`.
يحتاج مرة واحدة:

1. تفعيل Actions في Gitea: مدير الخادم يضبط `[actions] ENABLED = true` في `app.ini`، ثم من
   إعدادات المستودع ← Actions ← تفعيل.
2. تثبيت `act_runner` على خادم البوابة وتسجيله بالوسم `portal-server:host`
   (رمز التسجيل من إعدادات المستودع ← Actions ← Runners):

```bash
./act_runner register --instance http://10.21.8.20:3000 --token <TOKEN> --labels portal-server:host
```

3. المستخدم الذي يشغّل الـ runner يحتاج صلاحية Docker وصلاحية الكتابة على `/opt/dhofar-portal`.

لا يستخدم الملف أي Actions خارجية، فيعمل على الشبكة الداخلية دون إنترنت. لكن بناء الصورة أول مرة
يحتاج الوصول إلى Docker Hub و npm (أو مرآة داخلية لهما).

## الطريقة 3: دون Docker (Node.js مباشرة)

يحتاج Node.js 20 أو أحدث على الخادم (Linux أو Windows):

```bash
git clone http://10.21.8.20:3000/14105/dhofar-portal.git && cd dhofar-portal
```

```bash
npm ci
```

```bash
node scripts/build-page-dates.js && node scripts/build-brand-css.js && npx next build
```

```bash
npx next start -p 8080
```

لإبقائه يعمل بعد إغلاق الطرفية وإعادة تشغيل الخادم استخدم PM2:

```bash
npm i -g pm2 && pm2 start "npx next start -p 8080" --name dhofar-portal && pm2 save
```

وللتحديث: `git pull` ثم أعد البناء ثم `pm2 restart dhofar-portal`.

## ملاحظات

- الخادم يحتاج وصولاً إلى: `main.edm.gov.om` و `edm.gov.om` (أرقام المعاملات والزيارات)،
  و `api.jsonbin.io` (قاعدة بيانات البوابة)، و `fonts.googleapis.com` (الخط).
- روابط ثقة (Thiqa) تعود إلى عنوان البوابة؛ عند تغيير العنوان أو المنفذ يجب أن يُحدَّث عنوان
  العودة لدى الجهة المشغّلة لثقة.
- للنشر على اسم نطاق و HTTPS ضع أمام البوابة خادماً وسيطاً (nginx أو Caddy) يحوّل إلى المنفذ 8080.
