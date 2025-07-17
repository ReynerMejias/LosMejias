import React, { useEffect, useState, useCallback } from "react";
import { View, Image, ScrollView, TouchableOpacity } from "react-native";
import {
  Button,
  TextInput,
  Divider,
  Appbar,
  Text,
  useTheme,
  Portal,
  Dialog,
  ActivityIndicator,
  Card,
  Avatar,
  Banner,
} from "react-native-paper";
import { postLectura, getUsuario, getCliente, patchLectura } from "../api";
import { useRoute, useFocusEffect } from "@react-navigation/native";
import { getFecha, getFechaVencimiento } from "../utils/dateUtils";
import { imprimirDocumento } from "../utils/printUtils";
import { takePhoto } from "../utils/imageUtils";

export default function Lectura({ navigation }) {
  const { colors } = useTheme();
  const route = useRoute();
  const { clienteLugarCompletado } = route.params;
  const [cliente, setCliente] = useState(clienteLugarCompletado[0]);
  const lugar = clienteLugarCompletado[1];
  const [clienteUltimaLectura, setClienteUltimaLectura] = useState(0);
  const [clienteUltimaLecturaAnterior, setClienteUltimaLecturaAnterior] =
    useState(0);
  const [loading, setLoading] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [lectura, setLectura] = useState("");
  const [dialogIcon, setDialogIcon] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [visible, setVisible] = useState(false);
  const [image, setImage] = useState(null);
  const [multa, setMulta] = useState("");
  const [multaDetalles, setMultaDetalles] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [completada, setCompletada] = useState(clienteLugarCompletado[2]);
  const [printAfterSave, setPrintAfterSave] = useState(false);
  const AvatarLetter = ({ letter }) => <Avatar.Text size={45} label={letter} />;
  const numeroComprobante =
    cliente.ultima_lectura !== null
      ? `Comprobante #${cliente.ultima_lectura.fecha_lectura.replace(
          /-/g,
          ""
        )}${cliente.ultima_lectura.id} - ${lugar.codigo}`
      : "Comprobante sin lectura anterior";

  useEffect(() => {
    if (lectura !== undefined && lectura !== "") {
      setEnabled(true);
    } else {
      setEnabled(false);
    }

  }, [lectura, multa]);

  useEffect(() => {
    if (cliente.ultima_lectura !== null) {
      setClienteUltimaLectura(cliente.ultima_lectura.lectura);
      setClienteUltimaLecturaAnterior(cliente.ultima_lectura.lectura_anterior);
      setLectura(cliente.ultima_lectura.lectura.toString());
      if (completada && cliente.ultima_lectura.foto !== null) {
        setImage(cliente.ultima_lectura.foto);
      }

      if (cliente.ultima_lectura.moratorio && completada)  {
        setMulta(cliente.ultima_lectura.moratorio.toString());
        setMultaDetalles(cliente.ultima_lectura.observacion || "");
      } else {
        setMulta("0");
        setMultaDetalles("");
      }
    } else {
      // No hay lectura anterior, usar cliente.metros
      setClienteUltimaLectura(cliente.metros);
    }

  }, [cliente]);

  useEffect(() => {
    if (cliente.correo === "" || cliente.correo === null) {
      setShowBanner(true);
    }
  }, [cliente]);

  useFocusEffect(
    useCallback(() => {
      const fetchCliente = async () => {
        try {
          const clienteActualizado = await getCliente(cliente.id);
          if (
            clienteActualizado.correo === "" ||
            clienteActualizado.correo === null
          ) {
            setShowBanner(true);
          } else {
            setShowBanner(false);
          }
        } catch (error) {
          console.error("Error al obtener el cliente:", error);
        }
      };
      fetchCliente();
    }, [cliente.id])
  );

  const handleInputChangeLectura = (text) => {
    // Reemplaza cualquier carácter que no sea un número
    const numericValue = text.replace(/[^0-9]/g, "");
    setLectura(numericValue);
  };

  const handleInputChangeMulta = (text) => {
    // Reemplaza cualquier carácter que no sea un número
    const numericValue = text.replace(/[^0-9]/g, "");
    setMulta(numericValue);
  };

  const handleSave = async () => {
    setEnabled(false);

    const validarLectura = completada ? clienteUltimaLecturaAnterior : clienteUltimaLectura;

    if (parseInt(lectura) < validarLectura) { 
      setDialogIcon("alert");
      setTitle("Hubo un problema");
      setContent(
        completada
          ? "La lectura ingresada no puede ser menor que la anterior ya completada."
          : "La lectura ingresada no puede ser menor que la última lectura registrada."
      );
      setVisible(true);
      setPrintAfterSave(false);
      return;
    } else {
      setLoading(true);

      const formatDate = (date) => {
        const [day, month, year] = date.split("/");
        return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
      };

      const data = new FormData();
      data.append("lectura", lectura);

      if (!completada) {
        data.append("cliente", cliente.id);
        data.append(
          "fecha_lectura",
          formatDate(getFecha(cliente, completada, lugar))
        );
      }

      if (image !== null) {
        data.append("foto", {
          uri: image,
          name: "foto.jpg",
          type: "image/jpg",
        });
      }

      if (multa && multa !== "0") {
        data.append("moratorio", multa);
        data.append("observacion", multaDetalles);
      }


      try {
        if (!completada) {
          await postLectura(data);
        } else {
          await patchLectura(cliente.ultima_lectura.id, data);
        }

        setDialogIcon("check");
        setTitle("¡Listo!");
        setContent("La lectura se guardó correctamente.");
        setVisible(true);
        

        // Actualizar el estado del cliente
        const clienteActualizado = await getCliente(cliente.id);
        setCliente(clienteActualizado);
        setCompletada(true);

        // Si viene desde "Guardar e imprimir", dejamos preparado para imprimir luego
        if (printAfterSave) {
          setPrintAfterSave(false); // lo reiniciamos por si acaso
        }

      } catch (error) {
        setDialogIcon("alert");
        setTitle("Hubo un problema");
        setContent("Ocurrió un error al guardar la lectura." + error);
        setVisible(true);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSolicitud = (cliente) => {
    navigation.navigate("Solicitud", { cliente });
  };

  return (
    <View>
      <ScrollView>
        <Portal>
          <Dialog visible={visible} onDismiss={() => setVisible(false)}>
            <Dialog.Icon icon={dialogIcon} color={colors.error} />
            <Dialog.Title>{title}</Dialog.Title>
            <Dialog.Content>
              <Text>{content}</Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button
                onPress={() => {
                  setVisible(false);
                  if (printAfterSave) {
                    imprimirDocumento(
                      cliente,
                      lugar,
                      numeroComprobante,
                      lectura,
                      clienteUltimaLecturaAnterior,
                      getFecha,
                      getFechaVencimiento,
                      true // siempre será true después de guardar
                    );
                  }
                }}
              >
                OK
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content
            title={
              completada && cliente.ultima_lectura
                ? `${cliente.ultima_lectura.fecha_lectura.replace(/-/g, "")}${
                    cliente.ultima_lectura.id
                  }-${lugar.codigo}`
                : "Crear lectura"
            }
          />
          <Appbar.Action
            icon="comment-alert"
            onPress={() => handleSolicitud(cliente)}
          />
          <Appbar.Action
            icon="printer"
            onPress={() =>
              imprimirDocumento(
                cliente,
                lugar,
                numeroComprobante,
                clienteUltimaLectura,
                clienteUltimaLecturaAnterior,
                getFecha,
                getFechaVencimiento,
                completada
              )
            }
            disabled={!completada}
          />
        </Appbar.Header>
        {showBanner && (
          <Banner
            visible={showBanner}
            actions={[
              {
                label: "Agregar correo",
                onPress: () =>
                  navigation.navigate("Correo", { clienteLugarCompletado }),
              },
              {
                label: "Cerrar",
                onPress: () => setShowBanner(false),
              },
            ]}
            icon="information"
          >
            Este cliente no tiene correo registrado. Imprime el comprobante
            desde el botón arriba a la derecha.
          </Banner>
        )}

        <View
          style={{
            marginBottom: 16,
            padding: 16,
            gap: 16,
          }}
        >
          {loading && <ActivityIndicator />}
          <Card style={{ backgroundColor: colors.surface }} mode="outlined">
            <Card.Title
              title={cliente.nombre}
              subtitle={cliente.lote}
              left={() => <AvatarLetter letter={cliente.nombre[0]} />}
            />
            <Card.Content>
              <Text>Medidor: {cliente.medidor}</Text>
              <Text style={{ marginBottom: 20 }}>Orden: {cliente.orden}</Text>
              <Text>Fecha lectura:{getFecha(cliente, completada, lugar)}</Text>

              <Text>
                Fecha vencimiento:
                {getFechaVencimiento(cliente, completada, lugar)}
              </Text>
            </Card.Content>
          </Card>
          <Text style={{ fontSize: 16 }}>1. Lectura</Text>
          <View style={{ gap: 4 }}>
            <TextInput
              mode="outlined"
              placeholder="Lectura"
              value={lectura}
              onChangeText={handleInputChangeLectura}
              keyboardType="numeric"
              inputMode="numeric"
              maxLength={6}
            />
            <Text style={{ fontSize: 14, color: colors.accent, fontStyle: "italic" }}>
              {completada
                ? `Lectura anterior: ${clienteUltimaLecturaAnterior}`
                : `Lectura anterior: ${clienteUltimaLectura}`
              }
            </Text>
          </View>

          <Text style={{ fontSize: 16 }}>
            2. Fotografía de la lectura (Opcional)
          </Text>
          {image ? (
            <TouchableOpacity
              onPress={async () => {
                const photoUri = await takePhoto();
                if (photoUri) {
                  setImage(photoUri);
                }
              }}
            >
              <View style={{ position: "relative" }}>
                <Image
                  source={{ uri: image }}
                  style={{
                    width: "100%",
                    height: 200,
                    borderRadius: 8,
                    borderColor: colors.accent,
                    borderWidth: 1,
                    opacity: 0.8,
                  }}
                />
                <Text
                  style={{
                    position: "absolute",
                    top: "40%",
                    alignSelf: "center",
                    color: colors.accent,
                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                    padding: 10,
                    borderRadius: 10,
                  }}
                >
                  Cambiar fotografía
                </Text>
              </View>
            </TouchableOpacity>
          ) : (
            <Button
              mode="outlined"
              contentStyle={{ height: 200 }}
              icon={"camera"}
              textColor={colors.text}
              style={{
                width: "100%",
              }}
              onPress={async () => {
                const photoUri = await takePhoto();
                if (photoUri) {
                  setImage(photoUri);
                }
              }}
            >
              Tomar fotografía
            </Button>
          )}

          <Text style={{ fontSize: 16 }}>
            3. Multa (opcional)
          </Text>
          <TextInput
            mode="outlined"
            placeholder="Monto de la multa"
            value={multa}
            onChangeText={handleInputChangeMulta}
            keyboardType="numeric"
            inputMode="numeric"
            maxLength={10}
          />
          <TextInput
            mode="outlined"
            placeholder="Detalles de la multa (opcional)"
            value={multaDetalles}
            onChangeText={setMultaDetalles}
            multiline
            numberOfLines={3}
            style={{ marginTop: 8, height: 80 }}
          />

          
          {completada && (
              <View style={{ padding: 10, backgroundColor: colors.surface, borderRadius: 12, borderColor: colors.accent, borderWidth: 1, borderStyle: 'dashed'}}>
                <Text style={{ fontSize: 14, fontWeight: "600", marginBottom: 4 }}>
                  Detalles de consumo:
                </Text>

                <Divider style={{ marginBottom: 8 , backgroundColor: colors.accent }} /> 

                <Text style={{ fontSize: 13, marginBottom: 2 }}>
                  💧 Costo por metro cúbico: <Text style={{ fontWeight: "500" }}>₡{lugar.valor}</Text>
                </Text>

                <Text style={{ fontSize: 13, marginBottom: 2 }}>
                  📏 Metros consumidos:{" "}
                  <Text style={{ fontWeight: "500" }}>
                    {clienteUltimaLectura > clienteUltimaLecturaAnterior
                      ? clienteUltimaLectura - clienteUltimaLecturaAnterior
                      : 0}
                  </Text>
                </Text>

                <Text style={{ fontSize: 13, marginTop: 4 }}>
                  💰 Total a pagar:{" "}
                  <Text style={{ fontWeight: "bold", color: colors.white }}>
                    ₡
                    {clienteUltimaLectura > clienteUltimaLecturaAnterior
                      ? (clienteUltimaLectura - clienteUltimaLecturaAnterior) * lugar.valor + parseInt(multa, 10)
                      : 0 + parseInt(multa, 10)}  
                  </Text>
                </Text>
              </View>
          )}

          <View
            style={{
              flexDirection: "row",
              gap: 8,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Button
              mode="contained"
              contentStyle={{ height: 58 }}
              icon={!completada ? "content-save" : "content-save-edit"}
              style={{
                backgroundColor: colors.primary,
                width: `${completada ? "100%" : "50%"}`,
                alignSelf: "center",
              }}
              onPress={handleSave}
              disabled={!enabled}
            >
              {!completada ? "Guardar" : "Editar lectura"}
            </Button>

            {!completada && (
              <Button
                mode="contained"
                contentStyle={{ height: 58 }}
                icon={!completada ? "content-save" : "content-save-edit"}
                style={{
                  backgroundColor: colors.primary,
                  width: "50%",
                  alignSelf: "center",
                }}
                onPress={async () => {
                  setPrintAfterSave(true);
                  await handleSave();
                }}
                disabled={!enabled}
              >
                {!completada ? "Guardar e imprimir" : "Editar"}
              </Button>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
