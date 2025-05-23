import React from 'react';
import { createNativeBottomTabNavigator } from '@bottom-tabs/react-navigation';
import { MD3Colors } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import HomeNavigator from './HomeNavigator';
import ServicesNavigator from './ServicesNavigator';
import AccountNavigator from './AccountNavigator';
import AdoptaNavigator from './AdoptaNavigator';

export type TabsParamList = {
  HomeNavigator: undefined;
  ServicesNavigator: undefined;
  AccountNavigator: undefined;
  AdoptaNavigator: undefined
};

const homeIcon = Icon.getImageSourceSync('home', 24);
const compassIcon = Icon.getImageSourceSync('compass', 24);
const accountIcon = Icon.getImageSourceSync('account', 24);
const galleryIcon = Icon.getImageSourceSync('dog', 24);

const Tabs = createNativeBottomTabNavigator<TabsParamList>();

const TabsNavigator = () => {
  return (
    <Tabs.Navigator
      screenOptions={{
        tabBarStyle: {
          display: 'none',
        },
      }}
      translucent={false}
      tabBarActiveTintColor={MD3Colors.primary50}
      barTintColor={MD3Colors.primary95}>
      <Tabs.Screen
        name="HomeNavigator"
        component={HomeNavigator}
        options={{
          title: 'Home',
          tabBarIcon: () => homeIcon,
        }}
      />
      <Tabs.Screen
        name="ServicesNavigator"
        component={ServicesNavigator}
        options={{
          title: 'Services',
          tabBarIcon: () => compassIcon,
        }}
      />
      <Tabs.Screen
        name="AdoptaNavigator"
        component={AdoptaNavigator}
        options={{
          title: 'Adoption',
          tabBarIcon: () => galleryIcon,
        }}
      />
      <Tabs.Screen
        name="AccountNavigator"
        component={AccountNavigator}
        options={{
          title: 'Account',
          tabBarIcon: () => accountIcon,
        }}
      />
    </Tabs.Navigator>
  );
};

export default TabsNavigator;
