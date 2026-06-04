# 🎂 Праздники — PWA приложение

## Что нужно для запуска

### Шаг 1: Создать Firebase проект (5 минут, бесплатно)

1. Зайдите на https://console.firebase.google.com
2. Нажмите **"Создать проект"** → введите название (например "prazdniki")
3. Отключите Google Analytics (необязательно) → **Создать**

### Шаг 2: Включить авторизацию через Google

1. В левом меню: **Authentication** → **Sign-in method**
2. Нажмите **Google** → включите → сохраните
3. В поле "Email поддержки" укажите свой email

### Шаг 3: Создать базу данных Firestore

1. В левом меню: **Firestore Database** → **Создать базу данных**
2. Выберите **"Начать в тестовом режиме"** (можно изменить позже)
3. Выберите регион (например europe-west1) → **Готово**

### Шаг 4: Настроить правила безопасности Firestore

1. **Firestore Database** → вкладка **Правила**
2. Замените содержимое на:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

3. Нажмите **Опубликовать**

### Шаг 5: Получить конфигурацию

1. В левом меню: **Обзор проекта** (шестерёнка) → **Настройки проекта**
2. Прокрутите вниз до **"Ваши приложения"**
3. Нажмите **</>** (Web)
4. Введите название приложения → **Зарегистрировать**
5. Скопируйте объект `firebaseConfig`

### Шаг 6: Вставить конфигурацию

Откройте файл `js/firebase-config.js` и замените блок:

```js
const firebaseConfig = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT.firebaseapp.com",
  ...
};
```

На ваши данные из Firebase Console.

### Шаг 7: Разместить сайт (выберите один вариант)

**Вариант A: Firebase Hosting (рекомендую, бесплатно)**
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
# Public directory: . (точка)
# Single-page app: No
firebase deploy
```

**Вариант B: Netlify (drag & drop)**
1. Зайдите на https://netlify.com
2. Перетащите папку birthday-app в браузер
3. Готово! Получите ссылку вида https://random-name.netlify.app

**Вариант C: Vercel**
```bash
npm install -g vercel
vercel --prod
```

### Шаг 8: Добавить на главный экран iPhone

1. Откройте сайт в Safari
2. Нажмите кнопку "Поделиться" (квадрат со стрелкой)
3. Прокрутите вниз → **"На экран «Домой»"**
4. Готово! Теперь это выглядит как настоящее приложение

---

## Структура данных в Firestore

```
users/
  {userId}/
    people/
      {personId}/
        name: "Александр Смирнов"
        birthday: "1990-06-04"
        category: "friend"
        phone: "+7 916 123-45-67"
        city: "Москва"
        lastSeen: "2025-04-12"
        giftCurrent: "Книга"
        giftPrev: "Вино"
        notes: "Любит виски"
    couples/
      {coupleId}/
        name1: "Иван"
        name2: "Вера"
        surname: "Волковы"
        wedding: "2019-06-09"
        phone: "..."
        giftCurrent: "..."
        giftPrev: "..."
        notes: "..."
```

---

## Вопросы?

Если что-то не работает — проверьте:
- Правильно ли скопированы данные из firebaseConfig
- Включена ли авторизация Google в Firebase Console
- Правила Firestore настроены правильно
