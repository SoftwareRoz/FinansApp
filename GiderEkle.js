import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { collection, addDoc, doc, updateDoc, getDoc } from "firebase/firestore";
import { auth, firestore } from "../services/firebase";
import { useNavigation } from "@react-navigation/native";

export default function GiderEkle() {
  const [expenseAmount, setExpenseAmount] = useState("");
  const [description, setDescription] = useState("");
  const navigation = useNavigation();
  const user = auth.currentUser;

  const handleAddExpense = async () => {
    if (!expenseAmount) {
      Alert.alert("Uyarı", "Lütfen bir miktar girin.");
      return;
    }

    const amount = parseFloat(expenseAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert("Hata", "Geçerli bir pozitif sayı girin.");
      return;
    }

    if (!user) {
      Alert.alert("Hata", "Kullanıcı oturumu bulunamadı. Lütfen giriş yapın.");
      return;
    }

    try {
      // Kullanıcının mevcut verilerini al
      const userDocRef = doc(firestore, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists()) {
        Alert.alert("Hata", "Kullanıcı verileri bulunamadı.");
        return;
      }

      const currentData = userDoc.data();
      const currentExpense = currentData.expense || 0;
      const currentBalance = currentData.totalBalance || 0;

      // Kullanıcının transactions alt koleksiyonuna yeni gider kaydı ekle
      // Eğer transactions koleksiyonu yoksa, Firestore otomatik olarak oluşturur
      await addDoc(collection(firestore, `users/${user.uid}/transactions`), {
        type: "expense",
        amount: amount,
        description: description || "Gider",
        date: new Date().toISOString(),
      });

      // Kullanıcının toplam gider ve bakiye değerlerini güncelle
      await updateDoc(userDocRef, {
        expense: currentExpense + amount,
        totalBalance: currentBalance - amount,
      });

      Alert.alert("Başarılı", "Gider başarıyla eklendi.", [
        {
          text: "Tamam",
          onPress: () => {
            setExpenseAmount("");
            setDescription("");
            navigation.goBack();
          },
        },
      ]);
    } catch (error) {
      console.error("Gider ekleme hatası:", error);
      Alert.alert("Hata", "Gider eklenirken bir sorun oluştu.");
    }
  };

  return (
    <ImageBackground
      source={require("../assets/finance-bg.png")}
      style={styles.background}
      resizeMode="cover"
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Text style={styles.title}>Gider Ekle</Text>

          <View style={styles.card}>
            <Text style={styles.label}>Gider Miktarı (₺)</Text>
            <TextInput
              placeholder="Örn: 200.00"
              style={styles.input}
              value={expenseAmount}
              onChangeText={setExpenseAmount}
              keyboardType="decimal-pad"
            />

            <Text style={styles.label}>Açıklama (İsteğe bağlı)</Text>
            <TextInput
              placeholder="Örn: Market, Fatura"
              style={[styles.input, styles.descriptionInput]}
              value={description}
              onChangeText={setDescription}
              multiline
            />

            <TouchableOpacity style={styles.button} onPress={handleAddExpense}>
              <Text style={styles.buttonText}>Gider Ekle</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.backLink}>Geri Dön</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingBottom: 50,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    color: "#1e40af",
    marginBottom: 30,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 10,
  },
  input: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    fontSize: 16,
  },
  descriptionInput: {
    height: 80,
    textAlignVertical: "top",
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
  backLink: {
    color: "#2563eb",
    textAlign: "center",
    marginTop: 15,
    fontSize: 16,
  },
});