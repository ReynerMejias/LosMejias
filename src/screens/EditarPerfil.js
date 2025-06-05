import React, { useState, useEffect } from "react";
import { View, ScrollView, Alert } from "react-native";
import {
  Button,
  TextInput,
  Menu,
  Divider,
  Appbar,
  Text,
  useTheme,
  ActivityIndicator,
} from "react-native-paper";
import { patchUsuario } from "../api";
import * as SecureStore from "expo-secure-store";

export default function EditarPerfi({ navigation }) {
  const { colors } = useTheme("");
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [loading, setLoading] = useState(false);
  const [id, setId] = useState("");

  useEffect(() => {
    const getActiveUser = async () => {
      try {
        let activeUser = await SecureStore.getItemAsync("activeUser");
        activeUser = JSON.parse(activeUser);
        setId(activeUser?.id);
        setUsername(activeUser?.username);
        setFirstName(activeUser?.first_name);
        setLastName(activeUser?.last_name);
        setEmail(activeUser?.email);
      } catch (error) {
        navigation.navigate("InicioSesion");
        console.error(error);
      }
    };

    getActiveUser();
  }, []);

  const handleSave = async () => {
    if (!username || !firstName || !lastName || !email) {
      Alert.alert("Error", "Por favor completa todos los campos.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden.");
      return;
    }

    try {
      setLoading(true);
      let data = {
        username,
        first_name: firstName,
        last_name: lastName,
        email,
      };

      if (password) {
        data.password = password;
      }

      await patchUsuario(id, data);
      Alert.alert("Éxito", "Usuario actualizado correctamente.");
      SecureStore.deleteItemAsync("activeUser");
      SecureStore.deleteItemAsync("username");
      SecureStore.deleteItemAsync("password");
      navigation.navigate("InicioSesion");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudo actualizar el usuario.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={loading ? "Cargando..." : "Editar Perfil"} />
      </Appbar.Header>
      <View
        style={{
          gap: 16,
          padding: 16,
        }}
      >
        <Text style={{ fontSize: 16 }}>1. Nombre de Usuario</Text>
        <TextInput
          mode="outlined"
          placeholder="Usuario"
          value={username}
          onChangeText={(text) => setUsername(text)}
        />

        <Text style={{ fontSize: 16 }}>2. Nombre</Text>
        <TextInput
          mode="outlined"
          placeholder="Nombre"
          value={firstName}
          onChangeText={(text) => setFirstName(text)}
        />

        <Text style={{ fontSize: 16 }}>3. Apellido</Text>
        <TextInput
          mode="outlined"
          placeholder="Apellido"
          value={lastName}
          onChangeText={(text) => setLastName(text)}
        />

        <Text style={{ fontSize: 16 }}>4. Correo Electrónico</Text>
        <TextInput
          mode="outlined"
          placeholder="Correo"
          value={email}
          onChangeText={(text) => setEmail(text)}
        />

        <Text style={{ fontSize: 16 }}>5. Contraseña</Text>
        <TextInput
          mode="outlined"
          placeholder="Contraseña"
          value={password}
          onChangeText={(text) => setPassword(text)}
          secureTextEntry={secureTextEntry}
          right={
            <TextInput.Icon
              icon={secureTextEntry ? "eye" : "eye-off"}
              onPress={() => setSecureTextEntry(!secureTextEntry)}
            />
          }
        />

        <Text style={{ fontSize: 16 }}>6. Confirmar Contraseña</Text>
        <TextInput
          mode="outlined"
          placeholder="Confirmar Contraseña"
          value={confirmPassword}
          onChangeText={(text) => setConfirmPassword(text)}
          secureTextEntry={secureTextEntry}
          right={
            <TextInput.Icon
              icon={secureTextEntry ? "eye" : "eye-off"}
              onPress={() => setSecureTextEntry(!secureTextEntry)}
            />
          }
        />
        <Divider />
        <Text style={{ fontSize: 12, textAlign: "center" }}>
          Si no deseas cambiar la contraseña, deja los campos en blanco.
        </Text>

        <Button
          mode="contained"
          icon="content-save"
          contentStyle={{ height: 50 }}
          loading={loading}
          style={{
            backgroundColor: colors.primary,
            width: "100%",
            alignSelf: "center",
          }}
          onPress={handleSave}
        >
          Guardar
        </Button>
      </View>
    </ScrollView>
  );
}
