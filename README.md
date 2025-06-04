# Compartiendo Estado Entre Mini Apps y Host

Este documento explica diferentes enfoques para compartir estado entre mini apps (micro-frontends) y la aplicación host en una arquitectura de Super App en React Native, basado en la implementación en el POC.

## DEMO

https://github.com/user-attachments/assets/2eb5489f-c71a-48f3-b621-3b34a742e64e

## Descripción del Video

En el video, he dividido la pantalla en dos secciones: en la parte superior se muestra el código del host con componentes simples que implementan diferentes formas de compartir estado. Para demostrar cómo funciona el compartimiento de estado entre mini apps y el host (aunque funcionaría de manera similar entre mini apps), he modificado la pantalla de cuenta de la mini app de autenticación para utilizar estos diferentes enfoques.

El primer ejemplo muestra un proveedor que utiliza un contexto de React importado directamente desde la mini app compartida (una nueva mini app) mediante:

```typescript
const TestProvider = React.lazy(() => import('shared/TestProvider'));
```

En el host, este proveedor envuelve la mini app de autenticación. Luego, en la pantalla AccountScreen de la mini app de autenticación, utilizamos la función `loadRemote` para cargar el contexto que está siendo utilizado por el proveedor en el host. Esta mini app puede acceder tanto al estado del contexto como a las funciones exportadas para modificarlo.

El segundo ejemplo, "Test using provider (React Context) from shared package", utiliza una librería compartida (no una mini app). El enfoque es similar al anterior: importamos el proveedor desde el paquete compartido y lo utilizamos para envolver la mini app desde el host. La diferencia principal es que en la pantalla AccountScreen de la mini app de autenticación, importamos el contexto directamente desde la librería compartida.

En el tercer ejemplo, "Testing using Zustand from a shared package", la implementación es más simple. En la librería compartida, creamos un store de Zustand que define el estado y sus funciones de mutación. Luego, simplemente importamos este store tanto en el host como en la mini app, sin necesidad de envolver la mini app con ningún proveedor.

El último ejemplo, "Test using Zustand preloaded hook from shared miniapp", demuestra cómo importar un store desde la nueva mini app compartida (no desde el paquete compartido) y utilizarlo tanto en el host como en la pantalla AccountScreen de la mini app de autenticación.

## Descripción General

La arquitectura Super App demuestra cuatro enfoques diferentes para compartir estado entre la aplicación host y las mini apps:

1. React Context desde Mini App Compartida
2. React Context desde Paquete Compartido
3. Zustand desde Paquete Compartido
4. Zustand desde Mini App Compartida

Cada enfoque tiene sus propios casos de uso y detalles de implementación. Exploremos cada uno en detalle.

## Detalles de Implementación

### 1. React Context desde Mini App Compartida

Este enfoque utiliza un proveedor de React Context desde una mini app compartida. La mini app compartida exporta un contexto y un proveedor que puede ser utilizado tanto por el host como por otras mini apps.

#### Implementación de Mini App Compartida
```typescript
// packages/shared/src/contexts/TestContext.ts
import { createContext } from 'react';

export type TestContextType = {
  bears: number;
  increasePopulation: () => void;
};

export const TestContext = createContext<TestContextType>({
  bears: 0,
  increasePopulation: () => {},
});

// packages/shared/src/providers/TestProvider.tsx
import React, { useState } from 'react';
import { TestContext } from '../contexts/TestContext';

export const TestProvider = ({ children }) => {
  const [bears, setBears] = useState(0);

  const increasePopulation = () => {
    setBears(prev => prev + 1);
  };

  return (
    <TestContext.Provider value={{ bears, increasePopulation }}>
      {children}
    </TestContext.Provider>
  );
};
```

