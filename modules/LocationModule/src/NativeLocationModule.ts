import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

// Definimos el tipo de resultado que devolverá nuestro método
export type LocationResult = {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
};

export type PermissionStatus = 'granted' | 'denied' | 'never_ask_again';

// Definimos la interfaz que extiende de TurboModule
export interface Spec extends TurboModule {
  // Método para solicitar permisos de ubicación
  requestLocationPermission(): Promise<PermissionStatus>;

  // Método para obtener la ubicación actual
  getCurrentLocation(): Promise<LocationResult>;
}

// Registramos el módulo con el TurboModuleRegistry
export default TurboModuleRegistry.getEnforcing<Spec>('LocationModule');
