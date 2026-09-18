import React, { useState, useEffect } from "react";
import {
  Text,
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Pressable,
  FlatList,
  Modal,
  SafeAreaView,
  Alert,
  ListRenderItem,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

// 1. TypeScript Interfaces
export interface Item {
  id: number;
  name: string;
  location: string;
  category: string;
  quantity: number;
}

export type ItemCreatePayload = Omit<Item, "id">;

// Replace with your backend machine's LAN IP address
const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://10.0.2.2:8000/items";

export default function Index(): React.JSX.Element {
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // Inventory State
  const [items, setItems] = useState<Item[]>([]);
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  // Form State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async (): Promise<void> => {
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error("Network response was not ok");
      const data: Item[] = await res.json();
      setItems(data);
    } catch (err) {
      Alert.alert("Error", "Could not fetch inventory items.");
    }
  };

  const openForm = (item: Item | null = null): void => {
    if (item) {
      setEditingId(item.id);
      setName(item.name);
      setLocation(item.location);
      setCategory(item.category);
      setQuantity(item.quantity);
    } else {
      setEditingId(null);
      setName("");
      setLocation("");
      setCategory("");
      setQuantity(1);
    }
    setModalVisible(true);
  };

  const handleSave = async (): Promise<void> => {
    if (!name.trim() || !location.trim() || !category.trim()) {
      Alert.alert("Error", "Please fill in all details.");
      return;
    }

    const payload: ItemCreatePayload = { name, location, category, quantity };
    const method = editingId !== null ? "PUT" : "POST";
    const url = editingId !== null ? `${API_URL}/${editingId}` : API_URL;

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save item");

      setModalVisible(false);
      fetchItems();
    } catch (err) {
      Alert.alert("Error", "Failed to save item.");
    }
  };

  const updateQuantity = async (item: Item, delta: number): Promise<void> => {
    const newQty = Math.max(0, item.quantity + delta);
    const updatedPayload: Item = { ...item, quantity: newQty };

    try {
      const res = await fetch(`${API_URL}/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedPayload),
      });

      if (!res.ok) throw new Error("Failed to update quantity");

      fetchItems();
    } catch (err) {
      Alert.alert("Error", "Failed to update quantity.");
    }
  };

  const handleDelete = async (id: number): Promise<void> => {
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete item");
      fetchItems();
    } catch (err) {
      Alert.alert("Error", "Failed to delete item.");
    }
  };

  // Dynamic Theme Styles
  const themeContainerStyle = isDarkMode ? styles.darkContainer : styles.lightContainer;
  const themeTextStyle = isDarkMode ? styles.darkText : styles.lightText;
  const themeButtonStyle = isDarkMode ? styles.darkButton : styles.lightButton;
  const themeCardStyle = isDarkMode ? styles.darkCard : styles.lightCard;
  const themeInputStyle = isDarkMode ? styles.darkInput : styles.lightInput;
  const themeModalStyle = isDarkMode ? styles.darkModal : styles.lightModal;

  const renderItem: ListRenderItem<Item> = ({ item }) => (
    <View style={[styles.card, themeCardStyle]}>
      <TouchableOpacity style={styles.cardInfo} onPress={() => openForm(item)}>
        <Text style={[styles.itemName, themeTextStyle]}>{item.name}</Text>
        <Text style={styles.itemMeta}>
          {item.category} • {item.location}
        </Text>
      </TouchableOpacity>

      <View style={styles.quantityContainer}>
        <TouchableOpacity onPress={() => updateQuantity(item, -1)}>
          <Ionicons name="remove-circle-outline" size={28} color="#e74c3c" />
        </TouchableOpacity>
        <Text style={[styles.quantityText, themeTextStyle]}>{item.quantity}</Text>
        <TouchableOpacity onPress={() => updateQuantity(item, 1)}>
          <Ionicons name="add-circle-outline" size={28} color="#2ecc71" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
        <Ionicons name="trash-outline" size={22} color="#999" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, themeContainerStyle]}>
      {/* Header Bar */}
      <View style={[styles.header, isDarkMode && styles.darkHeader]}>
        <Text style={[styles.title, themeTextStyle]}>Home Inventory</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => openForm()}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addBtnText}>Add Entry</Text>
        </TouchableOpacity>
      </View>

      {/* Inventory List */}
      <FlatList
        data={items}
        keyExtractor={(item: Item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
      />

      {/* Entry Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, themeModalStyle]}>
            <Text style={[styles.modalTitle, themeTextStyle]}>
              {editingId !== null ? "Edit Item" : "New Item"}
            </Text>

            <TextInput
              style={[styles.input, themeInputStyle]}
              placeholder="Item Name (e.g. Toothpaste)"
              placeholderTextColor={isDarkMode ? "#888" : "#999"}
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={[styles.input, themeInputStyle]}
              placeholder="Category (e.g. Toiletry, Food)"
              placeholderTextColor={isDarkMode ? "#888" : "#999"}
              value={category}
              onChangeText={setCategory}
            />
            <TextInput
              style={[styles.input, themeInputStyle]}
              placeholder="Location (e.g. Pantry, Bathroom)"
              placeholderTextColor={isDarkMode ? "#888" : "#999"}
              value={location}
              onChangeText={setLocation}
            />

            <View style={styles.formQtyRow}>
              <Text style={[styles.label, themeTextStyle]}>Initial Quantity:</Text>
              <View style={styles.quantityContainer}>
                <TouchableOpacity onPress={() => setQuantity(Math.max(0, quantity - 1))}>
                  <Ionicons name="remove-circle-outline" size={28} color="#e74c3c" />
                </TouchableOpacity>
                <Text style={[styles.quantityText, themeTextStyle]}>{quantity}</Text>
                <TouchableOpacity onPress={() => setQuantity(quantity + 1)}>
                  <Ionicons name="add-circle-outline" size={28} color="#2ecc71" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.btnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={[styles.btnText, { color: "#fff" }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Floating Theme Toggle Button */}
      <Pressable
        style={[styles.button, styles.bottomCornerButton, themeButtonStyle]}
        onPress={() => setIsDarkMode((prev) => !prev)}
      >
        <Text style={themeTextStyle}>{isDarkMode ? "☀️" : "🌙"}</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    elevation: 2,
  },
  darkHeader: {
    backgroundColor: "#1E1E1E",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  addBtn: {
    flexDirection: "row",
    backgroundColor: "#007AFF",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  addBtnText: {
    color: "#fff",
    fontWeight: "600",
    marginLeft: 4,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100, // Space so content isn't blocked by floating button
  },
  card: {
    padding: 16,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    elevation: 1,
  },
  lightCard: {
    backgroundColor: "#fff",
  },
  darkCard: {
    backgroundColor: "#1E1E1E",
  },
  cardInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  itemMeta: {
    color: "#888",
    marginTop: 4,
    fontSize: 12,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 8,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: "bold",
    marginHorizontal: 8,
    minWidth: 20,
    textAlign: "center",
  },
  deleteBtn: {
    padding: 4,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    borderRadius: 12,
    padding: 20,
  },
  lightModal: {
    backgroundColor: "#fff",
  },
  darkModal: {
    backgroundColor: "#1E1E1E",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  lightInput: {
    borderColor: "#ccc",
    color: "#000",
    backgroundColor: "#FAFAFA",
  },
  darkInput: {
    borderColor: "#444",
    color: "#fff",
    backgroundColor: "#2A2A2A",
  },
  formQtyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  cancelBtn: {
    padding: 10,
    marginRight: 10,
  },
  saveBtn: {
    backgroundColor: "#007AFF",
    padding: 10,
    borderRadius: 8,
  },
  btnText: {
    fontWeight: "bold",
    color: "#888",
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1,
    elevation: 5,
  },
  bottomCornerButton: {
    position: "absolute",
    bottom: 30,
    right: 20,
  },
  lightContainer: {
    backgroundColor: "#f4f6f8",
  },
  lightText: {
    color: "#000000",
  },
  lightButton: {
    backgroundColor: "#FFFFFF",
    borderColor: "#CCCCCC",
  },
  darkContainer: {
    backgroundColor: "#121212",
  },
  darkText: {
    color: "#FFFFFF",
  },
  darkButton: {
    backgroundColor: "#2A2A2A",
    borderColor: "#444444",
  },
});