#### Implementación del Host
```typescript
// packages/host/src/App.tsx
import React from 'react';
const TestProvider = React.lazy(() => import('shared/TestProvider'));

// En el componente App
<TestProvider>
  {(sharedData) => {
    return (
      <View style={{ alignItems: 'center' }}>
        <Text>Prueba usando proveedor (React Context) desde mini app compartida</Text>
        <Text>{`Número de osos: ${sharedData?.bears}`}</Text>
        <Button
          title="Aumentar población"
          onPress={() => sharedData.increasePopulation()}
        />
        <MiniApp />
      </View>
    );
  }}
</TestProvider>
```

#### Implementación de Mini App
```typescript
// packages/auth/src/screens/AccountScreen.tsx
import React, { useContext, useEffect, useState } from 'react';
import { loadRemote } from '@module-federation/runtime';

const TestComponentContext = ({ context }) => {
  const testContext = useContext(context);

  return (
    <View style={{ alignItems: 'center' }}>
      <Text>Prueba usando React Context precargado desde mini app compartida</Text>
      <Text>{`Número de osos: ${testContext.bears}`}</Text>
      <Button
        title="Aumentar población"
        onPress={() => testContext.increasePopulation()}
      />
    </View>
  );
};

const AccountScreen = () => {
  const [testContext, setTestContext] = useState(undefined);

  useEffect(() => {
    loadRemote('shared/TestContext')
      .then(module => {
        setTestContext(() => module.default);
      })
      .catch(e => {
        console.error('Error al cargar TestContext:', e);
      });
  }, []);

  return (
    <View>
      {testContext && <TestComponentContext context={testContext} />}
      {/* Resto del componente */}
    </View>
  );
};
```

### 2. React Context desde Paquete Compartido

Este enfoque utiliza un React Context desde un paquete compartido que puede ser importado directamente tanto por el host como por las mini apps.

#### Implementación del Paquete Compartido
```typescript
// packages/shared-package/src/contexts/TestContext.ts
import { createContext } from 'react';

export type TestContextType = {
  bears: number;
  increasePopulation: () => void;
};

export const TestContext = createContext<TestContextType>({
  bears: 0,
  increasePopulation: () => {},
});

// packages/shared-package/src/providers/TestProvider.tsx
import React, { useState } from 'react';
import { TestContext } from '../contexts/TestContext';

export const TestProvider = ({ children }) => {
  const [bears, setBears] = useState(0);

  const increasePopulation = () => {
    setBears(prev => prev + 1);
  };

  return (
    <TestContext.Provider value={{ bears, increasePopulation }}>
      {children}
    </TestContext.Provider>
  );
};
```

#### Implementación del Host
```typescript
// packages/host/src/App.tsx
import { TestProvider as TestProviderSharedPackage } from 'shared-package';

// En el componente App
<TestProviderSharedPackage>
  {(sharedDataTestProviderSharedPackage) => {
    return (
      <View style={{ alignItems: 'center' }}>
        <Text>Prueba usando proveedor (React Context) desde paquete compartido</Text>
        <Text>{`Número de osos: ${sharedDataTestProviderSharedPackage?.bears}`}</Text>
        <Button
          title="Aumentar población"
          onPress={() => sharedDataTestProviderSharedPackage.increasePopulation()}
        />
        <MiniApp />
      </View>
    );
  }}
</TestProviderSharedPackage>
```

#### Implementación de Mini App
```typescript
// packages/auth/src/screens/AccountScreen.tsx
import { TestContext as TestContextSharedPackage } from 'shared-package';

const AccountScreen = () => {
  const { bears, increasePopulation } = useContext(TestContextSharedPackage);

  return (
    <View style={{ alignItems: 'center' }}>
      <Text>Prueba usando React Context desde paquete compartido</Text>
      <Text>{`Número de osos: ${bears}`}</Text>
      <Button title="Aumentar población" onPress={increasePopulation} />
    </View>
  );
};
```

### 3. Zustand desde Paquete Compartido

Este enfoque utiliza Zustand para la gestión de estado a través de un paquete compartido. Zustand es particularmente útil para la gestión de estado global ya que no requiere envolver componentes en proveedores.

