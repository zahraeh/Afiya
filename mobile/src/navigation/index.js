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

function TabIcon({ icon, label, focused }) {
  return (
    <View style={[styles.tabItem, focused && styles.tabItemActive]}>
      <Text style={styles.tabEmoji}>{icon}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
    </View>
  );
}

export default function Navigation() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarShowLabel: false,
        }}
      >
        {TABS.map(({ name, label, icon, screen }) => (
          <Tab.Screen
            key={name}
            name={name}
            component={screen}
            options={{
              tabBarIcon: ({ focused }) => (
                <TabIcon icon={icon} label={label} focused={focused} />
              ),
            }}
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
    height: 72,
    paddingBottom: 8,
    paddingTop: 8,
    ...T.shadow.sm,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: T.radius.md,
    gap: 2,
  },
  tabItemActive: {
    backgroundColor: '#FDF2EC',
  },
  tabEmoji: {
    fontSize: 20,
  },
  tabLabel: {
    fontSize: 10,
    color: T.light,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: T.terra,
    fontWeight: '700',
  },
});
