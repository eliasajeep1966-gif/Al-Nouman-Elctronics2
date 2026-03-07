import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar, ActivityIndicator, View, Text, StyleSheet } from 'react-native';

import ProductListScreen from './src/screens/ProductListScreen';
import ProductDetailsScreen from './src/screens/ProductDetailsScreen';
import AddProductScreen from './src/screens/AddProductScreen';
import { useStore } from './src/store/useStore';
import { Product } from './src/types';

// Define navigation types
export type RootStackParamList = {
  ProductList: undefined;
  ProductDetails: { product: Product };
  AddProduct: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function AppContent() {
  const { 
    products, 
    exchangeRate, 
    isLoaded, 
    addProduct, 
    deleteProduct, 
    sellProduct, 
    addLoss 
  } = useStore();

  if (!isLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a73e8" />
        <Text style={styles.loadingText}>جاري التحميل...</Text>
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#1a73e8',
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
          <ProductListScreen {...props} products={products} />
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
          <AddProductScreen {...props} onAdd={addProduct} />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar barStyle="light-content" backgroundColor="#1a73e8" />
      <AppContent />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});