#### Implementación del Paquete Compartido
```typescript
// packages/shared-package/src/store/TestStore.ts
import create from 'zustand';

interface BearState {
  bears: number;
  increasePopulation: () => void;
}

export const TestStore = create<BearState>((set) => ({
  bears: 0,
  increasePopulation: () => set((state) => ({ bears: state.bears + 1 })),
}));
```

#### Implementación del Host
```typescript
// packages/host/src/App.tsx
import { TestStore } from 'shared-package';

const App = () => {
  const { bears, increasePopulation } = TestStore();

  return (
    <View style={{ alignItems: 'center' }}>
      <Text>Prueba usando Zustand desde un paquete compartido</Text>
      <Text>{`Número de osos: ${bears}`}</Text>
      <Button title="Aumentar población" onPress={increasePopulation} />
    </View>
  );
};
```

#### Implementación de Mini App
```typescript
// packages/auth/src/screens/AccountScreen.tsx
import { TestStore } from 'shared-package';

const AccountScreen = () => {
  const { bears, increasePopulation } = TestStore();

  return (
    <View style={{ alignItems: 'center' }}>
      <Text>Prueba usando Zustand desde un paquete compartido</Text>
      <Text>{`Número de osos: ${bears}`}</Text>
      <Button title="Aumentar población" onPress={increasePopulation} />
    </View>
  );
};
```

### 4. Zustand desde Mini App Compartida

Este enfoque utiliza el store de Zustand desde una mini app compartida, cargado dinámicamente usando Module Federation.

#### Implementación de Mini App Compartida
```typescript
// packages/shared/src/store/TestStore.ts
import create from 'zustand';

interface BearState {
  bears: number;
  increasePopulation: () => void;
}

const useStore = create<BearState>((set) => ({
  bears: 0,
  increasePopulation: () => set((state) => ({ bears: state.bears + 1 })),
}));

export default useStore;
```

#### Implementación del Host
```typescript
// packages/host/src/App.tsx
import React, { useEffect, useState } from 'react';
import { loadRemote } from '@module-federation/runtime';

const TestComponentZustand = ({ zustandModuleHook }) => {
  const bears = zustandModuleHook(state => state.bears);
  const increase = zustandModuleHook(state => state.increasePopulation);

  return (
    <View style={{ alignItems: 'center' }}>
      <Text>Prueba usando hook Zustand precargado desde mini app compartida</Text>
      <Text>{`Número de osos: ${bears}`}</Text>
      <Button title="Aumentar población" onPress={increase} />
    </View>
  );
};

const App = () => {
  const [zustandModuleHook, setZustandModuleHook] = useState(undefined);

  useEffect(() => {
    loadRemote('shared/TestStore')
      .then(module => {
        setZustandModuleHook(() => module.default);
      })
      .catch(e => {
        console.error('Error al cargar TestStore:', e);
      });
  }, []);

  return (
    <View>
      {zustandModuleHook && (
        <TestComponentZustand zustandModuleHook={zustandModuleHook} />
      )}
    </View>
  );
};
```

#### Implementación de Mini App
```typescript
// packages/auth/src/screens/AccountScreen.tsx
import React, { useEffect, useState } from 'react';
import { loadRemote } from '@module-federation/runtime';

const TestComponentZustand = ({ zustandModuleHook }) => {
  const bears = zustandModuleHook(state => state.bears);
  const increase = zustandModuleHook(state => state.increasePopulation);

  return (
    <View style={{ alignItems: 'center' }}>
      <Text>Prueba usando hook Zustand precargado desde mini app compartida</Text>
      <Text>{`Número de osos: ${bears}`}</Text>
      <Button title="Aumentar población" onPress={increase} />
    </View>
  );
};

const AccountScreen = () => {
  const [zustandModuleHook, setZustandModuleHook] = useState(undefined);

  useEffect(() => {
    loadRemote('shared/TestStore')
      .then(module => {
        setZustandModuleHook(() => module.default);
      })
      .catch(e => {
        console.error('Error al cargar TestStore:', e);
      });
  }, []);

  return (
    <View>
      {zustandModuleHook && (
        <TestComponentZustand zustandModuleHook={zustandModuleHook} />
      )}
    </View>
  );
};
```

