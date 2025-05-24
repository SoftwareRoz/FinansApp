import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, Text, Image, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth, firestore } from '../services/firebase'; // Firebase auth ve firestore modüllerini içe aktarın
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigation, CommonActions } from '@react-navigation/native'; // React Navigation için navigasyon hook'u ve CommonActions

export default function Profil() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation(); // Navigasyon fonksiyonunu kullanmak için

  // Kullanıcı bilgilerini Firebase Auth ve Firestore'dan çekme
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      // Auth bilgilerini ayarla
      setUser({
        email: currentUser.email || 'E-posta bulunamadı',
        photoURL: currentUser.photoURL || null,
        uid: currentUser.uid,
      });

      // Firestore'dan kullanıcı adSoyad bilgisini çek
      const fetchUserData = async () => {
        try {
          const userRef = doc(firestore, 'users', currentUser.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const data = userSnap.data();
            setUserData({
              adSoyad: data.adSoyad || 'Ad Soyad',
            });
          } else {
            setUserData({
              adSoyad: 'Ad Soyad',
            });
          }
        } catch (error) {
          console.error('Firestore veri çekme hatası:', error);
          setUserData({
            adSoyad: 'Ad Soyad',
          });
        } finally {
          setLoading(false);
        }
      };

      fetchUserData();
    } else {
      setUser(null);
      setUserData(null);
      setLoading(false);
    }
  }, []);

  // Çıkış yapma fonksiyonu
  const handleLogout = async () => {
    try {
      await signOut(auth);
      Alert.alert('Çıkış Yapıldı', 'Başarıyla çıkış yaptınız.', [
        {
          text: 'Tamam',
          onPress: () => {
            try {
              // Navigasyon yığınını sıfırlayarak GirisEkrani sayfasına yönlendirme
              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: 'GirisEkrani' }],
                })
              );
            } catch (error) {
              console.error('Navigasyon hatası:', error);
              Alert.alert('Hata', 'Giriş sayfasına yönlendirilemedi. Lütfen uygulamayı yeniden başlatın veya giriş sayfasına manuel olarak gidin.');
            }
          }
        }
      ]);
    } catch (error) {
      Alert.alert('Hata', 'Çıkış yaparken bir hata oluştu: ' + error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profil</Text>
        <TouchableOpacity style={styles.editButton}>
          <Ionicons name="pencil-outline" size={22} color="#fff" />
          <Text style={styles.editText}>Düzenle</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Ionicons name="refresh-outline" size={50} color="#9ca3af" style={styles.loadingIcon} />
            <Text style={styles.loadingText}>Bilgiler yükleniyor...</Text>
          </View>
        ) : user && userData ? (
          <View style={styles.profileContainer}>
            <View style={styles.profileHeader}>
              <View style={styles.profileImageContainer}>
                {user.photoURL ? (
                  <Image
                    source={{ uri: user.photoURL }}
                    style={styles.profileImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.defaultImage}>
                    <Ionicons name="person-outline" size={60} color="#fff" />
                  </View>
                )}
                <View style={styles.onlineIndicator} />
              </View>
              <Text style={styles.userName}>{userData.adSoyad}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
            </View>

            <View style={styles.statsContainer}>
              <View style={styles.statBox}>
                <Ionicons name="wallet-outline" size={24} color="#4a90e2" />
                <Text style={styles.statNumber}>3</Text>
                <Text style={styles.statLabel}>Hesap</Text>
              </View>
              <View style={styles.statBox}>
                <Ionicons name="swap-horizontal-outline" size={24} color="#4a90e2" />
                <Text style={styles.statNumber}>12</Text>
                <Text style={styles.statLabel}>İşlem</Text>
              </View>
              <View style={styles.statBox}>
                <Ionicons name="document-text-outline" size={24} color="#4a90e2" />
                <Text style={styles.statNumber}>5</Text>
                <Text style={styles.statLabel}>Rapor</Text>
              </View>
            </View>

            <View style={styles.optionsContainer}>
              <TouchableOpacity style={styles.optionItem}>
                <Ionicons name="person-outline" size={22} color="#1f2937" />
                <Text style={styles.optionText}>Hesap Bilgileri</Text>
                <Ionicons name="chevron-forward-outline" size={18} color="#9ca3af" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.optionItem}>
                <Ionicons name="settings-outline" size={22} color="#1f2937" />
                <Text style={styles.optionText}>Ayarlar</Text>
                <Ionicons name="chevron-forward-outline" size={18} color="#9ca3af" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.optionItem}>
                <Ionicons name="help-circle-outline" size={22} color="#1f2937" />
                <Text style={styles.optionText}>Yardım ve Destek</Text>
                <Ionicons name="chevron-forward-outline" size={18} color="#9ca3af" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.loadingContainer}>
            <Ionicons name="alert-circle-outline" size={50} color="#9ca3af" />
            <Text style={styles.loadingText}>Kullanıcı bilgileri bulunamadı.</Text>
          </View>
        )}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color="#fff" />
          <Text style={styles.logoutButtonText}>Çıkış Yap</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa', // Daha modern bir açık gri ton
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 18,
    backgroundColor: '#4a90e2', // Modern mavi ton
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff', // Beyaz başlık yazısı
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)', // Şeffaf beyaz arka plan
    borderRadius: 20,
  },
  editText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
    color: '#fff', // Beyaz yazı
  },
  contentContainer: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 30,
  },
  profileContainer: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    marginBottom: 20,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 4,
    borderColor: '#4a90e2', // Mavi çerçeve
  },
  defaultImage: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#4a90e2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#3b82f6',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#22c55e', // Yeşil çevrimiçi göstergesi
    borderWidth: 2,
    borderColor: '#fff',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  userEmail: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 24,
  },
  statBox: {
    alignItems: 'center',
    backgroundColor: '#f0f9ff', // Daha modern açık mavi
    padding: 16,
    borderRadius: 16,
    width: '30%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4a90e2',
    marginVertical: 6,
  },
  statLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  optionsContainer: {
    width: '100%',
    marginBottom: 20,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#f9fafb',
    borderRadius: 14,
    marginBottom: 12,
    justifyContent: 'space-between',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  optionText: {
    flex: 1,
    marginLeft: 14,
    fontSize: 16,
    color: '#1f2937',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444', // Kırmızı çıkış butonu
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 14,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    width: '100%',
    justifyContent: 'center',
    marginTop: 20,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
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
  loadingIcon: {
    transform: [{ rotate: '0deg' }],
    animation: 'spin 1s linear infinite',
  },
});