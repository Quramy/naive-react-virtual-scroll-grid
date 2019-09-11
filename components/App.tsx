import React, { useState } from "react";
import { VGrid } from "./VGrid";
import AutoSizer from "react-virtualized-auto-sizer";

function range(n: number = 0) {
  const arr: number[] = [];
  for (let i = 0; i < n; ++i) {
    arr.push(i);
  }
  return arr;
}

const data = {
  failed: range(3).map(i => ({
    name: `failed_${i}`,
  })),
  newItems: range(20).map(i => ({
    name: `new_${i}`,
  })),
  passed: range(1000).map(i => ({
    name: `passed_${i}`,
  })),
};

const ListItem = ({ item }: { item: { name: string; }}) => {
  const [clicked, updateClicked] = useState(false);
  return (
    <div className="boxCell" onClick={() => updateClicked(true)}>
      <div>
        {item.name}
      </div>
      {clicked ? (
        <div>clicked</div>
      ): null}
    </div>
  );
};

const keyFn = (item: { name: string }) => item.name;

export const App = () => {
  return (
    <>
      <h1>Report detail</h1>

      <nav>
        {data.passed.slice(0, 100).map(item => (
          <a key={item.name} href={`#${item.name}`}>{item.name} </a>
        ))}
      </nav>

      <h2>Changed</h2>
      <VGrid
        rowGap={40}
        cellHeight={160}
        items={data.failed}
        keyFn={keyFn}
        renderItem={({ item }) => (
          <ListItem key={item.name} item={item} />
        )}
      />

      <h2>New</h2>
      <VGrid
        rowGap={40}
        cellHeight={160}
        items={data.newItems}
        keyFn={keyFn}
        renderItem={({ item }) => (
          <ListItem key={item.name} item={item} />
        )}
      />

      <h2>Passed</h2>
      <VGrid
        rowGap={40}
        cellHeight={160}
        items={data.passed}
        keyFn={keyFn}
        renderItem={({ item }) => (
          <ListItem key={item.name} item={item} />
        )}
      />
    </>
  )
};


