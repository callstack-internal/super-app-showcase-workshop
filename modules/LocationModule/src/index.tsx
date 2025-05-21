import NativeLocation, { LocationResult, PermissionStatus } from './NativeLocationModule';

const Location = {
  requestPermission: async (): Promise<PermissionStatus> => {
    return NativeLocation.requestLocationPermission();
  },

  getCurrentLocation: async (): Promise<LocationResult> => {
    return NativeLocation.getCurrentLocation();
  },
};

export default Location;
