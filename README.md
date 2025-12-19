# Listener Manager Pro

A lightweight helper library that prevents duplicate event listeners and stabilizes dynamic UI elements like modals.

## Features

- ✅ **Duplicate Prevention**: Prevents the same event listener from being added multiple times to the same element
- ✅ **Modal Stabilization**: Automatically cleans up old listeners in dynamic elements like modals and map-containers
- ✅ **Prototype Patching**: Safely patches `EventTarget.prototype.addEventListener` and `removeEventListener` methods
- ✅ **SSR Compatibility**: Works safely in server-side rendering environments
- ✅ **Debug Mode**: Provides detailed log output during development
- ✅ **WeakMap Usage**: Reference management with WeakMap to prevent memory leaks

## Installation

```bash
yarn add listener-manager-pro
```

## Usage

### Basic Usage

```javascript
import EventListenerManager from 'listener-manager-pro';

// Initialize the library (call once at the start of your application)
EventListenerManager.init({ debug: true });

// Now normal addEventListener usage automatically prevents duplicates
const button = document.querySelector('#myButton');

button.addEventListener('click', handleClick); // ✅ First addition
button.addEventListener('click', handleClick); // ⚠️ Blocked (duplicate)
```

### Modal Scenario

Old listeners are automatically cleaned up when modals open and close:

```javascript
EventListenerManager.init({ debug: true });

// Add a listener to a button inside a modal
const modalButton = document.querySelector('.modal button');
modalButton.addEventListener('click', handleModalClick);

// When the modal closes and reopens, old listeners are cleaned up and new ones are added
// This prevents memory leaks and multiple trigger issues
```

### API Methods

#### `init(config)`
Initializes the library and patches the prototypes.

```javascript
EventListenerManager.init({
  debug: true  // Enables debug mode (default: false)
});
```

#### `destroy()`
Restores prototypes to their original state and removes patches.

```javascript
EventListenerManager.destroy();
```

#### `check(element)`
Checks registered listeners on a specific element.

```javascript
const button = document.querySelector('#myButton');
button.addEventListener('click', handleClick);

const listeners = EventListenerManager.check(button);
console.log(listeners); // Shows registered listeners
```

#### `isSupported`
Checks if the environment is supported (returns `false` in SSR environments).

```javascript
if (EventListenerManager.isSupported) {
  EventListenerManager.init();
}
```

## How It Works?

1. **Prototype Patching**: `EventTarget.prototype.addEventListener` and `removeEventListener` methods are patched
2. **Registry System**: Listener registrations are maintained for each element using WeakMap
3. **Duplicate Check**: The combination of event type, capture mode, and listener function is checked
4. **Automatic Cleanup**: Old listeners of the same event type are cleaned up in special elements like modals (`closest('.modal')`)

## Example Scenarios

### Usage with React/Next.js

```javascript
// _app.js or app.js
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

### Usage with Vanilla JavaScript

```javascript
// At application startup
EventListenerManager.init({ debug: true });

// Now all addEventListener calls are automatically protected
document.getElementById('submitBtn').addEventListener('click', submitForm);
document.getElementById('submitBtn').addEventListener('click', submitForm); // Blocked
```

## Notes

- The library should be initialized **once** with `init()` at the start of your application
- Works safely in SSR (Server-Side Rendering) environments (automatically disabled)
- Debug mode should be turned off in production (for performance)
- Thanks to WeakMap usage, garbage collection works normally

## License

MIT
