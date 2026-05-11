// app/(tabs)/reports.jsx
import { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { reportsAPI } from '../../services/api';
import { Card, StatCard, Loading, Empty } from '../../components/UI';
import { colors } from '../../constants/theme';

export default function ReportsScreen() {
  const [dashboard, setDashboard] = useState(null);
  const [topBooks, setTopBooks]   = useState([]);
  const [monthly, setMonthly]     = useState([]);
  const [overdue, setOverdue]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const [d, tb, m, o] = await Promise.all([reportsAPI.dashboard(), reportsAPI.topBooks(), reportsAPI.monthly(), reportsAPI.overdue()]);
      setDashboard(d); setTopBooks(tb); setMonthly(m); setOverdue(o);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, []));

  const maxBorrow = Math.max(...monthly.map(m => m.total_borrows), 1);

  if (loading) return <Loading text="Đang tải báo cáo..." />;

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.accent} />}>

      <Text style={s.pageTitle}>📊 Báo cáo Thống kê</Text>

      <Text style={s.sectionTitle}>Tổng quan</Text>
      <View style={s.row}><StatCard icon="📚" value={dashboard?.total_books}    label="Tổng sách"  color={colors.accent}  /><StatCard icon="👥" value={dashboard?.total_members}  label="Bạn đọc"   color={colors.green}  /></View>
      <View style={s.row}><StatCard icon="📖" value={dashboard?.active_borrows} label="Đang mượn"  color={colors.amber}  /><StatCard icon="⚠️"  value={dashboard?.overdue_count}  label="Quá hạn"   color={colors.red}    /></View>

      {(dashboard?.uncollected_fine > 0 || dashboard?.total_fine_collected > 0) && <>
        <Text style={s.sectionTitle}>💰 Phí phạt</Text>
        <Card>
          <View style={s.fineRow}>
            <View style={s.fineItem}>
              <Text style={s.fineLbl}>Đã thu</Text>
              <Text style={[s.fineVal,{color:colors.green}]}>{Number(dashboard?.total_fine_collected||0).toLocaleString('vi-VN')}đ</Text>
            </View>
            <View style={[s.fineItem,{borderLeftWidth:1,borderLeftColor:colors.border}]}> 
              <Text style={s.fineLbl}>Chưa thu</Text>
              <Text style={[s.fineVal,{color:colors.red}]}>{Number(dashboard?.uncollected_fine||0).toLocaleString('vi-VN')}đ</Text>
            </View>
          </View>
        </Card>
      </>}

      <Text style={s.sectionTitle}>📅 Lượt mượn theo tháng ({new Date().getFullYear()})</Text>
      <Card style={{paddingBottom:8}}>
        <View style={s.chartWrap}>
          {monthly.map((m) => (
            <View key={m.month} style={s.chartCol}>
              <Text style={s.chartVal}>{m.total_borrows > 0 ? m.total_borrows : ''}</Text>
              <View style={s.barWrap}>
                <View style={[s.bar,{ height:Math.max(4,(m.total_borrows/maxBorrow)*80), backgroundColor:m.total_borrows>0?colors.accent:colors.panel }]} />
              </View>
              <Text style={s.chartLbl}>T{parseInt(m.month)}</Text>
            </View>
          ))}
        </View>
      </Card>

      <Text style={s.sectionTitle}>🏆 Top sách được mượn nhiều nhất</Text>
      <Card>
        {topBooks.length===0 && <Empty icon="📚" message="Chưa có dữ liệu" />}
        {topBooks.map((b,i) => (
          <View key={b.id} style={[s.topRow, i<topBooks.length-1 && s.topBorder]}>
            <View style={[s.rankBadge, i<3 && s.rankBadgeTop]}><Text style={s.rankTxt}>{i+1}</Text></View>
            <View style={{flex:1,marginLeft:10}}>
              <Text style={s.topTitle} numberOfLines={1}>{b.title}</Text>
              <Text style={s.topSub}>{b.author}</Text>
            </View>
            <View style={s.borrowBadge}>
              <Text style={s.borrowCount}>{b.borrow_count}</Text>
              <Text style={s.borrowUnit}>lượt</Text>
            </View>
          </View>
        ))}
      </Card>

      <Text style={s.sectionTitle}>⚠️ Phiếu quá hạn ({overdue?.count||0})</Text>
      <Card>
        {!overdue?.items?.length && <Empty icon="✅" message="Không có phiếu quá hạn" />}
        {overdue?.items?.map((item,i) => (
          <View key={item.id} style={[s.overdueRow, i<overdue.items.length-1 && s.topBorder]}>
            <View style={{flex:1}}>
              <Text style={s.overdueBook} numberOfLines={1}>📖 {item.book_title}</Text>
              <Text style={s.overdueMember}>👤 {item.full_name} · {item.member_code}</Text>
              <Text style={s.overdueDate}>Hạn: {item.due_date} · Quá {item.days_overdue} ngày</Text>
            </View>
            <Text style={s.overdueFine}>~{Number(item.estimated_fine).toLocaleString('vi-VN')}đ</Text>
          </View>
        ))}
        {overdue?.total_estimated_fine > 0 && (
          <View style={s.totalFineRow}>
            <Text style={s.totalFineLbl}>Tổng phí phạt ước tính:</Text>
            <Text style={s.totalFineVal}>{Number(overdue.total_estimated_fine).toLocaleString('vi-VN')}đ</Text>
          </View>
        )}
      </Card>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:    { flex:1, backgroundColor:colors.bg },
  content:      { padding:16, paddingBottom:40 },
  pageTitle:    { fontSize:22, fontWeight:'700', color:colors.white, marginBottom:16, paddingTop:40 },
  sectionTitle: { fontSize:13, fontWeight:'600', color:colors.textMid, textTransform:'uppercase', letterSpacing:.5, marginBottom:10, marginTop:6 },
  row:          { flexDirection:'row', marginBottom:8 },
  fineRow:      { flexDirection:'row' },
  fineItem:     { flex:1, alignItems:'center', paddingVertical:4 },
  fineLbl:      { fontSize:11, color:colors.textDim, textTransform:'uppercase', letterSpacing:.5, marginBottom:4 },
  fineVal:      { fontSize:20, fontWeight:'700' },
  chartWrap:    { flexDirection:'row', justifyContent:'space-between', alignItems:'flex-end', height:120 },
  chartCol:     { flex:1, alignItems:'center' },
  chartVal:     { fontSize:8, color:colors.textDim, marginBottom:2 },
  barWrap:      { height:80, justifyContent:'flex-end', width:'70%' },
  bar:          { width:'100%', borderRadius:3 },
  chartLbl:     { fontSize:8, color:colors.textDim, marginTop:4 },
  topRow:       { flexDirection:'row', alignItems:'center', paddingVertical:10 },
  topBorder:    { borderBottomWidth:1, borderBottomColor:colors.border },
  rankBadge:    { width:28, height:28, borderRadius:14, backgroundColor:colors.navy, alignItems:'center', justifyContent:'center' },
  rankBadgeTop: { backgroundColor:'rgba(245,158,11,.2)', borderWidth:1, borderColor:colors.amber },
  rankTxt:      { fontSize:12, fontWeight:'700', color:colors.accent },
  topTitle:     { fontSize:13, fontWeight:'600', color:colors.text },
  topSub:       { fontSize:11, color:colors.textDim, marginTop:2 },
  borrowBadge:  { alignItems:'center' },
  borrowCount:  { fontSize:18, fontWeight:'700', color:colors.accent },
  borrowUnit:   { fontSize:9, color:colors.textDim },
  overdueRow:   { paddingVertical:10 },
  overdueBook:  { fontSize:13, fontWeight:'600', color:colors.text, marginBottom:3 },
  overdueMember:{ fontSize:12, color:colors.accent, marginBottom:2 },
  overdueDate:  { fontSize:11, color:colors.red },
  overdueFine:  { fontSize:13, fontWeight:'700', color:colors.amber, marginLeft:10 },
  totalFineRow: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingTop:12, marginTop:8, borderTopWidth:1, borderTopColor:colors.border },
  totalFineLbl: { fontSize:13, color:colors.textMid, fontWeight:'600' },
  totalFineVal: { fontSize:16, fontWeight:'700', color:colors.amber },
});
