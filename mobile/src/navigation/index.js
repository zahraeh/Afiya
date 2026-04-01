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
  { name: 'Home',    label: 'Accueil', icon: '🌿', screen: HomeScreen    },
  { name: 'Sleep',   label: 'Sommeil', icon: '🌙', screen: SleepScreen   },
  { name: 'Cycle',   label: 'Cycle',   icon: '🌸', screen: CycleScreen   },
  { name: 'Profile', label: 'Profil',  icon: '👤', screen: ProfileScreen  },
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
    borderTopColor: T.border,
    borderTopWidth: 1,
    height: 80,
    paddingBottom: 10,
    paddingTop: 6,
    ...T.shadow.sm,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  tabIconStyle: {
    marginTop: 4,
  },
  iconWrap: {
    width: 40,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  iconWrapActive: {
    backgroundColor: '#FDF2EC',
  },
  emoji: {
    fontSize: 22,
  },
});
