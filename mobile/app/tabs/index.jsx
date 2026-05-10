// mobile/app/(tabs)/index.jsx
import { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { reportsAPI } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { Card, StatCard, Loading } from '../../components/UI';
import { colors } from '../../constants/theme';

export default function DashboardScreen() {
  const { user, logout } = useAuth();
  const [stats,    setStats]    = useState(null);
  const [topBooks, setTopBooks] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const [s, tb] = await Promise.all([reportsAPI.dashboard(), reportsAPI.topBooks(5)]);
      setStats(s); setTopBooks(tb);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, []));

  if (loading) return <Loading text="Đang tải bảng điều khiển..." />;

  const initials = (user?.full_name || user?.username || 'AD').substring(0, 2).toUpperCase();

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.accent} />}>

      {/* Header */}
      <LinearGradient colors={['#1e3a5f','#0a0f1e']} style={s.header}>
        <View style={s.avatar}><Text style={s.avatarTxt}>{initials}</Text></View>
        <View style={{ flex:1 }}>
          <Text style={s.greeting}>Xin chào 👋</Text>
          <Text style={s.userName}>{user?.full_name || user?.username}</Text>
          <Text style={s.userRole}>{user?.role === 'admin' ? '🛡️ Quản trị viên' : '👤 Nhân viên'}</Text>
        </View>
        <TouchableOpacity onPress={logout} style={s.logoutBtn}>
          <Text style={s.logoutTxt}>Đăng xuất</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Stats */}
      <Text style={s.sectionTitle}>Tổng quan hệ thống</Text>
      <View style={s.row}><StatCard icon="📚" value={stats?.total_books}    label="Tổng sách"   color={colors.accent}  /><StatCard icon="👥" value={stats?.total_members}  label="Bạn đọc"     color={colors.green}  /></View>
      <View style={s.row}><StatCard icon="📖" value={stats?.active_borrows} label="Đang mượn"   color={colors.amber}  /><StatCard icon="⚠️"  value={stats?.overdue_count}  label="Quá hạn"     color={colors.red}    /></View>
      <View style={s.row}><StatCard icon="✅" value={stats?.available_books}label="Sách có sẵn" color={colors.green}  /><StatCard icon="📅" value={stats?.monthly_borrows}label="Tháng này"  color={colors.accent2}/></View>

      {/* Quick actions */}
      <Text style={s.sectionTitle}>Thao tác nhanh</Text>
      <View style={s.quickRow}>
        {[{icon:'📚',label:'Sách',href:'/(tabs)/books'},{icon:'👥',label:'Bạn đọc',href:'/(tabs)/members'},{icon:'🔄',label:'Mượn/Trả',href:'/(tabs)/borrows'},{icon:'📊',label:'Báo cáo',href:'/(tabs)/reports'}].map(item => (
          <TouchableOpacity key={item.href} style={s.quickBtn} onPress={() => router.push(item.href)}>
            <Text style={s.quickIcon}>{item.icon}</Text>
            <Text style={s.quickLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Top books */}
      {topBooks.length > 0 && <>
        <Text style={s.sectionTitle}>📈 Sách được mượn nhiều nhất</Text>
        <Card>
          {topBooks.map((b, i) => (
            <View key={b.id} style={[s.topRow, i < topBooks.length-1 && s.topBorder]}>
              <View style={s.rank}><Text style={s.rankTxt}>{i+1}</Text></View>
              <View style={{ flex:1 }}>
                <Text style={s.topTitle} numberOfLines={1}>{b.title}</Text>
                <Text style={s.topAuthor}>{b.author}</Text>
              </View>
              <Text style={s.topCount}>{b.borrow_count} lượt</Text>
            </View>
          ))}
        </Card>
      </>}

      {/* Fine alert */}
      {stats?.uncollected_fine > 0 && (
        <View style={s.fineCard}>
          <Text style={s.fineLbl}>💰 Phí phạt chưa thu</Text>
          <Text style={s.fineAmt}>{Number(stats.uncollected_fine).toLocaleString('vi-VN')} đồng</Text>
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex:1, backgroundColor:colors.bg },
  content:   { paddingBottom:32 },
  header:    { flexDirection:'row', alignItems:'center', padding:20, paddingTop:56, gap:12 },
  avatar:    { width:48, height:48, borderRadius:24, backgroundColor:colors.accent, alignItems:'center', justifyContent:'center' },
  avatarTxt: { color:colors.white, fontWeight:'700', fontSize:18 },
  greeting:  { fontSize:12, color:colors.textDim },
  userName:  { fontSize:17, fontWeight:'700', color:colors.white },
  userRole:  { fontSize:11, color:colors.textMid, marginTop:1 },
  logoutBtn: { paddingHorizontal:12, paddingVertical:6, borderRadius:8, backgroundColor:'rgba(255,255,255,.1)', borderWidth:1, borderColor:colors.border },
  logoutTxt: { fontSize:12, color:colors.textMid },
  sectionTitle: { fontSize:13, fontWeight:'600', color:colors.textMid, textTransform:'uppercase', letterSpacing:.5, marginBottom:10, marginTop:16, paddingHorizontal:16 },
  row:       { flexDirection:'row', paddingHorizontal:12, marginBottom:8 },
  quickRow:  { flexDirection:'row', justifyContent:'space-between', paddingHorizontal:16, marginBottom:8 },
  quickBtn:  { flex:1, alignItems:'center', backgroundColor:colors.card, borderRadius:12, paddingVertical:14, marginHorizontal:4, borderWidth:1, borderColor:colors.border },
  quickIcon: { fontSize:22, marginBottom:6 },
  quickLabel:{ fontSize:11, color:colors.textMid, fontWeight:'600' },
  topRow:    { flexDirection:'row', alignItems:'center', paddingVertical:10 },
  topBorder: { borderBottomWidth:1, borderBottomColor:colors.border },
  rank:      { width:26, height:26, borderRadius:13, backgroundColor:colors.navy, alignItems:'center', justifyContent:'center', marginRight:10 },
  rankTxt:   { fontSize:12, fontWeight:'700', color:colors.accent },
  topTitle:  { fontSize:13, fontWeight:'600', color:colors.text, marginBottom:2 },
  topAuthor: { fontSize:11, color:colors.textDim },
  topCount:  { fontSize:12, color:colors.accent, fontWeight:'600' },
  fineCard:  { margin:16, padding:16, borderRadius:14, backgroundColor:'rgba(120,83,0,.2)', borderWidth:1, borderColor:'rgba(245,158,11,.3)' },
  fineLbl:   { fontSize:13, fontWeight:'600', color:colors.amber, marginBottom:4 },
  fineAmt:   { fontSize:22, fontWeight:'700', color:colors.white },
});
