import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, Modal, Pressable, Image } from 'react-native';
import { firestore, auth } from '../services/firebase';
import { collection, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';

const KartlarimEkrani = () => {
  const [kartlar, setKartlar] = useState([]);
  const [yeniKart, setYeniKart] = useState({
    kartAdi: '',
    kartNumarasi: '',
    sonKullanma: '',
    cvv: '',
    kartTipi: 'Kredi Kartı', // Varsayılan olarak Kredi Kartı
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [seciliKart, setSeciliKart] = useState(null);
  const [eklemeFormuAcik, setEklemeFormuAcik] = useState(false);

  const user = auth.currentUser;
  const userId = user ? user.uid : null;

  // Kartları Firestore'dan çekme
  useEffect(() => {
    if (!userId) return;

    const subscriber = onSnapshot(collection(firestore, 'users', userId, 'kartlar'), (querySnapshot) => {
      const kartList = [];
      querySnapshot.forEach((documentSnapshot) => {
        kartList.push({
          id: documentSnapshot.id,
          ...documentSnapshot.data(),
        });
      });
      setKartlar(kartList);
    });

    return () => subscriber();
  }, [userId]);

  // Yeni kart ekleme fonksiyonu
  const handleYeniKartEkle = async () => {
    if (!yeniKart.kartAdi || !yeniKart.kartNumarasi || !yeniKart.sonKullanma || !yeniKart.cvv) {
      Alert.alert('Hata', 'Tüm alanları doldurmanız gerekmektedir.');
      return;
    }

    try {
      await addDoc(collection(firestore, 'users', userId, 'kartlar'), {
        kartAdi: yeniKart.kartAdi,
        kartNumarasi: yeniKart.kartNumarasi,
        sonKullanma: yeniKart.sonKullanma,
        cvv: yeniKart.cvv,
        kartTipi: yeniKart.kartTipi,
        eklenmeTarihi: serverTimestamp(),
      });

      // Formu temizle ve kapat
      setYeniKart({ kartAdi: '', kartNumarasi: '', sonKullanma: '', cvv: '', kartTipi: 'Kredi Kartı' });
      setEklemeFormuAcik(false);
      Alert.alert('Başarılı', 'Kart başarıyla eklendi.');
    } catch (error) {
      Alert.alert('Hata', 'Kart eklenirken bir sorun oluştu: ' + error.message);
    }
  };

  // Kart detaylarını gösterme
  const handleKartDetay = (kart) => {
    setSeciliKart(kart);
    setModalVisible(true);
  };

  // Kart öğesini render etme
  const renderKartItem = ({ item }) => (
    <TouchableOpacity style={styles.kartItem} onPress={() => handleKartDetay(item)}>
      <View style={styles.kartResimContainer}>
        <View style={[styles.kartResim, { backgroundColor: item.kartTipi === 'Kredi Kartı' ? '#1e3a8a' : '#15803d' }]}>
          <Text style={styles.kartChip}>CHIP</Text>
          <Text style={styles.kartNumarasi}>**** **** **** {item.kartNumarasi.slice(-4)}</Text>
          <Text style={styles.kartAdi}>{item.kartAdi}</Text>
          <Text style={styles.kartSonKullanma}>Son Kullanma: {item.sonKullanma}</Text>
          <View style={styles.kartTipiContainer}>
            <Text style={styles.kartTipi}>{item.kartTipi}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Kartlarım</Text>

      {/* Kart Ekleme Butonu */}
      <TouchableOpacity 
        style={styles.kartEkleButon} 
        onPress={() => setEklemeFormuAcik(!eklemeFormuAcik)}
      >
        <Ionicons name="add-circle-outline" size={24} color="#ffffff" />
        <Text style={styles.kartEkleButonText}>Yeni Kart Ekle</Text>
      </TouchableOpacity>

      {/* Yeni Kart Ekleme Formu */}
      {eklemeFormuAcik && (
        <View style={styles.yeniKartContainer}>
          <Text style={styles.sectionTitle}>Yeni Kart Ekle</Text>
          <TextInput
            style={styles.input}
            placeholder="Kart Adı (ör. Akbank Visa)"
            value={yeniKart.kartAdi}
            onChangeText={(text) => setYeniKart({ ...yeniKart, kartAdi: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="Kart Numarası"
            value={yeniKart.kartNumarasi}
            onChangeText={(text) => setYeniKart({ ...yeniKart, kartNumarasi: text })}
            keyboardType="numeric"
            maxLength={16}
          />
          <View style={styles.ikiliInputContainer}>
            <TextInput
              style={[styles.input, styles.yariInput]}
              placeholder="Son Kullanma (AA/YY)"
              value={yeniKart.sonKullanma}
              onChangeText={(text) => setYeniKart({ ...yeniKart, sonKullanma: text })}
              maxLength={5}
            />
            <TextInput
              style={[styles.input, styles.yariInput]}
              placeholder="CVV"
              value={yeniKart.cvv}
              onChangeText={(text) => setYeniKart({ ...yeniKart, cvv: text })}
              keyboardType="numeric"
              maxLength={3}
              secureTextEntry
            />
          </View>
          <View style={styles.kartTipiSecim}>
            <TouchableOpacity
              style={[
                styles.kartTipiButon,
                yeniKart.kartTipi === 'Kredi Kartı' && styles.kartTipiSecili,
              ]}
              onPress={() => setYeniKart({ ...yeniKart, kartTipi: 'Kredi Kartı' })}
            >
              <Text style={styles.kartTipiButonText}>Kredi Kartı</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.kartTipiButon,
                yeniKart.kartTipi === 'Banka Kartı' && styles.kartTipiSecili,
              ]}
              onPress={() => setYeniKart({ ...yeniKart, kartTipi: 'Banka Kartı' })}
            >
              <Text style={styles.kartTipiButonText}>Banka Kartı</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.kaydetButon} onPress={handleYeniKartEkle}>
            <Text style={styles.kaydetButonText}>Kartı Kaydet</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Kartlar Listesi */}
      <View style={styles.kartlarContainer}>
        <Text style={styles.sectionTitle}>Kayıtlı Kartlar</Text>
        {kartlar.length > 0 ? (
          <FlatList
            data={kartlar}
            renderItem={renderKartItem}
            keyExtractor={(item) => item.id}
            style={styles.kartListesi}
            numColumns={1}
          />
        ) : (
          <Text style={styles.noDataText}>Henüz kayıtlı kart bulunmamaktadır.</Text>
        )}
      </View>

      {/* Kart Detay Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Kart Bilgileri</Text>
            {seciliKart && (
              <>
                <View style={[styles.modalKartResim, { backgroundColor: seciliKart.kartTipi === 'Kredi Kartı' ? '#1e3a8a' : '#15803d' }]}>
                  <Text style={styles.kartChip}>CHIP</Text>
                  <Text style={styles.kartNumarasi}>**** **** **** {seciliKart.kartNumarasi.slice(-4)}</Text>
                  <Text style={styles.kartAdi}>{seciliKart.kartAdi}</Text>
                  <Text style={styles.kartSonKullanma}>Son Kullanma: {seciliKart.sonKullanma}</Text>
                </View>
                <View style={styles.bilgiSatiri}>
                  <Text style={styles.bilgiBaslik}>Kart Numarası:</Text>
                  <Text style={styles.bilgiDeger}>{seciliKart.kartNumarasi.replace(/(\d{4})/g, '$1 ')}</Text>
                </View>
                <View style={styles.bilgiSatiri}>
                  <Text style={styles.bilgiBaslik}>Son Kullanma:</Text>
                  <Text style={styles.bilgiDeger}>{seciliKart.sonKullanma}</Text>
                </View>
                <View style={styles.bilgiSatiri}>
                  <Text style={styles.bilgiBaslik}>CVV:</Text>
                  <Text style={styles.bilgiDeger}>***</Text>
                </View>
                <View style={styles.bilgiSatiri}>
                  <Text style={styles.bilgiBaslik}>Kart Tipi:</Text>
                  <Text style={styles.bilgiDeger}>{seciliKart.kartTipi}</Text>
                </View>
              </>
            )}
            <Pressable
              style={styles.kapatButon}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.kapatButonText}>Kapat</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 16,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#343a40',
    marginBottom: 12,
  },
  // Kart Ekleme Butonu
  kartEkleButon: {
    flexDirection: 'row',
    backgroundColor: '#339AF0',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  kartEkleButonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  // Yeni Kart Ekleme Formu
  yeniKartContainer: {
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
  input: {
    backgroundColor: '#e9ecef',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    color: '#495057',
  },
  ikiliInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  yariInput: {
    flex: 0.48,
  },
  kartTipiSecim: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  kartTipiButon: {
    flex: 0.48,
    backgroundColor: '#e9ecef',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  kartTipiSecili: {
    backgroundColor: '#339AF0',
  },
  kartTipiButonText: {
    fontSize: 16,
    color: '#495057',
  },
  kaydetButon: {
    backgroundColor: '#339AF0',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  kaydetButonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  // Kartlar Listesi
  kartlarContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    flex: 1,
  },
  kartListesi: {
    flex: 1,
  },
  kartItem: {
    marginBottom: 16,
  },
  kartResimContainer: {
    alignItems: 'center',
  },
  kartResim: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    padding: 16,
    justifyContent: 'space-between',
    position: 'relative',
  },
  kartChip: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 10,
    color: '#000',
    fontWeight: 'bold',
  },
  kartNumarasi: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 2,
    marginTop: 60,
    textAlign: 'center',
  },
  kartAdi: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'left',
  },
  kartSonKullanma: {
    color: '#ffffff',
    fontSize: 14,
    textAlign: 'left',
  },
  kartTipiContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  kartTipi: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  noDataText: {
    fontSize: 16,
    color: '#868e96',
    textAlign: 'center',
    padding: 20,
  },
  // Modal Stilleri
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#343a40',
  },
  modalKartResim: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    justifyContent: 'space-between',
  },
  bilgiSatiri: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  bilgiBaslik: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
  },
  bilgiDeger: {
    fontSize: 16,
    color: '#343a40',
  },
  kapatButon: {
    backgroundColor: '#339AF0',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    width: '50%',
  },
  kapatButonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default KartlarimEkrani;