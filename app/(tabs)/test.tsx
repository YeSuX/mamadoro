import { getDb } from "@/db";
import * as schema from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const genId = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2);

type FieldDef = {
  key: string;
  type: "text" | "number" | "boolean";
};

type TableDef = {
  label: string;
  table: any;
  pk: string | [string, string];
  fields: FieldDef[];
  genTestData: (ctx: {
    userId?: string;
    taskId?: string;
    tagId?: string;
  }) => Record<string, unknown>;
  requires?: string[];
};

const TABLES: Record<string, TableDef> = {
  users: {
    label: "Users",
    table: schema.users,
    pk: "id",
    fields: [
      { key: "nickname", type: "text" },
      { key: "avatar", type: "text" },
    ],
    genTestData: () => ({
      id: genId(),
      nickname: `User_${Date.now() % 10000}`,
    }),
  },
  tasks: {
    label: "Tasks",
    table: schema.tasks,
    pk: "id",
    fields: [
      { key: "userId", type: "text" },
      { key: "title", type: "text" },
      { key: "status", type: "text" },
      { key: "estimatedPomodoros", type: "number" },
      { key: "completedPomodoros", type: "number" },
      { key: "sortOrder", type: "number" },
    ],
    requires: ["userId"],
    genTestData: ({ userId }) => ({
      id: genId(),
      userId,
      title: `Task_${Date.now() % 10000}`,
      status: "TODO",
      estimatedPomodoros: Math.floor(Math.random() * 5) + 1,
    }),
  },
  pomodoros: {
    label: "Pomodoros",
    table: schema.pomodoros,
    pk: "id",
    fields: [
      { key: "userId", type: "text" },
      { key: "taskId", type: "text" },
      { key: "status", type: "text" },
      { key: "plannedDuration", type: "number" },
      { key: "duration", type: "number" },
      { key: "startedAt", type: "text" },
      { key: "endedAt", type: "text" },
    ],
    requires: ["userId"],
    genTestData: ({ userId, taskId }) => ({
      id: genId(),
      userId,
      taskId: taskId ?? null,
      status: "COMPLETED",
      plannedDuration: 1500,
      duration: 1500,
      startedAt: new Date().toISOString(),
      endedAt: new Date().toISOString(),
    }),
  },
  tags: {
    label: "Tags",
    table: schema.tags,
    pk: "id",
    fields: [
      { key: "userId", type: "text" },
      { key: "name", type: "text" },
      { key: "color", type: "text" },
    ],
    requires: ["userId"],
    genTestData: ({ userId }) => ({
      id: genId(),
      userId,
      name: `Tag_${Date.now() % 10000}`,
      color: `#${Math.floor(Math.random() * 0xffffff)
        .toString(16)
        .padStart(6, "0")}`,
    }),
  },
  taskTags: {
    label: "TaskTags",
    table: schema.taskTags,
    pk: ["taskId", "tagId"],
    fields: [
      { key: "taskId", type: "text" },
      { key: "tagId", type: "text" },
    ],
    requires: ["taskId", "tagId"],
    genTestData: ({ taskId, tagId }) => ({ taskId, tagId }),
  },
  settings: {
    label: "Settings",
    table: schema.settings,
    pk: "id",
    fields: [
      { key: "userId", type: "text" },
      { key: "workDuration", type: "number" },
      { key: "shortBreakDuration", type: "number" },
      { key: "longBreakDuration", type: "number" },
      { key: "roundsBeforeLongBreak", type: "number" },
      { key: "alarmSound", type: "text" },
      { key: "vibrationEnabled", type: "boolean" },
      { key: "dndEnabled", type: "boolean" },
      { key: "autoStartBreak", type: "boolean" },
      { key: "autoStartWork", type: "boolean" },
      { key: "momMode", type: "text" },
    ],
    requires: ["userId"],
    genTestData: ({ userId }) => ({ id: genId(), userId }),
  },
};

const TABLE_KEYS = Object.keys(TABLES);

