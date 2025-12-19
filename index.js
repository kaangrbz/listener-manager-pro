/**
 * Advanced Event Listener Manager
 * Amacı: Uygulama genelinde (Map, Modal, Form vb.) aynı event'in birden fazla kez 
 * eklenmesini (duplicate) engellemek ve referans sorunlarını minimize etmek.
 */

const EventListenerManager = (function() {
    'use strict';
  
    // Ortam kontrolü: Eğer EventTarget prototipi yoksa (SSR gibi) işlemi durdur
    if (typeof window === 'undefined' || !EventTarget.prototype) {
      return { init: () => {}, isSupported: false };
    }
  
    const originalAdd = EventTarget.prototype.addEventListener;
    const originalRemove = EventTarget.prototype.removeEventListener;
    const registry = new WeakMap();
    
    let isInitialized = false;
    let debugMode = false;
  
    /**
     * Merkezi Log Yönetimi
     */
    function logger(type, message, ...args) {
      if (!debugMode) return;
      
      const prefix = '[EventListenerManager]';
      switch (type) {
        case 'warn':
          console.warn(`${prefix} ${message}`, ...args);
          break;
        case 'info':
          console.log(`${prefix} ${message}`, ...args);
          break;
        default:
          console.debug(`${prefix} ${message}`, ...args);
      }
    }
  
    /**
     * Listener'ı tanımlayan benzersiz bir anahtar oluşturur.
     */
    function getListenerId(listener) {
      if (typeof listener !== 'function') return 'non-function';
      return listener.name || listener.toString().slice(0, 100).replace(/\s+/g, ' ');
    }
  
    function getElementRegistry(target) {
      if (!registry.has(target)) {
        registry.set(target, new Map());
      }
      return registry.get(target);
    }
  
    /**
     * Çekirdek addEventListener mantığı
     */
    const patchedAddEventListener = function(type, listener, options) {
      if (typeof listener !== 'function' && typeof listener !== 'object') {
        return originalAdd.call(this, type, listener, options);
      }
  
      const elementEvents = getElementRegistry(this);
      const listenerId = getListenerId(listener);
      const capture = typeof options === 'boolean' ? options : !!(options && options.capture);
      const eventKey = `${type}-${capture}-${listenerId}`;
  
      // 1. DUPLICATE KONTROLÜ
      if (elementEvents.has(eventKey)) {
        const existing = elementEvents.get(eventKey);
        
        if (existing.listener === listener) {
          logger('warn', `Engelleyici: "${type}" event'i bu elemente zaten ekli. (ID: ${listenerId})`, this);
          return; 
        }
  
        logger('info', `Güncelleme: "${type}" için benzer bir listener bulundu, eskisi kaldırılıp yenisi ekleniyor.`, this);
        try {
          originalRemove.call(this, type, existing.listener, existing.options);
        } catch (e) {}
      }
  
      // 2. MODAL VE ÖZEL ALAN TEMİZLİĞİ
      const isSpecial = this.closest?.('.modal, [id*="Modal"], [id*="modal"], .map-container');
      
      if (isSpecial) {
        let cleanedCount = 0;
        for (let [key, entry] of elementEvents.entries()) {
          if (key.startsWith(`${type}-${capture}`)) {
            originalRemove.call(this, entry.type, entry.listener, entry.options);
            elementEvents.delete(key);
            cleanedCount++;
          }
        }
        if (cleanedCount > 0) {
          logger('info', `Modal Temizliği: "${type}" tipi için eski ${cleanedCount} adet listener temizlendi.`, this);
        }
      }
  
      originalAdd.call(this, type, listener, options);
      elementEvents.set(eventKey, { type, listener, options, id: listenerId });
    };
  
    /**
     * Çekirdek removeEventListener mantığı
     */
    const patchedRemoveEventListener = function(type, listener, options) {
      const elementEvents = registry.get(this);
      if (elementEvents) {
        const listenerId = getListenerId(listener);
        const capture = typeof options === 'boolean' ? options : !!(options && options.capture);
        const eventKey = `${type}-${capture}-${listenerId}`;
        
        if (elementEvents.has(eventKey)) {
          elementEvents.delete(eventKey);
        }
      }
      return originalRemove.call(this, type, listener, options);
    };
  
    /**
     * API: Kütüphaneyi başlatır ve prototipleri yamalar.
     * @param {Object} config - { debug: boolean }
     */
    const init = (config = {}) => {
      if (isInitialized) return;
      
      debugMode = !!config.debug;
      
      EventTarget.prototype.addEventListener = patchedAddEventListener;
      EventTarget.prototype.removeEventListener = patchedRemoveEventListener;
      
      isInitialized = true;
      logger('info', 'Yamalandı ve aktif.');
    };
  
    /**
     * API: Prototipleri orijinal haline döndürür.
     */
    const destroy = () => {
      EventTarget.prototype.addEventListener = originalAdd;
      EventTarget.prototype.removeEventListener = originalRemove;
      isInitialized = false;
      logger('info', 'Orijinal metodlar geri yüklendi.');
    };
  
    // NPM ve Browser uyumluluğu için export objesi
    const manager = {
      init,
      destroy,
      check: (el) => registry.get(el) ? Object.fromEntries(registry.get(el)) : null,
      isSupported: true
    };
  
    if (typeof window !== 'undefined') {
      window.EventListenerManager = manager;
    }
  
    return manager;
  })();
  
  // Modern Module Export
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = EventListenerManager;
  } else if (typeof define === 'function' && define.amd) {
    define([], () => EventListenerManager);
  }
  
  export default EventListenerManager;