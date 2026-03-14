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
  ImageBackground,
  Image,
} from 'react-native';
import { supabase } from '../lib/supabase';

import { useFonts, Cairo_700Bold } from '@expo-google-fonts/cairo';

interface LoginScreenProps {
  onLoginSuccess: (userId: string, email: string) => void;
}

const backgroundImage = require('../../assets/background.png');
const logoImage = require('../../assets/logo.png');

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [fontsLoaded] = useFonts({
    Cairo_700Bold,
  });

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

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ImageBackground
      source={backgroundImage}
      style={styles.container}
      resizeMode="cover"
    >
      <KeyboardAvoidingView
        behavior="padding"
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>إلكترونيات النعمان</Text>
          <Image source={logoImage} style={styles.logo} resizeMode="contain" alt="Logo of إلكترونيات النعمان" />

          <View style={styles.formContainer}>
            <View style={styles.glassInputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#ccc"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
            <View style={styles.glassInputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#ccc"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#111827" />
              ) : (
                <Text style={styles.buttonText}>SIGN IN</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logo: {
    width: 140,
    height: 140,
    marginBottom: 25,
  },
  title: {
    fontSize: 40,
    color: '#D4AF37',
    marginBottom: 20,
    fontFamily: 'Cairo_700Bold',
  },
  formContainer: {
    width: '100%',
    backgroundColor: 'rgba(17, 24, 39, 0.8)',
    borderRadius: 20,
    padding: 25,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  glassInputContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 8,
    marginBottom: 20,
  },
  input: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#D4AF37',
    borderRadius: 30,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: 'bold',
  },
  forgotPasswordText: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
  },
});
