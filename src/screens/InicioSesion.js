import React, { useState, useEffect } from "react";
import { View, Image, Alert } from "react-native";
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

  // Verifica si las credenciales están guardadas
  useEffect(() => {
    const checkCredentials = async () => {
      try {
        const username = await SecureStore.getItemAsync("username");
        const password = await SecureStore.getItemAsync("password");
        if (username && password) {
          // Si las credenciales están guardadas, navegar automáticamente
          navigation.replace("Bienvenida");
        }
      } catch (error) {
        console.log("Error al verificar las credenciales:", error);
      }
    };
    checkCredentials();
  }, []);

  const handleLogin = async () => {
    // Validación de que los campos no estén vacíos
    if (!username || !password) {
      setTitle("Error");
      setMessage("Debe ingresar un usuario y contraseña");
      setVisible(true);
      return;
    }

    setLoading(true);

    try {
      // Llamada a la función de login
      await SecureStore.deleteItemAsync("activeUser");
      const success = await loginUser(username, password);

      if (success) {
        // Si el login es exitoso, navega a la pantalla "Bienvenida"
        navigation.replace("Bienvenida");
      } else {
        // Si el login falla (usuario o contraseña incorrectos)
        setTitle("Error");
        setMessage("Usuario o contraseña incorrectos");
        setVisible(true);
      }
    } catch (error) {
      // En caso de error en el proceso de login (como problemas de red o servidor)
      setTitle("Error");
      setMessage("Hubo un problema con la conexión. Intenta nuevamente.");
      setVisible(true);
    } finally {
      // Siempre termina el estado de carga
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 16 }}>
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
        style={{
          marginBottom: 16,
          width: 55,
          height: 60,
          alignSelf: "center",
        }}
      />
      <Text style={{ marginBottom: 16, fontSize: 22, textAlign: "center" }}>
        INICIAR SESIÓN
      </Text>
      <TextInput
        label="Usuario"
        mode="outlined"
        style={{ marginBottom: 16 }}
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        label="Contraseña"
        mode="outlined"
        value={password}
        secureTextEntry={secure}
        onChangeText={setPassword}
        right={
          <TextInput.Icon
            icon={secure ? "eye" : "eye-off"}
            onPress={() => setSecure(!secure)}
          />
        }
      />
      {loading ? (
        <ActivityIndicator style={{ marginTop: 16 }} color={colors.primary} />
      ) : (
        <Button
          mode="contained"
          style={{
            backgroundColor: colors.primary,
            width: "80%",
            alignSelf: "center",
            marginTop: 16,
          }}
          onPress={handleLogin}
        >
          Continuar
        </Button>
      )}
    </View>
  );
}
