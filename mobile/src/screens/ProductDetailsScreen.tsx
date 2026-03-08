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
  
  // حساب الربح
  const profit = currentProduct.sellingPrice - currentProduct.originalPrice;
  const profitPercent = currentProduct.originalPrice > 0
    ? ((profit / currentProduct.originalPrice) * 100).toFixed(1)
    : '0';

  // حساب الأسعار بالدولار
  const originalUSD = currentProduct.originalPriceUSD ?? (currentProduct.originalPrice / exchangeRate);
  const sellingUSD = currentProduct.sellingPriceUSD ?? (currentProduct.sellingPrice / exchangeRate);
  const profitUSD = sellingUSD - originalUSD;

  const isOutOfStock = currentProduct.quantity === 0;
  const isLowStock = currentProduct.quantity > 0 && currentProduct.quantity <= 3;

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
          <View style={styles.metaRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.category}>
                {currentProduct.category === 'parts' ? '⚙️ قطع غيار' : '🖥️ أدوات'}
              </Text>
            </View>
            <Text style={styles.date}>{currentProduct.createdAt}</Text>
          </View>
        </View>

        {/* Stock Badge */}
        <View style={styles.stockSection}>
          <View style={[
            styles.stockBadge,
            isOutOfStock && styles.stockOutOfStock,
            isLowStock && styles.stockLowStock,
            !isOutOfStock && !isLowStock && styles.stockAvailable,
          ]}>
            <Text style={[
              styles.stockText,
              isOutOfStock && styles.stockTextOut,
              isLowStock && styles.stockTextLow,
            ]}>
              {isOutOfStock ? '🚫 نفد' : isLowStock ? `⚠️ ${currentProduct.quantity} قطعة` : `✅ ${currentProduct.quantity} قطعة`}
            </Text>
          </View>
        </View>

        {/* Prices - Like Website */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>الأسعار</Text>
          
          <View style={styles.priceRow}>
            <View style={styles.priceCard}>
              <Text style={styles.priceLabel}>سعر التكلفة</Text>
              <Text style={styles.priceValueUSD}>${originalUSD.toFixed(2)}</Text>
              <Text style={styles.priceValueSYP}>{currentProduct.originalPrice.toLocaleString('en-US')} ل.س</Text>
            </View>
            
            <View style={[styles.priceCard, styles.priceCardPrimary]}>
              <Text style={styles.priceLabelWhite}>سعر البيع</Text>
              <Text style={styles.priceValueUSDWhite}>${sellingUSD.toFixed(2)}</Text>
              <Text style={styles.priceValueSYPWhite}>{currentProduct.sellingPrice.toLocaleString('en-US')} ل.س</Text>
            </View>
          </View>

          {/* Profit Card */}
          <View style={[
            styles.profitCard,
            profit >= 0 ? styles.profitCardGreen : styles.profitCardRed
          ]}>
            <Text style={styles.profitLabel}>
              {profit >= 0 ? '📈 الربح' : '📉 خسارة'}
            </Text>
            <View style={styles.profitRow}>
              <View style={styles.profitItem}>
                <Text style={[
                  styles.profitValue,
                  profit >= 0 ? styles.profitValueGreen : styles.profitValueRed
                ]}>
                  {profit >= 0 ? '+' : ''}${profitUSD.toFixed(2)}
                </Text>
                <Text style={styles.profitPercent}>{profitPercent}%</Text>
              </View>
              <View style={styles.profitItem}>
                <Text style={[
                  styles.profitValueSYP,
                  profit >= 0 ? styles.profitValueGreen : styles.profitValueRed
                ]}>
                  {profit >= 0 ? '+' : ''}{profit.toLocaleString('en-US')} ل.س
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Specifications */}
        {currentProduct.specifications && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📝 المواصفات</Text>
            <View style={styles.specsCard}>
              <Text style={styles.specsText}>{currentProduct.specifications}</Text>
            </View>
          </View>
        )}

        {/* Exchange Rate Info */}
        <View style={styles.section}>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>💱 سعر الصرف:</Text>
              <Text style={styles.infoValue}>{exchangeRate.toLocaleString('en-US')} ل.س/$</Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.sellButton]}
            onPress={handleSell}
            disabled={isOutOfStock}
          >
            <Text style={styles.actionButtonText}>💰 بيع</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.lossButton]}
            onPress={handleLoss}
            disabled={isOutOfStock}
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
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#1e293b',
    padding: 24,
    paddingTop: 40,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  name: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 12,
  },
  categoryBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  category: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
  date: {
    color: '#94a3b8',
    fontSize: 12,
  },
  stockSection: {
    paddingHorizontal: 16,
    marginTop: -20,
  },
  stockBadge: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stockAvailable: {
    backgroundColor: '#dcfce7',
    borderWidth: 2,
    borderColor: '#86efac',
  },
  stockLowStock: {
    backgroundColor: '#fef3c7',
    borderWidth: 2,
    borderColor: '#fcd34d',
  },
  stockOutOfStock: {
    backgroundColor: '#fee2e2',
    borderWidth: 2,
    borderColor: '#fca5a5',
  },
  stockText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  stockTextOut: {
    color: '#dc2626',
  },
  stockTextLow: {
    color: '#d97706',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    gap: 12,
  },
  priceCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  priceCardPrimary: {
    backgroundColor: '#4f46e5',
    borderColor: '#4f46e5',
  },
  priceLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  priceLabelWhite: {
    fontSize: 12,
    color: '#c7d2fe',
    marginBottom: 4,
  },
  priceValueUSD: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  priceValueUSDWhite: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  priceValueSYP: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  priceValueSYPWhite: {
    fontSize: 13,
    color: '#c7d2fe',
    marginTop: 2,
  },
  profitCard: {
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
  },
  profitCardGreen: {
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#86efac',
  },
  profitCardRed: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  profitLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
    textAlign: 'center',
  },
  profitRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  profitItem: {
    alignItems: 'center',
  },
  profitValue: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  profitValueGreen: {
    color: '#16a34a',
  },
  profitValueRed: {
    color: '#dc2626',
  },
  profitPercent: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  profitValueSYP: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  specsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  specsText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 22,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  actions: {
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  actionButton: {
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sellButton: {
    backgroundColor: '#10b981',
  },
  lossButton: {
    backgroundColor: '#f59e0b',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
});
