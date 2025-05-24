import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { firestore, auth } from '../services/firebase';
import { collection, onSnapshot } from 'firebase/firestore';

const ButceEkrani = () => {
  const [odemeler, setOdemeler] = useState([]);
  const [selectedTur, setSelectedTur] = useState('Gider'); // Varsayılan olarak Gider
  const [chartData, setChartData] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [budgetLimit, setBudgetLimit] = useState(0); // Bütçe limiti
  const [showDetails, setShowDetails] = useState(false); // Detayları göster/gizle

  const user = auth.currentUser;
  const userId = user ? user.uid : null;

  // Ödemeleri Firestore'dan çekme
  useEffect(() => {
    if (!userId) return;

    const subscriber = onSnapshot(collection(firestore, 'users', userId, 'odemeler'), (querySnapshot) => {
      const odemeList = [];
      querySnapshot.forEach((documentSnapshot) => {
        odemeList.push({
          id: documentSnapshot.id,
          ...documentSnapshot.data(),
        });
      });
      setOdemeler(odemeList);
      updateChartData(odemeList, selectedTur);
    });

    return () => subscriber();
  }, [userId, selectedTur]);

  // Grafik verilerini güncelleme fonksiyonu
  const updateChartData = (data, tur) => {
    const filteredData = data.filter(odeme => odeme.tur === tur);
    const categoryTotals = {};

    // Kategorilere göre toplamları hesaplama
    filteredData.forEach(odeme => {
      if (categoryTotals[odeme.kategori]) {
        categoryTotals[odeme.kategori] += odeme.miktar;
      } else {
        categoryTotals[odeme.kategori] = odeme.miktar;
      }
    });

    // Toplam miktarı hesaplama
    const total = Object.values(categoryTotals).reduce((acc, curr) => acc + curr, 0);
    setTotalAmount(total);

    // Pasta grafiği için veri formatı
    const colors = [
      '#FFB085', // Şeftali tonu
      '#85C1E9', // Açık mavi tonu
      '#A3E4D7', // Mint yeşili tonu
      '#F7DC6F', // Yumuşak sarı tonu
      '#D7BDE2', // Lavanta moru tonu
      '#F5B7B1', // Pembe tonu
      '#FFD93F', // Canlı sarı tonu
      '#76D7C4', // Turkuaz yeşil tonu
      '#F8C471', // Altın sarısı tonu
      '#D2B4DE', // Yumuşak mor tonu
    ];
    const newChartData = Object.entries(categoryTotals).map(([category, amount], index) => ({
      name: category,
      population: amount,
      color: colors[index % colors.length],
      legendFontColor: '#495057',
      legendFontSize: 15,
    }));

    setChartData(newChartData);
  };

  // Tür değiştiğinde grafiği güncelle
  const handleTurChange = (tur) => {
    setSelectedTur(tur);
    updateChartData(odemeler, tur);
  };

  // Bütçe limiti ayarlama (örnek bir fonksiyon, input ile değiştirilebilir)
  const handleSetBudgetLimit = () => {
    // Şimdilik sabit bir değer, ileride kullanıcı girişi ile değiştirilebilir
    setBudgetLimit(5000);
    Alert.alert('Bilgi', 'Bütçe limiti 5000 ₺ olarak ayarlandı.');
  };

  // Grafik yapılandırması
  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 2,
    color: (opacity = 1) => `rgba(33, 37, 41, ${opacity})`,
    style: {
      borderRadius: 16,
    },
  };

  // Ekran boyutu için grafik boyutlandırma
  const screenWidth = Dimensions.get('window').width;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Bütçe Ekranı</Text>

      <View style={styles.turContainer}>
        <TouchableOpacity
          style={[styles.turButton, selectedTur === 'Gider' && styles.selectedTurButton]}
          onPress={() => handleTurChange('Gider')}
        >
          <Text style={[styles.turButtonText, selectedTur === 'Gider' && styles.selectedTurButtonText]}>
            Gider
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.turButton, selectedTur === 'Gelir' && styles.selectedTurButton]}
          onPress={() => handleTurChange('Gelir')}
        >
          <Text style={[styles.turButtonText, selectedTur === 'Gelir' && styles.selectedTurButtonText]}>
            Gelir
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.chartContainer}>
        {chartData.length > 0 ? (
          <>
            <PieChart
              data={chartData}
              width={screenWidth - 32} // Ekran genişliğine göre ayarlama
              height={220}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
              style={styles.chart}
            />
            <Text style={styles.totalText}>Toplam {selectedTur}: {totalAmount.toFixed(2)} ₺</Text>
          </>
        ) : (
          <Text style={styles.noDataText}>Veri bulunmamaktadır.</Text>
        )}
      </View>

      <View style={styles.detailsContainer}>
        <TouchableOpacity
          style={styles.detailsToggleButton}
          onPress={() => setShowDetails(!showDetails)}
        >
          <Text style={styles.detailsToggleText}>
            {showDetails ? 'Detayları Gizle' : 'Detayları Göster'}
          </Text>
        </TouchableOpacity>

        {showDetails && (
          <View style={styles.detailsList}>
            {chartData.map((item, index) => (
              <View key={index} style={styles.detailItem}>
                <View style={[styles.colorIndicator, { backgroundColor: item.color }]} />
                <Text style={styles.detailCategory}>{item.name}</Text>
                <Text style={styles.detailAmount}>{item.population.toFixed(2)} ₺</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.budgetContainer}>
        <Text style={styles.budgetTitle}>Bütçe Limiti</Text>
        <Text style={styles.budgetLimitText}>
          {budgetLimit > 0 ? `${budgetLimit} ₺` : 'Limit Belirlenmedi'}
        </Text>
        {selectedTur === 'Gider' && budgetLimit > 0 && (
          <Text style={[styles.budgetStatus, totalAmount > budgetLimit ? styles.budgetExceeded : styles.budgetSafe]}>
            {totalAmount > budgetLimit
              ? `Bütçe Aşıldı: ${(totalAmount - budgetLimit).toFixed(2)} ₺`
              : `Kalan Bütçe: ${(budgetLimit - totalAmount).toFixed(2)} ₺`}
          </Text>
        )}
        <TouchableOpacity
          style={styles.setBudgetButton}
          onPress={handleSetBudgetLimit}
        >
          <Text style={styles.setBudgetButtonText}>Bütçe Limiti Ayarla</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa', // Daha yumuşak bir açık gri ton
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#212529', // Daha koyu ve profesyonel bir gri ton
    marginBottom: 16,
    textAlign: 'center',
  },
  turContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  turButton: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#e9ecef', // Daha zarif bir açık gri
    marginHorizontal: 4,
  },
  selectedTurButton: {
    backgroundColor: '#339AF0', // Canlı ama profesyonel bir mavi ton
  },
  turButtonText: {
    fontSize: 16,
    color: '#6c757d', // Yumuşak gri ton
  },
  selectedTurButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  chartContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 20,
    alignItems: 'center',
  },
  chart: {
    borderRadius: 16,
  },
  totalText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#343a40', // Koyu gri ton, daha ciddi bir görünüm
    marginTop: 16,
    textAlign: 'center',
  },
  noDataText: {
    fontSize: 16,
    color: '#868e96', // Orta gri ton, dikkat çekmeyen
    textAlign: 'center',
    padding: 40,
  },
  detailsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 20,
  },
  detailsToggleButton: {
    padding: 10,
    alignItems: 'center',
    backgroundColor: '#e9ecef', // Açık gri ton
    borderRadius: 10,
    marginBottom: 10,
  },
  detailsToggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#339AF0', // Canlı mavi ton
  },
  detailsList: {
    marginTop: 10,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6', // Çok açık gri çizgi
  },
  colorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  detailCategory: {
    flex: 1,
    fontSize: 16,
    color: '#495057', // Orta koyu gri ton
  },
  detailAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#343a40', // Koyu gri ton
  },
  budgetContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    alignItems: 'center',
  },
  budgetTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529', // Koyu gri ton
    marginBottom: 10,
  },
  budgetLimitText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#339AF0', // Canlı mavi ton
    marginBottom: 10,
  },
  budgetStatus: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 10,
  },
  budgetExceeded: {
    color: '#e03131', // Daha zarif bir kırmızı ton
  },
  budgetSafe: {
    color: '#2b9348', // Daha yumuşak bir yeşil ton
  },
  setBudgetButton: {
    backgroundColor: '#339AF0', // Canlı mavi ton
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    width: '80%',
  },
  setBudgetButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default ButceEkrani;