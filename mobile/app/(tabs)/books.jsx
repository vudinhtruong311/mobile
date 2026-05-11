// app/(tabs)/books.jsx
import { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  TextInput, Modal, ScrollView, RefreshControl, Alert,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { booksAPI } from '../../services/api';
import { Card, Btn, Input, Badge, Empty, Loading, ConfirmModal } from '../../components/UI';
import { colors } from '../../constants/theme';

const FILTERS = ['Tất cả', 'Có sẵn', 'Đang mượn'];

export default function BooksScreen() {
  const [books, setBooks]       = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch]     = useState('');
  const [filter, setFilter]     = useState('Tất cả');
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editBook, setEditBook]         = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving]             = useState(false);
  const [form, setForm] = useState({
    title:'', author:'', publisher:'', isbn:'',
    year:'', category:'', quantity:'1', description:''
  });

  const load = async () => {
    try {
      const data = await booksAPI.getAll();
      setBooks(data);
      applyFilter(data, filter, search);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, []));

  const applyFilter = (list, f, s) => {
    let r = list;
    if (s) r = r.filter(b => b.title.toLowerCase().includes(s.toLowerCase()) || b.author.toLowerCase().includes(s.toLowerCase()));
    if (f === 'Có sẵn')    r = r.filter(b => b.available > 0);
    if (f === 'Đang mượn') r = r.filter(b => b.available === 0);
    setFiltered(r);
  };

  const openAdd = () => {
    setEditBook(null);
    setForm({ title:'', author:'', publisher:'', isbn:'', year:'', category:'', quantity:'1', description:'' });
    setModalVisible(true);
  };

  const openEdit = (b) => {
    setEditBook(b);
    setForm({ title:b.title||'', author:b.author||'', publisher:b.publisher||'', isbn:b.isbn||'', year:b.year?String(b.year):'', category:b.category||'', quantity:String(b.quantity), description:b.description||'' });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.author.trim()) { Alert.alert('Lỗi','Tên sách và tác giả không được để trống'); return; }
    setSaving(true);
    try {
      const payload = { title:form.title.trim(), author:form.author.trim(), publisher:form.publisher||null, isbn:form.isbn||null, year:form.year?parseInt(form.year):null, category:form.category||null, quantity:parseInt(form.quantity)||1, description:form.description||null };
      if (editBook) await booksAPI.update(editBook.id, payload);
      else          await booksAPI.add(payload);
      setModalVisible(false); load();
    } catch (e) { Alert.alert('Lỗi', e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try { await booksAPI.delete(deleteTarget.id); setDeleteTarget(null); load(); }
    catch (e) { setDeleteTarget(null); Alert.alert('Không thể xóa', e.message); }
  };

  const statusColor = (b) => b.available === 0 ? 'amber' : b.available < b.quantity ? 'blue' : 'green';
  const statusLabel = (b) => b.available === 0 ? 'Hết sách' : b.available < b.quantity ? 'Một phần' : 'Có sẵn';

  const renderBook = ({ item: b }) => (
    <Card style={s.bookCard}>
      <View style={s.bookRow}>
        <View style={s.bookIcon}><Text style={{fontSize:20}}>📖</Text></View>
        <View style={{flex:1}}>
          <Text style={s.bookTitle} numberOfLines={2}>{b.title}</Text>
          <Text style={s.bookAuthor}>{b.author}</Text>
          {b.isbn && <Text style={s.bookIsbn}>ISBN: {b.isbn}</Text>}
        </View>
        <Badge label={statusLabel(b)} color={statusColor(b)} />
      </View>
      <View style={s.bookMeta}>
        {b.category && <Text style={s.metaTag}>📂 {b.category}</Text>}
        {b.year     && <Text style={s.metaTag}>📅 {b.year}</Text>}
        <Text style={[s.metaTag,{color:colors.accent}]}>{b.available}/{b.quantity} cuốn</Text>
      </View>
      <View style={s.bookActions}>
        <Btn label="✏️ Sửa"  variant="ghost"  onPress={() => openEdit(b)}          style={s.actionBtn} />
        <Btn label="🗑️ Xóa" variant="danger" onPress={() => setDeleteTarget(b)}   style={s.actionBtn} />
      </View>
    </Card>
  );

  if (loading) return <Loading text="Đang tải danh sách sách..." />;

  return (
    <View style={s.container}>
      <View style={s.topBar}>
        <View style={{flex:1}}>
          <Text style={s.pageTitle}>Quản lý Sách</Text>
          <Text style={s.pageSub}>{filtered.length} đầu sách</Text>
        </View>
        <Btn label="+ Thêm" onPress={openAdd} style={{paddingVertical:8,paddingHorizontal:14}} />
      </View>

      <View style={s.searchWrap}>
        <Text style={{fontSize:16,marginRight:8}}>🔍</Text>
        <TextInput style={s.searchInput} placeholder="Tìm theo tên, tác giả..." placeholderTextColor={colors.textDim}
          value={search} onChangeText={t => { setSearch(t); applyFilter(books, filter, t); }} />
      </View>

      <View style={s.filters}>
        {FILTERS.map(f => (
          <TouchableOpacity key={f} style={[s.filterBtn, filter===f && s.filterActive]}
            onPress={() => { setFilter(f); applyFilter(books, f, search); }}>
            <Text style={[s.filterTxt, filter===f && {color:colors.white}]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList data={filtered} keyExtractor={b => String(b.id)} renderItem={renderBook}
        contentContainerStyle={{padding:16, paddingBottom:32}}
        ListEmptyComponent={<Empty icon="📚" message="Không tìm thấy sách nào" />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.accent} />}
      />

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalVisible(false)}>
        <View style={s.modalContainer}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>{editBook ? '✏️ Sửa sách' : '📚 Thêm sách mới'}</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}><Text style={{fontSize:22,color:colors.textDim}}>✕</Text></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{padding:16}}>
            <Input label="Tên sách *"    value={form.title}       onChangeText={v => setForm(f=>({...f,title:v}))}       placeholder="Nhập tên sách..." />
            <Input label="Tác giả *"     value={form.author}      onChangeText={v => setForm(f=>({...f,author:v}))}      placeholder="Tên tác giả..." />
            <Input label="Nhà xuất bản"  value={form.publisher}   onChangeText={v => setForm(f=>({...f,publisher:v}))}   placeholder="NXB..." />
            <Input label="ISBN"          value={form.isbn}        onChangeText={v => setForm(f=>({...f,isbn:v}))}        placeholder="ISBN..." keyboardType="numeric" />
            <View style={{flexDirection:'row',gap:12}}>
              <View style={{flex:1}}><Input label="Năm XB"    value={form.year}     onChangeText={v => setForm(f=>({...f,year:v}))}     placeholder="2024" keyboardType="numeric" /></View>
              <View style={{flex:1}}><Input label="Số lượng"  value={form.quantity} onChangeText={v => setForm(f=>({...f,quantity:v}))} keyboardType="numeric" /></View>
            </View>
            <Input label="Thể loại"  value={form.category}    onChangeText={v => setForm(f=>({...f,category:v}))}   placeholder="Khoa học, Kinh tế..." />
            <Input label="Mô tả"     value={form.description} onChangeText={v => setForm(f=>({...f,description:v}))} placeholder="Mô tả nội dung..." multiline numberOfLines={3} />
            <View style={{flexDirection:'row',gap:10,marginTop:8}}>
              <Btn label="Hủy"  variant="ghost"   onPress={() => setModalVisible(false)} style={{flex:1}} />
              <Btn label={editBook ? "💾 Lưu" : "➕ Thêm"} onPress={handleSave} loading={saving} style={{flex:1}} />
            </View>
          </ScrollView>
        </View>
      </Modal>

      <ConfirmModal visible={!!deleteTarget} title="🗑️ Xóa sách"
        message={`Bạn có chắc muốn xóa sách\n"${deleteTarget?.title}"?\nHành động này không thể hoàn tác.`}
        confirmLabel="🗑️ Xóa" danger onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </View>
  );
}

