// src/screens/ImpresoraBT.js
import React, { useEffect, useState } from "react";
import { View, ScrollView, FlatList } from "react-native";
import {
  Appbar, Button, List, Text, Snackbar, Divider, TextInput, IconButton,
} from "react-native-paper";
import {
  scanDevices, connectBT, getSavedBT, saveBT,
  getWidthDots, setWidthDots,
  printHelloZPL, printBlackBarFullWidthZPL, printTicketZPL, printZplSimple, printZplConfig, printZplSafeWidth,
  ensureBtReady,
} from "../utils/zplPrinter";

const s = (v) => (v == null ? "" : String(v));

// normaliza listado para FlatList
function normalize(res) {
  const out = [];
  const seen = new Set();
  const pushList = (arr = []) => {
    arr.forEach((dev, i) => {
      const raw = dev?.device || dev;
      const addr =
        s(raw?.address) || s(raw?.deviceAddress) || s(raw?.macAddress) || s(raw?.id) || s(raw?.address) || "";
      const name = s(raw?.name) || s(raw?.deviceName) || "Desconocida";
      const key = addr || `${name}:${i}`;
      if (seen.has(key)) return; seen.add(key);
      out.push({ address: addr || null, name });
    });
  };
  pushList(res?.paired); pushList(res?.found);
  return out;
}

export default function ImpresoraBT({ navigation }) {
  const [list, setList] = useState([]);
  const [selectedAddr, setSelectedAddr] = useState(null);
  const [snack, setSnack] = useState("");
  const [loading, setLoading] = useState(false);
  const [manual, setManual] = useState("");
  const [pwDots, setPwDotsState] = useState("576");

  const refresh = async () => {
    setLoading(true);
    try {
      await ensureBtReady();
      const res = await scanDevices();
      setList(normalize(res));
      const saved = await getSavedBT();
      setSelectedAddr(saved);
      const pw = await getWidthDots();
      setPwDotsState(String(pw));
    } catch (e) {
      setSnack(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const select = async (addr) => {
    try {
      setLoading(true);
      if (!addr) throw new Error("El dispositivo no reporta dirección MAC.");
      await connectBT(addr);
      setSelectedAddr(addr);
      setSnack(`Conectado: ${addr}`);
    } catch (e) {
      console.log("BT connect error:", e);
      setSnack(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  };

  const useManual = async () => {
    const a = manual.trim();
    if (!a) { setSnack("Escribe una dirección/MAC válida"); return; }
    await select(a);
  };

  const applyPW = async () => {
    try {
      const n = await setWidthDots(pwDots);
      setPwDotsState(String(n));
      setSnack(`Ancho ZPL (PW): ${n} dots`);
    } catch (e) {
      setSnack(String(e?.message || e));
    }
  };

  const mustConnect = async () => {
    if (!selectedAddr) throw new Error("Selecciona una impresora primero.");
    await ensureBtReady();
    await connectBT(selectedAddr);
  };

  // ---- Tests ----
  const testHello = async () => {
    try {
      setLoading(true);
      await mustConnect();
      await printHelloZPL({ address: selectedAddr });
      setSnack("HELLO ZPL enviado.");
    } catch (e) { setSnack(String(e?.message || e)); }
    finally { setLoading(false); }
  };

  const testBar = async () => {
    try {
      setLoading(true);
      await mustConnect();
      await printBlackBarFullWidthZPL({ address: selectedAddr, height: 48 });
      setSnack("Barra negra enviada.");
    } catch (e) { setSnack(String(e?.message || e)); }
    finally { setLoading(false); }
  };

  const testTicket = async () => {
    try {
      setLoading(true);
      await mustConnect();
      await printTicketZPL({}, selectedAddr);
      setSnack("Ticket ZPL enviado.");
    } catch (e) { setSnack(String(e?.message || e)); }
    finally { setLoading(false); }
  };

  return (
    <>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Impresora BT (ZPL2)" />
        <Appbar.Action icon="refresh" onPress={refresh} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text variant="titleMedium">Seleccionada</Text>
        <Text style={{ opacity: 0.8, marginTop: 4 }}>{selectedAddr || "Ninguna"}</Text>

        <Divider style={{ marginVertical: 12 }} />

        <Text variant="titleMedium">Dispositivos</Text>
        <FlatList
          data={list}
          keyExtractor={(it, idx) =>
            it.address ? `addr:${it.address}` : `name:${it.name}:${idx}`
          }
          scrollEnabled={false}
          renderItem={({ item }) => {
            const selected = !!selectedAddr && item.address === selectedAddr;
            return (
              <List.Item
                title={`${item.name}`}
                description={item.address || "(sin dirección)"}
                right={() => (selected ? <List.Icon icon="check" /> : null)}
                onPress={() => item.address && select(item.address)}
              />
            );
          }}
          ListEmptyComponent={<List.Item title={loading ? "Buscando..." : "Sin dispositivos"} />}
        />

        <View style={{ marginTop: 8, flexDirection: "row", alignItems: "center", gap: 8 }}>
          <TextInput
            mode="outlined"
            style={{ flex: 1 }}
            placeholder="Dirección/MAC manual (AA:BB:CC:DD:EE:FF)"
            value={manual}
            onChangeText={setManual}
          />
          <IconButton icon="check" mode="contained" onPress={useManual} disabled={!manual.trim()} />
        </View>

        <Divider style={{ marginVertical: 12 }} />

        <Text variant="titleMedium">Ancho de impresión (dots)</Text>
        <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
          <TextInput
            mode="outlined"
            style={{ flex: 1 }}
            keyboardType="numeric"
            value={pwDots}
            onChangeText={(t) => setPwDotsState(t.replace(/[^\d]/g, ""))}
            placeholder="576 para 80mm @203dpi"
          />
          <Button mode="outlined" onPress={applyPW}>Aplicar</Button>
        </View>
        <Text style={{ opacity: 0.7, marginTop: 4 }}>
          203 dpi: 80 mm ≈ 576 dots. Si tu ancho real es menor, baja un poco (560/544).
        </Text>

        <Divider style={{ marginVertical: 12 }} />

        <Text variant="titleMedium">Pruebas</Text>
        <View style={{ gap: 8, marginTop: 8 }}>
          <Button mode="contained" onPress={testHello} disabled={!selectedAddr || loading}>
            HELLO (ZPL)
          </Button>
          <Button mode="outlined" onPress={testBar} disabled={!selectedAddr || loading}>
            Barra negra ancho completo
          </Button>
          <Button mode="outlined" onPress={testTicket} disabled={!selectedAddr || loading}>
            Ticket ZPL demo
          </Button>
        </View>

        <View style={{ height: 16 }} />
      </ScrollView>

      <Snackbar visible={!!snack} onDismiss={() => setSnack("")} duration={3300}>
        {snack}
      </Snackbar>
    </>
  );
}
