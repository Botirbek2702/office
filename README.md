# Office

Botirbekning shaxsiy AI jamoasi uchun yengil, vizual 2D ish maydoni.

## Ishga tushirish

Node.js 22.9+ bilan:

```sh
npm start
```

http://localhost:4173 manzilini oching. Paket o‘rnatish talab qilinmaydi.

## Hozir mavjud

- Besh agent uchun interaktiv 2D ofis va agent tafsilotlari.
- Managerga topshiriq yuborish va demo bosqichlarini kuzatish.
- Vazifalar doskasi, jamoa sahifasi va pauza/davom ettirish.
- Vazifalar va chat shu brauzerning localStorage xotirasida saqlanadi.
- Mobil ekranlar va klaviatura boshqaruvi.

**Bu v0.1 demo interfeys.** AI API chaqirilmaydi, kod yozilmaydi, serverga deploy qilinmaydi. Token ko‘rsatkichi shu sababli 0. Demo har 5 soniyada bitta bosqichdan o‘tadi; sahifa yopilganda jarayon ishlamaydi. Haqiqiy agentlar keyingi bosqichda backend orqali ulanadi. API kalitlarni frontendga joylashtirmang.

## v0.2 — AI manager

Demo rejimiga qo‘shimcha ravishda OpenAI Responses API orqali haqiqiy loyiha rejasini yaratish qo‘shildi. `.env.example` faylidan `.env` nusxa yarating va o‘z API kalitingiz hamda Structured Outputs qo‘llaydigan model nomini kiriting. So‘ng serverni qayta ishga tushiring:

```powershell
Copy-Item .env.example .env
npm start
```

Saytdagi **AI rejalash** tugmasini bosing. Manager qisqa loyiha tavsifi, ochiq savollar, mutaxassislarga vazifalar, qabul mezonlari va vazifalar bog‘lanishlarini qaytaradi. Reja doskadan ochiladi va JSON ko‘rinishida yuklanadi. Bu rejim faqat rejalaydi; bajarish uchun v0.3 dagi **Haqiqiy jamoa** rejimini tanlang.

Kalit faqat serverda saqlanadi; `.env` Git orqali yuklanmaydi. API ulanishi faqat kalit va model sozlanganda yoqiladi. Har reja uchun bitta API so‘rov, 5000 maksimal chiqish tokeni va 90 soniya vaqt chegarasi bor. API hisobidagi xarajat limitlarini alohida belgilang. Token ko‘rsatkichi saqlangan muvaffaqiyatli rejalarning sarfini ko‘rsatadi, umumiy hisob billingini emas. Demo rejimi bepul simulyatsiya bo‘lib qoladi.

Server localhost uchun mo‘ljallangan. Internetga chiqarishdan oldin autentifikatsiya, server xotirasi va foydalanuvchi bo‘yicha limitlarni qo‘shish kerak.

## v0.3 — Haqiqiy Codex jamoasi

`codex` CLI o‘rnatilgan va `codex login` orqali hisobga kirilgan bo‘lishi kerak. Standart model Codex sozlamalaridan olinadi. Boshqa executable kerak bo‘lsa `.env` faylida `CODEX_BIN` ni belgilang. Bu yo‘l API kalit talab qilmaydi va mavjud Codex hisobining limitlaridan foydalanadi.

Saytdagi **Haqiqiy jamoa** tugmasini bosing, keyin managerga loyiha topshirig‘ini yuboring. Manager reja tuzadi; backend, frontend, QA va DevOps vazifalari bog‘lanishlar bo‘yicha ketma-ket bajariladi. Agentlar `--approve-for-me` orqali `workspace-write` sandbox va avtomatik ruxsat tekshiruvida ishlaydi; sandboxni chetlab o‘tish yoqilmagan. Har bosqichning vaqti 10 daqiqa bilan cheklangan. Yakunda alohida QA tekshiruvi bajariladi; muvaffaqiyatsiz bosqich butun ishni to‘xtatadi. **Qayta urinish** saqlangan reja va tugagan vazifalarni saqlab, qolgan bosqichlarni qayta bajaradi. Avtomatik xato tuzatish takrorlari hali yo‘q. Windows’da Node test subprocesslari bloklansa QA `node --test --test-isolation=none` bilan haqiqiy assertionlarni tekshiradi va cheklovni hisobotga yozadi.

Natijalar `.office-data/<ish-id>/project/` papkasida, hisobotlar `run.json` faylida saqlanadi. Bu papka GitHub’ga yuklanmaydi. Saytdagi **Haqiqiy ishlar** bo‘limidan hisobotlarni oching va matn fayllarini yuklang. Fayl ro‘yxati 200 ta, bitta yuklanadigan fayl 500 KB bilan cheklangan. Agent vazifalari mavjud KAFE loyihalarini o‘zgartirmaydi: har ish yangi papkada boshlanadi. DevOps mahalliy ishga tushirish/deploy yo‘riqnomasini tayyorlaydi; tashqi serverga avtomatik chiqarish ulanmagan.

Server ochiq bo‘lsa sahifani yopganda ham ish davom etadi. Server qayta ishga tushsa faol ish `interrupted` deb belgilanadi; **Qayta urinish** orqali davom ettiring. Ishni to‘xtatish Codex jarayonini va Windows’da uning bolalarini tugatadi; yozilgan fayllar saqlanadi. Qayta yuklanganda ishlarni polling orqali ko‘rasiz. Token ko‘rsatkichi Codex qaytargan input/output hisobidan tuziladi, billing bilan bir xil bo‘lishi shart emas.

`node smoke.mjs` kichik kalkulyator loyihasini haqiqiy Codex jamoasiga topshiradi. Bu buyruq hisob limitini ishlatadi; `npm test` esa AI chaqirmaydi.

## Tekshirish

```sh
npm run check
npm test
```

Interfeys oddiy HTML/CSS/JavaScript. Demo uchun statik hosting yetadi; haqiqiy jamoa uchun mahalliy Node serveri va Codex CLI zarur. Google Fonts yuklanmasa tizim shriftlari ishlaydi.