const s = StyleSheet.create({
  container:     { flex:1, backgroundColor:colors.bg },
  topBar:        { flexDirection:'row', alignItems:'center', padding:16, paddingTop:56, justifyContent:'space-between' },
  pageTitle:     { fontSize:22, fontWeight:'700', color:colors.white },
  pageSub:       { fontSize:12, color:colors.textDim, marginTop:2 },
  searchWrap:    { flexDirection:'row', alignItems:'center', backgroundColor:colors.panel, borderRadius:10, marginHorizontal:16, marginBottom:10, paddingHorizontal:12, borderWidth:1, borderColor:colors.border },
  searchInput:   { flex:1, paddingVertical:10, color:colors.text, fontSize:14 },
  filters:       { flexDirection:'row', paddingHorizontal:16, gap:8, marginBottom:8 },
  filterBtn:     { paddingHorizontal:14, paddingVertical:6, borderRadius:20, backgroundColor:colors.panel, borderWidth:1, borderColor:colors.border },
  filterActive:  { backgroundColor:colors.accent, borderColor:colors.accent },
  filterTxt:     { fontSize:12, color:colors.textMid, fontWeight:'600' },
  bookCard:      { marginBottom:10 },
  bookRow:       { flexDirection:'row', alignItems:'flex-start', marginBottom:8 },
  bookIcon:      { width:40, height:40, backgroundColor:colors.navy, borderRadius:8, alignItems:'center', justifyContent:'center', marginRight:12 },
  bookTitle:     { fontSize:14, fontWeight:'700', color:colors.white, marginBottom:2 },
  bookAuthor:    { fontSize:12, color:colors.textMid },
  bookIsbn:      { fontSize:11, color:colors.textDim, marginTop:2 },
  bookMeta:      { flexDirection:'row', flexWrap:'wrap', gap:6, marginBottom:10 },
  metaTag:       { fontSize:11, color:colors.textDim, backgroundColor:colors.navy, paddingHorizontal:8, paddingVertical:3, borderRadius:6 },
  bookActions:   { flexDirection:'row', gap:8 },
  actionBtn:     { flex:1, paddingVertical:7 },
  modalContainer:{ flex:1, backgroundColor:colors.bg },
  modalHeader:   { flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:16, borderBottomWidth:1, borderBottomColor:colors.border },
  modalTitle:    { fontSize:18, fontWeight:'700', color:colors.white },
});
