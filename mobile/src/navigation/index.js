import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet } from 'react-native';
import { T } from '../constants/theme';
import HomeScreen from '../screens/HomeScreen';
import SleepScreen from '../screens/SleepScreen';
import CycleScreen from '../screens/CycleScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

const TABS = [
  { name: 'Home', label: 'Home', icon: '🌿', screen: HomeScreen },
  { name: 'Sleep', label: 'Sleep', icon: '🌙', screen: SleepScreen },
  { name: 'Cycle', label: 'Cycle', icon: '🌸', screen: CycleScreen },
  { name: 'Profile', label: 'Profile', icon: '👤', screen: ProfileScreen },
];

export default function Navigation() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: T.terra,
          tabBarInactiveTintColor: T.light,
          tabBarLabelStyle: styles.tabLabel,
          tabBarIconStyle: styles.tabIconStyle,
          tabBarItemStyle: styles.tabItem,
          tabBarIcon: ({ focused }) => {
            const tab = TABS.find((t) => t.name === route.name);
            return (
              <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
                <Text style={styles.emoji}>{tab.icon}</Text>
              </View>
            );
          },
        })}
      >
        {TABS.map(({ name, label, screen }) => (
          <Tab.Screen
            key={name}
            name={name}
            component={screen}
            options={{ tabBarLabel: label }}
          />
        ))}
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: T.white,
    borderTopWidth: 0,
    height: 82,
    paddingBottom: 12,
    paddingTop: 8,
    paddingHorizontal: 12,
    borderRadius: 24,
    marginHorizontal: 14,
    marginBottom: 10,
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopColor: 'transparent',
    ...T.shadow.md,
  },
  tabItem: {
    backgroundColor: 'transparent',
    borderRadius: 18,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  tabIconStyle: {
    marginTop: 2,
  },
  iconWrap: {
    width: 42,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: 'transparent',
  },
  iconWrapActive: {
    backgroundColor: T.peach,
    borderWidth: 1,
    borderColor: '#F4D8C4',
  },
  emoji: {
    fontSize: 22,
  },
});
