import React, { useState, useEffect, useRef } from 'react';
import { NavigationContainer, NavigationIndependentTree } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar, ActivityIndicator, View, Text, StyleSheet, I18nManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';

import ProductListScreen from './src/screens/ProductListScreen';
import ProductDetailsScreen from './src/screens/ProductDetailsScreen';
import AddProductScreen from './src/screens/AddProductScreen';
import LoginScreen from './src/screens/LoginScreen';
import { useStore } from './src/store/useStore';
import { supabase } from './src/lib/supabase';
import { Product } from './src/types';

const DARK_MODE_KEY = '@noman_dark_mode';
const USER_ID_KEY = '@noman_user_id';

// Enable RTL for Arabic
if (!I18nManager.isRTL) {
  I18nManager.forceRTL(true);
}

export type RootStackParamList = {
  Login: undefined;
  ProductList: undefined;
  ProductDetails: { product: Product };
  AddProduct: { category: 'parts' | 'tools' };
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const USER_EMAIL_KEY = '@noman_user_email';

function AppContent() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const { 
    products, 
    logs,
    losses,
    exchangeRate, 
    isLoaded,
    isOnline,
    addProduct, 
    deleteProduct, 
    sellProduct, 
    addLoss,
    setExchangeRate,
    exportData,
    importData,
    clearAllData,
  } = useStore();

  // Check for existing session
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem(USER_ID_KEY);
        const storedEmail = await AsyncStorage.getItem(USER_EMAIL_KEY);
        if (storedUserId) {
          setUserId(storedUserId);
        }
        if (storedEmail) {
          setUserEmail(storedEmail);
        }
      } catch (e) {
        console.error('Error checking auth:', e);
      } finally {
        setIsAuthLoading(false);
      }
    };
    checkAuth();
  }, []);

  // Handle deep links for password reset and email confirmation
  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      const { url } = event;
      console.log('Deep link received:', url);
      
      // Check if it's a password reset or email confirmation link
      if (url.includes('reset-password') || url.includes('confirm-email')) {
        // Supabase uses hash (#) for auth tokens
        if (url.includes('#access_token')) {
          try {
            // Extract tokens from URL hash
            const hashPart = url.split('#')[1];
            const params = new URLSearchParams(hashPart);
            const accessToken = params.get('access_token');
            const refreshToken = params.get('refresh_token');
            
            console.log('Extracted tokens:', { accessToken: !!accessToken, refreshToken: !!refreshToken });
            
            if (accessToken && refreshToken) {
              const { data, error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });
              
              if (error) {
                console.error('Error setting session:', error);
              } else if (data.session) {
                console.log('Session set successfully');
                setUserId(data.session.user.id);
                await AsyncStorage.setItem(USER_ID_KEY, data.session.user.id);
              }
            }
          } catch (error) {
            console.error('Error handling deep link:', error);
          }
        }
      }
    };

    // Get initial URL
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    // Listen for deep links
    const subscription = Linking.addEventListener('url', handleDeepLink);
    
    return () => {
      subscription.remove();
    };
  }, []);

  // Load dark mode preference
  useEffect(() => {
    AsyncStorage.getItem(DARK_MODE_KEY).then(val => {
      if (val !== null) setIsDarkMode(JSON.parse(val));
    });
  }, []);

  const toggleDarkMode = () => {
    const newValue = !isDarkMode;
    setIsDarkMode(newValue);
    AsyncStorage.setItem(DARK_MODE_KEY, JSON.stringify(newValue));
  };

  const handleLoginSuccess = async (newUserId: string, email: string) => {
    setUserId(newUserId);
    setUserEmail(email);
    await AsyncStorage.setItem(USER_ID_KEY, newUserId);
    await AsyncStorage.setItem(USER_EMAIL_KEY, email);
  };

  const handleLogout = async () => {
    setUserId(null);
    setUserEmail(null);
    await AsyncStorage.removeItem(USER_ID_KEY);
    await AsyncStorage.removeItem(USER_EMAIL_KEY);
  };

  // Show loading while checking auth
  if (isAuthLoading || !isLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingText}>جاري التحميل...</Text>
      </View>
    );
  }

  // If not logged in, show auth screens
  if (!userId) {
    return (
      <NavigationIndependentTree>
        <StatusBar barStyle="light-content" backgroundColor="#1e1b4b" />
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login">
            {(props) => (
              <LoginScreen
                {...props}
                onLoginSuccess={handleLoginSuccess}
                onNavigateToSignUp={() => props.navigation.navigate('SignUp')}
              />
            )}
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationIndependentTree>
    );
  }

  // User is logged in - show main app
  return (
    <NavigationIndependentTree>
      <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#312e81',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="ProductList"
        options={{ headerShown: false }}
      >
        {(props) => (
          <ProductListScreen 
            {...props} 
            products={products}
            exchangeRate={exchangeRate}
            logs={logs}
            losses={losses}
            isDarkMode={isDarkMode}
            onToggleDarkMode={toggleDarkMode}
            onAdd={addProduct}
            onSell={sellProduct}
            onDelete={deleteProduct}
            onLoss={addLoss}
            onSetExchangeRate={setExchangeRate}
            onClearAll={clearAllData}
            onExportData={exportData}
            onImportData={importData}
            userId={userId}
            userEmail={userEmail}
            onLogout={handleLogout}
            isOnline={isOnline}
          />
        )}
      </Stack.Screen>

      <Stack.Screen
        name="ProductDetails"
        options={{
          title: 'تفاصيل المنتج',
          headerBackTitle: 'رجوع',
        }}
      >
        {(props) => (
          <ProductDetailsScreen
            {...props}
            products={products}
            onSell={sellProduct}
            onDelete={deleteProduct}
            onLoss={addLoss}
            exchangeRate={exchangeRate}
            isDarkMode={isDarkMode}
          />
        )}
      </Stack.Screen>

      <Stack.Screen
        name="AddProduct"
        options={{
          title: 'إضافة منتج',
          headerBackTitle: 'رجوع',
          presentation: 'modal',
        }}
      >
        {(props) => (
          <AddProductScreen 
            {...props} 
            onAdd={addProduct}
            exchangeRate={exchangeRate}
            category={props.route.params?.category || 'parts'}
            isDarkMode={isDarkMode}
            userId={userId}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
    </NavigationIndependentTree>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar barStyle="light-content" backgroundColor="#312e81" />
      <AppContent />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
  },
});
