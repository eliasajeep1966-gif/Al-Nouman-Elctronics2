import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Product } from '../types';

const { width } = Dimensions.get('window');

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
  isDarkMode: boolean; // لم يعد يؤثر كثيراً لأننا نعتمد ثيم موحد داكن/زجاجي
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
    <LinearGradient colors={['#1e1b4b', '#000']} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.name}>{currentProduct.name}</Text>
            <View style={styles.metaRow}>
              <BlurView intensity={20} tint="light" style={styles.categoryBadge}>
                <Text style={styles.category}>
                  {currentProduct.category === 'parts' ? '⚙️  عناصـــر  ' : '🖥️ أجهزة'}
                </Text>
              </BlurView>
              <Text style={styles.date}>{currentProduct.createdAt}</Text>
            </View>
          </View>

          {/* Stock Badge */}
          <View style={styles.stockSection}>
            <BlurView 
              intensity={20} 
              tint="dark" 
              style={[
                styles.stockBadge,
                isOutOfStock ? { borderColor: 'rgba(248, 113, 113, 0.5)' } :
                isLowStock ? { borderColor: 'rgba(251, 191, 36, 0.5)' } :
                { borderColor: 'rgba(74, 222, 128, 0.3)' }
              ]}
            >
              <Text style={[
                styles.stockText,
                isOutOfStock ? { color: '#f87171' } :
                isLowStock ? { color: '#fbbf24' } :
                { color: '#4ade80' }
              ]}>
                {isOutOfStock ? '🚫 نفد' : isLowStock ? `⚠️ ${currentProduct.quantity} قطعة متوفرة` : `✅ ${currentProduct.quantity} قطعة متوفرة`}
              </Text>
            </BlurView>
          </View>

          {/* Prices Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>الأسعار</Text>
            <View style={styles.priceRow}>
              <BlurView intensity={15} tint="light" style={styles.priceCard}>
                <Text style={styles.priceLabel}>سعر التكلفة </Text>
                <Text style={styles.priceValueUSD}>${originalUSD.toFixed(2)}</Text>
                <Text style={styles.priceValueSYP}>{currentProduct.originalPrice.toLocaleString('en-US')} ل.س</Text>
              </BlurView>
              
              <BlurView intensity={20} tint="dark" style={[styles.priceCard, { borderColor: '#D4AF37' }]}>
                <Text style={[styles.priceLabel, { color: '#D4AF37' }]}>سعر البيع  </Text>
                <Text style={[styles.priceValueUSD, { color: '#D4AF37' }]}>${sellingUSD.toFixed(2)}</Text>
                <Text style={[styles.priceValueSYP, { color: '#fff' }]}>{currentProduct.sellingPrice.toLocaleString('en-US')} ل.س</Text>
              </BlurView>
            </View>

            {/* Profit Card */}
            <BlurView intensity={20} tint="dark" style={[
              styles.profitCard,
              { borderColor: profit >= 0 ? 'rgba(74, 222, 128, 0.3)' : 'rgba(248, 113, 113, 0.3)' }
            ]}>
              <Text style={styles.profitLabel}>
                {profit >= 0 ? '📈 صافي الربح المتوقع' : '📉 خسارة'}
              </Text>
              <View style={styles.profitRow}>
                <View style={styles.profitItem}>
                  <Text style={[
                    styles.profitValue,
                    { color: profit >= 0 ? '#4ade80' : '#f87171' }
                  ]}>
                    {profit >= 0 ? '+' : ''}${profitUSD.toFixed(2)}
                  </Text>
                  <Text style={styles.profitPercent}>{profitPercent}%</Text>
                </View>
                <View style={styles.profitItem}>
                  <Text style={[
                    styles.profitValueSYP,
                    { color: profit >= 0 ? '#4ade80' : '#f87171' }
                  ]}>
                    {profit >= 0 ? '+' : ''}{profit.toLocaleString('en-US')} ل.س
                  </Text>
                </View>
              </View>
            </BlurView>
          </View>

          {/* Specifications */}
          {currentProduct.specifications && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📝 المواصفات</Text>
              <BlurView intensity={15} tint="light" style={styles.specsCard}>
                <Text style={styles.specsText}>{currentProduct.specifications}</Text>
              </BlurView>
            </View>
          )}

          {/* Exchange Rate Info */}
          <View style={styles.section}>
            <BlurView intensity={15} tint="light" style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>💱 سعر الصرف المعتمد:</Text>
                <Text style={styles.infoValue}>{exchangeRate.toLocaleString('en-US')} ل.س/$</Text>
              </View>
            </BlurView>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            {/* Primary Action (Sell) */}
            <TouchableOpacity 
              style={styles.mainActionButton} 
              onPress={handleSell}
              disabled={isOutOfStock}
            >
              <LinearGradient colors={['#D4AF37', '#B8860B']} style={styles.gradientBtn}>
                <Text style={styles.mainActionText}>💰 تنفيذ عملية البيع</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Secondary Actions Row */}
            <View style={styles.secondaryActionsRow}>
              <TouchableOpacity style={styles.secondaryButtonWrapper} onPress={handleLoss} disabled={isOutOfStock}>
                <BlurView intensity={20} tint="light" style={[styles.secondaryButton, { borderColor: 'rgba(251, 191, 36, 0.4)' }]}>
                  <Text style={[styles.secondaryButtonText, { color: '#fbbf24' }]}>📉 تسجيل خسارة</Text>
                </BlurView>
              </TouchableOpacity>

              <TouchableOpacity style={styles.secondaryButtonWrapper} onPress={handleDelete}>
                <BlurView intensity={20} tint="light" style={[styles.secondaryButton, { borderColor: 'rgba(248, 113, 113, 0.4)' }]}>
                  <Text style={[styles.secondaryButtonText, { color: '#f87171' }]}>🗑️ حذف العنصر</Text>
                </BlurView>
              </TouchableOpacity>
            </View>
          </View>

        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    padding: 24,
    paddingTop: 40,
    alignItems: 'center',
  },
  name: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 15,
  },
  metaRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  categoryBadge: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  category: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  date: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  stockSection: {
    paddingHorizontal: 20,
    marginTop: -10,
    marginBottom: 10,
  },
  stockBadge: {
    paddingVertical: 14,
    borderRadius: 15,
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
  },
  stockText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#9CA3AF',
    marginBottom: 12,
    textAlign: 'right',
  },
  priceRow: {
    flexDirection: 'row-reverse',
    gap: 12,
  },
  priceCard: {
    flex: 1,
    borderRadius: 15,
    padding: 16,
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  priceLabel: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 6,
  },
  priceValueUSD: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  priceValueSYP: {
    fontSize: 13,
    color: '#D1D5DB',
    marginTop: 4,
  },
  profitCard: {
    borderRadius: 15,
    padding: 20,
    marginTop: 15,
    borderWidth: 1,
    overflow: 'hidden',
  },
  profitLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D1D5DB',
    marginBottom: 12,
    textAlign: 'center',
  },
  profitRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-around',
  },
  profitItem: {
    alignItems: 'center',
  },
  profitValue: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  profitPercent: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 4,
  },
  profitValueSYP: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 6,
  },
  specsCard: {
    borderRadius: 15,
    padding: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  specsText: {
    fontSize: 15,
    color: '#D1D5DB',
    lineHeight: 24,
    textAlign: 'right',
  },
  infoCard: {
    borderRadius: 15,
    padding: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  infoRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  infoValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
  },
  actions: {
    padding: 20,
    gap: 12,
  },
  mainActionButton: {
    height: 60,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 5,
  },
  gradientBtn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainActionText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryActionsRow: {
    flexDirection: 'row-reverse',
    gap: 12,
  },
  secondaryButtonWrapper: {
    flex: 1,
    borderRadius: 15,
    overflow: 'hidden',
  },
  secondaryButton: {
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
});