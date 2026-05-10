// mobile/app/index.jsx
import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { colors } from '../constants/theme';

export default function Index() {
  const { user, loading } = useAuth();
  if (loading) return (
    <View style={{ flex:1, backgroundColor:colors.bg, alignItems:'center', justifyContent:'center' }}>
      <ActivityIndicator color={colors.accent} size="large" />
    </View>
  );
  return <Redirect href={user ? '/(tabs)' : '/auth/login'} />;
}
