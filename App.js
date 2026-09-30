import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppSettingsProvider, useAppSettings } from './src/context/AppSettingsContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { BluetoothProvider } from './src/context/BluetoothContext';
import Principal from './src/Telas/Principal';
import Tela1 from './src/Telas/Tela1';
import Tela2 from './src/Telas/Tela2';
import Tela3 from './src/Telas/Tela3';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function LoadingScreen() {
  const { theme, t } = useAppSettings();

  return (
    <View style={[styles.loading, { backgroundColor: theme.background }]}>
      <ActivityIndicator size="large" color={theme.accent} />
      <Text style={[styles.loadingText, { color: theme.textMuted }]}>
        {t('common.loading')}
      </Text>
    </View>
  );
}

function TabsNavigator() {
  const { theme, t } = useAppSettings();

  const icons = {
    Profile: ['person-outline', 'person-outline'],
    Connections: ['bluetooth', 'bluetooth-outline'],
    Settings: ['settings-outline', 'settings-outline'],
  };

  return (
    <Tab.Navigator
      initialRouteName="Connections"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarHideOnKeyboard: true,
        sceneStyle: { backgroundColor: theme.background },
        tabBarActiveTintColor: '#1780FF',
        tabBarInactiveTintColor: '#D0D9EA',
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
        tabBarStyle: styles.tabBar,
        tabBarIcon: ({ focused, color }) => {
          const [activeIcon, inactiveIcon] = icons[route.name];
          return (
            <View style={styles.tabIconWrap}>
              <Ionicons
                name={focused ? activeIcon : inactiveIcon}
                size={24}
                color={color}
              />
              {focused ? <View style={styles.activeIndicator} /> : null}
            </View>
          );
        },
      })}
    >
      <Tab.Screen
        name="Connections"
        component={Tela1}
        options={{ tabBarLabel: t('tabs.connections') }}
      />
      <Tab.Screen
        name="Profile"
        component={Tela2}
        options={{ tabBarLabel: t('tabs.profile') }}
      />
      <Tab.Screen
        name="Settings"
        component={Tela3}
        options={{ tabBarLabel: t('tabs.settings') }}
      />
    </Tab.Navigator>
  );
}

function Tabs() {
  return (
    <BluetoothProvider>
      <TabsNavigator />
    </BluetoothProvider>
  );
}

function AppNavigator() {
  const { isReady, navigationTheme, resolvedTheme, theme } = useAppSettings();
  const { isAuthenticated, isAuthReady } = useAuth();

  if (!isReady || !isAuthReady) {
    return <LoadingScreen />;
  }

  return (
    <>
      <StatusBar
        style={resolvedTheme === 'dark' ? 'light' : 'dark'}
        backgroundColor={theme.background}
      />
      <NavigationContainer theme={navigationTheme}>
        <Stack.Navigator
          initialRouteName={isAuthenticated ? 'Home' : 'Principal'}
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: theme.background },
            animation: 'fade',
          }}
        >
          <Stack.Screen name="Principal" component={Principal} />
          <Stack.Screen name="Home" component={Tabs} />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppSettingsProvider>
        <AuthProvider>
          <AppNavigator />
        </AuthProvider>
      </AppSettingsProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  tabBar: {
    height: 76,
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 24,
    borderTopWidth: 0,
    backgroundColor: '#051A3A',
    paddingTop: 8,
    paddingBottom: 9,
    paddingHorizontal: 4,
    shadowColor: '#00132B',
    shadowOpacity: 0.25,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 7 },
    elevation: 10,
  },
  tabItem: {
    borderRadius: 18,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 3,
  },
  tabIconWrap: {
    minWidth: 44,
    height: 31,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -5,
    width: 27,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#1780FF',
  },
});
