import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth, firestore } from '../services/firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';

export default function Harcamalar() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!auth || !auth.currentUser) {
      setError('Kullanıcı oturumu bulunamadı. Lütfen tekrar giriş yapın.');
      setLoading(false);
      return;
    }

    if (!firestore) {
      setError('Firestore bağlantısı sağlanamadı. Uygulama yapılandırmasını kontrol edin.');
      setLoading(false);
      return;
    }

    console.log("Kullanıcı UID:", auth.currentUser.uid);

    // Firestore'dan kullanıcının transactions alt koleksiyonunu gerçek zamanlı olarak dinle
    const transactionsQuery = query(
      collection(firestore, 'users', auth.currentUser.uid, 'transactions')
    );

    const unsubscribe = onSnapshot(transactionsQuery, (querySnapshot) => {
      console.log("QuerySnapshot boyutu:", querySnapshot.size);
      if (!querySnapshot.empty) {
        const transactionsData = querySnapshot.docs.map(doc => {
          const data = doc.data();
          console.log("Belge verisi:", data);
          return {
            id: doc.id,
            ...data,
          };
        });
        // Tarihe göre descending (en yeni önce) sırala
        transactionsData.sort((a, b) => {
          if (!a.date || !b.date) return 0;
          return new Date(b.date) - new Date(a.date);
        });
        setTransactions(transactionsData);
      } else {
        setTransactions([]);
      }
      setLoading(false);
      setError(null);
    }, (error) => {
      console.error("İşlem verileri çekme hatası:", error);
      setError(`Veri yüklenirken bir hata oluştu: ${error.message}`);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return "Tarih belirtilmemiş";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Geçersiz tarih";
      return date.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch (e) {
      console.error("Tarih formatlama hatası:", e);
      return "Tarih hatası";
    }
  };

  const getTransactionType = (type) => {
    return type === 'income' ? 'Gelir' : 'Gider';
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.transactionItem}>
      <View style={[
        styles.transactionIcon,
        { backgroundColor: item.type === 'income' ? '#059669' : '#dc2626' }
      ]}>
        <Ionicons
          name={item.type === 'income' ? 'add-circle-outline' : 'remove-circle-outline'}
          size={24}
          color="#fff"
        />
      </View>
      <View style={styles.transactionDetails}>
        <Text style={styles.transactionAmount}>
          {item.type === 'income' ? '+' : '-'} ₺{(item.amount || 0).toLocaleString()}
        </Text>
        <Text style={styles.transactionDescription}>{item.description || "Açıklama yok"}</Text>
        <Text style={styles.transactionDate}>{formatDate(item.date)}</Text>
      </View>
      <View style={styles.transactionTypeContainer}>
        <Text style={styles.transactionType}>{getTransactionType(item.type || 'expense')}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Harcamalarım</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="filter-outline" size={22} color="#2563eb" />
          <Text style={styles.filterText}>Filtrele</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.contentContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={styles.loadingText}>Veriler yükleniyor...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={50} color="#dc2626" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : transactions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-outline" size={50} color="#9ca3af" />
            <Text style={styles.emptyText}>Henüz işlem kaydınız bulunmamaktadır.</Text>
          </View>
        ) : (
          <FlatList
            data={transactions}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
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
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#eff6ff',
    borderRadius: 20,
  },
  filterText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
    color: '#2563eb',
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#dc2626',
    marginTop: 10,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 10,
    textAlign: 'center',
  },
  listContainer: {
    paddingBottom: 20,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  transactionIcon: {
    padding: 10,
    borderRadius: 12,
    marginRight: 16,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  transactionDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  transactionTypeContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
  },
  transactionType: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4b5563',
  },
});