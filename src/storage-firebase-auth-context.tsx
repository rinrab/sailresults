import React from "react";
import { auth } from "./storage-firebase";
import { User } from "firebase/auth";

export const FirebaseAuthContext = React.createContext<User | null>(null);

export function FirebaseAuthProvider({children}) {
  const [user, setUser] = React.useState<User | null>();

  React.useEffect(() => {
    return auth.onAuthStateChanged((newUser) => {
      setUser(newUser);
    });
  });

  return <FirebaseAuthContext.Provider value={user}>
    {children}
  </FirebaseAuthContext.Provider>;
}