## Alineación de Dependencias

Para asegurar un correcto compartimiento de estado entre mini apps y el host, ciertas dependencias necesitan estar alineadas. Esto se hace a través de la configuración del paquete SDK.

### Configuración del SDK

```typescript
// packages/sdk/lib/dependencies.json
{
  "shared": {
    "react": "19.0.0",
    "react-native": "0.78.2",
    "zustand": "5.0.5"
  }
}

// packages/sdk/lib/sharedDeps.js
module.exports = {
  shared: {
    react: {
      singleton: true,
      requiredVersion: '19.0.0',
      eager: true
    },
    'react-native': {
      singleton: true,
      requiredVersion: '0.78.2',
      eager: true
    },
    zustand: {
      requiredVersion: '5.0.5',
    }
  }
};
```

### Configuración de Rspack

Cada mini app y el host necesitan estar configurados para usar estas dependencias compartidas:

```javascript
// packages/host/rspack.config.mjs
import { sharedDeps } from 'super-app-showcase-sdk';
```

## React.lazy vs loadRemote

Hay dos formas diferentes de importar módulos en la arquitectura Super App:

### React.lazy
```typescript
const TestProvider = React.lazy(() => import('shared/TestProvider'));
```

Usado para:
- Componentes React que necesitan ser renderizados
- Componentes que son parte del árbol de componentes React
- Cuando necesitas las características de code splitting y suspense de React

### loadRemote
```typescript
loadRemote('shared/TestStore')
  .then(module => {
    setZustandModuleHook(() => module.default);
  });
```

Usado para:
- Módulos no-React (como stores de Zustand)
- Cuando necesitas acceder directamente a las exportaciones del módulo
- Cuando necesitas más control sobre el proceso de carga
- Cuando necesitas manejar la carga del módulo de forma asíncrona

### ¿Por qué no usar React.lazy para todo?

1. **Diferentes Casos de Uso**:
   - `React.lazy` está específicamente diseñado para componentes React y funciona con Suspense
   - `loadRemote` es más general y funciona con cualquier tipo de módulo

2. **Requisitos de Module Federation**:
   - `loadRemote` es parte de la API de runtime de Module Federation
   - Proporciona mejor control sobre la carga de módulos y manejo de errores
   - Está diseñado para trabajar con el sistema de contenedores de Module Federation

3. **Gestión de Estado**:
   - Para stores de Zustand, necesitamos acceso directo a la instancia del store
   - `loadRemote` nos da acceso directo a las exportaciones del store

Ejemplo de por qué usamos `loadRemote` para Zustand:
```typescript
// Esto no funcionaría bien con React.lazy
const [zustandModuleHook, setZustandModuleHook] = useState(undefined);

useEffect(() => {
  loadRemote('shared/TestStore')
    .then(module => {
      // Obtenemos acceso directo al store
      setZustandModuleHook(() => module.default);
    })
    .catch(e => {
      console.error('Error al cargar TestStore:', e);
    });
}, []);

// Usando el store
const TestComponentZustand = ({ zustandModuleHook }) => {
  const bears = zustandModuleHook(state => state.bears);
  const increase = zustandModuleHook(state => state.increasePopulation);
  // ...
};
```

## Consideraciones Importantes

1. **Host como Contexto Global**: La aplicación host crea el contexto JavaScript global. Esto significa que cuando se usa Zustand dentro de mini apps dentro del host, si Zustand está correctamente configurado como compartido y eager, todas las mini apps tendrán acceso al mismo estado.

2. **Module Federation**: La implementación se basa en Module Federation para compartir código entre el host y las mini apps. La función `loadRemote` de `@module-federation/runtime` se usa para cargar dinámicamente módulos de otras mini apps.

3. **Paquete Compartido vs Mini App**: Puedes crear un paquete compartido (no necesariamente una mini app) que contenga el código del store que quieres compartir entre mini apps y el host. Todos los componentes pueden importar este paquete y compartir el estado usando el mismo código.

