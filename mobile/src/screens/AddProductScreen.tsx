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
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProductCategory } from '../types';

const { width } = Dimensions.get('window');

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
  userId: string;
};

export default function AddProductScreen({ navigation, onAdd, exchangeRate, category, isDarkMode }: Props) {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [originalPriceUSD, setOriginalPriceUSD] = useState('');
  const [sellingPriceUSD, setSellingPriceUSD] = useState('');
  const [specifications, setSpecifications] = useState('');

  // حسابات الأسعار والربح
  const originalPriceSYP = originalPriceUSD ? Math.round(parseFloat(originalPriceUSD) * exchangeRate) : 0;
  const sellingPriceSYP = sellingPriceUSD ? Math.round(parseFloat(sellingPriceUSD) * exchangeRate) : 0;
  const profitUSD = (sellingPriceUSD && originalPriceUSD) 
    ? (parseFloat(sellingPriceUSD) - parseFloat(originalPriceUSD)).toFixed(2) 
    : "0.00";
  const profitSYP = Math.round(parseFloat(profitUSD) * exchangeRate);

  const handleSubmit = () => {
    if (!name.trim() || !originalPriceUSD || !sellingPriceUSD) {
      Alert.alert('تنبيه', 'يرجى ملء جميع الحقول المطلوبة الأساسية');
      return;
    }
    onAdd(name.trim(), parseInt(quantity) || 1, parseFloat(originalPriceUSD), parseFloat(sellingPriceUSD), category, specifications.trim() || undefined);
    navigation.goBack();
  };

  return (
    <LinearGradient colors={['#1e1b4b', '#000']} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            
            {/* الهيدر المصمم */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>إضافة {category === 'parts' ? ' عنصر' : 'جهاز'}</Text>
              <BlurView intensity={20} tint="light" style={styles.rateBadge}>
                <Text style={styles.rateText}>سعر الصرف الحالي: {exchangeRate.toLocaleString()} ل.س</Text>
              </BlurView>
            </View>

            {/* حقل الاسم */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>اسم المنتج *</Text>
              <BlurView intensity={15} tint="light" style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder=": IC  - A14 Bionic"
                  placeholderTextColor="#6B7280"
                  value={name}
                  onChangeText={setName}
                />
              </BlurView>
            </View>

            {/* الكمية والأسعار بالدولار */}
            <View style={styles.row}>
              <View style={[styles.inputWrapper, { flex: 1 }]}>
                <Text style={styles.label}>الكمية</Text>
                <BlurView intensity={15} tint="light" style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={quantity}
                    onChangeText={setQuantity}
                  />
                </BlurView>
              </View>
              <View style={[styles.inputWrapper, { flex: 1.5, marginLeft: 10 }]}>
                <Text style={styles.label}>التكلفة ($)</Text>
                <BlurView intensity={15} tint="light" style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor="#6B7280"
                    value={originalPriceUSD}
                    onChangeText={setOriginalPriceUSD}
                  />
                </BlurView>
              </View>
            </View>

            {/* سعر البيع بالدولار */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>سعر البيع المقترح ($)</Text>
              <BlurView intensity={15} tint="light" style={[styles.inputContainer, { borderColor: '#D4AF37' }]}>
                <TextInput
                  style={[styles.input, { color: '#D4AF37', fontWeight: 'bold' }]}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor="#D4AF37"
                  value={sellingPriceUSD}
                  onChangeText={setSellingPriceUSD}
                />
              </BlurView>
            </View>

            {/* قسم الحسابات التلقائية - تصميم البطاقة الذكية */}
            {(originalPriceUSD !== '' || sellingPriceUSD !== '') && (
              <BlurView intensity={30} tint="dark" style={styles.resultCard}>
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>سعر البيع بالليرة:</Text>
                  <Text style={styles.resultValue}>{sellingPriceSYP.toLocaleString()} ل.س</Text>
                </View>
                <View style={[styles.resultRow, { marginTop: 10, borderTopWidth: 0.5, borderColor: 'rgba(212,175,55,0.2)', paddingTop: 10 }]}>
                  <Text style={styles.resultLabel}>صافي الربح المتوقع:</Text>
                  <Text style={[styles.resultValue, { color: parseFloat(profitUSD) >= 0 ? '#4ade80' : '#f87171' }]}>
                    {profitSYP.toLocaleString()} ل.س (${profitUSD})
                  </Text>
                </View>
              </BlurView>
            )}

            {/* المواصفات */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>المواصفات الفنية</Text>
              <BlurView intensity={15} tint="light" style={[styles.inputContainer, { height: 100 }]}>
                <TextInput
                  style={[styles.input, { height: 90 }]}
                  placeholder="أدخل موديل القطعة أو ملاحظات الصيانة..."
                  placeholderTextColor="#6B7280"
                  multiline
                  textAlignVertical="top"
                  value={specifications}
                  onChangeText={setSpecifications}
                />
              </BlurView>
            </View>

            {/* زر الإضافة الذهبي */}
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <LinearGradient colors={['#D4AF37', '#B8860B']} style={styles.gradientBtn}>
                <Text style={styles.submitText}>➕ حفظ في المستودع</Text>
              </LinearGradient>
            </TouchableOpacity>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  header: { marginBottom: 25, alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 10 },
  rateBadge: { paddingHorizontal: 15, paddingVertical: 6, borderRadius: 20, overflow: 'hidden' },
  rateText: { color: '#D4AF37', fontSize: 13, fontWeight: '600' },
  inputWrapper: { marginBottom: 20 },
  label: { color: '#9CA3AF', fontSize: 14, marginBottom: 8, marginRight: 5, textAlign: 'right' },
  inputContainer: {
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  input: {
    padding: 15,
    color: '#fff',
    fontSize: 16,
    textAlign: 'right',
  },
  row: { flexDirection: 'row-reverse' },
  resultCard: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    overflow: 'hidden',
  },
  resultRow: { flexDirection: 'row-reverse', justifyContent: 'space-between' },
  resultLabel: { color: '#D1D5DB', fontSize: 15 },
  resultValue: { color: '#D4AF37', fontSize: 18, fontWeight: 'bold' },
  submitButton: { height: 60, borderRadius: 15, overflow: 'hidden', marginTop: 10, elevation: 5 },
  gradientBtn: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  submitText: { color: '#000', fontSize: 18, fontWeight: 'bold' },
});