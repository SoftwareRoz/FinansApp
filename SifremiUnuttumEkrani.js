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
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../services/firebase";
import { useNavigation } from "@react-navigation/native";

export default function SifremiUnuttumEkrani() {
  const [email, setEmail] = useState("");
  const navigation = useNavigation();

  const handleReset = async () => {
    if (!email) return Alert.alert("Uyarı", "Lütfen e-posta adresinizi girin");
    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert("Başarılı", "Şifre sıfırlama bağlantısı gönderildi");
      navigation.goBack();
    } catch (err) {
      Alert.alert("Hata", err.message);
    }
  };

  return (
    <ImageBackground
      source={require("../assets/finance-bg.png")}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <Text style={styles.title}>Şifre Sıfırlama</Text>
        <Image
          source={require("../assets/finance-icon.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        <TextInput
          placeholder="E-posta adresiniz"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
        />

        <TouchableOpacity style={styles.button} onPress={handleReset}>
          <Text style={styles.buttonText}>Gönder</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.link}>Geri Dön</Text>
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
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
    color: "#2563eb",
  },
  logo: {
    width: 100,
    height: 100,
    alignSelf: "center",
    marginBottom: 30,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
    backgroundColor: "#fff",
  },
  button: {
    backgroundColor: "#2563eb",
    padding: 15,
    borderRadius: 10,
  },
  buttonText: { color: "#fff", textAlign: "center", fontWeight: "bold" },
  link: { marginTop: 15, color: "#2563eb", textAlign: "center" },
});
