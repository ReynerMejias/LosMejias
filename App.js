import * as React from "react";
import {
  MD3DarkTheme as DefaultTheme,
  PaperProvider,
} from "react-native-paper";

import { SafeAreaView, StatusBar } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

// Importar pantallas
import InicioSesion from "./src/screens/InicioSesion";
import Clientes from "./src/screens/Clientes";
import Lectura from "./src/screens/Lectura";
import Lecturas from "./src/screens/Lecturas";
import Realizar from "./src/screens/Realizar";
import EditarPerfil from "./src/screens/EditarPerfil";
import Solicitud from "./src/screens/Solicitud";
import Bienvenida from "./src/screens/Bienvenida";
import Correo from "./src/screens/Correo";

// Personaliza tu esquema de colores oscuro
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

// Crear el navegador stack
const Stack = createStackNavigator();

export default function Main() {
  return (
    <PaperProvider theme={theme}>
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
      >
        <StatusBar barStyle="light-content" />
        <NavigationContainer theme={theme}>
          <Stack.Navigator
            initialRouteName="InicioSesion"
            screenOptions={{
              headerShown: false, // Oculta encabezados si no los necesitas
            }}
          >
            <Stack.Screen name="Bienvenida" component={Bienvenida} />
            <Stack.Screen name="InicioSesion" component={InicioSesion} />
            <Stack.Screen name="Solicitud" component={Solicitud} />
            <Stack.Screen name="EditarPerfil" component={EditarPerfil} />
            <Stack.Screen name="Realizar" component={Realizar} />
            <Stack.Screen name="Lecturas" component={Lecturas} />
            <Stack.Screen name="Lectura" component={Lectura} />
            <Stack.Screen name="Clientes" component={Clientes} />
            <Stack.Screen name="Correo" component={Correo} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaView>
    </PaperProvider>
  );
}
