#import "LocationModule.h"
#import <CoreLocation/CoreLocation.h>

@interface LocationModule() <CLLocationManagerDelegate>
@property (nonatomic, strong) CLLocationManager *locationManager;
@property (nonatomic, strong) RCTPromiseResolveBlock locationResolver;
@property (nonatomic, strong) RCTPromiseRejectBlock locationRejecter;
@property (nonatomic, strong) RCTPromiseResolveBlock permissionResolver;
@property (nonatomic, strong) RCTPromiseRejectBlock permissionRejecter;
@end

@implementation LocationModule

RCT_EXPORT_MODULE()

- (instancetype)init {
  self = [super init];
  if (self) {
    _locationManager = [[CLLocationManager alloc] init];
    _locationManager.delegate = self;
    _locationManager.desiredAccuracy = kCLLocationAccuracyBest;
  }
  return self;
}

RCT_EXPORT_METHOD(requestLocationPermission:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
  self.permissionResolver = resolve;
  self.permissionRejecter = reject;

  CLAuthorizationStatus status = [CLLocationManager authorizationStatus];

  if (status == kCLAuthorizationStatusNotDetermined) {
    [self.locationManager requestWhenInUseAuthorization];
  } else {
    [self resolvePermissionStatus:status];
  }
}

RCT_EXPORT_METHOD(getCurrentLocation:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
  self.locationResolver = resolve;
  self.locationRejecter = reject;

  CLAuthorizationStatus status = [CLLocationManager authorizationStatus];

  if (status == kCLAuthorizationStatusAuthorizedWhenInUse ||
      status == kCLAuthorizationStatusAuthorizedAlways) {
    [self.locationManager startUpdatingLocation];
  } else {
    reject(@"PERMISSION_DENIED", @"Location permission not granted", nil);
  }
}

- (void)locationManager:(CLLocationManager *)manager didChangeAuthorizationStatus:(CLAuthorizationStatus)status {
  [self resolvePermissionStatus:status];
}

- (void)locationManager:(CLLocationManager *)manager didUpdateLocations:(NSArray<CLLocation *> *)locations {
  CLLocation *location = [locations lastObject];

  if (location && self.locationResolver) {
    NSDictionary *result = @{
      @"latitude": @(location.coordinate.latitude),
      @"longitude": @(location.coordinate.longitude),
      @"accuracy": @(location.horizontalAccuracy),
      @"timestamp": @([location.timestamp timeIntervalSince1970] * 1000)
    };

    self.locationResolver(result);
    self.locationResolver = nil;
    self.locationRejecter = nil;

    [self.locationManager stopUpdatingLocation];
  }
}

- (void)locationManager:(CLLocationManager *)manager didFailWithError:(NSError *)error {
  if (self.locationRejecter) {
    self.locationRejecter(@"LOCATION_ERROR", error.localizedDescription, error);
    self.locationResolver = nil;
    self.locationRejecter = nil;

    [self.locationManager stopUpdatingLocation];
  }
}

- (void)resolvePermissionStatus:(CLAuthorizationStatus)status {
  if (!self.permissionResolver) {
    return;
  }

  NSString *statusString;

  switch (status) {
    case kCLAuthorizationStatusAuthorizedWhenInUse:
    case kCLAuthorizationStatusAuthorizedAlways:
      statusString = @"granted";
      break;
    case kCLAuthorizationStatusDenied:
      statusString = @"denied";
      break;
    case kCLAuthorizationStatusRestricted:
      statusString = @"never_ask_again";
      break;
    default:
      statusString = @"denied";
      break;
  }

  self.permissionResolver(statusString);
  self.permissionResolver = nil;
  self.permissionRejecter = nil;
}

// Este método es requerido para los TurboModules
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
    return std::make_shared<facebook::react::NativeLocationModuleSpecJSI>(params);
}

@end
