import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState, useCallback, useEffect, useMemo } from "react";
import { View, TouchableWithoutFeedback, Text } from "react-native";
import {
  Appbar,
  Card,
  Avatar,
  useTheme,
  ActivityIndicator,
  Searchbar,
} from "react-native-paper";
import { useFocusEffect, useRoute } from "@react-navigation/native";
import { getClientesPaged } from "../api";
import { FlatList } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Clientes({ navigation }) {
  const insets = useSafeAreaInsets();
  const FOOTER_SPACE = 140;
  const { colors } = useTheme();
  const AvatarLetter = ({ letter }) => <Avatar.Text size={45} label={letter} />;
  const AvatarCheck = (p) => <Avatar.Icon {...p} size={45} icon="check" />;

  const {
    params: { lugar },
  } = useRoute();

  // estado para paginación
  const [items, setItems] = useState([]); // resultados acumulados (deduplicados)
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // lock para onEndReached (evita triggers dobles)
  const [endReachedLock, setEndReachedLock] = useState(false);

  // preferencias y búsqueda (solo cliente)
  const [mostrarCompletados, setMostrarCompletados] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      const pref = await AsyncStorage.getItem("mostrarCompletados");
      if (pref !== null) setMostrarCompletados(pref === "true");
    })();
  }, []);

  const toggleMostrarCompletados = async () => {
    const v = !mostrarCompletados;
    setMostrarCompletados(v);
    await AsyncStorage.setItem("mostrarCompletados", String(v));
  };

  // helpers
  const isCompletada = useCallback((c) => {
    const f = c?.ultima_lectura?.fecha_lectura; // "YYYY-MM-DD"
    if (!f) return false;
    const [y, m] = f.split("-").map(Number);
    const now = new Date();
    return y === now.getFullYear() && m === now.getMonth() + 1;
  }, []);

  // ---- Deduplicación y claves robustas ----
  const makeKey = (c) =>
    (c?.id != null ? String(c.id) : null) ||
    [c?.medidor, c?.lote, c?.nombre].filter(Boolean).join("|");

  const dedupeByKey = (arr) => {
    const map = new Map();
    for (const x of arr || []) {
      const k = makeKey(x);
      if (!k) continue;
      map.set(k, x); // el último reemplaza si hay duplicado
    }
    return Array.from(map.values());
  };
  // -----------------------------------------

  // reset + primera página (SIN search al server)
  const resetAndFetch = useCallback(async () => {
    setLoading(true);
    setPage(1);
    try {
      const resp = await getClientesPaged(lugar.nombre, { page: 1 });
      setItems(dedupeByKey(resp.results || []));
      setHasNext(Boolean(resp.next));
    } catch (e) {
      console.error(e);
      setItems([]);
      setHasNext(false);
    } finally {
      setLoading(false);
    }
  }, [lugar.nombre]);

  useFocusEffect(
    useCallback(() => {
      resetAndFetch();
    }, [resetAndFetch])
  );

  // siguiente página (SIN search al server) + dedupe
  const loadMore = async () => {
    if (!hasNext || loading || loadingMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const resp = await getClientesPaged(lugar.nombre, { page: nextPage });
      setItems((prev) => dedupeByKey([...prev, ...(resp.results || [])]));
      setPage(nextPage);
      setHasNext(Boolean(resp.next));
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMore(false);
    }
  };

  // normalizador para búsqueda local (ignora tildes y mayúsculas)
  const norm = (s) =>
    (s ?? "")
      .toString()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

  // filtra por nombre o lote en el cliente
  const filteredBySearch = useMemo(() => {
    const q = norm(search.trim());
    if (!q) return items;
    return items.filter((c) => {
      const n = norm(c?.nombre);
      const l = norm(c?.lote);
      return n.includes(q) || l.includes(q);
    });
  }, [items, search]);

  // aplicar filtro de "completados"
  const visibleItems = useMemo(
    () =>
      mostrarCompletados
        ? filteredBySearch
        : filteredBySearch.filter((c) => !isCompletada(c)),
    [filteredBySearch, mostrarCompletados, isCompletada]
  );

  // cuántas filas mínimas quieres ver sin scroll para que no parezca vacío
  const MIN_ROWS = 12;

  // autollenado si estás viendo "pendientes" y todavía hay páginas
  const isAutoFilling = useMemo(() => {
    return (
      !mostrarCompletados &&
      search.trim() === "" && // evita autollenar cuando estás buscando
      visibleItems.length < MIN_ROWS &&
      !loading &&
      (hasNext || loadingMore)
    );
  }, [
    mostrarCompletados,
    search,
    visibleItems.length,
    loading,
    hasNext,
    loadingMore,
  ]);

  // cada vez que cambie el filtro, intenta cargar más si corresponde
  useEffect(() => {
    if (
      !mostrarCompletados &&
      visibleItems.length < MIN_ROWS &&
      hasNext &&
      !loading &&
      !loadingMore
    ) {
      loadMore(); // se re-ejecutará mientras lleguen páginas y sigas corto
    }
  }, [
    mostrarCompletados,
    visibleItems.length,
    hasNext,
    loading,
    loadingMore,
  ]);

  const handlePress = (cliente) => {
    navigation.navigate("Lectura", {
      clienteLugarCompletado: [cliente, lugar, isCompletada(cliente)],
    });
  };

  const renderItem = ({ item }) => {
    const done = isCompletada(item);
    return (
      <TouchableWithoutFeedback onPress={() => handlePress(item)}>
        <Card
          style={{
            backgroundColor: colors.surface,
            borderWidth: done ? 2 : 0,
            borderColor: done ? colors.primary : "transparent",
            marginBottom: 10,
          }}
        >
          <Card.Title
            title={`${item.nombre} "${item.lote}"`}
            subtitle={
              item.ultima_lectura
                ? `Medidor: ${item.medidor} (últ.: ${item.ultima_lectura.lectura})`
                : `Medidor: ${item.medidor} (últ.: ${item.metros})`
            }
            left={() =>
              done ? (
                <AvatarCheck />
              ) : (
                <AvatarLetter letter={item.nombre?.[0] || "?"} />
              )
            }
          />
          {done && (
            <Card.Content>
              <Text
                style={{
                  color: colors.primary,
                  fontStyle: "italic",
                  textAlign: "right",
                }}
              >
                Completado
              </Text>
            </Card.Content>
          )}
        </Card>
      </TouchableWithoutFeedback>
    );
  };

  // keyExtractor robusto
  const keyExtractor = (it) => {
    const k =
      (it?.id != null ? String(it.id) : null) ||
      [it?.medidor, it?.lote, it?.nombre].filter(Boolean).join("|") ||
      Math.random().toString(36).slice(2);
    return k;
  };

  const onEndReached = () => {
    if (endReachedLock) return;
    setEndReachedLock(true);
    loadMore();
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={loading ? "Cargando..." : lugar.nombre} />
        <Appbar.Action
          icon={mostrarCompletados ? "bookmark-check" : "bookmark-check-outline"}
          onPress={toggleMostrarCompletados}
        />
      </Appbar.Header>

      <View style={{ padding: 16 }}>
        <Searchbar
          placeholder="Buscar cliente (nombre o lote)"
          value={search}
          onChangeText={setSearch}
          style={{ marginBottom: 12 }}
          autoCorrect={false}
          autoCapitalize="none"
        />

        {loading ? (
          <ActivityIndicator />
        ) : isAutoFilling ? (
          <View style={{ alignItems: "center", paddingVertical: 16 }}>
            <ActivityIndicator />
            <Text style={{ marginTop: 8, color: colors.text, opacity: 0.7 }}>
              Buscando clientes pendientes…
            </Text>
          </View>
        ) : visibleItems.length === 0 ? (
          <Text style={{ color: colors.text, textAlign: "center" }}>
            No hay clientes en este lugar.
          </Text>
        ) : (
          <FlatList
            data={visibleItems}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            onEndReached={onEndReached}
            onMomentumScrollBegin={() => setEndReachedLock(false)}
            onEndReachedThreshold={0.2}
            contentContainerStyle={{ paddingBottom: (insets?.bottom ?? 0) + FOOTER_SPACE, paddingTop: 4 }}
            ListFooterComponent={
              loadingMore ? (
                <ActivityIndicator style={{ marginVertical: 12 }} />
              ) : (
                <View style={{ height: 16 }} />
              )
            }
            removeClippedSubviews
            initialNumToRender={18}
            maxToRenderPerBatch={12}
            windowSize={7}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
}
