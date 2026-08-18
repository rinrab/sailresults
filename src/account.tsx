import { useNavigate } from "react-router-dom";
import { Content, Layout, NavBar } from "./common";
import React from "react";
import { Button, Field, Input, Menu, MenuDivider, MenuGroupHeader, MenuItem, MenuPopover, MenuTrigger, Text } from "@fluentui/react-components";
import { Person32Regular, PersonFilled, PersonRegular } from "@fluentui/react-icons";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, User } from "firebase/auth";
import { auth, signIn, signUp, signOut } from "./storage-firebase";

export function AccountSignIn() {
  const navigate = useNavigate();
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [inProgress, setInProgress] = React.useState(false);

  const submit = async (e) => {
    e.preventDefault();

    try {
      setInProgress(true);
      await signIn(username, password, setStatus);
      setTimeout(() => navigate("/"), 300);
    } catch (error) {
      setStatus(error.toString());
    } finally {
      setInProgress(false);
    }
  };

  return (
    <Layout>
      <NavBar title="Account" subtitle="Sign In" back="../.." />
      <Content>
        <form style={{ display: "flex", flexDirection: "column", gap: 8 }} onSubmit={submit}>
          <Field label="Email Address">
            <Input type="email" value={username} onChange={(e) => setUsername(e.target.value)} />
          </Field>

          <Field label="Password">
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>

          <Text>{status}</Text>

          <Button type="submit" disabled={inProgress}>Sign In</Button>
        </form>
      </Content>
    </Layout>
  );
}

export function AccountSignUp() {
  const navigate = useNavigate();
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [inProgress, setInProgress] = React.useState(false);

  const submit = async (e) => {
    e.preventDefault();

    try {
      setInProgress(true);
      await signUp(username, password, setStatus);
      setTimeout(() => navigate("/"), 300);
    } catch (error) {
      setStatus(error.toString());
    } finally {
      setInProgress(false);
    }
  };

  return (
    <Layout>
      <NavBar title="Account" subtitle="Sign Up" back="../.." />
      <Content>
        <form style={{ display: "flex", flexDirection: "column", gap: 8 }} onSubmit={submit}>
          <Field label="Email Address">
            <Input type="email" value={username} onChange={(e) => setUsername(e.target.value)} />
          </Field>

          <Field label="Password">
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>

          <Text>{status}</Text>

          <Button type="submit" disabled={inProgress}>Sign Up</Button>
        </form>
      </Content>
    </Layout>
  );
}

function UserDetails(props: { user: User, update: () => void }) {
  return <>
    <Field label="Username">
      <Input disabled value={props.user.email} />
    </Field>

    <div style={{ display: "flex", gap: 8 }}>
      <Button onClick={() => alert("not implemented")}>Change Password</Button>
      <Button onClick={() => signOut().then(() => props.update())}>Sign Out</Button>
      <Button onClick={() => props.user.delete().then(() => props.update())}>Delete User</Button>
    </div>
  </>;
}

function AnonymousOptions() {
  const navigate = useNavigate();

  return <>
    <div style={{ display: "flex", gap: 8 }}>
      <Button onClick={() => navigate("../signin")}>Sign In</Button>
      <Button onClick={() => navigate("../signup")}>Sign Up</Button>
    </div>
  </>;
}

export function AccountMe() {
  const [isReady, setIsReady] = React.useState(false);
  const [dummy, setDummy] = React.useState(1);

  auth.authStateReady().then(() => setIsReady(true));

  const update = () => {
    setDummy(dummy + 1);
  };

  return (
    <Layout>
      <NavBar title="Account" subtitle="Information" back="../.." />
      <Content>
        {isReady ? (auth.currentUser ? 
                      <UserDetails user={auth.currentUser} update={update} /> :
                      <AnonymousOptions /> ) 
                 : "Loading..."}
      </Content>
    </Layout>
  );
}

export function AccountMenu() {
  const navigate = useNavigate();
  const [isReady, setIsReady] = React.useState(false);
  const [isAuthorized, setIsAuthorized] = React.useState(false);
  const [username, setUsername] = React.useState("");

  React.useEffect(() => auth.onAuthStateChanged((user) => {
    setIsReady(true);
    setIsAuthorized(!!user);
    setUsername(user?.email);
  }));

  return <Menu>
    <MenuTrigger>
      <Button icon={<PersonFilled />} style={{ borderRadius: 99 }} size="large" />
    </MenuTrigger>
    <MenuPopover>
      {isReady ? (isAuthorized ? <>
          <MenuGroupHeader>{username}</MenuGroupHeader>
          <MenuDivider />
          <MenuItem onClick={() => navigate("/account/me")}>View Profile</MenuItem>
          <MenuItem onClick={() => signOut().then(() => navigate("/"))}>Sign Out</MenuItem>
        </> :
        <>
          <MenuItem onClick={() => navigate("/account/signin")}>Sign In</MenuItem>
          <MenuItem onClick={() => navigate("/account/signup")}>Sign Up</MenuItem>
        </>) : "Loading..."
      }
    </MenuPopover>
  </Menu>
}
