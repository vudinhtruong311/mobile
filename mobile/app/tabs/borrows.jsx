// app/(tabs)/borrows.jsx
import { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Modal, ScrollView, RefreshControl, Alert, TextInput } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { borrowsAPI, booksAPI, membersAPI } from '../../services/api';
import { Card, Btn, Badge, Empty, Loading, ConfirmModal, Input } from '../../components/UI';
import { colors } from '../../constants/theme';

export default function BorrowsScreen() {
  const [tab, setTab]       = useState('Đang mượn');
  const [borrows, setBorrows] = useState([]);
  const [overdue, setOverdue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [returnTarget, setReturnTarget] = useState(null);
  const [extendTarget, setExtendTarget] = useState(null);
  const [memberSearch, setMemberSearch] = useState('');
  const [bookSearch, setBookSearch]     = useState('');
  const [memberResults, setMemberResults] = useState([]);
  const [bookResults, setBookResults]     = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedBook, setSelectedBook]     = useState(null);
  const [borrowNote, setBorrowNote]         = useState('');
  const [saving, setSaving]                 = useState(false);

  const load = async () => {
    try {
      const [a, o] = await Promise.all([borrowsAPI.getActive(), borrowsAPI.getOverdue()]);
      setBorrows(a); setOverdue(o);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, []));

  const searchMembers = async (q) => {
    setMemberSearch(q);
    if (q.length < 2) { setMemberResults([]); return; }
    try { const r = await membersAPI.search(q); setMemberResults(r.slice(0,5)); } catch {}
  };

  const searchBooks = async (q) => {
    setBookSearch(q);
    if (q.length < 2) { setBookResults([]); return; }
    try { const r = await booksAPI.search(q); setBookResults(r.filter(b => b.available > 0).slice(0,5)); } catch {}
  };

  const openBorrowModal = () => {
    setSelectedMember(null); setSelectedBook(null);
    setMemberSearch(''); setBookSearch('');
    setMemberResults([]); setBookResults([]);
    setBorrowNote(''); setModalVisible(true);
  };

  const handleBorrow = async () => {
    if (!selectedMember) { Alert.alert('Lỗi','Vui lòng chọn bạn đọc'); return; }
    if (!selectedBook)   { Alert.alert('Lỗi','Vui lòng chọn sách');    return; }
    setSaving(true);
    try {
      await borrowsAPI.borrow(selectedMember.id, selectedBook.id, borrowNote);
      setModalVisible(false);
      Alert.alert('✅ Thành công', `Đã tạo phiếu mượn cho ${selectedMember.full_name}`);
      load();
    } catch (e) { Alert.alert('Lỗi', e.message); }
    finally { setSaving(false); }
  };

  const handleReturn = async () => {
    try {
      const result = await borrowsAPI.return(returnTarget.id);
      setReturnTarget(null);
      const fine = result.fine > 0 ? `\nPhí phạt: ${Number(result.fine).toLocaleString('vi-VN')} đồng` : '';
      Alert.alert('✅ Trả sách thành công', `"${returnTarget.book_title}" đã được trả.${fine}`);
      load();
    } catch (e) { setReturnTarget(null); Alert.alert('Lỗi', e.message); }
  };

  const handleExtend = async () => {
    try { await borrowsAPI.extend(extendTarget.id); setExtendTarget(null); Alert.alert('✅ Gia hạn thành công','Đã gia hạn thêm 14 ngày'); load(); }
    catch (e) { setExtendTarget(null); Alert.alert('Lỗi', e.message); }
  };

  const daysDiff = (due) => Math.ceil((new Date(due) - new Date()) / 86400000);

  const renderBorrow = ({ item: b }) => {
    const days = daysDiff(b.due_date);
    const isOD = days < 0;
    return (
      <Card style={s.borrowCard}>
        <View style={s.borrowHeader}>
          <View style={{flex:1}}>
            <Text style={s.bookTitle} numberOfLines={1}>📖 {b.book_title}</Text>
            <Text style={s.memberName}>👤 {b.member_name} · {b.member_code}</Text>
          </View>
          <Badge label={isOD ? `Quá ${Math.abs(days)}n` : `Còn ${days}n`} color={isOD ? 'red' : days<=3 ? 'amber' : 'green'} />
        </View>
        <View style={s.borrowDates}>
          <Text style={s.dateTxt}>📅 Mượn: {b.borrow_date}</Text>
          <Text style={[s.dateTxt, isOD && {color:colors.red}]}>⏰ Hạn: {b.due_date}</Text>
        </View>
        {b.note && <Text style={s.noteTxt}>💬 {b.note}</Text>}
        <View style={s.borrowActions}>
          <Btn label="↩️ Trả sách" variant="success" onPress={() => setReturnTarget(b)} style={s.actionBtn} />
          {!isOD && <Btn label="⏳ Gia hạn" variant="ghost" onPress={() => setExtendTarget(b)} style={s.actionBtn} />}
        </View>
      </Card>
    );
  };

  const data = tab === 'Đang mượn' ? borrows : overdue;
  if (loading) return <Loading text="Đang tải phiếu mượn..." />;

  return (
    <View style={s.container}>
      <View style={s.topBar}>
        <View style={{flex:1}}>
          <Text style={s.pageTitle}>Mượn / Trả Sách</Text>
          <Text style={s.pageSub}>{borrows.length} đang mượn · {overdue.length} quá hạn</Text>
        </View>
        <Btn label="+ Mượn" onPress={openBorrowModal} style={{paddingVertical:8,paddingHorizontal:14}} />
      </View>

      <View style={s.tabs}>
        {['Đang mượn','Quá hạn'].map(t => (
          <TouchableOpacity key={t} style={[s.tab, tab===t && s.tabActive]} onPress={() => setTab(t)}>
            <Text style={[s.tabTxt, tab===t && s.tabTxtActive]}>{t}</Text>
            {t==='Quá hạn' && overdue.length>0 && <View style={s.tabBadge}><Text style={s.tabBadgeTxt}>{overdue.length}</Text></View>}
          </TouchableOpacity>
        ))}
      </View>

      <FlatList data={data} keyExtractor={b => String(b.id)} renderItem={renderBorrow}
        contentContainerStyle={{padding:16,paddingBottom:32}}
        ListEmptyComponent={<Empty icon="📋" message={tab==='Đang mượn' ? 'Không có phiếu mượn nào' : '✅ Không có phiếu quá hạn'} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.accent} />}
      />

      {/* Modal tạo phiếu mượn */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalVisible(false)}>
        <View style={s.modalContainer}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>📋 Tạo phiếu mượn</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}><Text style={{fontSize:22,color:colors.textDim}}>✕</Text></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{padding:16}} keyboardShouldPersistTaps="handled">
            <Text style={s.sectionLbl}>👤 Bạn đọc</Text>
            {selectedMember ? (
              <View style={s.selectedItem}>
                <View style={{flex:1}}>
                  <Text style={s.selectedName}>{selectedMember.full_name}</Text>
                  <Text style={s.selectedSub}>{selectedMember.member_code} · {selectedMember.member_type}</Text>
                </View>
                <TouchableOpacity onPress={() => { setSelectedMember(null); setMemberSearch(''); }}>
                  <Text style={{color:colors.red,fontSize:18}}>✕</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{marginBottom:14}}>
                <TextInput style={s.searchInput} placeholder="Tìm tên hoặc mã số bạn đọc..." placeholderTextColor={colors.textDim} value={memberSearch} onChangeText={searchMembers} />
                {memberResults.map(m => (
                  <TouchableOpacity key={m.id} style={s.resultItem} onPress={() => { setSelectedMember(m); setMemberResults([]); }}>
                    <Text style={s.resultMain}>{m.full_name}</Text>
                    <Text style={s.resultSub}>{m.member_code} · {m.member_type}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={s.sectionLbl}>📚 Sách (chỉ hiện sách còn sẵn)</Text>
            {selectedBook ? (
              <View style={s.selectedItem}>
                <View style={{flex:1}}>
                  <Text style={s.selectedName}>{selectedBook.title}</Text>
                  <Text style={s.selectedSub}>{selectedBook.author} · còn {selectedBook.available} cuốn</Text>
                </View>
                <TouchableOpacity onPress={() => { setSelectedBook(null); setBookSearch(''); }}>
                  <Text style={{color:colors.red,fontSize:18}}>✕</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{marginBottom:14}}>
                <TextInput style={s.searchInput} placeholder="Tìm tên sách hoặc tác giả..." placeholderTextColor={colors.textDim} value={bookSearch} onChangeText={searchBooks} />
                {bookResults.map(b => (
                  <TouchableOpacity key={b.id} style={s.resultItem} onPress={() => { setSelectedBook(b); setBookResults([]); }}>
                    <Text style={s.resultMain}>{b.title}</Text>
                    <Text style={s.resultSub}>{b.author} · còn {b.available}/{b.quantity} cuốn</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Input label="Ghi chú (tùy chọn)" value={borrowNote} onChangeText={setBorrowNote} placeholder="Ghi chú thêm..." multiline />
            <View style={{flexDirection:'row',gap:10,marginTop:8}}>
              <Btn label="Hủy" variant="ghost" onPress={() => setModalVisible(false)} style={{flex:1}} />
              <Btn label="📋 Tạo phiếu" onPress={handleBorrow} loading={saving} style={{flex:1}} />
            </View>
          </ScrollView>
        </View>
      </Modal>

      <ConfirmModal visible={!!returnTarget} title="↩️ Xác nhận trả sách"
        message={`Xác nhận trả sách\n"${returnTarget?.book_title}"?\n\nNếu quá hạn sẽ tính phí 2.000đ/ngày.`}
        confirmLabel="↩️ Xác nhận trả" onConfirm={handleReturn} onCancel={() => setReturnTarget(null)} />

      <ConfirmModal visible={!!extendTarget} title="⏳ Gia hạn"
        message={`Gia hạn thêm 14 ngày cho\n"${extendTarget?.book_title}"?`}
        confirmLabel="⏳ Gia hạn" onConfirm={handleExtend} onCancel={() => setExtendTarget(null)} />
    </View>
  );
}

const s = StyleSheet.create({
  container:     { flex:1, backgroundColor:colors.bg },
  topBar:        { flexDirection:'row', alignItems:'center', padding:16, paddingTop:56, justifyContent:'space-between' },
  pageTitle:     { fontSize:22, fontWeight:'700', color:colors.white },
  pageSub:       { fontSize:12, color:colors.textDim, marginTop:2 },
  tabs:          { flexDirection:'row', paddingHorizontal:16, gap:8, marginBottom:8 },
  tab:           { flexDirection:'row', alignItems:'center', paddingHorizontal:16, paddingVertical:8, borderRadius:20, backgroundColor:colors.panel, borderWidth:1, borderColor:colors.border },
  tabActive:     { backgroundColor:colors.accent, borderColor:colors.accent },
  tabTxt:        { fontSize:13, color:colors.textMid, fontWeight:'600' },
  tabTxtActive:  { color:colors.white },
  tabBadge:      { backgroundColor:colors.red, borderRadius:10, width:18, height:18, alignItems:'center', justifyContent:'center', marginLeft:6 },
  tabBadgeTxt:   { color:colors.white, fontSize:10, fontWeight:'700' },
  borrowCard:    { marginBottom:10 },
  borrowHeader:  { flexDirection:'row', alignItems:'flex-start', marginBottom:8 },
  bookTitle:     { fontSize:14, fontWeight:'700', color:colors.white, marginBottom:4 },
  memberName:    { fontSize:12, color:colors.accent },
  borrowDates:   { flexDirection:'row', gap:16, marginBottom:6 },
  dateTxt:       { fontSize:11, color:colors.textDim },
  noteTxt:       { fontSize:11, color:colors.textDim, marginBottom:8, fontStyle:'italic' },
  borrowActions: { flexDirection:'row', gap:8, marginTop:4 },
  actionBtn:     { flex:1, paddingVertical:8 },
  modalContainer:{ flex:1, backgroundColor:colors.bg },
  modalHeader:   { flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:16, borderBottomWidth:1, borderBottomColor:colors.border },
  modalTitle:    { fontSize:18, fontWeight:'700', color:colors.white },
  sectionLbl:    { fontSize:13, fontWeight:'700', color:colors.textMid, marginBottom:8, textTransform:'uppercase', letterSpacing:.5 },
  searchInput:   { backgroundColor:colors.panel, borderWidth:1, borderColor:colors.border, borderRadius:10, paddingHorizontal:14, paddingVertical:11, color:colors.text, fontSize:14, marginBottom:4 },
  resultItem:    { backgroundColor:colors.card, borderRadius:8, padding:12, marginBottom:4, borderWidth:1, borderColor:colors.border },
  resultMain:    { fontSize:13, fontWeight:'600', color:colors.text },
  resultSub:     { fontSize:11, color:colors.textDim, marginTop:2 },
  selectedItem:  { backgroundColor:colors.card, borderRadius:10, padding:12, borderWidth:1, borderColor:colors.accent, marginBottom:14, flexDirection:'row', alignItems:'center' },
  selectedName:  { fontSize:14, fontWeight:'700', color:colors.white },
  selectedSub:   { fontSize:12, color:colors.accent, marginTop:2 },
});
