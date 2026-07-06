import React from 'react';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import PhotographerStack from './PhotographerStack';
import ProfileScreen from '../screens/ProfileScreen';
import type { PhotographerBottomTabsParamList, ProfileStackParamList } from './types';
import { colors, typography } from '../theme/colors';

const Tab = createBottomTabNavigator<PhotographerBottomTabsParamList>();
const ProfileStackNav = createNativeStackNavigator<ProfileStackParamList>();

const stackScreenOptions = {
  headerShown: true,
  headerBackTitle: 'Back',
  headerTintColor: colors.primary,
  headerTitleStyle: {
    fontSize: typography.heading.fontSize,
    fontWeight: typography.heading.fontWeight,
    color: colors.text,
  },
  headerStyle: { backgroundColor: colors.surface },
  headerShadowVisible: true,
  contentStyle: { backgroundColor: colors.background },
} as const;

const tabBarStyleVisible = {
  backgroundColor: colors.surface,
  paddingBottom: 8,
  paddingTop: 8,
  height: 100,
  borderTopWidth: 1,
  borderTopColor: colors.border,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: -2 },
  shadowOpacity: 0.04,
  shadowRadius: 4,
  elevation: 8,
} as const;

function ProfileStackScreen() {
  return (
    <ProfileStackNav.Navigator screenOptions={stackScreenOptions}>
      <ProfileStackNav.Screen
        name="ProfileHome"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </ProfileStackNav.Navigator>
  );
}

export default function PhotographerBottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: tabBarStyleVisible,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={PhotographerStack}
        options={({ route }) => {
          const focusedName = getFocusedRouteNameFromRoute(route) ?? 'PhotographerDashboard';
          const hideTabBar = focusedName !== 'PhotographerDashboard';

          return {
            tabBarLabel: 'Dashboard',
            tabBarStyle: hideTabBar ? { display: 'none' as const } : tabBarStyleVisible,
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons name={focused ? 'camera' : 'camera-outline'} size={size} color={color} />
            ),
          };
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStackScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

