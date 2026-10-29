# לימוד שפות לדוברי עברית

אתר ללימוד שפות שבנוי מהיסוד לדוברי עברית. שלב ראשון: אנגלית וספרדית. האתר עובד גם בלי אינטרנט, וההתקדמות מסתנכרנת לענן בלי לדרוס אף פעם את מה שכבר שמור שם.

התוכנית המלאה: [תוכנית בניית אתר ללימוד שפות](https://claude.ai/artifact/GFqUqL1TGLJecV2RuqKfsj)

## מה יש כבר

- **שני קורסים לדוגמה:** אנגלית (2 יחידות, 9 שיעורים) וספרדית (יחידה אחת, 3 שיעורים), ברמה A1.
- **8 סוגי תרגילים:** בחירה מרובה, שמיעה ובחירה, התאמת זוגות, הרכבת משפט, השלמת חסר, תרגום, הכתבה, וחזרה בקול עם הקלטה עצמית.
- **בדיקת תשובות גמישה:** מתעלמת מאותיות גדולות, פיסוק וניקוד, מקבלת קיצורים (I'm = I am), סולחת על שגיאת הקלדה אחת במילה ארוכה, ומסמנת סימנים חסרים (como ← cómo).
- **חזרה מרווחת:** אלגוריתם FSRS. כל מילה חוזרת בדיוק כשהיא מתחילה להישכח.
- **עובד offline:** כל ההתקדמות נשמרת קודם במכשיר (IndexedDB), והשיעורים נשמרים לשימוש בלי חיבור.
- **סנכרון בטוח לענן:** המכשיר שולח רק פעולות, אף פעם לא "מצב". השרת רק מוסיף, לא מעדכן ולא מוחק. מכשיר חדש או ריק לא יכול למחוק נתונים בענן.
- **אבטחה:** הדפדפן לא ניגש לבסיס הנתונים בכלל. כל קריאה וכתיבה עוברת בשרת, שבודק את ההתחברות, מאמת כל פעולה ומפעיל בלם בטיחות.
- **נוח במובייל ובמחשב:** ממשק עברי מימין לשמאל, מצב כהה, קיצורי מקלדת (Enter לבדיקה, 1–4 לבחירה), התקנה כאפליקציה.

## מבנה הפרויקט

```
content/courses/        תוכן הקורסים (YAML)
packages/content-schema סכמת התוכן ובדיקת תקינות
packages/engine         בדיקת תשובות וחזרה מרווחת
packages/sync           פעולות סנכרון, כללי מיזוג ובלם בטיחות
apps/web                האתר (Next.js)
apps/web/src/server     שרת הסנכרון (Firestore)
firebase/               חוקי האבטחה של Firestore
```

## הרצה מקומית

דרוש Node 22 ו־pnpm.

```bash
pnpm install
pnpm content:build      # בודק את התוכן ומכין אותו לאתר
pnpm dev                # http://localhost:3000
```

בלי הגדרות Firebase האתר עובד במצב אורח: הכל נשמר במכשיר, וההתחברות והסנכרון כבויים.

## בדיקות

```bash
pnpm check              # טיפוסים, בדיקות יחידה ובדיקות תוכן
pnpm build && pnpm --filter web e2e      # בדיקות מקצה לקצה בטלפון ובמחשב
pnpm exec firebase emulators:exec --only firestore,auth "pnpm test:emulator"   # חוקי אבטחה ו־Firestore (דרוש Java)
```

## חיבור לענן (Firebase, חינם)

החבילה החינמית (Spark) לא דורשת כרטיס אשראי, והפרויקט לא מוקפא כשאין פעילות.

1. ב־[console.firebase.google.com](https://console.firebase.google.com) יוצרים פרויקט (אפשר לכבות Google Analytics).
2. **Firestore Database** → Create database → Production mode → אזור `eur3` או `europe-west1`. ב־Rules מדביקים את `firebase/firestore.rules`.
3. **Authentication** → Get started → מפעילים Email/Password ו־Google. ב־Settings → Authorized domains מוסיפים את כתובת האתר ב־Vercel.
4. **Project settings → General → Your apps** → מוסיפים Web app ומעתיקים את `apiKey`, `authDomain`, `projectId`, `appId`.
5. **Project settings → Service accounts** → Generate new private key. זה קובץ סודי: מדביקים את התוכן שלו כשורה אחת במשתנה `FIREBASE_SERVICE_ACCOUNT` ב־Vercel בלבד.
6. ממלאים את המשתנים לפי `apps/web/.env.example` ב־Vercel (ולפיתוח מקומי ב־`apps/web/.env.local`).

מכסות חינמיות שכדאי להכיר: 20,000 כתיבות ו־50,000 קריאות ביום ב־Firestore. שיעור אחד כותב בערך 15 פעולות.

## הוספת תוכן

כל יחידה היא קובץ YAML ב־`content/courses/<course>/units/`. אחרי עריכה מריצים `pnpm content:build`: הבדיקה נכשלת עם הסבר מדויק אם יש שגיאה (מזהה כפול, מילה שלא הוגדרה, תשובה שחוזרת על עצמה). בדיקת `content-qa` מוודאת שכל תשובה שרשומה כנכונה באמת מתקבלת.

שימו לב: ב־YAML, רשימה בסוגריים מרובעים מתפצלת בפסיקים. משפט עם פסיק צריך מירכאות: `["Yes, please."]`.
