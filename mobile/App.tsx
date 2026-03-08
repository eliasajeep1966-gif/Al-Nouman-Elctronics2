import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar, ActivityIndicator, View, Text, StyleSheet, I18nManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import ProductListScreen from './src/screens/ProductListScreen';
import ProductDetailsScreen from './src/screens/ProductDetailsScreen';
import AddProductScreen from './src/screens/AddProductScreen';
import { useStore } from './src/store/useStore';
import { Product } from './src/types';

const DARK_MODE_KEY = '@noman_dark_mode';

// Enable RTL for Arabic
if (!I18nManager.isRTL) {
  I18nManager.forceRTL(true);
}

export type RootStackParamList = {
  ProductList: undefined;
  ProductDetails: { product: Product };
  AddProduct: { category: 'parts' | 'tools' };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function AppContent() {
  const [isDarkMode, setIsDarkMode] = useState(false);

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

  if (!isLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingText}>جاري التحميل...</Text>
      </View>
    );
  }

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
