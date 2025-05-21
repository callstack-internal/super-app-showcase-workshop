import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import NavBar from '../components/NavBar';
import AdoptaScreen from '../screens/AdoptaScreen';

export type AdoptaStackParamList = {
  Adopta: undefined;
};

const Adopta = createNativeStackNavigator<AdoptaStackParamList>();

const AdoptaNavigator = () => {
  return (
    <Adopta.Navigator
      screenOptions={{
        headerShown: false,
        header: NavBar,
      }}>
      <Adopta.Screen name="Adopta" component={AdoptaScreen} />
    </Adopta.Navigator>
  );
};

export default AdoptaNavigator;
