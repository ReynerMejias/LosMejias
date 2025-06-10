import React, { useState, useEffect } from "react";
import { View, Image, Alert, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import {
  Button,
  TextInput,
  useTheme,
  Text,
  Dialog,
  Portal,
  ActivityIndicator,
} from "react-native-paper";
import { loginUser } from "../api";
import * as SecureStore from "expo-secure-store";

export default function InicioSesion({ navigation }) {
  const { colors } = useTheme();
  const [visible, setVisible] = React.useState(false);
  const hideDialog = () => setVisible(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [secure, setSecure] = useState(true);

  useEffect(() => {
    const checkCredentials = async () => {
      try {
        const username = await SecureStore.getItemAsync("username");
        const password = await SecureStore.getItemAsync("password");
        if (username && password) {
          navigation.replace("Bienvenida");
        }
      } catch (error) {
        console.log("Error al verificar las credenciales:", error);
      }
    };
    checkCredentials();
  }, []);

  const handleLogin = async () => {
    if (!username || !password) {
      setTitle("Error");
      setMessage("Debe ingresar un usuario y contraseña");
      setVisible(true);
      return;
    }

    setLoading(true);

    try {
      await SecureStore.deleteItemAsync("activeUser");
      const success = await loginUser(username, password);

      if (success) {
        navigation.replace("Bienvenida");
      } else {
        setTitle("Error");
        setMessage("Usuario o contraseña incorrectos");
        setVisible(true);
      }
    } catch (error) {
      setTitle("Error");
      setMessage("Hubo un problema con la conexión. Intenta nuevamente.");
      setVisible(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Portal>
        <Dialog visible={visible} onDismiss={hideDialog}>
          <Dialog.Title>{title}</Dialog.Title>
          <Dialog.Content>
            <Text>{message}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={hideDialog}>Ok</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Image
        source={require("../../assets/favicon.png")}
        style={styles.logo}
      />

      <Text style={styles.title}>INICIAR SESIÓN</Text>

      <TextInput
        label="Usuario"
        mode="outlined"
        value={username}
        onChangeText={setUsername}
        style={styles.input}
        placeholderTextColor="#ccc"
      />

      <TextInput
        label="Contraseña"
        mode="outlined"
        secureTextEntry={secure}
        value={password}
        onChangeText={setPassword}
        style={styles.input}
        placeholderTextColor="#ccc"
        right={
          <TextInput.Icon
            icon={secure ? "eye" : "eye-off"}
            onPress={() => setSecure(!secure)}
          />
        }
      />

      {loading ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      ) : (
        <Button
          mode="contained"
          style={styles.button}
          onPress={handleLogin}
        >
          Continuar
        </Button>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  logo: {
    width: 60,
    height: 60,
    alignSelf: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    color: "#fff",
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    marginBottom: 16,
    backgroundColor: "#1f1f1f",
  },
  button: {
    marginTop: 16,
    alignSelf: "center",
    width: "100%",
  },
  loader: {
    marginTop: 16,
  },
});
