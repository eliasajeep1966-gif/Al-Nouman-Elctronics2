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
    originalPrice: number,
    sellingPrice: number,
    category: ProductCategory,
    originalPriceUSD?: number,
    sellingPriceUSD?: number,
    specifications?: string
  ) => void;
};

export default function AddProductScreen({ navigation, onAdd }: Props) {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [originalPriceUSD, setOriginalPriceUSD] = useState('');
  const [sellingPriceUSD, setSellingPriceUSD] = useState('');
  const [category, setCategory] = useState<ProductCategory>('parts');
  const [specifications, setSpecifications] = useState('');

  const handleSubmit = () => {
    // Validation
    if (!name.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال اسم المنتج');
      return;
    }

    const qty = parseInt(quantity) || 0;
    const origPrice = parseFloat(originalPrice) || 0;
    const sellPrice = parseFloat(sellingPrice) || 0;

    if (qty <= 0) {
      Alert.alert('خطأ', 'يرجى إدخال كمية صحيحة');
      return;
    }

    if (origPrice <= 0 || sellPrice <= 0) {
      Alert.alert('خطأ', 'يرجى إدخال أسعار صحيحة');
      return;
    }

    if (sellPrice < origPrice) {
      Alert.alert('تحذير', 'سعر البيع أقل من سعر التكلفة!');
    }

    // Add product
    onAdd(
      name.trim(),
      qty,
      origPrice,
      sellPrice,
      category,
      originalPriceUSD ? parseFloat(originalPriceUSD) : undefined,
      sellingPriceUSD ? parseFloat(sellingPriceUSD) : undefined,
      specifications.trim() || undefined
    );

    Alert.alert('✅ نجاح', 'تمت إضافة المنتج بنجاح', [
      { text: 'موافق', onPress: () => navigation.goBack() }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>إضافة منتج جديد</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>اسم المنتج *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="أدخل اسم المنتج"
                placeholderTextColor="#999"
              />
            </View>

            {/* Category */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>الفئة *</Text>
              <View style={styles.categoryButtons}>
                <TouchableOpacity
                  style={[
                    styles.categoryButton,
                    category === 'parts' && styles.categoryButtonActive,
                  ]}
                  onPress={() => setCategory('parts')}
                >
                  <Text style={[
                    styles.categoryButtonText,
                    category === 'parts' && styles.categoryButtonTextActive,
                  ]}>
                    قطع غيار
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.categoryButton,
                    category === 'tools' && styles.categoryButtonActive,
                  ]}
                  onPress={() => setCategory('tools')}
                >
                  <Text style={[
                    styles.categoryButtonText,
                    category === 'tools' && styles.categoryButtonTextActive,
                  ]}>
                    أدوات
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Quantity */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>الكمية *</Text>
              <TextInput
                style={styles.input}
                value={quantity}
                onChangeText={setQuantity}
                placeholder="أدخل الكمية"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
            </View>

            {/* Prices in SYP */}
            <Text style={styles.sectionLabel}>الأسعار بالليرة السورية</Text>
            
            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>سعر التكلفة *</Text>
                <TextInput
                  style={styles.input}
                  value={originalPrice}
                  onChangeText={setOriginalPrice}
                  placeholder="سعر التكلفة"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                 
                />
              </View>

              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>سعر البيع *</Text>
                <TextInput
                  style={styles.input}
                  value={sellingPrice}
                  onChangeText={setSellingPrice}
                  placeholder="سعر البيع"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                 
                />
              </View>
            </View>

            {/* Prices in USD */}
            <Text style={styles.sectionLabel}>الأسعار بالدولار (اختياري)</Text>
            
            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>سعر التكلفة ($)</Text>
                <TextInput
                  style={styles.input}
                  value={originalPriceUSD}
                  onChangeText={setOriginalPriceUSD}
                  placeholder="$"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                 
                />
              </View>

              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>سعر البيع ($)</Text>
                <TextInput
                  style={styles.input}
                  value={sellingPriceUSD}
                  onChangeText={setSellingPriceUSD}
                  placeholder="$"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                 
                />
              </View>
            </View>

            {/* Specifications */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>المواصفات (اختياري)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={specifications}
                onChangeText={setSpecifications}
                placeholder="أدخل مواصفات المنتج"
                placeholderTextColor="#999"
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
    backgroundColor: '#f5f5f5',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#1a73e8',
    padding: 24,
    paddingTop: 40,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
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
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    color: '#333',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  categoryButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  categoryButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  categoryButtonActive: {
    backgroundColor: '#1a73e8',
    borderColor: '#1a73e8',
  },
  categoryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  categoryButtonTextActive: {
    color: '#fff',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a73e8',
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
  submitButton: {
    backgroundColor: '#4caf50',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 40,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
});
