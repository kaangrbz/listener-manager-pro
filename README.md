# Listener Manager Pro

Hafif bir yardımcı kütüphane: Duplicate (tekrarlanan) event listener'ları önler ve modal gibi dinamik UI elementlerini stabilize eder.

## Özellikler

- ✅ **Duplicate Önleme**: Aynı event listener'ın aynı elemente birden fazla kez eklenmesini engeller
- ✅ **Modal Stabilizasyonu**: Modal, map-container gibi dinamik elementlerde eski listener'ları otomatik temizler
- ✅ **Prototip Yamalama**: `EventTarget.prototype.addEventListener` ve `removeEventListener` metodlarını güvenli şekilde yamalar
- ✅ **SSR Uyumluluğu**: Server-side rendering ortamlarında güvenli çalışır
- ✅ **Debug Modu**: Geliştirme sırasında detaylı log çıktısı sağlar
- ✅ **WeakMap Kullanımı**: Memory leak'leri önlemek için WeakMap ile referans yönetimi

## Kurulum

```bash
yarn add listener-manager-pro
```

## Kullanım

### Temel Kullanım

```javascript
import EventListenerManager from 'listener-manager-pro';

// Kütüphaneyi başlat (uygulamanın başlangıcında bir kez çağırın)
EventListenerManager.init({ debug: true });

// Artık normal addEventListener kullanımı duplicate'leri otomatik engeller
const button = document.querySelector('#myButton');

button.addEventListener('click', handleClick); // ✅ İlk ekleme
button.addEventListener('click', handleClick); // ⚠️ Engellenir (duplicate)
```

### Modal Senaryosu

Modal açılıp kapanırken eski listener'lar otomatik temizlenir:

```javascript
EventListenerManager.init({ debug: true });

// Modal içindeki bir butona listener ekle
const modalButton = document.querySelector('.modal button');
modalButton.addEventListener('click', handleModalClick);

// Modal kapanıp tekrar açıldığında, eski listener temizlenir ve yeni eklenir
// Bu sayede memory leak ve çoklu tetiklenme sorunları önlenir
```

### API Metodları

#### `init(config)`
Kütüphaneyi başlatır ve prototipleri yamalar.

```javascript
EventListenerManager.init({
  debug: true  // Debug modunu aktif eder (varsayılan: false)
});
```

#### `destroy()`
Prototipleri orijinal haline döndürür ve yamaları kaldırır.

```javascript
EventListenerManager.destroy();
```

#### `check(element)`
Belirli bir element üzerindeki kayıtlı listener'ları kontrol eder.

```javascript
const button = document.querySelector('#myButton');
button.addEventListener('click', handleClick);

const listeners = EventListenerManager.check(button);
console.log(listeners); // Kayıtlı listener'ları gösterir
```

#### `isSupported`
Ortamın desteklenip desteklenmediğini kontrol eder (SSR ortamlarında `false` döner).

```javascript
if (EventListenerManager.isSupported) {
  EventListenerManager.init();
}
```

## Nasıl Çalışır?

1. **Prototip Yamalama**: `EventTarget.prototype.addEventListener` ve `removeEventListener` metodları yamalanır
2. **Kayıt Sistemi**: Her element için WeakMap ile listener kayıtları tutulur
3. **Duplicate Kontrolü**: Aynı event tipi, capture modu ve listener fonksiyonu kombinasyonu kontrol edilir
4. **Otomatik Temizlik**: Modal gibi özel elementlerde (`closest('.modal')`) aynı event tipindeki eski listener'lar temizlenir

## Örnek Senaryolar

### React/Next.js ile Kullanım

```javascript
// _app.js veya app.js
import { useEffect } from 'react';
import EventListenerManager from 'listener-manager-pro';

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    EventListenerManager.init({ debug: process.env.NODE_ENV === 'development' });
    
    return () => {
      EventListenerManager.destroy();
    };
  }, []);

  return <Component {...pageProps} />;
}
```

### Vanilla JavaScript ile Kullanım

```javascript
// Uygulama başlangıcında
EventListenerManager.init({ debug: true });

// Artık tüm addEventListener çağrıları otomatik olarak korunur
document.getElementById('submitBtn').addEventListener('click', submitForm);
document.getElementById('submitBtn').addEventListener('click', submitForm); // Engellenir
```

## Notlar

- Kütüphane uygulamanın başlangıcında **bir kez** `init()` ile başlatılmalıdır
- SSR (Server-Side Rendering) ortamlarında güvenli şekilde çalışır (otomatik olarak devre dışı kalır)
- Debug modu production'da kapatılmalıdır (performans için)
- WeakMap kullanımı sayesinde garbage collection normal şekilde çalışır

## Lisans

MIT