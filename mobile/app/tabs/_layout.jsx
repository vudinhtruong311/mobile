// mobile/app/(tabs)/_layout.jsx
import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { colors } from '../../constants/theme';

const TABS = [
  { name:'index',   title:'Tổng quan', icon:'🏠' },
  { name:'books',   title:'Sách',      icon:'📚' },
  { name:'members', title:'Bạn đọc',   icon:'👥' },
  { name:'borrows', title:'Mượn/Trả',  icon:'🔄' },
  { name:'reports', title:'Báo cáo',   icon:'📊' },
];

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarStyle: { backgroundColor:colors.navy, borderTopColor:colors.border, borderTopWidth:1, height:60, paddingBottom:8 },
      tabBarActiveTintColor:   colors.accent,
      tabBarInactiveTintColor: colors.textDim,
      tabBarLabelStyle: { fontSize:10, fontWeight:'600' },
    }}>
      {TABS.map(t => (
        <Tabs.Screen key={t.name} name={t.name} options={{
          title: t.title,
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize:20, opacity: focused ? 1 : .5 }}>{t.icon}</Text>
          ),
        }} />
      ))}
    </Tabs>
  );
}
