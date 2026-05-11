// app/(tabs)/members.jsx
import { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, Modal, ScrollView, RefreshControl, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { membersAPI } from '../../services/api';
import { Card, Btn, Input, Badge, Empty, Loading, ConfirmModal } from '../../components/UI';
import { colors } from '../../constants/theme';

const TYPES = ['Tất cả','Sinh vien','Giang vien','Can bo'];

export default function MembersScreen() {
  const [members, setMembers]   = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch]     = useState('');
  const [typeFilter, setTypeFilter] = useState('Tất cả');
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editMember, setEditMember]     = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving]             = useState(false);
  const [form, setForm] = useState({ full_name:'', member_code:'', email:'', phone:'', member_type:'Sinh vien', card_years:'1' });

  const load = async () => {
    try { const data = await membersAPI.getAll(); setMembers(data); applyFilter(data, typeFilter, search); }
    catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, []));

  const applyFilter = (list, t, s) => {
    let r = list;
    if (s) r = r.filter(m => m.full_name.toLowerCase().includes(s.toLowerCase()) || m.member_code.toLowerCase().includes(s.toLowerCase()));
    if (t !== 'Tất cả') r = r.filter(m => m.member_type === t);
    setFiltered(r);
  };

  const isCardValid = (m) => !m.card_expiry || m.card_expiry >= new Date().toISOString().split('T')[0];

  const openAdd = () => {
    setEditMember(null);
    setForm({ full_name:'', member_code:'', email:'', phone:'', member_type:'Sinh vien', card_years:'1' });
    setModalVisible(true);
  };

  const openEdit = (m) => {
    setEditMember(m);
    setForm({ full_name:m.full_name, member_code:m.member_code, email:m.email||'', phone:m.phone||'', member_type:m.member_type||'Sinh vien', card_years:'1' });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.full_name.trim() || !form.member_code.trim()) { Alert.alert('Lỗi','Họ tên và mã số không được để trống'); return; }
    setSaving(true);
    try {
      if (editMember) await membersAPI.update(editMember.id, { full_name:form.full_name.trim(), email:form.email||null, phone:form.phone||null, member_type:form.member_type });
      else            await membersAPI.add({ full_name:form.full_name.trim(), member_code:form.member_code.trim(), email:form.email||null, phone:form.phone||null, member_type:form.member_type, card_years:parseInt(form.card_years)||1 });
      setModalVisible(false); load();
    } catch (e) { Alert.alert('Lỗi', e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try { await membersAPI.delete(deleteTarget.id); setDeleteTarget(null); load(); }
    catch (e) { setDeleteTarget(null); Alert.alert('Không thể xóa', e.message); }
  };

  const renderMember = ({ item: m }) => (
    <Card style={s.card}>
      <View style={s.memberRow}>
        <View style={[s.avatar, { backgroundColor: isCardValid(m) ? colors.accent : colors.textDim }]}>
          <Text style={s.avatarTxt}>{m.full_name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={{flex:1}}>
          <Text style={s.memberName}>{m.full_name}</Text>
          <Text style={s.memberCode}>🪪 {m.member_code}</Text>
          {m.email && <Text style={s.memberDetail}>✉️ {m.email}</Text>}
          {m.phone && <Text style={s.memberDetail}>📞 {m.phone}</Text>}
        </View>
        <View style={{alignItems:'flex-end', gap:6}}>
          <Badge label={m.member_type} color="blue" />
          <Badge label={isCardValid(m) ? '✅ Còn hạn' : '❌ Hết hạn'} color={isCardValid(m) ? 'green' : 'red'} />
        </View>
      </View>
      <View style={s.actions}>
        <Btn label="✏️ Sửa" variant="ghost"  onPress={() => openEdit(m)}          style={s.actionBtn} />
        <Btn label="🗑️ Xóa" variant="danger" onPress={() => setDeleteTarget(m)}   style={s.actionBtn} />
      </View>
    </Card>
  );

  if (loading) return <Loading text="Đang tải danh sách bạn đọc..." />;

  return (
    <View style={s.container}>
      <View style={s.topBar}>
        <View style={{flex:1}}>
          <Text style={s.pageTitle}>Bạn đọc</Text>
          <Text style={s.pageSub}>{filtered.length} thành viên</Text>
        </View>
        <Btn label="+ Thêm" onPress={openAdd} style={{paddingVertical:8,paddingHorizontal:14}} />
      </View>

      <View style={s.searchWrap}>
        <Text style={{fontSize:16,marginRight:8}}>🔍</Text>
        <TextInput style={s.searchInput} placeholder="Tìm tên, mã số..." placeholderTextColor={colors.textDim}
          value={search} onChangeText={t => { setSearch(t); applyFilter(members, typeFilter, t); }} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom:8}} contentContainerStyle={{paddingHorizontal:16,gap:8}}>
        {TYPES.map(t => (
          <TouchableOpacity key={t} style={[s.typeBtn, typeFilter===t && s.typeBtnActive]}
            onPress={() => { setTypeFilter(t); applyFilter(members, t, search); }}>
            <Text style={[s.typeTxt, typeFilter===t && {color:colors.white}]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList data={filtered} keyExtractor={m => String(m.id)} renderItem={renderMember}
        contentContainerStyle={{padding:16,paddingBottom:32}}
        ListEmptyComponent={<Empty icon="👥" message="Không tìm thấy bạn đọc nào" />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.accent} />}
      />

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalVisible(false)}>
        <View style={s.modalContainer}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>{editMember ? '✏️ Sửa bạn đọc' : '👤 Thêm bạn đọc'}</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}><Text style={{fontSize:22,color:colors.textDim}}>✕</Text></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{padding:16}}>
            <Input label="Họ và tên *"   value={form.full_name}   onChangeText={v => setForm(f=>({...f,full_name:v}))}   placeholder="Nguyễn Văn A" />
            <Input label="Mã số *"       value={form.member_code} onChangeText={v => setForm(f=>({...f,member_code:v}))} placeholder="SV2024-001" editable={!editMember} />
            <Input label="Email"         value={form.email}       onChangeText={v => setForm(f=>({...f,email:v}))}       placeholder="email@example.com" keyboardType="email-address" />
            <Input label="Điện thoại"    value={form.phone}       onChangeText={v => setForm(f=>({...f,phone:v}))}       placeholder="0912 345 678" keyboardType="phone-pad" />
            <Text style={s.label}>Loại thành viên</Text>
            <View style={s.typePicker}>
              {['Sinh vien','Giang vien','Nghien cuu sinh','Can bo'].map(t => (
                <TouchableOpacity key={t} style={[s.typeOption, form.member_type===t && s.typeOptionActive]} onPress={() => setForm(f=>({...f,member_type:t}))}>
                  <Text style={[s.typeOptionTxt, form.member_type===t && {color:colors.white}]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {!editMember && <Input label="Số năm hiệu lực thẻ" value={form.card_years} onChangeText={v => setForm(f=>({...f,card_years:v}))} keyboardType="numeric" />}
            <View style={{flexDirection:'row',gap:10,marginTop:8}}>
              <Btn label="Hủy" variant="ghost" onPress={() => setModalVisible(false)} style={{flex:1}} />
              <Btn label={editMember ? '💾 Lưu' : '➕ Thêm'} onPress={handleSave} loading={saving} style={{flex:1}} />
            </View>
          </ScrollView>
        </View>
      </Modal>

      <ConfirmModal visible={!!deleteTarget} title="🗑️ Xóa bạn đọc"
        message={`Bạn có chắc muốn xóa\n"${deleteTarget?.full_name}"?`}
        confirmLabel="🗑️ Xóa" danger onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </View>
  );
}

const s = StyleSheet.create({
  container:       { flex:1, backgroundColor:colors.bg },
  topBar:          { flexDirection:'row', alignItems:'center', padding:16, paddingTop:56, justifyContent:'space-between' },
  pageTitle:       { fontSize:22, fontWeight:'700', color:colors.white },
  pageSub:         { fontSize:12, color:colors.textDim, marginTop:2 },
  searchWrap:      { flexDirection:'row', alignItems:'center', backgroundColor:colors.panel, borderRadius:10, marginHorizontal:16, marginBottom:10, paddingHorizontal:12, borderWidth:1, borderColor:colors.border },
  searchInput:     { flex:1, paddingVertical:10, color:colors.text, fontSize:14 },
  typeBtn:         { paddingHorizontal:14, paddingVertical:6, borderRadius:20, backgroundColor:colors.panel, borderWidth:1, borderColor:colors.border },
  typeBtnActive:   { backgroundColor:colors.accent, borderColor:colors.accent },
  typeTxt:         { fontSize:12, color:colors.textMid, fontWeight:'600' },
  card:            { marginBottom:10 },
  memberRow:       { flexDirection:'row', alignItems:'flex-start', marginBottom:10 },
  avatar:          { width:44, height:44, borderRadius:22, alignItems:'center', justifyContent:'center', marginRight:12 },
  avatarTxt:       { color:colors.white, fontWeight:'700', fontSize:18 },
  memberName:      { fontSize:14, fontWeight:'700', color:colors.white, marginBottom:2 },
  memberCode:      { fontSize:12, color:colors.accent, marginBottom:2 },
  memberDetail:    { fontSize:11, color:colors.textDim, marginTop:1 },
  actions:         { flexDirection:'row', gap:8 },
  actionBtn:       { flex:1, paddingVertical:7 },
  modalContainer:  { flex:1, backgroundColor:colors.bg },
  modalHeader:     { flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:16, borderBottomWidth:1, borderBottomColor:colors.border },
  modalTitle:      { fontSize:18, fontWeight:'700', color:colors.white },
  label:           { fontSize:12, color:colors.textMid, marginBottom:8, fontWeight:'500', textTransform:'uppercase', letterSpacing:.5 },
  typePicker:      { flexDirection:'row', flexWrap:'wrap', gap:8, marginBottom:14 },
  typeOption:      { paddingHorizontal:12, paddingVertical:7, borderRadius:8, backgroundColor:colors.panel, borderWidth:1, borderColor:colors.border },
  typeOptionActive:{ backgroundColor:colors.accent, borderColor:colors.accent },
  typeOptionTxt:   { fontSize:12, color:colors.textMid, fontWeight:'600' },
});
