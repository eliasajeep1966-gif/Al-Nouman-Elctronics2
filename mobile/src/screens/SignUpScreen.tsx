import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../lib/supabase';

interface SignUpScreenProps {
  onSignUpSuccess: (userId: string) => void;
  onNavigateToLogin: () => void;
}

const INVITE_CODE = '2001';

export default function SignUpScreen({
  onSignUpSuccess,
  onNavigateToLogin,
}: SignUpScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = async () => {
    // Validation
    if (!email.trim() || !password.trim() || !confirmPassword.trim() || !inviteCode.trim()) {
      Alert.alert('خطأ', 'الرجاء تعبئة جميع الحقول');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('خطأ', 'كلمتا المرور غير متطابقتين');
      return;
    }

    if (password.length < 6) {
      Alert.alert('خطأ', 'يجب أن تكون كلمة المرور 6 أحرف على الأقل');
      return;
    }

    // Check invite code
    if (inviteCode !== INVITE_CODE) {
      Alert.alert('خطأ', 'رمز الدعوة غير صحيح');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: 'electronics-store://confirm-email',
        },
      });

      if (error) {
        Alert.alert('خطأ في إنشاء الحساب', error.message);
      } else if (data.user) {
        Alert.alert('نجاح', 'تم إنشاء الحساب بنجاح!');
        onSignUpSuccess(data.user.id);
      } else if (data.session) {
        // Email confirmation not required
        onSignUpSuccess(data.session.user.id);
      } else {
        // User created but needs email confirmation
        Alert.alert(
          'تم الإرسال',
          'تم إرسال رابط التأكيد إلى بريدك الإلكتروني. الرجاء التحقق من صندوق الوارد.'
        );
        onNavigateToLogin();
      }
    } catch (e) {
      Alert.alert('خطأ', 'حدث خطأ غير متوقع');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Background with blurred squares */}
      <View style={styles.backgroundContainer}>
        {[...Array(6)].map((_, i) => (
          <View
            key={i}
            style={[
              styles.blurredSquare,
              {
                left: `${15 + (i % 3) * 35}%`,
                top: `${10 + Math.floor(i / 3) * 40}%`,
                backgroundColor: i % 2 === 0 ? '#6366f1' : '#8b5cf6',
                transform: [{ rotate: `${(i * 45) % 360}deg` }],
              },
            ]}
          />
        ))}
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo/Title Section */}
          <View style={styles.titleContainer}>
            <Text style={styles.titleArabic}>الكَترونِيات النُّعمان</Text>
            <Text style={styles.titleEnglish}>Al-Nouman Electronics</Text>
          </View>

          {/* Sign Up Form */}
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>إنشاء حساب جديد</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>البريد الإلكتروني</Text>
              <TextInput
                style={styles.input}
                placeholder="example@email.com"
                placeholderTextColor="#9ca3af"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                textAlign="right"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>كلمة المرور</Text>
              <TextInput
                style={styles.input}
                placeholder="أدخل كلمة المرور"
                placeholderTextColor="#9ca3af"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                textAlign="right"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>تأكيد كلمة المرور</Text>
              <TextInput
                style={styles.input}
                placeholder="أدخل كلمة المرور مرة أخرى"
                placeholderTextColor="#9ca3af"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                textAlign="right"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>رمز الدعوة</Text>
              <TextInput
                style={styles.input}
                placeholder="أدخل رمز الدعوة"
                placeholderTextColor="#9ca3af"
                value={inviteCode}
                onChangeText={setInviteCode}
                keyboardType="number-pad"
                textAlign="right"
              />
            </View>

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleSignUp}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>إنشاء حساب</Text>
              )}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>أو</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.loginButton}
              onPress={onNavigateToLogin}
            >
              <Text style={styles.loginText}>
                لديك حساب بالفعل؟{' '}
                <Text style={styles.loginLink}>تسجيل دخول</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e1b4b',
  },
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  blurredSquare: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 20,
    opacity: 0.3,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  titleArabic: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(99, 102, 241, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
    letterSpacing: 2,
  },
  titleEnglish: {
    fontSize: 14,
    color: '#a5b4fc',
    marginTop: 6,
    letterSpacing: 1,
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    padding: 24,
    backdropFilter: 'blur(10px)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  formTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 14,
    color: '#c7d2fe',
    marginBottom: 6,
    textAlign: 'right',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  button: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  dividerText: {
    color: 'rgba(255, 255, 255, 0.6)',
    marginHorizontal: 12,
  },
  loginButton: {
    alignItems: 'center',
  },
  loginText: {
    color: '#c7d2fe',
    fontSize: 14,
  },
  loginLink: {
    color: '#818cf8',
    fontWeight: 'bold',
  },
});
