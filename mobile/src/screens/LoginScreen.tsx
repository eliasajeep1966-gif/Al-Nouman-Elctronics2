import React, { useState, useEffect } from 'react';
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

interface LoginScreenProps {
  onLoginSuccess: (userId: string) => void;
}

const BINARY_PATTERN = '0101100101101010010110100101101010011010101100101011010010110100101';

export default function LoginScreen({
  onLoginSuccess,
}: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('خطأ', 'الرجاء إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        Alert.alert('خطأ في تسجيل الدخول', error.message);
      } else if (data.user) {
        onLoginSuccess(data.user.id);
      }
    } catch (e) {
      Alert.alert('خطأ', 'حدث خطأ غير متوقع');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Binary Background Pattern */}
      <View style={styles.binaryContainer}>
        {BINARY_PATTERN.split('').map((bit, index) => (
          <Text
            key={index}
            style={[
              styles.binaryText,
              {
                left: `${(index % 20) * 5}%`,
                top: `${Math.floor(index / 20) * 6}%`,
                opacity: 0.15 + (parseInt(bit) * 0.1),
              },
            ]}
          >
            {bit}
          </Text>
        ))}
      </View>

      {/* Blue Gradient Background */}
      <View style={styles.gradientBackground} />

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
            <Text style={styles.titleArabic}>إلكترونيات النعمان</Text>
            <Text style={styles.titleEnglish}>Al-Nouman Electronics</Text>
            <View style={styles.goldLine} />
          </View>

          {/* Login Form - Frosted Glass */}
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>تسجيل الدخول</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>البريد الإلكتروني</Text>
              <TextInput
                style={styles.input}
                placeholder="example@email.com"
                placeholderTextColor="rgba(212, 175, 55, 0.5)"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                textAlign="right"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>كلمة المرور</Text>
              <TextInput
                style={styles.input}
                placeholder="أدخل كلمة المرور"
                placeholderTextColor="rgba(212, 175, 55, 0.5)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                textAlign="right"
              />
            </View>

            <Text style={styles.forgotPasswordText}>نسيت كلمة المرور؟ تواصل مع المالك</Text>

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#1e3a8a" />
              ) : (
                <Text style={styles.buttonText}>دخول</Text>
              )}
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
    backgroundColor: '#1e3a8a',
  },
  binaryContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  binaryText: {
    position: 'absolute',
    fontSize: 14,
    fontWeight: 'bold',
    color: '#d4af37',
  },
  gradientBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1e3a8a',
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
    marginBottom: 40,
  },
  titleArabic: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#d4af37',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
    letterSpacing: 2,
  },
  titleEnglish: {
    fontSize: 16,
    color: '#93c5fd',
    marginTop: 12,
    letterSpacing: 2,
    fontWeight: '500',
  },
  goldLine: {
    width: 100,
    height: 3,
    backgroundColor: '#d4af37',
    marginTop: 16,
    borderRadius: 2,
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#d4af37',
    textAlign: 'center',
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#d4af37',
    marginBottom: 8,
    textAlign: 'right',
    fontWeight: '600',
  },
  input: {
    backgroundColor: 'rgba(30, 58, 138, 0.5)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#d4af37',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    textAlign: 'right',
  },
  forgotPasswordText: {
    color: '#93c5fd',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#d4af37',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#d4af37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#1e3a8a',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
