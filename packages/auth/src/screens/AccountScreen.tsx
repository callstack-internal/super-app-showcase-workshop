import React, {useContext, useEffect, useState} from 'react';
import {Button, Pressable, StyleSheet, View} from 'react-native';
import {MD3Colors, Text} from 'react-native-paper';
import {
  TestStore,
  TestContext as TestContextSharedPackage,
  TestContextType,
} from 'shared-package';
import {useAuth} from '../contexts/AuthContext';
import {loadRemote} from '@module-federation/runtime';

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

const TestComponentContext = ({context}) => {
  const testContext: {bears: number; increasePopulation: () => void} =
    useContext(context);

  return (
    <View
      style={{
        alignItems: 'center',
      }}>
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
  const {signOut} = useAuth();
  const {
    bears: bearsZustandSharedPackage,
    increasePopulation: increasePopulationSharedLibrary,
  } = TestStore();
  const [zustandModuleHook, setZustandModuleHook] = useState(undefined);
  const [testContext, setTestContext] = useState(undefined);
  const {
    bears: bearsSharedPackageContext,
    increasePopulation: increasePopulationSharedPackageContext,
  }: TestContextType = useContext(TestContextSharedPackage);

  useEffect(() => {
    loadRemote('shared/TestStore')
      .then(module => {
        setZustandModuleHook(() => module.default);
      })
      .catch(e => {
        console.error('Failed to load TestStore:', e);
      });
  }, []);

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
    <View style={styles.container}>
      {testContext && <TestComponentContext context={testContext} />}
      <View
        style={{
          alignItems: 'center',
        }}>
        <Text>Test using React Context from shared package</Text>
        <Text>{`Number of bears: ${bearsSharedPackageContext}`}</Text>
        <Button
          title="Increase population"
          onPress={() => increasePopulationSharedPackageContext()}
        />
      </View>
      <View
        style={{
          alignItems: 'center',
        }}>
        <Text>Test using Zustand from a shared package</Text>
        <Text>
          {`Number of bears Zustand shared library package: ${bearsZustandSharedPackage}`}
        </Text>
        <Button
          title="Increase population"
          onPress={() => increasePopulationSharedLibrary()}
        />
      </View>

      {zustandModuleHook && (
        <TestComponentZustand zustandModuleHook={zustandModuleHook} />
      )}

      <Pressable style={styles.button} onPress={signOut}>
        <Text>Logout</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    backgroundColor: MD3Colors.primary90,
    padding: 16,
    borderRadius: 16,
  },
});

export default AccountScreen;
