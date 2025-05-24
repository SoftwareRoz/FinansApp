import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ImageBackground,
} from "react-native";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, firestore } from "../services/firebase";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

export default function KayitEkrani() {
  const [adSoyad, setAdSoyad] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigation = useNavigation();

  const handleRegister = async () => {
    if (!adSoyad || !email || !password || !confirmPassword) {
      Alert.alert("Uyarı", "Lütfen tüm alanları doldurun.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Hata", "Şifreler uyuşmuyor.");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Uyarı", "Şifre en az 6 karakter olmalıdır.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const userId = userCredential.user.uid;

      // Firestore'a kullanıcı verilerini ve finansal alanları ekle
      await setDoc(doc(firestore, "users", userId), {
        uid: userId,
        adSoyad: adSoyad,
        email: email,
        createdAt: new Date().toISOString(),
        totalBalance: 0,
        income: 0,
        expense: 0
      });

      // Kayıt sonrası kullanıcıyı çıkış yaptır ve giriş ekranına yönlendir
      await signOut(auth);

      Alert.alert(
        "Başarılı",
        "Kayıt işlemi tamamlandı. Lütfen giriş yapın.",
        [
          {
            text: "Tamam",
            onPress: () => navigation.navigate("GirisEkrani")
          }
        ]
      );
    } catch (err) {
      let errorMessage = "Kayıt işlemi başarısız oldu.";
      
      if (err.code === 'auth/email-already-in-use') {
        errorMessage = "Bu e-posta adresi zaten kullanımda.";
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = "Geçersiz e-posta adresi.";
      } else if (err.code === 'auth/weak-password') {
        errorMessage = "Şifre çok zayıf.";
      }
      
      Alert.alert("Hata", errorMessage);
    }
  };

  return (
    <ImageBackground
      source={require("../assets/finance-bg.png")}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <Text style={styles.title}>Kayıt Ol</Text>
        <Image
          source={require("../assets/finance-icon.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        <TextInput
          placeholder="Ad Soyad"
          style={styles.input}
          value={adSoyad}
          onChangeText={setAdSoyad}
        />
        <TextInput
          placeholder="E-posta"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <View style={styles.inputWrapper}>
          <TextInput
            placeholder="Şifre"
            secureTextEntry={!showPassword}
            style={styles.inputPassword}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
            <Ionicons
              name={showPassword ? "eye-off" : "eye"}
              size={22}
              color="#2563eb"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.inputWrapper}>
          <TextInput
            placeholder="Şifre (Tekrar)"
            secureTextEntry={!showConfirmPassword}
            style={styles.inputPassword}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
            <Ionicons
              name={showConfirmPassword ? "eye-off" : "eye"}
              size={22}
              color="#2563eb"
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleRegister}>
          <Text style={styles.buttonText}>Kayıt Ol</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("GirisEkrani")}>
          <Text style={styles.link}>Zaten hesabınız var mı? Giriş Yap</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.85)",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    color: "#1e40af",
    marginBottom: 20,
  },
  logo: {
    width: 120,
    height: 120,
    alignSelf: "center",
    marginBottom: 30,
  },
  input: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  inputPassword: {
    flex: 1,
    padding: 15,
  },
  eyeIcon: {
    padding: 10,
  },
  button: {
    backgroundColor: "#2563eb",
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  buttonText: {
    color: "white",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold",
  },
  link: {
    color: "#2563eb",
    textAlign: "center",
    marginTop: 15,
    fontSize: 16,
  },
});