## Mejores Prácticas

1. Elige el enfoque de compartimiento de estado basado en tus necesidades específicas:
   - Usa React Context cuando necesites compartir estado con un alcance específico
   - Usa Zustand cuando necesites una solución de gestión de estado global

2. Considera las implicaciones de rendimiento de cada enfoque.

3. Mantén el estado compartido mínimo y bien documentado para mantener la claridad del código y prevenir problemas de gestión de estado.

4. **Gestión de Dependencias**:
   - Mantén las dependencias compartidas alineadas en todas las mini apps y el host
   - Usa el paquete SDK para gestionar las dependencias compartidas
   - Asegúrate de que todas las mini apps usen las mismas versiones de dependencias críticas

## Repositorio de Ejemplo

La implementación completa se puede encontrar en el repositorio:
[super-app-showcase-workshop](https://github.com/callstack-internal/super-app-showcase-workshop/tree/poc/shared-mini-app)

---

# State Sharing Between Mini Apps and Host

This document explains different approaches to share state between mini apps (micro-frontends) and the host application in a React Native Super App architecture, based on the implementation in the POC.

## DEMO

https://github.com/user-attachments/assets/2eb5489f-c71a-48f3-b621-3b34a742e64e

## Video Description

In the video, I've divided the screen into two sections: the top section shows the host code with simple components implementing different state sharing approaches. To demonstrate how state sharing works between mini apps and the host (though it would work similarly between mini apps), I've modified the account screen of the authentication mini app to use these different approaches.

The first example shows a provider using a React context imported directly from the shared mini app (a new mini app) using:

```typescript
const TestProvider = React.lazy(() => import('shared/TestProvider'));
```

In the host, this provider wraps the authentication mini app. Then, in the AccountScreen of the authentication mini app, we use the `loadRemote` function to load the context being used by the provider in the host. This mini app can access both the context state and its exported functions to modify it.

The second example, "Test using provider (React Context) from shared package", uses a shared library (not a mini app). The approach is similar to the previous one: we import the provider from the shared package and use it to wrap the mini app from the host. The main difference is that in the AccountScreen of the authentication mini app, we import the context directly from the shared library.

In the third example, "Testing using Zustand from a shared package", the implementation is simpler. In the shared library, we create a Zustand store that defines the state and its mutation functions. Then, we simply import this store in both the host and the mini app, without needing to wrap the mini app with any provider.

The last example, "Test using Zustand preloaded hook from shared miniapp", demonstrates how to import a store from the new shared mini app (not from the shared package) and use it in both the host and the AccountScreen of the authentication mini app.

## Overview

The Super App architecture demonstrates four different approaches to share state between the host application and mini apps:

1. React Context from Shared Mini App
2. React Context from Shared Package
3. Zustand from Shared Package
4. Zustand from Shared Mini App

Each approach has its own use cases and implementation details. Let's explore each one in detail.

## Implementation Details

### 1. React Context from Shared Mini App

This approach uses a React Context provider from a shared mini app. The shared mini app exports a context and provider that can be used by both the host and other mini apps.

#### Shared Mini App Implementation
```typescript
// packages/shared/src/contexts/TestContext.ts
import { createContext } from 'react';

export type TestContextType = {
  bears: number;
  increasePopulation: () => void;
};

export const TestContext = createContext<TestContextType>({
  bears: 0,
  increasePopulation: () => {},
});

// packages/shared/src/providers/TestProvider.tsx
import React, { useState } from 'react';
import { TestContext } from '../contexts/TestContext';

export const TestProvider = ({ children }) => {
  const [bears, setBears] = useState(0);

  const increasePopulation = () => {
    setBears(prev => prev + 1);
  };

  return (
    <TestContext.Provider value={{ bears, increasePopulation }}>
      {children}
    </TestContext.Provider>
  );
};
```

#### Host Implementation
```typescript
// packages/host/src/App.tsx
import React from 'react';
const TestProvider = React.lazy(() => import('shared/TestProvider'));

// In the App component
<TestProvider>
  {(sharedData) => {
    return (
      <View style={{ alignItems: 'center' }}>
        <Text>Test using provider (React Context) from shared miniapp</Text>
        <Text>{`Number of bears: ${sharedData?.bears}`}</Text>
        <Button
          title="Increase population"
          onPress={() => sharedData.increasePopulation()}
        />
        <MiniApp />
      </View>
    );
  }}
</TestProvider>
```

#### Mini App Implementation
```typescript
// packages/auth/src/screens/AccountScreen.tsx
import React, { useContext, useEffect, useState } from 'react';
import { loadRemote } from '@module-federation/runtime';

const TestComponentContext = ({ context }) => {
  const testContext = useContext(context);

  return (
    <View style={{ alignItems: 'center' }}>
      <Text>Test using React Context preloaded from shared miniapp</Text>
      <Text>{`Number of bears: ${testContext.bears}`}</Text>
      <Button
        title="Increase population"
        onPress={() => testContext.increasePopulation()}
      />
    </View>
  );
};

const AccountScreen = () => {
  const [testContext, setTestContext] = useState(undefined);

  useEffect(() => {
    loadRemote('shared/TestContext')
      .then(module => {
        setTestContext(() => module.default);
      })
      .catch(e => {
        console.error('Failed to load TestContext:', e);
      });
  }, []);

  return (
    <View>
      {testContext && <TestComponentContext context={testContext} />}
      {/* Rest of the component */}
    </View>
  );
};
```

### 2. React Context from Shared Package

This approach uses a React Context from a shared package that can be imported directly by both the host and mini apps.

#### Shared Package Implementation
```typescript
// packages/shared-package/src/contexts/TestContext.ts
import { createContext } from 'react';

export type TestContextType = {
  bears: number;
  increasePopulation: () => void;
};

export const TestContext = createContext<TestContextType>({
  bears: 0,
  increasePopulation: () => {},
});

// packages/shared-package/src/providers/TestProvider.tsx
import React, { useState } from 'react';
import { TestContext } from '../contexts/TestContext';

export const TestProvider = ({ children }) => {
  const [bears, setBears] = useState(0);

  const increasePopulation = () => {
    setBears(prev => prev + 1);
  };

  return (
    <TestContext.Provider value={{ bears, increasePopulation }}>
      {children}
    </TestContext.Provider>
  );
};
```

#### Host Implementation
```typescript
// packages/host/src/App.tsx
import { TestProvider as TestProviderSharedPackage } from 'shared-package';

// In the App component
<TestProviderSharedPackage>
  {(sharedDataTestProviderSharedPackage) => {
    return (
      <View style={{ alignItems: 'center' }}>
        <Text>Test using provider (React Context) from shared package</Text>
        <Text>{`Number of bears: ${sharedDataTestProviderSharedPackage?.bears}`}</Text>
        <Button
          title="Increase population"
          onPress={() => sharedDataTestProviderSharedPackage.increasePopulation()}
        />
        <MiniApp />
      </View>
    );
  }}
</TestProviderSharedPackage>
```

#### Mini App Implementation
```typescript
// packages/auth/src/screens/AccountScreen.tsx
import { TestContext as TestContextSharedPackage } from 'shared-package';

const AccountScreen = () => {
  const { bears, increasePopulation } = useContext(TestContextSharedPackage);

  return (
    <View style={{ alignItems: 'center' }}>
      <Text>Test using React Context from shared package</Text>
      <Text>{`Number of bears: ${bears}`}</Text>
      <Button title="Increase population" onPress={increasePopulation} />
    </View>
  );
};
```

### 3. Zustand from Shared Package

This approach uses Zustand for state management through a shared package. Zustand is particularly useful for global state management as it doesn't require wrapping components in providers.

#### Shared Package Implementation
```typescript
// packages/shared-package/src/store/TestStore.ts
import create from 'zustand';

interface BearState {
  bears: number;
  increasePopulation: () => void;
}

export const TestStore = create<BearState>((set) => ({
  bears: 0,
  increasePopulation: () => set((state) => ({ bears: state.bears + 1 })),
}));
```

#### Host Implementation
```typescript
// packages/host/src/App.tsx
import { TestStore } from 'shared-package';

const App = () => {
  const { bears, increasePopulation } = TestStore();

  return (
    <View style={{ alignItems: 'center' }}>
      <Text>Test using Zustand from a shared package</Text>
      <Text>{`Number of bears: ${bears}`}</Text>
      <Button title="Increase population" onPress={increasePopulation} />
    </View>
  );
};
```

#### Mini App Implementation
```typescript
// packages/auth/src/screens/AccountScreen.tsx
import { TestStore } from 'shared-package';

const AccountScreen = () => {
  const { bears, increasePopulation } = TestStore();

  return (
    <View style={{ alignItems: 'center' }}>
      <Text>Test using Zustand from a shared package</Text>
      <Text>{`Number of bears: ${bears}`}</Text>
      <Button title="Increase population" onPress={increasePopulation} />
    </View>
  );
};
```

### 4. Zustand from Shared Mini App

This approach uses Zustand store from a shared mini app, loaded dynamically using Module Federation.

#### Shared Mini App Implementation
```typescript
// packages/shared/src/store/TestStore.ts
import create from 'zustand';

interface BearState {
  bears: number;
  increasePopulation: () => void;
}

const useStore = create<BearState>((set) => ({
  bears: 0,
  increasePopulation: () => set((state) => ({ bears: state.bears + 1 })),
}));

export default useStore;
```

#### Host Implementation
```typescript
// packages/host/src/App.tsx
import React, { useEffect, useState } from 'react';
import { loadRemote } from '@module-federation/runtime';

const TestComponentZustand = ({ zustandModuleHook }) => {
  const bears = zustandModuleHook(state => state.bears);
  const increase = zustandModuleHook(state => state.increasePopulation);

  return (
    <View style={{ alignItems: 'center' }}>
      <Text>Test using Zustand preloaded hook from shared miniapp</Text>
      <Text>{`Number of bears: ${bears}`}</Text>
      <Button title="Increase population" onPress={increase} />
    </View>
  );
};

const App = () => {
  const [zustandModuleHook, setZustandModuleHook] = useState(undefined);

  useEffect(() => {
    loadRemote('shared/TestStore')
      .then(module => {
        setZustandModuleHook(() => module.default);
      })
      .catch(e => {
        console.error('Failed to load TestStore:', e);
      });
  }, []);

  return (
    <View>
      {zustandModuleHook && (
        <TestComponentZustand zustandModuleHook={zustandModuleHook} />
      )}
    </View>
  );
};
```

#### Mini App Implementation
```typescript
// packages/auth/src/screens/AccountScreen.tsx
import React, { useEffect, useState } from 'react';
import { loadRemote } from '@module-federation/runtime';

const TestComponentZustand = ({ zustandModuleHook }) => {
  const bears = zustandModuleHook(state => state.bears);
  const increase = zustandModuleHook(state => state.increasePopulation);

  return (
    <View style={{ alignItems: 'center' }}>
      <Text>Test using Zustand preloaded hook from shared miniapp</Text>
      <Text>{`Number of bears: ${bears}`}</Text>
      <Button title="Increase population" onPress={increase} />
    </View>
  );
};

const AccountScreen = () => {
  const [zustandModuleHook, setZustandModuleHook] = useState(undefined);

  useEffect(() => {
    loadRemote('shared/TestStore')
      .then(module => {
        setZustandModuleHook(() => module.default);
      })
      .catch(e => {
        console.error('Failed to load TestStore:', e);
      });
  }, []);

  return (
    <View>
      {zustandModuleHook && (
        <TestComponentZustand zustandModuleHook={zustandModuleHook} />
      )}
    </View>
  );
};
```

## Dependency Alignment

To ensure proper state sharing between mini apps and the host, certain dependencies need to be aligned. This is done through the SDK package configuration.

### SDK Configuration

```typescript
// packages/sdk/lib/dependencies.json
{
  "shared": {
    "react": "19.0.0",
    "react-native": "0.78.2",
    "zustand": "5.0.5"
  }
}

// packages/sdk/lib/sharedDeps.js
module.exports = {
  shared: {
    react: {
      singleton: true,
      requiredVersion: '19.0.0',
      eager: true
    },
    'react-native': {
      singleton: true,
      requiredVersion: '0.78.2',
      eager: true
    },
    zustand: {
      requiredVersion: '5.0.5',
    }
  }
};
```

### Rspack Configuration

Each mini app and the host need to be configured to use these shared dependencies:

```javascript
// packages/host/rspack.config.mjs
import { sharedDeps } from 'super-app-showcase-sdk';
```

## React.lazy vs loadRemote

There are two different ways to import modules in the Super App architecture:

### React.lazy
```typescript
const TestProvider = React.lazy(() => import('shared/TestProvider'));
```

Used for:
- React components that need to be rendered
- Components that are part of the React component tree
- When you need React's built-in code splitting and suspense features

### loadRemote
```typescript
loadRemote('shared/TestStore')
  .then(module => {
    setZustandModuleHook(() => module.default);
  });
```

Used for:
- Non-React modules (like Zustand stores)
- When you need to access the module's exports directly
- When you need more control over the loading process
- When you need to handle the module loading asynchronously

### Why Not Use React.lazy for Everything?

1. **Different Use Cases**:
   - `React.lazy` is specifically designed for React components and works with React's Suspense
   - `loadRemote` is more general-purpose and works with any module type

2. **Module Federation Requirements**:
   - `loadRemote` is part of Module Federation's runtime API
   - It provides better control over module loading and error handling
   - It's designed to work with the Module Federation container system

3. **State Management**:
   - For Zustand stores, we need direct access to the store instance
   - `loadRemote` gives us direct access to the store's exports

Example of why we use `loadRemote` for Zustand:
```typescript
// This wouldn't work well with React.lazy
const [zustandModuleHook, setZustandModuleHook] = useState(undefined);

useEffect(() => {
  loadRemote('shared/TestStore')
    .then(module => {
      // We get direct access to the store
      setZustandModuleHook(() => module.default);
    })
    .catch(e => {
      console.error('Failed to load TestStore:', e);
    });
}, []);

// Using the store
const TestComponentZustand = ({ zustandModuleHook }) => {
  const bears = zustandModuleHook(state => state.bears);
  const increase = zustandModuleHook(state => state.increasePopulation);
  // ...
};
```

## Important Considerations

1. **Host as Global Context**: The host application creates the global JavaScript context. This means that when using Zustand within mini apps inside the host, if Zustand is properly configured as shared and eager, all mini apps will have access to the same state.

2. **Module Federation**: The implementation relies on Module Federation to share code between the host and mini apps. The `loadRemote` function from `@module-federation/runtime` is used to dynamically load modules from other mini apps.

3. **Shared Package vs Mini App**: You can create a shared package (not necessarily a mini app) containing the store code that you want to share between mini apps and the host. All components can import this package and share the state using the same code.

## Best Practices

1. Choose the state sharing approach based on your specific needs:
   - Use React Context when you need to share state with a specific scope
   - Use Zustand when you need a global state management solution

2. Consider the performance implications of each approach.

3. Keep shared state minimal and well-documented to maintain code clarity and prevent state management issues.

4. **Dependency Management**:
   - Keep shared dependencies aligned across all mini apps and the host
   - Use the SDK package to manage shared dependencies
   - Ensure all mini apps use the same versions of critical dependencies

## Example Repository

The complete implementation can be found in the repository:
[super-app-showcase-workshop](https://github.com/callstack-internal/super-app-showcase-workshop/tree/poc/shared-mini-app)
