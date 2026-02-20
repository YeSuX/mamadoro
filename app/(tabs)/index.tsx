import { getDb } from "@/db";
import { usersTable } from "@/db/schema";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";

type User = typeof usersTable.$inferSelect;

export default function HomeScreen() {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    (async () => {
      const db = getDb();

      await db.insert(usersTable).values({
        name: "John",
        age: 30,
        email: `john+${Date.now()}@example.com`,
      });

      const result = await db.select().from(usersTable);
      setUsers(result);
    })();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      {users.map((user) => (
        <Text key={user.id}>
          {user.name} - {user.email}
        </Text>
      ))}
    </View>
  );
}
