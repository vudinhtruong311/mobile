// mobile/components/UI.jsx
import { View, Text, TouchableOpacity, ActivityIndicator,
         TextInput, StyleSheet, Modal, Pressable } from 'react-native';
import { colors, shadows } from '../constants/theme';

export function Card({ children, style }) {
  return <View style={[s.card, shadows.sm, style]}>{children}</View>;
}

export function Btn({ label, onPress, variant='primary', loading, style, disabled }) {
  const bg = { primary:colors.accent, success:colors.green, danger:colors.red, ghost:'transparent', outline:'transparent' }[variant];
  const tc = variant==='ghost'||variant==='outline' ? colors.textMid : colors.white;
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled||loading}
      style={[s.btn,{backgroundColor:bg,borderWidth:variant==='outline'?1:0,borderColor:colors.border},(disabled||loading)&&{opacity:.5},style]}
      activeOpacity={.75}>
      {loading ? <ActivityIndicator color={colors.white} size="small"/>
               : <Text style={[s.btnTxt,{color:tc}]}>{label}</Text>}
    </TouchableOpacity>
  );
}

export function Input({ label, error, inputStyle, containerStyle, ...props }) {
  return (
    <View style={[{marginBottom:14},containerStyle]}>
      {label && <Text style={s.label}>{label}</Text>}
      <TextInput style={[s.input,error&&s.inputErr,inputStyle]} placeholderTextColor={colors.textDim} {...props}/>
      {error && <Text style={s.errTxt}>{error}</Text>}
    </View>
  );
}

export function Badge({ label, color='green' }) {
  const bg = {green:'#064e3b',amber:'#78350f',red:'#7f1d1d',blue:'#1e3a8a'}[color]||'#1e3a8a';
  const tc = {green:colors.green,amber:colors.amber,red:colors.red,blue:colors.accent}[color]||colors.accent;
  return <View style={[s.badge,{backgroundColor:bg}]}><Text style={[s.badgeTxt,{color:tc}]}>{label}</Text></View>;
}

export function Empty({ icon='📭', message='Không có dữ liệu' }) {
  return <View style={s.empty}><Text style={s.emptyIcon}>{icon}</Text><Text style={s.emptyTxt}>{message}</Text></View>;
}

export function Loading({ text='Đang tải...' }) {
  return <View style={s.loadWrap}><ActivityIndicator color={colors.accent} size="large"/><Text style={s.loadTxt}>{text}</Text></View>;
}

export function StatCard({ icon, value, label, color=colors.accent }) {
  return (
    <Card style={s.statCard}>
      <Text style={s.statIcon}>{icon}</Text>
      <Text style={[s.statVal,{color}]}>{value??'—'}</Text>
      <Text style={s.statLbl}>{label}</Text>
    </Card>
  );
}

export function ConfirmModal({ visible, title, message, onConfirm, onCancel, confirmLabel='Xác nhận', danger=false }) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel}>
      <Pressable style={s.overlay} onPress={onCancel}>
        <Pressable style={s.confirmBox}>
          <Text style={s.confirmTitle}>{title}</Text>
          <Text style={s.confirmMsg}>{message}</Text>
          <View style={s.confirmBtns}>
            <Btn label="Hủy" variant="ghost" onPress={onCancel} style={{flex:1,marginRight:8}}/>
            <Btn label={confirmLabel} variant={danger?'danger':'primary'} onPress={onConfirm} style={{flex:1}}/>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  card:        { backgroundColor:colors.card, borderRadius:14, borderWidth:1, borderColor:colors.border, padding:16, marginBottom:12 },
  btn:         { paddingVertical:12, paddingHorizontal:20, borderRadius:10, alignItems:'center', justifyContent:'center' },
  btnTxt:      { fontSize:14, fontWeight:'600' },
  label:       { fontSize:12, color:colors.textMid, marginBottom:6, fontWeight:'500', textTransform:'uppercase', letterSpacing:.5 },
  input:       { backgroundColor:colors.panel, borderWidth:1, borderColor:colors.border, borderRadius:10, paddingHorizontal:14, paddingVertical:11, color:colors.text, fontSize:14 },
  inputErr:    { borderColor:colors.red },
  errTxt:      { fontSize:11, color:colors.red, marginTop:4 },
  badge:       { paddingHorizontal:10, paddingVertical:3, borderRadius:20 },
  badgeTxt:    { fontSize:11, fontWeight:'600' },
  empty:       { alignItems:'center', paddingVertical:48 },
  emptyIcon:   { fontSize:40, marginBottom:12 },
  emptyTxt:    { color:colors.textDim, fontSize:14 },
  loadWrap:    { flex:1, alignItems:'center', justifyContent:'center', paddingVertical:48 },
  loadTxt:     { color:colors.textDim, marginTop:12, fontSize:14 },
  statCard:    { flex:1, alignItems:'center', padding:14, marginHorizontal:4 },
  statIcon:    { fontSize:24, marginBottom:6 },
  statVal:     { fontSize:22, fontWeight:'700', marginBottom:2 },
  statLbl:     { fontSize:10, color:colors.textDim, textAlign:'center', textTransform:'uppercase' },
  overlay:     { flex:1, backgroundColor:'rgba(5,8,22,.85)', justifyContent:'center', alignItems:'center', padding:24 },
  confirmBox:  { backgroundColor:colors.panel, borderRadius:16, padding:24, width:'100%', maxWidth:340, borderWidth:1, borderColor:colors.border },
  confirmTitle:{ fontSize:17, fontWeight:'700', color:colors.text, marginBottom:10, textAlign:'center' },
  confirmMsg:  { fontSize:13, color:colors.textMid, textAlign:'center', marginBottom:20, lineHeight:20 },
  confirmBtns: { flexDirection:'row' },
});
