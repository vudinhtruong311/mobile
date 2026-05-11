// mobile/app/_layout.jsx
import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { AuthProvider, useAuth } from '../hooks/useAuth';
import { colors } from '../constants/theme';
 
function RootNavigator() {
  const { user, loading } = useAuth();
  const router   = useRouter();
  const segments = useSegments();
 
  useEffect(() => {
    if (loading) return;
 
    const inAuthGroup = segments[0] === 'auth';
    const inTabsGroup = segments[0] === '(tabs)';
 
    if (!user && !inAuthGroup) {
      // Chưa đăng nhập → về login
      router.replace('/auth/login');
    } else if (user && inAuthGroup) {
      // Đã đăng nhập mà đang ở login → vào tabs
      router.replace('/(tabs)');
    }
  }, [user, loading, segments]);
 
  if (loading) {
    return (
      <View style={{ flex:1, backgroundColor:colors.bg, alignItems:'center', justifyContent:'center' }}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }
 
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="auth/login" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
 
export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" backgroundColor={colors.bg} />
      <RootNavigator />
    </AuthProvider>
  );
}
 