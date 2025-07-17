import { useState, useEffect } from "react";
import { View, Image, Alert } from "react-native";
import { Button, useTheme, Text, ActivityIndicator } from "react-native-paper";
import * as SecureStore from "expo-secure-store";
import { getUsuario } from "../api";

export default function Bienvenida({ navigation }) {
  const { colors } = useTheme();
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsuario = async () => {
      try {
        const usuario = await getUsuario();
        setFullName(`${usuario.first_name} ${usuario.last_name}`);
      } catch (error) {
        console.error(error);
        navigation.navigate("InicioSesion");
        SecureStore.deleteItemAsync("username");
        SecureStore.deleteItemAsync("password");
      } finally {
        setLoading(false);
      }
    };

    fetchUsuario();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 16, gap: 46 }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          gap: 8,
        }}
      >
        <Image
          source={require("../../assets/favicon.png")}
          style={{
            width: 55,
            height: 60,
            alignSelf: "center",
          }}
        />
        <Text style={{ fontSize: 22 }}>TREMECA</Text>
      </View>
      <View>
        <Text style={{ marginBottom: 12, textAlign: "center" }}>
          Bienvenido (a)
        </Text>
        <View style={{ alignItems: "center", marginBottom: 16 }}>
          {fullName ? (
            <Text
              style={{
                fontSize: 22,
                textAlign: "center",
                color: colors.text,
              }}
            >
              {fullName}
            </Text>
          ) : (
            <ActivityIndicator />
          )}
        </View>
      </View>
      <View style={{ justifyContent: "center", gap: 12 }}>
        <Button
          mode="contained"
          icon="pen"
          disabled={loading}
          labelStyle={{ fontSize: 16 }}
          contentStyle={{
            height: 78, 
          }}
          style={{
            backgroundColor: colors.primary,
            width: "90%",
            alignSelf: "center",
            justifyContent: "center",
          }}
          onPress={() => navigation.navigate("Realizar")}
        >
          Realizar lectura
        </Button>
        <Button
          mode="contained"
          icon="comment-alert"
          disabled={loading}
          labelStyle={{ fontSize: 16 }}
          contentStyle={{
            height: 78, // Asegura que el contenido tenga la altura deseada
          }}
          style={{
            backgroundColor: colors.primary,
            width: "90%",
            alignSelf: "center",
            justifyContent: "center",
          }}
          onPress={() => navigation.navigate("Clientes")}
        >
          Solicitar cambio
        </Button>
        <Button
          mode="contained"
          icon="account-edit"
          disabled={loading}
          labelStyle={{ fontSize: 16 }}
          contentStyle={{
            height: 78, // Asegura que el contenido tenga la altura deseada
          }}
          style={{
            backgroundColor: colors.primary,
            width: "90%",
            alignSelf: "center",
            justifyContent: "center",
          }}
          onPress={() => navigation.navigate("EditarPerfil")}
        >
          Editar perfil
        </Button>

        <Button
          mode="contained"
          icon="account"
          disabled={loading}
          labelStyle={{ fontSize: 16 }}
          contentStyle={{
            height: 78, // Asegura que el contenido tenga la altura deseada
          }}
          style={{
            backgroundColor: colors.error,
            width: "90%",
            alignSelf: "center",
            justifyContent: "center",
          }}
          onPress={async () => {
            try {
              // Eliminar las credenciales guardadas en SecureStore
              await SecureStore.deleteItemAsync("username");
              await SecureStore.deleteItemAsync("password");
              await SecureStore.deleteItemAsync("activeUser");

              navigation.replace("InicioSesion"); // Redirige al login
            } catch (error) {
              console.error(error);
              Alert.alert("Error", "No se pudo cerrar sesión.");
            }
          }}
        >
          Cerrar sesión
        </Button>
      </View>
    </View>
  );
}
