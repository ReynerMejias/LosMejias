import React, { useState, useEffect } from "react";
import { View } from "react-native";
import {
  Button,
  TextInput,
  Appbar,
  Text,
  useTheme,
  Card,
  Avatar,
  Portal,
  Dialog,
} from "react-native-paper";
import DropDownPicker from "react-native-dropdown-picker";
import { postSolicitud, getUsuario } from "../api";
import { useRoute } from "@react-navigation/native";

export default function Solicitud({ navigation }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(null);
  const { colors } = useTheme();
  const [clientes, setClientes] = useState([]);
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const route = useRoute();
  const { cliente } = route.params;
  const AvatarLetter = ({ letter }) => <Avatar.Text size={45} label={letter} />;
  const [visible, setVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [dialogIcon, setDialogIcon] = useState("");

  const handleSolicitud = async () => {
    if (!titulo) {
      setTitle("Error");
      setContent("Debes ingresar un título");
      setDialogIcon("alert-circle");
      setVisible(true);
      return;
    }
    if (!descripcion) {
      setTitle("Error");
      setContent("Debes ingresar una descripción");
      setDialogIcon("alert-circle");
      setVisible(true);
      return;
    }
    try {
      const data = new FormData();
      data.append("cliente", cliente.id);
      data.append("titulo", titulo);
      data.append("descripcion", descripcion);
      data.append("usuario", (await getUsuario()).id);
      await postSolicitud(data);

      setTitle("Solicitud enviada");
      setContent("Tu solicitud ha sido enviada correctamente");
      setDialogIcon("check-circle");
      setVisible(true);

      // ⏳ Esperar 2 segundos antes de regresar a la pantalla anterior
      setTimeout(() => {
        setVisible(false);
        navigation.goBack();
      }, 2000);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Portal>
        <Dialog visible={visible} onDismiss={() => setVisible(false)}>
          <Dialog.Icon icon={dialogIcon} color={colors.error} />
          <Dialog.Title>{title}</Dialog.Title>
          <Dialog.Content>
            <Text>{content}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setVisible(false)}>OK</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={"Solicitar cambio"} />
      </Appbar.Header>
      <View
        style={{
          marginBottom: 16,
          padding: 16,
          gap: 16,
        }}
      >
        <Card style={{ backgroundColor: colors.surface }} mode="outlined">
          <Card.Title
            title={cliente.nombre}
            subtitle={cliente.lote}
            left={() => <AvatarLetter letter={cliente.nombre[0]} />}
          />
          <Card.Content>
            <Text>Medidor: {cliente.medidor}</Text>
            <Text>Orden: {cliente.orden}</Text>
          </Card.Content>
        </Card>

        <Text style={{ fontSize: 16 }}>1. Título del cambio solicitado</Text>
        <TextInput
          mode="outlined"
          placeholder="Título"
          onChangeText={setTitulo}
        />

        <Text style={{ fontSize: 16 }}>
          2. Descripción del cambio solicitado
        </Text>
        <TextInput
          multiline
          numberOfLines={4}
          mode="outlined"
          style={{ height: 250 }}
          placeholder="Descripción"
          onChangeText={setDescripcion}
        />
        {!cliente && (
          <>
            <Text style={{ fontSize: 16 }}>3. Selección de opción</Text>
            <DropDownPicker
              open={open}
              value={value}
              items={clientes}
              setOpen={setOpen}
              setValue={setValue}
              setItems={setClientes}
              placeholder="Selecciona una opción"
              textStyle={{ color: colors.text }}
              style={{
                borderColor: "gray",
                borderRadius: 4,
                backgroundColor: colors.surface,
              }}
              dropDownContainerStyle={{
                borderColor: "gray",
                backgroundColor: colors.surface,
              }}
            />
          </>
        )}

        <Button
          mode="contained"
          icon="send"
          contentStyle={{ height: 48 }}
          style={{
            width: "100%",
            alignSelf: "center",
          }}
          onPress={() => handleSolicitud()}
        >
          Enviar solicitud
        </Button>
      </View>
    </View>
  );
}
