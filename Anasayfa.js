import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { auth, firestore } from '../services/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export default function AnaSayfa() {
  const navigation = useNavigation();
  const [userData, setUserData] = useState(null);
  const [totalBalance, setTotalBalance] = useState(0);
  const [income, setIncome] = useState(0);
  const [expense, setExpense] = useState(0);

  useEffect(() => {
    // auth nesnesini kontrol et
    console.log("Auth nesnesi:", auth);
    if (!auth) {
      console.error("Auth nesnesi tanımlanmamış!");
      setUserData({ ad: "Kullanıcı" });
      return;
    }

    // auth.currentUser'ı kontrol et
    console.log("Auth.currentUser:", auth.currentUser);
    if (!auth.currentUser) {
      console.error("Kullanıcı oturumu bulunamadı.");
      setUserData({ ad: "Kullanıcı" });
      return;
    }

    // firestore referansını kontrol et
    console.log("Firestore referansı:", firestore);
    if (!firestore) {
      console.error("Firestore referansı tanımlanmamış!");
      return;
    }

    // Kullanıcı verilerini Firestore'dan gerçek zamanlı olarak dinle
    const userQuery = query(
      collection(firestore, 'users'),
      where('uid', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(userQuery, (querySnapshot) => {
      if (!querySnapshot.empty) {
        const data = querySnapshot.docs[0].data();
        console.log("Firestore'dan gelen güncel veri:", data); // Hata ayıklama için
        setUserData(data);
        setTotalBalance(data.totalBalance || 0);
        setIncome(data.income || 0);
        setExpense(data.expense || 0);
      } else {
        console.error("Kullanıcı verileri bulunamadı.");
        setUserData({ ad: "Kullanıcı" });
      }
    }, (error) => {
      console.error("Veri çekme hatası:", error);
      setUserData({ ad: "Kullanıcı" });
    });

    // Component temizlendiğinde dinlemeyi durdur
    return () => unsubscribe();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.userName}>
            Hoşgeldin, {userData?.adSoyad || 'Kullanıcı'}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="notifications-outline" size={24} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="settings-outline" size={24} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView>
        {/* Özet Kartı */}
        <View style={styles.summaryCard}>
          <Text style={styles.totalBalance}>₺{totalBalance.toLocaleString()}</Text>
          <Text style={styles.balanceLabel}>Toplam Varlık</Text>
          <View style={styles.summaryDetails}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>₺{income.toLocaleString()}</Text>
              <Text style={styles.summaryLabel}>Gelir</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>₺{expense.toLocaleString()}</Text>
              <Text style={styles.summaryLabel}>Gider</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                ₺{(income - expense).toLocaleString()}
              </Text>
              <Text style={styles.summaryLabel}>Kalan</Text>
            </View>
          </View>
        </View>

        {/* Hızlı İşlemler */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('GelirEkle')}
          >
            <Ionicons name="add-circle-outline" size={24} color="#2563eb" />
            <Text style={styles.actionText}>Gelir Ekle</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('GiderEkle')}
          >
            <Ionicons name="remove-circle-outline" size={24} color="#dc2626" />
            <Text style={styles.actionText}>Gider Ekle</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('TransferlerEkrani')}
          >
            <Ionicons name="swap-horizontal-outline" size={24} color="#059669" />
            <Text style={styles.actionText}>Transfer</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('ButceEkrani')}
          >
            <Ionicons name="pie-chart-outline" size={24} color="#7c3aed" />
            <Text style={styles.actionText}>Bütçe</Text>
          </TouchableOpacity>
        </View>

        {/* Alt Menü Kartları */}
        <View style={styles.menuCardsContainer}>
          <View style={styles.menuRow}>
            <TouchableOpacity
              style={styles.menuCard}
              onPress={() => navigation.navigate('Harcamalar')}
            >
              <View style={[styles.cardIcon, { backgroundColor: '#2563eb' }]}>
                <Ionicons name="card-outline" size={24} color="#fff" />
              </View>
              <Text style={styles.cardTitle}>Harcamalarım</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuCard}
              onPress={() => navigation.navigate('Yatirimlarim')}
            >
              <View style={[styles.cardIcon, { backgroundColor: '#059669' }]}>
                <Ionicons name="trending-up-outline" size={24} color="#fff" />
              </View>
              <Text style={styles.cardTitle}>Yatırımlarım</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.menuRow}>
            <TouchableOpacity
              style={styles.menuCard}
              onPress={() => navigation.navigate('KartlarimEkrani')}
            >
              <View style={[styles.cardIcon, { backgroundColor: '#7c3aed' }]}>
                <Ionicons name="wallet-outline" size={24} color="#fff" />
              </View>
              <Text style={styles.cardTitle}>Kartlarım</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuCard}
              onPress={() => navigation.navigate('OdemelerEkrani')}
            >
              <View style={[styles.cardIcon, { backgroundColor: '#dc2626' }]}>
                <Ionicons name="calendar-outline" size={24} color="#fff" />
              </View>
              <Text style={styles.cardTitle}>Ödemelerim</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  iconButton: {
    marginLeft: 16,
  },
  summaryCard: {
    backgroundColor: '#2563eb',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    elevation: 4,
  },
  totalBalance: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  balanceLabel: {
    color: '#e5e7eb',
    marginTop: 4,
  },
  summaryDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  summaryLabel: {
    color: '#e5e7eb',
    marginTop: 4,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 12,
    elevation: 2,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionText: {
    marginTop: 8,
    fontSize: 12,
    color: '#4b5563',
  },
  menuCardsContainer: {
    padding: 16,
  },
  menuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  menuCard: {
    backgroundColor: '#fff',
    width: '48%', // İki kart yan yana sığsın diye genişlik %48 olarak ayarlandı
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    padding: 8,
    borderRadius: 8,
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
    flex: 1,
  },
});