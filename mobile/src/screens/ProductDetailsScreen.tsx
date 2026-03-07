import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Product } from '../types';

type RootStackParamList = {
  ProductList: undefined;
  ProductDetails: { product: Product };
  AddProduct: undefined;
};

type DetailsProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ProductDetails'>;
  route: RouteProp<RootStackParamList, 'ProductDetails'>;
  products: Product[];
  onSell: (productId: string) => void;
  onDelete: (productId: string) => void;
  onLoss: (productId: string) => void;
  exchangeRate: number;
};

export default function ProductDetailsScreen({
  navigation,
  route,
  products,
  onSell,
  onDelete,
  onLoss,
  exchangeRate,
}: DetailsProps) {
  const { product } = route.params;
  
  // الحصول على أحدث بيانات المنتج من الـ store
  const currentProduct = products.find(p => p.id === product.id) || product;
  
  const profit = currentProduct.sellingPrice - currentProduct.originalPrice;
  const profitUSD = currentProduct.sellingPriceUSD && currentProduct.originalPriceUSD
    ? currentProduct.sellingPriceUSD - currentProduct.originalPriceUSD
    : null;

  const handleSell = () => {
    if (currentProduct.quantity <= 0) {
      Alert.alert('تنبيه', 'لا توجد وحدات متوفرة للبيع!');
      return;
    }
    Alert.alert(
      'تأكيد البيع',
      `هل أنت متأكد من بيع "${currentProduct.name}"؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        { 
          text: 'نعم', 
          onPress: () => onSell(currentProduct.id)
        },
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'تأكيد الحذف',
      `هل أنت متأكد من حذف "${currentProduct.name}"؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        { 
          text: 'حذف', 
          style: 'destructive',
          onPress: () => {
            onDelete(currentProduct.id);
            navigation.goBack();
          }
        },
      ]
    );
  };

  const handleLoss = () => {
    if (currentProduct.quantity <= 0) {
      Alert.alert('تنبيه', 'لا توجد وحدات متوفرة!');
      return;
    }
    Alert.alert(
      'تسجيل خسارة',
      `هل تريد تسجيل خسارة لـ "${currentProduct.name}"؟\nسيتم خصم وحدة من المخزون.`,
      [
        { text: 'إلغاء', style: 'cancel' },
        { 
          text: 'تأكيد', 
          onPress: () => onLoss(currentProduct.id)
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.name}>{currentProduct.name}</Text>
          <View style={styles.categoryBadge}>
            <Text style={styles.category}>
              {currentProduct.category === 'parts' ? 'قطع غيار' : 'أدوات'}
            </Text>
          </View>
        </View>

        {/* Quantity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>الكمية</Text>
          <View style={styles.quantityCard}>
            <Text style={styles.quantity}>{currentProduct.quantity}</Text>
            <Text style={styles.quantityLabel}>وحدة متوفرة</Text>
          </View>
        </View>

        {/* Prices */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>الأسعار</Text>
          
          <View style={styles.priceRow}>
            <View style={styles.priceCard}>
              <Text style={styles.priceLabel}>سعر التكلفة</Text>
              <Text style={styles.priceValue}>
                {currentProduct.originalPrice.toLocaleString()} ل.س
              </Text>
              {currentProduct.originalPriceUSD && (
                <Text style={styles.priceValueUSD}>
                  ${currentProduct.originalPriceUSD}
                </Text>
              )}
            </View>
            
            <View style={[styles.priceCard, styles.priceCardPrimary]}>
              <Text style={styles.priceLabel}>سعر البيع</Text>
              <Text style={styles.priceValueWhite}>
                {currentProduct.sellingPrice.toLocaleString()} ل.س
              </Text>
              {currentProduct.sellingPriceUSD && (
                <Text style={styles.priceValueUSDSmall}>
                  ${currentProduct.sellingPriceUSD}
                </Text>
              )}
            </View>
          </View>

          {/* Profit */}
          <View style={styles.profitCard}>
            <Text style={styles.profitLabel}>الربح لكل وحدة</Text>
            <Text style={styles.profitValue}>
              {profit.toLocaleString()} ل.س
            </Text>
            {profitUSD !== null && (
              <Text style={styles.profitValueUSD}>
                ${profitUSD}
              </Text>
            )}
          </View>
        </View>

        {/* Specifications */}
        {currentProduct.specifications && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>المواصفات</Text>
            <View style={styles.specsCard}>
              <Text style={styles.specsText}>{currentProduct.specifications}</Text>
            </View>
          </View>
        )}

        {/* Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>معلومات إضافية</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>تاريخ الإضافة:</Text>
              <Text style={styles.infoValue}>{currentProduct.createdAt}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>سعر الصرف:</Text>
              <Text style={styles.infoValue}>{exchangeRate.toLocaleString()} ل.س/$</Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.sellButton]}
            onPress={handleSell}
          >
            <Text style={styles.actionButtonText}>💰 بيع</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.lossButton]}
            onPress={handleLoss}
          >
            <Text style={styles.actionButtonText}>📉 خسارة</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={handleDelete}
          >
            <Text style={styles.actionButtonText}>🗑️ حذف</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#1a73e8',
    padding: 24,
    paddingTop: 40,
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  categoryBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8,
  },
  category: {
    color: '#fff',
    fontSize: 14,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
  },
  quantityCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quantity: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#1a73e8',
  },
  quantityLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  priceRow: {
    flexDirection: 'row',
    gap: 12,
  },
  priceCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  priceCardPrimary: {
    backgroundColor: '#1a73e8',
  },
  priceLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  priceValueWhite: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  priceValueUSD: {
    fontSize: 14,
    color: '#4caf50',
    marginTop: 4,
  },
  priceValueUSDSmall: {
    fontSize: 14,
    color: '#e3f2fd',
    marginTop: 4,
  },
  profitCard: {
    backgroundColor: '#e8f5e9',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#4caf50',
  },
  profitLabel: {
    fontSize: 14,
    color: '#666',
  },
  profitValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4caf50',
    marginTop: 4,
  },
  profitValueUSD: {
    fontSize: 16,
    color: '#2e7d32',
    marginTop: 2,
  },
  specsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  specsText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  actions: {
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  actionButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  sellButton: {
    backgroundColor: '#4caf50',
  },
  lossButton: {
    backgroundColor: '#ff9800',
  },
  deleteButton: {
    backgroundColor: '#f44336',
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
});
