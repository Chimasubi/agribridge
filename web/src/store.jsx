import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { api } from "./api.js";

const Ctx = createContext(null);

export function useSession() {
  return useContext(Ctx);
}

export function SessionProvider({ children }) {
  const [me, setMe] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [s, u] = await Promise.all([api.get("/me"), api.get("/users")]);
    setMe(s.session);
    setUsers(u.users);
  }, []);

  useEffect(() => {
    refresh()
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [refresh]);

  const persona = useMemo(() => users.find((u) => u.id === me?.id) || me, [users, me]);

  const switchTo = useCallback(async (id) => {
    const res = await api.post("/session", { userId: Number(id) });
    setMe(res.session);
  }, []);

  const byRole = useMemo(
    () =>
      users.reduce((acc, u) => {
        (acc[u.role] = acc[u.role] || []).push(u);
        return acc;
      }, {}),
    [users]
  );

  return (
    <Ctx.Provider value={{ me, persona, users, loading, refresh, switchTo, byRole }}>
      {children}
    </Ctx.Provider>
  );
}