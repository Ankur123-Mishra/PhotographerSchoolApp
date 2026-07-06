import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PhotographerDashboardScreen from '../screens/PhotographerDashboardScreen';
import PhotographerSchoolListScreen from '../screens/PhotographerSchoolListScreen';
import ClassListScreen from '../screens/ClassListScreen';
import StudentListScreen from '../screens/StudentListScreen';
import StudentDetailScreen from '../screens/StudentDetailScreen';
import PreviewScreen from '../screens/PreviewScreen';
import type { PhotographerStackParamList } from './types';
import { colors, typography } from '../theme/colors';

const Stack = createNativeStackNavigator<PhotographerStackParamList>();

export default function PhotographerStack() {
  return (
    <Stack.Navigator
      screenOptions={{
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
      }}
    >
      <Stack.Screen
        name="PhotographerDashboard"
        component={PhotographerDashboardScreen}
        options={{ title: 'Dashboard' }}
      />
      <Stack.Screen
        name="PhotographerSchools"
        component={PhotographerSchoolListScreen}
        options={{ title: 'Schools' }}
      />
      <Stack.Screen
        name="ClassList"
        component={ClassListScreen}
        options={({ route }) => ({
          title: route.params?.schoolName ?? 'Classes',
        })}
      />
      <Stack.Screen
        name="StudentList"
        component={StudentListScreen}
        options={({ route }) => ({
          title: route.params?.title ?? (route.params?.className ? `Class ${route.params.className}` : 'Students'),
        })}
      />
      <Stack.Screen
        name="StudentDetail"
        component={StudentDetailScreen}
        options={{ title: 'Student Detail' }}
      />
      <Stack.Screen
        name="Preview"
        component={PreviewScreen}
        options={{ title: 'ID Card Preview' }}
      />
    </Stack.Navigator>
  );
}
