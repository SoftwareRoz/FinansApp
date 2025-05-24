import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { firestore, auth } from '../services/firebase'; // Firestore ve Auth yapılandırma dosyanız

export default function Bildirimler() {
  const [bildirimler, setBildirimler] = useState([]);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    // Kullanıcı kimliğini al
    const currentUser = auth.currentUser;
    if (currentUser) {
      setUserId(currentUser.uid);
    } else {
      console.log("Kullanıcı oturum açmamış.");
    }
  }, []);

  useEffect(() => {
    if (!userId) return; // Kullanıcı kimliği yoksa işlem yapma

    // Firestore'dan gerçek zamanlı veri dinleme fonksiyonu
    const fetchBildirimler = () => {
      // Ödemeler koleksiyonunu dinle (kullanıcıya özel)
      const odemelerQuery = query(
        collection(firestore, `users/${userId}/odemeler`), 
        orderBy('tarih', 'desc')
      );
      const unsubscribeOdemeler = onSnapshot(odemelerQuery, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const odeme = change.doc.data();
            const yeniBildirim = {
              id: `odeme-${change.doc.id}`,
              baslik: 'Yeni Ödeme Eklendi',
              aciklama: `${odeme.aciklama || 'Bir ödeme'} başarıyla eklendi.`,
              tarih: odeme.tarih ? new Date(odeme.tarih.seconds * 1000).toLocaleString('tr-TR') : 'Tarih belirtilmemiş',
              okundu: false,
            };
            setBildirimler((prev) => [...prev, yeniBildirim]);
          }
        });
      });

      // Transferler koleksiyonunu dinle (kullanıcıya özel)
      const transferlerQuery = query(
        collection(firestore, `users/${userId}/transferler`), 
        orderBy('tarih', 'desc')
      );
      const unsubscribeTransferler = onSnapshot(transferlerQuery, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const transfer = change.doc.data();
            const yeniBildirim = {
              id: `transfer-${change.doc.id}`,
              baslik: 'Yeni Transfer Eklendi',
              aciklama: `${transfer.aciklama || 'Bir transfer'} başarıyla eklendi.`,
              tarih: transfer.tarih ? new Date(transfer.tarih.seconds * 1000).toLocaleString('tr-TR') : 'Tarih belirtilmemiş',
              okundu: false,
            };
            setBildirimler((prev) => [...prev, yeniBildirim]);
          }
        });
      });

      // Yatırımlar koleksiyonunu dinle (kullanıcıya özel)
      const yatirimlarQuery = query(
        collection(firestore, `users/${userId}/yatirimlar`), 
        orderBy('tarih', 'desc')
      );
      const unsubscribeYatirimlar = onSnapshot(yatirimlarQuery, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const yatirim = change.doc.data();
            const yeniBildirim = {
              id: `yatirim-${change.doc.id}`,
              baslik: 'Yeni Yatırım Eklendi',
              aciklama: `${yatirim.aciklama || 'Bir yatırım'} başarıyla eklendi.`,
              tarih: yatirim.tarih ? new Date(yatirim.tarih.seconds * 1000).toLocaleString('tr-TR') : 'Tarih belirtilmemiş',
              okundu: false,
            };
            setBildirimler((prev) => [...prev, yeniBildirim]);
          }
        });
      });

      // Component temizlendiğinde dinlemeyi durdur
      return () => {
        unsubscribeOdemeler();
        unsubscribeTransferler();
        unsubscribeYatirimlar();
      };
    };

    fetchBildirimler();
  }, [userId]); // userId bağımlılığı eklendi

  // Bildirim öğesini render etme fonksiyonu
  const renderBildirim = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.bildirimContainer,
        { backgroundColor: item.okundu ? '#f9fafb' : '#eff6ff' }, // Okunmamış bildirimler için açık mavi arka plan
      ]}
      onPress={() => {
        // Bildirime tıklayınca yapılacak işlem (örneğin, detay sayfasına gitme)
        console.log(`Bildirim tıklandı: ${item.baslik}`);
        // Bildirimi okundu olarak işaretleme
        setBildirimler((prev) =>
          prev.map((bildirim) =>
            bildirim.id === item.id ? { ...bildirim, okundu: true } : bildirim
          )
        );
      }}
    >
      <View style={styles.bildirimIcon}>
        <Ionicons
          name={item.okundu ? 'mail-outline' : 'mail-unread-outline'}
          size={24}
          color={item.okundu ? '#6b7280' : '#2563eb'}
        />
      </View>
      <View style={styles.bildirimContent}>
        <Text style={styles.bildirimBaslik}>{item.baslik}</Text>
        <Text style={styles.bildirimAciklama} numberOfLines={1} ellipsizeMode="tail">
          {item.aciklama}
        </Text>
        <Text style={styles.bildirimTarih}>{item.tarih}</Text>
      </View>
      {!item.okundu && <View style={styles.okunmamisNokta} />}
    </TouchableOpacity>
  );

  // Tüm bildirimleri okundu olarak işaretleme fonksiyonu
  const tumunuOku = () => {
    setBildirimler((prev) => prev.map((bildirim) => ({ ...bildirim, okundu: true })));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bildirimler</Text>
        <TouchableOpacity style={styles.tumunuOkuButton} onPress={tumunuOku}>
          <Text style={styles.tumunuOkuText}>Tümünü Oku</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.contentContainer}>
        {bildirimler.length > 0 ? (
          <FlatList
            data={bildirimler}
            renderItem={renderBildirim}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listeContainer}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.bosListeContainer}>
            <Ionicons name="notifications-off-outline" size={48} color="#9ca3af" />
            <Text style={styles.bosListeText}>Henüz bildirim yok</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6', // AnaSayfa ile uyumlu açık gri arka plan
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff', // Başlık çubuğu beyaz arka plan
    elevation: 2, // Android gölge
    shadowColor: '#000', // iOS gölge
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937', // Koyu gri başlık rengi
  },
  tumunuOkuButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  tumunuOkuText: {
    fontSize: 14,
    color: '#2563eb', // Ana tema rengi (mavi)
    fontWeight: '500',
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  listeContainer: {
    paddingBottom: 16,
  },
  bildirimContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 1, // Android gölge
    shadowColor: '#000', // iOS gölge
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  bildirimIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6', // İkon arka planı açık gri
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bildirimContent: {
    flex: 1,
  },
  bildirimBaslik: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937', // Koyu gri başlık
    marginBottom: 2,
  },
  bildirimAciklama: {
    fontSize: 14,
    color: '#4b5563', // Orta gri açıklama
    marginBottom: 4,
  },
  bildirimTarih: {
    fontSize: 12,
    color: '#6b7280', // Açık gri tarih
  },
  okunmamisNokta: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563eb', // Okunmamış bildirimi gösteren mavi nokta
    marginLeft: 8,
  },
  bosListeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bosListeText: {
    fontSize: 16,
    color: '#9ca3af', // Açık gri boş liste yazısı
    marginTop: 8,
  },
});