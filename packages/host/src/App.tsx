import React, {useEffect, useState} from 'react';
import RNBootSplash from 'react-native-bootsplash';
import {NavigationContainer} from '@react-navigation/native';
import MainNavigator from './navigation/MainNavigator';
import SplashScreen from './components/SplashScreen';
import ErrorBoundary from './components/ErrorBoundary';
import {Button, SafeAreaView, Text, View} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {loadRemote} from '@module-federation/runtime';
import {
  TestStore,
  TestProvider as TestProviderSharedPackage,
} from 'shared-package';

const AuthProvider = React.lazy(() => import('auth/AuthProvider'));
const SignInScreen = React.lazy(() => import('auth/SignInScreen'));

const TestProvider = React.lazy(() => import('shared/TestProvider'));

const TestComponentZustand = ({zustandModuleHook}) => {
  const bears = zustandModuleHook(state => state.bears);
  const increase = zustandModuleHook(state => state.increasePopulation);

  return (
    <View
      style={{
        alignItems: 'center',
      }}>
      <Text>Test using Zustand preloaded hook from shared miniapp</Text>
      <Text>{`Number of bears: ${bears}`}</Text>
      <Button title="Increase population" onPress={() => increase()} />
    </View>
  );
};

const App = () => {
  const [zustandModuleHook, setZustandModuleHook] = useState(undefined);
  const {
    bears: bearsZustandSharedPackage,
    increasePopulation: increasePopulationSharedLibrary,
  } = TestStore();

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
    <ErrorBoundary name="AuthProvider">
      <React.Suspense fallback={<SplashScreen />}>
        <AuthProvider>
          {(authData: {isSignout: boolean; isLoading: boolean}) => {
            if (authData.isLoading) {
              return <SplashScreen />;
            }

            if (authData.isSignout) {
              return (
                <React.Suspense fallback={<SplashScreen />}>
                  <SignInScreen />
                </React.Suspense>
              );
            }

            return (
              <TestProvider>
                {(sharedData: {
                  bears: number;
                  increasePopulation: () => void;
                }) => {
                  return (
                    <TestProviderSharedPackage>
                      {(sharedDataTestProviderSharedPackage) => {
                        return (
                          <View style={{flex: 1}}>
                            <View
                              style={{
                                flex: 2,
                              }}>
                              <SafeAreaProvider>
                                <SafeAreaView
                                  style={{
                                    flex: 1,
                                  }}>
                                  <View
                                    style={{
                                      alignItems: 'center',
                                    }}>
                                    <Text>
                                      Test using provider (React Context) from
                                      shared miniapp
                                    </Text>
                                    <Text>
                                      {`Number of bears: ${sharedData?.bears}`}
                                    </Text>
                                    <Button
                                      title="Increase population"
                                      onPress={() =>
                                        sharedData.increasePopulation()
                                      }
                                    />
                                  </View>
                                    <View
                                        style={{
                                            alignItems: 'center',
                                        }}>
                                        <Text>
                                            Test using provider (React Context) from
                                            shared package
                                        </Text>
                                        <Text>
                                            {`Number of bears: ${sharedDataTestProviderSharedPackage?.bears}`}
                                        </Text>
                                        <Button
                                            title="Increase population"
                                            onPress={() =>
                                                sharedDataTestProviderSharedPackage.increasePopulation()
                                            }
                                        />
                                    </View>

                                  <View
                                    style={{
                                      alignItems: 'center',
                                    }}>
                                    <Text>
                                      Test using Zustand from a shared package
                                    </Text>
                                    <Text>
                                      {`Number of bears: ${bearsZustandSharedPackage}`}
                                    </Text>
                                    <Button
                                      title="Increase population"
                                      onPress={() =>
                                        increasePopulationSharedLibrary()
                                      }
                                    />
                                  </View>

                                  <TestComponentZustand
                                    zustandModuleHook={zustandModuleHook}
                                  />
                                </SafeAreaView>
                              </SafeAreaProvider>
                            </View>
                            <View
                              style={{
                                flex: 3,
                              }}>
                              <NavigationContainer
                                onReady={() => RNBootSplash.hide({fade: true})}>
                                <MainNavigator />
                              </NavigationContainer>
                            </View>
                          </View>
                        );
                      }}
                    </TestProviderSharedPackage>
                  );
                }}
              </TestProvider>
            );
          }}
        </AuthProvider>
      </React.Suspense>
    </ErrorBoundary>
  );
};

export default App;
