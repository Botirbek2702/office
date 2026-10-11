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

Saytdagi **AI rejalash** tugmasini bosing. Manager qisqa loyiha tavsifi, ochiq savollar, mutaxassislarga vazifalar, qabul mezonlari va vazifalar bog‘lanishlarini qaytaradi. Reja doskadan ochiladi va JSON ko‘rinishida yuklanadi. Reja tayyorligi dastur bajarildi degani emas: kod yozuvchi bajaruvchilar hali ulanmagan.

Kalit faqat serverda saqlanadi; `.env` Git orqali yuklanmaydi. API ulanishi faqat kalit va model sozlanganda yoqiladi. Har reja uchun bitta API so‘rov, 5000 maksimal chiqish tokeni va 90 soniya vaqt chegarasi bor. API hisobidagi xarajat limitlarini alohida belgilang. Token ko‘rsatkichi saqlangan muvaffaqiyatli rejalarning sarfini ko‘rsatadi, umumiy hisob billingini emas. Demo rejimi bepul simulyatsiya bo‘lib qoladi.

Server localhost uchun mo‘ljallangan. Internetga chiqarishdan oldin autentifikatsiya, server xotirasi va foydalanuvchi bo‘yicha limitlarni qo‘shish kerak.

## Tekshirish

```sh
npm run check
npm test
```

Sayt oddiy HTML/CSS/JavaScript: istalgan statik hostingga index.html, styles.css va app.js fayllarini joylashtirish mumkin. Google Fonts yuklanmasa tizim shriftlari ishlaydi.
