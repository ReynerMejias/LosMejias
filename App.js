import * as React from "react";
import {
  MD3DarkTheme as DefaultTheme,
  PaperProvider, Text as PaperText
} from "react-native-paper";
import "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { useEffect } from "react";

// Importar pantallas
import InicioSesion from "./src/screens/InicioSesion";
import Lectura from "./src/screens/Lectura";
import Lecturas from "./src/screens/Lecturas";
import Realizar from "./src/screens/Realizar";
import EditarPerfil from "./src/screens/EditarPerfil";
import Solicitud from "./src/screens/Solicitud";
import Bienvenida from "./src/screens/Bienvenida";
import Correo from "./src/screens/Correo";
import Impresora from "./src/screens/ImpresoraBT";

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: "#65558F",
    onPrimary: "#ffffff",
    secondary: "rgba(127, 128, 177, 0.54)",
    accent: "#03dac6",
    background: "#121212",
    surface: "#1f1f1f",
    text: "#ffffff",
    error: "#cf6679",
    onSurface: "#e0e0e0",
  },
};

const Stack = createStackNavigator();

export default function App() {
  const isHermes = !!global.HermesInternal;

  useEffect(() => {
    console.log("APP MOUNT — Hermes?", isHermes);  // [4] fuerza un log al montar
  }, [isHermes]);

  return (
    <PaperProvider theme={theme}>
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" />
        <NavigationContainer theme={theme}>
          <Stack.Navigator
            initialRouteName="InicioSesion"
            screenOptions={{
              headerShown: false,
            }}
          >
            <Stack.Screen name="InicioSesion" component={InicioSesion} />
            <Stack.Screen name="Bienvenida" component={Bienvenida} />
            <Stack.Screen name="Solicitud" component={Solicitud} />
            <Stack.Screen name="EditarPerfil" component={EditarPerfil} />
            <Stack.Screen name="Realizar" component={Realizar} />
            <Stack.Screen name="Lecturas" component={Lecturas} />
            <Stack.Screen name="Lectura" component={Lectura} />
            <Stack.Screen name="Correo" component={Correo} />
            <Stack.Screen name="Impresora" component={Impresora} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </PaperProvider>
  );
}