async function fetchContext() {
  const db = getDb();
  const [allUsers, allTasks, allTags] = await Promise.all([
    db.select().from(schema.users),
    db.select().from(schema.tasks),
    db.select().from(schema.tags),
  ]);
  return {
    userId: allUsers[0]?.id,
    taskId: allTasks[0]?.id,
    tagId: allTags[0]?.id,
  };
}

function parseFieldValue(value: string, type: FieldDef["type"]) {
  if (!value) return null;
  if (type === "number") return Number(value);
  if (type === "boolean") return value === "true" || value === "1";
  return value;
}

function buildWhereClause(tableDef: TableDef, record: Record<string, unknown>) {
  if (Array.isArray(tableDef.pk)) {
    const [pk1, pk2] = tableDef.pk;
    return and(
      eq(tableDef.table[pk1], record[pk1]),
      eq(tableDef.table[pk2], record[pk2]),
    );
  }
  return eq(tableDef.table[tableDef.pk], record[tableDef.pk]);
}

export default function TestScreen() {
  const [activeTable, setActiveTable] = useState(TABLE_KEYS[0]);
  const [records, setRecords] = useState<Record<string, unknown>[]>([]);
  const [editingPk, setEditingPk] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Record<string, string>>({});

  const tableDef = TABLES[activeTable];

  const loadRecords = useCallback(async () => {
    const db = getDb();
    const result = await db.select().from(TABLES[activeTable].table);
    setRecords(result);
    setEditingPk(null);
  }, [activeTable]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const getPkValue = (record: Record<string, unknown>) =>
    Array.isArray(tableDef.pk)
      ? `${record[tableDef.pk[0]]}|${record[tableDef.pk[1]]}`
      : String(record[tableDef.pk]);

  const handleAdd = async () => {
    try {
      const ctx = await fetchContext();
      const missing = tableDef.requires?.filter(
        (k) => !ctx[k as keyof typeof ctx],
      );
      if (missing?.length) {
        Alert.alert("前置数据缺失", `请先创建: ${missing.join(", ")}`);
        return;
      }
      const data = tableDef.genTestData(ctx);
      const db = getDb();
      await db.insert(tableDef.table).values(data);
      await loadRecords();
    } catch (e: unknown) {
      Alert.alert("Insert Error", (e as Error).message);
    }
  };

  const handleDelete = async (record: Record<string, unknown>) => {
    try {
      const db = getDb();
      await db.delete(tableDef.table).where(buildWhereClause(tableDef, record));
      await loadRecords();
    } catch (e: unknown) {
      Alert.alert("Delete Error", (e as Error).message);
    }
  };

  const startEdit = (record: Record<string, unknown>) => {
    setEditingPk(getPkValue(record));
    const form: Record<string, string> = {};
    for (const f of tableDef.fields) {
      form[f.key] = record[f.key]?.toString() ?? "";
    }
    setEditForm(form);
  };

  const handleUpdate = async (record: Record<string, unknown>) => {
    try {
      const updates: Record<string, unknown> = {};
      for (const f of tableDef.fields) {
        updates[f.key] = parseFieldValue(editForm[f.key], f.type);
      }
      const db = getDb();
      await db
        .update(tableDef.table)
        .set(updates)
        .where(buildWhereClause(tableDef, record));
      await loadRecords();
    } catch (e: unknown) {
      Alert.alert("Update Error", (e as Error).message);
    }
  };

  return (
    <SafeAreaView style={s.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.tabBar}
        contentContainerStyle={s.tabBarContent}
      >
        {TABLE_KEYS.map((key) => (
          <Pressable
            key={key}
            style={[s.tab, activeTable === key && s.tabActive]}
            onPress={() => setActiveTable(key)}
          >
            <Text
              style={[s.tabText, activeTable === key && s.tabTextActive]}
            >
              {TABLES[key].label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={s.actions}>
        <Pressable style={s.btnAdd} onPress={handleAdd}>
          <Text style={s.btnText}>+ Add</Text>
        </Pressable>
        <Pressable style={s.btnRefresh} onPress={loadRecords}>
          <Text style={s.btnText}>↻ Refresh</Text>
        </Pressable>
        <Text style={s.count}>{records.length} records</Text>
      </View>

      <FlatList
        data={records}
        keyExtractor={(item, i) => getPkValue(item) ?? String(i)}
        renderItem={({ item }) => {
          const pkVal = getPkValue(item);
          const isEditing = editingPk === pkVal;
          return (
            <View style={s.record}>
              <View style={s.recordHeader}>
                <Text style={s.recordPk} numberOfLines={1}>
                  {Array.isArray(tableDef.pk)
                    ? tableDef.pk.map((k) => `${k}:${item[k]}`).join(" | ")
                    : `id:${item[tableDef.pk]}`}
                </Text>
                <View style={s.recordActions}>
                  <Pressable
                    style={s.btnEdit}
                    onPress={() =>
                      isEditing ? setEditingPk(null) : startEdit(item)
                    }
                  >
                    <Text style={s.btnSmall}>
                      {isEditing ? "Cancel" : "Edit"}
                    </Text>
                  </Pressable>
                  <Pressable
                    style={s.btnDel}
                    onPress={() => handleDelete(item)}
                  >
                    <Text style={s.btnSmall}>Del</Text>
                  </Pressable>
                </View>
              </View>

              {isEditing ? (
                <View style={s.editForm}>
                  {tableDef.fields.map((f) => (
                    <View key={f.key} style={s.fieldRow}>
                      <Text style={s.fieldLabel}>{f.key}</Text>
                      <TextInput
                        style={s.fieldInput}
                        value={editForm[f.key]}
                        onChangeText={(v) =>
                          setEditForm((prev) => ({ ...prev, [f.key]: v }))
                        }
                        placeholder={f.type}
                        placeholderTextColor="#aaa"
                      />
                    </View>
                  ))}
                  <Pressable
                    style={s.btnSave}
                    onPress={() => handleUpdate(item)}
                  >
                    <Text style={s.btnText}>Save</Text>
                  </Pressable>
                </View>
              ) : (
                <Text style={s.recordBody} numberOfLines={4}>
                  {JSON.stringify(item, null, 2)}
                </Text>
              )}
            </View>
          );
        }}
        ListEmptyComponent={
          <Text style={s.empty}>No records</Text>
        }
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  tabBar: {
    maxHeight: 48,
    backgroundColor: "#fff",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ddd",
  },
  tabBarContent: { alignItems: "center", paddingHorizontal: 8, gap: 4 },
  tab: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 },
  tabActive: { backgroundColor: "#007AFF" },
  tabText: { fontSize: 13, color: "#666", fontWeight: "600" },
  tabTextActive: { color: "#fff" },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    gap: 8,
  },
  btnAdd: {
    backgroundColor: "#34C759",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  btnRefresh: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  btnText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  count: { marginLeft: "auto", color: "#999", fontSize: 13 },
  record: {
    backgroundColor: "#fff",
    marginHorizontal: 10,
    marginBottom: 8,
    borderRadius: 8,
    padding: 10,
  },
  recordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  recordPk: {
    fontSize: 11,
    color: "#007AFF",
    fontWeight: "600",
    flex: 1,
    marginRight: 8,
  },
  recordActions: { flexDirection: "row", gap: 6 },
  btnEdit: {
    backgroundColor: "#FF9500",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  btnDel: {
    backgroundColor: "#FF3B30",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  btnSmall: { color: "#fff", fontSize: 12, fontWeight: "600" },
  recordBody: { fontSize: 11, color: "#666" },
  editForm: { gap: 6 },
  fieldRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  fieldLabel: { width: 120, fontSize: 12, color: "#333", fontWeight: "500" },
  fieldInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 12,
  },
  btnSave: {
    backgroundColor: "#34C759",
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 4,
  },
  empty: { textAlign: "center", color: "#999", marginTop: 40, fontSize: 14 },
});
