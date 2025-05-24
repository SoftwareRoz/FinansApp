import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert, ScrollView } from 'react-native';
import { Calendar } from 'react-native-calendars';
import Modal from 'react-native-modal';
import { firestore, auth } from '../services/firebase';
import { collection, addDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';

const OdemelerEkrani = () => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [odemeler, setOdemeler] = useState([]);
  const [isModalVisible, setModalVisible] = useState(false);
  const [miktar, setMiktar] = useState('');
  const [aciklama, setAciklama] = useState('');
  const [tur, setTur] = useState('Gider'); // Varsayılan olarak Gider
  const [kategori, setKategori] = useState('');
  const [markedDates, setMarkedDates] = useState({});

  const user = auth.currentUser;
  const userId = user ? user.uid : null;

  // Gider ve Gelir kategorileri (her biri için 10 farklı kategori)
  const giderKategorileri = [
    'Kira', 'Elektrik Faturası', 'Su Faturası', 'Doğalgaz Faturası', 'Market Alışverişi', 
    'Ulaşım', 'Eğlence', 'Sağlık Giderleri', 'Eğitim Giderleri', 'Diğer Giderler'
  ];
  const gelirKategorileri = [
    'Maaş', 'Yatırım Geliri', 'Kira Geliri', 'Freelance Gelir', 'Hediye', 
    'Burs', 'Emeklilik Geliri', 'Yan Gelir', 'İade', 'Diğer Gelirler'
  ];

  // Ödemeleri Firestore'dan çekme
  useEffect(() => {
    if (!userId) return;

    const subscriber = onSnapshot(collection(firestore, 'users', userId, 'odemeler'), (querySnapshot) => {
      const odemeList = [];
      const marked = {};

      querySnapshot.forEach((documentSnapshot) => {
        const data = documentSnapshot.data();
        odemeList.push({
          id: documentSnapshot.id,
          ...data,
        });

        // Takvimde ödemelerin olduğu tarihleri türlerine göre işaretleme
        if (data.tarih) {
          const dotColor = data.tur === 'Gider' ? '#ef4444' : '#10b981';
          marked[data.tarih] = { marked: true, dotColor };
        }
      });

      setOdemeler(odemeList);
      setMarkedDates(marked);
    });

    return () => subscriber();
  }, [userId]);

  // Yaklaşan ödemeleri filtreleme (bugünden sonrası)
  const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD formatı
  const yaklasanOdemeler = odemeler
    .filter(odeme => odeme.tarih >= currentDate)
    .sort((a, b) => a.tarih.localeCompare(b.tarih)); // Tarihe göre sıralama

  // Ödeme ekleme fonksiyonu
  const handleOdemeEkle = async () => {
    if (!miktar || !aciklama || !tur || !selectedDate || !kategori) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun.');
      return;
    }

    try {
      await addDoc(collection(firestore, 'users', userId, 'odemeler'), {
        tarih: selectedDate,
        miktar: parseFloat(miktar),
        aciklama,
        tur,
        kategori,
        createdAt: serverTimestamp(),
      });

      setMiktar('');
      setAciklama('');
      setTur('Gider');
      setKategori('');
      setModalVisible(false);
      Alert.alert('Başarılı', 'Ödeme başarıyla eklendi.');
    } catch (error) {
      Alert.alert('Hata', 'Ödeme eklenirken bir sorun oluştu: ' + error.message);
    }
  };

  // Takvimde tarih seçildiğinde çağrılır
  const onDayPress = day => {
    setSelectedDate(day.dateString);
    setModalVisible(true);
  };

  // Ödeme öğesini render etme
  const renderOdemeItem = ({ item }) => (
    <View style={[styles.odemeCard, item.tur === 'Gider' ? styles.giderCard : styles.gelirCard]}>
      <Text style={styles.odemeMiktar}>{item.miktar} ₺</Text>
      <Text style={styles.odemeAciklama}>{item.aciklama}</Text>
      <Text style={styles.odemeTur}>{item.tur} - {item.kategori} - {item.tarih}</Text>
    </View>
  );

  // Kategori seçme fonksiyonu (Liste şeklinde)
  const renderKategoriList = () => {
    const kategoriler = tur === 'Gider' ? giderKategorileri : gelirKategorileri;
    return (
      <View style={styles.kategoriContainer}>
        <Text style={styles.kategoriLabel}>Kategori Seç:</Text>
        <ScrollView 
          style={styles.kategoriListContainer} 
          nestedScrollEnabled={true}
          showsVerticalScrollIndicator={true}
        >
          {kategoriler.map((kat, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.kategoriItem, kategori === kat && styles.selectedKategoriItem]}
              onPress={() => setKategori(kat)}
            >
              <Text style={[styles.kategoriItemText, kategori === kat && styles.selectedKategoriItemText]}>
                {kat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ödemeler Ekranı</Text>
      <Calendar
        onDayPress={onDayPress}
        markedDates={{
          ...markedDates,
          [selectedDate]: { selected: true, marked: markedDates[selectedDate]?.marked, selectedColor: '#3b82f6' },
        }}
        theme={{
          backgroundColor: '#ffffff',
          calendarBackground: '#ffffff',
          textSectionTitleColor: '#1f2937',
          selectedDayBackgroundColor: '#3b82f6',
          selectedDayTextColor: '#ffffff',
          todayTextColor: '#3b82f6',
          dayTextColor: '#2d4150',
          textDisabledColor: '#d9e1e8',
          dotColor: '#3b82f6',
          selectedDotColor: '#ffffff',
          arrowColor: '#3b82f6',
          monthTextColor: '#1f2937',
          indicatorColor: '#3b82f6',
          textDayFontFamily: 'monospace',
          textMonthFontFamily: 'monospace',
          textDayHeaderFontFamily: 'monospace',
          textDayFontWeight: '500',
          textMonthFontWeight: '700',
          textDayHeaderFontWeight: '600',
          textDayFontSize: 16,
          textMonthFontSize: 18,
          textDayHeaderFontSize: 14,
        }}
        style={styles.calendar}
      />

      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Yaklaşan Ödemeler</Text>
        {yaklasanOdemeler.length > 0 ? (
          <FlatList
            data={yaklasanOdemeler}
            renderItem={renderOdemeItem}
            keyExtractor={item => item.id}
            style={styles.odemeList}
          />
        ) : (
          <Text style={styles.noOdemeText}>Yaklaşan ödeme bulunmamaktadır.</Text>
        )}
      </View>

      {/* Ödeme Ekleme Modalı */}
      <Modal
        isVisible={isModalVisible}
        onBackdropPress={() => setModalVisible(false)}
        style={styles.modal}
      >
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Yeni Ödeme Kaydı</Text>
          <Text style={styles.modalSubtitle}>Tarih: {selectedDate}</Text>

          <View style={styles.turContainer}>
            <TouchableOpacity
              style={[styles.turButton, tur === 'Gider' && styles.selectedTurButton]}
              onPress={() => setTur('Gider')}
            >
              <Text style={[styles.turButtonText, tur === 'Gider' && styles.selectedTurButtonText]}>
                Gider
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.turButton, tur === 'Gelir' && styles.selectedTurButton]}
              onPress={() => setTur('Gelir')}
            >
              <Text style={[styles.turButtonText, tur === 'Gelir' && styles.selectedTurButtonText]}>
                Gelir
              </Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Miktar (₺)"
            keyboardType="numeric"
            value={miktar}
            onChangeText={setMiktar}
          />
          <TextInput
            style={styles.input}
            placeholder="Açıklama"
            value={aciklama}
            onChangeText={setAciklama}
          />

          {renderKategoriList()}

          <TouchableOpacity style={styles.ekleButton} onPress={handleOdemeEkle}>
            <Text style={styles.ekleButtonText}>Ekle</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  calendar: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  sectionContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3b82f6',
    marginBottom: 12,
  },
  odemeList: {
    flex: 1,
  },
  odemeCard: {
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  giderCard: {
    backgroundColor: '#fef2f2',
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  gelirCard: {
    backgroundColor: '#f0fdfa',
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  odemeMiktar: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  odemeAciklama: {
    fontSize: 16,
    color: '#4b5563',
    marginTop: 4,
  },
  odemeTur: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  noOdemeText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 24,
  },
  modal: {
    justifyContent: 'center', // Modal'ı ekranın ortasında açmak için
    margin: 0,
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 16, // Kenarlardan boşluk bırakmak için
    maxHeight: '75%', // Modal yüksekliğini artırdım ki içerik rahatça sığsın
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#f9fafb',
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
    backgroundColor: '#f3f4f6',
    marginHorizontal: 4,
  },
  selectedTurButton: {
    backgroundColor: '#3b82f6',
  },
  turButtonText: {
    fontSize: 16,
    color: '#6b7280',
  },
  selectedTurButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  kategoriContainer: {
    marginBottom: 20,
  },
  kategoriLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  kategoriListContainer: {
    maxHeight: 180, // Liste yüksekliğini artırdım ki daha fazla kategori görünebilsin
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    backgroundColor: '#f9fafb',
    overflow: 'hidden', // Taşmayı önlemek için
  },
  kategoriItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  selectedKategoriItem: {
    backgroundColor: '#3b82f6',
  },
  kategoriItemText: {
    fontSize: 14,
    color: '#1f2937',
  },
  selectedKategoriItemText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  ekleButton: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20, // Kategori listesinden sonra boşluk bırakmak için
  },
  ekleButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default OdemelerEkrani;