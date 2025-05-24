import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './services/firebase';
import { View, ActivityIndicator } from 'react-native';

// Giriş/kayıt/şifre ekranları
import GirisEkrani from './screens/GirisSayfasi';
import KayitEkrani from './screens/KayitEkrani';
import SifremiUnuttumEkrani from './screens/SifremiUnuttumEkrani';

// Ana uygulama ekranları
import AppNavigator from './navigation/AppNavigator'; // Tab navigasyonunu içeren dosya
import GelirEkle from './screens/GelirEkle';
import GiderEkle from './screens/GiderEkle';
import Harcamalar from './screens/Harcamalar';
import Yatirimlarim from './screens/Yatirimlarim';
import OdemelerEkrani from './screens/OdemelerEkrani';
import ButceEkrani from './screens/ButceEkrani'; // Bütçe Ekranı eklendi
import TransferlerEkrani from './screens/TransferlerEkrani'; // Transferler Ekranı eklendi
import KartlarimEkrani from './screens/KartlarimEkrani'; // Kartlarım Ekranı eklendi

const Stack = createNativeStackNavigator();

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator 
        screenOptions={{ 
          headerShown: false,
          animation: 'slide_from_right' 
        }}
      >
        {!user ? (
          // Auth Stack - Giriş, Kayıt ve Şifre Sıfırlama Ekranları
          <>
            <Stack.Screen 
              name="GirisEkrani" 
              component={GirisEkrani}
              options={{ animationTypeForReplace: !user ? 'pop' : 'push' }}
            />
            <Stack.Screen name="KayitEkrani" component={KayitEkrani} />
            <Stack.Screen name="SifremiUnuttumEkrani" component={SifremiUnuttumEkrani} />
          </>
        ) : (
          // App Stack - Ana Uygulama Ekranları
          <>
            <Stack.Screen name="AppNavigator" component={AppNavigator} />
            <Stack.Screen name="GelirEkle" component={GelirEkle} />
            <Stack.Screen name="GiderEkle" component={GiderEkle} />
            <Stack.Screen name="Harcamalar" component={Harcamalar} />
            <Stack.Screen name="Yatirimlarim" component={Yatirimlarim} />
            <Stack.Screen name="OdemelerEkrani" component={OdemelerEkrani} />
            <Stack.Screen name="ButceEkrani" component={ButceEkrani} />
            <Stack.Screen name="TransferlerEkrani" component={TransferlerEkrani} />
            <Stack.Screen name="KartlarimEkrani" component={KartlarimEkrani} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}