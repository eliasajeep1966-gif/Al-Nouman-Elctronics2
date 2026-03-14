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

interface LoginScreenProps {
  onLoginSuccess: (userId: string, email: string) => void;
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
        onLoginSuccess(data.user.id, email.trim());
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
                opacity: 0.2 + (parseInt(bit) * 0.15),
              },
            ]}
          >
            {bit}
          </Text>
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
            <View style={styles.circuitIconContainer}>
              <Text style={styles.circuitIcon}>{'⚡'}</Text>
            </View>
            <Text style={styles.titleArabic}>الكَترونِيات النُّعمان</Text>
            <Text style={styles.titleEnglish}>Al-Nouman Electronics</Text>
          </View>

          {/* Login Form - Glassmorphism */}
          <View style={styles.formContainer}>
            <View style={styles.formTitleContainer}>
              <Text style={styles.formTitle}>تسجيل الدخول</Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>البريد الإلكتروني</Text>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="rgba(212, 175, 55, 0.5)"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                textAlign="center"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>كلمة المرور</Text>
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="rgba(212, 175, 55, 0.5)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                textAlign="center"
              />
            </View>

            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.buttonText}>SIGN IN</Text>
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
    backgroundColor: '#0a1929',
  },
  binaryContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  binaryText: {
    position: 'absolute',
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e3a8a',
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
  circuitIconContainer: {
    width: 120,
    height: 120,
    backgroundColor: 'rgba(30, 58, 138, 0.8)',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#d4af37',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  circuitIcon: {
    fontSize: 60,
    color: '#d4af37',
  },
  titleArabic: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#f5d042',
    textShadowColor: 'rgba(212, 175, 55, 0.5)',
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
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 24,
    padding: 30,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.5)',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  formTitleContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#d4af37',
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
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
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: '#d4af37',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    textAlign: 'center',
  },
  forgotPasswordText: {
    color: '#93c5fd',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
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
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});
