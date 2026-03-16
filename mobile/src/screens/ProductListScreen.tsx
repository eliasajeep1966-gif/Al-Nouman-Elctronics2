import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, StatusBar, TextInput, Alert, Share, Modal, Switch, ScrollView, Image, Dimensions, } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Product, TabId, LogEntry, LossEntry } from '../types';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

type RootStackParamList = {
  ProductList: undefined;
  ProductDetails: { product: Product };
  AddProduct: { category: 'parts' | 'tools' };
};

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ProductList'>;
  products: Product[];
  exchangeRate: number;
  logs: LogEntry[];
  losses: LossEntry[];
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onAdd: (
	name: string,
	quantity: number,
	originalPriceUSD: number,
	sellingPriceUSD: number,
	category: 'parts' | 'tools',
	specifications?: string
  ) => void;
  onSell: (id: string) => void;
  onDelete: (id: string) => void;
  onLoss: (id: string) => void;
  onSetExchangeRate: (rate: number) => void;
  onClearAll: () => void;
  onExportData: () => string;
  onImportData: (json: string) => boolean;
  userId: string;
  userEmail?: string | null;
  onLogout: () => void;
  isOnline: boolean;
};

export default function ProductListScreen({
  navigation,
  products,
  exchangeRate,
  logs,
  losses,
  isDarkMode,
  onToggleDarkMode,
  onAdd,
  onSell,
  onDelete,
  onLoss,
  onSetExchangeRate,
  onClearAll,
  onExportData,
  onImportData,
  userId,
  userEmail,
  onLogout,
  isOnline,
}: Props) {
  const username = userEmail ? userEmail.split('@')[0] : 'المستخدم';
  const [activeTab, setActiveTab] = useState<TabId>('parts');
  const [search, setSearch] = useState('');
  const [editingRate, setEditingRate] = useState(false);
  const [rateInput, setRateInput] = useState(exchangeRate.toString());

  // التصفية والمنطق (نفس كودك الأصلي تماماً)
  const categoryProducts = useMemo(() => {
	if (activeTab === 'parts') return products.filter(p => p.category === 'parts');
	if (activeTab === 'tools') return products.filter(p => p.category === 'tools');
	return [];
  }, [products, activeTab]);

  const filteredProducts = useMemo(() => {
	if (!search.trim()) return categoryProducts;
	return categoryProducts.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  }, [categoryProducts, search]);

  const renderProduct = ({ item }: { item: Product }) => {
	const originalUSD = item.originalPriceUSD ?? (item.originalPrice / exchangeRate);
	const sellingUSD = item.sellingPriceUSD ?? (item.sellingPrice / exchangeRate);
	const profitUSD = sellingUSD - originalUSD;
	return (
	  <TouchableOpacity style={styles.cardContainer} onPress={() => navigation.navigate('ProductDetails', { product: item })}>
		<BlurView intensity={30} tint="dark" style={styles.glassCard}>
		  <View style={styles.cardHeader}>
			<Text style={styles.productName}>{item.name}</Text>
			<View style={[styles.stockBadge, 
			  item.quantity > 5 ? styles.stockOk : 
			  item.quantity >= 2 ? styles.stockMedium : styles.stockLow
			]}>
			  <Text style={styles.stockText}>{item.quantity} قطعة</Text>
			</View>
		  </View>
		  <View style={styles.priceRow}>
			<View style={styles.priceBox}>
			  <Text style={styles.priceLabel}>شراء</Text>
			  <Text style={styles.priceValue}>${originalUSD.toFixed(2)}</Text>
			</View>
			<View style={[styles.priceBox, { backgroundColor: 'rgba(0, 82, 255, 0.2)' }]}>
			  <Text style={styles.priceLabel}>بيع</Text>
			  <Text style={styles.priceValue}>${sellingUSD.toFixed(2)}</Text>
			</View>
			<View style={[styles.priceBox, { borderColor: '#D4AF37', borderWidth: 1 }]}>
			  <Text style={[styles.priceLabel, { color: '#D4AF37' }]}>الربح</Text>
			  <Text style={[styles.priceValue, { color: '#D4AF37' }]}>+${profitUSD.toFixed(2)}</Text>
			</View>
		  </View>
		</BlurView>
	  </TouchableOpacity>
	);
  };

  return (
	<View style={styles.container}>
	  <StatusBar barStyle="light-content" />
	  {/* 1. الخلفية المتدرجة واللوجو (الدرع) */}
	  <LinearGradient colors={['#000B26', '#001a63']} style={StyleSheet.absoluteFill} />
	  <Image source={require('../../assets/logo.png')} style={styles.backgroundWatermark} resizeMode="contain" alt="شعار إلكترونيات النعمان" />
	  <SafeAreaView style={{ flex: 1 }}>
		{/* 2. الهيدر النحيف (Compact Header) */}
		<View style={styles.compactHeader}>
		  <View style={styles.headerRight}>
			<Image source={require('../../assets/logo.png')} style={styles.headerLogoIcon} alt="شعار إلكترونيات النعمان" />
			<Text style={styles.brandTitle}>إلكترونيات النعمان</Text>
		  </View>
		  <View style={styles.headerLeft}>
			<Text style={styles.usernameText}>@{username}</Text>
			<View style={styles.profileWrapper}>
			  <View style={styles.fbAvatarPlaceholder}>
				<Text style={{ color: '#9CA3AF', fontSize: 10 }}>👤</Text>
			  </View>
			  <View style={[styles.statusDot, { backgroundColor: isOnline ? '#22c55e' : '#ef4444' }]} />
			</View>
		  </View>
		</View>
		{/* 3. سعر الصرف والبحث (بستايل زجاجي) */}
		<View style={styles.topTools}>
		  <BlurView intensity={20} style={styles.searchBar}>
			<TextInput
			  style={styles.searchInput}
			  placeholder="ابحث عن منتج..."
			  placeholderTextColor="#9CA3AF"
			  value={search}
			  onChangeText={setSearch}
			/>
		  </BlurView>
		  <TouchableOpacity style={styles.rateButton} onPress={() => setEditingRate(true)}>
			<Text style={styles.rateText}>💵 {exchangeRate.toLocaleString()}</Text>
		  </TouchableOpacity>
		</View>
		{/* 4. قائمة المنتجات */}
		{(activeTab === 'parts' || activeTab === 'tools') && (
		  <FlatList
			data={filteredProducts}
			renderItem={renderProduct}
			keyExtractor={item => item.id}
			contentContainerStyle={{ paddingBottom: 120, paddingTop: 10 }}
		  />
		)}
		{/* 5. شريط التنقل السفلي مع الزر البارز */}
		<View style={styles.bottomNavWrapper}>
		  <BlurView intensity={80} tint="dark" style={styles.navBlur}>
			<TouchableOpacity onPress={() => setActiveTab('parts')} style={styles.navItem}>
			  <Text style={[styles.navIcon, activeTab === 'parts' && styles.activeGold]}>⚙️</Text>
			  <Text style={[styles.navLabel, activeTab === 'parts' && styles.activeGold]}>قطع غيار</Text>
			</TouchableOpacity>
			<TouchableOpacity onPress={() => setActiveTab('tools')} style={styles.navItem}>
			  <Text style={[styles.navIcon, activeTab === 'tools' && styles.activeGold]}>🖥️</Text>
			  <Text style={[styles.navLabel, activeTab === 'tools' && styles.activeGold]}>أدوات</Text>
			</TouchableOpacity>
			<View style={{ width: 70 }} /> {/* مساحة للزر المركزي */}
			<TouchableOpacity onPress={() => setActiveTab('profits')} style={styles.navItem}>
			  <Text style={[styles.navIcon, activeTab === 'profits' && styles.activeGold]}>📊</Text>
			  <Text style={[styles.navLabel, activeTab === 'profits' && styles.activeGold]}>الأرباح</Text>
			</TouchableOpacity>
			<TouchableOpacity onPress={() => setActiveTab('log')} style={styles.navItem}>
			  <Text style={[styles.navIcon, activeTab === 'log' && styles.activeGold]}>📋</Text>
			  <Text style={[styles.navLabel, activeTab === 'log' && styles.activeGold]}>السجل</Text>
			</TouchableOpacity>
		  </BlurView>
		  {/* الزر الذهبي البارز (+) */}
		  <TouchableOpacity
			style={styles.centralFab}
			onPress={() => navigation.navigate('AddProduct', { category: activeTab === 'parts' ? 'parts' : 'tools' })}
		  >
			<LinearGradient colors={['#D4AF37', '#b8860b']} style={styles.fabGradient}>
			  <Text style={styles.fabPlus}>+</Text>
			</LinearGradient>
		  </TouchableOpacity>
		</View>
	  </SafeAreaView>
	  {/* مودال تعديل السعر */}
	  <Modal visible={editingRate} transparent animationType="fade">
		<View style={styles.modalOverlay}>
		  <BlurView intensity={90} style={styles.modalContent}>
			<Text style={styles.modalTitle}>تحديث سعر الصرف</Text>
			<TextInput
			  style={styles.modalInput}
			  keyboardType="numeric"
			  value={rateInput}
			  onChangeText={setRateInput}
			/>
			<View style={{ flexDirection: 'row', gap: 10 }}>
			  <TouchableOpacity
				style={styles.saveBtn}
				onPress={() => {
				  onSetExchangeRate(parseFloat(rateInput));
				  setEditingRate(false);
				}}
			  >
				<Text style={{ color: '#000', fontWeight: 'bold' }}>حفظ</Text>
			  </TouchableOpacity>
			  <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditingRate(false)}>
				<Text style={{ color: '#fff' }}>إلغاء</Text>
			  </TouchableOpacity>
			</View>
		  </BlurView>
		</View>
	  </Modal>
	</View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backgroundWatermark: {
	position: 'absolute',
	width: width * 1.2,
	height: width * 1.2,
	top: '15%',
	alignSelf: 'center',
	opacity: 0.06,
  },
  compactHeader: {
	flexDirection: 'row-reverse',
	justifyContent: 'space-between',
	alignItems: 'center',
	paddingHorizontal: 16,
	paddingVertical: 12,
  },
  headerRight: { flexDirection: 'row-reverse', alignItems: 'center' },
  headerLogoIcon: { width: 32, height: 32, marginLeft: 10 },
  brandTitle: { color: '#D4AF37', fontSize: 20, fontWeight: 'bold' },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  usernameText: { color: '#fff', marginRight: 10, fontSize: 14, fontWeight: '500' },
  profileWrapper: { width: 38, height: 38 },
  fbAvatarPlaceholder: {
	width: 38,
	height: 38,
	borderRadius: 19,
	backgroundColor: 'rgba(255,255,255,0.1)',
	justifyContent: 'center',
	alignItems: 'center',
  },
  statusDot: {
	position: 'absolute',
	bottom: 0,
	right: 0,
	width: 12,
	height: 12,
	borderRadius: 6,
	borderWidth: 2,
	borderColor: '#000B26',
  },
  topTools: {
	flexDirection: 'row-reverse',
	paddingHorizontal: 16,
	gap: 10,
	marginBottom: 10,
  },
  searchBar: {
	flex: 1,
	height: 45,
	borderRadius: 12,
	paddingHorizontal: 15,
	justifyContent: 'center',
	overflow: 'hidden',
	backgroundColor: 'rgba(255,255,255,0.05)',
  },
  searchInput: { color: '#fff', textAlign: 'right' },
  rateButton: {
	backgroundColor: 'rgba(212, 175, 55, 0.15)',
	paddingHorizontal: 15,
	borderRadius: 12,
	justifyContent: 'center',
	borderWidth: 1,
	borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  rateText: { color: '#D4AF37', fontWeight: 'bold' },
  cardContainer: {
	marginHorizontal: 16,
	marginBottom: 12,
	borderRadius: 20,
	overflow: 'hidden',
	borderWidth: 1,
	borderColor: 'rgba(255,255,255,0.1)',
  },
  glassCard: { padding: 16 },
  productName: {
	color: '#fff',
	fontSize: 18,
	fontWeight: 'bold',
	marginBottom: 12,
	textAlign: 'right',
  },
  cardHeader: {
	flexDirection: 'row-reverse',
	justifyContent: 'space-between',
	alignItems: 'center',
  },
  stockBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  stockOk: { backgroundColor: 'rgba(34, 197, 94, 0.2)' }, // لأكثر من 5 قطع
  stockMedium: { backgroundColor: 'rgba(245, 158, 11, 0.2)' }, // من 2 إلى 5 قطع
  stockLow: { backgroundColor: 'rgba(239, 68, 68, 0.2)' }, // أقل من 2 قطع
  stockText: { color: '#fff', fontSize: 12 },
  priceRow: { flexDirection: 'row-reverse', gap: 8 },
  priceBox: {
	flex: 1,
	backgroundColor: 'rgba(255,255,255,0.05)',
	padding: 8,
	borderRadius: 12,
	alignItems: 'center',
  },
  priceLabel: { color: '#9CA3AF', fontSize: 10, marginBottom: 4 },
  priceValue: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  bottomNavWrapper: {
	position: 'absolute',
	bottom: 0,
	width: '100%',
	height: 100,
	justifyContent: 'flex-end',
  },
  navBlur: {
	flexDirection: 'row',
	height: 70,
	borderTopLeftRadius: 25,
	borderTopRightRadius: 25,
	overflow: 'hidden',
	justifyContent: 'space-around',
	alignItems: 'center',
  },
  navItem: { alignItems: 'center', flex: 1 },
  navIcon: { fontSize: 22, color: '#4b5563' },
  navLabel: { fontSize: 10, color: '#4b5563', marginTop: 4 },
  activeGold: { color: '#D4AF37' },
  centralFab: {
	position: 'absolute',
	top: 0,
	alignSelf: 'center',
	width: 68,
	height: 68,
	borderRadius: 34,
	elevation: 10,
	shadowColor: '#D4AF37',
	shadowOpacity: 0.4,
	shadowRadius: 10,
  },
  fabGradient: { flex: 1, borderRadius: 34, justifyContent: 'center', alignItems: 'center' },
  fabPlus: { fontSize: 40, color: '#000', fontWeight: '200' },
  modalOverlay: {
	flex: 1,
	justifyContent: 'center',
	alignItems: 'center',
	backgroundColor: 'rgba(0,0,0,0.7)',
  },
  modalContent: {
	width: '80%',
	padding: 25,
	borderRadius: 20,
	overflow: 'hidden',
	alignItems: 'center',
	backgroundColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: { color: '#fff', fontSize: 18, marginBottom: 20 },
  modalInput: {
	backgroundColor: '#fff',
	width: '100%',
	padding: 12,
	borderRadius: 10,
	textAlign: 'center',
	fontSize: 20,
	marginBottom: 20,
  },
  saveBtn: { backgroundColor: '#D4AF37', paddingVertical: 10, paddingHorizontal: 30, borderRadius: 10 },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 20 },
});