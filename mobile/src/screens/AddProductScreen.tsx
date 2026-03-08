import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProductCategory } from '../types';

type RootStackParamList = {
  ProductList: undefined;
  ProductDetails: { product: any };
  AddProduct: undefined;
};

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'AddProduct'>;
  onAdd: (
    name: string,
    quantity: number,
    originalPriceUSD: number,
    sellingPriceUSD: number,
    category: ProductCategory,
    specifications?: string
  ) => void;
  exchangeRate: number;
  category: ProductCategory;
  isDarkMode: boolean;
};

export default function AddProductScreen({ navigation, onAdd, exchangeRate, category, isDarkMode }: Props) {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [originalPriceUSD, setOriginalPriceUSD] = useState('');
  const [sellingPriceUSD, setSellingPriceUSD] = useState('');
  const [specifications, setSpecifications] = useState('');

  // حساب الأسعار بالليرة
  const originalPriceSYP = originalPriceUSD ? Math.round(parseFloat(originalPriceUSD) * exchangeRate) : 0;
  const sellingPriceSYP = sellingPriceUSD ? Math.round(parseFloat(sellingPriceUSD) * exchangeRate) : 0;

  // حساب الربح
  const profitUSD = sellingPriceUSD && originalPriceUSD
    ? (parseFloat(sellingPriceUSD) - parseFloat(originalPriceUSD)).toFixed(2)
    : null;
  const profitSYP = profitUSD ? Math.round(parseFloat(profitUSD) * exchangeRate) : null;

  const handleSubmit = () => {
    // Validation
    if (!name.trim()) {
      Alert.alert('خطأ', 'اسم المنتج مطلوب');
      return;
    }

    const qty = parseInt(quantity) || 0;
    const origUSD = parseFloat(originalPriceUSD) || 0;
    const sellUSD = parseFloat(sellingPriceUSD) || 0;

    if (qty < 1) {
      Alert.alert('خطأ', 'الكمية يجب أن تكون 1 على الأقل');
      return;
    }

    if (origUSD <= 0 || sellUSD <= 0) {
      Alert.alert('خطأ', 'الأسعار مطلوبة');
      return;
    }

    if (sellUSD < origUSD) {
      Alert.alert('تحذير', 'سعر البيع أقل من سعر التكلفة!');
    }

    // Add product
    onAdd(
      name.trim(),
      qty,
      origUSD,
      sellUSD,
      category,
      specifications.trim() || undefined
    );

    Alert.alert('✅ نجاح', 'تمت إضافة المنتج بنجاح', [
      { text: 'موافق', onPress: () => navigation.goBack() }
    ]);
  };

  const categoryLabel = category === 'parts' ? 'قطعة غيار' : 'أداة إلكترونية';

  const theme = isDarkMode ? {
    bg: '#0f172a',
    card: '#1e293b',
    text: '#f1f5f9',
    textMuted: '#94a3b8',
    border: '#334155',
    inputBg: '#1e293b',
  } : {
    bg: '#f8fafc',
    card: '#ffffff',
    text: '#1e293b',
    textMuted: '#64748b',
    border: '#e2e8f0',
    inputBg: '#ffffff',
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={[styles.header, { backgroundColor: isDarkMode ? '#1e1b4b' : '#1e293b' }]}>
            <Text style={styles.title}>إضافة {categoryLabel} جديدة</Text>
            <Text style={styles.subtitle}>سعر الصرف: 1$ = {exchangeRate.toLocaleString('en-US')} ل.س</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Name */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>اسم المنتج *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
                value={name}
                onChangeText={setName}
                placeholder="أدخل اسم المنتج"
                placeholderTextColor={theme.textMuted}
              />
            </View>

            {/* Quantity */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>الكمية *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
                value={quantity}
                onChangeText={setQuantity}
                placeholder="أدخل الكمية"
                placeholderTextColor={theme.textMuted}
                keyboardType="numeric"
              />
            </View>

            {/* Prices in USD - Like Website */}
            <Text style={styles.sectionLabel}>الأسعار بالدولار الأمريكي ($)</Text>
            
            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={[styles.label, { color: theme.text }]}>سعر التكلفة ($) *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
                  value={originalPriceUSD}
                  onChangeText={setOriginalPriceUSD}
                  placeholder="$0.00"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={[styles.label, { color: theme.text }]}>سعر البيع ($) *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
                  value={sellingPriceUSD}
                  onChangeText={setSellingPriceUSD}
                  placeholder="$0.00"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            {/* Calculated SYP Prices */}
            {(originalPriceUSD || sellingPriceUSD) && (
              <View style={styles.calculatedSection}>
                <Text style={[styles.calculatedTitle, { color: theme.textMuted }]}>الأسعار بالليرة السورية</Text>
                <View style={styles.calculatedRow}>
                  <View style={[styles.calculatedCard, { backgroundColor: theme.card }]}>
                    <Text style={[styles.calculatedLabel, { color: theme.textMuted }]}>سعر التكلفة</Text>
                    <Text style={[styles.calculatedValue, { color: theme.text }]}>{originalPriceSYP.toLocaleString('en-US')} ل.س</Text>
                  </View>
                  <View style={[styles.calculatedCard, { backgroundColor: theme.card }]}>
                    <Text style={[styles.calculatedLabel, { color: theme.textMuted }]}>سعر البيع</Text>
                    <Text style={[styles.calculatedValue, { color: theme.text }]}>{sellingPriceSYP.toLocaleString('en-US')} ل.س</Text>
                  </View>
                  {profitSYP !== null && (
                    <View style={[styles.calculatedCard, profitSYP >= 0 ? styles.profitCard : styles.lossCard]}>
                      <Text style={styles.calculatedLabel}>الربح</Text>
                      <Text style={[styles.calculatedValue, profitSYP >= 0 ? styles.profitValue : styles.lossValue]}>
                        {profitSYP.toLocaleString('en-US')} ل.س
                      </Text>
                      <Text style={[styles.calculatedValueSmall, profitSYP >= 0 ? styles.profitValue : styles.lossValue]}>
                        ${profitUSD}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Specifications */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>المواصفات (اختياري)</Text>
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
                value={specifications}
                onChangeText={setSpecifications}
                placeholder="أدخل مواصفات المنتج"
                placeholderTextColor={theme.textMuted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
            >
              <Text style={styles.submitButtonText}>➕ إضافة المنتج</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#1e293b',
    padding: 24,
    paddingTop: 40,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#818cf8',
    textAlign: 'center',
    marginTop: 8,
  },
  form: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    color: '#1e293b',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4f46e5',
    marginBottom: 12,
    marginTop: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  calculatedSection: {
    marginTop: 8,
    marginBottom: 16,
  },
  calculatedTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
  },
  calculatedRow: {
    flexDirection: 'row',
    gap: 8,
  },
  calculatedCard: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  calculatedLabel: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 4,
  },
  calculatedValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  calculatedValueSmall: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 2,
  },
  profitCard: {
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#86efac',
  },
  lossCard: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  profitValue: {
    color: '#16a34a',
  },
  lossValue: {
    color: '#dc2626',
  },
  submitButton: {
    backgroundColor: '#4f46e5',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 40,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
});
