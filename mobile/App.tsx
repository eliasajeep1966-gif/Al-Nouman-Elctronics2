import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar, ActivityIndicator, View, Text, StyleSheet, I18nManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import ProductListScreen from './src/screens/ProductListScreen';
import ProductDetailsScreen from './src/screens/ProductDetailsScreen';
import AddProductScreen from './src/screens/AddProductScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import { useStore } from './src/store/useStore';
import { Product } from './src/types';

const DARK_MODE_KEY = '@noman_dark_mode';
const USER_ID_KEY = '@noman_user_id';

// Enable RTL for Arabic
if (!I18nManager.isRTL) {
  I18nManager.forceRTL(true);
}

export type RootStackParamList = {
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  ProductList: undefined;
  ProductDetails: { product: Product };
  AddProduct: { category: 'parts' | 'tools' };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function AppContent() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const { 
    products, 
    logs,
    losses,
    exchangeRate, 
    isLoaded, 
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
        if (storedUserId) {
          setUserId(storedUserId);
        }
      } catch (e) {
        console.error('Error checking auth:', e);
      } finally {
        setIsAuthLoading(false);
      }
    };
    checkAuth();
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

  const handleLoginSuccess = async (newUserId: string) => {
    setUserId(newUserId);
    await AsyncStorage.setItem(USER_ID_KEY, newUserId);
  };

  const handleLogout = async () => {
    setUserId(null);
    await AsyncStorage.removeItem(USER_ID_KEY);
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
      <NavigationContainer>
        <StatusBar barStyle="light-content" backgroundColor="#1e1b4b" />
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login">
            {(props) => (
              <LoginScreen
                {...props}
                onLoginSuccess={handleLoginSuccess}
                onNavigateToSignUp={() => props.navigation.navigate('SignUp')}
                onNavigateToForgotPassword={() => props.navigation.navigate('ForgotPassword')}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="SignUp">
            {(props) => (
              <SignUpScreen
                {...props}
                onSignUpSuccess={handleLoginSuccess}
                onNavigateToLogin={() => props.navigation.navigate('Login')}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="ForgotPassword">
            {(props) => (
              <ForgotPasswordScreen
                {...props}
                onNavigateToLogin={() => props.navigation.navigate('Login')}
              />
            )}
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  // User is logged in - show main app
  return (
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
            onLogout={handleLogout}
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
