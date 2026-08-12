import { Link } from "react-router-dom";
import { Content, Layout, NavBar } from "./common";
import React from "react";
import { Text } from "@fluentui/react-components";
import { dsqs } from "./scoring";
import { version_major, version_minor, revnum } from "./version";

export function FeaturesList() {
  return <ul>
    <li>Simple and convenient user experience.</li>
    <li>Optimised for mobile devices.</li>
    <li>Best for small in-club regattas.</li>
    <li>Free and Open-Source.</li>
    <li>No registration nor installation needed.</li>
    <li>All your data is stored locally.</li>
    <li>Scoring according to the "Appendix A of the RSS". <Link to="/docs/scoring">Learn More</Link></li>
    <li>Interactive finish board entry.</li>
  </ul>
}

export function DocsIndex() {
  return <Layout>
    <NavBar title="Documentation" />
    <Content>
      <div style={{ overflow: "auto", height: "100%" }}>
        <h1>Documentation</h1>
        <ul>
          <li>
            <Link to="about">About</Link>
          </li>
          <li>
            <Link to="quick-start">Quick Start</Link>
          </li>
          <li>
            <Link to="scoring">Scoring</Link>
          </li>
          <li>
            <Link to="add-to-home-screen">How to add to home screen</Link>
          </li>
        </ul>
      </div>
    </Content>
  </Layout>
}

export function DocsAbout() {
  return <Layout>
    <NavBar title="Documentation" subtitle="About" />
    <Content>
      <div style={{ overflow: "auto", height: "100%" }}>
        <h1>Documentation</h1>
        <h2>About this app</h2>
        <p><b>SailResults</b> is a scoring sailing program for organising and
        accounting of sailing regattas, training series, and more. It focues
        on simplicity and minimalistic user experience. This app is designed to
        be used by the coach in the conditions of a session providing all the
        tools you may need to keep track of your leaderboard.</p>
        <h3>Features</h3>
        <FeaturesList />

        <h3>Credits</h3>
        <ul>
          <li>Timofei Zhakov - I'm the author, hey guys!</li>
          <li>Rautu - The idea and early adoption.</li>
          <li>SailWave a great alternative that does a similar job. If you
          look for long enough, you'd find any exotic feature you want.
          It's also free btw.</li>
        </ul>
      </div>
    </Content>
  </Layout>
}

export function DocsHomeScreen() {
  return <Layout>
    <NavBar title="Documentation" subtitle="How to add to home screen" />
    <Content>
      <div style={{ overflow: "auto", height: "100%" }}>
        <h1>Documentation</h1>
        <h2>How to add to home screen</h2>
        <p>Although, we don't ship a version of this app for neither iPhone nor
        Android, you could still install it as a PWA (progressive web app) and
        have a similar experience as it was an app.</p>
        <h3>Steps for Safari</h3>
        <ol>
          <li>Click '...' to the right of the address bar.</li>
          <li>In the pop-up navigate to 'Share'.</li>
          <li>Scroll down and find 'Add to Home Screen'.</li>
          <li>The icon should appear on the home screen.</li>
        </ol>
        <p>Please note that the version you have in your browser and installed
        on your device have separate storage. Meaning you should remember where
        the series was saved since you can't work on it from both instances at
        the same time.</p>
        <p>You could even have two installation side by side. In this case each
        of them will have their separate storage. Although it is possible, we
        do not recommend you do that.</p>
        <p>Also please keep in mind that if you delete the app, all your data
        will be lost forever.</p>
      </div>
    </Content>
  </Layout>
}

export function DocsQuickStart() {
  return <Layout>
    <NavBar title="Documentation" subtitle="Quick Start" />
    <Content>
      <div style={{ overflow: "auto", height: "100%" }}>
        <h1>Documentation</h1>
        <h2>Quick Start</h2>
      </div>
    </Content>
  </Layout>
}

export function DocsScoring() {
  return <Layout>
    <NavBar title="Documentation" subtitle="Scoring" />
    <Content>
      <div style={{ overflow: "auto", height: "100%" }}>
        <h1>Documentation</h1>

        <h2>Scoring in sailing races</h2>
        <p>This section will cover how results of sailing regattas are
        calculated. The application implements it according to the "Appendix
        A of the Racing Rules of Sailing". Here, I'll go though the rules and my
        interpretation of them.</p>

        <h3>Series and Races</h3>
        <p>A series consists of a number of races and competitors. In each
        race, the competitors rank first, second, etc. accoring to their
        <i>Finishing place</i>.</p>
        <p>This is usually entered via a <i>Finish board</i>. This is an
        abstraction this app uses. In the meanwhile, it reproduces a good
        practice utilised by the majority of race comeeties - a guy on the
        finish line writes down the sail numbers of the boats crossing
        it. It makes it easy to understand and recover the data from it.</p>
        <p>That's why for better visualisation this app uses <i>Finish
        board</i>'s - and only those to interact with the data.</p>

        <h3>Scoring System</h3>
        <p>Most sailing races operate by the "Low Point System". Meaning that
        their <i>Finishing place</i> is directly converted to <i>Points</i>.
        Then, eact competitor's points are added to get their <i>Total
        Points</i>.</p>

        <h3>Disqualification</h3>
        <p>If a boat didn't finish or disqualified by any other reason - it
        must reflect on the results accordingly.</p>
        <p>Usually, a disqualified boat gets $COMPETITORS_COUNT + 1 points,
        where $COMPETITORS_COUNT represents the amount of boats participating
        in the race. Including the one's that didn't come. The idea is that
        even the worst completed race is slightly better than no finish at
        all. Don't skip your races, even if you think you've got bad
        odds!</p>
        <p>Below, is a complete list of all possible reasons to punish a
        sailor that are currently implemented, plus their according
        abriviations.</p>

        <ul>
          {Object.entries(dsqs).map(([name, {description}]) =>
            <li key={name}><Text weight="bold" font="monospace">{name}</Text>: {description}</li>)}
        </ul>
      </div>
    </Content>
  </Layout>
}
