import React, { Component } from "react";
import "./Tabs.css";

const Tab = ({ active, name, onClick }) =>
  (active
    ? <div className="Tab active">{name}</div>
    : <a className="Tab" href="#!" onClick={onClick}>
        {name}
      </a>);

export default ({ tabs, current, onTab, onNewTab }) => (
  <div className="Tabs">
    {tabs.map((tab, i) => (
      <Tab
        key={i}
        name={tab.name}
        active={i === current}
        onClick={e => onTab(i)}
      />
    ))}
    <a className="newTab" href="#!" onClick={e => onNewTab()}>+Add editor</a>
  </div>
);
