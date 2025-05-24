import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert } from 'react-native';
import { firestore, auth } from '../services/firebase';
import { collection, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';

const TransferlerEkrani = () => {
  const [transferler, setTransferler] = useState([]);
  const [yeniTransfer, setYeniTransfer] = useState({
    alici: '',
    miktar: '',
    aciklama: '',
  });

  const user = auth.currentUser;
  const userId = user ? user.uid : null;

  // Transferleri Firestore'dan çekme
  useEffect(() => {
    if (!userId) return;

    const subscriber = onSnapshot(collection(firestore, 'users', userId, 'transferler'), (querySnapshot) => {
      const transferList = [];
      querySnapshot.forEach((documentSnapshot) => {
        transferList.push({
          id: documentSnapshot.id,
          ...documentSnapshot.data(),
        });
      });
      // Tarihe göre sıralama (en yeni en üstte)
      transferList.sort((a, b) => b.tarih?.seconds - a.tarih?.seconds);
      setTransferler(transferList);
    });

    return () => subscriber();
  }, [userId]);

  // Yeni transfer ekleme fonksiyonu
  const handleYeniTransfer = async () => {
    if (!yeniTransfer.alici || !yeniTransfer.miktar) {
      Alert.alert('Hata', 'Alıcı ve miktar alanları zorunludur.');
      return;
    }

    try {
      await addDoc(collection(firestore, 'users', userId, 'transferler'), {
        alici: yeniTransfer.alici,
        miktar: parseFloat(yeniTransfer.miktar),
        aciklama: yeniTransfer.aciklama || '',
        tarih: serverTimestamp(),
      });

      // Formu temizle
      setYeniTransfer({ alici: '', miktar: '', aciklama: '' });
      Alert.alert('Başarılı', 'Transfer başarıyla eklendi.');
    } catch (error) {
      Alert.alert('Hata', 'Transfer eklenirken bir sorun oluştu: ' + error.message);
    }
  };

  // Transfer öğesini render etme
  const renderTransferItem = ({ item }) => (
    <View style={styles.transferItem}>
      <View style={styles.transferIconContainer}>
        <View style={styles.transferIcon}>
          <Text style={styles.transferIconText}>T</Text>
        </View>
      </View>
      <View style={styles.transferDetails}>
        <Text style={styles.transferTitle}>{item.alici}</Text>
        <Text style={styles.transferDescription}>{item.aciklama || 'Açıklama yok'}</Text>
        <Text style={styles.transferDate}>
          {item.tarih ? new Date(item.tarih.seconds * 1000).toLocaleDateString('tr-TR') : 'Tarih bilinmiyor'}
        </Text>
      </View>
      <Text style={styles.transferAmount}>{item.miktar.toFixed(2)} ₺</Text>
    </View>
  );

  // Yeni Transfer Yap bölümünü render etme (FlatList'in dışında)
  const renderYeniTransferSection = () => (
    <View style={styles.yeniTransferContainer}>
      <Text style={styles.sectionTitle}>Yeni Transfer Yap</Text>
      <TextInput
        style={styles.input}
        placeholder="Alıcı (Kişi/Kurum)"
        value={yeniTransfer.alici}
        onChangeText={(text) => setYeniTransfer({ ...yeniTransfer, alici: text })}
      />
      <TextInput
        style={styles.input}
        placeholder="Miktar (₺)"
        value={yeniTransfer.miktar}
        onChangeText={(text) => setYeniTransfer({ ...yeniTransfer, miktar: text })}
        keyboardType="numeric"
      />
      <TextInput
        style={[styles.input, styles.aciklamaInput]}
        placeholder="Açıklama (isteğe bağlı)"
        value={yeniTransfer.aciklama}
        onChangeText={(text) => setYeniTransfer({ ...yeniTransfer, aciklama: text })}
        multiline
      />
      <TouchableOpacity style={styles.transferButton} onPress={handleYeniTransfer}>
        <Text style={styles.transferButtonText}>Transferi Gönder</Text>
      </TouchableOpacity>
    </View>
  );

  // Son Transferler bölümünü render etme
  const renderSonTransferlerSection = () => (
    <View style={styles.transferlerContainer}>
      <Text style={styles.sectionTitle}>Son Transferler</Text>
      {transferler.length > 0 ? (
        <FlatList
          data={transferler}
          renderItem={renderTransferItem}
          keyExtractor={(item) => item.id}
          style={styles.transferList}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <Text style={styles.noDataText}>Henüz transfer bulunmamaktadır.</Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Transferler</Text>
      {renderYeniTransferSection()}
      {renderSonTransferlerSection()}
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
  // Yeni Transfer Yap Bölümü Stilleri
  yeniTransferContainer: {
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
  aciklamaInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  transferButton: {
    backgroundColor: '#339AF0',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  transferButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  // Son Transferler Bölümü Stilleri
  transferlerContainer: {
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
  transferList: {
    flex: 1,
  },
  transferItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6',
  },
  transferIconContainer: {
    marginRight: 12,
  },
  transferIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#339AF0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  transferIconText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  transferDetails: {
    flex: 1,
  },
  transferTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#343a40',
  },
  transferDescription: {
    fontSize: 14,
    color: '#6c757d',
  },
  transferDate: {
    fontSize: 12,
    color: '#868e96',
  },
  transferAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2b9348', // Yeşil tonu, pozitif işlem için
  },
  noDataText: {
    fontSize: 16,
    color: '#868e96',
    textAlign: 'center',
    padding: 20,
  },
});

export default TransferlerEkrani;