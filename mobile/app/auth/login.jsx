// mobile/app/auth/login.jsx
import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../hooks/useAuth';
import { Btn, Input } from '../../components/UI';
import { colors, shadows } from '../../constants/theme';

export default function LoginScreen() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const handleLogin = async () => {
    if (!username.trim()) { setError('Vui lòng nhập tên đăng nhập'); return; }
    if (!password)        { setError('Vui lòng nhập mật khẩu');      return; }
    setError(''); setLoading(true);
    try {
      await login(username.trim(), password);
      router.replace('/(tabs)');
    } catch (e) {
      setError(e.message || 'Sai tên đăng nhập hoặc mật khẩu');
    } finally { setLoading(false); }
  };

  return (
    <LinearGradient colors={['#0a0f1e', '#0d1527', '#0a0f1e']} style={{ flex: 1 }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

          <View style={s.logoWrap}>
            <LinearGradient colors={[colors.accent, colors.accent2]} style={s.logoIcon}>
              <Text style={{ fontSize: 36 }}>📚</Text>
            </LinearGradient>
            <Text style={s.logoText}>BiblioSphere</Text>
            <Text style={s.logoSub}>HỆ THỐNG QUẢN LÝ THƯ VIỆN</Text>
          </View>

          <View style={[s.card, shadows.lg]}>
            <Text style={s.cardTitle}>Đăng nhập</Text>
            <Text style={s.cardSub}>Chào mừng trở lại! 👋</Text>

            {error ? (
              <View style={s.errorBox}><Text style={s.errorTxt}>⚠️  {error}</Text></View>
            ) : null}

            <Input label="Tên đăng nhập" value={username} onChangeText={setUsername}
              placeholder="Nhập tên đăng nhập..." autoCapitalize="none" returnKeyType="next" />

            <View style={{ marginBottom: 14 }}>
              <Text style={s.label}>Mật khẩu</Text>
              <View style={s.pwRow}>
                <View style={{ flex: 1 }}>
                  <Input value={password} onChangeText={setPassword} placeholder="Nhập mật khẩu..."
                    secureTextEntry={!showPw} returnKeyType="done" onSubmitEditing={handleLogin}
                    containerStyle={{ marginBottom: 0 }} />
                </View>
                <TouchableOpacity onPress={() => setShowPw(v => !v)} style={s.eyeBtn}>
                  <Text style={{ fontSize: 18 }}>{showPw ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Btn label="🔑  Đăng nhập" onPress={handleLogin} loading={loading} style={{ marginTop: 4 }} />

            <View style={s.hint}>
              <Text style={s.hintTxt}>Tài khoản mặc định</Text>
              <Text style={s.hintCode}>admin  /  admin123</Text>
            </View>
          </View>

          <Text style={s.version}>BiblioSphere v1.0  •  Express.js + SQLite</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  scroll:    { flexGrow:1, justifyContent:'center', padding:24, paddingBottom:40 },
  logoWrap:  { alignItems:'center', marginBottom:32 },
  logoIcon:  { width:72, height:72, borderRadius:20, alignItems:'center', justifyContent:'center', marginBottom:14, ...shadows.md },
  logoText:  { fontSize:28, fontWeight:'700', color:colors.white, marginBottom:4 },
  logoSub:   { fontSize:11, color:colors.textDim, letterSpacing:2 },
  card:      { backgroundColor:colors.panel, borderRadius:20, padding:24, borderWidth:1, borderColor:colors.border },
  cardTitle: { fontSize:20, fontWeight:'700', color:colors.white, marginBottom:4 },
  cardSub:   { fontSize:13, color:colors.textDim, marginBottom:20 },
  errorBox:  { backgroundColor:'rgba(239,68,68,.1)', borderWidth:1, borderColor:'rgba(239,68,68,.3)', borderRadius:8, padding:12, marginBottom:16 },
  errorTxt:  { color:'#fca5a5', fontSize:13 },
  label:     { fontSize:12, color:colors.textMid, marginBottom:6, fontWeight:'500', textTransform:'uppercase', letterSpacing:.5 },
  pwRow:     { flexDirection:'row', alignItems:'center' },
  eyeBtn:    { paddingHorizontal:12, paddingBottom:2 },
  hint:      { marginTop:16, padding:12, backgroundColor:colors.navy, borderRadius:8, borderWidth:1, borderColor:colors.border, alignItems:'center' },
  hintTxt:   { fontSize:12, color:colors.textDim },
  hintCode:  { fontSize:13, color:colors.accent, fontWeight:'600', marginTop:2 },
  version:   { textAlign:'center', color:colors.textDim, fontSize:11, marginTop:24 },
});
